import React, { useState } from 'react';
import { Card, Form, Button, Alert, Spinner, Row, Col, InputGroup } from 'react-bootstrap';
import api from '../api/axios';
import ConfirmationModal from './ConfirmationModal';

export default function ChangePasswordOtpCard() {
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleRequestOtp = async () => {
    setOtpLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await api.post('/profile/password/otp');
      setMessage(res.data?.message || 'A 6-digit verification code has been dispatched to your registered email.');
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit verification code received in your email.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation password do not match.');
      return;
    }

    setShowConfirmModal(true);
  };

  const executeChangePassword = async () => {
    setShowConfirmModal(false);
    setSaveLoading(true);

    try {
      const res = await api.post('/profile/password/change', {
        otp_code: otpCode.trim(),
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      setMessage(res.data?.message || 'Password changed successfully!');
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
      setOtpSent(false);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to update password.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <Card className="neu-card border-0 mb-4 mt-4">
      <Card.Header className="bg-transparent border-0 pt-4 px-4 pb-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white"
            style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #0A192F, #133266)' }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div>
            <h5 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>Security & Password Change</h5>
            <div className="text-muted small">Update your password using two-factor email OTP authorization.</div>
          </div>
        </div>
      </Card.Header>

      <Card.Body className="p-4">
        {message && <Alert variant="success" className="rounded-3">{message}</Alert>}
        {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}

        {!otpSent ? (
          <div className="p-3 rounded-4 neu-card-inset d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <strong className="d-block" style={{ color: 'var(--neu-text)' }}>Request One-Time Password (OTP)</strong>
              <span className="text-muted small">
                We will email a 6-digit confirmation code to verify your identity before allowing password updates.
              </span>
            </div>
            <Button
              className="neu-btn-primary rounded-pill px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2"
              onClick={handleRequestOtp}
              disabled={otpLoading}
            >
              {otpLoading && <Spinner size="sm" animation="border" />}
              <span>Send Verification Code</span>
            </Button>
          </div>
        ) : (
          <Form onSubmit={handleChangePassword}>
            <Row className="g-3">
              <Col md={12}>
                <div className="p-3 mb-2 rounded-3 bg-light border d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <span className="small text-muted">
                    A 6-digit verification code was dispatched to your email. Check your inbox or spam.
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 text-decoration-none fw-semibold"
                    onClick={handleRequestOtp}
                    disabled={otpLoading}
                  >
                    Resend Code
                  </Button>
                </div>
              </Col>

              <Col md={4}>
                <Form.Group controlId="otpCodeInput">
                  <Form.Label className="fw-semibold small">6-Digit OTP Code <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="neu-input font-monospace text-center fw-bold fs-5"
                    required
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="newPasswordInput">
                  <Form.Label className="fw-semibold small">New Password <span className="text-danger">*</span></Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="neu-input rounded-start"
                      required
                    />
                    <Button
                      variant="link"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      type="button"
                      className="neu-btn-ghost d-flex align-items-center px-3"
                    >
                      {showNewPassword ? 'Hide' : 'Show'}
                    </Button>
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group controlId="confirmPasswordInput">
                  <Form.Label className="fw-semibold small">Confirm New Password <span className="text-danger">*</span></Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-type new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="neu-input rounded-start"
                      required
                    />
                    <Button
                      variant="link"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      type="button"
                      className="neu-btn-ghost d-flex align-items-center px-3"
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </Button>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>

            <div className="mt-4 d-flex justify-content-end gap-2">
              <Button
                variant="outline-secondary"
                className="rounded-pill px-4 py-2"
                onClick={() => setOtpSent(false)}
                disabled={saveLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="neu-btn-orange rounded-pill px-4 py-2 fw-bold text-white shadow-sm d-inline-flex align-items-center gap-2"
                disabled={saveLoading || !otpCode || !newPassword || !confirmPassword}
              >
                {saveLoading && <Spinner size="sm" animation="border" />}
                <span>Change Password</span>
              </Button>
            </div>
          </Form>
        )}
      </Card.Body>

      <ConfirmationModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        onConfirm={executeChangePassword}
        title="Confirm Password Change?"
        message="You will need to use your new password next time you sign into SerbisYou."
        confirmText="Yes, Update Password"
        confirmVariant="primary"
        loading={saveLoading}
      />
    </Card>
  );
}
