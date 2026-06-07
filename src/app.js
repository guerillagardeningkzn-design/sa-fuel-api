// src/app.js

const express      = require('express');
const cors         = require('cors');
const path         = require('path');
const pricesRouter = require('./routes/prices');
const errorHandler = require('./middleware/errorHandler');
const { publicLimiter, writeLimiter } = require('./middleware/rateLimit');

const app = express();

// ── CORS — open to all origins (public API) ── //
app.use(cors());

// ── Body parsing ───────────────────────── //
app.use(express.json());

// ── Static docs page ───────────────────── //
app.use(express.static(path.join(__dirname, '../public')));

// ── Health / root ──────────────────────── //
app.get('/', (req, res) => {
  res.json({
    name:        'SA Fuel Price API',
    version:     '1.0.0',
    description: 'Monthly South African fuel retail prices — DMRE gazette data',
    author:      'MD Works · Morney Deetlefs',
    docs:        `${req.protocol}://${req.get('host')}/docs`,
    endpoints: {
      allPrices:    'GET  /v1/prices',
      latest:       'GET  /v1/prices/latest',
      byMonth:      'GET  /v1/prices/:month  (YYYY-MM)',
      range:        'GET  /v1/prices/range?from=YYYY-MM&to=YYYY-MM',
      stats:        'GET  /v1/stats',
      addMonth:     'POST /v1/prices          (API key required)',
      updateMonth:  'PUT  /v1/prices/:month   (API key required)',
    },
  });
});

// ── API routes ─────────────────────────── //
app.use('/v1/prices', publicLimiter,  pricesRouter);
app.use('/v1/stats',  publicLimiter,  require('./routes/prices'));

// ── 404 handler ────────────────────────── //
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found.` },
  });
});

// ── Global error handler ───────────────── //
app.use(errorHandler);

module.exports = app;
