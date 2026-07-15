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

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS 3.4 with custom design tokens
- **State Management**: Zustand
- **Routing**: React Router v7
- **Testing**: Vitest + React Testing Library
- **Linting**: Oxlint

## Getting Started

```bash
npm install
npm run dev
```

## Demo Accounts

| Role     | Email               | Password     |
|----------|---------------------|--------------|
| Employer | employer@urgigs.com | any password |
| Worker   | worker@urgigs.com   | any password |

## Project Structure

```
src/
├── components/    # Reusable UI components (ShiftCard, BottomNav, Header, etc.)
├── screens/       # Page-level components (WelcomeScreen, EmployerHub, etc.)
├── store/         # Zustand stores and mock database
├── types/         # TypeScript type definitions
└── test/          # Unit and integration tests
```

## Running Tests

```bash
npx vitest run
```

## License

Private project.
test
