import React, { useState } from 'react';
import { Modal, Button, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function PayPalModal({ show, onHide, transaction, onPaymentSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const navigate = useNavigate();

  if (!transaction) return null;

  const amountTopay = Number(transaction.amount_topay || 0);
  const bookingFee = Number(transaction.booking_fee || 5.0);
  const totalToPay = Number(transaction.total_topay || amountTopay + bookingFee);
  const commission = Math.round(amountTopay * 0.05 * 100) / 100;
  const providerPayout = Math.round((amountTopay - commission) * 100) / 100;

  const handleProcessPayPal = async () => {
    setLoading(true);
    setError('');

    try {
      // Step 1: Create PayPal Order
      const createRes = await api.post('/payments/paypal/create-order', {
        transaction_id: transaction.transaction_id,
      });

      const orderId = createRes.data?.data?.order_id;
      if (!orderId) {
        throw new Error('Failed to obtain PayPal Order ID.');
      }

      // Step 2: Capture PayPal Order (completes transaction & generates paid QR token)
      const captureRes = await api.post('/payments/paypal/capture-order', {
        transaction_id: transaction.transaction_id,
        order_id: orderId,
      });

      const result = captureRes.data?.data;
      setSuccessData(result);
      if (onPaymentSuccess) {
        onPaymentSuccess(result?.transaction || { ...transaction, service_status: 'completed', payment_status: 'paid' });
      }
    } catch (err) {
      console.error('PayPal checkout error:', err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'PayPal payment processing failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewQR = () => {
    onHide();
    navigate(`/transactions/${transaction.transaction_id}/qr`);
  };

  return (
    <Modal show={show} onHide={onHide} centered scrollable size="md">
      <Modal.Header
        closeButton
        style={{
          background: 'var(--neu-bg-dark)',
          borderBottom: '1px solid rgba(154, 172, 196, 0.35)',
        }}
      >
        <Modal.Title className="fw-bold fs-5 d-flex align-items-center gap-2">
          <span style={{ color: '#003087', fontWeight: 800 }}>Pay</span>
          <span style={{ color: '#0079C1', fontWeight: 800 }}>Pal</span>
          <span className="text-muted small fw-normal ms-1">Sandbox Gateway</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ background: 'var(--neu-bg)', maxHeight: 'calc(85vh - 130px)', overflowY: 'auto' }}>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')} className="py-2 small">
            {error}
          </Alert>
        )}

        {successData ? (
          <div className="text-center py-3">
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success text-white mb-3"
              style={{ width: 64, height: 64, fontSize: '1.8rem' }}
            >
              ✓
            </div>
            <h5 className="fw-bold text-success mb-1">Payment Successful!</h5>
            <p className="text-muted small mb-3">
              Your transaction has been paid via PayPal and marked as <strong>COMPLETED</strong>.
            </p>

            <div className="p-3 rounded-4 mb-3 text-start" style={{ background: 'var(--neu-bg-dark)', border: '1px solid rgba(154, 172, 196, 0.35)' }}>
              <div className="d-flex justify-content-between text-muted small mb-1">
                <span>PayPal Order Ref:</span>
                <span className="fw-mono text-dark fw-semibold">{successData.order_id}</span>
              </div>
              <div className="d-flex justify-content-between text-muted small mb-1">
                <span>Amount Paid:</span>
                <strong className="text-primary">₱{totalToPay.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between text-muted small mb-1">
                <span>Platform Commission (5%):</span>
                <span>₱{successData.commission_deducted?.toFixed(2) || commission.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between text-muted small">
                <span>Provider Net Payout:</span>
                <span className="fw-bold text-success">₱{successData.provider_payout?.toFixed(2) || providerPayout.toFixed(2)}</span>
              </div>
              <hr className="my-2 border-secondary opacity-25" />
              <div className="small text-muted">
                <strong>Verification Token:</strong>
                <div className="font-monospace text-truncate text-secondary p-1 rounded mt-1" style={{ background: 'rgba(0,0,0,0.05)', fontSize: '0.75rem' }}>
                  {successData.qr_code}
                </div>
              </div>
            </div>

            <div className="d-flex gap-2 justify-content-center">
              <Button className="neu-btn-primary fw-semibold px-4" onClick={handleViewQR}>
                View Official QR Code
              </Button>
              <Button className="neu-btn-ghost px-3" onClick={onHide}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="p-3 rounded-4 mb-3" style={{ background: 'var(--neu-bg-dark)', border: '1px solid rgba(154, 172, 196, 0.35)' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small">Transaction ID</span>
                <span className="badge bg-secondary font-monospace" style={{ fontSize: '0.75rem' }}>
                  {String(transaction.transaction_id).slice(0, 13)}...
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-1 text-muted small">
                <span>Provider:</span>
                <strong style={{ color: 'var(--neu-text)' }}>{transaction.provider_name || transaction.provider_id || 'Student Provider'}</strong>
              </div>
              {transaction.rendezvous_location && (
                <div className="d-flex justify-content-between align-items-center mb-1 text-muted small">
                  <span>Rendezvous Hub:</span>
                  <span className="text-primary fw-semibold">{transaction.rendezvous_location}</span>
                </div>
              )}
              <hr className="my-2 border-secondary opacity-25" />
              <div className="d-flex justify-content-between text-muted small mb-1">
                <span>Service Fee:</span>
                <span>₱{amountTopay.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between text-muted small mb-1">
                <span>Platform Booking Fee:</span>
                <span>₱{bookingFee.toFixed(2)}</span>
              </div>
              <hr className="my-1 border-secondary opacity-25" />
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-bold" style={{ color: 'var(--neu-text)' }}>Total Amount to Pay:</span>
                <strong className="fs-5" style={{ color: '#063a8f' }}>₱{totalToPay.toFixed(2)}</strong>
              </div>
            </div>

            <div className="neu-card p-3 mb-3" style={{ background: 'linear-gradient(135deg, rgba(0, 112, 186, 0.05) 0%, rgba(255, 255, 255, 0.9) 100%)' }}>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-primary" style={{ fontSize: '0.72rem' }}>5% Platform Protection</span>
                <span className="text-muted small">Includes verified escrow QR code</span>
              </div>
              <div className="text-muted" style={{ fontSize: '0.78rem' }}>
                SerbisYou automatically deducts the 5% platform maintenance commission (<strong>₱{commission.toFixed(2)}</strong>) and credits the net payment (<strong>₱{providerPayout.toFixed(2)}</strong>) to the student provider once verified.
              </div>
            </div>

            {/* PayPal Checkout Button */}
            <Button
              className="w-100 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 mb-2"
              style={{
                backgroundColor: '#0070ba',
                borderColor: '#0070ba',
                color: '#ffffff',
                borderRadius: '24px',
                boxShadow: '0 4px 14px rgba(0, 112, 186, 0.35)',
              }}
              onClick={handleProcessPayPal}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" animation="border" />
                  <span>Connecting to PayPal Sandbox...</span>
                </>
              ) : (
                <>
                  <span style={{ color: '#ffc439', fontWeight: 800 }}>Pay</span>
                  <span style={{ fontWeight: 800 }}>Pal</span>
                  <span className="ms-2">Complete Checkout (₱{totalToPay.toFixed(2)})</span>
                </>
              )}
            </Button>

            <div className="text-center text-muted" style={{ fontSize: '0.72rem' }}>
              🔒 Encrypted &amp; processed via PayPal Sandbox Orders API
            </div>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
