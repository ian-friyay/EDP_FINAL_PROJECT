import { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Col, Container, Form, InputGroup, ProgressBar, Row } from 'react-bootstrap';
import api from '../api/axios';
import { philippineRegions } from '../data/philippinesLocations';

export default function AuthPage({ mode }) {
  const isSignUp = mode === 'sign-up';
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation and form steps
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState('Requestor');

  // Core Credentials & Profile
  const [studentId, setStudentId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Provider Location & Contact
  const [contactNumber, setContactNumber] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [customBarangay, setCustomBarangay] = useState('');

  // OTP Verification & Cooldown
  const [otp, setOtp] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Form states
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = window.localStorage.getItem('serbisyou_remembered_email');
    if (rememberedEmail && mode === 'sign-in') {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, [mode]);

  // Handle route & mode change reset
  useEffect(() => {
    setError('');
    if (mode === 'sign-in') {
      setStep(1);
      setVerificationPending(false);
      setOtp('');
      if (location.state?.message) {
        setMessage(location.state.message);
      }
    } else {
      setStep(1);
    }
  }, [mode, location.pathname, location.state]);

  // Resend OTP countdown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Cascading Address Options
  const provinceOptions = useMemo(() => {
    const regionObj = philippineRegions.find((r) => r.name === selectedRegion);
    return regionObj ? regionObj.provinces : [];
  }, [selectedRegion]);

  const cityOptions = useMemo(() => {
    const provinceObj = provinceOptions.find((p) => p.name === selectedProvince);
    return provinceObj ? provinceObj.cities : [];
  }, [provinceOptions, selectedProvince]);

  const barangayOptions = useMemo(() => {
    const cityObj = cityOptions.find((c) => c.name === selectedCity);
    return cityObj ? cityObj.barangays : [];
  }, [cityOptions, selectedCity]);

  const handleRegionChange = (regionName) => {
    setSelectedRegion(regionName);
    setSelectedProvince('');
    setSelectedCity('');
    setSelectedBarangay('');
    setCustomBarangay('');
  };

  const handleProvinceChange = (provinceName) => {
    setSelectedProvince(provinceName);
    setSelectedCity('');
    setSelectedBarangay('');
    setCustomBarangay('');
  };

  const handleCityChange = (cityName) => {
    setSelectedCity(cityName);
    setSelectedBarangay('');
    setCustomBarangay('');
  };

  // Password Strength Calculation
  const passwordCriteria = useMemo(() => {
    return {
      hasMinLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', variant: 'secondary', percent: 0 };
    const passedCount = Object.values(passwordCriteria).filter(Boolean).length;

    if (password.length < 8) {
      return { score: 1, label: 'Too short', variant: 'danger', percent: 25 };
    }
    if (passedCount <= 2) {
      return { score: 2, label: 'Weak', variant: 'danger', percent: 40 };
    }
    if (passedCount === 3 || passedCount === 4) {
      return { score: 3, label: 'Medium', variant: 'warning', percent: 70 };
    }
    return { score: 4, label: 'Strong', variant: 'success', percent: 100 };
  }, [password, passwordCriteria]);

  // Validation States
  const isStudentIdValid = useMemo(() => {
    const trimmed = studentId.trim().toUpperCase();
    return /^(MMC-)?\d{1,4}$/.test(trimmed) && trimmed.length > 0;
  }, [studentId]);

  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const isContactValid = useMemo(() => {
    return /^(\+63|0)9\d{9}$/.test(contactNumber.replace(/[\s-]/g, ''));
  }, [contactNumber]);

  // Step 1 Validation
  const validateStepOne = () => {
    if (!studentId.trim()) return 'Student ID is required.';
    if (!isStudentIdValid) return 'Student ID must be in MMC-XXXX format (e.g. MMC-1234).';
    if (!firstName.trim()) return 'First name is required.';
    if (!lastName.trim()) return 'Last name is required.';
    if (username.trim().length < 3) return 'Username must be at least 3 characters.';
    if (!isEmailValid) return 'Please enter a valid email address.';
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    return null;
  };

  // Step 2 Validation
  const validateStepTwo = () => {
    if (!contactNumber.trim()) return 'Contact number is required.';
    if (!isContactValid) return 'Enter a valid Philippine mobile number (e.g. 09123456789).';
    if (!selectedRegion) return 'Please select a region.';
    if (!selectedProvince) return 'Please select a province.';
    if (!selectedCity) return 'Please select a city or municipality.';
    const finalBarangay = selectedBarangay === 'Other' ? customBarangay.trim() : selectedBarangay;
    if (!finalBarangay) return 'Please select or specify your barangay.';
    return null;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');
    const stepOneError = validateStepOne();
    if (stepOneError) {
      setError(stepOneError);
      return;
    }
    setStep(2);
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setError('');
    try {
      const { data } = await api.post('/auth/resend-otp', { email });
      setMessage(data.message || 'A new verification code has been sent to your email.');
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  // Form Submit
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    // OTP Verification Submit
    if (verificationPending) {
      setIsSubmitting(true);
      try {
        await api.post('/auth/verify-otp', { email, otp });
        setVerificationPending(false);
        setOtp('');
        navigate('/sign-in', {
          replace: true,
          state: { message: 'Email verified successfully! You can now sign in.' },
        });
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Verification failed. Please check your code.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Sign Up Submit
    if (isSignUp) {
      const stepOneError = validateStepOne();
      if (stepOneError) {
        setStep(1);
        setError(stepOneError);
        return;
      }

      let finalBarangay = '';
      if (userType === 'Provider') {
        const stepTwoError = validateStepTwo();
        if (stepTwoError) {
          setStep(2);
          setError(stepTwoError);
          return;
        }
        finalBarangay = selectedBarangay === 'Other' ? customBarangay.trim() : selectedBarangay;
      }

      let normalizedStudentId = studentId.trim().toUpperCase();
      if (/^\d{1,4}$/.test(normalizedStudentId)) {
        normalizedStudentId = `MMC-${normalizedStudentId.padStart(4, '0')}`;
      }

      setIsSubmitting(true);
      try {
        await api.post('/auth/register', {
          student_id: normalizedStudentId,
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          username,
          contact_number: contactNumber.replace(/[\s-]/g, ''),
          region: selectedRegion,
          province: selectedProvince,
          city: selectedCity,
          barangay: finalBarangay,
          user_type: userType,
        });
        setVerificationPending(true);
        setResendCooldown(60);
        setMessage('We sent a 6-digit verification code to your email.');
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Registration failed.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Sign In Submit
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (typeof data.token !== 'string' || !data.token) {
        throw new Error('Authentication token missing from response.');
      }
      if (typeof data.user?.user_id !== 'string') {
        throw new Error('User profile missing from response.');
      }

      window.localStorage.setItem('token', data.token);
      window.localStorage.setItem('user_id', data.user.user_id);
      window.localStorage.setItem('user', JSON.stringify(data.user));

      if (rememberMe) {
        window.localStorage.setItem('serbisyou_remembered_email', email.trim());
      } else {
        window.localStorage.removeItem('serbisyou_remembered_email');
      }

      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPageTitle = () => {
    if (verificationPending) return 'Email Verification';
    if (!isSignUp) return 'Welcome Back';
    return userType === 'Provider' && step === 2
      ? 'Provider Address & Contact'
      : 'Create Your Account';
  };

  return (
    <main
      className="min-vh-100 py-4 py-md-5 d-flex align-items-center justify-content-center"
      style={{ background: 'var(--neu-bg)' }}
    >
      <Container className="d-flex justify-content-center px-3">
        <div
          className="neu-card p-4 p-md-5 w-100"
          style={{
            maxWidth: isSignUp && !verificationPending ? '740px' : '520px',
            boxShadow: 'var(--neu-shadow-flat-lg)',
          }}
        >
          {/* Header bar with SerbisYou Logo and Step Indicators */}
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(154, 172, 196, 0.35)' }}>
            <Link to="/" className="text-decoration-none d-flex align-items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#063a8f" viewBox="0 0 16 16">
                <path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5 8 5.961 14.154 3.5 8.186 1.113zM15 4.239l-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923l6.5 2.6zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464L7.443.184z" />
              </svg>
              <span className="fw-bold fs-4" style={{ color: '#063a8f' }}>
                SerbisYou
              </span>
              <span
                className="badge small fw-bold px-2 py-1 rounded-pill shadow-sm"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#063a8f',
                  fontSize: '0.68rem',
                  letterSpacing: '0.3px',
                }}
              >
                Marketplace
              </span>
            </Link>

            {isSignUp && !verificationPending && (
              <div className="d-flex align-items-center gap-2">
                <span
                  className="small px-3 py-1 rounded-pill fw-semibold"
                  style={{
                    background: step === 1 ? 'linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-dark) 100%)' : 'var(--neu-bg)',
                    color: step === 1 ? '#fff' : 'var(--neu-text-muted)',
                    boxShadow: step === 1 ? '2px 2px 6px rgba(8, 75, 181, 0.35)' : 'var(--neu-shadow-sm)',
                    fontSize: '0.75rem',
                  }}
                >
                  1. Basic Info
                </span>
                {userType === 'Provider' && (
                  <span
                    className="small px-3 py-1 rounded-pill fw-semibold"
                    style={{
                      background: step === 2 ? 'linear-gradient(135deg, var(--neu-primary) 0%, var(--neu-primary-dark) 100%)' : 'var(--neu-bg)',
                      color: step === 2 ? '#fff' : 'var(--neu-text-muted)',
                      boxShadow: step === 2 ? '2px 2px 6px rgba(8, 75, 181, 0.35)' : 'var(--neu-shadow-sm)',
                      fontSize: '0.75rem',
                    }}
                  >
                    2. Location
                  </span>
                )}
              </div>
            )}
          </div>

          <h2 className="fw-bold mb-2" style={{ color: 'var(--neu-text)' }}>
            {getPageTitle()}
          </h2>
          <p className="text-muted small mb-4">
            {verificationPending
              ? `Enter the 6-digit confirmation code sent to ${email}.`
              : isSignUp
                ? step === 1
                  ? 'Select your account role and enter your registration details.'
                  : 'Provide your Philippine mobile and service coverage address.'
                : 'Sign in to access your services and transactions.'}
          </p>

          {message && (
            <div
              className="neu-alert p-3 mb-4 d-flex align-items-center gap-2"
              style={{
                background: 'rgba(17, 122, 62, 0.08)',
                borderLeft: '4px solid var(--neu-success)',
                color: 'var(--neu-success)',
                borderRadius: 'var(--neu-radius)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
              </svg>
              <span className="small fw-semibold">{message}</span>
            </div>
          )}

          {error && (
            <div
              className="neu-alert p-3 mb-4 d-flex align-items-center gap-2"
              style={{
                background: 'rgba(161, 32, 45, 0.08)',
                borderLeft: '4px solid var(--neu-danger)',
                color: 'var(--neu-danger)',
                borderRadius: 'var(--neu-radius)',
              }}
              role="alert"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z" />
              </svg>
              <span className="small fw-semibold">{error}</span>
            </div>
          )}

          {/* OTP Verification Screen */}
          {verificationPending ? (
            <Form onSubmit={handleSubmit}>
              <div className="neu-card-inset p-4 text-center mb-4">
                <div className="mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" fill="#063a8f" viewBox="0 0 16 16" className="opacity-75">
                    <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z" />
                  </svg>
                </div>
                <h5 className="fw-bold mb-2" style={{ color: 'var(--neu-text)' }}>
                  Enter Verification Code
                </h5>
                <p className="text-muted small mb-3">
                  Check your email ({email}) for your 6-digit OTP security code.
                </p>

                <Form.Control
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="• • • • • •"
                  className="neu-input text-center font-monospace fs-2 fw-bold mx-auto mb-2"
                  style={{ maxWidth: '280px', letterSpacing: '8px' }}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                />
                <small className="text-muted d-block">
                  Code expires in 10 minutes.
                </small>
              </div>

              <div className="d-grid gap-2">
                <Button
                  type="submit"
                  className="neu-btn-primary rounded-pill py-2 fw-bold"
                  disabled={isSubmitting || otp.length !== 6}
                >
                  {isSubmitting ? 'Verifying...' : 'Verify Email & Continue'}
                </Button>

                <div className="text-center mt-3">
                  <Button
                    variant="link"
                    className="neu-btn-ghost rounded-pill px-3 py-1 small text-decoration-none"
                    disabled={resendCooldown > 0 || isResending}
                    onClick={handleResendOtp}
                  >
                    {isResending
                      ? 'Sending code...'
                      : resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : "Didn't receive code? Resend Code"}
                  </Button>
                </div>
              </div>
            </Form>
          ) : isSignUp ? (
            /* Multi-Step Sign Up Form */
            <Form onSubmit={userType === 'Provider' && step === 1 ? handleNextStep : handleSubmit}>
              {step === 1 && (
                <>
                  {/* Account Type Selector (Neumorphic Segmented Control) */}
                  <div className="mb-4">
                    <label className="fw-semibold small mb-2 d-block" style={{ color: 'var(--neu-text)' }}>
                      Select Account Role <span className="text-danger">*</span>
                    </label>
                    <div
                      className="p-1 rounded-pill d-flex gap-2"
                      style={{
                        background: 'var(--neu-bg)',
                        boxShadow: 'var(--neu-shadow-inset)',
                      }}
                    >
                      <button
                        type="button"
                        className={`flex-grow-1 border-0 py-2 rounded-pill fw-semibold small transition-all ${
                          userType === 'Requestor'
                            ? 'neu-btn-primary text-white shadow-sm'
                            : 'neu-btn-ghost text-muted'
                        }`}
                        onClick={() => setUserType('Requestor')}
                      >
                        Requestor (Student)
                      </button>
                      <button
                        type="button"
                        className={`flex-grow-1 border-0 py-2 rounded-pill fw-semibold small transition-all ${
                          userType === 'Provider'
                            ? 'neu-btn-primary text-white shadow-sm'
                            : 'neu-btn-ghost text-muted'
                        }`}
                        onClick={() => setUserType('Provider')}
                      >
                        Provider (Services)
                      </button>
                    </div>
                  </div>

                  {/* Student ID */}
                  <Form.Group as={Row} className="mb-3 align-items-center" controlId="studentId">
                    <Form.Label column sm={4} className="text-sm-end fw-semibold small" style={{ color: 'var(--neu-text)' }}>
                      Student ID <span className="text-danger">*</span>
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Control
                        placeholder="e.g. MMC-1234 or 1234"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="neu-input"
                        required
                      />
                      <div className="d-flex justify-content-between mt-1 px-1">
                        <small className="text-muted" style={{ fontSize: '0.72rem' }}>Format: MMC-XXXX</small>
                        {studentId.trim() && (
                          <span
                            className="small fw-semibold"
                            style={{
                              fontSize: '0.72rem',
                              color: isStudentIdValid ? 'var(--neu-success)' : 'var(--neu-danger)',
                            }}
                          >
                            {isStudentIdValid ? '✓ Valid MMC ID' : '✗ Format: MMC-XXXX'}
                          </span>
                        )}
                      </div>
                    </Col>
                  </Form.Group>

                  {/* First Name & Last Name */}
                  <Form.Group as={Row} className="mb-3 align-items-center" controlId="firstName">
                    <Form.Label column sm={4} className="text-sm-end fw-semibold small" style={{ color: 'var(--neu-text)' }}>
                      First Name <span className="text-danger">*</span>
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Control
                        placeholder="First name"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="neu-input"
                        required
                      />
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="mb-3 align-items-center" controlId="lastName">
                    <Form.Label column sm={4} className="text-sm-end fw-semibold small" style={{ color: 'var(--neu-text)' }}>
                      Last Name <span className="text-danger">*</span>
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Control
                        placeholder="Last name"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="neu-input"
                        required
                      />
                    </Col>
                  </Form.Group>

                  {/* Username */}
                  <Form.Group as={Row} className="mb-3 align-items-center" controlId="username">
                    <Form.Label column sm={4} className="text-sm-end fw-semibold small" style={{ color: 'var(--neu-text)' }}>
                      Username <span className="text-danger">*</span>
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Control
                        placeholder="Choose username"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="neu-input"
                        required
                      />
                      {username.trim() && username.trim().length < 3 && (
                        <small className="text-danger d-block mt-1 px-1" style={{ fontSize: '0.72rem' }}>
                          At least 3 characters
                        </small>
                      )}
                    </Col>
                  </Form.Group>

                  {/* Email */}
                  <Form.Group as={Row} className="mb-3 align-items-center" controlId="email">
                    <Form.Label column sm={4} className="text-sm-end fw-semibold small" style={{ color: 'var(--neu-text)' }}>
                      Email Address <span className="text-danger">*</span>
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Control
                        type="email"
                        placeholder="your.email@example.com"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="neu-input"
                        required
                      />
                      {email.trim() && (
                        <div className="d-flex justify-content-end mt-1 px-1">
                          <span
                            className="small fw-semibold"
                            style={{
                              fontSize: '0.72rem',
                              color: isEmailValid ? 'var(--neu-success)' : 'var(--neu-danger)',
                            }}
                          >
                            {isEmailValid ? '✓ Valid email address' : '✗ Invalid email format'}
                          </span>
                        </div>
                      )}
                    </Col>
                  </Form.Group>

                  {/* Password with Strength Meter & Eye Toggle */}
                  <Form.Group as={Row} className="mb-4 align-items-start" controlId="password">
                    <Form.Label column sm={4} className="text-sm-end fw-semibold small pt-2" style={{ color: 'var(--neu-text)' }}>
                      Password <span className="text-danger">*</span>
                    </Form.Label>
                    <Col sm={8}>
                      <InputGroup>
                        <Form.Control
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create strong password"
                          autoComplete="new-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          minLength={8}
                          className="neu-input rounded-start"
                          required
                        />
                        <Button
                          variant="link"
                          onClick={() => setShowPassword(!showPassword)}
                          type="button"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="neu-btn-ghost d-flex align-items-center px-3"
                          style={{
                            borderTopLeftRadius: 0,
                            borderBottomLeftRadius: 0,
                            borderTopRightRadius: 'var(--neu-radius)',
                            borderBottomRightRadius: 'var(--neu-radius)',
                          }}
                        >
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                              <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                              <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                              <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                              <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                            </svg>
                          )}
                        </Button>
                      </InputGroup>

                      {/* Password Strength Progress Bar & Badges */}
                      {password && (
                        <div className="mt-2 p-2 rounded-3" style={{ background: 'var(--neu-bg-dark)', boxShadow: 'var(--neu-shadow-inset)' }}>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="small text-muted" style={{ fontSize: '0.72rem' }}>Password Strength:</span>
                            <span className={`small fw-bold text-${passwordStrength.variant}`} style={{ fontSize: '0.72rem' }}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <ProgressBar
                            now={passwordStrength.percent}
                            variant={passwordStrength.variant}
                            style={{ height: '5px', borderRadius: '4px' }}
                          />
                          <div className="d-flex flex-wrap gap-1 mt-2">
                            <span
                              className="badge"
                              style={{
                                background: passwordCriteria.hasMinLength ? 'var(--neu-success)' : 'var(--neu-bg)',
                                color: passwordCriteria.hasMinLength ? '#fff' : 'var(--neu-text-muted)',
                                boxShadow: 'var(--neu-shadow-sm)',
                                fontSize: '0.68rem',
                              }}
                            >
                              {passwordCriteria.hasMinLength ? '✓' : '○'} 8+ chars
                            </span>
                            <span
                              className="badge"
                              style={{
                                background: passwordCriteria.hasUpper ? 'var(--neu-success)' : 'var(--neu-bg)',
                                color: passwordCriteria.hasUpper ? '#fff' : 'var(--neu-text-muted)',
                                boxShadow: 'var(--neu-shadow-sm)',
                                fontSize: '0.68rem',
                              }}
                            >
                              {passwordCriteria.hasUpper ? '✓' : '○'} Uppercase
                            </span>
                            <span
                              className="badge"
                              style={{
                                background: passwordCriteria.hasNumber ? 'var(--neu-success)' : 'var(--neu-bg)',
                                color: passwordCriteria.hasNumber ? '#fff' : 'var(--neu-text-muted)',
                                boxShadow: 'var(--neu-shadow-sm)',
                                fontSize: '0.68rem',
                              }}
                            >
                              {passwordCriteria.hasNumber ? '✓' : '○'} Number
                            </span>
                            <span
                              className="badge"
                              style={{
                                background: passwordCriteria.hasSpecial ? 'var(--neu-success)' : 'var(--neu-bg)',
                                color: passwordCriteria.hasSpecial ? '#fff' : 'var(--neu-text-muted)',
                                boxShadow: 'var(--neu-shadow-sm)',
                                fontSize: '0.68rem',
                              }}
                            >
                              {passwordCriteria.hasSpecial ? '✓' : '○'} Special char
                            </span>
                          </div>
                        </div>
                      )}
                    </Col>
                  </Form.Group>

                  {/* Step 1 Actions */}
                  <div className="d-flex justify-content-end mt-4 pt-2 border-top" style={{ borderColor: 'rgba(154, 172, 196, 0.35)' }}>
                    {userType === 'Provider' ? (
                      <Button type="submit" className="neu-btn-primary rounded-pill px-4 py-2 fw-semibold">
                        Next: Provider Location &rarr;
                      </Button>
                    ) : (
                      <Button type="submit" className="neu-btn-primary rounded-pill w-100 py-2 fw-bold" disabled={isSubmitting}>
                        {isSubmitting ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    )}
                  </div>
                </>
              )}

              {step === 2 && userType === 'Provider' && (
                <>
                  <div className="neu-alert p-3 mb-4 d-flex align-items-center gap-2" style={{ background: 'rgba(8, 95, 166, 0.08)', borderLeft: '4px solid var(--neu-info)', borderRadius: 'var(--neu-radius)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="var(--neu-info)" viewBox="0 0 16 16">
                      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
                    </svg>
                    <span className="small fw-semibold" style={{ color: 'var(--neu-info)' }}>
                      Please specify your Philippine mobile contact and service coverage location.
                    </span>
                  </div>

                  {/* Contact Number */}
                  <Form.Group as={Row} className="mb-3 align-items-center" controlId="contactNumber">
                    <Form.Label column sm={4} className="text-sm-end fw-semibold small" style={{ color: 'var(--neu-text)' }}>
                      Mobile Number <span className="text-danger">*</span>
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Control
                        placeholder="0912 345 6789"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        className="neu-input"
                        required
                      />
                      {contactNumber.trim() && (
                        <div className="d-flex justify-content-end mt-1 px-1">
                          <span
                            className="small fw-semibold"
                            style={{
                              fontSize: '0.72rem',
                              color: isContactValid ? 'var(--neu-success)' : 'var(--neu-danger)',
                            }}
                          >
                            {isContactValid ? '✓ Valid PH mobile' : '✗ Format: 09XXXXXXXXX'}
                          </span>
                        </div>
                      )}
                    </Col>
                  </Form.Group>

                  {/* Philippine Address Cascading Dropdowns */}
                  {/* Region */}
                  <Form.Group as={Row} className="mb-3 align-items-center" controlId="region">
                    <Form.Label column sm={4} className="text-sm-end fw-semibold small" style={{ color: 'var(--neu-text)' }}>
                      Region <span className="text-danger">*</span>
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Select
                        value={selectedRegion}
                        onChange={(e) => handleRegionChange(e.target.value)}
                        className="neu-select w-100"
                        required
                      >
                        <option value="">Select Region...</option>
                        {philippineRegions.map((region) => (
                          <option key={region.code} value={region.name}>
                            {region.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Form.Group>

                  {/* Province */}
                  <Form.Group as={Row} className="mb-3 align-items-center" controlId="province">
                    <Form.Label column sm={4} className="text-sm-end fw-semibold small" style={{ color: 'var(--neu-text)' }}>
                      Province <span className="text-danger">*</span>
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Select
                        value={selectedProvince}
                        onChange={(e) => handleProvinceChange(e.target.value)}
                        disabled={!selectedRegion}
                        className="neu-select w-100"
                        required
                      >
                        <option value="">{selectedRegion ? 'Select Province...' : 'Select a Region first'}</option>
                        {provinceOptions.map((province) => (
                          <option key={province.name} value={province.name}>
                            {province.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Form.Group>

                  {/* City / Municipality */}
                  <Form.Group as={Row} className="mb-3 align-items-center" controlId="city">
                    <Form.Label column sm={4} className="text-sm-end fw-semibold small" style={{ color: 'var(--neu-text)' }}>
                      City / Municipality <span className="text-danger">*</span>
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Select
                        value={selectedCity}
                        onChange={(e) => handleCityChange(e.target.value)}
                        disabled={!selectedProvince}
                        className="neu-select w-100"
                        required
                      >
                        <option value="">{selectedProvince ? 'Select City/Municipality...' : 'Select a Province first'}</option>
                        {cityOptions.map((city) => (
                          <option key={city.name} value={city.name}>
                            {city.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Form.Group>

                  {/* Barangay */}
                  <Form.Group as={Row} className="mb-4 align-items-center" controlId="barangay">
                    <Form.Label column sm={4} className="text-sm-end fw-semibold small" style={{ color: 'var(--neu-text)' }}>
                      Barangay <span className="text-danger">*</span>
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Select
                        value={selectedBarangay}
                        onChange={(e) => setSelectedBarangay(e.target.value)}
                        disabled={!selectedCity}
                        className="neu-select w-100"
                        required
                      >
                        <option value="">{selectedCity ? 'Select Barangay...' : 'Select a City first'}</option>
                        {barangayOptions.map((brgy) => (
                          <option key={brgy} value={brgy}>
                            {brgy}
                          </option>
                        ))}
                        <option value="Other">Other / Not Listed</option>
                      </Form.Select>

                      {selectedBarangay === 'Other' && (
                        <Form.Control
                          className="neu-input mt-2"
                          placeholder="Enter your Barangay name"
                          value={customBarangay}
                          onChange={(e) => setCustomBarangay(e.target.value)}
                          required
                        />
                      )}
                    </Col>
                  </Form.Group>

                  {/* Step 2 Actions */}
                  <div className="d-flex justify-content-between mt-4 pt-2 border-top" style={{ borderColor: 'rgba(154, 172, 196, 0.35)' }}>
                    <Button
                      type="button"
                      className="neu-btn-ghost rounded-pill px-4 py-2"
                      onClick={() => {
                        setError('');
                        setStep(1);
                      }}
                    >
                      &larr; Back
                    </Button>
                    <Button
                      type="submit"
                      className="neu-btn-primary rounded-pill px-4 py-2 fw-semibold"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
                    </Button>
                  </div>
                </>
              )}
            </Form>
          ) : (
            /* Sign In View with Remember Me */
            <Form onSubmit={handleSubmit}>
              <Form.Group as={Row} className="mb-3 align-items-center" controlId="loginEmail">
                <Form.Label column sm={4} className="text-sm-end fw-semibold small" style={{ color: 'var(--neu-text)' }}>
                  Email Address
                </Form.Label>
                <Col sm={8}>
                  <Form.Control
                    type="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="neu-input"
                    required
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="mb-3 align-items-center" controlId="loginPassword">
                <Form.Label column sm={4} className="text-sm-end fw-semibold small" style={{ color: 'var(--neu-text)' }}>
                  Password
                </Form.Label>
                <Col sm={8}>
                  <InputGroup>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="neu-input rounded-start"
                      required
                    />
                    <Button
                      variant="link"
                      onClick={() => setShowPassword(!showPassword)}
                      type="button"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="neu-btn-ghost d-flex align-items-center px-3"
                      style={{
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        borderTopRightRadius: 'var(--neu-radius)',
                        borderBottomRightRadius: 'var(--neu-radius)',
                      }}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                          <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                          <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                          <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                        </svg>
                      )}
                    </Button>
                  </InputGroup>
                </Col>
              </Form.Group>

              {/* Remember Me Checkbox */}
              <Row className="mb-4">
                <Col sm={{ span: 8, offset: 4 }}>
                  <Form.Check
                    type="checkbox"
                    id="rememberMeCheckbox"
                    label="Remember me on this device"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="text-muted small"
                  />
                </Col>
              </Row>

              <Button
                type="submit"
                className="neu-btn-primary rounded-pill w-100 py-2 fw-bold"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Button>
            </Form>
          )}

          {!verificationPending && (
            <div className="text-center mt-4 pt-3 border-top" style={{ borderColor: 'rgba(154, 172, 196, 0.35)' }}>
              <span className="text-muted small">
                {isSignUp ? 'Already have an account? ' : 'New to SerbisYou? '}
              </span>
              <Link
                to={isSignUp ? '/sign-in' : '/sign-up'}
                className="fw-bold small text-decoration-none ms-1"
                style={{ color: '#063a8f' }}
              >
                {isSignUp ? 'Sign in' : 'Create an account'}
              </Link>
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
