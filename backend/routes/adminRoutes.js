const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const {
    checkAdminExists,
    getDashboardStats,
    getDashboardData,
    getPendingVerifications,
    updateVerificationStatus,
    getUsers,
    getUsersList,
    updateUserStatus,
    toggleUserStatus,
    getUnlockRequests,
    approveUnlockRequest,
    rejectUnlockRequest,
    unlockUserProfile,
    shareAdminAccess
} = require('../controllers/adminController');
const { getAllAds, updateAdStatus } = require('../controllers/advertisementController');

const router = express.Router();

// Public check for admin existence (used on Auth page)
router.get('/exists', checkAdminExists);

// Dashboard and KPI routes
router.get('/stats', getDashboardStats);
router.get('/dashboard', getDashboardData);

// Verification and student management
router.get('/verifications/pending', requireAuth, requireAdmin, getPendingVerifications);
router.patch('/verifications/:userId', requireAuth, requireAdmin, updateVerificationStatus);

// Users management routes
router.get('/users', getUsers);
router.patch('/users/:userId/toggle-status', requireAuth, requireAdmin, toggleUserStatus);
router.patch('/users/:id/status', updateUserStatus);
router.post('/users/:id/unlock-profile', unlockUserProfile);

// Student unlock requests
router.get('/unlock-requests', getUnlockRequests);
router.post('/unlock-requests/:id/approve', approveUnlockRequest);
router.post('/unlock-requests/:id/reject', rejectUnlockRequest);

// Share administrator access
router.post('/share-access', shareAdminAccess);

// Campus Advertisements approval routes
router.get('/advertisements', requireAuth, requireAdmin, getAllAds);
router.patch('/advertisements/:id/status', requireAuth, requireAdmin, updateAdStatus);

module.exports = router;
