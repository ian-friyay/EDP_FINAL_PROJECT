import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Spinner, Alert, Modal } from 'react-bootstrap';
import api from '../../api/axios';

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [selectedReview, setSelectedReview] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/reviews');
      const list = res.data?.data || [];
      setReviews(list);
    } catch (err) {
      setError('Unable to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this rating and client review?')) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      setSuccessMsg('Review removed successfully.');
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to delete review.');
    }
  };

  const filtered = reviews.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.reviewer_name || '').toLowerCase().includes(q) ||
      (r.reviewed_student_name || '').toLowerCase().includes(q) ||
      (r.comment || '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* ─── BREADCRUMBS & TITLE (Image 5) ─── */}
      <div className="mb-3">
        <div className="text-muted small mb-1" style={{ fontSize: '0.82rem' }}>
          <span>Student Reviews &amp; Ratings</span> <span className="mx-1">&gt;</span> <span>List</span>
        </div>
        <h1 className="fw-bold mb-0" style={{ fontSize: '1.75rem', color: '#0f172a' }}>
          Student Reviews &amp; Ratings
        </h1>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {successMsg && <Alert variant="success" dismissible onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {/* ─── DATA TABLE CARD ─── */}
      <Card className="border shadow-xs rounded-3 bg-white" style={{ borderColor: '#e2e8f0' }}>
        {/* Search & Filter Bar */}
        <div className="p-3 border-bottom d-flex justify-content-end align-items-center gap-2" style={{ borderColor: '#e2e8f0' }}>
          <div className="position-relative" style={{ width: '260px' }}>
            <Form.Control
              type="text"
              placeholder="Search"
              size="sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pe-4 rounded-2"
              style={{ borderColor: '#cbd5e1', fontSize: '0.85rem' }}
            />
          </div>
          <Button
            variant="light"
            size="sm"
            className="border text-secondary d-flex align-items-center gap-1 rounded-2 px-2"
            style={{ borderColor: '#cbd5e1' }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            <span style={{ fontSize: '0.72rem' }}>0</span>
          </Button>
        </div>

        {/* Table */}
        <div className="table-responsive">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" size="sm" />
              <p className="mt-2 text-muted small">Loading reviews...</p>
            </div>
          ) : (
            <Table hover className="align-middle mb-0" style={{ fontSize: '0.84rem' }}>
              <thead className="bg-light text-muted" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ width: '40px' }} className="ps-3">
                    <Form.Check type="checkbox" />
                  </th>
                  <th className="fw-semibold">Reviewer</th>
                  <th className="fw-semibold">Reviewed Student</th>
                  <th className="fw-semibold">Rating <span style={{ fontSize: '0.7rem' }}>▼</span></th>
                  <th className="fw-semibold">Comment</th>
                  <th className="fw-semibold">Date <span style={{ fontSize: '0.7rem' }}>▼</span></th>
                  <th className="text-end pe-3 fw-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((r) => (
                    <tr key={r.id}>
                      <td className="ps-3">
                        <Form.Check type="checkbox" />
                      </td>
                      <td className="fw-medium text-dark">{r.reviewer_name}</td>
                      <td className="text-dark">{r.reviewed_student_name}</td>
                      <td>
                        <span className="text-warning">{'★'.repeat(Math.round(r.rating))}</span>
                        <span className="text-muted ms-1">({r.rating}/5)</span>
                      </td>
                      <td className="text-secondary">{r.comment}</td>
                      <td className="text-muted">{r.created_at}</td>
                      <td className="text-end pe-3">
                        <div className="d-flex align-items-center justify-content-end gap-3">
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-secondary text-decoration-none fw-medium d-inline-flex align-items-center gap-1"
                            onClick={() => setSelectedReview(r)}
                            style={{ fontSize: '0.8rem' }}
                          >
                            <span>👁</span> View
                          </Button>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-danger text-decoration-none fw-medium d-inline-flex align-items-center gap-1"
                            onClick={() => handleDelete(r.id)}
                            style={{ fontSize: '0.8rem' }}
                          >
                            <span>🗑</span> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">No reviews recorded.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2 text-muted" style={{ fontSize: '0.82rem', borderColor: '#e2e8f0' }}>
          <div>
            Showing 1 to {filtered.length} of {filtered.length} results
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-1">
              <span>Per page</span>
              <Form.Select size="sm" style={{ width: '70px', fontSize: '0.78rem' }} defaultValue="10">
                <option value="10">10</option>
                <option value="25">25</option>
              </Form.Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal */}
      {selectedReview && (
        <Modal show={Boolean(selectedReview)} onHide={() => setSelectedReview(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">Review Details</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4" style={{ fontSize: '0.875rem' }}>
            <div className="mb-2">
              <span className="text-muted">Reviewer:</span> <strong>{selectedReview.reviewer_name}</strong>
            </div>
            <div className="mb-2">
              <span className="text-muted">Reviewed Student:</span> <strong>{selectedReview.reviewed_student_name}</strong>
            </div>
            <div className="mb-3">
              <span className="text-muted">Rating:</span>{' '}
              <span className="text-warning fw-bold">{'★'.repeat(Math.round(selectedReview.rating))} ({selectedReview.rating} / 5)</span>
            </div>
            <div className="p-3 rounded-3 bg-light border mb-2">
              <span className="text-muted small d-block mb-1">Feedback Comment:</span>
              <p className="mb-0 text-dark">"{selectedReview.comment}"</p>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
}
