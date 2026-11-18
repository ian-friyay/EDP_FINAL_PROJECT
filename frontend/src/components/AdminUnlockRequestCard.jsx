import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Badge, Spinner, Row, Col } from 'react-bootstrap';
import api from '../api/axios';
import ConfirmationModal from './ConfirmationModal';

export default function AdminUnlockRequestCard({ user, isCooldownActive, cooldownDays, onUnlocked }) {
  const [requestType, setRequestType] = useState('profile_unlock');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [alertMsg, setAlertMsg] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.get('/profile/unlock-requests');
      setHistory(res.data?.data || []);
    } catch (err) {
      // Non-blocking
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!notes.trim()) return;
    if (notes.trim().length < 10) {
      setAlertMsg({ type: 'warning', text: 'Please provide at least 10 characters explaining your concern.' });
      return;
    }
    setAlertMsg(null);
    setShowConfirmModal(true);
  };

  const executeSubmitRequest = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    setAlertMsg(null);
    try {
      const res = await api.post('/profile/unlock-request', {
        request_type: requestType,
        notes: notes.trim(),
        location: [user?.barangay, user?.city, user?.province, user?.region].filter(Boolean).join(', ') || 'MinSU Victoria Campus',
      });
      setAlertMsg({
        type: 'success',
        text: 'Your unlock request and note have been submitted to the administrator! You will be notified once reviewed.',
      });
      setNotes('');
      fetchHistory();
    } catch (err) {
      setAlertMsg({
        type: 'danger',
        text: err.response?.data?.message || err.response?.data?.error || 'Failed to submit request to administrator.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const hasPending = history.some((h) => h.status === 'pending');

  return (
    <div id="admin-unlock-section" className="mt-4">
      {/* Campus & Community Location Card */}
      <Card className="neu-card border-0 mb-4">
        <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white"
              style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #1e3a8a, #2563eb)' }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <h5 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>Campus & Community Location</h5>
          </div>
          <Badge bg="primary-subtle" className="text-primary border border-primary-subtle px-3 py-1 rounded-pill">
            Mindoro State University (MinSU)
          </Badge>
        </Card.Header>
        <Card.Body className="p-4">
          <Row className="g-3">
            <Col sm={6} md={3}>
              <div className="neu-card-inset p-3">
                <span className="text-muted small d-block">Region</span>
                <strong className="small" style={{ color: 'var(--neu-text)' }}>{user?.region || 'MIMAROPA - 4B'}</strong>
              </div>
            </Col>
            <Col sm={6} md={3}>
              <div className="neu-card-inset p-3">
                <span className="text-muted small d-block">Province</span>
                <strong className="small" style={{ color: 'var(--neu-text)' }}>{user?.province || 'Oriental Mindoro'}</strong>
              </div>
            </Col>
            <Col sm={6} md={3}>
              <div className="neu-card-inset p-3">
                <span className="text-muted small d-block">City / Municipality</span>
                <strong className="small" style={{ color: 'var(--neu-text)' }}>{user?.city || 'Victoria'}</strong>
              </div>
            </Col>
            <Col sm={6} md={3}>
              <div className="neu-card-inset p-3">
                <span className="text-muted small d-block">Barangay</span>
                <strong className="small" style={{ color: 'var(--neu-text)' }}>{user?.barangay || 'Poblacion'}</strong>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Student Account Summary & Direct Note to Admin Section */}
      <Card className="neu-card border-0 mb-4">
        <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white"
              style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #ff7828, #ea580c)',
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </div>
            <div>
              <h5 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>Direct Admin Request & Notes</h5>
              <div className="text-muted small">Need early profile unlock or assistance? Send your concerns directly to the campus admin.</div>
            </div>
          </div>
          {isCooldownActive ? (
            <Badge bg="warning" text="dark" className="px-3 py-1 rounded-pill fw-semibold">
              🕒 Cooldown Active ({cooldownDays}d remaining)
            </Badge>
          ) : (
            <Badge bg="success" className="px-3 py-1 rounded-pill fw-semibold">
              ✓ Profile Editing Unlocked
            </Badge>
          )}
        </Card.Header>

        <Card.Body className="p-4">
          {alertMsg && <Alert variant={alertMsg.type} className="rounded-3">{alertMsg.text}</Alert>}

          {/* Student Info Account Snapshot */}
          <div className="p-3 mb-4 rounded-4 neu-card-inset">
            <span className="fw-bold small text-primary d-block mb-2">Student Account Snapshot</span>
            <Row className="g-2 small text-muted">
              <Col sm={6} md={3}>
                <div><strong>Student ID:</strong> {user?.student_id || user?.user_id || 'N/A'}</div>
              </Col>
              <Col sm={6} md={3}>
                <div><strong>Full Name:</strong> {user?.first_name} {user?.last_name}</div>
              </Col>
              <Col sm={6} md={3}>
                <div><strong>Username:</strong> @{user?.username}</div>
              </Col>
              <Col sm={6} md={3}>
                <div><strong>Email:</strong> {user?.email}</div>
              </Col>
            </Row>
          </div>

          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="requestTypeSelect">
                  <Form.Label className="fw-semibold small">Request Concern Category</Form.Label>
                  <Form.Select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    className="neu-select"
                    disabled={submitting}
                  >
                    <option value="profile_unlock">Early Profile Unlock (30-day Cooldown Bypass)</option>
                    <option value="contact_change">Emergency Contact Number Correction</option>
                    <option value="identity_update">Legal Student Name or Campus Detail Update</option>
                    <option value="general_concern">Other Support / Administrative Inquiry</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={12}>
                <Form.Group controlId="notesTextarea">
                  <Form.Label className="fw-semibold small">
                    Explain your concern or reason for early unlock <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Provide details about why you need to edit your profile early (e.g. changed primary campus number, updated service availability)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="neu-input"
                    disabled={submitting}
                    required
                  />
                  <Form.Text className="text-muted small">
                    Minimum 10 characters required. The administrator reviews this directly in the Admin Portal.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <div className="mt-3 d-flex justify-content-end">
              <Button
                type="submit"
                className="neu-btn-primary rounded-pill px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2"
                disabled={submitting || !notes.trim() || notes.trim().length < 10}
              >
                {submitting && <Spinner size="sm" animation="border" />}
                <span>Submit Note to Admin</span>
              </Button>
            </div>
          </Form>

          {/* History of Requests */}
          <div className="mt-4 pt-3 border-top" style={{ borderColor: 'rgba(154, 172, 196, 0.3)' }}>
            <h6 className="fw-bold mb-3" style={{ color: 'var(--neu-text)' }}>Your Request History</h6>
            {loadingHistory ? (
              <div className="text-center py-3 text-muted small">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="p-3 text-muted text-center small neu-card-inset">
                No past requests submitted yet.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {history.map((item) => (
                  <div key={item.id} className="p-3 rounded-3 neu-card-inset">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-1">
                      <span className="fw-bold small" style={{ color: 'var(--neu-text)' }}>
                        {item.request_type?.replace(/_/g, ' ')?.toUpperCase()}
                      </span>
                      <Badge
                        bg={item.status === 'pending' ? 'warning' : (item.status === 'approved' ? 'success' : 'danger')}
                        text={item.status === 'pending' ? 'dark' : 'white'}
                        className="rounded-pill px-2 py-1 small"
                      >
                        {item.status === 'pending' ? '⏳ Pending Review' : (item.status === 'approved' ? '✓ Approved & Unlocked' : '✕ Declined')}
                      </Badge>
                    </div>
                    <p className="mb-1 small text-dark" style={{ lineHeight: '1.4' }}>
                      "{item.notes}"
                    </p>
                    {item.admin_notes && (
                      <div className="small text-success mt-1">
                        <strong>Admin Feedback:</strong> {item.admin_notes}
                      </div>
                    )}
                    <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>
                      Submitted: {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card.Body>
      </Card>

      <ConfirmationModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirm={executeSubmitRequest}
        title="Submit Note to Campus Administrator?"
        message="Your request will be dispatched to the platform administrators for validation."
        submessage={notes}
        confirmText="Yes, Send Note"
        confirmVariant="primary"
        loading={submitting}
      />
    </div>
  );
}
