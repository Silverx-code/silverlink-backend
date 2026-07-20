const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadLogo } = require('../middleware/upload');
const {
  searchCompanies, getCompany, createCompany, updateCompanyStatus, addReview, listReviews,
  getMyCompany, updateMyCompany, updateMyDepartments, updateMyStatus, uploadMyLogo, getMyViewStats,
} = require('../controllers/companyController');
const {
  applyToCompany, listCompanyApplications, updateApplicationStatus,
} = require('../controllers/applicationController');

const router = express.Router();

// ---- Company dashboard (must come before /:id so "me" isn't parsed as an id) ----
router.get('/me', protect, restrictTo('company'), getMyCompany);
router.patch('/me', protect, restrictTo('company'), updateMyCompany);
router.patch('/me/departments', protect, restrictTo('company'), updateMyDepartments);
router.patch('/me/status', protect, restrictTo('company'), updateMyStatus);
router.post('/me/logo', protect, restrictTo('company'), uploadLogo, uploadMyLogo);
router.get('/me/applications', protect, restrictTo('company'), listCompanyApplications);
router.patch('/me/applications/:id', protect, restrictTo('company'), updateApplicationStatus);
router.get('/me/views', protect, restrictTo('company'), getMyViewStats);

// ---- Public directory + search ----
router.get('/', searchCompanies);
router.get('/:id', getCompany);
router.get('/:id/reviews', listReviews);

// ---- Admin: seed / manage listings ----
router.post('/', protect, restrictTo('admin'), createCompany);
router.patch('/:id/status', protect, restrictTo('admin', 'company'), updateCompanyStatus);

// ---- Students: reviews + applications ----
router.post('/:id/reviews', protect, restrictTo('student'), addReview);
router.post('/:id/applications', protect, restrictTo('student'), applyToCompany);

module.exports = router;
