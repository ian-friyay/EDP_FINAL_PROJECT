import React, { useState } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import {
  Navbar,
  Nav,
  Container,
  Row,
  Col,
  Offcanvas,
  Button,
  Badge,
  NavDropdown,
  Card,
} from 'react-bootstrap';
import OfflineToast from './OfflineToast';

export default function Layout() {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const location = useLocation();

  // Mock user following universal database schema: users table
  const currentUser = {
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
  };

  // Navigation items mapped directly to the schema
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
      label: 'Services & Catalog',
      badge: 'Active',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0">
          <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.492-3.287.813V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.321-2.107-.692-3.287-.813-1.094-.11-2.278-.037-3.213.493V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z" />
        </svg>
      ),
    },
    {
      to: '/transactions',
      label: 'Transactions & Bookings',
      badge: '5% Comm',
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
      label: 'Profile & Settings',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0">
          <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
          <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z" />
        </svg>
      ),
    },
  ];

  // Reusable Sidebar Content
  const renderSidebarContent = (onLinkClick) => (
    <div className="d-flex flex-column h-100 justify-content-between">
      <div>
        {/* User Card Profile Header in Sidebar */}
        <Card className="border-0 bg-light rounded-3 p-3 mb-4 shadow-sm">
          <div className="d-flex align-items-center gap-2 mb-2">
            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5 px-3 py-2">
              {currentUser.first_name[0]}{currentUser.last_name[0]}
            </div>
            <div className="overflow-hidden">
              <div className="fw-bold text-truncate text-dark">
                {currentUser.first_name} {currentUser.last_name}
              </div>
              <div className="text-muted small font-monospace">
                ID: {currentUser.user_id}
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center justify-content-between pt-2 border-top">
            <Badge bg={currentUser.user_type === 'Provider' ? 'success' : 'info'} className="text-white">
              {currentUser.user_type}
            </Badge>
            <span className="text-muted small text-truncate">
              {currentUser.barangay}, {currentUser.city}
            </span>
          </div>
        </Card>

        {/* Sidebar Navigation Links */}
        <div className="text-uppercase text-muted fw-bold small px-2 mb-2">
          Menu
        </div>
        <Nav className="flex-column gap-1">
          {navItems.map((item) => (
            <Nav.Link
              key={item.to}
              as={NavLink}
              to={item.to}
              end={item.to === '/'}
              onClick={onLinkClick}
              className={({ isActive }) =>
                isActive
                  ? 'bg-primary text-white fw-semibold rounded-3 px-3 py-2 d-flex align-items-center justify-content-between shadow-sm'
                  : 'text-dark rounded-3 px-3 py-2 d-flex align-items-center justify-content-between text-secondary'
              }
            >
              <div className="d-flex align-items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <Badge
                  bg={location.pathname === item.to ? 'light' : 'secondary'}
                  text={location.pathname === item.to ? 'primary' : 'white'}
                  className="rounded-pill small"
                >
                  {item.badge}
                </Badge>
              )}
            </Nav.Link>
          ))}
        </Nav>
      </div>

      {/* Sidebar Footer with Quick Stats / Info */}
      <div className="pt-4 border-top">
        <Card className="border-0 bg-light p-2 rounded-3 text-center mb-2">
          <small className="text-muted d-block">Booking Fee</small>
          <strong className="text-primary fs-6">₱5.00 Flat Rate</strong>
          <small className="text-muted d-block mt-1">Provider Commission: 5%</small>
        </Card>
        <div className="text-center text-muted small">
          SerbisYou &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      {/* 1. Top Navbar */}
      <Navbar bg="primary" variant="dark" expand="lg" sticky="top" className="shadow-sm py-2 px-3">
        <Container fluid className="p-0">
          <div className="d-flex align-items-center">
            {/* Hamburger button for Mobile / Tablet (< lg) */}
            <Button
              variant="link"
              className="text-white p-0 me-3 d-lg-none"
              onClick={() => setShowMobileSidebar(true)}
              aria-label="Open Navigation Sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z" />
              </svg>
            </Button>

            {/* Brand Logo & Name */}
            <Navbar.Brand as={Link} to="/" className="fw-bold d-flex align-items-center gap-2 m-0 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5 8 5.961 14.154 3.5 8.186 1.113zM15 4.239l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464L7.443.184z" />
              </svg>
              <span>SerbisYou</span>
              <Badge bg="light" text="primary" className="ms-1 small d-none d-sm-inline-block">
                Marketplace
              </Badge>
            </Navbar.Brand>
          </div>

          {/* Right-side Navbar Actions */}
          <Nav className="ms-auto d-flex flex-row align-items-center gap-2">
            {/* Quick Messages Link */}
            <Nav.Link as={Link} to="/messages" className="text-white position-relative p-2" aria-label="Messages">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
              </svg>
              <Badge bg="danger" pill className="position-absolute top-0 start-100 translate-middle small">
                3
              </Badge>
            </Nav.Link>

            {/* User Dropdown */}
            <NavDropdown
              align="end"
              id="user-nav-dropdown"
              title={
                <span className="text-white d-inline-flex align-items-center gap-2">
                  <span className="d-none d-md-inline small fw-semibold">
                    {currentUser.first_name}
                  </span>
                  <Badge bg="light" text="dark" className="d-none d-md-inline small">
                    {currentUser.user_type}
                  </Badge>
                  <span className="bg-white text-primary rounded-circle fw-bold d-inline-flex align-items-center justify-content-center px-2 py-1 small">
                    {currentUser.first_name[0]}
                  </span>
                </span>
              }
            >
              <div className="px-3 py-2 border-bottom">
                <div className="fw-bold text-dark">
                  {currentUser.first_name} {currentUser.last_name}
                </div>
                <div className="text-muted small font-monospace">
                  {currentUser.user_id}
                </div>
                <div className="text-muted small text-truncate">
                  {currentUser.email}
                </div>
              </div>
              <NavDropdown.Item as={Link} to="/profile">
                My Profile
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/services">
                My Services
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/transactions">
                My Transactions
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item className="text-danger">
                Sign Out
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Container>
      </Navbar>

      {/* 2. Responsive Layout Body (Sidebar + Main Content Area) */}
      <Container fluid className="p-0 flex-grow-1 d-flex flex-column">
        <Row className="g-0 flex-grow-1">
          {/* Desktop Fixed Sidebar (visible on lg and wider) */}
          <Col lg={3} xl={2} className="d-none d-lg-block bg-white border-end p-3">
            {renderSidebarContent(null)}
          </Col>

          {/* Mobile / Tablet Offcanvas Drawer (triggered by hamburger on < lg) */}
          <Offcanvas
            show={showMobileSidebar}
            onHide={() => setShowMobileSidebar(false)}
            className="d-lg-none bg-white"
          >
            <Offcanvas.Header closeButton className="border-bottom px-3 py-3 bg-light">
              <Offcanvas.Title className="fw-bold text-primary d-flex align-items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5 8 5.961 14.154 3.5 8.186 1.113zM15 4.239l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464L7.443.184z" />
                </svg>
                <span>SerbisYou Menu</span>
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body className="p-3">
              {renderSidebarContent(() => setShowMobileSidebar(false))}
            </Offcanvas.Body>
          </Offcanvas>

          {/* 3. Main Content Area Rendering Child Routes with <Outlet /> */}
          <Col lg={9} xl={10} as="main" className="p-3 p-md-4 bg-body-tertiary flex-grow-1 overflow-auto">
            <Outlet />
          </Col>
        </Row>
      </Container>

      {/* PWA Offline & Update Toast Notification */}
      <OfflineToast />
    </div>
  );
}
