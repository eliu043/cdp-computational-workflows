const citySources = [
  {
    city: "New York",
    subject: "Flatiron Building",
    file: "assets/01-new-york-flatiron-building.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Flatiron_Building,_Fifth_Avenue,_Manhattan,_New_York.jpg",
    license: "CC BY-SA 4.0",
  },
  {
    city: "Chicago",
    subject: "Chicago skyline",
    file: "assets/02-chicago-chicago-skyline.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Chicago_Skyline_at_Dusk.jpg",
    license: "CC BY-SA 4.0",
  },
  {
    city: "Tokyo",
    subject: "Shinjuku skyline",
    file: "assets/03-tokyo-shinjuku-skyline.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Shinjuku_Skyline_(53416849963).jpg",
    license: "CC BY 2.0",
  },
  {
    city: "Hong Kong",
    subject: "Victoria Peak skyline",
    file: "assets/04-hong-kong-victoria-peak-skyline.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Hong_Kong_Night_Skyline.jpg",
    license: "CC BY-SA 3.0",
  },
  {
    city: "London",
    subject: "City skyline",
    file: "assets/05-london-city-skyline.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Canary_Wharf_from_Limehouse_London_June_2016_HDR.jpg",
    license: "CC BY-SA 4.0",
  },
  {
    city: "Paris",
    subject: "La Defense skyline",
    file: "assets/06-paris-la-defense-skyline.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Panorama_La_D%C3%A9fense.jpg",
    license: "CC BY-SA 3.0",
  },
  {
    city: "Rotterdam",
    subject: "City skyline",
    file: "assets/07-rotterdam-city-skyline.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Rotterdam_Rooftop_Walk_2022_with_World_Trade_Center_in_the_Background.jpg",
    license: "CC0",
  },
  {
    city: "Singapore",
    subject: "Marina Bay skyline",
    file: "assets/08-singapore-marina-bay-skyline.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Singapore_Marina_Bay_Dusk_2018-02-27.jpg",
    license: "CC BY-SA 4.0",
  },
  {
    city: "Shanghai",
    subject: "Pudong skyline",
    file: "assets/09-shanghai-pudong-skyline.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Shanghai_Skyline_from_a_tour_boat_(Pudong).jpg",
    license: "CC BY-SA 4.0",
  },
  {
    city: "Sao Paulo",
    subject: "City skyline",
    file: "assets/10-sao-paulo-city-skyline.jpg",
    page: "https://commons.wikimedia.org/wiki/File:At_S%C3%A3o_Paulo_2018_249.jpg",
    license: "CC BY-SA 4.0",
  },
  {
    city: "Mexico City",
    subject: "Downtown skyline",
    file: "assets/11-mexico-city-downtown-architecture.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Mexico_City_Reforma_skyline_(cropped2).jpg",
    license: "CC BY-SA 4.0",
  },
  {
    city: "Toronto",
    subject: "City skyline",
    file: "assets/12-toronto-city-skyline.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Toronto_-_ON_-_CN_Tower_bei_Nacht2.jpg",
    license: "CC BY 3.0",
  },
  {
    city: "Sydney",
    subject: "City skyline",
    file: "assets/13-sydney-city-skyline.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Sydney_(AU),_Skyline_--_2019_--_2287.jpg",
    license: "CC BY-SA 4.0",
  },
  {
    city: "Dubai",
    subject: "Downtown skyline",
    file: "assets/14-dubai-downtown-skyline.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Dubai_skyline_unsplash.jpg",
    license: "CC0",
  },
  {
    city: "Berlin",
    subject: "City architecture",
    file: "assets/15-berlin-city-architecture.jpg",
    page: "https://commons.wikimedia.org/wiki/File:Berlin_Mitte_June_2023_01.jpg",
    license: "CC BY-SA 4.0",
  },
];

const paperColors = ["#f7f0df", "#f5e8da", "#ecf1df"];
const risoInks = ["#0f7f85", "#f0558a", "#f3c338", "#111111"];

let cityImages = [];
let activeIndex = 0;
let sourceBuffer;
let grainBuffer;
let glitchPulse = 0;
let panX = 0.5;
let panY = 0.5;

