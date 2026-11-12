import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import api from '../api/axios';
import ServicesGrid from '../components/ServicesGrid';

const emptyService = {
  service_category: '',
  subcategory: '',
  service_description: '',
  amount_topay: '',
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
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const currentUserId = window.localStorage.getItem('user_id');

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
        picture_proof: pictureProof,
      });

      setServiceForm(emptyService);
      setShowCreateModal(false);
      setMessage('Your service was added.');
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

  const handleBookService = async (service) => {
    setError('');
    setMessage('');
    setBookingServiceId(service.service_id);

    try {
      const { data } = await api.post('/transactions', {
        service_id: service.service_id,
      });
      setMessage(
        `Booking confirmed! Transaction ID: ${data.transaction.transaction_id}. QR Code generated. Visit Transactions to view.`
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (requestError) {
      setError(getRequestError(requestError));
    } finally {
      setBookingServiceId(null);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>Services Marketplace</h2>
          <p className="text-muted mb-0">
            Browse and book active community services, or publish your own.
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
          onBookService={handleBookService}
          bookingServiceId={bookingServiceId}
        />
      )}

      {/* Create Service Modal */}
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
                value={serviceForm.service_category}
                onChange={(event) => setServiceForm({ ...serviceForm, service_category: event.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="serviceSubcategory">
              <Form.Label className="small fw-semibold text-muted">Service Name</Form.Label>
              <Form.Control
                className="neu-input"
                value={serviceForm.subcategory}
                onChange={(event) => setServiceForm({ ...serviceForm, subcategory: event.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="serviceDescription">
              <Form.Label className="small fw-semibold text-muted">Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                className="neu-input"
                value={serviceForm.service_description}
                onChange={(event) => setServiceForm({ ...serviceForm, service_description: event.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="serviceAmount">
              <Form.Label className="small fw-semibold text-muted">Price (₱)</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.01"
                className="neu-input"
                value={serviceForm.amount_topay}
                onChange={(event) => setServiceForm({ ...serviceForm, amount_topay: event.target.value })}
                required
              />
            </Form.Group>
            <Form.Group controlId="servicePictureProof">
              <Form.Label className="small fw-semibold text-muted">Picture Proof URLs (optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
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

      {/* Edit Service Modal */}
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
              <Form.Label className="small fw-semibold text-muted">Service Name</Form.Label>
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
                rows={4}
                className="neu-input"
                value={editForm.service_description}
                onChange={(event) => setEditForm({ ...editForm, service_description: event.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="editServiceAmount">
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
            <Form.Group controlId="editServicePictureProof">
              <Form.Label className="small fw-semibold text-muted">Picture Proof URLs (optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
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
    </div>
  );
}
