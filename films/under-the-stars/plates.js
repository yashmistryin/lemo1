// Painted plates for "Under the Stars", painted once at load: colour canvas + emissive canvas.
import { canvas, rng, rgba, mix, airbrush, vgrad, TAU, poly } from './cel.js';

// star sky (big, for the pull-out): gradient, milky way, stars on both canvases
export function starSky(w, h, seed, mode = 'night') {
  const [c, g] = canvas(w, h), [ec, e] = canvas(w, h), R = rng(seed);
  e.fillStyle = '#000'; e.fillRect(0, 0, w, h);
  if (mode === 'night') vgrad(g, 0, 0, w, h, [[0, '#03021a'], [.4, '#0d0b36'], [.75, '#2a1456'], [1, '#6a2468']]);
  else vgrad(g, 0, 0, w, h, [[0, '#2a3474'], [.35, '#6c5aa0'], [.65, '#e88a98'], [.85, '#ffc29a'], [1, '#ffe8b8']]);
  // milky way: a diagonal band of airbrushed haze with dust lanes
  if (mode === 'night') {
    for (let i = 0; i < 70; i++) { const u = R(), x = u * w, y = h * (.75 - u * .55) + (R() - .5) * h * .12; airbrush(g, x, y, 120 + R() * 260, 60 + R() * 120, R() < .5 ? '#7a6ad8' : '#c79ae8', .06 + R() * .05); }
    for (let i = 0; i < 26; i++) { const u = R(), x = u * w, y = h * (.75 - u * .55) + (R() - .5) * 30; airbrush(g, x, y, 90 + R() * 160, 14 + R() * 18, '#08061e', .3); }
  }
  const n = mode === 'night' ? Math.round(w * h / 2600) : Math.round(w * h / 30000);
  for (let i = 0; i < n; i++) {
    const x = R() * w, y = R() * h * (mode === 'night' ? .92 : .45), b = R(), r = b > .985 ? 2.6 : b > .9 ? 1.6 : .9;
    const col = R() < .2 ? '#ffe6b0' : R() < .3 ? '#b8d4ff' : '#f2eeff';
    g.fillStyle = rgba(col, .45 + b * .55); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    if (b > .9) { e.fillStyle = rgba(col, .5 * b); e.beginPath(); e.arc(x, y, r * 2.2, 0, TAU); e.fill(); }
    if (b > .985) { e.fillStyle = rgba(col, .55); e.fillRect(x - r * 9, y - .8, r * 18, 1.6); e.fillRect(x - .8, y - r * 9, 1.6, r * 18); }
  }
  return { c, e: ec, w, h };
}

// rooftop seen from behind her: ledge in front, water tank and antenna on the left, the city spread below
export function roofPlate(mode, city) {
  const W = 1920, H = 1080, [c, g] = canvas(W, H), [ec, e] = canvas(W, H), night = mode === 'night', R = rng(night ? 5 : 6);
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  // the city below, from the skyline plate, horizon at y = 640
  g.drawImage(city.c, 300, 0, 1920, city.h, 0, 640 - city.h, 1920, city.h); e.drawImage(city.e, 300, 0, 1920, city.h, 0, 640 - city.h, 1920, city.h);
  vgrad(g, 0, 620, W, 160, [[0, rgba(night ? '#ff4fa8' : '#ffd2a0', 0)], [1, rgba(night ? '#ff4fa8' : '#ffd2a0', night ? .35 : .4)]]);
  // street-light grid far below: glowing dots in perspective rows
  for (let row = 0; row < 7; row++) {
    const y = 650 + row * row * 6 + row * 10, sp = 40 + row * 18;
    for (let x = (row * 37) % sp; x < W; x += sp) {
      if (R() < .35) continue; const col = R() < .7 ? '#ffcf80' : '#ff6ad0';
      g.fillStyle = rgba(col, night ? .9 : .4); g.fillRect(x, y, 3 + row * .5, 2 + row * .3);
      if (night) { e.fillStyle = rgba(col, .35); e.fillRect(x - 2, y - 1, 7 + row, 4 + row * .5); }
    }
  }
  // water tank on legs (left) + antenna mast with a red lamp
  const tc = night ? { f: '#2a2246', s: '#1a1530', h: '#4a3c78', l: '#0e0a1c' } : { f: '#8a6a8a', s: '#5e4466', h: '#e8b0a0', l: '#3a2440' };
  g.fillStyle = tc.l; for (const x of [210, 330]) g.fillRect(x, 520, 14, 300);
  g.strokeStyle = tc.l; g.lineWidth = 6; g.beginPath(); g.moveTo(210, 560); g.lineTo(344, 700); g.moveTo(344, 560); g.lineTo(210, 700); g.stroke();
  g.fillStyle = tc.f; g.fillRect(170, 330, 220, 200); g.fillStyle = tc.s; g.fillRect(170, 330, 70, 200);
  g.fillStyle = tc.h; g.fillRect(380, 330, 10, 200);
  g.beginPath(); g.moveTo(160, 330); g.lineTo(280, 270); g.lineTo(400, 330); g.closePath(); g.fillStyle = tc.s; g.fill();
  g.fillStyle = tc.l; g.fillRect(1560, 260, 10, 560); g.fillRect(1530, 340, 70, 6); g.fillRect(1540, 420, 50, 6);
  g.fillStyle = '#ff5050'; g.beginPath(); g.arc(1565, 256, 6, 0, TAU); g.fill(); e.fillStyle = '#ff2a2a'; e.beginPath(); e.arc(1565, 256, 12, 0, TAU); e.fill();
  // roof deck + parapet ledge (foreground, the line she sits on)
  vgrad(g, 0, 780, W, 300, [[0, night ? '#221a3a' : '#7a5a6e'], [1, night ? '#0c0918' : '#3a2838']]);
  const ledge = poly([[0, 800], [W, 790], [W, 860], [0, 872]]);
  g.fillStyle = night ? '#3a2e5a' : '#c8a0a0'; g.fill(ledge);
  g.fillStyle = night ? '#5a4a86' : '#ffd8b8'; g.fillRect(0, 790, W, 8);
  g.fillStyle = rgba('#000000', .35); g.fillRect(0, 862, W, 14);
  // a few deck details
  g.fillStyle = night ? '#18122a' : '#4a3444'; g.fillRect(1180, 900, 220, 70); g.fillRect(1210, 880, 40, 20);
  g.strokeStyle = night ? '#2c2244' : '#6a4a5a'; g.lineWidth = 3; for (let x = 0; x < W; x += 160) { g.beginPath(); g.moveTo(x, 876); g.lineTo(x - 120, H); g.stroke(); }
  return { c, e: ec, w: W, h: H };
}

