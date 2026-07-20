const express = require('express');
const { protect } = require('../middleware/auth');
const { listMessages, sendMessage } = require('../controllers/messageController');

// Mounted at /api/applications/:id/messages
const router = express.Router({ mergeParams: true });

router.use(protect);
router.get('/', listMessages);
router.post('/', sendMessage);

module.exports = router;
