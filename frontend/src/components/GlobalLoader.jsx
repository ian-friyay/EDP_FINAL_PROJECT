import React from 'react';
import { Spinner, Card } from 'react-bootstrap';

/**
 * GlobalLoader
 *
 * A reusable full-screen blocking loader with a semi-transparent dark overlay.
 * Centered on the screen to block user interactions during asynchronous API calls
 * (e.g., Supabase transactions, service updates, messaging, or authentication).
 *
 * @param {boolean} show - Controls visibility of the loader overlay (default: true)
 * @param {string} message - Primary loader message (e.g., 'Loading...', 'Processing Transaction...')
 * @param {string} subMessage - Optional secondary descriptive text
 * @param {string} variant - React-Bootstrap Spinner variant ('primary', 'light', 'success', etc.)
 */
export default function GlobalLoader({
  show = true,
  message = 'Loading...',
  subMessage = 'Please wait while we communicate with the SerbisYou server.',
  variant = 'primary',
}) {
  if (!show) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-dark bg-opacity-75"
      style={{
        zIndex: 9999,
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Card
        className="bg-white text-dark shadow-lg border-0 rounded-4 p-4 text-center mx-3"
        style={{ maxWidth: '360px', width: '100%' }}
      >
        <Card.Body className="p-2 d-flex flex-column align-items-center">
          {/* React-Bootstrap Spinner */}
          <div className="mb-3 d-flex align-items-center justify-content-center">
            <Spinner
              animation="border"
              variant={variant}
              style={{ width: '3.5rem', height: '3.5rem', borderWidth: '0.35rem' }}
            >
              <span className="visually-hidden">{message}</span>
            </Spinner>
          </div>

          {/* Primary Message */}
          <h5 className="fw-bold mb-2 text-dark">
            {message}
          </h5>

          {/* Subtitle / Context Message */}
          {subMessage && (
            <p className="text-muted small mb-0">
              {subMessage}
            </p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
