const INTEREST_NODES = [
  { id: "observe", label: "Observe", type: "move", size: 29, description: "A recurring move: attend to how environments become visible through images, sensors, scans, and embodied looking." },
  { id: "map", label: "Map", type: "move", size: 29, description: "A recurring move: trace relationships across space, infrastructure, data, and territory without pretending the map is neutral." },
  { id: "make", label: "Make", type: "move", size: 29, description: "A recurring move: use prototypes, code, images, and interfaces to find the question—not just present an answer." },
  { id: "question", label: "Question", type: "move", size: 29, description: "A recurring move: ask who and what a technical system reveals, classifies, serves, excludes, or leaves unresolved." },
  { id: "visual", label: "Visual communication", type: "field", size: 19, description: "Using typography, image, sequence, and interface to make ideas legible—and to examine how legibility is produced." },
  { id: "image", label: "Image systems", type: "method", size: 17, description: "Glitch, collage, photography, and generative image-making as both visual material and technical system." },
  { id: "research", label: "Making as research", type: "field", size: 19, description: "Moving between disciplinary languages and learning through iterative experiments rather than a predetermined result." },
  { id: "public", label: "Public life", type: "question", size: 17, description: "Who encounters a system, who benefits from it, and how its effects enter shared civic space." },
  { id: "evidence", label: "Data as evidence", type: "method", size: 16, description: "Treating data as situated and constructed while still using it to locate patterns and make arguments." },
  { id: "urban", label: "Urban systems", type: "field", size: 21, description: "Cities understood as overlapping material, political, ecological, and informational systems." },
  { id: "computation", label: "Spatial computation", type: "method", size: 21, description: "Code as a medium for investigating, representing, and transforming spatial relationships." },
  { id: "infrastructure", label: "Infrastructure", type: "field", size: 18, description: "The physical and digital systems that quietly organize territory, energy, access, and daily life." },
  { id: "geodata", label: "Geodata", type: "method", size: 18, description: "Maps and location data used as interpretive material rather than neutral background." },
  { id: "sensing", label: "Sensing & surveillance", type: "question", size: 19, description: "How machine vision, scanning, and remote sensing decide what becomes visible, measurable, or classifiable." },
  { id: "ecology", label: "Ecology & gardens", type: "question", size: 17, description: "Living systems as sites of cultivation, uncertainty, seasonal change, and resistance to clean classification." },
  { id: "representation", label: "Politics of representation", type: "question", size: 20, description: "Every map, image, and model includes some realities while pushing others outside the frame." },
  { id: "tools", label: "Tools that think", type: "question", size: 17, description: "What happens when software is treated not only as production machinery, but as a partner in inquiry?" },
  { id: "web", label: "Interactive web", type: "method", size: 17, description: "The browser as a public studio for spatial, visual, and data-driven experiments." },
  { id: "questions-through-making", label: "Questions through making", type: "pedagogy", size: 20, description: "A shared current: RISD frames making as a reflective way to develop theoretical questions; CDP treats methods and practices as mutually formative." },
  { id: "operative-representation", label: "Operative representation", type: "pedagogy", size: 20, description: "Drawing, modeling, mapping, and visualization do not merely describe a project. Across both pedagogies, they actively produce what can be thought and designed." },
  { id: "matter-model", label: "Matter ↔ model", type: "pedagogy", size: 20, description: "RISD’s material and technical formation meets CDP’s computational modeling, simulation, sensing, and responsive systems: physical consequences remain inside the model." },
  { id: "project-planet", label: "Project ↔ planet", type: "pedagogy", size: 20, description: "RISD moves from architectural problems toward urban and environmental concerns; CDP explicitly works from the scale of the project to that of the planet." },
  { id: "situated-tools", label: "Situated tools", type: "pedagogy", size: 20, description: "Ethical and social responsibility in architectural practice meets CDP’s insistence that tools, data, and technology are never neutral." },
  { id: "independent-position", label: "Independent position", type: "pedagogy", size: 20, description: "Both trajectories culminate in self-directed work: RISD’s degree project and CDP’s three-semester research problem and Design in Action capstone." },
  { id: "scale-material", label: "Material", type: "scale", size: 18, description: "Scale of inquiry: matter, assemblies, surfaces, and the physical behavior of what is made." },
  { id: "scale-building", label: "Building", type: "scale", size: 18, description: "Scale of inquiry: spatial organization, performance, occupation, and constructed systems." },
  { id: "scale-city", label: "City", type: "scale", size: 18, description: "Scale of inquiry: urban form, institutions, public life, and interacting technical systems." },
  { id: "scale-territory", label: "Territory", type: "scale", size: 18, description: "Scale of inquiry: infrastructures, landscapes, resource flows, and regions that exceed the city." },
  { id: "scale-planet", label: "Planet", type: "scale", size: 18, description: "Scale of inquiry: planetary computation, climate, extraction, and the cumulative reach of designed systems." },
];

