const express = require('express');
const router = express.Router();
const {
  createOrder,
  captureOrder,
  createAdOrder,
  captureAdOrder,
} = require('../controllers/paymentController');

router.post('/paypal/create-order', createOrder);
router.post('/paypal/capture-order', captureOrder);
router.post('/paypal/ad-order', createAdOrder);
router.post('/paypal/create-ad-order', createAdOrder);
router.post('/paypal/capture-ad-order', captureAdOrder);

module.exports = router;
