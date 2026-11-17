import React, { useEffect, useState } from 'react';
import { Card, Badge, Spinner } from 'react-bootstrap';
import api from '../api/axios';

export default function WeatherWidget({ compact = false }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api
      .get('/weather')
      .then((res) => {
        if (isMounted && res.data?.data) {
          setWeather(res.data.data);
        }
      })
      .catch((err) => {
        console.warn('Weather fetch warning:', err);
        if (isMounted) setError(true);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div
        className="neu-card d-flex align-items-center justify-content-center p-3 mb-3 text-muted small"
        style={{ minHeight: compact ? 60 : 90 }}
      >
        <Spinner animation="border" size="sm" className="me-2 text-primary" />
        <span>Loading campus forecast...</span>
      </div>
    );
  }

  if (error || !weather) {
    return null; // Gracefully hide if completely unreachable
  }

  const {
    location,
    temperature,
    feels_like,
    condition,
    description,
    humidity,
    wind_speed,
    suitable_for_events,
  } = weather;

  if (compact) {
    return (
      <div
        className="neu-card p-2 px-3 mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2"
        style={{
          background: 'linear-gradient(135deg, rgba(6, 58, 143, 0.04) 0%, rgba(255, 255, 255, 0.6) 100%)',
          border: '1px solid rgba(154, 172, 196, 0.3)',
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <span className="fs-4" role="img" aria-label="weather">
            {condition.toLowerCase().includes('rain') ? '🌧️' : condition.toLowerCase().includes('cloud') ? '⛅' : '☀️'}
          </span>
          <div>
            <div className="fw-bold small d-flex align-items-center gap-2" style={{ color: 'var(--neu-text)' }}>
              <span>{temperature}°C</span>
              <span className="text-muted fw-normal" style={{ fontSize: '0.75rem' }}>
                (Feels {feels_like}°C)
              </span>
              <span className="badge bg-light text-primary border" style={{ fontSize: '0.7rem' }}>
                {condition}
              </span>
            </div>
            <div className="text-muted" style={{ fontSize: '0.72rem' }}>
              📍 {location}
            </div>
          </div>
        </div>

        <div>
          {suitable_for_events ? (
            <Badge bg="success" className="px-2 py-1 fw-normal" style={{ fontSize: '0.72rem' }}>
              ✓ Great for Campus Meetups
            </Badge>
          ) : (
            <Badge bg="warning" text="dark" className="px-2 py-1 fw-normal" style={{ fontSize: '0.72rem' }}>
              ⚠️ Rain expected — Meet indoors
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="neu-card p-3 mb-4 position-relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(6, 58, 143, 0.05) 0%, rgba(255, 255, 255, 0.8) 100%)',
        border: '1px solid rgba(154, 172, 196, 0.35)',
      }}
    >
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
        <div className="d-flex align-items-center gap-2">
          <span className="fs-3" role="img" aria-label="forecast">
            {condition.toLowerCase().includes('rain') ? '🌧️' : condition.toLowerCase().includes('cloud') ? '⛅' : '☀️'}
          </span>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h6 className="fw-bold mb-0" style={{ color: 'var(--neu-text)' }}>
                Campus Weather Forecast
              </h6>
              <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
                Live
              </span>
            </div>
            <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
              📍 {location}
            </div>
          </div>
        </div>

        <div>
          {suitable_for_events ? (
            <span
              className="badge px-2.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1"
              style={{
                backgroundColor: 'rgba(25, 135, 84, 0.12)',
                color: '#146c43',
                border: '1px solid rgba(25, 135, 84, 0.25)',
                fontSize: '0.75rem',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                <path d="M12.736 3.97a.75.75 0 0 1 1.028 1.09l-6.5 6.5a.75.75 0 0 1-1.06 0l-3.5-3.5a.75.75 0 1 1 1.06-1.06l2.97 2.97 5.97-5.97z"/>
              </svg>
              Suitable for Outdoor Service / Photography
            </span>
          ) : (
            <span
              className="badge px-2.5 py-1.5 fw-semibold d-inline-flex align-items-center gap-1"
              style={{
                backgroundColor: 'rgba(255, 193, 7, 0.15)',
                color: '#856404',
                border: '1px solid rgba(255, 193, 7, 0.35)',
                fontSize: '0.75rem',
              }}
            >
              ⚠️ Weather advisory: Recommend indoor rendezvous
            </span>
          )}
        </div>
      </div>

      <div className="d-flex align-items-baseline gap-3 mb-2 flex-wrap">
        <span className="fs-2 fw-bold" style={{ color: '#063a8f' }}>
          {temperature}°C
        </span>
        <span className="text-muted small">
          Feels like <strong>{feels_like}°C</strong> &bull; {condition}
        </span>
        <span className="text-muted small ms-auto d-flex gap-3">
          <span>💧 Humidity: <strong>{humidity}%</strong></span>
          <span>💨 Wind: <strong>{wind_speed} m/s</strong></span>
        </span>
      </div>

      <p className="text-muted small mb-0 fst-italic" style={{ fontSize: '0.8rem' }}>
        "{description}"
      </p>
    </div>
  );
}
