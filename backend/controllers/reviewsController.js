const supabase = require('../db');
const { createNotification } = require('./notificationController');

// In-memory fallback if Supabase 'reviews' table is awaiting migration
const fallbackReviews = [];

const getServiceReviews = async (req, res) => {
  try {
    const { serviceId } = req.params;
    if (!serviceId) {
      return res.status(400).json({ error: 'Service ID is required.' });
    }

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('service_id', String(serviceId))
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const totalRating = data.reduce((acc, r) => acc + Number(r.rating || 0), 0);
        const avgRating = data.length > 0 ? (totalRating / data.length).toFixed(1) : '5.0';

        return res.status(200).json({
          reviews: data,
          averageRating: Number(avgRating),
          reviewCount: data.length,
        });
      }
    } catch {
      // Table doesn't exist yet
    }

    const filtered = fallbackReviews.filter((r) => String(r.service_id) === String(serviceId));
    const total = filtered.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    const avg = filtered.length > 0 ? (total / filtered.length).toFixed(1) : '5.0';

    return res.status(200).json({
      reviews: filtered,
      averageRating: Number(avg),
      reviewCount: filtered.length,
    });
  } catch (err) {
    console.error('getServiceReviews error:', err);
    return res.status(500).json({ error: 'Failed to fetch service reviews.' });
  }
};

const getProviderReviews = async (req, res) => {
  try {
    const { providerId } = req.params;
    if (!providerId) {
      return res.status(400).json({ error: 'Provider ID is required.' });
    }

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('provider_id', String(providerId))
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const total = data.reduce((acc, r) => acc + Number(r.rating || 0), 0);
        const avg = data.length > 0 ? (total / data.length).toFixed(1) : '5.0';

        return res.status(200).json({
          reviews: data,
          averageRating: Number(avg),
          reviewCount: data.length,
        });
      }
    } catch {
      // Table doesn't exist yet
    }

    const filtered = fallbackReviews.filter((r) => String(r.provider_id) === String(providerId));
    const total = filtered.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    const avg = filtered.length > 0 ? (total / filtered.length).toFixed(1) : '5.0';

    return res.status(200).json({
      reviews: filtered,
      averageRating: Number(avg),
      reviewCount: filtered.length,
    });
  } catch (err) {
    console.error('getProviderReviews error:', err);
    return res.status(500).json({ error: 'Failed to fetch provider reviews.' });
  }
};

const createReview = async (req, res) => {
  try {
    const reviewerId = req.user?.user_id;
    if (!reviewerId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const { transaction_id, service_id, provider_id, rating, comment } = req.body || {};

    const numRating = Number(rating);
    if (!Number.isFinite(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be a number between 1.0 and 5.0.' });
    }

    if (!provider_id) {
      return res.status(400).json({ error: 'Provider ID is required.' });
    }

    const newReview = {
      review_id: `rev_${Date.now()}`,
      transaction_id: transaction_id ? String(transaction_id) : null,
      service_id: service_id ? String(service_id) : null,
      reviewer_id: String(reviewerId),
      provider_id: String(provider_id),
      rating: numRating,
      comment: typeof comment === 'string' ? comment.trim() : '',
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert([newReview])
        .select()
        .single();

      if (!error && data) {
        // Send notification to provider
        await createNotification(
          provider_id,
          'rating',
          'New Customer Review Received',
          `You received a ${numRating}-star rating: "${newReview.comment.slice(0, 60)}"`,
          '/profile'
        );

        return res.status(201).json({
          message: 'Review submitted successfully!',
          review: data,
        });
      }
    } catch {
      // Table doesn't exist yet
    }

    // In-memory fallback
    fallbackReviews.unshift(newReview);
    await createNotification(
      provider_id,
      'rating',
      'New Customer Review Received',
      `You received a ${numRating}-star rating: "${newReview.comment.slice(0, 60)}"`,
      '/profile'
    );

    return res.status(201).json({
      message: 'Review submitted successfully! (Stored in fallback mode)',
      review: newReview,
    });
  } catch (err) {
    console.error('createReview error:', err);
    return res.status(500).json({ error: 'Internal server error while saving review.' });
  }
};

module.exports = {
  getServiceReviews,
  getProviderReviews,
  createReview,
};
