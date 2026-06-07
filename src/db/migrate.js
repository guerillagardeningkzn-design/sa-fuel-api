// src/db/migrate.js
// Run once: npm run schema

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const pool = require('./client');

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  try {
    console.log('Running migrations…');
    await pool.query(sql);
    console.log('✓ Schema applied successfully');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
