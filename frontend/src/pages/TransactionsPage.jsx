import { useState, useEffect, useCallback } from 'react';
import { Container, Spinner, Alert, Button, Modal, Form } from 'react-bootstrap';
import TransactionTable from '../components/TransactionTable';
import api from '../api/axios';
import { socket } from '../socket';
import { getCurrentUserId } from '../utils/user';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = window.localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // QR Scanner Modal State for Providers
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [qrInput, setQrInput] = useState('');
  const [isVerifyingQr, setIsVerifyingQr] = useState(false);
  const [qrModalError, setQrModalError] = useState('');
  const [qrModalSuccess, setQrModalSuccess] = useState('');

  const currentUserId = currentUser?.user_id || getCurrentUserId();

  const fetchProfileAndTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [txRes, profileRes] = await Promise.all([
        api.get('/transactions').catch(() => ({ data: { transactions: [] } })),
        api.get('/profile/me').catch(() => ({ data: { user: currentUser } })),
      ]);

      setTransactions(txRes.data.transactions || []);
      if (profileRes.data.user) {
        setCurrentUser(profileRes.data.user);
        window.localStorage.setItem('user', JSON.stringify(profileRes.data.user));
      }
    } catch (err) {
      console.warn('Failed to load transactions:', err);
      if (transactions.length === 0) {
        setError('Unable to load latest transactions from server. Please try refreshing.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, transactions.length]);

  useEffect(() => {
    fetchProfileAndTransactions();
  }, [fetchProfileAndTransactions]);

  // Real-time WebSocket listeners for instant booking lifecycle updates
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
    if (currentUserId) {
      socket.emit('register', currentUserId);
    }

    const handleTransactionChange = () => {
      fetchProfileAndTransactions();
    };

    socket.on('transaction_created', handleTransactionChange);
    socket.on('transaction_updated', handleTransactionChange);

    return () => {
      socket.off('transaction_created', handleTransactionChange);
      socket.off('transaction_updated', handleTransactionChange);
    };
  }, [currentUserId, fetchProfileAndTransactions]);

  const handleStatusUpdate = async (transactionId, newStatus) => {
    try {
      await api.patch(`/transactions/${transactionId}/status`, { status: newStatus });
      // Optimistic local update
      setTransactions((prev) =>
        prev.map((t) =>
          t.transaction_id === transactionId ? { ...t, service_status: newStatus } : t
        )
      );
    } catch (err) {
      console.error(`Failed to update status to ${newStatus}:`, err);
      alert(err.response?.data?.error || `Failed to update status to ${newStatus}.`);
    }
  };

  const handleVerifyQr = async (codeToVerify) => {
    const code = (codeToVerify || qrInput).trim();
    if (!code) {
      setQrModalError('Please enter or scan a valid QR Code payload.');
      return;
    }

    setIsVerifyingQr(true);
    setQrModalError('');
    setQrModalSuccess('');

    try {
      const { data } = await api.post('/transactions/verify-qr', { qr_code: code });
      setQrModalSuccess(data.message || 'QR Code verified successfully! Booking completed.');
      setSuccessMsg(`QR Code Verified: Booking #${data.transaction?.transaction_id || ''} has been marked as Completed!`);
      setQrInput('');
      await fetchProfileAndTransactions();
      setTimeout(() => {
        setShowScannerModal(false);
        setQrModalSuccess('');
      }, 1500);
    } catch (err) {
      setQrModalError(err.response?.data?.error || err.message || 'QR verification failed. Please check the code.');
    } finally {
      setIsVerifyingQr(false);
    }
  };

  const isProvider = currentUser?.user_type === 'Provider';

  // Find any accepted bookings for this provider that can be quick-verified
  const pendingQrBookings = transactions.filter(
    (t) => (t.service_status === 'accepted' || t.service_status === 'pending') && t.provider_id === currentUser?.user_id && t.qr_code
  );

  return (
    <Container fluid className="p-0">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>Transactions &amp; Bookings</h2>
          <p className="text-muted mb-0">
            Records of service bookings, booking fees (₱5), 5% commission fees, and provider ratings.
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          {isProvider && (
            <Button
              className="neu-btn-primary btn-sm d-flex align-items-center gap-2 shadow-sm"
              onClick={() => {
                setShowScannerModal(true);
                setQrModalError('');
                setQrModalSuccess('');
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3Zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5ZM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5Z"/>
                <path d="M7 2h2v2H7V2Zm0 3h2v2H7V5ZM7 8h2v2H7V8Zm0 3h2v2H7v-2ZM4 2h2v2H4V2Zm0 3h2v2H4V5ZM4 8h2v2H4V8Zm0 3h2v2H4v-2ZM10 2h2v2h-2V2Zm0 3h2v2h-2V5Zm0 8h2v2h-2v-2Z"/>
              </svg>
              Scan / Verify QR Code
            </Button>
          )}
          <Button className="neu-btn-ghost btn-sm" onClick={fetchProfileAndTransactions} disabled={isLoading}>
            {isLoading ? 'Refreshing...' : '↻ Refresh Transactions'}
          </Button>
        </div>
      </div>

      {successMsg && (
        <Alert variant="success" dismissible onClose={() => setSuccessMsg('')} className="neu-alert mb-4">
          {successMsg}
        </Alert>
      )}

      {error && (
        <Alert variant="warning" dismissible onClose={() => setError(null)} className="neu-alert mb-4">
          {error}
        </Alert>
      )}

      <div className="neu-card">
        {isLoading && transactions.length === 0 ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Loading live transactions...</p>
          </div>
        ) : (
          <TransactionTable
            transactions={transactions}
            currentUserId={currentUserId}
            onRefresh={fetchProfileAndTransactions}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
      </div>

      {/* Provider QR Scanner / Verification Modal */}
      <Modal show={showScannerModal} onHide={() => setShowScannerModal(false)} centered size="lg">
        <Modal.Header closeButton style={{ background: 'var(--neu-bg-dark)', borderBottom: '1px solid rgba(154, 172, 196, 0.3)' }}>
          <Modal.Title className="fw-bold fs-5" style={{ color: 'var(--neu-text)' }}>
            Provider QR Verification Engine
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ background: 'var(--neu-bg)' }}>
          {qrModalSuccess && (
            <Alert variant="success" className="neu-alert mb-3">
              {qrModalSuccess}
            </Alert>
          )}

          {qrModalError && (
            <Alert variant="danger" className="neu-alert mb-3">
              {qrModalError}
            </Alert>
          )}

          <div className="text-center py-3 mb-3 rounded-3" style={{ background: 'var(--neu-bg-dark)', border: '2px dashed rgba(154, 172, 196, 0.45)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16" className="text-primary mb-2">
              <path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3Zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5ZM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5Zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5Z"/>
              <path d="M7 2h2v2H7V2Zm0 3h2v2H7V5ZM7 8h2v2H7V8Zm0 3h2v2H7v-2ZM4 2h2v2H4V2Zm0 3h2v2H4V5ZM4 8h2v2H4V8Zm0 3h2v2H4v-2ZM10 2h2v2h-2V2Zm0 3h2v2h-2V5Zm0 8h2v2h-2v-2Z"/>
            </svg>
            <h6 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>Scan or Enter Customer Booking QR</h6>
            <p className="text-muted small mb-0">
              When the client presents their booking QR code, scan or enter the code to verify authenticity and mark the transaction as completed.
            </p>
          </div>

          <Form onSubmit={(e) => { e.preventDefault(); handleVerifyQr(); }}>
            <Form.Group className="mb-3" controlId="qrCodeInput">
              <Form.Label className="small fw-semibold text-muted">QR Code String</Form.Label>
              <Form.Control
                type="text"
                className="neu-input font-monospace"
                placeholder="e.g. SERBISYOU-827d0f19-..."
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
              />
            </Form.Group>

            {pendingQrBookings.length > 0 && (
              <div className="mb-3">
                <div className="small fw-semibold text-muted mb-2">Quick Verify Client Codes:</div>
                <div className="d-flex flex-column gap-2">
                  {pendingQrBookings.map((b) => (
                    <div
                      key={b.transaction_id}
                      className="d-flex justify-content-between align-items-center p-2 rounded-2"
                      style={{ background: 'var(--neu-bg-dark)', border: '1px solid rgba(154, 172, 196, 0.3)' }}
                    >
                      <div className="overflow-hidden me-2">
                        <span className="badge bg-secondary me-2">TX-{b.transaction_id}</span>
                        <code className="small text-truncate d-inline-block" style={{ maxWidth: '300px' }}>{b.qr_code}</code>
                      </div>
                      <Button
                        size="sm"
                        className="neu-btn-primary btn-sm flex-shrink-0"
                        onClick={() => handleVerifyQr(b.qr_code)}
                        disabled={isVerifyingQr}
                      >
                        Verify &amp; Complete
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="d-flex justify-content-end gap-2 pt-2 border-top">
              <Button variant="secondary" className="neu-btn-ghost btn-sm" onClick={() => setShowScannerModal(false)}>
                Cancel
              </Button>
              <Button type="submit" className="neu-btn-primary btn-sm" disabled={isVerifyingQr || !qrInput.trim()}>
                {isVerifyingQr ? 'Verifying...' : 'Verify Code'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}
