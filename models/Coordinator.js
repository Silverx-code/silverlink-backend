const { query } = require('../config/db');

const Coordinator = {
  async create({
    userId, universityId, fullName, title,
  }) {
    const { rows } = await query(
      `INSERT INTO coordinators (user_id, university_id, full_name, title)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userId, universityId, fullName, title || null]
    );
    return rows[0];
  },

  async findByUserId(userId) {
    const { rows } = await query(
      `SELECT c.*, u.name AS university_name, u.state AS university_state
       FROM coordinators c JOIN universities u ON u.id = c.university_id
       WHERE c.user_id = $1`,
      [userId]
    );
    return rows[0];
  },

  // Students belonging to the coordinator's university
  async listStudents(universityId, { limit, offset }) {
    const { rows } = await query(
      `SELECT s.id, s.full_name, s.department, s.level, s.faculty,
              s.siwes_start_date, s.siwes_end_date, u.email
       FROM students s JOIN users u ON u.id = s.user_id
       WHERE s.university_id = $1
       ORDER BY s.full_name ASC
       LIMIT $2 OFFSET $3`,
      [universityId, limit, offset]
    );
    const { rows: countRows } = await query(
      'SELECT COUNT(*)::int AS total FROM students WHERE university_id = $1',
      [universityId]
    );
    return { rows, total: countRows[0].total };
  },

  // Companies that accept departments this university's students are actually studying —
  // a simple, explainable relevance signal rather than a black-box match.
  async recommendedCompanies(universityId, { limit = 20 } = {}) {
    const { rows } = await query(
      `SELECT c.id, c.name, c.industry, c.status, c.logo_url,
              array_agg(DISTINCT cd.department) AS matched_departments,
              COUNT(DISTINCT s.id)::int AS matching_student_count
       FROM companies c
       JOIN company_departments cd ON cd.company_id = c.id
       JOIN students s ON s.department ILIKE cd.department AND s.university_id = $1
       WHERE c.status = 'currently_accepting'
       GROUP BY c.id
       ORDER BY matching_student_count DESC, c.name ASC
       LIMIT $2`,
      [universityId, limit]
    );
    return rows;
  },

  async universityStats(universityId) {
    const { rows } = await query(
      `SELECT
         (SELECT COUNT(*) FROM students WHERE university_id = $1)::int AS student_count,
         (SELECT COUNT(*) FROM applications a JOIN students s ON s.id = a.student_id
            WHERE s.university_id = $1)::int AS application_count,
         (SELECT COUNT(*) FROM applications a JOIN students s ON s.id = a.student_id
            WHERE s.university_id = $1 AND a.status = 'accepted')::int AS accepted_count`,
      [universityId]
    );
    return rows[0];
  },
};

module.exports = Coordinator;
