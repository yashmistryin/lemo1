// Under the Stars: lyric music video, 80s Cel Anime. Every frame is render(t); the score's song.json drives the lyric timing.
import { canvas, W, H, TAU, LWK, rgba, mix, vgrad, airbrush, hash, rng, poly, path, cel, line } from './cel.js';
import { PAL } from './pal.js';
import { head80 } from './head80.js';
import { makePost } from './post.js';
import { skylinePlate, drawLoop, smear } from './bg.js';
import { speedLines, flare, lamp } from './fx.js';
import { starSky, roofPlate, cloudSea } from './plates.js';
import { girlSide, girlBack, POSE, blend } from './girl.js';

const qs = new URLSearchParams(location.search);
const SONG = await (await fetch('song.json')).json();
const BAR = SONG.bar, bar = n => n * BAR;
const DUR = SONG.dur;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
const eo = u => 1 - Math.pow(1 - u, 3);
const q12 = t => Math.floor(t * 12 + 1e-6) / 12, f12 = t => Math.floor(t * 12 + 1e-6), q8 = t => Math.floor(t * 8 + 1e-6) / 8;

// —— timeline (bars of 2.0 s) ——
const T = { shoot: bar(6), sweep: bar(9) + .5, blink: bar(10) + 1.4, eyes: bar(11), impact: bar(12), crouch: bar(12) + 1.15, jump: bar(12) + 1.5, freeze: bar(13), unfreeze: bar(13) + .5,
  flash: bar(21), land: bar(24) + .6, armsOpen: bar(24) + 1.6, title: SONG.title, tapeout: SONG.tapestop };
const SHOTS = [[0, bar(4), 'open'], [bar(4), bar(8), 'roof'], [bar(8), bar(11), 'gaze'], [bar(11), bar(12), 'eyes'], [bar(12), bar(14), 'leap'],
  [bar(14), bar(18), 'fly'], [bar(18), bar(21), 'canyon'], [bar(21), bar(24), 'sun'], [bar(24), DUR, 'dawn']];
const shotAt = t => SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];

const [sc, g] = canvas(W, H), [gc, e] = canvas(W, H), [ovc, ov] = canvas(W, H);
const post = makePost(document.getElementById('gl'));
await document.fonts.load('italic 900 56px Kanit'); await document.fonts.load('italic 800 56px Kanit');
await document.fonts.load('600 40px "Barlow SC"'); await document.fonts.load('700 40px "Barlow SC"');
await document.fonts.load('60px "Dela Gothic One"', 'BARCAFEHOTEL');

// —— plates ——
const A = {
  sky: starSky(3840, 2160, 11), skyN: starSky(1920, 1080, 12), skyD: starSky(1920, 1080, 13, 'dawn'),
  city: skylinePlate(3840, 560, 9, 'night'), cityD: skylinePlate(3840, 560, 5, 'dawn'), cityFar: skylinePlate(3840, 420, 3, 'night'),
};
A.roof = roofPlate('night', A.city); A.roofD = roofPlate('dawn', A.cityD); A.clouds = cloudSea(2600, 1080);
A.cityS = smear(A.city, 18, 8); A.cityFarS = smear(A.cityFar, 10, 6);

