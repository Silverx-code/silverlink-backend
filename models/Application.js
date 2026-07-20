const { query } = require('../config/db');

const Application = {
  async create(studentId, companyId, coverNote) {
    const { rows } = await query(
      `INSERT INTO applications (student_id, company_id, cover_note)
       VALUES ($1, $2, $3)
       ON CONFLICT (student_id, company_id) DO NOTHING
       RETURNING *`,
      [studentId, companyId, coverNote || null]
    );
    return rows[0]; // undefined if it already existed (conflict)
  },

  async findByStudent(studentId) {
    const { rows } = await query(
      `SELECT a.*, c.name AS company_name, c.logo_url, c.status AS company_status
       FROM applications a
       JOIN companies c ON c.id = a.company_id
       WHERE a.student_id = $1
       ORDER BY a.created_at DESC`,
      [studentId]
    );
    return rows;
  },

  async findByCompany(companyId, {
    limit, offset, department, level, status,
  } = {}) {
    const conditions = ['a.company_id = $1'];
    const values = [companyId];
    let i = 2;

    if (department) {
      conditions.push(`s.department ILIKE $${i}`);
      values.push(department);
      i += 1;
    }
    if (level) {
      conditions.push(`s.level = $${i}`);
      values.push(level);
      i += 1;
    }
    if (status) {
      conditions.push(`a.status = $${i}`);
      values.push(status);
      i += 1;
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    let limitClause = '';
    if (limit !== undefined) {
      values.push(limit, offset || 0);
      limitClause = `LIMIT $${values.length - 1} OFFSET $${values.length}`;
    }

    const { rows } = await query(
      `SELECT a.*, s.full_name AS student_name, s.department, s.level, s.cv_url, u.email AS student_email
       FROM applications a
       JOIN students s ON s.id = a.student_id
       JOIN users u ON u.id = s.user_id
       ${whereClause}
       ORDER BY a.created_at DESC
       ${limitClause}`,
      values
    );
    const { rows: countRows } = await query(
      `SELECT COUNT(*)::int AS total
       FROM applications a JOIN students s ON s.id = a.student_id
       ${whereClause}`,
      values.slice(0, i - 1)
    );
    return { rows, total: countRows[0].total };
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM applications WHERE id = $1', [id]);
    return rows[0];
  },

  async updateStatus(id, companyId, status) {
    const { rows } = await query(
      `UPDATE applications SET status = $1
       WHERE id = $2 AND company_id = $3
       RETURNING *`,
      [status, id, companyId]
    );
    return rows[0];
  },
  async delete(id, studentId) {
    const { rowCount } = await query(
      'DELETE FROM applications WHERE id = $1 AND student_id = $2',
      [id, studentId]
    );
    return rowCount > 0;
  },
};

module.exports = Application;
