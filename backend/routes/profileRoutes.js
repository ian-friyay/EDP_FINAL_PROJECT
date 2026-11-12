const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { getProfile, updateProfile } = require('../controllers/profileController');

const router = express.Router();

router.get('/me', requireAuth, getProfile);
router.patch('/me', requireAuth, updateProfile);

module.exports = router;
