# Tesla Charging Badge Research

ChargeQuest separates Tesla charging badges into three product concepts:

- **Iconic Chargers** are tied to one or more specific Supercharger sites. Route detection uses exact Tesla location IDs with a sub-mile coordinate fallback instead of broad attraction radii.
- **Special Events** are limited-time charging events. They are flagged only when the configured trip dates include the announced event date.
- **Charging Milestones** depend on actual charging behavior. ChargeQuest can identify a promising route or charging stop, but it cannot guarantee the Tesla app will award the badge.

Tesla's app remains the final source of truth because the eligible site list and event instructions can change. Tesla says Iconic Charger detail screens show the qualifying addresses and badges can take up to 24 hours to appear.

## North American Iconic Charger targets

| Badge | ChargeQuest target | Region note |
|---|---|---|
| Arches | Moab, UT Superchargers | Mainland routeable |
| Bryce Canyon | Bryce Canyon City, UT | Mainland routeable |
| Death Valley | Beatty, NV | Mainland routeable |
| Golden Gate Bridge | San Francisco Letterman Drive | Mainland routeable |
| Grand Canyon | Tusayan, AZ | Mainland routeable |
| Joshua Tree | Twentynine Palms and Yucca Valley, CA | Mainland routeable |
| Las Vegas Strip | High Roller at LINQ | Mainland routeable |
| Miami Beach | Pennsylvania Avenue and West Avenue | Mainland routeable |
| Niagara Falls | Niagara Falls, Ontario sites | Requires Canada coverage |
| Oasis | Tesla Oasis, Lost Hills, CA | Mainland routeable |
| San Antonio River | San Antonio Broadway | Mainland routeable |
| Santa Monica | Santa Monica Place | Mainland routeable |
| Tesla Diner | 7001 Santa Monica Boulevard | Mainland routeable |
| Waikiki | 2330 Kalakaua Avenue, Honolulu | Catalog only; not mainland road-routeable |
| Whistler | Whistler Marketplace and Fairmont Chateau | Requires Canada coverage |
| Yellowstone | West Yellowstone, MT | Mainland routeable |
| Yosemite | El Portal and Fish Camp, CA | Mainland routeable |

## Date and performance badges modeled

- **Earth Day 2026:** charge on April 22, 2026. Modeled as a one-time announced event; ChargeQuest does not assume Tesla will repeat it in a future year.
- **America 250:** Supercharge on July 4, 2026. This one-time event has passed, but a historical trip window containing that date is still labeled correctly.
- **Pit Stop:** add more than 80 miles and manually end the session before 10 minutes. ChargeQuest flags an early 250 kW or faster site as a candidate and clearly avoids promising the result.
- **Explorer:** the first documented 2026 threshold is 10 unique Supercharger sites.
- **Charging Streak:** Supercharge in four consecutive weeks. Routes spanning at least 22 days are marked on track, with the actual weekly sessions left to the driver.

## Research sources

- [Tesla Charging Badges support](https://www.tesla.com/en_gb/support/tesla-app/charging-badges)
- [Tesla Charge Stats support](https://www.tesla.com/support/tesla-app/charge-stats)
- Individual official Tesla Find Us pages stored with every badge record in `src/domain/teslaBadges.ts`
- [2026 milestone overview](https://www.notateslaapp.com/news/4340/first-look-at-teslas-new-charge-stats-in-the-tesla-app)
- [Earth Day 2026 badge reporting](https://www.notateslaapp.com/news/4011/tesla-adds-earth-day-charging-badge-to-mobile-app)
- [Pit Stop field confirmation](https://www.reddit.com/r/TeslaModel3/comments/1umuk6s/if_you_were_wondering_about_this_charging_badge/)

Community reports are used only where Tesla's public support page does not publish a threshold. Those records remain labeled as planning guidance rather than guaranteed eligibility.
