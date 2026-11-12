import { useCallback, useEffect, useState } from 'react';
import { Card, Container, Alert } from 'react-bootstrap';
import api from '../api/axios';
import TransactionTable from '../components/TransactionTable';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const currentUserId = window.localStorage.getItem('user_id');

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.get('/transactions');
      setTransactions(data.transactions || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load transactions.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleCancelTransaction = async (transaction) => {
    setError('');
    setMessage('');
    setCancellingId(transaction.transaction_id);

    try {
      await api.patch(`/transactions/${transaction.transaction_id}/cancel`);
      setMessage(`Transaction ${transaction.transaction_id} was successfully cancelled.`);
      await fetchTransactions();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to cancel transaction.');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <Container fluid className="p-0">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Transactions &amp; Bookings</h2>
        <p className="text-muted mb-0">
          Records of service bookings, booking fees (₱5), and 5% commission fees.
        </p>
      </div>

      {message && <Alert variant="success" dismissible onClose={() => setMessage('')}>{message}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Card className="border-0 shadow-sm rounded-3">
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center text-muted py-5">Loading your transactions...</div>
          ) : (
            <TransactionTable
              transactions={transactions}
              currentUserId={currentUserId}
              onCancelTransaction={handleCancelTransaction}
              cancellingId={cancellingId}
            />
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}
