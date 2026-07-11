# Charge Quest PRD

## Product Goal
Build a local planning website for a Tesla owner in Chattanooga, TN who wants to compete in the 2026 Tesla Free Supercharging Competition for:

- Most Unique Supercharger Sites Visited
- Longest Trip

The app must turn the Supercharge.info station feed and Tesla contest rules into immediately usable route plans with enough transparency to trust, adjust, and improve the plan.

## Rule Inputs
The app encodes the following contest rules from Tesla's support page:

- Competition window: January 1, 2026 through December 31, 2026.
- Region assignment: based on where the driver visits the most unique Supercharger sites.
- Americas region: countries with Superchargers in North and South America.
- Most Unique Supercharger Sites Visited: highest count of unique sites.
- Longest Trip: a streak of visits to unique Supercharger sites. To extend the trip, the driver must begin charging at a new unique Supercharger site within the required 24-hour continuation window.
- Repeat visits can occur during a trip but do not add to trip length.
- Eligibility requires opening the 2026 Passport in the Tesla app before January 1, 2027.

Tesla's public contest page does not specify a minimum charging duration for a site to count. The planner therefore exposes stop-time assumptions instead of hard-coding an unverified minimum.

## Primary User
A single Tesla Model Y owner planning an 8-10 week road trip from the Chattanooga, TN 37405 area with a practical highway range setting below rated range.

## Feature PRDs

### 1. Station Ingestion
**Objective:** Retrieve, normalize, and filter Supercharge.info station data.

**Requirements**
- Fetch `https://supercharge.info/service/supercharge/allSites` through a local API endpoint.
- Keep only open Supercharger sites by default.
- Exclude Alaska and Hawaii from continental U.S. planning.
- Support Canada and Mexico toggles.
- Preserve source fields needed for audit: site id, name, status, address, coordinates, stall count, max power, counted flag, and Tesla location id if present.
- Cache the live feed in memory to avoid repeated network calls.

**Acceptance Criteria**
- The station endpoint returns normalized station objects with stable ids.
- Default count is lower-48 U.S. open sites.
- Canada and Mexico toggles change the station universe without code changes.
- UI displays data source and fetch time.

### 2. Travel Preferences and Custom Route Builder
**Objective:** Separate reusable travel assumptions from decisions that belong to one route.

**Travel preference inputs**
- Fixed Tesla Model Y Long Range vehicle profile and practical highway range.
- Daily drive target hours.
- Normal-day maximum drive hours.
- Default trip pace and rating-based stay behavior.
- Average moving speed.
- Close-site / cluster radius in miles.
- Close-site stop minutes.
- Distance-charge stop minutes.
- Long-day optimization toggle.
- Long-day maximum hours.
- Minimum unique-site return per extra drive hour.
- Include Canada toggle.
- Include Mexico toggle.
- Show all stations on map toggle.
- Default planner goal and target for generated route candidates.
- Favorite and muted place categories used across routes.

**Custom route inputs**
- Route name and route-specific trip length.
- Exact trip start date and a season-smart or explicit north/south/east/west first heading, with date-limited badge opportunities flagged inside the trip window.
- Must-see cities, landmarks, and manual locations.
- Researched Tesla Iconic Chargers as a dedicated target filter, using exact qualifying station targets rather than broad attraction radii.
- Optimized or exact saved stop order.
- A visible summary of the inherited vehicle, range, pace, and daily-drive preferences.
- A three-step flow that separates trip setup, destination selection, and final ordering/optimization review.

**Acceptance Criteria**
- Invalid values are constrained before optimization.
- Must-see locations are edited only in the custom route builder, never in Travel Preferences.
- Travel Preferences explains that generated-route targets are defaults and saved custom routes keep their own duration and stops.
- The custom route builder explains which travel preferences it inherits.
- Users cannot advance past trip setup without a valid name, date, and duration, or past destinations without at least one route anchor.
- Winter season-smart routes from Chattanooga begin south; summer routes begin north; explicit headings always win.
- Route candidate cards retain their content height inside the scrolling list, with visible Edit and Delete actions for saved routes.
- Both surfaces have clear labels, helper text, and usable desktop and mobile layouts.
- Saving preferences reoptimizes all routes; saving a custom route persists and selects that route.

