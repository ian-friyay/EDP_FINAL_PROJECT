import React, { useState, useMemo } from 'react';
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

export default function ServicesGrid({ services = INITIAL_SERVICES }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeModalService, setActiveModalService] = useState(null);
  const [bookingSuccessAlert, setBookingSuccessAlert] = useState(null);

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
        item.subcategory.toLowerCase().includes(query) ||
        item.service_description.toLowerCase().includes(query) ||
        item.service_category.toLowerCase().includes(query) ||
        item.user_id.toLowerCase().includes(query) ||
        (item.provider_name && item.provider_name.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [services, searchTerm, selectedCategory]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
  };

  const handleBookService = (service) => {
    setBookingSuccessAlert(
      `Booking request initiated for "${service.subcategory}". ₱5.00 booking fee applied. Total to pay: ₱${(service.amount_topay + 5).toFixed(2)}.`
    );
    setActiveModalService(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        <Row xs={1} md={2} lg={3} className="g-4">
          {filteredServices.map((service) => {
            const bookingFee = 5.0;
            const totalToPay = service.amount_topay + bookingFee;
            const primaryImage =
              service.picture_proof && service.picture_proof.length > 0
                ? service.picture_proof[0]
                : 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80';

            return (
              <Col key={service.service_id}>
                <div className="neu-card h-100 d-flex flex-column">
                  {/* Service Photo / Picture Proof Thumbnail */}
                  <div className="position-relative">
                    <img
                      src={primaryImage}
                      alt={service.subcategory}
                      className="w-100 rounded-top-3"
                      style={{ height: '200px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src =
                          'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80';
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
                        {service.service_status}
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
                          ₱{service.amount_topay.toFixed(2)}
                        </span>
                      </div>
                      <div className="d-flex justify-content-between align-items-center text-muted small mb-1">
                        <span>Platform Booking Fee:</span>
                        <span style={{ color: 'var(--neu-text)' }}>₱{bookingFee.toFixed(2)}</span>
                      </div>
                      <hr className="my-1 border-secondary opacity-25" />
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold small" style={{ color: 'var(--neu-text)' }}>Total to Pay:</span>
                        <strong className="fs-5" style={{ color: 'var(--neu-primary)' }}>
                          ₱{totalToPay.toFixed(2)}
                        </strong>
                      </div>
                    </div>

                    {/* Card Actions */}
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
                        onClick={() => handleBookService(service)}
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Details & Proof Modal */}
      {activeModalService && (
        <Modal
          show={!!activeModalService}
          onHide={() => setActiveModalService(null)}
          size="lg"
          centered
        >
          <Modal.Header closeButton className="border-bottom px-4 py-3" style={{ background: 'var(--neu-bg-dark)' }}>
            <Modal.Title className="fw-bold fs-5" style={{ color: 'var(--neu-text)' }}>
              {activeModalService.subcategory}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4" style={{ background: 'var(--neu-bg)' }}>
            {/* Picture Proof Gallery */}
            <div className="mb-4">
              <h6 className="fw-bold text-uppercase text-muted small mb-2">
                Service Proof Gallery (<code>picture_proof</code>)
              </h6>
              <Row className="g-2">
                {activeModalService.picture_proof &&
                  activeModalService.picture_proof.map((imgUrl, idx) => (
                    <Col key={idx} xs={6} md={6}>
                      <img
                        src={imgUrl}
                        alt={`Proof ${idx + 1}`}
                        className="img-fluid rounded-3 border"
                        style={{ height: '180px', width: '100%', objectFit: 'cover' }}
                      />
                    </Col>
                  ))}
              </Row>
            </div>

            {/* Provider Details */}
            <div className="rounded-3 p-3 mb-4" style={{ background: 'var(--neu-bg-dark)' }}>
              <Row className="g-2 small">
                <Col sm={6}>
                  <span className="text-muted">Provider User ID:</span>{' '}
                  <strong className="font-monospace" style={{ color: 'var(--neu-primary)' }}>
                    {activeModalService.user_id}
                  </strong>
                </Col>
                <Col sm={6}>
                  <span className="text-muted">Category:</span>{' '}
                  <Badge bg="primary">{activeModalService.service_category}</Badge>
                </Col>
                <Col sm={6}>
                  <span className="text-muted">Provider Name:</span>{' '}
                  <strong>{activeModalService.provider_name}</strong>
                </Col>
                <Col sm={6}>
                  <span className="text-muted">Location:</span>{' '}
                  <span>{activeModalService.provider_location}</span>
                </Col>
              </Row>
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
                <span className="fw-bold" style={{ color: 'var(--neu-text)' }}>₱{activeModalService.amount_topay.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>Platform Booking Fee (<code>booking_fee</code>):</span>
                <span style={{ color: 'var(--neu-text)' }}>₱5.00 Flat</span>
              </div>
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>Provider Commission (5% of rate):</span>
                <span className="text-success">₱{(activeModalService.amount_topay * 0.05).toFixed(2)}</span>
              </div>
              <hr className="my-2" />
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold" style={{ color: 'var(--neu-text)' }}>Total Requestor to Pay (<code>total_topay</code>):</span>
                <strong className="fs-5" style={{ color: 'var(--neu-primary)' }}>
                  ₱{(activeModalService.amount_topay + 5.0).toFixed(2)}
                </strong>
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer className="border-top px-4 py-3" style={{ background: 'var(--neu-bg-dark)' }}>
            <Button className="neu-btn-ghost" onClick={() => setActiveModalService(null)}>
              Close
            </Button>
            <Button
              className="neu-btn-primary px-4 fw-semibold"
              onClick={() => handleBookService(activeModalService)}
            >
              Confirm Booking (₱{(activeModalService.amount_topay + 5.0).toFixed(2)})
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
}