// sea of clouds at sunrise (the harmony still): sky, sun, airbrushed cloud banks lit from below-right
export function cloudSea(w, h) {
  const [c, g] = canvas(w, h), [ec, e] = canvas(w, h), R = rng(77);
  e.fillStyle = '#000'; e.fillRect(0, 0, w, h);
  vgrad(g, 0, 0, w, h, [[0, '#2c3a86'], [.3, '#7a64b0'], [.52, '#f08aa0'], [.62, '#ffc896'], [.7, '#fff0c8'], [1, '#b07aa8']]);
  const sx = w * .62, sy = h * .64;
  airbrush(g, sx, sy, 900, 420, '#fff2c8', .7); airbrush(e, sx, sy, 520, 260, '#ffe6a8', .7);
  g.fillStyle = '#fffbe8'; g.beginPath(); g.arc(sx, sy, 92, 0, TAU); g.fill(); e.fillStyle = '#fff6d0'; e.beginPath(); e.arc(sx, sy, 100, 0, TAU); e.fill();
  // god rays
  e.save(); e.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 14; k++) { const a = -Math.PI * .95 + k * Math.PI * .9 / 13 + (R() - .5) * .05, len = 1400; e.fillStyle = rgba('#ffe0a0', .05 + R() * .05);
    e.beginPath(); e.moveTo(sx, sy); e.lineTo(sx + Math.cos(a - .02) * len, sy + Math.sin(a - .02) * len); e.lineTo(sx + Math.cos(a + .02) * len, sy + Math.sin(a + .02) * len); e.fill(); }
  e.restore();
  // cloud banks: big soft masses painted back to front: shadowed body, then the lit top edge facing the sun
  for (let row = 0; row < 5; row++) {
    const y0 = h * .7 + row * row * 14 + row * 40, s = .8 + row * .45, near = row / 4;
    for (let x = -300; x < w + 300; x += (260 + R() * 220) * s) {
      const rw = (220 + R() * 200) * s, rh = (60 + R() * 50) * s, y = y0 + (R() - .5) * 30 * s, dx = (sx - x) / w, lit = Math.max(0, 1 - Math.abs(dx) * 1.8);
      g.save(); g.filter = `blur(${10 + row * 4}px)`;
      g.fillStyle = mix('#9a6aa8', '#5a3a78', near); g.beginPath(); g.ellipse(x, y, rw, rh, 0, 0, TAU); g.fill();
      for (let k = 0; k < 4; k++) { const px = x + (k - 1.5) * rw * .42 + (R() - .5) * 30, pr = rh * (.7 + R() * .6);
        g.fillStyle = mix('#b07ab0', '#6a4688', near); g.beginPath(); g.arc(px, y - rh * .4, pr, 0, TAU); g.fill();
        g.fillStyle = rgba(mix('#ffc8a8', '#fff0d0', lit), .35 + .55 * lit); g.beginPath(); g.ellipse(px + dx * pr * .5, y - rh * .4 - pr * .35, pr * .85, pr * .45, 0, 0, TAU); g.fill(); }
      g.restore();
      if (lit > .5 && row < 3) airbrush(e, x, y - rh * .6, rw * .8, rh, '#ffd090', .2 * lit);
    }
  }
  return { c, e: ec, w, h, sun: [sx, sy] };
}
