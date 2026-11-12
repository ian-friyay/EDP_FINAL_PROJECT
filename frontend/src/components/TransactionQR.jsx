import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Card, Button, Stack } from 'react-bootstrap';

function TransactionQR({ transaction_id, size = 200 }) {
  const canvasRef = useRef(null);

  const handleDownload = () => {
    try {
      const canvas = canvasRef.current;

      if (!canvas) {
        return;
      }

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
            <Card.Text className="text-muted mb-0">
              No transaction selected.
            </Card.Text>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center">
      <Card className="neu-qr-card text-center">
        <div className="neu-qr-header text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" className="me-2">
            <path d="M0 .5A.5.5 0 0 1 .5 0h3a.5.5 0 0 1 0 1H1v2.5a.5.5 0 0 1-1 0v-3zm12 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V1h-2.5a.5.5 0 0 1-.5-.5zM.5 12a.5.5 0 0 1 .5.5V15h2.5a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5v-3a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H15v-2.5a.5.5 0 0 1 .5-.5z"/>
            <path d="M4 4h1v1H4V4zm3 0h1v1H7V4zm3 0h1v1h-1V4zM4 7h1v1H4V7zm3 0h1v1H7V7zm3 0h1v1h-1V7zM4 10h1v1H4v-1zm3 0h1v1H7v-1zm3 0h1v1h-1v-1z"/>
          </svg>
          Transaction QR Code
        </div>
        <Card.Body className="neu-qr-body">
          <div className="p-3 rounded-3 mb-3" style={{ background: '#fff', display: 'inline-block' }}>
            <QRCodeCanvas
              ref={canvasRef}
              value={`SERBISYOU-TRANSACTION-${transaction_id}`}
              size={size}
              level="H"
              includeMargin
              aria-label={`QR code for transaction ${transaction_id}`}
            />
          </div>
          <Card.Text className="mt-2 mb-0 fw-bold" style={{ color: 'var(--neu-text)' }}>
            Transaction ID: {transaction_id}
          </Card.Text>
          <Card.Text className="text-muted small mb-3">
            Present this QR code when claiming or verifying the service.
          </Card.Text>
          <Stack direction="horizontal" gap={2} className="justify-content-center">
            <Button className="neu-btn-primary px-4" onClick={handleDownload}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="me-2">
                <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
              </svg>
              Download QR
            </Button>
          </Stack>
        </Card.Body>
      </Card>
    </div>
  );
}

export default TransactionQR;
