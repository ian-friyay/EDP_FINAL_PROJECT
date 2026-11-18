import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Form, Row, Col, Spinner, Alert, Modal } from 'react-bootstrap';
import api from '../../api/axios';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [unlockRequests, setUnlockRequests] = useState([]);
  const [unlockLoading, setUnlockLoading] = useState(false);

  const fetchUnlockRequests = async () => {
    try {
      const res = await api.get('/admin/unlock-requests');
      const list = res.data?.data || [];
      setUnlockRequests(Array.isArray(list) ? list : []);
    } catch (err) {
      // Non-blocking
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/admin/users?${params.toString()}`);
      setUsers(res.data?.data?.data || res.data?.data || []);
    } catch (err) {
      setError('Unable to load registered student users report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchUnlockRequests();
  }, [statusFilter]);

  const handleApproveUnlock = async (reqId) => {
    if (!window.confirm('Approve this request and immediately clear the 30-day cooldown for this student?')) return;
    setUnlockLoading(true);
    try {
      await api.post(`/admin/unlock-requests/${reqId}/approve`, {
        admin_notes: 'Approved by administrator. Cooldown cleared.',
      });
      setSuccessMsg('Student profile has been unlocked successfully.');
      fetchUnlockRequests();
      fetchUsers();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to approve unlock request.');
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleRejectUnlock = async (reqId) => {
    const reason = prompt('Please enter the reason for declining this unlock request:');
    if (reason === null) return;
    setUnlockLoading(true);
    try {
      await api.post(`/admin/unlock-requests/${reqId}/reject`, {
        admin_notes: reason || 'Declined by administrator.',
      });
      setSuccessMsg('Request marked as declined.');
      fetchUnlockRequests();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to decline unlock request.');
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleDirectUnlock = async (user) => {
    if (!window.confirm(`Reset 30-day profile editing cooldown for ${user.first_name} ${user.last_name}? They will be able to edit their info and photo immediately.`)) return;
    try {
      await api.post(`/admin/users/${user.id}/unlock-profile`);
      setSuccessMsg(`Profile editing unlocked for ${user.first_name} ${user.last_name}.`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, profile_updated_at: null, profile_cooldown_days: 0, can_update_profile: true } : u))
      );
      fetchUnlockRequests();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to unlock user profile.');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleApproveStudent = async (user) => {
    if (!window.confirm(`Validate and approve ${user.first_name} ${user.last_name}'s student account? They will be permitted to log in.`)) {
      return;
    }

    try {
      await api.patch(`/admin/users/${user.id}/status`, { status: 'active' });
      setSuccessMsg(`Student account for ${user.first_name} ${user.last_name} (${user.student_id}) has been approved.`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: 'active' } : u))
      );
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to approve student account.');
    }
  };

  const handleToggleStatus = async (user, newStatus) => {
    const reason = newStatus === 'disabled'
      ? `Disable ${user.first_name}'s account per SerbisYou Terms & Conditions?`
      : `Re-enable ${user.first_name}'s account?`;

    if (!window.confirm(reason)) return;

    try {
      await api.patch(`/admin/users/${user.id}/status`, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
      setSuccessMsg(`User status updated to ${newStatus}.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to update user status.');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-primary-dark)' }}>
          Student User Reports & Validation
        </h2>
        <p className="text-muted mb-0">
          Review campus student registrations, inspect student ID proofs, and validate accounts before activation.
        </p>
      </div>

      {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}
      {successMsg && <Alert variant="success" className="rounded-3">{successMsg}</Alert>}

      {/* 10% Sun Orange Accent: Profile Unlock Requests Banner */}
      {unlockRequests.filter((r) => r.status === 'pending').length > 0 && (
        <div
          className="neu-card p-4 rounded-4 mb-4"
          style={{ borderLeft: '6px solid var(--neu-accent-orange)' }}
        >
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="fw-bold mb-0 text-dark d-flex align-items-center gap-2">
              <span className="badge rounded-pill neu-badge-orange">Action Required</span>
              Pending Profile Unlock Requests
            </h5>
            <span className="small text-muted">
              {unlockRequests.filter((r) => r.status === 'pending').length} request(s) waiting
            </span>
          </div>
          <p className="small text-muted mb-3">
            Students who recently changed their profile photo or details must wait 30 days before editing again, unless cleared by an administrator.
          </p>

          <div className="d-flex flex-column gap-2 neu-scroll-sm">
            {unlockRequests
              .filter((r) => r.status === 'pending')
              .map((req) => (
                <div
                  key={req.id}
                  className="p-3 rounded-3 bg-white d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 shadow-sm"
                >
                  <div>
                    <div className="fw-bold text-dark">{req.user_name || req.student_id} <span className="small text-muted font-monospace">({req.student_id})</span></div>
                    <div className="small text-muted">{req.email} &bull; Reason: <em>"{req.reason || 'No reason specified'}"</em></div>
                  </div>
                  <div className="d-flex gap-2">
                    <Button
                      size="sm"
                      className="neu-btn-orange rounded-pill px-3 fw-bold text-white shadow-sm"
                      onClick={() => handleApproveUnlock(req.id)}
                      disabled={unlockLoading}
                    >
                      Clear Cooldown
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      className="rounded-pill px-3 fw-semibold"
                      onClick={() => handleRejectUnlock(req.id)}
                      disabled={unlockLoading}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="neu-card p-3 rounded-4 mb-4">
        <Form onSubmit={handleSearch}>
          <Row className="g-3 align-items-center">
            <Col md={6}>
              <Form.Control
                type="text"
                placeholder="Search student by name, MMC ID, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-pill px-3"
                style={{ background: 'var(--neu-bg-light)', border: 'none', boxShadow: 'var(--neu-shadow-inset)' }}
              />
            </Col>
            <Col sm={6} md={3}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-pill px-3"
                style={{ background: 'var(--neu-bg-light)', border: 'none', boxShadow: 'var(--neu-shadow-inset)' }}
              >
                <option value="">All Account Statuses</option>
                <option value="active">Active Only</option>
                <option value="disabled">Disabled Only</option>
              </Form.Select>
            </Col>
            <Col sm={6} md={3} className="d-flex gap-2">
              <Button type="submit" className="neu-btn-primary rounded-pill px-4 fw-bold flex-grow-1">
                Filter
              </Button>
              {search && (
                <Button
                  variant="outline-secondary"
                  className="rounded-pill px-3"
                  onClick={() => {
                    setSearch('');
                    fetchUsers();
                  }}
                >
                  Clear
                </Button>
              )}
            </Col>
          </Row>
        </Form>
      </div>

      {/* Users Report Table */}
      <div className="neu-card p-4 rounded-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0" style={{ color: 'var(--neu-primary-dark)' }}>
            Registered Campus Users ({users.length})
          </h5>
          <span className="small text-muted">Showing all matching student accounts</span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Loading student directory...</p>
          </div>
        ) : users.length === 0 ? (
          <p className="text-muted text-center py-4">No users match your criteria.</p>
        ) : (
          <div className="table-responsive neu-scroll-table">
            <Table hover className="align-middle mb-0">
              <thead>
                <tr className="text-muted small text-uppercase" style={{ borderBottom: '2px solid rgba(154, 172, 196, 0.4)' }}>
                  <th>Student ID</th>
                  <th>Full Name</th>
                  <th>Contact & Email</th>
                  <th>Account Role</th>
                  <th>Status</th>
                  <th className="text-end">Verification & Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="fw-bold font-monospace" style={{ color: 'var(--neu-primary)' }}>
                      {u.student_id}
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{u.name}</div>
                      <div className="small text-muted">@{u.username}</div>
                    </td>
                    <td>
                      <div className="text-dark small">{u.email}</div>
                      <div className="small text-muted font-monospace">{u.contact_number}</div>
                    </td>
                    <td>
                      <Badge
                        bg={
                          u.user_type === 'Provider'
                            ? 'primary'
                            : u.user_type === 'Admin'
                            ? 'dark'
                            : 'info'
                        }
                        className="rounded-pill px-3 py-1"
                      >
                        {u.user_type}
                      </Badge>
                    </td>
                    <td>
                      <Badge
                        bg={u.status === 'active' ? 'success' : 'danger'}
                        className="rounded-pill px-3 py-1"
                      >
                        {u.status}
                      </Badge>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1 flex-wrap">
                        {/* Preview Student ID Button */}
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="rounded-pill px-3 py-1 small"
                          onClick={() => setPreviewImage(u.student_id_image || '/placeholder-id.png')}
                        >
                          View ID
                        </Button>

                        {/* Status Toggle Button */}
                        {u.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="outline-danger"
                            className="rounded-pill px-3 py-1 small"
                            onClick={() => handleToggleStatus(u, 'disabled')}
                          >
                            Disable
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline-success"
                            className="rounded-pill px-3 py-1 small"
                            onClick={() => handleApproveStudent(u)}
                          >
                            Approve
                          </Button>
                        )}

                        {/* Direct Unlock Button */}
                        <Button
                          size="sm"
                          className="neu-btn-orange rounded-pill px-3 py-1 small fw-bold text-white shadow-sm"
                          onClick={() => handleDirectUnlock(u)}
                          title="Reset 30-day profile cooldown"
                        >
                          Unlock Profile
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      {/* ID Proof Modal */}
      <Modal show={Boolean(previewImage)} onHide={() => setPreviewImage(null)} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold fs-5">Student Identification Proof</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center p-4">
          <div className="neu-card p-3 rounded-4 mb-3" style={{ background: '#f8fafc' }}>
            <img
              src={previewImage || '/logo.png'}
              alt="Student ID Proof"
              style={{ maxHeight: '350px', maxWidth: '100%', objectFit: 'contain', borderRadius: '12px' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/logo.png';
              }}
            />
          </div>
          <div className="small text-muted">
            Uploaded student ID proof for enrollment and campus verification.
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center">
          <Button variant="secondary" className="rounded-pill px-4" onClick={() => setPreviewImage(null)}>
            Close Preview
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
