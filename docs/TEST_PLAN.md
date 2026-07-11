# Test Plan

## Automated Checks

Run:

```bash
npm test
npm run build
npm run lint
npm run certify:ui
npm run certify:community
npm run certify:badges
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
- First-party username signup/login/logout and password-protected account access work without collecting email or using an external auth provider.
- Usernames are case-insensitively unique, accept a minimum of three characters, and the seeded Anthony admin cannot use protected actions until changing the temporary password.
- Preferences persist per account and saved routes are isolated between members.
- Community state votes, suggestions, votes, achievements, and moderated meetup invitations survive across sessions.
- Anthony admin can activate/deactivate the tracker and publish field updates.
- The homepage leads with Anthony's competition challenge, uses distinct cinematic/editorial/gallery/product compositions, and maps live trip/community data into the public experience.
- Signed-out users cannot render the planner and are redirected to signup with a planner return path.
- The Community page uses the cinematic competition design, exposes public activity, and funnels guest interactions through signup with a community return path.
- Homepage and Community metadata stay route-specific, and `robots.txt`, `sitemap.xml`, canonical URLs, image metadata, and `WebApplication` structured data ship in production.
- Anthony admin separates tracker configuration, field publishing, public metrics, and meetup moderation without changing the underlying admin actions.

## Manual Browser Certification

Required checks:

1. Load the homepage and confirm the cinematic hero, light editorial statement, destination collage, red planner showcase, community photography, and signup challenge remain distinct and readable on desktop and mobile.
2. While signed out, open the planner and confirm signup is required; complete signup and confirm the planner opens with the map visible.
3. Confirm station feed status and source timestamp are visible.
4. Open Travel Preferences and confirm vehicle/range, trip pace, daily-drive limits, generated-route defaults, coverage, and advanced assumptions are present.
5. Confirm Travel Preferences does not expose a must-see location editor.
6. Change generated-route defaults, toggle Canada and Mexico, and toggle long-day optimization.
7. Save preferences and confirm the routes reoptimize.
8. Open Create Custom Route and confirm it progresses through Trip setup, Destinations, and Review & optimize; verify Back preserves entered values and later steps stay unavailable until required fields are complete.
9. Select a winter month with Season-smart and confirm the saved route starts south; verify an explicit heading overrides it.
10. Filter must-see stops to Tesla Iconic Chargers and confirm all 17 researched North American targets appear; Waikiki is cataloged but disabled for mainland routing, and Canada targets require Include Canada.
11. Set a trip window spanning April 22, 2026 or July 4, 2026 and confirm the matching Special Event badge is flagged on the correct route day.
12. Confirm the custom route builder starts with inherited vehicle, range, pace, and daily-drive presets and can save route-specific overrides.
13. Confirm generated route cards keep their full height in a scrolling list and saved routes expose both Edit and Delete.
14. Confirm ORS road geometry reaches ready state or reports a visible routing error.
15. Switch through several route candidates, including at least one regional/deadhead-heavy route.
16. Confirm per-day route stats, long-day explanations, Iconic Charger hits, and achievement opportunities are readable.
17. Check desktop and mobile screenshots for overlapping text, clipped buttons, broken map, or confusing hierarchy.
18. Create two accounts and confirm neither can see the other account's routes.
19. Submit a meetup invitation as a member, approve it as Anthony admin, and confirm it appears publicly only after approval.
20. Turn Anthony's trip off and confirm Track Anthony shows the pre-trip state; turn it on and publish an update to confirm live progress appears.

## Known Model Limitations

- Candidate optimization still uses estimated road miles; the displayed polyline uses OSRM road geometry.
- The default public OSRM endpoint should be replaced with a local OSRM/Valhalla backend before repeated heavy planning.
- The station list is based on Supercharge.info and should be reconciled with Tesla nav before the actual drive.
- Clustered stations use short stop sessions until the carried range budget requires a longer distance-charge stop. Tesla's referenced contest terms do not publish a minimum charging duration, so these remain planning assumptions.
