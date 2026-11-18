import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { DEFAULT_SERVICE_PLACEHOLDER } from '../utils/placeholder';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Button,
  Form,
  InputGroup,
  Modal,
  Alert,
} from 'react-bootstrap';

// 3 Dummy Service Objects strictly matching the Universal Database Schema
const INITIAL_SERVICES = [
  {
    service_id: 'SRV-101',
    user_id: 'MMC-1042',
    provider_name: 'Juan Dela Cruz',
    provider_location: 'Brgy. Central, Quezon City',
    service_category: 'Home Maintenance',
    subcategory: 'Aircon Cleaning & Maintenance',
    service_description:
      'Professional split-type and window-type air conditioning unit cleaning. Includes chemical coil wash, fan blower cleaning, freon pressure diagnostic, and drainage flush.',
    amount_topay: 850.0,
    service_status: 'active',
    picture_proof: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    ],
    is_deleted: false,
  },
  {
    service_id: 'SRV-102',
    user_id: 'MMC-2015',
    provider_name: 'Maria Santos',
    provider_location: 'Brgy. Batasan Hills, Quezon City',
    service_category: 'Plumbing & Sanitation',
    subcategory: 'Pipe Installation & Leak Repair',
    service_description:
      'Emergency pipe repair, bathroom sink unclogging, PVC and GI pipe fitting, and high-pressure water leak troubleshooting. Tools and standard sealants provided.',
    amount_topay: 1200.0,
    service_status: 'active',
    picture_proof: [
      'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=800&auto=format&fit=crop&q=80',
    ],
    is_deleted: false,
  },
  {
    service_id: 'SRV-103',
    user_id: 'MMC-3044',
    provider_name: 'Pedro Penduko',
    provider_location: 'Brgy. Commonwealth, Quezon City',
    service_category: 'Electrical Works',
    subcategory: 'Residential Circuit & Breaker Wiring',
    service_description:
      'Comprehensive home electrical inspection, short-circuit troubleshooting, breaker panel replacement, main line re-routing, and smart lighting installations.',
    amount_topay: 2500.0,
    service_status: 'active',
    picture_proof: [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544724569-5f546fd6f2b6?w=800&auto=format&fit=crop&q=80',
    ],
    is_deleted: false,
  },
];

