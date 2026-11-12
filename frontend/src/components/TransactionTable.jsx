import { useMemo } from 'react';
import { Table, Badge } from 'react-bootstrap';

const dummyTransactions = [
  {
    transaction_id: 1,
    provider_name: 'Juan Cruz',
    amount_topay: 500,
    total_topay: 530,
    service_status: 'pending',
    created_at: '2026-02-10T10:00:00',
  },
  {
    transaction_id: 2,
    provider_name: 'Maria Santos',
    amount_topay: 1200,
    total_topay: 1265,
    service_status: 'completed',
    created_at: '2026-02-08T09:00:00',
  },
  {
    transaction_id: 3,
    provider_name: 'Pedro Reyes',
    amount_topay: 800,
    total_topay: 845,
    service_status: 'accepted',
    created_at: '2026-02-11T14:00:00',
  },
];

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

function TransactionTable({ transactions = dummyTransactions }) {
  const sortedTransactions = useMemo(() => {
    const rows = Array.isArray(transactions) ? [...transactions] : [];
    const activeRows = rows.filter(
      (transaction) => transaction.service_status !== 'completed'
    );
    const completedRows = rows.filter(
      (transaction) => transaction.service_status === 'completed'
    );

    const newestFirst = (first, second) =>
      new Date(second.created_at).getTime() -
      new Date(first.created_at).getTime();

    return [...activeRows.sort(newestFirst), ...completedRows.sort(newestFirst)];
  }, [transactions]);

  return (
    <Table responsive striped bordered hover className="align-middle">
      <thead className="table-dark">
        <tr>
          <th>#</th>
          <th>Provider</th>
          <th>Amount</th>
          <th>Total To Pay</th>
          <th>Status</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        {sortedTransactions.length === 0 ? (
          <tr>
            <td colSpan={6} className="text-center text-muted py-4">
              No transactions found.
            </td>
          </tr>
        ) : (
          sortedTransactions.map((transaction) => (
            <tr key={transaction.transaction_id}>
              <td>{transaction.transaction_id}</td>
              <td>
                <div className="fw-semibold">{transaction.provider_name}</div>
                <small className="text-muted">Provider</small>
              </td>
              <td>{formatAmount(transaction.amount_topay)}</td>
              <td className="fw-semibold">{formatAmount(transaction.total_topay)}</td>
              <td>
                <Badge bg={statusVariants[transaction.service_status] || 'secondary'}>
                  {transaction.service_status}
                </Badge>
              </td>
              <td>
                {transaction.created_at
                  ? new Date(transaction.created_at).toLocaleString('en-PH')
                  : '-'}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
}

export default TransactionTable;
