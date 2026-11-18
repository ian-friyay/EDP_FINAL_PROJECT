import { useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Form, Modal, Row, Col, Badge, InputGroup } from 'react-bootstrap';
import api from '../api/axios';
import ServicesGrid from '../components/ServicesGrid';
import WeatherWidget from '../components/WeatherWidget';
import AdBanner from '../components/AdBanner';
import { DEFAULT_SERVICE_PLACEHOLDER } from '../utils/placeholder';
import { queueOfflineAction } from '../utils/offlineQueue';

const emptyService = {
  service_category: '',
  subcategory: '',
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

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          onChange([...pictures, result]);
        }
      };
      reader.readAsDataURL(file);
    });
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
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>PNG, JPG, or WEBP up to 2MB</span>
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
                  className="position-absolute top-0 end-0 btn btn-danger btn-sm p-0 d-flex align-items-center justify-content-center rounded-circle shadow-sm"
                  style={{ width: 20, height: 20, transform: 'translate(30%, -30%)', fontSize: '12px' }}
                  onClick={() => handleRemove(idx)}
                  title="Remove photo"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ background: 'var(--neu-bg-dark)', border: '1px dashed rgba(154, 172, 196, 0.45)' }}>
          <img
            src={DEFAULT_SERVICE_PLACEHOLDER}
            alt="Placeholder"
            style={{ width: 84, height: 58, objectFit: 'cover', borderRadius: 6 }}
          />
          <div>
            <div className="small fw-semibold" style={{ color: 'var(--neu-text)' }}>No picture added yet</div>
            <div className="text-muted" style={{ fontSize: '0.75rem' }}>
              SerbisYou default placeholder graphic ("image of an image") will be displayed automatically on the service card.
            </div>
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
  const [editingService, setEditingService] = useState(null);
  const [editForm, setEditForm] = useState(emptyService);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [bookingServiceId, setBookingServiceId] = useState(null);
  const [deletingServiceId, setDeletingServiceId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Student Requestor Booking Details Modal State
  const [bookingModalService, setBookingModalService] = useState(null);
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [bookingNotes, setBookingNotes] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const currentUserId = window.localStorage.getItem('user_id');

  const refreshServices = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const publicRes = await api.get('/services');
      const publicList = Array.isArray(publicRes.data?.services) ? publicRes.data.services : [];

      let mergedList = [...publicList];

      const token = window.localStorage.getItem('token');
      if (token && currentUserId) {
        try {
          const myRes = await api.get('/services/mine');
          if (Array.isArray(myRes.data?.services)) {
            const myMap = new Map();
            myRes.data.services.forEach((s) => myMap.set(String(s.service_id), s));
            mergedList = mergedList.filter((s) => !myMap.has(String(s.service_id)));
            mergedList = [...myRes.data.services, ...mergedList];
          }
        } catch {
          // Non-blocking if /services/mine is unreachable
        }
      }

      setServices(mergedList);
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
      setMessage('Your service was added to the marketplace.');
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
      picture_proof: Array.isArray(service.picture_proof) ? service.picture_proof : [],
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

  const handleDeleteService = async (service) => {
    setError('');
    setMessage('');
    setDeletingServiceId(service.service_id);

    try {
      await api.patch(`/services/${encodeURIComponent(service.service_id)}/soft-delete`);
      setMessage('Your service was removed from the marketplace.');
      await refreshServices();
    } catch (requestError) {
      setError(getRequestError(requestError));
    } finally {
      setDeletingServiceId(null);
    }
  };

  // Open the Booking Details Modal when a student clicks "Book Service"
  const handleOpenBooking = (service) => {
    setError('');
    setMessage('');
    setBookingModalService(service);
    const today = new Date().toISOString().split('T')[0];
    setBookingDate(today);
    setStartTime('09:00');
    setEndTime('12:00');
    setBookingNotes('');
  };

  const handleBookService = async (service, bookingDetails = {}) => {
    handleOpenBooking(service);
  };

  // Compute duration and service cost dynamically inside booking modal
  const { calculatedHours, calculatedServiceCost } = useMemo(() => {
    if (!bookingModalService) return { calculatedHours: 1, calculatedServiceCost: 0 };
    const base = Number(bookingModalService.amount_topay) || 0;

    if (bookingModalService.rate_unit === 'per_hour' && startTime && endTime) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startMin = startH * 60 + (startM || 0);
      const endMin = endH * 60 + (endM || 0);
      if (endMin > startMin) {
        const hours = (endMin - startMin) / 60;
        return {
          calculatedHours: hours,
          calculatedServiceCost: Number((hours * base).toFixed(2)),
        };
      }
    }

    return { calculatedHours: 1, calculatedServiceCost: base };
  }, [bookingModalService, startTime, endTime]);

  // Execute booking submission with schedule and notes
  const handleConfirmBooking = async (event) => {
    event.preventDefault();
    if (!bookingModalService) return;

    const service = bookingModalService;
    setError('');
    setMessage('');
    setBookingServiceId(service.service_id);
    setBookingModalService(null);

    const payload = {
      service_id: service.service_id,
      notes: bookingNotes.trim(),
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
      custom_amount: calculatedServiceCost,
    };

    try {
      // Check if browser is currently offline
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await queueOfflineAction({
          endpoint: '/transactions',
          method: 'post',
          payload,
          description: `Booking: ${service.subcategory || service.service_category} on ${bookingDate} (${startTime} - ${endTime})`,
        });
        setMessage(
          `Offline Mode: Your booking request has been queued locally in IndexedDB with your schedule (${startTime} - ${endTime}) and notes. It will automatically sync when reconnected.`
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const { data } = await api.post('/transactions', payload);
      const txId = data.transaction?.transaction_id;
      if (txId) {
        navigate(`/transactions/${txId}/qr`, {
          state: {
            message: `Booking confirmed! Transaction #${txId} created. Scheduled for ${bookingDate} (${startTime} to ${endTime}). QR Code generated.`,
          },
        });
      } else {
        setMessage(
          `Booking confirmed! Transaction ID: #${data.transaction.transaction_id}. Scheduled for ${bookingDate} (${startTime} to ${endTime}). QR Code generated. Visit Transactions to view.`
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
            description: `Booking: ${service.subcategory || service.service_category} on ${bookingDate} (${startTime} - ${endTime})`,
          });
          setMessage(
            `Connection issue: Your booking request with notes & schedule has been queued locally and will automatically sync upon reconnection.`
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
      {/* Campus Weather & Events Advisory */}
      <WeatherWidget compact={true} />

      {/* Campus Advertisements Spotlight Carousel */}
      <AdBanner />

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>Services Marketplace</h2>
          <p className="text-muted mb-0">
            Browse and book active community services, or publish your own with flexible rates.
          </p>
        </div>
        <Button
          className="neu-btn-primary rounded-pill px-4"
          onClick={() => setShowCreateModal(true)}
        >
          + Add New Service
        </Button>
      </div>

      {message && <Alert variant="success" dismissible onClose={() => setMessage('')} className="neu-alert">{message}</Alert>}
      {error && <Alert variant="danger" role="alert" className="neu-alert">{error}</Alert>}

      {isLoading ? (
        <div className="text-center text-muted py-5" role="status">Loading services...</div>
      ) : (
        <ServicesGrid
          services={services}
          currentUserId={currentUserId}
          onDeleteService={handleDeleteService}
          deletingServiceId={deletingServiceId}
          onEditService={handleOpenEdit}
          onBookService={handleOpenBooking}
          bookingServiceId={bookingServiceId}
          onToggleStatus={handleToggleServiceStatus}
        />
      )}

      {/* Create Service Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered scrollable size="lg">
        <Modal.Header closeButton style={{ background: 'var(--neu-bg-dark)', borderBottom: '1px solid rgba(154, 172, 196, 0.35)' }}>
          <Modal.Title className="fw-bold fs-5" style={{ color: 'var(--neu-text)' }}>Add a Service</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateService}>
          <Modal.Body style={{ background: 'var(--neu-bg)', maxHeight: 'calc(85vh - 130px)', overflowY: 'auto' }}>
            <Form.Group className="mb-3" controlId="serviceCategory">
              <Form.Label className="small fw-semibold text-muted">Category</Form.Label>
              <Form.Control
                className="neu-input"
                placeholder="e.g. Creatives, Plumbing, Electrical, Digital Service"
                value={serviceForm.service_category}
                onChange={(event) => setServiceForm({ ...serviceForm, service_category: event.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="serviceSubcategory">
              <Form.Label className="small fw-semibold text-muted">Service Name / Title</Form.Label>
              <Form.Control
                className="neu-input"
                placeholder="e.g. Graphic Design, Pipe Leak Repair, Tutoring"
                value={serviceForm.subcategory}
                onChange={(event) => setServiceForm({ ...serviceForm, subcategory: event.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="serviceDescription">
              <Form.Label className="small fw-semibold text-muted">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                className="neu-input"
                placeholder="Describe your service scope, inclusions, and timeline..."
                value={serviceForm.service_description}
                onChange={(event) => setServiceForm({ ...serviceForm, service_description: event.target.value })}
                required
              />
            </Form.Group>

            {/* Price & Booking Rate Unit Option */}
            <Row className="mb-3 g-2">
              <Col sm={7}>
                <Form.Group controlId="serviceAmount">
                  <Form.Label className="small fw-semibold text-muted">Price (₱)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    className="neu-input"
                    placeholder="0.00"
                    value={serviceForm.amount_topay}
                    onChange={(event) => setServiceForm({ ...serviceForm, amount_topay: event.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col sm={5}>
                <Form.Group controlId="serviceRateUnit">
                  <Form.Label className="small fw-semibold text-muted">Booking Option</Form.Label>
                  <Form.Select
                    className="neu-input"
                    value={serviceForm.rate_unit || 'per_service'}
                    onChange={(event) => setServiceForm({ ...serviceForm, rate_unit: event.target.value })}
                  >
                    <option value="per_service">Per Service (Flat)</option>
                    <option value="per_hour">Per Hour</option>
                    <option value="per_day">Per Day</option>
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
            <Button type="submit" className="neu-btn-primary px-4 fw-semibold" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Create Service'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit Service Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered scrollable size="lg">
        <Modal.Header closeButton style={{ background: 'var(--neu-bg-dark)', borderBottom: '1px solid rgba(154, 172, 196, 0.35)' }}>
          <Modal.Title className="fw-bold fs-5" style={{ color: 'var(--neu-text)' }}>Edit Service</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateService}>
          <Modal.Body style={{ background: 'var(--neu-bg)', maxHeight: 'calc(85vh - 130px)', overflowY: 'auto' }}>
            <Form.Group className="mb-3" controlId="editServiceCategory">
              <Form.Label className="small fw-semibold text-muted">Category</Form.Label>
              <Form.Control
                className="neu-input"
                value={editForm.service_category}
                onChange={(event) => setEditForm({ ...editForm, service_category: event.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="editServiceSubcategory">
              <Form.Label className="small fw-semibold text-muted">Service Name / Title</Form.Label>
              <Form.Control
                className="neu-input"
                value={editForm.subcategory}
                onChange={(event) => setEditForm({ ...editForm, subcategory: event.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="editServiceDescription">
              <Form.Label className="small fw-semibold text-muted">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                className="neu-input"
                value={editForm.service_description}
                onChange={(event) => setEditForm({ ...editForm, service_description: event.target.value })}
                required
              />
            </Form.Group>
            {/* Price & Booking Rate Unit Option */}
            <Row className="mb-3 g-2">
              <Col sm={7}>
                <Form.Group controlId="editServiceAmount">
                  <Form.Label className="small fw-semibold text-muted">Price (₱)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="0.01"
                    className="neu-input"
                    value={editForm.amount_topay}
                    onChange={(event) => setEditForm({ ...editForm, amount_topay: event.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col sm={5}>
                <Form.Group controlId="editServiceRateUnit">
                  <Form.Label className="small fw-semibold text-muted">Booking Option</Form.Label>
                  <Form.Select
                    className="neu-input"
                    value={editForm.rate_unit || 'per_service'}
                    onChange={(event) => setEditForm({ ...editForm, rate_unit: event.target.value })}
                  >
                    <option value="per_service">Per Service (Flat)</option>
                    <option value="per_hour">Per Hour</option>
                    <option value="per_day">Per Day</option>
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
            <Button type="submit" className="neu-btn-primary px-4 fw-semibold" disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 3. Student Requestor Booking Details Modal (Hours Needed & Notes) */}
      <Modal show={Boolean(bookingModalService)} onHide={() => setBookingModalService(null)} centered>
        <Modal.Header closeButton style={{ background: 'var(--neu-bg-dark)', borderBottom: '1px solid rgba(154, 172, 196, 0.35)' }}>
          <Modal.Title className="fw-bold fs-5" style={{ color: 'var(--neu-text)' }}>
            Book Service Appointment
          </Modal.Title>
        </Modal.Header>
        {bookingModalService && (
          <Form onSubmit={handleConfirmBooking}>
            <Modal.Body style={{ background: 'var(--neu-bg)' }}>
              {/* Service Summary Card */}
              <div className="p-3 mb-3 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.65)', border: '1px solid rgba(154, 172, 196, 0.3)' }}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <h6 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>
                    {bookingModalService.subcategory || bookingModalService.service_category}
                  </h6>
                  <Badge bg="primary">
                    {bookingModalService.service_category}
                  </Badge>
                </div>
                <div className="small text-muted mb-2 font-monospace">
                  Provider: {bookingModalService.user_id}
                </div>
                <div className="d-flex justify-content-between align-items-center small">
                  <span className="text-muted">Rate Type:</span>
                  <span className="fw-bold text-capitalize" style={{ color: 'var(--neu-text)' }}>
                    {bookingModalService.rate_unit === 'per_hour'
                      ? `₱${Number(bookingModalService.amount_topay).toFixed(2)} / Hour`
                      : bookingModalService.rate_unit === 'per_day'
                      ? `₱${Number(bookingModalService.amount_topay).toFixed(2)} / Day`
                      : `₱${Number(bookingModalService.amount_topay).toFixed(2)} / Service (Flat)`}
                  </span>
                </div>
              </div>

              {/* Service Date */}
              <Form.Group className="mb-3" controlId="bookingDate">
                <Form.Label className="small fw-semibold text-muted">
                  Service Date <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="date"
                  className="neu-input"
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                />
              </Form.Group>

              {/* Scheduled Hours (What hour needed and until) */}
              <Row className="mb-3 g-2">
                <Col sm={6}>
                  <Form.Group controlId="bookingStartTime">
                    <Form.Label className="small fw-semibold text-muted">
                      Hour Needed From <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="time"
                      className="neu-input"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group controlId="bookingEndTime">
                    <Form.Label className="small fw-semibold text-muted">
                      Until Hour <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="time"
                      className="neu-input"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* Notes & Instructions for Provider */}
              <Form.Group className="mb-3" controlId="bookingNotes">
                <Form.Label className="small fw-semibold text-muted">
                  Notes &amp; Special Instructions for Provider
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  className="neu-input"
                  placeholder="Specify campus location, room details, materials needed, or specific tasks for the student provider..."
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                />
              </Form.Group>

              {/* Calculated Pricing Summary */}
              <div className="neu-price-box p-3 rounded-3 mt-3">
                <div className="d-flex justify-content-between text-muted small mb-1">
                  <span>
                    Service Fee {bookingModalService.rate_unit === 'per_hour' ? `(${calculatedHours} hr${calculatedHours > 1 ? 's' : ''})` : ''}:
                  </span>
                  <span className="fw-bold" style={{ color: 'var(--neu-text)' }}>
                    ₱{calculatedServiceCost.toFixed(2)}
                  </span>
                </div>
                <div className="d-flex justify-content-between text-muted small mb-1">
                  <span>Platform Booking Fee:</span>
                  <span style={{ color: 'var(--neu-text)' }}>₱5.00</span>
                </div>
                <hr className="my-1 border-secondary opacity-25" />
                <div className="d-flex justify-content-between align-items-center">
                  <span className="fw-bold small" style={{ color: 'var(--neu-text)' }}>Total to Pay:</span>
                  <strong className="fs-5" style={{ color: '#063a8f' }}>
                    ₱{(calculatedServiceCost + 5).toFixed(2)}
                  </strong>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer style={{ background: 'var(--neu-bg-dark)', borderTop: '1px solid rgba(154, 172, 196, 0.35)' }}>
              <Button className="neu-btn-ghost" onClick={() => setBookingModalService(null)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="neu-btn-primary px-4 fw-semibold"
                disabled={bookingServiceId === bookingModalService.service_id}
              >
                {bookingServiceId === bookingModalService.service_id ? 'Confirming...' : 'Confirm Booking'}
              </Button>
            </Modal.Footer>
          </Form>
        )}
      </Modal>
    </div>
  );
}
