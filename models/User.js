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

  // Admin user management — joins each role's profile table to get a display name,
  // since the users table alone only has email/role.
  async listAll({
    role, q, limit, offset,
  }) {
    const conditions = [];
    const values = [];
    let i = 1;

    if (role) {
      conditions.push(`u.role = $${i}`);
      values.push(role);
      i += 1;
    }
    if (q) {
      conditions.push(`(u.email ILIKE $${i} OR s.full_name ILIKE $${i} OR c.name ILIKE $${i} OR co.full_name ILIKE $${i})`);
      values.push(`%${q}%`);
      i += 1;
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const baseFrom = `
      FROM users u
      LEFT JOIN students s ON s.user_id = u.id
      LEFT JOIN companies c ON c.user_id = u.id
      LEFT JOIN coordinators co ON co.user_id = u.id
      ${whereClause}`;

    values.push(limit, offset);
    const { rows } = await query(
      `SELECT u.id, u.email, u.role, u.is_verified, u.is_active, u.created_at,
              COALESCE(s.full_name, c.name, co.full_name) AS display_name
       ${baseFrom}
       ORDER BY u.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      values
    );

    const { rows: countRows } = await query(
      `SELECT COUNT(*)::int AS total ${baseFrom}`,
      values.slice(0, i - 1)
    );

    return { rows, total: countRows[0].total };
  },

  async setActive(userId, isActive) {
    const { rows } = await query(
      'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, email, role, is_active',
      [isActive, userId]
    );
    return rows[0];
  },

  async delete(userId) {
    const { rowCount } = await query('DELETE FROM users WHERE id = $1', [userId]);
    return rowCount > 0;
  },
};

module.exports = User;
