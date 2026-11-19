import { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import api from '../api/axios';

export default function ReviewModal({
  show,
  onHide,
  transaction,
  existingReview = null,
  onReviewSubmitted,
}) {
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const ratingDescriptions = {
    1: '1.0 - Needs Improvement',
    2: '2.0 - Fair Service',
    3: '3.0 - Good Experience',
    4: '4.0 - Very Good Service',
    5: '5.0 - Outstanding & Highly Recommended!',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating between 1 and 5.');
      return;
    }

    if (!comment.trim()) {
      setError('Please provide a brief feedback note about your experience.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        transaction_id: transaction?.transaction_id,
        service_id: transaction?.service_id,
        provider_id: transaction?.provider_id,
        rating: Number(rating),
        comment: comment.trim(),
      };

      const res = await api.post('/reviews', payload);
      setSuccess(res.data?.message || 'Thank you! Your review has been submitted.');

      if (onReviewSubmitted) {
        onReviewSubmitted(res.data?.review || payload);
      }

      setTimeout(() => {
        onHide();
        setSuccess('');
      }, 1400);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError(
        err.response?.data?.error ||
        err.message ||
        'Unable to submit review. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeScore = hoverRating || rating;

  return (
    <Modal show={show} onHide={onHide} centered size="md">
      <Modal.Header closeButton style={{ background: 'var(--neu-bg-dark)', borderBottom: '1px solid rgba(154, 172, 196, 0.3)' }}>
        <Modal.Title className="fw-bold fs-5" style={{ color: 'var(--neu-text)' }}>
          {existingReview ? 'Update Your Review' : 'Rate & Review Service'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4" style={{ background: 'var(--neu-bg)' }}>
        {success && (
          <Alert variant="success" className="neu-alert mb-3">
            ✓ {success}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="neu-alert mb-3">
            {error}
          </Alert>
        )}

        {/* Transaction Summary Card */}
        <div
          className="p-3 rounded-3 mb-4"
          style={{
            background: 'var(--neu-bg-dark)',
            border: '1px solid rgba(154, 172, 196, 0.35)',
          }}
        >
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="small font-monospace text-muted">
              Booking #{transaction?.transaction_id}
            </span>
            <span className="badge bg-success bg-opacity-75">Completed</span>
          </div>
          <h6 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>
            {transaction?.service_name || 'Campus Service'}
          </h6>
          <div className="small text-muted">
            Provided by: <strong className="text-dark">{transaction?.provider_name || transaction?.provider_id}</strong>
          </div>
        </div>

        <Form onSubmit={handleSubmit}>
          {/* Star Rating Picker */}
          <Form.Group className="mb-4 text-center">
            <Form.Label className="small fw-bold text-uppercase text-muted d-block mb-2">
              Select Your Rating
            </Form.Label>
            <div className="d-flex justify-content-center align-items-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  className="btn p-1 border-0 bg-transparent"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  style={{
                    fontSize: '2.4rem',
                    lineHeight: 1,
                    color: star <= activeScore ? '#f59e0b' : '#cbd5e1',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease, color 0.15s ease',
                    transform: star <= activeScore ? 'scale(1.15)' : 'scale(1)',
                  }}
                  title={`${star} Star${star > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
            </div>
            <div
              className="fw-semibold small px-3 py-1 rounded-pill d-inline-block"
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#b45309',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              {ratingDescriptions[activeScore] || `${activeScore} Stars`}
            </div>
          </Form.Group>

          {/* Review Feedback Comment */}
          <Form.Group className="mb-4" controlId="reviewComment">
            <Form.Label className="small fw-semibold text-muted">
              Your Review / Campus Feedback
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              className="neu-input"
              placeholder="Share your experience... Was the student provider professional, punctual, and helpful?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />
            <div className="form-text text-muted small mt-1">
              Your review helps maintain student accountability and campus community standards.
            </div>
          </Form.Group>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            <Button
              variant="secondary"
              className="neu-btn-ghost btn-sm"
              onClick={onHide}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="neu-btn-primary btn-sm px-4 fw-semibold"
              disabled={isSubmitting || !comment.trim()}
            >
              {isSubmitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
