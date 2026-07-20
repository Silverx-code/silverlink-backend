const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Location = require('../models/Location');

const searchLocations = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.status(200).json({ success: true, data: [] });
  const results = await Location.search(q);
  res.status(200).json({ success: true, data: results });
});

const findOrCreateLocation = asyncHandler(async (req, res) => {
  const { state, city } = req.body;
  if (!state || !city) throw new ApiError(400, 'state and city are required');
  const location = await Location.findOrCreate(state.trim(), city.trim());
  res.status(200).json({ success: true, data: location });
});

module.exports = { searchLocations, findOrCreateLocation };
