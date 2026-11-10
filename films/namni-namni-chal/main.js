// Namni Namni Chal: music video in the Pichhwai Night style. render(t) draws one frame; the owner's song is the soundtrack.
import { canvas, rgba, mix, vgrad, airbrush, hash, rng, TAU } from './cel.js';
import { W, H, BW, C, borderPlate, clothPlate, nightPlate, pondPlate, lanePlate, courtyardPlate, tulsi, rangoli, diya, lotus, moon, stars, cloudBand, tree, cow, archFrame, archPath, flower, mirror } from './paint.js';
import { her, him } from './figures.js';

const qs = new URLSearchParams(location.search);
const LY = await (await fetch('lyrics.json')).json();
const DUR = 94.08;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2, eo = u => 1 - Math.pow(1 - u, 3);
const q12 = t => Math.floor(t * 12 + 1e-6) / 12, f12 = t => Math.floor(t * 12 + 1e-6), q8 = t => Math.floor(t * 8 + 1e-6) / 8;
const BEAT = 60 / 74;

const SHOTS = [[0, 15.94, 'open'], [15.94, 18.9, 'eye'], [18.9, 22.26, 'murti'], [22.26, 29.4, 'tulsi'], [29.4, 34.34, 'pond'], [34.34, 41.72, 'diptych'],
  [41.72, 48.22, 'gate'], [48.22, 55.3, 'step'], [55.3, 57.8, 'moonhold'], [57.8, 73.2, 'walk'], [73.2, 90.4, 'dance'], [90.4, DUR, 'close']];
const shotAt = t => SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];

const cv = document.getElementById('c'), g = cv.getContext('2d');
await document.fonts.load('600 60px "Noto Serif Gujarati"', 'તારી આંખો વાતો કરતી'); await document.fonts.load('800 60px "Baloo Bhai 2"', 'નમણી ચાલ');
await document.fonts.load('500 30px "Noto Serif Gujarati"', 'Your eyes speak');

// —— plates (painted once) ——
const BORDER = borderPlate(), CLOTH = clothPlate(), NIGHT = nightPlate(), LANE = lanePlate(), YARD = courtyardPlate();
const POND = pondPlate(3600, 640, 9);
const [skyC, sg] = canvas(W, H); vgrad(sg, 0, 0, W, H, [[0, C.indigo2], [.7, C.night], [1, '#2a3c8c']]); stars(sg, W, H * .8, 160, 3); cloudBand(sg, 80, W, '#2a3c8c', '#5a6ec8');
const [panelC, pg] = canvas(W, H); pg.fillStyle = C.indigo; pg.fillRect(0, 0, W, H);
for (let y = 60; y < H; y += 90) for (let x = 60 + ((y / 90 | 0) % 2) * 45; x < W; x += 90) flower(pg, x, y, 16, rgba(C.gold2, .25), rgba(C.gold2, .4));

const fig = (fn, x, y, s, o, flip = false) => { g.save(); g.translate(x, y); g.scale(flip ? -s : s, s); const r = fn(g, o); g.restore(); return r; };
const petals = (t, n, seed, col = ['#ffb02a', '#d81a3a', '#fffaf0']) => { for (let i = 0; i < n; i++) { const sp = 60 + hash(i + seed) * 80, x = (hash(i * 3.1 + seed) * W + Math.sin(t * .8 + i) * 60), y = ((hash(i * 7.7 + seed) * (H + 200) + t * sp) % (H + 200)) - 100, a = t * 2 + i;
  g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = col[i % col.length]; g.beginPath(); g.ellipse(0, 0, 9, 5, 0, 0, TAU); g.fill(); g.restore(); } };
const walkSway = ph => Math.sin(ph * TAU) * .35;

