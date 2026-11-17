import { useEffect, useState, useMemo } from 'react';
import { Row, Col, Badge, Button, Table, Form, Modal, Alert, Tabs, Tab, Spinner } from 'react-bootstrap';
import api from '../api/axios';

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeServices: 0,
    totalTransactions: 0,
    pendingVerifications: 0,
    platformRevenue: 0,
  });

  const [verifications, setVerifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('verifications');
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Search in user list
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Document Inspection Modal State
  const [inspectDocUrl, setInspectDocUrl] = useState(null);

  // Reject Modal State
  const [rejectingUser, setRejectingUser] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const fetchAdminData = async () => {
    setIsLoading(true);
    setActionError('');
    try {
      const [statsRes, verifRes, usersRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: {} })),
        api.get('/admin/verifications').catch(() => ({ data: { pendingVerifications: [] } })),
        api.get('/admin/users').catch(() => ({ data: { users: [] } })),
      ]);

      setStats({
        totalUsers: statsRes.data.totalUsers || 0,
        activeServices: statsRes.data.activeServices || 0,
        totalTransactions: statsRes.data.totalTransactions || 0,
        pendingVerifications: statsRes.data.pendingVerifications || 0,
        platformRevenue: statsRes.data.platformRevenue || 0,
      });

      setVerifications(verifRes.data.pendingVerifications || []);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      setActionError('Failed to load administrative console data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Handle Verify / Reject
  const handleUpdateVerification = async (userId, status, notes = '') => {
    setIsProcessingAction(true);
    setActionError('');
    setActionSuccess('');

    try {
      const { data } = await api.patch(`/admin/verifications/${userId}`, { status, notes });
      setActionSuccess(data.message || `Provider status set to ${status}.`);
      setRejectingUser(null);
      setRejectNotes('');
      await fetchAdminData();
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || 'Action failed.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Handle User Toggle Status
  const handleToggleUser = async (userId, currentActive) => {
    setIsProcessingAction(true);
    setActionError('');
    setActionSuccess('');

    try {
      const newStatus = !currentActive;
      const { data } = await api.patch(`/admin/users/${userId}/toggle-status`, { is_active: newStatus });
      setActionSuccess(data.message || 'User status updated successfully.');
      await fetchAdminData();
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || 'Failed to update user status.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    const term = userSearchTerm.toLowerCase();
    return users.filter((u) => {
      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
      const email = (u.email || '').toLowerCase();
      const id = (u.user_id || '').toLowerCase();
      return fullName.includes(term) || email.includes(term) || id.includes(term);
    });
  }, [users, userSearchTerm]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>Admin Operations Console</h2>
          <p className="text-muted mb-0">Platform oversight, provider verification queue, and user management.</p>
        </div>
        <Button className="neu-btn-ghost btn-sm" onClick={fetchAdminData} disabled={isLoading}>
          {isLoading ? 'Refreshing...' : '↻ Refresh Data'}
        </Button>
      </div>

      {actionSuccess && (
        <Alert variant="success" dismissible onClose={() => setActionSuccess('')} className="neu-alert mb-4">
          {actionSuccess}
        </Alert>
      )}

      {actionError && (
        <Alert variant="danger" dismissible onClose={() => setActionError('')} className="neu-alert mb-4">
          {actionError}
        </Alert>
      )}

      {/* Metrics Row */}
      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <div className="neu-metric-card h-100">
            <div className="text-muted small text-uppercase fw-semibold mb-1">Registered Users</div>
            <div className="fs-3 fw-bold" style={{ color: '#063a8f' }}>{stats.totalUsers}</div>
            <div className="small text-muted mt-1">Platform-wide accounts</div>
          </div>
        </Col>
        <Col sm={6} xl={3}>
          <div className="neu-metric-card h-100">
            <div className="text-muted small text-uppercase fw-semibold mb-1">Active Services</div>
            <div className="fs-3 fw-bold" style={{ color: '#063a8f' }}>{stats.activeServices}</div>
            <div className="small text-muted mt-1">Live in marketplace</div>
          </div>
        </Col>
        <Col sm={6} xl={3}>
          <div className="neu-metric-card h-100">
            <div className="text-muted small text-uppercase fw-semibold mb-1">Pending Verifications</div>
            <div className="fs-3 fw-bold" style={{ color: stats.pendingVerifications > 0 ? '#d97706' : '#063a8f' }}>
              {stats.pendingVerifications}
            </div>
            <div className="small text-muted mt-1">Requires review</div>
          </div>
        </Col>
        <Col sm={6} xl={3}>
          <div className="neu-metric-card h-100">
            <div className="text-muted small text-uppercase fw-semibold mb-1">Platform Revenue</div>
            <div className="fs-3 fw-bold" style={{ color: '#059669' }}>
              ₱{Number(stats.platformRevenue || 0).toFixed(2)}
            </div>
            <div className="small text-muted mt-1">₱5 booking + 5% comm</div>
          </div>
        </Col>
      </Row>

      {/* Admin Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k || 'verifications')}
        className="mb-4 neu-tabs"
      >
        <Tab
          eventKey="verifications"
          title={`Provider Verifications (${verifications.length})`}
        />
        <Tab
          eventKey="users"
          title={`User Management (${users.length})`}
        />
        <Tab
          eventKey="system"
          title="System Health &amp; Environment"
        />
      </Tabs>

      {/* TAB 1: Provider Verifications */}
      {activeTab === 'verifications' && (
        <div className="neu-card p-3 p-md-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>
              Pending Provider Applications
            </h5>
            <small className="text-muted">Review submitted government IDs or clearances</small>
          </div>

          {isLoading ? (
            <div className="text-center py-5 text-muted">
              <Spinner animation="border" size="sm" className="me-2" />
              Loading verification queue...
            </div>
          ) : verifications.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" viewBox="0 0 16 16" className="mb-2 d-block mx-auto opacity-50">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
              </svg>
              No pending provider verifications in queue. All applications reviewed!
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead>
                  <tr style={{ background: 'var(--neu-bg-dark)' }}>
                    <th>Provider ID</th>
                    <th>Full Name</th>
                    <th>Contact Details</th>
                    <th>Submitted ID Document</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {verifications.map((provider) => (
                    <tr key={provider.user_id}>
                      <td className="font-monospace fw-bold" style={{ color: 'var(--neu-primary)' }}>
                        {provider.user_id}
                      </td>
                      <td>
                        <div className="fw-semibold" style={{ color: 'var(--neu-text)' }}>
                          {`${provider.first_name || ''} ${provider.last_name || ''}`.trim() || 'Provider'}
                        </div>
                        <small className="text-muted">@{provider.username || 'username'}</small>
                      </td>
                      <td>
                        <div>{provider.email || 'No email'}</div>
                        <small className="text-muted">{provider.contact_number || 'No contact'}</small>
                      </td>
                      <td>
                        {provider.id_document_url ? (
                          <Button
                            className="neu-btn-outline px-3 py-1 btn-sm"
                            onClick={() => setInspectDocUrl(provider.id_document_url)}
                          >
                            Inspect ID
                          </Button>
                        ) : (
                          <span className="text-muted small">No document file</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            className="rounded-pill px-3 fw-semibold shadow-sm"
                            disabled={isProcessingAction}
                            onClick={() => handleUpdateVerification(provider.user_id, 'verified')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            className="rounded-pill px-3 fw-semibold"
                            disabled={isProcessingAction}
                            onClick={() => setRejectingUser(provider)}
                          >
                            Reject
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
      )}

      {/* TAB 2: User Management */}
      {activeTab === 'users' && (
        <div className="neu-card p-3 p-md-4">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h5 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>All Platform Users</h5>
              <small className="text-muted">Total: {users.length} registered accounts</small>
            </div>
            <div style={{ maxWidth: 300 }} className="w-100">
              <Form.Control
                type="text"
                size="sm"
                className="neu-input"
                placeholder="Search user name, email, or ID..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead>
                <tr style={{ background: 'var(--neu-bg-dark)' }}>
                  <th>User ID</th>
                  <th>Name / Email</th>
                  <th>Role</th>
                  <th>Verification</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isActive = u.is_active !== false;
                    return (
                      <tr key={u.user_id}>
                        <td className="font-monospace fw-semibold">{u.user_id}</td>
                        <td>
                          <div className="fw-semibold" style={{ color: 'var(--neu-text)' }}>
                            {`${u.first_name || ''} ${u.last_name || ''}`.trim() || 'User'}
                          </div>
                          <small className="text-muted">{u.email}</small>
                        </td>
                        <td>
                          <Badge bg={u.user_type === 'Provider' ? 'success' : 'primary'} className="rounded-pill">
                            {u.user_type || 'User'}
                          </Badge>
                        </td>
                        <td>
                          <Badge
                            bg={
                              u.verification_status === 'verified'
                                ? 'success'
                                : u.verification_status === 'pending'
                                ? 'warning'
                                : u.verification_status === 'rejected'
                                ? 'danger'
                                : 'secondary'
                            }
                            text={u.verification_status === 'pending' ? 'dark' : 'white'}
                            className="rounded-pill"
                          >
                            {u.verification_status || 'unverified'}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={isActive ? 'success' : 'danger'} className="rounded-pill">
                            {isActive ? 'Active' : 'Suspended'}
                          </Badge>
                        </td>
                        <td>
                          <Button
                            variant={isActive ? 'outline-danger' : 'outline-success'}
                            size="sm"
                            className="rounded-pill px-3 py-1"
                            disabled={isProcessingAction}
                            onClick={() => handleToggleUser(u.user_id, isActive)}
                          >
                            {isActive ? 'Suspend' : 'Reactivate'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>
        </div>
      )}

      {/* TAB 3: System Health */}
      {activeTab === 'system' && (
        <div className="neu-card p-4">
          <h5 className="fw-bold mb-3" style={{ color: 'var(--neu-text)' }}>System Diagnostics &amp; Operational Status</h5>
          <Row className="g-3">
            <Col md={6}>
              <div className="neu-card-inset p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold">Supabase PostgreSQL Database</span>
                  <Badge bg="success">Connected</Badge>
                </div>
                <small className="text-muted">
                  Tables: <code>users</code>, <code>services</code>, <code>transactions</code>, <code>notifications</code>, <code>reviews</code>
                </small>
              </div>
            </Col>
            <Col md={6}>
              <div className="neu-card-inset p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold">Email Service (SMTP)</span>
                  <Badge bg="info">Dev Mode Fallback Active</Badge>
                </div>
                <small className="text-muted">
                  OTPs and password reset links print to server terminal when SMTP credentials are not live.
                </small>
              </div>
            </Col>
            <Col md={6}>
              <div className="neu-card-inset p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold">Real-Time Messaging (Socket.io)</span>
                  <Badge bg="success">Active</Badge>
                </div>
                <small className="text-muted">
                  Live chat messages, unread message badges, and instant notification pushes.
                </small>
              </div>
            </Col>
            <Col md={6}>
              <div className="neu-card-inset p-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold">Storage Service</span>
                  <Badge bg="success">Active (Inline &amp; Bucket)</Badge>
                </div>
                <small className="text-muted">
                  Supports Base64 upload fallbacks and direct Supabase storage buckets.
                </small>
              </div>
            </Col>
          </Row>
        </div>
      )}

      {/* Document Inspector Modal */}
      <Modal show={!!inspectDocUrl} onHide={() => setInspectDocUrl(null)} size="lg" centered>
        <Modal.Header closeButton style={{ background: 'var(--neu-bg-dark)', borderBottom: '1px solid rgba(154, 172, 196, 0.3)' }}>
          <Modal.Title className="fw-bold fs-5">Inspect Provider Verification Document</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4 text-center" style={{ background: 'var(--neu-bg)' }}>
          {inspectDocUrl && (inspectDocUrl.startsWith('data:application/pdf') || inspectDocUrl.includes('.pdf')) ? (
            <div className="py-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16" className="text-danger mb-3">
                <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
              </svg>
              <h5>PDF Document Submitted</h5>
              <a href={inspectDocUrl} target="_blank" rel="noreferrer" className="btn neu-btn-primary mt-2">
                Open PDF in New Window
              </a>
            </div>
          ) : (
            <img
              src={inspectDocUrl}
              alt="Verification Document"
              className="img-fluid rounded border shadow-sm"
              style={{ maxHeight: '500px' }}
            />
          )}
        </Modal.Body>
        <Modal.Footer style={{ background: 'var(--neu-bg-dark)', borderTop: '1px solid rgba(154, 172, 196, 0.3)' }}>
          <Button className="neu-btn-ghost" onClick={() => setInspectDocUrl(null)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Rejection Notes Modal */}
      <Modal show={!!rejectingUser} onHide={() => setRejectingUser(null)} centered>
        <Modal.Header closeButton style={{ background: '#FFF1F2', borderBottom: '1px solid #FECDD3' }}>
          <Modal.Title className="fw-bold fs-5 text-danger">Reject Provider Application</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ background: 'var(--neu-bg)' }}>
          <p className="small text-muted mb-3">
            Please provide a reason for rejecting the ID document for provider <strong>{rejectingUser?.user_id}</strong>. This note will be shown to them in their profile.
          </p>
          <Form.Group controlId="rejectionNotesText">
            <Form.Label className="small fw-semibold text-muted">Rejection Reason</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              className="neu-input"
              placeholder="e.g. Document image is blurred; please upload a clearer copy of your Government ID."
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ background: 'var(--neu-bg-dark)', borderTop: '1px solid rgba(154, 172, 196, 0.3)' }}>
          <Button className="neu-btn-ghost" onClick={() => setRejectingUser(null)} disabled={isProcessingAction}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="px-4 fw-semibold rounded-pill"
            disabled={isProcessingAction}
            onClick={() => handleUpdateVerification(rejectingUser.user_id, 'rejected', rejectNotes)}
          >
            {isProcessingAction ? 'Rejecting...' : 'Confirm Rejection'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
