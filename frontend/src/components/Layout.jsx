import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  Navbar,
  Nav,
  Container,
  Button,
  Badge,
  NavDropdown,
} from 'react-bootstrap';
import Sidebar from './Sidebar';
import OfflineToast from './OfflineToast';
import NotificationsDropdown from './NotificationsDropdown';
import api from '../api/axios';

export default function Layout() {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 992 : false);
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = window.localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 992;
      setIsMobile(mobile);
      if (!mobile) setShowMobileSidebar(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let isMounted = true;
    api.get('/profile/me')
      .then(({ data }) => {
        if (isMounted && data.user) {
          setCurrentUser(data.user);
          window.localStorage.setItem('user', JSON.stringify(data.user));
          window.localStorage.setItem('user_id', data.user.user_id);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSignOut = () => {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user_id');
    window.localStorage.removeItem('user');
    window.localStorage.removeItem('serbisyou_remember_me');
    navigate('/sign-in', { replace: true });
  };

  const user = currentUser || {
    user_id: 'MMC-1042',
    first_name: 'Juan',
    last_name: 'Dela Cruz',
    username: 'juandelacruz',
    email: 'juan.delacruz@serbisyou.ph',
    contact_number: '+63 912 345 6789',
    user_type: 'Requestor',
    region: 'NCR',
    province: 'Metro Manila',
    city: 'Quezon City',
    barangay: 'Brgy. Central',
  };

  const isProvider = String(user.user_type || '').toLowerCase() === 'provider';
  const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.user_id || 'User';
  const initial = (user.first_name || displayName || 'U')[0]?.toUpperCase();

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: 'var(--neu-bg)' }}>
      {/* 1. Top Navbar: Permanently sticky/fixed at top */}
      <Navbar className="neu-navbar fixed-top py-2 px-3" style={{ height: '56px', zIndex: 1040 }}>
        <Container fluid className="p-0 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            {/* Dedicated Hamburger Button toggles sidebar on mobile & desktop */}
            <button
              type="button"
              className="btn btn-link text-white p-1 me-2 d-inline-flex align-items-center justify-content-center rounded-2 border-0 shadow-none"
              style={{
                width: '38px',
                height: '38px',
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onClick={() => {
                if (isMobile) {
                  setShowMobileSidebar(true);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
              aria-label="Toggle navigation menu"
              title={isMobile ? 'Open navigation menu' : (collapsed ? 'Expand sidebar' : 'Collapse sidebar')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
              </svg>
            </button>

            {/* Brand Logo: Clean link to /dashboard (does NOT act as hamburger toggle) */}
            <Link
              to="/dashboard"
              className="d-flex align-items-center gap-2 text-decoration-none me-2"
              title="SerbisYou Home"
            >
              <img
                src="/logo-transparent.png"
                alt="SerbisYou"
                className="logo-white-shadow d-none d-sm-inline-block"
                style={{
                  height: '32px',
                  width: 'auto',
                  maxWidth: '140px',
                  objectFit: 'contain',
                  background: 'transparent',
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/logo-hands.png';
                }}
              />
              <img
                src="/logo-hands.png"
                alt="SerbisYou"
                className="logo-white-shadow d-inline-block d-sm-none"
                style={{ height: '30px', width: '30px', objectFit: 'contain', background: 'transparent' }}
              />
            </Link>

            {/* Strictly Role Badge: Provider or Student */}
            <Badge
              className="ms-1 small fw-bold px-2.5 py-1 rounded-pill d-none d-sm-inline-block shadow-sm"
              style={{
                backgroundColor: isProvider ? 'var(--neu-accent, #ff7828)' : '#0066FF',
                color: '#ffffff',
                fontSize: '0.72rem',
                letterSpacing: '0.3px',
              }}
            >
              {isProvider ? 'Provider' : 'Student'}
            </Badge>
          </div>

          {/* Right-side Navbar Actions */}
          <Nav className="ms-auto d-flex flex-row align-items-center gap-2">
            <NotificationsDropdown currentUser={user} />
            {/* Quick Messages Link */}
            <Nav.Link as={Link} to="/messages" className="neu-nav-icon text-white position-relative p-2" aria-label="Messages">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
              </svg>
              <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle small">
                3
              </Badge>
            </Nav.Link>

            {/* User Dropdown without redundant role badge */}
            <NavDropdown
              align="end"
              id="user-nav-dropdown"
              className="neu-dropdown"
              title={
                <span className="text-white d-inline-flex align-items-center gap-2">
                  <span className="d-none d-md-inline small fw-semibold">
                    {displayName}
                  </span>
                  <span className="neu-avatar">
                    {initial}
                  </span>
                </span>
              }
            >
              <div className="px-3 py-2 border-bottom" style={{ borderColor: 'rgba(154, 172, 196, 0.3)' }}>
                <div className="fw-bold" style={{ color: 'var(--neu-text)' }}>
                  {displayName}
                </div>
                <div className="text-muted small font-monospace">
                  {user.user_id}
                </div>
                <div className="text-muted small text-truncate">
                  {user.email}
                </div>
              </div>
              <NavDropdown.Item as={Link} to="/settings">
                Account Settings &amp; Profile
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/services">
                {isProvider ? 'My Offered Services' : 'Browse Services'}
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/transactions">
                {isProvider ? 'Client Bookings' : 'Availed Bookings'}
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item as="button" type="button" className="text-danger" onClick={handleSignOut}>
                Sign Out
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Container>
      </Navbar>

      {/* 2. Responsive Collapsible Layout Body (Sidebar + Dynamic Main Area) */}
      <div className="d-flex flex-grow-1 position-relative" style={{ minHeight: 'calc(100vh - 56px)', paddingTop: '56px' }}>
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          show={showMobileSidebar}
          onHide={() => setShowMobileSidebar(false)}
          currentUser={user}
        />

        {/* 3. Main Content Area Rendering Child Routes with <Outlet /> */}
        <main
          className="neu-main flex-grow-1 p-3 p-md-4 overflow-auto"
          style={{
            marginLeft: isMobile ? 0 : (collapsed ? '76px' : '260px'),
            transition: 'margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            minWidth: 0,
            width: isMobile ? '100%' : (collapsed ? 'calc(100% - 76px)' : 'calc(100% - 260px)'),
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* PWA Offline & Update Toast Notification */}
      <OfflineToast />
    </div>
  );
}
