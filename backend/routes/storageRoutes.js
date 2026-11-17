const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { uploadFile } = require('../controllers/storageController');

const router = express.Router();

// Allow authenticated uploads with json payload
router.post('/upload', requireAuth, uploadFile);

module.exports = router;
