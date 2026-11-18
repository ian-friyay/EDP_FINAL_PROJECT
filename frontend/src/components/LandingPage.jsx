import React from 'react';
import {
  Container,
  Row,
  Col,
  Button,
  Navbar,
  Nav,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import WeatherWidget from './WeatherWidget';
import AdBanner from './AdBanner';

export default function LandingPage() {
  const THEME_BLUE = '#0A192F';
  const THEME_BLUE_DARK = '#061528';
  const THEME_BLUE_LIGHT = '#133266';
  const SUN_ORANGE = '#ff7828';
  const SUN_ORANGE_DARK = '#ea580c';

  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [userRole, setUserRole] = React.useState('student');

  React.useEffect(() => {
    try {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
      const userStr = typeof window !== 'undefined' ? window.localStorage.getItem('user') : null;
      if (token && userStr) {
        setIsAuthenticated(true);
        const parsed = JSON.parse(userStr);
        if (parsed?.user_type === 'Admin' || (parsed?.department && parsed?.designation)) {
          setUserRole('admin');
        }
      }
    } catch {
      // Non-blocking
    }
  }, []);

  const focusedCategories = [
    {
      id: 'creative',
      title: 'Creative',
      icon: '/icons/creative-icon.png',
      tags: ['Graphic Designer', 'Art Painter'],
      description:
        'Custom canvas paintings, sketches, digital art, poster design, logos, and visual branding crafted by talented campus artists.',
      queryCategory: 'Creative',
    },
    {
      id: 'event-support',
      title: 'Event Support',
      icon: '/icons/event-support-icon.png',
      tags: ['Make-up artist', 'Event Hosts'],
      description:
        'Charismatic student hosts, masters of ceremonies, and skilled make-up artists for university functions, ceremonies, and pageants.',
      queryCategory: 'Event Support',
    },
    {
      id: 'digital-service',
      title: 'Digital Service',
      icon: '/icons/digital-service-icon.png',
      tags: ['Photographers', 'Video Editors'],
      description:
        'Campus photo shoots, event coverage, cinematic reels, video editing, and digital media production delivered by student specialists.',
      queryCategory: 'Digital Service',
    },
  ];

  return (
    <div className="min-vh-100 d-flex flex-column w-100" style={{ background: 'var(--neu-bg)', overflowX: 'hidden' }}>
      {/* 1. Public Top Navigation Bar */}
      <Navbar className="neu-navbar border-bottom py-3 sticky-top" expand="lg">
        <Container fluid className="px-3 px-sm-4 px-lg-5">
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center p-0" style={{ marginTop: '-3px' }}>
            {/* Full text logo for desktop view */}
            <img
              src="/logo-transparent.png"
              alt="SerbisYou"
              className="logo-white-shadow d-none d-lg-inline-block"
              style={{
                height: '42px',
                objectFit: 'contain',
                background: 'transparent',
              }}
            />
            {/* Compact hands logo when collapsed / hamburger mobile view */}
            <img
              src="/logo-hands.png"
              alt="SerbisYou"
              className="logo-white-shadow d-inline-block d-lg-none"
              style={{
                height: '36px',
                width: '36px',
                objectFit: 'contain',
                background: 'transparent',
              }}
            />
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="landing-navbar-nav" className="border-0 shadow-none p-1" style={{ filter: 'invert(1)' }} />

          <Navbar.Collapse id="landing-navbar-nav">
            <Nav className="ms-auto align-items-lg-center gap-3 gap-lg-4 mt-3 mt-lg-0">
              <Nav.Link
                href="#services"
                className="fw-semibold px-2 py-1 text-white text-decoration-none"
                style={{ fontSize: '15px', opacity: 0.9, transition: 'all 0.2s ease' }}
                onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = SUN_ORANGE; }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.color = '#ffffff'; }}
              >
                Focus Categories
              </Nav.Link>
              <Nav.Link
                href="#how-it-works"
                className="fw-semibold px-2 py-1 text-white text-decoration-none"
                style={{ fontSize: '15px', opacity: 0.9, transition: 'all 0.2s ease' }}
                onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = SUN_ORANGE; }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.color = '#ffffff'; }}
              >
                How It Works
              </Nav.Link>
              <Nav.Link
                href="#about"
                className="fw-semibold px-2 py-1 text-white text-decoration-none"
                style={{ fontSize: '15px', opacity: 0.9, transition: 'all 0.2s ease' }}
                onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = SUN_ORANGE; }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.color = '#ffffff'; }}
              >
                About SerbisYou
              </Nav.Link>

              <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2 ms-lg-3 mt-3 mt-lg-0">
                {isAuthenticated ? (
                  <Button
                    as={Link}
                    to={userRole === 'admin' ? '/admin/dashboard' : '/dashboard'}
                    className="rounded-pill px-4 py-2 fw-bold text-white border-0 text-center"
                    style={{
                      background: `linear-gradient(135deg, ${SUN_ORANGE} 0%, ${SUN_ORANGE_DARK} 100%)`,
                      boxShadow: '0 4px 14px rgba(255, 120, 40, 0.4)',
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 18px rgba(255, 120, 40, 0.65)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(255, 120, 40, 0.4)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Go to Dashboard &rarr;
                  </Button>
                ) : (
                  <>
                    <Button
                      as={Link}
                      to="/sign-in"
                      className="rounded-pill px-3 py-2 fw-semibold text-white text-decoration-none text-center"
                      style={{
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.45)',
                        boxShadow: 'none',
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#ffffff';
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.25)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.45)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      Sign In
                    </Button>
                    <Button
                      as={Link}
                      to="/sign-up"
                      className="rounded-pill px-4 py-2 fw-bold text-white border-0 text-center"
                      style={{
                        background: `linear-gradient(135deg, ${SUN_ORANGE} 0%, ${SUN_ORANGE_DARK} 100%)`,
                        boxShadow: 'none',
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 120, 40, 0.55)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* 2. Hero Section: Centered at the middle of the screen & Fully Responsive */}
      <section className="py-5 flex-grow-0 position-relative w-100" style={{ background: 'var(--neu-bg)' }}>
        <Container className="py-4 py-lg-5 position-relative" style={{ zIndex: 2 }}>
          <Row className="justify-content-center text-center">
            <Col lg={10} xl={9} xs={12} className="mx-auto text-center d-flex flex-column align-items-center">
              {/* Category / Platform Pill */}
              <div
                className="mb-3 d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm"
                style={{
                  backgroundColor: '#ffffff',
                  border: `1px solid rgba(10, 25, 47, 0.15)`,
                  maxWidth: '100%',
                }}
              >
                <span
                  style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    backgroundColor: SUN_ORANGE,
                    display: 'inline-block',
                    flexShrink: 0,
                  }}
                />
                <span
                  className="small text-uppercase fw-bold"
                  style={{ letterSpacing: '0.8px', fontSize: '12px', color: THEME_BLUE }}
                >
                  Mindoro State University &bull; Student Service Marketplace
                </span>
              </div>

              {/* Big Headline */}
              <h1
                className="fw-extrabold mb-3 text-center hero-headline-animated"
                style={{
                  fontSize: 'clamp(2.2rem, 5.5vw, 4rem)',
                  fontWeight: '800',
                  lineHeight: '1.14',
                  letterSpacing: '-0.5px',
                  color: THEME_BLUE,
                  maxWidth: '850px',
                }}
              >
                Your Skills Deserve
                <br />
                <span className="hero-accent-gleam">
                  To Be Seen.
                </span>
              </h1>

              {/* Sub-headline / Description */}
              <p
                className="lead text-muted mb-4 mx-auto text-center"
                style={{
                  maxWidth: '680px',
                  lineHeight: '1.8',
                  fontSize: 'clamp(1rem, 1.3vw, 1.2rem)',
                }}
              >
                SerbisYou connects student service providers with fellow students and campus clients. Showcase your talents, discover reliable peer services, and book safe on-campus appointments.
              </p>

              {/* Action Buttons: Centered & Responsively Adapting to Any Screen */}
              <div
                className="d-flex flex-column flex-sm-row gap-3 justify-content-center align-items-center mb-5 w-100"
                style={{ maxWidth: '640px' }}
              >
                <Button
                  as={Link}
                  to="/services"
                  className="neu-btn-orange px-4 py-3 fw-bold text-white d-inline-flex align-items-center justify-content-center gap-2 shadow-sm text-nowrap w-100 w-sm-auto"
                  size="lg"
                  style={{
                    borderRadius: 'var(--neu-radius, 14px)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>Explore Services</span>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Button>

                <Button
                  as={Link}
                  to="/sign-up"
                  className="neu-btn-primary px-4 py-3 fw-semibold text-white d-inline-flex align-items-center justify-content-center gap-2 shadow-sm text-nowrap w-100 w-sm-auto"
                  size="lg"
                  style={{
                    backgroundColor: THEME_BLUE,
                    border: 'none',
                    borderRadius: 'var(--neu-radius, 14px)',
                    boxShadow: '0 4px 14px rgba(10, 25, 47, 0.35)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span>Join as Service Provider</span>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </Button>
              </div>

              {/* Marketplace Highlights: Centered 3 Stat Cards */}
              <Row className="g-3 justify-content-center w-100" style={{ maxWidth: '820px' }}>
                <Col xs={12} sm={4}>
                  <div
                    className="neu-hero-stat text-center mx-auto h-100 d-flex flex-column justify-content-center"
                    style={{
                      borderLeft: `4px solid ${THEME_BLUE}`,
                      background: 'var(--neu-bg-light)',
                      borderRadius: '16px',
                      padding: '16px',
                    }}
                  >
                    <div className="fw-bold fs-5" style={{ color: THEME_BLUE }}>₱5.00 Flat</div>
                    <div className="text-muted small">Booking Fee</div>
                  </div>
                </Col>
                <Col xs={12} sm={4}>
                  <div
                    className="neu-hero-stat text-center mx-auto h-100 d-flex flex-column justify-content-center"
                    style={{
                      borderLeft: `4px solid ${SUN_ORANGE}`,
                      background: 'var(--neu-bg-light)',
                      borderRadius: '16px',
                      padding: '16px',
                    }}
                  >
                    <div className="fw-bold fs-5" style={{ color: SUN_ORANGE }}>5% Only</div>
                    <div className="text-muted small">Provider Commission</div>
                  </div>
                </Col>
                <Col xs={12} sm={4}>
                  <div
                    className="neu-hero-stat text-center mx-auto h-100 d-flex flex-column justify-content-center"
                    style={{
                      borderLeft: `4px solid ${THEME_BLUE}`,
                      background: 'var(--neu-bg-light)',
                      borderRadius: '16px',
                      padding: '16px',
                    }}
                  >
                    <div className="fw-bold fs-5" style={{ color: THEME_BLUE }}>MinSU-Verified</div>
                    <div className="text-muted small">Student Providers</div>
                  </div>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 3. Three Focused Service Categories Section */}
      <section
        id="services"
        className="py-5 position-relative w-100"
        style={{ background: 'var(--neu-bg-light)' }}
      >
        <Container className="py-lg-5">
          {/* Section Heading */}
          <div className="text-center mb-5">
            <span
              className="px-3 py-2 rounded-pill fw-semibold text-uppercase mb-2 shadow-sm d-inline-block"
              style={{
                fontSize: '12px',
                letterSpacing: '1.2px',
                backgroundColor: THEME_BLUE,
                color: '#ffffff',
              }}
            >
              Our Core Focus
            </span>
            <h2
              className="fw-bold mt-2 mb-3"
              style={{
                color: THEME_BLUE,
                fontSize: 'clamp(1.9rem, 3.2vw, 2.75rem)',
                letterSpacing: '-0.5px',
              }}
            >
              Three Focused Service Categories
            </h2>
            <p
              className="text-muted mx-auto fs-6"
              style={{ maxWidth: '660px', lineHeight: '1.7' }}
            >
              SerbisYou connects students specialized in three dedicated service fields to provide high-quality, verified peer-to-peer campus solutions.
            </p>
          </div>

          {/* 3 Focused Category Cards */}
          <Row className="g-4 justify-content-center">
            {focusedCategories.map((cat) => (
              <Col key={cat.id} lg={4} md={6} xs={12}>
                <div
                  className="neu-card h-100 p-4 d-flex flex-column rounded-4"
                  style={{
                    backgroundColor: 'var(--neu-bg-light)',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Category Designated Icon */}
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div
                      className="d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm"
                      style={{
                        width: '68px',
                        height: '68px',
                        background: `linear-gradient(135deg, ${SUN_ORANGE} 0%, ${SUN_ORANGE_DARK} 100%)`,
                        boxShadow: '0 8px 20px rgba(255, 120, 40, 0.35)',
                        padding: '12px',
                        borderRadius: '20px',
                      }}
                    >
                      <img
                        src={cat.icon}
                        alt={`${cat.title} Icon`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          filter: 'brightness(0) invert(1) drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
                        }}
                      />
                    </div>
                    <div>
                      <h4 className="fw-bold mb-1" style={{ color: THEME_BLUE }}>
                        {cat.title}
                      </h4>
                      <span className="small text-muted fw-medium">Student Service Hub</span>
                    </div>
                  </div>

                  {/* Skills / Subtypes Pills */}
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {cat.tags.map((tag) => (
                      <span
                        key={tag}
                        className="badge rounded-pill fw-semibold"
                        style={{
                          backgroundColor: '#ffffff',
                          color: THEME_BLUE,
                          fontSize: '12px',
                          padding: '6px 14px',
                          border: `1px solid rgba(10, 25, 47, 0.15)`,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  <p className="text-muted small mb-4 flex-grow-1" style={{ lineHeight: '1.7', fontSize: '14px' }}>
                    {cat.description}
                  </p>

                  {/* Card Action Link */}
                  <div className="pt-3 border-top d-flex justify-content-between align-items-center">
                    <Link
                      to={`/services?category=${encodeURIComponent(cat.queryCategory)}`}
                      className="fw-bold text-decoration-none d-inline-flex align-items-center gap-1"
                      style={{ color: THEME_BLUE, fontSize: '14px' }}
                    >
                      <span>Explore {cat.title}</span>
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </Link>
                    <span className="small text-muted">MinSU Verified</span>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* 4. About SerbisYou Section */}
      <section
        id="about"
        className="py-5 position-relative w-100"
        style={{
          background: 'var(--neu-bg)',
        }}
      >
        <Container className="py-lg-5">
          <Row className="justify-content-center text-center">
            <Col lg={9}>
              <span
                className="px-3 py-2 rounded-pill fw-semibold text-uppercase mb-2 shadow-sm d-inline-block"
                style={{
                  fontSize: '12px',
                  letterSpacing: '1.2px',
                  backgroundColor: '#ffffff',
                  color: THEME_BLUE,
                  border: `1px solid rgba(10, 25, 47, 0.2)`,
                }}
              >
                Campus Mission
              </span>
              <h2
                className="fw-bold mt-2 mb-3"
                style={{
                  color: THEME_BLUE,
                  fontSize: 'clamp(1.9rem, 3.2vw, 2.75rem)',
                  letterSpacing: '-0.5px',
                }}
              >
                About SerbisYou
              </h2>

              <p
                className="text-muted mx-auto fs-6"
                style={{ maxWidth: '750px', lineHeight: '1.85' }}
              >
                SerbisYou is a service marketplace designed to help students
                showcase their abilities and connect with individuals looking
                for reliable services. It provides a platform where skills,
                creativity, and opportunities come together with safety and transparency.
              </p>
            </Col>
          </Row>

          <Row className="g-4 mt-3">
            <Col md={4} xs={12}>
              <div className="neu-card h-100 p-4 text-center rounded-4">
                <div
                  className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center text-white"
                  style={{
                    width: '54px',
                    height: '54px',
                    background: `linear-gradient(135deg, ${THEME_BLUE}, ${THEME_BLUE_LIGHT})`,
                  }}
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h4 className="fw-bold mb-2" style={{ color: THEME_BLUE }}>Discover</h4>
                <p className="text-muted small mb-0">
                  Explore creative, digital, and event support services offered by talented student providers.
                </p>
              </div>
            </Col>

            <Col md={4} xs={12}>
              <div className="neu-card h-100 p-4 text-center rounded-4">
                <div
                  className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center text-white"
                  style={{
                    width: '54px',
                    height: '54px',
                    background: `linear-gradient(135deg, ${SUN_ORANGE}, ${SUN_ORANGE_DARK})`,
                  }}
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="fw-bold mb-2" style={{ color: THEME_BLUE }}>Connect</h4>
                <p className="text-muted small mb-0">
                  Directly chat with peer service providers and collaborate on university projects, functions, and events.
                </p>
              </div>
            </Col>

            <Col md={4} xs={12}>
              <div className="neu-card h-100 p-4 text-center rounded-4">
                <div
                  className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center text-white"
                  style={{
                    width: '54px',
                    height: '54px',
                    background: `linear-gradient(135deg, ${THEME_BLUE}, ${THEME_BLUE_LIGHT})`,
                  }}
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h4 className="fw-bold mb-2" style={{ color: THEME_BLUE }}>Grow</h4>
                <p className="text-muted small mb-0">
                  Build authentic client portfolios, develop your freelancing skills, and unlock real campus opportunities.
                </p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Campus Weather & Active Advertisements Spotlight */}
      <section className="py-4 border-bottom" style={{ background: 'var(--neu-bg)' }}>
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <span className="fw-bold small text-muted text-uppercase tracking-wider">
              📢 Campus Bulletins &amp; Announcements
            </span>
            <WeatherWidget />
          </div>
          <AdBanner />
        </Container>
      </section>

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="py-5 position-relative w-100" style={{ background: 'var(--neu-bg-light)' }}>
        <Container className="py-lg-5">
          <div className="text-center mb-5">
            {/* Step-by-Step Pill */}
            <div
              className="mb-3 d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm"
              style={{
                backgroundColor: THEME_BLUE,
                color: '#ffffff',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: SUN_ORANGE,
                  display: 'inline-block',
                }}
              />
              <span
                className="small text-uppercase fw-bold"
                style={{ letterSpacing: '1px', fontSize: '12px' }}
              >
                Step-by-Step
              </span>
            </div>

            <h2 className="display-6 fw-bold mb-2" style={{ color: THEME_BLUE }}>
              How It Works
            </h2>
            <p className="text-muted col-lg-8 mx-auto">
              Getting started with SerbisYou is simple, safe, and transparent.
            </p>
          </div>

          <Row className="g-4 justify-content-center">
            {/* Step 1 Card */}
            <Col md={4} xs={12}>
              <div className="neu-step-card p-4 h-100 d-flex flex-column rounded-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                    style={{
                      width: '50px',
                      height: '50px',
                      background: `linear-gradient(135deg, ${THEME_BLUE} 0%, ${THEME_BLUE_LIGHT} 100%)`,
                      fontSize: '20px',
                    }}
                  >
                    1
                  </div>
                  <span
                    className="rounded-pill px-3 py-1 fw-bold small text-white shadow-xs"
                    style={{ backgroundColor: SUN_ORANGE, fontSize: '12px' }}
                  >
                    Registration
                  </span>
                </div>

                <h4 className="fw-bold mb-2" style={{ color: THEME_BLUE }}>
                  Create an Account
                </h4>

                <p className="text-muted flex-grow-1">
                  Register as a Student Requestor or Service Provider using your verified MMC Student ID and campus credentials.
                </p>

                <div className="pt-3 border-top d-flex align-items-center gap-2 small fw-semibold" style={{ color: SUN_ORANGE }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z" />
                  </svg>
                  <span>MinSU Verified Credentials</span>
                </div>
              </div>
            </Col>

            {/* Step 2 Card */}
            <Col md={4} xs={12}>
              <div className="neu-step-card p-4 h-100 d-flex flex-column rounded-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                    style={{
                      width: '50px',
                      height: '50px',
                      background: `linear-gradient(135deg, ${THEME_BLUE} 0%, ${THEME_BLUE_LIGHT} 100%)`,
                      fontSize: '20px',
                    }}
                  >
                    2
                  </div>
                  <span
                    className="rounded-pill px-3 py-1 fw-bold small text-white shadow-xs"
                    style={{ backgroundColor: SUN_ORANGE, fontSize: '12px' }}
                  >
                    Catalog &amp; Offer
                  </span>
                </div>

                <h4 className="fw-bold mb-2" style={{ color: THEME_BLUE }}>
                  Explore or Offer Services
                </h4>

                <p className="text-muted flex-grow-1">
                  Browse available services across Creative, Event Support, and Digital Service or showcase your specialized skills.
                </p>

                <div className="pt-3 border-top d-flex align-items-center gap-2 small fw-semibold" style={{ color: SUN_ORANGE }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
                  </svg>
                  <span>Direct In-App Coordination</span>
                </div>
              </div>
            </Col>

            {/* Step 3 Card */}
            <Col md={4} xs={12}>
              <div className="neu-step-card p-4 h-100 d-flex flex-column rounded-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                    style={{
                      width: '50px',
                      height: '50px',
                      background: `linear-gradient(135deg, ${THEME_BLUE} 0%, ${THEME_BLUE_LIGHT} 100%)`,
                      fontSize: '20px',
                    }}
                  >
                    3
                  </div>
                  <span
                    className="rounded-pill px-3 py-1 fw-bold small text-white shadow-xs"
                    style={{ backgroundColor: SUN_ORANGE, fontSize: '12px' }}
                  >
                    Book &amp; Transact
                  </span>
                </div>

                <h4 className="fw-bold mb-2" style={{ color: THEME_BLUE }}>
                  Connect and Get Started
                </h4>

                <p className="text-muted flex-grow-1">
                  Submit service requests, coordinate details safely, complete appointments, and pay seamlessly via QR Code settlements.
                </p>

                <div className="pt-3 border-top d-flex align-items-center gap-2 small fw-semibold" style={{ color: SUN_ORANGE }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2 2h2v2H2V2Z" />
                    <path d="M6 0v6H0V0h6ZM5 1H1v4h4V1ZM4 12H2v2h2v-2Z" />
                    <path d="M6 10v6H0v-6h6Zm-5 1v4h4v-4H1Zm11-9h2v2h-2V2Z" />
                    <path d="M10 0v6h6V0h-6Zm5 1v4h-4V1h4ZM8 1V0h1v2H8v2H7V1h1Zm0 5V4h1v2H8ZM6 8V7h1V6h1v2h1V7h5v1h-4v1H7V8H6Zm0 0v1H2V8H1v1H0V7h3v1h3Zm10 1h-1V7h1v2Zm-1 3v-1h1v1h-1Zm-1-1v-1h1v1h-1Zm-2 2v-1h1v1h-1Zm1-2h1v1h-1v-1Zm-1 0h-1v-1h1v1Zm-2-2v-1h1v1H8Zm1 4h1v1H9v-1Zm-2-1v-1h1v1H7Zm1 1v1H7v-1h1Zm1 1v1H8v-1h1Zm2 2v-1h.01v1H11Zm-1-1H9v1h1v-1Zm2 1v-1h1v1h-1Zm2-2v-1h1v1h-1Zm0 1h1v1h-1v-1Zm-1 1v-1h1v1h-1Zm-1 0v-1h1v1h-1Z" />
                  </svg>
                  <span>₱5 Flat Fee + QR Settle</span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 6. Call to Action Banner */}
      <section
        className="text-white py-5 flex-grow-0 w-100"
        style={{
          background: `linear-gradient(135deg, ${THEME_BLUE_DARK} 0%, ${THEME_BLUE} 100%)`,
          boxShadow: '0 4px 20px rgba(10, 25, 47, 0.4)',
        }}
      >
        <Container className="text-center py-4">
          <h2 className="display-6 fw-bold mb-3">
            Ready to Showcase Your Skills or Book Campus Talent?
          </h2>
          <p className="lead opacity-75 mb-4 col-md-8 mx-auto">
            Join verified Mindoro State University students on SerbisYou today. Discover trusted peer services and launch your creative journey.
          </p>
          <div className="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-3 flex-wrap">
            <Button
              as={Link}
              to="/services"
              className="neu-btn-orange px-4 py-3 fw-bold text-white shadow-sm w-100 w-sm-auto"
              size="lg"
              style={{
                borderRadius: 'var(--neu-radius, 14px)',
                boxShadow: '0 4px 16px rgba(255, 120, 40, 0.35)',
              }}
            >
              Explore Services
            </Button>
            <Button
              as={Link}
              to="/sign-up"
              className="px-4 py-3 fw-bold w-100 w-sm-auto"
              size="lg"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                borderRadius: 'var(--neu-radius, 14px)',
                color: '#ffffff',
                boxShadow: 'none',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                transition: 'all 0.25s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.16)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.55)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.color = '#ffffff';
              }}
            >
              Join as Service Provider
            </Button>
          </div>
        </Container>
      </section>

      {/* 7. Footer */}
      <footer className="neu-footer text-white pt-5 pb-4 mt-auto w-100" style={{ background: `linear-gradient(180deg, ${THEME_BLUE} 0%, #050E1D 100%)` }}>
        <Container>
          <Row className="g-4 mb-4 text-center text-md-start">
            <Col md={5} xs={12}>
              <div className="fw-bold fs-4 text-white d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-2">
                <img
                  src="/logo-transparent.png"
                  alt="SerbisYou"
                  className="logo-white-shadow"
                  style={{ height: '34px', objectFit: 'contain', background: 'transparent' }}
                />
              </div>
              <p className="text-secondary small mb-3">
                SerbisYou connects student service providers with fellow students and campus clients at Mindoro State University. Your Skills. Your Services. Your Opportunity.
              </p>
              <div className="text-secondary small">
                Mindoro State University &bull; Main Campus &bull; Student Services Hub
              </div>
            </Col>

            <Col sm={6} md={3} xs={6}>
              <h6 className="text-white fw-bold text-uppercase small mb-3">Marketplace</h6>
              <ul className="list-unstyled text-secondary small d-flex flex-column gap-2 mb-0">
                <li><Link to="/services" className="text-secondary text-decoration-none">Explore Services</Link></li>
                <li><Link to="/sign-up" className="text-secondary text-decoration-none">Join as Service Provider</Link></li>
                <li><Link to="/sign-in" className="text-secondary text-decoration-none">Sign In to Account</Link></li>
                <li><a href="#about" className="text-secondary text-decoration-none">About SerbisYou</a></li>
              </ul>
            </Col>

            <Col sm={6} md={3} xs={6}>
              <h6 className="text-white fw-bold text-uppercase small mb-3">Core Categories</h6>
              <ul className="list-unstyled text-secondary small d-flex flex-column gap-2 mb-0">
                <li><Link to="/services?category=Creative" className="text-secondary text-decoration-none">Creative (Design &amp; Painting)</Link></li>
                <li><Link to="/services?category=Event%20Support" className="text-secondary text-decoration-none">Event Support (Hosting &amp; Make-up)</Link></li>
                <li><Link to="/services?category=Digital%20Service" className="text-secondary text-decoration-none">Digital Service (Photo &amp; Video)</Link></li>
                <li><Link to="/terms" className="text-secondary text-decoration-none">Terms and Conditions</Link></li>
              </ul>
            </Col>
          </Row>

          <hr className="border-secondary my-4" />

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center text-secondary small text-center text-md-start gap-2">
            <div>
              &copy; {new Date().getFullYear()} SerbisYou. All rights reserved. Mindoro State University.
            </div>
            <div className="d-flex gap-3 mt-2 mt-md-0 flex-wrap justify-content-center">
              <Link to="/terms" className="text-secondary text-decoration-none">Terms and Conditions</Link>
              <span className="text-secondary">&bull;</span>
              <span className="text-secondary">₱5 Booking Fee</span>
              <span className="text-secondary">&bull;</span>
              <span className="text-secondary">5% Provider Commission</span>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
}
