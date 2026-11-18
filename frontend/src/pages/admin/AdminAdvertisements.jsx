import React, { useState, useEffect } from 'react';
import { Row, Col, Badge, Button, Table, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import api from '../../api/axios';

export default function AdminAdvertisements() {
  const [ads, setAds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Admin Direct Ad Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTargetUrl, setNewTargetUrl] = useState('/services');
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const [newDays, setNewDays] = useState(14);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Banner Preview Modal State
  const [previewAd, setPreviewAd] = useState(null);

  // Delete Ad Confirmation State
  const [adToDelete, setAdToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAds = async () => {
    setIsLoading(true);
    setActionError('');
    try {
      const res = await api.get('/admin/advertisements');
      const list = res.data?.data || res.data || [];
      setAds(Array.isArray(list) ? list : []);
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || 'Failed to fetch campus advertisements.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleUpdateStatus = async (adId, nextStatus) => {
    setIsProcessing(true);
    setActionError('');
    setActionSuccess('');
    try {
      const res = await api.patch(`/admin/advertisements/${adId}/status`, { status: nextStatus });
      setActionSuccess(res.data?.message || `Advertisement marked as ${nextStatus}.`);
      await fetchAds();
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || `Failed to update status to ${nextStatus}.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteAd = async () => {
    if (!adToDelete) return;
    setIsDeleting(true);
    setActionError('');
    setActionSuccess('');
    try {
      await api.delete(`/admin/advertisements/${adToDelete.id}`);
      setActionSuccess(`Advertisement "${adToDelete.title}" deleted successfully.`);
      setAdToDelete(null);
      await fetchAds();
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || 'Failed to delete advertisement.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateDirectAd = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setActionError('Advertisement title is required.');
      return;
    }

    setIsSubmittingNew(true);
    setActionError('');
    try {
      const payload = {
        title: newTitle.trim(),
        description: newDescription.trim(),
        target_url: newTargetUrl.trim() || '/services',
        banner_url: newBannerUrl.trim() || 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
        duration_type: 'custom',
        custom_days: Number(newDays) || 14,
        status: 'active',
        payment_status: 'paid',
      };

      await api.post('/advertisements', payload);
      setActionSuccess(`Official campus announcement "${newTitle}" created and activated!`);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewBannerUrl('');
      await fetchAds();
      setTimeout(() => setActionSuccess(''), 5000);
    } catch (err) {
      setActionError(err.response?.data?.error || err.message || 'Failed to publish campus advertisement.');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Metrics
  const totalCount = ads.length;
  const pendingCount = ads.filter((a) => (a.status || 'pending') === 'pending').length;
  const activeCount = ads.filter((a) => a.status === 'active').length;
  const inactiveCount = ads.filter((a) => a.status === 'inactive' || a.status === 'rejected').length;

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-primary-dark)' }}>
            Campus Advertisements &amp; Banners
          </h2>
          <p className="text-muted mb-0">
            Review student sponsorship submissions, approve campus promotions, or dispatch official announcements.
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <Button
            className="neu-btn-ghost rounded-pill px-3"
            onClick={fetchAds}
            disabled={isLoading || isProcessing}
          >
            Refresh List
          </Button>
          <Button
            className="neu-btn-primary rounded-pill px-4 fw-semibold"
            onClick={() => setShowCreateModal(true)}
          >
            + Post Direct Campus Ad
          </Button>
        </div>
      </div>

      {actionSuccess && <Alert variant="success" className="rounded-3 py-2.5">{actionSuccess}</Alert>}
      {actionError && <Alert variant="danger" className="rounded-3 py-2.5">{actionError}</Alert>}

      {/* KPI Cards */}
      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <div className="neu-card p-3 rounded-4 h-100">
            <div className="text-muted small text-uppercase fw-semibold mb-1">Total Submissions</div>
            <div className="fs-3 fw-bold" style={{ color: '#063a8f' }}>{totalCount}</div>
            <div className="small text-muted mt-1">All-time campus requests</div>
          </div>
        </Col>
        <Col sm={6} xl={3}>
          <div className="neu-card p-3 rounded-4 h-100">
            <div className="text-muted small text-uppercase fw-semibold mb-1">Pending Approval</div>
            <div className="fs-3 fw-bold text-warning">{pendingCount}</div>
            <div className="small text-muted mt-1">Awaiting administrator confirmation</div>
          </div>
        </Col>
        <Col sm={6} xl={3}>
          <div className="neu-card p-3 rounded-4 h-100">
            <div className="text-muted small text-uppercase fw-semibold mb-1">Active on Website</div>
            <div className="fs-3 fw-bold text-success">{activeCount}</div>
            <div className="small text-muted mt-1">Currently rotating on student banner</div>
          </div>
        </Col>
        <Col sm={6} xl={3}>
          <div className="neu-card p-3 rounded-4 h-100">
            <div className="text-muted small text-uppercase fw-semibold mb-1">Paused / Inactive</div>
            <div className="fs-3 fw-bold text-secondary">{inactiveCount}</div>
            <div className="small text-muted mt-1">Expired or paused advertisements</div>
          </div>
        </Col>
      </Row>

      {/* Advertisements Management Table */}
      <div className="neu-card rounded-4 overflow-hidden shadow-sm">
        <div className="p-3.5 px-4 border-bottom d-flex justify-content-between align-items-center" style={{ background: 'var(--neu-bg-dark)', borderColor: 'rgba(154, 172, 196, 0.3)' }}>
          <h5 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>
            Advertisement Review Pipeline
          </h5>
          <span className="badge bg-secondary-subtle text-secondary px-3 py-1.5 rounded-pill font-monospace small">
            {ads.length} Total Records
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-5 text-muted">
            <Spinner animation="border" size="sm" className="me-2" />
            Loading campus advertisements...
          </div>
        ) : ads.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <div className="fs-1 mb-2">📢</div>
            <h6>No advertisement requests submitted yet.</h6>
            <p className="small text-muted">Students can request ads directly via the marketplace banner.</p>
          </div>
        ) : (
          <div className="table-responsive neu-scroll-table">
            <Table hover className="mb-0 align-middle">
              <thead>
                <tr style={{ background: 'var(--neu-bg-light)', borderBottom: '2px solid rgba(154, 172, 196, 0.3)' }}>
                  <th className="py-3 px-3 text-uppercase small fw-bold">Banner</th>
                  <th className="py-3 px-3 text-uppercase small fw-bold">Campaign Details</th>
                  <th className="py-3 px-3 text-uppercase small fw-bold">Applicant</th>
                  <th className="py-3 px-3 text-uppercase small fw-bold">Cost &amp; Payment</th>
                  <th className="py-3 px-3 text-uppercase small fw-bold">Duration</th>
                  <th className="py-3 px-3 text-uppercase small fw-bold">Status</th>
                  <th className="py-3 px-3 text-uppercase small fw-bold text-end">Admin Decision</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((ad) => {
                  const status = ad.status || 'pending';
                  const isPaid = ad.payment_status === 'paid';

                  return (
                    <tr key={ad.id}>
                      <td className="px-3" style={{ width: '130px' }}>
                        <img
                          src={ad.banner_url || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600'}
                          alt={ad.title}
                          className="rounded-3 border shadow-xs"
                          style={{ width: '110px', height: '62px', objectFit: 'cover', cursor: 'pointer' }}
                          onClick={() => setPreviewAd(ad)}
                          title="Click to expand banner preview"
                        />
                      </td>

                      <td className="px-3">
                        <div className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>
                          {ad.title}
                        </div>
                        {ad.description && (
                          <div className="small text-muted text-truncate" style={{ maxWidth: '280px' }}>
                            {ad.description}
                          </div>
                        )}
                        {ad.target_url && (
                          <a
                            href={ad.target_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="small text-decoration-none text-primary d-inline-block mt-0.5"
                          >
                            🔗 {ad.target_url}
                          </a>
                        )}
                      </td>

                      <td className="px-3">
                        <div className="fw-semibold small" style={{ color: 'var(--neu-primary)' }}>
                          {ad.advertiser_name || ad.user_id || 'Student User'}
                        </div>
                        <div className="text-muted small font-monospace">
                          {ad.user_id || 'MMC-USER'}
                        </div>
                      </td>

                      <td className="px-3">
                        <div className="fw-bold" style={{ color: 'var(--neu-text)' }}>
                          ₱{Number(ad.computed_cost || 0).toFixed(2)}
                        </div>
                        <Badge
                          bg={isPaid ? 'success' : 'secondary'}
                          className="rounded-pill px-2 py-0.5 text-uppercase"
                          style={{ fontSize: '0.68rem' }}
                        >
                          {isPaid ? '✓ Paid' : 'Pending Payment'}
                        </Badge>
                      </td>

                      <td className="px-3 small text-muted">
                        <div><strong>{ad.duration_days || 7} days</strong></div>
                        <div style={{ fontSize: '0.75rem' }}>
                          {ad.start_date || 'Immediate'} → {ad.end_date || 'Open'}
                        </div>
                      </td>

                      <td className="px-3">
                        <Badge
                          bg={
                            status === 'active'
                              ? 'success'
                              : status === 'pending'
                              ? 'warning'
                              : status === 'rejected'
                              ? 'danger'
                              : 'secondary'
                          }
                          text={status === 'pending' ? 'dark' : 'white'}
                          className="rounded-pill px-2.5 py-1 text-capitalize fw-semibold"
                        >
                          {status}
                        </Badge>
                      </td>

                      <td className="px-3 text-end">
                        <div className="d-flex gap-1.5 justify-content-end flex-wrap">
                          {status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="success"
                                className="rounded-pill px-3 py-1 fw-semibold text-white"
                                disabled={isProcessing}
                                onClick={() => handleUpdateStatus(ad.id, 'active')}
                              >
                                Approve &amp; Show
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                className="rounded-pill px-3 py-1 fw-semibold"
                                disabled={isProcessing}
                                onClick={() => handleUpdateStatus(ad.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}

                          {status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline-warning"
                              className="rounded-pill px-3 py-1 fw-semibold text-dark"
                              disabled={isProcessing}
                              onClick={() => handleUpdateStatus(ad.id, 'inactive')}
                            >
                              Pause Ad
                            </Button>
                          )}

                          {(status === 'inactive' || status === 'rejected') && (
                            <Button
                              size="sm"
                              variant="outline-success"
                              className="rounded-pill px-3 py-1 fw-semibold"
                              disabled={isProcessing}
                              onClick={() => handleUpdateStatus(ad.id, 'active')}
                            >
                              Re-activate
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline-danger"
                            className="rounded-pill px-2.5 py-1 fw-semibold d-inline-flex align-items-center gap-1"
                            disabled={isProcessing}
                            onClick={() => setAdToDelete(ad)}
                            title="Permanently delete this advertisement"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                              <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                            </svg>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </div>

      {/* Admin Direct Ad Creation Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered size="lg">
        <Modal.Header closeButton style={{ background: 'var(--neu-bg-dark)', borderBottom: '1px solid rgba(154, 172, 196, 0.35)' }}>
          <Modal.Title className="fw-bold fs-5" style={{ color: 'var(--neu-primary-dark)' }}>
            Publish Official Campus Announcement Banner
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateDirectAd}>
          <Modal.Body className="p-4" style={{ background: 'var(--neu-bg)' }}>
            <p className="small text-muted mb-3">
              This advertisement will be published with Administrator authorization and will immediately display on the marketplace billboard.
            </p>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">Announcement / Ad Title *</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. University Foundation Week: Campus Booth Registrations Open"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="neu-input"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">Description / Highlight Note</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Brief summary or call to action displayed over the carousel banner..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="neu-input"
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-muted">Destination Link / Target URL</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="/services or https://minsu.edu.ph"
                    value={newTargetUrl}
                    onChange={(e) => setNewTargetUrl(e.target.value)}
                    className="neu-input"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-semibold text-muted">Running Duration (Days)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="365"
                    value={newDays}
                    onChange={(e) => setNewDays(e.target.value)}
                    className="neu-input"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">Banner Image URL</Form.Label>
              <Form.Control
                type="url"
                placeholder="https://images.unsplash.com/... or paste image URL"
                value={newBannerUrl}
                onChange={(e) => setNewBannerUrl(e.target.value)}
                className="neu-input"
              />
              <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                Leave blank to automatically use the official MinSU campus hero image.
              </Form.Text>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer style={{ background: 'var(--neu-bg-dark)', borderTop: '1px solid rgba(154, 172, 196, 0.35)' }}>
            <Button className="neu-btn-ghost" onClick={() => setShowCreateModal(false)} disabled={isSubmittingNew}>
              Cancel
            </Button>
            <Button type="submit" className="neu-btn-primary px-4 fw-semibold" disabled={isSubmittingNew}>
              {isSubmittingNew ? 'Publishing...' : 'Publish Announcement'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Banner Preview Modal */}
      {previewAd && (
        <Modal show={!!previewAd} onHide={() => setPreviewAd(null)} centered size="lg">
          <Modal.Header closeButton style={{ background: 'var(--neu-bg-dark)' }}>
            <Modal.Title className="fw-bold fs-6">Banner Preview: {previewAd.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-3 text-center" style={{ background: '#000000' }}>
            <img
              src={previewAd.banner_url}
              alt={previewAd.title}
              className="img-fluid rounded-3"
              style={{ maxHeight: '420px', width: '100%', objectFit: 'cover' }}
            />
            <div className="text-start mt-3 text-white px-2">
              <h5 className="fw-bold text-white mb-1">{previewAd.title}</h5>
              <p className="text-white-50 small mb-2">{previewAd.description}</p>
              <div className="small text-white-50">
                Advertiser: <strong>{previewAd.advertiser_name || previewAd.user_id}</strong> • Target: {previewAd.target_url}
              </div>
            </div>
          </Modal.Body>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={Boolean(adToDelete)} onHide={() => setAdToDelete(null)} centered size="sm">
        <Modal.Header closeButton style={{ background: 'var(--neu-bg-dark)' }}>
          <Modal.Title className="fw-bold fs-6 text-danger">Confirm Ad Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3 text-center">
          <p className="mb-2">Are you sure you want to permanently delete this campus advertisement?</p>
          <div className="fw-bold text-dark mb-3">"{adToDelete?.title}"</div>
          <div className="d-flex justify-content-center gap-2">
            <Button variant="outline-secondary" size="sm" onClick={() => setAdToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" disabled={isDeleting} onClick={handleDeleteAd}>
              {isDeleting ? 'Deleting...' : 'Yes, Delete'}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
