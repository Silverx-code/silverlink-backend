const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Company = require('../models/Company');
const Student = require('../models/Student');
const { query } = require('../config/db');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

// GET /api/companies?department=&industry=&state=&city=&status=&q=&page=&limit=
const searchCompanies = asyncHandler(async (req, res) => {
  const { page, limit, offset } = getPagination(req.query);
  const {
    department, industry, state, city, status, q, listingType,
  } = req.query;

  const { rows, total } = await Company.search({
    department, industry, state, city, status, q, listingType, limit, offset,
  });

  res.status(200).json({
    success: true,
    data: rows,
    meta: buildPaginationMeta(page, limit, total),
  });
});

const getCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) throw new ApiError(404, 'Company not found');

  // Fire-and-forget — a logging failure should never break the page load
  Company.logView(req.params.id, req.user?.id).catch(() => {});

  res.status(200).json({ success: true, data: company });
});

// Admin/seed-time creation of historical listings
const createCompany = asyncHandler(async (req, res) => {
  const company = await Company.create(req.body);
  if (req.body.departments && req.body.departments.length) {
    await Company.setDepartments(company.id, req.body.departments);
  }
  res.status(201).json({ success: true, data: company });
});

const updateCompanyStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const valid = ['currently_accepting', 'pending_confirmation', 'historical_listing', 'applications_closed'];
  if (!valid.includes(status)) throw new ApiError(400, `Status must be one of: ${valid.join(', ')}`);

  const updated = await Company.updateStatus(req.params.id, status);
  if (!updated) throw new ApiError(404, 'Company not found');
  res.status(200).json({ success: true, data: updated });
});

const addReview = asyncHandler(async (req, res) => {
  const student = await Student.findByUserId(req.user.id);
  if (!student) throw new ApiError(404, 'Student profile not found');

  const {
    trainingQuality, workEnvironment, mentorship, allowanceInfo, overallRating, comment,
  } = req.body;
  if (!overallRating) throw new ApiError(400, 'overallRating is required');

  const { rows } = await query(
    `INSERT INTO reviews
       (student_id, company_id, training_quality, work_environment, mentorship, allowance_info, overall_rating, comment)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (student_id, company_id) DO UPDATE
       SET training_quality = EXCLUDED.training_quality,
           work_environment = EXCLUDED.work_environment,
           mentorship = EXCLUDED.mentorship,
           allowance_info = EXCLUDED.allowance_info,
           overall_rating = EXCLUDED.overall_rating,
           comment = EXCLUDED.comment
     RETURNING *`,
    [student.id, req.params.id, trainingQuality || null, workEnvironment || null,
      mentorship || null, allowanceInfo || null, overallRating, comment || null]
  );
  res.status(201).json({ success: true, data: rows[0] });
});

const listReviews = asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT r.*, s.full_name AS student_name
     FROM reviews r
     JOIN students s ON s.id = r.student_id
     WHERE r.company_id = $1
     ORDER BY r.created_at DESC`,
    [req.params.id]
  );
  res.status(200).json({ success: true, data: rows });
});

// ---------- Company dashboard (role: company) ----------

const getMyCompany = asyncHandler(async (req, res) => {
  const company = await Company.findByUserId(req.user.id);
  if (!company) throw new ApiError(404, 'No company profile found for this account');
  const departments = await Company.listDepartments(company.id);
  res.status(200).json({ success: true, data: { ...company, departments } });
});

const updateMyCompany = asyncHandler(async (req, res) => {
  const company = await Company.findByUserId(req.user.id);
  if (!company) throw new ApiError(404, 'No company profile found for this account');
  const updated = await Company.updateOwnProfile(company.id, req.body);
  res.status(200).json({ success: true, data: updated });
});

const updateMyDepartments = asyncHandler(async (req, res) => {
  const company = await Company.findByUserId(req.user.id);
  if (!company) throw new ApiError(404, 'No company profile found for this account');
  if (!Array.isArray(req.body.departments)) throw new ApiError(400, 'departments must be an array of strings');
  const departments = await Company.setDepartments(company.id, req.body.departments);
  res.status(200).json({ success: true, data: departments });
});

const updateMyStatus = asyncHandler(async (req, res) => {
  const valid = ['currently_accepting', 'pending_confirmation', 'historical_listing', 'applications_closed'];
  if (!valid.includes(req.body.status)) throw new ApiError(400, `Status must be one of: ${valid.join(', ')}`);
  const company = await Company.findByUserId(req.user.id);
  if (!company) throw new ApiError(404, 'No company profile found for this account');
  const updated = await Company.updateStatus(company.id, req.body.status);
  res.status(200).json({ success: true, data: updated });
});

const uploadMyLogo = asyncHandler(async (req, res) => {
  const company = await Company.findByUserId(req.user.id);
  if (!company) throw new ApiError(404, 'No company profile found for this account');
  if (!req.file) throw new ApiError(400, 'No logo file uploaded');
  const updated = await Company.updateOwnProfile(company.id, { logo_url: req.file.path });
  res.status(200).json({ success: true, data: updated });
});

const getMyViewStats = asyncHandler(async (req, res) => {
  const company = await Company.findByUserId(req.user.id);
  if (!company) throw new ApiError(404, 'No company profile found for this account');
  const stats = await Company.viewStats(company.id);
  res.status(200).json({ success: true, data: stats });
});

module.exports = {
  searchCompanies,
  getCompany,
  createCompany,
  updateCompanyStatus,
  addReview,
  listReviews,
  getMyCompany,
  updateMyCompany,
  updateMyDepartments,
  updateMyStatus,
  uploadMyLogo,
  getMyViewStats,
};
