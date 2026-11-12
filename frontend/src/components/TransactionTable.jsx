import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button, Table, Badge } from 'react-bootstrap';

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
    <div className="neu-transaction-table">
      <Table responsive hover className="align-middle mb-0">
        <thead>
          <tr>
            <th>#</th>
            <th>Provider</th>
            <th className="d-none d-md-table-cell">Amount</th>
            <th>Total To Pay</th>
            <th>Status</th>
            <th className="d-none d-sm-table-cell">Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedTransactions.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center text-muted py-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16" className="mb-2 d-block mx-auto opacity-50">
                  <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                  <path d="M6 7h4v1H6V7z"/>
                </svg>
                No transactions found.
              </td>
            </tr>
          ) : (
            sortedTransactions.map((transaction) => (
              <tr key={transaction.transaction_id}>
                <td className="fw-semibold text-muted">
                  {transaction.transaction_id}
                </td>
                <td>
                  <div className="fw-semibold" style={{ color: 'var(--neu-text)' }}>{transaction.provider_name}</div>
                  <small className="text-muted">Provider</small>
                </td>
                <td className="d-none d-md-table-cell">{formatAmount(transaction.amount_topay)}</td>
                <td className="fw-bold" style={{ color: '#063a8f' }}>
                  {formatAmount(transaction.total_topay)}
                </td>
                <td>
                  <Badge
                    bg={statusVariants[transaction.service_status] || 'secondary'}
                    className="rounded-pill px-2 py-1"
                  >
                    {transaction.service_status}
                  </Badge>
                </td>
                <td className="d-none d-sm-table-cell">
                  <small className="text-muted">
                    {transaction.created_at
                      ? new Date(transaction.created_at).toLocaleString('en-PH')
                      : '-'}
                  </small>
                </td>
                <td>
                  <Button
                    as={Link}
                    to={`/transactions/${transaction.transaction_id}/qr`}
                    className="neu-btn-outline px-3 py-1"
                    size="sm"
                  >
                    View QR
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}

export default TransactionTable;
