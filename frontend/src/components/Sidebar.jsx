import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Card,
  Badge,
  Nav,
  Offcanvas,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap';

export default function Sidebar({
  show = false,
  onHide = () => {},
  collapsed = false,
  setCollapsed = () => {},
  currentUser,
}) {
  const [internalUser, setInternalUser] = useState(() => {
    try {
      const stored = window.localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (currentUser) {
      setInternalUser(currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    const handleUserChange = () => {
      try {
        const stored = window.localStorage.getItem('user');
        if (stored) setInternalUser(JSON.parse(stored));
      } catch {
        // ignore
      }
    };
    window.addEventListener('serbisyou_user_changed', handleUserChange);
    return () => window.removeEventListener('serbisyou_user_changed', handleUserChange);
  }, []);

  const user = internalUser || currentUser || {
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
  const initials = `${(user.first_name || 'U')[0] || ''}${(user.last_name || '')[0] || ''}`.toUpperCase();
  const locationString = [user.barangay, user.city].filter(Boolean).join(', ') || 'Philippines';
  const avatarUrl = user.profile_picture || user.profile_image || user.avatar || null;

  const isAdmin = Boolean(
    (user.department && user.designation) ||
    user.user_type === 'Admin' ||
    user.role === 'admin'
  );

  // Role-Aware Navigation Links
  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0">
          <path d="M1 4a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4zm4 0v4h2V4H5zm4-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H9zm4 1v8h-2V4h2zM1 11a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-4zm4 0v4h2v-4H5z" />
        </svg>
      ),
    },
    {
      to: '/services',
      label: isProvider ? 'My Services' : 'Browse Services',
      badge: isProvider ? 'Offerings' : 'Explore',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0">
          <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.492-3.287.813V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.321-2.107-.692-3.287-.813-1.094-.11-2.278-.037-3.213.493V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z" />
        </svg>
      ),
    },
    {
      to: '/transactions',
      label: isProvider ? 'Client Bookings' : 'Availed Bookings',
      badge: '5% Fee',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0">
          <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v1h14V4a1 1 0 0 0-1-1H2zm13 4H1v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7z" />
          <path d="M2 10a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-1z" />
        </svg>
      ),
    },
    {
      to: '/messages',
      label: 'Messages',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0">
          <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
          <path d="M3 3.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 6a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 6zm0 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
        </svg>
      ),
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0">
          <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/>
        </svg>
      ),
    },
  ];

  if (isAdmin) {
    navItems.push({
      to: '/admin',
      label: 'Admin Console',
      badge: 'Admin',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0 text-primary">
          <path d="M5.072 1.199a8 8 0 0 1 5.856 0l5 2A1 1 0 0 1 16.5 4.12v4.88c0 4.15-2.85 7.4-6.32 8.92a1 1 0 0 1-.36.08 1 1 0 0 1-.36-.08C5.99 16.4 3.14 13.15 3.14 9V4.12a1 1 0 0 1 .57-.92l5-2z"/>
        </svg>
      ),
    });
  }

  const renderNavLinks = (isCollapsed) => (
    <Nav className="flex-column gap-1">
      {navItems.map((item) => {
        const linkContent = (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => onHide()}
            className={({ isActive }) =>
              `neu-nav-item d-flex align-items-center ${
                isCollapsed ? 'justify-content-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'
              } rounded-3 text-decoration-none ${
                isActive ? 'active' : ''
              }`
            }
          >
            {item.icon}
            {!isCollapsed && (
              <>
                <span className="fw-medium text-truncate" style={{ fontSize: '0.92rem' }}>
                  {item.label}
                </span>
                {item.badge && (
                  <Badge
                    bg="secondary"
                    className="ms-auto small rounded-pill fw-normal opacity-75"
                    style={{ fontSize: '0.68rem' }}
                  >
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </NavLink>
        );

        if (isCollapsed) {
          return (
            <OverlayTrigger
              key={item.to}
              placement="right"
              overlay={<Tooltip id={`tooltip-${item.to}`}>{item.label}</Tooltip>}
            >
              <div>{linkContent}</div>
            </OverlayTrigger>
          );
        }

        return <div key={item.to}>{linkContent}</div>;
      })}
    </Nav>
  );

  return (
    <>
      {/* ─── DESKTOP SIDEBAR (>= lg) ─── */}
      <aside
        className={`neu-sidebar d-none d-lg-flex flex-column justify-content-between p-3 ${
          collapsed ? 'collapsed' : ''
        }`}
        style={{
          width: collapsed ? '76px' : '260px',
          minWidth: collapsed ? '76px' : '260px',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'fixed',
          top: '56px',
          bottom: 0,
          left: 0,
          zIndex: 1020,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* User Profile Card (Compact in collapsed mode) */}
        {!collapsed ? (
          <Card className="neu-profile-card mb-3 p-3">
            <div className="d-flex align-items-center gap-2 mb-2">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="rounded-circle border border-2 border-primary flex-shrink-0"
                  style={{ width: '42px', height: '42px', objectFit: 'cover' }}
                />
              ) : (
                <div className="neu-avatar-sidebar flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="overflow-hidden">
                <div className="fw-bold text-truncate" style={{ color: 'var(--neu-text)', fontSize: '0.92rem' }}>
                  {displayName}
                </div>
                <div className="text-muted small font-monospace text-truncate" style={{ fontSize: '0.74rem' }}>
                  ID: {user.user_id || '---'}
                </div>
              </div>
            </div>
            <div className="d-flex align-items-center justify-content-between pt-2 border-top" style={{ borderColor: 'rgba(154, 172, 196, 0.35)' }}>
              <Badge
                style={{
                  backgroundColor: isProvider ? 'var(--neu-accent, #ff7828)' : '#0066FF',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                }}
                className="rounded-pill px-2 py-1"
              >
                {isProvider ? 'Provider' : 'Student'}
              </Badge>
              <span className="text-muted small text-truncate" style={{ fontSize: '0.72rem', maxWidth: '110px' }}>
                {locationString}
              </span>
            </div>
          </Card>
        ) : (
          <div className="d-flex justify-content-center mb-3">
            <OverlayTrigger
              placement="right"
              overlay={<Tooltip id="tooltip-user-collapsed">{displayName} ({isProvider ? 'Provider' : 'Student'})</Tooltip>}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="rounded-circle border border-2 border-primary"
                  style={{ width: '38px', height: '38px', objectFit: 'cover', cursor: 'pointer' }}
                />
              ) : (
                <div className="neu-avatar-sidebar" style={{ width: '38px', height: '38px', cursor: 'pointer' }}>
                  {initials}
                </div>
              )}
            </OverlayTrigger>
          </div>
        )}

        {/* Navigation Links */}
        <div className="flex-grow-1">
          {!collapsed && (
            <div className="neu-nav-label text-uppercase fw-bold small px-2 mb-2">
              Navigation Menu
            </div>
          )}
          {renderNavLinks(collapsed)}
        </div>

        {/* Desktop Footer (Hidden in collapsed mode) */}
        {!collapsed && (
          <div className="pt-3 border-top mt-auto neu-sidebar-footer-box" style={{ borderColor: 'rgba(154, 172, 196, 0.35)' }}>
            <Card className="neu-fee-box text-center mb-2">
              <small className="text-muted d-block">Booking Fee</small>
              <strong className="fs-6" style={{ color: '#063a8f' }}>₱5.00 Flat Rate</strong>
              <small className="text-muted d-block mt-1">Commission: 5% of amount</small>
            </Card>
            <div className="text-center text-muted small" style={{ fontSize: '0.72rem' }}>
              SerbisYou Campus Services &copy; {new Date().getFullYear()}
            </div>
          </div>
        )}
      </aside>

      {/* ─── MOBILE OFFCANVAS DRAWER (< lg) ─── */}
      <Offcanvas
        show={show}
        onHide={onHide}
        responsive="lg"
        className="neu-sidebar d-lg-none"
      >
        <Offcanvas.Header closeButton className="neu-sidebar-header px-3 py-3">
          <Offcanvas.Title className="fw-bold d-flex align-items-center gap-2">
            <img
              src="/logo-hands.png"
              alt="SerbisYou"
              className="logo-white-shadow"
              style={{ height: '30px', width: '30px', objectFit: 'contain' }}
            />
            <span style={{ color: 'var(--neu-text)', fontSize: '1rem' }}>SerbisYou Navigation</span>
            <Badge
              style={{
                backgroundColor: isProvider ? 'var(--neu-accent, #ff7828)' : '#0066FF',
                color: '#ffffff',
                fontSize: '0.65rem',
              }}
              className="rounded-pill"
            >
              {isProvider ? 'Provider' : 'Student'}
            </Badge>
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body className="d-flex flex-column justify-content-between p-3">
          <div>
            <Card className="neu-profile-card mb-4">
              <div className="d-flex align-items-center gap-2 mb-2">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="rounded-circle border border-2 border-primary flex-shrink-0"
                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="neu-avatar-sidebar flex-shrink-0">
                    {initials}
                  </div>
                )}
                <div className="overflow-hidden">
                  <div className="fw-bold text-truncate" style={{ color: 'var(--neu-text)' }}>
                    {displayName}
                  </div>
                  <div className="text-muted small font-monospace">
                    ID: {user.user_id || '---'}
                  </div>
                </div>
              </div>
              <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                <Badge
                  style={{
                    backgroundColor: isProvider ? 'var(--neu-accent, #ff7828)' : '#0066FF',
                    color: '#ffffff',
                  }}
                  className="rounded-pill"
                >
                  {isProvider ? 'Provider' : 'Student'}
                </Badge>
                <span className="text-muted small text-truncate">
                  {locationString}
                </span>
              </div>
            </Card>

            <div className="neu-nav-label text-uppercase fw-bold small px-2 mb-2">
              Navigation Menu
            </div>
            {renderNavLinks(false)}
          </div>

          <div className="pt-4 border-top">
            <Card className="neu-fee-box text-center mb-2">
              <small className="text-muted d-block">Booking Fee</small>
              <strong className="fs-6" style={{ color: '#063a8f' }}>₱5.00 Flat Rate</strong>
              <small className="text-muted d-block mt-1">Commission: 5% of amount</small>
            </Card>
            <div className="text-center text-muted small" style={{ fontSize: '0.75rem' }}>
              SerbisYou Campus Services &copy; {new Date().getFullYear()}
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}
