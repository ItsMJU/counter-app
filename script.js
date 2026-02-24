// ── Counter ──────────────────────────────────────────────────────────────
const counterEl       = document.getElementById('counter');
const btnIncrement    = document.getElementById('btn-increment');
const btnDecrement    = document.getElementById('btn-decrement');
const btnMenu         = document.getElementById('btn-menu');
const shopMenu        = document.getElementById('shop-menu');
const btnBuyAuto      = document.getElementById('btn-buy-autoclicker');
const autoclickerOwned = document.getElementById('autoclicker-owned');

let count = 0;
let autoclickerLevel = 0;

function render() {
  counterEl.textContent = count;
  // Keep buy button gated to current count
  btnBuyAuto.disabled = count < 100;
}

function triggerBounce() {
  counterEl.classList.remove('bounce');
  void counterEl.offsetWidth;
  counterEl.classList.add('bounce');
}

// ── Button Handlers ───────────────────────────────────────────────────────
btnIncrement.addEventListener('click', () => {
  count += 1;
  render();
  triggerBounce();
  triggerWindowFlicker();
  checkMilestone(count);
});

btnDecrement.addEventListener('click', () => {
  if (count > 0) {
    count -= 1;
    render();
    triggerBounce();
    triggerWindowFlicker();
  }
});

// ── Shop Menu Toggle ──────────────────────────────────────────────────────
btnMenu.addEventListener('click', () => {
  const isOpen = shopMenu.classList.toggle('open');
  btnMenu.classList.toggle('open', isOpen);
});

// Close when clicking anywhere outside the shop wrapper
document.addEventListener('click', (e) => {
  if (!e.target.closest('.shop-wrapper')) {
    shopMenu.classList.remove('open');
    btnMenu.classList.remove('open');
  }
});

// ── Autoclicker Purchase ──────────────────────────────────────────────────
btnBuyAuto.addEventListener('click', () => {
  if (count < 100) return;
  count -= 100;
  autoclickerLevel += 1;
  autoclickerOwned.textContent = `${autoclickerLevel} owned`;
  render();
  // Burst of window flickers to celebrate the purchase
  for (let i = 0; i < 5; i++) triggerWindowFlicker();
});

// Autoclicker tick: +autoclickerLevel every second
setInterval(() => {
  if (autoclickerLevel === 0) return;
  count += autoclickerLevel;
  render();
  triggerBounce();
  triggerWindowFlicker();
  checkMilestone(count);
}, 1000);

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
let keepItUpState = null;

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

  let tallest = cityRects[0];
  for (const r of cityRects) {
    if (r.h > tallest.h) tallest = r;
  }
  tallest.hasAntenna = true;

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
            triggered: false,
            triggeredFrame: 0,
            triggeredDuration: 0,
          });
        }
      }
    }
  }
}

// ── Window Flash on Button Press ─────────────────────────────────────────
function triggerWindowFlicker() {
  if (cityWindows.length === 0) return;
  const idx = Math.floor(Math.random() * cityWindows.length);
  const w = cityWindows[idx];
  w.triggered = true;
  w.triggeredFrame = frame;
  w.triggeredDuration = 18 + Math.floor(Math.random() * 14);
}

// ── "Keep it up!" Milestone ──────────────────────────────────────────────
function checkMilestone(value) {
  if (value > 0 && value % 100 === 0) {
    keepItUpState = {
      startFrame: frame,
      sparkles: Array.from({ length: 30 }, () => ({
        x: Math.random() * 295 - 10,
        y: (Math.random() - 0.5) * 58,
        r: Math.random() * 2 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.1 + 0.04,
      })),
    };
  }
}

function drawKeepItUp() {
  if (!keepItUpState) return;
  const elapsed = frame - keepItUpState.startFrame;
  const DURATION = 180;
  if (elapsed >= DURATION) { keepItUpState = null; return; }

  const progress = elapsed / DURATION;
  const alpha = progress < 0.1  ? progress / 0.1
              : progress > 0.8  ? (1 - progress) / 0.2
              : 1;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(50, 185);
  ctx.rotate(-Math.PI / 5.5);

  const text = 'Keep it up!';
  ctx.font = 'bold 2.6rem "Segoe UI", system-ui, sans-serif';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = 'rgba(160, 210, 255, 1)';
  ctx.shadowBlur = 38;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillText(text, 0, 0);

  ctx.shadowBlur = 18;
  ctx.fillStyle = 'rgba(220, 240, 255, 0.5)';
  ctx.fillText(text, 0, 0);

  ctx.shadowBlur = 5;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillText(text, 0, 0);

  ctx.shadowBlur = 0;
  ctx.shadowColor = 'rgba(0, 0, 0, 0)';
  for (const sp of keepItUpState.sparkles) {
    sp.phase += sp.speed;
    const a = 0.3 + Math.abs(Math.sin(sp.phase)) * 0.7;
    ctx.fillStyle = `rgba(255, 255, 210, ${a})`;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ── Draw Loop ────────────────────────────────────────────────────────────
function draw() {
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = '#050810';
  ctx.fillRect(0, 0, W, H);

  const mwGrad = ctx.createLinearGradient(W * 0.18, 0, W * 0.78, H * 0.82);
  mwGrad.addColorStop(0,   'rgba(70, 90, 160, 0)');
  mwGrad.addColorStop(0.5, 'rgba(70, 90, 160, 0.075)');
  mwGrad.addColorStop(1,   'rgba(70, 90, 160, 0)');
  ctx.fillStyle = mwGrad;
  ctx.fillRect(0, 0, W, H);

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

  const glowGrad = ctx.createLinearGradient(0, H - 240, 0, H);
  glowGrad.addColorStop(0, 'rgba(255, 120, 30, 0)');
  glowGrad.addColorStop(1, 'rgba(255, 100, 20, 0.13)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, H - 240, W, 240);

  ctx.fillStyle = '#060c16';
  for (const r of cityRects) {
    ctx.fillRect(r.x, r.y, r.w, r.h);
    if (r.hasAntenna) {
      ctx.fillRect(r.x + Math.floor(r.w / 2) - 1, r.y - 28, 2, 28);
      ctx.fillRect(r.x + Math.floor(r.w / 2) - 3, r.y - 28, 6, 3);
    }
  }

  frame++;
  for (const w of cityWindows) {
    if (w.triggered) {
      const elapsed = frame - w.triggeredFrame;
      if (elapsed < w.triggeredDuration) {
        const t = elapsed / w.triggeredDuration;
        ctx.save();
        ctx.shadowColor = 'rgba(255, 255, 180, 0.9)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = `rgba(255, 255, 200, ${1.0 - t * 0.3})`;
        ctx.fillRect(w.x, w.y, 5, 7);
        ctx.restore();
        continue;
      }
      w.triggered = false;
    }

    let alpha = 0.75;
    if (w.flicker) {
      alpha = 0.4 + Math.abs(Math.sin(frame * 0.08 + w.phase * 8)) * 0.55;
    }
    ctx.fillStyle = `rgba(255, 218, 100, ${alpha})`;
    ctx.fillRect(w.x, w.y, 5, 7);
  }

  drawKeepItUp();
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
