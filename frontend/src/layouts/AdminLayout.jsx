import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Navbar, Nav, Button, Offcanvas, Badge } from 'react-bootstrap';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (e) {
      // Non-blocking
    }
  }, []);

  const handleSignOut = () => {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user_id');
    window.localStorage.removeItem('user');
    navigate('/sign-in', { replace: true });
  };

  const navItems = [
    {
      to: '/admin/dashboard',
      label: 'Analytics & KPIs',
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
    {
      to: '/admin/users',
      label: 'Student Reports & Validation',
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      to: '/admin/settings',
      label: 'Admin Settings',
      icon: (
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  const renderNavLinks = () => (
    <Nav className="flex-column gap-2 mt-3">
      {navItems.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setShowMobileSidebar(false)}
            className={`d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none fw-semibold transition-all ${
              isActive
                ? 'neu-btn-primary text-white shadow-sm'
                : 'text-dark hover-opacity'
            }`}
            style={{
              background: isActive
                ? 'linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-dark) 100%)'
                : 'transparent',
              color: isActive ? '#ffffff' : 'var(--neu-text)',
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </Nav>
  );

  return (
    <div className="d-flex flex-column" style={{ background: 'var(--neu-bg)', height: '100vh', maxHeight: '100vh', overflow: 'hidden' }}>
      {/* 1. Top Navbar */}
      <Navbar className="neu-navbar py-2 px-3 shadow-sm flex-shrink-0" style={{ zIndex: 1030 }}>
        <Container fluid className="p-0">
          <div className="d-flex align-items-center">
            {/* Hamburger button for Mobile (< lg) */}
            <Button
              variant="link"
              className="text-white p-0 me-3 d-lg-none neu-hamburger"
              onClick={() => setShowMobileSidebar(true)}
              aria-label="Open Navigation Sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z" />
              </svg>
            </Button>

            {/* Brand Logo & Name */}
            <Navbar.Brand as={Link} to="/admin/dashboard" className="fw-bold d-flex align-items-center gap-2 m-0 text-white">
              {/* Full text logo for desktop view */}
              <img
                src="/logo-transparent.png"
                alt="SerbisYou"
                className="logo-white-shadow d-none d-lg-inline-block"
                style={{ height: '32px', objectFit: 'contain', background: 'transparent' }}
              />
              {/* Compact hands logo when hamburger is collapsed / mobile view */}
              <img
                src="/logo-hands.png"
                alt="SerbisYou"
                className="logo-white-shadow d-inline-block d-lg-none"
                style={{ height: '30px', width: '30px', objectFit: 'contain', background: 'transparent' }}
              />
            </Navbar.Brand>
          </div>

          {/* Right-side Navbar Actions */}
          <div className="d-flex align-items-center gap-2">
            <span className="text-white small fw-semibold d-none d-md-inline-block">
              {currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}` : 'Administrator'}
            </span>
            <Button
              onClick={handleSignOut}
              className="neu-btn-orange btn-sm rounded-pill px-3 py-1 fw-bold text-white shadow-sm"
              style={{ fontSize: '0.8rem' }}
            >
              Sign Out
            </Button>
          </div>
        </Container>
      </Navbar>

      {/* 2. Main Body with Fixed/Static Sidebar on lg+ and Content Area */}
      <div className="d-flex flex-grow-1 overflow-hidden position-relative" style={{ minHeight: 0 }}>
        {/* Desktop Sidebar (visible on lg+) */}
        <aside
          className="d-none d-lg-flex flex-column justify-content-between p-3 neu-sidebar"
          style={{
            width: '260px',
            flexShrink: 0,
            height: '100%',
            overflowY: 'auto',
            background: 'var(--neu-bg)',
            borderRight: '1px solid rgba(154, 172, 196, 0.4)',
          }}
        >
          <div>
            <div className="px-2 pt-2 pb-1 text-uppercase small fw-bold text-muted" style={{ letterSpacing: '0.5px' }}>
              Administration
            </div>
            {renderNavLinks()}
          </div>

          {/* Sidebar Footer info */}
          <div className="pt-3 border-top" style={{ borderColor: 'rgba(154, 172, 196, 0.3)' }}>
            <div className="neu-card p-3 rounded-3 text-center mb-2" style={{ boxShadow: 'var(--neu-shadow-sm)' }}>
              <div className="small fw-bold text-dark">Platform Controls</div>
              <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
                5% Commission &bull; ₱5 Fee
              </div>
            </div>
            <div className="text-center small text-muted" style={{ fontSize: '0.7rem' }}>
              SerbisYou Admin &copy; {new Date().getFullYear()}
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar (Offcanvas for < lg) */}
        <Offcanvas
          show={showMobileSidebar}
          onHide={() => setShowMobileSidebar(false)}
          className="neu-sidebar d-lg-none"
          style={{ background: 'var(--neu-bg)', width: '280px' }}
        >
          <Offcanvas.Header closeButton className="border-bottom" style={{ borderColor: 'rgba(154, 172, 196, 0.4)' }}>
            <Offcanvas.Title className="fw-bold d-flex align-items-center gap-2">
              <img src="/logo-hands.png" alt="SerbisYou" className="logo-white-shadow" style={{ height: '28px', width: '28px', objectFit: 'contain' }} />
              <span className="small text-muted">Admin Menu</span>
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="d-flex flex-column justify-content-between p-3">
            <div>
              {renderNavLinks()}
            </div>
            <div className="pt-3 border-top">
              <Button
                onClick={handleSignOut}
                className="neu-btn-orange w-100 rounded-pill py-2 fw-bold text-white shadow-sm"
              >
                Sign Out
              </Button>
            </div>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Content Area */}
        <main className="flex-grow-1 p-3 p-md-4 overflow-auto h-100" style={{ minWidth: 0 }}>
          <Container fluid className="p-0">
            <Outlet />
          </Container>
        </main>
      </div>
    </div>
  );
}
