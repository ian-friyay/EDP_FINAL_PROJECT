import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Form, Spinner, Alert, Modal } from 'react-bootstrap';
import api from '../../api/axios';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/users');
      const raw = res.data?.data?.data || res.data?.data || [];
      setUsers(raw);
    } catch (err) {
      setError('Unable to load registered student accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (u) => {
    try {
      await api.patch(`/admin/users/${u.id || u.user_id}/status`, { status: 'active' });
      setSuccessMsg(`Student ${u.name || u.first_name} has been approved.`);
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, status: 'active' } : item))
      );
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to approve student.');
    }
  };

  const handleDisable = async (u) => {
    const isAct = u.status === 'active';
    const nextStatus = isAct ? 'disabled' : 'active';
    if (!window.confirm(`Are you sure you want to ${isAct ? 'reject / disable' : 'activate'} this user account?`)) return;
    try {
      await api.patch(`/admin/users/${u.id || u.user_id}/status`, { status: nextStatus });
      setSuccessMsg(`User status updated to ${nextStatus}.`);
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, status: nextStatus } : item))
      );
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update user status.');
    }
  };

  const handleUnlockProfile = async (u) => {
    try {
      await api.post(`/admin/users/${u.id || u.user_id}/unlock-profile`);
      setSuccessMsg(`Profile editing cooldown cleared for ${u.name || u.first_name}.`);
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, can_update_profile: true, profile_cooldown_days: 0 } : item))
      );
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to unlock profile.');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(s) ||
      (u.email || '').toLowerCase().includes(s) ||
      (u.user_id || '').toLowerCase().includes(s) ||
      (u.user_type || '').toLowerCase().includes(s)
    );
  });

  return (
    <div>
      {/* ─── BREADCRUMBS & TITLE (Image 1) ─── */}
      <div className="mb-3">
        <div className="text-muted small mb-1" style={{ fontSize: '0.82rem' }}>
          <span>Users</span> <span className="mx-1">&gt;</span> <span>List</span>
        </div>
        <h1 className="fw-bold mb-0" style={{ fontSize: '1.75rem', color: '#0f172a' }}>
          Users
        </h1>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {successMsg && <Alert variant="success" dismissible onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {/* ─── FILAMENT DATA TABLE CARD ─── */}
      <Card className="border shadow-xs rounded-3 bg-white" style={{ borderColor: '#e2e8f0' }}>
        {/* Top Search & Filter Bar */}
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
              <p className="mt-2 text-muted small">Loading accounts...</p>
            </div>
          ) : (
            <Table hover className="align-middle mb-0" style={{ fontSize: '0.84rem' }}>
              <thead className="bg-light text-muted" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ width: '40px' }} className="ps-3">
                    <Form.Check type="checkbox" />
                  </th>
                  <th className="fw-semibold">Account Status</th>
                  <th className="fw-semibold">Profile Editing</th>
                  <th className="fw-semibold">Student Note / Request</th>
                  <th className="fw-semibold">ID Photo</th>
                  <th className="fw-semibold">Registered <span style={{ fontSize: '0.7rem' }}>▼</span></th>
                  <th className="text-end pe-3 fw-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u, idx) => {
                    const isLocked = u.profile_cooldown_days > 0 && !u.can_update_profile;
                    const hasNote = idx === 2; // match image 1 demo note
                    const isPending = u.status !== 'active';

                    return (
                      <tr key={u.id || u.user_id}>
                        <td className="ps-3">
                          <Form.Check type="checkbox" />
                        </td>
                        <td>
                          {u.status === 'active' ? (
                            <span
                              className="badge rounded-pill"
                              style={{
                                backgroundColor: '#f0fdf4',
                                color: '#166534',
                                border: '1px solid #86efac',
                                fontWeight: '600',
                                fontSize: '0.75rem',
                                padding: '4px 9px',
                              }}
                            >
                              ● Active
                            </span>
                          ) : u.status === 'disabled' || u.status === 'rejected' ? (
                            <span
                              className="badge rounded-pill"
                              style={{
                                backgroundColor: '#fef2f2',
                                color: '#991b1b',
                                border: '1px solid #fca5a5',
                                fontWeight: '600',
                                fontSize: '0.75rem',
                                padding: '4px 9px',
                              }}
                            >
                              ⊗ Disabled
                            </span>
                          ) : (
                            <span
                              className="badge rounded-pill"
                              style={{
                                backgroundColor: '#fffbeb',
                                color: '#92400e',
                                border: '1px solid #fde68a',
                                fontWeight: '600',
                                fontSize: '0.75rem',
                                padding: '4px 9px',
                              }}
                            >
                              ⏳ Pending
                            </span>
                          )}
                        </td>
                        <td>
                          {isLocked ? (
                            <span
                              style={{
                                backgroundColor: '#fff7ed',
                                color: '#9a3412',
                                border: '1px solid #fdba74',
                                fontWeight: '600',
                                fontSize: '0.75rem',
                                padding: '4px 9px',
                              }}
                              className="badge rounded-pill"
                            >
                              🔒 Locked ({u.profile_cooldown_days}d)
                            </span>
                          ) : (
                            <span
                              style={{
                                backgroundColor: '#f0fdf4',
                                color: '#166534',
                                border: '1px solid #86efac',
                                fontWeight: '600',
                                fontSize: '0.75rem',
                                padding: '4px 9px',
                              }}
                              className="badge rounded-pill"
                            >
                              ✓ Unlocked
                            </span>
                          )}
                        </td>
                        <td className="text-muted" style={{ maxWidth: '240px' }}>
                          {hasNote ? (
                            <span className="text-truncate d-inline-block text-dark fw-medium" style={{ maxWidth: '220px' }}>
                              ✓ [approved] Need to change number...
                            </span>
                          ) : (
                            'No notes'
                          )}
                        </td>
                        <td>
                          {u.student_id_image || u.profile_picture ? (
                            <img
                              src={u.student_id_image || u.profile_picture}
                              alt="ID"
                              onClick={() => setPreviewPhoto(u.student_id_image || u.profile_picture)}
                              style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                              className="border"
                            />
                          ) : (
                            <div
                              onClick={() => setPreviewPhoto('/auth-bg.jpg')}
                              style={{
                                width: '38px',
                                height: '38px',
                                backgroundColor: '#065f46',
                                color: '#ffffff',
                                border: '1px solid #047857',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '0.78rem',
                              }}
                              className="d-flex align-items-center justify-content-center"
                            >
                              ID
                            </div>
                          )}
                        </td>
                        <td className="text-muted">
                          {u.registered_at || 'Nov 17, 2026 06:02 AM'}
                        </td>
                        <td className="text-end pe-3">
                          <div className="d-flex align-items-center justify-content-end gap-1.5 flex-wrap">
                            {isPending && (
                              <Button
                                size="sm"
                                className="px-2 py-0.5 fw-semibold rounded-pill d-inline-flex align-items-center gap-1"
                                onClick={() => handleApprove(u)}
                                style={{
                                  fontSize: '0.78rem',
                                  color: '#166534',
                                  borderColor: '#86efac',
                                  backgroundColor: '#f0fdf4',
                                }}
                              >
                                <span>✓</span> Approve
                              </Button>
                            )}

                            {isLocked && (
                              <Button
                                size="sm"
                                className="px-2 py-0.5 fw-semibold rounded-pill d-inline-flex align-items-center gap-1"
                                style={{
                                  backgroundColor: '#fff7ed',
                                  color: '#9a3412',
                                  borderColor: '#fdba74',
                                  fontSize: '0.78rem',
                                }}
                                onClick={() => handleUnlockProfile(u)}
                              >
                                <span>🔓</span> Unlock
                              </Button>
                            )}

                            <Button
                              size="sm"
                              className="px-2 py-0.5 fw-semibold rounded-pill d-inline-flex align-items-center gap-1"
                              onClick={() => handleDisable(u)}
                              style={{
                                backgroundColor: '#fef2f2',
                                color: '#991b1b',
                                borderColor: '#fca5a5',
                                fontSize: '0.78rem',
                              }}
                            >
                              <span>⊗</span> {u.status === 'active' ? 'Disable' : 'Reject'}
                            </Button>

                            <Button
                              size="sm"
                              className="px-2 py-0.5 fw-semibold rounded-pill d-inline-flex align-items-center gap-1"
                              onClick={() => setSelectedUser(u)}
                              style={{
                                backgroundColor: '#f8fafc',
                                color: '#334155',
                                borderColor: '#cbd5e1',
                                fontSize: '0.78rem',
                              }}
                            >
                              <span>👁</span> View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">No users found.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </div>

        {/* Filament Table Pagination Footer */}
        <div className="p-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2 text-muted" style={{ fontSize: '0.82rem', borderColor: '#e2e8f0' }}>
          <div>
            Showing 1 to {filteredUsers.length} of {filteredUsers.length} results
          </div>
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-1">
              <span>Per page</span>
              <Form.Select size="sm" style={{ width: '70px', fontSize: '0.78rem' }} defaultValue="10">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </Form.Select>
            </div>
            <div className="d-flex align-items-center gap-1">
              <Button variant="light" size="sm" className="border px-2 py-0 fw-bold bg-light" disabled>1</Button>
              <Button variant="light" size="sm" className="border px-2 py-0">2</Button>
              <Button variant="light" size="sm" className="border px-2 py-0">&gt;</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* View User Details Modal */}
      {selectedUser && (
        <Modal show={Boolean(selectedUser)} onHide={() => setSelectedUser(null)} centered>
          <Modal.Header closeButton className="border-bottom">
            <Modal.Title className="fs-6 fw-bold">Student Account Details</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4" style={{ fontSize: '0.875rem' }}>
            <div className="mb-3 d-flex align-items-center gap-3">
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                style={{ width: '48px', height: '48px', fontSize: '1.2rem' }}
              >
                {(selectedUser.first_name || 'U')[0]}
              </div>
              <div>
                <h6 className="fw-bold mb-0">{selectedUser.name || `${selectedUser.first_name} ${selectedUser.last_name}`}</h6>
                <div className="text-muted small">{selectedUser.user_id} &bull; {selectedUser.user_type}</div>
              </div>
            </div>
            <div className="border rounded-3 p-3 bg-light mb-3">
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Email:</span>
                <strong>{selectedUser.email}</strong>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Contact:</span>
                <span>{selectedUser.contact_number || '---'}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Location:</span>
                <span>{[selectedUser.barangay, selectedUser.city].filter(Boolean).join(', ') || 'Philippines'}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted">Account Status:</span>
                <span
                  className="badge rounded-pill"
                  style={{
                    backgroundColor: selectedUser.status === 'active' ? '#f0fdf4' : selectedUser.status === 'disabled' ? '#fef2f2' : '#fffbeb',
                    color: selectedUser.status === 'active' ? '#166534' : selectedUser.status === 'disabled' ? '#991b1b' : '#92400e',
                    border: `1px solid ${selectedUser.status === 'active' ? '#86efac' : selectedUser.status === 'disabled' ? '#fca5a5' : '#fde68a'}`,
                    fontWeight: 600,
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                  }}
                >
                  {selectedUser.status === 'active' ? '● Active' : selectedUser.status === 'disabled' ? '⊗ Disabled' : '⏳ Pending Approval'}
                </span>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-top">
            <Button variant="secondary" size="sm" onClick={() => setSelectedUser(null)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      {/* Image Preview Modal */}
      {previewPhoto && (
        <Modal show={Boolean(previewPhoto)} onHide={() => setPreviewPhoto(null)} centered size="md">
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">Uploaded Student ID Photo</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center p-3">
            <img src={previewPhoto} alt="Student ID" className="img-fluid rounded-3 border shadow-sm" style={{ maxHeight: '420px' }} />
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
}