function setup() {
  const host = document.getElementById("glitch-canvas");
  const canvas = createCanvas(host.clientWidth, host.clientHeight);
  canvas.parent(host);
  host.classList.add("has-live-canvas");
  pixelDensity(1);
  sourceBuffer = createGraphics(width, height);
  sourceBuffer.pixelDensity(1);
  grainBuffer = createGraphics(width, height);
  grainBuffer.pixelDensity(1);
  panX = 0.52;
  panY = 0.48;
  buildGrain();
  loadCityImages();
  populateSourceList();
}

function draw() {
  panX = lerp(panX, constrain(mouseX / max(width, 1), 0, 1), 0.055);
  panY = lerp(panY, constrain(mouseY / max(height, 1), 0, 1), 0.055);
  glitchPulse = max(glitchPulse * 0.9, 0);

  drawSourceCrop();
  drawRisoPasses();
  drawGlitchSlices();
  drawHalftoneField();
  drawScanMesh();
  drawCityLabel();
}

function windowResized() {
  const host = document.getElementById("glitch-canvas");
  resizeCanvas(host.clientWidth, host.clientHeight);
  sourceBuffer = createGraphics(width, height);
  sourceBuffer.pixelDensity(1);
  grainBuffer = createGraphics(width, height);
  grainBuffer.pixelDensity(1);
  buildGrain();
}

function mouseClicked() {
  if (!isPointerOnGlitchCanvas()) {
    return;
  }

  activeIndex = (activeIndex + 1) % citySources.length;
  glitchPulse = 1;
  populateSourceList();
}

function mouseMoved() {
  if (isPointerOnGlitchCanvas()) {
    glitchPulse = max(glitchPulse, 0.18);
  }
}

function keyTyped() {
  if (key === "s" || key === "S") {
    saveCanvas(`city-signal-glitch-${citySources[activeIndex].city.toLowerCase()}`, "png");
  }
}

function drawSourceCrop() {
  const source = cityImages[activeIndex];
  sourceBuffer.background(paperColors[activeIndex % paperColors.length]);

  if (!source || !source.complete || !source.naturalWidth) {
    drawFallbackCity();
    return;
  }

  const coverScale = max(width / source.naturalWidth, height / source.naturalHeight) * 1.18;
  const drawWidth = source.naturalWidth * coverScale;
  const drawHeight = source.naturalHeight * coverScale;
  const driftX = map(panX, 0, 1, 0, width - drawWidth);
  const driftY = map(panY, 0, 1, 0, height - drawHeight);

  sourceBuffer.push();
  sourceBuffer.drawingContext.drawImage(source, driftX, driftY, drawWidth, drawHeight);
  sourceBuffer.filter(POSTERIZE, 6);
  sourceBuffer.pop();
}

function drawRisoPasses() {
  background(paperColors[activeIndex % paperColors.length]);
  tint(255, 214);
  image(sourceBuffer, 0, 0, width, height);
  noTint();

  blendMode(MULTIPLY);

  const pressure = 1.5 + glitchPulse * 14;
  const offsets = [
    { color: color("#00a7a5"), x: -pressure * 0.6, y: pressure * 0.14 },
    { color: color("#f04e98"), x: pressure * 0.55, y: -pressure * 0.18 },
    { color: color("#f5ca2e"), x: sin(frameCount * 0.035) * pressure, y: pressure * 0.34 },
    { color: color("#1a1716"), x: 0, y: 0 },
  ];

  offsets.forEach((pass, index) => {
    pass.color.setAlpha(index === 3 ? 64 : 62);
    tint(pass.color);
    image(sourceBuffer, pass.x, pass.y, width, height);
  });

  noTint();
  blendMode(BLEND);
}

function drawGlitchSlices() {
  const sliceCount = floor(18 + glitchPulse * 36);
  blendMode(BLEND);

  for (let i = 0; i < sliceCount; i += 1) {
    const y = floor(random(height));
    const h = floor(random(2, 22 + glitchPulse * 34));
    const xShift = floor(random(-34, 34) * (0.38 + glitchPulse));
    const sliceTint = color(random(risoInks));
    sliceTint.setAlpha(random(40, 116));

    push();
    tint(sliceTint);
    image(sourceBuffer, xShift, y + random(-2, 2), width, h, 0, y, width, h);
    pop();

    if (random() > 0.64) {
      noStroke();
      fill(random(risoInks) + "70");
      rect(random(-20, width), y, random(16, 170), random(1, 5));
    }
  }
}

