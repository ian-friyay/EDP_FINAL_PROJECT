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

    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('service_id, user_id, amount_topay, service_status, is_deleted')
      .eq('service_id', service_id)
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
          service_id,
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

module.exports = { createTransaction };
