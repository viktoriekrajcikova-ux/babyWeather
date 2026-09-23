# babyWeather

A React and TypeScript portfolio app that helps parents plan clothing for their
children using the weather forecast. Recommendations are a general guide, not
medical advice.

**Live demo:** https://baby-weather-sand.vercel.app

## Features

- Email/password sign-up and sign-in
- Add, list and remove child profiles
- City search with saved coordinates (uses the first matching result)
- Hourly weather and clothing suggestions based on feels-like temperature and child profile
- Overview and packing list for the rest of today in the selected location's time zone
- English weather descriptions and local forecast times on Home and Overview

## Tech stack

React, TypeScript, Vite, React Router, TanStack Query, SCSS Modules and React Bootstrap.
Supabase provides authentication and PostgreSQL; access to child records relies on
database Row Level Security. Vercel functions authenticate and rate-limit weather
requests, validate Open-Meteo data and cache forecasts in Upstash Redis.

## Getting started

Requires Node.js 22+, a configured Supabase project and Upstash Redis with a
write-capable REST token. Open-Meteo's non-commercial public API needs no API key.

Database setup is not yet fully reproducible: the migration in
`supabase/migrations/` assumes an existing `children` table. A fresh Supabase
project requires additional schema setup and verification of RLS policies.

```bash
npm ci
```

Create a git-ignored `.env.local` with the following variables. Use the same
Supabase project for client and server. Never expose a service-role key or Redis
token through `VITE_*` variables, and never commit credentials.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-write-capable-rest-token
```

Run the frontend and API functions together:

```bash
npx vercel dev
```

The CLI may ask you to sign in and link a Vercel project. Ensure the variables
above are available to the server process. `npm run dev` and `npm run preview`
serve only the frontend, not the API functions. For deployment, configure the
same variables in Vercel project settings.

## Checks

```bash
npm run test:run
npm run typecheck
npm run lint
npm run lint:css
npm run build
```

Vitest and React Testing Library cover clothing rules, auth/cache behaviour,
hooks, components and API handlers. External services are mocked; these tests
do not verify live database permissions or deployment.

GitHub Actions currently runs ESLint, typecheck and tests on pushes and pull
requests to `master`. Build and CSS lint are separate local checks.
