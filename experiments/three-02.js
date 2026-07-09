import * as THREE from "./vendor/three.module.js";

const host = document.getElementById("pointcloud-canvas");
const telemetryEl = document.getElementById("pointcloud-hud-telemetry");
const modeLabelEl = document.getElementById("pointcloud-mode-label");
const modeStatusEl = document.getElementById("pointcloud-mode-status");
const groundConfEl = document.getElementById("pointcloud-ground-conf");
const canopyConfEl = document.getElementById("pointcloud-canopy-conf");
const seasonEl = document.getElementById("pointcloud-season");
const modeButtons = document.querySelectorAll("[data-mode]");

// Surface classes, encoded as a float attribute so the shader can branch cheaply.
// SOIL and STRUCTURE both count as "hardscape" (no sway, no season) but stay
// visually distinct in Classified mode: soil is priced land, structure is the
// built amenity — soil dims, structure stays crisp.
const SURFACE = { SOIL: 0, STRUCTURE: 0.3, STEM: 1, FOLIAGE: 2, BLOOM: 3 };
const MODE = { RAW: 0, CONFIDENCE: 1, CLASSIFIED: 2 };

const MODE_COPY = {
  raw: {
    label: "Raw scan",
    status: "Living material thins and fades as capture confidence drops; the cloud never sits still.",
  },
  confidence: {
    label: "Confidence map",
    status: "False color by capture certainty — red is guesswork, green is trusted geometry.",
  },
  classified: {
    label: "Classified (priced)",
    status: "Only the comparable parameters survive: paving, bench, ground. The garden is deleted.",
  },
};

// ---- procedural garden ---------------------------------------------------

const PALETTES = [
  { wood: 0x4a3c2c, leaf: 0x6f9b4a, bloom: 0xe987b5, hasBloom: true },
  { wood: 0x453824, leaf: 0x5b8f6b, bloom: 0xe3a83b, hasBloom: true },
  { wood: 0x3f3326, leaf: 0x4f7a55, bloom: 0x9b6bd1, hasBloom: true },
  { wood: 0x4a3c2c, leaf: 0x6d8f52, bloom: 0x6d8f52, hasBloom: false },
  { wood: 0x463a2a, leaf: 0x7fae5a, bloom: 0xd9e36b, hasBloom: true },
];

