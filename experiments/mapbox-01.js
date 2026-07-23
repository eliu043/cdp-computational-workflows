const TOKEN_STORAGE_KEY = "cdp-mapbox-public-token";
const DEFAULT_CENTER = [-96.91, 32.74];
const DEFAULT_ZOOM = 7.15;

let atlasMap = null;
let activeStage = "all";

const stageButtons = document.querySelectorAll("[data-stage]");
const tokenGate = document.getElementById("mapbox-token-gate");
const tokenForm = document.getElementById("mapbox-token-form");
const tokenInput = document.getElementById("mapbox-token-input");
const tokenError = document.getElementById("mapbox-token-error");

function pointCollection(items, propertiesFor) {
  return {
    type: "FeatureCollection",
    features: items.map((item) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: item.coordinates || [item.lon, item.lat] },
      properties: propertiesFor(item),
    })),
  };
}

const dataCenterGeoJSON = pointCollection(DFW_SUBMARKETS, (d) => ({
  name: d.name,
  group: d.group,
  operational: d.stages.operational,
  construction: d.stages.construction,
  planned: d.stages.planned,
  total: d.totalMentions,
  note: d.note || "No additional note in the source directory for this submarket.",
}));

const waterGeoJSON = pointCollection(NORTH_TEXAS_WATER, (d) => ({ name: d.name, kind: d.kind }));
const powerGeoJSON = pointCollection(NORTH_TEXAS_POWER, (d) => ({ name: d.name, fuel: d.fuel, capacityMW: d.capacityMW }));

function stageValueExpression(stage) {
  if (stage === "all") return ["get", "total"];
  return ["get", stage];
}

function visibleFacilityTotal() {
  if (activeStage === "all") return DFW_SUBMARKETS.reduce((sum, d) => sum + d.totalMentions, 0);
  return DFW_SUBMARKETS.reduce((sum, d) => sum + d.stages[activeStage], 0);
}

function stageLabel(stage = activeStage) {
  return { all: "All lifecycle mentions", operational: "Built / operational", construction: "Building / construction", planned: "Filed / planned" }[stage];
}

function updateMetrics() {
  document.getElementById("metric-facilities").textContent = visibleFacilityTotal();
  document.getElementById("metric-markets").textContent = DFW_SUBMARKETS.filter((d) => activeStage === "all" ? d.totalMentions : d.stages[activeStage]).length;
  document.getElementById("metric-power").textContent = (NORTH_TEXAS_POWER.reduce((sum, d) => sum + d.capacityMW, 0) / 1000).toFixed(1);
  document.getElementById("metric-water").textContent = NORTH_TEXAS_WATER.length;
}

