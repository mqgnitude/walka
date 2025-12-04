/* Walka - sketch.js 
  Visualizes random walks based on digits of constants.
*/

// --- State Variables ---
let digits = []; // Array of integers
let currentIndex = 0;
let maxSteps = 10000;
let stepsTaken = 0;

// Position & Movement
let posX, posY;
let currentAngle = 0;
let targetAngle = 0;
let speedMult = 1.0;
let stepSize = 2.0;

// Rendering
let pg; // Offscreen buffer for persistent trail
let isPlaying = true;
let isFadeMode = true; // true = Fade, false = Persistent
let colorMode = 'single'; // 'single', 'angle', 'rainbow'
let currentHue = 0;

// Controls DOM Elements
let dom = {}; 

function setup() {
  // Canvas Setup
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent(document.body); // Ensure it's in body, behind UI
  
  // High DPI handling
  pixelDensity(1); 
  
  // Initialize Offscreen Buffer
  pg = createGraphics(width, height);
  pg.pixelDensity(1);
  pg.background(0, 0); // Transparent

  // Initial Settings
  colorModeStr = 'HSB';
  background('#0b0f1a');
  
  // Center start
  resetWalk();

  // Setup UI Interactions
  setupUI();
  
  // Load Default Data (Pi)
  loadDigitsFromFile('data/pi.txt');
}

function draw() {
  if (!isPlaying) return;

  // Smoothing Speed
  // Map slider (0-400) to multiplier (0.1 - 4.0)
  let targetSpeed = map(dom.speedSlider.value, 0, 400, 0.0, 4.0);
  speedMult += (targetSpeed - speedMult) * 0.08;

  // Calculate loop count for this frame based on speed
  // If speed is high, we run multiple logic steps per frame
  let loops = speedMult >= 1 ? Math.floor(speedMult) : 1;
  
  // If speed is very low, we might skip frames (simple throttling)
  if (speedMult < 1.0 && frameCount % Math.floor(1/speedMult) !== 0) {
    return;
  }

  // Draw Background / Fade Effect
  if (isFadeMode) {
    // In fade mode, we draw directly to canvas with semi-transparent rect
    noStroke();
    fill(11, 15, 26, 20); // Dark background color with low alpha
    rect(0, 0, width, height);
  } else {
    // In persistent mode, we draw the buffer (pg) onto the main canvas
    // and we clear the main canvas every frame to avoid ghosting from the image draw
    background('#0b0f1a');
    image(pg, 0, 0);
  }

  // Draw Steps
  for (let i = 0; i < loops; i++) {
    if (stepsTaken >= maxSteps) {
        // Optional: Auto-pause or loop? Let's loop.
        // currentIndex = 0; stepsTaken = 0; 
        break; 
    }
    updateWalk();
  }
}

function updateWalk() {
  // 1. Get Digit
  if (digits.length === 0) return;
  
  let d = digits[currentIndex];
  
  // 2. Map to Angle
  // 0-9 maps to 0-360 roughly (36 deg per digit)
  let angleDeg = d * 36;
  targetAngle = radians(angleDeg);

  // 3. Smooth Angle Interpolation
  // Handle wrapping (e.g. 350 -> 10 should go forward, not backward all the way)
  let diff = targetAngle - currentAngle;
  // Normalize diff to -PI to PI
  while (diff < -PI) diff += TWO_PI;
  while (diff > PI) diff -= TWO_PI;
  
  currentAngle += diff * 0.15; // Easing factor

  // 4. Move
  let dx = cos(currentAngle) * stepSize * (speedMult > 1 ? 1 : 1); // constant step size visually
  let dy = sin(currentAngle) * stepSize;
  
  let nextX = posX + dx;
  let nextY = posY + dy;

  // 5. Draw Line
  // Set Color
  let c;
  if (colorMode === 'single') {
    c = color(56, 189, 248); // Cyan
  } else if (colorMode === 'angle') {
    colorModeStr = 'HSB';
    // Map angle 0-TWO_PI to hue 0-360
    let h = map(currentAngle % TWO_PI, 0, TWO_PI, 0, 360);
    if (h < 0) h += 360;
    c = color(`hsl(${Math.floor(h)}, 70%, 60%)`);
  } else if (colorMode === 'rainbow') {
    currentHue = (currentHue + 0.5) % 360;
    c = color(`hsl(${Math.floor(currentHue)}, 70%, 60%)`);
  }

  // Determine where to draw (Main canvas or Buffer)
  let ctx = isFadeMode ? this : pg;
  
  ctx.stroke(c);
  ctx.strokeWeight(2);
  ctx.strokeCap(ROUND);
  ctx.line(posX, posY, nextX, nextY);

  // Update State
  posX = nextX;
  posY = nextY;
  
  currentIndex = (currentIndex + 1) % digits.length;
  stepsTaken++;
}

