const { query } = require('../config/db');

const DeviceToken = {
  async register(userId, token, platform = 'expo') {
    const { rows } = await query(
      `INSERT INTO device_tokens (user_id, token, platform)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, token) DO UPDATE SET platform = EXCLUDED.platform
       RETURNING *`,
      [userId, token, platform]
    );
    return rows[0];
  },

  async listForUser(userId) {
    const { rows } = await query('SELECT * FROM device_tokens WHERE user_id = $1', [userId]);
    return rows;
  },

  async remove(userId, token) {
    await query('DELETE FROM device_tokens WHERE user_id = $1 AND token = $2', [userId, token]);
  },

  // Removes a token that Expo has reported as invalid/unregistered, regardless of owner
  async removeByToken(token) {
    await query('DELETE FROM device_tokens WHERE token = $1', [token]);
  },
};

module.exports = DeviceToken;
