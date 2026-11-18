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
import { Row, Col, Badge, Table, Button } from 'react-bootstrap';
import api from './api/axios';

function DashboardPage() {
  const [services, setServices] = useState([]);
  const [myServices, setMyServices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.get('/services').catch(() => ({ data: { services: [] } })),
      api.get('/services/my-services').catch(() => ({ data: { services: [] } })),
      api.get('/transactions').catch(() => ({ data: { transactions: [] } })),
      api.get('/profile/me').catch(() => ({ data: { user: null } })),
    ]).then(([servicesRes, myServicesRes, transactionsRes, profileRes]) => {
      if (isMounted) {
        const liveServices = servicesRes.data?.services || [];
        const liveMyServices = myServicesRes.data?.services || [];
        const liveTransactions = transactionsRes.data?.transactions || [];
        setServices(liveServices);
        setMyServices(liveMyServices);
        setTransactions(liveTransactions);
        setUserProfile(profileRes.data?.user || null);
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
          <Badge bg={isProvider ? 'primary' : 'secondary'} className="px-3 py-2 rounded-pill fw-semibold">
            {isProvider ? 'Provider Account' : 'Requestor Account'}
          </Badge>
          <Badge bg="success" className="px-3 py-2 rounded-pill fw-semibold">
            Online &amp; Active
          </Badge>
        </div>
      </div>

      {/* Role-Specific Metrics Row */}
      {isProvider ? (
        <Row className="g-3 mb-4">
          <Col sm={6} xl={3}>
            <div className="neu-metric-card h-100">
              <div className="text-muted small text-uppercase fw-semibold mb-1">Total Service Revenue</div>
              <div className="fs-3 fw-bold" style={{ color: '#063a8f' }}>
                ₱{providerEarnings.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="small text-muted mt-1">From completed client bookings</div>
            </div>
          </Col>
          <Col sm={6} xl={3}>
            <div className="neu-metric-card h-100">
              <div className="text-muted small text-uppercase fw-semibold mb-1">My Active Listings</div>
              <div className="fs-3 fw-bold" style={{ color: '#063a8f' }}>{providerActiveServicesCount}</div>
              <div className="small text-muted mt-1">Live listings accepting bookings</div>
            </div>
          </Col>
          <Col sm={6} xl={3}>
            <div className="neu-metric-card h-100">
              <div className="text-muted small text-uppercase fw-semibold mb-1">Completed Bookings</div>
              <div className="fs-3 fw-bold" style={{ color: '#063a8f' }}>{providerCompleted.length}</div>
              <div className="small text-muted mt-1">Successfully delivered services</div>
            </div>
          </Col>
          <Col sm={6} xl={3}>
            <div className="neu-metric-card h-100">
              <div className="text-muted small text-uppercase fw-semibold mb-1">Ongoing / Pending Orders</div>
              <div className="fs-3 fw-bold" style={{ color: '#063a8f' }}>{providerOngoingCount}</div>
              <div className="small text-muted mt-1">Orders requiring action or delivery</div>
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
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted small">
                    No transactions found yet. Explore services in the marketplace to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </div>
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
