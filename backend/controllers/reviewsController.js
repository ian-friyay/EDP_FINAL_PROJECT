const path = require('path');
const fs = require('fs');
const supabase = require('../db');
const { createNotification } = require('./notificationController');

const DATA_DIR = path.join(__dirname, '..', 'data');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

const loadReviewsFromFile = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(REVIEWS_FILE)) {
      const raw = fs.readFileSync(REVIEWS_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn('[ReviewsController] Failed to read reviews.json:', err.message);
  }
  return [];
};

const saveReviewsToFile = (reviews) => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf8');
  } catch (err) {
    console.error('[ReviewsController] Failed to write reviews.json:', err.message);
  }
};

const computeRatingStats = (reviewsList) => {
  if (!Array.isArray(reviewsList) || reviewsList.length === 0) {
    return { averageRating: 5.0, reviewCount: 0 };
  }
  const total = reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  const avg = total / reviewsList.length;
  return {
    averageRating: Number(avg.toFixed(1)),
    reviewCount: reviewsList.length,
  };
};

// GET /api/reviews
const getAllReviews = async (req, res) => {
  try {
    let reviews = [];
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data) && data.length > 0) {
        reviews = data;
      }
    } catch {}

    if (reviews.length === 0) {
      reviews = loadReviewsFromFile();
    }

    // Build summaries by service_id and provider_id for rapid UI lookups
    const summaryByService = {};
    const summaryByProvider = {};

    reviews.forEach((r) => {
      const sId = String(r.service_id || '');
      const pId = String(r.provider_id || '');

      if (sId) {
        if (!summaryByService[sId]) summaryByService[sId] = [];
        summaryByService[sId].push(r);
      }
      if (pId) {
        if (!summaryByProvider[pId]) summaryByProvider[pId] = [];
        summaryByProvider[pId].push(r);
      }
    });

    const formattedServiceSummary = {};
    Object.keys(summaryByService).forEach((sId) => {
      formattedServiceSummary[sId] = computeRatingStats(summaryByService[sId]);
    });

    const formattedProviderSummary = {};
    Object.keys(summaryByProvider).forEach((pId) => {
      formattedProviderSummary[pId] = computeRatingStats(summaryByProvider[pId]);
    });

    return res.status(200).json({
      reviews,
      summaryByService: formattedServiceSummary,
      summaryByProvider: formattedProviderSummary,
    });
  } catch (err) {
    console.error('getAllReviews error:', err);
    return res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
};

// GET /api/reviews/service/:serviceId
const getServiceReviews = async (req, res) => {
  try {
    const { serviceId } = req.params;
    if (!serviceId) {
      return res.status(400).json({ error: 'Service ID is required.' });
    }

    let serviceReviews = [];
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('service_id', String(serviceId))
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        serviceReviews = data;
      }
    } catch {}

    if (serviceReviews.length === 0) {
      const all = loadReviewsFromFile();
      serviceReviews = all.filter((r) => String(r.service_id) === String(serviceId));
    }

    const { averageRating, reviewCount } = computeRatingStats(serviceReviews);

    return res.status(200).json({
      reviews: serviceReviews,
      averageRating,
      reviewCount,
    });
  } catch (err) {
    console.error('getServiceReviews error:', err);
    return res.status(500).json({ error: 'Failed to fetch service reviews.' });
  }
};

// GET /api/reviews/provider/:providerId
const getProviderReviews = async (req, res) => {
  try {
    const { providerId } = req.params;
    if (!providerId) {
      return res.status(400).json({ error: 'Provider ID is required.' });
    }

    let providerReviews = [];
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('provider_id', String(providerId))
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        providerReviews = data;
      }
    } catch {}

    if (providerReviews.length === 0) {
      const all = loadReviewsFromFile();
      providerReviews = all.filter((r) => String(r.provider_id) === String(providerId));
    }

    const { averageRating, reviewCount } = computeRatingStats(providerReviews);

    return res.status(200).json({
      reviews: providerReviews,
      averageRating,
      reviewCount,
    });
  } catch (err) {
    console.error('getProviderReviews error:', err);
    return res.status(500).json({ error: 'Failed to fetch provider reviews.' });
  }
};

