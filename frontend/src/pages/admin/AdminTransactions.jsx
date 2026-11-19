import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Form, Spinner, Alert, Modal } from 'react-bootstrap';
import api from '../../api/axios';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);

  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/transactions');
      const list = res.data?.data || [];
      if (list.length === 0) {
        setTransactions([
          {
            id: 'TRX-0003',
            transaction_id: 'TRX-0003',
            requestor_name: 'Phaniie Phanie',
            provider_name: 'Kerim Aalke',
            amount_topay: 400.0,
            commission_fee: 20.0,
            total_topay: 405.0,
            status: 'pending',
            created_at: 'Nov 17, 2026',
          },
          {
            id: 'TRX-0002',
            transaction_id: 'TRX-0002',
            requestor_name: 'Phaniie Phanie',
            provider_name: 'Phanie Lubos',
            amount_topay: 300.0,
            commission_fee: 15.0,
            total_topay: 305.0,
            status: 'completed',
            created_at: 'Nov 17, 2026',
          },
          {
            id: 'TRX-0001',
            transaction_id: 'TRX-0001',
            requestor_name: 'Phaniie Phanie',
            provider_name: 'Kerim Aalke',
            amount_topay: 400.0,
            commission_fee: 20.0,
            total_topay: 405.0,
            status: 'completed',
            created_at: 'Nov 16, 2026',
          },
        ]);
      } else {
        setTransactions(list);
      }
    } catch (err) {
      setError('Unable to load transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = transactions.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (t.transaction_id || '').toLowerCase().includes(q) ||
      (t.requestor_name || '').toLowerCase().includes(q) ||
      (t.provider_name || '').toLowerCase().includes(q) ||
      (t.status || '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* ─── BREADCRUMBS & TITLE (Image 6) ─── */}
      <div className="mb-3">
        <div className="text-muted small mb-1" style={{ fontSize: '0.82rem' }}>
          <span>Service Transactions</span> <span className="mx-1">&gt;</span> <span>List</span>
        </div>
        <h1 className="fw-bold mb-0" style={{ fontSize: '1.75rem', color: '#0f172a' }}>
          Service Transactions
        </h1>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

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
              <p className="mt-2 text-muted small">Loading transactions...</p>
            </div>
          ) : (
            <Table hover className="align-middle mb-0" style={{ fontSize: '0.84rem' }}>
              <thead className="bg-light text-muted" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ width: '40px' }} className="ps-3">
                    <Form.Check type="checkbox" />
                  </th>
                  <th className="fw-semibold">Txn ID <span style={{ fontSize: '0.7rem' }}>▼</span></th>
                  <th className="fw-semibold">Requestor</th>
                  <th className="fw-semibold">Provider</th>
                  <th className="fw-semibold">Service Fee <span style={{ fontSize: '0.7rem' }}>▼</span></th>
                  <th className="fw-semibold">Comm. (5%) <span style={{ fontSize: '0.7rem' }}>▼</span></th>
                  <th className="fw-semibold">Total Paid <span style={{ fontSize: '0.7rem' }}>▼</span></th>
                  <th className="fw-semibold">Status</th>
                  <th className="fw-semibold">Date <span style={{ fontSize: '0.7rem' }}>▼</span></th>
                  <th className="text-end pe-3 fw-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((t) => (
                    <tr key={t.id || t.transaction_id}>
                      <td className="ps-3">
                        <Form.Check type="checkbox" />
                      </td>
                      <td className="font-monospace text-secondary">{t.transaction_id}</td>
                      <td className="text-dark fw-medium">{t.requestor_name}</td>
                      <td className="text-dark fw-medium">{t.provider_name}</td>
                      <td>₱{Number(t.amount_topay).toFixed(2)}</td>
                      <td className="text-muted">₱{Number(t.commission_fee).toFixed(2)}</td>
                      <td className="fw-semibold text-dark">₱{Number(t.total_topay).toFixed(2)}</td>
                      <td>
                        <span
                          style={{
                            backgroundColor:
                              t.status === 'completed'
                                ? '#f0fdf4'
                                : t.status === 'accepted'
                                ? '#eff6ff'
                                : t.status === 'cancelled'
                                ? '#fef2f2'
                                : '#fffbeb',
                            color:
                              t.status === 'completed'
                                ? '#166534'
                                : t.status === 'accepted'
                                ? '#1e40af'
                                : t.status === 'cancelled'
                                ? '#991b1b'
                                : '#92400e',
                            border: `1px solid ${
                              t.status === 'completed'
                                ? '#86efac'
                                : t.status === 'accepted'
                                ? '#93c5fd'
                                : t.status === 'cancelled'
                                ? '#fca5a5'
                                : '#fde68a'
                            }`,
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            padding: '4px 9px',
                          }}
                          className="badge rounded-pill text-capitalize"
                        >
                          {t.status === 'completed'
                            ? '✓ Completed'
                            : t.status === 'accepted'
                            ? '● Accepted'
                            : t.status === 'cancelled'
                            ? '⊗ Cancelled'
                            : '⏳ Pending'}
                        </span>
                      </td>
                      <td className="text-muted">{t.created_at}</td>
                      <td className="text-end pe-3">
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 text-secondary text-decoration-none fw-medium d-inline-flex align-items-center gap-1"
                          onClick={() => setSelectedTx(t)}
                          style={{ fontSize: '0.8rem' }}
                        >
                          <span>👁</span> View
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="text-center text-muted py-4">No transactions recorded.</td>
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
      {selectedTx && (
        <Modal show={Boolean(selectedTx)} onHide={() => setSelectedTx(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">Transaction Breakdown ({selectedTx.transaction_id})</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4" style={{ fontSize: '0.875rem' }}>
            <div className="p-3 rounded-3 bg-light border mb-3">
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Requestor Client:</span>
                <strong>{selectedTx.requestor_name}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Service Provider:</span>
                <strong>{selectedTx.provider_name}</strong>
              </div>
              <hr className="my-2" />
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Base Service Rate:</span>
                <span>₱{Number(selectedTx.amount_topay).toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-1">
                <span className="text-muted">Platform Booking Fee:</span>
                <span>₱5.00 Flat</span>
              </div>
              <div className="d-flex justify-content-between mb-1 text-success">
                <span>Platform Commission (5%):</span>
                <span>₱{Number(selectedTx.commission_fee).toFixed(2)}</span>
              </div>
              <hr className="my-2" />
              <div className="d-flex justify-content-between fs-6">
                <strong>Total Settle Amount:</strong>
                <strong className="text-primary">₱{Number(selectedTx.total_topay).toFixed(2)}</strong>
              </div>
            </div>
            <div className="d-flex justify-content-between text-muted small">
              <span>Created Date:</span>
              <span>{selectedTx.created_at}</span>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
}
