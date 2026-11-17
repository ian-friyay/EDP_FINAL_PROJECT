const express = require('express');
const router = express.Router();
const {
  getActiveAds,
  getPricing,
  submitAdRequest,
  getMyAds,
  getAllAds,
  updateAdStatus,
} = require('../controllers/advertisementController');
const { requireAuth } = require('../middleware/authMiddleware');

// Public routes
router.get('/active', getActiveAds);
router.get('/pricing', getPricing);

// Protected routes (Student/User)
router.post('/', submitAdRequest);
router.post('/request', submitAdRequest);
router.get('/my-ads', getMyAds);

// Admin routes
router.get('/admin/all', getAllAds);
router.patch('/admin/:id/status', updateAdStatus);

module.exports = router;
