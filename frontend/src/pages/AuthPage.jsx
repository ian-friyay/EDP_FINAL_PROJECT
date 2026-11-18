import { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Col, Container, Form, InputGroup, ProgressBar, Row, Modal } from 'react-bootstrap';
import api from '../api/axios';
import { philippineRegions } from '../data/philippinesLocations';

export default function AuthPage({ mode }) {
  const isSignUp = mode === 'sign-up';
  const location = useLocation();
  const navigate = useNavigate();

  // Role toggle: 'student' or 'admin'
  const [role, setRole] = useState('student');
  const [adminExists, setAdminExists] = useState(false);

  // Navigation and form steps
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState('Requestor'); // 'Requestor' or 'Provider'

  // Core Credentials & Profile
  const [studentId, setStudentId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Admin Specific Credentials
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');

  // Provider Specific Credentials (Categories & Subcategories)
  const [serviceCategories, setServiceCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  // Photos (Profile Photo & Student ID Photo)
  const [profileImage, setProfileImage] = useState('');
  const [idImage, setIdImage] = useState('');

  // Location
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

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotDevOtp, setForgotDevOtp] = useState('');
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  // Check admin existence on mount
  useEffect(() => {
    api.get('/admin/exists')
      .then((res) => {
        if (res.data?.exists) {
          setAdminExists(true);
        }
      })
      .catch(() => {});
  }, []);


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

  // Categories & Subcategories Handlers
  const handleCategoryToggle = (category) => {
    if (serviceCategories.includes(category)) {
      setServiceCategories(serviceCategories.filter((c) => c !== category));
      // Remove related subcategories
      if (category === 'Creative') setSubcategories(subcategories.filter((s) => s !== 'Graphic Designer' && s !== 'Art Painter'));
      if (category === 'Event Support') setSubcategories(subcategories.filter((s) => s !== 'Make-up artist' && s !== 'Event Hosts'));
      if (category === 'Digital Service') setSubcategories(subcategories.filter((s) => s !== 'Photographers' && s !== 'Video Editors'));
    } else {
      setServiceCategories([...serviceCategories, category]);
    }
  };

  const handleSubcategoryToggle = (subcat) => {
    if (subcategories.includes(subcat)) {
      setSubcategories(subcategories.filter((s) => s !== subcat));
    } else {
      setSubcategories([...subcategories, subcat]);
    }
  };

  // Image Upload Handlers (FileReader base64)
  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Profile photo must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Student ID verification photo must be less than 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Password Strength Calculation
  const passwordCriteria = useMemo(() => {
    return {
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    };
  }, [password]);

  const passwordStrength = useMemo(() => {
    if (!password) {
      return { score: 0, label: 'Empty', variant: 'secondary', percent: 0 };
    }
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
    if (role === 'admin') {
      if (adminExists) return 'A primary administrator account already exists. Only 1 administrator is permitted.';
      if (!firstName.trim()) return 'First name is required.';
      if (!lastName.trim()) return 'Last name is required.';
      if (username.trim().length < 3) return 'Username must be at least 3 characters.';
      if (!isEmailValid) return 'Please enter a valid email address.';
      if (!department.trim()) return 'Department is required for Administrator.';
      if (!designation.trim()) return 'Designation is required for Administrator.';
      if (!password || password.length < 8) return 'Password must be at least 8 characters.';
      if (password !== confirmPassword) return 'Passwords do not match.';
      if (!termsAccepted) return 'Please agree to the Terms & Conditions.';
      return null;
    }

    // Student validation
    if (!studentId.trim()) return 'Student ID is required.';
    if (!isStudentIdValid) return 'Student ID must be in MMC-XXXX format (e.g. MMC-1234).';
    if (!firstName.trim()) return 'First name is required (letters only, min 4).';
    if (!lastName.trim()) return 'Last name is required (letters only, min 4).';
    if (username.trim().length < 3) return 'Username must be at least 3 characters.';
    if (!isEmailValid) return 'Please enter a valid email address.';
    if (!password || password.length < 8) return 'Password must be at least 8 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';

    if (userType === 'Provider') {
      if (serviceCategories.length === 0) return 'Providers must select at least one service category.';
      if (subcategories.length === 0) return 'Providers must select at least one subcategory.';
    }

    return null;
  };

  // Step 2 Validation (Location & Terms)
  const validateStepTwo = () => {
    if (!contactNumber.trim()) return 'Contact number is required.';
    if (!isContactValid) return 'Enter a valid Philippine mobile number (e.g. 09XXXXXXXXX).';
    if (!selectedRegion) return 'Please select a region.';
    if (!selectedProvince) return 'Please select a province.';
    if (!selectedCity) return 'Please select a city or municipality.';
    const finalBarangay = selectedBarangay === 'Other' ? customBarangay.trim() : selectedBarangay;
    if (!finalBarangay) return 'Please select or specify your barangay.';
    if (!termsAccepted) return 'Please agree to the Terms & Conditions.';
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
        setMessage('Verification successful! You can now log in.');
        setVerificationPending(false);
        navigate('/sign-in', {
          state: { message: 'Your account is verified! Please sign in.' },
        });
      } catch (err) {
        setError(err.response?.data?.error || err.message || 'Invalid or expired verification code.');
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

      // If Admin Registration
      if (role === 'admin') {
        setIsSubmitting(true);
        try {
          await api.post('/auth/register', {
            role: 'admin',
            user_type: 'Admin',
            first_name: firstName,
            last_name: lastName,
            username,
            contact_number: contactNumber.replace(/[\s-]/g, '') || '09000000000',
            email,
            password,
            department,
            designation,
          });

          setVerificationPending(true);
          setResendCooldown(60);
          setMessage('Administrator account registered! Please enter the 6-digit verification code sent to your email.');
        } catch (err) {
          setError(err.response?.data?.error || err.message || 'Administrator registration failed.');
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      // Student Registration (Requestor or Provider)
      let finalBarangay = '';
      if (step === 2 || userType === 'Provider') {
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
        const { data } = await api.post('/auth/register', {
          role: 'student',
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
          service_category: userType === 'Provider' ? serviceCategories : undefined,
          subcategory: userType === 'Provider' ? subcategories : undefined,
          profile_image: profileImage || undefined,
          id_image: idImage || undefined,
        });

        setVerificationPending(true);
        setResendCooldown(60);
        if (data.devOtp) {
          setMessage(`Verification code generated! (Dev OTP: ${data.devOtp})`);
        } else {
          setMessage('We sent a 6-digit verification code to your email.');
        }
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

      // Check if user is administrator
      const isAdmin = data.user?.user_type === 'Admin' || (data.user?.department && data.user?.designation);
      const destination = isAdmin ? '/admin/dashboard' : (location.state?.from?.pathname || '/dashboard');
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenForgotModal = () => {
    setForgotStep(1);
    setForgotEmail(email || '');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setForgotDevOtp('');
    setForgotError('');
    setForgotMessage('');
    setShowForgotModal(true);
  };

  const handleSendForgotOtp = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    setIsForgotSubmitting(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotStep(2);
      if (data.devOtp) {
        setForgotDevOtp(data.devOtp);
        setForgotMessage(`Reset code generated! (Dev Code: ${data.devOtp})`);
      } else {
        setForgotMessage(data.message || `Reset code sent to ${forgotEmail}. Check your inbox.`);
      }
    } catch (err) {
      setForgotError(err.response?.data?.error || err.message || 'Failed to send reset code.');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    if (forgotNewPassword.length < 8) {
      setForgotError('New password must be at least 8 characters long.');
      return;
    }

    setIsForgotSubmitting(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        email: forgotEmail,
        otp: forgotOtp,
        newPassword: forgotNewPassword,
      });

      setShowForgotModal(false);
      setEmail(forgotEmail);
      setMessage(data.message || 'Password has been reset successfully! You can now sign in.');
    } catch (err) {
      setForgotError(err.response?.data?.error || err.message || 'Failed to reset password.');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  const getPageTitle = () => {
    if (verificationPending) return 'Email Verification';
    if (!isSignUp) return 'Welcome Back';
    if (role === 'admin') return 'Register Platform Administrator';
    return userType === 'Provider' && step === 2
      ? 'Provider Address & Contact'
      : 'Create Student Account';
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
            maxWidth: isSignUp && !verificationPending ? '780px' : '520px',
            boxShadow: 'var(--neu-shadow-flat-lg)',
          }}
        >
          {/* Navigation & Back Buttons Bar */}
          {!verificationPending && (
            <div className="d-flex justify-content-between align-items-center mb-4">
              {isSignUp ? (
                <>
                  <Link
                    to="/sign-in"
                    className="btn btn-sm rounded-pill px-3 py-1 d-inline-flex align-items-center gap-2 text-decoration-none shadow-sm"
                    style={{
                      background: 'var(--neu-bg-light)',
                      color: 'var(--neu-primary-dark)',
                      fontWeight: 600,
                      border: '1px solid rgba(154, 172, 196, 0.4)',
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    <span>Back to Login</span>
                  </Link>
                  <Link
                    to="/"
                    className="btn btn-sm rounded-pill px-3 py-1 text-decoration-none shadow-sm text-muted"
                    style={{ background: 'var(--neu-bg-light)', border: '1px solid rgba(154, 172, 196, 0.3)', fontSize: '0.82rem' }}
                  >
                    Home
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/"
                    className="btn btn-sm rounded-pill px-3 py-1 d-inline-flex align-items-center gap-2 text-decoration-none shadow-sm"
                    style={{
                      background: 'var(--neu-bg-light)',
                      color: 'var(--neu-primary-dark)',
                      fontWeight: 600,
                      border: '1px solid rgba(154, 172, 196, 0.4)',
                    }}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    <span>Back to Home</span>
                  </Link>
                  <span className="badge rounded-pill neu-badge-orange px-3 py-1">
                    SerbisYou
                  </span>
                </>
              )}
            </div>
          )}

          {/* Header bar with SerbisYou Logo and Step Indicators */}
          <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: 'rgba(154, 172, 196, 0.35)' }}>
            <Link to="/" className="text-decoration-none d-flex align-items-center gap-2">
              <img src="/logo-transparent.png" alt="SerbisYou" style={{ height: '42px', objectFit: 'contain' }} />
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

            {isSignUp && !verificationPending && role === 'student' && (
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
                  1. Credentials
                </span>
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
                ? role === 'admin'
                  ? 'Configure the primary platform administrator account.'
                  : step === 1
                    ? 'Enter your campus student credentials and service details.'
                    : 'Provide your Philippine mobile and service coverage address.'
                : 'Sign in to access your dashboard, services, and transactions.'}
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
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z" />
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
            <Form onSubmit={role === 'student' && step === 1 ? handleNextStep : handleSubmit}>
              {/* Role Selection Toggle (Student vs Admin) */}
              <div className="d-flex justify-content-center mb-4">
                <div
                  className="p-1 rounded-pill d-flex gap-2 w-100"
                  style={{
                    background: 'var(--neu-bg)',
                    boxShadow: 'var(--neu-shadow-inset)',
                    maxWidth: '440px',
                  }}
                >
                  <button
                    type="button"
                    className={`flex-grow-1 border-0 py-2 rounded-pill fw-semibold small transition-all ${
                      role === 'student'
                        ? 'neu-btn-primary text-white shadow-sm'
                        : 'neu-btn-ghost text-muted'
                    }`}
                    onClick={() => {
                      setRole('student');
                      setError('');
                    }}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    className={`flex-grow-1 border-0 py-2 rounded-pill fw-semibold small transition-all ${
                      role === 'admin'
                        ? 'neu-btn-primary text-white shadow-sm'
                        : 'neu-btn-ghost text-muted'
                    }`}
                    onClick={() => {
                      setRole('admin');
                      setError('');
                    }}
                  >
                    Admin {adminExists && <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>(Invite Only)</span>}
                  </button>
                </div>
              </div>

              {/* Primary Admin Exists Notice if Admin role is selected */}
              {role === 'admin' && adminExists && (
                <div 
                  className="p-3 mb-4 rounded-3 d-flex align-items-start gap-3 border shadow-sm"
                  style={{ 
                    backgroundColor: '#eff6ff', 
                    borderColor: '#bfdbfe',
                    color: '#1e3a8a'
                  }}
                >
                  <div style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
                    <strong className="d-block mb-1 text-primary">Primary Administrator Configured</strong>
                    A primary administrator account has already been registered for SerbisYou. Direct administrator registration is closed. To join as a co-administrator, please ask the primary administrator to dispatch an invitation email to you from their administration dashboard.
                  </div>
                </div>
              )}

              {/* ADMIN REGISTRATION FORM */}
              {role === 'admin' ? (
                <>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small">First Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          placeholder="First name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="neu-input"
                          required
                          disabled={adminExists}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small">Last Name <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          placeholder="Last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="neu-input"
                          required
                          disabled={adminExists}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small">Username <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          placeholder="Username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="neu-input"
                          required
                          disabled={adminExists}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small">Contact Number</Form.Label>
                        <Form.Control
                          placeholder="09XXXXXXXXX"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          className="neu-input"
                          disabled={adminExists}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold small">Email Address <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="admin@school.edu.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="neu-input"
                      required
                      disabled={adminExists}
                    />
                  </Form.Group>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small">Department <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          placeholder="e.g. IT Department"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="neu-input"
                          required
                          disabled={adminExists}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small">Designation <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          placeholder="e.g. Platform Administrator"
                          value={designation}
                          onChange={(e) => setDesignation(e.target.value)}
                          className="neu-input"
                          required
                          disabled={adminExists}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small">Password <span className="text-danger">*</span></Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Password (8+ chars)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="neu-input"
                            required
                            disabled={adminExists}
                          />
                          <Button
                            variant="link"
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="neu-btn-ghost px-3"
                          >
                            {showPassword ? 'Hide' : 'Show'}
                          </Button>
                        </InputGroup>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="fw-semibold small">Confirm Password <span className="text-danger">*</span></Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="neu-input"
                            required
                            disabled={adminExists}
                          />
                          <Button
                            variant="link"
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="neu-btn-ghost px-3"
                          >
                            {showConfirmPassword ? 'Hide' : 'Show'}
                          </Button>
                        </InputGroup>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Check
                    type="checkbox"
                    id="adminTerms"
                    className="mb-4 small text-muted"
                    label={
                      <span>
                        I agree to the <Link to="/terms" target="_blank" className="fw-semibold text-decoration-none text-primary">Terms & Conditions</Link> as Platform Administrator.
                      </span>
                    }
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    required
                    disabled={adminExists}
                  />

                  <Button
                    type="submit"
                    className="neu-btn-primary rounded-pill w-100 py-2 fw-bold"
                    disabled={isSubmitting || adminExists || !termsAccepted}
                  >
                    {isSubmitting ? 'Registering Administrator...' : 'Register Primary Administrator'}
                  </Button>
                </>
              ) : (
                /* STUDENT REGISTRATION (Requestor & Provider Credentials from ITE11_Finalproject) */
                <>
                  {step === 1 && (
                    <>
                      {/* Account Role Selector (Requestor vs Provider) */}
                      <div className="mb-4">
                        <label className="fw-semibold small mb-2 d-block" style={{ color: 'var(--neu-text)' }}>
                          I am registering as a: <span className="text-danger">*</span>
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
                            Student Service Requestor
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
                            Student Service Provider
                          </button>
                        </div>
                      </div>

                      {/* Student ID */}
                      <Form.Group as={Row} className="mb-3 align-items-center" controlId="studentId">
                        <Form.Label column sm={4} className="text-sm-end fw-semibold small">
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
                        <Form.Label column sm={4} className="text-sm-end fw-semibold small">
                          First Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Col sm={8}>
                          <Form.Control
                            placeholder="Letters only, min 4 characters"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="neu-input"
                            required
                          />
                        </Col>
                      </Form.Group>

                      <Form.Group as={Row} className="mb-3 align-items-center" controlId="lastName">
                        <Form.Label column sm={4} className="text-sm-end fw-semibold small">
                          Last Name <span className="text-danger">*</span>
                        </Form.Label>
                        <Col sm={8}>
                          <Form.Control
                            placeholder="Letters only, min 4 characters"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="neu-input"
                            required
                          />
                        </Col>
                      </Form.Group>

                      {/* Username */}
                      <Form.Group as={Row} className="mb-3 align-items-center" controlId="username">
                        <Form.Label column sm={4} className="text-sm-end fw-semibold small">
                          Username <span className="text-danger">*</span>
                        </Form.Label>
                        <Col sm={8}>
                          <Form.Control
                            placeholder="Letters and numbers only"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="neu-input"
                            required
                          />
                        </Col>
                      </Form.Group>

                      {/* Email Address */}
                      <Form.Group as={Row} className="mb-3 align-items-center" controlId="email">
                        <Form.Label column sm={4} className="text-sm-end fw-semibold small">
                          Email Address <span className="text-danger">*</span>
                        </Form.Label>
                        <Col sm={8}>
                          <Form.Control
                            type="email"
                            placeholder="student@school.edu.ph"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="neu-input"
                            required
                          />
                        </Col>
                      </Form.Group>

                      {/* Password & Confirm Password */}
                      <Form.Group as={Row} className="mb-3 align-items-center" controlId="password">
                        <Form.Label column sm={4} className="text-sm-end fw-semibold small">
                          Password <span className="text-danger">*</span>
                        </Form.Label>
                        <Col sm={8}>
                          <InputGroup>
                            <Form.Control
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Min 8 chars, 1 uppercase, 1 number"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="neu-input rounded-start"
                              required
                            />
                            <Button
                              variant="link"
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="neu-btn-ghost px-3"
                            >
                              {showPassword ? 'Hide' : 'Show'}
                            </Button>
                          </InputGroup>
                          {password && (
                            <div className="mt-2">
                              <ProgressBar
                                now={passwordStrength.percent}
                                variant={passwordStrength.variant}
                                style={{ height: '4px', borderRadius: '4px' }}
                              />
                              <small className="text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>
                                Strength: <strong>{passwordStrength.label}</strong>
                              </small>
                            </div>
                          )}
                        </Col>
                      </Form.Group>

                      <Form.Group as={Row} className="mb-3 align-items-center" controlId="confirmPassword">
                        <Form.Label column sm={4} className="text-sm-end fw-semibold small">
                          Confirm Password <span className="text-danger">*</span>
                        </Form.Label>
                        <Col sm={8}>
                          <InputGroup>
                            <Form.Control
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Re-enter password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="neu-input rounded-start"
                              required
                            />
                            <Button
                              variant="link"
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="neu-btn-ghost px-3"
                            >
                              {showConfirmPassword ? 'Hide' : 'Show'}
                            </Button>
                          </InputGroup>
                          {confirmPassword && (
                            <span
                              className="small fw-semibold mt-1 d-block"
                              style={{
                                fontSize: '0.72rem',
                                color: password === confirmPassword ? 'var(--neu-success)' : 'var(--neu-danger)',
                              }}
                            >
                              {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                            </span>
                          )}
                        </Col>
                      </Form.Group>

                      {/* PROVIDER CREDENTIALS: Service Category & Subcategories from ITE11_Finalproject */}
                      {userType === 'Provider' && (
                        <div className="neu-card p-3 rounded-4 mb-4" style={{ background: 'var(--neu-bg-light)' }}>
                          <h6 className="fw-bold mb-2 text-primary">Provider Service Specialization</h6>
                          <p className="small text-muted mb-3">Select the service categories you offer on campus.</p>

                          <Form.Group className="mb-3">
                            <Form.Label className="fw-bold small">Service Categories (Check all that apply):</Form.Label>
                            <div className="d-flex flex-wrap gap-3">
                              {['Creative', 'Event Support', 'Digital Service'].map((cat) => (
                                <Form.Check
                                  key={cat}
                                  inline
                                  type="checkbox"
                                  label={cat}
                                  checked={serviceCategories.includes(cat)}
                                  onChange={() => handleCategoryToggle(cat)}
                                />
                              ))}
                            </div>
                          </Form.Group>

                          {serviceCategories.length > 0 && (
                            <Form.Group className="mb-2">
                              <Form.Label className="fw-bold small">Subcategories:</Form.Label>
                              <div className="d-flex flex-wrap gap-2">
                                {serviceCategories.includes('Creative') && (
                                  <>
                                    <Form.Check inline type="checkbox" label="Graphic Designer" checked={subcategories.includes('Graphic Designer')} onChange={() => handleSubcategoryToggle('Graphic Designer')} />
                                    <Form.Check inline type="checkbox" label="Art Painter" checked={subcategories.includes('Art Painter')} onChange={() => handleSubcategoryToggle('Art Painter')} />
                                  </>
                                )}
                                {serviceCategories.includes('Event Support') && (
                                  <>
                                    <Form.Check inline type="checkbox" label="Make-up artist" checked={subcategories.includes('Make-up artist')} onChange={() => handleSubcategoryToggle('Make-up artist')} />
                                    <Form.Check inline type="checkbox" label="Event Hosts" checked={subcategories.includes('Event Hosts')} onChange={() => handleSubcategoryToggle('Event Hosts')} />
                                  </>
                                )}
                                {serviceCategories.includes('Digital Service') && (
                                  <>
                                    <Form.Check inline type="checkbox" label="Photographers" checked={subcategories.includes('Photographers')} onChange={() => handleSubcategoryToggle('Photographers')} />
                                    <Form.Check inline type="checkbox" label="Video Editors" checked={subcategories.includes('Video Editors')} onChange={() => handleSubcategoryToggle('Video Editors')} />
                                  </>
                                )}
                              </div>
                            </Form.Group>
                          )}
                        </div>
                      )}

                      {/* Student Profile Photo Upload */}
                      <Form.Group as={Row} className="mb-3 align-items-center">
                        <Form.Label column sm={4} className="text-sm-end fw-semibold small">
                          Profile Photo
                        </Form.Label>
                        <Col sm={8}>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={handleProfileImageChange}
                            className="neu-input"
                          />
                          {profileImage && (
                            <div className="mt-2 d-flex align-items-center gap-2">
                              <img
                                src={profileImage}
                                alt="Profile Preview"
                                style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                                className="rounded-circle shadow-sm border border-2 border-primary"
                              />
                              <span className="small text-success fw-semibold">Photo attached</span>
                            </div>
                          )}
                        </Col>
                      </Form.Group>

                      {/* Student ID / Verification Photo Upload */}
                      <Form.Group as={Row} className="mb-4 align-items-center">
                        <Form.Label column sm={4} className="text-sm-end fw-semibold small">
                          Student ID Photo
                        </Form.Label>
                        <Col sm={8}>
                          <Form.Control
                            type="file"
                            accept="image/*"
                            onChange={handleIdImageChange}
                            className="neu-input"
                          />
                          <small className="text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>
                            Upload Student ID image for campus account verification.
                          </small>
                          {idImage && (
                            <div className="mt-2 d-flex align-items-center gap-2">
                              <img
                                src={idImage}
                                alt="ID Preview"
                                style={{ maxHeight: '60px', maxWidth: '120px', objectFit: 'contain' }}
                                className="rounded shadow-sm border"
                              />
                              <span className="small text-success fw-semibold">ID proof attached</span>
                            </div>
                          )}
                        </Col>
                      </Form.Group>

                      <Button
                        type="submit"
                        className="neu-btn-primary rounded-pill w-100 py-2 fw-semibold"
                      >
                        Proceed to Location &rarr;
                      </Button>
                    </>
                  )}

                  {/* STEP 2: LOCATION & TERMS */}
                  {step === 2 && (
                    <>
                      {/* Contact Number */}
                      <Form.Group as={Row} className="mb-3 align-items-center" controlId="contactNumber">
                        <Form.Label column sm={4} className="text-sm-end fw-semibold small">
                          Mobile Number <span className="text-danger">*</span>
                        </Form.Label>
                        <Col sm={8}>
                          <Form.Control
                            placeholder="09XXXXXXXXX"
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
                                {isContactValid ? '✓ Valid mobile' : '✗ Format: 09XXXXXXXXX'}
                              </span>
                            </div>
                          )}
                        </Col>
                      </Form.Group>

                      {/* Region */}
                      <Form.Group as={Row} className="mb-3 align-items-center" controlId="region">
                        <Form.Label column sm={4} className="text-sm-end fw-semibold small">
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
                        <Form.Label column sm={4} className="text-sm-end fw-semibold small">
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

                      {/* City */}
                      <Form.Group as={Row} className="mb-3 align-items-center" controlId="city">
                        <Form.Label column sm={4} className="text-sm-end fw-semibold small">
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
                        <Form.Label column sm={4} className="text-sm-end fw-semibold small">
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

                      {/* Terms and Conditions Checkbox */}
                      <Form.Check
                        type="checkbox"
                        id="studentTerms"
                        className="mb-4 small text-muted"
                        label={
                          <span>
                            I agree to the <Link to="/terms" target="_blank" className="fw-semibold text-decoration-none text-primary">Terms & Conditions</Link> and platform fee structure (₱5 booking fee, 5% commission).
                          </span>
                        }
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        required
                      />

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
                          disabled={isSubmitting || !termsAccepted}
                        >
                          {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </Form>
          ) : (
            /* Sign In View with Remember Me */
            <Form onSubmit={handleSubmit}>
              <Form.Group as={Row} className="mb-3 align-items-center" controlId="loginEmail">
                <Form.Label column sm={4} className="text-sm-end fw-semibold small">
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
                <Form.Label column sm={4} className="text-sm-end fw-semibold small">
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
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </Button>
                  </InputGroup>
                </Col>
              </Form.Group>

              {/* Remember Me Checkbox & Forgot Password */}
              <Row className="mb-4 align-items-center">
                <Col sm={{ span: 8, offset: 4 }} className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <Form.Check
                    type="checkbox"
                    id="rememberMeCheckbox"
                    label="Remember me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="text-muted small mb-0"
                  />
                  <Button
                    variant="link"
                    className="p-0 text-decoration-none small fw-semibold"
                    style={{ color: '#063a8f' }}
                    onClick={handleOpenForgotModal}
                    type="button"
                  >
                    Forgot Password?
                  </Button>
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

      {/* Forgot / Reset Password Modal */}
      <Modal show={showForgotModal} onHide={() => setShowForgotModal(false)} centered>
        <Modal.Header closeButton style={{ background: 'var(--neu-bg-dark)', borderBottom: '1px solid rgba(154, 172, 196, 0.35)' }}>
          <Modal.Title className="fw-bold fs-5" style={{ color: 'var(--neu-text)' }}>
            {forgotStep === 1 ? 'Reset Your Password' : 'Enter Verification Code'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'var(--neu-bg)' }} className="p-4">
          {forgotMessage && <Alert variant="info" className="neu-alert mb-3 small">{forgotMessage}</Alert>}
          {forgotError && <Alert variant="danger" className="neu-alert mb-3 small">{forgotError}</Alert>}

          {forgotStep === 1 ? (
            <Form onSubmit={handleSendForgotOtp}>
              <p className="text-muted small mb-3">
                Enter your registered SerbisYou email address. We will generate and send a 6-digit password reset code.
              </p>
              <Form.Group className="mb-4" controlId="forgotEmailInput">
                <Form.Label className="small fw-semibold text-muted">Email Address</Form.Label>
                <Form.Control
                  type="email"
                  className="neu-input"
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                />
              </Form.Group>
              <div className="d-flex justify-content-end gap-2">
                <Button className="neu-btn-ghost" onClick={() => setShowForgotModal(false)} type="button">
                  Cancel
                </Button>
                <Button type="submit" className="neu-btn-primary px-4 fw-semibold" disabled={isForgotSubmitting}>
                  {isForgotSubmitting ? 'Sending...' : 'Send Reset Code'}
                </Button>
              </div>
            </Form>
          ) : (
            <Form onSubmit={handleResetPassword}>
              <Form.Group className="mb-3" controlId="forgotOtpInput">
                <Form.Label className="small fw-semibold text-muted">6-Digit Reset Code (OTP)</Form.Label>
                <Form.Control
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  className="neu-input font-monospace fs-5 text-center"
                  value={forgotOtp}
                  onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="forgotNewPasswordInput">
                <Form.Label className="small fw-semibold text-muted">New Password (Min. 8 characters)</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Enter new password"
                  className="neu-input"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4" controlId="forgotConfirmPasswordInput">
                <Form.Label className="small fw-semibold text-muted">Confirm New Password</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Confirm new password"
                  className="neu-input"
                  value={forgotConfirmPassword}
                  onChange={(e) => setForgotConfirmPassword(e.target.value)}
                  required
                />
              </Form.Group>

              <div className="d-flex justify-content-between align-items-center">
                <Button variant="link" className="p-0 text-muted small text-decoration-none" onClick={() => setForgotStep(1)} type="button">
                  ← Back to Email
                </Button>
                <div className="d-flex gap-2">
                  <Button className="neu-btn-ghost" onClick={() => setShowForgotModal(false)} type="button">
                    Cancel
                  </Button>
                  <Button type="submit" className="neu-btn-primary px-4 fw-semibold" disabled={isForgotSubmitting}>
                    {isForgotSubmitting ? 'Resetting...' : 'Reset Password'}
                  </Button>
                </div>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>
    </main>
  );
}
