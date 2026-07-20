const { Server } = require('socket.io');
const { verifyToken } = require('../utils/token');
const Message = require('../models/Message');
const { notify } = require('../services/notificationService');
const config = require('../config');

function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || config.clientUrls.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    },
  });

  // Auth handshake: client connects with { auth: { token } }
  io.use((socket, next) => {
    try {
      const { token } = socket.handshake.auth || {};
      if (!token) return next(new Error('Not authenticated'));
      const decoded = verifyToken(token);
      socket.userId = decoded.id;
      return next();
    } catch (err) {
      return next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    // Client requests to join the chat room for one application.
    // We verify participation server-side before allowing the join —
    // never trust the room name the client asks for.
    socket.on('chat:join', async ({ applicationId }, ack) => {
      try {
        const participants = await Message.getParticipants(applicationId);
        if (!participants) return ack?.({ ok: false, error: 'Application not found' });
        const allowed = participants.student_user_id === socket.userId
          || participants.company_user_id === socket.userId;
        if (!allowed) return ack?.({ ok: false, error: 'Not a participant in this conversation' });

        socket.join(`application:${applicationId}`);
        return ack?.({ ok: true });
      } catch (err) {
        return ack?.({ ok: false, error: 'Could not join conversation' });
      }
    });

    socket.on('chat:message', async ({ applicationId, body }, ack) => {
      try {
        if (!body || !body.trim()) return ack?.({ ok: false, error: 'Message body is required' });

        const participants = await Message.getParticipants(applicationId);
        if (!participants) return ack?.({ ok: false, error: 'Application not found' });
        const allowed = participants.student_user_id === socket.userId
          || participants.company_user_id === socket.userId;
        if (!allowed) return ack?.({ ok: false, error: 'Not a participant in this conversation' });

        const message = await Message.create(applicationId, socket.userId, body.trim());

        io.to(`application:${applicationId}`).emit('chat:message', message);

        const recipientId = socket.userId === participants.student_user_id
          ? participants.company_user_id
          : participants.student_user_id;
        if (recipientId) {
          await notify(recipientId, 'New message', 'You have a new message on Silver Link.');
        }

        return ack?.({ ok: true, data: message });
      } catch (err) {
        return ack?.({ ok: false, error: 'Could not send message' });
      }
    });

    socket.on('chat:typing', ({ applicationId }) => {
      socket.to(`application:${applicationId}`).emit('chat:typing', { userId: socket.userId });
    });
  });

  return io;
}

module.exports = initSockets;
