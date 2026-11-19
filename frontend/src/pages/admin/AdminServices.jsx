import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Form, Spinner, Alert, Modal } from 'react-bootstrap';
import api from '../../api/axios';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [selectedService, setSelectedService] = useState(null);

  const fetchServices = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/services');
      const list = res.data?.data || [];
      if (list.length === 0) {
        setServices([
          {
            id: 'SRV-101',
            provider_name: 'Phanie Lubos',
            category: 'Creative',
            service_name: 'Graphic Designer',
            price: 300.0,
            status: 'active',
            created_at: 'Nov 17, 2026',
            description: 'Custom social media layouts, posters, and campus event graphics.',
          },
          {
            id: 'SRV-102',
            provider_name: 'Kerim Aalke',
            category: 'Creative',
            service_name: 'Graphic Designer',
            price: 400.0,
            status: 'active',
            created_at: 'Nov 16, 2026',
            description: 'High-resolution logo design and layout design using Figma/Photoshop.',
          },
        ]);
      } else {
        setServices(list);
      }
    } catch (err) {
      setError('Unable to load services catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete / take down this service from the platform?')) return;
    try {
      await api.delete(`/admin/services/${id}`);
      setSuccessMsg('Service removed successfully.');
      setServices((prev) => prev.filter((s) => s.id !== id && s.service_id !== id));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to delete service.');
    }
  };

  const filtered = services.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.provider_name || '').toLowerCase().includes(q) ||
      (s.category || '').toLowerCase().includes(q) ||
      (s.service_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* ─── BREADCRUMBS & TITLE (Image 7) ─── */}
      <div className="mb-3">
        <div className="text-muted small mb-1" style={{ fontSize: '0.82rem' }}>
          <span>Services</span> <span className="mx-1">&gt;</span> <span>List</span>
        </div>
        <h1 className="fw-bold mb-0" style={{ fontSize: '1.75rem', color: '#0f172a' }}>
          Services
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
              <p className="mt-2 text-muted small">Loading services...</p>
            </div>
          ) : (
            <Table hover className="align-middle mb-0" style={{ fontSize: '0.84rem' }}>
              <thead className="bg-light text-muted" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ width: '40px' }} className="ps-3">
                    <Form.Check type="checkbox" />
                  </th>
                  <th className="fw-semibold">Provider <span style={{ fontSize: '0.7rem' }}>▼</span></th>
                  <th className="fw-semibold">Category <span style={{ fontSize: '0.7rem' }}>▼</span></th>
                  <th className="fw-semibold">Service</th>
                  <th className="fw-semibold">Price <span style={{ fontSize: '0.7rem' }}>▼</span></th>
                  <th className="fw-semibold">Status</th>
                  <th className="fw-semibold">Listed <span style={{ fontSize: '0.7rem' }}>▼</span></th>
                  <th className="text-end pe-3 fw-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((s) => (
                    <tr key={s.id || s.service_id}>
                      <td className="ps-3">
                        <Form.Check type="checkbox" />
                      </td>
                      <td className="fw-medium text-dark">{s.provider_name}</td>
                      <td>
                        <span
                          style={{
                            backgroundColor: '#eff6ff',
                            color: '#1e40af',
                            border: '1px solid #93c5fd',
                            fontWeight: '600',
                            fontSize: '0.75rem',
                            padding: '4px 9px',
                          }}
                          className="badge rounded-pill"
                        >
                          {s.category}
                        </span>
                      </td>
                      <td className="text-secondary">{s.service_name}</td>
                      <td className="fw-semibold text-dark">₱{Number(s.price).toFixed(2)}</td>
                      <td>
                        <span
                          style={{
                            backgroundColor: s.status === 'active' ? '#f0fdf4' : '#fef2f2',
                            color: s.status === 'active' ? '#166534' : '#991b1b',
                            border: `1px solid ${s.status === 'active' ? '#86efac' : '#fca5a5'}`,
                            fontWeight: '600',
                            fontSize: '0.75rem',
                            padding: '4px 9px',
                          }}
                          className="badge rounded-pill text-capitalize"
                        >
                          {s.status === 'active' ? '● Active' : '⊗ Inactive'}
                        </span>
                      </td>
                      <td className="text-muted">{s.created_at}</td>
                      <td className="text-end pe-3">
                        <div className="d-flex align-items-center justify-content-end gap-3">
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-secondary text-decoration-none fw-medium d-inline-flex align-items-center gap-1"
                            onClick={() => setSelectedService(s)}
                            style={{ fontSize: '0.8rem' }}
                          >
                            <span>👁</span> View
                          </Button>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-danger text-decoration-none fw-medium d-inline-flex align-items-center gap-1"
                            onClick={() => handleDelete(s.id || s.service_id)}
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
                    <td colSpan={8} className="text-center text-muted py-4">No services catalogued.</td>
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
      {selectedService && (
        <Modal show={Boolean(selectedService)} onHide={() => setSelectedService(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title className="fs-6 fw-bold">Service Details</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4" style={{ fontSize: '0.875rem' }}>
            <h6 className="fw-bold mb-1">{selectedService.service_name}</h6>
            <div className="text-muted small mb-3">By {selectedService.provider_name} &bull; {selectedService.category}</div>
            <p className="text-secondary small mb-3">{selectedService.description || 'No description provided.'}</p>
            <div className="d-flex justify-content-between border-top pt-2">
              <span className="text-muted">Rate:</span>
              <strong className="fs-6 text-primary">₱{Number(selectedService.price).toFixed(2)}</strong>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
}
