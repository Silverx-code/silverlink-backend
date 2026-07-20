const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');
const Student = require('../models/Student');
const Company = require('../models/Company');

const registerStudent = asyncHandler(async (req, res) => {
  const result = await authService.registerStudent(req.body);
  res.status(201).json({ success: true, data: result });
});

const registerCompany = asyncHandler(async (req, res) => {
  const result = await authService.registerCompany(req.body);
  res.status(201).json({ success: true, data: result });
});

const verifyCompany = asyncHandler(async (req, res) => {
  const company = await authService.verifyCompanyEmail(req.params.token);
  res.status(200).json({ success: true, data: company });
});

const resendCompanyVerification = asyncHandler(async (req, res) => {
  const result = await authService.resendCompanyVerification(req.user.id);
  res.status(200).json({ success: true, data: result });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json({ success: true, data: result });
});

const getMe = asyncHandler(async (req, res) => {
  let profile = null;
  if (req.user.role === 'student') {
    profile = await Student.findByUserId(req.user.id);
  } else if (req.user.role === 'company') {
    profile = await Company.findByUserId(req.user.id);
  }
  res.status(200).json({ success: true, data: { user: req.user, profile } });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.requestPasswordReset(req.body.email);
  res.status(200).json({ success: true, data: result });
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(req.params.token, req.body.password);
  res.status(200).json({ success: true, data: result });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
  res.status(200).json({ success: true, data: result });
});

const { generateChallenge } = require('../utils/captcha');

const getCaptcha = asyncHandler(async (req, res) => {
  const challenge = generateChallenge();
  res.status(200).json({ success: true, data: challenge });
});

module.exports = {
  registerStudent,
  registerCompany,
  verifyCompany,
  resendCompanyVerification,
  login,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  getCaptcha,
};
