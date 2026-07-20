const { query } = require('../config/db');

const Location = {
  async search(q, limit = 10) {
    const { rows } = await query(
      `SELECT * FROM locations
       WHERE state ILIKE $1 OR city ILIKE $1
       ORDER BY state, city
       LIMIT $2`,
      [`%${q}%`, limit]
    );
    return rows;
  },

  async findOrCreate(state, city) {
    const { rows } = await query(
      'SELECT * FROM locations WHERE state ILIKE $1 AND city ILIKE $2',
      [state, city]
    );
    if (rows[0]) return rows[0];

    const { rows: created } = await query(
      'INSERT INTO locations (state, city) VALUES ($1, $2) RETURNING *',
      [state, city]
    );
    return created[0];
  },
};

module.exports = Location;
