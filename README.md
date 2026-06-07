# ✦ SA Fuel Price API

**MD Works · Project 05 — Node.js REST API**  
Node.js · Express · PostgreSQL · Railway

Monthly South African fuel retail prices as published by the Department of
Mineral Resources and Energy (DMRE). Free public read API — no key needed.
Write endpoints protected by API key.

**Live API:** `https://sa-fuel-api.railway.app`  
**Docs:** `https://sa-fuel-api.railway.app/docs`  
**Portfolio:** [MD Works](https://md-works-portfolio.guerillagardeningkzn.workers.dev)

---

## Quickstart

```bash
# Latest prices — no API key needed
curl https://sa-fuel-api.railway.app/v1/prices/latest

# Last 12 months
curl https://sa-fuel-api.railway.app/v1/prices?limit=12

# Specific month
curl https://sa-fuel-api.railway.app/v1/prices/2026-05

# Date range
curl "https://sa-fuel-api.railway.app/v1/prices/range?from=2025-01&to=2025-12"

# Stats
curl https://sa-fuel-api.railway.app/v1/stats
```

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/prices` | — | All prices, newest first |
| GET | `/v1/prices/latest` | — | Current month only |
| GET | `/v1/prices/:month` | — | Specific month (YYYY-MM) |
| GET | `/v1/prices/range?from=&to=` | — | Date range |
| GET | `/v1/stats` | — | Min / max / average |
| POST | `/v1/prices` | 🔑 | Add new month |
| PUT | `/v1/prices/:month` | 🔑 | Update existing month |

Full reference at `/docs`.

---

## Local Development

```bash
# Install dependencies
npm install

# Copy env file and fill in your local Postgres details
cp .env.example .env

# Run schema migration (creates table + index)
npm run schema

# Seed 29 months of historical data
npm run seed

# Start dev server with hot reload
npm run dev
```

Server starts at `http://localhost:3000`.

---

## Deploying to Railway

### 1 — Create the project

1. Go to [railway.app](https://railway.app) → New Project
2. Deploy from GitHub repo → select this repo
3. Railway detects Node.js automatically via `railway.toml`

### 2 — Add PostgreSQL

1. In your Railway project → **New** → **Database** → **PostgreSQL**
2. Railway injects `DATABASE_URL` into your service automatically

### 3 — Set environment variables

In your Railway service → **Variables** → add:

| Variable | Value |
|----------|-------|
| `API_KEY` | a strong random string (your write key) |
| `NODE_ENV` | `production` |

`DATABASE_URL` and `PORT` are injected by Railway automatically.

### 4 — Run migrations and seed

In Railway → your service → **Shell** (or use the Railway CLI):

```bash
npm run schema   # creates table + trigger + index
npm run seed     # imports 29 months of historical data
```

### 5 — Set a custom domain (optional)

Railway service → **Settings** → **Networking** → **Custom Domain**.

---

## Adding a new month

Once deployed, add new DMRE prices on the first Wednesday of each month:

```bash
curl -X POST https://sa-fuel-api.railway.app/v1/prices \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "month":      "2026-06",
    "monthLabel": "Jun 2026",
    "p95i":  27.19,
    "p95c":  26.32,
    "p93i":  27.08,
    "d005i": 27.93,
    "d005c": 27.05
  }'
```

---

## Connecting the Fuel Price Tracker (Project 02)

Replace the local JSON source in `sa-fuel-tracker/main.js`:

```js
// Before (local JSON)
const DATA_URL = './data/prices.json';
const IS_CSV   = false;

// After (live API)
const DATA_URL = 'https://sa-fuel-api.railway.app/v1/prices?limit=29';
const IS_CSV   = false;
```

The API response wraps data in a `{ data: [...] }` envelope — update the
`loadData` function to read `raw.data` instead of `raw`:

```js
const raw   = await res.json();
priceData   = raw.data || [];
```

---

## Project structure

```
sa-fuel-api/
├── src/
│   ├── index.js              # Entry point — DB check + server start
│   ├── app.js                # Express setup — CORS, routes, error handler
│   ├── routes/
│   │   └── prices.js         # All GET + write endpoints
│   ├── db/
│   │   ├── client.js         # pg Pool singleton
│   │   ├── schema.sql        # Table + trigger + index
│   │   ├── migrate.js        # Runs schema.sql
│   │   └── seed.js           # Imports data/prices.json
│   └── middleware/
│       ├── auth.js           # API key validation
│       ├── rateLimit.js      # Public + write limiters
│       └── errorHandler.js   # Global error handler
├── public/
│   └── docs.html             # API reference (MD Works brand)
├── data/
│   └── prices.json           # 29 months of seed data
├── .env.example
├── .gitignore
├── package.json
├── railway.toml
└── README.md
```

---

## What this project demonstrates

- Express REST API with versioned routes (`/v1/`)
- PostgreSQL with the `pg` driver — raw parameterised queries, no ORM
- Proper `DECIMAL(5,2)` types for financial data
- `updated_at` trigger — auto-maintained at the database level
- `ON CONFLICT DO UPDATE` upsert in the seed script
- `COALESCE` partial updates in the PUT endpoint
- API key authentication via `Authorization: Bearer` header
- Rate limiting with `express-rate-limit`
- Global error handler with Postgres error code mapping
- Environment-based SSL config for Railway
- Seed script with idempotent upserts — safe to re-run
- HTML documentation page served from `public/`

---

✦ MD Works · Morney Deetlefs · South Africa