// 1 the cloth unrolls: night pond, moon, cows; title cartouche
function open(t) {
  const k = .8 + .1 * ease(seg(t, 0, 16)), ox = (W - NIGHT.w * k) / 2 + 40 - t * 4, oy = -60 * k - t * 6;
  g.drawImage(NIGHT.c, ox, oy, NIGHT.w * k, NIGHT.h * k);
  for (let i = 0; i < 8; i++) { const a = .5 + .5 * Math.sin(t * 2 + i * 1.7); g.fillStyle = rgba('#fff6dc', .5 * a); g.beginPath(); g.arc(200 + hash(i) * 1500, 90 + hash(i * 2.3) * 260, 2.5 + a * 2, 0, TAU); g.fill(); }
  const rev = ease(seg(t, 1.2, 7.5)) * H;
  if (rev < H) { g.fillStyle = C.red2; g.fillRect(0, rev, W, H - rev);
    vgrad(g, 0, rev - 18, W, 46, [[0, C.goldL], [.4, C.gold2], [1, C.goldL]]); for (let x = 60; x < W; x += 120) mirror(g, x, rev + 5, 6, C.red); }
  const ti = seg(t, 7.5, 9), to = 1 - seg(t, 14.6, 15.9);
  if (ti > 0 && to > 0) { g.save(); g.globalAlpha = ti * to; title(960, 300, 1); g.restore(); }
}
function title(x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const P = new Path2D(); P.roundRect(-430, -110, 860, 210, 30); g.fillStyle = rgba(C.red2, .92); g.fill(P); g.strokeStyle = C.gold; g.lineWidth = 10; g.stroke(P); g.strokeStyle = C.goldL; g.lineWidth = 2; g.stroke(P);
  for (let k = -3; k <= 3; k++) mirror(g, k * 120, -110, 7, C.leaf2);
  g.font = '800 120px "Baloo Bhai 2"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.strokeStyle = C.red2; g.lineWidth = 14; g.strokeText('નમણી નમણી ચાલ', 0, 4);
  const gr = g.createLinearGradient(0, -60, 0, 60); gr.addColorStop(0, C.gold2); gr.addColorStop(.6, C.gold); gr.addColorStop(1, '#b07a20'); g.fillStyle = gr; g.fillText('નમણી નમણી ચાલ', 0, 4);
  g.restore();
}
// 2 extreme close-up of her eye
function eye(t, lt) {
  g.drawImage(panelC, 0, 0);
  const k = q8(t), bl = k >= 16.4 && k < 16.55 ? 1 : 0, look = seg(t, 17.3, 17.6) * 1.2, s = 6.2 + lt * .25;
  fig(her, 960 - 50 * s, 560 + 802 * s, s, { blink: bl, look, wind: .2, arm: [.1, .2, .1, .2] });
}
// 3 she stands in a jharokha arch like a murti; flowers drift
function murti(t, lt) {
  g.drawImage(panelC, 0, 0);
  const z = 1 + lt * .03; g.save(); g.translate(960, 560); g.scale(z, z); g.translate(-960, -560);
  const P = archFrame(g, 620, 70, 680, 930);
  g.save(); g.clip(P); fig(her, 950, 990, 1.0, { arm: [.95, 1.55, .85, 1.6], wind: .15, blink: q8(t) > 20.6 && q8(t) < 20.75 ? 1 : 0 }); g.restore();
  for (const x of [560, 1360]) { g.fillStyle = C.gold; g.fillRect(x, 120, 40, 880); for (let y = 150; y < 1000; y += 60) mirror(g, x + 20, y, 6, C.red); }
  g.restore();
  petals(t, 26, 1);
}
// 4 dawn courtyard: she circles the tulsi with a diya
function tulsiShot(t, lt, u) {
  g.drawImage(YARD.c, 0, 0);
  rangoli(g, 960, 900, 300);
  const th = -Math.PI / 2 + u * TAU * .9, x = 960 + Math.cos(th) * 430, depth = Math.sin(th), s = .62 + depth * .1, y = 860 + depth * 70;
  const facingRight = -Math.sin(th) > 0, ph = (f12(t) % 12) / 12;
  const draw = () => { const r = fig(her, x, y, s, { arm: [.9, 1.5, .8, 1.55], sway: walkSway(ph), step: ph, wind: .3 }, !facingRight);
    const hx = x + (facingRight ? 1 : -1) * r.hand[0] * s, hy = y + r.hand[1] * s; diya(g, hx, hy, .9, hash(f12(t) % 3)); };
  if (depth < 0) draw();
  tulsi(g, 960, 790, 1.05);
  if (depth >= 0) draw();
  const z = seg(t, 25.52, 29.4); if (z > 0) { g.fillStyle = rgba('#fff4d8', .0); }
}
// 5 interlude: pan along the lotus pond, lotuses open in rows
function pond(t, lt, u) {
  vgrad(g, 0, 0, W, 460, [[0, C.indigo2], [1, C.night]]); stars(g, W, 380, 80, 7); moon(g, 1500 - u * 200, 200, 80);
  const ox = -u * (POND.w - W);
  g.drawImage(POND.c, ox, 440);
  for (const [px, py] of POND.spots) { const sx = px + ox; if (sx < -80 || sx > W + 80) continue; const open = eo(seg(sx, 1500, 700)); lotus(g, sx, py + 440, 1.1, .15 + .85 * open); }
  for (let i = 0; i < 3; i++) cow(g, ((i * 900 - u * 400) % 2600 + 2600) % 2600 - 300, 470, .7, i % 2 === 1);
}
// 6 diptych: him in one arch, her in the other
function diptych(t, lt, u) {
  g.drawImage(panelC, 0, 0);
  const z = 1 + ease(seg(t, 38.36, 41.7)) * .18, cx = 960 + ease(seg(t, 38.36, 41.7)) * 260;
  g.save(); g.translate(cx, 560); g.scale(z, z); g.translate(-960, -560);
  const A = archFrame(g, 230, 110, 560, 860, '#7a2418'), B = archFrame(g, 1130, 110, 560, 860, '#7a2418');
  g.save(); g.clip(A); fig(him, 470, 960, .9, { arm: [.25, .5, .05, .3], blink: q8(t) > 36.2 && q8(t) < 36.35 ? 1 : 0 }); g.restore();
  g.save(); g.clip(B); fig(her, 1450, 960, .9, { arm: [.2, .9, .1, .4], look: seg(t, 37.0, 37.3) * 1.2, head: -.04, wind: .2 }, true); g.restore();
  g.restore();
}
// 7 through the courtyard gate: his side; she at the tulsi
function gate(t, lt, u) {
  const z = 1 + u * .08; g.save(); g.translate(960, 600); g.scale(z, z); g.translate(-960, -600);
  g.drawImage(YARD.c, 0, 0); g.fillStyle = rgba('#6a3a7a', .25); g.fillRect(0, 0, W, H);   // dusk
  tulsi(g, 900, 790, 1.0);
  const r = fig(her, 1260, 880, .62, { arm: [.95, 1.45, .85, 1.5], wind: .2, head: .05 }, true);
  diya(g, 1260 - r.hand[0] * .62, 880 + r.hand[1] * .62, .9, hash(f12(t) % 3));
  diya(g, 900, 610, .8, hash(f12(t) % 3 + 5));
  g.restore();
  // the doorway he stands in (foreground frame) and his shoulder at the left edge
  g.fillStyle = '#2a1810'; g.fillRect(0, 0, 330, H); g.fillRect(1640, 0, 280, H); g.fillRect(0, 0, W, 120);
  g.strokeStyle = C.red; g.lineWidth = 18; g.strokeRect(330, 120, 1310, 1000); g.strokeStyle = C.gold; g.lineWidth = 5; g.strokeRect(340, 130, 1290, 1000);
  for (let k = 0; k < 18; k++) { g.fillStyle = k % 2 ? C.leaf : C.gold2; g.beginPath(); g.moveTo(340 + k * 72, 130); g.lineTo(376 + k * 72, 200); g.lineTo(412 + k * 72, 130); g.fill(); }
  fig(him, 150, 1560, 1.6, { arm: [.05, .2, .0, .2] });
}
// 8 he walks toward her house with a rose, slows, stops
function step(t, lt, u) {
  const wx = t < 52 ? (t - 48.22) * 190 : 3.78 * 190 + 152 * (1 - Math.pow(1 - seg(t, 52, 53.6), 2));
  const cam = wx * .75;
  const off = ((-cam * .9) % LANE.w + LANE.w) % LANE.w - LANE.w; for (let xx = off; xx < W; xx += LANE.w) g.drawImage(LANE.c, xx, 0);
  for (const [lx, ly] of LANE.lamps) { const sx = ((lx - cam * .9) % LANE.w + LANE.w) % LANE.w; if (sx < W + 50) diya(g, sx, ly, .9, hash(f12(t) % 3 + lx)); }
  const ph = t < 53.6 ? ((t - 48.22) * 1.25) % 1 : -1;
  fig(him, 560 + wx * .25, 930, .72, { step: ph, rose: true, arm: [.45, 1.0, -.2 + Math.sin(ph * TAU) * .2, .2], blink: t > 54.2 && t < 54.35 ? 1 : 0 });
}
// 9 the break: a held moon, one petal falls
function moonhold(t, lt) {
  g.drawImage(skyC, 0, 0); moon(g, 960, 480, 210 + lt * 6);
  const y = -40 + lt * 200, x = 1000 + Math.sin(lt * 2) * 60; g.save(); g.translate(x, y); g.rotate(lt * 1.5); g.fillStyle = '#d81a3a'; g.beginPath(); g.ellipse(0, 0, 16, 9, 0, 0, TAU); g.fill(); g.restore();
}
// 10 chorus 1: her walk through the lane; inserts on the kandoro and the roses; he watches from a doorway
function walk(t, lt) {
  const ph = ((t - 57.8) / (BEAT * 2)) % 1, wx = (t - 57.8) * 160, cam = wx;
  const insert = t >= 61.2 && t < 64.3 ? 'waist' : t >= 64.3 && t < 68.0 ? 'roses' : null;
  const off = ((-cam * .9) % LANE.w + LANE.w) % LANE.w - LANE.w;
  if (!insert) {
    for (let xx = off; xx < W; xx += LANE.w) g.drawImage(LANE.c, xx, 0);
    for (const [lx, ly] of LANE.lamps) { const sx = ((lx - cam * .9) % LANE.w + LANE.w) % LANE.w; if (sx < W + 50) diya(g, sx, ly, .9, hash(f12(t) % 3 + lx)); }
    if (t > 68) { const hx = 1500 - (t - 68) * 160 * .9; fig(him, hx, 915, .64, { arm: [.15, .3, 0, .2], blink: 0 }, true); }
    fig(her, 860, 960, .78, { step: ph, sway: walkSway(ph), arm: [-.25 + Math.sin(ph * TAU) * .25, .5, .25 - Math.sin(ph * TAU) * .2, .4], wind: .6, ph });
    for (let k = 0; k < 6; k++) { const x = ((k * 420 - cam * 1.6) % 2520 + 2520) % 2520 - 300; g.fillStyle = k % 2 ? C.leaf : C.gold2; for (let j = 0; j < 8; j++) { g.beginPath(); g.moveTo(x + j * 30, 40); g.lineTo(x + 14 + j * 30, 96 + (j % 2) * 14); g.lineTo(x + 28 + j * 30, 40); g.fill(); } g.fillStyle = C.red; g.fillRect(x - 10, 34, 260, 8); }
  } else {
    g.drawImage(panelC, 0, 0);
    const s = 3.4, o = { step: ph, sway: walkSway(ph), arm: [-.25 + Math.sin(ph * TAU) * .25, .5, .25 - Math.sin(ph * TAU) * .2, .4], wind: .6, ph, glint: insert === 'waist' ? seg(t, 61.6, 63.4) : null };
    if (insert === 'waist') fig(her, 960, 540 + 460 * s, s, o);
    else { fig(her, 960 + 60 * s, 560 + 800 * s, s, { ...o, blink: q8(t) > 66.2 && q8(t) < 66.35 ? 1 : 0 }); petals(t, 18, 4, ['#d81a3a', '#fffaf0']); }
  }
}
// 11 chorus 2: they dance in a circle by the pond under the moon; a close two-shot at the end
function dance(t, lt, u) {
  g.drawImage(skyC, 0, 0); moon(g, 960, 230, 120);
  tree(g, 220, 700, .9, 3); tree(g, 1720, 700, .85, 8);
  g.drawImage(POND.c, -400, 700, 2700, 480);
  const two = t >= 84.3, flare = .5 + .3 * Math.sin(t * 3);
  if (!two) {
    const th = (t - 73.2) * TAU / (BEAT * 8) , sp = 330;
    const pos = k => { const a = th + k * Math.PI; return { x: 960 + Math.cos(a) * sp, y: 880 + Math.sin(a) * 60, d: Math.sin(a), right: -Math.sin(a) > 0 }; };
    const A = pos(0), B = pos(1), ph = (f12(t) % 8) / 8;
    const dh = () => fig(her, A.x, A.y, .6 + A.d * .05, { arm: [2.5, .35, 1.3, .3], flare, sway: Math.sin(t * 3), wind: .8, ph, step: ph }, !A.right);
    const dm = () => fig(him, B.x, B.y, .6 + B.d * .05, { arm: [2.2, .4, 1.2, .3], step: ph }, !B.right);
    if (A.d < B.d) { dh(); dm(); } else { dm(); dh(); }
  } else {
    const k = eo(seg(t, 84.3, 86.0)), s = .95 + k * .1;
    fig(him, 700, 1080 + 40, s, { arm: [.6, 1.0, .2, .4], rose: true });
    fig(her, 1240, 1080 + 40, s, { arm: [.5, 1.2, .2, .4], wind: .4, look: .3, blink: q8(t) > 88.0 && q8(t) < 88.15 ? 1 : 0 }, true);
  }
  petals(t, 30, 8);
  for (let i = 0; i < 6; i++) diya(g, 200 + i * 300, 1050, .8, hash(f12(t) % 3 + i));
}
// 12 the cloth rolls closed onto the title
function close(t, lt) {
  dance(90.39, 17.19, 1);
  const rev = H - ease(seg(t, 90.4, 92.2)) * H;
  g.fillStyle = C.red2; g.fillRect(0, rev, W, H - rev);
  for (let y = rev + 60; y < H; y += 90) for (let x = 60 + ((y / 90 | 0) % 2) * 45; x < W; x += 90) flower(g, x, y, 16, rgba(C.gold2, .25), rgba(C.gold2, .4));
  vgrad(g, 0, rev - 18, W, 46, [[0, C.goldL], [.4, C.gold2], [1, C.goldL]]);
  const ti = seg(t, 92.0, 92.6); if (ti > 0) { g.save(); g.globalAlpha = ti; title(960, 540, 1); g.restore(); }
  const out = seg(t, 93.5, DUR); if (out > 0) { g.fillStyle = rgba('#000000', out); g.fillRect(0, 0, W, H); }
}

