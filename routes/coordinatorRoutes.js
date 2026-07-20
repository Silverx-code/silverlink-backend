const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const {
  getMe, getMyStudents, getMyRecommendedCompanies, getMyStats,
} = require('../controllers/coordinatorController');

const router = express.Router();

router.use(protect, restrictTo('coordinator'));

router.get('/me', getMe);
router.get('/me/stats', getMyStats);
router.get('/me/students', getMyStudents);
router.get('/me/recommended-companies', getMyRecommendedCompanies);

module.exports = router;
