const mapFields = {
  manhattan: {
    label: "Manhattan",
    seed: 143,
    mapStyle: "island-grid",
    angle: -0.04,
    spacing: 7,
    blockCount: 32,
    labels: ["Hudson River", "Central Park", "Broadway", "East River"],
    palette: ["#ff2a16", "#ff6b00", "#ffb347", "#fff4d6", "#008b4f", "#0055ff", "#6e1d92"],
  },
  venice: {
    label: "Venice",
    seed: 502,
    mapStyle: "lagoon",
    angle: 0.13,
    spacing: 9,
    blockCount: 26,
    labels: ["Lagoon", "Canal Grande", "Rialto", "Giudecca"],
    palette: ["#ff4c2e", "#ff8a00", "#ffd166", "#f7fff7", "#00a7a5", "#1769ff", "#a000ff"],
  },
  tokyo: {
    label: "Tokyo",
    seed: 811,
    mapStyle: "rail-web",
    angle: 0.03,
    spacing: 6,
    blockCount: 42,
    labels: ["Yamanote", "Shibuya", "Sumida River", "Shinjuku"],
    palette: ["#ff1744", "#ff9100", "#ffe66d", "#ffffff", "#00c853", "#00b0ff", "#d500f9"],
  },
  la: {
    label: "Los Angeles",
    seed: 277,
    mapStyle: "freeway-basin",
    angle: -0.11,
    spacing: 11,
    blockCount: 24,
    labels: ["Santa Monica", "Downtown", "Los Angeles River", "Hollywood"],
    palette: ["#ff3d00", "#ffab00", "#ffe0a3", "#fffdf7", "#00a651", "#0057b8", "#7b1fa2"],
  },
};

let activeMap = mapFields.manhattan;
let graphicsLayer;
let weaveScale = 1;
let pointerPulse = 0;
let pointerX = 0;
let pointerY = 0;

function setup() {
  const host = document.getElementById("weave-canvas");
  const canvas = createCanvas(host.clientWidth, host.clientHeight);
  canvas.parent(host);
  pixelDensity(1);
  graphicsLayer = createGraphics(width, height);
  graphicsLayer.pixelDensity(1);
  pointerX = width * 0.5;
  pointerY = height * 0.5;
  wireMapButtons();
  redrawField();
}

function draw() {
  if (pointerPulse > 0.01) {
    pointerPulse *= 0.88;
    redrawField();
  }
}

function windowResized() {
  const host = document.getElementById("weave-canvas");
  resizeCanvas(host.clientWidth, host.clientHeight);
  graphicsLayer = createGraphics(width, height);
  graphicsLayer.pixelDensity(1);
  redrawField();
}

function mouseDragged() {
  if (!isPointerOnCanvas()) {
    return;
  }

  pointerX = mouseX;
  pointerY = mouseY;
  pointerPulse = 1;
  redrawField();
}

function mouseMoved() {
  if (isPointerOnCanvas()) {
    pointerX = mouseX;
    pointerY = mouseY;
  }
}

function mouseWheel(event) {
  if (!isPointerOnCanvas()) {
    return true;
  }

  weaveScale = constrain(weaveScale + event.delta * -0.0007, 0.58, 1.9);
  pointerPulse = 0.9;
  redrawField();
  return false;
}

function keyTyped() {
  if (key === "s" || key === "S") {
    saveCanvas(`geodata-weaving-${activeMap.label.toLowerCase()}`, "png");
  }
}

function wireMapButtons() {
  document.querySelectorAll("[data-map]").forEach((button) => {
    button.addEventListener("click", () => {
      activeMap = mapFields[button.dataset.map];
      document.querySelectorAll("[data-map]").forEach((otherButton) => {
        otherButton.classList.toggle("is-active", otherButton === button);
      });
      weaveScale = 1;
      pointerPulse = 1;
      redrawField();
    });
  });
}

function redrawField() {
  randomSeed(activeMap.seed);
  noiseSeed(activeMap.seed);
  background("#fffaf0");
  graphicsLayer.clear();
  graphicsLayer.blendMode(BLEND);
  graphicsLayer.background(255, 248, 232);
  drawPaperNoise();
  drawMapUnderlay();
  drawWovenGrid();
  drawLandmarkBlocks();
  drawSignalBloom();
  image(graphicsLayer, 0, 0);
  drawScanlines();
}

function drawPaperNoise() {
  graphicsLayer.noStroke();
  for (let i = 0; i < width * height * 0.055; i += 1) {
    const x = random(width);
    const y = random(height);
    const alpha = random(18, 66);
    const colorValue = random() > 0.52 ? 255 : 18;
    graphicsLayer.fill(colorValue, colorValue, colorValue, alpha);
    graphicsLayer.rect(x, y, random(1, 3), random(1, 5));
  }
}

function drawMapUnderlay() {
  randomSeed(activeMap.seed + 9000);
  graphicsLayer.push();
  graphicsLayer.blendMode(BLEND);
  graphicsLayer.translate(pointerX, pointerY);
  graphicsLayer.scale(weaveScale);
  graphicsLayer.translate(-pointerX, -pointerY);
  graphicsLayer.noFill();
  graphicsLayer.strokeCap(ROUND);
  graphicsLayer.strokeJoin(ROUND);

  drawWaterEdges();
  drawStreetTraces();
  drawMapLabels();

  graphicsLayer.pop();
  randomSeed(activeMap.seed);
}

