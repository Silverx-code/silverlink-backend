const { query } = require('../config/db');

const Company = {
  async create(data) {
    const {
      name, logoUrl, industry, description, website,
      locationId, address, status,
    } = data;
    const { rows } = await query(
      `INSERT INTO companies (name, logo_url, industry, description, website, location_id, address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 'historical_listing'))
       RETURNING *`,
      [name, logoUrl || null, industry || null, description || null, website || null,
        locationId || null, address || null, status || null]
    );
    return rows[0];
  },

  // Self-registration: creates a brand-new (unclaimed-in-directory) company already owned by userId
  async createOwned(userId, { name, industry, verificationEmail }) {
    const { rows } = await query(
      `INSERT INTO companies (user_id, name, industry, status, verification_email)
       VALUES ($1, $2, $3, 'pending_confirmation', $4)
       RETURNING *`,
      [userId, name, industry || null, verificationEmail || null]
    );
    return rows[0];
  },

  async findUnclaimedById(id) {
    const { rows } = await query('SELECT * FROM companies WHERE id = $1 AND user_id IS NULL', [id]);
    return rows[0];
  },

  // Links an existing historical listing to a newly-registered company account
  async claim(userId, companyId, verificationEmail) {
    const { rows } = await query(
      `UPDATE companies SET user_id = $1, verification_email = $2
       WHERE id = $3 AND user_id IS NULL
       RETURNING *`,
      [userId, verificationEmail || null, companyId]
    );
    return rows[0];
  },

  async findByUserId(userId) {
    const { rows } = await query('SELECT * FROM companies WHERE user_id = $1', [userId]);
    return rows[0];
  },

  async setVerificationToken(companyId, token, expiresAt) {
    const { rows } = await query(
      `UPDATE companies SET verification_token = $1, verification_token_expires = $2
       WHERE id = $3 RETURNING id, name, verification_email`,
      [token, expiresAt, companyId]
    );
    return rows[0];
  },

  async verifyByToken(token) {
    const { rows } = await query(
      `UPDATE companies
       SET is_verified = TRUE, verification_token = NULL, verification_token_expires = NULL
       WHERE verification_token = $1 AND verification_token_expires > now()
       RETURNING *`,
      [token]
    );
    return rows[0];
  },

  async updateOwnProfile(companyId, fields) {
    const allowed = [
      'name', 'logo_url', 'industry', 'description', 'website',
      'location_id', 'address', 'available_slots', 'listing_type',
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
    if (sets.length === 0) return query('SELECT * FROM companies WHERE id = $1', [companyId]).then((r) => r.rows[0]);

    values.push(companyId);
    const { rows } = await query(
      `UPDATE companies SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    return rows[0];
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT c.*,
              l.state, l.city, l.latitude, l.longitude,
              COALESCE(array_agg(DISTINCT cd.department) FILTER (WHERE cd.department IS NOT NULL), '{}') AS departments,
              COALESCE(AVG(r.overall_rating), 0)::numeric(2,1) AS avg_rating,
              COUNT(DISTINCT r.id) AS review_count
       FROM companies c
       LEFT JOIN locations l ON l.id = c.location_id
       LEFT JOIN company_departments cd ON cd.company_id = c.id
       LEFT JOIN reviews r ON r.company_id = c.id
       WHERE c.id = $1
       GROUP BY c.id, l.state, l.city, l.latitude, l.longitude`,
      [id]
    );
    return rows[0];
  },

  // Smart search: department, industry, state, city, status + pagination
  async search({
    department, industry, state, city, status, q, listingType, limit, offset,
  }) {
    const conditions = [];
    const values = [];
    let i = 1;

    let joinDept = '';
    if (department) {
      joinDept = 'JOIN company_departments cd ON cd.company_id = c.id';
      conditions.push(`cd.department ILIKE $${i}`);
      values.push(department);
      i += 1;
    }
    if (industry) {
      conditions.push(`c.industry ILIKE $${i}`);
      values.push(industry);
      i += 1;
    }
    if (status) {
      conditions.push(`c.status = $${i}`);
      values.push(status);
      i += 1;
    }
    if (listingType) {
      conditions.push(`c.listing_type = $${i}`);
      values.push(listingType);
      i += 1;
    }
    if (q) {
      conditions.push(`c.name ILIKE $${i}`);
      values.push(`%${q}%`);
      i += 1;
    }

    let joinLoc = '';
    if (state || city) {
      joinLoc = 'JOIN locations l ON l.id = c.location_id';
      if (state) {
        conditions.push(`l.state ILIKE $${i}`);
        values.push(state);
        i += 1;
      }
      if (city) {
        conditions.push(`l.city ILIKE $${i}`);
        values.push(city);
        i += 1;
      }
    } else {
      joinLoc = 'LEFT JOIN locations l ON l.id = c.location_id';
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(DISTINCT c.id)::int AS total
      FROM companies c
      ${joinDept}
      ${joinLoc}
      ${whereClause}`;
    const { rows: countRows } = await query(countSql, values);

    const dataSql = `
      SELECT DISTINCT c.id, c.name, c.logo_url, c.industry, c.status, c.listing_type,
             l.state, l.city
      FROM companies c
      ${joinDept}
      ${joinLoc}
      ${whereClause}
      ORDER BY c.name ASC
      LIMIT $${i} OFFSET $${i + 1}`;
    const { rows } = await query(dataSql, [...values, limit, offset]);

    return { rows, total: countRows[0].total };
  },

  async listDepartments(companyId) {
    const { rows } = await query(
      'SELECT department FROM company_departments WHERE company_id = $1 ORDER BY department',
      [companyId]
    );
    return rows.map((r) => r.department);
  },

  async setDepartments(companyId, departments) {
    await query('DELETE FROM company_departments WHERE company_id = $1', [companyId]);
    if (!departments || departments.length === 0) return [];
    const values = [];
    const placeholders = departments.map((dept, idx) => {
      values.push(companyId, dept);
      return `($${idx * 2 + 1}, $${idx * 2 + 2})`;
    });
    await query(
      `INSERT INTO company_departments (company_id, department) VALUES ${placeholders.join(', ')}`,
      values
    );
    return departments;
  },

  async updateStatus(companyId, status) {
    const { rows } = await query(
      'UPDATE companies SET status = $1 WHERE id = $2 RETURNING *',
      [status, companyId]
    );
    return rows[0];
  },
  // Explainable weighted-match "recommended for you" — department match, location
  // match, open status, and rating all contribute to a transparent score.
  async recommendedForStudent(student, limit = 12) {
    const { rows } = await query(
      `SELECT c.id, c.name, c.logo_url, c.industry, c.status,
              l.state, l.city,
              COALESCE(AVG(r.overall_rating), 0)::numeric(2,1) AS avg_rating,
              (
                CASE WHEN cd.department IS NOT NULL THEN 3 ELSE 0 END +
                CASE WHEN l.state ILIKE $2 THEN 2 ELSE 0 END +
                CASE WHEN c.status = 'currently_accepting' THEN 2 ELSE 0 END +
                COALESCE(AVG(r.overall_rating), 0) * 0.5
              ) AS match_score
       FROM companies c
       LEFT JOIN company_departments cd ON cd.company_id = c.id AND cd.department ILIKE $1
       LEFT JOIN locations l ON l.id = c.location_id
       LEFT JOIN reviews r ON r.company_id = c.id
       WHERE c.status IN ('currently_accepting', 'pending_confirmation')
       GROUP BY c.id, l.state, l.city, cd.department
       ORDER BY match_score DESC, c.name ASC
       LIMIT $3`,
      [student.department || '', student.preferred_state || '', limit]
    );
    return rows;
  },
  // Called when an application is accepted. Decrements available_slots and, if that
  // hits zero, flips status to applications_closed so the company stops appearing in
  // "currently accepting" searches until they reopen manually.
  async decrementSlotOnAcceptance(companyId) {
    const { rows } = await query(
      `UPDATE companies
       SET available_slots = GREATEST(available_slots - 1, 0)
       WHERE id = $1
       RETURNING *`,
      [companyId]
    );
    const company = rows[0];
    if (company && company.available_slots === 0 && company.status === 'currently_accepting') {
      const closed = await query(
        `UPDATE companies SET status = 'applications_closed' WHERE id = $1 RETURNING *`,
        [companyId]
      );
      return closed.rows[0];
    }
    return company;
  },
  async logView(companyId, viewerUserId) {
    await query(
      'INSERT INTO company_profile_views (company_id, viewer_user_id) VALUES ($1, $2)',
      [companyId, viewerUserId || null]
    );
  },

  async viewStats(companyId) {
    const { rows } = await query(
      `SELECT
         COUNT(*) FILTER (WHERE viewed_at > now() - interval '7 days')::int AS views_last_7_days,
         COUNT(*) FILTER (WHERE viewed_at > now() - interval '30 days')::int AS views_last_30_days,
         COUNT(*)::int AS views_all_time
       FROM company_profile_views
       WHERE company_id = $1`,
      [companyId]
    );
    return rows[0];
  },
};

module.exports = Company;
