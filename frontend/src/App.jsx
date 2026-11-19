import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import TermsAndConditions from './components/TermsAndConditions';
import Layout from './components/Layout';
import ServicesPage from './pages/ServicesPage';
import TransactionsPage from './pages/TransactionsPage';
import MessagesPage from './pages/MessagesPage';
import ChatPage from './pages/ChatPage';
import TransactionQRPage from './pages/TransactionQRPage';
import AuthPage from './pages/AuthPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUnlockRequests from './pages/admin/AdminUnlockRequests';
import AdminServices from './pages/admin/AdminServices';
import AdminTransactions from './pages/admin/AdminTransactions';
import AdminReviews from './pages/admin/AdminReviews';
import AdminAdvertisements from './pages/admin/AdminAdvertisements';
import AdminSettings from './pages/admin/AdminSettings';
import OfflineToast from './components/OfflineToast';
import ReviewModal from './components/ReviewModal';
import QRScannerModal from './components/QRScannerModal';
import { Row, Col, Badge, Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import api from './api/axios';

function DashboardPage() {
  const [services, setServices] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // QR Code Scanner / Verification Engine State
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [isVerifyingQr, setIsVerifyingQr] = useState(false);
  const [qrModalError, setQrModalError] = useState('');
  const [qrModalSuccess, setQrModalSuccess] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reviews and Rating State
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    summaryByService: {},
    summaryByProvider: {},
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReviewTx, setSelectedReviewTx] = useState(null);
  const [selectedExistingReview, setSelectedExistingReview] = useState(null);

  const reloadDashboardData = async () => {
    try {
      const [servicesRes, myServicesRes, transactionsRes, profileRes, reviewsRes] = await Promise.all([
        api.get('/services').catch(() => ({ data: { services: [] } })),
        api.get('/services/my-services').catch(() => ({ data: { services: [] } })),
        api.get('/transactions').catch(() => ({ data: { transactions: [] } })),
        api.get('/profile/me').catch(() => ({ data: { user: null } })),
        api.get('/reviews').catch(() => ({ data: { reviews: [] } })),
      ]);
      setServices(servicesRes.data?.services || []);
      setMyServices(myServicesRes.data?.services || []);
      setTransactions(transactionsRes.data?.transactions || []);
      setUserProfile(profileRes.data?.user || null);
      if (reviewsRes.data) setReviewsData(reviewsRes.data);
    } catch {}
  };

  const handleVerifyQr = async (codeToVerify) => {
    const code = (codeToVerify || qrInput).trim();
    if (!code) {
      setQrModalError('Please enter or scan a valid QR Code payload.');
      return;
    }

    setIsVerifyingQr(true);
    setQrModalError('');
    setQrModalSuccess('');

    try {
      const { data } = await api.post('/transactions/verify-qr', { qr_code: code });
      setQrModalSuccess(data.message || 'QR Code verified successfully! Booking completed.');
      setSuccessMsg(`✓ QR Code Verified: Booking #${data.transaction?.transaction_id || ''} has been completed!`);
      setQrInput('');
      await reloadDashboardData();
      setTimeout(() => {
        setShowScannerModal(false);
        setQrModalSuccess('');
      }, 1500);
    } catch (err) {
      setQrModalError(err.response?.data?.error || err.message || 'QR verification failed. Please check the code.');
    } finally {
      setIsVerifyingQr(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.get('/services').catch(() => ({ data: { services: [] } })),
      api.get('/services/my-services').catch(() => ({ data: { services: [] } })),
      api.get('/transactions').catch(() => ({ data: { transactions: [] } })),
      api.get('/profile/me').catch(() => ({ data: { user: null } })),
      api.get('/reviews').catch(() => ({ data: { reviews: [] } })),
    ]).then(([servicesRes, myServicesRes, transactionsRes, profileRes, reviewsRes]) => {
      if (isMounted) {
        const liveServices = servicesRes.data?.services || [];
        const liveMyServices = myServicesRes.data?.services || [];
        const liveTransactions = transactionsRes.data?.transactions || [];
        setServices(liveServices);
        setMyServices(liveMyServices);
        setTransactions(liveTransactions);
        setUserProfile(profileRes.data?.user || null);
        if (reviewsRes.data) setReviewsData(reviewsRes.data);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const currentUserId = userProfile?.user_id || window.localStorage.getItem('user_id');
  const storedUser = (() => {
    try {
      const u = window.localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  })();
  const userType = userProfile?.user_type || storedUser?.user_type || 'Requestor';
  const isProvider = userType === 'Provider';

  // Role-Specific Metrics Calculation
  // Provider Metrics
  const providerCompleted = transactions.filter(
    (t) => t.provider_id === currentUserId && t.service_status === 'completed'
  );
  const providerEarnings = providerCompleted.reduce(
    (acc, t) => acc + (Number(t.amount_topay) || 0),
    0
  );
  const providerActiveServicesCount = myServices.filter(
    (s) => s.service_status === 'active' && !s.is_deleted
  ).length;
  const providerTotalBookings = transactions.filter(
    (t) => t.provider_id === currentUserId
  ).length;
  const providerOngoingCount = transactions.filter(
    (t) => t.provider_id === currentUserId && (t.service_status === 'pending' || t.service_status === 'accepted')
  ).length;

  // Requestor Metrics
  const requestorBookings = transactions.filter(
    (t) => t.requestor_id === currentUserId
  );
  const requestorTotalBookings = requestorBookings.length;
  const requestorCompleted = requestorBookings.filter(
    (t) => t.service_status === 'completed'
  );
  const requestorTotalSpent = requestorCompleted.reduce(
    (acc, t) => acc + (Number(t.total_topay) || (Number(t.amount_topay) || 0) + 5),
    0
  );
  const requestorActiveCount = requestorBookings.filter(
    (t) => t.service_status === 'pending' || t.service_status === 'accepted'
  ).length;

  // User-specific transaction list
  const userRelevantTransactions = transactions.filter(
    (t) => t.provider_id === currentUserId || t.requestor_id === currentUserId
  );
  const recentTransactions = (userRelevantTransactions.length > 0 ? userRelevantTransactions : transactions).slice(0, 5);

  const pendingQrBookings = transactions.filter(
    (t) =>
      (t.service_status === 'accepted' || t.service_status === 'pending') &&
      (String(t.provider_id) === String(currentUserId) || String(t.requestor_id) === String(currentUserId))
  );

  const providerRating = reviewsData.summaryByProvider?.[String(currentUserId)] || {
    averageRating: 5.0,
    reviewCount: 0,
  };
  const providerReceivedReviews = (reviewsData.reviews || []).filter(
    (r) => String(r.provider_id) === String(currentUserId)
  );
  const requestorReviewsMap = {};
  (reviewsData.reviews || []).forEach((r) => {
    if (r.transaction_id) requestorReviewsMap[String(r.transaction_id)] = r;
  });

  const displayName = userProfile
    ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || userProfile.username || userProfile.user_id
    : storedUser
    ? `${storedUser.first_name || ''} ${storedUser.last_name || ''}`.trim() || storedUser.username || storedUser.user_id
    : 'Student';

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>
            {isProvider ? 'Provider Workspace Dashboard' : 'Marketplace Dashboard'}
          </h2>
          <p className="text-muted mb-0">
            Welcome back, {displayName}! {isProvider ? 'Here is an overview of your client bookings and service revenue.' : 'Here is your campus service marketplace overview.'}
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          {/* Scan QR Button for Student Providers */}
          <Button
            className="neu-btn-primary btn-sm d-flex align-items-center gap-2 shadow-sm"
            onClick={() => {
              setShowScannerModal(true);
              setQrModalError('');
              setQrModalSuccess('');
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3Zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5ZM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5Z"/>
              <path d="M7 2h2v2H7V2Zm0 3h2v2H7V5ZM7 8h2v2H7V8Zm0 3h2v2H7v-2ZM4 2h2v2H4V2Zm0 3h2v2H4V5ZM4 8h2v2H4V8Zm0 3h2v2H4v-2ZM10 2h2v2h-2V2Zm0 3h2v2h-2V5Zm0 8h2v2h-2v-2Z"/>
            </svg>
            Scan / Verify QR Code
          </Button>
          <Badge bg={isProvider ? 'primary' : 'secondary'} className="px-3 py-2 rounded-pill fw-semibold">
            {isProvider ? 'Provider Account' : 'Requestor Account'}
          </Badge>
          <Badge bg="success" className="px-3 py-2 rounded-pill fw-semibold">
            Online &amp; Active
          </Badge>
        </div>
      </div>

      {successMsg && (
        <Alert variant="success" dismissible onClose={() => setSuccessMsg('')} className="neu-alert mb-4">
          {successMsg}
        </Alert>
      )}

      {/* Role-Specific Metrics Row */}
      {isProvider ? (
        <Row className="g-3 mb-4">
          <Col sm={6} lg={4} xl>
            <div className="neu-metric-card h-100">
              <div className="text-muted small text-uppercase fw-semibold mb-1">Total Service Revenue</div>
              <div className="fs-3 fw-bold" style={{ color: '#063a8f' }}>
                ₱{providerEarnings.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="small text-muted mt-1">From completed client bookings</div>
            </div>
          </Col>
          <Col sm={6} lg={4} xl>
            <div className="neu-metric-card h-100">
              <div className="text-muted small text-uppercase fw-semibold mb-1">My Active Listings</div>
              <div className="fs-3 fw-bold" style={{ color: '#063a8f' }}>{providerActiveServicesCount}</div>
              <div className="small text-muted mt-1">Live listings accepting bookings</div>
            </div>
          </Col>
          <Col sm={6} lg={4} xl>
            <div className="neu-metric-card h-100">
              <div className="text-muted small text-uppercase fw-semibold mb-1">Completed Bookings</div>
              <div className="fs-3 fw-bold" style={{ color: '#063a8f' }}>{providerCompleted.length}</div>
              <div className="small text-muted mt-1">Successfully delivered services</div>
            </div>
          </Col>
          <Col sm={6} lg={4} xl>
            <div className="neu-metric-card h-100">
              <div className="text-muted small text-uppercase fw-semibold mb-1">Ongoing Orders</div>
              <div className="fs-3 fw-bold" style={{ color: '#063a8f' }}>{providerOngoingCount}</div>
              <div className="small text-muted mt-1">Orders requiring action or delivery</div>
            </div>
          </Col>
          <Col sm={12} lg={4} xl>
            <div className="neu-metric-card h-100" style={{ border: '1px solid rgba(245, 158, 11, 0.35)' }}>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="text-muted small text-uppercase fw-semibold">Campus Rating</div>
                <span className="text-warning fs-5">★</span>
              </div>
              <div className="fs-3 fw-bold" style={{ color: '#b45309' }}>
                {providerRating.reviewCount > 0 ? providerRating.averageRating.toFixed(1) : '5.0'}
                <span className="fs-6 text-muted fw-normal"> / 5.0</span>
              </div>
              <div className="small text-muted mt-1">
                {providerRating.reviewCount} client {providerRating.reviewCount === 1 ? 'review' : 'reviews'}
              </div>
            </div>
          </Col>
        </Row>
      ) : (
        <Row className="g-3 mb-4">
          <Col sm={6} xl={3}>
            <div className="neu-metric-card h-100">
              <div className="text-muted small text-uppercase fw-semibold mb-1">Services Booked</div>
              <div className="fs-3 fw-bold" style={{ color: '#063a8f' }}>{requestorTotalBookings}</div>
              <div className="small text-muted mt-1">Total campus bookings made</div>
            </div>
          </Col>
          <Col sm={6} xl={3}>
            <div className="neu-metric-card h-100">
              <div className="text-muted small text-uppercase fw-semibold mb-1">Total Amount Spent</div>
              <div className="fs-3 fw-bold" style={{ color: '#063a8f' }}>
                ₱{requestorTotalSpent.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="small text-muted mt-1">Paid for completed services</div>
            </div>
          </Col>
          <Col sm={6} xl={3}>
            <div className="neu-metric-card h-100">
              <div className="text-muted small text-uppercase fw-semibold mb-1">Active Appointments</div>
              <div className="fs-3 fw-bold" style={{ color: '#063a8f' }}>{requestorActiveCount}</div>
              <div className="small text-muted mt-1">Upcoming rendezvous or pending</div>
            </div>
          </Col>
          <Col sm={6} xl={3}>
            <div className="neu-metric-card h-100">
              <div className="text-muted small text-uppercase fw-semibold mb-1">Completed Services</div>
              <div className="fs-3 fw-bold" style={{ color: '#063a8f' }}>{requestorCompleted.length}</div>
              <div className="small text-muted mt-1">Successfully fulfilled campus orders</div>
            </div>
          </Col>
        </Row>
      )}

      {/* Recent Activity Card */}
      <div className="neu-card">
        <div className="d-flex justify-content-between align-items-center border-bottom p-3 p-md-4" style={{ borderColor: 'rgba(154, 172, 196, 0.3)' }}>
          <h5 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>
            {isProvider ? 'Recent Client Orders' : 'Recent Bookings'}
          </h5>
          <Button as={Link} to="/transactions" className="neu-btn-ghost px-3" size="sm">
            View All
          </Button>
        </div>
        <div className="table-responsive neu-scroll-table">
          <Table hover className="mb-0 align-middle">
            <thead>
              <tr style={{ background: 'var(--neu-bg-dark)', borderBottom: '2px solid rgba(154, 172, 196, 0.4)' }}>
                <th className="py-3 px-3 text-uppercase small fw-bold" style={{ color: 'var(--neu-text)' }}>Tx ID</th>
                <th className="py-3 px-3 text-uppercase small fw-bold" style={{ color: 'var(--neu-text)' }}>Service</th>
                <th className="py-3 px-3 text-uppercase small fw-bold" style={{ color: 'var(--neu-text)' }}>
                  {isProvider ? 'Client' : 'Provider'}
                </th>
                <th className="py-3 px-3 text-uppercase small fw-bold" style={{ color: 'var(--neu-text)' }}>Service Rate</th>
                <th className="py-3 px-3 text-uppercase small fw-bold d-none d-md-table-cell" style={{ color: 'var(--neu-text)' }}>Booking Fee</th>
                <th className="py-3 px-3 text-uppercase small fw-bold" style={{ color: 'var(--neu-text)' }}>Total</th>
                <th className="py-3 px-3 text-uppercase small fw-bold" style={{ color: 'var(--neu-text)' }}>Status</th>
                <th className="py-3 px-3 text-uppercase small fw-bold text-end pe-3" style={{ color: 'var(--neu-text)' }}>Rating / Feedback</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => {
                  const partyLabel = isProvider
                    ? tx.requestor_id || 'Client'
                    : tx.provider_id || 'Provider';

                  return (
                    <tr key={tx.transaction_id}>
                      <td className="font-monospace fw-bold px-3">{String(tx.transaction_id).slice(0, 8)}...</td>
                      <td className="px-3">{tx.service_name || tx.subcategory || tx.service_category || 'Service'}</td>
                      <td className="px-3 font-monospace text-muted">{partyLabel}</td>
                      <td className="px-3">₱{Number(tx.amount_topay || 0).toFixed(2)}</td>
                      <td className="px-3 text-muted d-none d-md-table-cell">₱{Number(tx.booking_fee || 5).toFixed(2)}</td>
                      <td className="px-3 fw-bold" style={{ color: 'var(--neu-primary)' }}>
                        ₱{Number(tx.total_topay || (Number(tx.amount_topay || 0) + 5)).toFixed(2)}
                      </td>
                      <td className="px-3">
                        <Badge
                          bg={
                            tx.service_status === 'completed'
                              ? 'success'
                              : tx.service_status === 'accepted'
                              ? 'primary'
                              : tx.service_status === 'cancelled'
                              ? 'danger'
                              : 'warning'
                          }
                          text={tx.service_status === 'pending' ? 'dark' : 'white'}
                          className="rounded-pill px-2.5 py-1 text-capitalize"
                        >
                          {tx.service_status || 'pending'}
                        </Badge>
                      </td>
                      <td className="px-3 text-end pe-3">
                        {tx.service_status === 'completed' ? (
                          requestorReviewsMap[String(tx.transaction_id)] ? (
                            <span
                              className="px-2 py-1 rounded-pill small fw-bold d-inline-flex align-items-center gap-1"
                              style={{
                                background: 'rgba(245, 158, 11, 0.12)',
                                color: '#b45309',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                              }}
                              title="Reviewed"
                            >
                              <span className="text-warning">★</span> {requestorReviewsMap[String(tx.transaction_id)].rating}.0 Rated
                            </span>
                          ) : !isProvider ? (
                            <Button
                              variant="warning"
                              size="sm"
                              className="btn-sm py-1 px-2 fw-bold text-dark d-inline-flex align-items-center gap-1 shadow-xs"
                              style={{ fontSize: '0.75rem', background: '#f59e0b', borderColor: '#d97706' }}
                              onClick={() => {
                                setSelectedReviewTx(tx);
                                setSelectedExistingReview(null);
                                setShowReviewModal(true);
                              }}
                            >
                              <span>★</span> Rate &amp; Review
                            </Button>
                          ) : (
                            <span className="text-muted small">Completed</span>
                          )
                        ) : (
                          <span className="text-muted small">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-muted small">
                    No transactions found yet. Explore services in the marketplace to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Provider Client Reviews & Testimonials Section */}
      {isProvider && (
        <div className="neu-card mt-4">
          <div className="d-flex justify-content-between align-items-center border-bottom p-3 p-md-4" style={{ borderColor: 'rgba(154, 172, 196, 0.3)' }}>
            <div className="d-flex align-items-center gap-2">
              <span className="text-warning fs-5">★</span>
              <h5 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>
                Client Reviews &amp; Ratings ({providerReceivedReviews.length})
              </h5>
            </div>
            <span
              className="px-3 py-1 rounded-pill small fw-bold d-inline-flex align-items-center gap-1"
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#b45309',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              ★ {providerRating.averageRating.toFixed(1)} / 5.0 Platform Rating
            </span>
          </div>
          <div className="p-3 p-md-4">
            {providerReceivedReviews.length > 0 ? (
              <Row className="g-3">
                {providerReceivedReviews.slice(0, 4).map((rev) => (
                  <Col md={6} key={rev.id || rev.review_id}>
                    <div
                      className="p-3 rounded-3 h-100"
                      style={{
                        background: 'var(--neu-bg-dark)',
                        border: '1px solid rgba(154, 172, 196, 0.35)',
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong className="text-dark small">{rev.reviewer_name || rev.reviewer_id}</strong>
                        <span className="text-warning fw-bold small">
                          {'★'.repeat(Math.round(rev.rating || 5))} <span className="text-muted ms-1 small">({rev.rating}/5)</span>
                        </span>
                      </div>
                      <p className="small text-secondary mb-2 fst-italic">"{rev.comment}"</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="badge bg-light text-muted border small font-monospace">
                          Booking #{rev.transaction_id || '-'}
                        </span>
                        <small className="text-muted" style={{ fontSize: '0.72rem' }}>{rev.created_at}</small>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            ) : (
              <div className="text-center py-4 text-muted small">
                No client reviews received yet. Deliver great campus services to earn top reviews!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Review Modal for Requestors */}
      {showReviewModal && selectedReviewTx && (
        <ReviewModal
          show={showReviewModal}
          onHide={() => {
            setShowReviewModal(false);
            setSelectedReviewTx(null);
            setSelectedExistingReview(null);
          }}
          transaction={selectedReviewTx}
          existingReview={selectedExistingReview}
          onReviewSubmitted={(submittedRev) => {
            setSuccessMsg(`✓ Review submitted: You gave ${submittedRev.rating} stars for Booking #${submittedRev.transaction_id}!`);
            reloadDashboardData();
          }}
        />
      )}

      {/* QR Scanner / Live Camera Verification Modal for Provider & Requestor */}
      {showScannerModal && (
        <QRScannerModal
          show={showScannerModal}
          onHide={() => setShowScannerModal(false)}
          onVerify={handleVerifyQr}
          isVerifying={isVerifyingQr}
          error={qrModalError}
          success={qrModalSuccess}
          pendingBookings={pendingQrBookings}
          userRole={isProvider ? 'Provider' : 'Requestor'}
        />
      )}
    </div>
  );
}

function RequireAuth({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleUnauthorized = () => {
      navigate('/sign-in', {
        replace: true,
        state: { message: 'Your session expired. Please sign in again.' },
      });
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [navigate]);

  if (!window.localStorage.getItem('token')) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  return children;
}

function RequireAdmin({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      const stored = window.localStorage.getItem('user');
      if (!stored) return false;
      const u = JSON.parse(stored);
      return Boolean((u.department && u.designation) || u.user_type === 'Admin' || u.role === 'admin');
    } catch {
      return false;
    }
  });

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api.get('/profile/me')
      .then(({ data }) => {
        const u = data.user;
        if (u) {
          const adminCheck = Boolean((u.department && u.designation) || u.user_type === 'Admin' || u.role === 'admin');
          setIsAdmin(adminCheck);
        }
      })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return <div className="text-center py-5 text-muted">Checking administrator privileges...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <OfflineToast />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/sign-in" element={<AuthPage key="sign-in" mode="sign-in" />} />
        <Route path="/sign-up" element={<AuthPage key="sign-up" mode="sign-up" />} />

        {/* Protected App Shell Routes */}
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/transactions/:transactionId/qr" element={<TransactionQRPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/:id" element={<ChatPage />} />
          <Route path="/profile" element={<SettingsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin/statistics" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
        </Route>

        {/* Admin Portal Routes matching ITE11_Finalproject */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="unlock-requests" element={<AdminUnlockRequests />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="advertisements" element={<AdminAdvertisements />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="statistics" element={<AdminPage />} />
        </Route>

        {/* Catch-all redirect to public landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
