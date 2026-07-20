const { query } = require('../config/db');

const Message = {
  async create(applicationId, senderId, body) {
    const { rows } = await query(
      `INSERT INTO messages (application_id, sender_id, body)
       VALUES ($1, $2, $3) RETURNING *`,
      [applicationId, senderId, body]
    );
    return rows[0];
  },

  async listForApplication(applicationId) {
    const { rows } = await query(
      `SELECT m.*, u.email AS sender_email, u.role AS sender_role
       FROM messages m JOIN users u ON u.id = m.sender_id
       WHERE m.application_id = $1
       ORDER BY m.created_at ASC`,
      [applicationId]
    );
    return rows;
  },

  // Returns { studentUserId, companyUserId } so we can verify chat participants
  // and know who to notify — used by both the REST controller and the socket layer.
  async getParticipants(applicationId) {
    const { rows } = await query(
      `SELECT su.id AS student_user_id, cu.id AS company_user_id, c.name AS company_name, s.full_name AS student_name
       FROM applications a
       JOIN students s ON s.id = a.student_id
       JOIN users su ON su.id = s.user_id
       JOIN companies c ON c.id = a.company_id
       LEFT JOIN users cu ON cu.id = c.user_id
       WHERE a.id = $1`,
      [applicationId]
    );
    return rows[0];
  },

  async markRead(applicationId, readerId) {
    await query(
      `UPDATE messages SET read_at = now()
       WHERE application_id = $1 AND sender_id != $2 AND read_at IS NULL`,
      [applicationId, readerId]
    );
  },
};

module.exports = Message;
