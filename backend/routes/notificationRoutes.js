const express = require('express');
const {
  getNotifications,
  markAllAsRead,
  markOneAsRead,
} = require('../controllers/notificationController');

const router = express.Router();

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/read/:id', markOneAsRead);

module.exports = router;
