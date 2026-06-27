# Tesla Supercharger Quest Planner

Local planning app for the 2026 Tesla Free Supercharging Competition, focused on the Americas region and the Most Unique Sites / Longest Trip categories.

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

The Vite app proxies `/api/*` to the local Express API on port `4177`.

## Verify

```bash
npm test
npm run build
npm run lint
npm run certify:ui
```

## What It Does

- Fetches live Supercharger site data from Supercharge.info.
- Filters to open continental U.S. sites by default.
- Adds Canada and Mexico through configuration toggles.
- Generates a broad set of named route candidates from the Chattanooga, TN 37405 area.
- Shows a no-key Leaflet map using CARTO Voyager tiles over OpenStreetMap data.
- Calculates route totals and day-level stats.
- Carries range forward through clustered stops so nearby sites do not force repeated full-charge stops.
- Inserts transfer connector Superchargers when a route strategy has a long repositioning leg.
- Flags hard feasibility risks separately from medium auxiliary-charging advisories.
- Optional long-day optimization can use 8-9 hour days when the added unique-site return clears your configured threshold, then explains why the day is worth it.

## Current Routing Model

The optimizer uses a deterministic corridor-distance estimator for fast candidate generation:

```text
estimated road miles = corridor miles * road distance factor
```

The displayed route line is then mapped through OSRM road geometry via the local `/api/road-route` endpoint, so the map follows roads instead of drawing straight station-to-station lines across water. The line uses a white casing under the route color so it stays readable at whole-country zoom. By default this uses the public OSRM demo server; for heavy planning, set `OSRM_BASE_URL` to a local OSRM instance built from OpenStreetMap extracts.

## Contest Caveats

- Tesla defines unique sites by the Tesla app / vehicle navigation. Confirm close-together route targets in Tesla nav before driving.
- Tesla's referenced contest page does not specify a minimum charging duration. This app exposes stop-time assumptions in configuration.
- Supercharge.info is not Tesla official. It is a strong practical planning feed, but final verification should happen in the Tesla app.

## Docs

- [PRD](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Test Plan](docs/TEST_PLAN.md)