function mulberry32(seed) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildGarden() {
  const positions = [];
  const surfaces = [];
  const confidences = [];
  const phases = [];
  const heights = [];
  const colorA = [];
  const colorB = [];
  const sizes = [];

  let hardscapeConfSum = 0;
  let hardscapeCount = 0;
  let organicConfSum = 0;
  let organicCount = 0;

  function push(pos, surface, confidence, phase, height01, colA, colB, size) {
    positions.push(pos.x, pos.y, pos.z);
    surfaces.push(surface);
    confidences.push(confidence);
    phases.push(phase);
    heights.push(height01);
    colorA.push(colA.r, colA.g, colA.b);
    colorB.push(colB.r, colB.g, colB.b);
    sizes.push(size);

    if (surface < 0.5) {
      hardscapeConfSum += confidence;
      hardscapeCount += 1;
    } else {
      organicConfSum += confidence;
      organicCount += 1;
    }
  }

  const rng = mulberry32(20260708);
  const flat = new THREE.Color(0xdad2c2);
  const soil = new THREE.Color(0x5a4c36);

  // Soil disc — loosely scattered, decent but not perfect confidence.
  const soilRadius = 13;
  for (let i = 0; i < 9000; i++) {
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * soilRadius;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const y = (rng() - 0.5) * 0.06;
    const conf = 0.82 + rng() * 0.14;
    const c = soil.clone().offsetHSL(0, 0, (rng() - 0.5) * 0.08);
    push(new THREE.Vector3(x, y, z), SURFACE.SOIL, conf, rng() * 100, 0, c, c, 0.04);
  }

  // Paved patio — regular grid, the one surface a scanner resolves perfectly.
  const patioW = 5.4;
  const patioD = 3.6;
  const gridStep = 0.055;
  for (let x = -patioW / 2; x <= patioW / 2; x += gridStep) {
    for (let z = -patioD / 2; z <= patioD / 2; z += gridStep) {
      const conf = 0.96 + rng() * 0.04;
      const c = flat.clone().offsetHSL(0, 0, (rng() - 0.5) * 0.03);
      push(
        new THREE.Vector3(x + 4.2, 0.01, z - 5.4),
        SURFACE.STRUCTURE,
        conf,
        rng() * 100,
        0,
        c,
        c,
        0.045
      );
    }
  }

  // Bench — a simple box surface, the "amenity" that prices out easily.
  const benchColor = new THREE.Color(0x8a7a63);
  const bw = 1.4;
  const bd = 0.5;
  const bh = 0.42;
  const benchCenter = new THREE.Vector3(4.6, 0, -4.0);
  for (let i = 0; i < 1500; i++) {
    const face = Math.floor(rng() * 3);
    let x;
    let y;
    let z;
    if (face === 0) {
      x = (rng() - 0.5) * bw;
      z = (rng() - 0.5) * bd;
      y = bh;
    } else if (face === 1) {
      x = (rng() - 0.5) * bw;
      z = (rng() < 0.5 ? -1 : 1) * bd * 0.5;
      y = rng() * bh;
    } else {
      x = (rng() < 0.5 ? -1 : 1) * bw * 0.5;
      z = (rng() - 0.5) * bd;
      y = rng() * bh;
    }
    const conf = 0.94 + rng() * 0.05;
    const c = benchColor.clone().offsetHSL(0, 0, (rng() - 0.5) * 0.04);
    push(
      benchCenter.clone().add(new THREE.Vector3(x, y, z)),
      SURFACE.STRUCTURE,
      conf,
      rng() * 100,
      0,
      c,
      c,
      0.045
    );
  }

  // Plants — recursive branching stems with foliage/bloom clusters at the tips.
  const PLANT_COUNT = 48;
  for (let p = 0; p < PLANT_COUNT; p++) {
    const a = rng() * Math.PI * 2;
    const r = 2.2 + rng() * (soilRadius - 3);
    const base = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r);
    if (base.distanceTo(benchCenter) < 2.2) {
      base.addScaledVector(base.clone().normalize(), 2.5);
    }
    growPlant(base, rng, push);
  }

  function growPlant(basePos, rng, push) {
    const palette = PALETTES[Math.floor(rng() * PALETTES.length)];
    const wood = new THREE.Color(palette.wood);
    const leaf = new THREE.Color(palette.leaf);
    const bloom = new THREE.Color(palette.bloom);
    const maxHeight = 1.4 + rng() * 2.4;
    const phase = rng() * 1000;
    const maxDepth = 3;

    function branch(pos, dir, len, rad, depth) {
      const segments = Math.max(3, Math.floor(len * 18));
      let cur = pos.clone();
      for (let s = 0; s < segments; s++) {
        cur = cur.clone().addScaledVector(dir, len / segments);
        const jitter = new THREE.Vector3(
          (rng() - 0.5) * rad * 0.7,
          (rng() - 0.5) * rad * 0.3,
          (rng() - 0.5) * rad * 0.7
        );
        const point = cur.clone().add(jitter);
        const height01 = THREE.MathUtils.clamp(point.y / maxHeight, 0, 1);
        const occlusion = depth * 0.13 + rng() * 0.1;
        const conf = THREE.MathUtils.clamp(0.86 - occlusion, 0.2, 0.88);
        push(point, SURFACE.STEM, conf, phase, height01, wood, wood, 0.042 - depth * 0.004);
      }

      if (depth < maxDepth && len > 0.22) {
        const children = depth === 0 ? 3 + Math.floor(rng() * 2) : rng() < 0.7 ? 2 : 1;
        for (let c = 0; c < children; c++) {
          const axis = new THREE.Vector3(rng() - 0.5, rng() * 0.3, rng() - 0.5).normalize();
          const spread = 0.45 + rng() * 0.6;
          const newDir = dir.clone().applyAxisAngle(axis, spread);
          newDir.y += 0.25 + rng() * 0.3;
          newDir.normalize();
          branch(cur, newDir, len * (0.6 + rng() * 0.16), rad * 0.6, depth + 1);
        }
      } else if (rng() > 0.12) {
        // Missing-scan patches: some tips never resolve into a cluster at all.
        growCluster(cur, THREE.MathUtils.clamp(cur.y / maxHeight, 0, 1));
      }
    }

    function growCluster(center, height01) {
      const count = 55 + Math.floor(rng() * 95);
      for (let i = 0; i < count; i++) {
        const dir = new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize();
        const localOcclusion = rng() * 0.42;
        const rad = 0.32 * (1 + rng() * 0.4);
        const point = center.clone().addScaledVector(dir, rng() * rad);
        const isBloom = palette.hasBloom && rng() < 0.22;
        const conf = THREE.MathUtils.clamp((isBloom ? 0.4 : 0.56) - localOcclusion, 0.08, 0.6);
        push(
          point,
          isBloom ? SURFACE.BLOOM : SURFACE.FOLIAGE,
          conf,
          phase,
          height01,
          isBloom ? bloom : leaf,
          wood,
          isBloom ? 0.06 : 0.05
        );
      }
    }

    branch(basePos, new THREE.Vector3(0, 1, 0), 0.85 + rng() * 0.55, 0.09, 0);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aSurface", new THREE.Float32BufferAttribute(surfaces, 1));
  geometry.setAttribute("aConfidence", new THREE.Float32BufferAttribute(confidences, 1));
  geometry.setAttribute("aPhase", new THREE.Float32BufferAttribute(phases, 1));
  geometry.setAttribute("aHeight01", new THREE.Float32BufferAttribute(heights, 1));
  geometry.setAttribute("aColor", new THREE.Float32BufferAttribute(colorA, 3));
  geometry.setAttribute("aColorB", new THREE.Float32BufferAttribute(colorB, 3));
  geometry.setAttribute("aSize", new THREE.Float32BufferAttribute(sizes, 1));

  return {
    geometry,
    hardscapeConf: hardscapeCount ? hardscapeConfSum / hardscapeCount : 0,
    organicConf: organicCount ? organicConfSum / organicCount : 0,
  };
}

