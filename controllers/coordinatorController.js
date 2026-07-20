const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Coordinator = require('../models/Coordinator');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

const getMe = asyncHandler(async (req, res) => {
  const coordinator = await Coordinator.findByUserId(req.user.id);
  if (!coordinator) throw new ApiError(404, 'No coordinator profile found for this account');
  res.status(200).json({ success: true, data: coordinator });
});

const getMyStudents = asyncHandler(async (req, res) => {
  const coordinator = await Coordinator.findByUserId(req.user.id);
  if (!coordinator) throw new ApiError(404, 'No coordinator profile found for this account');

  const { page, limit, offset } = getPagination(req.query, 25);
  const { rows, total } = await Coordinator.listStudents(coordinator.university_id, { limit, offset });
  res.status(200).json({ success: true, data: rows, meta: buildPaginationMeta(page, limit, total) });
});

const getMyRecommendedCompanies = asyncHandler(async (req, res) => {
  const coordinator = await Coordinator.findByUserId(req.user.id);
  if (!coordinator) throw new ApiError(404, 'No coordinator profile found for this account');
  const companies = await Coordinator.recommendedCompanies(coordinator.university_id);
  res.status(200).json({ success: true, data: companies });
});

const getMyStats = asyncHandler(async (req, res) => {
  const coordinator = await Coordinator.findByUserId(req.user.id);
  if (!coordinator) throw new ApiError(404, 'No coordinator profile found for this account');
  const stats = await Coordinator.universityStats(coordinator.university_id);
  res.status(200).json({ success: true, data: stats });
});

module.exports = {
  getMe, getMyStudents, getMyRecommendedCompanies, getMyStats,
};
