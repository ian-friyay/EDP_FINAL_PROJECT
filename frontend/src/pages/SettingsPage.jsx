import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, Button, Row, Col, Alert, Badge, Spinner } from 'react-bootstrap';
import api from '../api/axios';
import { compressImage } from '../utils/imageCompressor';
import ConfirmationModal from '../components/ConfirmationModal';
import AdminUnlockRequestCard from '../components/AdminUnlockRequestCard';
import ChangePasswordOtpCard from '../components/ChangePasswordOtpCard';

const availableCategories = ['Creative', 'Event Support', 'Digital Service'];
const availableSubcategories = {
  Creative: ['Graphic Designer', 'Art Painter'],
  'Event Support': ['Make-up artist', 'Event Hosts'],
  'Digital Service': ['Photographers', 'Video Editors'],
};

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [serviceCategories, setServiceCategories] = useState(['Creative']);
  const [subcategories, setSubcategories] = useState(['Graphic Designer']);

  const [saving, setSaving] = useState(false);
  const [imageCompressing, setImageCompressing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fileInputRef = useRef(null);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/profile');
      const u = res.data?.user || res.data?.data;
      if (u) {
        setUser(u);
        setFirstName(u.first_name || '');
        setLastName(u.last_name || '');
        setContactNumber(u.contact_number || '');
        setProfileImage(u.profile_image || u.profile_picture || '');
        if (Array.isArray(u.service_category)) {
          setServiceCategories(u.service_category);
        }
        if (Array.isArray(u.subcategory)) {
          setSubcategories(u.subcategory);
        }
      }
    } catch (err) {
      // Fallback from localStorage
      try {
        const stored = window.localStorage.getItem('user');
        if (stored) {
          const parsed = JSON.parse(stored);
          setUser(parsed);
          setFirstName(parsed.first_name || '');
          setLastName(parsed.last_name || '');
          setContactNumber(parsed.contact_number || '');
          setProfileImage(parsed.profile_image || parsed.profile_picture || '');
        }
      } catch (e) {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const calculateCooldownDays = () => {
    if (typeof user?.profile_cooldown_days === 'number') {
      return user.profile_cooldown_days;
    }
    if (!user?.profile_updated_at) return 0;
    const lastUpdate = new Date(user.profile_updated_at).getTime();
    const daysPassed = (Date.now() - lastUpdate) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(30 - daysPassed));
  };

  const cooldownDays = calculateCooldownDays();
  const isCooldownActive = cooldownDays > 0;
  const isProvider = user?.user_type === 'Provider';

  const handleCategoryToggle = (category) => {
    let updated;
    if (serviceCategories.includes(category)) {
      if (serviceCategories.length === 1) return;
      updated = serviceCategories.filter((c) => c !== category);
    } else {
      updated = [...serviceCategories, category];
    }
    setServiceCategories(updated);
  };

  const handleSubcategoryToggle = (sub) => {
    let updated;
    if (subcategories.includes(sub)) {
      if (subcategories.length === 1) return;
      updated = subcategories.filter((s) => s !== sub);
    } else {
      updated = [...subcategories, sub];
    }
    setSubcategories(updated);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setImageCompressing(true);

    try {
      const compressed = await compressImage(file, 400, 400, 0.75);
      setProfileImage(compressed);
    } catch (err) {
      setError(err.message || 'Failed to process selected profile photo.');
    } finally {
      setImageCompressing(false);
      e.target.value = '';
    }
  };

  const handleSave = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (isCooldownActive) {
      setError(`Profile updates are locked for ${cooldownDays} more day(s) due to the 30-day waiting period.`);
      return;
    }

    setError('');
    setShowConfirmModal(true);
  };

  const executeSaveProfile = async () => {
    setShowConfirmModal(false);
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        contact_number: contactNumber.trim(),
        profile_image: profileImage,
      };

      if (isProvider) {
        payload.service_category = serviceCategories;
        payload.subcategory = subcategories;
      }

      const res = await api.put('/profile', payload);
      const updatedUser = res.data?.user || res.data?.data;
      if (updatedUser) {
        setUser(updatedUser);
        window.localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      setSuccess('Profile updated successfully! Next profile change will be available in 30 days.');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-2 small">Loading your account settings...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0" style={{ maxWidth: '980px' }}>
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>
          {isProvider ? 'Provider Settings & Services Configuration' : 'Student Account Settings'}
        </h2>
        <p className="text-muted mb-0">
          Configure your personal information, profile photo, and security preferences.
        </p>
      </div>

      {success && <Alert variant="success" className="rounded-3">{success}</Alert>}
      {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}

      {/* 30-Day Cooldown Notice Card */}
      {isCooldownActive ? (
        <Alert variant="warning" className="rounded-4 border-0 shadow-sm p-3 mb-4 d-flex align-items-start gap-3">
          <div
            className="rounded-circle bg-warning text-dark d-flex align-items-center justify-content-center flex-shrink-0 mt-1"
            style={{ width: '36px', height: '36px', fontSize: '1.1rem' }}
          >
            ⏳
          </div>
          <div>
            <strong className="d-block text-dark">Profile Change Cooldown Active (30 Days Rule)</strong>
            <span className="small text-dark">
              You last updated your profile on{' '}
              <strong>{user?.profile_updated_at ? new Date(user.profile_updated_at).toLocaleDateString() : 'recently'}</strong>.
              To maintain campus identity integrity, profile details and photos can only be updated once every 30 days.
              You may update your profile again in{' '}
              <strong className="text-danger fs-6">{cooldownDays} day(s)</strong>.
            </span>
            <div className="mt-2">
              <a
                href="#admin-unlock-section"
                className="btn btn-sm btn-outline-dark fw-semibold rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1 shadow-xs"
                style={{ textDecoration: 'none' }}
              >
                <span>Request Admin Unlock / Submit Note Below</span>
                <span>↓</span>
              </a>
            </div>
          </div>
        </Alert>
      ) : (
        <div className="p-3 mb-4 rounded-4 bg-success-subtle text-success border border-success-subtle d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2 small">
            <span className="fs-5">✓</span>
            <span>
              <strong>Profile Editing Available:</strong> You can update your name, contact, and profile picture now. Once updated, a 30-day waiting period will apply before you can change it again.
            </span>
          </div>
          <Badge bg="success" className="px-3 py-1 rounded-pill">Editable</Badge>
        </div>
      )}

      <Row className="g-4">
        {/* Left Column: Personal Profile Form */}
        <Col lg={isProvider ? 7 : 12}>
          <Card className="neu-card border-0 h-100">
            <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>Personal Profile</h5>
              {isCooldownActive && (
                <Badge bg="secondary" className="px-3 py-1 rounded-pill">
                  Locked ({cooldownDays}d left)
                </Badge>
              )}
            </Card.Header>
            <Card.Body className="p-4">
              {/* Avatar & Photo Change */}
              <div className="d-flex align-items-center gap-3 mb-4 p-3 rounded-4 neu-card-inset flex-wrap">
                <div className="position-relative">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={user?.first_name}
                      style={{ width: '74px', height: '74px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #ff7828' }}
                      className="shadow-sm"
                    />
                  ) : (
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm text-white"
                      style={{ width: '74px', height: '74px', fontSize: '1.75rem', background: 'linear-gradient(135deg, #0A192F, #133266)' }}
                    >
                      {user?.first_name?.[0] || 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-grow-1">
                  <div className="fw-bold fs-5" style={{ color: 'var(--neu-text)' }}>
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div className="text-muted small">
                    {user?.student_id || user?.user_id || 'Student'} • {user?.email}
                  </div>

                  {!isCooldownActive && (
                    <div className="mt-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }}
                      />
                      <Button
                        className="neu-btn-primary rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={imageCompressing}
                        style={{ fontSize: '0.8rem' }}
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                        </svg>
                        <span>{imageCompressing ? 'Processing photo...' : 'Change Profile Photo'}</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <Form onSubmit={handleSave}>
                <Row className="g-3">
                  <Col sm={6}>
                    <Form.Group controlId="firstName">
                      <Form.Label className="fw-semibold small">First Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="neu-input"
                        disabled={isCooldownActive}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col sm={6}>
                    <Form.Group controlId="lastName">
                      <Form.Label className="fw-semibold small">Last Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="neu-input"
                        disabled={isCooldownActive}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col sm={6}>
                    <Form.Group controlId="contactNumber">
                      <Form.Label className="fw-semibold small">Contact Number <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="09123456789"
                        className="neu-input"
                        disabled={isCooldownActive}
                        required
                      />
                    </Form.Group>
                  </Col>

                  <Col sm={6}>
                    <Form.Group controlId="studentId">
                      <Form.Label className="fw-semibold small">Student ID</Form.Label>
                      <Form.Control
                        type="text"
                        value={user?.student_id || user?.user_id || 'N/A'}
                        disabled
                        readOnly
                        className="neu-input opacity-75"
                      />
                    </Form.Group>
                  </Col>

                  <Col sm={6}>
                    <Form.Group controlId="username">
                      <Form.Label className="fw-semibold small">Username</Form.Label>
                      <Form.Control
                        type="text"
                        value={user?.username || ''}
                        disabled
                        readOnly
                        className="neu-input opacity-75"
                      />
                    </Form.Group>
                  </Col>

                  <Col sm={6}>
                    <Form.Group controlId="email">
                      <Form.Label className="fw-semibold small">Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        value={user?.email || ''}
                        disabled
                        readOnly
                        className="neu-input opacity-75"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="mt-4 d-flex justify-content-end">
                  <Button
                    type="submit"
                    className="neu-btn-orange rounded-pill px-4 py-2 fw-bold text-white shadow-sm"
                    disabled={saving || isCooldownActive}
                  >
                    {saving ? 'Saving...' : 'Save Profile Changes'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column: Provider Service Classifications (If Provider) */}
        {isProvider && (
          <Col lg={5}>
            <Card className="neu-card border-0 h-100">
              <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0">
                <h5 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>Active Skill Classifications</h5>
                <div className="text-muted small">Select the categories and specializations you offer campus peers.</div>
              </Card.Header>
              <Card.Body className="p-4">
                <div className="mb-4">
                  <span className="fw-bold small d-block mb-2 text-primary">Main Service Categories</span>
                  <div className="d-flex flex-wrap gap-2">
                    {availableCategories.map((cat) => {
                      const isSelected = serviceCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => !isCooldownActive && handleCategoryToggle(cat)}
                          disabled={isCooldownActive}
                          className={`btn rounded-pill px-3 py-1 small fw-semibold transition-all ${
                            isSelected
                              ? 'neu-btn-orange text-white'
                              : 'neu-btn-outline text-muted'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="fw-bold small d-block mb-2 text-primary">Specialized Subcategories</span>
                  <div className="d-flex flex-column gap-3">
                    {serviceCategories.map((cat) => (
                      <div key={cat} className="p-3 rounded-3 neu-card-inset">
                        <span className="fw-bold small d-block mb-2" style={{ color: 'var(--neu-text)' }}>{cat} Skills</span>
                        <div className="d-flex flex-wrap gap-2">
                          {(availableSubcategories[cat] || []).map((sub) => {
                            const isSelected = subcategories.includes(sub);
                            return (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => !isCooldownActive && handleSubcategoryToggle(sub)}
                                disabled={isCooldownActive}
                                className={`btn rounded-pill px-3 py-1 small fw-semibold ${
                                  isSelected
                                    ? 'neu-btn-primary text-white'
                                    : 'neu-btn-ghost text-muted'
                                }`}
                              >
                                {isSelected ? '✓ ' : '+ '}
                                {sub}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {/* Admin Unlock Request Card & Direct Notes Section */}
      <AdminUnlockRequestCard
        user={user}
        isCooldownActive={isCooldownActive}
        cooldownDays={cooldownDays}
        onUnlocked={fetchProfile}
      />

      {/* 2FA Email OTP Change Password Card */}
      <ChangePasswordOtpCard />

      {/* Confirmation Modal */}
      <ConfirmationModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirm={executeSaveProfile}
        title="Commit Profile Updates?"
        message="Once saved, your profile details and photo will be locked for 30 days in accordance with SerbisYou campus integrity policies."
        confirmText="Yes, Save and Lock (30 Days)"
        confirmVariant="primary"
        loading={saving}
      />
    </div>
  );
}