// cel layer with neon occlusion (the cel blocks glow behind it)
const [LC, LG] = canvas(W, H), [MC, MG] = canvas(W, H);
function celLayer(S, fn, o = {}) {
  LG.setTransform(1, 0, 0, 1, 0, 0); LG.clearRect(0, 0, W, H); LG.globalAlpha = 1; LG.filter = 'none'; LG.globalCompositeOperation = 'source-over';
  fn(LG); LG.setTransform(1, 0, 0, 1, 0, 0);
  if (o.post) o.post(LG);
  S.g.save(); if (o.alpha != null) S.g.globalAlpha = o.alpha; S.g.drawImage(LC, 0, 0); S.g.restore();
  MG.setTransform(1, 0, 0, 1, 0, 0); MG.globalCompositeOperation = 'source-over'; MG.clearRect(0, 0, W, H); MG.drawImage(LC, 0, 0);
  MG.globalCompositeOperation = 'source-in'; MG.fillStyle = '#000'; MG.fillRect(0, 0, W, H); MG.globalCompositeOperation = 'source-over';
  S.e.drawImage(MC, 0, 0);
}
// light band sweeping across a held cel (lights only the cel)
const band = (c, x, col, a, w = 260) => { c.globalCompositeOperation = 'source-atop'; const gr = c.createLinearGradient(x - w, 0, x + w, 0); gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(.5, rgba(col, a)); gr.addColorStop(1, rgba(col, 0)); c.fillStyle = gr; c.fillRect(x - w, 0, w * 2, H); c.globalCompositeOperation = 'source-over'; };
const twinkle = (t, n, seed, y1 = H * .6) => { for (let i = 0; i < n; i++) { const x = hash(i * 3.7 + seed) * W, y = hash(i * 5.1 + seed) * y1, k = .5 + .5 * Math.sin(t * (2 + hash(i) * 3) + i); lamp(g, e, x, y, 2 + 2 * k, '#f4eeff', .35 + .4 * k); } };
const RIM_N = { c: '#ff6ad0', d: [3, 3] }, RIM_GOLD = { c: '#ffd890', d: [-3, 2] };

