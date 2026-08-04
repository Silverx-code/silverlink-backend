const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const {
  listPendingCompanies,
  verifyCompanyManually,
  listUnmoderatedReviews,
  moderateReview,
  getStats,
  listUniversities,
  createUniversity,
  createCoordinator,
  getAnalytics,
  listUsers,
  setUserActive,
  deleteUser,
  listCompaniesAdmin,
  deleteCompany,
  getCompanyVerificationLink,
  checkEmailConnectivity,
} = require('../controllers/adminController');
const {
  getScraperStatus,
  runScraperManually,
  getScraperLogs,
} = require('../controllers/scraperController');

const router = express.Router();

router.use(protect, restrictTo('admin'));
router.get('/companies/:id/verification-link', getCompanyVerificationLink);

router.get('/stats', getStats);
router.get('/analytics', getAnalytics);
router.get('/diagnostics/email', checkEmailConnectivity);

router.get('/companies/pending', listPendingCompanies);
router.patch('/companies/:id/verify', verifyCompanyManually);
router.get('/companies', listCompaniesAdmin);
router.get('/scraper/status', getScraperStatus);
router.post('/scraper/run', runScraperManually);
router.get('/scraper/logs', getScraperLogs);
router.delete('/companies/:id', deleteCompany);

router.get('/reviews/unmoderated', listUnmoderatedReviews);
router.patch('/reviews/:id/moderate', moderateReview);

router.get('/universities', listUniversities);
router.post('/universities', createUniversity);
router.post('/coordinators', createCoordinator);

router.get('/users', listUsers);
router.patch('/users/:id/active', setUserActive);
router.delete('/users/:id', deleteUser);

module.exports = router;
