import { useState, useEffect, useCallback } from 'react';
import { Container, Spinner, Alert, Button } from 'react-bootstrap';
import TransactionTable from '../components/TransactionTable';
import api from '../api/axios';
import { socket } from '../socket';
import { getCurrentUserId } from '../utils/user';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUserId = getCurrentUserId();

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = window.localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    api.get('/profile/me')
      .then(({ data }) => {
        if (data?.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const isProvider = String(currentUser?.user_type || '').toLowerCase() === 'provider';

  const fetchTransactions = useCallback(async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data.transactions || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      // Don't override with error if we have cached transactions
      if (transactions.length === 0) {
        setError('Unable to load latest transactions from server.');
      }
    } finally {
      setLoading(false);
    }
  }, [transactions.length]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Real-time WebSocket listeners for instant booking lifecycle updates
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('register', currentUserId);

    const handleTransactionChange = () => {
      fetchTransactions();
    };

    socket.on('transaction_created', handleTransactionChange);
    socket.on('transaction_updated', handleTransactionChange);

    return () => {
      socket.off('transaction_created', handleTransactionChange);
      socket.off('transaction_updated', handleTransactionChange);
    };
  }, [currentUserId, fetchTransactions]);

  const handleStatusUpdate = async (transactionId, newStatus) => {
    try {
      await api.patch(`/transactions/${transactionId}/status`, { status: newStatus });
      // Optimistic local update
      setTransactions((prev) =>
        prev.map((t) =>
          t.transaction_id === transactionId ? { ...t, service_status: newStatus } : t
        )
      );
    } catch (err) {
      console.error(`Failed to update status to ${newStatus}:`, err);
      alert(err.response?.data?.error || `Failed to update status to ${newStatus}.`);
    }
  };

  return (
    <Container fluid className="p-0">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>
            {isProvider ? 'Client Bookings & Transactions' : 'My Availed Bookings'}
          </h2>
          <p className="text-muted mb-0">
            {isProvider
              ? 'Manage incoming student client booking requests, track completion, and view 5% commission details.'
              : 'View your scheduled campus service bookings, check status, and settle via QR vouchers.'}
          </p>
        </div>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={fetchTransactions}
          disabled={loading}
          className="neu-btn-outline"
        >
          {loading ? 'Refreshing...' : '↻ Refresh Bookings'}
        </Button>
      </div>

      {error && (
        <Alert variant="warning" dismissible onClose={() => setError(null)} className="mb-4">
          {error}
        </Alert>
      )}

      <div className="neu-card">
        {loading && transactions.length === 0 ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Loading live transactions...</p>
          </div>
        ) : (
          <TransactionTable
            transactions={transactions}
            currentUserId={currentUserId}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
      </div>
    </Container>
  );
}
