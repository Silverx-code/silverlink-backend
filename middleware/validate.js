const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Run after express-validator chains; throws a single formatted 400 on failure
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    throw new ApiError(400, 'Validation failed', details);
  }
  next();
}

module.exports = validate;
