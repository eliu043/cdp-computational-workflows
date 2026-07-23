// Selected regional context features for an exploratory infrastructure map.
// Coordinates are approximate map locations and do not imply a direct utility
// relationship with any data center. Power capacity is approximate nameplate MW.
const NORTH_TEXAS_WATER = [
  { name: "Lewisville Lake", coordinates: [-97.00, 33.17], kind: "reservoir" },
  { name: "Lavon Lake", coordinates: [-96.48, 33.04], kind: "reservoir" },
  { name: "Lake Ray Hubbard", coordinates: [-96.49, 32.82], kind: "reservoir" },
  { name: "Joe Pool Lake", coordinates: [-97.00, 32.64], kind: "reservoir" },
  { name: "Benbrook Lake", coordinates: [-97.46, 32.65], kind: "reservoir" },
  { name: "Eagle Mountain Lake", coordinates: [-97.48, 32.99], kind: "reservoir" },
  { name: "Cedar Creek Reservoir", coordinates: [-96.10, 32.24], kind: "reservoir" },
  { name: "Richland–Chambers Reservoir", coordinates: [-96.18, 31.96], kind: "reservoir" },
];

const NORTH_TEXAS_POWER = [
  { name: "Comanche Peak", coordinates: [-97.79, 32.30], fuel: "Nuclear", capacityMW: 2430 },
  { name: "Forney Energy Center", coordinates: [-96.43, 32.75], fuel: "Natural gas", capacityMW: 1912 },
  { name: "Midlothian Energy Facility", coordinates: [-96.99, 32.46], fuel: "Natural gas", capacityMW: 1638 },
  { name: "DeCordova Energy Storage Facility", coordinates: [-97.69, 32.41], fuel: "Battery / gas", capacityMW: 260 },
  { name: "Mountain Creek", coordinates: [-96.94, 32.72], fuel: "Natural gas", capacityMW: 808 },
  { name: "Handley", coordinates: [-97.22, 32.73], fuel: "Natural gas", capacityMW: 1265 },
];

const MAPBOX_ATLAS_SOURCES = [
  ...DFW_SOURCES,
  { label: "Texas Water Development Board — Water Data for Texas", url: "https://waterdatafortexas.org/reservoirs/statewide" },
  { label: "U.S. Energy Information Administration — Electricity Data", url: "https://www.eia.gov/electricity/data.php" },
  { label: "Mapbox GL JS documentation", url: "https://docs.mapbox.com/mapbox-gl-js/guides/" },
];
