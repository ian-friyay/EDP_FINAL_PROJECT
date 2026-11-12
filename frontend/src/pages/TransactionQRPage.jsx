import { Button, Container } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import TransactionQR from '../components/TransactionQR';

export default function TransactionQRPage() {
  const { transactionId } = useParams();

  return (
    <Container fluid className="p-0">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>Transaction QR</h2>
          <p className="text-muted mb-0">
            Scan or download the QR code for this transaction.
          </p>
        </div>
        <Button as={Link} to="/transactions" className="neu-btn-ghost px-3" size="sm">
          &larr; Back to Transactions
        </Button>
      </div>

      <TransactionQR transaction_id={transactionId} />
    </Container>
  );
}
