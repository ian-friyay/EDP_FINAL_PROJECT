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

// Strict Service Taxonomy
export const SERVICE_TAXONOMY = {
  'Creatives': ['Graphic Designer', 'Art Painter'],
  'Event Support': ['Makeup Artist', 'Event Host'],
  'Digital Service': ['Photographer', 'Video Editor']
};

// Official Mindoro State University (MinSU) Campus Rendezvous Landmarks
export const MINSU_LANDMARKS = {
  MMC: [
    {
      name: 'MinSU Main Gate & Guardhouse (Alcate Entrance)',
      desc: 'Official Mindoro State University – Main Campus, Alcate, Victoria, Oriental Mindoro meeting spot.',
    },
    {
      name: 'Student Center & University Canteen Hub',
      desc: 'Central campus pavilion for student collaborations, graphic design review, and project handover.',
    },
    {
      name: 'University Library & Research Commons Lobby',
      desc: 'Quiet, secure air-conditioned lobby ideal for digital media transfer and design consultations.',
    },
    {
      name: 'College of Arts & Sciences Building Hallway',
      desc: 'Accessible landmark near CAS classrooms and faculty offices.',
    },
    {
      name: 'Campus Gymnasium & Athletic Field Grandstand',
      desc: 'Spacious sports and cultural venue for event coordination, makeup sessions, and photoshoot prep.',
    },
    {
      name: 'Custom Campus Rendezvous Spot',
      desc: 'Specify your preferred campus bench, kiosk, or building department.',
    },
  ],
  MCC: [
    {
      name: 'MinSU Calapan Main Gate & Waiting Shed',
      desc: 'Official Calapan City Campus entrance gate along Masipit highway.',
    },
    {
      name: 'IT & Computer Studies Building Lobby',
      desc: 'Primary tech and digital creative diagnostics rendezvous area.',
    },
    {
      name: 'Calapan Campus Student Lounge & Canteen',
      desc: 'Popular central landmark for fast meeting and project exchange.',
    },
    {
      name: 'Custom Campus Rendezvous Spot',
      desc: 'Specify your preferred campus bench, kiosk, or building department.',
    },
  ],
  MBC: [
    {
      name: 'MinSU Bongabong Main Gate Entrance',
      desc: 'Official Bongabong Campus entrance and security guardhouse.',
    },
    {
      name: 'Fisheries & Marine Science Building Lobby',
      desc: 'Open academic landmark near department labs.',
    },
    {
      name: 'Bongabong Campus Audio-Visual Hall Pavilion',
      desc: 'Designated student event hub and meeting rendezvous.',
    },
    {
      name: 'Custom Campus Rendezvous Spot',
      desc: 'Specify your preferred campus bench, kiosk, or building department.',
    },
  ],
};

