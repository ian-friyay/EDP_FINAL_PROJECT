import { useEffect, useState } from 'react';
import { Row, Col, Badge, Button, Form, Alert, Modal, Tabs, Tab } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { DEFAULT_AVATAR_PLACEHOLDER } from '../utils/placeholder';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  // Profile Form State
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    contact_number: '',
    region: '',
    province: '',
    city: '',
    barangay: '',
    profile_picture: '',
  });

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Account Deletion State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Status & Feedback
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [idDocumentFile, setIdDocumentFile] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    setIsLoading(true);
    setError('');
    try {
      const { data } = await api.get('/profile/me');
      setProfile(data.user);
      setForm({
        first_name: data.user.first_name || '',
        last_name: data.user.last_name || '',
        username: data.user.username || '',
        contact_number: data.user.contact_number || '',
        region: data.user.region || '',
        province: data.user.province || '',
        city: data.user.city || '',
        barangay: data.user.barangay || '',
        profile_picture: data.user.profile_picture || '',
      });
    } catch (err) {
      const defaultUser = {
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
        profile_picture: '',
      };
      setProfile(defaultUser);
      setForm(defaultUser);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle Profile Picture File Upload
  const handlePictureFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image file size should be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (typeof base64 === 'string') {
        setForm((prev) => ({ ...prev, profile_picture: base64 }));
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Save Profile Details
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      const { data } = await api.patch('/profile/me', form);
      setProfile(data.user);
      setIsEditing(false);
      setMessage('Profile updated successfully.');
      window.localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('serbisyou_user_changed'));
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Document File Upload
  const handleDocFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setError('Please select an image (JPG, PNG) or PDF document.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Document file size should be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result;
      if (typeof base64 === 'string') {
        setIdDocumentFile(base64);
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    if (!idDocumentFile) {
      setError('Please select or upload an ID document first.');
      return;
    }

    setIsUploadingDoc(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.post('/profile/verification-id', {
        id_document_url: idDocumentFile,
      });
      setMessage(data.message || 'ID document submitted for review!');
      await fetchProfile();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to submit ID document.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { data } = await api.patch('/profile/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setMessage(data.message || 'Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    setError('');
    setMessage('');
    setIsDeleting(true);

    try {
      await api.delete('/profile/me', {
        data: { password: deletePassword },
      });

      setShowDeleteModal(false);
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user_id');
      window.localStorage.removeItem('user');
      navigate('/sign-in', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to delete account.');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center text-muted py-5">Loading profile details...</div>;
  }

  const p = profile || {};
  const currentAvatarSrc = form.profile_picture || p.profile_picture || DEFAULT_AVATAR_PLACEHOLDER;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>Account &amp; Profile Settings</h2>
          <p className="text-muted mb-0">Manage your personal information, profile photo, credentials, and account settings.</p>
        </div>
      </div>

      {message && <Alert variant="success" dismissible onClose={() => setMessage('')} className="neu-alert mb-4">{message}</Alert>}
      {error && <Alert variant="danger" dismissible onClose={() => setError('')} className="neu-alert mb-4">{error}</Alert>}

      {/* Navigation Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(k) => {
          setActiveTab(k || 'details');
          setError('');
          setMessage('');
        }}
        className="mb-4 neu-tabs"
      >
        <Tab eventKey="details" title="Profile Details" />
        <Tab eventKey="verification" title="Provider Verification" />
        <Tab eventKey="security" title="Security & Password" />
        <Tab eventKey="danger" title="Account Management" />
      </Tabs>

      {/* TAB 1: Profile Details */}
      {activeTab === 'details' && (
        <div className="neu-card p-4 p-md-5">
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom flex-wrap gap-3" style={{ borderColor: 'rgba(154, 172, 196, 0.3)' }}>
            <div className="d-flex align-items-center gap-3">
              <div className="position-relative">
                <img
                  src={currentAvatarSrc}
                  alt="Profile Avatar"
                  className="rounded-circle shadow-sm"
                  style={{ width: 68, height: 68, objectFit: 'cover', border: '3px solid rgba(255,255,255,0.8)' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_AVATAR_PLACEHOLDER;
                  }}
                />
              </div>
              <div>
                <h5 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>
                  {p.first_name ? `${p.first_name} ${p.last_name || ''}`.trim() : 'User Profile'}
                </h5>
                <small className="text-muted font-monospace">{p.user_id || 'MMC-XXXX'}</small>
              </div>
            </div>
            <div className="d-flex gap-2 align-items-center">
              <Badge bg={p.user_type === 'Provider' ? 'success' : 'primary'} className="px-3 py-2 rounded-pill fs-6">
                {p.user_type ? `${p.user_type} Verified` : 'User Verified'}
              </Badge>
              <Button
                className={isEditing ? 'neu-btn-ghost px-4' : 'neu-btn-primary px-4'}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel Editing' : 'Edit Profile'}
              </Button>
            </div>
          </div>

          {isEditing ? (
            <Form onSubmit={handleSave}>
              {/* Profile Picture Option */}
              <div className="p-3 mb-4 rounded-3" style={{ background: 'var(--neu-bg-dark)' }}>
                <h6 className="fw-bold text-muted small text-uppercase mb-2">Profile Picture / Avatar</h6>
                <Row className="g-3 align-items-center">
                  <Col xs="auto">
                    <img
                      src={form.profile_picture || DEFAULT_AVATAR_PLACEHOLDER}
                      alt="Preview"
                      className="rounded-circle"
                      style={{ width: 60, height: 60, objectFit: 'cover' }}
                    />
                  </Col>
                  <Col>
                    <div className="d-flex gap-2 flex-wrap align-items-center">
                      <Form.Label className="btn neu-btn-primary btn-sm mb-0 cursor-pointer">
                        Upload Photo
                        <input
                          type="file"
                          accept="image/*"
                          className="d-none"
                          onChange={handlePictureFileUpload}
                        />
                      </Form.Label>
                      {form.profile_picture && (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="rounded-pill"
                          onClick={() => setForm({ ...form, profile_picture: '' })}
                        >
                          Remove Photo (Use Placeholder)
                        </Button>
                      )}
                    </div>
                    <div className="mt-2">
                      <Form.Control
                        size="sm"
                        className="neu-input"
                        placeholder="Or paste an image URL (https://...)"
                        value={form.profile_picture}
                        onChange={(e) => setForm({ ...form, profile_picture: e.target.value })}
                      />
                    </div>
                  </Col>
                </Row>
              </div>

              <Row className="g-3">
                <Col sm={6}>
                  <Form.Group controlId="editFirstName">
                    <Form.Label className="small fw-semibold text-muted">First Name</Form.Label>
                    <Form.Control
                      className="neu-input"
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group controlId="editLastName">
                    <Form.Label className="small fw-semibold text-muted">Last Name</Form.Label>
                    <Form.Control
                      className="neu-input"
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group controlId="editUsername">
                    <Form.Label className="small fw-semibold text-muted">Username</Form.Label>
                    <Form.Control
                      className="neu-input"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col sm={6}>
                  <Form.Group controlId="editContact">
                    <Form.Label className="small fw-semibold text-muted">Contact Number</Form.Label>
                    <Form.Control
                      className="neu-input"
                      value={form.contact_number}
                      onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                    />
                  </Form.Group>
                </Col>

                <Col sm={12}>
                  <hr className="my-3" style={{ borderColor: 'rgba(154, 172, 196, 0.3)' }} />
                  <h6 className="fw-bold text-muted text-uppercase small mb-3">Location Details</h6>
                </Col>
                <Col sm={6} md={3}>
                  <Form.Group controlId="editRegion">
                    <Form.Label className="small fw-semibold text-muted">Region</Form.Label>
                    <Form.Control
                      className="neu-input"
                      value={form.region}
                      onChange={(e) => setForm({ ...form, region: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col sm={6} md={3}>
                  <Form.Group controlId="editProvince">
                    <Form.Label className="small fw-semibold text-muted">Province</Form.Label>
                    <Form.Control
                      className="neu-input"
                      value={form.province}
                      onChange={(e) => setForm({ ...form, province: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col sm={6} md={3}>
                  <Form.Group controlId="editCity">
                    <Form.Label className="small fw-semibold text-muted">City</Form.Label>
                    <Form.Control
                      className="neu-input"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col sm={6} md={3}>
                  <Form.Group controlId="editBarangay">
                    <Form.Label className="small fw-semibold text-muted">Barangay</Form.Label>
                    <Form.Control
                      className="neu-input"
                      value={form.barangay}
                      onChange={(e) => setForm({ ...form, barangay: e.target.value })}
                    />
                  </Form.Group>
                </Col>
                <Col sm={12} className="mt-4 d-flex gap-2">
                  <Button type="submit" className="neu-btn-primary px-4" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button type="button" className="neu-btn-ghost px-4" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </Col>
              </Row>
            </Form>
          ) : (
            <Row className="g-4">
              <Col sm={6}>
                <div className="neu-card-inset p-3">
                  <div className="text-muted small mb-1">User ID (Format: MMC-XXXX)</div>
                  <div className="fw-bold font-monospace fs-5" style={{ color: 'var(--neu-primary)' }}>{p.user_id || '---'}</div>
                </div>
              </Col>
              <Col sm={6}>
                <div className="neu-card-inset p-3">
                  <div className="text-muted small mb-1">User Type</div>
                  <div>
                    <Badge bg={p.user_type === 'Provider' ? 'success' : 'primary'} className="rounded-pill px-3 py-1 fs-6">
                      {p.user_type || 'User'}
                    </Badge>
                  </div>
                </div>
              </Col>
              <Col sm={6}>
                <div className="neu-card-inset p-3">
                  <div className="text-muted small mb-1">Full Name</div>
                  <div className="fw-bold fs-6" style={{ color: 'var(--neu-text)' }}>
                    {`${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Not provided'}
                  </div>
                </div>
              </Col>
              <Col sm={6}>
                <div className="neu-card-inset p-3">
                  <div className="text-muted small mb-1">Username</div>
                  <div className="fw-bold fs-6" style={{ color: 'var(--neu-text)' }}>
                    @{p.username || 'none'}
                  </div>
                </div>
              </Col>
              <Col sm={6}>
                <div className="neu-card-inset p-3">
                  <div className="text-muted small mb-1">Contact Number</div>
                  <div className="fw-bold fs-6" style={{ color: 'var(--neu-text)' }}>
                    {p.contact_number || 'Not provided'}
                  </div>
                </div>
              </Col>
              <Col sm={6}>
                <div className="neu-card-inset p-3">
                  <div className="text-muted small mb-1">Email Address</div>
                  <div className="fw-bold fs-6 text-truncate" style={{ color: 'var(--neu-text)' }}>
                    {p.email || 'Not provided'}
                  </div>
                </div>
              </Col>
              <Col sm={12}>
                <hr className="my-2" style={{ borderColor: 'rgba(154, 172, 196, 0.3)' }} />
                <h6 className="fw-bold text-muted text-uppercase small mb-3">Location Details</h6>
              </Col>
              <Col sm={6} md={3}>
                <div className="neu-card-inset p-3 text-center">
                  <div className="text-muted small mb-1">Region</div>
                  <div className="fw-bold" style={{ color: 'var(--neu-text)' }}>{p.region || 'Not set'}</div>
                </div>
              </Col>
              <Col sm={6} md={3}>
                <div className="neu-card-inset p-3 text-center">
                  <div className="text-muted small mb-1">Province</div>
                  <div className="fw-bold" style={{ color: 'var(--neu-text)' }}>{p.province || 'Not set'}</div>
                </div>
              </Col>
              <Col sm={6} md={3}>
                <div className="neu-card-inset p-3 text-center">
                  <div className="text-muted small mb-1">City</div>
                  <div className="fw-bold" style={{ color: 'var(--neu-text)' }}>{p.city || 'Not set'}</div>
                </div>
              </Col>
              <Col sm={6} md={3}>
                <div className="neu-card-inset p-3 text-center">
                  <div className="text-muted small mb-1">Barangay</div>
                  <div className="fw-bold" style={{ color: 'var(--neu-text)' }}>{p.barangay || 'Not set'}</div>
                </div>
              </Col>
            </Row>
          )}
        </div>
      )}

      {/* TAB 2: Provider Verification */}
      {activeTab === 'verification' && (
        <div className="neu-card p-4 p-md-5">
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom flex-wrap gap-3" style={{ borderColor: 'rgba(154, 172, 196, 0.3)' }}>
            <div>
              <h5 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>Provider Verification &amp; Trust Badge</h5>
              <p className="text-muted small mb-0">
                Upload a government-issued ID, Barangay Clearance, or official certificate to earn a Verified Provider badge.
              </p>
            </div>
            <div>
              {p.verification_status === 'verified' && (
                <Badge bg="success" className="px-3 py-2 rounded-pill fs-6">
                  ✓ Verified Provider
                </Badge>
              )}
              {p.verification_status === 'pending' && (
                <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill fs-6">
                  ⏳ Verification In Review
                </Badge>
              )}
              {p.verification_status === 'rejected' && (
                <Badge bg="danger" className="px-3 py-2 rounded-pill fs-6">
                  ✕ Verification Rejected
                </Badge>
              )}
              {(!p.verification_status || p.verification_status === 'unverified') && (
                <Badge bg="secondary" className="px-3 py-2 rounded-pill fs-6">
                  Unverified
                </Badge>
              )}
            </div>
          </div>

          {p.verification_notes && (
            <Alert variant={p.verification_status === 'rejected' ? 'danger' : 'info'} className="neu-alert mb-4">
              <strong>Admin Notes:</strong> {p.verification_notes}
            </Alert>
          )}

          {p.id_document_url && (
            <div className="p-3 mb-4 rounded-3" style={{ background: 'var(--neu-bg-dark)' }}>
              <h6 className="fw-bold text-muted small text-uppercase mb-2">Currently Submitted Document</h6>
              {p.id_document_url.startsWith('data:application/pdf') || p.id_document_url.includes('.pdf') ? (
                <div className="d-flex align-items-center gap-2 text-muted">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
                  </svg>
                  <span>PDF Document on file</span>
                </div>
              ) : (
                <img
                  src={p.id_document_url}
                  alt="Submitted ID Document"
                  className="rounded-3 border"
                  style={{ maxHeight: '200px', objectFit: 'contain' }}
                />
              )}
            </div>
          )}

          <Form onSubmit={handleSubmitVerification} style={{ maxWidth: '600px' }}>
            <div className="p-3 mb-4 rounded-3" style={{ background: 'var(--neu-bg-dark)', border: '2px dashed rgba(154, 172, 196, 0.45)' }}>
              <div className="text-center py-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="currentColor" viewBox="0 0 16 16" className="text-muted mb-2">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                </svg>
                <div className="fw-semibold small" style={{ color: 'var(--neu-text)' }}>
                  Upload Government ID or Proof Document
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  PNG, JPG, or PDF up to 5MB
                </div>
                <Form.Label className="btn neu-btn-primary btn-sm mt-3 mb-0 cursor-pointer">
                  Select File
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="d-none"
                    onChange={handleDocFileUpload}
                  />
                </Form.Label>
              </div>

              {idDocumentFile && (
                <div className="mt-3 pt-3 border-top text-center">
                  <span className="badge bg-success me-2">File Ready</span>
                  <small className="text-muted">Document selected and ready for upload.</small>
                  {idDocumentFile.startsWith('data:image') && (
                    <div className="mt-2">
                      <img
                        src={idDocumentFile}
                        alt="Preview"
                        className="rounded-2 border"
                        style={{ maxHeight: '120px' }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mb-4">
              <Form.Label className="small fw-semibold text-muted">Or Paste Document URL</Form.Label>
              <Form.Control
                className="neu-input"
                placeholder="https://... (direct link to document)"
                value={idDocumentFile.startsWith('data:') ? '' : idDocumentFile}
                onChange={(e) => setIdDocumentFile(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="neu-btn-primary px-4 fw-semibold"
              disabled={isUploadingDoc || !idDocumentFile}
            >
              {isUploadingDoc ? 'Submitting Document...' : 'Submit ID for Verification'}
            </Button>
          </Form>
        </div>
      )}

      {/* TAB 3: Security & Password */}
      {activeTab === 'security' && (
        <div className="neu-card p-4 p-md-5">
          <div className="mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(154, 172, 196, 0.3)' }}>
            <h5 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>Change Account Password</h5>
            <small className="text-muted">Ensure your account is using a long and secure password.</small>
          </div>

          <Form onSubmit={handleChangePassword} style={{ maxWidth: '520px' }}>
            <Form.Group className="mb-3" controlId="currentPasswordInput">
              <Form.Label className="small fw-semibold text-muted">Current Password</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showPasswords.current ? 'text' : 'password'}
                  className="neu-input"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  required
                />
                <Button
                  variant="link"
                  className="position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none small pe-3"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  type="button"
                >
                  {showPasswords.current ? 'Hide' : 'Show'}
                </Button>
              </div>
            </Form.Group>

            <Form.Group className="mb-3" controlId="newPasswordInput">
              <Form.Label className="small fw-semibold text-muted">New Password</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showPasswords.new ? 'text' : 'password'}
                  className="neu-input"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="At least 8 characters"
                  required
                />
                <Button
                  variant="link"
                  className="position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none small pe-3"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  type="button"
                >
                  {showPasswords.new ? 'Hide' : 'Show'}
                </Button>
              </div>
            </Form.Group>

            <Form.Group className="mb-4" controlId="confirmPasswordInput">
              <Form.Label className="small fw-semibold text-muted">Confirm New Password</Form.Label>
              <div className="position-relative">
                <Form.Control
                  type={showPasswords.confirm ? 'text' : 'password'}
                  className="neu-input"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Re-type new password"
                  required
                />
                <Button
                  variant="link"
                  className="position-absolute end-0 top-50 translate-middle-y text-muted text-decoration-none small pe-3"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  type="button"
                >
                  {showPasswords.confirm ? 'Hide' : 'Show'}
                </Button>
              </div>
            </Form.Group>

            <Button
              type="submit"
              className="neu-btn-primary px-4 fw-semibold"
              disabled={isUpdatingPassword}
            >
              {isUpdatingPassword ? 'Updating Password...' : 'Save New Password'}
            </Button>
          </Form>
        </div>
      )}

      {/* TAB 3: Account Deletion (Danger Zone) */}
      {activeTab === 'danger' && (
        <div className="neu-card p-4 p-md-5 border-danger border-opacity-25">
          <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom border-danger border-opacity-25">
            <div className="rounded-circle bg-danger bg-opacity-10 p-3 text-danger">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
              </svg>
            </div>
            <div>
              <h5 className="fw-bold mb-1 text-danger">Delete SerbisYou Account</h5>
              <small className="text-muted">Permanent action: All your active listings and profile information will be removed.</small>
            </div>
          </div>

          <p className="text-muted mb-4" style={{ maxWidth: '600px', lineHeight: 1.6 }}>
            Once your account is deleted, all of your resources, marketplace listings, and profile data will be permanently deactivated. Before proceeding, please ensure you have settled all pending transactions.
          </p>

          <Button
            variant="danger"
            className="rounded-pill px-4 fw-semibold shadow-sm"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete Account
          </Button>

          {/* Delete Account Confirmation Modal */}
          <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
            <Modal.Header closeButton style={{ background: '#FFF1F2', borderBottom: '1px solid #FECDD3' }}>
              <Modal.Title className="fw-bold fs-5 text-danger">Confirm Account Deletion</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4" style={{ background: 'var(--neu-bg)' }}>
              <p className="small text-muted mb-3">
                Are you absolutely sure you want to delete your account (<strong>{p.email}</strong>)? This action cannot be undone.
              </p>
              <Form.Group className="mb-3" controlId="confirmPasswordDelete">
                <Form.Label className="small fw-semibold text-muted">
                  Enter your password to authorize:
                </Form.Label>
                <Form.Control
                  type="password"
                  className="neu-input"
                  placeholder="Account password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                />
              </Form.Group>
              <Form.Group controlId="confirmDeleteKeyword">
                <Form.Label className="small fw-semibold text-muted">
                  Type <strong className="text-danger">DELETE</strong> to confirm:
                </Form.Label>
                <Form.Control
                  type="text"
                  className="neu-input"
                  placeholder="DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer style={{ background: 'var(--neu-bg-dark)', borderTop: '1px solid rgba(154, 172, 196, 0.35)' }}>
              <Button className="neu-btn-ghost" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="danger"
                className="px-4 fw-semibold rounded-pill"
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                onClick={handleDeleteAccount}
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      )}
    </div>
  );
}
