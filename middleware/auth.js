const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../utils/token');
const { query } = require('../config/db');

// Requires a valid JWT; attaches { id, email, role } to req.user
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Not authenticated — missing token');
  }

  const token = header.split(' ')[1];
  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired token');
  }

  const { rows } = await query(
    'SELECT id, email, role, is_active FROM users WHERE id = $1',
    [decoded.id]
  );
  const user = rows[0];
  if (!user || !user.is_active) {
    throw new ApiError(401, 'User no longer exists or is deactivated');
  }

  req.user = user;
  next();
});

// Restricts a route to specific roles, e.g. restrictTo('admin', 'company')
const restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(403, 'You do not have permission to perform this action');
  }
  next();
};

module.exports = { protect, restrictTo };