const INTEREST_LINKS = [
  ["observe", "image"], ["observe", "sensing"], ["observe", "ecology"], ["observe", "evidence"],
  ["map", "geodata"], ["map", "urban"], ["map", "infrastructure"], ["map", "representation"],
  ["make", "visual"], ["make", "research"], ["make", "computation"], ["make", "web"], ["make", "tools"],
  ["question", "public"], ["question", "sensing"], ["question", "representation"], ["question", "ecology"], ["question", "tools"],
  ["questions-through-making", "make"], ["questions-through-making", "research"], ["questions-through-making", "tools"],
  ["operative-representation", "observe"], ["operative-representation", "map"], ["operative-representation", "visual"], ["operative-representation", "geodata"],
  ["matter-model", "make"], ["matter-model", "computation"], ["matter-model", "infrastructure"], ["matter-model", "sensing"],
  ["project-planet", "map"], ["project-planet", "urban"], ["project-planet", "ecology"], ["project-planet", "infrastructure"],
  ["situated-tools", "question"], ["situated-tools", "representation"], ["situated-tools", "evidence"], ["situated-tools", "public"],
  ["independent-position", "make"], ["independent-position", "question"], ["independent-position", "research"],
  ["scale-material", "observe"], ["scale-material", "make"], ["scale-material", "matter-model"], ["scale-material", "ecology"],
  ["scale-building", "make"], ["scale-building", "computation"], ["scale-building", "infrastructure"], ["scale-building", "matter-model"],
  ["scale-city", "map"], ["scale-city", "question"], ["scale-city", "urban"], ["scale-city", "public"],
  ["scale-territory", "map"], ["scale-territory", "geodata"], ["scale-territory", "infrastructure"], ["scale-territory", "project-planet"],
  ["scale-planet", "question"], ["scale-planet", "ecology"], ["scale-planet", "project-planet"], ["scale-planet", "situated-tools"],
  ["scale-material", "scale-building"], ["scale-building", "scale-city"], ["scale-city", "scale-territory"], ["scale-territory", "scale-planet"],
  ["visual", "image"], ["visual", "web"], ["visual", "representation"], ["research", "tools"],
  ["research", "computation"], ["image", "sensing"], ["image", "web"], ["research", "evidence"],
  ["research", "public"], ["research", "urban"], ["public", "urban"], ["public", "infrastructure"],
  ["evidence", "geodata"], ["evidence", "sensing"], ["urban", "geodata"], ["urban", "ecology"],
  ["computation", "tools"], ["computation", "web"], ["computation", "sensing"],
  ["infrastructure", "geodata"], ["infrastructure", "sensing"], ["geodata", "representation"],
  ["sensing", "representation"], ["sensing", "ecology"], ["ecology", "representation"],
  ["tools", "web"], ["tools", "representation"]
].map(([source, target]) => ({ source, target }));

const TYPE_COLOR = { move: "#f0b429", field: "#2f7f89", method: "#cb5b36", question: "#765b9e", pedagogy: "#78a641", scale: "#3d84a8" };
const TYPE_LABEL = { move: "Recurring move", field: "Field of practice", method: "Method / medium", question: "Question / stake", pedagogy: "Pedagogical current", scale: "Scale of inquiry" };

const host = document.getElementById("interest-canvas");
const nameEl = document.getElementById("interest-name");
const typeEl = document.getElementById("interest-type");
const descriptionEl = document.getElementById("interest-description");
const relatedEl = document.getElementById("interest-related");
let simulation;
let activeMove = "all";
let selectedId = null;

function neighborsOf(id) {
  return INTEREST_LINKS.flatMap((link) => {
    const source = typeof link.source === "object" ? link.source.id : link.source;
    const target = typeof link.target === "object" ? link.target.id : link.target;
    if (source === id) return [target];
    if (target === id) return [source];
    return [];
  });
}

function selectNode(node, nodeSelection, linkSelection) {
  selectedId = node ? node.id : null;
  const neighbors = node ? new Set([node.id, ...neighborsOf(node.id)]) : null;
  nodeSelection.classed("is-muted", (d) => neighbors && !neighbors.has(d.id));
  linkSelection.classed("is-highlighted", (d) => node && (d.source.id === node.id || d.target.id === node.id))
    .classed("is-muted", (d) => node && d.source.id !== node.id && d.target.id !== node.id);

  if (!node) {
    typeEl.textContent = "Working premise";
    nameEl.textContent = "A practice between fields";
    descriptionEl.textContent = "Select a node to see why it belongs here and which ideas sit beside it.";
    relatedEl.textContent = "everything, for now";
    return;
  }

  const related = neighborsOf(node.id).map((id) => INTEREST_NODES.find((item) => item.id === id).label);
  typeEl.textContent = TYPE_LABEL[node.type];
  nameEl.textContent = node.label;
  descriptionEl.textContent = node.description;
  relatedEl.textContent = related.join(" · ");
}

