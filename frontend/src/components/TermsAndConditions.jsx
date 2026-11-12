import React from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Badge,
  Alert,
  Table,
  Button,
} from 'react-bootstrap';
import { Link } from 'react-router-dom';

export default function TermsAndConditions() {
  return (
    <div className="neu-main py-4 py-md-5 min-vh-100">
      <Container className="px-3 px-md-4" style={{ maxWidth: '960px' }}>
        {/* Navigation & Back Action */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <Button
            as={Link}
            to="/"
            className="neu-btn-ghost rounded-pill px-3 d-inline-flex align-items-center gap-2"
            size="sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z" />
            </svg>
            <span>Back to Dashboard</span>
          </Button>
          <div className="text-muted small">
            Effective Date: <strong>November 10, 2026</strong> | Version 1.2
          </div>
        </div>

        {/* Page Title Card */}
        <div className="neu-card p-4 p-md-5 mb-4">
          <div className="mb-2">
            <Badge
              className="px-3 py-2 rounded-pill fw-bold shadow-sm"
              style={{
                backgroundColor: '#eef4fa',
                color: '#063a8f',
                border: '1px solid rgba(6, 58, 143, 0.25)',
              }}
            >
              SerbisYou Service Marketplace
            </Badge>
          </div>
          <h1 className="display-6 fw-bold mb-2" style={{ color: 'var(--neu-text)' }}>
            Terms and Conditions
          </h1>
          <p className="lead text-muted mb-0">
            Please read these terms carefully before creating an account or using any service on the SerbisYou marketplace platform.
          </p>
        </div>

        {/* Quick Highlights Alert */}
        <div className="neu-alert p-4 mb-4">
          <div className="d-flex align-items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16" className="flex-shrink-0" style={{ color: 'var(--neu-primary)' }}>
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
            </svg>
            <h5 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>Key Platform Highlights</h5>
          </div>
          <ul className="mb-0 small text-secondary">
            <li><strong>Verified Accounts:</strong> Every user is registered under a unique <code>MMC-XXXX</code> account identifier.</li>
            <li><strong>Flat Booking Fee:</strong> A transparent, standard <strong>₱5.00</strong> fee applies to every booking transaction.</li>
            <li><strong>Fair Commission:</strong> A minimal <strong>5%</strong> platform commission is deducted from the service provider's earnings.</li>
            <li><strong>Audit &amp; Evidence:</strong> Official in-app messages and photo proof (<code>picture_proof</code>) govern dispute resolution.</li>
          </ul>
        </div>

        {/* Section 1: User Responsibilities */}
        <div className="neu-terms-section p-4 p-md-5 mb-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5 px-3 py-1">
              1
            </div>
            <h3 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>User Responsibilities</h3>
          </div>

          <p className="text-muted">
            All users registered on SerbisYou must classify themselves as either a <strong>Provider</strong> or a <strong>Requestor</strong> (<code>user_type</code>). By registering, users agree to uphold community trust, transparency, and safety.
          </p>

          <h5 className="fw-bold mt-3 mb-2" style={{ color: 'var(--neu-text)' }}>1.1 Account Integrity &amp; Identification</h5>
          <p className="text-secondary small">
            Each user receives a unique system identifier formatted as <code>MMC-XXXX</code> (e.g., <code>MMC-1042</code>). Users are strictly required to provide legitimate personal information, including legal first and last names, an active Philippine mobile contact number, and verified geographic details (Region, Province, City, and Barangay).
          </p>

          <h5 className="fw-bold mt-3 mb-2" style={{ color: 'var(--neu-text)' }}>1.2 Requestor Responsibilities</h5>
          <ul className="text-secondary small">
            <li>Ensure accurate service descriptions, address details (down to the specific barangay), and special access requirements when booking.</li>
            <li>Provide a safe, hazard-free environment for the service provider during on-site tasks.</li>
            <li>Promptly review and verify the service upon completion before authorizing final QR code payment.</li>
          </ul>

          <h5 className="fw-bold mt-3 mb-2" style={{ color: 'var(--neu-text)' }}>1.3 Provider Responsibilities</h5>
          <ul className="text-secondary small">
            <li>Maintain accurate and up-to-date service listings with realistic pricing (<code>amount_topay</code>) and truthful categories.</li>
            <li>Upload valid photographic evidence (<code>picture_proof</code>) of completed work to maintain accountability and dispute protection.</li>
            <li>Toggle service availability truthfully between <code>active</code> and <code>inactive</code> status to prevent unfulfilled requests.</li>
          </ul>

          <h5 className="fw-bold mt-3 mb-2" style={{ color: 'var(--neu-text)' }}>1.4 Administrative Privileges &amp; Soft Deletion</h5>
          <p className="text-secondary small mb-0">
            Administrative attributes (<code>department</code> and <code>designation</code>) are reserved exclusively for authorized system administrators. Accounts marked for closure are soft-deleted via <code>is_active = false</code> to ensure transaction and dispute audit trails remain preserved.
          </p>
        </div>

        {/* Section 2: Payment Terms */}
        <div className="neu-terms-section p-4 p-md-5 mb-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5 px-3 py-1">
              2
            </div>
            <h3 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>Payment Terms</h3>
          </div>

          <p className="text-muted">
            SerbisYou enforces complete fee transparency for all service transactions between Providers and Requestors.
          </p>

          <div className="neu-table-wrapper my-3">
            <Table bordered hover className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Fee Component</th>
                  <th>Rate / Calculation</th>
                  <th>Applicable Party</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody className="small">
                <tr>
                  <td className="fw-bold" style={{ color: 'var(--neu-primary)' }}>Service Rate (<code>amount_topay</code>)</td>
                  <td>Set by Provider per listing</td>
                  <td>Requestor pays</td>
                  <td>Direct compensation for labor and materials.</td>
                </tr>
                <tr>
                  <td className="fw-bold text-info">Platform Booking Fee</td>
                  <td><strong>₱5.00 Flat Rate</strong></td>
                  <td>Requestor pays</td>
                  <td>Covers platform connectivity and server maintenance.</td>
                </tr>
                <tr>
                  <td className="fw-bold text-success">Total to Pay (<code>total_topay</code>)</td>
                  <td><code>amount_topay + ₱5.00</code></td>
                  <td>Requestor pays</td>
                  <td>Total gross amount charged upon booking acceptance.</td>
                </tr>
                <tr>
                  <td className="fw-bold text-warning">Platform Commission</td>
                  <td><strong>5% of amount_topay</strong></td>
                  <td>Provider pays (deducted)</td>
                  <td>Marketplace facilitation, marketing, and dispute insurance.</td>
                </tr>
              </tbody>
            </Table>
          </div>

          <h5 className="fw-bold mt-3 mb-2" style={{ color: 'var(--neu-text)' }}>2.1 Settlement via QR Code</h5>
          <p className="text-secondary small">
            Upon service completion (<code>service_status = 'completed'</code>), settlement must be conducted using the official generated merchant <strong>QR Code</strong> attached to the transaction record. Direct off-platform cash circumvention that bypasses the recording system voids platform dispute coverage.
          </p>

          <h5 className="fw-bold mt-3 mb-2" style={{ color: 'var(--neu-text)' }}>2.2 Non-Refundable Booking Fees</h5>
          <p className="text-secondary small mb-0">
            The standard ₱5.00 booking fee is committed at the time a transaction enters the <code>accepted</code> status and is non-refundable, except in cases where a Provider cancels without justifiable cause or fails to arrive.
          </p>
        </div>

        {/* Section 3: Dispute Resolution */}
        <div className="neu-terms-section p-4 p-md-5 mb-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <div className="bg-warning text-dark rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5 px-3 py-1">
              3
            </div>
            <h3 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>Dispute Resolution</h3>
          </div>

          <p className="text-muted">
            Disagreements regarding service quality, incomplete work, cancellations, or payment mismatches follow an evidence-based mediation protocol.
          </p>

          <h5 className="fw-bold mt-3 mb-2" style={{ color: 'var(--neu-text)' }}>3.1 Transaction Status States</h5>
          <p className="text-secondary small">
            All transactions progress through defined lifecycle states: <code>pending</code> &rarr; <code>accepted</code> &rarr; <code>completed</code> (or <code>cancelled</code>). Disputes may only be formally lodged while a transaction is in the <code>accepted</code> or <code>completed</code> state within 48 hours of service execution.
          </p>

          <h5 className="fw-bold mt-3 mb-2" style={{ color: 'var(--neu-text)' }}>3.2 Official Evidentiary Records</h5>
          <p className="text-secondary small">
            In resolving disputes between <code>provider_id</code> and <code>requestor_id</code>, SerbisYou administrators review only official platform data:
          </p>
          <ul className="text-secondary small">
            <li><strong>In-App Chat Logs:</strong> Official records from the <code>messages</code> table, including exact message content, sender ID, receiver ID, and server timestamps. Communications outside the app cannot be verified.</li>
            <li><strong>Photographic Proof:</strong> Before-and-after photographs uploaded to the service's <code>picture_proof</code> repository.</li>
            <li><strong>Transaction Status Timeline:</strong> Recorded timestamps and QR payment verification logs.</li>
          </ul>

          <h5 className="fw-bold mt-3 mb-2" style={{ color: 'var(--neu-text)' }}>3.3 Resolution Decisions &amp; Sanctions</h5>
          <p className="text-secondary small mb-0">
            SerbisYou mediation decisions are binding. Proven instances of fraudulent billing, non-performance, or harassment will result in immediate account deactivation (<code>is_active = false</code>) and referral to local barangay authorities where appropriate.
          </p>
        </div>

        {/* Section 4: Privacy & Soft Deletion Policy */}
        <div className="neu-terms-section p-4 p-md-5 mb-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <div className="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5 px-3 py-1">
              4
            </div>
            <h3 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>Data Privacy &amp; Retention</h3>
          </div>
          <p className="text-secondary small">
            SerbisYou complies with the Philippine Data Privacy Act of 2012. User credentials, contact numbers, and location details are strictly used to facilitate local service connections.
          </p>
          <p className="text-secondary small mb-0">
            In compliance with financial audit regulations, services (<code>is_deleted = true</code>) and user accounts (<code>is_active = false</code>) employ soft deletion so historical transaction logs, booking fees, and commission calculations remain auditable.
          </p>
        </div>

        {/* Acceptance Action Banner */}
        <div
          className="neu-card text-white p-4 p-md-5 text-center"
          style={{
            background: 'linear-gradient(135deg, var(--neu-primary-dark) 0%, var(--neu-primary) 100%)',
            boxShadow: '0 4px 20px rgba(6, 58, 143, 0.4)',
          }}
        >
          <h4 className="fw-bold mb-2">Questions or Need Assistance?</h4>
          <p className="opacity-75 small mb-4 col-md-10 mx-auto">
            If you have questions regarding these terms, your MMC identifier, or a pending transaction dispute, contact our support team.
          </p>
          <div className="d-flex justify-content-center gap-2 flex-wrap">
            <Button
              as="a"
              href="mailto:support@serbisyou.ph"
              variant="light"
              className="rounded-pill px-4 fw-semibold text-primary shadow-sm"
            >
              Contact Support (support@serbisyou.ph)
            </Button>
            <Button
              as={Link}
              to="/"
              variant="outline-light"
              className="rounded-pill px-4 fw-semibold"
            >
              I Understand &amp; Agree
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
