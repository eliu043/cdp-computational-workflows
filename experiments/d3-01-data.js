// DFW data center submarkets, tallied by hand from named facility entries in
// Baxtel's public Dallas market directory (baxtel.com/data-center/dallas,
// retrieved July 2026: 276 facilities, 81 providers, 46 under construction,
// +62% power growth since 2022). Counts are how many named facilities in that
// directory reference each place name and carry each status -- a text tally
// of public listings, not a certified inventory or a calendar-dated time
// series. Lat/lon are city-center approximations, not parcel addresses.
//
// Baxtel doesn't publish a year-by-year history per facility, so there's no
// real calendar timeline to slide through. What it does publish, per facility,
// is a lifecycle STATUS -- Operational / Construction / Planned (+ Land Bank,
// Prospective Expansion) -- which is a genuine, if coarse, stand-in for time:
// every project now operational was once merely planned. The slider below
// moves through that lifecycle: Built -> Building -> Filed. A facility with
// more than one status (e.g. "Operational, Planned" -- built, with a filed
// expansion) counts in every stage it lists, so stage totals don't sum to the
// place's total facility count.
//
// ~31 additional planned/land-bank filings (mostly under "MSB Global
// Services", plus a few one-off land-bank names) carry no disclosed location
// and are omitted from the map; see the footnote in the panel. A handful of
// withdrawn / in-doubt / decommissioned entries are also excluded throughout.
const DFW_SUBMARKETS = [
  { name: "Dallas core (+ unspecified DFW# sites)", lat: 32.80, lon: -96.85, group: "core",
    stages: { operational: 75, construction: 19, planned: 45 },
    note: "Downtown/Stemmons Infomart, Equinix DA-series, NTT, QTS Mason Rd, and most unlabeled “DFW##” filings." },
  { name: "Fort Worth (+ Alliance)", lat: 32.7555, lon: -97.3308, group: "core",
    stages: { operational: 9, construction: 2, planned: 7 } },
  { name: "Red Oak", lat: 32.5199, lon: -96.8078, group: "frontier",
    stages: { operational: 10, construction: 2, planned: 1 },
    note: "Compass Datacenters' original DFW campus, now 8+ buildings -- the frontier's most built-out node." },
  { name: "Garland", lat: 32.9126, lon: -96.6389, group: "core",
    stages: { operational: 3, construction: 2, planned: 6 },
    note: "STACK Infrastructure's DFW01/DFW02 campus -- mostly still filed, not yet built." },
  { name: "Plano", lat: 33.0198, lon: -96.6989, group: "core",
    stages: { operational: 9, construction: 2, planned: 2 } },
  { name: "Allen", lat: 33.1032, lon: -96.6706, group: "core",
    stages: { operational: 8, construction: 1, planned: 2 } },
  { name: "Richardson", lat: 32.9483, lon: -96.7299, group: "core",
    stages: { operational: 8, construction: 0, planned: 1 } },
  { name: "Irving", lat: 32.8140, lon: -96.9489, group: "core",
    stages: { operational: 5, construction: 1, planned: 3 } },
  { name: "Midlothian", lat: 32.4823, lon: -96.9944, group: "frontier",
    stages: { operational: 4, construction: 2, planned: 0 },
    note: "Google's campus — per Baxtel, “no other data centers within 15 miles” when it broke ground. Already substantially built." },
  { name: "Lewisville", lat: 33.0462, lon: -97.0058, group: "core",
    stages: { operational: 3, construction: 0, planned: 0 } },
  { name: "Denton", lat: 33.2148, lon: -97.1331, group: "core",
    stages: { operational: 1, construction: 2, planned: 1 } },
  { name: "Carrollton", lat: 32.9756, lon: -96.8900, group: "core",
    stages: { operational: 2, construction: 0, planned: 0 } },
  { name: "Farmers Branch", lat: 32.9265, lon: -96.8961, group: "core",
    stages: { operational: 2, construction: 0, planned: 1 } },
  { name: "Lancaster", lat: 32.5921, lon: -96.7561, group: "frontier",
    stages: { operational: 0, construction: 0, planned: 2 },
    note: "Zero operational, zero under construction -- exists only as filings so far. The leading edge of the frontier." },
  { name: "Collin County (unspecified)", lat: 33.15, lon: -96.55, group: "core",
    stages: { operational: 0, construction: 1, planned: 0 } },
  { name: "South Dallas County (Ennis area)", lat: 32.3299, lon: -96.6259, group: "frontier",
    stages: { operational: 0, construction: 0, planned: 1 },
    note: "Also filings-only -- Cawley Partners' ~5,200-acre land assembly south of Dallas." },
  { name: "Arlington", lat: 32.7357, lon: -97.1081, group: "core",
    stages: { operational: 1, construction: 0, planned: 0 } },
  { name: "Granbury", lat: 32.4421, lon: -97.7942, group: "outlier",
    stages: { operational: 1, construction: 0, planned: 0 },
    note: "Marathon Digital's Granbury site — at 300 MW, the single largest facility in the market, and already fully built." },
  { name: "Grand Prairie", lat: 32.7459, lon: -96.9978, group: "core",
    stages: { operational: 0, construction: 1, planned: 1 } },
  { name: "Grapevine", lat: 32.9343, lon: -97.0781, group: "core",
    stages: { operational: 1, construction: 0, planned: 0 } },
  { name: "Rice", lat: 32.2454, lon: -96.4783, group: "outlier",
    stages: { operational: 0, construction: 0, planned: 1 },
    note: "Filings-only, small east-of-Ennis outlier." },
  { name: "Waco", lat: 31.5493, lon: -97.1467, group: "outlier",
    stages: { operational: 0, construction: 0, planned: 1 },
    note: "Land-bank filing well south of the metro, along the I-35 corridor." },
  { name: "Venus", lat: 32.4290, lon: -97.0989, group: "frontier",
    stages: { operational: 0, construction: 0, planned: 1 },
    note: "Filings-only land-bank site." },
  { name: "McKinney", lat: 33.1972, lon: -96.6398, group: "core",
    stages: { operational: 1, construction: 0, planned: 0 } },
];

