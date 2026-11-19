const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
  getAllReviews,
  getServiceReviews,
  getProviderReviews,
  getTransactionReview,
  createReview,
} = require('../controllers/reviewsController');

const router = express.Router();

router.get('/', getAllReviews);
router.get('/transaction/:transactionId', getTransactionReview);
router.get('/service/:serviceId', getServiceReviews);
router.get('/provider/:providerId', getProviderReviews);
router.post('/', requireAuth, createReview);

module.exports = router;
