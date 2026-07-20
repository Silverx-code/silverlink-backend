const Notification = require('../models/Notification');
const { sendPush } = require('./pushService');

// Single entry point for "notify this user" anywhere in the app — writes the
// in-app notification row and fires a mobile push in parallel. Push failures
// never affect the DB write or the caller's request.
async function notify(userId, title, message) {
  const notification = await Notification.create(userId, title, message);
  sendPush(userId, title, message); // fire-and-forget
  return notification;
}

module.exports = { notify };