// GET /api/reviews/transaction/:transactionId
const getTransactionReview = async (req, res) => {
  try {
    const { transactionId } = req.params;
    if (!transactionId) {
      return res.status(400).json({ error: 'Transaction ID is required.' });
    }

    const all = loadReviewsFromFile();
    const found = all.find((r) => String(r.transaction_id) === String(transactionId));

    return res.status(200).json({ review: found || null });
  } catch (err) {
    console.error('getTransactionReview error:', err);
    return res.status(500).json({ error: 'Failed to fetch transaction review.' });
  }
};

// POST /api/reviews
const createReview = async (req, res) => {
  try {
    const reviewerId = req.user?.user_id;
    if (!reviewerId) {
      return res.status(401).json({ error: 'Unauthorized. Please sign in to submit a review.' });
    }

    const { transaction_id, service_id, provider_id, rating, comment } = req.body || {};

    const numRating = Number(rating);
    if (!Number.isFinite(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be a number between 1.0 and 5.0.' });
    }

    if (!provider_id) {
      return res.status(400).json({ error: 'Provider ID is required.' });
    }

    // Determine user names
    let reviewerName = `${req.user?.first_name || ''} ${req.user?.last_name || ''}`.trim() || req.user?.username || String(reviewerId);
    let providerName = String(provider_id);

    try {
      const { data: userData } = await supabase
        .from('users')
        .select('user_id, first_name, last_name, username')
        .in('user_id', [String(reviewerId), String(provider_id)]);

      if (Array.isArray(userData)) {
        const revUser = userData.find((u) => String(u.user_id) === String(reviewerId));
        if (revUser) {
          reviewerName = `${revUser.first_name || ''} ${revUser.last_name || ''}`.trim() || revUser.username || reviewerName;
        }
        const provUser = userData.find((u) => String(u.user_id) === String(provider_id));
        if (provUser) {
          providerName = `${provUser.first_name || ''} ${provUser.last_name || ''}`.trim() || provUser.username || providerName;
        }
      }
    } catch {}

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newReview = {
      id: `rev_${Date.now()}`,
      review_id: `rev_${Date.now()}`,
      transaction_id: transaction_id ? String(transaction_id) : null,
      service_id: service_id ? String(service_id) : null,
      reviewer_id: String(reviewerId),
      reviewer_name: reviewerName,
      provider_id: String(provider_id),
      reviewed_student_name: providerName,
      rating: numRating,
      comment: typeof comment === 'string' ? comment.trim() : '',
      created_at: formattedDate,
      created_at_iso: now.toISOString(),
    };

    // Save to persistent file
    const all = loadReviewsFromFile();
    // Replace if this transaction was already reviewed
    const existingIndex = transaction_id
      ? all.findIndex((r) => String(r.transaction_id) === String(transaction_id))
      : -1;

    if (existingIndex >= 0) {
      all[existingIndex] = { ...all[existingIndex], ...newReview, id: all[existingIndex].id, review_id: all[existingIndex].review_id };
    } else {
      all.unshift(newReview);
    }
    saveReviewsToFile(all);

    // Attempt Supabase insert as secondary backup
    try {
      await supabase.from('reviews').insert([newReview]);
    } catch {}

    // Send in-app notification to provider
    try {
      await createNotification(
        provider_id,
        'rating',
        '⭐ New Client Review Received',
        `${reviewerName} rated your campus service ${numRating} stars: "${newReview.comment.slice(0, 50)}${newReview.comment.length > 50 ? '...' : ''}"`,
        '/profile'
      );
    } catch (notifErr) {
      console.warn('Failed to dispatch review notification:', notifErr.message);
    }

    // Emit live WebSocket event
    const io = req.app && req.app.get('io');
    if (io) {
      io.to(String(provider_id)).emit('review_created', newReview);
      io.emit('review_broadcast', newReview);
    }

    return res.status(201).json({
      message: 'Review and rating submitted successfully!',
      review: newReview,
    });
  } catch (err) {
    console.error('createReview error:', err);
    return res.status(500).json({ error: 'Internal server error while saving review.' });
  }
};

module.exports = {
  getAllReviews,
  getServiceReviews,
  getProviderReviews,
  getTransactionReview,
  createReview,
};
