const fs = require('fs');
const path = require('path');
const supabase = require('../db');
const { createNotification } = require('./notificationController');

const DATA_DIR = path.join(__dirname, '../data');
const ADS_FILE = path.join(DATA_DIR, 'advertisements.json');

// Helper to load fallback JSON ads
const loadFallbackAds = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(ADS_FILE)) {
      const raw = fs.readFileSync(ADS_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Could not load fallback advertisements:', err.message);
  }
  return [];
};

// Helper to save fallback JSON ads
const saveFallbackAds = (ads) => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(ADS_FILE, JSON.stringify(ads, null, 2), 'utf8');
  } catch (err) {
    console.warn('Could not save fallback advertisements:', err.message);
  }
};

const getDailyRate = async () => {
  try {
    const { data } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'ad_daily_rate')
      .maybeSingle();

    if (data && data.value) {
      return parseFloat(data.value) || 2.0;
    }
  } catch {
    // fallback
  }
  return 2.0;
};

/**
 * Get active advertisements for public display (Landing page & Dashboards)
 */
const getActiveAds = async (req, res) => {
  try {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return res.status(200).json({
          status: 'success',
          data,
          message: 'Active advertisements retrieved.',
        });
      }
    } catch {
      // Fall through to JSON fallback
    }

    const fallback = loadFallbackAds().filter((ad) => ad.status === 'active');
    return res.status(200).json({
      status: 'success',
      data: fallback,
      message: 'Active advertisements retrieved.',
    });
  } catch (err) {
    console.error('getActiveAds error:', err);
    return res.status(500).json({ error: 'Failed to fetch active advertisements.' });
  }
};

/**
 * Get pricing and package options for campus advertisements
 */
const getPricing = async (req, res) => {
  try {
    const dailyRate = await getDailyRate();
    const pricing = {
      daily_rate: dailyRate,
      currency: 'PHP',
      packages: [
        {
          key: 'week',
          label: '1 Week (7 Days)',
          days: 7,
          cost: Math.round(7 * dailyRate * 100) / 100,
        },
        {
          key: 'month',
          label: '1 Month (30 Days)',
          days: 30,
          cost: Math.round(30 * dailyRate * 100) / 100,
        },
        {
          key: 'custom',
          label: 'Custom Duration',
          days: null,
          cost_per_day: dailyRate,
        },
      ],
    };

    return res.status(200).json({
      status: 'success',
      data: pricing,
      message: 'Advertisement pricing retrieved.',
    });
  } catch (err) {
    console.error('getPricing error:', err);
    return res.status(500).json({ error: 'Failed to fetch advertisement pricing.' });
  }
};

/**
 * Submit a new advertisement request
 */
