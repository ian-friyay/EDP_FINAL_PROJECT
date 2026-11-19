import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button, Table, Badge, ButtonGroup } from 'react-bootstrap';

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
  onStatusUpdate,
  onPayWithPayPal,
  reviewsMap = {},
  onOpenReviewModal,
}) {
  const sortedTransactions = useMemo(() => {
    const rows = Array.isArray(transactions) ? [...transactions] : [];
    const activeRows = rows.filter(
      (transaction) => transaction.service_status !== 'completed' && transaction.service_status !== 'cancelled'
    );
    const finishedRows = rows.filter(
      (transaction) => transaction.service_status === 'completed' || transaction.service_status === 'cancelled'
    );

    const newestFirst = (first, second) =>
      new Date(second.created_at || 0).getTime() -
      new Date(first.created_at || 0).getTime();

    return [...activeRows.sort(newestFirst), ...finishedRows.sort(newestFirst)];
  }, [transactions]);

  return (
    <div className="neu-transaction-table neu-scroll-table">
      <Table responsive hover className="align-middle mb-0">
        <thead>
          <tr>
            <th>#</th>
            <th>Service &amp; Counterparty</th>
            <th className="d-none d-md-table-cell">Amount</th>
            <th>Total To Pay</th>
            <th>Status</th>
            <th className="d-none d-sm-table-cell">Date</th>
            <th>Actions</th>
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
            sortedTransactions.map((transaction) => {
              const isProvider = String(transaction.provider_id) === String(currentUserId);
              const isRequestor = String(transaction.requestor_id) === String(currentUserId);

              return (
                <tr key={transaction.transaction_id}>
                  <td className="fw-semibold text-muted">
                    #{transaction.transaction_id}
                  </td>
                  <td>
                    <div className="fw-semibold" style={{ color: 'var(--neu-text)' }}>
                      {transaction.service_name || 'Campus Service'}
                    </div>
                    <small className="text-muted d-block">
                      {isProvider
                        ? `Requestor: ${transaction.requestor_name || transaction.requestor_id}`
                        : `Provider: ${transaction.provider_name || transaction.provider_id}`}
                    </small>
                    {transaction.notes && (
                      <div className="small text-secondary mt-1 p-1 rounded bg-light border fst-italic" style={{ maxWidth: '280px' }}>
                        <span className="fw-semibold text-dark">Note:</span> "{transaction.notes}"
                      </div>
                    )}
                  </td>
                  <td className="d-none d-md-table-cell">{formatAmount(transaction.amount_topay)}</td>
                  <td className="fw-bold" style={{ color: '#063a8f' }}>
                    {formatAmount(transaction.total_topay)}
                  </td>
                  <td>
                    <Badge
                      bg={statusVariants[transaction.service_status] || 'secondary'}
                      className="rounded-pill px-2 py-1 text-capitalize"
                    >
                      {transaction.service_status}
                    </Badge>
                  </td>
                  <td className="d-none d-sm-table-cell">
                    {transaction.booking_date ? (
                      <div>
                        <div className="small fw-semibold text-dark">{transaction.booking_date}</div>
                        {(transaction.start_time || transaction.end_time) && (
                          <Badge bg="light" text="dark" className="border small font-monospace">
                            🕒 {transaction.start_time || '--:--'} - {transaction.end_time || '--:--'}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <small className="text-muted">
                        {transaction.created_at
                          ? new Date(transaction.created_at).toLocaleDateString('en-PH')
                          : '-'}
                      </small>
                    )}
                  </td>
                  <td>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      {/* Provider Action: Accept Pending Booking */}
                      {isProvider && transaction.service_status === 'pending' && onStatusUpdate && (
                        <Button
                          variant="success"
                          size="sm"
                          className="px-2 py-1 fw-semibold"
                          onClick={() => onStatusUpdate(transaction.transaction_id, 'accepted')}
                        >
                          ✓ Accept
                        </Button>
                      )}

                      {/* Provider Action: Complete Accepted Booking */}
                      {isProvider && transaction.service_status === 'accepted' && onStatusUpdate && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="px-2 py-1 fw-semibold neu-btn-primary"
                          onClick={() => onStatusUpdate(transaction.transaction_id, 'completed')}
                        >
                          Mark Completed
                        </Button>
                      )}

                      {/* Cancel Action (Pending only) */}
                      {transaction.service_status === 'pending' && onStatusUpdate && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="px-2 py-1"
                          onClick={() => onStatusUpdate(transaction.transaction_id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      )}

                      {/* Requestor Action: Pay via PayPal Sandbox */}
                      {!isProvider && transaction.service_status !== 'completed' && transaction.service_status !== 'cancelled' && onPayWithPayPal && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="px-2 py-1 fw-semibold d-inline-flex align-items-center gap-1 shadow-xs"
                          style={{ backgroundColor: '#0070ba', borderColor: '#0070ba' }}
                          onClick={() => onPayWithPayPal(transaction)}
                        >
                          <span style={{ color: '#fff', fontWeight: 800 }}>Pay</span>
                          <span style={{ color: '#ffc439', fontWeight: 800 }}>Pal</span>
                        </Button>
                      )}

                      {/* QR Settlement / Voucher View */}
                      <Button
                        as={Link}
                        to={`/transactions/${transaction.transaction_id}/qr`}
                        className="neu-btn-outline px-2 py-1"
                        size="sm"
                      >
                        {isProvider ? 'QR Settlement' : 'QR Voucher'}
                      </Button>

                      {/* Review & Rating Action for Completed Bookings */}
                      {transaction.service_status === 'completed' && (() => {
                        const existingReview = reviewsMap[String(transaction.transaction_id)];

                        if (!isProvider) {
                          // Student Requestor: Can leave or view review
                          return existingReview ? (
                            <Button
                              variant="light"
                              size="sm"
                              className="px-2 py-1 border d-inline-flex align-items-center gap-1 shadow-xs fw-semibold"
                              style={{
                                background: 'rgba(245, 158, 11, 0.12)',
                                color: '#b45309',
                                borderColor: 'rgba(245, 158, 11, 0.3)',
                              }}
                              onClick={() => onOpenReviewModal && onOpenReviewModal(transaction, existingReview)}
                              title="Click to view or update your rating"
                            >
                              <span style={{ color: '#f59e0b' }}>★</span> {existingReview.rating}.0 Rated
                            </Button>
                          ) : (
                            <Button
                              variant="warning"
                              size="sm"
                              className="px-2 py-1 fw-bold text-dark d-inline-flex align-items-center gap-1 shadow-sm"
                              style={{
                                background: '#f59e0b',
                                borderColor: '#d97706',
                              }}
                              onClick={() => onOpenReviewModal && onOpenReviewModal(transaction, null)}
                            >
                              <span>★</span> Rate &amp; Review
                            </Button>
                          );
                        } else {
                          // Student Provider: Can view rating received
                          return existingReview ? (
                            <Badge
                              bg="warning"
                              text="dark"
                              className="px-2 py-1 border shadow-xs fw-semibold d-inline-flex align-items-center gap-1"
                              style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' }}
                            >
                              <span>★</span> {existingReview.rating}.0 Received
                            </Badge>
                          ) : null;
                        }
                      })()}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
    </div>
  );
}

export default TransactionTable;
