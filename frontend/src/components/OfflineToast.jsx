import React, { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Toast, ToastContainer, Button, Badge } from 'react-bootstrap';
import api from '../api/axios';
import { syncOfflineQueue } from '../utils/offlineQueue';

export default function OfflineToast() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showNetworkToast, setShowNetworkToast] = useState(false);
  const [syncToast, setSyncToast] = useState({ show: false, message: '', count: 0 });
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [showInstallToast, setShowInstallToast] = useState(false);

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

  // Track browser online/offline status changes and auto-sync queue
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setShowNetworkToast(true);

      // Trigger automatic background synchronization of queued offline mutations
      try {
        const result = await syncOfflineQueue(api);
        if (result && result.synced > 0) {
          setSyncToast({
            show: true,
            count: result.synced,
            message: `Successfully synchronized ${result.synced} offline transaction(s) with the server.`,
          });
        }
      } catch (err) {
        console.error('[SerbisYou PWA] Auto-sync failed on reconnect:', err);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNetworkToast(true);
    };

    const handleActionQueued = (e) => {
      setSyncToast({
        show: true,
        count: 1,
        message: 'You are offline. Your action has been saved locally and will auto-sync once reconnected.',
      });
    };

    const handleSyncCompleted = (e) => {
      const { synced } = e.detail || {};
      if (synced > 0) {
        setSyncToast({
          show: true,
          count: synced,
          message: `Auto-sync complete: ${synced} queued item(s) processed.`,
        });
      }
    };

    // Capture PWA install prompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredInstallPrompt(e);
      setShowInstallToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-action-queued', handleActionQueued);
    window.addEventListener('offline-sync-completed', handleSyncCompleted);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-action-queued', handleActionQueued);
      window.removeEventListener('offline-sync-completed', handleSyncCompleted);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    console.log('[SerbisYou PWA] Install choice outcome:', outcome);
    setDeferredInstallPrompt(null);
    setShowInstallToast(false);
  };

  const closeOfflineReady = () => setOfflineReady(false);
  const closeNeedRefresh = () => setNeedRefresh(false);
  const closeNetworkToast = () => setShowNetworkToast(false);
  const closeSyncToast = () => setSyncToast({ show: false, message: '', count: 0 });
  const closeInstallToast = () => setShowInstallToast(false);

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
            ? 'Connection restored. Live transactions, messages, and auto-sync are active.'
            : 'You are currently disconnected. Offline requests will queue locally and auto-sync on reconnect.'}
        </Toast.Body>
      </Toast>

      {/* 4. Offline Background Sync Toast Notification */}
      <Toast
        show={syncToast.show}
        onClose={closeSyncToast}
        delay={5000}
        autohide
        bg="dark"
      >
        <Toast.Header closeButton className="bg-dark text-white border-secondary">
          <strong className="me-auto text-warning d-flex align-items-center gap-1">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            Offline Sync Engine
          </strong>
          <Badge bg="secondary">PWA</Badge>
        </Toast.Header>
        <Toast.Body className="text-white small">
          {syncToast.message}
        </Toast.Body>
      </Toast>

      {/* 5. Mobile / Desktop PWA Install Prompt */}
      {deferredInstallPrompt && (
        <Toast
          show={showInstallToast}
          onClose={closeInstallToast}
          bg="light"
          className="shadow-lg border-primary"
        >
          <Toast.Header closeButton>
            <strong className="me-auto text-primary d-flex align-items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
              </svg>
              Install SerbisYou App
            </strong>
          </Toast.Header>
          <Toast.Body>
            <p className="small mb-2 text-muted">
              Install SerbisYou on your device for instant offline access and native app experience.
            </p>
            <div className="d-flex gap-2">
              <Button size="sm" className="neu-btn-primary" onClick={handleInstallApp}>
                Install Now
              </Button>
              <Button size="sm" variant="outline-secondary" onClick={closeInstallToast}>
                Later
              </Button>
            </div>
          </Toast.Body>
        </Toast>
      )}
    </ToastContainer>
  );
}
