# Architecture

## Current Local Architecture

```text
React UI
  -> /api/stations
  -> /api/optimize
  -> /api/road-route
Local Express API
  -> Supercharge.info allSites feed
  -> OSRM road geometry endpoint
  -> Domain optimizer
Domain Modules
  -> station normalization
  -> geographic math
  -> Tesla rule helpers
  -> route planning and day partitioning
```

The local API owns external data retrieval, caching, validation, and optimization. The browser only renders the planner and sends configuration.

## Why This Shape

- Supercharge.info is public and no-key, but the browser should not depend on its CORS or schema directly.
- Public OSM routing services should not be used as a high-volume optimizer backend.
- A local API lets us add OSRM, Valhalla, SQLite/PostGIS, or persisted trip logs without rewriting the UI.
- The optimizer is domain code, not UI code, so it can be tested directly.

## Data Sources

### Supercharge.info
Primary station feed:

```text
https://supercharge.info/service/supercharge/allSites
```

Used for Tesla-specific site inventory and metadata.

### Map Tiles
Used only for display through Leaflet's tile layer. The current UI uses CARTO Voyager tiles over OpenStreetMap data because the default OpenStreetMap style was too low-contrast at whole-country zoom, especially in the western U.S. The app includes CARTO and OpenStreetMap attribution and should honor public tile usage limits.

### OSRM Road Geometry
The UI requests `/api/road-route` after optimization. The local API chunks the selected route coordinates, requests OSRM driving geometry, caches the response, and returns a road-following polyline for display.

Default:

```text
OSRM_BASE_URL=https://router.project-osrm.org
```

That public endpoint is acceptable for local smoke tests, but it is not a production or high-volume planning dependency. For heavy planning, run OSRM locally with Geofabrik extracts and point `OSRM_BASE_URL` at that service.

### Future Local OSRM or Valhalla
The optimizer still uses a fast corridor-distance estimate for candidate generation. It ranks stations against strategy corridors and estimates leg mileage along corridor order. The scalable next step is to make road distance a first-class `RoutingProvider` backed by local OSRM/Valhalla with cached leg distances.

Recommended path:

1. Download Geofabrik state or U.S. PBF extracts.
2. Build an OSRM or Valhalla graph.
3. Replace the distance estimator with a `RoutingProvider`.
4. Cache leg distances in SQLite keyed by station pair and routing profile.

## Scaling Plan

### Phase 1: Local Planner
- In-memory feed cache.
- Fast deterministic route estimates.
- Browser map review.

### Phase 2: Local Routing Engine
- OSRM/Valhalla service running locally.
- Persist station snapshots and route results.
- Accurate road distances and drive times inside the optimizer, not only display geometry.

### Phase 3: Trip Operations
- Export daily route chunks to CSV/JSON.
- Track actual station sessions manually or by uploaded Tesla charge history.
- Compare actuals against planned route and Tesla Passport counts.

### Phase 4: Multi-Run Optimization
- Simulated annealing or genetic search over dense corridor station order.
- Time-window optimization around the 24-hour streak rule.
- Weather/range buffers and charger outage risk scoring.

## Security and Privacy

- The app is local-first and does not send route plans to a hosted backend.
- The default start point is approximate to the user-provided ZIP area, not a precise home coordinate.
- External calls are limited to station data and map tiles.
- Future hosted deployment should move precise start locations to authenticated user-owned storage only.

## Reliability Boundaries

- Supercharge.info is not Tesla official. The planner labels it as the station source.
- Tesla defines unique sites by the Tesla app / vehicle nav. The app flags close-together sites for verification.
- Tesla has not published a minimum charging duration in the referenced contest terms. Stop assumptions are user-configurable.
- Legs beyond configured Supercharger-to-Supercharger range are advisory because non-Tesla EV charging can bridge them; the planner does not yet place those auxiliary charging stops.
