# Driving-time proxy and transfer consolidation

Driving hours use one shared 0.90 multiplier when constructing day plans, for both raw road-provider durations and mileage-based fallback estimates. This affects CORE, built-in/saved routes, public routes, daily boundaries, drive caps, and streak timing. Provider results remain raw; road mileage, charging calculations, station counts, and range checks are independent. Overview and daily-plan panels explain the estimate.

Public trip and route fetches explicitly revalidate cached responses. The existing stale-while-revalidate headers could otherwise show the pre-deploy itinerary alongside the updated app bundle on the first reload.

The 69-leg Google Maps comparison on October 4 at 10:03–10:05 PM Central found 181.69 ORS hours versus 164.58 Google hours (+10.4%). Applying 0.90 reduced mean absolute deviation from 15.78 to 6.74 minutes; 55 of 69 legs were within 10 minutes. The worst remaining difference was 34.82 minutes. Nine recommended routes differed by more than 5% in mileage. These are current-condition estimates and in-sample calibration, not forecasts or independent accuracy validation.

## Previous 59-day revision

The previous 2026 itinerary was 59 days, October 4–December 1: ten fewer days than the 69-day baseline. The first six days and Omaha on October 9 remained fixed. Every saved waypoint/stay preference remained, and every existing park-related charging location remained. The user authorized two or three days per basecamp instead of four. Badlands, Crater Lake, Rainier, Lake Tahoe, Big Sur, Zion/southern Utah, and Arches retained two calendar days; Rocky Mountain, Yellowstone gateways, and Grand Canyon retained three. Descriptive basecamp tags indicate nearby gateway stops, not guaranteed time inside a park; side-trip driving is additional.

Eight pairs of charging hops share a calendar day rather than dropping destinations:

| Old days | Stops | Adjusted driving hours |
| --- | --- | ---: |
| 16 + 17 | Rock Springs → Jackson | 4.39 |
| 27 + 28 | Chemult → Grants Pass | 3.48 |
| 30 + 31 | Laytonville → Windsor | 3.83 |
| 42 + 43 | Hesperia → Los Angeles | 4.29 |
| 47 + 48 | Williams → Tusayan | 2.08 |
| 51 + 52 | Cedar City → Bryce Canyon City | 1.85 |
| 54 + 55 | Both Moab charging stops | 0.89 |
| 65 + 66 | Nacogdoches → Ruston | 4.24 |

Two transfer changes save the remaining two days: Omaha → Sioux Falls → Murdo replaces Omaha → Norfolk → Oacoma → Murdo (2.67h and 2.85h, 186.3 and 212.5 miles). Carlsbad → Ozona omits the Odessa transfer overnight (3.60h, 243.7 miles). Those three low-priority transfer charging locations are the only old locations removed; Sioux Falls is added. Total charging locations become 67 across 59 days. The existing early Louisville/St. Louis and Kansas City legs and several later legs still exceed four hours slightly. Three newly combined days are about 4h15–4h25; this schedule does not claim a strict four-hour cap.

`reviewedDayStopCounts` stores how many ordered charging visits belong to each reviewed calendar day, without duplicating station IDs. It is optional, validated against the station count, preserved through metadata edits, and cleared on an explicit itinerary rebuild. Default Longest Trip routes retain their existing one-stop-per-day behavior. Both estimated and road-refined reviewed routes use the same grouping and raw-hour proxy.

`2026-competition-consolidation.json` preserves the exact 69-stop baseline, calendar grouping, and measured transfer evidence. The guarded, transactional `2026-10-04-reviewed-59-day-schedule` migration saves the full pre-change trip/route in `data_revisions`, verifies the baseline sequence and start date, and refuses to renumber travelled days or road logs/journal entries from the first changed day (7). It updates the selected route and tracker length while preserving progress. Subsequent deploys preserve edits.

## November 25 return revision

The current reviewed schedule is 53 days, October 4–November 25, with 71 charging visits. It saves six more calendar days while preserving the opening six days, Omaha on October 9, every saved destination, and every existing park-related charging location. Rocky Mountain and Grand Canyon basecamps each have two nights. The departing Big Sky/Missoula day is combined after the Jackson and West Yellowstone overnight stops, retaining those two Yellowstone gateway nights.

