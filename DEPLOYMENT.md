# UrGigs — Vercel Deployment Guide

## Architecture

- **Frontend**: Vite + React (root `/`) — deployed as static site on Vercel
- **Backend**: Next.js API Routes (`/backend`) — deployed as serverless functions

## Vercel Project Setup

1. Connect the GitHub repo to Vercel
2. Set Framework Preset to **Vite**
3. Root Directory: `/` (monorepo root)
4. Build Command: `npm run build`
5. Output Directory: `dist`

### API Routing

The `vercel.json` rewrites `/api/*` requests to the backend Next.js serverless functions at `/backend/api/*`.

---

## Required Environment Variables

### Backend (Server-side)

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key for payment processing | `sk_live_...` or `sk_test_...` |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID for SMS | `AC...` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | (from Twilio console) |
| `TWILIO_PHONE_NUMBER` | Twilio sender phone number | `+15551234567` |
| `NEXT_PUBLIC_APP_URL` | Frontend production URL (for Stripe redirects) | `https://urgigs.vercel.app` |

### Frontend (Client-side, prefixed with VITE_)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for client | `pk_live_...` or `pk_test_...` |
| `VITE_API_BASE_URL` | Backend API base URL | `https://urgigs.vercel.app/api` |

### Database (if applicable)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL/MySQL connection string | `postgresql://user:pass@host:5432/db` |

---

## Local Development

```bash
# Frontend (root)
npm install
npm run dev          # http://localhost:5173

# Backend
cd backend
npm install
npm run dev          # http://localhost:3001
```

## Build Commands

```bash
# Frontend only
npm run build

# Backend only
npm run build:backend

# Both
npm run build:all
```

## Pre-Deployment Checklist

- [ ] All environment variables set in Vercel dashboard
- [ ] `STRIPE_SECRET_KEY` is the **live** key for production
- [ ] `VITE_API_BASE_URL` points to the production domain
- [ ] CORS headers in `backend/next.config.js` updated for production domain
- [ ] Backend build passes: `cd backend && npm run build`
- [ ] Frontend build passes: `npm run build`
- [ ] Tests pass: `cd backend && npm test`

## Branding

- Primary: `#FFC107` (amber/gold)
- Background: `#121212` (dark)
- Maintain across all UI components
