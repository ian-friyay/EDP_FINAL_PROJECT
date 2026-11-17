const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
  createTransaction,
  getUserTransactions,
  getTransactionById,
  acceptTransaction,
  completeTransaction,
  verifyQrCode,
} = require('../controllers/transactionController');
const { cancelTransaction } = require('../controllers/cancelTransaction');

const router = express.Router();

router.get('/', requireAuth, getUserTransactions);
router.post('/verify-qr', requireAuth, verifyQrCode);
router.get('/:transaction_id', requireAuth, getTransactionById);
router.post('/', requireAuth, createTransaction);
router.patch('/:transaction_id/accept', requireAuth, acceptTransaction);
router.patch('/:transaction_id/complete', requireAuth, completeTransaction);
router.patch('/:transaction_id/cancel', requireAuth, cancelTransaction);

// Fallback aliases for :id param
router.patch('/:id/accept', requireAuth, acceptTransaction);
router.patch('/:id/complete', requireAuth, completeTransaction);
router.patch('/:id/cancel', requireAuth, cancelTransaction);

module.exports = router;
