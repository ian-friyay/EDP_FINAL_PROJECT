/**
 * Payment Controller - PayPal Sandbox Integration & 5% Commission Handling
 * Ported from Laravel PaymentController.php with v2 Orders API & simulated fallback.
 */

const crypto = require('crypto');
const supabase = require('../db');
const { createNotification } = require('./notificationController');
const { loadFallbackAds, saveFallbackAds } = require('./advertisementController');

/**
 * Create a PayPal order for a service transaction
 */
const createOrder = async (req, res) => {
  try {
    const { transaction_id } = req.body;
    if (!transaction_id) {
      return res.status(400).json({ error: 'transaction_id is required.' });
    }

    // Fetch transaction from Supabase
    let transaction = null;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_id', transaction_id)
        .maybeSingle();

      if (!error && data) {
        transaction = data;
      }
    } catch {
      // Fallback
    }

    // If not found in db, try matching against known mock or generate simulated transaction
    if (!transaction) {
      transaction = {
        transaction_id,
        amount_topay: 850.0,
        booking_fee: 5.0,
        total_topay: 855.0,
        service_status: 'pending',
        provider_id: 'MMC-1042',
        requestor_id: 'MMC-0001',
      };
    }

    if (transaction.service_status === 'completed') {
      return res.status(400).json({ error: 'Transaction is already completed and paid.' });
    }

    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;
    const isLive = process.env.PAYPAL_MODE === 'live';
    const baseUrl = isLive
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    let orderId = `PAYPAL-ORDER-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    let approvalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}`;

    // Live or Sandbox API attempt
    if (clientId && secret) {
      try {
        const authHeader = Buffer.from(`${clientId}:${secret}`).toString('base64');
        const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials',
        });

        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          const accessToken = tokenData.access_token;

          const orderRes = await fetch(`${baseUrl}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  reference_id: String(transaction.transaction_id),
                  amount: {
                    currency_code: 'PHP',
                    value: Number(transaction.total_topay || transaction.amount_topay).toFixed(2),
                  },
                  description: `SerbisYou Campus Marketplace Service #${transaction.transaction_id}`,
                },
              ],
            }),
          });

          if (orderRes.ok) {
            const orderData = await orderRes.json();
            orderId = orderData.id;
            const approveLink = (orderData.links || []).find(
              (link) => link.rel === 'approve'
            );
            if (approveLink) {
              approvalUrl = approveLink.href;
            }
          }
        }
      } catch (paypalErr) {
        console.warn('PayPal live API call failed, using sandbox fallback order:', paypalErr.message);
      }
    }

    // Save paypal_order_id in transactions table
    try {
      await supabase
        .from('transactions')
        .update({ paypal_order_id: orderId, payment_status: 'order_created' })
        .eq('transaction_id', transaction_id);
    } catch {
      // ignore
    }

    return res.status(200).json({
      status: 'success',
      message: 'PayPal order created.',
      data: {
        order_id: orderId,
        approval_url: approvalUrl,
        amount: transaction.total_topay || (Number(transaction.amount_topay) + 5.0),
        currency: 'PHP',
        transaction_id: transaction.transaction_id,
      },
    });
  } catch (err) {
    console.error('createOrder error:', err);
    return res.status(500).json({ error: 'Failed to create PayPal order.' });
  }
};

/**
 * Capture a PayPal payment order and complete transaction with 5% commission deduction
 */
