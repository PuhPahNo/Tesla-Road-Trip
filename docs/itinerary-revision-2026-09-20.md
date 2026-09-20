# 2026 Competition itinerary revision — September 20, 2026

Road estimates from OpenRouteService; charging, traffic, sightseeing, and park access time are additional. Station availability checked against the current Supercharge.info feed.

| Metric | Before | Revised |
| --- | ---: | ---: |
| Days / unique daily charging stops | 73 | 70 |
| Road miles | 10,085.1 | 9,742.0 |
| Driving hours | 186.3 | 179.8 |
| Days with at least four driving hours | 9 | 3 |
| Trip rating | 88 | 88 |
| Iconic charger stops | 12 | 12 |
| Legs above configured 290-mile range | 0 | 0 |

## Changes

- Start in Nashville, replacing Cleveland, Manchester, and Dickson overnights. Continue through Marion to Fenton instead of the Clarksville/Cape Girardeau transfers.
- Replace the St. Clair/Hannibal/Lamoni/Bethany detour with Fenton → Columbia → Concordia → St. Joseph → Omaha. The four legs after Fenton are approximately 2.05, 1.22, 1.91, and 2.30 hours.
- Add Bend between Hood River and Chemult; use Grants Pass instead of Klamath Falls for the trip to the Redwoods; add Laytonville before Windsor.
- Keep the Golden Gate charger and drop the second one-mile San Francisco overnight.
- Add Los Banos between Yosemite and Big Sur, and Inyokern between the Tesla Oasis and Beatty.
- Move one of the two Cedar City days to Page, splitting Grand Canyon → Zion. Keep Toquerville and one Cedar City night, followed by Bryce Canyon.
- Drop the duplicate Ozona overnight.
- Return directly from Tupelo to Manufacturers Road in Chattanooga; no East Ridge overnight.

All 32 existing destination anchors remain at least as close to the revised charging route (within a five-mile tolerance). All 12 iconic charger opportunities remain. Remaining four-hour-plus legs: Santa Fe → Alamogordo (4.46 h), Vicksburg → Tupelo (4.57 h), Tupelo → Chattanooga (4.57 h).

## Persistence and validation

The account route uses the shared optional `dailyStationIds` field to retain the reviewed sequence. Current station metadata, ratings, driving estimates, and range checks still recalculate. The route editor preserves these stops for name/date changes and explicitly offers a rebuild from destination anchors. No user-specific routing logic is embedded in the optimizer.

Validation: all 157 tests passed, production build passed, lint passed with six existing Fast Refresh warnings. Checks cover persistence, account isolation, duplicate rejection, explicit rebuilding, date editing, exact sequence retention, closed/missing stations, and road-refined range warnings.

## Daily itinerary

