const supabase = require('../db');

const cancelTransaction = async (req, res) => {
  try {
    const transaction_id = req.params.transaction_id || req.body.transaction_id;
    const userId = req.user && req.user.user_id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized. Please log in again.' });
    }

    if (!transaction_id) {
      return res.status(400).json({ error: 'transaction_id is required.' });
    }

    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('transaction_id', transaction_id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Transaction not found.' });
      }

      return res.status(500).json({
        error: 'Failed to retrieve transaction.',
        details: fetchError.message,
      });
    }

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    const isParticipant =
      transaction.requestor_id === userId || transaction.provider_id === userId;

    if (!isParticipant) {
      return res.status(403).json({
        error: 'You are not allowed to cancel this transaction.',
      });
    }

    if (transaction.service_status === 'completed') {
      return res.status(403).json({
        error: 'A completed transaction can no longer be cancelled.',
      });
    }

    if (transaction.service_status === 'accepted') {
      return res.status(403).json({
        error: 'An accepted transaction can no longer be cancelled.',
      });
    }

    if (transaction.service_status !== 'pending') {
      return res.status(403).json({
        error: `Transaction cannot be cancelled because its status is '${transaction.service_status}'.`,
      });
    }

    const { data: cancelledTransaction, error: updateError } = await supabase
      .from('transactions')
      .update({ service_status: 'cancelled' })
      .eq('transaction_id', transaction_id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({
        error: 'Failed to cancel transaction.',
        details: updateError.message,
      });
    }

    return res.status(200).json({
      message: 'Transaction cancelled successfully.',
      transaction: cancelledTransaction,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error.',
      details: error.message,
    });
  }
};

module.exports = { cancelTransaction };
