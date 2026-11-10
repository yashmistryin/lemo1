// Pichhwai Night: painted plates and motifs (Canvas 2D), painted once at load and only moved per frame.
import { canvas, rng, rgba, mix, airbrush, vgrad, TAU, path, poly } from './cel.js';

export const W = 1920, H = 1080, BW = 46;   // border width
export const C = {
  indigo: '#13205a', indigo2: '#0c1642', night: '#1b2c74', moon: '#fbf6e6', gold: '#d8a83a', gold2: '#f4d27a', goldL: '#7a5214',
  red: '#c8352a', red2: '#8e1e1c', pink: '#f39ab5', pink2: '#d4587e', white: '#f6efdc', leaf: '#2f8a5a', leaf2: '#1c5c3c', leafL: '#103a26',
  cream: '#f4e6c4', saffron: '#e0802e', terra: '#b8542a', lime: '#f2ead4', green: '#3ca061', blue: '#3e6ac8', skin: '#c98a5e', skinS: '#a86b44', skinL: '#5a3018',
  hair: '#141018', silver: '#e6e8ef',
};
const R = rng(7);

// four-petal flower (border motif)
export function flower(g, x, y, r, col, cen = C.gold2) {
  g.fillStyle = col; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; g.beginPath(); g.ellipse(x + Math.cos(a) * r * .55, y + Math.sin(a) * r * .55, r * .5, r * .28, a, 0, TAU); g.fill(); }
  g.fillStyle = cen; g.beginPath(); g.arc(x, y, r * .22, 0, TAU); g.fill();
}
// Kutchi mirror disc: silver disc ringed with thread stitches
export function mirror(g, x, y, r, thread = C.red) {
  g.fillStyle = thread; g.beginPath(); g.arc(x, y, r * 1.45, 0, TAU); g.fill();
  g.strokeStyle = C.gold2; g.lineWidth = r * .18; for (let k = 0; k < 12; k++) { const a = k * TAU / 12; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 1.05, y + Math.sin(a) * r * 1.05); g.lineTo(x + Math.cos(a) * r * 1.42, y + Math.sin(a) * r * 1.42); g.stroke(); }
  const gr = g.createLinearGradient(x - r, y - r, x + r, y + r); gr.addColorStop(0, '#ffffff'); gr.addColorStop(.5, '#aeb6c8'); gr.addColorStop(1, '#e8ecf4');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
}
// border frame (transparent centre); mirror positions returned for glints
export function borderPlate() {
  const [c, g] = canvas(W, H), mirrors = [];
  g.fillStyle = C.red2; g.fillRect(0, 0, W, H);
  g.fillStyle = C.gold; g.fillRect(6, 6, W - 12, H - 12);
  g.fillStyle = C.red; g.fillRect(12, 12, W - 24, H - 24);
  // flower band + mirrors in the red band
  for (let x = 30; x < W - 20; x += 46) for (const y of [29, H - 29]) { if ((x / 46 | 0) % 2) flower(g, x, y, 13, C.cream); else { mirror(g, x, y, 6, C.leaf2); mirrors.push([x, y]); } }
  for (let y = 75; y < H - 50; y += 46) for (const x of [29, W - 29]) { if ((y / 46 | 0) % 2) flower(g, x, y, 13, C.cream); else { mirror(g, x, y, 6, C.leaf2); mirrors.push([x, y]); } }
  g.fillStyle = C.gold; g.fillRect(BW - 6, BW - 6, W - 2 * BW + 12, H - 2 * BW + 12);
  g.fillStyle = C.goldL; g.fillRect(BW - 2, BW - 2, W - 2 * BW + 4, H - 2 * BW + 4);
  g.clearRect(BW, BW, W - 2 * BW, H - 2 * BW);
  return { c, mirrors };
}
// cloth: weave + pigment mottling (multiplied over the frame)
export function clothPlate() {
  const [c, g] = canvas(W, H); g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 900; i++) airbrush(g, R() * W, R() * H, 30 + R() * 120, 20 + R() * 80, R() < .5 ? '#e8dcc8' : '#f0e4d4', .25);
  g.globalAlpha = .05; g.fillStyle = '#7a6a50'; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1); for (let x = 0; x < W; x += 3) g.fillRect(x, 0, 1, H); g.globalAlpha = 1;
  return c;
}