const INITIAL_SERVICES = [
  {
    service_id: 'SRV-101',
    user_id: 'MMC-3046',
    provider_name: 'Keizy Lara',
    provider_location: 'MinSU Main Campus - Victoria',
    service_category: 'Creatives',
    subcategory: 'Graphic Designer',
    service_description:
      'Campus event posters, org logos, academic infographics, club shirt mockups, and publication materials. High-res vector and printable files delivered.',
    amount_topay: 450.0,
    service_status: 'active',
    rate_unit: 'per_service',
    picture_proof: [
      'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80',
    ],
    is_deleted: false,
  },
  {
    service_id: 'SRV-102',
    user_id: 'MMC-2015',
    provider_name: 'Maria Santos',
    provider_location: 'MinSU Calapan Campus',
    service_category: 'Creatives',
    subcategory: 'Art Painter',
    service_description:
      'Custom canvas acrylic paintings, university department wall murals, and traditional portrait art commissions for campus events and personal gifts.',
    amount_topay: 1200.0,
    service_status: 'active',
    rate_unit: 'per_service',
    picture_proof: [
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    ],
    is_deleted: false,
  },
  {
    service_id: 'SRV-103',
    user_id: 'MMC-1042',
    provider_name: 'Juan Dela Cruz',
    provider_location: 'MinSU Bongabong Campus',
    service_category: 'Event Support',
    subcategory: 'Makeup Artist',
    service_description:
      'Professional makeup and hair styling for graduation pictorials, college pageants, faculty programs, and university theater performances.',
    amount_topay: 850.0,
    service_status: 'active',
    rate_unit: 'per_service',
    picture_proof: [
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&auto=format&fit=crop&q=80',
    ],
    is_deleted: false,
  },
  {
    service_id: 'SRV-104',
    user_id: 'MMC-3044',
    provider_name: 'Pedro Penduko',
    provider_location: 'MinSU Main Campus - Victoria',
    service_category: 'Event Support',
    subcategory: 'Event Host',
    service_description:
      'Energetic and bilingual emcee/host for university departmental symposiums, sports fests, cultural nights, and acquaintance parties.',
    amount_topay: 1500.0,
    service_status: 'active',
    rate_unit: 'per_service',
    picture_proof: [
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80',
    ],
    is_deleted: false,
  },
  {
    service_id: 'SRV-105',
    user_id: 'MMC-1042',
    provider_name: 'Juan Dela Cruz',
    provider_location: 'MinSU Main Campus - Victoria',
    service_category: 'Digital Service',
    subcategory: 'Photographer',
    service_description:
      'DSLR campus portrait sessions, event coverage, graduation pictorials, and color-graded digital photography with lighting equipment.',
    amount_topay: 750.0,
    service_status: 'active',
    rate_unit: 'per_hour',
    picture_proof: [
      'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800&auto=format&fit=crop&q=80',
    ],
    is_deleted: false,
  },
  {
    service_id: 'SRV-106',
    user_id: 'MMC-3046',
    provider_name: 'Keizy Lara',
    provider_location: 'MinSU Calapan Campus',
    service_category: 'Digital Service',
    subcategory: 'Video Editor',
    service_description:
      'High-paced Reels, TikToks, club recap videos, academic documentary video projects, and cinematic color grading with sound design.',
    amount_topay: 600.0,
    service_status: 'active',
    rate_unit: 'per_service',
    picture_proof: [
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80',
    ],
    is_deleted: false,
  },
];

