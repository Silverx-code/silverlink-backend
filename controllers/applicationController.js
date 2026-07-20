const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Application = require('../models/Application');
const Student = require('../models/Student');
const Company = require('../models/Company');
const { notify } = require('../services/notificationService');
const { sendMail, applicationStatusHtml } = require('../services/emailService');
const { query } = require('../config/db');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');

// POST /api/companies/:id/applications  (student)
const applyToCompany = asyncHandler(async (req, res) => {
  const student = await Student.findByUserId(req.user.id);
  if (!student) throw new ApiError(404, 'Student profile not found');

  const company = await Company.findById(req.params.id);
  if (!company) throw new ApiError(404, 'Company not found');
  if (company.status !== 'currently_accepting') {
    throw new ApiError(400, 'This company is not currently accepting applications');
  }

  const application = await Application.create(student.id, req.params.id, req.body.coverNote);
  if (!application) throw new ApiError(409, 'You have already applied to this company');

  if (company.user_id) {
    await notify(
      company.user_id,
      'New application received',
      `${student.full_name} applied for SIWES placement.`
    );
  }

  res.status(201).json({ success: true, data: application });
});

// GET /api/students/me/applications  (student)
const listMyApplications = asyncHandler(async (req, res) => {
  const student = await Student.findByUserId(req.user.id);
  if (!student) throw new ApiError(404, 'Student profile not found');
  const applications = await Application.findByStudent(student.id);
  res.status(200).json({ success: true, data: applications });
});

// GET /api/companies/me/applications  (company)
const listCompanyApplications = asyncHandler(async (req, res) => {
  const company = await Company.findByUserId(req.user.id);
  if (!company) throw new ApiError(404, 'Company profile not found');

  const { page, limit, offset } = getPagination(req.query);
  const { department, level, status } = req.query;
  const { rows, total } = await Application.findByCompany(company.id, {
    limit, offset, department, level, status,
  });
  res.status(200).json({ success: true, data: rows, meta: buildPaginationMeta(page, limit, total) });
});

// PATCH /api/companies/me/applications/:id  (company)  { status: 'reviewed'|'accepted'|'rejected' }
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const valid = ['reviewed', 'accepted', 'rejected'];
  const { status } = req.body;
  if (!valid.includes(status)) throw new ApiError(400, `Status must be one of: ${valid.join(', ')}`);

  const company = await Company.findByUserId(req.user.id);
  if (!company) throw new ApiError(404, 'Company profile not found');

  const updated = await Application.updateStatus(req.params.id, company.id, status);
  if (!updated) throw new ApiError(404, 'Application not found for this company');

  if (status === 'accepted') {
    await Company.decrementSlotOnAcceptance(company.id);
  }

  const { rows } = await query(
    `SELECT s.full_name, u.id AS user_id, u.email
     FROM students s JOIN users u ON u.id = s.user_id
     WHERE s.id = $1`,
    [updated.student_id]
  );
  const student = rows[0];
  if (student) {
    await notify(
      student.user_id,
      'Application status updated',
      `${company.name} marked your application as "${status}".`
    );
    await sendMail({
      to: student.email,
      subject: `Update on your application to ${company.name}`,
      html: applicationStatusHtml({ studentName: student.full_name, companyName: company.name, status }),
    });
  }

  res.status(200).json({ success: true, data: updated });
});

// DELETE /api/students/me/applications/:id  (student withdraws their own application)
const withdrawApplication = asyncHandler(async (req, res) => {
  const student = await Student.findByUserId(req.user.id);
  if (!student) throw new ApiError(404, 'Student profile not found');

  const deleted = await Application.delete(req.params.id, student.id);
  if (!deleted) throw new ApiError(404, 'Application not found');

  res.status(200).json({ success: true, message: 'Application withdrawn' });
});

module.exports = {
  applyToCompany, listMyApplications, listCompanyApplications, updateApplicationStatus, withdrawApplication,
};
