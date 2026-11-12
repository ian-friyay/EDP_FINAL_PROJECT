const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
  createTransaction,
  getUserTransactions,
  getTransactionById,
} = require('../controllers/transactionController');

const router = express.Router();

router.get('/', requireAuth, getUserTransactions);
router.get('/:transaction_id', requireAuth, getTransactionById);
router.post('/', requireAuth, createTransaction);

module.exports = router;
