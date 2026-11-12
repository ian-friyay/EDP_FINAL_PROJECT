import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Container, Form } from 'react-bootstrap';
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
                    <Form.Control
                      type="password"
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      minLength={isSignUp ? 8 : undefined}
                      required
                    />
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