Additional changes:

- Combine Boulder/Estes Park into the second Rockies day.
- Combine Williams/Tusayan/Page into the second Grand Canyon day (about 4.7 adjusted driving hours, an exception to the typical 3–4-hour pace).
- Continue from Tesla Oasis to Bakersfield for the first California transfer night; Inyokern and Beatty share the next day (about 3.86h and 4.41h).
- After Carlsbad, take five return transit days ending around Junction, Madisonville, Monroe, Tuscaloosa, and Chattanooga. The first four are about 4.76h, 4.87h, 4.80h, and 4.86h; the final home leg is about 3.17h. Ozona, San Antonio, Nacogdoches, Ruston, and Vicksburg remain charging/visit stops. The return uses Meridian/Tuscaloosa in place of the low-priority Tupelo transfer detour.

Charging locations are routing and charging anchors; overnight lodging does not need to be beside a Supercharger. Hours describe the driving corridor and exclude charging, attraction side trips, and detours to chosen lodging. Most ordinary driving days remain around 3–4 hours; this is not a strict four-hour cap.

The reviewed route's travel preferences use a four-hour target and five-hour maximum, matching the authorized transit pace. A separate guarded revision applies this to the exact 53-day schedule, preserves vehicle/range/pace preferences and all global settings, and backs up the route before changing its warning threshold.

The separate `2026-competition-november-return.json` preserves the exact 59-day station sequence and day boundaries plus measured ORS transfer evidence. Both revisions use one guarded transaction helper. The second revision checks both station IDs and calendar boundaries, refuses to renumber progress/history from its first changed day (12), backs up the 59-day route/tracker, updates only the three authorized basecamp caps, and preserves unrelated preferences. The original 59-day migration remains unchanged as a release baseline.

## October 4 flexible overnight revision: 49 days, November 21 return

