import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Toast, ToastContainer, Button } from 'react-bootstrap';

export default function OfflineToast() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showNetworkToast, setShowNetworkToast] = useState(false);

  // useRegisterSW hook provided by vite-plugin-pwa
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[SerbisYou PWA] Service Worker registered:', r);
    },
    onRegisterError(error) {
      console.error('[SerbisYou PWA] Service Worker registration failed:', error);
    },
  });

  // Track browser online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNetworkToast(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNetworkToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const closeOfflineReady = () => setOfflineReady(false);
  const closeNeedRefresh = () => setNeedRefresh(false);
  const closeNetworkToast = () => setShowNetworkToast(false);

  return (
    <ToastContainer
      position="bottom-end"
      className="p-3"
      style={{ zIndex: 9999, position: 'fixed' }}
    >
      {/* 1. Offline Ready Toast Notification */}
      <Toast
        show={offlineReady}
        onClose={closeOfflineReady}
        delay={6000}
        autohide
        bg="success"
      >
        <Toast.Header closeButton>
          <strong className="me-auto text-success d-flex align-items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
            </svg>
            Offline Ready
          </strong>
          <small className="text-muted">SerbisYou</small>
        </Toast.Header>
        <Toast.Body className="text-white">
          The app has been cached and is ready to work offline! You can view services and cached profiles without internet.
        </Toast.Body>
      </Toast>

      {/* 2. New Content / Update Available Toast Notification */}
      <Toast
        show={needRefresh}
        onClose={closeNeedRefresh}
        bg="primary"
      >
        <Toast.Header closeButton>
          <strong className="me-auto text-primary">Update Available</strong>
          <small className="text-muted">SerbisYou</small>
        </Toast.Header>
        <Toast.Body className="text-white">
          <p className="mb-2">New content is available for SerbisYou. Reload to update to the latest version.</p>
          <div className="d-flex gap-2">
            <Button
              size="sm"
              variant="light"
              onClick={() => updateServiceWorker(true)}
            >
              Reload &amp; Update
            </Button>
            <Button
              size="sm"
              variant="outline-light"
              onClick={closeNeedRefresh}
            >
              Dismiss
            </Button>
          </div>
        </Toast.Body>
      </Toast>

      {/* 3. Real-time Connection Status Toast (Online/Offline) */}
      <Toast
        show={showNetworkToast}
        onClose={closeNetworkToast}
        delay={4000}
        autohide
        bg={isOnline ? 'info' : 'warning'}
      >
        <Toast.Header closeButton>
          <strong className={`me-auto ${isOnline ? 'text-info' : 'text-warning'}`}>
            {isOnline ? 'Back Online' : 'You are Offline'}
          </strong>
        </Toast.Header>
        <Toast.Body className="text-dark">
          {isOnline
            ? 'Connection restored. Live transactions and messages are reconnected.'
            : 'You are currently disconnected. You can still browse cached services.'}
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
}
