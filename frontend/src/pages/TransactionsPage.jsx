import { Card, Container } from 'react-bootstrap';
import TransactionTable from '../components/TransactionTable';

export default function TransactionsPage() {
  return (
    <Container fluid className="p-0">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Transactions &amp; Bookings</h2>
        <p className="text-muted mb-0">
          Records of service bookings, booking fees (₱5), and 5% commission fees.
        </p>
      </div>

      <Card className="border-0 shadow-sm rounded-3">
        <Card.Body className="p-0">
          <TransactionTable />
        </Card.Body>
      </Card>
    </Container>
  );
}
