import { useCallback, useEffect, useState, useMemo } from 'react';
import { Alert, Button, Form, Modal, Row, Col, Badge } from 'react-bootstrap';
import api from '../api/axios';
import ServicesGrid from '../components/ServicesGrid';
import { queueOfflineAction } from '../utils/offlineQueue';

const emptyService = {
  service_category: '',
  subcategory: '',
  service_description: '',
  amount_topay: '',
  rate_unit: 'per_service',
  picture_proof: '',
};

const getRequestError = (error) =>
  error.response?.data?.error ||
  error.message ||
  'The service request failed. Please try again.';

export default function ServicesPage() {
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
  }, []);

  useEffect(() => {
    let isMounted = true;

    api.get('/services')
      .then(({ data }) => {
        if (!Array.isArray(data.services)) {
          throw new Error('The server returned an invalid services list.');
        }
        if (isMounted) {
          setServices(data.services);
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(getRequestError(requestError));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateService = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);

    try {
      const pictureProof = serviceForm.picture_proof
        .split(/\r?\n/)
        .map((url) => url.trim())
        .filter(Boolean);

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
      picture_proof: Array.isArray(service.picture_proof) ? service.picture_proof.join('\n') : '',
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
      const pictureProof = editForm.picture_proof
        .split(/\r?\n/)
        .map((url) => url.trim())
        .filter(Boolean);

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
      setMessage('Your service was removed successfully.');
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
      setMessage(
        `Booking confirmed! Transaction ID: #${data.transaction.transaction_id}. Scheduled for ${bookingDate} (${startTime} to ${endTime}). QR Code generated. Visit Transactions to view.`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>
            {isProvider ? 'My Offered Services' : 'Campus Services Directory'}
          </h2>
          <p className="text-muted mb-0">
            {isProvider
              ? 'Manage and publish your student service offerings with flexible rates.'
              : 'Browse and book active student services across campus with flexible scheduling.'}
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
        />
      )}

      {/* 1. Create Service Modal with Rate Options */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} centered>
        <Modal.Header closeButton style={{ background: 'var(--neu-bg-dark)', borderBottom: '1px solid rgba(154, 172, 196, 0.35)' }}>
          <Modal.Title className="fw-bold fs-5" style={{ color: 'var(--neu-text)' }}>Add a Service</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateService}>
          <Modal.Body style={{ background: 'var(--neu-bg)' }}>
            <Form.Group className="mb-3" controlId="serviceCategory">
              <Form.Label className="small fw-semibold text-muted">Category</Form.Label>
              <Form.Control
                className="neu-input"
                placeholder="e.g. Creative, Event Support, Digital Service"
                value={serviceForm.service_category}
                onChange={(event) => setServiceForm({ ...serviceForm, service_category: event.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="serviceSubcategory">
              <Form.Label className="small fw-semibold text-muted">Service Name / Title</Form.Label>
              <Form.Control
                className="neu-input"
                placeholder="e.g. Graphic Design & Poster Layout"
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
                placeholder="Detail what tasks you provide, equipment, and prerequisites..."
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

            <Form.Group controlId="servicePictureProof">
              <Form.Label className="small fw-semibold text-muted">Picture Proof URLs (optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                className="neu-input"
                value={serviceForm.picture_proof}
                onChange={(event) => setServiceForm({ ...serviceForm, picture_proof: event.target.value })}
                placeholder="Enter one http(s) URL per line"
              />
            </Form.Group>
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

      {/* 2. Edit Service Modal with Rate Options */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton style={{ background: 'var(--neu-bg-dark)', borderBottom: '1px solid rgba(154, 172, 196, 0.35)' }}>
          <Modal.Title className="fw-bold fs-5" style={{ color: 'var(--neu-text)' }}>Edit Service</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateService}>
          <Modal.Body style={{ background: 'var(--neu-bg)' }}>
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

            <Form.Group controlId="editServicePictureProof">
              <Form.Label className="small fw-semibold text-muted">Picture Proof URLs (optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                className="neu-input"
                value={editForm.picture_proof}
                onChange={(event) => setEditForm({ ...editForm, picture_proof: event.target.value })}
                placeholder="Enter one http(s) URL per line"
              />
            </Form.Group>
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
