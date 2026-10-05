# October 4 departure revision

Anthony departed Chattanooga on October 4, 2026. The published opening is now:

| Day | Date | Destination | Activity |
| --- | --- | --- | --- |
| 1 | October 4 | Cave City, KY | Mammoth Cave National Park |
| 2 | October 5 | Louisville, KY | Kentucky Derby Museum at Churchill Downs |
| 3 | October 6 | St. Louis, MO | City stop |
| 4 | October 7 | Kansas City, MO | City stop |
| 5 | October 8 | St. Joseph, MO | Tentative: Pony Express National Museum |
| 6 | October 9 | Omaha, NE | Meet Dad |

Replacing the previous seven opening days with six leaves 69 reviewed daily
Supercharger stops. All stops after Omaha retain their order and calendar dates:
the departure is one day later and the opening is one day shorter. The remaining
loop is a working plan, not a newly committed trip duration.

`server/departureRevision.ts` applies this to the selected `saved-2026-competition`
route on startup. It checks the original 70-stop opening, October 3 start date,
current day 1, and absence of road logs. It does not change other accounts,
other routes, or a subsequently edited itinerary. It validates the result with
the existing saved-route persistence schema before writing.

The route and public trip change in one transaction. The original complete route
and trip rows are retained in `data_revisions.before_json` under
`2026-10-04-departure`. The revision marker prevents future deploys/restarts from
resetting manual progress. If a rollback is required, restore both records from
that snapshot in a transaction and retain the marker so the correction does not
reapply. A code rollback alone does not restore persisted itinerary data.

The shared destination ceiling increases from 32 to 40 so the six opening
anchors can coexist with every later destination even when the original route
was at its ceiling. The reviewed daily charging sequence remains authoritative.

The published field note no longer hardcodes planned days, miles, station-open
claims, old leg numbers, or a pre-departure countdown. The old journal URL
redirects to `/journal/route-audible-october-2026`, and the original publication
date is retained with a visible October 4 update date.

Visitor sources:

- Kentucky Derby Museum: https://www.derbymuseum.org/visit-guide
- Pony Express National Museum: https://www.ponyexpress.org/hours-and-admission
