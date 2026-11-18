import React, { useEffect, useState, useRef } from 'react';
import { Spinner } from 'react-bootstrap';
import api from '../api/axios';

export default function WeatherWidget({ compact = false }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

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

  // Close floating popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (loading) {
    return (
      <span className="d-inline-flex align-items-center gap-1.5 px-2.5 py-1 rounded-pill bg-light text-muted small border" style={{ fontSize: '0.78rem' }}>
        <Spinner animation="border" size="sm" style={{ width: '0.75rem', height: '0.75rem' }} />
        <span>Weather...</span>
      </span>
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

  const weatherIcon = condition.toLowerCase().includes('rain')
    ? '🌧️'
    : condition.toLowerCase().includes('cloud')
    ? '⛅'
    : '☀️';

  const shortLocation = location.replace('Campus, ', '').replace('Main Campus', 'Victoria');

  return (
    <div className="position-relative d-inline-block" ref={containerRef}>
      {/* Sleek Integrated Weather Pill */}
      <button
        type="button"
        className="btn d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill shadow-xs transition-all border-0"
        style={{
          background: 'linear-gradient(135deg, rgba(6, 58, 143, 0.08) 0%, rgba(37, 99, 235, 0.05) 100%)',
          color: '#063a8f',
          fontSize: '0.82rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
        onClick={() => setIsOpen(!isOpen)}
        title="Click to view campus weather advisory"
      >
        <span style={{ fontSize: '1.05rem', lineHeight: 1 }}>{weatherIcon}</span>
        <span>{temperature}°C</span>
        <span className="text-muted fw-normal" style={{ fontSize: '0.76rem' }}>
          • {condition}
        </span>
        <span
          className="badge rounded-pill bg-white text-primary border ms-1"
          style={{ fontSize: '0.68rem', fontWeight: 600, padding: '3px 8px' }}
        >
          {shortLocation}
        </span>
        <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {/* Floating Detailed Popover */}
      {isOpen && (
        <div
          className="position-absolute shadow-lg rounded-4 p-3 bg-white"
          style={{
            top: 'calc(100% + 8px)',
            left: 0,
            zIndex: 1050,
            width: '290px',
            border: '1px solid rgba(154, 172, 196, 0.35)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            animation: 'fadeIn 0.15s ease-in-out',
          }}
        >
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
            <div className="d-flex align-items-center gap-1.5 fw-bold text-dark small">
              <span>📍 {location}</span>
            </div>
            <button
              type="button"
              className="btn-close"
              style={{ fontSize: '0.65rem' }}
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            />
          </div>

          {/* Condition & Temperature */}
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div>
              <div className="fs-3 fw-bold" style={{ color: '#063a8f', lineHeight: 1.1 }}>
                {temperature}°C
              </div>
              <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                Feels like {feels_like}°C • {condition}
              </div>
            </div>
            <span style={{ fontSize: '2.2rem' }}>{weatherIcon}</span>
          </div>

          {/* Atmospheric stats */}
          <div
            className="d-flex justify-content-between text-muted small py-1.5 px-2.5 rounded-3 mb-2"
            style={{ background: '#f8fafc', fontSize: '0.74rem' }}
          >
            <span>💧 Humidity: <strong className="text-dark">{humidity}%</strong></span>
            <span>💨 Wind: <strong className="text-dark">{wind_speed} m/s</strong></span>
          </div>

          {/* Event Advisory Badge */}
          <div className="small mb-2">
            {suitable_for_events ? (
              <div
                className="badge w-100 py-1.5 text-wrap fw-normal text-start d-flex align-items-center gap-1.5"
                style={{
                  backgroundColor: 'rgba(25, 135, 84, 0.12)',
                  color: '#146c43',
                  border: '1px solid rgba(25, 135, 84, 0.25)',
                  fontSize: '0.72rem',
                }}
              >
                <span>✓</span>
                <span>Suitable for outdoor photography &amp; campus meetups</span>
              </div>
            ) : (
              <div
                className="badge w-100 py-1.5 text-wrap fw-normal text-start d-flex align-items-center gap-1.5"
                style={{
                  backgroundColor: 'rgba(255, 193, 7, 0.15)',
                  color: '#856404',
                  border: '1px solid rgba(255, 193, 7, 0.35)',
                  fontSize: '0.72rem',
                }}
              >
                <span>⚠️</span>
                <span>Rain advisory: Recommend indoor rendezvous</span>
              </div>
            )}
          </div>

          {description && (
            <div className="text-muted fst-italic" style={{ fontSize: '0.72rem' }}>
              "{description}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
