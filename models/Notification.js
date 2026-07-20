const { query } = require('../config/db');

const Notification = {
  async create(userId, title, message) {
    const { rows } = await query(
      `INSERT INTO notifications (user_id, title, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, title, message]
    );
    return rows[0];
  },

  async listForUser(userId) {
    const { rows } = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    return rows;
  },

  async markRead(id, userId) {
    const { rows } = await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return rows[0];
  },

  async unreadCount(userId) {
    const { rows } = await query(
      'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
      [userId]
    );
    return rows[0].count;
  },
};

module.exports = Notification;
