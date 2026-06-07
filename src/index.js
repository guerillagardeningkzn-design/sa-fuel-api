// src/index.js

require('dotenv').config();
const app  = require('./app');
const pool = require('./db/client');

const PORT = process.env.PORT || 3000;

async function start() {
  // Verify DB connection before accepting traffic
  try {
    await pool.query('SELECT 1');
    console.log('✓ Database connected');
  } catch (err) {
    console.error('✗ Database connection failed:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`✦ SA Fuel API running on port ${PORT}`);
    console.log(`  Docs: http://localhost:${PORT}/docs`);
    console.log(`  Root: http://localhost:${PORT}/`);
  });
}

start();
