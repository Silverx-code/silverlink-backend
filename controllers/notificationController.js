const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Notification = require('../models/Notification');
const DeviceToken = require('../models/DeviceToken');

const listMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.listForUser(req.user.id);
  const unreadCount = await Notification.unreadCount(req.user.id);
  res.status(200).json({ success: true, data: notifications, meta: { unreadCount } });
});

const markRead = asyncHandler(async (req, res) => {
  const updated = await Notification.markRead(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: updated });
});

// POST /api/notifications/push-token  { token, platform }
// Called by the mobile app after the user grants notification permission.
const registerPushToken = asyncHandler(async (req, res) => {
  const { token, platform } = req.body;
  if (!token) throw new ApiError(400, 'token is required');
  const registered = await DeviceToken.register(req.user.id, token, platform);
  res.status(201).json({ success: true, data: registered });
});

const unregisterPushToken = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw new ApiError(400, 'token is required');
  await DeviceToken.remove(req.user.id, token);
  res.status(200).json({ success: true, message: 'Push token removed' });
});

module.exports = {
  listMyNotifications, markRead, registerPushToken, unregisterPushToken,
};