| Day | Date | Overnight / final stop | Drive hours | Miles |
| ---: | --- | --- | ---: | ---: |
| 1 | 2026-09-27 | Nashville, TN - 11th Ave N | 2.54 | 137.3 |
| 2 | 2026-09-28 | Marion, IL | 3.27 | 191.6 |
| 3 | 2026-09-29 | Fenton, MO | 2.38 | 134.0 |
| 4 | 2026-09-30 | Columbia, MO | 2.05 | 114.8 |
| 5 | 2026-10-01 | Concordia, MO | 1.22 | 73.0 |
| 6 | 2026-10-02 | St. Joseph, MO | 1.91 | 112.9 |
| 7 | 2026-10-03 | Omaha, NE | 2.30 | 137.7 |
| 8 | 2026-10-04 | Norfolk, NE | 2.04 | 109.5 |
| 9 | 2026-10-05 | Oacoma, SD | 3.68 | 220.7 |
| 10 | 2026-10-06 | Murdo, SD | 1.01 | 69.1 |
| 11 | 2026-10-07 | Wall, SD | 1.20 | 82.9 |
| 12 | 2026-10-08 | Lusk, WY | 3.36 | 199.7 |
| 13 | 2026-10-09 | Boulder, CO - 28th St | 3.94 | 246.2 |
| 14 | 2026-10-10 | Boulder, CO | 0.07 | 0.9 |
| 15 | 2026-10-11 | Estes Park, CO | 1.18 | 36.8 |
| 16 | 2026-10-12 | Rawlins, WY | 3.93 | 199.5 |
| 17 | 2026-10-13 | Rock Springs, WY | 1.67 | 113.7 |
| 18 | 2026-10-14 | Jackson, WY | 3.21 | 176.7 |
| 19 | 2026-10-15 | West Yellowstone, MT | 2.90 | 127.0 |
| 20 | 2026-10-16 | Big Sky, MT | 1.05 | 51.1 |
| 21 | 2026-10-17 | Missoula, MT | 3.67 | 238.9 |
| 22 | 2026-10-18 | Kalispell, MT | 2.39 | 121.8 |
| 23 | 2026-10-19 | Kellogg, ID | 3.59 | 173.3 |
| 24 | 2026-10-20 | Moses Lake, WA | 2.84 | 172.7 |
| 25 | 2026-10-21 | Puyallup, WA | 3.27 | 188.1 |
| 26 | 2026-10-22 | Hood River, OR | 3.57 | 197.6 |
| 27 | 2026-10-23 | Bend, OR | 3.43 | 155.4 |
| 28 | 2026-10-24 | Chemult, OR | 1.41 | 73.2 |
| 29 | 2026-10-25 | Grants Pass, OR | 2.46 | 116.4 |
| 30 | 2026-10-26 | McKinleyville, CA | 3.53 | 156.2 |
| 31 | 2026-10-27 | Laytonville, CA | 2.46 | 124.6 |
| 32 | 2026-10-28 | Windsor, CA | 1.80 | 96.4 |
| 33 | 2026-10-29 | San Francisco, CA - Letterman Drive | 1.30 | 61.4 |
| 34 | 2026-10-30 | Tahoe City, CA | 3.82 | 200.7 |
| 35 | 2026-10-31 | Arnold, CA | 2.92 | 102.6 |
| 36 | 2026-11-01 | El Portal, CA | 2.90 | 113.2 |
| 37 | 2026-11-02 | Los Banos, CA | 2.44 | 103.2 |
| 38 | 2026-11-03 | Big Sur, CA - Ventana | 2.39 | 114.7 |
| 39 | 2026-11-04 | Lost Hills, CA - Tesla Oasis | 3.44 | 163.2 |
| 40 | 2026-11-05 | Inyokern, CA | 2.60 | 148.2 |
| 41 | 2026-11-06 | Beatty, NV | 3.04 | 141.7 |
| 42 | 2026-11-07 | Las Vegas, NV - High Roller at LINQ | 2.18 | 122.4 |
| 43 | 2026-11-08 | Hesperia, CA | 3.19 | 191.9 |
| 44 | 2026-11-09 | Los Angeles, CA - Tesla Diner | 1.58 | 81.8 |
| 45 | 2026-11-10 | Twentynine Palms, CA | 3.11 | 151.9 |
| 46 | 2026-11-11 | Needles, CA - E Broadway St | 2.49 | 140.8 |
| 47 | 2026-11-12 | Sedona, AZ | 3.83 | 253.4 |
| 48 | 2026-11-13 | Williams, AZ | 1.31 | 81.7 |
| 49 | 2026-11-14 | Tusayan, AZ | 1.00 | 53.2 |
| 50 | 2026-11-15 | Page, AZ | 2.93 | 141.8 |
| 51 | 2026-11-16 | Toquerville, UT | 2.79 | 142.7 |
| 52 | 2026-11-17 | Cedar City, UT | 0.38 | 24.5 |
| 53 | 2026-11-18 | Bryce Canyon City, UT | 1.68 | 96.3 |
| 54 | 2026-11-19 | Green River, UT | 3.74 | 222.6 |
| 55 | 2026-11-20 | Moab, UT - N Main St | 0.93 | 49.9 |
| 56 | 2026-11-21 | Moab, UT | 0.06 | 1.2 |
| 57 | 2026-11-22 | Kayenta, AZ | 3.26 | 175.3 |
| 58 | 2026-11-23 | Farmington, NM - E Main St | 2.56 | 132.1 |
| 59 | 2026-11-24 | Santa Fe, NM - Cerrillos Rd | 3.58 | 203.0 |
| 60 | 2026-11-25 | Alamogordo, NM | 4.46 | 263.2 |
| 61 | 2026-11-26 | Carlsbad, NM | 3.18 | 148.8 |
| 62 | 2026-11-27 | Odessa, TX | 2.62 | 160.7 |
| 63 | 2026-11-28 | Ozona, TX - 14th St | 2.44 | 133.8 |
| 64 | 2026-11-29 | San Antonio, TX - Broadway | 3.03 | 205.8 |
| 65 | 2026-11-30 | Madisonville, TX | 3.63 | 210.5 |
| 66 | 2026-12-01 | Nacogdoches, TX | 1.84 | 93.7 |
| 67 | 2026-12-02 | Ruston, LA | 2.87 | 159.5 |
| 68 | 2026-12-03 | Vicksburg, MS | 1.84 | 104.7 |
| 69 | 2026-12-04 | Tupelo, MS | 4.57 | 254.5 |
| 70 | 2026-12-05 | Chattanooga, TN - Manufacturers Rd | 4.57 | 241.7 |
