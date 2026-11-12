const crypto = require('crypto');
const supabase = require('../db');

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

module.exports = {
  createTransaction,
  getUserTransactions,
  getTransactionById,
};
