import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  Navbar,
  Nav,
  Container,
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

  useEffect(() => {
    const handleUserChange = () => {
      try {
        const stored = window.localStorage.getItem('user');
        if (stored) setCurrentUser(JSON.parse(stored));
      } catch {
        // ignore
      }
    };
    window.addEventListener('serbisyou_user_changed', handleUserChange);
    return () => window.removeEventListener('serbisyou_user_changed', handleUserChange);
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
  const isAdmin = Boolean(
    (user.department && user.designation) ||
    user.user_type === 'Admin' ||
    user.role === 'admin'
  );

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: 'var(--neu-bg)' }}>
      {/* 1. Top Navbar */}
      <Navbar className="neu-navbar py-2 px-3 flex-shrink-0" style={{ zIndex: 1030 }}>
        <Container fluid className="p-0">
          <div className="d-flex align-items-center">
            {/* The Logo itself is the interactive sidebar toggle button (no hamburger icon) */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => {
                if (isMobile) {
                  setShowMobileSidebar(true);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  if (isMobile) setShowMobileSidebar(true);
                  else setCollapsed(!collapsed);
                }
              }}
              className="d-flex align-items-center gap-2 m-0 text-white"
              style={{ cursor: 'pointer', userSelect: 'none' }}
              title={isMobile ? 'Open navigation menu' : (collapsed ? 'Expand sidebar' : 'Collapse sidebar')}
            >
              {/* Full logo for desktop when expanded, compact hands logo when collapsed */}
              <img
                src={collapsed ? '/logo-hands.png' : '/logo-transparent.png'}
                alt="SerbisYou"
                className="logo-white-shadow d-none d-lg-inline-block"
                style={{
                  height: '32px',
                  width: collapsed ? '32px' : 'auto',
                  maxWidth: '150px',
                  objectFit: 'contain',
                  background: 'transparent',
                  transition: 'transform 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              />
              {/* Compact hands logo when on mobile view */}
              <img
                src="/logo-hands.png"
                alt="SerbisYou"
                className="logo-white-shadow d-inline-block d-lg-none"
                style={{ height: '30px', width: '30px', objectFit: 'contain', background: 'transparent' }}
              />
              {/* Strictly Role Badge: Provider or Student (No Marketplace) */}
              <Badge
                className="ms-1 small fw-bold px-2 py-1 rounded-pill d-none d-sm-inline-block shadow-sm"
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
          </div>

          {/* Right-side Navbar Actions */}
          <Nav className="ms-auto d-flex flex-row align-items-center gap-2">
            <NotificationsDropdown currentUser={user} />
            {/* Quick Messages Link */}
            <Nav.Link as={Link} to="/messages" className="neu-nav-icon text-white position-relative p-2" aria-label="Messages">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
              </svg>
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
                  {user.profile_picture || user.profile_image ? (
                    <img
                      src={user.profile_picture || user.profile_image}
                      alt={displayName}
                      className="rounded-circle border border-white border-opacity-50"
                      style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                    />
                  ) : (
                    <span className="neu-avatar">
                      {initial}
                    </span>
                  )}
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
              {isProvider ? (
                <NavDropdown.Item as={Link} to="/services">
                  My Offered Services
                </NavDropdown.Item>
              ) : (
                <NavDropdown.Item as={Link} to="/services">
                  Browse Services
                </NavDropdown.Item>
              )}
              <NavDropdown.Item as={Link} to="/transactions">
                {isProvider ? 'Client Bookings' : 'Availed Bookings'}
              </NavDropdown.Item>
              {isAdmin && (
                <NavDropdown.Item as={Link} to="/admin" className="fw-semibold text-primary">
                  🛡️ Admin Console
                </NavDropdown.Item>
              )}
              <NavDropdown.Divider />
              <NavDropdown.Item as="button" type="button" className="text-danger" onClick={handleSignOut}>
                Sign Out
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Container>
      </Navbar>

      {/* 2. Responsive Collapsible Layout Body (Sidebar + Dynamic Main Area) */}
      <div className="d-flex flex-grow-1 position-relative" style={{ minHeight: 'calc(100vh - 56px)' }}>
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
