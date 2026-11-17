import React, { useState, useEffect } from 'react';
import { Carousel, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import AdRequestModal from './AdRequestModal';

export default function AdBanner() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  const fetchActiveAds = () => {
    api
      .get('/advertisements/active')
      .then((res) => {
        if (res.data?.data) {
          setAds(res.data.data);
        }
      })
      .catch((err) => console.warn('Could not fetch active ads:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchActiveAds();
  }, []);

  const handleLinkClick = (url) => {
    if (!url) return;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      navigate(url);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className="campus-ad-banner-container mb-4">
      {/* Top Banner Control Header */}
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="d-flex align-items-center gap-2">
          <span className="badge rounded-pill bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1 fw-bold">
            📢 Campus Spotlight &amp; Promos
          </span>
          <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
            Official Student &amp; Org Marketplace Ads
          </span>
        </div>

        <Button
          size="sm"
          className="neu-btn-primary fw-semibold px-3 d-inline-flex align-items-center gap-1.5"
          style={{ fontSize: '0.8rem' }}
          onClick={() => setShowModal(true)}
        >
          <span>+</span>
          <span>Post Campus Ad (₱2/day)</span>
        </Button>
      </div>

      {ads.length > 0 ? (
        <div
          className="neu-card p-0 overflow-hidden position-relative shadow-sm"
          style={{ borderRadius: '16px', border: '1px solid rgba(154, 172, 196, 0.4)' }}
        >
          <Carousel indicators={ads.length > 1} controls={ads.length > 1} interval={6000} pause="hover">
            {ads.map((ad, idx) => (
              <Carousel.Item key={ad.id || idx}>
                <div
                  className="position-relative w-100 d-flex flex-column justify-content-end"
                  style={{
                    height: '240px',
                    backgroundImage: `linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.35) 60%, rgba(0, 0, 0, 0.15) 100%), url(${ad.banner_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    padding: '24px',
                    color: '#ffffff',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-end flex-wrap gap-2">
                    <div style={{ maxWidth: '75%' }}>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <Badge bg="warning" text="dark" className="fw-bold" style={{ fontSize: '0.7rem' }}>
                          SPONSORED
                        </Badge>
                        <span className="text-white-50 small" style={{ fontSize: '0.78rem' }}>
                          By {ad.advertiser_name || 'Student Creator'}
                        </span>
                      </div>
                      <h4 className="fw-bold text-white mb-1" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
                        {ad.title}
                      </h4>
                      <p
                        className="text-white-50 small mb-0 text-truncate"
                        style={{ maxWidth: '600px', fontSize: '0.85rem' }}
                      >
                        {ad.description}
                      </p>
                    </div>

                    <div>
                      <Button
                        size="sm"
                        className="btn btn-light fw-bold px-3 py-1.5 shadow-sm rounded-pill"
                        style={{ color: '#063a8f' }}
                        onClick={() => handleLinkClick(ad.target_url || '/services')}
                      >
                        Learn More &rarr;
                      </Button>
                    </div>
                  </div>
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        </div>
      ) : (
        <div
          className="neu-card p-4 text-center d-flex flex-column align-items-center justify-content-center"
          style={{ borderRadius: '16px', background: 'var(--neu-bg-dark)' }}
        >
          <span className="fs-3 mb-2">📢</span>
          <h6 className="fw-bold mb-1" style={{ color: 'var(--neu-text)' }}>
            Advertise Your Service or Campus Event Here
          </h6>
          <p className="text-muted small mb-3" style={{ maxWidth: 450 }}>
            Reach all student requestors and providers with banner advertising across the marketplace. Rates start at only ₱2.00 per day!
          </p>
          <Button size="sm" className="neu-btn-primary px-3" onClick={() => setShowModal(true)}>
            Post Your First Campus Ad
          </Button>
        </div>
      )}

      {/* Request Modal */}
      <AdRequestModal
        show={showModal}
        onHide={() => setShowModal(false)}
        onAdCreated={() => {
          fetchActiveAds();
        }}
      />
    </div>
  );
}
