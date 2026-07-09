import * as THREE from "./vendor/three.module.js";

const host = document.getElementById("panopticon-canvas");
const telemetryEl = document.getElementById("panopticon-hud-telemetry");
const feedLabelEl = document.getElementById("panopticon-feed-label");
const feedStatusEl = document.getElementById("panopticon-feed-status");
const faceButtons = document.querySelectorAll("[data-face]");
const assembleButton = document.getElementById("panopticon-assemble");
const sourceListEl = document.getElementById("panopticon-source-list");

const MAX_PITCH = Math.PI / 2 - 0.01;

const IMAGE_SOURCES = [
  { mode: "CCTV", caption: "Congestion-charge CCTV mast, Pimlico, London", author: "Genesis12", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:CCTV_CC_London_Pimlico.JPG" },
  { mode: "Satellite", caption: "London, Copernicus Sentinel-2 overhead pass", author: "ESA / Copernicus Sentinel-2", license: "CC BY-SA 3.0 IGO", page: "https://commons.wikimedia.org/wiki/File:London_by_Sentinel-2.jpg" },
  { mode: "Dashcam", caption: "Street-level gridlock, Trafalgar Square, London", author: "Oliver Dixon", license: "CC BY-SA 2.0", page: "https://commons.wikimedia.org/wiki/File:Gridlock_at_Trafalgar_Square_-_geograph.org.uk_-_4864080.jpg" },
  { mode: "Thermal Imaging", caption: "The Ivy Brasserie, Covent Garden, London, in thermal infrared", author: "David Skinner", license: "CC BY 2.0", page: "https://commons.wikimedia.org/wiki/File:The_Ivy_Brasserie,_Covent_Garden,_London,_in_Thermal_Infrared_(27727514635).jpg" },
  { mode: "LiDAR Scan", caption: "LiDAR point cloud, Folsom & Dore St, San Francisco — no open London street scan was available, so a real intersection scan stands in", author: "Daniel L. Lu", license: "CC BY 4.0", page: "https://commons.wikimedia.org/wiki/File:Ouster_OS1-64_lidar_point_cloud_of_intersection_of_Folsom_and_Dore_St,_San_Francisco.png" },
  { mode: "Photogrammetry Model", caption: "Photogrammetry 3D city model of London", author: "AccuCities", license: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:Photogrammetry_3D_city_model_of_London.jpg" },
];

if (sourceListEl) {
  IMAGE_SOURCES.forEach((source) => {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.page;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `${source.mode} — ${source.caption}`;
    item.appendChild(link);
    const meta = document.createElement("span");
    meta.textContent = ` (${source.author}, ${source.license})`;
    item.appendChild(meta);
    sourceListEl.appendChild(item);
  });
}

// ---- shared GLSL fragments -------------------------------------------

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentHeader = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uGlitch;
  uniform sampler2D uImage;
  uniform float uImageAspect;
`;

const noiseGLSL = `
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      v += amp * noise(p);
      p *= 2.0;
      amp *= 0.5;
    }
    return v;
  }

  // Crops the image to cover a 1:1 face, like CSS background-size: cover.
  vec2 coverUv(vec2 uv, float imageAspect) {
    vec2 c = uv - 0.5;
    if (imageAspect >= 1.0) {
      c.x *= imageAspect;
    } else {
      c.y /= imageAspect;
    }
    return c + 0.5;
  }
