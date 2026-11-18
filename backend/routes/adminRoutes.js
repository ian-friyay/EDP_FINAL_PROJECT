const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const {
    checkAdminExists,
    getDashboardStats,
    getDashboardData,
    getUsers,
    updateUserStatus,
    getUnlockRequests,
    approveUnlockRequest,
    rejectUnlockRequest,
    unlockUserProfile,
    shareAdminAccess,
    getAdminServices,
    deleteAdminService,
    getAdminTransactions,
    getAdminReviews,
    deleteAdminReview,
    getAdminAdvertisements,
    createAdminAdvertisement,
    deleteAdminAdvertisement
} = require('../controllers/adminController');

const router = express.Router();

// Legacy and KPI routes
router.get('/exists', checkAdminExists);
router.get('/stats', getDashboardStats);
router.get('/dashboard', getDashboardData);

// Users management routes
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);
router.post('/users/:id/unlock-profile', unlockUserProfile);

// Student unlock requests
router.get('/unlock-requests', getUnlockRequests);
router.post('/unlock-requests/:id/approve', approveUnlockRequest);
router.post('/unlock-requests/:id/reject', rejectUnlockRequest);

// Services management
router.get('/services', getAdminServices);
router.delete('/services/:id', deleteAdminService);

// Transactions management
router.get('/transactions', getAdminTransactions);

// Reviews management
router.get('/reviews', getAdminReviews);
router.delete('/reviews/:id', deleteAdminReview);

// Advertisements management
router.get('/advertisements', getAdminAdvertisements);
router.post('/advertisements', createAdminAdvertisement);
router.delete('/advertisements/:id', deleteAdminAdvertisement);

// Share administrator access
router.post('/share-access', shareAdminAccess);

module.exports = router;