// --- Data Handling ---

function loadDigitsFromFile(path) {
  loadStrings(path, (result) => {
    // result is an array of lines. Join them.
    let s = join(result, '');
    parseAndSetDigits(s);
  }, (err) => {
    console.error("Failed to load digits", err);
  });
}

function parseAndSetDigits(str) {
  // Remove non-digit chars
  let clean = str.replace(/\D/g, '');
  digits = clean.split('').map(Number);
  console.log(`Loaded ${digits.length} digits.`);
  resetWalk();
}

function resetWalk() {
  posX = width / 2;
  posY = height / 2;
  stepsTaken = 0;
  currentIndex = 0;
  currentAngle = 0;
  
  // Clear persistent buffer
  pg.clear(); 
  background('#0b0f1a');
}

// --- UI Logic ---

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
  dom.exportBtn = document.getElementById('btn-export');
  
  // Sources
  let sourceBtns = document.querySelectorAll('[data-source]');
  sourceBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // UI Update
      document.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      // Load Data
      let src = e.target.getAttribute('data-source');
      loadDigitsFromFile(`data/${src}.txt`);
    });
  });

  // Play/Pause
  dom.playBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    dom.playBtn.innerHTML = isPlaying 
      ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
      : `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
  });

  // Reset
  dom.resetBtn.addEventListener('click', resetWalk);

  // Max Steps Slider
  dom.stepsSlider.addEventListener('input', (e) => {
    maxSteps = parseInt(e.target.value);
  });

  // Color Mode
  dom.colorSelect.addEventListener('change', (e) => {
    colorMode = e.target.value;
  });

  // Trail Mode Toggle
  dom.trailBtn.addEventListener('click', () => {
    isFadeMode = !isFadeMode;
    dom.trailBtn.innerText = isFadeMode ? "Fade" : "Persistent";
    
    // If switching to persistent, copy current canvas to buffer so we don't lose it immediately
    if (!isFadeMode) {
      pg.image(get(), 0, 0);
    }
  });

  // Lucky Button
  dom.luckyBtn.addEventListener('click', () => {
     // UI Highlight
     document.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
     dom.luckyBtn.classList.add('active');

     // Logic
     let N = Math.floor(random(1, 10000));
     let sqrtVal = Math.sqrt(N);
     // Get decimal string, remove '3.' part
     let s = sqrtVal.toFixed(14).replace('.', ''); 
     // We need more digits for a good walk? Math.sqrt precision is low.
     // To make it fun, we just repeat the sequence or use what we have.
     // The prompt asks to strip decimal point.
     
     console.log(`Lucky Number: ${N}, Digits: ${s}`);
     parseAndSetDigits(s);
  });

  // Custom Upload
  dom.customBtn.addEventListener('click', () => dom.fileInput.click());
  dom.fileInput.addEventListener('change', (e) => {
    let file = e.target.files[0];
    if (!file) return;
    
    let reader = new FileReader();
    reader.onload = function(e) {
      parseAndSetDigits(e.target.result);
      document.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
      dom.customBtn.classList.add('active');
    };
    reader.readAsText(file);
  });

  // Modal
  dom.infoBtn.addEventListener('click', () => dom.modal.classList.remove('hidden'));
  dom.closeModal.addEventListener('click', () => dom.modal.classList.add('hidden'));
  
  // Export
  dom.exportBtn.addEventListener('click', () => {
    saveCanvas('walka_snapshot', 'png');
  });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Re-create buffer to match new size, strictly speaking we lose old trail here
  // unless we copy it. For simplicity, we create new.
  let oldPg = pg;
  pg = createGraphics(windowWidth, windowHeight);
  pg.image(oldPg, 0, 0); // Try to preserve
  background('#0b0f1a');
}

function keyPressed() {
  if (key === ' ') {
    dom.playBtn.click();
  }
}