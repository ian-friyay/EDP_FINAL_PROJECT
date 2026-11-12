const express = require('express');
const {
  getConversations,
  getMessagesWithUser,
  sendMessage,
  markAsRead,
} = require('../controllers/messageController');

const router = express.Router();

router.get('/conversations', getConversations);
router.get('/:userId', getMessagesWithUser);
router.post('/', sendMessage);
router.put('/read/:userId', markAsRead);

module.exports = router;
