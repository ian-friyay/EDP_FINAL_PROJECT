import { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Form, Modal, Row, Col, Badge, InputGroup } from 'react-bootstrap';
import api from '../api/axios';
import ServicesGrid, { SERVICE_TAXONOMY } from '../components/ServicesGrid';
import WeatherWidget from '../components/WeatherWidget';
import AdBanner from '../components/AdBanner';
import { DEFAULT_SERVICE_PLACEHOLDER } from '../utils/placeholder';
import { queueOfflineAction } from '../utils/offlineQueue';
import { compressImage } from '../utils/imageCompressor';

const emptyService = {
  service_category: 'Creatives',
  subcategory: 'Graphic Designer',
  service_description: '',
  amount_topay: '',
  rate_unit: 'per_service',
  picture_proof: [],
};

const getRequestError = (error) =>
  error.response?.data?.error ||
  error.message ||
  'The service request failed. Please try again.';

// Subcomponent for uploading or providing image URLs with placeholder preview
function PictureProofManager({ pictures = [], onChange }) {
  const [urlInput, setUrlInput] = useState('');
  const [mode, setMode] = useState('upload'); // 'upload' | 'url'

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const compressed = await compressImage(file, 800, 800, 0.72);
        onChange([...pictures, compressed]);
      } catch (err) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result;
          if (typeof result === 'string') {
            onChange([...pictures, result]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
    e.target.value = '';
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    onChange([...pictures, trimmed]);
    setUrlInput('');
  };

  const handleRemove = (index) => {
    const updated = pictures.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <Form.Label className="small fw-semibold text-muted mb-0">
          Service Pictures (Optional)
        </Form.Label>
        <span className="small text-muted" style={{ fontSize: '0.75rem' }}>
          {pictures.length > 0 ? `${pictures.length} photo(s) selected` : 'Using placeholder'}
        </span>
      </div>

      <p className="text-muted small mb-2" style={{ fontSize: '0.78rem' }}>
        You can upload a photo or add an image link. If you don't add a picture, a placeholder image will be shown.
      </p>

      {/* Choice Toggle: Upload File vs Image URL */}
      <div className="d-flex gap-2 mb-2">
        <Button
          type="button"
          size="sm"
          className={mode === 'upload' ? 'neu-btn-primary' : 'neu-btn-ghost'}
          onClick={() => setMode('upload')}
        >
          Upload from Device
        </Button>
        <Button
          type="button"
          size="sm"
          className={mode === 'url' ? 'neu-btn-primary' : 'neu-btn-ghost'}
          onClick={() => setMode('url')}
        >
          Paste Image URL
        </Button>
      </div>

      {mode === 'upload' ? (
        <div className="mb-3">
          <label
            className="d-block text-center p-3 rounded-3 cursor-pointer"
            style={{
              background: 'var(--neu-bg-dark)',
              border: '2px dashed rgba(154, 172, 196, 0.45)',
              cursor: 'pointer',
            }}
          >
            <div className="d-flex flex-column align-items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16" className="text-muted">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
              </svg>
              <span className="small fw-semibold" style={{ color: 'var(--neu-text)' }}>Click to select picture</span>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>PNG, JPG, or WEBP (auto-compressed)</span>
            </div>
            <input
              type="file"
              accept="image/*"
              className="d-none"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      ) : (
        <InputGroup size="sm" className="mb-3">
          <Form.Control
            className="neu-input"
            placeholder="https://example.com/photo.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddUrl();
              }
            }}
          />
          <Button variant="primary" type="button" onClick={handleAddUrl}>
            Add Photo
          </Button>
        </InputGroup>
      )}

      {/* Picture Preview or Placeholder Display */}
      {pictures.length > 0 ? (
        <div className="p-2 rounded-3" style={{ background: 'var(--neu-bg-dark)' }}>
          <div className="small fw-semibold text-muted mb-2 px-1">Selected Photos ({pictures.length}):</div>
          <div className="d-flex gap-2 flex-wrap">
            {pictures.map((pic, idx) => (
              <div key={idx} className="position-relative" style={{ width: 80, height: 70 }}>
                <img
                  src={pic}
                  alt={`Selected ${idx + 1}`}
                  className="rounded-2 w-100 h-100 border"
                  style={{ objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_SERVICE_PLACEHOLDER;
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemove(idx)}
                  className="btn btn-danger btn-sm position-absolute top-0 end-0 p-0 rounded-circle"
                  style={{ width: 18, height: 18, fontSize: '0.65rem', lineHeight: '18px', transform: 'translate(30%, -30%)' }}
                  title="Remove picture"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="d-flex align-items-center gap-2 p-2 rounded-3 border" style={{ background: '#f8fafc' }}>
          <img
            src={DEFAULT_SERVICE_PLACEHOLDER}
            alt="Default Placeholder"
            className="rounded-2 border"
            style={{ width: 50, height: 42, objectFit: 'cover' }}
          />
          <div className="small text-muted" style={{ fontSize: '0.78rem' }}>
            A standard campus illustration will be shown until you upload a custom photo.
          </div>
        </div>
      )}
    </div>
  );
}

export default function ServicesPage() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [serviceForm, setServiceForm] = useState(emptyService);
  const [editForm, setEditForm] = useState(emptyService);
  const [editingService, setEditingService] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [bookingServiceId, setBookingServiceId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const currentUserId = window.localStorage.getItem('user_id');

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = window.localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    api.get('/profile/me')
      .then(({ data }) => {
        if (data?.user) {
          setCurrentUser(data.user);
          window.localStorage.setItem('user', JSON.stringify(data.user));
        }
      })
      .catch(() => {});
  }, []);

  const isProvider = String(currentUser?.user_type || '').toLowerCase() === 'provider';

  const refreshServices = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const { data } = await api.get('/services');
      if (!Array.isArray(data.services)) {
        throw new Error('The server returned an invalid services list.');
      }
      setServices(data.services);
    } catch (requestError) {
      setError(getRequestError(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    refreshServices();
  }, [refreshServices]);

  const handleToggleServiceStatus = async (serviceId, newStatus) => {
    setError('');
    setMessage('');
    try {
      const { data } = await api.patch(`/services/${encodeURIComponent(serviceId)}/status`, {
        service_status: newStatus,
      });
      setMessage(
        data.message ||
        (newStatus === 'inactive'
          ? 'Service marked as Taken / Done and hidden from public marketplace.'
          : 'Service is now Available in the public marketplace.')
      );
      setServices((prev) =>
        prev.map((s) =>
          String(s.service_id) === String(serviceId) ? { ...s, service_status: newStatus } : s
        )
      );
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update service status.');
    }
  };

  const handleCreateService = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);

    try {
      const pictureProof = Array.isArray(serviceForm.picture_proof)
        ? serviceForm.picture_proof.filter(Boolean)
        : [];

      await api.post('/services', {
        service_category: serviceForm.service_category,
        subcategory: serviceForm.subcategory || null,
        service_description: serviceForm.service_description,
        amount_topay: Number(serviceForm.amount_topay),
        rate_unit: serviceForm.rate_unit || 'per_service',
        picture_proof: pictureProof,
      });

      setServiceForm(emptyService);
      setShowCreateModal(false);
      setMessage('Your service was added successfully.');
      await refreshServices();
    } catch (requestError) {
      setError(getRequestError(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenEdit = (service) => {
    setEditingService(service);
    setEditForm({
      service_category: service.service_category || '',
      subcategory: service.subcategory || '',
      service_description: service.service_description || '',
      amount_topay: service.amount_topay || '',
      rate_unit: service.rate_unit || 'per_service',
      picture_proof: Array.isArray(service.picture_proof)
        ? service.picture_proof
        : (service.picture_proof ? [service.picture_proof] : []),
    });
    setShowEditModal(true);
  };

  const handleUpdateService = async (event) => {
    event.preventDefault();
    if (!editingService) return;
    setError('');
    setMessage('');
    setIsUpdating(true);

    try {
      const pictureProof = Array.isArray(editForm.picture_proof)
        ? editForm.picture_proof.filter(Boolean)
        : [];

      await api.put(`/services/${encodeURIComponent(editingService.service_id)}`, {
        service_category: editForm.service_category,
        subcategory: editForm.subcategory || null,
        service_description: editForm.service_description,
        amount_topay: Number(editForm.amount_topay),
        rate_unit: editForm.rate_unit || 'per_service',
        picture_proof: pictureProof,
      });

      setShowEditModal(false);
      setEditingService(null);
      setMessage('Your service has been updated successfully.');
      await refreshServices();
    } catch (requestError) {
      setError(getRequestError(requestError));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }

    setError('');
    setMessage('');

    try {
      await api.delete(`/services/${encodeURIComponent(serviceId)}`);
      setMessage('The service was removed successfully.');
      await refreshServices();
    } catch (requestError) {
      setError(getRequestError(requestError));
    }
  };

  const handleBookService = async (service, bookingDetails) => {
    setError('');
    setMessage('');
    setBookingServiceId(service.service_id);

    const scheduledDate = bookingDetails?.scheduled_date || new Date().toISOString().slice(0, 10);
    const scheduledTime = bookingDetails?.scheduled_time || '12:00:00';
    const rendezvousLocation = bookingDetails?.rendezvous_location || 'Campus Main Library Entrance';

    const payload = {
      service_id: service.service_id,
      provider_id: service.user_id,
      service_name: service.subcategory || service.service_category,
      service_category: service.service_category,
      rate_unit: service.rate_unit || 'per_service',
      amount_topay: Number(service.amount_topay),
      booking_fee: 5,
      total_topay: Number(service.amount_topay) + 5,
      commission_fee: Number(service.amount_topay) * 0.05,
      start_date: scheduledDate,
      end_date: scheduledDate,
      start_time: scheduledTime,
      end_time: scheduledTime,
      rendezvous_location: rendezvousLocation,
      notes: bookingDetails?.notes || '',
    };

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await queueOfflineAction({
          endpoint: '/transactions',
          method: 'post',
          payload,
          description: `Booking: ${service.subcategory || service.service_category} at ${payload.rendezvous_location}`,
        });
        setMessage(
          `Offline Mode: Your booking request at ${payload.rendezvous_location} has been queued locally in IndexedDB. It will automatically sync when reconnected.`
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const { data } = await api.post('/transactions', payload);
      const txId = data.transaction?.transaction_id;
      if (txId) {
        navigate(`/transactions/${txId}/qr`, {
          state: {
            message: `Booking confirmed! Rendezvous set at ${payload.rendezvous_location}. Transaction #${txId} QR Code generated.`,
          },
        });
      } else {
        setMessage(
          `Booking confirmed! Transaction ID: #${data.transaction?.transaction_id || ''}. Rendezvous set at ${payload.rendezvous_location}.`
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (requestError) {
      if (
        (typeof navigator !== 'undefined' && !navigator.onLine) ||
        requestError.message === 'Network Error' ||
        !requestError.response
      ) {
        try {
          await queueOfflineAction({
            endpoint: '/transactions',
            method: 'post',
            payload,
            description: `Booking: ${service.subcategory || service.service_category} at ${payload.rendezvous_location}`,
          });
          setMessage(
            `Connection issue: Your booking request has been queued locally and will automatically sync upon reconnection.`
          );
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        } catch (queueErr) {
          console.error('Failed to queue offline action:', queueErr);
        }
      }
      setError(getRequestError(requestError));
    } finally {
      setBookingServiceId(null);
    }
  };

  return (
    <div>
      {/* Campus Advertisements Spotlight Carousel */}
      <AdBanner />

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <div className="d-flex align-items-center gap-3 flex-wrap">
            <h2 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>Services Marketplace</h2>
            <WeatherWidget />
          </div>
          <p className="text-muted mb-0 mt-1">
            {isProvider
              ? 'Manage and publish your student service listings on the campus marketplace.'
              : 'Explore, request, and book active student services across campus.'}
          </p>
        </div>
        {isProvider && (
          <Button
            className="neu-btn-primary rounded-pill px-4"
            onClick={() => setShowCreateModal(true)}
          >
            + Add New Service
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {message && (
        <Alert variant="success" dismissible onClose={() => setMessage('')}>
          {message}
        </Alert>
      )}

      <ServicesGrid
        services={services}
        isLoading={isLoading}
        onBookService={handleBookService}
        onEditService={handleOpenEdit}
        onDeleteService={handleDeleteService}
        onToggleStatus={handleToggleServiceStatus}
        bookingServiceId={bookingServiceId}
      />

      {/* ─── CREATE SERVICE MODAL (Provider Only) ─── */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered scrollable>
        <Modal.Header closeButton style={{ background: 'var(--neu-bg-dark)', borderBottom: '1px solid rgba(154, 172, 196, 0.35)' }}>
          <Modal.Title className="fw-bold fs-5" style={{ color: 'var(--neu-text)' }}>Add New Service</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateService}>
          <Modal.Body className="p-4" style={{ background: 'var(--neu-bg)' }}>
            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group controlId="serviceCategory">
                  <Form.Label className="small fw-semibold text-muted">Service Category *</Form.Label>
                  <Form.Select
                    className="neu-input"
                    value={serviceForm.service_category}
                    onChange={(event) => {
                      const newCat = event.target.value;
                      const subOptions = SERVICE_TAXONOMY[newCat] || [];
                      setServiceForm({
                        ...serviceForm,
                        service_category: newCat,
                        subcategory: subOptions[0] || '',
                      });
                    }}
                    required
                  >
                    {Object.keys(SERVICE_TAXONOMY).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="serviceSubcategory">
                  <Form.Label className="small fw-semibold text-muted">Subcategory / Specialization *</Form.Label>
                  <Form.Select
                    className="neu-input"
                    value={serviceForm.subcategory}
                    onChange={(event) =>
                      setServiceForm({ ...serviceForm, subcategory: event.target.value })
                    }
                    required
                  >
                    {(SERVICE_TAXONOMY[serviceForm.service_category] || []).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group controlId="serviceDescription" className="mb-3">
              <Form.Label className="small fw-semibold text-muted">Service Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                className="neu-input"
                placeholder="Describe your service, what is included, tools used, and deliverables..."
                value={serviceForm.service_description}
                onChange={(event) =>
                  setServiceForm({ ...serviceForm, service_description: event.target.value })
                }
                required
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group controlId="serviceAmount">
                  <Form.Label className="small fw-semibold text-muted">Service Rate (₱) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    step="0.01"
                    className="neu-input"
                    placeholder="e.g. 150.00"
                    value={serviceForm.amount_topay}
                    onChange={(event) =>
                      setServiceForm({ ...serviceForm, amount_topay: event.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="serviceRateUnit">
                  <Form.Label className="small fw-semibold text-muted">Rate Type</Form.Label>
                  <Form.Select
                    className="neu-input"
                    value={serviceForm.rate_unit}
                    onChange={(event) =>
                      setServiceForm({ ...serviceForm, rate_unit: event.target.value })
                    }
                  >
                    <option value="per_service">Per Service / Project</option>
                    <option value="per_hour">Per Hour</option>
                    <option value="per_page">Per Page</option>
                    <option value="per_session">Per Session</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Picture Upload / URL & Placeholder Choice */}
            <PictureProofManager
              pictures={serviceForm.picture_proof}
              onChange={(updatedPics) => setServiceForm({ ...serviceForm, picture_proof: updatedPics })}
            />
          </Modal.Body>
          <Modal.Footer style={{ background: 'var(--neu-bg-dark)', borderTop: '1px solid rgba(154, 172, 196, 0.35)' }}>
            <Button className="neu-btn-ghost" onClick={() => setShowCreateModal(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" className="neu-btn-primary" disabled={isSaving}>
              {isSaving ? 'Adding Service...' : 'Add Service'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ─── EDIT SERVICE MODAL (Provider Only) ─── */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered scrollable>
        <Modal.Header closeButton style={{ background: 'var(--neu-bg-dark)', borderBottom: '1px solid rgba(154, 172, 196, 0.35)' }}>
          <Modal.Title className="fw-bold fs-5" style={{ color: 'var(--neu-text)' }}>Edit Service Listing</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateService}>
          <Modal.Body className="p-4" style={{ background: 'var(--neu-bg)' }}>
            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group controlId="editServiceCategory">
                  <Form.Label className="small fw-semibold text-muted">Service Category *</Form.Label>
                  <Form.Select
                    className="neu-input"
                    value={editForm.service_category}
                    onChange={(event) => {
                      const newCat = event.target.value;
                      const subOptions = SERVICE_TAXONOMY[newCat] || [];
                      setEditForm({
                        ...editForm,
                        service_category: newCat,
                        subcategory: subOptions[0] || '',
                      });
                    }}
                    required
                  >
                    {Object.keys(SERVICE_TAXONOMY).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="editServiceSubcategory">
                  <Form.Label className="small fw-semibold text-muted">Subcategory / Specialization *</Form.Label>
                  <Form.Select
                    className="neu-input"
                    value={editForm.subcategory}
                    onChange={(event) =>
                      setEditForm({ ...editForm, subcategory: event.target.value })
                    }
                    required
                  >
                    {(SERVICE_TAXONOMY[editForm.service_category] || []).map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group controlId="editServiceDescription" className="mb-3">
              <Form.Label className="small fw-semibold text-muted">Service Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                className="neu-input"
                value={editForm.service_description}
                onChange={(event) =>
                  setEditForm({ ...editForm, service_description: event.target.value })
                }
                required
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group controlId="editServiceAmount">
                  <Form.Label className="small fw-semibold text-muted">Service Rate (₱) *</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    step="0.01"
                    className="neu-input"
                    value={editForm.amount_topay}
                    onChange={(event) =>
                      setEditForm({ ...editForm, amount_topay: event.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="editServiceRateUnit">
                  <Form.Label className="small fw-semibold text-muted">Rate Type</Form.Label>
                  <Form.Select
                    className="neu-input"
                    value={editForm.rate_unit}
                    onChange={(event) =>
                      setEditForm({ ...editForm, rate_unit: event.target.value })
                    }
                  >
                    <option value="per_service">Per Service / Project</option>
                    <option value="per_hour">Per Hour</option>
                    <option value="per_page">Per Page</option>
                    <option value="per_session">Per Session</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* Picture Upload / URL & Placeholder Choice */}
            <PictureProofManager
              pictures={editForm.picture_proof}
              onChange={(updatedPics) => setEditForm({ ...editForm, picture_proof: updatedPics })}
            />
          </Modal.Body>
          <Modal.Footer style={{ background: 'var(--neu-bg-dark)', borderTop: '1px solid rgba(154, 172, 196, 0.35)' }}>
            <Button className="neu-btn-ghost" onClick={() => setShowEditModal(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button type="submit" className="neu-btn-primary" disabled={isUpdating}>
              {isUpdating ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
