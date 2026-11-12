const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { cancelTransaction } = require('../controllers/cancelTransaction');

const router = express.Router();

router.patch('/:transaction_id/cancel', authMiddleware, cancelTransaction);

module.exports = router;
