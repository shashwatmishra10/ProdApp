# Minto

Your personal money companion — a real full-stack app (not a static prototype):
Node/Express + TypeScript API, Prisma + SQLite for persistence, JWT-cookie auth,
and genuine integrations for bank data (Account Aggregator) and email receipt
capture (Gmail), each gated behind API credentials and backed by a clearly-labeled
mock provider when no credentials are configured.

## Stack

- **Backend**: Express + TypeScript, Prisma ORM (SQLite by default; swap the
  datasource in `prisma/schema.prisma` for Postgres in production).
- **Auth**: email/password with bcrypt + a JWT stored in an httpOnly cookie.
- **Frontend**: the original single-file prototype, split into `public/` and
  rewired to call the real API instead of localStorage/seed data.
- **Integrations**:
  - **Bank Account Aggregator** (`src/integrations/aa/`) — modeled on Setu's
    AA/FIU sandbox flow (consent → approval → FI data fetch). Set
    `AA_PROVIDER=setu` plus `AA_CLIENT_ID`/`AA_CLIENT_SECRET` to use the real
    client; otherwise a `MockAAProvider` simulates the same lifecycle with
    clearly-labeled simulated bank data so the rest of the app (import, dedupe,
    sync status) works end-to-end without a sandbox key.
  - **Gmail receipt capture** (`src/integrations/gmail/`) — real Google OAuth2
    (`googleapis`) reading `gmail.readonly`, searching for transaction emails
    and parsing merchant/amount/category. Disabled (and shown as "Not
    configured" in the app) until `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`
    are set.

## Setup

```bash
npm install
cp .env.example .env        # fill in real values later if you want live integrations
npx prisma migrate dev      # creates prisma/dev.db and applies the schema
npm run seed                # optional: creates demo@minto.app / mintodemo123 with sample data
npm run dev                 # http://localhost:4000
```

For production: `npm run build && npm start` (serves the built API and the
static frontend from one process on `PORT`, default 4000).

## Enabling real integrations

Nothing below is required to run the app — every integration has a safe,
clearly-labeled mock/disabled fallback.

**Bank Account Aggregator (Setu sandbox)**
1. Get sandbox credentials at https://docs.setu.co/data/account-aggregator.
2. Set `AA_PROVIDER=setu`, `AA_CLIENT_ID`, `AA_CLIENT_SECRET`, `AA_BASE_URL` in `.env`.
3. Verify the request/response shapes in `src/integrations/aa/setuProvider.ts`
   against Setu's current API reference before going live — sandbox contracts
   are versioned and this file documents the flow it expects.

**Gmail receipt capture**
1. Create an OAuth client (type "Web application") at
   https://console.cloud.google.com/apis/credentials, add
   `http://localhost:4000/api/integrations/gmail/callback` as an authorized
   redirect URI, and enable the Gmail API.
2. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.
3. In the app, go to Profile → Connections → Connect Gmail.

## Project layout

```
src/
  index.ts             Express app bootstrap
  db.ts, env.ts         Prisma client + typed env config
  middleware/auth.ts    JWT cookie issue/verify middleware
  routes/               REST endpoints (auth, transactions, accounts, budget,
                         goals, shared, notifications, bootstrap, integrations)
  integrations/aa/       Bank Account Aggregator provider (Setu + mock)
  integrations/gmail/    Gmail OAuth client + email-to-transaction parser
  utils/                 Shared helpers (categorization, serialization, provisioning)
  seed.ts               Demo data seed script
prisma/schema.prisma    Data model
public/                 Frontend (index.html/app.js/api.js/styles.css, login/signup pages)
```