The reviewed plan now separates overnight areas from charging suggestions. It highlights exactly one new site per calendar day, with additional range connectors available in the routing model. The total number of mapped charging options is not a prediction of charging sessions or a Tesla streak score. Actual unique-site sessions and their timestamps determine the streak; repeat sites do not reset the timer. The conservative planning rule is a new session within 24 hours of the previous qualifying start (Tesla's category definition), because its explanatory paragraph currently refers to the end instead. No elapsed-time compliance claim is made from modeled driving alone.

This cuts four more calendar days from the 53-day plan, or 20 days from the 69-day October departure revision. Changes combine the Spokane/Rainier approach and San Francisco approach, reorder California to reduce backtracking, and use I-20 instead of the San Antonio/Alamo/River Walk detour on the return. Tahoe, Big Sur and Monument Valley visit days are retained. Glacier stays as one overnight with an afternoon and following morning around Apgar/Lake McDonald, weather permitting; alpine Going-to-the-Sun Road access is not assumed. Estes Park and the Grand Canyon South Rim each have two actual nights and a full intervening visit day.

Fresh ORS directions were measured through every charging option and each representative overnight coordinate, with the shared 0.90 duration proxy applied once. The four final transit days are about 4.8–5.0 hours each. Driving to an overnight belongs to that calendar day; battery consumption after a charge belongs to the next charge-to-charge range interval. The final home segment is included in the final day. Park loops, sightseeing, hotel-specific detours, traffic and breaks are additional. Overnight areas are planning locations, not hotel bookings.

The guarded SQLite revision only replaces the exact 53-day future itinerary when no travel/history has reached changed day 11. It retains all 38 saved wishlist waypoints, vehicle preferences, the October 9 Omaha appointment and existing trip history; an immutable revision ledger contains the previous saved route. Retained wishlist waypoints do not mean every one is a scheduled visit.

Sources: [Glacier winter access](https://www.nps.gov/glac/planyourvisit/winter.htm), [Tesla competition rules](https://www.tesla.com/support/tesla-app/charging-badges/contest).

| Day | Date | Overnight area | Corridor driving |
| --- | --- | --- | ---: |
| 1 | 2026-10-04 | Cave City | 3.44 h |
| 2 | 2026-10-05 | Louisville | 1.27 h |
| 3 | 2026-10-06 | St. Louis | 4.28 h |
| 4 | 2026-10-07 | Kansas City | 4.07 h |
| 5 | 2026-10-08 | St. Joseph | 0.66 h |
| 6 | 2026-10-09 | Omaha | 2.07 h |
| 7 | 2026-10-10 | Sioux Falls | 2.67 h |
| 8 | 2026-10-11 | Murdo | 2.85 h |
| 9 | 2026-10-12 | Wall | 1.08 h |
| 10 | 2026-10-13 | Lusk | 3.03 h |
| 11 | 2026-10-14 | Estes Park · Rockies night 1 | 4.56 h |
| 12 | 2026-10-15 | Estes Park · Rockies night 2 | 0.00 h |
| 13 | 2026-10-16 | Rawlins | 3.53 h |
| 14 | 2026-10-17 | Jackson | 4.39 h |
| 15 | 2026-10-18 | West Yellowstone | 2.61 h |
| 16 | 2026-10-19 | Missoula | 4.24 h |
| 17 | 2026-10-20 | West Glacier / Columbia Falls | 2.77 h |
| 18 | 2026-10-21 | Spokane | 4.96 h |
| 19 | 2026-10-22 | Puyallup | 4.39 h |
| 20 | 2026-10-23 | Hood River | 3.21 h |
| 21 | 2026-10-24 | Bend | 3.09 h |
| 22 | 2026-10-25 | Grants Pass | 3.48 h |
| 23 | 2026-10-26 | McKinleyville | 3.18 h |
| 24 | 2026-10-27 | Sausalito / northern San Francisco Bay | 4.89 h |
| 25 | 2026-10-28 | Tahoe City | 3.68 h |
| 26 | 2026-10-29 | Arnold | 2.63 h |
| 27 | 2026-10-30 | El Portal | 2.61 h |
| 28 | 2026-10-31 | Los Banos | 2.19 h |
| 29 | 2026-11-01 | Big Sur | 2.15 h |
| 30 | 2026-11-02 | Bakersfield | 3.86 h |
| 31 | 2026-11-03 | Yucca Valley / Joshua Tree gateway | 4.05 h |
| 32 | 2026-11-04 | Ridgecrest / Inyokern | 4.06 h |
| 33 | 2026-11-05 | Las Vegas | 4.47 h |
| 34 | 2026-11-06 | Sedona | 4.45 h |
| 35 | 2026-11-07 | Grand Canyon South Rim / Tusayan | 2.08 h |
| 36 | 2026-11-08 | Grand Canyon South Rim / Tusayan | 0.00 h |
| 37 | 2026-11-09 | Springdale / Zion gateway | 4.90 h |
| 38 | 2026-11-10 | Bryce Canyon City | 2.43 h |
| 39 | 2026-11-11 | Green River | 3.36 h |
| 40 | 2026-11-12 | Moab | 0.88 h |
| 41 | 2026-11-13 | Kayenta | 2.93 h |
| 42 | 2026-11-14 | Farmington | 2.30 h |
| 43 | 2026-11-15 | Santa Fe | 3.22 h |
| 44 | 2026-11-16 | Alamogordo | 4.01 h |
| 45 | 2026-11-17 | Carlsbad | 2.86 h |
| 46 | 2026-11-18 | Baird / eastern Abilene I-20 corridor | 4.97 h |
| 47 | 2026-11-19 | Shreveport I-20 corridor | 4.92 h |
| 48 | 2026-11-20 | Western Meridian I-20 corridor | 4.84 h |
| 49 | 2026-11-21 | Chattanooga | 4.88 h |

Validation: 168 tests passed, production build passed, lint passed with existing Fast Refresh warnings. Local public-route ORS refinement returned 49 days, 49 daily suggestions, 66 charging options, 9,444.9 miles, 157.5 driving hours, zero drive-cap warnings and zero modeled charging range gaps. Desktop and 390-pixel mobile browser checks verified the calendar, independent overnight labels and daily suggestions without horizontal overflow or browser errors.