// lotus flower in side view (painting convention): open 0..1
export function lotus(g, x, y, s, open = 1, col = C.pink) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const n = 7;
  for (let k = 0; k < n; k++) {
    const u = (k / (n - 1) - .5), a = u * (0.5 + 1.9 * open), len = 46 - Math.abs(u) * 10, back = Math.abs(u) > .3;
    g.save(); g.rotate(a); g.fillStyle = back ? mix(col, C.pink2, .5) : col; g.strokeStyle = C.pink2; g.lineWidth = 1.6;
    g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-15, -len * .4, -10, -len * .9, 0, -len); g.bezierCurveTo(10, -len * .9, 15, -len * .4, 0, 0); g.fill(); g.stroke();
    g.strokeStyle = rgba('#ffffff', .6); g.lineWidth = 1; g.beginPath(); g.moveTo(0, -4); g.lineTo(0, -len * .8); g.stroke(); g.restore();
  }
  g.fillStyle = C.gold; g.beginPath(); g.ellipse(0, -6, 9, 5, 0, 0, TAU); g.fill();
  g.restore();
}
export function pad(g, x, y, r, tilt = .35) {
  g.save(); g.translate(x, y); g.scale(1, tilt);
  g.fillStyle = C.leaf; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, r, .15, TAU - .15); g.closePath(); g.fill();
  g.strokeStyle = C.leafL; g.lineWidth = 2 / tilt * .6; g.stroke();
  g.strokeStyle = rgba('#8fe0a8', .5); g.lineWidth = 1.5; for (let k = 1; k < 8; k++) { const a = k * TAU / 8; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * r * .9, Math.sin(a) * r * .9); g.stroke(); }
  g.restore();
}
// pond plate: indigo water with white wave scallops, rows of pads + lotuses, fish
export function pondPlate(w, h, seed = 3, blooms = true) {
  const [c, g] = canvas(w, h), Q = rng(seed);
  g.fillStyle = '#1a3a8a'; g.fillRect(0, 0, w, h);
  g.strokeStyle = rgba('#cfe0ff', .55); g.lineWidth = 2;
  for (let y = 16; y < h; y += 22) for (let x = (y / 22 % 2) * 20; x < w; x += 40) { g.beginPath(); g.arc(x, y, 14, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
  for (let i = 0; i < 10; i++) { const x = Q() * w, y = 40 + Q() * (h - 80); g.strokeStyle = rgba('#f4e6c4', .7); g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, 30, 10, 0, 0, TAU); g.moveTo(x + 30, y); g.lineTo(x + 46, y - 10); g.lineTo(x + 46, y + 10); g.closePath(); g.stroke(); g.fillStyle = '#f4e6c4'; g.beginPath(); g.arc(x - 18, y - 2, 2.5, 0, TAU); g.fill(); }
  const spots = [];
  for (let row = 0; row < 4; row++) for (let x = 40 + row * 30; x < w; x += 150 + Q() * 60) {
    const y = 60 + row * (h - 100) / 3.2 + Q() * 20; pad(g, x, y, 46 + Q() * 16);
    if (blooms && Q() < .55) { g.strokeStyle = C.leaf2; g.lineWidth = 4; g.beginPath(); g.moveTo(x + 30, y); g.quadraticCurveTo(x + 40, y - 30, x + 34, y - 52); g.stroke(); spots.push([x + 34, y - 50]); }
  }
  return { c, w, h, spots };
}
// cow (profile, facing right), white with gold bell and red garland
export function cow(g, x, y, s, flip = false, col = '#f6f1e6') {
  g.save(); g.translate(x, y); g.scale(flip ? -s : s, s);
  g.fillStyle = col; g.strokeStyle = '#6a6050'; g.lineWidth = 2.5;
  for (const lx of [-70, -50, 40, 60]) { g.beginPath(); g.rect(lx, -10, 12, 70); g.fill(); g.stroke(); g.fillStyle = '#3a2a20'; g.fillRect(lx, 52, 12, 8); g.fillStyle = col; }
  const body = path([[-100, -60], [-40, -78], [20, -80], [70, -70], [96, -40], [88, 0], [40, 6], [-60, 6], [-104, -10], [-110, -40]]);
  g.fill(body); g.stroke(body);
  g.beginPath(); g.ellipse(70, -84, 26, 14, -.2, 0, TAU); g.fill(); g.stroke();   // hump
  const head = path([[88, -70], [120, -96], [140, -90], [160, -50], [156, -36], [132, -40], [104, -42]]);
  g.fill(head); g.stroke(head);
  g.strokeStyle = '#d8c08a'; g.lineWidth = 6; g.beginPath(); g.moveTo(124, -96); g.quadraticCurveTo(118, -126, 136, -136); g.stroke();
  g.fillStyle = '#2a2020'; g.beginPath(); g.ellipse(138, -72, 6, 3.5, .3, 0, TAU); g.fill();
  g.strokeStyle = '#6a6050'; g.lineWidth = 3; g.beginPath(); g.moveTo(-108, -40); g.quadraticCurveTo(-126, 0, -118, 40); g.stroke();
  // garland + bell
  g.strokeStyle = C.red; g.lineWidth = 7; g.beginPath(); g.moveTo(98, -66); g.quadraticCurveTo(110, -20, 128, -40); g.stroke();
  for (let k = 0; k < 6; k++) { g.fillStyle = k % 2 ? C.gold2 : '#f6f6f0'; g.beginPath(); g.arc(100 + k * 5, -56 + k * 5, 3, 0, TAU); g.fill(); }
  g.fillStyle = C.gold; g.beginPath(); g.moveTo(108, -26); g.lineTo(100, -8); g.lineTo(116, -8); g.closePath(); g.fill();
  // painted spots of colour, as cows are decorated for festivals
  g.fillStyle = rgba(C.red, .8); for (const [px, py] of [[-60, -40], [-20, -50], [20, -44]]) { g.beginPath(); g.arc(px, py, 8, 0, TAU); g.fill(); }
  g.restore();
}
// kadamba tree: trunk + stacked round foliage clumps with orange ball flowers
export function tree(g, x, y, s, seed = 1, flowers = true) {
  const Q = rng(seed); g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = '#5a3420'; g.beginPath(); g.moveTo(-18, 0); g.quadraticCurveTo(-8, -200, -26, -330); g.lineTo(18, -330); g.quadraticCurveTo(4, -200, 18, 0); g.fill();
  const clumps = []; for (let i = 0; i < 26; i++) { const a = Q() * TAU, r = Q() * 170; clumps.push([Math.cos(a) * r * 1.1, -420 + Math.sin(a) * r * .8, 50 + Q() * 30]); }
  clumps.sort((a, b) => a[1] - b[1]);
  for (const [cx, cy, r] of clumps) { g.fillStyle = C.leafL; g.beginPath(); g.arc(cx, cy + 6, r, 0, TAU); g.fill(); g.fillStyle = Q() < .5 ? C.leaf2 : '#24704a'; g.beginPath(); g.arc(cx, cy, r * .94, 0, TAU); g.fill();
    g.strokeStyle = rgba('#7ad09a', .45); g.lineWidth = 2; for (let k = 0; k < 5; k++) { const a = Q() * TAU, rr = Q() * r * .7; g.beginPath(); g.ellipse(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 9, 4, a, 0, TAU); g.stroke(); }
    if (flowers && Q() < .6) { g.fillStyle = '#f2a23a'; g.beginPath(); g.arc(cx + (Q() - .5) * r, cy + (Q() - .5) * r, 7, 0, TAU); g.fill(); } }
  g.restore();
}
// rolling cloud band (miniature convention)
export function cloudBand(g, y, w, col = '#d8e0f8', edge = '#7a8ad8') {
  g.fillStyle = col; g.strokeStyle = edge; g.lineWidth = 2.5;
  for (let x = -40; x < w + 40; x += 70) { g.beginPath(); g.arc(x, y, 40, Math.PI, 0); g.fill(); g.stroke(); }
  g.fillRect(-40, y - 2, w + 80, 30);
}
export function stars(g, w, h, n, seed = 5) { const Q = rng(seed); g.fillStyle = '#fff6dc'; for (let i = 0; i < n; i++) { const x = Q() * w, y = Q() * h, r = 1 + Q() * 2.2; g.beginPath(); g.moveTo(x, y - r * 2); g.lineTo(x + r * .5, y); g.lineTo(x, y + r * 2); g.lineTo(x - r * .5, y); g.closePath(); g.fill(); g.beginPath(); g.moveTo(x - r * 2, y); g.lineTo(x, y + r * .5); g.lineTo(x + r * 2, y); g.lineTo(x, y - r * .5); g.closePath(); g.fill(); } }
export function moon(g, x, y, r) {
  for (let k = 3; k > 0; k--) { g.fillStyle = rgba('#fff6dc', .06 * k); g.beginPath(); g.arc(x, y, r * (1 + k * .35), 0, TAU); g.fill(); }
  g.fillStyle = C.moon; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.strokeStyle = C.gold; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r + 6, 0, TAU); g.stroke();
}
// night landscape for the opening: sky, cloud band, moon, trees, pond with cows
export function nightPlate() {
  const w = 2400, h = 1400, [c, g] = canvas(w, h);
  vgrad(g, 0, 0, w, h * .55, [[0, C.indigo2], [1, C.night]]);
  stars(g, w, h * .5, 220);
  cloudBand(g, 70, w, '#2a3c8c', '#5a6ec8');
  moon(g, w * .62, 300, 120);
  // far hills/grove line
  g.fillStyle = '#163a2e'; for (let x = 0; x < w; x += 90) { g.beginPath(); g.arc(x, h * .55, 70 + (x * 7 % 30), Math.PI, 0); g.fill(); }
  const P = pondPlate(w, h * .45 | 0, 4); g.drawImage(P.c, 0, h * .55);
  for (const [x, y] of P.spots) lotus(g, x, y + h * .55, .9, .9);
  tree(g, 330, h * .62, 1.05, 3); tree(g, 2050, h * .6, .95, 8);
  cow(g, 700, h * .63, .9); cow(g, 980, h * .64, .8, true, '#efe6d6'); cow(g, 1640, h * .63, .85, false, '#f2ebe0');
  return { c, w, h };
}
// whitewashed village lane at night (loops horizontally): houses, arched doors with toran, diya niches
export function lanePlate(night = true) {
  const w = 3840, h = 1080, [c, g] = canvas(w, h), Q = rng(11);
  vgrad(g, 0, 0, w, 520, [[0, C.indigo2], [1, '#2a3c8c']]); stars(g, w, 360, 200, 9);
  moon(g, 2900, 210, 70);
  for (let x = 0; x < w;) {
    const hw = 380 + Q() * 260, top = 300 + Q() * 120, wall = Q() < .5 ? '#e8e0f0' : '#d8e4f4';
    g.fillStyle = wall; g.fillRect(x, top, hw, 900 - top);
    g.fillStyle = '#9aa4c8'; g.fillRect(x + hw - 14, top, 14, 900 - top);   // moonlit edge shadow
    g.fillStyle = C.terra; g.beginPath(); g.moveTo(x - 20, top); g.lineTo(x + hw / 2, top - 90 - Q() * 40); g.lineTo(x + hw + 20, top); g.closePath(); g.fill();
    g.strokeStyle = '#7a3a1a'; g.lineWidth = 3; for (let k = 0; k < 8; k++) { g.beginPath(); g.moveTo(x - 20 + k * (hw + 40) / 8, top); g.lineTo(x + hw / 2, top - 80); g.stroke(); }
    // arched door with a red/green painted frame and a toran of leaves
    const dx = x + hw * (.3 + Q() * .3), dw = 120, dt = 560;
    g.fillStyle = '#3a2418'; g.beginPath(); g.moveTo(dx, 900); g.lineTo(dx, dt + 60); g.arc(dx + dw / 2, dt + 60, dw / 2, Math.PI, 0); g.lineTo(dx + dw, 900); g.fill();
    g.strokeStyle = C.red; g.lineWidth = 10; g.stroke(); g.strokeStyle = C.gold; g.lineWidth = 3; g.stroke();
    for (let k = 0; k < 9; k++) { g.fillStyle = k % 2 ? C.leaf : C.gold2; g.beginPath(); g.moveTo(dx - 10 + k * 17, dt - 6); g.lineTo(dx - 2 + k * 17, dt + 22); g.lineTo(dx + 6 + k * 17, dt - 6); g.fill(); }
    // painted wall motifs + diya niche
    for (let k = 0; k < 3; k++) flower(g, x + 40 + k * 50, top + 60, 16, k % 2 ? C.red : C.blue, C.gold);
    const nx = x + hw * .8, ny = 640; g.fillStyle = '#4a2a1a'; g.beginPath(); g.moveTo(nx - 22, ny + 30); g.lineTo(nx - 22, ny); g.arc(nx, ny, 22, Math.PI, 0); g.lineTo(nx + 22, ny + 30); g.fill();
    g.fillStyle = '#c87a3a'; g.beginPath(); g.ellipse(nx, ny + 24, 14, 6, 0, 0, TAU); g.fill();
    x += hw + 10;
  }
  g.fillStyle = '#8a6a5a'; g.fillRect(0, 900, w, 180); g.fillStyle = '#6a4a3a'; for (let x = 0; x < w; x += 120) g.fillRect(x, 940 + (x % 240 ? 30 : 0), 80, 6);
  // lamps (diyas) along the lane: positions for flame flicker
  const lamps = []; for (let x = 150; x < w; x += 330) lamps.push([x, 905]);
  return { c, w, h, lamps };
}
// dawn courtyard: saffron sky, whitewashed walls, the tulsi kyaro at centre, rangoli
export function courtyardPlate() {
  const [c, g] = canvas(W, H);
  vgrad(g, 0, 0, W, 520, [[0, '#f2b45a'], [1, '#f7d79a']]);
  g.fillStyle = '#fff4d8'; g.beginPath(); g.arc(1450, 330, 70, 0, TAU); g.fill(); g.strokeStyle = C.gold; g.lineWidth = 3; g.beginPath(); g.arc(1450, 330, 78, 0, TAU); g.stroke();
  cloudBand(g, 64, W, '#f9e2b0', '#e8a85a');
  // back wall with a scalloped parapet
  g.fillStyle = '#f4ecdc'; g.fillRect(0, 430, W, 330);
  g.fillStyle = '#e6d8bc'; for (let x = 0; x < W; x += 60) { g.beginPath(); g.arc(x + 30, 430, 30, Math.PI, 0); g.fill(); }
  g.fillStyle = C.terra; g.fillRect(0, 740, W, 20);
  for (let k = 0; k < 12; k++) flower(g, 80 + k * 160, 520, 18, k % 2 ? C.red : C.leaf, C.gold);
  // ground: ochre with a border pattern
  vgrad(g, 0, 760, W, 320, [[0, '#d99a5a'], [1, '#b8743a']]);
  return { c };
}
export function tulsi(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  // kyaro: stepped square planter, whitewashed with red and gold painted bands
  g.fillStyle = '#f4ecdc'; g.fillRect(-120, -60, 240, 60); g.fillRect(-90, -170, 180, 110); g.fillRect(-110, -190, 220, 24);
  g.fillStyle = C.red; g.fillRect(-120, -34, 240, 10); g.fillRect(-90, -120, 180, 8); g.fillStyle = C.gold; g.fillRect(-110, -170, 220, 6);
  for (let k = 0; k < 3; k++) flower(g, -50 + k * 50, -144, 14, C.red, C.gold);
  g.strokeStyle = '#8a7a5a'; g.lineWidth = 2; g.strokeRect(-120, -60, 240, 60); g.strokeRect(-90, -170, 180, 110);
  // the plant: woody stems with clusters of small leaves and purple flower spikes
  const Q = rng(21); g.strokeStyle = '#4a3a20'; g.lineWidth = 6;
  const tips = []; for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * .28, len = 160 + Q() * 70; g.beginPath(); g.moveTo(0, -190); const tx = Math.cos(a) * len, ty = -190 + Math.sin(a) * len; g.quadraticCurveTo(tx * .3, -190 - len * .5, tx, ty); g.stroke(); tips.push([tx, ty]); }
  for (const [tx, ty] of tips) for (let j = 0; j < 9; j++) { const px = tx * (.4 + j * .07) + (Q() - .5) * 40, py = -190 + (ty + 190) * (.4 + j * .07) + (Q() - .5) * 30;
    g.fillStyle = j % 2 ? C.green : '#2a7a48'; g.beginPath(); g.ellipse(px, py, 13, 7, Q() * TAU, 0, TAU); g.fill(); }
  g.fillStyle = '#7a4a9a'; for (const [tx, ty] of tips) { g.fillRect(tx - 3, ty - 28, 6, 30); }
  g.restore();
}
export function rangoli(g, x, y, r) {
  g.save(); g.translate(x, y); g.scale(1, .35);
  const cols = [C.red, C.gold, C.blue, C.green, '#ffffff'];
  for (let ring = 4; ring >= 0; ring--) { g.fillStyle = cols[ring]; const rr = r * (ring + 1) / 5; g.beginPath();
    for (let k = 0; k <= 16; k++) { const a = k * TAU / 16, q = rr * (k % 2 ? .82 : 1); g[k ? 'lineTo' : 'moveTo'](Math.cos(a) * q, Math.sin(a) * q); } g.fill(); }
  g.restore();
}
// diya with a flickering flame; flame drawn on top
export function diya(g, x, y, s, fl = 0) {
  g.save(); g.translate(x, y); g.scale(s, s);
  for (let k = 3; k > 0; k--) { g.fillStyle = rgba('#ffcf6a', .08 * k); g.beginPath(); g.arc(0, -22, 22 + k * 16, 0, TAU); g.fill(); }
  g.fillStyle = '#b8642a'; g.beginPath(); g.ellipse(0, 0, 22, 9, 0, 0, Math.PI); g.lineTo(-22, 0); g.fill(); g.fillStyle = '#8a4a1a'; g.beginPath(); g.ellipse(0, 0, 22, 6, 0, 0, TAU); g.fill();
  const h = 22 + fl * 5; g.fillStyle = '#ffb02a'; g.beginPath(); g.moveTo(10, -2); g.quadraticCurveTo(20, -h * .5, 12 + fl * 2, -h); g.quadraticCurveTo(4, -h * .5, 6, -2); g.fill();
  g.fillStyle = '#fff2b0'; g.beginPath(); g.moveTo(10, -3); g.quadraticCurveTo(14, -h * .4, 11 + fl, -h * .7); g.quadraticCurveTo(7, -h * .4, 8, -3); g.fill();
  g.restore();
}
// multifoil (scalloped) jharokha arch path
export function archPath(x, y, w, h, lobes = 7) {
  const p = new Path2D(), r = w / 2, cx = x + r, top = y + r * 1.15;
  p.moveTo(x, y + h); p.lineTo(x, top);
  for (let i = 0; i <= 140; i++) { const u = i / 140, th = Math.PI + u * Math.PI, lobe = Math.abs(Math.sin(u * lobes * Math.PI));
    const rr = r * (.86 + .14 * lobe), lift = Math.sin(u * Math.PI) ** 6 * r * .25;   // a slight point at the apex
    p.lineTo(cx + Math.cos(th) * rr, top + Math.sin(th) * rr * 1.15 - lift); }
  p.lineTo(x + w, y + h); p.closePath(); return p;
}
export function archFrame(g, x, y, w, h, inner = C.red2) {
  const P = archPath(x, y, w, h);
  g.save(); g.clip(P); g.fillStyle = inner; g.fillRect(x, y, w, h);
  for (let yy = y + 40; yy < y + h; yy += 70) for (let xx = x + 30 + ((yy / 70 | 0) % 2) * 35; xx < x + w; xx += 70) flower(g, xx, yy, 14, rgba(C.gold2, .35), rgba(C.gold2, .5));
  g.restore();
  g.strokeStyle = C.gold; g.lineWidth = 16; g.stroke(P); g.strokeStyle = C.goldL; g.lineWidth = 3; g.stroke(P);
  return P;
}
