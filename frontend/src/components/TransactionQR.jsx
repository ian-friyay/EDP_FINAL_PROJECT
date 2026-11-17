import { useRef, useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Card, Button, Stack, Badge, Spinner } from 'react-bootstrap';
import api from '../api/axios';

function TransactionQR({ transaction_id, size = 200 }) {
  const canvasRef = useRef(null);
  const [txDetails, setTxDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!transaction_id) return;
    setLoading(true);
    api
      .get('/transactions')
      .then((res) => {
        const list = res.data?.transactions || [];
        const found = list.find((t) => String(t.transaction_id) === String(transaction_id));
        if (found) {
          setTxDetails(found);
        }
      })
      .catch((err) => console.warn('Could not load transaction QR details:', err))
      .finally(() => setLoading(false));
  }, [transaction_id]);

  const handleDownload = () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');

      downloadLink.href = pngUrl;
      downloadLink.download = `transaction-${transaction_id}-qr.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error('Failed to download QR code:', error);
    }
  };

  if (!transaction_id) {
    return (
      <div className="d-flex justify-content-center">
        <Card className="neu-qr-card mx-auto text-center">
          <Card.Body className="neu-qr-body">
            <Card.Text className="text-muted mb-0">No transaction selected.</Card.Text>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const qrPayload =
    txDetails?.qr_code || `SERBISYOU-TRANSACTION-${transaction_id}`;
  const isPaid =
    txDetails?.payment_status === 'paid' ||
    txDetails?.service_status === 'completed' ||
    qrPayload.includes('PAYPAL');

  return (
    <div className="d-flex justify-content-center">
      <Card className="neu-qr-card text-center" style={{ maxWidth: 440, width: '100%' }}>
        <div className="neu-qr-header text-center d-flex align-items-center justify-content-center gap-2 py-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5zM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5z"/>
            <path d="M4 4h1v1H4V4zm3 0h1v1H7V4zm3 0h1v1h-1V4zM4 7h1v1H4V7zm3 0h1v1H7V7zm3 0h1v1h-1V7zM4 10h1v1H4v-1zm3 0h1v1H7v-1zm3 0h1v1h-1v-1z"/>
          </svg>
          <span className="fw-bold">Official Verification Voucher</span>
        </div>

        <Card.Body className="neu-qr-body p-4">
          {/* Status & Payment Indicator */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Badge
              bg={
                txDetails?.service_status === 'completed'
                  ? 'success'
                  : txDetails?.service_status === 'accepted'
                  ? 'primary'
                  : 'warning'
              }
              text={txDetails?.service_status === 'pending' ? 'dark' : 'white'}
              className="px-3 py-1.5 rounded-pill"
            >
              Status: {String(txDetails?.service_status || 'Active').toUpperCase()}
            </Badge>

            {isPaid ? (
              <Badge bg="success" className="px-2.5 py-1.5 rounded-pill d-inline-flex align-items-center gap-1">
                <span>✓ Paid via PayPal</span>
              </Badge>
            ) : (
              <Badge bg="secondary" className="px-2.5 py-1.5 rounded-pill">
                Cash on Meetup
              </Badge>
            )}
          </div>

          {/* QR Code Canvas */}
          <div className="p-3 rounded-4 mb-3" style={{ background: '#ffffff', display: 'inline-block', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <QRCodeCanvas
              ref={canvasRef}
              value={qrPayload}
              size={size}
              level="H"
              includeMargin
              aria-label={`QR code for transaction ${transaction_id}`}
            />
          </div>

          <div className="p-3 rounded-3 mb-3 text-start" style={{ background: 'var(--neu-bg-dark)', border: '1px solid rgba(154, 172, 196, 0.3)' }}>
            <div className="d-flex justify-content-between text-muted small mb-1">
              <span>Transaction Ref:</span>
              <span className="font-monospace fw-bold text-dark">{String(transaction_id).slice(0, 16)}...</span>
            </div>
            {txDetails?.rendezvous_location && (
              <div className="d-flex justify-content-between text-muted small mb-1">
                <span>Rendezvous Hub:</span>
                <span className="fw-semibold text-primary">{txDetails.rendezvous_location}</span>
              </div>
            )}
            <div className="d-flex justify-content-between text-muted small">
              <span>Total Amount:</span>
              <strong className="fs-6" style={{ color: '#063a8f' }}>
                ₱{Number(txDetails?.total_topay || txDetails?.amount_topay || 0).toFixed(2)}
              </strong>
            </div>
          </div>

          <Card.Text className="text-muted small mb-3">
            Present this QR voucher to the student provider when meeting at the designated campus landmark. The provider will scan it to verify and close the service escrow.
          </Card.Text>

          <Stack direction="horizontal" gap={2} className="justify-content-center">
            <Button className="neu-btn-primary px-4 fw-semibold" onClick={handleDownload}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
              </svg>
              Download Voucher
            </Button>
          </Stack>
        </Card.Body>
      </Card>
    </div>
  );
}

export default TransactionQR;
