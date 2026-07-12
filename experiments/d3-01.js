const GROUP_COLOR = {
  core: "#2f7f89",
  frontier: "#b5501f",
  outlier: "#6b5b95",
};

const GROUP_LABEL = {
  core: "North metro core",
  frontier: "Southern frontier",
  outlier: "Far outlier",
};

// Ordered as a project's real lifecycle, left to right: filed, then building,
// then built. Slider value 0 = leftmost = earliest stage.
const STAGES = [
  { key: "planned", label: "Filed", sublabel: "Planned / land bank" },
  { key: "construction", label: "Building", sublabel: "Under construction" },
  { key: "operational", label: "Built", sublabel: "Operational" },
];

const host = document.getElementById("d3-canvas");
const readoutName = document.getElementById("d3-readout-name");
const readoutCount = document.getElementById("d3-readout-count");
const readoutNote = document.getElementById("d3-readout-note");
const stageSlider = document.getElementById("d3-stage-slider");
const stageLabel = document.getElementById("d3-stage-label");
const stageStat = document.getElementById("d3-stage-stat");
const playButton = document.getElementById("d3-stage-play");

let activeFilter = "all";
let stageIndex = 0;
let width = 0;
let height = 0;
let x, y, radius;
let svg, bubbleLayer, labelLayer;
let hoveredDatum = null;
let playTimer = null;

function measure() {
  const rect = host.getBoundingClientRect();
  width = Math.max(320, rect.width);
  height = Math.max(360, rect.height);
}

function buildScales() {
  const lonExtent = d3.extent(DFW_SUBMARKETS, (d) => d.lon);
  const latExtent = d3.extent(DFW_SUBMARKETS, (d) => d.lat);
  const lonPad = (lonExtent[1] - lonExtent[0]) * 0.14;
  const latPad = (latExtent[1] - latExtent[0]) * 0.14;

  x = d3.scaleLinear()
    .domain([lonExtent[0] - lonPad, lonExtent[1] + lonPad])
    .range([56, width - 24]);

  y = d3.scaleLinear()
    .domain([latExtent[0] - latPad, latExtent[1] + latPad])
    .range([height - 24, 40]);

  const maxAcrossStages = d3.max(DFW_SUBMARKETS, (d) => d.maxStage);
  radius = d3.scaleSqrt()
    .domain([0, maxAcrossStages])
    .range([0, 46]);
}

function currentStage() {
  return STAGES[stageIndex];
}

function stageValue(d) {
  return d.stages[currentStage().key];
}

function setReadout(d) {
  if (!d) {
    readoutName.textContent = "Hover a bubble";
    readoutCount.textContent = "—";
    readoutNote.textContent = "Facility counts are a text tally of named listings, not a certified inventory.";
    return;
  }
  const v = stageValue(d);
  readoutName.textContent = `${d.name} · ${GROUP_LABEL[d.group]}`;
  readoutCount.textContent = `${v} ${currentStage().sublabel.toLowerCase()} (${d.totalMentions} mentions across all stages)`;
  readoutNote.textContent = d.note || "No additional note in the source directory for this submarket.";
}

function applyFilter(group) {
  activeFilter = group;
  document.querySelectorAll("#d3-filters button").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.group === group);
  });
  updateStage();
}

function updateStageControls() {
  const stage = currentStage();
  stageSlider.value = stageIndex;
  stageLabel.textContent = `${stage.label} — ${stage.sublabel}`;
  const total = d3.sum(DFW_SUBMARKETS, (d) => stageValue(d));
  const places = DFW_SUBMARKETS.filter((d) => stageValue(d) > 0).length;
  stageStat.textContent = `${total} facilities named across ${places} places at this stage`;
}

function updateStage() {
  updateStageControls();
  const match = (d) => activeFilter === "all" || d.group === activeFilter;

  bubbleLayer.selectAll("circle.dfw-bubble")
    .data(DFW_SUBMARKETS, (d) => d.name)
    .join("circle")
    .attr("class", "dfw-bubble")
    .attr("cx", (d) => x(d.lon))
    .attr("cy", (d) => y(d.lat))
    .attr("fill", (d) => GROUP_COLOR[d.group])
    .classed("is-dimmed", (d) => !match(d))
    .on("mouseenter", (event, d) => {
      hoveredDatum = d;
      d3.select(event.currentTarget).classed("is-active", true);
      setReadout(d);
    })
    .on("mouseleave", (event, d) => {
      if (hoveredDatum === d) hoveredDatum = null;
      d3.select(event.currentTarget).classed("is-active", false);
      setReadout(null);
    })
    .transition().duration(420).ease(d3.easeCubicOut)
    .attr("r", (d) => radius(stageValue(d)));

  labelLayer.selectAll("text.dfw-bubble-label")
    .data(DFW_SUBMARKETS, (d) => d.name)
    .join("text")
    .attr("class", "dfw-bubble-label")
    .attr("x", (d) => x(d.lon))
    .attr("text-anchor", "middle")
    .classed("is-dimmed", (d) => !match(d))
    .text((d) => (stageValue(d) > 0 ? d.name.split(" (")[0] : ""))
    .transition().duration(420).ease(d3.easeCubicOut)
    .attr("y", (d) => y(d.lat) - radius(stageValue(d)) - 5)
    .style("opacity", (d) => (stageValue(d) > 0 ? 1 : 0));

  if (hoveredDatum) setReadout(hoveredDatum);
}

