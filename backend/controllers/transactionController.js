const crypto = require('crypto');
const supabase = require('../db');
const { createNotification } = require('./notificationController');

const BOOKING_FEE = 5;
const COMMISSION_RATE = 0.05;

const createTransaction = async (req, res) => {
  try {
    const requestor_id = req.user && req.user.user_id;
    const { service_id } = req.body;

    if (!requestor_id) {
      return res.status(401).json({ error: 'Unauthorized. Please log in again.' });
    }

    if (!service_id) {
      return res.status(400).json({ error: 'service_id is required.' });
    }

    const normalizedServiceId = isNaN(Number(service_id)) ? service_id : Number(service_id);

    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('service_id, user_id, amount_topay, service_status, is_deleted')
      .eq('service_id', normalizedServiceId)
      .single();

    if (serviceError) {
      if (serviceError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Service not found.' });
      }

      return res.status(500).json({
        error: 'Failed to retrieve service.',
        details: serviceError.message,
      });
    }

    if (!service || service.is_deleted) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    if (service.service_status !== 'active') {
      return res.status(400).json({
        error: 'This service is not available for booking.',
      });
    }

    if (service.user_id === requestor_id) {
      return res.status(400).json({
        error: 'You cannot book your own service.',
      });
    }

    const provider_id = service.user_id;
    const amount_topay = Number(service.amount_topay);

    if (!Number.isFinite(amount_topay) || amount_topay <= 0) {
      return res.status(400).json({ error: 'Invalid service amount.' });
    }

    const booking_fee = BOOKING_FEE;
    const commission_fee = Number(
      (amount_topay * COMMISSION_RATE).toFixed(2)
    );
    const total_topay = Number((amount_topay + booking_fee).toFixed(2));
    const qr_code = `SERBISYOU-${crypto.randomUUID()}`;

    const { data: transaction, error: insertError } = await supabase
      .from('transactions')
      .insert([
        {
          provider_id,
          requestor_id,
          service_id: normalizedServiceId,
          amount_topay,
          booking_fee,
          total_topay,
          commission_fee,
          service_status: 'pending',
          qr_code,
        },
      ])
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({
        error: 'Failed to create transaction.',
        details: insertError.message,
      });
    }

    return res.status(201).json({
      message: 'Transaction created successfully.',
      transaction,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error.',
      details: error.message,
    });
  }
};

