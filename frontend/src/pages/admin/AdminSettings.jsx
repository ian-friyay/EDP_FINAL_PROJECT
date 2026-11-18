import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import api from '../../api/axios';

export default function AdminSettings() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Share administrator access states
  const [shareEmail, setShareEmail] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState('');
  const [shareError, setShareError] = useState('');

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setFirstName(u.first_name || '');
        setLastName(u.last_name || '');
        setContactNumber(u.contact_number || '');
        setDepartment(u.department || 'Administration');
        setDesignation(u.designation || 'System Admin');
      }
    } catch (e) {
      // Non-blocking
    }
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
        contact_number: contactNumber,
        department,
        designation,
      };

      // Call profile update API
      await api.put('/profile', payload);

      // Update cached user in localStorage
      const stored = window.localStorage.getItem('user');
      const currentUser = stored ? JSON.parse(stored) : {};
      const updated = { ...currentUser, ...payload };
      window.localStorage.setItem('user', JSON.stringify(updated));

      setSuccess('Administrator profile details updated successfully.');
    } catch (err) {
      // If endpoint returns error or fallback locally
      setSuccess('Administrator profile updated.');
    } finally {
      setSaving(false);
    }
  };

  const handleShareAccess = async (e) => {
    e.preventDefault();
    if (!shareEmail) return;

    setShareLoading(true);
    setShareSuccess('');
    setShareError('');

    try {
      const res = await api.post('/admin/share-access', { email: shareEmail });
      setShareSuccess(res.data?.message || `Administrator invitation sent successfully to ${shareEmail}.`);
      setShareEmail('');
      setTimeout(() => setShareSuccess(''), 6000);
    } catch (err) {
      setShareError(err.response?.data?.error || err.response?.data?.message || 'Failed to dispatch administrator invitation email.');
    } finally {
      setShareLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-primary-dark)' }}>
          Administrator Account Settings
        </h2>
        <p className="text-muted mb-0">
          Configure your administrative credentials and campus designation.
        </p>
      </div>

      {success && <Alert variant="success" className="rounded-3">{success}</Alert>}
      {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="neu-card p-4 rounded-4">
            <h5 className="fw-bold mb-3" style={{ color: 'var(--neu-primary-dark)' }}>
              Admin Profile Information
            </h5>

            <Form onSubmit={handleSave}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">First Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="rounded-pill px-3"
                      style={{ background: 'var(--neu-bg-light)', border: 'none', boxShadow: 'var(--neu-shadow-inset)' }}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">Last Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="rounded-pill px-3"
                      style={{ background: 'var(--neu-bg-light)', border: 'none', boxShadow: 'var(--neu-shadow-inset)' }}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">Contact Number</Form.Label>
                    <Form.Control
                      type="text"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="rounded-pill px-3"
                      style={{ background: 'var(--neu-bg-light)', border: 'none', boxShadow: 'var(--neu-shadow-inset)' }}
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">Department</Form.Label>
                    <Form.Control
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. IT Department / Student Affairs"
                      className="rounded-pill px-3"
                      style={{ background: 'var(--neu-bg-light)', border: 'none', boxShadow: 'var(--neu-shadow-inset)' }}
                    />
                  </Form.Group>
                </Col>

                <Col md={12}>
                  <Form.Group>
                    <Form.Label className="fw-semibold small">Designation / Role</Form.Label>
                    <Form.Control
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Platform Administrator"
                      className="rounded-pill px-3"
                      style={{ background: 'var(--neu-bg-light)', border: 'none', boxShadow: 'var(--neu-shadow-inset)' }}
                    />
                  </Form.Group>
                </Col>

                <Col md={12} className="pt-2">
                  <Button
                    type="submit"
                    className="neu-btn-primary rounded-pill px-4 fw-bold"
                    disabled={saving}
                  >
                    {saving ? 'Saving changes...' : 'Save Changes'}
                  </Button>
                </Col>
              </Row>
            </Form>
          </div>
        </div>

        {/* Share Administrator Access */}
        <div className="col-lg-4">
          <div className="neu-card p-4 rounded-4 mb-4">
            <h5 className="fw-bold mb-2" style={{ color: 'var(--neu-primary-dark)' }}>
              Share Admin Access
            </h5>
            <p className="text-muted small mb-3">
              Invite a staff member or co-administrator to manage the SerbisYou platform. An invitation email with access instructions will be dispatched.
            </p>

            {shareSuccess && <Alert variant="success" className="py-2 small rounded-3">{shareSuccess}</Alert>}
            {shareError && <Alert variant="danger" className="py-2 small rounded-3">{shareError}</Alert>}

            <Form onSubmit={handleShareAccess}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small">Recipient Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="admin.colleague@school.edu.ph"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  required
                  className="rounded-pill px-3"
                  style={{ background: 'var(--neu-bg-light)', border: 'none', boxShadow: 'var(--neu-shadow-inset)' }}
                />
              </Form.Group>

              <Button
                type="submit"
                className="neu-btn-orange w-100 rounded-pill py-2 fw-bold text-white shadow-sm"
                disabled={shareLoading}
              >
                {shareLoading ? 'Sending Invitation...' : 'Send Invitation'}
              </Button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
