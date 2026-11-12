import { useMemo } from 'react';
import { Table, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const statusVariants = {
  pending: 'warning',
  accepted: 'primary',
  completed: 'success',
  cancelled: 'danger',
};

const formatAmount = (amount) =>
  Number(amount || 0).toLocaleString('en-PH', {
    style: 'currency',
    currency: 'PHP',
  });

function TransactionTable({
  transactions = [],
  currentUserId,
  onCancelTransaction,
  cancellingId,
}) {
  const sortedTransactions = useMemo(() => {
    const rows = Array.isArray(transactions) ? [...transactions] : [];
    const activeRows = rows.filter(
      (transaction) => transaction.service_status !== 'completed' && transaction.service_status !== 'cancelled'
    );
    const finishedRows = rows.filter(
      (transaction) => transaction.service_status === 'completed' || transaction.service_status === 'cancelled'
    );

    return [...activeRows, ...finishedRows];
  }, [transactions]);

  return (
    <Table responsive striped bordered hover className="align-middle mb-0">
      <thead className="table-dark">
        <tr>
          <th>Tx ID</th>
          <th>Service</th>
          <th>Provider</th>
          <th>Requestor</th>
          <th>Amount</th>
          <th>Total To Pay</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {sortedTransactions.length === 0 ? (
          <tr>
            <td colSpan={8} className="text-center text-muted py-4">
              No transactions found.
            </td>
          </tr>
        ) : (
          sortedTransactions.map((transaction) => {
            const isParticipant =
              transaction.provider_id === currentUserId ||
              transaction.requestor_id === currentUserId;
            const canCancel =
              transaction.service_status === 'pending' && isParticipant;

            return (
              <tr key={transaction.transaction_id}>
                <td className="font-monospace fw-bold">{transaction.transaction_id}</td>
                <td>
                  <div className="fw-semibold">{transaction.service_name || 'Service'}</div>
                  {transaction.service_category && (
                    <small className="text-muted">{transaction.service_category}</small>
                  )}
                </td>
                <td>
                  <div className="fw-semibold">{transaction.provider_name}</div>
                  <small className="text-muted font-monospace">{transaction.provider_id}</small>
                </td>
                <td>
                  <div className="fw-semibold">{transaction.requestor_name}</div>
                  <small className="text-muted font-monospace">{transaction.requestor_id}</small>
                </td>
                <td>{formatAmount(transaction.amount_topay)}</td>
                <td className="fw-semibold">{formatAmount(transaction.total_topay)}</td>
                <td>
                  <Badge bg={statusVariants[transaction.service_status] || 'secondary'} className="text-capitalize">
                    {transaction.service_status}
                  </Badge>
                </td>
                <td>
                  <div className="d-flex gap-1 flex-wrap">
                    <Button
                      as={Link}
                      to={`/transactions/${transaction.transaction_id}/qr`}
                      variant="outline-primary"
                      size="sm"
                    >
                      QR
                    </Button>
                    {canCancel && onCancelTransaction && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => onCancelTransaction(transaction)}
                        disabled={cancellingId === transaction.transaction_id}
                      >
                        {cancellingId === transaction.transaction_id ? 'Cancelling...' : 'Cancel'}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </Table>
  );
}

export default TransactionTable;
