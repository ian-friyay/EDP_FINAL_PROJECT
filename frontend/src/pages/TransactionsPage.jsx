import { useState, useEffect, useCallback } from 'react';
import { Container, Spinner, Alert, Button } from 'react-bootstrap';
import TransactionTable from '../components/TransactionTable';
import PayPalModal from '../components/PayPalModal';
import ReviewModal from '../components/ReviewModal';
import QRScannerModal from '../components/QRScannerModal';
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

  // PayPal Payment Modal State for Requestors
  const [selectedPayPalTx, setSelectedPayPalTx] = useState(null);
  const [showPayPalModal, setShowPayPalModal] = useState(false);

  // Review & Rating Modal State for Requestors
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReviewTx, setSelectedReviewTx] = useState(null);
  const [selectedExistingReview, setSelectedExistingReview] = useState(null);
  const [reviewsMap, setReviewsMap] = useState({});

  const currentUserId = currentUser?.user_id || getCurrentUserId();
  const isProvider = String(currentUser?.user_type || '').toLowerCase() === 'provider';

  // Load profile once on mount without triggering re-render loops
  useEffect(() => {
    api.get('/profile/me')
      .then((res) => {
        if (res.data?.user) {
          setCurrentUser(res.data.user);
          window.localStorage.setItem('user', JSON.stringify(res.data.user));
        }
      })
      .catch(() => {});
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await api.get('/reviews');
      const list = res.data?.reviews || [];
      const map = {};
      list.forEach((r) => {
        if (r.transaction_id) {
          map[String(r.transaction_id)] = r;
        }
      });
      setReviewsMap(map);
    } catch (err) {
      console.warn('Failed to load reviews:', err);
    }
  }, []);

  const fetchTransactions = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data.transactions || []);
      fetchReviews();
    } catch (err) {
      console.warn('Failed to load transactions:', err);
      setError('Unable to load latest transactions from server. Please try refreshing.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchReviews]);

  useEffect(() => {
    fetchTransactions(true);
    fetchReviews();
  }, [fetchTransactions, fetchReviews]);

  // Real-time WebSocket listeners for instant booking lifecycle updates
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }
    if (currentUserId) {
      socket.emit('register', currentUserId);
    }

    const handleTransactionChange = () => {
      fetchTransactions(false);
      fetchReviews();
    };

    const handleReviewChange = () => {
      fetchReviews();
    };

    socket.on('transaction_created', handleTransactionChange);
    socket.on('transaction_updated', handleTransactionChange);
    socket.on('review_created', handleReviewChange);
    socket.on('review_broadcast', handleReviewChange);

    return () => {
      socket.off('transaction_created', handleTransactionChange);
      socket.off('transaction_updated', handleTransactionChange);
      socket.off('review_created', handleReviewChange);
      socket.off('review_broadcast', handleReviewChange);
    };
  }, [currentUserId, fetchTransactions, fetchReviews]);

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
      await fetchTransactions(false);
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

  // Find any active/pending bookings for this user (either provider or requestor) that can be verified
  const pendingQrBookings = transactions.filter(
    (t) =>
      (t.service_status === 'accepted' || t.service_status === 'pending') &&
      (String(t.provider_id) === String(currentUserId) || String(t.requestor_id) === String(currentUserId))
  );

  return (
    <Container fluid className="p-0">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>
            {isProvider ? 'Client Bookings & Transactions' : 'My Availed Bookings'}
          </h2>
          <p className="text-muted mb-0">
            {isProvider
              ? 'Manage incoming student client booking requests, track completion, and verify settlement QR codes.'
              : 'View your scheduled campus service bookings, check status, and scan provider verification QR codes.'}
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center flex-wrap">
          {/* Scan QR Code Button for BOTH Provider and Requestor */}
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
          <Button className="neu-btn-ghost btn-sm" onClick={() => fetchTransactions(true)} disabled={isLoading}>
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

      <div className="neu-card mb-5">
        {isLoading && transactions.length === 0 ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 text-muted">Loading live transactions...</p>
          </div>
        ) : (
          <TransactionTable
            transactions={transactions}
            currentUserId={currentUserId}
            onRefresh={() => fetchTransactions(false)}
            onStatusUpdate={handleStatusUpdate}
            reviewsMap={reviewsMap}
            onOpenReviewModal={(tx, existingRev) => {
              setSelectedReviewTx(tx);
              setSelectedExistingReview(existingRev || null);
              setShowReviewModal(true);
            }}
            onPayWithPayPal={(tx) => {
              setSelectedPayPalTx(tx);
              setShowPayPalModal(true);
            }}
          />
        )}
      </div>

      {/* Student Requestor Review & Rating Modal */}
      {showReviewModal && selectedReviewTx && (
        <ReviewModal
          show={showReviewModal}
          onHide={() => {
            setShowReviewModal(false);
            setSelectedReviewTx(null);
            setSelectedExistingReview(null);
          }}
          transaction={selectedReviewTx}
          existingReview={selectedExistingReview}
          onReviewSubmitted={(submittedRev) => {
            setSuccessMsg(`✓ Review submitted: You gave ${submittedRev.rating} stars for Booking #${submittedRev.transaction_id}!`);
            setReviewsMap((prev) => ({
              ...prev,
              [String(submittedRev.transaction_id)]: submittedRev,
            }));
            fetchReviews();
          }}
        />
      )}

      {/* Requestor PayPal Checkout Modal */}
      {showPayPalModal && selectedPayPalTx && (
        <PayPalModal
          show={showPayPalModal}
          onHide={() => setShowPayPalModal(false)}
          transaction={selectedPayPalTx}
          onPaymentSuccess={async (updatedTx) => {
            setSuccessMsg(`✓ Payment of ₱${Number(updatedTx.total_topay || (Number(updatedTx.amount_topay) + 5)).toFixed(2)} completed successfully via PayPal! Booking #${updatedTx.transaction_id} is marked COMPLETED.`);
            setShowPayPalModal(false);
            await fetchTransactions(false);
          }}
        />
      )}

      {/* QR Scanner / Camera Verification Modal for Provider & Requestor */}
      {showScannerModal && (
        <QRScannerModal
          show={showScannerModal}
          onHide={() => setShowScannerModal(false)}
          onVerify={handleVerifyQr}
          isVerifying={isVerifyingQr}
          error={qrModalError}
          success={qrModalSuccess}
          pendingBookings={pendingQrBookings}
          userRole={isProvider ? 'Provider' : 'Requestor'}
        />
      )}
    </Container>
  );
}
