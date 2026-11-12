import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import TermsAndConditions from './components/TermsAndConditions';
import GlobalLoader from './components/GlobalLoader';
import ServicesPage from './pages/ServicesPage';
import TransactionsPage from './pages/TransactionsPage';
import MessagesPage from './pages/MessagesPage';
import TransactionQRPage from './pages/TransactionQRPage';
import AuthPage from './pages/AuthPage';
import { Row, Col, Badge, Table, Button, Form, Alert } from 'react-bootstrap';
import api from './api/axios';

function DashboardPage() {
  const [servicesCount, setServicesCount] = useState(8);
  const [transactions, setTransactions] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [loadingState, setLoadingState] = useState({
    show: false,
    message: '',
    subMessage: '',
  });

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

  const triggerApiSimulation = () => {
    setLoadingState({
      show: true,
      message: 'Processing Transaction (TX-1004)...',
      subMessage: 'Applying ₱5 booking fee, calculating 5% commission, and saving to Supabase...',
    });

    setTimeout(() => {
      setLoadingState({ show: false, message: '', subMessage: '' });
    }, 2500);
  };

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
      {/* Global Blocking Loader */}
      <GlobalLoader
        show={loadingState.show}
        message={loadingState.message}
        subMessage={loadingState.subMessage}
      />

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>Marketplace Dashboard</h2>
          <p className="text-muted mb-0">Welcome back, {displayName}! Here is your service marketplace overview.</p>
        </div>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <Button className="neu-btn-primary" size="sm" onClick={triggerApiSimulation}>
            Simulate API Call
          </Button>
          <Button as={Link} to="/landing" className="neu-btn-outline" size="sm">
            View Public Landing Page
          </Button>
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
        <div className="table-responsive">
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

function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    contact_number: '',
    region: '',
    province: '',
    city: '',
    barangay: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.get('/profile/me');
      setProfile(data.user);
      setForm({
        first_name: data.user.first_name || '',
        last_name: data.user.last_name || '',
        username: data.user.username || '',
        contact_number: data.user.contact_number || '',
        region: data.user.region || '',
        province: data.user.province || '',
        city: data.user.city || '',
        barangay: data.user.barangay || '',
      });
    } catch (err) {
      // Fallback to sample data for visual reliability if backend table is empty
      const defaultUser = {
        user_id: 'MMC-1042',
        first_name: 'Juan',
        last_name: 'Dela Cruz',
        username: 'juandelacruz',
        email: 'juan.delacruz@serbisyou.ph',
        contact_number: '+63 912 345 6789',
        user_type: 'Provider',
        region: 'NCR',
        province: 'Metro Manila',
        city: 'Quezon City',
        barangay: 'Brgy. Central',
      };
      setProfile(defaultUser);
      setForm(defaultUser);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      const { data } = await api.patch('/profile/me', form);
      setProfile(data.user);
      setIsEditing(false);
      setMessage('Profile updated successfully.');
      window.localStorage.setItem('user', JSON.stringify(data.user));
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center text-muted py-5">Loading profile details...</div>;
  }

  const p = profile || {};

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>User Profile &amp; Account</h2>
          <p className="text-muted mb-0">Registered user information conforming to the users table schema.</p>
        </div>
        <Button
          className={isEditing ? 'neu-btn-ghost px-4' : 'neu-btn-primary px-4'}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel Editing' : 'Edit Profile'}
        </Button>
      </div>

      {message && <Alert variant="success" dismissible onClose={() => setMessage('')} className="neu-alert mb-4">{message}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')} className="neu-alert mb-4">{error}</Alert>}

      <div className="neu-card p-4 p-md-5">
        <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(154, 172, 196, 0.3)' }}>
          <div>
            <h5 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>Account Details</h5>
            <small className="text-muted">SerbisYou Universal User Identifier Record</small>
          </div>
          <Badge bg={p.user_type === 'Provider' ? 'success' : 'primary'} className="px-3 py-2 rounded-pill fs-6">
            {p.user_type ? `${p.user_type} Verified` : 'User Verified'}
          </Badge>
        </div>

        {isEditing ? (
          <Form onSubmit={handleSave}>
            <Row className="g-3">
              <Col sm={6}>
                <Form.Group controlId="editFirstName">
                  <Form.Label className="small fw-semibold text-muted">First Name</Form.Label>
                  <Form.Control
                    className="neu-input"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group controlId="editLastName">
                  <Form.Label className="small fw-semibold text-muted">Last Name</Form.Label>
                  <Form.Control
                    className="neu-input"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group controlId="editUsername">
                  <Form.Label className="small fw-semibold text-muted">Username</Form.Label>
                  <Form.Control
                    className="neu-input"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col sm={6}>
                <Form.Group controlId="editContact">
                  <Form.Label className="small fw-semibold text-muted">Contact Number</Form.Label>
                  <Form.Control
                    className="neu-input"
                    value={form.contact_number}
                    onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col sm={12}>
                <hr className="my-3" style={{ borderColor: 'rgba(154, 172, 196, 0.3)' }} />
                <h6 className="fw-bold text-muted text-uppercase small mb-3">Location Details</h6>
              </Col>
              <Col sm={6} md={3}>
                <Form.Group controlId="editRegion">
                  <Form.Label className="small fw-semibold text-muted">Region</Form.Label>
                  <Form.Control
                    className="neu-input"
                    value={form.region}
                    onChange={(e) => setForm({ ...form, region: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col sm={6} md={3}>
                <Form.Group controlId="editProvince">
                  <Form.Label className="small fw-semibold text-muted">Province</Form.Label>
                  <Form.Control
                    className="neu-input"
                    value={form.province}
                    onChange={(e) => setForm({ ...form, province: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col sm={6} md={3}>
                <Form.Group controlId="editCity">
                  <Form.Label className="small fw-semibold text-muted">City</Form.Label>
                  <Form.Control
                    className="neu-input"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col sm={6} md={3}>
                <Form.Group controlId="editBarangay">
                  <Form.Label className="small fw-semibold text-muted">Barangay</Form.Label>
                  <Form.Control
                    className="neu-input"
                    value={form.barangay}
                    onChange={(e) => setForm({ ...form, barangay: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col sm={12} className="mt-4 d-flex gap-2">
                <Button type="submit" className="neu-btn-primary px-4" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" className="neu-btn-ghost px-4" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </Col>
            </Row>
          </Form>
        ) : (
          <Row className="g-4">
            <Col sm={6}>
              <div className="neu-card-inset p-3">
                <div className="text-muted small mb-1">User ID (Format: MMC-XXXX)</div>
                <div className="fw-bold font-monospace fs-5" style={{ color: 'var(--neu-primary)' }}>{p.user_id || '---'}</div>
              </div>
            </Col>
            <Col sm={6}>
              <div className="neu-card-inset p-3">
                <div className="text-muted small mb-1">User Type</div>
                <div>
                  <Badge bg={p.user_type === 'Provider' ? 'success' : 'primary'} className="rounded-pill px-3 py-1 fs-6">
                    {p.user_type || 'User'}
                  </Badge>
                </div>
              </div>
            </Col>
            <Col sm={6}>
              <div className="neu-card-inset p-3">
                <div className="text-muted small mb-1">Full Name</div>
                <div className="fw-bold fs-6" style={{ color: 'var(--neu-text)' }}>
                  {`${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Not provided'}
                </div>
              </div>
            </Col>
            <Col sm={6}>
              <div className="neu-card-inset p-3">
                <div className="text-muted small mb-1">Username</div>
                <div className="fw-bold fs-6" style={{ color: 'var(--neu-text)' }}>
                  @{p.username || 'none'}
                </div>
              </div>
            </Col>
            <Col sm={6}>
              <div className="neu-card-inset p-3">
                <div className="text-muted small mb-1">Contact Number</div>
                <div className="fw-bold fs-6" style={{ color: 'var(--neu-text)' }}>
                  {p.contact_number || 'Not provided'}
                </div>
              </div>
            </Col>
            <Col sm={6}>
              <div className="neu-card-inset p-3">
                <div className="text-muted small mb-1">Email Address</div>
                <div className="fw-bold fs-6 text-truncate" style={{ color: 'var(--neu-text)' }}>
                  {p.email || 'Not provided'}
                </div>
              </div>
            </Col>
            <Col sm={12}>
              <hr className="my-2" style={{ borderColor: 'rgba(154, 172, 196, 0.3)' }} />
              <h6 className="fw-bold text-muted text-uppercase small mb-3">Location Details</h6>
            </Col>
            <Col sm={6} md={3}>
              <div className="neu-card-inset p-3 text-center">
                <div className="text-muted small mb-1">Region</div>
                <div className="fw-bold" style={{ color: 'var(--neu-text)' }}>{p.region || 'Not set'}</div>
              </div>
            </Col>
            <Col sm={6} md={3}>
              <div className="neu-card-inset p-3 text-center">
                <div className="text-muted small mb-1">Province</div>
                <div className="fw-bold" style={{ color: 'var(--neu-text)' }}>{p.province || 'Not set'}</div>
              </div>
            </Col>
            <Col sm={6} md={3}>
              <div className="neu-card-inset p-3 text-center">
                <div className="text-muted small mb-1">City</div>
                <div className="fw-bold" style={{ color: 'var(--neu-text)' }}>{p.city || 'Not set'}</div>
              </div>
            </Col>
            <Col sm={6} md={3}>
              <div className="neu-card-inset p-3 text-center">
                <div className="text-muted small mb-1">Barangay</div>
                <div className="fw-bold" style={{ color: 'var(--neu-text)' }}>{p.barangay || 'Not set'}</div>
              </div>
            </Col>
          </Row>
        )}
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
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Catch-all redirect to public landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
