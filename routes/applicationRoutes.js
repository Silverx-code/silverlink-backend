const express = require('express');
const messageRoutes = require('./messageRoutes');

const router = express.Router();

router.use('/:id/messages', messageRoutes);

module.exports = router;
