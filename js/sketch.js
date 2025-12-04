/* Walka - sketch.js */

// --- State Variables ---
let digits = [];
let currentIndex = 0;
let maxSteps = 10000;
let stepsTaken = 0;

// App State
let hasStarted = false; // Waits for Splash Screen
let isPlaying = false;  // Starts paused until Splash click

// Position & Movement
let posX, posY;
let currentAngle = 0;
let targetAngle = 0;
let speedMult = 1.0;
let stepSize = 2.0;

// Rendering
let pg; // Offscreen buffer
let isFadeMode = true;
let colorMode = 'single';
let currentHue = 0;

// Controls
let dom = {};

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.body);
  pixelDensity(1);

  pg = createGraphics(width, height);
  pg.pixelDensity(1);
  pg.background(0, 0);

  colorModeStr = 'HSB';
  background('#0b0f1a');

  resetWalk();
  setupUI();

  // Load Default Data (Pi) but don't auto-run until button click
  loadDigitsFromFile('data/pi.txt');
  noLoop(); // Wait for user interaction
}

function draw() {
  if (!hasStarted || !isPlaying) return;

  // Smoothing Speed
  let targetSpeed = map(dom.speedSlider.value, 0, 400, 0.0, 4.0);
  speedMult += (targetSpeed - speedMult) * 0.08;

  let loops = speedMult >= 1 ? Math.floor(speedMult) : 1;
  if (speedMult < 1.0 && frameCount % Math.floor(1 / speedMult) !== 0) return;

  // Draw Background / Fade
  if (isFadeMode) {
    noStroke();
    fill(11, 15, 26, 20);
    rect(0, 0, width, height);
  } else {
    background('#0b0f1a');
    image(pg, 0, 0);
  }

  for (let i = 0; i < loops; i++) {
    updateWalk();
  }

  // Update UI Step Counter (throttle updates for performance)
  if (frameCount % 10 === 0) {
    updateStepCounter();
  }
}

function updateWalk() {
  if (digits.length === 0) return;

  // Check Max Steps
  if (stepsTaken >= maxSteps) {
    // Soft reset when max steps reached
    resetWalk(false); // false = don't clear canvas, just reset position index
    return;
  }

  let d = digits[currentIndex];
  let angleDeg = d * 36;
  targetAngle = radians(angleDeg);

  // Shortest path interpolation
  let diff = targetAngle - currentAngle;
  while (diff < -PI) diff += TWO_PI;
  while (diff > PI) diff -= TWO_PI;
  currentAngle += diff * 0.15;

  // Move
  let dx = cos(currentAngle) * stepSize;
  let dy = sin(currentAngle) * stepSize;

  let nextX = posX + dx;
  let nextY = posY + dy;

  // --- BOUNDARY WRAPPING (The Fix) ---
  // If we go off screen, just warp to the other side
  let wrapped = false;
  if (nextX < 0) { nextX = width; wrapped = true; }
  if (nextX > width) { nextX = 0; wrapped = true; }
  if (nextY < 0) { nextY = height; wrapped = true; }
  if (nextY > height) { nextY = 0; wrapped = true; }

  // Draw
  if (!wrapped) {
    // Determine Color
    let c;
    if (colorMode === 'single') {
      c = color(56, 189, 248);
    } else if (colorMode === 'angle') {
      colorModeStr = 'HSB';
      let h = map(currentAngle % TWO_PI, 0, TWO_PI, 0, 360);
      if (h < 0) h += 360;
      c = color(`hsl(${Math.floor(h)}, 70%, 60%)`);
    } else if (colorMode === 'rainbow') {
      currentHue = (currentHue + 0.5) % 360;
      c = color(`hsl(${Math.floor(currentHue)}, 70%, 60%)`);
    }

    let ctx = isFadeMode ? this : pg;
    ctx.stroke(c);
    ctx.strokeWeight(2);
    ctx.strokeCap(ROUND);
    // Only draw line if we didn't just wrap across screen
    ctx.line(posX, posY, nextX, nextY);
  }

  posX = nextX;
  posY = nextY;

  currentIndex = (currentIndex + 1) % digits.length;
  stepsTaken++;
}

// --- Logic ---

