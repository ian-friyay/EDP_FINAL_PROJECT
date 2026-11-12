const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const { getDashboardStats } = require('../controllers/adminController');

const router = express.Router();

router.get('/stats', requireAuth, requireAdmin, getDashboardStats);

module.exports = router;
