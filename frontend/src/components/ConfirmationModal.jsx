import React from 'react';
import { Modal, Button, Spinner } from 'react-bootstrap';

export default function ConfirmationModal({
  show,
  onHide,
  onConfirm,
  title = 'Do you really want to proceed?',
  message = 'Please confirm if you would like to submit these changes.',
  submessage,
  confirmText = 'Yes, Proceed',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  loading = false,
  icon,
}) {
  return (
    <Modal show={show} onHide={loading ? undefined : onHide} centered backdrop="static" keyboard={!loading}>
      <Modal.Body className="p-4 text-center neu-card" style={{ border: 'none', background: 'var(--neu-bg)' }}>
        <div
          className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
          style={{
            width: '64px',
            height: '64px',
            backgroundColor:
              confirmVariant === 'danger'
                ? '#fef2f2'
                : confirmVariant === 'warning'
                ? '#fffbeb'
                : 'rgba(255, 120, 40, 0.15)',
            color:
              confirmVariant === 'danger'
                ? '#ef4444'
                : confirmVariant === 'warning'
                ? '#f59e0b'
                : '#ff7828',
          }}
        >
          {icon || (
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </div>

        <h5 className="fw-bold mb-2" style={{ color: 'var(--neu-text)' }}>{title}</h5>
        <p className="text-muted mb-3" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
          {message}
        </p>

        {submessage && (
          <div className="p-3 mb-4 rounded-3 text-start small neu-card-inset">
            {submessage}
          </div>
        )}

        <div className="d-flex justify-content-center gap-2 mt-4">
          <Button
            className="neu-btn-outline rounded-pill px-4 py-2 fw-semibold"
            onClick={onHide}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            className="neu-btn-orange rounded-pill px-4 py-2 fw-bold text-white shadow-sm d-inline-flex align-items-center gap-2"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Spinner size="sm" animation="border" />}
            <span>{confirmText}</span>
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}