// —— 1 pull-out from one star to the whole sky, the rooftop rising into frame ——
function open(S) {
  const { t, u } = S, k = ease(clamp(u * 1.06)), z = 5.2 - 4.2 * k, sx = 1210, sy = 300;
  for (const [ctx, img] of [[g, A.sky.c], [e, A.sky.e]]) { ctx.save(); ctx.translate(sx, sy); ctx.scale(z, z); ctx.translate(-sx, -sy); ctx.drawImage(img, 0, 0, W, H); ctx.restore(); }
  lamp(g, e, sx, sy, 5 + z * 2, '#fff4d8', .9); flare(e, sx, sy, .25 + z * .06, '#cfe0ff', { ghosts: false, streak: 500 });
  twinkle(t, 10, 1);
  // rooftop + city rise from below with more parallax than the sky (zr > z)
  const oy = 1100 * (1 - ease(seg(u, .38, 1)));
  if (oy < 1090) { for (const [ctx, img] of [[g, A.roof.c], [e, A.roof.e]]) ctx.drawImage(img, 0, oy);
    celLayer(S, c => { c.translate(960, 800 + oy); c.scale(.34, .34); girlBack(c, PAL.night, { mode: 'sit', ph: (f12(t) % 6) / 6, wind: .25, rim: RIM_N }); }); }
}
// —— 2 rooftop, full shot from behind, slow push-in; a shooting star crosses ——
function roof(S) {
  const { t, lt } = S, z = 1.32 + lt * .03, cx = 960, cy = 760;
  const view = (ctx, img, k = 1) => { ctx.save(); ctx.translate(cx, cy); ctx.scale(z * k, z * k); ctx.translate(-cx, -cy); ctx.drawImage(img, 0, 0, W, H); ctx.restore(); };
  view(g, A.skyN.c, .92); view(e, A.skyN.e, .92); twinkle(t, 14, 2, H * .5);
  const st = seg(t, T.shoot, T.shoot + .9);   // shooting star, upper right to left, on ones
  if (st > 0 && st < 1) { const x0 = 1700 - st * 1100, y0 = 120 + st * 260, tl = [];
    for (let k = 0; k < 14; k++) tl.push([x0 + k * 26, y0 - k * 6.5]);
    for (const [ctx, w, a] of [[e, 10, .8], [g, 3, 1]]) { ctx.save(); ctx.lineCap = 'round'; for (let k = 1; k < tl.length; k++) { ctx.strokeStyle = rgba('#fff4d0', a * (1 - k / tl.length)); ctx.lineWidth = w * (1 - k / tl.length); ctx.beginPath(); ctx.moveTo(...tl[k - 1]); ctx.lineTo(...tl[k]); ctx.stroke(); } ctx.restore(); }
    lamp(g, e, x0, y0, 6, '#fff4d0'); }
  view(g, A.roof.c); view(e, A.roof.e);
  const fr = f12(t);
  celLayer(S, c => { c.translate(cx, cy); c.scale(z, z); c.translate(-cx, -cy); c.translate(960, 800); c.scale(.74, .74);
    girlBack(c, PAL.night, { mode: 'sit', ph: (fr % 6) / 6, wind: .3, rim: RIM_N }); });
}
// —— 3 held bust, 3/4, looking up in wonder; a searchlight band sweeps; then resolve ——
function gaze(S) {
  const { t, lt, u } = S, P = PAL.night;
  g.save(); g.translate(0, -60 + lt * 14); g.drawImage(A.skyN.c, -100, -100, W + 200, H + 200); g.restore();
  e.save(); e.translate(0, -60 + lt * 14); e.drawImage(A.skyN.e, -100, -100, W + 200, H + 200); e.restore();
  twinkle(t, 16, 3, H * .7);
  drawLoop(g, A.cityFar.c, A.cityFar.w, -400 - lt * 10, H - A.cityFar.h + 120); drawLoop(e, A.cityFar.e, A.cityFar.w, -400 - lt * 10, H - A.cityFar.h + 120);
  const tq = q8(t), resolve = tq >= T.blink + .25, blink = tq >= T.blink && tq < T.blink + .125;
  const E = blink ? { expr: 'closed', open: 0 } : resolve ? { expr: 'determined', look: [.35, -.15] } : { expr: 'smile', look: [.2, -.85], open: .9 };
  const s = 2.35 + lt * .025, x = 1080, y = 470 + (resolve ? 18 : 0) * seg(t, T.blink + .25, T.blink + .6);
  LWK.k = .8;
  celLayer(S, c => { c.translate(x, y); c.scale(s, s); c.rotate(resolve ? 0 : -.08);
    head80(c, P, { view: 'q', expr: E.expr, open: E.open, look: E.look, ph: (f12(t) % 6) / 6, wind: .35, rim: RIM_N, reflect: '#bfd8ff', detail: true }); },
    { post: c => { const bx = -300 + seg(t, T.sweep, T.sweep + 1.6) * 2600; band(c, bx, '#9fdcff', .35, 220); } });
  LWK.k = 1;
}
// —— 4 extreme close-up on the eyes, star reflections; they open in three drawings; the silent beat ——
function eyes(S) {
  const { t, lt } = S, P = PAL.night;
  vgrad(g, 0, 0, W, H, [[0, '#0e0a2a'], [1, '#22103a']]);
  for (let i = 0; i < 9; i++) airbrush(g, hash(i * 7.3) * W, hash(i * 3.1) * H, 180, 180, ['#6a5ad8', '#35e7ff', '#b36bff'][i % 3], .18);
  const k = Math.floor((q8(t) - T.eyes) * 8), open = k <= 0 ? 0 : k === 1 ? .45 : k === 2 ? .8 : .95;
  const s = 4.7 + lt * .08; LWK.k = .5;
  celLayer(S, c => { c.translate(960 - 7 * s, 520 - 21 * s); c.scale(s, s);
    head80(c, P, { view: 'q', expr: k < 1 ? 'closed' : 'determined', open, lid: k >= 3 ? .3 : .1, look: [.3, -.2], ph: 0, wind: .2, reflect: '#fff4c8', detail: true, rim: { c: '#ff6ad0', d: [1.2, .8] } }); });
  LWK.k = 1;
  if (t > T.eyes + 1.45) { const gl_ = seg(t, T.eyes + 1.45, T.eyes + 1.95); flare(e, 960 - 7 * s + (-21 + 4) * s, 520 + (24 - 21 - 6) * s, .18 * Math.sin(gl_ * Math.PI), '#ffffff', { ghosts: false, streak: 300 }); }
}
// —— 5 impact frame → run → crouch → leap → one-beat freeze → up and away ——
function leap(S) {
  const { t, lt } = S;
  const ledgeY = 800, edgeX = 1500;
  // her world x: run from 200 to the edge, crouch, launch along an arc
  let wx, wy = 0, pose, fly = 0;
  if (t < T.crouch) { const r = seg(t, T.impact + .08, T.crouch); wx = 220 + r * (edgeX - 300 - 220); pose = POSE['run' + (f12(t) % 4)]; }
  else if (t < T.jump) { wx = edgeX - 300 + seg(t, T.crouch, T.jump) * 120; pose = blend(POSE.run0, POSE.crouch, eo(seg(q12(t), T.crouch, T.crouch + .17))); }
  else { const tt = Math.min(t, T.freeze) + Math.max(0, t - T.unfreeze), a = tt - T.jump; wx = edgeX - 180 + a * 700; wy = -(a * 1500 - a * a * 260); fly = seg(t, T.unfreeze, T.unfreeze + .5);
    pose = blend(POSE.leap, POSE.fly, eo(fly)); }
  const camX = Math.min(wx - 760, edgeX - 900) + Math.max(0, wx - edgeX) * .55, camY = Math.min(0, wy * .55);
  const frozen = t >= T.freeze && t < T.unfreeze;
  // sky + moon (behind), city below the ledge, the ledge itself
  g.save(); g.translate(-camX * .08, -camY * .15 - 80); g.drawImage(A.skyN.c, 0, 0, W + 300, H + 300); g.restore();
  e.save(); e.translate(-camX * .08, -camY * .15 - 80); e.drawImage(A.skyN.e, 0, 0, W + 300, H + 300); e.restore();
  const mx = 1300 - camX * .08, my = 250 - camY * .15, mr = 150;
  airbrush(g, mx, my, mr * 2.6, mr * 2.6, '#a898ff', .22);
  g.save(); g.beginPath(); g.arc(mx, my, mr, 0, TAU); g.clip();
  vgrad(g, mx - mr, my - mr, mr * 2, mr * 2, [[0, '#fff8ea'], [1, '#f2dcc8']]);
  for (const [dx, dy, r] of [[-50, 20, 46], [30, -50, 34], [55, 40, 26], [-10, -10, 20], [-70, -40, 18]]) airbrush(g, mx + dx, my + dy, r, r * .8, '#d8c0b8', .55, .5);
  airbrush(g, mx + mr * .9, my + mr * .2, mr * .9, mr * 1.3, '#b8a0d8', .35);
  g.restore();
  e.save(); e.beginPath(); e.arc(mx, my, mr + 4, 0, TAU); e.fillStyle = rgba('#fff0d0', .55); e.fill(); e.restore();
  drawLoop(g, A.city.c, A.city.w, -camX * .4, ledgeY + 40 - A.city.h * .7 - camY * .6); drawLoop(e, A.city.e, A.city.w, -camX * .4, ledgeY + 40 - A.city.h * .7 - camY * .6);
  const ly = ledgeY - camY;
  g.fillStyle = '#1a1430'; g.fillRect(-10, ly, edgeX - camX + 10, H); g.fillStyle = '#5a4a86'; g.fillRect(-10, ly - 8, edgeX - camX + 10, 10);
  g.fillStyle = '#0c0818'; g.fillRect(edgeX - camX - 16, ly, 16, H);
  // radial speed lines once she leaves the ground (held during the freeze)
  const sx = wx - camX, sy = ly + wy - 330;
  if (t >= T.jump) speedLines(g, frozen ? 3 : f12(t), { type: 'radial', cx: sx, cy: sy, n: 80, col: '#e8e0ff', a: .5, r0: 260 });
  const P = frozen ? PAL.backlit : PAL.night, rim = frozen ? { c: '#ffd890', d: [4, 3] } : RIM_N;
  const tq = frozen ? T.freeze : q12(t);
  celLayer(S, c => { c.translate(sx, sy + 330); c.rotate(fly * -.35); c.scale(.78, .78); girlSide(c, P, { pose, ph: (f12(tq) % 4) / 4, wind: 1, rim, expr: 'determined' }); });
  // impact frame: two frames of an inverted silhouette over radial lines
  if (t < T.impact + 2 / 24) { g.globalCompositeOperation = 'difference'; g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
    speedLines(g, 9, { type: 'radial', cx: 960, cy: 540, n: 120, col: '#120a20', a: .9, r0: 120 }); }
  return { expo: t >= T.freeze && t < T.freeze + 1 / 24 ? 2.4 : 1 };
}
// —— 6 side tracking flight over the city, four parallax layers ——
function fly(S) {
  const { t, lt } = S;
  g.drawImage(A.skyN.c, -lt * 12, 0, W + 200, H); e.drawImage(A.skyN.e, -lt * 12, 0, W + 200, H);
  twinkle(t, 12, 6, H * .55);
  drawLoop(g, A.cityFarS.c, A.cityFar.w, -t * 160, H - A.cityFar.h - 40); drawLoop(e, A.cityFarS.e, A.cityFar.w, -t * 160, H - A.cityFar.h - 40);
  drawLoop(g, A.cityS.c, A.city.w, -t * 520, H - A.city.h + 140); drawLoop(e, A.cityS.e, A.city.w, -t * 520, H - A.city.h + 140);
  speedLines(g, f12(t), { type: 'h', n: 30, col: '#b8a8ff', a: .3, hmax: 3, seed: 4 });
  const fr = f12(t), bob = Math.sin(q12(t) * 2.2) * 16 + (hash(fr) - .5) * 4, x = 860, y = 430 + bob;
  celLayer(S, c => { c.translate(x, y); c.rotate(-.05); c.scale(.72, .72); girlSide(c, PAL.night, { pose: blend({ ...POSE.fly, aF: -1.25, eF: .1 }, { ...POSE.fly, aF: -1.1, eF: .15, aN: 2.05, tN: -1.15 }, .5 + .5 * Math.sin(q12(t) * 2.2)), ph: (fr % 4) / 4, wind: 1, rim: RIM_N, expr: 'smileopen' }); },
    { post: c => { for (let k = 0; k < 2; k++) band(c, W + 300 - ((t * 900 + k * 1300) % 2600), ['#ff3fa4', '#35e7ff'][k], .22, 200); } });
  // near layer: antenna tips and wires whip past (heavy blur)
  const px = ((-t * 2400) % 2800 + 2800) % 2800 - 300;
  g.save(); g.filter = 'blur(9px)'; g.fillStyle = '#07040e'; g.fillRect(px, 760, 34, 400); g.fillRect(px - 60, 820, 160, 16); g.restore();
  lamp(g, e, px + 17, 756, 8, '#ff2a2a', .8);
}
// —— 7 rear view into a canyon of towers, the sky ahead brightening ——
function canyon(S) {
  const { t, lt, u } = S, vx = 960, vy = 500, f = 700;
  const dawn = ease(u);
  vgrad(g, 0, 0, W, H, [[0, mix('#0a0828', '#3a3a88', dawn)], [.45, mix('#2a1456', '#f08aa0', dawn)], [.55, mix('#6a2468', '#ffd8a0', dawn)], [1, mix('#120a24', '#4a2a48', dawn)]]);
  airbrush(e, vx, vy, 420 + dawn * 360, 130 + dawn * 120, '#ffe0b0', .15 + dawn * .3); airbrush(g, vx, vy, 400, 120, '#fff0d0', .15 + dawn * .35);
  // towers: two rows (left, right), each box at depth z; nearest drawn last; z clamped to the near plane
  const V = 2200, gap = 420, near = 60, far = 9000, boxes = [];
  for (let k = 0; k < 44; k++) { const side = k % 2 ? 1 : -1, z0 = (Math.floor(k / 2) * gap + (side > 0 ? gap / 2 : 0)), z = ((z0 - t * V) % far + far) % far + near;
    boxes.push({ side, z, w: 300 + hash(k) * 300, h: 1400 + hash(k * 3.3) * 1600, x: 420 + hash(k * 1.7) * 260, seed: k }); }
  boxes.sort((a, b) => b.z - a.z);
  for (const b of boxes) {
    const z1 = b.z, z2 = b.z + 260, P = (X, Y, Z) => [vx + X / Z * f, vy + Y / Z * f];
    const xin = b.side * b.x, xout = b.side * (b.x + b.w), top = -b.h + 1200, bot = 1600;
    const fog = clamp((z1 - 800) / 7000), col = mix(mix('#2a1c4a', '#7a5a8a', dawn * .6), mix('#1a1030', '#c890a8', dawn), fog);
    const face = poly([P(xin, top, z1), P(xin, bot, z1), P(xin, bot, z2), P(xin, top, z2)]);   // inner side wall facing the street
    g.fillStyle = mix(col, '#000000', .25); g.fill(face);
    const front = poly([P(xin, top, z1), P(xout, top, z1), P(xout, bot, z1), P(xin, bot, z1)]);
    g.fillStyle = col; g.fill(front);
    if (fog < .8) { const R = rng(b.seed * 13), [ax, ay] = P(xin, top, z1), [bx, by] = P(xout, bot, z1), cw = Math.abs(bx - ax);
      for (let r = 0; r < 18; r++) for (let cI = 0; cI < 5; cI++) { if (R() > .3) continue; const wx = Math.min(ax, bx) + cw * (.1 + cI * .18), wy = ay + (by - ay) * (.05 + r * .05), ww = cw * .08, wh = (by - ay) * .02;
        const cc = R() < .7 ? '#ffcf80' : '#8fdcff'; g.fillStyle = rgba(cc, .9 * (1 - fog)); g.fillRect(wx, wy, ww, wh); e.fillStyle = rgba(cc, .4 * (1 - fog) * (1 - dawn * .7)); e.fillRect(wx, wy, ww, wh); } }
  }
  speedLines(g, f12(t), { type: 'radial', cx: vx, cy: vy, n: 50, col: '#ffffff', a: .25, r0: 300, wmul: .6 });
  const fr = f12(t), sway = Math.sin(q12(t) * 1.6) * .06;
  celLayer(S, c => { c.translate(960 + Math.sin(q12(t) * 1.6) * 40, 640); c.rotate(sway); c.scale(.42, .42); girlBack(c, dawn > .5 ? PAL.dawn : PAL.night, { mode: 'glide', arms: .55, ph: (fr % 4) / 4, wind: 1, rim: dawn > .5 ? RIM_GOLD : RIM_N }); });
}
// —— 8 the harmony still: a sea of clouds at sunrise, slow pan; she rises small toward the sun ——
function sun(S) {
  const { t, lt, u } = S, C = A.clouds, ox = -ease(u) * (C.w - W);
  g.drawImage(C.c, ox, 0); e.drawImage(C.e, ox, 0);
  const k = eo(seg(t, T.flash + .2, T.flash + 5.6)), x = 300 + k * 900 + ox * .2, y = 760 - k * 300;
  celLayer(S, c => { c.translate(x, y); c.rotate(-.35); c.scale(.2, .2); girlSide(c, PAL.backlit, { pose: POSE.fly, ph: (f12(t) % 4) / 4, wind: 1, rim: { c: '#ffe0a0', d: [-5, 4] } }); });
  flare(e, C.sun[0] + ox, C.sun[1], .7, '#ffe6b0', { ghostA: .6 });
  return { expo: t < T.flash + 2 / 24 ? 2.6 : 1 };
}
// —— 9 the opening rooftop repainted at dawn; she lands on the ledge and opens her arms; title; the tape runs out ——
function dawn(S) {
  const { t, lt } = S, z = 1.22, cx = 960, cy = 760;
  const view = (ctx, img, k = 1) => { ctx.save(); ctx.translate(cx, cy); ctx.scale(z * k, z * k); ctx.translate(-cx, -cy); ctx.drawImage(img, 0, 0, W, H); ctx.restore(); };
  view(g, A.skyD.c, .95); view(e, A.skyD.e, .95);
  airbrush(g, 1300, 620, 700, 260, '#fff0c0', .55); airbrush(e, 1300, 640, 420, 140, '#ffe0a0', .5);
  view(g, A.roofD.c); view(e, A.roofD.e);
  const dn = seg(t, bar(24), T.land), squash = t >= T.land && t < T.land + .17 ? .93 : 1;
  const yy = 800 - (1 - eo(dn)) * 700 * (1 - dn), arms = .25 + .75 * ease(seg(q12(t), T.armsOpen, T.armsOpen + 1.4));
  celLayer(S, c => { c.translate(cx, cy); c.scale(z, z); c.translate(-cx, -cy); c.translate(960, yy - 430 * .62 * squash); c.scale(.62, .62 * squash);
    girlBack(c, PAL.dawn, { mode: 'stand', arms: t < T.land ? .7 : arms, ph: (f12(t) % 6) / 6, wind: t < T.land ? 1 : .35, rim: RIM_GOLD }); });
  if (t >= T.title) titleCard(t - T.title);
  const out = seg(t, T.tapeout, T.tapeout + .18);
  if (t >= T.tapeout + .18) { g.fillStyle = '#1430c8'; g.fillRect(0, 0, W, H); e.fillStyle = '#000'; e.fillRect(0, 0, W, H); }
  return { track: t >= T.tapeout && t < T.tapeout + .22 ? 1 : 0 };
}
function titleCard(lt) {
  const on = Math.floor(lt * 12), vis = on >= 6 || [1, 0, 1, 1, 0, 1][on];
  if (!vis) return;
  const x = 960, y = 150, txt = 'UNDER THE STARS';
  for (const ctx of [g, e]) {
    ctx.save(); ctx.font = 'italic 900 128px Kanit'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    if (ctx === g) {
      ctx.strokeStyle = '#1a0c30'; ctx.lineWidth = 22; ctx.strokeText(txt, x, y);
      ctx.strokeStyle = '#ff6ad0'; ctx.lineWidth = 9; ctx.strokeText(txt, x, y);
      const gr = ctx.createLinearGradient(0, y - 70, 0, y + 70);
      gr.addColorStop(0, '#9fd8ff'); gr.addColorStop(.46, '#ffffff'); gr.addColorStop(.5, '#6a4aa8'); gr.addColorStop(.7, '#ff7ab8'); gr.addColorStop(1, '#ffd36a');
      ctx.fillStyle = gr; ctx.fillText(txt, x, y);
    } else { ctx.strokeStyle = rgba('#ff6ad0', .8); ctx.lineWidth = 16; ctx.strokeText(txt, x, y); }
    ctx.restore();
  }
  // light sweep across the letters + star glint
  const sw = seg(lt, .5, 1.3); if (sw > 0 && sw < 1) { const sx = 300 + sw * 1320; airbrush(e, sx, y, 90, 80, '#ffffff', .6); }
  if (lt > 1.2) flare(e, 1500, 100, .3 * Math.sin(Math.min(1, (lt - 1.2) / .6) * Math.PI), '#ffffff', { ghosts: false, streak: 400 });
}