function drawWaterEdges() {
  graphicsLayer.noStroke();
  graphicsLayer.fill(99, 174, 190, 24);

  if (activeMap.mapStyle === "island-grid") {
    graphicsLayer.beginShape();
    graphicsLayer.vertex(0, 0);
    graphicsLayer.vertex(width * 0.18, 0);
    for (let y = 0; y <= height; y += height / 8) {
      graphicsLayer.vertex(width * 0.14 + noise(y * 0.01) * 34, y);
    }
    graphicsLayer.vertex(0, height);
    graphicsLayer.endShape(CLOSE);

    graphicsLayer.beginShape();
    graphicsLayer.vertex(width, 0);
    graphicsLayer.vertex(width * 0.86, 0);
    for (let y = 0; y <= height; y += height / 9) {
      graphicsLayer.vertex(width * 0.88 + noise(20 + y * 0.01) * 28, y);
    }
    graphicsLayer.vertex(width, height);
    graphicsLayer.endShape(CLOSE);
    return;
  }

  if (activeMap.mapStyle === "lagoon") {
    for (let i = 0; i < 7; i += 1) {
      graphicsLayer.ellipse(random(width), random(height), random(180, 420), random(70, 180));
    }
    return;
  }

  if (activeMap.mapStyle === "rail-web") {
    drawRiver(width * 0.68, 0, width * 0.58, height, 52);
    return;
  }

  drawRiver(width * 0.62, 0, width * 0.72, height, 36);
}

function drawStreetTraces() {
  const streetAlpha = 40;
  graphicsLayer.stroke(72, 74, 66, streetAlpha);
  graphicsLayer.strokeWeight(1);

  if (activeMap.mapStyle === "island-grid") {
    graphicsLayer.push();
    graphicsLayer.translate(width * 0.5, height * 0.5);
    graphicsLayer.rotate(-0.2);
    graphicsLayer.translate(-width * 0.5, -height * 0.5);
    for (let x = width * 0.22; x < width * 0.82; x += 34) {
      graphicsLayer.line(x, -30, x + random(-16, 16), height + 30);
    }
    for (let y = 24; y < height; y += 28) {
      graphicsLayer.line(width * 0.16, y, width * 0.86, y + random(-10, 10));
    }
    graphicsLayer.stroke(37, 110, 54, 34);
    graphicsLayer.strokeWeight(12);
    graphicsLayer.rect(width * 0.39, height * 0.12, width * 0.16, height * 0.23, 4);
    graphicsLayer.pop();
    return;
  }

  if (activeMap.mapStyle === "lagoon") {
    for (let i = 0; i < 42; i += 1) {
      const x = random(width);
      const y = random(height);
      drawWobblyPath(x, y, x + random(-220, 220), y + random(-130, 130), random(8, 20), streetAlpha);
    }
    graphicsLayer.stroke(60, 142, 174, 44);
    graphicsLayer.strokeWeight(9);
    drawWobblyPath(width * 0.12, height * 0.56, width * 0.86, height * 0.42, 22, 44);
    return;
  }

  if (activeMap.mapStyle === "rail-web") {
    for (let i = 0; i < 18; i += 1) {
      graphicsLayer.stroke(70, 70, 70, i % 4 === 0 ? 58 : 34);
      graphicsLayer.strokeWeight(i % 4 === 0 ? 3 : 1);
      drawWobblyPath(random(width), random(height), random(width), random(height), random(18, 32), streetAlpha);
    }
    graphicsLayer.stroke(180, 42, 84, 46);
    graphicsLayer.strokeWeight(7);
    graphicsLayer.ellipse(width * 0.52, height * 0.48, width * 0.48, height * 0.38);
    return;
  }

  graphicsLayer.stroke(80, 76, 65, 36);
  for (let y = 34; y < height; y += 58) {
    graphicsLayer.line(0, y + random(-8, 8), width, y + random(-12, 12));
  }
  for (let x = 28; x < width; x += 72) {
    graphicsLayer.line(x + random(-9, 9), 0, x + random(-14, 14), height);
  }
  graphicsLayer.stroke(210, 112, 52, 46);
  graphicsLayer.strokeWeight(5);
  drawWobblyPath(0, height * 0.38, width, height * 0.52, 28, 46);
  drawWobblyPath(width * 0.2, 0, width * 0.82, height, 28, 46);
}

function drawMapLabels() {
  graphicsLayer.noStroke();
  graphicsLayer.fill(37, 34, 30, 52);
  graphicsLayer.textFont("Courier New");
  graphicsLayer.textSize(12);
  graphicsLayer.textStyle(BOLD);

  activeMap.labels.forEach((label, index) => {
    const x = map(noise(index * 4.2 + activeMap.seed), 0, 1, width * 0.12, width * 0.78);
    const y = map(noise(index * 6.7 + activeMap.seed), 0, 1, height * 0.16, height * 0.84);
    graphicsLayer.push();
    graphicsLayer.translate(x, y);
    graphicsLayer.rotate(random(-0.18, 0.18));
    graphicsLayer.text(label.toUpperCase(), 0, 0);
    graphicsLayer.pop();
  });
}

