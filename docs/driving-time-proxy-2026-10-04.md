# Driving-time proxy and transfer consolidation

Driving hours use one shared 0.90 multiplier when constructing day plans, for both raw road-provider durations and mileage-based fallback estimates. This affects CORE, built-in/saved routes, public routes, daily boundaries, drive caps, and streak timing. Provider results remain raw; road mileage, charging calculations, station counts, and range checks are independent. Overview and daily-plan panels explain the estimate.

Public trip and route fetches explicitly revalidate cached responses. The existing stale-while-revalidate headers could otherwise show the pre-deploy itinerary alongside the updated app bundle on the first reload.

The 69-leg Google Maps comparison on October 4 at 10:03–10:05 PM Central found 181.69 ORS hours versus 164.58 Google hours (+10.4%). Applying 0.90 reduced mean absolute deviation from 15.78 to 6.74 minutes; 55 of 69 legs were within 10 minutes. The worst remaining difference was 34.82 minutes. Nine recommended routes differed by more than 5% in mileage. These are current-condition estimates and in-sample calibration, not forecasts or independent accuracy validation.

The revised 2026 itinerary is 59 days, October 4–December 1: ten fewer days than the 69-day baseline. The first six days and Omaha on October 9 remain fixed. Every saved waypoint/stay preference remains, and every existing park-related charging location remains. The user authorized two or three days per basecamp instead of four. Badlands, Crater Lake, Rainier, Lake Tahoe, Big Sur, Zion/southern Utah, and Arches retain two calendar days; Rocky Mountain, Yellowstone gateways, and Grand Canyon retain three. Descriptive basecamp tags indicate nearby gateway stops, not guaranteed time inside a park; side-trip driving is additional.

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
