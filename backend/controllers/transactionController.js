const crypto = require('crypto');
const supabase = require('../db');

const BOOKING_FEE = 5;
const COMMISSION_RATE = 0.05;

const createTransaction = async (req, res) => {
  try {
    const requestor_id = req.user && req.user.user_id;
    const {
      service_id,
      notes,
      booking_date,
      start_time,
      end_time,
      custom_amount,
    } = req.body;

    if (!requestor_id) {
      return res.status(401).json({ error: 'Unauthorized. Please log in again.' });
    }

    if (!service_id) {
      return res.status(400).json({ error: 'service_id is required.' });
    }

    const normalizedServiceId = isNaN(Number(service_id)) ? service_id : Number(service_id);

    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('service_id, user_id, amount_topay, service_category, subcategory, service_description, rate_unit, service_status, is_deleted')
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
    let baseAmount = Number(service.amount_topay);

    // If custom amount is provided and valid, use it; or calculate hours for hourly rates
    let amount_topay = baseAmount;
    if (custom_amount && Number.isFinite(Number(custom_amount)) && Number(custom_amount) > 0) {
      amount_topay = Number(custom_amount);
    } else if (start_time && end_time) {
      try {
        const [startH, startM] = start_time.split(':').map(Number);
        const [endH, endM] = end_time.split(':').map(Number);
        const startMinutes = startH * 60 + (startM || 0);
        const endMinutes = endH * 60 + (endM || 0);
        if (endMinutes > startMinutes) {
          const durationHours = (endMinutes - startMinutes) / 60;
          const isHourly = service.rate_unit === 'per_hour' || (service.service_description && service.service_description.includes('[Rate: per_hour]'));
          if (isHourly) {
            amount_topay = Number((durationHours * baseAmount).toFixed(2));
          }
        }
      } catch (err) {
        amount_topay = baseAmount;
      }
    }

    if (!Number.isFinite(amount_topay) || amount_topay <= 0) {
      return res.status(400).json({ error: 'Invalid service amount.' });
    }

    const booking_fee = BOOKING_FEE;
    const commission_fee = Number(
      (amount_topay * COMMISSION_RATE).toFixed(2)
    );
    const total_topay = Number((amount_topay + booking_fee).toFixed(2));
    const qr_code = `SERBISYOU-${crypto.randomUUID()}`;

    const insertPayload = {
      provider_id,
      requestor_id,
      service_id: normalizedServiceId,
      amount_topay,
      booking_fee,
      total_topay,
      commission_fee,
      service_status: 'pending',
      qr_code,
      notes: notes ? String(notes).trim() : null,
      booking_date: booking_date || null,
      start_time: start_time || null,
      end_time: end_time || null,
    };

    let { data: transaction, error: insertError } = await supabase
      .from('transactions')
      .insert([insertPayload])
      .select()
      .single();

    // If columns do not exist yet in Supabase schema cache, retry without extra columns
    if (insertError && (insertError.code === 'PGRST204' || insertError.message.includes('column'))) {
      const fallbackPayload = {
        provider_id,
        requestor_id,
        service_id: normalizedServiceId,
        amount_topay,
        booking_fee,
        total_topay,
        commission_fee,
        service_status: 'pending',
        qr_code,
      };

      const retryResult = await supabase
        .from('transactions')
        .insert([fallbackPayload])
        .select()
        .single();

      transaction = retryResult.data;
      insertError = retryResult.error;

      if (transaction) {
        transaction.notes = notes ? String(notes).trim() : null;
        transaction.booking_date = booking_date || null;
        transaction.start_time = start_time || null;
        transaction.end_time = end_time || null;
      }
    }

    if (insertError) {
      return res.status(500).json({
        error: 'Failed to create transaction.',
        details: insertError.message,
      });
    }

    // Real-time notification & event emission via Socket.io
    const io = req.app && req.app.get('io');
    if (io) {
      const scheduleText = booking_date
        ? ` on ${booking_date}${start_time ? ` (${start_time} - ${end_time || 'TBD'})` : ''}`
        : '';
      const notesText = notes ? ` Note: "${notes}"` : '';

      const notifPayload = {
        id: `tx_${transaction.transaction_id}_${Date.now()}`,
        type: 'booking',
        title: 'New Service Booking Request',
        description: `Student ${requestor_id} requested your service${scheduleText}.${notesText} (Total: ₱${total_topay}).`,
        timestamp: new Date().toISOString(),
        read: false,
        link: '/transactions',
        target_id: String(transaction.transaction_id),
      };

      io.to(String(provider_id)).emit('transaction_created', transaction);
      io.to(String(provider_id)).emit('new_notification', notifPayload);
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

const updateTransactionStatus = async (req, res) => {
  try {
    const userId = req.user && req.user.user_id;
    const { transaction_id } = req.params;
    const { status } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (!['accepted', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Allowed statuses are: 'accepted', 'completed', 'cancelled'.",
      });
    }

    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_id', transaction_id)
      .maybeSingle();

    if (fetchError || !transaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    const isProvider = transaction.provider_id === userId;
    const isRequestor = transaction.requestor_id === userId;

    if (!isProvider && !isRequestor) {
      return res.status(403).json({ error: 'You are not a participant in this transaction.' });
    }

    // Role & status validation
    if (status === 'accepted') {
      if (!isProvider) {
        return res.status(403).json({ error: 'Only the provider can accept this booking.' });
      }
      if (transaction.service_status !== 'pending') {
        return res.status(400).json({
          error: `Cannot accept transaction with status '${transaction.service_status}'.`,
        });
      }
    } else if (status === 'completed') {
      if (!isProvider && !isRequestor) {
        return res.status(403).json({ error: 'Unauthorized.' });
      }
      if (transaction.service_status !== 'accepted') {
        return res.status(400).json({
          error: `Cannot complete transaction with status '${transaction.service_status}'. Must be 'accepted' first.`,
        });
      }
    } else if (status === 'cancelled') {
      if (transaction.service_status !== 'pending') {
        return res.status(400).json({
          error: `Cannot cancel transaction with status '${transaction.service_status}'. Only pending bookings can be cancelled.`,
        });
      }
    }

    const { data: updated, error: updateError } = await supabase
      .from('transactions')
      .update({ service_status: status })
      .eq('transaction_id', transaction_id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update transaction status.' });
    }

    // Real-time socket emission & scoped notification
    const io = req.app && req.app.get('io');
    if (io) {
      // Notify both parties of transaction state change
      io.to(String(transaction.provider_id)).emit('transaction_updated', updated);
      io.to(String(transaction.requestor_id)).emit('transaction_updated', updated);

      const recipientId = isProvider ? transaction.requestor_id : transaction.provider_id;
      const statusTitleMap = {
        accepted: 'Booking Accepted!',
        completed: 'Service Completed!',
        cancelled: 'Booking Cancelled',
      };
      const statusDescMap = {
        accepted: `Provider has accepted your booking request (TX-${transaction.transaction_id}).`,
        completed: `Service (TX-${transaction.transaction_id}) has been marked as completed. Please settle payment via QR.`,
        cancelled: `Booking (TX-${transaction.transaction_id}) was cancelled.`,
      };

      io.to(String(recipientId)).emit('new_notification', {
        id: `tx_${transaction.transaction_id}_${status}_${Date.now()}`,
        type: 'booking',
        title: statusTitleMap[status] || 'Booking Update',
        description: statusDescMap[status] || `Transaction status changed to ${status}.`,
        timestamp: new Date().toISOString(),
        read: false,
        link: '/transactions',
        target_id: String(transaction.transaction_id),
      });
    }

    return res.status(200).json({
      message: `Transaction status updated to '${status}'.`,
      transaction: updated,
    });
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  createTransaction,
  getUserTransactions,
  getTransactionById,
  updateTransactionStatus,
};
