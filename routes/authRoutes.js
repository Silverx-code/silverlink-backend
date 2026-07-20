const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const honeypot = require('../middleware/honeypot');
const verifyCaptcha = require('../middleware/captcha');

const {
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
} = require('../controllers/authController');

const router = express.Router();

router.get('/captcha', getCaptcha);

router.post(
  '/register/student',
  honeypot,
  verifyCaptcha,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('fullName').notEmpty().withMessage('Full name is required'),
  ],
  validate,
  registerStudent
);

router.post(
  '/register/company',
  honeypot,
  verifyCaptcha,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('companyId').optional().isUUID().withMessage('companyId must be a valid id'),
  ],
  validate,
  registerCompany
);

router.get('/verify-company/:token', verifyCompany);
router.post('/verify-company/resend', protect, resendCompanyVerification);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email required')],
  validate,
  forgotPassword
);

router.post(
  '/reset-password/:token',
  [body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')],
  validate,
  resetPassword
);

router.post(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  changePassword
);

router.get('/me', protect, getMe);

module.exports = router;
