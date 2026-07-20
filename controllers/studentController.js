const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Student = require('../models/Student');
const Company = require('../models/Company');
const { query } = require('../config/db');

const getMyProfile = asyncHandler(async (req, res) => {
  const student = await Student.findByUserId(req.user.id);
  if (!student) throw new ApiError(404, 'Student profile not found');
  res.status(200).json({ success: true, data: student });
});

const updateMyProfile = asyncHandler(async (req, res) => {
  const updated = await Student.updateProfile(req.user.id, req.body);
  res.status(200).json({ success: true, data: updated });
});

const saveCompany = asyncHandler(async (req, res) => {
  const student = await Student.findByUserId(req.user.id);
  if (!student) throw new ApiError(404, 'Student profile not found');

  await query(
    `INSERT INTO saved_companies (student_id, company_id)
     VALUES ($1, $2) ON CONFLICT (student_id, company_id) DO NOTHING`,
    [student.id, req.params.companyId]
  );
  res.status(201).json({ success: true, message: 'Company saved' });
});

const unsaveCompany = asyncHandler(async (req, res) => {
  const student = await Student.findByUserId(req.user.id);
  if (!student) throw new ApiError(404, 'Student profile not found');

  await query(
    'DELETE FROM saved_companies WHERE student_id = $1 AND company_id = $2',
    [student.id, req.params.companyId]
  );
  res.status(200).json({ success: true, message: 'Company removed from saved list' });
});

const getSavedCompanies = asyncHandler(async (req, res) => {
  const student = await Student.findByUserId(req.user.id);
  if (!student) throw new ApiError(404, 'Student profile not found');

  const { rows } = await query(
    `SELECT c.id, c.name, c.logo_url, c.industry, c.status
     FROM saved_companies sc
     JOIN companies c ON c.id = sc.company_id
     WHERE sc.student_id = $1
     ORDER BY sc.created_at DESC`,
    [student.id]
  );
  res.status(200).json({ success: true, data: rows });
});

const getRecommendations = asyncHandler(async (req, res) => {
  const student = await Student.findByUserId(req.user.id);
  if (!student) throw new ApiError(404, 'Student profile not found');
  const recommendations = await Company.recommendedForStudent(student);
  res.status(200).json({ success: true, data: recommendations });
});

const uploadMyCv = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No CV file uploaded');
  const updated = await Student.updateProfile(req.user.id, { cv_url: req.file.path });
  res.status(200).json({ success: true, data: updated });
});

module.exports = {
  getMyProfile, updateMyProfile, saveCompany, unsaveCompany, getSavedCompanies, uploadMyCv, getRecommendations,
};
