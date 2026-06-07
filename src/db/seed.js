// src/db/seed.js
// Run once after migrate: npm run seed
// Safe to re-run — uses INSERT ... ON CONFLICT DO UPDATE

require('dotenv').config();
const pool  = require('./client');
const data  = require('../../data/prices.json');

// Convert display label to ISO month string
// 'Jan 2024' → '2024-01'
const MONTH_MAP = {
  Jan:'01', Feb:'02', Mar:'03', Apr:'04',
  May:'05', Jun:'06', Jul:'07', Aug:'08',
  Sep:'09', Oct:'10', Nov:'11', Dec:'12',
};

function toISO(label) {
  const [mon, year] = label.trim().split(' ');
  const num = MONTH_MAP[mon];
  if (!num || !year) throw new Error(`Cannot parse month label: "${label}"`);
  return `${year}-${num}`;
}

async function seed() {
  console.log(`Seeding ${data.length} months of fuel prices…`);

  for (const row of data) {
    const month = toISO(row.month);
    await pool.query(
      `INSERT INTO fuel_prices
         (month, month_label, p95i, p95c, p93i, d005i, d005c)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (month) DO UPDATE SET
         month_label = EXCLUDED.month_label,
         p95i        = EXCLUDED.p95i,
         p95c        = EXCLUDED.p95c,
         p93i        = EXCLUDED.p93i,
         d005i       = EXCLUDED.d005i,
         d005c       = EXCLUDED.d005c,
         updated_at  = NOW()`,
      [month, row.month, row.p95i, row.p95c, row.p93i, row.d005i, row.d005c]
    );
    console.log(`  ✓ ${row.month} (${month})`);
  }

  console.log(`\nSeeded ${data.length} rows successfully.`);
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
