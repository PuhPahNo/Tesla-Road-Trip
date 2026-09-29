# 2026 Competition: charging and hotel audit

Checked September 20, 2026 against the live 70-day route. Current live departure: October 5, 2026.

## What CORE currently represents

Each daily endpoint is a Supercharger. Driving estimates run between those chargers; they do not include a complete hotel and landmark itinerary. The configured 290-mile practical-range setting is not a battery state-of-charge simulation. Actual charging needs depend on departure charge, speed, weather, elevation and sightseeing. Use Tesla navigation for current battery predictions and charging instructions.

The authenticated Hotels page currently shows **0/70 nights covered**. Its August research snapshot no longer matches the itinerary. Previous hotel-distance fields were straight-line distances, not verified driving minutes. No claim that all hotels are within 20 minutes is supported. The final day returns home and does not require a hotel.

## Every leg of at least three modeled driving hours

Candidates were found near the road geometry using the current Supercharge.info feed. Only rows explicitly showing a verified road detour were rerouted through the candidate; other candidates still require road-access verification. These are optional charging stops within the same day, not additional overnight destinations. No candidate found means this search did not identify a convenient midpoint, not that all charging alternatives are absent. Power is the listed site maximum, not a promised vehicle charging rate.

| Day | Current leg | Miles / hours | Candidate charging stop | Road verification |
|---|---|---|---|---|
| 2 | Nashville, TN - 11th Ave N → Marion, IL | 192 / 3.27 | [Kuttawa, KY - US-62](https://www.tesla.com/findus/location/supercharger/33720), 325 kW; 2299 US-62 | Not independently rerouted |
| 9 | Norfolk, NE → Oacoma, SD | 221 / 3.68 | No convenient midpoint identified; check Tesla navigation before departure | Not independently rerouted |
| 12 | Wall, SD → Lusk, WY | 200 / 3.36 | No convenient midpoint identified; check Tesla navigation before departure | Not independently rerouted |
| 13 | Lusk, WY → Boulder, CO - 28th St | 246 / 3.94 | [Wheatland, WY](https://www.tesla.com/findus/location/supercharger/wheatlandsupercharger), 150 kW; 1556 Sherard Rd | 88 + 159 miles; about 3 extra driving minutes (charging excluded) |
| 16 | Estes Park, CO → Rawlins, WY | 200 / 3.93 | [Laramie, WY](https://www.tesla.com/findus/location/supercharger/laramiesupercharger), 150 kW; 1673 Centennial Dr | Not independently rerouted |
| 18 | Rock Springs, WY → Jackson, WY | 177 / 3.21 | No convenient midpoint identified; check Tesla navigation before departure | Not independently rerouted |
| 21 | Big Sky, MT → Missoula, MT | 239 / 3.67 | [Butte, MT - Grizzly Trl](https://www.tesla.com/findus/location/supercharger/19008), 250 kW; 1000 Grizzly Trail | 122 + 118 miles; about 2 extra driving minutes (charging excluded) |
| 23 | Kalispell, MT → Kellogg, ID | 173 / 3.59 | [St. Regis, MT](https://www.tesla.com/findus/location/supercharger/33470), 250 kW; 60 Mullan Gulch Rd | Not independently rerouted |
| 25 | Moses Lake, WA → Puyallup, WA | 188 / 3.27 | [Cle Elum, WA - W Davis St](https://www.tesla.com/findus/location/supercharger/19021), 250 kW; 808 W Davis St | Not independently rerouted |
| 26 | Puyallup, WA → Hood River, OR | 198 / 3.57 | [Kelso, WA](https://www.tesla.com/findus/location/supercharger/kelsowasupercharger), 250 kW; 205 Three Rivers Dr | Not independently rerouted |
| 27 | Hood River, OR → Bend, OR | 155 / 3.43 | [Madras, OR](https://www.tesla.com/findus/location/supercharger/MadrasORsupercharger), 250 kW; 1575 US-97 | Not independently rerouted |
| 30 | Grants Pass, OR → McKinleyville, CA | 156 / 3.53 | [Crescent City, CA](https://www.tesla.com/findus/location/supercharger/crescentcitysupercharger), 150 kW; 1000 Front St | Not independently rerouted |
| 34 | San Francisco, CA - Letterman Drive → Tahoe City, CA | 201 / 3.82 | [Loomis, CA](https://www.tesla.com/findus/location/supercharger/LoomisCAsupercharger), 250 kW; 6119 Horseshoe Bar Rd | 113 + 88 miles; about 2 extra driving minutes (charging excluded) |
| 39 | Big Sur, CA - Ventana → Lost Hills, CA - Tesla Oasis | 163 / 3.44 | [Paso Robles, CA - Riverside Ave](https://www.tesla.com/findus/location/supercharger/29307), 250 kW; 1111 Riverside Ave | Not independently rerouted |
| 41 | Inyokern, CA → Beatty, NV | 142 / 3.04 | No convenient midpoint identified; check Tesla navigation before departure | Not independently rerouted |
| 43 | Las Vegas, NV - High Roller at LINQ → Hesperia, CA | 192 / 3.19 | [Baker, CA - Mojave Pointe Rd](https://www.tesla.com/findus/location/supercharger/30569), 325 kW; 56383 Mojave Pointe Rd | Not independently rerouted |
| 45 | Los Angeles, CA - Tesla Diner → Twentynine Palms, CA | 152 / 3.11 | [Calimesa, CA](https://www.tesla.com/findus/location/supercharger/36090), 250 kW; 497 Sandalwood Dr | Not independently rerouted |
| 47 | Needles, CA - E Broadway St → Sedona, AZ | 253 / 3.83 | [Kingman, AZ - W Andy Devine](https://www.tesla.com/findus/location/supercharger/KingmanAZSupercharger2), 250 kW; 120 W Andy Devine Ave | 61 + 194 miles; about 5 extra driving minutes (charging excluded) |
| 54 | Bryce Canyon City, UT → Green River, UT | 223 / 3.74 | [Richfield, UT - W 1250 S](https://www.tesla.com/findus/location/supercharger/19166), 250 kW; 1050 W 1250 S | 97 + 126 miles; about 2 extra driving minutes (charging excluded) |
| 57 | Moab, UT → Kayenta, AZ | 175 / 3.26 | [Blanding, UT - S Main St](https://www.tesla.com/findus/location/supercharger/18993), 325 kW; 820 S Main St | Not independently rerouted |
| 59 | Farmington, NM - E Main St → Santa Fe, NM - Cerrillos Rd | 203 / 3.58 | No convenient midpoint identified; check Tesla navigation before departure | Not independently rerouted |
| 60 | Santa Fe, NM - Cerrillos Rd → Alamogordo, NM | 263 / 4.46 | [Socorro, NM](https://www.tesla.com/findus/location/supercharger/SoccoroNMsupercharger), 250 kW; 1100 N California Street | 129 + 134 miles; about 3 extra driving minutes (charging excluded) |
| 61 | Alamogordo, NM → Carlsbad, NM | 149 / 3.18 | No convenient midpoint identified; check Tesla navigation before departure | Not independently rerouted |
| 64 | Ozona, TX - 14th St → San Antonio, TX - Broadway | 206 / 3.03 | [Junction, TX](https://www.tesla.com/findus/location/supercharger/junctionsupercharger), 150 kW; 2415 N Main St | Not independently rerouted |
| 65 | San Antonio, TX - Broadway → Madisonville, TX | 210 / 3.63 | [Bastrop, TX](https://www.tesla.com/findus/location/supercharger/BastropTXSupercharger), 325 kW; 1700 State Hwy 71 | 100 + 111 miles; about 2 extra driving minutes (charging excluded) |
| 69 | Vicksburg, MS → Tupelo, MS | 254 / 4.57 | [Grenada, MS](https://www.tesla.com/findus/location/supercharger/grenadasupercharger), 150 kW; 2030 Sunset Dr | 156 + 100 miles; about 4 extra driving minutes (charging excluded) |
| 70 | Tupelo, MS → Chattanooga, TN - Manufacturers Rd | 242 / 4.57 | [Madison, AL](https://www.tesla.com/findus/location/supercharger/402256), 325 kW; 123 Outfield Dr | 132 + 111 miles; about 5 extra driving minutes (charging excluded) |

## Safety and site-access findings

This is not a completed address-level crime review of all 70 stops or future hotels. No entire city or neighborhood is classified as unsafe from reputation alone.

- Day 33, San Francisco: prioritize secure parking and remove luggage/valuables when sightseeing. [SFPD Park Smart](https://www.sanfranciscopolice.org/stay-safe/crime-prevention/park-smart) specifically warns about rapid vehicle break-ins. This is a citywide precaution, not evidence of a specific incident at Letterman Drive.
- Letterman Drive has six chargers rated up to 72 kW and published access of 7 AM to 11:59 PM. It is not a 24-hour high-power stop. [Tesla site details](https://www.tesla.com/findus/location/supercharger/qbdestinationsiteid83342).
- Hotel safety cannot yet be assessed because the current route has no valid hotel shortlists. Review exact parking access and recent property-specific evidence when selecting them.

## Sources and limitations

- Current public route response and authenticated admin Hotels page; local planner and hotel-matching implementation.
- [Supercharge.info station feed](https://supercharge.info/service/supercharge/allSites), retrieved September 20, 2026.
- OpenRouteService driving routes through the nine explicitly verified intermediate stations; no live traffic or charging queue included.
- [Tesla Supercharging guidance](https://www.tesla.com/support/charging/supercharging): Trip Planner adds charging stops based on current charge; charging speed varies with battery and conditions.