// —— lyrics on the tape: karaoke, sung words light up on their note ——
const LINES = [0, 1, 2, 3].map(i => { const w = SONG.words.filter(x => x.line === i); return { id: 'L' + i, words: w, a: w[0].t - .5, b: w[w.length - 1].t + w[w.length - 1].d + .7 }; });
LINES.forEach((l, i) => { if (LINES[i + 1]) l.b = Math.min(l.b, LINES[i + 1].a); });
const lineText = l => l.words.map(w => w.w).join(' ').replace(/- /g, '');
function hud(c, t) {
  c.clearRect(0, 0, W, H);
  const l = LINES.find(l => t >= l.a && t < l.b); if (!l) return;
  c.save(); c.font = '600 58px "Barlow SC"'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  // lay out syllables: hyphenated syllables join without a space
  const parts = l.words.map((w, i) => ({ s: w.w.replace(/-$/, ''), join: w.w.endsWith('-'), t: w.t }));
  let total = 0; const sp = c.measureText(' ').width; for (const p of parts) { p.w = c.measureText(p.s).width; total += p.w + (p.join ? 0 : sp); }
  total -= sp; let x = (W - total) / 2; const y = H - 96, fade = seg(t, l.a, l.a + .15) * (1 - seg(t, l.b - .15, l.b));
  c.globalAlpha = fade;
  for (const p of parts) {
    const sung = t >= p.t, pop = sung ? 1 - seg(t, p.t, p.t + .12) : 0;
    c.save(); c.translate(x + p.w / 2, y - pop * 6); c.scale(1 + pop * .06, 1 + pop * .06);
    c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
    c.strokeStyle = '#120a1e'; c.lineWidth = 9; c.textAlign = 'center'; c.strokeText(p.s, 0, 0); c.shadowColor = 'transparent';
    c.fillStyle = sung ? '#fff0a0' : '#a89cc0'; c.fillText(p.s, 0, 0); c.restore();
    x += p.w + (p.join ? 0 : sp);
  }
  c.restore();
}

