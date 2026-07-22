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
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect, restrictTo('admin'));

router.get('/stats', getStats);
router.get('/analytics', getAnalytics);

router.get('/companies/pending', listPendingCompanies);
router.patch('/companies/:id/verify', verifyCompanyManually);

router.get('/reviews/unmoderated', listUnmoderatedReviews);
router.patch('/reviews/:id/moderate', moderateReview);

router.get('/universities', listUniversities);
router.post('/universities', createUniversity);
router.post('/coordinators', createCoordinator);

router.get('/users', listUsers);
router.patch('/users/:id/active', setUserActive);
router.delete('/users/:id', deleteUser);

module.exports = router;
