import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import TermsAndConditions from './components/TermsAndConditions';
import GlobalLoader from './components/GlobalLoader';
import ServicesPage from './pages/ServicesPage';
import MessagesPage from './pages/MessagesPage';
import TransactionQRPage from './pages/TransactionQRPage';
import TransactionsPage from './pages/TransactionsPage';
import AuthPage from './pages/AuthPage';
import { Card, Row, Col, Badge, Table, Button, Form, Alert } from 'react-bootstrap';
import api from './api/axios';

// Sample Pages mapped to the SerbisYou Universal Database Schema

function DashboardPage() {
  const [servicesCount, setServicesCount] = useState(0);
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
        setServicesCount((servicesRes.data.services || []).length);
        setTransactions(transactionsRes.data.transactions || []);
        setUserProfile(profileRes.data.user);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalBookings = transactions.length;
  const bookingFeesPaid = transactions.reduce((acc, t) => acc + (Number(t.booking_fee) || 5), 0);
  const commissionEarned = transactions.reduce((acc, t) => acc + (Number(t.commission_fee) || 0), 0);
  const recentTransactions = transactions.slice(0, 5);

  const displayName = userProfile
    ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || userProfile.username || userProfile.user_id
    : 'User';

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1">Marketplace Dashboard</h2>
          <p className="text-muted mb-0">
            Welcome back, {displayName}! Here is your service marketplace overview.
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <Button as={Link} to="/services" variant="primary" size="sm">
            Browse Services
          </Button>
          <Button as={Link} to="/" variant="outline-primary" size="sm">
            View Public Landing Page
          </Button>
          <Badge bg="success" className="px-3 py-2 fs-6">
            Online &amp; Active
          </Badge>
        </div>
      </div>

      {/* Metrics Row */}
      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body>
              <div className="text-muted small text-uppercase fw-semibold mb-1">Active Services</div>
              <div className="fs-3 fw-bold text-primary">{servicesCount}</div>
              <div className="small text-muted mt-1">Live in marketplace</div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} xl={3}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body>
              <div className="text-muted small text-uppercase fw-semibold mb-1">Total Bookings</div>
              <div className="fs-3 fw-bold text-success">{totalBookings}</div>
              <div className="small text-muted mt-1">Your transactions</div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} xl={3}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body>
              <div className="text-muted small text-uppercase fw-semibold mb-1">Booking Fees</div>
              <div className="fs-3 fw-bold text-info">₱{bookingFeesPaid.toFixed(2)}</div>
              <div className="small text-muted mt-1">₱5 flat rate / transaction</div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} xl={3}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body>
              <div className="text-muted small text-uppercase fw-semibold mb-1">Commission</div>
              <div className="fs-3 fw-bold text-warning">₱{commissionEarned.toFixed(2)}</div>
              <div className="small text-muted mt-1">5% of amount_topay</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity Card */}
      <Card className="border-0 shadow-sm rounded-3">
        <Card.Header className="bg-white border-bottom py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="fw-bold mb-0">Recent Transactions</h5>
            <Button as={Link} to="/transactions" variant="outline-primary" size="sm">
              View All
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center text-muted py-4">Loading dashboard data...</div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center text-muted py-4">No transactions recorded yet.</div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th>Tx ID</th>
                  <th>Service</th>
                  <th>Provider</th>
                  <th>Amount</th>
                  <th>Booking Fee</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.transaction_id}>
                    <td className="font-monospace fw-bold">{tx.transaction_id}</td>
                    <td>{tx.service_name || 'Service'}</td>
                    <td>{tx.provider_name || tx.provider_id}</td>
                    <td>₱{Number(tx.amount_topay || 0).toFixed(2)}</td>
                    <td>₱{Number(tx.booking_fee || 5).toFixed(2)}</td>
                    <td className="fw-bold">₱{Number(tx.total_topay || 0).toFixed(2)}</td>
                    <td>
                      <Badge bg={tx.service_status === 'accepted' ? 'primary' : tx.service_status === 'completed' ? 'success' : tx.service_status === 'cancelled' ? 'danger' : 'warning'} className="text-capitalize">
                        {tx.service_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
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
      setError(err.response?.data?.error || err.message || 'Failed to load profile.');
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
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center text-muted py-5">Loading profile details...</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1">User Profile &amp; Account</h2>
          <p className="text-muted mb-0">Registered user information conforming to the users table schema.</p>
        </div>
        <Button
          variant={isEditing ? 'outline-secondary' : 'primary'}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel Editing' : 'Edit Profile'}
        </Button>
      </div>

      {message && <Alert variant="success" dismissible onClose={() => setMessage('')}>{message}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <Card className="border-0 shadow-sm rounded-3">
        <Card.Header className="bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
          <span>Account Details</span>
          <Badge bg={profile?.user_type === 'Provider' ? 'success' : 'primary'} className="fs-6">
            {profile?.user_type || 'User'}
          </Badge>
        </Card.Header>
        <Card.Body className="p-4">
          {isEditing ? (
            <Form onSubmit={handleSave}>
              <Row className="g-3">
                <Col sm={6}>
                  <Form.Group controlId="editFirstName">
                    <Form.Label>First Name</Form.Label>
                    <Form.Control
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group controlId="editLastName">
                    <Form.Label>Last Name</Form.Label>
                    <Form.Control
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group controlId="editUsername">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group controlId="editContact">
                    <Form.Label>Contact Number</Form.Label>
                    <Form.Control
                      value={form.contact_number}
                      onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col sm={12}>
                  <hr />
                  <h6 className="fw-bold text-muted text-uppercase small mb-3">Location Details</h6>
                </Col>
                <Col sm={6} md={3}>
                  <Form.Group controlId="editRegion">
                    <Form.Label>Region</Form.Label>
                    <Form.Control
                      value={form.region}
                      onChange={(e) => setForm({ ...form, region: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col sm={6} md={3}>
                  <Form.Group controlId="editProvince">
                    <Form.Label>Province</Form.Label>
                    <Form.Control
                      value={form.province}
                      onChange={(e) => setForm({ ...form, province: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col sm={6} md={3}>
                  <Form.Group controlId="editCity">
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col sm={6} md={3}>
                  <Form.Group controlId="editBarangay">
                    <Form.Label>Barangay</Form.Label>
                    <Form.Control
                      value={form.barangay}
                      onChange={(e) => setForm({ ...form, barangay: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col sm={12} className="mt-4">
                  <Button type="submit" variant="primary" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Col>
              </Row>
            </Form>
          ) : (
            <Row className="g-3">
              <Col sm={6}>
                <div className="text-muted small">User ID (Format: MMC-XXXX)</div>
                <div className="fw-bold font-monospace fs-5 text-primary">{profile?.user_id}</div>
              </Col>
              <Col sm={6}>
                <div className="text-muted small">Email Address</div>
                <div className="fw-bold">{profile?.email}</div>
              </Col>
              <Col sm={6}>
                <div className="text-muted small">Full Name</div>
                <div className="fw-bold">
                  {`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Not provided'}
                </div>
              </Col>
              <Col sm={6}>
                <div className="text-muted small">Username</div>
                <div className="fw-bold">@{profile?.username || 'none'}</div>
              </Col>
              <Col sm={6}>
                <div className="text-muted small">Contact Number</div>
                <div className="fw-bold">{profile?.contact_number || 'Not provided'}</div>
              </Col>
              <Col sm={12}>
                <hr />
                <h6 className="fw-bold text-muted text-uppercase small mb-3">Location Details</h6>
              </Col>
              <Col sm={6} md={3}>
                <div className="text-muted small">Region</div>
                <div className="fw-bold">{profile?.region || 'Not set'}</div>
              </Col>
              <Col sm={6} md={3}>
                <div className="text-muted small">Province</div>
                <div className="fw-bold">{profile?.province || 'Not set'}</div>
              </Col>
              <Col sm={6} md={3}>
                <div className="text-muted small">City</div>
                <div className="fw-bold">{profile?.city || 'Not set'}</div>
              </Col>
              <Col sm={6} md={3}>
                <div className="text-muted small">Barangay</div>
                <div className="fw-bold">{profile?.barangay || 'Not set'}</div>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>
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
        <Route path="/sign-in" element={<AuthPage mode="sign-in" />} />
        <Route path="/sign-up" element={<AuthPage mode="sign-up" />} />

        {/* App Shell Routes */}
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/transactions/:transactionId/qr" element={<TransactionQRPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
