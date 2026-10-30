# UrGigs

**Find Work. Find Workers.** A mobile-first gig economy platform connecting businesses with on-demand workers for shift-based employment.

## Overview

UrGigs is a React + TypeScript web application that enables:
- **Employers** to post shifts, manage active/past gigs, and maintain business profiles
- **Workers** to browse and claim available gigs, track earnings, and manage their skill profiles

## Features

### Phase 1 — Foundation
- Role-based authentication (Employer vs Worker)
- Protected routing with role-based redirects
- Mock database with relational data (Users, BusinessProfiles, WorkerProfiles, Shifts)
- Dark theme with Golden Amber (#FFC107) branding
- Mobile-first responsive design

### Phase 2 — Core Functionality
- **Shift Posting**: Employers can create new shifts with title, description, rate, and time
- **Gig Claiming**: Workers can browse open shifts and claim them instantly
- **Earnings Tracking**: Workers see total earnings, payment history, and upcoming work
- **Profile Management**: Both roles can edit their profiles (company info, skills tags)
- **Search & Filter**: Workers can search gigs by keyword and filter by category

### Phase 3 — Payments & Admin
- Stripe Connect onboarding for workers and saved cards for employers
- Admin dashboard with platform stats, dispute resolution, and worker verification

### Phase 4 — Trust & Safety
- GPS check-in / check-out on shift day
- Background check workflow (submit → pending → admin pass/fail)
- PaymentIntent / Transfer flow with a 10% platform fee

### Phase 5 — Live Integrations
- Twilio SMS alerts for new shifts and claimed shifts
- Next.js backend (`/backend`) that holds all Stripe and Twilio secrets; falls back to mock responses when keys aren't configured
- Global notification banner for API errors

### Phase 6 — Ratings & Discovery
- Two-sided 1–5 star reviews after a shift is paid (one review per party per shift)
- Average rating and recent feedback on worker and employer profiles
- Employer portal to browse, search, filter, and sort verified workers

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS 3.4 with custom design tokens
- **State Management**: Zustand
- **Routing**: React Router v7
- **Testing**: Vitest + React Testing Library
- **Linting**: Oxlint
- **Backend**: Next.js 14 API routes, Stripe, Twilio (see [DEPLOYMENT.md](DEPLOYMENT.md))

## Getting Started

```bash
npm install
npm run dev
```

To run the backend locally as well:

```bash
cd backend
cp .env.example .env.local   # optional — without keys, Stripe/Twilio return mock responses
npm install
npm run dev                  # http://localhost:3001
```

## Demo Accounts

| Role     | Email               | Password     |
|----------|---------------------|--------------|
| Employer | employer@urgigs.com | any password |
| Worker   | worker@urgigs.com   | any password |
| Admin    | admin@urgigs.com    | any password |

## Project Structure

```
src/
├── components/    # Reusable UI components (ShiftCard, BottomNav, Header, etc.)
├── screens/       # Page-level components (WelcomeScreen, EmployerHub, etc.)
├── services/      # Backend API clients (Stripe, Twilio), reviews, location helpers
├── store/         # Zustand stores and mock database
├── types/         # TypeScript type definitions
└── test/          # Unit and integration tests
```

## Running Tests

```bash
npx vitest run          # frontend
cd backend && npm test  # backend (Jest)
```

## License

Private project.
