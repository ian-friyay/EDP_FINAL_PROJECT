import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import api from '../../api/axios';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/dashboard');
      setData(res.data.data);
    } catch (err) {
      setError('Unable to load administrator dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted fw-semibold">Loading administrator dashboard...</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const trends = data?.registration_trends || [];
  const recentTransactions = data?.recent_transactions || [];
  const maxTrend = Math.max(...trends.map((t) => t.count || 1), 1);

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1" style={{ color: 'var(--neu-primary-dark)' }}>
          Platform Administration Overview
        </h2>
        <p className="text-muted mb-0">
          Monitor campus user registrations, service completion rates, and platform revenue.
        </p>
      </div>

      {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}

      {/* KPI Cards */}
      <Row className="g-4 mb-4">
        {/* Total Users */}
        <Col sm={6} lg={3}>
          <div className="neu-card p-4 rounded-4 h-100">
            <span className="text-muted fw-semibold small text-uppercase">Total Users Registered</span>
            <h2 className="fw-bold mt-2 mb-1" style={{ color: '#000000' }}>
              {summary.total_users || 0}
            </h2>
            <div className="text-muted small">
              Admins: {summary.total_admins || 0} &bull; Students: {summary.total_students || 0}
            </div>
          </div>
        </Col>

        {/* Providers vs Requestors */}
        <Col sm={6} lg={3}>
          <div className="neu-card p-4 rounded-4 h-100">
            <span className="text-muted fw-semibold small text-uppercase">Providers vs Requestors</span>
            <div className="d-flex align-items-baseline gap-2 mt-2 mb-1">
              <h3 className="fw-bold mb-0" style={{ color: '#000000' }}>{summary.total_providers || 0}</h3>
              <span className="text-muted small">Providers</span>
              <span className="text-muted">/</span>
              <h3 className="fw-bold mb-0" style={{ color: '#000000' }}>{summary.total_requestors || 0}</h3>
              <span className="text-muted small">Clients</span>
            </div>
            <div className="text-muted small">Active student marketplace roles</div>
          </div>
        </Col>

        {/* Transactions Breakdown */}
        <Col sm={6} lg={3}>
          <div className="neu-card p-4 rounded-4 h-100">
            <span className="text-muted fw-semibold small text-uppercase">Transactions Breakdown</span>
            <div className="d-flex align-items-baseline gap-2 mt-2 mb-1">
              <h3 className="fw-bold mb-0" style={{ color: '#000000' }}>{summary.completed_transactions || 0}</h3>
              <span className="text-muted small">Done</span>
              <span className="text-muted">/</span>
              <h3 className="fw-bold mb-0" style={{ color: '#000000' }}>{summary.uncompleted_transactions || 0}</h3>
              <span className="text-muted small">Pending</span>
            </div>
            <div className="text-muted small">Cancelled: {summary.cancelled_transactions || 0}</div>
          </div>
        </Col>

        {/* Platform Revenue */}
        <Col sm={6} lg={3}>
          <div className="neu-card p-4 rounded-4 h-100">
            <span className="text-muted fw-semibold small text-uppercase">Platform Revenue</span>
            <h2 className="fw-bold mt-2 mb-1" style={{ color: '#000000' }}>
              ₱{parseFloat(summary.total_revenue || 0).toFixed(2)}
            </h2>
            <div className="text-muted small">5% Commissions + ₱5 Booking Fees</div>
          </div>
        </Col>
      </Row>

      {/* Registration Trends & Revenue Model Breakdown */}
      <Row className="g-4 mb-4">
        {/* Trends Chart */}
        <Col lg={8}>
          <div className="neu-card p-4 rounded-4 h-100">
            <div className="mb-3">
              <h5 className="fw-bold mb-1" style={{ color: 'var(--neu-primary-dark)' }}>
                Student Registration Trends
              </h5>
              <p className="text-muted small mb-0">
                Registration volume aggregated across recent periods
              </p>
            </div>
            {trends.length === 0 ? (
              <p className="text-muted text-center py-4">No historical registration data yet.</p>
            ) : (
              <div className="d-flex flex-column gap-3 pt-2 neu-scroll-sm">
                {trends.map((t, idx) => {
                  const percent = Math.round((t.count / maxTrend) * 100);
                  return (
                    <div key={idx}>
                      <div className="d-flex justify-content-between small fw-semibold mb-1">
                        <span>Period: {t.period || 'Recent'}</span>
                        <span className="text-primary">{t.count} students registered</span>
                      </div>
                      <ProgressBar
                        now={percent}
                        variant={percent > 60 ? 'primary' : percent > 30 ? 'info' : 'secondary'}
                        style={{ height: '14px', borderRadius: '10px' }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Col>

        {/* Revenue Model Breakdown */}
        <Col lg={4}>
          <div className="neu-card p-4 rounded-4 h-100">
            <h5 className="fw-bold mb-3" style={{ color: 'var(--neu-primary-dark)' }}>
              Revenue Model Summary
            </h5>
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <span className="small text-muted">1. Service Commissions (5%):</span>
                <strong className="text-dark">₱{parseFloat(summary.total_commissions || 0).toFixed(2)}</strong>
              </div>
              <div className="small text-muted">Automatically cut from completed transactions</div>
            </div>
            <div className="mb-3">
              <div className="d-flex justify-content-between mb-1">
                <span className="small text-muted">2. Convenience Booking Fees:</span>
                <strong className="text-dark">₱{parseFloat(summary.total_booking_fees || 0).toFixed(2)}</strong>
              </div>
              <div className="small text-muted">₱5 fee charged per service requested</div>
            </div>
            <div className="p-3 rounded-3 mt-3" style={{ background: 'rgba(17, 122, 62, 0.1)', border: '1px solid rgba(17, 122, 62, 0.25)' }}>
              <div className="d-flex justify-content-between fw-bold text-success">
                <span>Total Platform Revenue:</span>
                <span>₱{parseFloat(summary.total_revenue || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Recent Transactions Table */}
      <div className="neu-card p-4 rounded-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-0" style={{ color: 'var(--neu-primary-dark)' }}>
              Recent Platform Transactions
            </h5>
            <p className="text-muted small mb-0">Latest bookings, commissions, and payment statuses</p>
          </div>
          <Badge bg="primary" className="rounded-pill px-3 py-2">
            {recentTransactions.length} Total
          </Badge>
        </div>

        {recentTransactions.length === 0 ? (
          <p className="text-muted text-center py-4">No recent transactions recorded yet.</p>
        ) : (
          <div className="table-responsive neu-scroll-table">
            <Table hover className="align-middle mb-0">
              <thead>
                <tr className="text-muted small text-uppercase" style={{ borderBottom: '2px solid rgba(154, 172, 196, 0.4)' }}>
                  <th>ID</th>
                  <th>Provider</th>
                  <th>Client</th>
                  <th>Service Price</th>
                  <th>Booking Fee</th>
                  <th>Commission (5%)</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map((tx) => (
                  <tr key={tx.id || tx.transaction_id}>
                    <td className="fw-bold font-monospace">#{tx.transaction_id}</td>
                    <td>
                      <div className="fw-semibold text-dark">{tx.provider_name}</div>
                      <div className="small text-muted font-monospace">{tx.provider_id}</div>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{tx.requestor_name}</div>
                      <div className="small text-muted font-monospace">{tx.requestor_id}</div>
                    </td>
                    <td>₱{parseFloat(tx.amount_topay || 0).toFixed(2)}</td>
                    <td className="text-muted">₱{parseFloat(tx.booking_fee || 5).toFixed(2)}</td>
                    <td className="text-success fw-semibold">₱{parseFloat(tx.commission_fee || 0).toFixed(2)}</td>
                    <td className="fw-bold">₱{parseFloat(tx.total_topay || 0).toFixed(2)}</td>
                    <td>
                      <Badge
                        bg={
                          tx.status === 'completed'
                            ? 'success'
                            : tx.status === 'cancelled'
                            ? 'danger'
                            : 'warning'
                        }
                        className="rounded-pill px-3 py-1"
                      >
                        {tx.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
