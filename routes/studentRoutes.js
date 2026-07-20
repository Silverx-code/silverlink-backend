const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadCv } = require('../middleware/upload');
const {
  getMyProfile, updateMyProfile, saveCompany, unsaveCompany, getSavedCompanies, uploadMyCv, getRecommendations,
} = require('../controllers/studentController');
const { listMyApplications, withdrawApplication } = require('../controllers/applicationController');

const router = express.Router();

router.use(protect, restrictTo('student'));

router.get('/me', getMyProfile);
router.patch('/me', updateMyProfile);
router.post('/me/cv', uploadCv, uploadMyCv);
router.get('/me/saved-companies', getSavedCompanies);
router.post('/me/saved-companies/:companyId', saveCompany);
router.delete('/me/saved-companies/:companyId', unsaveCompany);
router.get('/me/applications', listMyApplications);
router.delete('/me/applications/:id', withdrawApplication);
router.get('/me/recommendations', getRecommendations);

module.exports = router;
