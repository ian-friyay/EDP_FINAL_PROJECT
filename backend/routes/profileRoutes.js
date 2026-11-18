const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
    getProfile,
    updateProfile,
    submitUnlockRequest,
    getUserUnlockRequests,
    requestPasswordOtp,
    changePasswordWithOtp
} = require('../controllers/profileController');

const router = express.Router();

router.get('/', requireAuth, getProfile);
router.get('/me', requireAuth, getProfile);
router.put('/', requireAuth, updateProfile);
router.patch('/me', requireAuth, updateProfile);

router.post('/unlock-request', requireAuth, submitUnlockRequest);
router.get('/unlock-requests', requireAuth, getUserUnlockRequests);

router.post('/password/otp', requireAuth, requestPasswordOtp);
router.post('/password/change', requireAuth, changePasswordWithOtp);

module.exports = router;
