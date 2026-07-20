const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Student = require('../models/Student');
const Company = require('../models/Company');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/token');
const { generateToken, hoursFromNow } = require('../utils/randomToken');
const { sendMail, verificationEmailHtml, passwordResetEmailHtml } = require('./emailService');
const config = require('../config');

const SALT_ROUNDS = 10;

async function registerStudent({ email, password, fullName, universityId, faculty, department, level }) {
  const existing = await User.findByEmail(email);
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ email, passwordHash, role: 'student' });
  const student = await Student.create(user.id, { fullName, universityId, faculty, department, level });

  const token = signToken({ id: user.id, role: user.role });
  return { token, user, profile: student };
}

async function login({ email, password }) {
  const user = await User.findByEmail(email);
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) throw new ApiError(401, 'Invalid email or password');

  if (!user.is_active) throw new ApiError(403, 'This account has been deactivated');

  const token = signToken({ id: user.id, role: user.role });
  const { password_hash, ...safeUser } = user;
  return { token, user: safeUser };
}

// Company registration covers two cases:
// 1. companyId provided -> claim an existing unclaimed historical listing
// 2. no companyId -> create a brand-new company profile owned by this account
async function registerCompany({
  email, password, companyName, industry, companyId,
}) {
  const existing = await User.findByEmail(email);
  if (existing) throw new ApiError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ email, passwordHash, role: 'company' });

  let company;
  if (companyId) {
    const unclaimed = await Company.findUnclaimedById(companyId);
    if (!unclaimed) throw new ApiError(404, 'That company listing was not found or is already claimed');
    company = await Company.claim(user.id, companyId, email);
  } else {
    if (!companyName) throw new ApiError(400, 'companyName is required when not claiming an existing listing');
    company = await Company.createOwned(user.id, { name: companyName, industry, verificationEmail: email });
  }

  const token = generateToken();
  await Company.setVerificationToken(company.id, token, hoursFromNow(24));

  const verifyUrl = `${config.clientUrl}/verify-company/${token}`;
  await sendMail({
    to: email,
    subject: 'Verify your company on Silver Link',
    html: verificationEmailHtml({ companyName: company.name, verifyUrl }),
  });

  const authToken = signToken({ id: user.id, role: user.role });
  return { token: authToken, user, company };
}

async function verifyCompanyEmail(token) {
  const company = await Company.verifyByToken(token);
  if (!company) throw new ApiError(400, 'Verification link is invalid or has expired');
  return company;
}

async function resendCompanyVerification(userId) {
  const company = await Company.findByUserId(userId);
  if (!company) throw new ApiError(404, 'No company profile found for this account');
  if (company.is_verified) throw new ApiError(400, 'This company is already verified');

  const token = generateToken();
  await Company.setVerificationToken(company.id, token, hoursFromNow(24));
  const verifyUrl = `${config.clientUrl}/verify-company/${token}`;
  await sendMail({
    to: company.verification_email,
    subject: 'Verify your company on Silver Link',
    html: verificationEmailHtml({ companyName: company.name, verifyUrl }),
  });
  return { sent: true };
}

async function requestPasswordReset(email) {
  const user = await User.findByEmail(email);
  // Always behave the same whether or not the account exists — don't leak which emails are registered
  if (!user) return { sent: true };

  const token = generateToken();
  await User.setResetToken(user.id, token, hoursFromNow(1));

  const resetUrl = `${config.clientUrl}/reset-password/${token}`;
  await sendMail({
    to: user.email,
    subject: 'Reset your Silver Link password',
    html: passwordResetEmailHtml({ resetUrl }),
  });
  return { sent: true };
}

async function resetPassword(token, newPassword) {
  const user = await User.findByResetToken(token);
  if (!user) throw new ApiError(400, 'Reset link is invalid or has expired');

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await User.updatePassword(user.id, passwordHash);
  await User.clearResetToken(user.id);

  const authToken = signToken({ id: user.id, role: user.role });
  return { token: authToken };
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findByIdWithPassword(userId);
  if (!user) throw new ApiError(404, 'Account not found');

  const match = await bcrypt.compare(currentPassword, user.password_hash);
  if (!match) throw new ApiError(401, 'Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await User.updatePassword(userId, passwordHash);
  return { updated: true };
}

module.exports = {
  registerStudent,
  login,
  registerCompany,
  verifyCompanyEmail,
  resendCompanyVerification,
  requestPasswordReset,
  resetPassword,
  changePassword,
};