// ---- shaders --------------------------------------------------------------

const vertexShader = `
  attribute float aSurface;
  attribute float aConfidence;
  attribute float aPhase;
  attribute float aHeight01;
  attribute vec3 aColor;
  attribute vec3 aColorB;
  attribute float aSize;

  uniform float uTime;
  uniform float uSeasonAngle;
  uniform float uPixelRatio;

  varying float vSurface;
  varying float vConfidence;
  varying vec3 vColor;

  void main() {
    vec3 pos = position;

    float sf = 0.5 + 0.5 * sin(uSeasonAngle + aPhase * 0.6);
    float isOrganic = step(0.5, aSurface);

    // Ambient drift — a slow breathing common to every point; the hardscape
    // drifts barely at all, the garden drifts visibly, like a scan that
    // never quite sits still.
    float driftAmp = mix(0.008, 0.03, isOrganic);
    vec3 drift = vec3(
      sin(uTime * 0.35 + aPhase * 2.3),
      cos(uTime * 0.27 + aPhase * 1.9) * 0.6,
      sin(uTime * 0.31 + aPhase * 3.1)
    ) * driftAmp;
    pos += drift;

    float swayAmp = mix(0.015, 0.07, step(1.5, aSurface)) * aHeight01 * isOrganic;
    pos.x += sin(uTime * 0.9 + aPhase) * swayAmp;
    pos.z += cos(uTime * 0.7 + aPhase * 1.3) * swayAmp * 0.6;

    vec3 color = aColor;
    float sizeScale = 1.0;

    if (aSurface > 1.5) {
      color = mix(aColorB, aColor, sf);
      float leafGrow = mix(0.55, 1.0, sf);
      float bloomGate = smoothstep(0.3, 0.62, sf);
      sizeScale = mix(leafGrow, leafGrow * bloomGate, step(2.5, aSurface));
    } else if (aSurface > 0.5) {
      color = mix(aColorB * 0.85, aColor, 0.6 + 0.4 * sf);
    }

    vColor = color;
    vConfidence = aConfidence;
    vSurface = aSurface;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    float dist = max(-mvPosition.z, 1.0);
    gl_PointSize = aSize * sizeScale * uPixelRatio * (380.0 / dist);
  }
`;

