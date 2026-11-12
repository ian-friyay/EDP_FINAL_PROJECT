const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { cancelTransaction } = require('../controllers/cancelTransaction');

const router = express.Router();

router.patch('/:transaction_id/cancel', requireAuth, cancelTransaction);

module.exports = router;
