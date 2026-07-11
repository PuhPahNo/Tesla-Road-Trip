# Charge Quest

Planning app for the 2026 Tesla Free Supercharging Competition, focused on the Americas region and the Most Unique Sites / Longest Trip categories.

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

The Vite app proxies `/api/*` to the local Express API on port `4177`. For single-service hosting (e.g. Render), `npm run build && npm start` serves the built client from the API server.

## Verify

```bash
npm test
npm run build
npm run lint
npm run certify:ui
```

## What It Does

- Fetches live Supercharger site data from Supercharge.info (Canada and Mexico via config toggles).
- Plans both contest categories:
  - **Most Unique Sites** — corridor-swept route candidates targeting a unique-site count.
  - **Longest Trip** — one-unique-Supercharger-per-day streak plans with must-visit states, cities, and landmarks (with per-target stay days), closed as north-first loops.
- Generates a broad set of named route candidates from the Chattanooga, TN 37405 area and scores each with **trip / day ratings** (city + landmark quality and scenery).
- Splits routes into day plans under configurable drive caps, with opt-in long-day optimization, carried range budgets across clustered stops, transfer-connector inserts on long repositioning legs, and hard warnings vs. auxiliary-charging advisories.
- **Route Copilot** — an OpenAI-backed agent (`/api/agent`) that reshapes the plan from plain language (trim days, fix range warnings, add detours), guarded by daily/request spend limits.

## Interface

Fullscreen "cockpit" UI (from the Claude Design redesign in `design/redesign/`):

- No-key Leaflet map (CARTO tiles) with the route line, station stops, and a clickable state-coverage choropleth as the entire background.
- Floating glass chrome: route picker, icon rail with Overview / Daily plan / Coverage / Trip stats / Guardrails panels, and a ⌘K copilot panel.
- **Focus day bar** — step or auto-play through the trip day by day, with the active day highlighted on the map.
- **Trip calendar** — the whole route as week-by-week, rating-tinted day tiles; tiles open full day details.
- Config slide-over with all planner assumptions (targets, daily limits, stop model, region toggles).
- Dark ("dash", default) and light ("tesla") themes, persisted; dedicated mobile layout with bottom tab bar and sheets.

## Routing Model

The optimizer uses a deterministic corridor-distance estimator for fast candidate generation:

```text
estimated road miles = corridor miles * road distance factor
```

The selected route is then refined through a real routing engine via `/api/refine-route`, which rebuilds mileage, drive times, and the day plan from road geometry:

- **OpenRouteService (recommended):** set `ORS_API_KEY` (free key) for real road distances **and** true speed-limit drive times. When active, the Average-speed assumption is bypassed.
- **OSRM:** set `OSRM_BASE_URL` to a self-hosted instance (`scripts/osrm-setup.sh`); the public demo server cannot handle long national routes.
- **No engine / quota exhausted:** the app automatically falls back to estimate mode and restores the manual Average-speed control.

See `.env.example` for agent and routing configuration, and [docs/OSRM.md](docs/OSRM.md) for engine setup.

## Contest Caveats

- Tesla defines unique sites by the Tesla app / vehicle navigation. Confirm close-together route targets in Tesla nav before driving.
- Tesla's referenced contest page does not specify a minimum charging duration. This app exposes stop-time assumptions in configuration.
- Longest Trip requires starting a charge at a new unique site within the 24-hour continuation window; the planner reserves streak days for must-visit stays accordingly.
- Supercharge.info is not Tesla official. It is a strong practical planning feed, but final verification should happen in the Tesla app.

## Docs

- [PRD](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Test Plan](docs/TEST_PLAN.md)
