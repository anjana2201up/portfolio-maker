/* ═══════════════════════════════════════
   PORTFOLIO+ — shared.js
   Dot canvas, navbar, scroll reveal
   ═══════════════════════════════════════ */

/* ── TOPBAR SCROLL ────────────────────── */
(function () {
  const bar = document.getElementById('topbar');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    bar.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
})();

/* ── SCROLL REVEAL ────────────────────── */
(function () {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('vis'); });
  }, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();

/* ── TOAST ────────────────────────────── */
let _toastTimer;
function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = 'toast show ' + type;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { el.className = 'toast'; }, 2800);
}

/* ══ ANIMATED DOT CANVAS ════════════════
   3-layer system:
   1. Static grid dots — breathe & mouse-react
   2. Floating orbs — drift & glow
   3. Ripple rings — click & random
   ════════════════════════════════════════ */
(function initDotCanvas() {
  const bg = document.getElementById('bgCanvas');
  if (!bg) return;
  const ctx = bg.getContext('2d');
  let W, H, dots = [], ripples = [], tick = 0;
  let mouse = { x: -999, y: -999 };

  const ORB_COLORS = [
    [99, 102, 241],   // indigo
    [59, 130, 246],   // blue
    [6,  182, 212],   // cyan
    [139, 92, 246],   // violet
    [236, 72, 153],   // pink
    [16, 185, 129],   // green (rare)
  ];

  function resize() {
    W = bg.width  = innerWidth;
    H = bg.height = innerHeight;
    buildDots();
  }

  function buildDots() {
    dots = [];
    // Grid dots
    const GAP = 46;
    for (let r = 0; r * GAP <= H + GAP; r++) {
      for (let c = 0; c * GAP <= W + GAP; c++) {
        dots.push({
          kind: 'g',
          x: c * GAP, y: r * GAP,
          ph: Math.random() * Math.PI * 2,
          sp: 0.011 + Math.random() * 0.009,
          ba: 0.1 + Math.random() * 0.09,
        });
      }
    }
    // Floating orbs
    const N_ORBS = Math.min(32, Math.floor(W * H / 40000));
    for (let i = 0; i < N_ORBS; i++) {
      const col = ORB_COLORS[i % ORB_COLORS.length];
      dots.push({
        kind: 'o',
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        r:  1.8 + Math.random() * 3.2,
        ph: Math.random() * Math.PI * 2,
        sp: 0.007 + Math.random() * 0.013,
        col,
        ba: 0.28 + Math.random() * 0.38,
        cr: 95 + Math.random() * 85,
      });
    }
  }

  function gradLine(ax, ay, bx, by, alpha, cs) {
    const g = ctx.createLinearGradient(ax, ay, bx, by);
    g.addColorStop(0, `rgba(${cs},${alpha})`);
    g.addColorStop(1, `rgba(${cs},0)`);
    ctx.strokeStyle = g;
    ctx.lineWidth = 0.55;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  }

  function frame() {
    tick++;
    ctx.clearRect(0, 0, W, H);

    const orbs = dots.filter(d => d.kind === 'o');
    const grid = dots.filter(d => d.kind === 'g');

    // ── grid dots
    grid.forEach(d => {
      const pulse = Math.sin(tick * d.sp + d.ph);
      const dist  = Math.hypot(d.x - mouse.x, d.y - mouse.y);
      const boost = dist < 95 ? (1 - dist / 95) * 0.55 : 0;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 1.15 + pulse * 0.45 + boost, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(148,163,184,${d.ba + pulse * 0.045 + boost * 0.38})`;
      ctx.fill();
    });

    // ── orbs
    orbs.forEach(d => {
      // drift
      d.x += d.vx; d.y += d.vy;
      if (d.x < -20) d.x = W + 20; if (d.x > W + 20) d.x = -20;
      if (d.y < -20) d.y = H + 20; if (d.y > H + 20) d.y = -20;

      // mouse repel
      const mdx = d.x - mouse.x, mdy = d.y - mouse.y, md = Math.hypot(mdx, mdy);
      if (md < 85 && md > 0) { d.x += (mdx / md) * 1.4; d.y += (mdy / md) * 1.4; }

      const pulse = Math.sin(tick * d.sp + d.ph);
      const r     = d.r + pulse * 1.3;
      const alpha = d.ba + pulse * 0.14;
      const cs    = d.col.join(',');

      // glow halo
      const grd = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, r * 4.5);
      grd.addColorStop(0, `rgba(${cs},${alpha * 0.52})`);
      grd.addColorStop(1, `rgba(${cs},0)`);
      ctx.beginPath(); ctx.arc(d.x, d.y, r * 4.5, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.fill();

      // core dot
      ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${cs},${Math.min(1, alpha * 1.9)})`;
      ctx.fill();
    });

    // ── connections between orbs
    for (let i = 0; i < orbs.length; i++) {
      for (let j = i + 1; j < orbs.length; j++) {
        const a = orbs[i], b = orbs[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const mx = Math.min(a.cr, b.cr);
        if (d < mx) gradLine(a.x, a.y, b.x, b.y, (1 - d / mx) * 0.26, a.col.join(','));
      }
    }

    // ── mouse → orb threads
    if (mouse.x > 0) {
      orbs.forEach(d => {
        const dist = Math.hypot(d.x - mouse.x, d.y - mouse.y);
        if (dist < 175) gradLine(d.x, d.y, mouse.x, mouse.y, (1 - dist / 175) * 0.42, d.col.join(','));
      });
    }

    // ── ripples
    if (tick % 190 === 0) spawnRipple(Math.random() * W, Math.random() * H, 0.28);
    ripples = ripples.filter(rp => rp.alpha > 0.008);
    ripples.forEach(rp => {
      rp.r += 1.9; rp.alpha *= 0.962;
      ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(99,102,241,${rp.alpha})`;
      ctx.lineWidth = 0.75; ctx.stroke();
    });

    requestAnimationFrame(frame);
  }

  function spawnRipple(x, y, a = 0.55) {
    ripples.push({ x, y, r: 0, alpha: a });
  }

  window.addEventListener('mousemove',  e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  window.addEventListener('mouseleave', () => { mouse.x = -999; mouse.y = -999; });
  window.addEventListener('click',      e => spawnRipple(e.clientX, e.clientY));
  window.addEventListener('resize',     resize);

  resize();
  frame();
})();