function drawHalftoneField() {
  blendMode(MULTIPLY);
  noStroke();

  const step = 9;
  for (let y = 0; y < height; y += step) {
    for (let x = (y / step) % 2 === 0 ? 0 : step * 0.5; x < width; x += step) {
      const wave = noise(x * 0.012, y * 0.012, activeIndex * 10) * 5.4;
      const diameter = map(sin((x * 0.03) + (y * 0.021) + frameCount * 0.01), -1, 1, 0.7, wave);
      fill(17, 17, 17, 13);
      circle(x, y, diameter);
    }
  }

  tint(255, 26);
  image(grainBuffer, 0, 0);
  noTint();
  blendMode(BLEND);
}

function drawScanMesh() {
  strokeWeight(1);

  for (let y = 0; y < height; y += 3) {
    stroke(255, 255, 255, y % 9 === 0 ? 52 : 20);
    line(0, y, width, y + random(-0.7, 0.7));
  }

  stroke(17, 17, 17, 16);
  for (let x = 0; x < width; x += 11) {
    line(x + sin(frameCount * 0.015 + x) * 1.5, 0, x, height);
  }
}

function drawCityLabel() {
  const source = citySources[activeIndex];
  const label = `${nf(activeIndex + 1, 2)} / ${source.city.toUpperCase()} / ${source.subject.toUpperCase()}`;

  noStroke();
  fill(247, 240, 223, 218);
  rect(18, height - 58, min(width - 36, 470), 38);
  fill(17);
  textFont("Courier New");
  textSize(12);
  textStyle(BOLD);
  text(label, 32, height - 34);

  fill(17, 70);
  text("MOVE TO PAN / CLICK TO ADVANCE", 32, 34);
}

function drawFallbackCity() {
  sourceBuffer.push();
  sourceBuffer.background("#ede8dc");
  sourceBuffer.noStroke();
  sourceBuffer.fill("#d8d1c5");
  sourceBuffer.rect(0, height * 0.68, width, height * 0.32);

  randomSeed(activeIndex + 220);
  for (let x = -20; x < width; x += random(28, 74)) {
    const buildingHeight = random(height * 0.22, height * 0.78);
    sourceBuffer.fill(random(["#141414", "#303030", "#5f6666", "#8b8f86"]));
    sourceBuffer.rect(x, height - buildingHeight, random(24, 88), buildingHeight);
  }

  randomSeed(activeIndex * 1000 + frameCount);
  for (let i = 0; i < 900; i += 1) {
    sourceBuffer.fill(random(["#f0558a", "#0f7f85", "#f3c338", "#ffffff"]));
    sourceBuffer.rect(random(width), random(height), random(1, 4), random(1, 10));
  }
  sourceBuffer.pop();
}

function buildGrain() {
  grainBuffer.clear();
  grainBuffer.noStroke();

  for (let i = 0; i < width * height * 0.18; i += 1) {
    const ink = random() > 0.54 ? 17 : 255;
    grainBuffer.fill(ink, random(18, 72));
    grainBuffer.rect(random(width), random(height), random(1, 3), random(1, 4));
  }
}

function loadCityImages() {
  cityImages = citySources.map((source) => {
    const imageElement = new Image();
    imageElement.onload = () => {
      glitchPulse = 0.8;
    };
    imageElement.src = source.file;
    return imageElement;
  });
}

function populateSourceList() {
  const list = document.getElementById("glitch-source-list");
  if (!list) {
    return;
  }

  list.innerHTML = citySources.map((source, index) => {
    const activeClass = index === activeIndex ? " class=\"is-active\"" : "";
    return `<li${activeClass}><a href="${source.page}" target="_blank" rel="noreferrer">${source.city}: ${source.subject} (${source.license})</a></li>`;
  }).join("");
}

function isPointerOnGlitchCanvas() {
  return mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height;
}
