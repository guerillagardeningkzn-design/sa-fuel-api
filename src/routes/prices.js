// src/routes/prices.js

const express         = require('express');
const pool            = require('../db/client');
const { requireApiKey } = require('../middleware/auth');

const router = express.Router();

// ── Shared column selector ─────────────── //
const COLS = `
  month, month_label,
  p95i::float,  p95c::float,
  p93i::float,
  d005i::float, d005c::float,
  source, updated_at
`;

// ── Helpers ────────────────────────────── //
function validateMonth(month) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

function formatRow(row) {
  return {
    month:      row.month,
    monthLabel: row.month_label,
    prices: {
      petrol: {
        p95Inland:  row.p95i,
        p95Coastal: row.p95c,
        p93Inland:  row.p93i,
      },
      diesel: {
        d005Inland:  row.d005i,
        d005Coastal: row.d005c,
      },
    },
    source:    row.source,
    updatedAt: row.updated_at,
  };
}

// ── GET /v1/prices ─────────────────────── //
// All prices, newest first. Optional: ?limit=12&offset=0
router.get('/', async (req, res, next) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit  || 50), 200);
    const offset = Math.max(parseInt(req.query.offset || 0),  0);

    const { rows } = await pool.query(
      `SELECT ${COLS} FROM fuel_prices
       ORDER BY month DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const { rows: [{ count }] } = await pool.query(
      'SELECT COUNT(*)::int AS count FROM fuel_prices'
    );

    res.json({
      success: true,
      meta:    { total: count, limit, offset },
      data:    rows.map(formatRow),
    });
  } catch (err) { next(err); }
});

// ── GET /v1/prices/latest ──────────────── //
router.get('/latest', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${COLS} FROM fuel_prices ORDER BY month DESC LIMIT 1`
    );
    if (!rows.length) return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'No price data found.' },
    });
    res.json({ success: true, data: formatRow(rows[0]) });
  } catch (err) { next(err); }
});

// ── GET /v1/prices/range ───────────────── //
// ?from=2025-01&to=2026-05
router.get('/range', async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) return res.status(400).json({
      success: false,
      error: { code: 'MISSING_PARAMS', message: 'Both from and to query params required (YYYY-MM).' },
    });
    if (!validateMonth(from) || !validateMonth(to)) return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FORMAT', message: 'Use YYYY-MM format for from and to.' },
    });

    const { rows } = await pool.query(
      `SELECT ${COLS} FROM fuel_prices
       WHERE month BETWEEN $1 AND $2
       ORDER BY month ASC`,
      [from, to]
    );

    res.json({
      success: true,
      meta:    { count: rows.length, from, to },
      data:    rows.map(formatRow),
    });
  } catch (err) { next(err); }
});

// ── GET /v1/stats ──────────────────────── //
router.get('/stats', async (req, res, next) => {
  try {
    const { rows: [s] } = await pool.query(`
      SELECT
        COUNT(*)::int                   AS total_months,
        MIN(month)                      AS first_month,
        MAX(month)                      AS latest_month,
        ROUND(MIN(p95i)::numeric, 2)    AS p95i_min,
        ROUND(MAX(p95i)::numeric, 2)    AS p95i_max,
        ROUND(AVG(p95i)::numeric, 2)    AS p95i_avg,
        ROUND(MIN(d005i)::numeric, 2)   AS d005i_min,
        ROUND(MAX(d005i)::numeric, 2)   AS d005i_max,
        ROUND(AVG(d005i)::numeric, 2)   AS d005i_avg
      FROM fuel_prices
    `);
    res.json({ success: true, data: s });
  } catch (err) { next(err); }
});

// ── GET /v1/prices/:month ──────────────── //
// e.g. /v1/prices/2026-05
router.get('/:month', async (req, res, next) => {
  try {
    const { month } = req.params;
    if (!validateMonth(month)) return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FORMAT', message: 'Month must be in YYYY-MM format.' },
    });

    const { rows } = await pool.query(
      `SELECT ${COLS} FROM fuel_prices WHERE month = $1`,
      [month]
    );

    if (!rows.length) return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `No prices found for ${month}.` },
    });

    res.json({ success: true, data: formatRow(rows[0]) });
  } catch (err) { next(err); }
});

// ── POST /v1/prices ────────────────────── //
// Add a new month (API key required)
router.post('/', requireApiKey, async (req, res, next) => {
  try {
    const { month, monthLabel, p95i, p95c, p93i, d005i, d005c, source } = req.body;

    if (!month || !monthLabel || !p95i || !p95c || !p93i || !d005i || !d005c) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'month, monthLabel, p95i, p95c, p93i, d005i, d005c are required.' },
      });
    }
    if (!validateMonth(month)) return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FORMAT', message: 'month must be YYYY-MM.' },
    });

    const { rows } = await pool.query(
      `INSERT INTO fuel_prices
         (month, month_label, p95i, p95c, p93i, d005i, d005c, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING ${COLS}`,
      [month, monthLabel, p95i, p95c, p93i, d005i, d005c, source || 'DMRE']
    );

    res.status(201).json({ success: true, data: formatRow(rows[0]) });
  } catch (err) { next(err); }
});

// ── PUT /v1/prices/:month ──────────────── //
// Update an existing month (API key required)
router.put('/:month', requireApiKey, async (req, res, next) => {
  try {
    const { month } = req.params;
    if (!validateMonth(month)) return res.status(400).json({
      success: false,
      error: { code: 'INVALID_FORMAT', message: 'Month must be YYYY-MM.' },
    });

    const { p95i, p95c, p93i, d005i, d005c, source } = req.body;

    const { rows } = await pool.query(
      `UPDATE fuel_prices SET
         p95i  = COALESCE($1, p95i),
         p95c  = COALESCE($2, p95c),
         p93i  = COALESCE($3, p93i),
         d005i = COALESCE($4, d005i),
         d005c = COALESCE($5, d005c),
         source = COALESCE($6, source)
       WHERE month = $7
       RETURNING ${COLS}`,
      [p95i, p95c, p93i, d005i, d005c, source, month]
    );

    if (!rows.length) return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: `No record found for ${month}.` },
    });

    res.json({ success: true, data: formatRow(rows[0]) });
  } catch (err) { next(err); }
});

module.exports = router;
