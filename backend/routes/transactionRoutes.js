const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
  createTransaction,
  getUserTransactions,
  getTransactionById,
  updateTransactionStatus,
} = require('../controllers/transactionController');

const router = express.Router();

router.get('/', requireAuth, getUserTransactions);
router.get('/:transaction_id', requireAuth, getTransactionById);
router.post('/', requireAuth, createTransaction);
router.patch('/:transaction_id/status', requireAuth, updateTransactionStatus);

module.exports = router;
