import React from 'react';
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Badge,
  Navbar,
  Nav,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import heroImg from '../assets/hero.png';

export default function LandingPage() {
  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: 'var(--neu-bg)' }}>
      {/* 1. Public Top Navigation Bar */}
      <Navbar className="neu-navbar border-bottom py-3 sticky-top" expand="lg">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold fs-4 d-flex align-items-center gap-2" style={{ color: 'var(--neu-primary)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5 8 5.961 14.154 3.5 8.186 1.113zM15 4.239l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464L7.443.184z" />
            </svg>
            <span>SerbisYou</span>
            <Badge bg="primary" className="bg-opacity-10 text-primary small fw-semibold">
              Marketplace
            </Badge>
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="landing-navbar-nav" />

          <Navbar.Collapse id="landing-navbar-nav">
            <Nav className="mx-auto gap-2">
              <Nav.Link href="#how-it-works" className="fw-semibold" style={{ color: 'var(--neu-text-muted)' }}>
                How It Works
              </Nav.Link>
              <Nav.Link as={Link} to="/services" className="fw-semibold" style={{ color: 'var(--neu-text-muted)' }}>
                Browse Services
              </Nav.Link>
              <Nav.Link href="#pricing" className="fw-semibold" style={{ color: 'var(--neu-text-muted)' }}>
                Fee Structure
              </Nav.Link>
            </Nav>

            <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0">
              <Button as={Link} to="/profile" className="neu-btn-outline rounded-pill px-3 fw-semibold">
                Sign In
              </Button>
              <Button as={Link} to="/services" className="neu-btn-primary rounded-pill px-4 fw-semibold">
                Get Started
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* 2. Hero Section with Call-to-Action */}
      <section className="py-5 border-bottom flex-grow-0" style={{ background: 'var(--neu-bg-dark)' }}>
        <Container className="py-lg-5">
          <Row className="align-items-center g-5">
            <Col lg={7}>
              <div className="mb-3">
                <Badge bg="primary" className="bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-semibold fs-6">
                  Community-Driven Service Marketplace
                </Badge>
              </div>

              <h1 className="display-4 fw-bold mb-3" style={{ color: 'var(--neu-text)' }}>
                Connecting Communities with Trusted Local Service Providers
              </h1>

              <p className="lead text-muted mb-4">
                SerbisYou connects local Requestors with skilled Providers. From aircon cleaning and plumbing to electrical works, explore transparent service rates, direct in-app messaging, and seamless QR code payments.
              </p>

              {/* CTA Buttons */}
              <div className="d-flex flex-column flex-sm-row gap-3 mb-4">
                <Button
                  as={Link}
                  to="/services"
                  className="neu-btn-primary rounded-pill px-4 fw-semibold"
                  size="lg"
                >
                  Explore Services
                </Button>
                <Button
                  as={Link}
                  to="/profile"
                  className="neu-btn-outline rounded-pill px-4 fw-semibold"
                  size="lg"
                >
                  Join as Provider
                </Button>
              </div>

              {/* Marketplace Highlights */}
              <Row className="g-3 pt-2">
                <Col sm={4}>
                  <div className="neu-hero-stat">
                    <div className="fw-bold fs-5" style={{ color: 'var(--neu-text)' }}>₱5.00 Flat</div>
                    <div className="text-muted small">Booking Fee</div>
                  </div>
                </Col>
                <Col sm={4}>
                  <div className="neu-hero-stat" style={{ borderLeftColor: 'var(--neu-success)' }}>
                    <div className="fw-bold fs-5" style={{ color: 'var(--neu-text)' }}>5% Only</div>
                    <div className="text-muted small">Provider Commission</div>
                  </div>
                </Col>
                <Col sm={4}>
                  <div className="neu-hero-stat" style={{ borderLeftColor: 'var(--neu-info)' }}>
                    <div className="fw-bold fs-5" style={{ color: 'var(--neu-text)' }}>MMC-Verified</div>
                    <div className="text-muted small">Barangay Providers</div>
                  </div>
                </Col>
              </Row>
            </Col>

            {/* Hero Visual Mockup Card */}
            <Col lg={5}>
              <div className="neu-hero-card">
                <div className="bg-primary text-white p-3 d-flex justify-content-between align-items-center rounded-top-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-white text-primary rounded-circle fw-bold d-flex align-items-center justify-content-center px-2 py-1 small">
                      JD
                    </div>
                    <div>
                      <div className="fw-bold small">Juan Dela Cruz</div>
                      <div className="small font-monospace opacity-75">MMC-1042</div>
                    </div>
                  </div>
                  <Badge bg="success" className="rounded-pill px-3 py-1">
                    Verified Provider
                  </Badge>
                </div>

                <div className="p-4">
                  <div className="text-center mb-3">
                    <img
                      src={heroImg}
                      alt="SerbisYou Marketplace Services"
                      className="img-fluid rounded-3 mb-3"
                    />
                    <Badge bg="secondary" className="mb-2">Home Maintenance</Badge>
                    <h5 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>Aircon Cleaning &amp; Repair</h5>
                    <p className="text-muted small mb-0">Deep chemical cleaning &amp; freon charging for split/window units</p>
                  </div>

                  <div className="neu-price-box rounded-3 p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted small">Service Rate (amount_topay):</span>
                      <strong style={{ color: 'var(--neu-text)' }}>₱800.00</strong>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="text-muted small">Platform Booking Fee:</span>
                      <strong style={{ color: 'var(--neu-text)' }}>₱5.00</strong>
                    </div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold" style={{ color: 'var(--neu-text)' }}>Total to Pay:</span>
                      <strong className="fs-5" style={{ color: 'var(--neu-primary)' }}>₱805.00</strong>
                    </div>
                  </div>

                  <Button as={Link} to="/services" className="neu-btn-primary w-100 rounded-pill fw-semibold">
                    Book Service Now
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 3. 'How it Works' Section (3 Steps with React-Bootstrap Cards) */}
      <section id="how-it-works" className="py-5 flex-grow-0" style={{ background: 'var(--neu-bg)' }}>
        <Container className="py-lg-5">
          <div className="text-center mb-5">
            <Badge bg="primary" className="bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-semibold mb-2">
              Simple 3-Step Process
            </Badge>
            <h2 className="display-6 fw-bold mb-2" style={{ color: 'var(--neu-text)' }}>
              How SerbisYou Works
            </h2>
            <p className="lead text-muted col-lg-8 mx-auto">
              Connecting Requestors and Providers with complete transparency, safety, and guaranteed flat booking rates.
            </p>
          </div>

          <Row className="g-4">
            {/* Step 1 Card */}
            <Col md={4}>
              <div className="neu-step-card p-4 h-100 d-flex flex-column">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="neu-step-number bg-primary text-white">
                    1
                  </div>
                  <Badge bg="primary" className="rounded-pill px-3 py-1">
                    Discovery
                  </Badge>
                </div>

                <h4 className="fw-bold mb-2" style={{ color: 'var(--neu-text)' }}>
                  Browse &amp; Select Services
                </h4>

                <p className="text-muted flex-grow-1">
                  Requestors browse active services filtered by category, subcategory, and nearby barangays. View complete descriptions, verified photos of previous work (<code>picture_proof</code>), and clear service costs.
                </p>

                <div className="pt-3 border-top d-flex align-items-center gap-2 small fw-semibold" style={{ color: 'var(--neu-primary)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                  </svg>
                  <span>Transparent Service Catalog</span>
                </div>
              </div>
            </Col>

            {/* Step 2 Card */}
            <Col md={4}>
              <div className="neu-step-card p-4 h-100 d-flex flex-column">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="neu-step-number bg-success text-white">
                    2
                  </div>
                  <Badge bg="success" className="rounded-pill px-3 py-1">
                    Booking &amp; Chat
                  </Badge>
                </div>

                <h4 className="fw-bold mb-2" style={{ color: 'var(--neu-text)' }}>
                  Book &amp; Coordinate Direct
                </h4>

                <p className="text-muted flex-grow-1">
                  Confirm your booking with a standard ₱5 flat booking fee. Communicate directly through built-in real-time messages to coordinate exact arrival times, tools needed, and specific job requirements.
                </p>

                <div className="pt-3 border-top d-flex align-items-center gap-2 text-success small fw-semibold">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                  </svg>
                  <span>Instant Provider-Requestor Chat</span>
                </div>
              </div>
            </Col>

            {/* Step 3 Card */}
            <Col md={4}>
              <div className="neu-step-card p-4 h-100 d-flex flex-column">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div className="neu-step-number bg-info text-white">
                    3
                  </div>
                  <Badge bg="info" className="text-white rounded-pill px-3 py-1">
                    Payment
                  </Badge>
                </div>

                <h4 className="fw-bold mb-2" style={{ color: 'var(--neu-text)' }}>
                  Complete &amp; Pay via QR
                </h4>

                <p className="text-muted flex-grow-1">
                  Once the provider completes the task (<code>service_status: completed</code>), pay seamlessly using the provided QR code. Providers keep their hard-earned money with a fair 5% platform commission rate.
                </p>

                <div className="pt-3 border-top d-flex align-items-center gap-2 text-info small fw-semibold">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2 2h2v2H2V2Z" />
                    <path d="M6 0v6H0V0h6ZM5 1H1v4h4V1ZM4 12H2v2h2v-2Z" />
                    <path d="M6 10v6H0v-6h6Zm-5 1v4h4v-4H1Zm11-9h2v2h-2V2Z" />
                    <path d="M10 0v6h6V0h-6Zm5 1v4h-4V1h4ZM8 1V0h1v2H8v2H7V1h1Zm0 5V4h1v2H8ZM6 8V7h1V6h1v2h1V7h5v1h-4v1H7V8H6Zm0 0v1H2V8H1v1H0V7h3v1h3Zm10 1h-1V7h1v2Zm-1 3v-1h1v1h-1Zm-1-1v-1h1v1h-1Zm-2 2v-1h1v1h-1Zm1-2h1v1h-1v-1Zm-1 0h-1v-1h1v1Zm-2-2v-1h1v1H8Zm1 4h1v1H9v-1Zm-2-1v-1h1v1H7Zm1 1v1H7v-1h1Zm1 1v1H8v-1h1Zm2 2v-1h.01v1H11Zm-1-1H9v1h1v-1Zm2 1v-1h1v1h-1Zm2-2v-1h1v1h-1Zm0 1h1v1h-1v-1Zm-1 1v-1h1v1h-1Zm-1 0v-1h1v1h-1Z" />
                  </svg>
                  <span>Instant QR Code Settle</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 4. Call to Action Banner */}
      <section
        className="text-white py-5 flex-grow-0"
        style={{
          background: 'linear-gradient(135deg, var(--neu-primary-dark) 0%, var(--neu-primary) 100%)',
          boxShadow: '0 4px 20px rgba(6, 58, 143, 0.4)',
        }}
      >
        <Container className="text-center py-4">
          <h2 className="display-6 fw-bold mb-3">
            Ready to Experience Reliable Local Services?
          </h2>
          <p className="lead opacity-75 mb-4 col-md-8 mx-auto">
            Join thousands of verified Providers and Requestors in your community today. Sign up and start booking in seconds.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <Button as={Link} to="/services" variant="light" size="lg" className="rounded-pill px-4 fw-bold text-primary shadow-sm">
              Explore All Services
            </Button>
            <Button as={Link} to="/profile" variant="outline-light" size="lg" className="rounded-pill px-4 fw-bold">
              Register Account
            </Button>
          </div>
        </Container>
      </section>

      {/* 5. Simple Footer */}
      <footer className="neu-footer text-white pt-5 pb-4 mt-auto">
        <Container>
          <Row className="g-4 mb-4">
            <Col md={5}>
              <div className="fw-bold fs-4 text-white d-flex align-items-center gap-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5 8 5.961 14.154 3.5 8.186 1.113zM15 4.239l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464L7.443.184z" />
                </svg>
                <span>SerbisYou</span>
              </div>
              <p className="text-secondary small mb-3">
                SerbisYou is an on-demand service marketplace bridging local barangay Providers and Requestors with verified accounts (MMC format), flat ₱5 booking fees, and 5% provider commission rates.
              </p>
              <div className="text-secondary small">
                Operating in Metro Manila &bull; Quezon City &bull; Local Barangays
              </div>
            </Col>

            <Col sm={6} md={3} className="offset-md-1">
              <h6 className="text-white fw-bold text-uppercase small mb-3">Marketplace</h6>
              <ul className="list-unstyled text-secondary small d-flex flex-column gap-2 mb-0">
                <li><Link to="/services" className="text-secondary text-decoration-none">Browse Services</Link></li>
                <li><Link to="/transactions" className="text-secondary text-decoration-none">My Transactions</Link></li>
                <li><Link to="/messages" className="text-secondary text-decoration-none">Direct Messages</Link></li>
                <li><Link to="/profile" className="text-secondary text-decoration-none">Provider Registration</Link></li>
              </ul>
            </Col>

            <Col sm={6} md={3}>
              <h6 className="text-white fw-bold text-uppercase small mb-3">Platform Policies</h6>
              <ul className="list-unstyled text-secondary small d-flex flex-column gap-2 mb-0">
                <li><span className="text-secondary">Flat ₱5 Booking Fee</span></li>
                <li><span className="text-secondary">5% Provider Commission</span></li>
                <li><span className="text-secondary">Verified MMC-XXXX IDs</span></li>
                <li><span className="text-secondary">Soft Delete &amp; Privacy Policy</span></li>
              </ul>
            </Col>
          </Row>

          <hr className="border-secondary my-4" />

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center text-secondary small">
            <div>
              &copy; {new Date().getFullYear()} SerbisYou Marketplace. All rights reserved.
            </div>
            <div className="d-flex gap-3 mt-2 mt-md-0">
              <span className="text-secondary">Privacy Policy</span>
              <span className="text-secondary">&bull;</span>
              <Link to="/terms" className="text-secondary text-decoration-none">Terms of Service</Link>
              <span className="text-secondary">&bull;</span>
              <span className="text-secondary">Universal DB Schema v1.0</span>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