const fragmentShader = `
  precision highp float;

  varying float vSurface;
  varying float vConfidence;
  varying vec3 vColor;

  uniform int uMode;

  void main() {
    // Square, hard-edged sprite — a pixel, not a soft dot.
    if (uMode == 2) {
      if (vSurface > 0.5) discard;
      // Soil (priced as lot area) reads as a dim wash; structure (patio, bench —
      // the billable amenity) stays crisp and near-opaque.
      float isStructure = step(0.15, vSurface);
      vec3 col = mix(vColor, vec3(0.86, 0.93, 0.96), 0.45);
      float alpha = mix(0.28, 0.95, isStructure);
      gl_FragColor = vec4(col, alpha);
      return;
    }

    if (uMode == 1) {
      vec3 low = vec3(0.92, 0.26, 0.2);
      vec3 high = vec3(0.35, 0.85, 0.45);
      gl_FragColor = vec4(mix(low, high, vConfidence), mix(0.55, 1.0, vConfidence));
      return;
    }

    vec3 col = mix(vColor * 0.5, vColor, vConfidence);
    gl_FragColor = vec4(col, mix(0.5, 1.0, vConfidence));
  }
`;

// ---- scene ------------------------------------------------------------

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  } catch (err) {
    host.classList.add("has-error");
    return;
  }
  if (!renderer.getContext()) {
    host.classList.add("has-error");
    return;
  }

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x0d0f0a, 1);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
  const target = new THREE.Vector3(0, 1.0, -1.0);

  const { geometry, hardscapeConf, organicConf } = buildGarden();

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSeasonAngle: { value: 0 },
      uPixelRatio: { value: pixelRatio },
      uMode: { value: MODE.RAW },
    },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  groundConfEl.textContent = `${Math.round(hardscapeConf * 100)}%`;
  canopyConfEl.textContent = `${Math.round(organicConf * 100)}%`;

  function resize() {
    const rect = host.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();

  // ---- orbit interaction ------------------------------------------------

  let yaw = 0.5;
  let pitch = -0.28;
  let radius = 10;
  let targetYaw = yaw;
  let targetPitch = pitch;
  let targetRadius = radius;
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let lastInteraction = performance.now();
  const MAX_PITCH = 1.35;
  const MIN_PITCH = -0.05;

  host.addEventListener("pointerdown", (event) => {
    isDragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    host.setPointerCapture(event.pointerId);
    lastInteraction = performance.now();
  });

  host.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;
    targetYaw -= dx * 0.006;
    targetPitch = THREE.MathUtils.clamp(targetPitch - dy * 0.006, MIN_PITCH, MAX_PITCH);
    lastInteraction = performance.now();
  });

  function stopDragging(event) {
    if (!isDragging) return;
    isDragging = false;
    try {
      host.releasePointerCapture(event.pointerId);
    } catch (err) {
      // pointer already released
    }
  }
  host.addEventListener("pointerup", stopDragging);
  host.addEventListener("pointercancel", stopDragging);

  host.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      targetRadius = THREE.MathUtils.clamp(targetRadius + event.deltaY * 0.01, 5, 20);
      lastInteraction = performance.now();
    },
    { passive: false }
  );

  // ---- mode selection -----------------------------------------------------

  function setMode(key) {
    const copy = MODE_COPY[key];
    if (!copy) return;
    material.uniforms.uMode.value = MODE[key.toUpperCase()];
    modeLabelEl.textContent = copy.label;
    modeStatusEl.textContent = copy.status;
    modeButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.mode === key));
  }

  modeButtons.forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });
  setMode("raw");

  // ---- render loop --------------------------------------------------------

  let frameCount = 0;
  let lastTime = performance.now();
  let seasonAngle = 0;

  function animate(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;
    frameCount += 1;

    material.uniforms.uTime.value += dt;
    seasonAngle += dt * 0.09;
    material.uniforms.uSeasonAngle.value = seasonAngle;

    if (!isDragging && now - lastInteraction > 5000) {
      targetYaw += dt * 0.04;
    }

    yaw += (targetYaw - yaw) * Math.min(1, dt * 5);
    pitch += (targetPitch - pitch) * Math.min(1, dt * 5);
    radius += (targetRadius - radius) * Math.min(1, dt * 5);

    camera.position.set(
      target.x + radius * Math.sin(yaw) * Math.cos(pitch),
      target.y + radius * Math.sin(pitch) + 1.4,
      target.z + radius * Math.cos(yaw) * Math.cos(pitch)
    );
    camera.lookAt(target);

    renderer.render(scene, camera);

    if (frameCount % 10 === 0) {
      const seasonPct = Math.round((0.5 + 0.5 * Math.sin(seasonAngle)) * 100);
      seasonEl.textContent = `${seasonPct}% bloomed`;
      telemetryEl.textContent = `BLOOM ${String(seasonPct).padStart(3, "0")}% / MODE ${modeLabelEl.textContent.toUpperCase()}`;
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

init();
