// ── Counter ──────────────────────────────────────────────────────────────
const counterEl = document.getElementById('counter');
const btnIncrement = document.getElementById('btn-increment');
const btnDecrement = document.getElementById('btn-decrement');
const btnReset = document.getElementById('btn-reset');

let count = 0;

function render() {
  counterEl.textContent = count;
}

function triggerBounce() {
  counterEl.classList.remove('bounce');
  // Force reflow so the animation restarts even on back-to-back clicks
  void counterEl.offsetWidth;
  counterEl.classList.add('bounce');
}

btnIncrement.addEventListener('click', () => {
  count += 1;
  render();
  triggerBounce();
});

btnDecrement.addEventListener('click', () => {
  if (count > 0) {
    count -= 1;
    render();
    triggerBounce();
  }
});

btnReset.addEventListener('click', () => {
  if (count !== 0) {
    count = 0;
    render();
    triggerBounce();
  }
});

// ── Night Sky Canvas ─────────────────────────────────────────────────────
const canvas = document.getElementById('sky-canvas');
const ctx = canvas.getContext('2d');

// Building definitions: [x fraction, width fraction, height px]
const CITY_DEFS = [
  [0.000, 0.045, 45], [0.050, 0.030, 68], [0.082, 0.038, 40],
  [0.122, 0.025, 82], [0.150, 0.035, 55], [0.188, 0.028, 72],
  [0.220, 0.035, 100],[0.258, 0.030, 118],[0.292, 0.038, 90],
  [0.333, 0.025, 132],[0.361, 0.035, 110],
  [0.400, 0.030, 158],[0.433, 0.038, 178],[0.474, 0.028, 200],
  [0.505, 0.040, 182],[0.548, 0.030, 164],[0.582, 0.036, 146],
  [0.621, 0.025, 128],
  [0.650, 0.040, 108],[0.694, 0.030, 118],[0.727, 0.040, 95],
  [0.770, 0.032, 105],[0.805, 0.035, 88],
  [0.843, 0.038, 68], [0.884, 0.030, 78], [0.917, 0.040, 55],
  [0.960, 0.040, 62],
];

let stars = [];
let cityRects = [];
let cityWindows = [];
let frame = 0;

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  buildCity();
}

// ── Stars & Milky Way ────────────────────────────────────────────────────
function generateStars() {
  stars = [];
  const W = canvas.width;
  const H = canvas.height;

  // Background stars
  for (let i = 0; i < 280; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H * 0.88,
      r: Math.random() * 1.3 + 0.2,
      alpha: Math.random() * 0.65 + 0.25,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.012 + 0.003,
      milkyWay: false,
    });
  }

  // Milky Way river — a dense diagonal band of faint stars
  for (let i = 0; i < 650; i++) {
    const t = Math.random();
    const bx = (0.22 + t * 0.56) * W;
    const by = t * H * 0.82;
    const perp = (Math.random() - 0.5) * W * 0.16;
    stars.push({
      x: bx + perp * 0.45,
      y: by - perp * 0.85,
      r: Math.random() * 0.9 + 0.1,
      alpha: Math.random() * 0.3 + 0.05,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.008 + 0.002,
      milkyWay: true,
    });
  }
}

// ── Cityscape ────────────────────────────────────────────────────────────
function buildCity() {
  const W = canvas.width;
  const H = canvas.height;

  cityRects = CITY_DEFS.map(([xf, wf, h]) => ({
    x: Math.round(xf * W),
    y: H - h,
    w: Math.max(6, Math.round(wf * W)),
    h,
    hasAntenna: false,
  }));

  // Mark the tallest building for an antenna
  let tallest = cityRects[0];
  for (const r of cityRects) {
    if (r.h > tallest.h) tallest = r;
  }
  tallest.hasAntenna = true;

  // Generate windows
  cityWindows = [];
  for (const r of cityRects) {
    const cols = Math.max(1, Math.floor((r.w - 4) / 9));
    const rows = Math.max(1, Math.floor((r.h - 8) / 11));
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (Math.random() < 0.42) {
          cityWindows.push({
            x: r.x + 3 + col * 9,
            y: r.y + 6 + row * 11,
            flicker: Math.random() < 0.03,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    }
  }
}

// ── Draw Loop ────────────────────────────────────────────────────────────
function draw() {
  const W = canvas.width;
  const H = canvas.height;

  // Sky background
  ctx.fillStyle = '#050810';
  ctx.fillRect(0, 0, W, H);

  // Milky Way glow band
  const mwGrad = ctx.createLinearGradient(W * 0.18, 0, W * 0.78, H * 0.82);
  mwGrad.addColorStop(0,   'rgba(70, 90, 160, 0)');
  mwGrad.addColorStop(0.5, 'rgba(70, 90, 160, 0.075)');
  mwGrad.addColorStop(1,   'rgba(70, 90, 160, 0)');
  ctx.fillStyle = mwGrad;
  ctx.fillRect(0, 0, W, H);

  // Moon
  const mx = W * 0.80;
  const my = H * 0.13;
  const mr = Math.min(W, H) * 0.038;

  const moonGlow = ctx.createRadialGradient(mx, my, mr * 0.4, mx, my, mr * 3.5);
  moonGlow.addColorStop(0, 'rgba(255, 248, 200, 0.18)');
  moonGlow.addColorStop(1, 'rgba(255, 248, 200, 0)');
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(mx, my, mr * 3.5, 0, Math.PI * 2);
  ctx.fill();

  const moonFace = ctx.createRadialGradient(mx - mr * 0.2, my - mr * 0.2, 0, mx, my, mr);
  moonFace.addColorStop(0,   'rgba(255, 252, 220, 1)');
  moonFace.addColorStop(0.6, 'rgba(240, 235, 190, 0.95)');
  moonFace.addColorStop(1,   'rgba(210, 205, 160, 0.85)');
  ctx.fillStyle = moonFace;
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, Math.PI * 2);
  ctx.fill();

  // Stars
  for (const s of stars) {
    s.phase += s.speed;
    const a = s.alpha + Math.sin(s.phase) * 0.12;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = s.milkyWay
      ? `rgba(190, 210, 255, ${Math.max(0, a)})`
      : `rgba(255, 255, 255, ${Math.max(0, a)})`;
    ctx.fill();
  }

  // City: warm light-pollution glow above roofline
  const glowGrad = ctx.createLinearGradient(0, H - 240, 0, H);
  glowGrad.addColorStop(0, 'rgba(255, 120, 30, 0)');
  glowGrad.addColorStop(1, 'rgba(255, 100, 20, 0.13)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, H - 240, W, 240);

  // City buildings
  ctx.fillStyle = '#060c16';
  for (const r of cityRects) {
    ctx.fillRect(r.x, r.y, r.w, r.h);

    if (r.hasAntenna) {
      ctx.fillRect(r.x + Math.floor(r.w / 2) - 1, r.y - 28, 2, 28);
      ctx.fillRect(r.x + Math.floor(r.w / 2) - 3, r.y - 28, 6, 3);
    }
  }

  // Lit windows
  frame++;
  for (const w of cityWindows) {
    let alpha = 0.75;
    if (w.flicker) {
      alpha = 0.4 + Math.abs(Math.sin(frame * 0.08 + w.phase * 8)) * 0.55;
    }
    ctx.fillStyle = `rgba(255, 218, 100, ${alpha})`;
    ctx.fillRect(w.x, w.y, 5, 7);
  }

  requestAnimationFrame(draw);
}

// ── Init ─────────────────────────────────────────────────────────────────
resize();
generateStars();
draw();

window.addEventListener('resize', () => {
  resize();
  generateStars();
});
