import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Form, Spinner, Alert, Modal } from 'react-bootstrap';
import api from '../../api/axios';

export default function AdminAdvertisements() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAd, setEditingAd] = useState(null);

  const [form, setForm] = useState({
    campaign_title: '',
    requested_by: '',
    requested_email: '',
    duration: '7 Days (week)',
    cost: '14.00',
    banner_url: '/auth-bg.jpg',
  });

  const fetchAds = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/advertisements');
      const list = res.data?.data || [];
      if (list.length === 0) {
        setAds([
          {
            id: 'AD-0001',
            banner_url: '/auth-bg.jpg',
            campaign_title: 'Support Itlogs Campaign Business',
            requested_by: 'Phanie Phanie',
            requested_email: 'reymartovedano@gmail.com',
            duration: '7 Days (week)',
            cost: 14.0,
            status: 'active',
            payment_status: 'paid',
            created_at: 'Nov 16, 2026',
          },
        ]);
      } else {
        setAds(list);
      }
    } catch (err) {
      setError('Unable to load advertisements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleOpenCreate = () => {
    setEditingAd(null);
    setForm({
      campaign_title: '',
      requested_by: '',
      requested_email: '',
      duration: '7 Days (week)',
      cost: '14.00',
      banner_url: '/auth-bg.jpg',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (ad) => {
    setEditingAd(ad);
    setForm({
      campaign_title: ad.campaign_title || '',
      requested_by: ad.requested_by || '',
      requested_email: ad.requested_email || '',
      duration: ad.duration || '7 Days (week)',
      cost: String(ad.cost || '14.00'),
      banner_url: ad.banner_url || '/auth-bg.jpg',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAd) {
        setAds((prev) =>
          prev.map((a) => (a.id === editingAd.id ? { ...a, ...form } : a))
        );
        setSuccessMsg('Advertisement updated successfully.');
      } else {
        const res = await api.post('/admin/advertisements', form);
        setAds((prev) => [res.data.data, ...prev]);
        setSuccessMsg('New advertisement campaign published.');
      }
      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to save advertisement.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this advertisement campaign?')) return;
    try {
      await api.delete(`/admin/advertisements/${id}`);
      setSuccessMsg('Advertisement removed.');
      setAds((prev) => prev.filter((a) => a.id !== id));
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to delete advertisement.');
    }
  };

  const filtered = ads.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (a.campaign_title || '').toLowerCase().includes(q) ||
      (a.requested_by || '').toLowerCase().includes(q) ||
      (a.requested_email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* ─── BREADCRUMBS & TITLE & TOP ACTIONS (Image 4) ─── */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div>
          <div className="text-muted small mb-1" style={{ fontSize: '0.82rem' }}>
            <span>Advertisements</span> <span className="mx-1">&gt;</span> <span>List</span>
          </div>
          <h1 className="fw-bold mb-0" style={{ fontSize: '1.75rem', color: '#0f172a' }}>
            Advertisements
          </h1>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="rounded-pill px-3 py-1 fw-semibold d-inline-flex align-items-center gap-1"
            style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
          >
            <span>🏷</span> Ad Rate: ₱3/day
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="rounded-pill px-3 py-1 fw-semibold"
            style={{ backgroundColor: '#4f46e5', borderColor: '#4f46e5' }}
            onClick={handleOpenCreate}
          >
            New advertisement
          </Button>
        </div>
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
              <p className="mt-2 text-muted small">Loading ads...</p>
            </div>
          ) : (
            <Table hover className="align-middle mb-0" style={{ fontSize: '0.84rem' }}>
              <thead className="bg-light text-muted" style={{ borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ width: '40px' }} className="ps-3">
                    <Form.Check type="checkbox" />
                  </th>
                  <th className="fw-semibold">Banner</th>
                  <th className="fw-semibold">Campaign Title <span style={{ fontSize: '0.7rem' }}>▼</span></th>
                  <th className="fw-semibold">Requested By</th>
                  <th className="fw-semibold">Duration</th>
                  <th className="fw-semibold">Cost <span style={{ fontSize: '0.7rem' }}>▼</span></th>
                  <th className="fw-semibold">Status</th>
                  <th className="fw-semibold">Payment</th>
                  <th className="fw-semibold">Submitted <span style={{ fontSize: '0.7rem' }}>▼</span></th>
                  <th className="text-end pe-3 fw-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((ad) => (
                    <tr key={ad.id}>
                      <td className="ps-3">
                        <Form.Check type="checkbox" />
                      </td>
                      <td>
                        <img
                          src={ad.banner_url || '/auth-bg.jpg'}
                          alt="Banner"
                          style={{ width: '56px', height: '32px', objectFit: 'cover', borderRadius: '4px' }}
                          className="border"
                        />
                      </td>
                      <td className="fw-medium text-dark">{ad.campaign_title}</td>
                      <td>
                        <div className="fw-medium text-dark">{ad.requested_by}</div>
                        <small className="text-muted">{ad.requested_email}</small>
                      </td>
                      <td>
                        <Badge
                          style={{
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            fontWeight: '500',
                            fontSize: '0.75rem',
                          }}
                          className="rounded-pill px-2 py-1"
                        >
                          {ad.duration}
                        </Badge>
                      </td>
                      <td className="fw-semibold text-dark">₱{Number(ad.cost).toFixed(2)}</td>
                      <td>
                        <Badge
                          style={{
                            backgroundColor: '#f0fdf4',
                            color: '#16a34a',
                            border: '1px solid #bbf7d0',
                            fontWeight: '500',
                            fontSize: '0.75rem',
                          }}
                          className="rounded-pill px-2 py-1"
                        >
                          {ad.status}
                        </Badge>
                      </td>
                      <td>
                        <Badge
                          style={{
                            backgroundColor: '#f0fdf4',
                            color: '#16a34a',
                            border: '1px solid #bbf7d0',
                            fontWeight: '500',
                            fontSize: '0.75rem',
                          }}
                          className="rounded-pill px-2 py-1"
                        >
                          {ad.payment_status || 'paid'}
                        </Badge>
                      </td>
                      <td className="text-muted">{ad.created_at}</td>
                      <td className="text-end pe-3">
                        <div className="d-flex align-items-center justify-content-end gap-3">
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-primary text-decoration-none fw-medium d-inline-flex align-items-center gap-1"
                            onClick={() => handleOpenEdit(ad)}
                            style={{ fontSize: '0.8rem' }}
                          >
                            <span>✎</span> Edit
                          </Button>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 text-danger text-decoration-none fw-medium d-inline-flex align-items-center gap-1"
                            onClick={() => handleDelete(ad.id)}
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
                    <td colSpan={10} className="text-center text-muted py-4">No advertisements found.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2 text-muted" style={{ fontSize: '0.82rem', borderColor: '#e2e8f0' }}>
          <div>
            Showing {filtered.length} result
          </div>
          <div className="d-flex align-items-center gap-1">
            <span>Per page</span>
            <Form.Select size="sm" style={{ width: '70px', fontSize: '0.78rem' }} defaultValue="10">
              <option value="10">10</option>
              <option value="25">25</option>
            </Form.Select>
          </div>
        </div>
      </Card>

      {/* Modal for Create/Edit */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fs-6 fw-bold">
            {editingAd ? 'Edit Advertisement Campaign' : 'New Advertisement Campaign'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body className="p-4" style={{ fontSize: '0.875rem' }}>
            <Form.Group className="mb-3" controlId="adTitle">
              <Form.Label className="small fw-semibold text-muted">Campaign Title</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Support Itlogs Campaign Business"
                value={form.campaign_title}
                onChange={(e) => setForm({ ...form, campaign_title: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="adRequestedBy">
              <Form.Label className="small fw-semibold text-muted">Requested By (Organization / Student)</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Phanie Phanie"
                value={form.requested_by}
                onChange={(e) => setForm({ ...form, requested_by: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="adEmail">
              <Form.Label className="small fw-semibold text-muted">Contact Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="e.g. reymartovedano@gmail.com"
                value={form.requested_email}
                onChange={(e) => setForm({ ...form, requested_email: e.target.value })}
                required
              />
            </Form.Group>
            <Row className="mb-3 g-2">
              <Col sm={6}>
                <Form.Group controlId="adDuration">
                  <Form.Label className="small fw-semibold text-muted">Duration</Form.Label>
                  <Form.Select
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  >
                    <option value="3 Days">3 Days</option>
                    <option value="7 Days (week)">7 Days (week)</option>
                    <option value="14 Days (2 weeks)">14 Days (2 weeks)</option>
                    <option value="30 Days (month)">30 Days (month)</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group controlId="adCost">
                  <Form.Label className="small fw-semibold text-muted">Cost (₱)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" size="sm" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm">Save Campaign</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
