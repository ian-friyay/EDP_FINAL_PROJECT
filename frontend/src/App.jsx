import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import TermsAndConditions from './components/TermsAndConditions';
import GlobalLoader from './components/GlobalLoader';
import ServicesGrid from './components/ServicesGrid';
import TransactionsPage from './pages/TransactionsPage';
import MessagesPage from './pages/MessagesPage';
import TransactionQRPage from './pages/TransactionQRPage';
import { Row, Col, Badge, Table, Button } from 'react-bootstrap';

// Sample Pages mapped to the SerbisYou Universal Database Schema

function DashboardPage() {
  const [loadingState, setLoadingState] = useState({
    show: false,
    message: '',
    subMessage: '',
  });

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
          <p className="text-muted mb-0">Welcome back, Juan! Here is your service marketplace overview.</p>
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

      {/* Metrics Row */}
      <Row className="g-3 mb-4">
        <Col sm={6} xl={3}>
          <div className="neu-metric-card h-100">
            <div className="text-muted small text-uppercase fw-semibold mb-1">Active Services</div>
            <div className="fs-3 fw-bold" style={{ color: 'var(--neu-primary)' }}>8</div>
            <div className="small text-muted mt-1">services table</div>
          </div>
        </Col>
        <Col sm={6} xl={3}>
          <div className="neu-metric-card h-100">
            <div className="text-muted small text-uppercase fw-semibold mb-1">Total Bookings</div>
            <div className="fs-3 fw-bold text-success">24</div>
            <div className="small text-muted mt-1">transactions table</div>
          </div>
        </Col>
        <Col sm={6} xl={3}>
          <div className="neu-metric-card h-100">
            <div className="text-muted small text-uppercase fw-semibold mb-1">Booking Fees Paid</div>
            <div className="fs-3 fw-bold text-info">₱120.00</div>
            <div className="small text-muted mt-1">₱5 flat rate / transaction</div>
          </div>
        </Col>
        <Col sm={6} xl={3}>
          <div className="neu-metric-card h-100">
            <div className="text-muted small text-uppercase fw-semibold mb-1">Commission Earned</div>
            <div className="fs-3 fw-bold text-warning">₱850.00</div>
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
                <th className="py-3 px-3 text-uppercase small fw-bold" style={{ color: 'var(--neu-text)' }}>Requestor</th>
                <th className="py-3 px-3 text-uppercase small fw-bold" style={{ color: 'var(--neu-text)' }}>Amount</th>
                <th className="py-3 px-3 text-uppercase small fw-bold d-none d-md-table-cell" style={{ color: 'var(--neu-text)' }}>Booking Fee</th>
                <th className="py-3 px-3 text-uppercase small fw-bold" style={{ color: 'var(--neu-text)' }}>Total</th>
                <th className="py-3 px-3 text-uppercase small fw-bold" style={{ color: 'var(--neu-text)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
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
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function ServicesPage() {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>Services Marketplace</h2>
          <p className="text-muted mb-0">Browse and book verified community services, or filter by category.</p>
        </div>
        <Button className="neu-btn-primary rounded-pill px-4">
          + Add New Service
        </Button>
      </div>

      <ServicesGrid />
    </div>
  );
}

function ProfilePage() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>User Profile &amp; Account</h2>
        <p className="text-muted mb-0">Registered user information conforming to the users table schema.</p>
      </div>

      <div className="neu-card p-4 p-md-5">
        <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(154, 172, 196, 0.3)' }}>
          <div>
            <h5 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>Account Details</h5>
            <small className="text-muted">SerbisYou Universal User Identifier Record</small>
          </div>
          <Badge bg="success" className="px-3 py-2 rounded-pill fs-6">
            Provider Verified
          </Badge>
        </div>

        <Row className="g-4">
          <Col sm={6}>
            <div className="neu-card-inset p-3">
              <div className="text-muted small mb-1">User ID (Format: MMC-XXXX)</div>
              <div className="fw-bold font-monospace fs-5" style={{ color: 'var(--neu-primary)' }}>MMC-1042</div>
            </div>
          </Col>
          <Col sm={6}>
            <div className="neu-card-inset p-3">
              <div className="text-muted small mb-1">User Type</div>
              <div><Badge bg="success" className="rounded-pill px-3 py-1 fs-6">Provider</Badge></div>
            </div>
          </Col>
          <Col sm={6}>
            <div className="neu-card-inset p-3">
              <div className="text-muted small mb-1">Full Name</div>
              <div className="fw-bold fs-6" style={{ color: 'var(--neu-text)' }}>Juan Dela Cruz</div>
            </div>
          </Col>
          <Col sm={6}>
            <div className="neu-card-inset p-3">
              <div className="text-muted small mb-1">Username</div>
              <div className="fw-bold fs-6" style={{ color: 'var(--neu-text)' }}>@juandelacruz</div>
            </div>
          </Col>
          <Col sm={6}>
            <div className="neu-card-inset p-3">
              <div className="text-muted small mb-1">Contact Number</div>
              <div className="fw-bold fs-6" style={{ color: 'var(--neu-text)' }}>+63 912 345 6789</div>
            </div>
          </Col>
          <Col sm={6}>
            <div className="neu-card-inset p-3">
              <div className="text-muted small mb-1">Email Address</div>
              <div className="fw-bold fs-6 text-truncate" style={{ color: 'var(--neu-text)' }}>juan.delacruz@serbisyou.ph</div>
            </div>
          </Col>
          <Col sm={12}>
            <hr className="my-2" style={{ borderColor: 'rgba(154, 172, 196, 0.3)' }} />
            <h6 className="fw-bold text-muted text-uppercase small mb-3">Location Details</h6>
          </Col>
          <Col sm={6} md={3}>
            <div className="neu-card-inset p-3 text-center">
              <div className="text-muted small mb-1">Region</div>
              <div className="fw-bold" style={{ color: 'var(--neu-text)' }}>NCR</div>
            </div>
          </Col>
          <Col sm={6} md={3}>
            <div className="neu-card-inset p-3 text-center">
              <div className="text-muted small mb-1">Province</div>
              <div className="fw-bold" style={{ color: 'var(--neu-text)' }}>Metro Manila</div>
            </div>
          </Col>
          <Col sm={6} md={3}>
            <div className="neu-card-inset p-3 text-center">
              <div className="text-muted small mb-1">City</div>
              <div className="fw-bold" style={{ color: 'var(--neu-text)' }}>Quezon City</div>
            </div>
          </Col>
          <Col sm={6} md={3}>
            <div className="neu-card-inset p-3 text-center">
              <div className="text-muted small mb-1">Barangay</div>
              <div className="fw-bold" style={{ color: 'var(--neu-text)' }}>Brgy. Central</div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/terms" element={<TermsAndConditions />} />

        {/* Authenticated / App Shell Layout Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="transactions/:transactionId/qr" element={<TransactionQRPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
