const config = require('../config');
const multer = require('multer');

// 404 handler — placed after all routes
function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
}

// Central error handler — every ApiError / thrown error lands here
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Multer's own errors (file too large, unexpected field, etc.) are the requester's
  // fault, not the server's — map them to 400 rather than falling through to 500.
  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'That file is too large.';
    }
  }

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
