// Pichhwai figures in strict profile (facing right): her (ghagra, choli, odhni, kandoro, roses) and him (kediyu, churidar, pagdi).
// Local units: feet at y = 0, about 900 tall. Angles: 0 = limb hanging down, + = rotating forward (toward +x).
import { path, poly, rgba, mix, TAU } from './cel.js';
import { C, mirror, flower } from './paint.js';

const at = (p, a, l) => [p[0] + Math.sin(a) * l, p[1] + Math.cos(a) * l];
function chain(g, pts, ws, fill, line) {
  for (const [col, extra] of [[line, 3.5], [fill, 0]]) {
    g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = 0; i < pts.length - 1; i++) { g.lineWidth = (ws[i] + ws[i + 1]) / 2 + extra; g.beginPath(); g.moveTo(...pts[i]); g.lineTo(...pts[i + 1]); g.stroke(); }
  }
}
// profile face (head-local: centre of skull at 0,0, face toward +x). o.blink 0..1, o.male
export function face(g, o = {}) {
  const m = !!o.male, sk = o.skin || C.skin, sl = C.skinL;
  const F = m ? [[6, -64], [32, -54], [46, -26], [49, -14], [62, 14, 1], [52, 21], [54, 28], [50, 32], [54, 37], [48, 46], [46, 58, 1], [28, 66], [-2, 60]]
              : [[6, -64], [30, -54], [44, -26], [47, -14], [59, 13, 1], [50, 19], [52, 26], [48, 30], [51, 35], [46, 42], [43, 52, 1], [28, 61], [-2, 58]];
  g.fillStyle = sk; g.strokeStyle = sl; g.lineWidth = 1.8;
  const P = path([...F, [-30, 54], [-46, 10], [-40, -40]]); g.fill(P); g.stroke(P);
  // eye: long lotus-petal eye, drawn frontally, kohl line extending back
  const bl = o.blink || 0, ex = 24, ey = -12, eh = 9 * (1 - bl);
  g.fillStyle = '#fbf6ec'; g.beginPath(); g.moveTo(8, ey); g.quadraticCurveTo(ex, ey - eh * 1.4, 41, ey + 1); g.quadraticCurveTo(ex, ey + eh * .9, 8, ey); g.fill();
  if (bl < .8) { g.save(); g.beginPath(); g.moveTo(8, ey); g.quadraticCurveTo(ex, ey - eh * 1.4, 41, ey + 1); g.quadraticCurveTo(ex, ey + eh * .9, 8, ey); g.clip();
    g.fillStyle = '#1a0e0a'; g.beginPath(); g.arc(31 + (o.look || 0) * 4, ey - 1, 6, 0, TAU); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(33 + (o.look || 0) * 4, ey - 3, 1.6, 0, TAU); g.fill(); g.restore(); }
  g.strokeStyle = '#140a08'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(-6, ey - 3); g.lineTo(8, ey); g.quadraticCurveTo(ex, ey - eh * 1.4 - 1, 42, ey + 1); g.stroke();
  g.lineWidth = 1.4; g.beginPath(); g.moveTo(8, ey); g.quadraticCurveTo(ex, ey + eh * .9 + 1, 41, ey + 1); g.stroke();
  g.lineWidth = 2.2; g.beginPath(); g.moveTo(14, -28); g.quadraticCurveTo(28, -34, 44, -27); g.stroke();   // brow
  g.strokeStyle = mix(sk, '#7a2a20', .5); g.lineWidth = 2; g.beginPath(); g.moveTo(44, 31); g.lineTo(50, 31); g.stroke();   // lips line
  g.fillStyle = mix(sk, '#c02a2a', .45); g.beginPath(); g.ellipse(50, 33, 4, 2.6, 0, 0, TAU); g.fill();
  g.strokeStyle = sl; g.lineWidth = 1.6; g.beginPath(); g.arc(-8, 4, 9, -1.2, 1.6); g.stroke();   // ear
  if (m) { g.fillStyle = '#140a08'; g.beginPath(); g.moveTo(42, 27); g.quadraticCurveTo(52, 24, 60, 30); g.quadraticCurveTo(52, 28, 44, 30); g.fill(); }
  else {
    g.fillStyle = C.red; g.beginPath(); g.arc(36, -36, 3.4, 0, TAU); g.fill();   // bindi
    g.strokeStyle = C.gold2; g.lineWidth = 2; g.beginPath(); g.arc(53, 22, 6, -1.5, 3.6); g.stroke();   // nath
    g.fillStyle = C.gold; g.beginPath(); g.moveTo(-8, 14); g.lineTo(-16, 36); g.lineTo(0, 36); g.closePath(); g.fill();   // jhumka
    for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(-15 + k * 3.6, 38, 1.6, 0, TAU); g.fill(); }
  }
}
// —— HER ——
// o: { arm: [aN, eN, aF, eF], sway (-1..1 skirt swing), step (0..1 walk phase), flare (0..1 dance flare), blink, wind, glint (0..1 waist highlight pos), diya: bool, head (tilt) }
export function her(g, o = {}) {
  const [aN, eN, aF, eF] = o.arm || [.15, .3, .1, .2], sway = o.sway || 0, flare = o.flare || 0, wind = o.wind ?? .3, ph = o.ph || 0;
  const waist = [0, -470], sh = [6, -690], neck = [14, -708], head = [26, -790];
  const ghag = { f: C.red, s: C.red2, l: '#5a1010' };
  // odhni tail behind (drawn first)
  g.fillStyle = mix(C.red, C.gold, .15); g.strokeStyle = C.gold; g.lineWidth = 4;
  const tail = [[head[0] - 40, head[1] - 50], [head[0] - 70 - wind * 60, head[1] + 40], [-80 - wind * 140 + Math.sin(ph * TAU) * 14 * wind, -480 + wind * 60], [-120 - wind * 200 + Math.sin(ph * TAU + 1) * 20 * wind, -300 + wind * 120], [-40 - wind * 120, -330 + wind * 60], [-20, -560]];
  const TP = path(tail); g.fill(TP); g.stroke(TP);
  g.fillStyle = C.gold2; for (let k = 0; k < 10; k++) { const u = k / 9, x = tail[2][0] + (tail[3][0] - tail[2][0]) * u, y = tail[2][1] + (tail[3][1] - tail[2][1]) * u; g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); }
  // far arm
  const elF = at(sh, aF, 150), wrF = at(elF, aF + eF, 135);
  chain(g, [sh, elF, wrF, at(wrF, aF + eF, 26)], [40, 32, 26, 22], mix(C.skin, C.skinS, .5), C.skinL);
  // ghagra: bell from the waist to the hem, swinging; vertical gold stripes, mirror hem band
  const hemR = 175 + flare * 120, hx = sway * 40, hy = -8 - flare * 60;
  const G = path([[waist[0] - 58, waist[1] + 10], [waist[0] - 70 - flare * 30, -300], [hx - hemR, hy, 1], [hx - hemR * .5, hy + 14], [hx, hy + 18], [hx + hemR * .5, hy + 14], [hx + hemR, hy, 1], [waist[0] + 78 + flare * 30, -300], [waist[0] + 60, waist[1] + 10]]);
  g.fillStyle = ghag.f; g.fill(G); g.save(); g.clip(G);
  g.fillStyle = ghag.s; g.fillRect(-400, -480, 400 + hx - hemR * .45, 520);   // the back half in shade
  g.strokeStyle = C.gold; g.lineWidth = 5;
  for (let k = -6; k <= 6; k++) { g.beginPath(); g.moveTo(waist[0] + k * 9, waist[1]); g.quadraticCurveTo(k * 18 + hx * .4, -240, hx + k * hemR / 6, hy + 10); g.stroke(); }
  g.fillStyle = C.leaf2; g.fillRect(-500, hy - 60 - flare * 10, 1000, 70);
  for (let k = -10; k <= 10; k++) mirror(g, hx + k * hemR / 9, hy - 26, 7, C.gold);
  g.fillStyle = C.gold; g.fillRect(-500, hy - 66 - flare * 10, 1000, 8);
  g.restore(); g.strokeStyle = ghag.l; g.lineWidth = 2.4; g.stroke(G);
  // feet with payal (walk: alternate)
  const st = o.step ?? -1;
  for (const [k, sg] of [[0, 1], [1, -1]]) {
    const fx = st < 0 ? (k ? -30 : 26) : Math.sin((st + k * .5) * TAU) * 46, lift = st < 0 ? 0 : Math.max(0, Math.sin((st + k * .5) * TAU + Math.PI / 2)) * 10;
    g.fillStyle = k ? mix(C.skin, C.skinS, .5) : C.skin; g.strokeStyle = C.skinL; g.lineWidth = 1.6;
    g.beginPath(); g.ellipse(hx * .5 + fx + 20, -6 - lift, 34, 10, 0, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = C.red; g.beginPath(); g.ellipse(hx * .5 + fx + 50, -6 - lift, 5, 4, 0, 0, TAU); g.fill();   // alta on the toes
    g.fillStyle = C.silver; for (let j = 0; j < 5; j++) { g.beginPath(); g.arc(hx * .5 + fx + 2 + j * 6, -16 - lift, 2.4, 0, TAU); g.fill(); }
  }
  // midriff + choli
  g.fillStyle = C.skin; g.strokeStyle = C.skinL; g.lineWidth = 1.8;
  const mid = path([[-44, -470], [-40, -560], [44, -560], [52, -500], [56, -470]]); g.fill(mid); g.stroke(mid);
  g.fillStyle = C.leaf2; const ch = path([[-44, -556], [-36, -680], [10, -704], [52, -660], [64, -600], [50, -556]]); g.fill(ch); g.strokeStyle = C.leafL; g.stroke(ch);
  g.strokeStyle = C.gold; g.lineWidth = 4; g.beginPath(); g.moveTo(-44, -560); g.lineTo(50, -560); g.stroke();
  for (let k = 0; k < 4; k++) mirror(g, -20 + k * 20, -620 + (k % 2) * 10, 4, C.red);
  // kandoro: silver waist chain with hanging bells; a highlight sweeps across it (glint)
  g.strokeStyle = C.silver; g.lineWidth = 4; g.beginPath(); g.moveTo(-58, -466); g.quadraticCurveTo(0, -446, 62, -462); g.stroke();
  for (let k = 0; k < 9; k++) { const x = -50 + k * 13, y = -458 + Math.sin(k / 8 * Math.PI) * 10; g.strokeStyle = C.silver; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 14); g.stroke(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y + 17, 3.2, 0, TAU); g.fill(); }
  if (o.glint != null && o.glint > 0 && o.glint < 1) { const gx = -60 + o.glint * 130; for (let k = 3; k > 0; k--) { g.fillStyle = rgba('#ffffff', .18 * k); g.beginPath(); g.arc(gx, -452, 6 + k * 8, 0, TAU); g.fill(); }
    g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.moveTo(gx - 22, -452); g.lineTo(gx + 22, -452); g.moveTo(gx, -474); g.lineTo(gx, -430); g.stroke(); }
  // neck + necklace
  g.fillStyle = C.skin; g.strokeStyle = C.skinL; g.lineWidth = 1.8;
  const nk = path([[2, -690], [6, -740], [38, -742], [36, -700]]); g.fill(nk); g.stroke(nk);
  g.strokeStyle = C.gold; g.lineWidth = 5; g.beginPath(); g.moveTo(6, -716); g.quadraticCurveTo(26, -690, 40, -716); g.stroke();
  // head
  g.save(); g.translate(head[0], head[1]); g.rotate(o.head || 0);
  // hair: back mass + bun with roses and a jasmine string
  g.fillStyle = C.hair; g.beginPath(); g.moveTo(6, -66); g.quadraticCurveTo(-60, -66, -56, 0); g.quadraticCurveTo(-50, 46, -20, 56); g.lineTo(0, -20); g.closePath(); g.fill();
  g.beginPath(); g.arc(-62, 18, 28, 0, TAU); g.fill();
  face(g, { blink: o.blink, look: o.look });
  g.fillStyle = C.hair; g.beginPath(); g.moveTo(8, -66); g.quadraticCurveTo(36, -60, 40, -40); g.quadraticCurveTo(14, -48, -6, -40); g.closePath(); g.fill();   // hairline over the forehead
  for (const [x, y, r] of [[-74, 0, 13], [-58, -6, 11], [-80, 24, 10]]) { g.fillStyle = '#d81a3a'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = '#7a0a1a'; g.lineWidth = 1.6; g.beginPath(); g.arc(x, y, r * .55, 0, 5); g.stroke(); g.beginPath(); g.arc(x, y, r * .25, 0, 5); g.stroke(); }
  g.fillStyle = '#fffaf0'; for (let k = 0; k < 9; k++) { g.beginPath(); g.arc(-88 + k * 4, 34 + Math.sin(k) * 3, 3, 0, TAU); g.fill(); }
  // odhni over the head: an arc with a gold edge, worn back off the forehead
  if (o.veil !== false) { g.fillStyle = mix(C.red, C.gold, .15); const V = path([[-2, -70], [-50, -66], [-90, -20], [-96, 50], [-60, 70], [-30, 40], [-52, 0], [-30, -48]]); g.fill(V); g.strokeStyle = C.gold; g.lineWidth = 4; g.stroke(V); }
  g.restore();
  // near arm (with bangles); o.diya: hands meet at chest height
  const elN = at(sh, aN, 150), wrN = at(elN, aN + eN, 135);
  chain(g, [sh, elN, wrN, at(wrN, aN + eN, 26)], [42, 34, 27, 22], C.skin, C.skinL);
  const bp = at(elN, aN + eN, 110); g.strokeStyle = C.gold; g.lineWidth = 5; for (let k = 0; k < 3; k++) { const q = at(elN, aN + eN, 100 + k * 9); g.beginPath(); g.moveTo(q[0] - 14 * Math.cos(aN + eN), q[1] + 14 * Math.sin(aN + eN)); g.lineTo(q[0] + 14 * Math.cos(aN + eN), q[1] - 14 * Math.sin(aN + eN)); g.stroke(); }
  g.strokeStyle = C.red; g.lineWidth = 4; g.beginPath(); g.moveTo(sh[0] - 18, sh[1] + 40); g.lineTo(sh[0] + 18, sh[1] + 40); g.stroke();   // choli sleeve edge
  return { hand: at(wrN, aN + eN, 22), head, waist };
}
// —— HIM ——
// o: { arm, leg: [tN, kN, tF, kF] (thigh angle, knee bend), step (walk phase, overrides leg), rose: bool, blink }
export function him(g, o = {}) {
  const [aN, eN, aF, eF] = o.arm || [.1, .2, -.05, .2];
  let legs = o.leg || [0, 0, 0, 0];
  if (o.step != null && o.step >= 0) { const s = Math.sin(o.step * TAU), c = Math.cos(o.step * TAU); legs = [s * .38, Math.max(0, c) * .6, -s * .38, Math.max(0, -c) * .6]; }
  const hip = [0, -430], sh = [6, -680], head = [30, -770];
  const kedS = '#d8d4c4', ked = '#f8f4ea';
  const leg = (t, k, far) => { const kn = at(hip, t, 215), an = at(kn, t - k, 215);
    chain(g, [hip, kn, an], [62, 48, 36], far ? '#d4cfc0' : '#f0ebdc', '#8a8470');
    g.fillStyle = far ? '#7a2a1a' : C.red2; g.beginPath(); g.moveTo(an[0] - 20, an[1] + 10); g.quadraticCurveTo(an[0] + 30, an[1] + 18, an[0] + 64, an[1] - 4); g.lineTo(an[0] + 40, an[1] - 14); g.lineTo(an[0] - 18, an[1] - 14); g.closePath(); g.fill();
    g.fillStyle = C.gold; g.fillRect(an[0] - 10, an[1] - 12, 30, 4); };
  leg(legs[2], legs[3], true);
  const elF = at(sh, aF, 150), wrF = at(elF, aF + eF, 135);
  chain(g, [sh, elF], [46, 38], kedS, '#8a8470'); chain(g, [elF, wrF, at(wrF, aF + eF, 26)], [34, 28, 24], mix(C.skin, C.skinS, .5), C.skinL);
  leg(legs[0], legs[1], false);
  // kediyu: fitted top flaring into a pleated frill at the hip
  const K = path([[-40, -700], [24, -712], [60, -650], [56, -540], [70, -470], [110, -380, 1], [40, -360], [-20, -362], [-90, -380, 1], [-56, -470], [-50, -560]]);
  g.fillStyle = ked; g.fill(K); g.strokeStyle = '#8a8470'; g.lineWidth = 2; g.stroke(K);
  g.save(); g.clip(K); g.strokeStyle = kedS; g.lineWidth = 3; for (let k = -8; k <= 10; k++) { g.beginPath(); g.moveTo(k * 8, -470); g.lineTo(k * 18, -360); g.stroke(); }
  g.strokeStyle = C.red; g.lineWidth = 6; g.beginPath(); g.moveTo(-100, -372); g.lineTo(120, -372); g.stroke(); g.restore();
  for (let k = 0; k < 4; k++) mirror(g, 30, -660 + k * 34, 4, C.red);
  // neck + head
  g.fillStyle = C.skin; g.strokeStyle = C.skinL; g.lineWidth = 1.8;
  const nk = path([[0, -690], [6, -722], [40, -726], [38, -696]]); g.fill(nk); g.stroke(nk);
  g.save(); g.translate(head[0], head[1]);
  g.fillStyle = C.hair; g.beginPath(); g.moveTo(4, -40); g.quadraticCurveTo(-54, -40, -48, 20); g.quadraticCurveTo(-40, 50, -14, 52); g.lineTo(0, 0); g.closePath(); g.fill();
  face(g, { male: true, blink: o.blink });
  // pagdi: wrapped turban in saffron with gold bands and a tail
  g.fillStyle = C.saffron; const T = path([[-54, -8], [-66, -70], [-30, -118], [30, -116], [62, -74], [52, -40], [10, -48], [-30, -30]]); g.fill(T); g.strokeStyle = '#8a4410'; g.lineWidth = 2; g.stroke(T);
  g.strokeStyle = C.gold; g.lineWidth = 4; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-54 + k * 4, -24 - k * 16); g.quadraticCurveTo(0, -60 - k * 12, 52 - k * 2, -52 - k * 9); g.stroke(); }
  g.fillStyle = C.saffron; g.beginPath(); g.moveTo(-52, -20); g.quadraticCurveTo(-90, 30, -76, 100); g.lineTo(-60, 96); g.quadraticCurveTo(-66, 40, -40, -10); g.fill();
  g.restore();
  // near arm; optional rose in the hand
  const elN = at(sh, aN, 150), wrN = at(elN, aN + eN, 135);
  chain(g, [elN, wrN, at(wrN, aN + eN, 26)], [36, 29, 24], C.skin, C.skinL); chain(g, [sh, elN], [50, 40], ked, '#8a8470');
  const hd = at(wrN, aN + eN, 18);
  if (o.rose) { g.strokeStyle = C.leaf2; g.lineWidth = 4; g.beginPath(); g.moveTo(hd[0], hd[1]); g.lineTo(hd[0] + 26, hd[1] - 60); g.stroke(); g.fillStyle = '#d81a3a'; g.beginPath(); g.arc(hd[0] + 28, hd[1] - 70, 16, 0, TAU); g.fill(); g.strokeStyle = '#7a0a1a'; g.lineWidth = 1.6; g.beginPath(); g.arc(hd[0] + 28, hd[1] - 70, 8, 0, 5); g.stroke(); }
  return { hand: hd, head };
}
