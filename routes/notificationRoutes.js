const express = require('express');
const { protect } = require('../middleware/auth');
const {
  listMyNotifications, markRead, registerPushToken, unregisterPushToken,
} = require('../controllers/notificationController');

const router = express.Router();

router.use(protect);
router.get('/', listMyNotifications);
router.patch('/:id/read', markRead);
router.post('/push-token', registerPushToken);
router.delete('/push-token', unregisterPushToken);

module.exports = router;
