import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Offcanvas,
  Nav,
  Badge,
  Card,
} from 'react-bootstrap';

export default function Sidebar({
  show = false,
  onHide = () => {},
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
    user_type: 'Provider',
    region: 'NCR',
    province: 'Metro Manila',
    city: 'Quezon City',
    barangay: 'Brgy. Central',
  };

  const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || user.user_id || 'User';
  const initials = `${(user.first_name || 'U')[0] || ''}${(user.last_name || '')[0] || ''}`.toUpperCase();
  const locationString = [user.barangay, user.city].filter(Boolean).join(', ') || 'Philippines';
  const avatarUrl = user.profile_picture || user.profile_image || user.avatar || null;

  const isAdmin = Boolean(
    (user.department && user.designation) ||
    user.user_type === 'Admin' ||
    user.role === 'admin'
  );

  // Navigation links for Dashboard, Services, Transactions, Messages, Profile
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
      label: 'Services',
      badge: 'Catalog',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0">
          <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.492-3.287.813V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.321-2.107-.692-3.287-.813-1.094-.11-2.278-.037-3.213.493V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z" />
        </svg>
      ),
    },
    {
      to: '/transactions',
      label: 'Transactions',
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
      to: '/profile',
      label: 'Profile',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0">
          <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
          <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" />
        </svg>
      ),
    },
    ...(isAdmin
      ? [
          {
            to: '/admin',
            label: 'Admin Statistics',
            badge: 'Stats',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0">
                <path d="M0 0h1v15h15v1H0V0Zm14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h2Zm-3 4a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-5a.5.5 0 0 1 .5-.5h2Zm-3 2a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5h2ZM3 12a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>
              </svg>
            ),
          },
        ]
      : []),
  ];

  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      responsive="lg"
      className="neu-sidebar"
    >
      {/* Mobile Offcanvas Header (auto-hidden on lg and wider) */}
      <Offcanvas.Header closeButton className="d-lg-none neu-sidebar-header px-3 py-3">
        <Offcanvas.Title className="fw-bold text-primary d-flex align-items-center gap-2">
          <img src="/logo-hands.png" alt="SerbisYou" className="logo-white-shadow" style={{ height: '30px', width: '30px', objectFit: 'contain' }} />
          <span>SerbisYou Navigation</span>
        </Offcanvas.Title>
      </Offcanvas.Header>

      {/* Sidebar Content Body */}
      <Offcanvas.Body className="d-flex flex-column justify-content-between p-3">
        <div>
          {/* User Profile Card grounded in users table */}
          <div
            className="neu-card p-3 mb-3 rounded-4 shadow-sm"
            style={{
              background: 'var(--neu-bg)',
              border: '1px solid rgba(154, 172, 196, 0.25)',
            }}
          >
            <div className="d-flex align-items-center gap-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="rounded-circle flex-shrink-0 border border-2 border-primary border-opacity-25"
                  style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="neu-avatar-sidebar flex-shrink-0 d-flex align-items-center justify-content-center text-white fw-bold rounded-circle shadow-sm"
                  style={{ width: '48px', height: '48px', fontSize: '1.05rem' }}
                >
                  {initials}
                </div>
              )}
              <div className="overflow-hidden flex-grow-1" style={{ minWidth: 0 }}>
                <div
                  className="fw-bold text-truncate mb-0"
                  style={{
                    color: 'var(--neu-text)',
                    fontSize: '0.96rem',
                    lineHeight: 1.25,
                    whiteSpace: 'nowrap',
                  }}
                  title={displayName}
                >
                  {displayName}
                </div>
                <div className="mt-1">
                  <span
                    className="badge rounded-pill bg-white text-dark border px-2 py-0.5 font-monospace shadow-xs"
                    style={{ fontSize: '0.72rem', letterSpacing: '0.4px' }}
                  >
                    {user.user_id || 'MMC-XXXX'}
                  </span>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between pt-2.5 mt-2.5 border-top border-light-subtle">
              <Badge
                bg={user.user_type === 'Provider' ? 'success' : 'primary'}
                className="rounded-pill px-2.5 py-1 text-white fw-semibold"
                style={{ fontSize: '0.72rem' }}
              >
                {user.user_type || 'User'}
              </Badge>
              <span
                className="text-muted small text-truncate d-flex align-items-center gap-1"
                style={{ fontSize: '0.75rem', maxWidth: '140px' }}
                title={locationString}
              >
                <span style={{ fontSize: '0.8rem' }}>📍</span>
                {locationString}
              </span>
            </div>
          </div>

          {/* Navigation Links Section */}
          <div className="neu-nav-label text-uppercase fw-bold small px-2 mb-2">
            Navigation Menu
          </div>
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
              >
                {({ isActive }) => (
                  <>
                    <div className="d-flex align-items-center gap-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
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
        </div>

        {/* Sidebar Footer grounded in transactions table rules */}
        <div className="pt-4 border-top">
          <Card className="neu-fee-box text-center mb-2">
            <small className="text-muted d-block">Booking Fee</small>
            <strong className="fs-6" style={{ color: '#063a8f' }}>₱5.00 Flat Rate</strong>
            <small className="text-muted d-block mt-1">Commission: 5% of amount</small>
          </Card>
          <div className="text-center text-muted small">
            SerbisYou Marketplace &copy; {new Date().getFullYear()}
          </div>
        </div>
      </Offcanvas.Body>
    </Offcanvas>
  );
}
