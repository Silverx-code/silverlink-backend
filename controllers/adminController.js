const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const User = require('../models/User');
const Coordinator = require('../models/Coordinator');

// GET /api/admin/companies/pending — unverified or pending_confirmation companies
const listPendingCompanies = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT c.id, c.name, c.industry, c.status, c.is_verified, c.verification_email, c.created_at,
            u.email AS account_email
     FROM companies c
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.is_verified = FALSE OR c.status = 'pending_confirmation'
     ORDER BY c.created_at DESC`
  );
  res.status(200).json({ success: true, data: rows });
});

// PATCH /api/admin/companies/:id/verify — manual override verification
const verifyCompanyManually = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE companies
     SET is_verified = TRUE, verification_token = NULL, verification_token_expires = NULL
     WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  if (!rows[0]) throw new ApiError(404, 'Company not found');
  res.status(200).json({ success: true, data: rows[0] });
});

// GET /api/admin/reviews/unmoderated
const listUnmoderatedReviews = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT r.*, s.full_name AS student_name, c.name AS company_name
     FROM reviews r
     JOIN students s ON s.id = r.student_id
     JOIN companies c ON c.id = r.company_id
     WHERE r.is_moderated = FALSE
     ORDER BY r.created_at DESC`
  );
  res.status(200).json({ success: true, data: rows });
});

// PATCH /api/admin/reviews/:id/moderate  { action: 'approve' | 'remove' }
const moderateReview = asyncHandler(async (req, res) => {
  const { action } = req.body;
  if (!['approve', 'remove'].includes(action)) {
    throw new ApiError(400, 'action must be "approve" or "remove"');
  }

  if (action === 'remove') {
    const { rowCount } = await query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
    if (!rowCount) throw new ApiError(404, 'Review not found');
    return res.status(200).json({ success: true, message: 'Review removed' });
  }

  const { rows } = await query(
    'UPDATE reviews SET is_moderated = TRUE WHERE id = $1 RETURNING *',
    [req.params.id]
  );
  if (!rows[0]) throw new ApiError(404, 'Review not found');
  res.status(200).json({ success: true, data: rows[0] });
});

// GET /api/admin/stats — quick platform overview
const getStats = asyncHandler(async (req, res) => {
  const [students, companies, applications, reviews, accepting] = await Promise.all([
    query('SELECT COUNT(*)::int AS count FROM students'),
    query('SELECT COUNT(*)::int AS count FROM companies'),
    query('SELECT COUNT(*)::int AS count FROM applications'),
    query('SELECT COUNT(*)::int AS count FROM reviews'),
    query("SELECT COUNT(*)::int AS count FROM companies WHERE status = 'currently_accepting'"),
  ]);

  res.status(200).json({
    success: true,
    data: {
      students: students.rows[0].count,
      companies: companies.rows[0].count,
      applications: applications.rows[0].count,
      reviews: reviews.rows[0].count,
      currentlyAccepting: accepting.rows[0].count,
    },
  });
});

// ---------- Universities & coordinators ----------

// GET /api/admin/universities
const listUniversities = asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT * FROM universities ORDER BY name ASC');
  res.status(200).json({ success: true, data: rows });
});

// POST /api/admin/universities  { name, state }
const createUniversity = asyncHandler(async (req, res) => {
  const { name, state } = req.body;
  if (!name) throw new ApiError(400, 'name is required');
  const { rows } = await query(
    'INSERT INTO universities (name, state) VALUES ($1, $2) RETURNING *',
    [name, state || null]
  );
  res.status(201).json({ success: true, data: rows[0] });
});

// POST /api/admin/coordinators  { email, password, fullName, universityId, title }
const createCoordinator = asyncHandler(async (req, res) => {
  const {
    email, password, fullName, universityId, title,
  } = req.body;
  if (!email || !password || !fullName || !universityId) {
    throw new ApiError(400, 'email, password, fullName, and universityId are required');
  }

  const existing = await User.findByEmail(email);
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash, role: 'coordinator' });
  const coordinator = await Coordinator.create({
    userId: user.id, universityId, fullName, title,
  });

  res.status(201).json({ success: true, data: { user, coordinator } });
});

// ---------- Analytics trends ----------

// GET /api/admin/analytics — last 6 months of key activity, plus top companies
const getAnalytics = asyncHandler(async (req, res) => {
  const [applicationsByMonth, studentsByMonth, companiesByMonth, topCompanies] = await Promise.all([
    query(`
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, COUNT(*)::int AS count
      FROM applications
      WHERE created_at > now() - interval '6 months'
      GROUP BY 1 ORDER BY 1`),
    query(`
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, COUNT(*)::int AS count
      FROM students
      WHERE created_at > now() - interval '6 months'
      GROUP BY 1 ORDER BY 1`),
    query(`
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, COUNT(*)::int AS count
      FROM companies
      WHERE created_at > now() - interval '6 months'
      GROUP BY 1 ORDER BY 1`),
    query(`
      SELECT c.id, c.name, COUNT(a.id)::int AS application_count,
             COALESCE(AVG(r.overall_rating), 0)::numeric(2,1) AS avg_rating
      FROM companies c
      LEFT JOIN applications a ON a.company_id = c.id
      LEFT JOIN reviews r ON r.company_id = c.id
      GROUP BY c.id
      ORDER BY application_count DESC
      LIMIT 10`),
  ]);

  res.status(200).json({
    success: true,
    data: {
      applicationsByMonth: applicationsByMonth.rows,
      studentsByMonth: studentsByMonth.rows,
      companiesByMonth: companiesByMonth.rows,
      topCompanies: topCompanies.rows,
    },
  });
});

module.exports = {
  listPendingCompanies,
  verifyCompanyManually,
  listUnmoderatedReviews,
  moderateReview,
  getStats,
  listUniversities,
  createUniversity,
  createCoordinator,
  getAnalytics,
};