// —— subtitles: Gujarati line + English translation on a cloth band ——
const SUB = LY.map((l, i) => ({ ...l, a: l.t - .15, b: Math.min(l.end ?? 99, (LY[i + 1]?.t ?? 99) - .15) }));
function subs(t) {
  const s = SUB.find(s => t >= s.a && t < s.b); if (!s) return;
  const a = seg(t, s.a, s.a + .25) * (1 - seg(t, s.b - .25, s.b)), y = H - BW - 92;
  g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.font = '600 58px "Noto Serif Gujarati"'; const w = Math.max(g.measureText(s.gu).width, 500) + 120;
  const P = new Path2D(); P.roundRect(960 - w / 2, y - 52, w, 128, 16); g.fillStyle = rgba(C.indigo2, .72); g.fill(P); g.strokeStyle = rgba(C.gold, .9); g.lineWidth = 3; g.stroke(P);
  g.strokeStyle = C.indigo2; g.lineWidth = 8; g.strokeText(s.gu, 960, y); g.fillStyle = C.cream; g.fillText(s.gu, 960, y);
  g.font = 'italic 500 30px "Noto Serif Gujarati"'; g.fillStyle = C.gold2; g.fillText(s.en, 960, y + 50);
  g.restore();
}
function texts(t) { const s = SUB.find(s => t >= s.a + .25 && t < s.b - .25); const out = [];
  if (s) { out.push({ id: 'gu' + s.t, text: s.gu, x0: 300, y0: H - 230, x1: W - 300, y1: H - 100 }); out.push({ id: 'en' + s.t, text: s.en, x0: 300, y0: H - 110, x1: W - 300, y1: H - 50 }); }
  if (t >= 9 && t < 14.6) out.push({ id: 'title', text: 'નમણી નમણી ચાલ', x0: 530, y0: 190, x1: 1390, y1: 400 });
  return out; }