export default function ServicesGrid({
  services = INITIAL_SERVICES,
  currentUserId,
  currentUserType,
  onDeleteService,
  deletingServiceId,
  onEditService,
  onBookService,
  bookingServiceId,
  onToggleStatus,
}) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSubcategory, setSelectedSubcategory] = useState('ALL');
  const [selectedCampus, setSelectedCampus] = useState('ALL');
  const [viewScope, setViewScope] = useState('ALL'); // 'ALL' | 'MINE' | 'OTHERS'
  const [activeModalService, setActiveModalService] = useState(null);
  const [bookingSuccessAlert, setBookingSuccessAlert] = useState(null);

  // Role detection
  const userRole = useMemo(() => {
    if (currentUserType) return currentUserType;
    try {
      const u = JSON.parse(window.localStorage.getItem('user'));
      return u?.user_type || 'Requestor';
    } catch {
      return 'Requestor';
    }
  }, [currentUserType]);

  const isViewerProvider = userRole === 'Provider';

  // Booking & Campus Rendezvous Modal State
  const [bookingModalService, setBookingModalService] = useState(null);
  const [rendezvousLocation, setRendezvousLocation] = useState('MinSU Main Gate & Guardhouse (Alcate Entrance)');
  const [customRendezvous, setCustomRendezvous] = useState('');
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
    return Object.keys(SERVICE_TAXONOMY);
  }, []);

  // Available subcategories given the current category filter
  const availableSubcategories = useMemo(() => {
    if (selectedCategory !== 'ALL' && SERVICE_TAXONOMY[selectedCategory]) {
      return SERVICE_TAXONOMY[selectedCategory];
    }
    return Object.values(SERVICE_TAXONOMY).flat();
  }, [selectedCategory]);

  // Counts for role-aware filtering
  const myServicesCount = useMemo(() => {
    if (!currentUserId) return 0;
    return services.filter(
      (s) => !s.is_deleted && String(s.user_id).toLowerCase() === String(currentUserId).toLowerCase()
    ).length;
  }, [services, currentUserId]);

  const othersServicesCount = useMemo(() => {
    if (!currentUserId) return services.filter((s) => !s.is_deleted && s.service_status !== 'inactive').length;
    return services.filter(
      (s) =>
        !s.is_deleted &&
        s.service_status !== 'inactive' &&
        String(s.user_id).toLowerCase() !== String(currentUserId).toLowerCase()
    ).length;
  }, [services, currentUserId]);

  // Filter services by search term, category, subcategory, campus, view scope, and soft-delete status
  const filteredServices = useMemo(() => {
    return services.filter((item) => {
      // Exclude soft-deleted items
      if (item.is_deleted) return false;

      const isOwner = Boolean(
        currentUserId && String(item.user_id).toLowerCase() === String(currentUserId).toLowerCase()
      );

      // View Scope filtering:
      if (viewScope === 'MINE') {
        if (!isOwner) return false;
      } else if (viewScope === 'OTHERS') {
        if (isOwner) return false;
        // Other users' services must be active (done/taken services are hidden from public)
        if (item.service_status === 'inactive') return false;
      } else {
        // 'ALL': if not owner, only show active services (done/taken services are hidden from other accounts)
        if (!isOwner && item.service_status === 'inactive') return false;
      }

      // Category filter
      const matchesCategory =
        selectedCategory === 'ALL' || item.service_category === selectedCategory;

      // Subcategory filter
      const matchesSubcategory =
        selectedSubcategory === 'ALL' || item.subcategory === selectedSubcategory;

      // Campus filter
      let matchesCampus = true;
      if (selectedCampus !== 'ALL') {
        const idUpper = String(item.user_id || '').toUpperCase();
        const locLower = String(item.provider_location || '').toLowerCase();
        if (selectedCampus === 'MMC') {
          matchesCampus = idUpper.startsWith('MMC') || locLower.includes('victoria') || locLower.includes('main');
        } else if (selectedCampus === 'MCC') {
          matchesCampus = idUpper.startsWith('MCC') || locLower.includes('calapan');
        } else if (selectedCampus === 'MBC') {
          matchesCampus = idUpper.startsWith('MBC') || locLower.includes('bongabong');
        }
      }

      // Search keyword filter
      const query = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !query ||
        (item.subcategory || '').toLowerCase().includes(query) ||
        (item.service_description || '').toLowerCase().includes(query) ||
        (item.service_category || '').toLowerCase().includes(query) ||
        (item.user_id || '').toLowerCase().includes(query) ||
        (item.provider_name && item.provider_name.toLowerCase().includes(query));

      return matchesCategory && matchesSubcategory && matchesCampus && matchesSearch;
    });
  }, [services, searchTerm, selectedCategory, selectedSubcategory, selectedCampus, viewScope, currentUserId]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSelectedSubcategory('ALL');
    setSelectedCampus('ALL');
  };

  const getCampusCodeForService = (service) => {
    if (!service) return 'MMC';
    const id = String(service.user_id || '').toUpperCase();
    const loc = String(service.provider_location || '').toLowerCase();
    if (id.startsWith('MCC') || loc.includes('calapan')) return 'MCC';
    if (id.startsWith('MBC') || loc.includes('bongabong')) return 'MBC';
    return 'MMC';
  };

  const handleOpenBookingModal = (service) => {
    setActiveModalService(null);
    setBookingModalService(service);
    const code = getCampusCodeForService(service);
    const landmarks = MINSU_LANDMARKS[code] || MINSU_LANDMARKS.MMC;
    setRendezvousLocation(landmarks[0].name);
    setCustomRendezvous('');

    // Default scheduled time: tomorrow at 01:22 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(13, 22, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    const localIso = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T${pad(tomorrow.getHours())}:${pad(tomorrow.getMinutes())}`;
    setScheduledDateTime(localIso);
    setSpecialInstructions('');
  };

  const handleExecuteBooking = async () => {
    if (!bookingModalService) return;
    setIsSubmittingBooking(true);
    const service = bookingModalService;
    const finalRendezvous =
      rendezvousLocation === 'Custom Campus Rendezvous Spot'
        ? (customRendezvous.trim() || 'MinSU Campus Meeting Point')
        : rendezvousLocation;

    const bookingDetails = {
      rendezvous_location: finalRendezvous,
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
        {/* View Mode Pill Switcher */}
        <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="small fw-bold text-muted text-uppercase me-1" style={{ letterSpacing: '0.05em' }}>
              Marketplace View:
            </span>
            <Button
              size="sm"
              className={`rounded-pill px-3 py-1.5 fw-semibold ${
                viewScope === 'ALL' ? 'neu-btn-primary' : 'neu-btn-ghost'
              }`}
              onClick={() => setViewScope('ALL')}
            >
              🌐 All Campus Services ({services.length})
            </Button>
            <Button
              size="sm"
              className={`rounded-pill px-3 py-1.5 fw-semibold ${
                viewScope === 'OTHERS' ? 'neu-btn-primary' : 'neu-btn-ghost'
              }`}
              onClick={() => setViewScope('OTHERS')}
            >
              👥 Offered by Others ({othersServicesCount})
            </Button>
            <Button
              size="sm"
              className={`rounded-pill px-3 py-1.5 fw-semibold ${
                viewScope === 'MINE' ? 'neu-btn-primary' : 'neu-btn-ghost'
              }`}
              onClick={() => setViewScope('MINE')}
            >
              🏷️ My Offered Services ({myServicesCount})
            </Button>
          </div>

          <div>
            {viewScope === 'MINE' ? (
              <Button
                size="sm"
                className="neu-btn-outline rounded-pill px-3 py-1.5 fw-semibold text-nowrap"
                onClick={() => setViewScope('OTHERS')}
              >
                🔍 Explore Others' Services ({othersServicesCount})
              </Button>
            ) : (
              <Button
                size="sm"
                className="neu-btn-outline rounded-pill px-3 py-1.5 fw-semibold text-nowrap"
                onClick={() => setViewScope('MINE')}
              >
                🏷️ View My Offered Services ({myServicesCount})
              </Button>
            )}
          </div>
        </div>

        <Row className="g-2 align-items-center mb-3">
          {/* Search Bar */}
          <Col xs={12} lg={4}>
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
                placeholder="Search services, skills, or student ID..."
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
          <Col xs={6} sm={4} lg={3}>
            <Form.Select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => {
                const newCat = e.target.value;
                setSelectedCategory(newCat);
                setSelectedSubcategory('ALL');
              }}
              className="neu-select"
            >
              <option value="ALL">All 3 Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Form.Select>
          </Col>

          {/* Subcategory Dropdown Filter */}
          <Col xs={6} sm={4} lg={3}>
            <Form.Select
              id="subcategory-select"
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="neu-select"
            >
              <option value="ALL">All Subcategories</option>
              {availableSubcategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </Form.Select>
          </Col>

          {/* Campus Location Filter */}
          <Col xs={12} sm={4} lg={2}>
            <Form.Select
              id="campus-select"
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="neu-select"
            >
              <option value="ALL">All Campuses</option>
              <option value="MMC">MMC - Victoria</option>
              <option value="MCC">MCC - Calapan</option>
              <option value="MBC">MBC - Bongabong</option>
            </Form.Select>
          </Col>
        </Row>

        {/* 1-Click Category Pill Chips for Requestors */}
        <div className="d-flex align-items-center gap-2 flex-wrap mb-2">
          <span className="small text-muted fw-semibold me-1">Browse Category:</span>
          <Button
            size="sm"
            className={`rounded-pill px-3 py-1 ${
              selectedCategory === 'ALL' ? 'neu-btn-primary' : 'neu-btn-ghost'
            }`}
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedSubcategory('ALL');
            }}
          >
            All Offers
          </Button>
          <Button
            size="sm"
            className={`rounded-pill px-3 py-1 ${
              selectedCategory === 'Creatives' ? 'neu-btn-primary' : 'neu-btn-ghost'
            }`}
            onClick={() => {
              setSelectedCategory('Creatives');
              setSelectedSubcategory('ALL');
            }}
          >
            🎨 Creatives (Graphic Design &amp; Art)
          </Button>
          <Button
            size="sm"
            className={`rounded-pill px-3 py-1 ${
              selectedCategory === 'Event Support' ? 'neu-btn-primary' : 'neu-btn-ghost'
            }`}
            onClick={() => {
              setSelectedCategory('Event Support');
              setSelectedSubcategory('ALL');
            }}
          >
            🎉 Event Support (Makeup &amp; Hosting)
          </Button>
          <Button
            size="sm"
            className={`rounded-pill px-3 py-1 ${
              selectedCategory === 'Digital Service' ? 'neu-btn-primary' : 'neu-btn-ghost'
            }`}
            onClick={() => {
              setSelectedCategory('Digital Service');
              setSelectedSubcategory('ALL');
            }}
          >
            💻 Digital Service (Photo &amp; Video)
          </Button>

          {(searchTerm || selectedCategory !== 'ALL' || selectedSubcategory !== 'ALL' || selectedCampus !== 'ALL') && (
            <Button
              size="sm"
              variant="link"
              className="text-danger p-0 ms-auto text-decoration-none small"
              onClick={handleClearFilters}
            >
              &times; Reset All Filters
            </Button>
          )}
        </div>

        {/* Results Count & Current Active Filters Summary */}
        <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top flex-wrap gap-2 text-muted small">
          <div>
            Showing <strong style={{ color: 'var(--neu-text)' }}>{filteredServices.length}</strong> of{' '}
            <strong style={{ color: 'var(--neu-text)' }}>{services.length}</strong> active marketplace services
          </div>
          <div className="d-flex gap-1 flex-wrap">
            {selectedCategory !== 'ALL' && (
              <Badge bg="primary">Category: {selectedCategory}</Badge>
            )}
            {selectedSubcategory !== 'ALL' && (
              <Badge bg="info" className="text-dark">Sub: {selectedSubcategory}</Badge>
            )}
            {selectedCampus !== 'ALL' && (
              <Badge bg="secondary">Campus: {selectedCampus}</Badge>
            )}
          </div>
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
            const isOwner = Boolean(
              currentUserId && String(service.user_id).toLowerCase() === String(currentUserId).toLowerCase()
            );
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
                        className="shadow-sm"
                      >
                        {service.service_status === 'active' ? '● Available' : '○ Taken / Done'}
                      </Badge>
                      {isOwner && (
                        <Badge bg="info" className="shadow-sm text-white">
                          Your Listing
                        </Badge>
                      )}
                      <Badge bg="dark" className="shadow-sm text-capitalize bg-opacity-75">
                        {service.rate_unit === 'per_hour' ? 'Per Hour' : service.rate_unit === 'per_day' ? 'Per Day' : 'Per Service'}
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
                          <span className="text-muted fw-normal ms-1 small">
                            {service.rate_unit === 'per_hour' ? '/ hour' : service.rate_unit === 'per_day' ? '/ day' : '/ service'}
                          </span>
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
                      <div className="d-flex flex-column gap-2">
                        {/* Status Situation Toggle Button */}
                        <Button
                          variant={service.service_status === 'active' ? 'outline-secondary' : 'success'}
                          className="w-100 fw-semibold rounded-pill py-1.5"
                          size="sm"
                          onClick={() =>
                            onToggleStatus &&
                            onToggleStatus(
                              service.service_id,
                              service.service_status === 'active' ? 'inactive' : 'active'
                            )
                          }
                        >
                          {service.service_status === 'active'
                            ? 'Mark as Taken / Done'
                            : '✓ Re-open / Mark Available'}
                        </Button>

                        <div className="d-flex gap-2">
                          <Button
                            className="neu-btn-ghost w-50 fw-semibold"
                            size="sm"
                            onClick={() => setActiveModalService(service)}
                          >
                            Details
                          </Button>
                          <Button
                            className="neu-btn-outline w-50 fw-semibold"
                            size="sm"
                            onClick={() => onEditService && onEditService(service)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline-danger"
                            className="fw-semibold rounded-pill px-3"
                            size="sm"
                            disabled={deletingServiceId === service.service_id}
                            onClick={() => onDeleteService && onDeleteService(service)}
                            title="Delete offer"
                          >
                            {deletingServiceId === service.service_id ? '...' : '×'}
                          </Button>
                        </div>
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
                          {isViewerProvider ? (
                            <Button
                              className="neu-btn-ghost w-50 fw-semibold text-muted"
                              size="sm"
                              disabled
                              title="Providers offer services; switch to Requestor account to book."
                            >
                              Provider Mode
                            </Button>
                          ) : (
                            <Button
                              className="neu-btn-primary w-50 fw-semibold"
                              size="sm"
                              disabled={bookingServiceId === service.service_id}
                              onClick={() => handleOpenBookingModal(service)}
                            >
                              {bookingServiceId === service.service_id ? 'Booking...' : 'Book Now'}
                            </Button>
                          )}
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
          {(() => {
            const isOwner = Boolean(
              currentUserId &&
              String(activeModalService.user_id).toLowerCase() === String(currentUserId).toLowerCase()
            );

            return (
              <>
                <Modal.Header closeButton className="border-bottom px-4 py-3" style={{ background: 'var(--neu-bg-dark)' }}>
                  <Modal.Title className="fw-bold fs-5" style={{ color: 'var(--neu-text)' }}>
                    {activeModalService.subcategory || activeModalService.service_category}
                  </Modal.Title>
                </Modal.Header>

                <Modal.Body className="p-4" style={{ background: 'var(--neu-bg)', maxHeight: 'calc(85vh - 130px)', overflowY: 'auto' }}>
                  {/* Picture Proof Gallery */}
                  <div className="mb-4">
                    <h6 className="fw-bold text-uppercase text-muted small mb-2">
                      Service Proof &amp; Gallery
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
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <h5 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>
                              {activeModalService.provider_name || 'Campus Provider'}
                            </h5>
                            {isOwner ? (
                              <Badge bg="success" className="px-2 py-1 rounded-pill small">
                                Your Active Listing
                              </Badge>
                            ) : isViewerProvider ? (
                              <Badge bg="secondary-subtle" className="text-secondary border px-2 py-1 rounded-pill small">
                                Peer Provider
                              </Badge>
                            ) : (
                              <Badge bg="primary-subtle" className="text-primary border border-primary-subtle px-2 py-1 rounded-pill small">
                                Verified Student Provider
                              </Badge>
                            )}
                          </div>
                          <div className="d-flex align-items-center gap-2 flex-wrap small mt-1">
                            <span className="text-muted font-monospace">
                              ID: <strong style={{ color: 'var(--neu-primary)' }}>{activeModalService.user_id}</strong>
                            </span>
                            <span className="text-muted">•</span>
                            <Badge bg="primary">{activeModalService.service_category}</Badge>
                            {activeModalService.provider_location && activeModalService.provider_location.trim() ? (
                              <>
                                <span className="text-muted">•</span>
                                <span className="text-muted d-flex align-items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/>
                                  </svg>
                                  {activeModalService.provider_location.trim()}
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {isOwner && (
                        <Button
                          className="neu-btn-primary rounded-pill px-3 py-2 d-flex align-items-center gap-2 fw-semibold"
                          onClick={() => {
                            const targetService = activeModalService;
                            setActiveModalService(null);
                            if (onEditService) {
                              onEditService(targetService);
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
                          </svg>
                          Edit Service
                        </Button>
                      )}
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
                  {isOwner ? (
                    <div className="border rounded-4 p-3 mb-4" style={{ background: 'var(--neu-bg-dark)' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold text-uppercase text-muted small mb-0">
                          Your Service Revenue Breakdown
                        </h6>
                        <Badge bg="success-subtle" className="text-success border border-success-subtle px-2 py-1 small">
                          Provider View
                        </Badge>
                      </div>
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>Base Service Rate:</span>
                        <span className="fw-bold" style={{ color: 'var(--neu-text)' }}>₱{(Number(activeModalService.amount_topay) || 0).toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>Platform Booking Fee (paid by client):</span>
                        <span style={{ color: 'var(--neu-text)' }}>₱5.00</span>
                      </div>
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>MinSU Peer Guarantee (5% commission):</span>
                        <span className="text-danger">-₱{((Number(activeModalService.amount_topay) || 0) * 0.05).toFixed(2)}</span>
                      </div>
                      <hr className="my-2" />
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <span className="fw-bold d-block" style={{ color: 'var(--neu-text)' }}>
                            Your Net Provider Take-Home:
                          </span>
                          <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                            Total client pays: ₱{((Number(activeModalService.amount_topay) || 0) + 5.0).toFixed(2)}
                          </span>
                        </div>
                        <strong className="fs-4 text-success fw-bold">
                          ₱{((Number(activeModalService.amount_topay) || 0) * 0.95).toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  ) : isViewerProvider ? (
                    <div className="border rounded-4 p-3 mb-4" style={{ background: 'var(--neu-bg-dark)' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="fw-bold text-uppercase text-muted small mb-0">
                          Peer Service Pricing
                        </h6>
                        <Badge bg="secondary-subtle" className="text-secondary border px-2 py-1 small">
                          Peer Provider
                        </Badge>
                      </div>
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>Listed Service Rate:</span>
                        <span className="fw-bold" style={{ color: 'var(--neu-text)' }}>₱{(Number(activeModalService.amount_topay) || 0).toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>Client Platform Booking Fee:</span>
                        <span style={{ color: 'var(--neu-text)' }}>₱5.00 Flat</span>
                      </div>
                      <hr className="my-2" />
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold" style={{ color: 'var(--neu-text)' }}>Total Client Rate:</span>
                        <strong className="fs-5" style={{ color: '#063a8f' }}>
                          ₱{((Number(activeModalService.amount_topay) || 0) + 5.0).toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-4 p-3 mb-4" style={{ background: 'var(--neu-bg-dark)' }}>
                      <h6 className="fw-bold text-uppercase text-muted small mb-2">
                        Transaction Pricing Breakdown
                      </h6>
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>Base Service Fee:</span>
                        <span className="fw-bold" style={{ color: 'var(--neu-text)' }}>₱{(Number(activeModalService.amount_topay) || 0).toFixed(2)}</span>
                      </div>
                      <div className="d-flex justify-content-between small text-muted mb-1">
                        <span>Campus Platform Convenience Fee:</span>
                        <span style={{ color: 'var(--neu-text)' }}>₱5.00 Flat</span>
                      </div>
                      <hr className="my-2" />
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold" style={{ color: 'var(--neu-text)' }}>Total Requestor to Pay:</span>
                        <strong className="fs-4 fw-bold" style={{ color: '#16a34a' }}>
                          ₱{((Number(activeModalService.amount_topay) || 0) + 5.0).toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  )}

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

                <Modal.Footer className="border-top px-4 py-3 d-flex justify-content-between align-items-center flex-wrap gap-2" style={{ background: 'var(--neu-bg-dark)' }}>
                  {isOwner ? (
                    <>
                      <div className="text-muted small">
                        <span className={`badge ${activeModalService.service_status === 'active' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'} me-2`}>
                          {activeModalService.service_status === 'active' ? '● Available' : '○ Taken / Done'}
                        </span>
                        {activeModalService.service_status === 'active'
                          ? 'Public & bookable by campus peers.'
                          : 'Marked as Taken/Done and hidden from other accounts.'}
                      </div>
                      <div className="d-flex gap-2 align-items-center flex-wrap">
                        <Button
                          variant={activeModalService.service_status === 'active' ? 'outline-secondary' : 'success'}
                          className="rounded-pill px-3 py-1.5 fw-semibold"
                          onClick={() => {
                            const nextStatus = activeModalService.service_status === 'active' ? 'inactive' : 'active';
                            if (onToggleStatus) {
                              onToggleStatus(activeModalService.service_id, nextStatus);
                            }
                            setActiveModalService((prev) => (prev ? { ...prev, service_status: nextStatus } : null));
                          }}
                        >
                          {activeModalService.service_status === 'active'
                            ? 'Mark as Taken / Done'
                            : '✓ Re-open / Mark Available'}
                        </Button>
                        <Button className="neu-btn-ghost" onClick={() => setActiveModalService(null)}>
                          Close
                        </Button>
                        <Button
                          className="neu-btn-primary px-4 fw-semibold"
                          onClick={() => {
                            const targetService = activeModalService;
                            setActiveModalService(null);
                            if (onEditService) {
                              onEditService(targetService);
                            }
                          }}
                        >
                          Edit Service Offer
                        </Button>
                      </div>
                    </>
                  ) : isViewerProvider ? (
                    <>
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
                              initialMessage: `Hi ${targetService.provider_name || 'peer provider'}, connecting regarding your campus service: ${targetService.subcategory || targetService.service_category}.`,
                            },
                          });
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                        </svg>
                        Chat with Peer Provider
                      </Button>
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-secondary-subtle text-secondary border px-3 py-2 rounded-pill small">
                          Peer Listing &bull; Bookings reserved for Requestor accounts
                        </span>
                        <Button className="neu-btn-ghost" onClick={() => setActiveModalService(null)}>
                          Close
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </Modal.Footer>
              </>
            );
          })()}
        </Modal>
      )}

      {/* Book Student Service Modal (Exact match to requested UI) */}
      {bookingModalService && (() => {
        const campusCode = getCampusCodeForService(bookingModalService);
        const campusLabel =
          campusCode === 'MCC'
            ? 'MinSU Calapan Campus'
            : campusCode === 'MBC'
            ? 'MinSU Bongabong Campus'
            : 'MinSU Victoria Campus';
        const landmarks = MINSU_LANDMARKS[campusCode] || MINSU_LANDMARKS.MMC;
        const currentLandmarkObj =
          landmarks.find((lm) => lm.name === rendezvousLocation) || landmarks[0];
        const landmarkDesc = currentLandmarkObj?.desc || 'Official Mindoro State University meeting spot.';

        const amount = Number(bookingModalService.amount_topay || 0);
        const bookingFee = 5.0;
        const total = amount + bookingFee;

        return (
          <Modal
            show={!!bookingModalService}
            onHide={() => setBookingModalService(null)}
            centered
            contentClassName="rounded-4 border-0 shadow-lg overflow-hidden"
            dialogClassName="modal-dialog-centered"
          >
            <div className="p-4" style={{ background: '#ffffff' }}>
              {/* Modal Header */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.02em' }}>
                  Book Student Service
                </h4>
                <button
                  type="button"
                  className="btn btn-sm btn-light rounded-circle p-1 d-flex align-items-center justify-content-center text-muted"
                  style={{ width: 28, height: 28 }}
                  onClick={() => setBookingModalService(null)}
                  aria-label="Close"
                >
                  <span className="fs-5 leading-none" style={{ lineHeight: 1 }}>&times;</span>
                </button>
              </div>

              {/* Service Summary Card */}
              <div
                className="p-3 rounded-4 mb-3"
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <h5 className="fw-bold mb-1" style={{ color: '#2563eb' }}>
                  {bookingModalService.subcategory || bookingModalService.service_category}
                </h5>
                <div className="text-secondary small mb-3">
                  Offered by {bookingModalService.provider_name || bookingModalService.user_id}
                </div>
                <hr className="my-2 border-secondary opacity-25" />
                <div className="d-flex justify-content-between text-secondary small mb-1">
                  <span>Service Fee:</span>
                  <span className="text-dark fw-semibold">₱{amount.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between text-secondary small mb-2">
                  <span>Platform Convenience Fee:</span>
                  <span className="text-dark fw-semibold">₱5.00</span>
                </div>
                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                  <span className="fw-bold text-dark fs-6">Total to Pay:</span>
                  <strong className="fs-5 fw-bold" style={{ color: '#16a34a' }}>
                    ₱{total.toFixed(2)}
                  </strong>
                </div>
              </div>

              {/* Appointment Schedule */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small text-dark mb-1">
                  Appointment Schedule <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="datetime-local"
                  className="neu-input rounded-3"
                  value={scheduledDateTime}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  required
                />
              </Form.Group>

              {/* Campus Rendezvous Point */}
              <Form.Group className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <Form.Label className="fw-semibold small text-dark mb-0">
                    Campus Rendezvous Point ({campusLabel}) <span className="text-danger">*</span>
                  </Form.Label>
                  <span
                    className="badge rounded-pill fw-semibold"
                    style={{
                      background: '#dbeafe',
                      color: '#2563eb',
                      fontSize: '0.72rem',
                      padding: '4px 8px',
                    }}
                  >
                    MinSU Campus Only
                  </span>
                </div>
                <Form.Select
                  className="neu-input rounded-3"
                  value={rendezvousLocation}
                  onChange={(e) => setRendezvousLocation(e.target.value)}
                >
                  {landmarks.map((lm) => (
                    <option key={lm.name} value={lm.name}>
                      {lm.name}
                    </option>
                  ))}
                </Form.Select>
                {rendezvousLocation === 'Custom Campus Rendezvous Spot' && (
                  <Form.Control
                    className="neu-input rounded-3 mt-2"
                    placeholder="Specify building, kiosk, bench, or room..."
                    value={customRendezvous}
                    onChange={(e) => setCustomRendezvous(e.target.value)}
                    required
                  />
                )}
                <div className="text-muted small mt-1" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                  {landmarkDesc}
                </div>
              </Form.Group>

              {/* Notes / Special Instructions (Optional) */}
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small text-dark mb-1">
                  Notes for Provider (Optional)
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  className="neu-input rounded-3"
                  placeholder="e.g. I will be wearing a blue cap near the lobby entrance."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                />
              </Form.Group>

              {/* Modal Buttons (← Back and Confirm Request in bright orange) */}
              <div className="d-flex justify-content-center align-items-center gap-3 pt-2">
                <Button
                  variant="outline-secondary"
                  className="rounded-pill px-4 py-2 fw-semibold d-flex align-items-center gap-2"
                  style={{
                    borderColor: '#cbd5e1',
                    color: '#475569',
                    background: '#ffffff',
                    minWidth: '110px',
                    justifyContent: 'center',
                  }}
                  onClick={() => setBookingModalService(null)}
                  disabled={isSubmittingBooking}
                >
                  <span>&larr;</span> Back
                </Button>
                <Button
                  className="rounded-pill px-4 py-2 fw-bold text-white shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    border: 'none',
                    minWidth: '170px',
                  }}
                  disabled={isSubmittingBooking}
                  onClick={handleExecuteBooking}
                >
                  {isSubmittingBooking ? 'Confirming...' : 'Confirm Request'}
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