`;

function buildFragmentShader(mainBody) {
  return `${fragmentHeader}${noiseGLSL}
    void main() {
      ${mainBody}
    }
  `;
}

// One real, situated photograph per cube face, restyled toward its
// surveillance mode. uImage/uImageAspect are set once each texture loads.
const FACE_SHADERS = {
  // +X — LiDAR Scan (Ouster OS1-64 point cloud, San Francisco intersection)
  px: `
    vec2 uv = coverUv(vUv, uImageAspect);
    vec3 col = texture2D(uImage, uv).rgb;
    col *= vec3(0.85, 1.05, 1.2);
    float sparkle = step(0.997, hash(vUv * 500.0 + uTime * 10.0));
    col += vec3(0.6, 0.9, 1.0) * sparkle * 0.5;
    col = mix(col, vec3(1.0, 0.3, 0.9), uGlitch * 0.4);
    gl_FragColor = vec4(col, 1.0);
  `,
  // -X — Photogrammetry Model (AccuCities 3D city model of London)
  nx: `
    vec2 uv = coverUv(vUv, uImageAspect);
    vec3 col = texture2D(uImage, uv).rgb;
    vec2 gv = vUv * 18.0;
    vec2 f = fract(gv);
    float diagEdge = smoothstep(0.02, 0.0, abs(f.x - f.y));
    float edge = step(f.x, 0.02) + step(f.y, 0.02) + step(0.98, f.x) + step(0.98, f.y);
    vec3 wire = vec3(0.05, 0.95, 0.75);
    float wireMask = clamp(edge + diagEdge, 0.0, 1.0) * (0.32 + uGlitch * 0.45);
    col = mix(col, wire, wireMask);
    gl_FragColor = vec4(col, 1.0);
  `,
  // +Y — Satellite (Copernicus Sentinel-2 overhead pass, London)
  py: `
    vec2 uv = coverUv(vUv, uImageAspect);
    vec3 col = texture2D(uImage, uv).rgb;
    vec2 grid = fract(vUv * 24.0);
    float lines = step(grid.x, 0.015) + step(grid.y, 0.015);
    col += vec3(0.1, 0.6, 0.6) * lines * 0.22;
    col = mix(col, vec3(1.0, 0.3, 0.2), uGlitch * step(0.98, hash(vUv * 60.0 + uTime)));
    gl_FragColor = vec4(col, 1.0);
  `,
  // -Y — Thermal Imaging (The Ivy Brasserie, Covent Garden, in thermal infrared)
  ny: `
    vec2 uv = coverUv(vUv, uImageAspect);
    vec3 col = texture2D(uImage, uv).rgb;
    col = (col - 0.5) * 1.12 + 0.5;
    col = mix(col, vec3(1.0) - col, uGlitch * 0.6);
    gl_FragColor = vec4(col, 1.0);
  `,
  // +Z — CCTV (congestion-charge camera mast, Pimlico, London)
  pz: `
    vec2 uv = coverUv(vUv, uImageAspect);
    float tearAmt = 0.02 + uGlitch * 0.25;
    float tearLine = step(0.985, hash(vec2(floor(vUv.y * 40.0), floor(uTime * 5.0))));
    uv.x += tearLine * tearAmt * (hash(vec2(floor(vUv.y * 40.0), uTime)) - 0.5);
    vec3 img = texture2D(uImage, uv).rgb;
    float lum = dot(img, vec3(0.299, 0.587, 0.114));
    vec3 col = vec3(0.03, lum * 0.85 + 0.07, 0.08);
    float grain = (hash(vUv * 900.0 + fract(uTime)) - 0.5) * 0.06;
    col += grain;
    float vign = smoothstep(0.95, 0.25, length(vUv - 0.5));
    col *= vign;
    vec2 corner = abs(vUv - vec2(0.06, 0.94));
    float tick = step(corner.x, 0.0015) + step(corner.y, 0.0015);
    col += vec3(0.1, 0.9, 0.3) * tick * step(corner.x, 0.05) * step(corner.y, 0.05);
    gl_FragColor = vec4(col, 1.0);
  `,
  // -Z — Dashcam (street-level gridlock, Trafalgar Square, London)
  nz: `
    vec2 uv = coverUv(vUv, uImageAspect);
    vec3 col = texture2D(uImage, uv).rgb;
    vec2 c = vUv - 0.5;
    float ring1 = smoothstep(0.16, 0.15, length(c)) - smoothstep(0.1, 0.09, length(c));
    float crossMark = (step(abs(c.x), 0.006) + step(abs(c.y), 0.006)) * step(length(c), 0.2);
    col += vec3(0.1, 1.0, 0.4) * (ring1 + crossMark) * 0.6;
    float vign = smoothstep(1.0, 0.4, length(vUv - 0.5));
    col *= mix(0.78, 1.0, vign);
    col = mix(col, vec3(1.0, 0.2, 0.1), uGlitch * step(0.985, hash(vUv * 300.0 + uTime * 40.0)));
    gl_FragColor = vec4(col, 1.0);
  `,
};

const FACE_ASSETS = {
  px: "assets/three-01/lidar-sf-intersection.jpg",
  nx: "assets/three-01/photogrammetry-london-city.jpg",
  py: "assets/three-01/satellite-sentinel2.jpg",
  ny: "assets/three-01/thermal-ivy-covent-garden.jpg",
  pz: "assets/three-01/cctv-pimlico.jpg",
  nz: "assets/three-01/dashcam-trafalgar.jpg",
};

const FACES = {
  px: { label: "LiDAR Scan", status: "Point cloud, a street intersection in San Francisco.", dir: new THREE.Vector3(1, 0, 0) },
  nx: { label: "Photogrammetry Model", status: "AccuCities 3D city model of London, wireframed.", dir: new THREE.Vector3(-1, 0, 0) },
  py: { label: "Satellite", status: "Copernicus Sentinel-2 overhead pass, London.", dir: new THREE.Vector3(0, 1, 0) },
  ny: { label: "Thermal Imaging", status: "The Ivy Brasserie, Covent Garden, in thermal infrared.", dir: new THREE.Vector3(0, -1, 0) },
  pz: { label: "CCTV", status: "Congestion-charge camera mast, Pimlico, London.", dir: new THREE.Vector3(0, 0, 1) },
  nz: { label: "Dashcam", status: "Street-level gridlock, Trafalgar Square, London.", dir: new THREE.Vector3(0, 0, -1) },
};

function yawPitchForDir(dir) {
  const pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));
  const yaw = Math.atan2(-dir.x, -dir.z);
  return { yaw, pitch: THREE.MathUtils.clamp(pitch, -MAX_PITCH, MAX_PITCH) };
}

Object.keys(FACES).forEach((key) => {
  Object.assign(FACES[key], yawPitchForDir(FACES[key].dir));
});

// ---- post-process pass -------------------------------------------------

const postVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const postFragmentShader = `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uScene;
  uniform float uTime;
  uniform float uGlitch;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 uv = vUv;
    float tear = (hash(vec2(floor(uv.y * 30.0), floor(uTime * 10.0))) - 0.5) * uGlitch * 0.06;
    uv.x += tear;
    float ab = 0.0025 + uGlitch * 0.01;
    vec3 col;
    col.r = texture2D(uScene, uv + vec2(ab, 0.0)).r;
    col.g = texture2D(uScene, uv).g;
    col.b = texture2D(uScene, uv - vec2(ab, 0.0)).b;
    float scan = sin(uv.y * 800.0) * 0.02;
    col -= scan;
    float vign = smoothstep(1.0, 0.35, length(vUv - 0.5));
    col *= mix(0.7, 1.0, vign);
    float flash = uGlitch * 0.15 * step(0.5, hash(vec2(floor(uTime * 30.0), 1.0)));
    col += flash;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// ---- scene setup ---------------------------------------------------------

