# Hotel refresh for the reviewed competition trip

The live route starts October 5, 2026 and returns home December 13. It has 70 travel days and 69 hotel nights. This refresh replaces the obsolete August hotel snapshot with 335 options, all within 20 modeled driving minutes of that day's Supercharger. Laytonville has one local option, Budget Inn, explicitly labeled practical/basic rather than higher end.

Road distance and drive time come from OpenRouteService's driving-car matrix. Hotel detour compares charger → hotel → next charger against charger → next charger, using directed road routes. Times exclude traffic, charging, sightseeing, check-in and parking delays. Straight-line distance is used only to bound candidate discovery, never as the displayed hotel drive.

Hotel identities combine prior research with current OpenStreetMap/Photon results. Laytonville's missing motel was checked against the county tourism listing and an ArcGIS POI/address match. Properties without verified current lodging operation were excluded through the small research override file. Availability and prices have not been rechecked: outdated amounts were cleared, and booking links now carry each exact new check-in/check-out date. Existing property photos and explicitly unverified nearby-EV context are retained where available.

Regenerate with `node --env-file=.env scripts/refresh-route-hotels.mjs --write`. The refresh caches external responses in `/tmp/chargequest-hotel-road-research`, fails on unroutable nights, and refuses to overwrite the dataset if the live saved route changes during research. To force new provider data, use an empty directory through `HOTEL_RESEARCH_CACHE`. The admin API continues to invalidate a changed route and now also rejects hotel research without road measurements.

Charging does not need to be the overnight endpoint. Choosing a hotel near the final activity can avoid backtracking, while keeping a charger as a stop along the way. These hotel measurements do not yet optimize a complete hotel → attraction → charger → hotel itinerary, and do not establish a reduction in total trip miles or days. The saved competition stop order remains unchanged.

Validation: 157 tests passed; production build passed; lint has only six pre-existing fast-refresh warnings. Hotel tests cover exact dates/stops, final home day, finite road metrics, stale price removal, and the drive-time filter.