function haversineMiles(a, b) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const dLat = radians(b[1] - a[1]);
  const dLon = radians(b[0] - a[0]);
  const lat1 = radians(a[1]);
  const lat2 = radians(b[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function nearestTo(coordinates, collection) {
  return collection.reduce((nearest, item) => {
    const distance = haversineMiles(coordinates, item.coordinates);
    return !nearest || distance < nearest.distance ? { item, distance } : nearest;
  }, null);
}

function setSelection(feature, kind) {
  const props = feature.properties;
  const coordinates = feature.geometry.coordinates;
  const name = document.getElementById("selection-name");
  const type = document.getElementById("selection-type");
  const count = document.getElementById("selection-count");
  const stage = document.getElementById("selection-stage");
  const water = document.getElementById("selection-water");
  const power = document.getElementById("selection-power");
  const note = document.getElementById("selection-note");

  name.textContent = props.name;
  if (kind === "data-centers") {
    const nearestWater = nearestTo(coordinates, NORTH_TEXAS_WATER);
    const nearestPower = nearestTo(coordinates, NORTH_TEXAS_POWER);
    type.textContent = `${props.group === "frontier" ? "Southern frontier" : props.group === "outlier" ? "Regional outlier" : "Metro core"} · data center submarket`;
    count.textContent = `${activeStage === "all" ? props.total : props[activeStage]} at selected stage`;
    stage.textContent = `${props.operational} built · ${props.construction} building · ${props.planned} filed`;
    water.textContent = `${nearestWater.item.name} · ${nearestWater.distance.toFixed(1)} mi`;
    power.textContent = `${nearestPower.item.name} · ${nearestPower.distance.toFixed(1)} mi`;
    note.textContent = props.note;
  } else if (kind === "water") {
    type.textContent = "Regional water context · reservoir";
    count.textContent = "Context feature";
    stage.textContent = "Not applicable";
    water.textContent = props.name;
    const nearestPower = nearestTo(coordinates, NORTH_TEXAS_POWER);
    power.textContent = `${nearestPower.item.name} · ${nearestPower.distance.toFixed(1)} mi`;
    note.textContent = "Proximity is contextual and does not establish a supply relationship with any mapped campus.";
  } else {
    type.textContent = `${props.fuel} · power context`;
    count.textContent = `${Number(props.capacityMW).toLocaleString()} MW approximate capacity`;
    stage.textContent = "Operating context feature";
    const nearestWater = nearestTo(coordinates, NORTH_TEXAS_WATER);
    water.textContent = `${nearestWater.item.name} · ${nearestWater.distance.toFixed(1)} mi`;
    power.textContent = props.name;
    note.textContent = "Plant capacity is approximate nameplate capacity; the map does not trace grid dispatch or a direct connection to data centers.";
  }
}

function applyStage(stage) {
  activeStage = stage;
  stageButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.stage === stage));
  updateMetrics();
  if (!atlasMap || !atlasMap.getLayer("data-centers")) return;
  const value = stageValueExpression(stage);
  atlasMap.setPaintProperty("data-centers", "circle-radius", ["interpolate", ["linear"], ["sqrt", value], 0, 0, 1, 6, 9, 16]);
  atlasMap.setPaintProperty("data-center-halos", "circle-radius", ["interpolate", ["linear"], ["sqrt", value], 0, 0, 1, 12, 9, 38]);
  atlasMap.setFilter("data-centers", [">", value, 0]);
  atlasMap.setFilter("data-center-halos", [">", value, 0]);
  atlasMap.setFilter("data-center-labels", [">", value, 0]);
}

