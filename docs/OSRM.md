# Local OSRM for true road distances

By default the planner estimates leg distances as great-circle miles × a road
factor (`roadDistanceFactor`, ~1.18). That's a good approximation, but for
**true** road-accurate mileage / drive times / range flags, point the app at a
local [OSRM](https://project-osrm.org/) routing engine. The app's
`/api/refine-route` endpoint then rebuilds the selected route's mileage and day
plan from real per-leg road distances.

The public demo server (`router.project-osrm.org`) is fine for a few stops but
**cannot reliably route a 650-stop national loop**, which is why you'll see
straight-line fallbacks on big routes until you run your own.

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
