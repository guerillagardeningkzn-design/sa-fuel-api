-- src/db/schema.sql
-- Run via: node src/db/migrate.js
-- Or paste directly into the Railway PostgreSQL console

CREATE TABLE IF NOT EXISTS fuel_prices (
  id          SERIAL        PRIMARY KEY,
  month       VARCHAR(7)    NOT NULL UNIQUE,   -- ISO format: '2026-05'
  month_label VARCHAR(8)    NOT NULL,           -- Display: 'May 2026'
  p95i        DECIMAL(5,2)  NOT NULL,           -- 95 ULP Inland   (R/litre)
  p95c        DECIMAL(5,2)  NOT NULL,           -- 95 ULP Coastal  (R/litre)
  p93i        DECIMAL(5,2)  NOT NULL,           -- 93 ULP Inland   (R/litre)
  d005i       DECIMAL(5,2)  NOT NULL,           -- Diesel 0.05% Inland  (R/litre)
  d005c       DECIMAL(5,2)  NOT NULL,           -- Diesel 0.05% Coastal (R/litre)
  source      VARCHAR(100)  DEFAULT 'DMRE',     -- Data source
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fuel_prices_updated_at ON fuel_prices;
CREATE TRIGGER fuel_prices_updated_at
  BEFORE UPDATE ON fuel_prices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Index for fast month lookups and range queries
CREATE INDEX IF NOT EXISTS idx_fuel_prices_month ON fuel_prices (month DESC);