export default function ServicesGrid({
  services = INITIAL_SERVICES,
  currentUserId,
  onDeleteService,
  deletingServiceId,
  onEditService,
  onBookService,
  bookingServiceId,
}) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeModalService, setActiveModalService] = useState(null);
  const [bookingSuccessAlert, setBookingSuccessAlert] = useState(null);

  // Booking & Campus Rendezvous Modal State
  const [bookingModalService, setBookingModalService] = useState(null);
  const [rendezvousLocation, setRendezvousLocation] = useState('Main Campus - Student Center');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Service Reviews State
  const [serviceReviews, setServiceReviews] = useState([]);
  const [avgRating, setAvgRating] = useState('5.0');

  useEffect(() => {
    if (!activeModalService?.service_id) {
      setServiceReviews([]);
      setAvgRating('5.0');
      return;
    }
    api.get(`/reviews/service/${activeModalService.service_id}`)
      .then((res) => {
        if (res.data?.reviews) {
          setServiceReviews(res.data.reviews);
          setAvgRating(res.data.averageRating ? String(res.data.averageRating) : '5.0');
        }
      })
      .catch(() => {});
  }, [activeModalService]);

  // Extract unique categories for the dropdown filter
  const categories = useMemo(() => {
    const set = new Set(services.map((s) => s.service_category));
    return Array.from(set);
  }, [services]);

  // Filter services by search term, category, and soft-delete status (is_deleted === false)
  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      // Exclude soft-deleted items
      if (item.is_deleted) return false;

      // Category filter
      const matchesCategory =
        selectedCategory === 'ALL' || item.service_category === selectedCategory;

      // Search keyword filter
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (item.subcategory || '').toLowerCase().includes(query) ||
        (item.service_description || '').toLowerCase().includes(query) ||
        (item.service_category || '').toLowerCase().includes(query) ||
        (item.user_id || '').toLowerCase().includes(query) ||
        (item.provider_name && item.provider_name.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [services, searchTerm, selectedCategory]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
  };

  const handleOpenBookingModal = (service) => {
    setActiveModalService(null);
    setBookingModalService(service);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    setScheduledDateTime(tomorrow.toISOString().slice(0, 16));
  };

  const handleExecuteBooking = async () => {
    if (!bookingModalService) return;
    setIsSubmittingBooking(true);
    const service = bookingModalService;
    const bookingDetails = {
      rendezvous_location: rendezvousLocation,
      scheduled_date: scheduledDateTime || new Date().toISOString(),
      special_instructions: specialInstructions,
    };

    if (onBookService) {
      await onBookService(service, bookingDetails);
      setIsSubmittingBooking(false);
      setBookingModalService(null);
    } else {
      try {
        const { data } = await api.post('/transactions', {
          service_id: service.service_id,
          ...bookingDetails,
        });
        const txId = data.transaction?.transaction_id;
        setBookingModalService(null);
        if (txId) {
          navigate(`/transactions/${txId}/qr`);
          return;
        }
      } catch {
        // ignore
      }
      setIsSubmittingBooking(false);
      navigate('/transactions');
    }
  };

  return (
    <div className="services-grid-wrapper">
      {/* Booking Feedback Alert */}
      {bookingSuccessAlert && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setBookingSuccessAlert(null)}
          className="neu-alert rounded-4 border-0 mb-4"
        >
          <div className="d-flex align-items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
            </svg>
            <div>
              <strong>Booking Initiated!</strong> {bookingSuccessAlert}
            </div>
          </div>
        </Alert>
      )}

      {/* Header and Filter Bar */}
      <div className="neu-filter-bar p-3 p-md-4 mb-4">
        <Row className="g-3 align-items-center">
          {/* Search Bar */}
          <Col lg={7}>
            <Form.Label htmlFor="service-search-input" className="visually-hidden">
              Search Services
            </Form.Label>
            <InputGroup>
              <InputGroup.Text id="search-addon" className="neu-input-group-text">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                </svg>
              </InputGroup.Text>
              <Form.Control
                id="service-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search services by keyword, subcategory, or MMC provider ID..."
                aria-describedby="search-addon"
                className="neu-input border-start-0"
              />
              {searchTerm && (
                <Button
                  variant="outline-secondary"
                  className="neu-input border-start-0 text-muted"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search text"
                >
                  &times;
                </Button>
              )}
            </InputGroup>
          </Col>

          {/* Category Dropdown Filter */}
          <Col sm={8} lg={3}>
            <Form.Label htmlFor="category-select" className="visually-hidden">
              Filter by Category
            </Form.Label>
            <Form.Select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="neu-select"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Form.Select>
          </Col>

          {/* Action / Reset Button */}
          <Col sm={4} lg={2} className="text-sm-end">
            <Button
              className="neu-btn-ghost w-100 text-nowrap"
              onClick={handleClearFilters}
              disabled={searchTerm === '' && selectedCategory === 'ALL'}
            >
              Reset Filters
            </Button>
          </Col>
        </Row>

        {/* Results Count & Current Active Filters Summary */}
        <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top flex-wrap gap-2 text-muted small">
          <div>
            Showing <strong style={{ color: 'var(--neu-text)' }}>{filteredServices.length}</strong> of{' '}
            <strong style={{ color: 'var(--neu-text)' }}>{services.length}</strong> active marketplace services
          </div>
          {selectedCategory !== 'ALL' && (
            <div>
              Active Filter:{' '}
              <Badge bg="primary" className="ms-1">
                {selectedCategory}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Services Cards Grid */}
      {filteredServices.length === 0 ? (
        <div className="neu-card text-center py-5">
          <div className="text-muted mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
            </svg>
          </div>
          <h5 className="fw-bold" style={{ color: 'var(--neu-text)' }}>No services found</h5>
          <p className="text-muted small mb-3">
            No service matched your search keyword or selected category.
          </p>
          <Button className="neu-btn-primary rounded-pill px-4" size="sm" onClick={handleClearFilters}>
            Clear All Filters
          </Button>
        </div>
      ) : (
        <div className="neu-scroll-list" style={{ maxHeight: '780px', overflowY: 'auto', paddingRight: '8px' }}>
          <Row xs={1} md={2} lg={3} className="g-4">
          {filteredServices.map((service) => {
            const amount = Number(service.amount_topay) || 0;
            const bookingFee = 5.0;
            const totalToPay = amount + bookingFee;
            const isOwner = Boolean(currentUserId && service.user_id === currentUserId);
            const hasCustomImage =
              Array.isArray(service.picture_proof) &&
              service.picture_proof.length > 0 &&
              Boolean(service.picture_proof[0]?.trim());
            const primaryImage = hasCustomImage
              ? service.picture_proof[0]
              : DEFAULT_SERVICE_PLACEHOLDER;

            return (
              <Col key={service.service_id}>
                <div className="neu-card h-100 d-flex flex-column">
                  {/* Service Photo / Picture Proof Thumbnail */}
                  <div className="position-relative">
                    <img
                      src={primaryImage}
                      alt={service.subcategory || service.service_category}
                      className="w-100 rounded-top-3"
                      style={{ height: '200px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_SERVICE_PLACEHOLDER;
                      }}
                    />
                    <div className="position-absolute top-0 start-0 m-3 d-flex gap-1 flex-wrap">
                      <Badge bg="primary" className="shadow-sm">
                        {service.service_category}
                      </Badge>
                      <Badge
                        bg={service.service_status === 'active' ? 'success' : 'secondary'}
                        className="shadow-sm text-capitalize"
                      >
                        {service.service_status || 'active'}
                      </Badge>
                    </div>
                    {service.picture_proof && service.picture_proof.length > 1 && (
                      <Badge
                        bg="dark"
                        className="position-absolute bottom-0 end-0 m-2 bg-opacity-75"
                      >
                        {service.picture_proof.length} Photos
                      </Badge>
                    )}
                  </div>

                  <div className="d-flex flex-column p-4 flex-grow-1">
                    {/* Provider Info conforming to users table */}
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="small font-monospace fw-semibold" style={{ color: 'var(--neu-primary)' }}>
                        Provider: {service.user_id}
                      </div>
                      <small className="text-muted font-monospace">{service.service_id}</small>
                    </div>

                    {/* Subcategory & Title */}
                    <h5 className="fw-bold mb-2" style={{ color: 'var(--neu-text)' }}>
                      {service.subcategory}
                    </h5>

                    {/* Service Description */}
                    <p
                      className="text-muted small flex-grow-1 mb-3"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {service.service_description}
                    </p>

                    {/* Pricing Breakdown matching transactions formula */}
                    <div className="neu-price-box rounded-3 p-3 mb-3 mt-auto">
                      <div className="d-flex justify-content-between align-items-center text-muted small mb-1">
                        <span>Service Rate:</span>
                        <span className="fw-bold" style={{ color: 'var(--neu-text)' }}>
                          ₱{amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center text-muted small mb-1">
                        <span>Platform Booking Fee:</span>
                        <span style={{ color: 'var(--neu-text)' }}>₱{bookingFee.toFixed(2)}</span>
                      </div>
                      <hr className="my-1 border-secondary opacity-25" />
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold small" style={{ color: 'var(--neu-text)' }}>Total to Pay:</span>
                        <strong className="fs-5" style={{ color: '#063a8f' }}>
                          ₱{totalToPay.toFixed(2)}
                        </strong>
                      </div>
                    </div>

                    {/* Card Actions */}
                    {isOwner ? (
                      <div className="d-flex gap-2">
                        <Button
                          className="neu-btn-outline w-50 fw-semibold"
                          size="sm"
                          onClick={() => onEditService && onEditService(service)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline-danger"
                          className="w-50 fw-semibold rounded-pill"
                          size="sm"
                          disabled={deletingServiceId === service.service_id}
                          onClick={() => onDeleteService && onDeleteService(service)}
                        >
                          {deletingServiceId === service.service_id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        <div className="d-flex gap-2">
                          <Button
                            className="neu-btn-outline w-50 fw-semibold"
                            size="sm"
                            onClick={() => setActiveModalService(service)}
                          >
                            View Details
                          </Button>
                          <Button
                            className="neu-btn-primary w-50 fw-semibold"
                            size="sm"
                            disabled={bookingServiceId === service.service_id}
                            onClick={() => handleOpenBookingModal(service)}
                          >
                            {bookingServiceId === service.service_id ? 'Booking...' : 'Book Now'}
                          </Button>
                        </div>
                        <Button
                          className="neu-btn-ghost w-100 fw-semibold d-flex align-items-center justify-content-center gap-2"
                          size="sm"
                          onClick={() => {
                            navigate(`/messages/${service.user_id}`, {
                              state: {
                                name: service.provider_name,
                                provider_name: service.provider_name,
                                service_name: service.subcategory || service.service_category,
                                initialMessage: `Hi ${service.provider_name || 'Provider'}, I'm interested in your service: ${service.subcategory || service.service_category}.`,
                              },
                            });
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                          </svg>
                          Message Provider
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      </div>
      )}

      {/* Details & Proof Modal */}
      {activeModalService && (
        <Modal
          show={!!activeModalService}
          onHide={() => setActiveModalService(null)}
          size="lg"
          centered
          scrollable
        >
          <Modal.Header closeButton className="border-bottom px-4 py-3" style={{ background: 'var(--neu-bg-dark)' }}>
            <Modal.Title className="fw-bold fs-5" style={{ color: 'var(--neu-text)' }}>
              {activeModalService.subcategory}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4" style={{ background: 'var(--neu-bg)', maxHeight: 'calc(85vh - 130px)', overflowY: 'auto' }}>
            {/* Picture Proof Gallery */}
            <div className="mb-4">
              <h6 className="fw-bold text-uppercase text-muted small mb-2">
                Service Proof Gallery (<code>picture_proof</code>)
              </h6>
              {Array.isArray(activeModalService.picture_proof) &&
              activeModalService.picture_proof.filter(Boolean).length > 0 ? (
                <Row className="g-2">
                  {activeModalService.picture_proof.filter(Boolean).map((imgUrl, idx) => (
                    <Col key={idx} xs={6} md={6}>
                      <img
                        src={imgUrl}
                        alt={`Proof ${idx + 1}`}
                        className="img-fluid rounded-3 border"
                        style={{ height: '180px', width: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_SERVICE_PLACEHOLDER;
                        }}
                      />
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="rounded-3 overflow-hidden border">
                  <img
                    src={DEFAULT_SERVICE_PLACEHOLDER}
                    alt="No picture provided"
                    className="w-100"
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                </div>
              )}
            </div>

            {/* Provider Details Card */}
            <div className="border rounded-4 p-3 p-md-4 mb-4" style={{ background: 'var(--neu-bg-dark)' }}>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="neu-avatar d-flex align-items-center justify-content-center fw-bold fs-4 flex-shrink-0"
                    style={{ width: 52, height: 52 }}
                  >
                    {activeModalService.provider_name
                      ? activeModalService.provider_name
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join('')
                          .toUpperCase()
                      : 'PR'}
                  </div>
                  <div>
                    <h5 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>
                      {activeModalService.provider_name}
                    </h5>
                    <div className="d-flex align-items-center gap-2 flex-wrap small">
                      <span className="text-muted font-monospace">
                        ID: <strong style={{ color: 'var(--neu-primary)' }}>{activeModalService.user_id}</strong>
                      </span>
                      <span className="text-muted">•</span>
                      <Badge bg="primary">{activeModalService.service_category}</Badge>
                      <span className="text-muted">•</span>
                      <span className="text-muted d-flex align-items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/>
                        </svg>
                        {activeModalService.provider_location}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  className="neu-btn-outline rounded-pill px-3 py-2 d-flex align-items-center gap-2 fw-semibold"
                  onClick={() => {
                    const targetService = activeModalService;
                    setActiveModalService(null);
                    navigate(`/messages/${targetService.user_id}`, {
                      state: {
                        name: targetService.provider_name,
                        provider_name: targetService.provider_name,
                        user_id: targetService.user_id,
                      },
                    });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                  </svg>
                  Chat with Provider
                </Button>
              </div>
            </div>

            {/* Full Service Description */}
            <div className="mb-4">
              <h6 className="fw-bold text-uppercase text-muted small mb-2">
                Service Scope &amp; Description
              </h6>
              <p className="text-secondary small mb-0">
                {activeModalService.service_description}
              </p>
            </div>

            {/* Financial & Commission Terms */}
            <div className="border rounded-3 p-3" style={{ background: 'var(--neu-bg-dark)' }}>
              <h6 className="fw-bold text-uppercase text-muted small mb-2">
                Transaction Calculation Breakdown
              </h6>
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>Base Service Rate (<code>amount_topay</code>):</span>
                <span className="fw-bold" style={{ color: 'var(--neu-text)' }}>₱{(Number(activeModalService.amount_topay) || 0).toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>Platform Booking Fee (<code>booking_fee</code>):</span>
                <span style={{ color: 'var(--neu-text)' }}>₱5.00 Flat</span>
              </div>
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>Provider Commission (5% of rate):</span>
                <span className="text-success">₱{((Number(activeModalService.amount_topay) || 0) * 0.05).toFixed(2)}</span>
              </div>
              <hr className="my-2" />
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold" style={{ color: 'var(--neu-text)' }}>Total Requestor to Pay (<code>total_topay</code>):</span>
                <strong className="fs-5" style={{ color: '#063a8f' }}>
                  ₱{((Number(activeModalService.amount_topay) || 0) + 5.0).toFixed(2)}
                </strong>
              </div>
            </div>

            {/* Customer Ratings & Reviews */}
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="fw-bold text-uppercase text-muted small mb-0">
                  Customer Ratings &amp; Reviews ({serviceReviews.length})
                </h6>
                <div className="d-flex align-items-center gap-1 fw-bold small" style={{ color: '#f59e0b' }}>
                  <span>★</span>
                  <span>{avgRating} / 5.0</span>
                </div>
              </div>

              {serviceReviews.length > 0 ? (
                <div className="d-flex flex-column gap-2">
                  {serviceReviews.slice(0, 3).map((r, i) => (
                    <div key={r.review_id || i} className="p-2.5 px-3 rounded-3 border" style={{ background: 'var(--neu-bg-dark)' }}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small fw-semibold" style={{ color: 'var(--neu-text)' }}>
                          {r.reviewer_name || r.reviewer_id}
                        </span>
                        <span style={{ color: '#f59e0b', fontSize: '0.85rem' }}>
                          {'★'.repeat(Math.round(r.rating || 5))}
                        </span>
                      </div>
                      <p className="small text-muted mb-0">{r.comment || 'Verified transaction completed.'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-center text-muted small rounded-3 border" style={{ background: 'var(--neu-bg-dark)' }}>
                  No customer reviews yet. Be the first to book and rate this service!
                </div>
              )}
            </div>
          </Modal.Body>

          <Modal.Footer className="border-top px-4 py-3 d-flex justify-content-between flex-wrap gap-2" style={{ background: 'var(--neu-bg-dark)' }}>
            <Button
              className="neu-btn-outline rounded-pill px-3 py-2 d-flex align-items-center gap-2 fw-semibold"
              onClick={() => {
                const targetService = activeModalService;
                setActiveModalService(null);
                navigate(`/messages/${targetService.user_id}`, {
                  state: {
                    name: targetService.provider_name,
                    provider_name: targetService.provider_name,
                    user_id: targetService.user_id,
                  },
                });
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
              </svg>
              Chat with Provider
            </Button>
            <div className="d-flex gap-2">
              <Button className="neu-btn-ghost" onClick={() => setActiveModalService(null)}>
                Close
              </Button>
              <Button
                className="neu-btn-primary px-4 fw-semibold"
                disabled={bookingServiceId === activeModalService.service_id}
                onClick={() => handleOpenBookingModal(activeModalService)}
              >
                {bookingServiceId === activeModalService.service_id
                  ? 'Booking...'
                  : `Select Rendezvous & Book (₱${((Number(activeModalService.amount_topay) || 0) + 5.0).toFixed(2)})`}
              </Button>
            </div>
          </Modal.Footer>
        </Modal>
      )}

      {/* Booking & Rendezvous Modal */}
      {bookingModalService && (
        <Modal
          show={!!bookingModalService}
          onHide={() => setBookingModalService(null)}
          centered
          scrollable
          size="md"
        >
          <Modal.Header
            closeButton
            style={{
              background: 'var(--neu-bg-dark)',
              borderBottom: '1px solid rgba(154, 172, 196, 0.35)',
            }}
          >
            <Modal.Title className="fw-bold fs-5" style={{ color: 'var(--neu-text)' }}>
              Confirm Booking &amp; Rendezvous
            </Modal.Title>
          </Modal.Header>

          <Modal.Body
            style={{
              background: 'var(--neu-bg)',
              maxHeight: 'calc(85vh - 130px)',
              overflowY: 'auto',
            }}
          >
            {/* Service Summary */}
            <div
              className="p-3 rounded-4 mb-3"
              style={{
                background: 'var(--neu-bg-dark)',
                border: '1px solid rgba(154, 172, 196, 0.35)',
              }}
            >
              <div className="small text-muted mb-1">Service:</div>
              <h6 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>
                {bookingModalService.subcategory || bookingModalService.service_category}
              </h6>
              <div className="small text-muted mb-2">
                Provider: <strong>{bookingModalService.provider_name || bookingModalService.user_id}</strong>
              </div>
              <hr className="my-2 border-secondary opacity-25" />
              <div className="d-flex justify-content-between text-muted small mb-1">
                <span>Service Rate:</span>
                <span>₱{Number(bookingModalService.amount_topay || 0).toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between text-muted small mb-1">
                <span>Platform Booking Fee:</span>
                <span>₱5.00</span>
              </div>
              <hr className="my-1 border-secondary opacity-25" />
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold small" style={{ color: 'var(--neu-text)' }}>Total to Pay:</span>
                <strong className="fs-5" style={{ color: '#063a8f' }}>
                  ₱{(Number(bookingModalService.amount_topay || 0) + 5.0).toFixed(2)}
                </strong>
              </div>
            </div>

            {/* Campus Weather Note */}
            <div
              className="p-2.5 px-3 rounded-3 mb-3 d-flex align-items-center gap-2 small"
              style={{
                background: 'rgba(25, 135, 84, 0.08)',
                border: '1px solid rgba(25, 135, 84, 0.25)',
                color: '#146c43',
              }}
            >
              <span>🌤️</span>
              <div>
                <strong>Campus Weather Advisory:</strong> Suitable conditions for campus landmark meetings &amp; photography handovers.
              </div>
            </div>

            {/* Rendezvous Location Selector */}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">
                📍 Campus Rendezvous Meeting Location <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                className="neu-input"
                value={rendezvousLocation}
                onChange={(e) => setRendezvousLocation(e.target.value)}
              >
                <option value="Main Campus - Student Center">
                  Main Campus - Student Center (Hub for creative &amp; event meetings)
                </option>
                <option value="IT &amp; Engineering Building">
                  IT &amp; Engineering Building (Tech support &amp; diagnostics)
                </option>
                <option value="Campus Gymnasium &amp; Auditorium">
                  Campus Gymnasium &amp; Auditorium (Photography &amp; sports)
                </option>
                <option value="University Library Commons">
                  University Library Commons (Consultations &amp; quiet review)
                </option>
              </Form.Select>
              <Form.Text className="text-muted" style={{ fontSize: '0.75rem' }}>
                Official campus rendezvous landmark where you and the student provider will meet.
              </Form.Text>
            </Form.Group>

            {/* Date and Time Selector */}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold text-muted">
                📅 Preferred Meeting Date &amp; Time
              </Form.Label>
              <Form.Control
                type="datetime-local"
                className="neu-input"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
              />
            </Form.Group>

            {/* Special Instructions */}
            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold text-muted">
                Notes for Provider (Optional)
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                className="neu-input"
                placeholder="e.g. I will be wearing a blue cap near the lobby entrance."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer
            style={{
              background: 'var(--neu-bg-dark)',
              borderTop: '1px solid rgba(154, 172, 196, 0.35)',
            }}
          >
            <Button
              className="neu-btn-ghost"
              onClick={() => setBookingModalService(null)}
              disabled={isSubmittingBooking}
            >
              Cancel
            </Button>
            <Button
              className="neu-btn-primary px-4 fw-semibold"
              disabled={isSubmittingBooking}
              onClick={handleExecuteBooking}
            >
              {isSubmittingBooking ? 'Confirming...' : 'Confirm & View QR Code'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}