const FN = { open, eye, murti, tulsi: tulsiShot, pond, diptych, gate, step, moonhold, walk, dance, close };
function model() {
  g.fillStyle = C.cream; g.fillRect(0, 0, W, H);
  fig(her, 220, 1000, .95, {}); fig(her, 560, 1000, .95, { step: .25, sway: .35, arm: [-.3, .5, .3, .4], wind: .7 }); fig(her, 900, 1000, .95, { arm: [2.5, .35, 1.3, .3], flare: .7, sway: .6, wind: .8 });
  fig(him, 1240, 1000, .95, { rose: true, arm: [.45, 1.0, -.1, .2] }); fig(him, 1560, 1000, .95, { step: .25 }); fig(him, 1820, 1000, .95, { arm: [2.2, .4, 1.2, .3] }, true);
}
function render(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
  g.fillStyle = C.indigo2; g.fillRect(0, 0, W, H);
  if (qs.get('test')) model();
  else { const [t0, t1, n] = shotAt(t); g.save(); FN[qs.get('shot') || n](t, t - t0, (t - t0) / (t1 - t0)); g.restore(); }
  g.globalCompositeOperation = 'multiply'; g.drawImage(CLOTH, 0, 0); g.globalCompositeOperation = 'source-over';
  g.drawImage(BORDER.c, 0, 0);
  // mirror-work glints: a slow light band travels round the border
  const gp = (t * .09) % 1; for (const [x, y] of BORDER.mirrors) { const p = (Math.atan2(y - H / 2, x - W / 2) / TAU + 1) % 1, d = Math.min(Math.abs(p - gp), 1 - Math.abs(p - gp)); if (d < .03) { g.fillStyle = rgba('#ffffff', .8 * (1 - d / .03)); g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill(); } }
  if (!qs.get('nosub') && !qs.get('test')) subs(t);
  if (t < .4) { g.fillStyle = rgba('#000000', 1 - t / .4); g.fillRect(0, 0, W, H); }
}
window.render = render; window.DUR = DUR; window.TEXTS = texts; window.EV = [];
render(parseFloat(qs.get('t') ?? '20'));
window.READY = true;
