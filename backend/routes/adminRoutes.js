const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const {
    getDashboardStats,
    getPendingVerifications,
    updateVerificationStatus,
    getUsersList,
    toggleUserStatus
} = require('../controllers/adminController');
const { getAllAds, updateAdStatus } = require('../controllers/advertisementController');

const router = express.Router();

// All admin routes require valid authentication and admin authorization
router.get('/stats', requireAuth, requireAdmin, getDashboardStats);
router.get('/verifications/pending', requireAuth, requireAdmin, getPendingVerifications);
router.patch('/verifications/:userId', requireAuth, requireAdmin, updateVerificationStatus);
router.get('/users', requireAuth, requireAdmin, getUsersList);
router.patch('/users/:userId/toggle-status', requireAuth, requireAdmin, toggleUserStatus);
router.get('/advertisements', requireAuth, requireAdmin, getAllAds);
router.patch('/advertisements/:id/status', requireAuth, requireAdmin, updateAdStatus);

module.exports = router;
