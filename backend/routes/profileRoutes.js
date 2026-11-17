const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
    getProfile,
    updateProfile,
    uploadVerificationId,
    changePassword,
    deleteAccount
} = require('../controllers/profileController');

const router = express.Router();

router.get('/me', requireAuth, getProfile);
router.patch('/me', requireAuth, updateProfile);
router.post('/verification-id', requireAuth, uploadVerificationId);
router.patch('/password', requireAuth, changePassword);
router.delete('/me', requireAuth, deleteAccount);

module.exports = router;
