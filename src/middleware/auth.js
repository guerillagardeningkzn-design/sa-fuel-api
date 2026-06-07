// src/middleware/auth.js
// Protects POST / PUT endpoints
// Pass key as: Authorization: Bearer YOUR_KEY
// or as query param: ?api_key=YOUR_KEY

function requireApiKey(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const fromHeader = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;
  const fromQuery = req.query.api_key || null;
  const provided  = fromHeader || fromQuery;

  if (!provided) {
    return res.status(401).json({
      success: false,
      error: { code: 'MISSING_API_KEY', message: 'API key required for write operations.' },
    });
  }

  if (provided !== process.env.API_KEY) {
    return res.status(403).json({
      success: false,
      error: { code: 'INVALID_API_KEY', message: 'Invalid API key.' },
    });
  }

  next();
}

module.exports = { requireApiKey };
