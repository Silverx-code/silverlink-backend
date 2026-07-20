const { query } = require('../config/db');

const Student = {
  async create(userId, {
    fullName, universityId, faculty, department, level,
  }) {
    const { rows } = await query(
      `INSERT INTO students (user_id, full_name, university_id, faculty, department, level)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, fullName, universityId || null, faculty || null, department || null, level || null]
    );
    return rows[0];
  },

  async findByUserId(userId) {
    const { rows } = await query(
      `SELECT s.*, u.name AS university_name,
              pl.state AS preferred_state, pl.city AS preferred_city
       FROM students s
       LEFT JOIN universities u ON u.id = s.university_id
       LEFT JOIN locations pl ON pl.id = s.preferred_location_id
       WHERE s.user_id = $1`,
      [userId]
    );
    return rows[0];
  },

  async updateProfile(userId, fields) {
    const allowed = [
      'full_name', 'university_id', 'faculty', 'department', 'level',
      'preferred_location_id', 'siwes_start_date', 'siwes_end_date',
      'skills', 'cv_url',
    ];
    const sets = [];
    const values = [];
    let i = 1;

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        sets.push(`${key} = $${i}`);
        values.push(fields[key]);
        i += 1;
      }
    }
    if (sets.length === 0) return this.findByUserId(userId);

    values.push(userId);
    const { rows } = await query(
      `UPDATE students SET ${sets.join(', ')} WHERE user_id = $${i} RETURNING *`,
      values
    );
    return rows[0];
  },
};

module.exports = Student;
