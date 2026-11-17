import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Table, Badge, Modal, Form, Alert } from 'react-bootstrap';
import api from '../api/axios';

const dummyTransactions = [
  {
    transaction_id: 1,
    provider_name: 'Juan Cruz',
    service_name: 'Aircon Cleaning & Repair',
    amount_topay: 500,
    total_topay: 530,
    service_status: 'pending',
    created_at: '2026-02-10T10:00:00',
  },
  {
    transaction_id: 2,
    provider_name: 'Maria Santos',
    service_name: 'Pipe Installation & Leak Repair',
    amount_topay: 1200,
    total_topay: 1265,
    service_status: 'completed',
    created_at: '2026-02-08T09:00:00',
  },
  {
    transaction_id: 3,
    provider_name: 'Pedro Reyes',
    service_name: 'Electrical Circuit Wiring',
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

function TransactionTable({ transactions = dummyTransactions, onReviewSubmitted }) {
  const [reviewModalTx, setReviewModalTx] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewedTxIds, setReviewedTxIds] = useState(() => new Set());

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

  const handleOpenReviewModal = (tx) => {
    setReviewModalTx(tx);
    setRating(5);
    setComment('');
    setReviewError('');
  };

  const handleCloseReviewModal = () => {
    setReviewModalTx(null);
    setComment('');
    setReviewError('');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModalTx) return;

    setIsSubmittingReview(true);
    setReviewError('');

    try {
      await api.post('/reviews', {
        transaction_id: reviewModalTx.transaction_id,
        service_id: reviewModalTx.service_id,
        provider_id: reviewModalTx.provider_id,
        rating,
        comment,
      });

      setReviewedTxIds((prev) => new Set(prev).add(reviewModalTx.transaction_id));
      setReviewSuccess(`Thank you! Your ${rating}-star review for ${reviewModalTx.provider_name || 'the provider'} has been submitted.`);
      handleCloseReviewModal();
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err) {
      setReviewError(err.response?.data?.error || err.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="neu-transaction-table">
      {reviewSuccess && (
        <Alert variant="success" dismissible onClose={() => setReviewSuccess('')} className="neu-alert m-3">
          {reviewSuccess}
        </Alert>
      )}

      <Table responsive hover className="align-middle mb-0">
        <thead>
          <tr>
            <th>#</th>
            <th>Provider &amp; Service</th>
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
              const isCompleted = transaction.service_status === 'completed';
              const isReviewed = reviewedTxIds.has(transaction.transaction_id);

              return (
                <tr key={transaction.transaction_id}>
                  <td className="fw-semibold text-muted font-monospace">
                    {transaction.transaction_id}
                  </td>
                  <td>
                    <div className="fw-semibold" style={{ color: 'var(--neu-text)' }}>
                      {transaction.provider_name || transaction.provider_id || 'Provider'}
                    </div>
                    <small className="text-muted">
                      {transaction.service_name || 'Service Booking'}
                    </small>
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
                    <small className="text-muted">
                      {transaction.created_at
                        ? new Date(transaction.created_at).toLocaleString('en-PH')
                        : '-'}
                    </small>
                  </td>
                  <td>
                    <div className="d-flex gap-2 flex-wrap">
                      <Button
                        as={Link}
                        to={`/transactions/${transaction.transaction_id}/qr`}
                        className="neu-btn-outline px-3 py-1"
                        size="sm"
                      >
                        View QR
                      </Button>

                      {isCompleted && (
                        isReviewed ? (
                          <Badge bg="success" className="px-2 py-2 rounded-pill d-flex align-items-center">
                            ✓ Reviewed
                          </Badge>
                        ) : (
                          <Button
                            className="neu-btn-primary px-3 py-1"
                            size="sm"
                            onClick={() => handleOpenReviewModal(transaction)}
                          >
                            ★ Rate &amp; Review
                          </Button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>

      {/* Rate & Review Modal */}
      {reviewModalTx && (
        <Modal show={!!reviewModalTx} onHide={handleCloseReviewModal} centered>
          <Modal.Header closeButton style={{ background: 'var(--neu-bg-dark)', borderBottom: '1px solid rgba(154, 172, 196, 0.3)' }}>
            <Modal.Title className="fw-bold fs-5" style={{ color: 'var(--neu-text)' }}>
              Rate &amp; Review Service
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmitReview}>
            <Modal.Body className="p-4" style={{ background: 'var(--neu-bg)' }}>
              {reviewError && (
                <Alert variant="danger" dismissible onClose={() => setReviewError('')} className="neu-alert mb-3">
                  {reviewError}
                </Alert>
              )}

              <div className="p-3 mb-3 rounded-3" style={{ background: 'var(--neu-bg-dark)' }}>
                <div className="small text-muted">Service Provider:</div>
                <div className="fw-bold fs-6" style={{ color: 'var(--neu-text)' }}>
                  {reviewModalTx.provider_name || reviewModalTx.provider_id}
                </div>
                <div className="small text-muted mt-1">
                  Service: {reviewModalTx.service_name || 'Standard Service'}
                </div>
              </div>

              {/* Star Rating Selector */}
              <Form.Group className="mb-4 text-center">
                <Form.Label className="small fw-semibold text-muted d-block mb-2">
                  Overall Rating
                </Form.Label>
                <div className="d-flex justify-content-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        className="btn p-1 border-0 bg-transparent"
                        style={{ fontSize: '2rem', color: active ? '#f59e0b' : '#cbd5e1', cursor: 'pointer', transition: 'transform 0.1s' }}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                      >
                        ★
                      </button>
                    );
                  })}
                </div>
                <div className="small fw-bold mt-1" style={{ color: '#f59e0b' }}>
                  {rating} of 5 Stars
                </div>
              </Form.Group>

              {/* Comments / Feedback */}
              <Form.Group className="mb-3" controlId="reviewComment">
                <Form.Label className="small fw-semibold text-muted">
                  Feedback &amp; Comments (Optional)
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  className="neu-input"
                  placeholder="Share details of your experience with this service..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer style={{ background: 'var(--neu-bg-dark)', borderTop: '1px solid rgba(154, 172, 196, 0.3)' }}>
              <Button className="neu-btn-ghost" onClick={handleCloseReviewModal} disabled={isSubmittingReview}>
                Cancel
              </Button>
              <Button type="submit" className="neu-btn-primary px-4 fw-semibold" disabled={isSubmittingReview}>
                {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      )}
    </div>
  );
}

export default TransactionTable;