function targetX(d, width) {
  if (d.type === "scale") return width * 0.5;
  if (d.id === "observe" || d.id === "make") return width * 0.22;
  if (d.id === "map" || d.id === "question") return width * 0.78;
  return width * 0.5;
}

function targetY(d, height) {
  const scaleOrder = ["scale-material", "scale-building", "scale-city", "scale-territory", "scale-planet"];
  const scaleIndex = scaleOrder.indexOf(d.id);
  if (scaleIndex >= 0) return height * (0.14 + scaleIndex * 0.18);
  if (d.id === "observe" || d.id === "map") return height * 0.24;
  if (d.id === "make" || d.id === "question") return height * 0.76;
  return height * 0.5;
}

function render() {
  const rect = host.getBoundingClientRect();
  const width = Math.max(320, rect.width);
  const height = Math.max(520, rect.height);
  host.querySelectorAll("svg").forEach((element) => element.remove());
  if (simulation) simulation.stop();

  const nodes = INTEREST_NODES.map((d) => ({ ...d }));
  const links = INTEREST_LINKS.map((d) => ({ source: typeof d.source === "object" ? d.source.id : d.source, target: typeof d.target === "object" ? d.target.id : d.target }));
  const svg = d3.select(host).append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("role", "img");
  svg.append("title").text("A force-directed map of recurring moves, fields, methods, questions, pedagogies, and scales of inquiry.");
  const linkSelection = svg.append("g").attr("class", "interest-links").selectAll("line").data(links).join("line");
  const nodeSelection = svg.append("g").attr("class", "interest-nodes").selectAll("g").data(nodes).join("g")
    .attr("class", (d) => `interest-node is-${d.type}`).attr("tabindex", 0).attr("role", "button")
    .attr("aria-label", (d) => `${d.label}, ${TYPE_LABEL[d.type]}`)
    .on("click", (event, d) => selectNode(selectedId === d.id ? null : d, nodeSelection, linkSelection))
    .on("keydown", (event, d) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectNode(selectedId === d.id ? null : d, nodeSelection, linkSelection); } });

  nodeSelection.append("circle").attr("r", (d) => d.size).attr("fill", (d) => TYPE_COLOR[d.type]);
  nodeSelection.append("text").attr("class", "interest-label").attr("text-anchor", "middle").attr("dy", (d) => d.size + 15).text((d) => d.label);
  nodeSelection.filter((d) => d.type === "move").append("text").attr("class", "interest-move-mark").attr("text-anchor", "middle").attr("dy", 4).text((d) => d.label.slice(0, 1));

  simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((d) => d.id).distance((d) => d.source.type === "move" || d.target.type === "move" || d.source.type === "scale" || d.target.type === "scale" ? 108 : 76).strength(0.42))
    .force("charge", d3.forceManyBody().strength(-235))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius((d) => d.size + 34).iterations(2))
    .force("x", d3.forceX((d) => targetX(d, width)).strength((d) => d.type === "move" ? 0.17 : d.type === "scale" ? 0.11 : 0.025))
    .force("y", d3.forceY((d) => targetY(d, height)).strength((d) => d.type === "move" ? 0.16 : d.type === "scale" ? 0.11 : 0.02))
    .on("tick", () => {
      nodes.forEach((d) => { d.x = Math.max(d.size + 46, Math.min(width - d.size - 46, d.x)); d.y = Math.max(d.size + 28, Math.min(height - d.size - 34, d.y)); });
      linkSelection.attr("x1", (d) => d.source.x).attr("y1", (d) => d.source.y).attr("x2", (d) => d.target.x).attr("y2", (d) => d.target.y);
      nodeSelection.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

  nodeSelection.call(d3.drag()
    .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
    .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
    .on("end", (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }));

  function applyMoveFilter(move) {
    activeMove = move;
    const visibleIds = move === "all" ? null : new Set([move, ...neighborsOf(move)]);
    nodeSelection.classed("is-filtered", (d) => visibleIds && !visibleIds.has(d.id));
    linkSelection.classed("is-filtered", (d) => visibleIds && d.source.id !== move && d.target.id !== move);
    document.querySelectorAll("#interest-filters button").forEach((button) => button.classList.toggle("is-active", button.dataset.move === move));
    const moveNode = nodes.find((d) => d.id === move);
    selectNode(moveNode || null, nodeSelection, linkSelection);
  }

  document.querySelectorAll("#interest-filters button").forEach((button) => { button.onclick = () => applyMoveFilter(button.dataset.move); });
  document.getElementById("interest-reset").onclick = () => { applyMoveFilter("all"); simulation.alpha(0.8).restart(); };
  if (activeMove !== "all") applyMoveFilter(activeMove);
}

let resizeTimer;
window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(render, 140); });
render();
