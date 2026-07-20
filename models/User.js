const { query } = require('../config/db');

const User = {
  async create({ email, passwordHash, role }) {
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, $3)
       RETURNING id, email, role, is_verified, created_at`,
      [email.toLowerCase(), passwordHash, role]
    );
    return rows[0];
  },

  async findByEmail(email) {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    return rows[0];
  },

  async findById(id) {
    const { rows } = await query(
      'SELECT id, email, role, is_verified, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0];
  },

  async findByIdWithPassword(id) {
    const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0];
  },

  async setResetToken(userId, token, expiresAt) {
    await query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [token, expiresAt, userId]
    );
  },

  async findByResetToken(token) {
    const { rows } = await query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > now()',
      [token]
    );
    return rows[0];
  },

  async clearResetToken(userId) {
    await query(
      'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = $1',
      [userId]
    );
  },

  async updatePassword(userId, passwordHash) {
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
  },
};

module.exports = User;
