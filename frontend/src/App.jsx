import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import TermsAndConditions from './components/TermsAndConditions';
import GlobalLoader from './components/GlobalLoader';
import ServicesPage from './pages/ServicesPage';
import TransactionsPage from './pages/TransactionsPage';
import MessagesPage from './pages/MessagesPage';
import ChatPage from './pages/ChatPage';
import TransactionQRPage from './pages/TransactionQRPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';
import { Row, Col, Badge, Table, Button, Form, Alert } from 'react-bootstrap';
import api from './api/axios';

function DashboardPage() {
  const [servicesCount, setServicesCount] = useState(8);
  const [transactions, setTransactions] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      api.get('/services').catch(() => ({ data: { services: [] } })),
      api.get('/transactions').catch(() => ({ data: { transactions: [] } })),
      api.get('/profile/me').catch(() => ({ data: { user: null } })),
    ]).then(([servicesRes, transactionsRes, profileRes]) => {
      if (isMounted) {
        const liveServices = servicesRes.data.services || [];
        const liveTransactions = transactionsRes.data.transactions || [];
        setServicesCount(liveServices.length || 8);
        setTransactions(liveTransactions);
        setUserProfile(profileRes.data.user);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalBookings = transactions.length > 0 ? transactions.length : 24;
  const bookingFeesPaid = transactions.length > 0
    ? transactions.reduce((acc, t) => acc + (Number(t.booking_fee) || 5), 0)
    : 120.0;
  const commissionEarned = transactions.length > 0
    ? transactions.reduce((acc, t) => acc + (Number(t.commission_fee) || 0), 0)
    : 850.0;
  const recentTransactions = transactions.slice(0, 5);

  const displayName = userProfile
    ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || userProfile.username || userProfile.user_id
    : 'Juan';

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>Marketplace Dashboard</h2>
          <p className="text-muted mb-0">Welcome back, {displayName}! Here is your service marketplace overview.</p>
        </div>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <Badge bg="success" className="px-3 py-2 rounded-pill fw-semibold">
            Online &amp; Active
          </Badge>
        </div>
      </div>

      {/* Metrics Row - Dark Blue metric values (#063a8f) */}
      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <div className="neu-metric-card h-100">
            <div className="text-muted small text-uppercase fw-semibold mb-1">Active Services</div>
            <div className="fs-3 fw-bold" style={{ color: '#063a8f' }}>{servicesCount}</div>
            <div className="small text-muted mt-1">services table</div>
          </div>
        </Col>
        <Col sm={6} xl={3}>
          <div className="neu-metric-card h-100">
            <div className="text-muted small text-uppercase fw-semibold mb-1">Total Bookings</div>
            <div className="fs-3 fw-bold" style={{ color: '#063a8f' }}>{totalBookings}</div>
            <div className="small text-muted mt-1">transactions table</div>
          </div>
        </Col>
        <Col sm={6} xl={3}>
          <div className="neu-metric-card h-100">
            <div className="text-muted small text-uppercase fw-semibold mb-1">Booking Fees Paid</div>
            <div className="fs-3 fw-bold" style={{ color: '#063a8f' }}>₱{bookingFeesPaid.toFixed(2)}</div>
            <div className="small text-muted mt-1">₱5 flat rate / transaction</div>
          </div>
        </Col>
        <Col sm={6} xl={3}>
          <div className="neu-metric-card h-100">
            <div className="text-muted small text-uppercase fw-semibold mb-1">Commission Earned</div>
            <div className="fs-3 fw-bold" style={{ color: '#063a8f' }}>₱{commissionEarned.toFixed(2)}</div>
            <div className="small text-muted mt-1">5% of amount_topay</div>
          </div>
        </Col>
      </Row>

      {/* Recent Activity Card */}
      <div className="neu-card">
        <div className="d-flex justify-content-between align-items-center border-bottom p-3 p-md-4" style={{ borderColor: 'rgba(154, 172, 196, 0.3)' }}>
          <h5 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>Recent Transactions</h5>
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
                <th className="py-3 px-3 text-uppercase small fw-bold" style={{ color: 'var(--neu-text)' }}>Party</th>
                <th className="py-3 px-3 text-uppercase small fw-bold" style={{ color: 'var(--neu-text)' }}>Amount</th>
                <th className="py-3 px-3 text-uppercase small fw-bold d-none d-md-table-cell" style={{ color: 'var(--neu-text)' }}>Booking Fee</th>
                <th className="py-3 px-3 text-uppercase small fw-bold" style={{ color: 'var(--neu-text)' }}>Total</th>
                <th className="py-3 px-3 text-uppercase small fw-bold" style={{ color: 'var(--neu-text)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => (
                  <tr key={tx.transaction_id}>
                    <td className="font-monospace fw-bold px-3">{tx.transaction_id}</td>
                    <td className="px-3">{tx.service_name || tx.service_id || 'Service'}</td>
                    <td className="px-3 font-monospace text-muted">{tx.requestor_id || tx.provider_id || 'MMC-USER'}</td>
                    <td className="px-3">₱{Number(tx.amount_topay || 0).toFixed(2)}</td>
                    <td className="px-3 text-muted d-none d-md-table-cell">₱{Number(tx.booking_fee || 5).toFixed(2)}</td>
                    <td className="px-3 fw-bold" style={{ color: 'var(--neu-primary)' }}>₱{Number(tx.total_topay || (Number(tx.amount_topay || 0) + 5)).toFixed(2)}</td>
                    <td className="px-3">
                      <Badge
                        bg={
                          tx.service_status === 'completed'
                            ? 'primary'
                            : tx.service_status === 'accepted'
                            ? 'success'
                            : tx.service_status === 'cancelled'
                            ? 'danger'
                            : 'warning'
                        }
                        text={tx.service_status === 'pending' ? 'dark' : 'white'}
                        className="rounded-pill px-2 py-1 text-capitalize"
                      >
                        {tx.service_status || 'pending'}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  <tr>
                    <td className="font-monospace fw-bold px-3">TXN-9021</td>
                    <td className="px-3">Aircon Cleaning &amp; Repair</td>
                    <td className="px-3 font-monospace text-muted">MMC-2031</td>
                    <td className="px-3">₱800.00</td>
                    <td className="px-3 text-muted d-none d-md-table-cell">₱5.00</td>
                    <td className="px-3 fw-bold" style={{ color: 'var(--neu-primary)' }}>₱805.00</td>
                    <td className="px-3"><Badge bg="success" className="rounded-pill px-2 py-1">Accepted</Badge></td>
                  </tr>
                  <tr>
                    <td className="font-monospace fw-bold px-3">TXN-9020</td>
                    <td className="px-3">Plumbing Installation</td>
                    <td className="px-3 font-monospace text-muted">MMC-3044</td>
                    <td className="px-3">₱1,200.00</td>
                    <td className="px-3 text-muted d-none d-md-table-cell">₱5.00</td>
                    <td className="px-3 fw-bold" style={{ color: 'var(--neu-primary)' }}>₱1,205.00</td>
                    <td className="px-3"><Badge bg="warning" text="dark" className="rounded-pill px-2 py-1">Pending</Badge></td>
                  </tr>
                  <tr>
                    <td className="font-monospace fw-bold px-3">TXN-9019</td>
                    <td className="px-3">Home Electrical Wiring</td>
                    <td className="px-3 font-monospace text-muted">MMC-1088</td>
                    <td className="px-3">₱2,500.00</td>
                    <td className="px-3 text-muted d-none d-md-table-cell">₱5.00</td>
                    <td className="px-3 fw-bold" style={{ color: 'var(--neu-primary)' }}>₱2,505.00</td>
                    <td className="px-3"><Badge bg="primary" className="rounded-pill px-2 py-1">Completed</Badge></td>
                  </tr>
                </>
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
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
          <Route path="/admin/statistics" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
        </Route>

        {/* Admin Portal Routes (No CMS) */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="statistics" element={<AdminPage />} />
        </Route>

        {/* Catch-all redirect to public landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