function render() {
  measure();
  buildScales();

  host.querySelectorAll("svg").forEach((el) => el.remove());
  svg = d3.select(host)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const gridLayer = svg.append("g").attr("class", "d3-grid");
  const gridStep = 40;
  for (let gx = 0; gx < width; gx += gridStep) {
    gridLayer.append("line")
      .attr("x1", gx).attr("x2", gx).attr("y1", 0).attr("y2", height)
      .attr("stroke", "rgba(22,36,31,0.05)");
  }
  for (let gy = 0; gy < height; gy += gridStep) {
    gridLayer.append("line")
      .attr("x1", 0).attr("x2", width).attr("y1", gy).attr("y2", gy)
      .attr("stroke", "rgba(22,36,31,0.05)");
  }

  svg.append("text")
    .attr("x", width - 18).attr("y", 26)
    .attr("text-anchor", "end")
    .attr("font-family", "Courier New, monospace")
    .attr("font-size", 11)
    .attr("fill", "rgba(22,36,31,0.55)")
    .text("N ↑   DFW metro, not to scale");

  bubbleLayer = svg.append("g").attr("class", "d3-bubbles");
  labelLayer = svg.append("g").attr("class", "d3-bubble-labels");

  updateStage();
}

function renderStatTiles() {
  const el = document.getElementById("d3-stat-tiles");
  const tiles = [
    ["Facilities listed", DFW_MARKET_STATS.facilities],
    ["Providers", DFW_MARKET_STATS.providers],
    ["Under construction", `${DFW_MARKET_STATS.underConstructionSites} sites`],
    ["Power growth", `${DFW_MARKET_STATS.powerGrowthSince2022} since '22`],
  ];
  el.innerHTML = tiles.map(([label, value]) => `
    <div class="stat-tile">
      <dt>${label}</dt>
      <dd>${value}</dd>
    </div>
  `).join("");
}

function renderMarketCompare() {
  const el = document.getElementById("d3-market-compare");
  el.innerHTML = DFW_MARKET_STATS.reports.map((r) => `
    <div class="market-compare-row">
      <div class="source-name">${r.source}</div>
      <div>${r.inventoryGW} GW existing &middot; ${r.underConstructionMW} MW building &middot; ${r.plannedGW} GW planned</div>
      <div>${r.rank}</div>
    </div>
  `).join("") + `
    <div class="market-compare-row">
      <div class="source-name">Largest single facility</div>
      <div>${DFW_MARKET_STATS.largestFacility.name} &mdash; ${DFW_MARKET_STATS.largestFacility.mw} MW</div>
    </div>
    <div class="market-compare-row">
      <div class="source-name">Undisclosed locations</div>
      <div>${DFW_UNDISCLOSED_COUNT} additional planned/land-bank filings carry no public address and are omitted from the map above.</div>
    </div>
  `;
}

function renderProviderBars() {
  const el = document.getElementById("d3-provider-bars");
  const max = d3.max(DFW_MARKET_STATS.topProviders, (p) => p.operationalMW);
  el.innerHTML = DFW_MARKET_STATS.topProviders.map((p) => `
    <div class="provider-bar-row">
      <div class="provider-bar-label"><span>${p.name}</span><span>${p.operationalMW} MW &middot; ${p.sites} sites</span></div>
      <div class="provider-bar-track"><div class="provider-bar-fill" style="width:${(p.operationalMW / max) * 100}%"></div></div>
    </div>
  `).join("");
}

function renderSources() {
  const el = document.getElementById("d3-source-list");
  el.innerHTML = DFW_SOURCES.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></li>`).join("");
}

document.querySelectorAll("#d3-filters button").forEach((btn) => {
  btn.addEventListener("click", () => applyFilter(btn.dataset.group));
});

stageSlider.addEventListener("input", () => {
  stageIndex = +stageSlider.value;
  updateStage();
});

playButton.addEventListener("click", () => {
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
    playButton.textContent = "▶ Play lifecycle";
    playButton.classList.remove("is-active");
    return;
  }
  playButton.textContent = "■ Stop";
  playButton.classList.add("is-active");
  playTimer = setInterval(() => {
    stageIndex = (stageIndex + 1) % STAGES.length;
    updateStage();
  }, 1600);
});

window.addEventListener("resize", () => {
  clearTimeout(window.__d3ResizeT);
  window.__d3ResizeT = setTimeout(render, 120);
});

renderStatTiles();
renderMarketCompare();
renderProviderBars();
renderSources();
render();
