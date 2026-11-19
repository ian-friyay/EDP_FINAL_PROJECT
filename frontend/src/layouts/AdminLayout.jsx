import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Badge, Button, Offcanvas, Dropdown } from 'react-bootstrap';
import api from '../api/axios';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [pendingCount, setPendingCount] = useState(5);
  const [collapsedGroups, setCollapsedGroups] = useState({
    community: false,
    operations: false,
    moderation: false,
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = window.localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data }) => {
        if (data?.data?.summary) {
          const totalUsers = data.data.summary.total_users || 0;
          setPendingCount(Math.max(1, Math.floor(totalUsers * 0.4)));
        }
      })
      .catch(() => {});
  }, []);

  const toggleGroup = (groupKey) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const handleSignOut = () => {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('user_id');
    window.localStorage.removeItem('user');
    window.localStorage.removeItem('serbisyou_remember_me');
    navigate('/sign-in', { replace: true });
  };

  const adminName = currentUser?.first_name
    ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim()
    : 'Admin User';
  const adminInitials = `${(currentUser?.first_name || 'K')[0] || ''}${(currentUser?.last_name || 'A')[0] || ''}`.toUpperCase();

  const isCurrent = (path) => location.pathname === path;

  const sidebarContent = (
    <div className="d-flex flex-column h-100" style={{ fontSize: '0.875rem' }}>
      {/* 1. Dashboard Link */}
      <div className="px-3 pt-3 pb-2">
        <Link
          to="/admin/dashboard"
          onClick={() => setShowMobileSidebar(false)}
          className={`d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none fw-medium transition-all ${
            isCurrent('/admin/dashboard')
              ? 'bg-light text-primary fw-bold shadow-xs'
              : 'text-secondary hover-bg-light'
          }`}
          style={{
            backgroundColor: isCurrent('/admin/dashboard') ? '#f1f5f9' : 'transparent',
            color: isCurrent('/admin/dashboard') ? '#0284c7' : '#475569',
          }}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span>Dashboard</span>
        </Link>
      </div>

      {/* 2. Campus Community Group */}
      <div className="px-3 py-2">
        <div
          onClick={() => toggleGroup('community')}
          className="d-flex justify-content-between align-items-center px-2 py-1 text-muted small fw-semibold cursor-pointer user-select-none"
          style={{ cursor: 'pointer', fontSize: '0.78rem' }}
        >
          <span>Campus Community</span>
          <span style={{ fontSize: '0.7rem', transform: collapsedGroups.community ? 'rotate(-90deg)' : 'none', transition: 'transform 0.15s ease' }}>
            ▼
          </span>
        </div>
        {!collapsedGroups.community && (
          <div className="d-flex flex-column gap-1 mt-1">
            <Link
              to="/admin/users"
              onClick={() => setShowMobileSidebar(false)}
              className={`d-flex align-items-center justify-content-between px-3 py-2 rounded-3 text-decoration-none transition-all ${
                isCurrent('/admin/users') ? 'bg-light text-primary fw-bold' : 'text-secondary'
              }`}
              style={{
                backgroundColor: isCurrent('/admin/users') ? '#f1f5f9' : 'transparent',
                color: isCurrent('/admin/users') ? '#0284c7' : '#475569',
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <span>Students &amp; Accounts</span>
              </div>
              <span
                className="badge rounded-pill"
                style={{
                  backgroundColor: '#ffedd5',
                  color: '#9a3412',
                  border: '1px solid #fdba74',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  padding: '3px 8px',
                }}
              >
                {pendingCount}
              </span>
            </Link>

            <Link
              to="/admin/unlock-requests"
              onClick={() => setShowMobileSidebar(false)}
              className={`d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none transition-all ${
                isCurrent('/admin/unlock-requests') ? 'bg-light text-primary fw-bold' : 'text-secondary'
              }`}
              style={{
                backgroundColor: isCurrent('/admin/unlock-requests') ? '#f1f5f9' : 'transparent',
                color: isCurrent('/admin/unlock-requests') ? '#0284c7' : '#475569',
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span>Profile Unlock Requests &amp; Notes</span>
            </Link>
          </div>
        )}
      </div>

      {/* 3. Marketplace Operations Group */}
      <div className="px-3 py-2">
        <div
          onClick={() => toggleGroup('operations')}
          className="d-flex justify-content-between align-items-center px-2 py-1 text-muted small fw-semibold cursor-pointer user-select-none"
          style={{ cursor: 'pointer', fontSize: '0.78rem' }}
        >
          <span>Marketplace Operations</span>
          <span style={{ fontSize: '0.7rem', transform: collapsedGroups.operations ? 'rotate(-90deg)' : 'none', transition: 'transform 0.15s ease' }}>
            ▼
          </span>
        </div>
        {!collapsedGroups.operations && (
          <div className="d-flex flex-column gap-1 mt-1">
            <Link
              to="/admin/services"
              onClick={() => setShowMobileSidebar(false)}
              className={`d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none transition-all ${
                isCurrent('/admin/services') ? 'bg-light text-primary fw-bold' : 'text-secondary'
              }`}
              style={{
                backgroundColor: isCurrent('/admin/services') ? '#f1f5f9' : 'transparent',
                color: isCurrent('/admin/services') ? '#0284c7' : '#475569',
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.07a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.118.58.094 1.193-.07 1.743" />
              </svg>
              <span>Services Catalog</span>
            </Link>

            <Link
              to="/admin/transactions"
              onClick={() => setShowMobileSidebar(false)}
              className={`d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none transition-all ${
                isCurrent('/admin/transactions') ? 'bg-light text-primary fw-bold' : 'text-secondary'
              }`}
              style={{
                backgroundColor: isCurrent('/admin/transactions') ? '#f1f5f9' : 'transparent',
                color: isCurrent('/admin/transactions') ? '#0284c7' : '#475569',
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Transactions &amp; Commissions</span>
            </Link>
          </div>
        )}
      </div>

      {/* 4. Moderation & Content Group */}
      <div className="px-3 py-2">
        <div
          onClick={() => toggleGroup('moderation')}
          className="d-flex justify-content-between align-items-center px-2 py-1 text-muted small fw-semibold cursor-pointer user-select-none"
          style={{ cursor: 'pointer', fontSize: '0.78rem' }}
        >
          <span>Moderation &amp; Content</span>
          <span style={{ fontSize: '0.7rem', transform: collapsedGroups.moderation ? 'rotate(-90deg)' : 'none', transition: 'transform 0.15s ease' }}>
            ▼
          </span>
        </div>
        {!collapsedGroups.moderation && (
          <div className="d-flex flex-column gap-1 mt-1">
            <Link
              to="/admin/reviews"
              onClick={() => setShowMobileSidebar(false)}
              className={`d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none transition-all ${
                isCurrent('/admin/reviews') ? 'bg-light text-primary fw-bold' : 'text-secondary'
              }`}
              style={{
                backgroundColor: isCurrent('/admin/reviews') ? '#f1f5f9' : 'transparent',
                color: isCurrent('/admin/reviews') ? '#0284c7' : '#475569',
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
              <span>Reviews &amp; Ratings</span>
            </Link>

            <Link
              to="/admin/advertisements"
              onClick={() => setShowMobileSidebar(false)}
              className={`d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-decoration-none transition-all ${
                isCurrent('/admin/advertisements') ? 'bg-light text-primary fw-bold' : 'text-secondary'
              }`}
              style={{
                backgroundColor: isCurrent('/admin/advertisements') ? '#f1f5f9' : 'transparent',
                color: isCurrent('/admin/advertisements') ? '#0284c7' : '#475569',
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.455a28.047 28.047 0 01-2.16-6.138m3.822 1.919l6.182 2.473a1.125 1.125 0 001.536-1.045V6.708a1.125 1.125 0 00-1.536-1.045l-6.182 2.473" />
              </svg>
              <span>Campus Advertisements</span>
            </Link>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-auto p-3 border-top text-center text-muted" style={{ fontSize: '0.75rem', borderColor: '#e2e8f0' }}>
        SerbisYou Admin Portal &copy; {new Date().getFullYear()}
      </div>
    </div>
  );

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: '#ffffff', color: '#0f172a' }}>
      {/* ─── TOP FILAMENT BAR ─── */}
      <header
        className="d-flex align-items-center justify-content-between px-3 px-md-4 bg-white border-bottom sticky-top"
        style={{ minHeight: '58px', zIndex: 1040, borderColor: '#e2e8f0' }}
      >
        <div className="d-flex align-items-center gap-3">
          {/* Mobile hamburger */}
          <Button
            variant="link"
            onClick={() => setShowMobileSidebar(true)}
            className="p-0 text-dark d-lg-none"
            style={{ fontSize: '1.4rem', textDecoration: 'none', lineHeight: 1 }}
          >
            ☰
          </Button>

          {/* Logo */}
          <Link to="/admin/dashboard" className="d-flex align-items-center gap-2 text-decoration-none">
            <img
              src="/logo-transparent.png"
              alt="SerbisYou"
              style={{ height: '34px', objectFit: 'contain' }}
            />
          </Link>
        </div>

        {/* Right Admin Controls */}
        <div className="d-flex align-items-center gap-3">
          <Dropdown align="end">
            <Dropdown.Toggle
              as="div"
              className="d-flex align-items-center justify-content-center text-white fw-bold cursor-pointer"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#0f172a',
                cursor: 'pointer',
                fontSize: '0.85rem',
                userSelect: 'none',
              }}
              title={adminName}
            >
              {adminInitials}
            </Dropdown.Toggle>

            <Dropdown.Menu className="shadow-sm border rounded-3 p-2 mt-2" style={{ borderColor: '#e2e8f0', minWidth: '200px' }}>
              <div className="px-3 py-2 border-bottom mb-1">
                <div className="fw-bold text-dark small">{adminName}</div>
                <div className="text-muted" style={{ fontSize: '0.72rem' }}>Administrator</div>
              </div>
              <Dropdown.Item as={Link} to="/admin/settings" className="small rounded-2 py-2">
                ⚙ Admin Settings
              </Dropdown.Item>
              <Dropdown.Item as={Link} to="/dashboard" className="small rounded-2 py-2">
                ⇄ Switch to Student View
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleSignOut} className="small text-danger rounded-2 py-2">
                ✕ Sign Out
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </header>

      {/* ─── BODY: SIDEBAR + CONTENT ─── */}
      <div className="d-flex flex-grow-1 position-relative">
        {/* Desktop Fixed Left Sidebar */}
        <aside
          className="d-none d-lg-block bg-white border-end"
          style={{
            width: '240px',
            position: 'fixed',
            top: '58px',
            left: 0,
            bottom: 0,
            zIndex: 1030,
            overflowY: 'auto',
            borderColor: '#e2e8f0',
          }}
        >
          {sidebarContent}
        </aside>

        {/* Mobile Offcanvas Drawer */}
        <Offcanvas
          show={showMobileSidebar}
          onHide={() => setShowMobileSidebar(false)}
          className="d-lg-none"
          style={{ width: '260px' }}
        >
          <Offcanvas.Header closeButton className="border-bottom">
            <Offcanvas.Title className="fs-6 fw-bold">Admin Navigation</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-0">
            {sidebarContent}
          </Offcanvas.Body>
        </Offcanvas>

        {/* Dynamic Admin Page Outlet */}
        <main
          className="flex-grow-1 p-3 p-md-4"
          style={{
            marginLeft: typeof window !== 'undefined' && window.innerWidth >= 992 ? '240px' : 0,
            backgroundColor: '#ffffff',
            minHeight: 'calc(100vh - 58px)',
          }}
        >
          <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