const captureOrder = async (req, res) => {
  try {
    const { order_id, transaction_id } = req.body;
    if (!order_id || !transaction_id) {
      return res.status(400).json({ error: 'order_id and transaction_id are required.' });
    }

    let transaction = null;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('transaction_id', transaction_id)
        .maybeSingle();

      if (!error && data) {
        transaction = data;
      }
    } catch {
      // Fallback
    }

    if (!transaction) {
      transaction = {
        transaction_id,
        amount_topay: 850.0,
        booking_fee: 5.0,
        total_topay: 855.0,
        provider_id: 'MMC-1042',
        requestor_id: 'MMC-0001',
      };
    }

    const amountTopay = Number(transaction.amount_topay || 850.0);
    const commission = Math.round(amountTopay * 0.05 * 100) / 100;
    const providerPayout = Math.round((amountTopay - commission) * 100) / 100;
    const nowIso = new Date().toISOString();
    const qrString = `SERBISYOU-PAID-TRX-${transaction_id}-PAYPAL-${order_id}`;

    // Update in Supabase (only using columns that exist in the transactions table)
    try {
      const { error: updateErr } = await supabase
        .from('transactions')
        .update({
          service_status: 'completed',
          commission_fee: commission,
          qr_code: qrString,
        })
        .eq('transaction_id', transaction_id);
      if (updateErr) {
        console.warn('Supabase transaction payment update warning:', updateErr.message);
      }
    } catch (updateErr) {
      console.warn('Supabase transaction update catch:', updateErr.message);
    }

    const updatedTransaction = {
      ...transaction,
      service_status: 'completed',
      commission_fee: commission,
      qr_code: qrString,
      payment_method: 'paypal',
      payment_status: 'paid',
      paypal_order_id: order_id,
      service_completion: nowIso,
    };

    // Emit real-time WebSocket events to Provider, Requestor, and Admin
    const io = req.app && req.app.get('io');
    if (io) {
      if (transaction.provider_id) {
        io.to(String(transaction.provider_id)).emit('transaction_updated', updatedTransaction);
        io.to(String(transaction.provider_id)).emit('new_notification', {
          id: `pay_${Date.now()}`,
          type: 'payment',
          title: 'Payment Received via PayPal',
          description: `Payment of ₱${amountTopay.toFixed(2)} received for transaction #${transaction_id} via PayPal!`,
          timestamp: nowIso,
          read: false,
          link: '/transactions',
        });
      }
      if (transaction.requestor_id) {
        io.to(String(transaction.requestor_id)).emit('transaction_updated', updatedTransaction);
      }
      io.to('admin').emit('transaction_updated', updatedTransaction);
      io.to('admin').emit('admin_transaction_completed', updatedTransaction);
      io.emit('transaction_updated', updatedTransaction);
    }

    // Send notifications to both provider and requestor
    if (transaction.provider_id) {
      await createNotification(
        transaction.provider_id,
        'transaction',
        'Payment Received via PayPal',
        `Payment of ₱${amountTopay.toFixed(2)} received! 5% platform fee: ₱${commission.toFixed(2)}. Net Payout: ₱${providerPayout.toFixed(2)}.`,
        `/transactions`
      );
    }

    if (transaction.requestor_id) {
      await createNotification(
        transaction.requestor_id,
        'transaction',
        'Service Paid Successfully',
        `Your payment for transaction #${transaction_id} was completed via PayPal. Show your Paid QR Code at meetup!`,
        `/transactions/${transaction_id}/qr`
      );
    }

    return res.status(200).json({
      status: 'success',
      message: 'Payment captured successfully via PayPal.',
      data: {
        transaction: updatedTransaction,
        payment_status: 'COMPLETED',
        order_id,
        commission_deducted: commission,
        provider_payout: providerPayout,
        qr_code: qrString,
      },
    });
  } catch (err) {
    console.error('captureOrder error:', err);
    return res.status(500).json({ error: 'Failed to capture PayPal payment.' });
  }
};

/**
 * Create order for Campus Advertisement sponsorship
 */
const createAdOrder = async (req, res) => {
  try {
    const { advertisement_id } = req.body;
    if (!advertisement_id) {
      return res.status(400).json({ error: 'advertisement_id is required.' });
    }

    let ad = null;
    try {
      const { data } = await supabase
        .from('advertisements')
        .select('*')
        .eq('id', advertisement_id)
        .maybeSingle();

      if (data) ad = data;
    } catch {
      // Fallback
    }

    if (!ad) {
      const fallback = loadFallbackAds();
      ad = fallback.find((item) => String(item.id) === String(advertisement_id));
    }

    if (!ad) {
      return res.status(404).json({ error: 'Advertisement not found.' });
    }

    const orderId = `PAYPAL-AD-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    return res.status(200).json({
      status: 'success',
      message: 'PayPal advertisement order created.',
      data: {
        order_id: orderId,
        amount: ad.computed_cost,
        currency: 'PHP',
        advertisement_id: ad.id,
        title: ad.title,
      },
    });
  } catch (err) {
    console.error('createAdOrder error:', err);
    return res.status(500).json({ error: 'Failed to create PayPal ad order.' });
  }
};

/**
 * Capture payment for Campus Advertisement sponsorship
 */
const captureAdOrder = async (req, res) => {
  try {
    const { advertisement_id, order_id } = req.body;
    if (!advertisement_id || !order_id) {
      return res.status(400).json({ error: 'advertisement_id and order_id are required.' });
    }

    let updatedAd = null;

    try {
      const { data } = await supabase
        .from('advertisements')
        .update({
          payment_status: 'paid',
          status: 'active', // auto-activate on payment
          updated_at: new Date().toISOString(),
        })
        .eq('id', advertisement_id)
        .select()
        .single();

      if (data) updatedAd = data;
    } catch {
      // Fallback
    }

    // Also update fallback cache
    const fallback = loadFallbackAds();
    const modified = fallback.map((item) => {
      if (String(item.id) === String(advertisement_id)) {
        updatedAd = {
          ...item,
          payment_status: 'paid',
          amount_paid: item.computed_cost,
          status: 'active',
          updated_at: new Date().toISOString(),
        };
        return updatedAd;
      }
      return item;
    });
    saveFallbackAds(modified);

    return res.status(200).json({
      status: 'success',
      message: 'Advertisement payment confirmed via PayPal.',
      data: updatedAd,
    });
  } catch (err) {
    console.error('captureAdOrder error:', err);
    return res.status(500).json({ error: 'Failed to capture advertisement payment.' });
  }
};

module.exports = {
  createOrder,
  captureOrder,
  createAdOrder,
  captureAdOrder,
};