const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized. Please log in again.' });
    }

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`provider_id.eq.${userId},requestor_id.eq.${userId}`)
      .order('transaction_id', { ascending: false });

    if (error) {
      console.error('Failed to fetch transactions:', error);
      return res.status(500).json({ error: 'Failed to fetch transactions.' });
    }

    const serviceIds = [...new Set((transactions || []).map((t) => t.service_id).filter(Boolean))];
    const userIds = [...new Set((transactions || []).flatMap((t) => [t.provider_id, t.requestor_id]).filter(Boolean))];

    const [servicesResult, usersResult] = await Promise.all([
      serviceIds.length
        ? supabase.from('services').select('service_id, subcategory, service_category').in('service_id', serviceIds)
        : { data: [] },
      userIds.length
        ? supabase.from('users').select('user_id, first_name, last_name, username').in('user_id', userIds)
        : { data: [] },
    ]);

    const serviceMap = new Map((servicesResult.data || []).map((s) => [String(s.service_id), s]));
    const userMap = new Map(
      (usersResult.data || []).map((u) => [
        u.user_id,
        `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || u.user_id,
      ])
    );

    const enriched = (transactions || []).map((t) => ({
      ...t,
      service_name: serviceMap.get(String(t.service_id))?.subcategory || 'Service',
      service_category: serviceMap.get(String(t.service_id))?.service_category || '',
      provider_name: userMap.get(t.provider_id) || t.provider_id,
      requestor_name: userMap.get(t.requestor_id) || t.requestor_id,
    }));

    return res.status(200).json({ transactions: enriched });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const userId = req.user && req.user.user_id;
    const { transaction_id } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_id', transaction_id)
      .maybeSingle();

    if (error || !transaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    if (transaction.provider_id !== userId && transaction.requestor_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized to view this transaction.' });
    }

    return res.status(200).json({ transaction });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const acceptTransaction = async (req, res) => {
  try {
    const transactionId = req.params.transaction_id || req.params.id;
    const userId = req.user && req.user.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required.' });
    }

    const { data: transaction, error: fetchErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    if (fetchErr || !transaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    // Only the provider assigned to the transaction can accept it
    if (transaction.provider_id !== userId) {
      return res.status(403).json({ error: 'Only the service provider can accept this booking.' });
    }

    if (transaction.service_status !== 'pending') {
      return res.status(400).json({
        error: `Cannot accept transaction with status '${transaction.service_status}'. Only pending bookings can be accepted.`,
      });
    }

    const { data: updated, error: updateErr } = await supabase
      .from('transactions')
      .update({ service_status: 'accepted' })
      .eq('transaction_id', transactionId)
      .select()
      .single();

    if (updateErr) {
      return res.status(500).json({ error: 'Failed to accept transaction.', details: updateErr.message });
    }

    // Notify the requestor
    createNotification(
      transaction.requestor_id,
      'transaction',
      'Booking Accepted!',
      `Provider accepted your booking #${transactionId}.`,
      `/transactions/${transactionId}/qr`
    );

    return res.status(200).json({
      message: 'Transaction accepted successfully.',
      transaction: updated,
    });
  } catch (error) {
    console.error('acceptTransaction error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const completeTransaction = async (req, res) => {
  try {
    const transactionId = req.params.transaction_id || req.params.id;
    const userId = req.user && req.user.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required.' });
    }

    const { data: transaction, error: fetchErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    if (fetchErr || !transaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    const isParticipant = transaction.provider_id === userId || transaction.requestor_id === userId;
    if (!isParticipant) {
      return res.status(403).json({ error: 'You are not authorized to complete this booking.' });
    }

    if (transaction.service_status === 'completed') {
      return res.status(400).json({ error: 'Transaction is already completed.' });
    }

    if (transaction.service_status === 'cancelled') {
      return res.status(400).json({ error: 'Cancelled transactions cannot be completed.' });
    }

    const { data: updated, error: updateErr } = await supabase
      .from('transactions')
      .update({ service_status: 'completed' })
      .eq('transaction_id', transactionId)
      .select()
      .single();

    if (updateErr) {
      return res.status(500).json({ error: 'Failed to complete transaction.', details: updateErr.message });
    }

    // Notify the other party
    const targetUserId = userId === transaction.provider_id ? transaction.requestor_id : transaction.provider_id;
    createNotification(
      targetUserId,
      'transaction',
      'Service Completed!',
      `Booking #${transactionId} has been marked as completed. Please leave a review!`,
      `/transactions`
    );

    return res.status(200).json({
      message: 'Transaction completed successfully.',
      transaction: updated,
    });
  } catch (error) {
    console.error('completeTransaction error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

const verifyQrCode = async (req, res) => {
  try {
    const userId = req.user && req.user.user_id;
    const { qr_code } = req.body || {};

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (!qr_code || !String(qr_code).trim()) {
      return res.status(400).json({ error: 'QR Code payload is required.' });
    }

    const trimmedCode = String(qr_code).trim();

    const { data: transaction, error: fetchErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('qr_code', trimmedCode)
      .maybeSingle();

    if (fetchErr || !transaction) {
      return res.status(404).json({ error: 'Invalid QR Code. No matching booking found.' });
    }

    // Verify provider ownership
    if (transaction.provider_id !== userId) {
      return res.status(403).json({
        error: `Unauthorized. This QR code is assigned to provider ${transaction.provider_id}, not your account.`,
      });
    }

    if (transaction.service_status === 'cancelled') {
      return res.status(400).json({ error: 'This booking has been cancelled and cannot be verified.' });
    }

    // Mark as completed upon successful verification
    const { data: updated, error: updateErr } = await supabase
      .from('transactions')
      .update({ service_status: 'completed' })
      .eq('transaction_id', transaction.transaction_id)
      .select()
      .single();

    if (updateErr) {
      return res.status(500).json({ error: 'Failed to verify transaction.', details: updateErr.message });
    }

    // Notify requestor that provider verified and completed the service
    createNotification(
      transaction.requestor_id,
      'transaction',
      'QR Code Verified - Service Completed!',
      `Provider verified your booking #${transaction.transaction_id} via QR code.`,
      `/transactions`
    );

    return res.status(200).json({
      message: 'QR Code verified successfully! Booking marked as completed.',
      transaction: updated,
    });
  } catch (error) {
    console.error('verifyQrCode error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  createTransaction,
  getUserTransactions,
  getTransactionById,
  acceptTransaction,
  completeTransaction,
  verifyQrCode,
};
