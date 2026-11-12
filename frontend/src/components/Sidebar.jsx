import React from 'react';
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
  currentUser = {
    user_id: 'MMC-1042',
    first_name: 'Juan',
    last_name: 'Dela Cruz',
    username: 'juandelacruz',
    email: 'juan.delacruz@serbisyou.ph',
    contact_number: '+63 912 345 6789',
    user_type: 'Provider', // 'Provider' | 'Requestor'
    region: 'NCR',
    province: 'Metro Manila',
    city: 'Quezon City',
    barangay: 'Brgy. Central',
  },
}) {
  // Navigation links for Dashboard, Services, Transactions, Messages, Profile
  const navItems = [
    {
      to: '/',
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
      badge: '3',
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
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5 8 5.961 14.154 3.5 8.186 1.113zM15 4.239l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464L7.443.184z" />
          </svg>
          <span>SerbisYou Navigation</span>
        </Offcanvas.Title>
      </Offcanvas.Header>

      {/* Sidebar Content Body */}
      <Offcanvas.Body className="d-flex flex-column justify-content-between p-3">
        <div>
          {/* User Profile Card grounded in users table */}
          <Card className="neu-profile-card mb-4">
            <div className="d-flex align-items-center gap-2 mb-2">
              <div className="neu-avatar-sidebar flex-shrink-0">
                {currentUser.first_name[0]}{currentUser.last_name[0]}
              </div>
              <div className="overflow-hidden">
                <div className="fw-bold text-truncate" style={{ color: 'var(--neu-text)' }}>
                  {currentUser.first_name} {currentUser.last_name}
                </div>
                <div className="text-muted small font-monospace">
                  ID: {currentUser.user_id}
                </div>
              </div>
            </div>
            <div className="d-flex align-items-center justify-content-between pt-2 border-top">
              <Badge
                bg={currentUser.user_type === 'Provider' ? 'success' : 'info'}
                className="text-white"
              >
                {currentUser.user_type}
              </Badge>
              <span className="text-muted small text-truncate">
                {currentUser.barangay}, {currentUser.city}
              </span>
            </div>
          </Card>

          {/* Navigation Links Section */}
          <div className="neu-nav-label text-uppercase fw-bold small px-2 mb-2">
            Navigation Menu
          </div>
          <Nav className="flex-column gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
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
