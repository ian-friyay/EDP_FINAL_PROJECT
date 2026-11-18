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
router.get('/', requireAuth, getProfile);
router.patch('/me', requireAuth, updateProfile);
router.patch('/', requireAuth, updateProfile);
router.put('/me', requireAuth, updateProfile);
router.put('/', requireAuth, updateProfile);
router.post('/verification-id', requireAuth, uploadVerificationId);
router.patch('/password', requireAuth, changePassword);
router.put('/password', requireAuth, changePassword);
router.post('/change-password', requireAuth, changePassword);
router.delete('/me', requireAuth, deleteAccount);

module.exports = router;