function resetWalk(clearCanvas = true) {
  // If we are just resetting the "Loop" (max steps reached), we pick a random spot
  // If user clicked Reset Button, we go to center and clear.

  if (clearCanvas) {
    posX = width / 2;
    posY = height / 2;
    stepsTaken = 0;
    currentIndex = 0;
    currentAngle = 0;
    pg.clear();
    background('#0b0f1a');
  } else {
    // Soft loop reset
    stepsTaken = 0;
    // Optional: Randomize position on loop?
    // posX = random(width); posY = random(height);
  }
}

function updateStepCounter() {
  let label = document.getElementById('val-steps');
  // Format numbers nicely (e.g. 1.2k)
  let kSteps = (stepsTaken / 1000).toFixed(1) + 'k';
  let kMax = (maxSteps / 1000).toFixed(0) + 'k';
  if (stepsTaken < 1000) kSteps = stepsTaken;

  label.innerText = `${kSteps} / ${kMax}`;
}

// --- UI ---

function setupUI() {
  dom.playBtn = document.getElementById('btn-play-pause');
  dom.resetBtn = document.getElementById('btn-reset');
  dom.speedSlider = document.getElementById('slider-speed');
  dom.stepsSlider = document.getElementById('slider-steps');
  dom.colorSelect = document.getElementById('select-color');
  dom.trailBtn = document.getElementById('btn-trail');
  dom.luckyBtn = document.getElementById('btn-lucky');
  dom.customBtn = document.getElementById('btn-custom');
  dom.fileInput = document.getElementById('file-input');
  dom.infoBtn = document.getElementById('btn-info');
  dom.modal = document.getElementById('modal-info');
  dom.closeModal = document.getElementById('btn-close-modal');
  dom.startBtn = document.getElementById('btn-start-app');
  dom.splash = document.getElementById('splash-screen');

  // SPLASH START
  dom.startBtn.addEventListener('click', () => {
    hasStarted = true;
    isPlaying = true;
    dom.splash.classList.add('fade-out');
    loop(); // Start p5 loop
    // Switch Play Icon
    updatePlayIcon();
  });

  let sourceBtns = document.querySelectorAll('[data-source]');
  sourceBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      let src = e.target.getAttribute('data-source');
      loadDigitsFromFile(`data/${src}.txt`);
      resetWalk(true);
    });
  });

  dom.playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    updatePlayIcon();
  });

  dom.resetBtn.addEventListener('click', () => resetWalk(true));

  dom.stepsSlider.addEventListener('input', (e) => {
    maxSteps = parseInt(e.target.value);
    updateStepCounter();
  });

  dom.colorSelect.addEventListener('change', (e) => {
    colorMode = e.target.value;
  });

  dom.trailBtn.addEventListener('click', () => {
    isFadeMode = !isFadeMode;
    dom.trailBtn.innerText = isFadeMode ? "Fade" : "Persist";
    if (!isFadeMode) pg.image(get(), 0, 0);
  });

  dom.luckyBtn.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
    dom.luckyBtn.classList.add('active');
    let N = Math.floor(random(1, 10000));
    let sqrtVal = Math.sqrt(N);
    let s = sqrtVal.toFixed(14).replace('.', '');
    parseAndSetDigits(s);
  });

  dom.customBtn.addEventListener('click', () => dom.fileInput.click());
  dom.fileInput.addEventListener('change', (e) => {
    let file = e.target.files[0];
    if (!file) return;
    let reader = new FileReader();
    reader.onload = function (e) {
      parseAndSetDigits(e.target.result);
      document.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
      dom.customBtn.classList.add('active');
    };
    reader.readAsText(file);
  });

  dom.infoBtn.addEventListener('click', () => dom.modal.classList.remove('hidden'));
  dom.closeModal.addEventListener('click', () => dom.modal.classList.add('hidden'));
}

function updatePlayIcon() {
  dom.playBtn.innerHTML = isPlaying
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
}

// Helpers
function loadDigitsFromFile(path) {
  loadStrings(path, (result) => {
    let s = join(result, '');
    parseAndSetDigits(s);
  }, (err) => console.error(err));
}

function parseAndSetDigits(str) {
  let clean = str.replace(/\D/g, '');
  digits = clean.split('').map(Number);
  // Do not auto-reset here, just update data
  // User hits Play to start
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  let oldPg = pg;
  pg = createGraphics(windowWidth, windowHeight);
  pg.image(oldPg, 0, 0);
  background('#0b0f1a');
}
