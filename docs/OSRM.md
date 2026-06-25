# Local OSRM for true road distances

By default the planner estimates leg distances as great-circle miles × a road
factor (`roadDistanceFactor`, ~1.18). That's a good approximation (within ~10–20%
of true) and needs **no external service** — it's what the app uses out of the
box and what a cheap hosted deployment should rely on.

Road-accurate distances are **opt-in**: only when `OSRM_BASE_URL` points at a
*real* (non-demo) OSRM engine does the app fetch per-leg road distances and have
`/api/refine-route` rebuild the selected route's mileage and day plan from them.
With the URL unset or left at the public demo (`router.project-osrm.org`), the
app stays in fast estimate mode and makes no routing calls — the demo can't
reliably route a 650-stop national loop anyway.

> Note: this path speaks **OSRM's** API. A local OSRM (below) or any
> OSRM-compatible endpoint works by just setting the URL. OpenRouteService,
> Mapbox, etc. use different APIs and would need a small adapter.

## One-time setup

1. **Install Docker Desktop** and launch it once (accept its terms so the
   `docker` CLI + daemon come up):
   ```bash
   brew install --cask docker
   open -a Docker          # then accept the license in the UI
   ```

2. **Build + serve the engine** (this downloads the map extract and builds the
   routing graph, then serves it). Full US is a large download (~9 GB) and the
   build wants a good chunk of RAM; for a quick test, start with one state.
   ```bash
   # quick test (one state, ~1 GB):
   REGION=north-america/us/california bash scripts/osrm-setup.sh

   # full national route:
   bash scripts/osrm-setup.sh
   ```
   Leave that shell running — it ends with `osrm-routed` serving on
   **http://localhost:5001**.

3. **Point the app at it** and restart the API:
   ```bash
   echo 'OSRM_BASE_URL=http://localhost:5001' >> .env
   # restart the server (npm run dev, or your tsx server/index.ts)
   ```

Now selecting a route calls OSRM for real per-leg road distances; the displayed
totals, per-day miles, average gaps and range flags become road-accurate, and
the map traces real roads. If OSRM is ever down, the app falls back to the
estimate automatically.

## Notes

- Port: the container serves `5000`, mapped to host `5001` (macOS uses `5000`
  for AirPlay). Override with `OSRM_PORT=...`.
- Data lives in `./osrm-data/` (git-ignored). Delete it to rebuild from scratch.
- Full-US `osrm-extract`/`customize` is memory-hungry. If it gets killed, build a
  regional extract (e.g. just the states your route covers) via `REGION=...`.
