import { useEffect, useState } from 'react';
import { Container, Alert, Spinner, Button } from 'react-bootstrap';
import TransactionTable from '../components/TransactionTable';
import api from '../api/axios';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTransactions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.get('/transactions');
      setTransactions(data.transactions || []);
    } catch (err) {
      console.warn('Failed to load transactions, using fallback data:', err);
      // Fallback is handled gracefully in TransactionTable
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <Container fluid className="p-0">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>Transactions &amp; Bookings</h2>
          <p className="text-muted mb-0">
            Records of service bookings, booking fees (₱5), 5% commission fees, and provider ratings.
          </p>
        </div>
        <Button className="neu-btn-ghost btn-sm" onClick={fetchTransactions} disabled={isLoading}>
          {isLoading ? 'Refreshing...' : '↻ Refresh Transactions'}
        </Button>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="neu-alert mb-4">
          {error}
        </Alert>
      )}

      <div className="neu-card">
        {isLoading ? (
          <div className="text-center py-5 text-muted">
            <Spinner animation="border" size="sm" className="me-2" />
            Loading transaction records...
          </div>
        ) : (
          <TransactionTable
            transactions={transactions.length > 0 ? transactions : undefined}
            onReviewSubmitted={fetchTransactions}
          />
        )}
      </div>
    </Container>
  );
}
