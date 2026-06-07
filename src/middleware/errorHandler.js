// src/middleware/errorHandler.js

function errorHandler(err, req, res, _next) {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} — ${err.message}`);

  // Postgres errors
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'A record for that month already exists.' },
    });
  }
  if (err.code === '22P02') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'Invalid data type in request.' },
    });
  }

  // Default 500
  res.status(500).json({
    success: false,
    error: {
      code:    'SERVER_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred.'
        : err.message,
    },
  });
}

module.exports = errorHandler;
