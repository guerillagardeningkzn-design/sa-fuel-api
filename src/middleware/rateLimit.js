// src/middleware/rateLimit.js

const rateLimit = require('express-rate-limit');

// Public read endpoints — 100 requests per 15 minutes per IP
const publicLimiter = rateLimit({
  windowMs:         15 * 60 * 1000,
  max:              100,
  standardHeaders:  true,
  legacyHeaders:    false,
  message: {
    success: false,
    error: {
      code:    'RATE_LIMITED',
      message: 'Too many requests — please wait before trying again.',
    },
  },
});

// Write endpoints — 20 requests per hour per IP
const writeLimiter = rateLimit({
  windowMs:         60 * 60 * 1000,
  max:              20,
  standardHeaders:  true,
  legacyHeaders:    false,
  message: {
    success: false,
    error: {
      code:    'RATE_LIMITED',
      message: 'Write limit reached — maximum 20 writes per hour.',
    },
  },
});

module.exports = { publicLimiter, writeLimiter };