function drawRiver(x1, y1, x2, y2, weightValue) {
  graphicsLayer.noFill();
  graphicsLayer.stroke(66, 166, 190, 26);
  graphicsLayer.strokeWeight(weightValue);
  drawWobblyPath(x1, y1, x2, y2, 36, 26);
}

function drawWobblyPath(x1, y1, x2, y2, segments, alphaValue) {
  graphicsLayer.noFill();
  graphicsLayer.beginShape();
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const x = lerp(x1, x2, t) + (noise(t * 5, activeMap.seed) - 0.5) * 80;
    const y = lerp(y1, y2, t) + (noise(t * 4, activeMap.seed + 20) - 0.5) * 80;
    graphicsLayer.stroke(70, 72, 62, alphaValue);
    graphicsLayer.curveVertex(x, y);
  }
  graphicsLayer.endShape();
}

function drawWovenGrid() {
  const spacing = activeMap.spacing * weaveScale;
  const diagonal = sqrt(width * width + height * height);

  graphicsLayer.push();
  graphicsLayer.translate(width * 0.5, height * 0.5);
  graphicsLayer.rotate(activeMap.angle);
  graphicsLayer.translate(-width * 0.5, -height * 0.5);
  graphicsLayer.blendMode(MULTIPLY);

  for (let x = -60; x < width + 60; x += spacing) {
    drawThread(x, -60, x + random(-18, 18), height + 60, true);
  }

  for (let y = -60; y < height + 60; y += spacing * random(0.78, 1.42)) {
    drawThread(-60, y, diagonal, y + random(-28, 28), false);
  }

  graphicsLayer.pop();
}

function drawThread(x1, y1, x2, y2, vertical) {
  const palette = activeMap.palette;
  const steps = vertical ? 95 : 56;
  let previousX = x1;
  let previousY = y1;

  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const baseX = lerp(x1, x2, t);
    const baseY = lerp(y1, y2, t);
    const turbulence = noise(baseX * 0.004, baseY * 0.006, frameCount * 0.004);
    const pull = pointerPulse * map(dist(baseX, baseY, pointerX, pointerY), 0, 280, 48, 0, true);
    const wave = sin(t * TAU * random(2, 8)) * random(1.4, 8.8);
    const nextX = baseX + (vertical ? wave : random(-2, 2)) + (baseX - pointerX) * pull * 0.006;
    const nextY = baseY + (vertical ? random(-2, 2) : wave) + (baseY - pointerY) * pull * 0.006;
    const threadColor = color(random(palette));
    threadColor.setAlpha(vertical ? random(70, 172) : random(28, 88));

    graphicsLayer.stroke(threadColor);
    graphicsLayer.strokeWeight(vertical ? random(0.45, 2.6) : random(0.35, 1.4));
    if (turbulence > 0.42 || random() > 0.2) {
      graphicsLayer.line(previousX, previousY, nextX, nextY);
    }

    if (random() > 0.9) {
      graphicsLayer.noStroke();
      threadColor.setAlpha(random(72, 150));
      graphicsLayer.fill(threadColor);
      graphicsLayer.rect(nextX, nextY, random(2, 8), random(1, 14));
    }

    previousX = nextX;
    previousY = nextY;
  }
}

function drawLandmarkBlocks() {
  graphicsLayer.blendMode(HARD_LIGHT);
  graphicsLayer.noStroke();

  for (let i = 0; i < activeMap.blockCount; i += 1) {
    const x = random(width);
    const y = random(height);
    const w = random([random(10, 34), random(22, 72), random(3, 12)]);
    const h = random([random(10, 36), random(46, 150), random(3, 14)]);
    const blockColor = color(random(activeMap.palette));
    blockColor.setAlpha(random(118, 225));
    graphicsLayer.fill(blockColor);
    graphicsLayer.rect(x, y, w, h);

    if (random() > 0.64) {
      graphicsLayer.fill(255, random(128, 210));
      graphicsLayer.rect(x + random(-8, 8), y + random(-8, 8), w * random(0.28, 0.9), h * random(0.2, 0.76));
    }
  }
}

function drawSignalBloom() {
  const pulseColor = color(random(activeMap.palette));
  pulseColor.setAlpha(40 + pointerPulse * 70);
  graphicsLayer.blendMode(SCREEN);
  graphicsLayer.noStroke();
  graphicsLayer.fill(pulseColor);
  graphicsLayer.circle(pointerX, pointerY, 170 + pointerPulse * 210);
}

function drawScanlines() {
  blendMode(OVERLAY);
  stroke(255, 70);
  strokeWeight(1);
  for (let x = 0; x < width; x += 3) {
    line(x, 0, x + random(-1, 1), height);
  }
  blendMode(BLEND);
}

function isPointerOnCanvas() {
  return mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
}
