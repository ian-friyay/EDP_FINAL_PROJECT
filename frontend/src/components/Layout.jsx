import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import {
  Navbar,
  Nav,
  Container,
  Row,
  Col,
  Button,
  Badge,
  NavDropdown,
} from 'react-bootstrap';
import Sidebar from './Sidebar';
import OfflineToast from './OfflineToast';
import NotificationsDropdown from './NotificationsDropdown';
import { getCurrentUser } from '../utils/user';

export default function Layout() {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [currentUser, setLocalCurrentUser] = useState(getCurrentUser());

  useEffect(() => {
    const handleUserChange = () => {
      setLocalCurrentUser(getCurrentUser());
    };
    window.addEventListener('serbisyou_user_changed', handleUserChange);
    return () => window.removeEventListener('serbisyou_user_changed', handleUserChange);
  }, []);

  return (
    <div className="min-vh-100 d-flex flex-column bg-light">
      {/* 1. Top Navbar */}
      <Navbar bg="primary" variant="dark" expand="lg" sticky="top" className="shadow-sm py-2 px-3">
        <Container fluid className="p-0">
          <div className="d-flex align-items-center">
            {/* Hamburger button for Mobile (< lg) */}
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
            <NotificationsDropdown currentUser={currentUser} />
            {/* Quick Messages Link */}
            <Nav.Link as={Link} to="/messages" className="text-white position-relative p-2" aria-label="Messages">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
              </svg>
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
                    {currentUser.first_name ? currentUser.first_name[0] : 'U'}
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
          {/* Responsive Sidebar Component */}
          <Col lg={3} xl={2} className="p-0">
            <Sidebar
              show={showMobileSidebar}
              onHide={() => setShowMobileSidebar(false)}
              currentUser={currentUser}
            />
          </Col>

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
