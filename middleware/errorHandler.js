const config = require('../config');

// 404 handler — placed after all routes
function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

// Central error handler — every ApiError / thrown error lands here
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Postgres unique violation
  if (err.code === '23505') {
    statusCode = 409;
    message = 'A record with these details already exists';
  }
  // Postgres foreign key violation
  if (err.code === '23503') {
    statusCode = 400;
    message = 'Related record not found';
  }

  if (statusCode === 500) {
    console.error('[UNHANDLED ERROR]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    details: err.details || undefined,
    stack: config.env === 'development' ? err.stack : undefined,
  });
}

module.exports = { notFound, errorHandler };
