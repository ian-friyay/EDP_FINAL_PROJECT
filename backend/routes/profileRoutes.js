const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const {
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount
} = require('../controllers/profileController');

const router = express.Router();

router.get('/me', requireAuth, getProfile);
router.patch('/me', requireAuth, updateProfile);
router.patch('/password', requireAuth, changePassword);
router.delete('/me', requireAuth, deleteAccount);

module.exports = router;
