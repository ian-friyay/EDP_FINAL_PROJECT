import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Table, Badge, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import api from '../api/axios';

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

function TransactionTable({ transactions = [], currentUserId, onRefresh }) {
  // Review Modal State
  const [reviewModalTx, setReviewModalTx] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewedTxIds, setReviewedTxIds] = useState(() => new Set());

  // Cancel Modal State
  const [cancelModalTx, setCancelModalTx] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // General Action State (Accept / Complete)
  const [actionInProgressId, setActionInProgressId] = useState(null);
  const [tableAlert, setTableAlert] = useState(null);

  const sortedTransactions = useMemo(() => {
    const rows = Array.isArray(transactions) ? [...transactions] : [];
    const activeRows = rows.filter(
      (transaction) => transaction.service_status !== 'completed' && transaction.service_status !== 'cancelled'
    );
    const completedRows = rows.filter(
      (transaction) => transaction.service_status === 'completed'
    );
    const cancelledRows = rows.filter(
      (transaction) => transaction.service_status === 'cancelled'
    );

    const newestFirst = (first, second) =>
      new Date(second.created_at || 0).getTime() -
      new Date(first.created_at || 0).getTime();

    return [
      ...activeRows.sort(newestFirst),
      ...completedRows.sort(newestFirst),
      ...cancelledRows.sort(newestFirst),
    ];
  }, [transactions]);

  // Handle Accept Transaction
  const handleAcceptTransaction = async (tx) => {
    setActionInProgressId(tx.transaction_id);
    setTableAlert(null);
    try {
      const { data } = await api.patch(`/transactions/${tx.transaction_id}/accept`);
      setTableAlert({
        variant: 'success',
        message: data.message || `Booking #${tx.transaction_id} has been accepted!`,
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      setTableAlert({
        variant: 'danger',
        message: err.response?.data?.error || err.message || 'Failed to accept booking.',
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  // Handle Complete Transaction
  const handleCompleteTransaction = async (tx) => {
    setActionInProgressId(tx.transaction_id);
    setTableAlert(null);
    try {
      const { data } = await api.patch(`/transactions/${tx.transaction_id}/complete`);
      setTableAlert({
        variant: 'success',
        message: data.message || `Booking #${tx.transaction_id} has been marked as Completed!`,
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      setTableAlert({
        variant: 'danger',
        message: err.response?.data?.error || err.message || 'Failed to complete booking.',
      });
    } finally {
      setActionInProgressId(null);
    }
  };

  // Handle Cancel Booking
  const handleConfirmCancel = async () => {
    if (!cancelModalTx) return;
    setIsCancelling(true);
    setCancelError('');

    try {
      const { data } = await api.patch(`/transactions/${cancelModalTx.transaction_id}/cancel`);
      setTableAlert({
        variant: 'info',
        message: data.message || `Booking #${cancelModalTx.transaction_id} was successfully cancelled.`,
      });
      setCancelModalTx(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      setCancelError(err.response?.data?.error || err.message || 'Failed to cancel booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle Review Modal
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
      if (onRefresh) onRefresh();
    } catch (err) {
      setReviewError(err.response?.data?.error || err.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="neu-transaction-table">
      {tableAlert && (
        <Alert
          variant={tableAlert.variant}
          dismissible
          onClose={() => setTableAlert(null)}
          className="neu-alert m-3"
        >
          {tableAlert.message}
        </Alert>
      )}

      {reviewSuccess && (
        <Alert variant="success" dismissible onClose={() => setReviewSuccess('')} className="neu-alert m-3">
          {reviewSuccess}
        </Alert>
      )}

      <Table responsive hover className="align-middle mb-0">
        <thead>
          <tr>
            <th>#</th>
            <th>Service Details</th>
            <th>Parties</th>
            <th className="d-none d-md-table-cell">Amount</th>
            <th>Total To Pay</th>
            <th>Status</th>
            <th className="d-none d-sm-table-cell">Date</th>
            <th>Action Controls</th>
          </tr>
        </thead>
        <tbody>
          {sortedTransactions.length === 0 ? (
            <tr>
              <td colSpan={8} className="text-center text-muted py-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" viewBox="0 0 16 16" className="mb-3 d-block mx-auto opacity-50">
                  <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                  <path d="M6 7h4v1H6V7z"/>
                </svg>
                <div className="fw-semibold fs-6 mb-1" style={{ color: 'var(--neu-text)' }}>No Transaction Records Found</div>
                <p className="text-muted small mb-3">You have not booked or received any service requests yet.</p>
                <Button as={Link} to="/services" className="neu-btn-primary btn-sm rounded-pill px-4">
                  Browse Service Catalog
                </Button>
              </td>
            </tr>
          ) : (
            sortedTransactions.map((transaction) => {
              const status = transaction.service_status || 'pending';
              const isCompleted = status === 'completed';
              const isPending = status === 'pending';
              const isAccepted = status === 'accepted';
              const isCancelled = status === 'cancelled';

              const isProvider = currentUserId && transaction.provider_id === currentUserId;
              const isRequestor = currentUserId && transaction.requestor_id === currentUserId;
              const isReviewed = reviewedTxIds.has(transaction.transaction_id);
              const isActionLoading = actionInProgressId === transaction.transaction_id;

              return (
                <tr key={transaction.transaction_id}>
                  <td className="fw-semibold text-muted font-monospace">
                    #{transaction.transaction_id}
                  </td>
                  <td>
                    <div className="fw-bold" style={{ color: 'var(--neu-text)' }}>
                      {transaction.service_name || 'Service Booking'}
                    </div>
                    <small className="text-muted">
                      {transaction.service_category || 'Marketplace Service'}
                    </small>
                  </td>
                  <td>
                    <div className="small">
                      <span className="text-muted">Provider: </span>
                      <strong style={{ color: 'var(--neu-text)' }}>
                        {transaction.provider_name || transaction.provider_id || '---'}
                      </strong>
                    </div>
                    <div className="small">
                      <span className="text-muted">Client: </span>
                      <strong style={{ color: 'var(--neu-text)' }}>
                        {transaction.requestor_name || transaction.requestor_id || '---'}
                      </strong>
                    </div>
                  </td>
                  <td className="d-none d-md-table-cell">{formatAmount(transaction.amount_topay)}</td>
                  <td className="fw-bold" style={{ color: '#063a8f' }}>
                    {formatAmount(transaction.total_topay || (Number(transaction.amount_topay || 0) + 5))}
                  </td>
                  <td>
                    <Badge
                      bg={statusVariants[status] || 'secondary'}
                      text={status === 'pending' ? 'dark' : 'white'}
                      className="rounded-pill px-2 py-1 text-capitalize shadow-sm"
                    >
                      {status}
                    </Badge>
                  </td>
                  <td className="d-none d-sm-table-cell">
                    <small className="text-muted">
                      {transaction.created_at
                        ? new Date(transaction.created_at).toLocaleString('en-PH', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })
                        : '-'}
                    </small>
                  </td>
                  <td>
                    <div className="d-flex gap-2 flex-wrap align-items-center">
                      {/* 1. View QR Code (Always available unless cancelled) */}
                      {!isCancelled && (
                        <Button
                          as={Link}
                          to={`/transactions/${transaction.transaction_id}/qr`}
                          className="neu-btn-outline px-3 py-1 btn-sm"
                        >
                          View QR
                        </Button>
                      )}

                      {/* 2. Pending Actions */}
                      {isPending && (
                        <>
                          {/* Provider can Accept */}
                          {isProvider && (
                            <Button
                              variant="success"
                              size="sm"
                              className="rounded-pill px-3 py-1 fw-semibold shadow-sm"
                              disabled={isActionLoading}
                              onClick={() => handleAcceptTransaction(transaction)}
                            >
                              {isActionLoading ? <Spinner animation="border" size="sm" /> : 'Accept'}
                            </Button>
                          )}

                          {/* Both Provider (Decline) and Requestor (Cancel) can Cancel */}
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="rounded-pill px-3 py-1 fw-semibold"
                            disabled={isActionLoading}
                            onClick={() => {
                              setCancelModalTx(transaction);
                              setCancelError('');
                            }}
                          >
                            {isProvider ? 'Decline' : 'Cancel'}
                          </Button>
                        </>
                      )}

                      {/* 3. Accepted Actions */}
                      {isAccepted && (
                        <>
                          {/* Provider can Complete */}
                          {isProvider && (
                            <Button
                              variant="primary"
                              size="sm"
                              className="rounded-pill px-3 py-1 fw-semibold shadow-sm"
                              disabled={isActionLoading}
                              onClick={() => handleCompleteTransaction(transaction)}
                            >
                              {isActionLoading ? <Spinner animation="border" size="sm" /> : '✓ Mark Complete'}
                            </Button>
                          )}
                        </>
                      )}

                      {/* 4. Completed Actions */}
                      {isCompleted && (
                        <>
                          {isReviewed ? (
                            <Badge bg="success" className="px-2 py-2 rounded-pill d-flex align-items-center">
                              ✓ Reviewed
                            </Badge>
                          ) : (
                            isRequestor && (
                              <Button
                                className="neu-btn-primary px-3 py-1 btn-sm"
                                onClick={() => handleOpenReviewModal(transaction)}
                              >
                                ★ Rate &amp; Review
                              </Button>
                            )
                          )}
                        </>
                      )}

                      {/* 5. Cancelled State */}
                      {isCancelled && (
                        <span className="text-muted small fst-italic">Cancelled</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>

      {/* Cancel Confirmation Modal */}
      <Modal show={!!cancelModalTx} onHide={() => setCancelModalTx(null)} centered>
        <Modal.Header closeButton style={{ background: '#FFF1F2', borderBottom: '1px solid #FECDD3' }}>
          <Modal.Title className="fw-bold fs-5 text-danger">Cancel Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ background: 'var(--neu-bg)' }}>
          {cancelError && (
            <Alert variant="danger" dismissible onClose={() => setCancelError('')} className="neu-alert mb-3">
              {cancelError}
            </Alert>
          )}
          <p className="small text-muted mb-2">
            Are you sure you want to cancel booking <strong>#{cancelModalTx?.transaction_id}</strong> (
            {cancelModalTx?.service_name || 'Service'})?
          </p>
          <div className="p-3 rounded-2" style={{ background: 'var(--neu-bg-dark)' }}>
            <div className="small"><strong>Total Amount:</strong> {formatAmount(cancelModalTx?.total_topay)}</div>
            <div className="small text-muted">This booking status will be updated to Cancelled and cannot be undone.</div>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ background: 'var(--neu-bg-dark)', borderTop: '1px solid rgba(154, 172, 196, 0.3)' }}>
          <Button className="neu-btn-ghost" onClick={() => setCancelModalTx(null)} disabled={isCancelling}>
            Go Back
          </Button>
          <Button
            variant="danger"
            className="px-4 fw-semibold rounded-pill"
            disabled={isCancelling}
            onClick={handleConfirmCancel}
          >
            {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </Modal.Footer>
      </Modal>

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