### 3. Route Optimization
**Objective:** Generate many plausible route candidates for a round trip from Chattanooga.

**Requirements**
- Generate a broad set of route strategies:
  - Balanced national loop
  - Northeast density loop
  - Sunbelt and West loop
  - Great Lakes and Mid-Atlantic loop
  - West Coast reach loop
  - Regional density, cross-country corridor, perimeter, and deadhead-heavy concepts
- Each route starts and ends at the Chattanooga 37405 default coordinate.
- Use the station universe selected by config.
- Select a target number of unique sites by ranking stations near each strategic corridor.
- Estimate road miles as great-circle distance multiplied by a configurable road factor.
- Treat legs beyond practical Supercharger-to-Supercharger range as medium advisories requiring auxiliary non-Tesla charging, not hard blockers.
- Split routes into day plans using daily drive limits.
- When enabled, allow selected long days up to the long-day cap if the projected unique-site gain clears the configured sites-per-extra-hour threshold.
- Explain each accepted long day in the day table.
- Calculate stop minutes using a carried range budget: close-site hops consume little range budget, short stops handle clustered sites, and longer distance-charge stops reset the usable range assumption before the next leg needs it.
- Insert transfer connector Superchargers into long repositioning legs before day planning so deadhead-heavy strategies are marked as realistic Supercharger hops instead of one impossible leg.

**Acceptance Criteria**
- Returns many route candidates for typical targets.
- Each route includes total miles, total days, unique sites, average miles/day, average drive hours/day, average stop time/day, and feasibility warnings.
- Each day includes miles, drive time, stop time, unique sites, and station sequence.
- Plans warn when target exceeds trip duration or daily driving assumptions.
- Plans distinguish hard warnings from advisory conditions that can be solved with external charging or driver judgment.

### 4. Map Interface
**Objective:** Make routes visually inspectable.

**Requirements**
- Display a map as the primary first-screen surface.
- Show selected route road polyline and selected station markers.
- Optionally show all station dots.
- Show the Chattanooga start/end marker.
- Let the user switch between the generated routes.
- Fit the map to the selected route.

**Acceptance Criteria**
- Map renders without requiring an API key.
- The route line follows OSRM road geometry when the local API can reach an OSRM endpoint.
- If OSRM fails, the UI keeps the planner usable and reports the routing status instead of hiding the route.
- Attribution is visible.
- Markers and route lines are visible at desktop and mobile widths.
- The UI remains usable if the feed or optimizer fails.

### 5. Route Statistics
**Objective:** Let the user compare route candidates quickly.

**Requirements**
- Show route-level stats for each candidate.
- Show per-day stats and station lists.
- Show feasibility flags, range advisories, and long-day explanations.
- Show an all-sites plausibility estimate.

**Acceptance Criteria**
- The route comparison panel makes the best candidate obvious.
- Per-day rows are scannable and do not hide critical warnings.
- The app explicitly explains why every lower-48 station is not plausible under the configured trip window.

### 6. Testing and Certification
**Objective:** Verify that the app is functionally and visually usable before handoff.

**Requirements**
- Unit tests for station filtering, rule math, and route generation.
- Build verification.
- Local server smoke test.
- Browser screenshot review for desktop and mobile.

**Acceptance Criteria**
- `npm test` passes.
- `npm run build` passes.
- `npm run lint` passes.
- `npm run certify:ui` passes and captures desktop/mobile screenshots.
- Local dev server starts.
- Browser screenshots show no broken layout, blank map, inaccessible modal, or overlapping controls.
