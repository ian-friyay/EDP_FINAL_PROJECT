import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Container, Form, InputGroup } from 'react-bootstrap';
import api from '../api/axios';

const passwordPolicyMessage =
  'Use at least 8 characters, including an uppercase letter, a number, and 1-2 special characters. Spaces are not allowed.';

export default function AuthPage({ mode }) {
  const isSignUp = mode === 'sign-up';
  const location = useLocation();
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [region, setRegion] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [barangay, setBarangay] = useState('');
  const [userType, setUserType] = useState('Requestor');
  const [otp, setOtp] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === 'sign-in') {
      setVerificationPending(false);
      setOtp('');
      setError('');
      if (location.state?.message) {
        setMessage(location.state.message);
      }
    } else {
      setError('');
    }
  }, [mode, location.pathname, location.state]);

  const getRequestError = (requestError) =>
    requestError.response?.data?.error ||
    'Could not reach the server. Check that the backend is running and try again.';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      if (verificationPending) {
        await api.post('/auth/verify-otp', { email, otp });
        setVerificationPending(false);
        setOtp('');
        navigate('/sign-in', {
          replace: true,
          state: { message: 'Email verified. You can now sign in.' },
        });
        return;
      }

      if (isSignUp) {
        let normalizedStudentId = studentId.trim().toUpperCase();
        if (/^\d{1,4}$/.test(normalizedStudentId)) {
          normalizedStudentId = `MMC-${normalizedStudentId.padStart(4, '0')}`;
        }

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
        return;
      }

      const { data } = await api.post('/auth/login', { email, password });
      if (typeof data.token !== 'string' || !data.token) {
        throw new Error('The server did not return an authentication token.');
      }
      if (typeof data.user?.user_id !== 'string') {
        throw new Error('The server did not return the signed-in user.');
      }

      window.localStorage.setItem('token', data.token);
      window.localStorage.setItem('user_id', data.user.user_id);
      window.localStorage.setItem('user', JSON.stringify(data.user));
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(
        requestError.response
          ? getRequestError(requestError)
          : requestError.message || 'The request failed. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = verificationPending
    ? 'Verify your email'
    : isSignUp
      ? 'Create your account'
      : 'Welcome back';

  return (
    <main className="min-vh-100 bg-light py-5">
      <Container className="d-flex justify-content-center">
        <Card className="w-100 border-0 shadow-sm" style={{ maxWidth: '520px' }}>
          <Card.Body className="p-4 p-md-5">
            <Link to="/" className="text-decoration-none fw-bold text-primary">
              SerbisYou
            </Link>
            <h1 className="h3 mt-4 mb-2">{title}</h1>
            <p className="text-muted mb-4">
              {verificationPending
                ? `Enter the 6-digit code sent to ${email}.`
                : isSignUp
                  ? 'Sign up to connect with your local service marketplace.'
                  : 'Sign in to continue to your account.'}
            </p>

            {message && <Alert variant="success">{message}</Alert>}
            {error && <Alert variant="danger" role="alert">{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              {isSignUp && !verificationPending && (
                <>
                  <Form.Group className="mb-3" controlId="studentId">
                    <Form.Label>Student ID <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      placeholder="e.g. MMC-1234 or 1234"
                      value={studentId}
                      onChange={(event) => setStudentId(event.target.value)}
                      required
                    />
                    <Form.Text className="text-muted">Must be in MMC-XXXX format (e.g. MMC-1234).</Form.Text>
                  </Form.Group>

                  <div className="row">
                    <Form.Group className="col-md-6 mb-3" controlId="firstName">
                      <Form.Label>First name</Form.Label>
                      <Form.Control
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        required
                      />
                    </Form.Group>
                    <Form.Group className="col-md-6 mb-3" controlId="lastName">
                      <Form.Label>Last name</Form.Label>
                      <Form.Control
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        required
                      />
                    </Form.Group>
                  </div>
                  <Form.Group className="mb-3" controlId="username">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                      autoComplete="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="userType">
                    <Form.Label>Account type</Form.Label>
                    <Form.Select
                      value={userType}
                      onChange={(event) => setUserType(event.target.value)}
                    >
                      <option value="Requestor">Requestor</option>
                      <option value="Provider">Provider (Services)</option>
                    </Form.Select>
                  </Form.Group>

                  {userType === 'Provider' && (
                    <div className="border rounded-3 p-3 bg-light mb-3">
                      <h6 className="fw-bold small text-uppercase text-primary mb-3">
                        Provider Address &amp; Contact Info (Required)
                      </h6>
                      <Form.Group className="mb-3" controlId="contactNumber">
                        <Form.Label>Contact Number <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          placeholder="+63 912 345 6789"
                          value={contactNumber}
                          onChange={(event) => setContactNumber(event.target.value)}
                          required={userType === 'Provider'}
                        />
                      </Form.Group>

                      <div className="row">
                        <Form.Group className="col-md-6 mb-3" controlId="region">
                          <Form.Label>Region <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            placeholder="e.g. NCR"
                            value={region}
                            onChange={(event) => setRegion(event.target.value)}
                            required={userType === 'Provider'}
                          />
                        </Form.Group>
                        <Form.Group className="col-md-6 mb-3" controlId="province">
                          <Form.Label>Province <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            placeholder="e.g. Metro Manila"
                            value={province}
                            onChange={(event) => setProvince(event.target.value)}
                            required={userType === 'Provider'}
                          />
                        </Form.Group>
                      </div>

                      <div className="row">
                        <Form.Group className="col-md-6 mb-3" controlId="city">
                          <Form.Label>City <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            placeholder="e.g. Quezon City"
                            value={city}
                            onChange={(event) => setCity(event.target.value)}
                            required={userType === 'Provider'}
                          />
                        </Form.Group>
                        <Form.Group className="col-md-6 mb-3" controlId="barangay">
                          <Form.Label>Barangay <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            placeholder="e.g. Brgy. Central"
                            value={barangay}
                            onChange={(event) => setBarangay(event.target.value)}
                            required={userType === 'Provider'}
                          />
                        </Form.Group>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!verificationPending && (
                <>
                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3" controlId="password">
                    <Form.Label>Password</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={isSignUp ? 'new-password' : 'current-password'}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        minLength={isSignUp ? 8 : undefined}
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
                          /* Eye Slash Icon */
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                            <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                            <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                          </svg>
                        ) : (
                          /* Eye Icon */
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                            <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                          </svg>
                        )}
                      </Button>
                    </InputGroup>
                    {isSignUp && (
                      <Form.Text className="text-muted">{passwordPolicyMessage}</Form.Text>
                    )}
                  </Form.Group>
                </>
              )}

              {verificationPending && (
                <Form.Group className="mb-3" controlId="otp">
                  <Form.Label>Verification code</Form.Label>
                  <Form.Control
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
                    required
                  />
                </Form.Group>
              )}

              <Button
                type="submit"
                className="w-100 mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Please wait...'
                  : verificationPending
                    ? 'Verify email'
                    : isSignUp
                      ? 'Create account'
                      : 'Sign in'}
              </Button>
            </Form>

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
