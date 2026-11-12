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
import { Card, Row, Col, Badge, Table, Button } from 'react-bootstrap';

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

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1">Marketplace Dashboard</h2>
          <p className="text-muted mb-0">Welcome back, Juan! Here is your service marketplace overview.</p>
        </div>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <Button variant="primary" size="sm" onClick={triggerApiSimulation}>
            Simulate API Call (Loader)
          </Button>
          <Button as={Link} to="/landing" variant="outline-primary" size="sm">
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
              <div className="fs-3 fw-bold text-primary">8</div>
              <div className="small text-muted mt-1">services table</div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} xl={3}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body>
              <div className="text-muted small text-uppercase fw-semibold mb-1">Total Bookings</div>
              <div className="fs-3 fw-bold text-success">24</div>
              <div className="small text-muted mt-1">transactions table</div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} xl={3}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body>
              <div className="text-muted small text-uppercase fw-semibold mb-1">Booking Fees Paid</div>
              <div className="fs-3 fw-bold text-info">₱120.00</div>
              <div className="small text-muted mt-1">₱5 flat rate / transaction</div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} xl={3}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body>
              <div className="text-muted small text-uppercase fw-semibold mb-1">Commission Earned</div>
              <div className="fs-3 fw-bold text-warning">₱850.00</div>
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
          <Table responsive hover className="mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Tx ID</th>
                <th>Service</th>
                <th>Requestor</th>
                <th>Amount</th>
                <th>Booking Fee</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-monospace fw-bold">TXN-9021</td>
                <td>Aircon Cleaning &amp; Repair</td>
                <td>MMC-2031</td>
                <td>₱800.00</td>
                <td>₱5.00</td>
                <td className="fw-bold">₱805.00</td>
                <td><Badge bg="success">Accepted</Badge></td>
              </tr>
              <tr>
                <td className="font-monospace fw-bold">TXN-9020</td>
                <td>Plumbing Installation</td>
                <td>MMC-3044</td>
                <td>₱1,200.00</td>
                <td>₱5.00</td>
                <td className="fw-bold">₱1,205.00</td>
                <td><Badge bg="warning" text="dark">Pending</Badge></td>
              </tr>
              <tr>
                <td className="font-monospace fw-bold">TXN-9019</td>
                <td>Home Electrical Wiring</td>
                <td>MMC-1088</td>
                <td>₱2,500.00</td>
                <td>₱5.00</td>
                <td className="fw-bold">₱2,505.00</td>
                <td><Badge bg="primary">Completed</Badge></td>
              </tr>
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}

function ServicesPage() {
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1">Services Marketplace</h2>
          <p className="text-muted mb-0">Browse and book verified community services, or filter by category.</p>
        </div>
        <Button variant="primary" className="rounded-pill px-3 shadow-sm">
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
        <h2 className="fw-bold mb-1">User Profile &amp; Account</h2>
        <p className="text-muted mb-0">Registered user information conforming to the users table schema.</p>
      </div>

      <Card className="border-0 shadow-sm rounded-3">
        <Card.Header className="bg-white fw-bold py-3">Account Details</Card.Header>
        <Card.Body className="p-4">
          <Row className="g-3">
            <Col sm={6}>
              <div className="text-muted small">User ID (Format: MMC-XXXX)</div>
              <div className="fw-bold font-monospace fs-5 text-primary">MMC-1042</div>
            </Col>
            <Col sm={6}>
              <div className="text-muted small">User Type</div>
              <div><Badge bg="success" className="fs-6">Provider</Badge></div>
            </Col>
            <Col sm={6}>
              <div className="text-muted small">Full Name</div>
              <div className="fw-bold">Juan Dela Cruz</div>
            </Col>
            <Col sm={6}>
              <div className="text-muted small">Username</div>
              <div className="fw-bold">@juandelacruz</div>
            </Col>
            <Col sm={6}>
              <div className="text-muted small">Contact Number</div>
              <div className="fw-bold">+63 912 345 6789</div>
            </Col>
            <Col sm={6}>
              <div className="text-muted small">Email Address</div>
              <div className="fw-bold">juan.delacruz@serbisyou.ph</div>
            </Col>
            <Col sm={12}>
              <hr />
              <h6 className="fw-bold text-muted text-uppercase small mb-3">Location Details</h6>
            </Col>
            <Col sm={6} md={3}>
              <div className="text-muted small">Region</div>
              <div className="fw-bold">NCR</div>
            </Col>
            <Col sm={6} md={3}>
              <div className="text-muted small">Province</div>
              <div className="fw-bold">Metro Manila</div>
            </Col>
            <Col sm={6} md={3}>
              <div className="text-muted small">City</div>
              <div className="fw-bold">Quezon City</div>
            </Col>
            <Col sm={6} md={3}>
              <div className="text-muted small">Barangay</div>
              <div className="fw-bold">Brgy. Central</div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
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
