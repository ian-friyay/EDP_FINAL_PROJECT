import { useState, useRef, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Alert, Nav, Badge } from 'react-bootstrap';
import jsQR from 'jsqr';

export default function QRScannerModal({
  show,
  onHide,
  onVerify,
  isVerifying = false,
  error = '',
  success = '',
  pendingBookings = [],
  userRole = 'Student',
}) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [scannedResult, setScannedResult] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameIdRef = useRef(null);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Frame scanning loop using jsQR
  const scanFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animFrameIdRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    let canvas = canvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvasRef.current = canvas;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      animFrameIdRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);

    // Decode with jsQR
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });

    if (code && code.data && code.data.trim()) {
      const detected = code.data.trim();
      setScannedResult(detected);
      stopCamera();

      // Trigger verification
      if (onVerify) {
        onVerify(detected);
      }
      return;
    }

    animFrameIdRef.current = requestAnimationFrame(scanFrame);
  }, [onVerify, stopCamera]);

  // Start device camera
  const startCamera = useCallback(async (mode = facingMode) => {
    stopCamera();
    setCameraError('');
    setScannedResult('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported by your current browser.');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        animFrameIdRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (err) {
      console.warn('Camera initialization error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in your browser settings, or use manual entry / file upload.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on this device. You can enter the code manually or upload a QR image.');
      } else {
        setCameraError(`Camera error: ${err.message || 'Unable to open camera.'}`);
      }
      setIsCameraActive(false);
    }
  }, [facingMode, scanFrame, stopCamera]);

  // Handle modal visibility and active tab changes
  useEffect(() => {
    if (show && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [show, activeTab, startCamera, stopCamera]);

  // Handle Image File Upload (screenshot or saved QR photo)
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code && code.data && code.data.trim()) {
          const detected = code.data.trim();
          setScannedResult(detected);
          if (onVerify) {
            onVerify(detected);
          }
        } else {
          setCameraError('No valid QR code was detected in the uploaded image. Please try another image or enter the code manually.');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    if (onVerify) {
      onVerify(manualCode.trim());
    }
  };

  const toggleFacingMode = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    startCamera(newMode);
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton style={{ background: 'var(--neu-bg-dark)', borderBottom: '1px solid rgba(154, 172, 196, 0.35)' }}>
        <div className="d-flex align-items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16" className="text-primary">
            <path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3Zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5ZM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5Z"/>
            <path d="M7 2h2v2H7V2Zm0 3h2v2H7V5ZM7 8h2v2H7V8Zm0 3h2v2H7v-2ZM4 2h2v2H4V2Zm0 3h2v2H4V5ZM4 8h2v2H4V8Zm0 3h2v2H4v-2ZM10 2h2v2h-2V2Zm0 3h2v2h-2V5Zm0 8h2v2h-2v-2Z"/>
          </svg>
          <Modal.Title className="fw-bold fs-5" style={{ color: 'var(--neu-text)' }}>
            QR Code Verification Scanner
          </Modal.Title>
        </div>
        <Badge bg="primary" className="ms-2 rounded-pill fw-semibold">
          {userRole} Mode
        </Badge>
      </Modal.Header>

      <Modal.Body className="p-4" style={{ background: 'var(--neu-bg)' }}>
        {/* Alerts */}
        {success && (
          <Alert variant="success" className="neu-alert mb-3">
            ✓ {success}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="neu-alert mb-3">
            ✕ {error}
          </Alert>
        )}

        {cameraError && (
          <Alert variant="warning" className="neu-alert mb-3">
            {cameraError}
          </Alert>
        )}

        {/* Tab Navigation */}
        <Nav variant="pills" activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4 neu-tabs gap-2">
          <Nav.Item>
            <Nav.Link eventKey="camera" className="d-flex align-items-center gap-1.5 fw-semibold px-3 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
                <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 7.172 2H4.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 1.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z"/>
              </svg>
              Live Camera
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="upload" className="d-flex align-items-center gap-1.5 fw-semibold px-3 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
              </svg>
              Upload QR Photo
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="manual" className="d-flex align-items-center gap-1.5 fw-semibold px-3 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/>
                <path d="M4 4h8v2H4V4zm0 4h8v2H4V8zm0 4h5v2H4v-2z"/>
              </svg>
              Manual Code &amp; List
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* TAB 1: LIVE CAMERA SCANNER */}
        {activeTab === 'camera' && (
          <div>
            <div
              className="position-relative rounded-3 overflow-hidden d-flex align-items-center justify-content-center mb-3"
              style={{
                background: '#090d16',
                minHeight: '340px',
                border: '2px solid rgba(154, 172, 196, 0.4)',
              }}
            >
              {/* Video Element */}
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                style={{
                  width: '100%',
                  maxHeight: '380px',
                  objectFit: 'cover',
                  display: isCameraActive ? 'block' : 'none',
                }}
              />

              {/* Viewfinder Target Overlay with Laser Bar */}
              {isCameraActive && (
                <div
                  className="position-absolute d-flex flex-column align-items-center justify-content-center pointer-events-none"
                  style={{
                    width: '230px',
                    height: '230px',
                    border: '2px solid rgba(0, 102, 255, 0.85)',
                    borderRadius: '16px',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45), inset 0 0 15px rgba(0, 102, 255, 0.5)',
                  }}
                >
                  {/* Scanning Laser Line */}
                  <div
                    style={{
                      width: '90%',
                      height: '2px',
                      background: '#00e5ff',
                      boxShadow: '0 0 8px #00e5ff',
                      animation: 'scanLaser 2s infinite ease-in-out',
                    }}
                  />
                  <style>
                    {`
                      @keyframes scanLaser {
                        0% { transform: translateY(-80px); opacity: 0.8; }
                        50% { transform: translateY(80px); opacity: 1; }
                        100% { transform: translateY(-80px); opacity: 0.8; }
                      }
                    `}
                  </style>
                  <span
                    className="position-absolute bottom-0 mb-2 small fw-semibold text-white px-2 py-0.5 rounded"
                    style={{ background: 'rgba(0,0,0,0.65)', fontSize: '0.72rem' }}
                  >
                    Align QR inside frame
                  </span>
                </div>
              )}

              {/* Placeholder when camera is initializing or inactive */}
              {!isCameraActive && (
                <div className="text-center p-4 text-white">
                  <div className="spinner-border text-primary mb-3" role="status" />
                  <h6 className="fw-bold mb-1">Starting Camera...</h6>
                  <p className="text-white-50 small mb-0">
                    Point your camera at the client or provider booking QR code.
                  </p>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <Button
                variant="outline-secondary"
                size="sm"
                className="neu-btn-ghost btn-sm d-inline-flex align-items-center gap-1"
                onClick={toggleFacingMode}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                  <path fillRule="evenodd" d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
                  <path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
                </svg>
                Flip Camera ({facingMode === 'environment' ? 'Back' : 'Front'})
              </Button>

              <span className="small text-muted">
                {isVerifying ? 'Verifying code with server...' : 'Scanning active...'}
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: UPLOAD QR PHOTO */}
        {activeTab === 'upload' && (
          <div className="py-2">
            <div
              className="p-4 rounded-3 text-center mb-3"
              style={{
                background: 'var(--neu-bg-dark)',
                border: '2px dashed rgba(154, 172, 196, 0.5)',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16" className="text-primary mb-2">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
              </svg>
              <h6 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>
                Select QR Image or Screenshot
              </h6>
              <p className="text-muted small mb-3">
                Upload a saved voucher photo or screenshot from your gallery to verify.
              </p>
              <Form.Group controlId="uploadQrInput">
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="neu-input mx-auto"
                  style={{ maxWidth: '340px' }}
                />
              </Form.Group>
            </div>
          </div>
        )}

        {/* TAB 3: MANUAL INPUT & QUICK SHORTCUTS */}
        {activeTab === 'manual' && (
          <div className="py-2">
            <Form onSubmit={handleManualSubmit}>
              <Form.Group className="mb-3" controlId="manualQrInput">
                <Form.Label className="small fw-semibold text-muted">
                  Enter QR Code String
                </Form.Label>
                <Form.Control
                  type="text"
                  className="neu-input font-monospace"
                  placeholder="e.g. SERBISYOU-TRANSACTION-12 or UUID"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                />
              </Form.Group>
              <div className="d-flex justify-content-end mb-3">
                <Button
                  type="submit"
                  className="neu-btn-primary btn-sm px-4 fw-semibold"
                  disabled={isVerifying || !manualCode.trim()}
                >
                  {isVerifying ? 'Verifying...' : 'Verify Code'}
                </Button>
              </div>
            </Form>
          </div>
        )}

        {/* QUICK SHORTCUTS FOR PENDING BOOKINGS */}
        {pendingBookings.length > 0 && (
          <div className="mt-3 pt-3 border-top" style={{ borderColor: 'rgba(154, 172, 196, 0.35)' }}>
            <div className="small fw-bold text-muted mb-2 text-uppercase">
              Quick Verify Bookings ({pendingBookings.length})
            </div>
            <div className="d-flex flex-column gap-2" style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {pendingBookings.map((b) => (
                <div
                  key={b.transaction_id}
                  className="d-flex justify-content-between align-items-center p-2.5 rounded-2"
                  style={{
                    background: 'var(--neu-bg-dark)',
                    border: '1px solid rgba(154, 172, 196, 0.3)',
                  }}
                >
                  <div className="overflow-hidden me-2">
                    <span className="badge bg-secondary me-2">TX #{b.transaction_id}</span>
                    <strong className="small text-dark me-2">{b.service_name || 'Campus Service'}</strong>
                    <code className="small text-truncate text-muted d-block" style={{ maxWidth: '320px' }}>
                      {b.qr_code || `SERBISYOU-TRANSACTION-${b.transaction_id}`}
                    </code>
                  </div>
                  <Button
                    size="sm"
                    className="neu-btn-primary btn-sm flex-shrink-0 fw-semibold"
                    onClick={() => onVerify(b.qr_code || `SERBISYOU-TRANSACTION-${b.transaction_id}`)}
                    disabled={isVerifying}
                  >
                    Verify &amp; Settle
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {scannedResult && (
          <div className="mt-3 p-2 rounded bg-light border text-truncate font-monospace small">
            <strong>Detected Code:</strong> {scannedResult}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer style={{ background: 'var(--neu-bg-dark)', borderTop: '1px solid rgba(154, 172, 196, 0.35)' }}>
        <Button variant="secondary" className="neu-btn-ghost btn-sm" onClick={onHide} disabled={isVerifying}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