function addAtlasLayers() {
  atlasMap.addSource("water-context", { type: "geojson", data: waterGeoJSON });
  atlasMap.addSource("power-context", { type: "geojson", data: powerGeoJSON });
  atlasMap.addSource("data-center-context", { type: "geojson", data: dataCenterGeoJSON });

  atlasMap.addLayer({ id: "water-halos", type: "circle", source: "water-context", paint: { "circle-radius": 18, "circle-color": "#41b7d8", "circle-opacity": 0.16 } });
  atlasMap.addLayer({ id: "water", type: "circle", source: "water-context", paint: { "circle-radius": 6, "circle-color": "#8ce6ff", "circle-stroke-color": "#081a1f", "circle-stroke-width": 1.5 } });
  atlasMap.addLayer({ id: "water-labels", type: "symbol", source: "water-context", layout: { "text-field": ["get", "name"], "text-size": 10, "text-offset": [0, 1.35], "text-anchor": "top", "text-allow-overlap": false }, paint: { "text-color": "#b9f2ff", "text-halo-color": "#101816", "text-halo-width": 1.5 } });

  atlasMap.addLayer({ id: "power", type: "circle", source: "power-context", paint: { "circle-radius": ["interpolate", ["linear"], ["get", "capacityMW"], 200, 6, 2500, 12], "circle-color": "#ffcc45", "circle-stroke-color": "#171309", "circle-stroke-width": 2 } });
  atlasMap.addLayer({ id: "power-labels", type: "symbol", source: "power-context", layout: { "text-field": ["get", "name"], "text-size": 10, "text-offset": [0, 1.45], "text-anchor": "top" }, paint: { "text-color": "#ffeaa4", "text-halo-color": "#101816", "text-halo-width": 1.5 } });

  atlasMap.addLayer({ id: "data-center-halos", type: "circle", source: "data-center-context", paint: { "circle-radius": ["interpolate", ["linear"], ["sqrt", ["get", "total"]], 1, 12, 9, 38], "circle-color": "#ff583d", "circle-opacity": 0.11 } });
  atlasMap.addLayer({ id: "data-centers", type: "circle", source: "data-center-context", paint: { "circle-radius": ["interpolate", ["linear"], ["sqrt", ["get", "total"]], 0, 0, 1, 6, 9, 16], "circle-color": ["match", ["get", "group"], "frontier", "#ff583d", "outlier", "#b38bff", "#f1f4e8"], "circle-opacity": 0.9, "circle-stroke-color": "#101816", "circle-stroke-width": 2 } });
  atlasMap.addLayer({ id: "data-center-labels", type: "symbol", source: "data-center-context", minzoom: 7, layout: { "text-field": ["get", "name"], "text-size": 11, "text-offset": [0, -1.45], "text-anchor": "bottom", "text-max-width": 12 }, paint: { "text-color": "#f4f6ee", "text-halo-color": "#101816", "text-halo-width": 1.7 } });

  ["data-centers", "water", "power"].forEach((layer) => {
    atlasMap.on("mouseenter", layer, () => { atlasMap.getCanvas().style.cursor = "pointer"; });
    atlasMap.on("mouseleave", layer, () => { atlasMap.getCanvas().style.cursor = ""; });
    atlasMap.on("click", layer, (event) => setSelection(event.features[0], layer));
  });
  applyStage(activeStage);
}

function initializeMap(token) {
  mapboxgl.accessToken = token;
  tokenGate.hidden = true;
  atlasMap = new mapboxgl.Map({
    container: "mapbox-map",
    style: "mapbox://styles/mapbox/dark-v11",
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    minZoom: 5.5,
    maxZoom: 13,
    attributionControl: false,
  });
  atlasMap.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-left");
  atlasMap.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-right");
  atlasMap.on("load", addAtlasLayers);
  atlasMap.on("error", (event) => {
    const status = event?.error?.status;
    if (status === 401 || status === 403) {
      tokenGate.hidden = false;
      tokenError.textContent = "That token was rejected. Check that it is a public Mapbox token and try again.";
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  });
}

document.querySelectorAll("[data-layer-toggle]").forEach((input) => {
  input.addEventListener("change", () => {
    if (!atlasMap) return;
    const group = input.dataset.layerToggle;
    const layerIds = group === "data-centers" ? ["data-center-halos", "data-centers", "data-center-labels"] : group === "water" ? ["water-halos", "water", "water-labels"] : ["power", "power-labels"];
    layerIds.forEach((id) => { if (atlasMap.getLayer(id)) atlasMap.setLayoutProperty(id, "visibility", input.checked ? "visible" : "none"); });
  });
});

stageButtons.forEach((button) => button.addEventListener("click", () => applyStage(button.dataset.stage)));

tokenForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const token = tokenInput.value.trim();
  if (!token.startsWith("pk.")) {
    tokenError.textContent = "Use a public token beginning with pk.";
    return;
  }
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  window.location.reload();
});

document.getElementById("atlas-source-list").innerHTML = MAPBOX_ATLAS_SOURCES.map((source) => `<li><a href="${source.url}" target="_blank" rel="noopener">${source.label}</a></li>`).join("");
updateMetrics();

const urlToken = new URLSearchParams(window.location.search).get("token");
const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
const configuredToken = window.MAPBOX_TOKEN || urlToken || storedToken;
if (configuredToken) initializeMap(configuredToken);
else tokenGate.hidden = false;
