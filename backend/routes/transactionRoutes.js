const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { createTransaction } = require('../controllers/transactionController');

const router = express.Router();

router.post('/', authMiddleware, createTransaction);

module.exports = router;
