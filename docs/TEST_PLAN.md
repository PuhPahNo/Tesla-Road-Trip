# Test Plan

## Automated Checks

Run:

```bash
npm test
npm run build
npm run lint
npm run certify:ui
```

Required coverage:

- Supercharge.info normalization keeps open stations and removes closed/planned records.
- Continental U.S. default excludes Alaska and Hawaii.
- Canada and Mexico toggles expand the country set.
- Feasibility math exposes all-sites impracticality under 8-10 week settings.
- Optimizer returns many candidate route plans with day-level stats.
- Practical-range issues appear as medium auxiliary-charging advisories.
- Stop-time math carries range forward across clustered stops instead of assigning a full charge to every leg beyond the close-site radius.
- Transfer connector stops are inserted into long repositioning legs before day planning.
- Long-day optimization creates explained long days when the extra unique-site return clears the configured threshold.

## Manual Browser Certification

Required checks:

1. Load the local app.
2. Confirm the map is visible on first screen.
3. Confirm station feed status and source timestamp are visible.
4. Open the configuration modal.
5. Change target stations and trip weeks.
6. Toggle Canada and Mexico.
7. Toggle long-day optimization.
8. Run Optimize.
9. Confirm OSRM road geometry reaches ready state or reports a visible routing error.
10. Switch through several route candidates, including at least one regional/deadhead-heavy route.
11. Confirm per-day route stats, long-day explanations, and advisory badges are readable.
12. Check desktop and mobile screenshots for overlapping text, clipped buttons, broken map, or confusing hierarchy.

## Known Model Limitations

- Candidate optimization still uses estimated road miles; the displayed polyline uses OSRM road geometry.
- The default public OSRM endpoint should be replaced with a local OSRM/Valhalla backend before repeated heavy planning.
- The station list is based on Supercharge.info and should be reconciled with Tesla nav before the actual drive.
- Clustered stations use short stop sessions until the carried range budget requires a longer distance-charge stop. Tesla's referenced contest terms do not publish a minimum charging duration, so these remain planning assumptions.
