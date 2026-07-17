# babyWeather

> Tells parents how to dress their child for the current weather.

babyWeather pulls live weather data for a location, lets you manage profiles for
your children, and recommends suitable clothing based on the temperature. Built
as a portfolio project to demonstrate a clean, production-minded React +
TypeScript codebase.

**Live demo:** https://baby-weather-sand.vercel.app

## Features

**Authentication** - email/password sign-up & sign-in via Supabase Auth
**Child profiles** - add, list and remove children (data scoped per user)
**Live weather** - current conditions and forecast from the OpenWeather API
**Location search** - search any city; the selected location is remembered across visits
**Clothing advice** - recommends what to dress the child in, based on temperature
**Protected routes** - app content is only accessible when logged in

## Tech stack

| Area            | Choice                                          |
| --------------- | ----------------------------------------------- |
| Framework       | React 18 + TypeScript                           |
| Build tool      | Vite 5                                           |
| Routing         | React Router 6                                   |
| Backend / Auth  | Supabase (Postgres + Auth + Row Level Security) |
| Weather data    | OpenWeather One Call API 3.0                    |
| Server state    | TanStack Query (React Query) v5                 |
| Styling         | SCSS Modules + Bootstrap / react-bootstrap      |
| Testing         | Vitest + React Testing Library                  |
| CI              | GitHub Actions (lint + typecheck + tests)       |
| Hosting         | Vercel                                          |

## Architecture

The codebase separates concerns into clear layers, which keeps business logic
testable and UI components thin:

**API clients** (`src/weatherApiClient.ts`, `src/supabaseApiClient.ts`,
  `src/geocodingApiClient.ts`) - isolate all external calls. The rest of the
  app never talks to Supabase, OpenWeather or the geocoding API directly.
**Domain logic** (`src/model/clothesDeterminer.ts`) - the clothing
  recommendation is a pure function, fully unit-tested and independent of React.
**Data hooks** (`src/hooks/useWeather.ts`, `src/hooks/useChildren.ts`) -
  wrap TanStack Query, so fetching, caching and loading/error states live in
  one place. `useChildren` also performs an optimistic delete with rollback
  on failure.
**Auth context** (`src/context/AuthContext.tsx`) - provides the session and
  auth actions to the whole app.
**Row Level Security** (`supabase/migrations/`) - children are protected at
  the database level, so a user can only ever read or write their own rows.

The reasoning behind the notable technical choices is recorded in
[`docs/DECISIONS.md`](docs/DECISIONS.md).

## Getting started

### Prerequisites

- Node.js 22+
- A [Supabase](https://supabase.com) project
- An [OpenWeather](https://openweathermap.org/api) API key (One Call API 3.0)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env
```

Then fill in `.env` with your own credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENWEATHER_API_KEY=your-openweather-key
```

### Run

```bash
npm run dev
```

The app will be available at the URL Vite prints (default `http://localhost:5173`).

## Scripts

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start the dev server with hot reload          |
| `npm run build`     | Build for production                          |
| `npm run preview`   | Preview the production build locally          |
| `npm run lint`      | Lint the codebase (ESLint, 0 warnings allowed)|
| `npm run typecheck` | Type-check without emitting files (`tsc`)     |
| `npm run test`      | Run tests in watch mode                       |
| `npm run test:run`  | Run tests once (used in CI)                   |

## Testing

Tests use **Vitest** and **React Testing Library**, across three levels:

- **Unit** - pure domain logic (`clothesDeterminer`, `temperature`), no mocks.
- **Hook** - `useChildren` via `renderHook`, including the optimistic delete
  and its rollback, with the network client mocked.
- **Integration** - the whole `Home` screen (`home.test.tsx`) rendered with
  only the network clients mocked, plus the login flow.

Run them with:

```bash
npm run test:run
```

## Continuous Integration

Every push and pull request to `master` runs the quality gate on GitHub Actions:
lint, type-check and tests must all pass before changes are considered safe to
merge. See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Deployment

The app is deployed on [Vercel](https://vercel.com). Environment variables are
configured in the Vercel project settings (same keys as `.env`).
