const express = require('express');
const { protect } = require('../middleware/auth');
const { searchLocations, findOrCreateLocation } = require('../controllers/locationController');

const router = express.Router();

router.get('/', searchLocations);
router.post('/', protect, findOrCreateLocation);

module.exports = router;
