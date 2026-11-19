import React, { useState, useEffect } from 'react';
import { Toast, ToastContainer, Button, Modal, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { socket } from '../socket';
import { playNotificationChime, triggerCellphoneVibration } from '../utils/pushNotification';

export default function RealtimePushToast() {
  const navigate = useNavigate();
  const [activeToast, setActiveToast] = useState(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  useEffect(() => {
    const handlePushEvent = (detail) => {
      if (!detail) return;

      playNotificationChime();
      triggerCellphoneVibration([250, 100, 250, 100, 300]);

      setActiveToast({
        id: detail.id || `push_${Date.now()}`,
        title: detail.title || '🔔 Real-Time Transaction Alert',
        message: detail.description || detail.body || detail.message || 'You have an active update on your SerbisYou account.',
        link: detail.link || detail.url || '/transactions',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    };

    // Listen to custom in-app push dispatch
    const handleWindowPush = (e) => {
      if (e.detail) handlePushEvent(e.detail);
    };

    // Listen to socket transaction created / updated
    const handleSocketTxCreated = (tx) => {
      if (!tx) return;
      handlePushEvent({
        id: `tx_${tx.transaction_id}_created`,
        title: '🔔 New Service Booking Request!',
        description: `Booking #${tx.transaction_id} for "${tx.service_name || 'Service'}" (₱${Number(tx.total_topay || 0).toFixed(2)}) is waiting for your response.`,
        link: '/transactions',
      });
    };

    const handleSocketTxUpdated = (tx) => {
      if (!tx) return;
      handlePushEvent({
        id: `tx_${tx.transaction_id}_${tx.service_status}`,
        title: `📋 Transaction #${tx.transaction_id} Updated`,
        description: `Service status is now: ${String(tx.service_status || 'updated').toUpperCase()}.`,
        link: '/transactions',
      });
    };

    const handleSocketNotif = (notif) => {
      if (!notif) return;
      handlePushEvent(notif);
    };

    const handlePermissionHelp = () => {
      setShowHelpModal(true);
    };

    window.addEventListener('serbisyou_realtime_push', handleWindowPush);
    window.addEventListener('serbisyou_push_permission_help', handlePermissionHelp);
    socket.on('transaction_created', handleSocketTxCreated);
    socket.on('transaction_updated', handleSocketTxUpdated);
    socket.on('new_notification', handleSocketNotif);

    return () => {
      window.removeEventListener('serbisyou_realtime_push', handleWindowPush);
      window.removeEventListener('serbisyou_push_permission_help', handlePermissionHelp);
      socket.off('transaction_created', handleSocketTxCreated);
      socket.off('transaction_updated', handleSocketTxUpdated);
      socket.off('new_notification', handleSocketNotif);
    };
  }, []);

  const handleClickToast = () => {
    if (activeToast?.link) {
      navigate(activeToast.link);
      setActiveToast(null);
    }
  };

  return (
    <>
      {/* ─── REAL-TIME FLOATING PUSH BANNER ─── */}
      <ToastContainer
        position="top-center"
        className="p-3"
        style={{ zIndex: 1090, top: '64px', width: '100%', maxWidth: '440px', margin: '0 auto', pointerEvents: 'none' }}
      >
        {activeToast && (
          <Toast
            show={!!activeToast}
            onClose={() => setActiveToast(null)}
            delay={8000}
            autohide
            className="border-0 shadow-lg text-white"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              pointerEvents: 'auto',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
            }}
          >
            <Toast.Header
              closeButton
              className="bg-transparent text-white border-bottom border-secondary border-opacity-25 pb-2"
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center me-2 text-white fw-bold"
                style={{
                  width: '24px',
                  height: '24px',
                  background: 'linear-gradient(135deg, #0066FF, #0044CC)',
                  fontSize: '0.75rem',
                }}
              >
                🔔
              </div>
              <strong className="me-auto text-white small fw-bold">SerbisYou Real-Time Push</strong>
              <small className="text-white-50">{activeToast.timestamp}</small>
            </Toast.Header>
            <Toast.Body className="p-3" onClick={handleClickToast} style={{ cursor: 'pointer' }}>
              <div className="fw-bold mb-1 fs-6 text-white">{activeToast.title}</div>
              <div className="small text-white-50 mb-3" style={{ lineHeight: '1.5' }}>
                {activeToast.message}
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <Button
                  size="sm"
                  className="rounded-pill px-3 py-1 fw-bold border-0 text-white shadow-sm"
                  style={{
                    backgroundColor: '#ff7828',
                    fontSize: '0.78rem',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClickToast();
                  }}
                >
                  View Details &rarr;
                </Button>
                <span className="small text-white-50" style={{ fontSize: '0.72rem' }}>
                  Tap anywhere to view
                </span>
              </div>
            </Toast.Body>
          </Toast>
        )}
      </ToastContainer>

      {/* ─── HOW TO UNBLOCK BROWSER NOTIFICATIONS MODAL ─── */}
      <Modal show={showHelpModal} onHide={() => setShowHelpModal(false)} centered backdrop="static">
        <Modal.Header closeButton style={{ background: 'var(--neu-bg-dark)', borderBottom: '1px solid rgba(154, 172, 196, 0.35)' }}>
          <Modal.Title className="fw-bold fs-5 text-dark d-flex align-items-center gap-2">
            <span>🔔</span> Enable Lock-Screen Push Notifications
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ background: 'var(--neu-bg)' }}>
          <div className="alert alert-info border-0 rounded-3 small mb-3">
            <strong>In-app push notifications, sound chimes, and vibrations are 100% ACTIVE!</strong>
            <div className="mt-1">
              To also receive notifications on your cellphone lock screen while the app is closed, your browser requires permission.
            </div>
          </div>

          <h6 className="fw-bold text-dark small text-uppercase mb-2">How to Unblock in Your Browser:</h6>

          <div className="p-3 rounded-3 bg-white border mb-3 small">
            <div className="fw-bold text-dark mb-1">📱 Chrome / Edge / Mobile Android:</div>
            <ol className="mb-0 ps-3 text-secondary">
              <li>Look at the top URL bar next to <code>serbisyou-frontend.onrender.com</code>.</li>
              <li>Tap the <strong>🔒 Lock icon</strong> or <strong>🎛️ Tune icon</strong> on the left of the address.</li>
              <li>Tap <strong>Permissions</strong> (or <strong>Site settings</strong>).</li>
              <li>Change <strong>Notifications</strong> from <em>Block</em> to <strong>Allow</strong>.</li>
              <li>Refresh the page!</li>
            </ol>
          </div>

          <div className="p-3 rounded-3 bg-white border small">
            <div className="fw-bold text-dark mb-1">🍎 iPhone / iPad Safari:</div>
            <ol className="mb-0 ps-3 text-secondary">
              <li>Tap the <strong>Share</strong> button at the bottom of Safari.</li>
              <li>Select <strong>Add to Home Screen</strong>.</li>
              <li>Open SerbisYou from your Home Screen to allow native lock-screen push notifications!</li>
            </ol>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ background: 'var(--neu-bg-dark)', borderTop: '1px solid rgba(154, 172, 196, 0.35)' }}>
          <Button variant="primary" className="rounded-pill px-4 fw-semibold" onClick={() => setShowHelpModal(false)}>
            Got it, thanks!
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
