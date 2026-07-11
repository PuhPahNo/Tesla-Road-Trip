# Architecture

## Current Architecture

```text
React site + planner
  -> public landing / community / Track Anthony
  -> first-party account + Anthony admin surfaces
  -> /api/stations
  -> /api/optimize
  -> /api/road-route
  -> /api/auth / account / custom-routes / community / admin
Express API
  -> Supercharge.info allSites feed
  -> ORS or OSRM road geometry endpoint
  -> Domain optimizer
  -> SQLite account/community repository
Domain Modules
  -> station normalization
  -> geographic math
  -> Tesla rule helpers
  -> route planning and day partitioning
```

The API owns external data retrieval, caching, validation, optimization, authentication, authorization, and durable community state. The browser renders public pages and the planner; every user-owned write is authorized again on the server.

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

## Persistence and Account Model

- `users` and `sessions` implement first-party username/password authentication with case-insensitive unique usernames.
- Passwords are scrypt hashes. Raw session tokens are never stored; only SHA-256 token hashes are persisted.
- `user_preferences` and `custom_routes` are keyed by user ownership.
- `anthony_trip` and `trip_updates` drive the public tracker.
- `state_votes`, `meetup_invites`, `suggestions`, `suggestion_votes`, and `achievements` drive community participation.
- Meetup invitations are private until Anthony approves them.
- The production database defaults to the existing Render persistent disk. A repository migration to PostgreSQL is the horizontal-scaling path; route ownership and API contracts should not change.

## Scaling Plan

### Phase 1: Single-Service Community (current)
- One Render web instance with SQLite/WAL on persistent disk.
- First-party accounts, per-user preferences/routes, public community reads, and moderated writes.
- In-memory station and road-route caches remain disposable.

### Phase 2: Database and Routing Scale
- Move structured account/community tables behind the same repository contract to managed PostgreSQL before running multiple web instances.
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

- Authentication is app-owned; there is no external OAuth provider.
- Passwords are never stored or returned in plaintext.
- Sessions use HTTP-only, SameSite cookies and expire after 30 days.
- Sign-in/signup endpoints are rate limited; community posting has per-account limits.
- All route, preference, meetup, and admin writes enforce ownership or role checks server-side.
- First launch seeds the `anthony` admin with a temporary password; server-side authorization blocks protected actions until that password is changed.
- The default start point remains approximate to the user-provided ZIP area, not a precise home coordinate.

## Reliability Boundaries

- Supercharge.info is not Tesla official. The planner labels it as the station source.
- Tesla defines unique sites by the Tesla app / vehicle nav. The app flags close-together sites for verification.
- Tesla has not published a minimum charging duration in the referenced contest terms. Stop assumptions are user-configurable.
- Legs beyond configured Supercharger-to-Supercharger range are advisory because non-Tesla EV charging can bridge them; the planner does not yet place those auxiliary charging stops.
