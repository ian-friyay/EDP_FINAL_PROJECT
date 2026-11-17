import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap';
import api from '../api/axios';

export default function AdRequestModal({ show, onHide, onAdCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetUrl, setTargetUrl] = useState('/services');
  const [bannerUrl, setBannerUrl] = useState('');
  const [durationType, setDurationType] = useState('week');
  const [customDays, setCustomDays] = useState(7);
  const [dailyRate, setDailyRate] = useState(2.0);
  const [pricingPackages, setPricingPackages] = useState([]);
  const [imageMode, setImageMode] = useState('upload'); // 'upload' | 'url'

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdAd, setCreatedAd] = useState(null);
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [paypalSuccess, setPaypalSuccess] = useState('');

  // Fetch live pricing
  useEffect(() => {
    if (show) {
      api
        .get('/advertisements/pricing')
        .then((res) => {
          if (res.data?.data) {
            setDailyRate(res.data.data.daily_rate || 2.0);
            setPricingPackages(res.data.data.packages || []);
          }
        })
        .catch((err) => console.warn('Could not load pricing:', err));
    } else {
      // Reset state on close
      setTitle('');
      setDescription('');
      setBannerUrl('');
      setError('');
      setCreatedAd(null);
      setPaypalSuccess('');
      setPaypalLoading(false);
    }
  }, [show]);

  // Calculate total days and cost
  const calculatedDays =
    durationType === 'week' ? 7 : durationType === 'month' ? 30 : Math.max(1, parseInt(customDays, 10) || 1);
  const computedCost = Math.round(calculatedDays * dailyRate * 100) / 100;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Banner image size must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setBannerUrl(event.target.result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide an advertisement title.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        target_url: targetUrl.trim(),
        banner_url:
          bannerUrl ||
          'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80',
        duration_type: durationType,
        custom_days: durationType === 'custom' ? calculatedDays : undefined,
      };

      const res = await api.post('/advertisements/request', payload);
      const ad = res.data?.data;
      setCreatedAd(ad);
      if (onAdCreated) onAdCreated(ad);
    } catch (err) {
      console.error('Submit ad error:', err);
      setError(err.response?.data?.error || 'Failed to submit advertisement request.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaypalAdPayment = async () => {
    if (!createdAd) return;
    setPaypalLoading(true);
    try {
      // Step 1: Create ad order
      const orderRes = await api.post('/payments/paypal/create-ad-order', {
        advertisement_id: createdAd.id,
      });
      const orderId = orderRes.data?.data?.order_id;

      // Step 2: Capture ad order
      const captureRes = await api.post('/payments/paypal/capture-ad-order', {
        advertisement_id: createdAd.id,
        order_id: orderId,
      });

      setPaypalSuccess(
        `Payment of ₱${createdAd.computed_cost.toFixed(2)} completed successfully via PayPal! Your advertisement is now paid and scheduled.`
      );
      if (onAdCreated) onAdCreated(captureRes.data?.data || createdAd);
    } catch (err) {
      console.error('PayPal ad payment error:', err);
      alert(err.response?.data?.error || 'PayPal simulation payment failed.');
    } finally {
      setPaypalLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered scrollable size="lg">
      <Modal.Header
        closeButton
        style={{
          background: 'var(--neu-bg-dark)',
          borderBottom: '1px solid rgba(154, 172, 196, 0.35)',
        }}
      >
        <Modal.Title className="fw-bold fs-5 d-flex align-items-center gap-2" style={{ color: 'var(--neu-text)' }}>
          <span>📢</span>
          <span>Request Campus Advertisement</span>
          <Badge bg="primary" className="fw-normal ms-2" style={{ fontSize: '0.75rem' }}>
            ₱{dailyRate.toFixed(2)}/day
          </Badge>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ background: 'var(--neu-bg)', maxHeight: 'calc(85vh - 130px)', overflowY: 'auto' }}>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')} className="py-2 small">
            {error}
          </Alert>
        )}

        {paypalSuccess && (
          <Alert variant="success" className="py-3">
            <h6 className="fw-bold mb-1">🎉 Payment Completed!</h6>
            <p className="mb-0 small">{paypalSuccess}</p>
          </Alert>
        )}

        {createdAd ? (
          <div>
            <div className="p-3 rounded-4 mb-3" style={{ background: 'var(--neu-bg-dark)', border: '1px solid rgba(154, 172, 196, 0.35)' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="badge bg-success">Request Submitted</span>
                <span className="fw-bold text-primary">₱{createdAd.computed_cost?.toFixed(2)}</span>
              </div>
              <h5 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>
                {createdAd.title}
              </h5>
              <p className="text-muted small mb-2">{createdAd.description}</p>
              <div className="small text-muted mb-2">
                Duration: <strong>{createdAd.duration_days} Days</strong> ({createdAd.start_date} to {createdAd.end_date})
              </div>

              {createdAd.banner_url && (
                <div className="rounded-3 overflow-hidden border mb-2" style={{ maxHeight: 180 }}>
                  <img
                    src={createdAd.banner_url}
                    alt="Banner Preview"
                    className="w-100"
                    style={{ height: 180, objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>

            {createdAd.payment_status !== 'paid' && !paypalSuccess ? (
              <div className="neu-card p-3 text-center">
                <p className="text-muted small mb-3">
                  Pay online now using PayPal Sandbox to instantly activate your advertisement sponsorship.
                </p>
                <Button
                  className="px-4 py-2 fw-semibold d-inline-flex align-items-center justify-content-center gap-2"
                  style={{
                    backgroundColor: '#0070ba',
                    borderColor: '#0070ba',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(0, 112, 186, 0.35)',
                    borderRadius: '24px',
                  }}
                  onClick={handlePaypalAdPayment}
                  disabled={paypalLoading}
                >
                  {paypalLoading ? (
                    <>
                      <Spinner size="sm" animation="border" />
                      <span>Processing PayPal Payment...</span>
                    </>
                  ) : (
                    <>
                      <span className="fw-bold" style={{ color: '#ffc439' }}>Pay</span>
                      <span className="fw-bold">Pal</span>
                      <span className="ms-1">| Pay ₱{createdAd.computed_cost?.toFixed(2)}</span>
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <Button className="neu-btn-primary px-4" onClick={onHide}>
                  Done
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">
                Advertisement Title <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                className="neu-input"
                placeholder="e.g., Campus Photography & Graduation Shoot Promo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={150}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">Description / Promo Details</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                className="neu-input"
                placeholder="Brief summary of your campus service offer or organization event..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">Target Destination Link (Optional)</Form.Label>
              <Form.Control
                className="neu-input"
                placeholder="/services or https://your-portfolio.com"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
              />
            </Form.Group>

            {/* Duration and Pricing Packages */}
            <div className="mb-3">
              <Form.Label className="small fw-semibold text-muted mb-2 d-block">
                Select Duration Package (₱{dailyRate.toFixed(2)}/day)
              </Form.Label>
              <Row className="g-2">
                <Col xs={4}>
                  <div
                    onClick={() => setDurationType('week')}
                    className={`p-2.5 rounded-3 text-center cursor-pointer border ${
                      durationType === 'week' ? 'border-primary bg-primary bg-opacity-10' : 'bg-light'
                    }`}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <div className="fw-bold small" style={{ color: 'var(--neu-text)' }}>
                      1 Week
                    </div>
                    <div className="text-primary fw-bold">₱{(7 * dailyRate).toFixed(2)}</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                      7 days
                    </div>
                  </div>
                </Col>

                <Col xs={4}>
                  <div
                    onClick={() => setDurationType('month')}
                    className={`p-2.5 rounded-3 text-center cursor-pointer border ${
                      durationType === 'month' ? 'border-primary bg-primary bg-opacity-10' : 'bg-light'
                    }`}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <div className="fw-bold small" style={{ color: 'var(--neu-text)' }}>
                      1 Month
                    </div>
                    <div className="text-primary fw-bold">₱{(30 * dailyRate).toFixed(2)}</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                      30 days
                    </div>
                  </div>
                </Col>

                <Col xs={4}>
                  <div
                    onClick={() => setDurationType('custom')}
                    className={`p-2.5 rounded-3 text-center cursor-pointer border ${
                      durationType === 'custom' ? 'border-primary bg-primary bg-opacity-10' : 'bg-light'
                    }`}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    <div className="fw-bold small" style={{ color: 'var(--neu-text)' }}>
                      Custom
                    </div>
                    <div className="text-primary fw-bold">₱{(calculatedDays * dailyRate).toFixed(2)}</div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                      {calculatedDays} days
                    </div>
                  </div>
                </Col>
              </Row>

              {durationType === 'custom' && (
                <div className="mt-2 d-flex align-items-center gap-2">
                  <Form.Label className="small text-muted mb-0">Custom Days:</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="365"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    className="neu-input"
                    style={{ width: 100 }}
                    size="sm"
                  />
                  <span className="small text-muted">
                    &times; ₱{dailyRate.toFixed(2)} = <strong>₱{computedCost.toFixed(2)}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Banner Image selector */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <Form.Label className="small fw-semibold text-muted mb-0">Banner Graphic</Form.Label>
                <div className="d-flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    className={`py-0 px-2 ${imageMode === 'upload' ? 'neu-btn-primary' : 'neu-btn-ghost'}`}
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => setImageMode('upload')}
                  >
                    Upload File
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className={`py-0 px-2 ${imageMode === 'url' ? 'neu-btn-primary' : 'neu-btn-ghost'}`}
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => setImageMode('url')}
                  >
                    Image URL
                  </Button>
                </div>
              </div>

              {imageMode === 'upload' ? (
                <label
                  className="d-block text-center p-3 rounded-3 cursor-pointer border-dashed"
                  style={{
                    background: 'var(--neu-bg-dark)',
                    border: '2px dashed rgba(154, 172, 196, 0.45)',
                    cursor: 'pointer',
                  }}
                >
                  <span className="small fw-semibold" style={{ color: 'var(--neu-text)' }}>
                    Click to select ad banner (JPG/PNG, recommended 1200&times;400)
                  </span>
                  <input type="file" accept="image/*" className="d-none" onChange={handleFileUpload} />
                </label>
              ) : (
                <Form.Control
                  className="neu-input"
                  placeholder="https://example.com/banner.jpg"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  size="sm"
                />
              )}

              {bannerUrl && (
                <div className="mt-2 rounded-3 overflow-hidden border" style={{ maxHeight: 120 }}>
                  <img
                    src={bannerUrl}
                    alt="Preview"
                    className="w-100"
                    style={{ height: 120, objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>

            {/* Cost Breakdown */}
            <div className="p-3 rounded-3 mb-3" style={{ background: 'var(--neu-bg-dark)' }}>
              <div className="d-flex justify-content-between align-items-center text-muted small mb-1">
                <span>Daily Campus Rate:</span>
                <span>₱{dailyRate.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center text-muted small mb-1">
                <span>Duration:</span>
                <span>{calculatedDays} Days</span>
              </div>
              <hr className="my-1 border-secondary opacity-25" />
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold" style={{ color: 'var(--neu-text)' }}>
                  Total Sponsorship Fee:
                </span>
                <span className="fs-5 fw-bold text-primary">₱{computedCost.toFixed(2)}</span>
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 pt-2">
              <Button type="button" className="neu-btn-ghost" onClick={onHide} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" className="neu-btn-primary px-4 fw-semibold" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
}
