const express = require('express');
const {
  getConversations,
  markAsRead,
} = require('../controllers/messageController');

const router = express.Router();

router.get('/conversations', getConversations);
router.put('/read/:userId', markAsRead);

module.exports = router;
