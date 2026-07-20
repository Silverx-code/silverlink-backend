const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Message = require('../models/Message');
const { notify } = require('../services/notificationService');

// Confirms the requesting user is either the student or the company on this application
async function assertParticipant(applicationId, userId) {
  const participants = await Message.getParticipants(applicationId);
  if (!participants) throw new ApiError(404, 'Application not found');
  const isParticipant = participants.student_user_id === userId || participants.company_user_id === userId;
  if (!isParticipant) throw new ApiError(403, 'You do not have access to this conversation');
  return participants;
}

// GET /api/applications/:id/messages
const listMessages = asyncHandler(async (req, res) => {
  await assertParticipant(req.params.id, req.user.id);
  const messages = await Message.listForApplication(req.params.id);
  await Message.markRead(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: messages });
});

// POST /api/applications/:id/messages  { body }
// REST fallback for sending — the socket layer calls the same model methods for live delivery.
const sendMessage = asyncHandler(async (req, res) => {
  const { body } = req.body;
  if (!body || !body.trim()) throw new ApiError(400, 'Message body is required');

  const participants = await assertParticipant(req.params.id, req.user.id);
  const message = await Message.create(req.params.id, req.user.id, body.trim());

  const recipientId = req.user.id === participants.student_user_id
    ? participants.company_user_id
    : participants.student_user_id;
  if (recipientId) {
    await notify(recipientId, 'New message', 'You have a new message on Silver Link.');
  }

  res.status(201).json({ success: true, data: message });
});

module.exports = { listMessages, sendMessage, assertParticipant };
