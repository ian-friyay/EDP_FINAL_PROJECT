import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Col, Container, Form, InputGroup, Row } from 'react-bootstrap';
import api from '../api/axios';

const passwordPolicyMessage =
  'At least 8 characters with an uppercase letter, a number, and 1-2 special symbols.';

export default function AuthPage({ mode }) {
  const isSignUp = mode === 'sign-up';
  const location = useLocation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState('Requestor');
  const [studentId, setStudentId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Provider specific details
  const [contactNumber, setContactNumber] = useState('');
  const [region, setRegion] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [barangay, setBarangay] = useState('');

  // OTP Verification
  const [otp, setOtp] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);

  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const validateStepOne = () => {
    if (!studentId.trim()) return 'Student ID is required.';
    if (!firstName.trim()) return 'First name is required.';
    if (!lastName.trim()) return 'Last name is required.';
    if (!username.trim()) return 'Username is required.';
    if (!email.trim()) return 'Email address is required.';
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    return null;
  };

  const validateStepTwo = () => {
    if (!contactNumber.trim()) return 'Contact number is required.';
    if (!region.trim()) return 'Region is required.';
    if (!province.trim()) return 'Province is required.';
    if (!city.trim()) return 'City is required.';
    if (!barangay.trim()) return 'Barangay is required.';
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (verificationPending) {
      setIsSubmitting(true);
      try {
        await api.post('/auth/verify-otp', { email, otp });
        setVerificationPending(false);
        setOtp('');
        navigate('/sign-in', {
          replace: true,
          state: { message: 'Email verified. You can now sign in.' },
        });
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Verification failed.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (isSignUp) {
      const stepOneError = validateStepOne();
      if (stepOneError) {
        setStep(1);
        setError(stepOneError);
        return;
      }

      if (userType === 'Provider') {
        const stepTwoError = validateStepTwo();
        if (stepTwoError) {
          setStep(2);
          setError(stepTwoError);
          return;
        }
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
          contact_number: contactNumber,
          region,
          province,
          city,
          barangay,
          user_type: userType,
        });
        setVerificationPending(true);
        setMessage('We sent a 6-digit verification code to your email.');
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Registration failed.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Sign in flow
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
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPageTitle = () => {
    if (verificationPending) return 'Verify Your Email';
    if (!isSignUp) return 'Welcome Back';
    return userType === 'Provider' && step === 2
      ? 'Provider Information'
      : 'Create Your Account';
  };

  return (
    <main className="min-vh-100 bg-light py-5">
      <Container className="d-flex justify-content-center">
        <Card
          className="w-100 border-0 shadow-sm"
          style={{ maxWidth: isSignUp && !verificationPending ? '680px' : '500px' }}
        >
          <Card.Body className="p-4 p-md-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Link to="/" className="text-decoration-none fw-bold fs-4 text-primary">
                SerbisYou
              </Link>
              {isSignUp && !verificationPending && (
                <span className="badge bg-light text-primary border px-3 py-2">
                  {userType === 'Provider' ? `Step ${step} of 2` : 'Step 1 of 1'}
                </span>
              )}
            </div>

            <h1 className="h3 mb-2">{getPageTitle()}</h1>
            <p className="text-muted mb-4">
              {verificationPending
                ? `Enter the 6-digit code sent to ${email}.`
                : isSignUp
                  ? step === 1
                    ? 'Select your account role and enter your basic details.'
                    : 'Provide your contact and service location details.'
                  : 'Sign in to access your dashboard.'}
            </p>

            {message && <Alert variant="success">{message}</Alert>}
            {error && <Alert variant="danger" role="alert">{error}</Alert>}

            {/* Email OTP Verification View */}
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
                      placeholder="6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </Col>
                </Form.Group>
                <Button type="submit" className="w-100" disabled={isSubmitting}>
                  {isSubmitting ? 'Verifying...' : 'Verify Email'}
                </Button>
              </Form>
            ) : isSignUp ? (
              /* Sign Up Multi-Step View */
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
                            Requestor
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
                        <Form.Control
                          placeholder="e.g. MMC-1234 or 1234"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          required
                        />
                        <Form.Text className="text-muted">Format: MMC-XXXX</Form.Text>
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
                          placeholder="Choose a username"
                          autoComplete="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                        />
                      </Col>
                    </Form.Group>

                    {/* Email */}
                    <Form.Group as={Row} className="mb-3 align-items-center" controlId="email">
                      <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
                        Email <span className="text-danger">*</span>
                      </Form.Label>
                      <Col sm={8}>
                        <Form.Control
                          type="email"
                          placeholder="your.email@example.com"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </Col>
                    </Form.Group>

                    {/* Password */}
                    <Form.Group as={Row} className="mb-4 align-items-center" controlId="password">
                      <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
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
                        <Form.Text className="text-muted">{passwordPolicyMessage}</Form.Text>
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
                      Please enter your service contact and location information.
                    </div>

                    {/* Contact Number */}
                    <Form.Group as={Row} className="mb-3 align-items-center" controlId="contactNumber">
                      <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
                        Contact Number <span className="text-danger">*</span>
                      </Form.Label>
                      <Col sm={8}>
                        <Form.Control
                          placeholder="+63 912 345 6789"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          required
                        />
                      </Col>
                    </Form.Group>

                    {/* Region */}
                    <Form.Group as={Row} className="mb-3 align-items-center" controlId="region">
                      <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
                        Region <span className="text-danger">*</span>
                      </Form.Label>
                      <Col sm={8}>
                        <Form.Control
                          placeholder="e.g. NCR"
                          value={region}
                          onChange={(e) => setRegion(e.target.value)}
                          required
                        />
                      </Col>
                    </Form.Group>

                    {/* Province */}
                    <Form.Group as={Row} className="mb-3 align-items-center" controlId="province">
                      <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
                        Province <span className="text-danger">*</span>
                      </Form.Label>
                      <Col sm={8}>
                        <Form.Control
                          placeholder="e.g. Metro Manila"
                          value={province}
                          onChange={(e) => setProvince(e.target.value)}
                          required
                        />
                      </Col>
                    </Form.Group>

                    {/* City */}
                    <Form.Group as={Row} className="mb-3 align-items-center" controlId="city">
                      <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
                        City / Municipality <span className="text-danger">*</span>
                      </Form.Label>
                      <Col sm={8}>
                        <Form.Control
                          placeholder="e.g. Quezon City"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          required
                        />
                      </Col>
                    </Form.Group>

                    {/* Barangay */}
                    <Form.Group as={Row} className="mb-4 align-items-center" controlId="barangay">
                      <Form.Label column sm={4} className="text-sm-end fw-semibold text-secondary">
                        Barangay <span className="text-danger">*</span>
                      </Form.Label>
                      <Col sm={8}>
                        <Form.Control
                          placeholder="e.g. Barangay Central"
                          value={barangay}
                          onChange={(e) => setBarangay(e.target.value)}
                          required
                        />
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
              /* Sign In View */
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

                <Form.Group as={Row} className="mb-4 align-items-center" controlId="loginPassword">
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