const FN = { open, roof, gaze, eyes, leap, fly, canyon, sun, dawn };
const testMod = qs.get('test');
function modelSheet() {
  g.fillStyle = '#cfcad6'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#2a2436'; g.font = 'italic 800 40px Kanit'; g.textBaseline = 'top'; g.fillText('UNDER THE STARS — MODEL SHEET', 24, 14);
  const P = PAL.day;
  [['run0', 150], ['run1', 400], ['crouch', 650], ['leap', 900], ['fly', 1250]].forEach(([k, x], i) => { g.save(); g.translate(x, k === 'fly' ? 420 : 560); g.scale(.55, .55); girlSide(g, P, { pose: POSE[k], ph: .2, wind: 1 }); g.restore(); g.fillStyle = '#3a3448'; g.font = '600 24px "Barlow SC"'; g.fillText(k.toUpperCase(), x - 40, 860); });
  [['sit', 1520, 0], ['stand', 1760, .9]].forEach(([m, x, a]) => { g.save(); g.translate(x, 600); g.scale(.5, .5); girlBack(g, P, { mode: m, arms: a, wind: .3 }); g.restore(); g.fillStyle = '#3a3448'; g.fillText('BACK ' + m.toUpperCase(), x - 60, 860); });
  ['smile', 'determined', 'smileopen', 'surprised'].forEach((ex, i) => { g.save(); g.translate(260 + i * 460, 960); g.scale(.55, .55); head80(g, P, { view: 'q', expr: ex, wind: .2, body: false }); g.restore(); });
}
function render(t) {
  for (const x of [g, e]) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; }
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H); e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  let over = {};
  if (testMod) modelSheet();
  else { const [t0, t1, name] = shotAt(t); over = FN[qs.get('shot') || name]({ t, lt: t - t0, u: (t - t0) / (t1 - t0), g, e }) || {}; }
  if (qs.get('nosub') || testMod) ov.clearRect(0, 0, W, H); else hud(ov, t);
  const raw = qs.get('raw') ? { bloom: 0, halo: 0, scan: 0, grille: 0, glow: 0, corner: 0, noiseA: 0 } : {};
  post.render(sc, gc, Math.round(t * 24), ovc, { power: testMod ? 1 : Math.min(1, t / .6), ...over, ...raw });
}
function texts(t) {
  const out = [];
  const l = LINES.find(l => t >= l.a + .15 && t < l.b - .15);
  if (l) out.push({ id: l.id, text: lineText(l), x0: 300, y0: H - 140, x1: W - 300, y1: H - 50 });
  if (t >= T.title + .5 && t < T.tapeout) out.push({ id: 'title', text: 'UNDER THE STARS', x0: 420, y0: 80, x1: 1500, y1: 220 });
  return out;
}
function events() {
  const ev = [], add = (type, t, o = {}) => ev.push({ type, t: +t.toFixed(3), ...o });
  add('crton', 0.02); add('wind', 0, { d: bar(12) + .3, v: .5 }); add('city', 0, { d: bar(12), v: .5 });
  add('sparkle', T.shoot); add('whoosh', T.shoot, { v: .25, d: .9 });
  add('sweep', T.sweep, { d: 1.6 });
  add('impact', T.impact);
  for (let k = 0; ; k++) { const s = T.impact + .12 + k / 6; if (s >= T.crouch) break; add('step', s, { v: .6 + .1 * (k % 2) }); }
  add('scuff', T.crouch); add('whoosh', T.jump - .05, { v: 1, d: .8 });
  add('air', T.jump, { d: bar(21) - T.jump, v: .8 });
  for (let k = 0; k < 13; k++) add('whoosh', bar(18) + .3 + k * .45, { v: .35, d: .35 });
  add('sparkle', T.flash, { v: 1.2 }); add('highwind', T.flash, { d: bar(24) + .5 - T.flash, v: .6 });
  add('land', T.land); add('wind', T.land, { d: DUR - T.land, v: .4 }); add('birds', bar(24) + 1, { d: 5 });
  add('sparkle', T.title + .1, { v: .9 }); add('tapeout', T.tapeout);
  return ev.sort((a, b) => a.t - b.t);
}
window.EV = events(); window.TEXTS = texts; window.render = render; window.DUR = DUR;
render(parseFloat(qs.get('t') ?? '10'));
window.READY = true;