function lerpAngle(current, target, t) {
  const twoPi = Math.PI * 2;
  let diff = ((target - current + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
  return current + diff * t;
}

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch (err) {
    host.classList.add("has-error");
    return;
  }
  if (!renderer.getContext()) {
    host.classList.add("has-error");
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
  camera.rotation.order = "YXZ";

  const sharedUniforms = {
    uTime: { value: 0 },
    uGlitch: { value: 0 },
  };

  const placeholderTexture = new THREE.DataTexture(new Uint8Array([18, 20, 18, 255]), 1, 1);
  placeholderTexture.needsUpdate = true;

  let pendingTextures = 0;
  const loadingManager = new THREE.LoadingManager();
  const textureLoader = new THREE.TextureLoader(loadingManager);

  const materialOrder = ["px", "nx", "py", "ny", "pz", "nz"];
  const materials = materialOrder.map((key) => {
    const uniforms = {
      uTime: sharedUniforms.uTime,
      uGlitch: sharedUniforms.uGlitch,
      uImage: { value: placeholderTexture },
      uImageAspect: { value: 1 },
    };
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader: buildFragmentShader(FACE_SHADERS[key]),
      side: THREE.BackSide,
    });
    pendingTextures += 1;
    textureLoader.load(FACE_ASSETS[key], (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      uniforms.uImageAspect.value = texture.image.width / texture.image.height;
      uniforms.uImage.value = texture;
      pendingTextures -= 1;
      if (pendingTextures === 0) {
        host.classList.remove("is-loading");
      }
    });
    return material;
  });

  host.classList.add("is-loading");
  telemetryEl.textContent = "LOADING FEEDS…";

  const room = new THREE.Mesh(new THREE.BoxGeometry(60, 60, 60), materials);
  scene.add(room);

  const probePosition = new THREE.Vector3(0, 0, -4);
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(128, {
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
  });
  const cubeCamera = new THREE.CubeCamera(0.1, 50, cubeRenderTarget);
  cubeCamera.position.copy(probePosition);
  scene.add(cubeCamera);

  const probe = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.9, 2),
    new THREE.MeshStandardMaterial({
      envMap: cubeRenderTarget.texture,
      roughness: 0.18,
      metalness: 1,
      color: 0xffffff,
    })
  );
  probe.position.copy(probePosition);
  scene.add(probe);

  scene.add(new THREE.HemisphereLight(0xbfe6ff, 0x0a0806, 0.8));
  const probeLight = new THREE.PointLight(0x9fe0ff, 2, 12);
  probeLight.position.set(1.5, 2, -2.5);
  scene.add(probeLight);

  let sceneRT = new THREE.WebGLRenderTarget(2, 2);
  const postScene = new THREE.Scene();
  const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uScene: { value: sceneRT.texture },
      uTime: sharedUniforms.uTime,
      uGlitch: sharedUniforms.uGlitch,
    },
    vertexShader: postVertexShader,
    fragmentShader: postFragmentShader,
    depthTest: false,
    depthWrite: false,
  });
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMaterial));

  function resize() {
    const rect = host.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    sceneRT.dispose();
    sceneRT = new THREE.WebGLRenderTarget(w, h);
    postMaterial.uniforms.uScene.value = sceneRT.texture;
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();

  // ---- interaction ------------------------------------------------------

  let yaw = 0;
  let pitch = 0;
  let targetYaw = 0;
  let targetPitch = 0;
  let lockedFace = null;
  let isDragging = false;
  let dragStarted = false;
  let lastX = 0;
  let lastY = 0;
  let dragStartX = 0;
  let dragStartY = 0;
  let lastInteraction = performance.now();
  const DRAG_THRESHOLD = 4;

  function setActiveButton(activeBtn) {
    faceButtons.forEach((b) => b.classList.toggle("is-active", b === activeBtn));
    assembleButton.classList.toggle("is-active", !activeBtn);
  }

  function pulseTransition() {
    sharedUniforms.uGlitch.value = 1;
  }

  faceButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.face;
      const face = FACES[key];
      if (!face) return;
      lockedFace = key;
      targetYaw = face.yaw;
      targetPitch = face.pitch;
      pulseTransition();
      feedLabelEl.textContent = face.label;
      feedStatusEl.textContent = face.status;
      setActiveButton(btn);
      lastInteraction = performance.now();
    });
  });

  assembleButton.addEventListener("click", () => {
    lockedFace = null;
    pulseTransition();
    feedLabelEl.textContent = "Free look";
    feedStatusEl.textContent = "Drag inside the frame to look around.";
    setActiveButton(null);
    lastInteraction = performance.now();
  });

  host.addEventListener("pointerdown", (event) => {
    isDragging = true;
    dragStarted = false;
    lastX = dragStartX = event.clientX;
    lastY = dragStartY = event.clientY;
    host.setPointerCapture(event.pointerId);
  });

  host.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    lastX = event.clientX;
    lastY = event.clientY;

    if (!dragStarted) {
      const totalDx = event.clientX - dragStartX;
      const totalDy = event.clientY - dragStartY;
      if (Math.hypot(totalDx, totalDy) < DRAG_THRESHOLD) return;
      dragStarted = true;
      lockedFace = null;
      setActiveButton(null);
      feedLabelEl.textContent = "Free look";
      feedStatusEl.textContent = "Manual look — drag continues, or pick a feed.";
    }

    yaw -= dx * 0.0035;
    pitch = THREE.MathUtils.clamp(pitch - dy * 0.0035, -MAX_PITCH, MAX_PITCH);
    targetYaw = yaw;
    targetPitch = pitch;
    lastInteraction = performance.now();
  });

  function stopDragging(event) {
    if (!isDragging) return;
    isDragging = false;
    dragStarted = false;
    try {
      host.releasePointerCapture(event.pointerId);
    } catch (err) {
      // pointer already released
    }
  }

  host.addEventListener("pointerup", stopDragging);
  host.addEventListener("pointercancel", stopDragging);

  // ---- render loop --------------------------------------------------------

  let frameCount = 0;
  let lastTime = performance.now();

  function animate(now) {
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;
    frameCount += 1;

    sharedUniforms.uTime.value += dt;
    sharedUniforms.uGlitch.value += (0 - sharedUniforms.uGlitch.value) * Math.min(1, dt * 5);

    if (lockedFace) {
      yaw = lerpAngle(yaw, targetYaw, Math.min(1, dt * 4));
      pitch += (targetPitch - pitch) * Math.min(1, dt * 4);
    } else if (!isDragging && now - lastInteraction > 4000) {
      yaw += dt * 0.05;
    }

    camera.rotation.set(pitch, yaw, 0);

    if (frameCount % 3 === 0) {
      probe.visible = false;
      cubeCamera.update(renderer, scene);
      probe.visible = true;
    }

    renderer.setRenderTarget(sceneRT);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(postScene, postCamera);

    if (pendingTextures === 0 && frameCount % 10 === 0) {
      const yawDeg = ((THREE.MathUtils.radToDeg(yaw) % 360) + 360) % 360;
      const pitchDeg = THREE.MathUtils.radToDeg(pitch);
      telemetryEl.textContent =
        `YAW ${String(Math.round(yawDeg)).padStart(3, "0")}° / PITCH ${String(Math.round(pitchDeg)).padStart(3, "0")}°`;
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

init();