const submitAdRequest = async (req, res) => {
  try {
    const {
      title,
      description,
      target_url,
      banner_url,
      duration_type = 'week',
      custom_days,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Advertisement title is required.' });
    }

    const userId =
      (req.user && (req.user.id || req.user.user_id)) ||
      req.headers['x-user-id'] ||
      req.body.user_id ||
      'MMC-0001';

    const advertiserName =
      (req.user && (req.user.name || `${req.user.first_name || ''} ${req.user.last_name || ''}`.trim())) ||
      'Student Sponsor';

    const dailyRate = await getDailyRate();

    let days = 7;
    if (duration_type === 'month') {
      days = 30;
    } else if (duration_type === 'custom') {
      days = Math.max(1, Math.min(365, parseInt(custom_days, 10) || 7));
    }

    const computedCost = Math.round(days * dailyRate * 100) / 100;
    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const newAd = {
      id: `ad-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      user_id: String(userId),
      advertiser_name: advertiserName,
      advertiser_type: 'student',
      title: title.trim(),
      description: (description || '').trim(),
      banner_url: banner_url || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&auto=format&fit=crop&q=80',
      target_url: target_url || '/services',
      placement: 'homepage_and_dashboard',
      duration_type,
      duration_days: days,
      daily_rate: dailyRate,
      computed_cost: computedCost,
      amount_paid: 0.0,
      status: 'pending',
      payment_status: 'unpaid',
      start_date: now.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    // Try Supabase insert
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .insert([newAd])
        .select()
        .single();

      if (!error && data) {
        // Also sync fallback
        const all = loadFallbackAds();
        all.unshift(data);
        saveFallbackAds(all);

        // Notify admins
        await createNotification(
          'MMC-0001',
          'system',
          'New Campus Ad Request',
          `"${newAd.title}" was submitted for review (₱${computedCost}).`,
          '/admin'
        );

        return res.status(201).json({
          status: 'success',
          data,
          message: 'Advertisement request submitted. Awaiting Admin review and posting.',
        });
      }
    } catch {
      // Fallback
    }

    // JSON fallback
    const all = loadFallbackAds();
    all.unshift(newAd);
    saveFallbackAds(all);

    return res.status(201).json({
      status: 'success',
      data: newAd,
      message: 'Advertisement request submitted. Awaiting Admin review and posting.',
    });
  } catch (err) {
    console.error('submitAdRequest error:', err);
    return res.status(500).json({ error: 'Failed to submit advertisement request.' });
  }
};

/**
 * Get advertisements requested by the logged-in student
 */
const getMyAds = async (req, res) => {
  try {
    const userId =
      (req.user && (req.user.id || req.user.user_id)) ||
      req.headers['x-user-id'] ||
      req.query.userId ||
      'MMC-0001';

    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('user_id', String(userId))
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return res.status(200).json({
          status: 'success',
          data,
          message: 'Your advertisement requests retrieved.',
        });
      }
    } catch {
      // Fall through
    }

    const all = loadFallbackAds();
    const myAds = all.filter((ad) => String(ad.user_id) === String(userId));
    return res.status(200).json({
      status: 'success',
      data: myAds,
      message: 'Your advertisement requests retrieved.',
    });
  } catch (err) {
    console.error('getMyAds error:', err);
    return res.status(500).json({ error: 'Failed to fetch user advertisements.' });
  }
};

/**
 * Admin: Get all advertisements
 */
const getAllAds = async (req, res) => {
  try {
    try {
      const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return res.status(200).json({
          status: 'success',
          data,
          message: 'All advertisements retrieved.',
        });
      }
    } catch {
      // Fallback
    }

    const all = loadFallbackAds();
    return res.status(200).json({
      status: 'success',
      data: all,
      message: 'All advertisements retrieved.',
    });
  } catch (err) {
    console.error('getAllAds error:', err);
    return res.status(500).json({ error: 'Failed to fetch all advertisements.' });
  }
};

/**
 * Admin: Update advertisement status (approve, reject, activate, deactivate)
 */
const updateAdStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'active', 'rejected', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid advertisement status.' });
    }

    try {
      const { data, error } = await supabase
        .from('advertisements')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        // Update fallback cache
        const all = loadFallbackAds().map((ad) =>
          String(ad.id) === String(id) ? { ...ad, status, updated_at: new Date().toISOString() } : ad
        );
        saveFallbackAds(all);

        // Notify advertiser
        if (data.user_id) {
          await createNotification(
            data.user_id,
            'system',
            `Advertisement ${status === 'active' ? 'Approved & Live' : 'Updated'}`,
            `Your ad "${data.title}" status is now ${status.toUpperCase()}.`,
            '/services'
          );
        }

        return res.status(200).json({
          status: 'success',
          data,
          message: `Advertisement status updated to ${status}.`,
        });
      }
    } catch {
      // Fallback
    }

    const all = loadFallbackAds();
    let updated = null;
    const modified = all.map((ad) => {
      if (String(ad.id) === String(id)) {
        updated = { ...ad, status, updated_at: new Date().toISOString() };
        return updated;
      }
      return ad;
    });

    if (!updated) {
      return res.status(404).json({ error: 'Advertisement not found.' });
    }

    saveFallbackAds(modified);

    return res.status(200).json({
      status: 'success',
      data: updated,
      message: `Advertisement status updated to ${status}.`,
    });
  } catch (err) {
    console.error('updateAdStatus error:', err);
    return res.status(500).json({ error: 'Failed to update advertisement status.' });
  }
};

/**
 * Admin: Delete specific advertisement
 */
const deleteAd = async (req, res) => {
  try {
    const { id } = req.params;

    // Try deleting from Supabase remote
    try {
      await supabase
        .from('advertisements')
        .delete()
        .eq('id', id);
    } catch (dbErr) {
      console.warn('Supabase ad delete fallback:', dbErr.message);
    }

    // Remove from local fallback JSON
    const all = loadFallbackAds();
    const remaining = all.filter((ad) => String(ad.id) !== String(id));
    saveFallbackAds(remaining);

    return res.status(200).json({
      status: 'success',
      message: 'Advertisement deleted successfully.',
    });
  } catch (err) {
    console.error('deleteAd error:', err);
    return res.status(500).json({ error: 'Failed to delete advertisement.' });
  }
};

module.exports = {
  getActiveAds,
  getPricing,
  submitAdRequest,
  getMyAds,
  getAllAds,
  updateAdStatus,
  deleteAd,
  loadFallbackAds,
  saveFallbackAds,
};
