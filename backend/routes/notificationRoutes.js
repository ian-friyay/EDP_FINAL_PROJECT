const express = require('express');
const {
  getNotifications,
  markAllAsRead,
  markOneAsRead,
  getVapidPublicKey,
  subscribePush,
  unsubscribePush,
} = require('../controllers/notificationController');

const router = express.Router();

router.get('/vapid-key', getVapidPublicKey);
router.post('/subscribe', subscribePush);
router.post('/unsubscribe', unsubscribePush);
router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/read/:id', markOneAsRead);

module.exports = router;
