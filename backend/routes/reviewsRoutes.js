const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
  getServiceReviews,
  getProviderReviews,
  createReview,
} = require('../controllers/reviewsController');

const router = express.Router();

router.get('/service/:serviceId', getServiceReviews);
router.get('/provider/:providerId', getProviderReviews);
router.post('/', requireAuth, createReview);

module.exports = router;