DFW_SUBMARKETS.forEach((d) => {
  d.maxStage = Math.max(d.stages.operational, d.stages.construction, d.stages.planned);
  d.totalMentions = d.stages.operational + d.stages.construction + d.stages.planned;
});

// Undisclosed-location filings, excluded from the map but real in the count.
const DFW_UNDISCLOSED_COUNT = 31; // MSB Global Services (26) + Rock Creek (2) + Sailfish (2) + SC Zeus (1)

// CBRE / JLL North America Data Center Trends reports (2025 vintages).
// Figures differ slightly by report vintage and methodology; both are shown
// rather than reconciled into one number.
const DFW_MARKET_STATS = {
  facilities: 276,
  providers: 81,
  underConstructionSites: 46,
  powerGrowthSince2022: "+62%",
  largestFacility: { name: "Marathon Digital — Granbury, TX", mw: 300 },
  reports: [
    { source: "JLL, North America Data Center Report (Midyear 2025)", inventoryGW: 1.5, underConstructionMW: 1083, plannedGW: 3.9, rank: "2nd-largest North American market (behind Northern Virginia)" },
    { source: "CBRE, North America Data Center Trends H2 2025", inventoryGW: 1.0, underConstructionMW: 700, plannedGW: 3.0, rank: "3rd market to cross 1 GW (after Northern Virginia and Atlanta)" },
  ],
  topProviders: [
    { name: "QTS Data Centers", operationalMW: 350.2, sites: 8 },
    { name: "Compass Datacenters", operationalMW: 324.5, sites: 12 },
    { name: "CyrusOne", operationalMW: 184.5, sites: 5 },
  ],
};

const DFW_SOURCES = [
  { label: "Baxtel — Dallas Colocation & Data Center Market", url: "https://baxtel.com/data-center/dallas" },
  { label: "CBRE — North America Data Center Trends H2 2025 (Dallas-Ft. Worth)", url: "https://www.cbre.com/insights/books/north-america-data-center-trends-h2-2025/dallas-ft-worth-data-center-market" },
  { label: "JLL — North America Data Center Report, Midyear 2025", url: "https://www.jll.com/en-us/newsroom/data-center-availability-crisis-deepens-as-vacancy-hits-historic-low" },
];
