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
      <Card className="mx-auto text-center shadow-sm">
        <Card.Body>
          <Card.Text className="text-muted mb-0">
            No transaction selected.
          </Card.Text>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="d-flex justify-content-center">
      <Card className="text-center shadow-sm">
        <Card.Header className="bg-primary text-white">
          Transaction QR Code
        </Card.Header>
        <Card.Body className="d-flex flex-column align-items-center">
          <QRCodeCanvas
            ref={canvasRef}
            value={`SERBISYOU-TRANSACTION-${transaction_id}`}
            size={size}
            level="H"
            includeMargin
            aria-label={`QR code for transaction ${transaction_id}`}
          />
          <Card.Text className="mt-3 mb-0 fw-semibold">
            Transaction ID: {transaction_id}
          </Card.Text>
          <Card.Text className="text-muted small">
            Present this QR code when claiming or verifying the service.
          </Card.Text>
          <Stack direction="horizontal" gap={2} className="justify-content-center">
            <Button variant="primary" onClick={handleDownload}>
              Download QR
            </Button>
          </Stack>
        </Card.Body>
      </Card>
    </div>
  );
}

export default TransactionQR;
