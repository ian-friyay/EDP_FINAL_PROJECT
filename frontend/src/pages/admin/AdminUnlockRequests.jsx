import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Form, Spinner, Alert, Modal } from 'react-bootstrap';
import api from '../../api/axios';

export default function AdminUnlockRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/unlock-requests');
      const list = res.data?.data || [];
      // If store is empty, seed demo requests matching Image 2
      if (list.length === 0) {
        setRequests([
          {
            id: 'REQ-101',
            student_name: 'Phaniie Phanie',
            student_id: 'MMC-0008',
            request_type: 'Cooldown Unlock',
            notes: 'Need to change the number again',
            location: 'Guinobatan, Calapan City, Oriental Mindoro',
            status: 'approved',
            created_at: 'Nov 17, 2026 05:54 AM',
          },
          {
            id: 'REQ-102',
            student_name: 'Phaniie Phanie',
            student_id: 'MMC-0008',
            request_type: 'Cooldown Unlock',
            notes: 'I need to change my number',
            location: 'Guinobatan, Calapan City, Oriental Mindoro',
            status: 'approved',
            created_at: 'Nov 17, 2026 05:48 AM',
          },
          {
            id: 'REQ-103',
            student_name: 'Phaniie Phanie',
            student_id: 'MMC-0008',
            request_type: 'Cooldown Unlock',
            notes: 'I need to edit some of my account info',
            location: 'Guinobatan, Calapan City, Oriental Mindoro',
            status: 'approved',
            created_at: 'Nov 17, 2026 01:42 AM',
          },
        ]);
      } else {
        setRequests(list);
      }
    } catch (err) {
      setError('Unable to load unlock requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/unlock-requests/${id}/approve`, {
        admin_notes: 'Approved by administrator. Cooldown cleared.',
      });
      setSuccessMsg('Request approved and student cooldown cleared.');
      fetchRequests();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to approve unlock request.');
    }
  };

  const filtered = requests.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (r.student_name || '').toLowerCase().includes(s) ||
      (r.student_id || '').toLowerCase().includes(s) ||
      (r.notes || '').toLowerCase().includes(s) ||
      (r.location || '').toLowerCase().includes(s)
    );
  });

  return (
    <div>
      {/* ─── BREADCRUMBS & TITLE (Image 2) ─── */}
      <div className="mb-3">
        <div className="text-muted small mb-1" style={{ fontSize: '0.82rem' }}>
          <span>Profile Unlock Requests &amp; Notes</span> <span className="mx-1">&gt;</span> <span>List</span>
        </div>
        <h1 className="fw-bold mb-0" style={{ fontSize: '1.75rem', color: '#0f172a' }}>
          Profile Unlock Requests &amp; Notes
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
              <p className="mt-2 text-muted small">Loading unlock requests...</p>
            </div>
          ) : (
            <Table hover className="align-middle mb-0" style={{ fontSize: '0.84rem' }}>
              <thead className="bg-light text-muted" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ width: '40px' }} className="ps-3">
                    <Form.Check type="checkbox" />
                  </th>
                  <th className="fw-semibold">Student <span style={{ fontSize: '0.7rem' }}>▼</span></th>
                  <th className="fw-semibold">Category</th>
                  <th className="fw-semibold">Student Concern Note</th>
                  <th className="fw-semibold">Campus Location</th>
                  <th className="fw-semibold">Status</th>
                  <th className="fw-semibold">Submitted <span style={{ fontSize: '0.7rem' }}>▼</span></th>
                  <th className="text-end pe-3 fw-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((req) => (
                    <tr key={req.id}>
                      <td className="ps-3">
                        <Form.Check type="checkbox" />
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{req.student_name}</div>
                        <div className="text-muted small font-monospace">{req.student_id}</div>
                      </td>
                      <td>
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
                          {req.request_type || 'Cooldown Unlock'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '260px' }}>
                        <span className="text-truncate d-inline-block text-secondary" style={{ maxWidth: '240px' }}>
                          {req.notes}
                        </span>
                      </td>
                      <td className="text-muted" style={{ maxWidth: '200px' }}>
                        <span className="text-truncate d-inline-block" style={{ maxWidth: '190px' }}>
                          {req.location}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            backgroundColor: req.status === 'approved' ? '#f0fdf4' : req.status === 'rejected' ? '#fef2f2' : '#fffbeb',
                            color: req.status === 'approved' ? '#166534' : req.status === 'rejected' ? '#991b1b' : '#92400e',
                            border: `1px solid ${req.status === 'approved' ? '#86efac' : req.status === 'rejected' ? '#fca5a5' : '#fde68a'}`,
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            padding: '4px 9px',
                          }}
                          className="badge rounded-pill text-capitalize"
                        >
                          {req.status === 'approved' ? '✓ Approved' : req.status === 'rejected' ? '⊗ Rejected' : '⏳ Pending'}
                        </span>
                      </td>
                      <td className="text-muted">
                        {req.created_at || 'Nov 17, 2026 05:54 AM'}
                      </td>
                      <td className="text-end pe-3">
                        <div className="d-flex align-items-center justify-content-end gap-2">
                          {req.status === 'pending' && (
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 text-success text-decoration-none fw-medium"
                              onClick={() => handleApprove(req.id)}
                              style={{ fontSize: '0.8rem' }}
                            >
                              Approve
                            </Button>
                          )}
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-secondary text-decoration-none fw-medium d-inline-flex align-items-center gap-1"
                            onClick={() => setSelectedReq(req)}
                            style={{ fontSize: '0.8rem' }}
                          >
                            <span>👁</span> View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">No unlock requests found.</td>
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
            <div className="d-flex align-items-center gap-1">
              <Button variant="light" size="sm" className="border px-2 py-0 fw-bold bg-light" disabled>1</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal */}
      {selectedReq && (
        <Modal show={Boolean(selectedReq)} onHide={() => setSelectedReq(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">Student Unlock Note Details</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4" style={{ fontSize: '0.875rem' }}>
            <h6 className="fw-bold mb-1">{selectedReq.student_name} ({selectedReq.student_id})</h6>
            <div className="text-muted small mb-3">{selectedReq.location}</div>
            <div className="p-3 rounded-3 bg-light border mb-3">
              <span className="text-muted small d-block mb-1 fw-bold">Student Written Concern:</span>
              <p className="mb-0 text-dark">"{selectedReq.notes}"</p>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Submitted:</span>
              <strong>{selectedReq.created_at}</strong>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setSelectedReq(null)}>Close</Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}
