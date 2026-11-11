const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const { updateProfile } = require('../controllers/profileController');

const router = express.Router();

router.patch('/me', requireAuth, updateProfile);

module.exports = router;
