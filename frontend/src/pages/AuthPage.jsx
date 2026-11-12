import { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Col, Container, Form, InputGroup, ProgressBar, Row } from 'react-bootstrap';
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
    <main className="min-vh-100 bg-light py-5">
      <Container className="d-flex justify-content-center">
        <Card
          className="w-100 border-0 shadow-sm"
          style={{ maxWidth: isSignUp && !verificationPending ? '720px' : '520px' }}
        >
          <Card.Body className="p-4 p-md-5">
            {/* Header bar */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Link to="/" className="text-decoration-none fw-bold fs-4 text-primary">
                SerbisYou
              </Link>
              {isSignUp && !verificationPending && (
                <div className="d-flex align-items-center gap-2">
                  <span className={`badge ${step === 1 ? 'bg-primary text-white' : 'bg-light text-secondary border'}`}>
                    1. Basic Info
                  </span>
                  {userType === 'Provider' && (
                    <span className={`badge ${step === 2 ? 'bg-primary text-white' : 'bg-light text-secondary border'}`}>
                      2. Provider Details
                    </span>
                  )}
                </div>
              )}
            </div>

            <h1 className="h3 mb-2">{getPageTitle()}</h1>
            <p className="text-muted mb-4">
              {verificationPending
                ? `Enter the 6-digit code sent to ${email}.`
                : isSignUp
                  ? step === 1
                    ? 'Select your account role and enter your account information.'
                    : 'Provide your Philippine contact and address details.'
                  : 'Sign in to access your SerbisYou services.'}
            </p>

            {message && <Alert variant="success" className="d-flex align-items-center">{message}</Alert>}
            {error && <Alert variant="danger" role="alert">{error}</Alert>}

            {/* OTP Verification Screen */}
            {verificationPending ? (
              <Form onSubmit={handleSubmit}>
                <Form.Group as={Row} className="mb-4 align-items-center" controlId="otp">
                  <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
                    Verification Code
                  </Form.Label>
                  <Col sm={8}>
                    <Form.Control
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      placeholder="Enter 6-digit code"
                      className="text-center fs-4 letter-spacing-2"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                    <Form.Text className="text-muted">
                      Code expires in 10 minutes. Check your inbox or spam folder.
                    </Form.Text>
                  </Col>
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button type="submit" variant="primary" disabled={isSubmitting || otp.length !== 6}>
                    {isSubmitting ? 'Verifying...' : 'Verify Email & Complete'}
                  </Button>

                  <div className="text-center mt-2">
                    <Button
                      variant="link"
                      className="text-decoration-none small text-muted"
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
              /* Sign Up Form */
              <Form onSubmit={userType === 'Provider' && step === 1 ? handleNextStep : handleSubmit}>
                {step === 1 && (
                  <>
                    {/* Account Type Selector */}
                    <Form.Group as={Row} className="mb-4 align-items-center" controlId="userType">
                      <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
                        Account Type <span className="text-danger">*</span>
                      </Form.Label>
                      <Col sm={8}>
                        <div className="btn-group w-100" role="group">
                          <button
                            type="button"
                            className={`btn py-2 ${userType === 'Requestor' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setUserType('Requestor')}
                          >
                            Requestor (Student)
                          </button>
                          <button
                            type="button"
                            className={`btn py-2 ${userType === 'Provider' ? 'btn-primary' : 'btn-outline-secondary'}`}
                            onClick={() => setUserType('Provider')}
                          >
                            Provider (Services)
                          </button>
                        </div>
                      </Col>
                    </Form.Group>

                    {/* Student ID */}
                    <Form.Group as={Row} className="mb-3 align-items-center" controlId="studentId">
                      <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
                        Student ID <span className="text-danger">*</span>
                      </Form.Label>
                      <Col sm={8}>
                        <InputGroup>
                          <Form.Control
                            placeholder="e.g. MMC-1234 or 1234"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            isValid={studentId.trim() && isStudentIdValid}
                            isInvalid={studentId.trim() && !isStudentIdValid}
                            required
                          />
                        </InputGroup>
                        <div className="d-flex justify-content-between mt-1">
                          <Form.Text className="text-muted">Must follow MMC-XXXX format</Form.Text>
                          {studentId.trim() && (
                            <span className={`small ${isStudentIdValid ? 'text-success' : 'text-danger'}`}>
                              {isStudentIdValid ? '✓ Valid format' : '✗ Use MMC-XXXX'}
                            </span>
                          )}
                        </div>
                      </Col>
                    </Form.Group>

                    {/* First Name */}
                    <Form.Group as={Row} className="mb-3 align-items-center" controlId="firstName">
                      <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
                        First Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Col sm={8}>
                        <Form.Control
                          placeholder="First name"
                          autoComplete="given-name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          isValid={firstName.trim().length >= 2}
                          required
                        />
                      </Col>
                    </Form.Group>

                    {/* Last Name */}
                    <Form.Group as={Row} className="mb-3 align-items-center" controlId="lastName">
                      <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
                        Last Name <span className="text-danger">*</span>
                      </Form.Label>
                      <Col sm={8}>
                        <Form.Control
                          placeholder="Last name"
                          autoComplete="family-name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          isValid={lastName.trim().length >= 2}
                          required
                        />
                      </Col>
                    </Form.Group>

                    {/* Username */}
                    <Form.Group as={Row} className="mb-3 align-items-center" controlId="username">
                      <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
                        Username <span className="text-danger">*</span>
                      </Form.Label>
                      <Col sm={8}>
                        <Form.Control
                          placeholder="Choose username"
                          autoComplete="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          isValid={username.trim().length >= 3}
                          required
                        />
                        {username.trim() && username.trim().length < 3 && (
                          <Form.Text className="text-danger">At least 3 characters</Form.Text>
                        )}
                      </Col>
                    </Form.Group>

                    {/* Email */}
                    <Form.Group as={Row} className="mb-3 align-items-center" controlId="email">
                      <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
                        Email Address <span className="text-danger">*</span>
                      </Form.Label>
                      <Col sm={8}>
                        <Form.Control
                          type="email"
                          placeholder="your.email@example.com"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          isValid={email.trim() && isEmailValid}
                          isInvalid={email.trim() && !isEmailValid}
                          required
                        />
                        {email.trim() && (
                          <div className="d-flex justify-content-end mt-1">
                            <span className={`small ${isEmailValid ? 'text-success' : 'text-danger'}`}>
                              {isEmailValid ? '✓ Valid email address' : '✗ Invalid email format'}
                            </span>
                          </div>
                        )}
                      </Col>
                    </Form.Group>

                    {/* Password with Strength Meter & Eye Toggle */}
                    <Form.Group as={Row} className="mb-4 align-items-start" controlId="password">
                      <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary pt-2">
                        Password <span className="text-danger">*</span>
                      </Form.Label>
                      <Col sm={8}>
                        <InputGroup>
                          <Form.Control
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={8}
                            required
                          />
                          <Button
                            variant="outline-secondary"
                            onClick={() => setShowPassword(!showPassword)}
                            type="button"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="d-flex align-items-center px-3"
                          >
                            {showPassword ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                                <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                                <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                              </svg>
                            )}
                          </Button>
                        </InputGroup>

                        {/* Password Strength Progress Bar */}
                        {password && (
                          <div className="mt-2">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="small text-muted">Password Strength:</span>
                              <span className={`small fw-bold text-${passwordStrength.variant}`}>
                                {passwordStrength.label}
                              </span>
                            </div>
                            <ProgressBar
                              now={passwordStrength.percent}
                              variant={passwordStrength.variant}
                              style={{ height: '6px' }}
                            />
                            <div className="d-flex flex-wrap gap-2 mt-2">
                              <span className={`badge ${passwordCriteria.hasMinLength ? 'bg-success' : 'bg-light text-muted border'}`}>
                                {passwordCriteria.hasMinLength ? '✓' : '○'} 8+ chars
                              </span>
                              <span className={`badge ${passwordCriteria.hasUpper ? 'bg-success' : 'bg-light text-muted border'}`}>
                                {passwordCriteria.hasUpper ? '✓' : '○'} Uppercase
                              </span>
                              <span className={`badge ${passwordCriteria.hasNumber ? 'bg-success' : 'bg-light text-muted border'}`}>
                                {passwordCriteria.hasNumber ? '✓' : '○'} Number
                              </span>
                              <span className={`badge ${passwordCriteria.hasSpecial ? 'bg-success' : 'bg-light text-muted border'}`}>
                                {passwordCriteria.hasSpecial ? '✓' : '○'} Special symbol
                              </span>
                            </div>
                          </div>
                        )}
                      </Col>
                    </Form.Group>

                    {/* Step 1 Actions */}
                    <div className="d-flex justify-content-end mt-4">
                      {userType === 'Provider' ? (
                        <Button type="submit" variant="primary" className="px-4">
                          Next: Provider Details &rarr;
                        </Button>
                      ) : (
                        <Button type="submit" variant="primary" className="w-100" disabled={isSubmitting}>
                          {isSubmitting ? 'Creating Account...' : 'Create Account'}
                        </Button>
                      )}
                    </div>
                  </>
                )}

                {step === 2 && userType === 'Provider' && (
                  <>
                    <div className="alert alert-info py-2 small mb-4">
                      Please specify your Philippine contact number and service coverage location.
                    </div>

                    {/* Contact Number */}
                    <Form.Group as={Row} className="mb-3 align-items-center" controlId="contactNumber">
                      <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
                        Mobile Number <span className="text-danger">*</span>
                      </Form.Label>
                      <Col sm={8}>
                        <Form.Control
                          placeholder="0912 345 6789"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          isValid={contactNumber.trim() && isContactValid}
                          isInvalid={contactNumber.trim() && !isContactValid}
                          required
                        />
                        {contactNumber.trim() && (
                          <div className="d-flex justify-content-end mt-1">
                            <span className={`small ${isContactValid ? 'text-success' : 'text-danger'}`}>
                              {isContactValid ? '✓ Valid PH mobile' : '✗ Format: 09XXXXXXXXX'}
                            </span>
                          </div>
                        )}
                      </Col>
                    </Form.Group>

                    {/* Philippine Address Cascading Dropdowns */}
                    {/* Region */}
                    <Form.Group as={Row} className="mb-3 align-items-center" controlId="region">
                      <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
                        Region <span className="text-danger">*</span>
                      </Form.Label>
                      <Col sm={8}>
                        <Form.Select
                          value={selectedRegion}
                          onChange={(e) => handleRegionChange(e.target.value)}
                          isValid={!!selectedRegion}
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
                      <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
                        Province <span className="text-danger">*</span>
                      </Form.Label>
                      <Col sm={8}>
                        <Form.Select
                          value={selectedProvince}
                          onChange={(e) => handleProvinceChange(e.target.value)}
                          disabled={!selectedRegion}
                          isValid={!!selectedProvince}
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
                      <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
                        City / Municipality <span className="text-danger">*</span>
                      </Form.Label>
                      <Col sm={8}>
                        <Form.Select
                          value={selectedCity}
                          onChange={(e) => handleCityChange(e.target.value)}
                          disabled={!selectedProvince}
                          isValid={!!selectedCity}
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
                      <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
                        Barangay <span className="text-danger">*</span>
                      </Form.Label>
                      <Col sm={8}>
                        <Form.Select
                          value={selectedBarangay}
                          onChange={(e) => setSelectedBarangay(e.target.value)}
                          disabled={!selectedCity}
                          isValid={selectedBarangay && selectedBarangay !== 'Other'}
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
                            className="mt-2"
                            placeholder="Enter your Barangay name"
                            value={customBarangay}
                            onChange={(e) => setCustomBarangay(e.target.value)}
                            required
                          />
                        )}
                      </Col>
                    </Form.Group>

                    {/* Step 2 Actions */}
                    <div className="d-flex justify-content-between mt-4">
                      <Button
                        type="button"
                        variant="outline-secondary"
                        onClick={() => {
                          setError('');
                          setStep(1);
                        }}
                      >
                        &larr; Back
                      </Button>
                      <Button type="submit" variant="primary" className="px-4" disabled={isSubmitting}>
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
                  <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
                    Email
                  </Form.Label>
                  <Col sm={8}>
                    <Form.Control
                      type="email"
                      placeholder="Enter your email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Col>
                </Form.Group>

                <Form.Group as={Row} className="mb-3 align-items-center" controlId="loginPassword">
                  <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
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
                        required
                      />
                      <Button
                        variant="outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="d-flex align-items-center px-3"
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                            <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                            <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
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

                <Button type="submit" className="w-100" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>
              </Form>
            )}

            {!verificationPending && (
              <div className="text-center mt-4">
                {isSignUp ? 'Already have an account? ' : 'New to SerbisYou? '}
                <Link to={isSignUp ? '/sign-in' : '/sign-up'}>
                  {isSignUp ? 'Sign in' : 'Create an account'}
                </Link>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </main>
  );
}
