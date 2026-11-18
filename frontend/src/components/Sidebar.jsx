import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Offcanvas,
  Nav,
  Badge,
  Card,
  Button,
} from 'react-bootstrap';

export default function Sidebar({
  show = false,
  onHide = () => {},
  collapsed = false,
  setCollapsed = () => {},
  currentUser,
}) {
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
  const initials = `${(user.first_name || 'U')[0] || ''}${(user.last_name || '')[0] || ''}`.toUpperCase();
  const locationString = [user.barangay, user.city].filter(Boolean).join(', ') || 'Philippines';

  // Role-specific navigation links grounded in ITE11_Finalproject
  const navItems = isProvider
    ? [
        {
          to: '/dashboard',
          label: 'Analytics & Overview',
          badge: 'Stats',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0">
              <path d="M1 4a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4zm4 0v4h2V4H5zm4-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H9zm4 1v8h-2V4h2zM1 11a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-4zm4 0v4h2v-4H5z" />
            </svg>
          ),
        },
        {
          to: '/services',
          label: 'My Services',
          badge: 'Manage',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0">
              <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.492-3.287.813V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.321-2.107-.692-3.287-.813-1.094-.11-2.278-.037-3.213.493V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z" />
            </svg>
          ),
        },
        {
          to: '/transactions',
          label: 'Client Bookings',
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
          badge: '3',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0">
              <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
            </svg>
          ),
        },
        {
          to: '/settings',
          label: 'Settings & Profile',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
      ]
    : [
        {
          to: '/dashboard',
          label: 'Campus Overview',
          badge: 'Student',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0">
              <path d="M1 4a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4zm4 0v4h2V4H5zm4-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H9zm4 1v8h-2V4h2zM1 11a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-4zm4 0v4h2v-4H5z" />
            </svg>
          ),
        },
        {
          to: '/services',
          label: 'Browse Services',
          badge: 'Catalog',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0">
              <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.492-3.287.813V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.321-2.107-.692-3.287-.813-1.094-.11-2.278-.037-3.213.493V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z" />
            </svg>
          ),
        },
        {
          to: '/transactions',
          label: 'Availed Bookings',
          badge: 'Bookings',
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
          badge: '3',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0">
              <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
            </svg>
          ),
        },
        {
          to: '/settings',
          label: 'Settings & Profile',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
      ];

  // Helper renderer for Nav Links
  const renderNavLinks = (isCollapsedMode = false) => (
    <Nav className="flex-column gap-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/dashboard'}
          onClick={() => onHide && onHide()}
          className={({ isActive }) =>
            isActive ? 'neu-nav-link active' : 'neu-nav-link'
          }
          title={isCollapsedMode ? item.label : undefined}
        >
          {({ isActive }) => (
            <>
              <div className="d-flex align-items-center gap-2">
                {item.icon}
                {!isCollapsedMode && <span>{item.label}</span>}
              </div>
              {!isCollapsedMode && item.badge && (
                <Badge
                  bg={isActive ? 'light' : 'secondary'}
                  text={isActive ? 'primary' : 'white'}
                  className="rounded-pill small"
                >
                  {item.badge}
                </Badge>
              )}
            </>
          )}
        </NavLink>
      ))}
    </Nav>
  );

  return (
    <>
      {/* ─── DESKTOP COLLAPSIBLE SIDEBAR (>= lg) ─── */}
      <aside
        className={`d-none d-lg-flex neu-sidebar-desktop ${
          collapsed ? 'collapsed' : 'expanded'
        }`}
      >
        {/* Desktop Header / Collapse Control */}
        <div
          className={`d-flex align-items-center mb-3 pb-2 border-bottom ${
            collapsed ? 'justify-content-center' : 'justify-content-between px-1'
          }`}
          style={{ borderColor: 'rgba(154, 172, 196, 0.35)' }}
        >
          {!collapsed ? (
            <>
              <div className="d-flex align-items-center gap-2 overflow-hidden">
                <Badge
                  style={{
                    backgroundColor: isProvider ? 'var(--neu-accent, #ff7828)' : '#0066FF',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                  }}
                  className="rounded-pill px-2 py-1"
                >
                  {isProvider ? 'Provider' : 'Student'}
                </Badge>
                <span className="small fw-bold text-muted text-uppercase" style={{ letterSpacing: '1px' }}>
                  Menu
                </span>
              </div>
              <Button
                variant="link"
                className="p-1 text-muted text-decoration-none neu-hover-scale"
                onClick={() => setCollapsed(true)}
                title="Collapse sidebar"
                style={{ fontSize: '1.25rem', lineHeight: 1 }}
              >
                ☰
              </Button>
            </>
          ) : (
            <div
              onClick={() => setCollapsed(false)}
              className="d-flex align-items-center justify-content-center"
              style={{ cursor: 'pointer', padding: '4px', transition: 'transform 0.15s ease' }}
              title="Click to expand sidebar"
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <img
                src="/logo-hands.png"
                alt="SerbisYou"
                className="logo-white-shadow"
                style={{ width: '32px', height: '32px', objectFit: 'contain' }}
              />
            </div>
          )}
        </div>

        {/* User Profile Card */}
        <div className="mb-3">
          <Card className="neu-profile-card">
            <div className={`d-flex align-items-center gap-2 ${collapsed ? 'justify-content-center' : 'mb-2'}`}>
              <div
                className="neu-avatar-sidebar flex-shrink-0"
                title={collapsed ? `${displayName} (${isProvider ? 'Provider' : 'Student'})` : undefined}
              >
                {initials}
              </div>
              {!collapsed && (
                <div className="overflow-hidden neu-profile-details">
                  <div className="fw-bold text-truncate" style={{ color: 'var(--neu-text)' }}>
                    {displayName}
                  </div>
                  <div className="text-muted small font-monospace">
                    ID: {user.user_id || '---'}
                  </div>
                </div>
              )}
            </div>
            {!collapsed && (
              <div className="d-flex align-items-center justify-content-between pt-2 border-top neu-profile-details">
                <Badge
                  style={{
                    backgroundColor: isProvider ? 'var(--neu-accent, #ff7828)' : '#0066FF',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                  }}
                  className="rounded-pill"
                >
                  {isProvider ? 'Provider' : 'Student'}
                </Badge>
                <span className="text-muted small text-truncate" style={{ maxWidth: '120px' }}>
                  {locationString}
                </span>
              </div>
            )}
          </Card>
        </div>

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
                <div className="neu-avatar-sidebar flex-shrink-0">
                  {initials}
                </div>
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
