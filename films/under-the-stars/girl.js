// Full-figure cels for "Under the Stars": a side rig (run / crouch / leap / fly) and a back view (sit / stand / glide).
// Local units: hip at (0,0), y down, ~840 tall standing. Angles: 0 = limb pointing down, + = rotating toward the facing side (+x).
import { cel, line, path, poly, ribbon, flutter, TAU, mix } from './cel.js';
import { head80 } from './head80.js';

const L = { torso: 300, thigh: 215, shin: 215, upper: 150, fore: 140 };
const at = (p, a, len) => [p[0] + Math.sin(a) * len, p[1] + Math.cos(a) * len];

// tapered capsule between two points
export function limb(a, b, w1, w2) {
  const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, px = -uy, py = ux;
  const r1 = w1 / 2, r2 = w2 / 2, pts = [];
  for (let k = 0; k <= 6; k++) { const an = -Math.PI / 2 + k * Math.PI / 6, ca = Math.cos(an), sa = Math.sin(an); pts.push([b[0] + (ux * ca + px * sa) * r2, b[1] + (uy * ca + py * sa) * r2]); }
  for (let k = 0; k <= 6; k++) { const an = Math.PI / 2 + k * Math.PI / 6, ca = Math.cos(an), sa = Math.sin(an); pts.push([a[0] + (ux * ca + px * sa) * r1, a[1] + (uy * ca + py * sa) * r1]); }
  return pts;
}

// poses: lean (torso angle; 0 upright, + forward), legs [thigh, knee bend], arms [upper, elbow bend]; N = near side, F = far side
export const POSE = {
  run0: { lean: .32, tN: .8, kN: .25, tF: -.6, kF: 1.2, aN: -.85, eN: 1.5, aF: .9, eF: 1.3 },
  run1: { lean: .28, tN: .3, kN: .2, tF: -.05, kF: 2.1, aN: -.3, eN: 1.5, aF: .35, eF: 1.5 },
  run2: { lean: .32, tN: -.6, kN: 1.2, tF: .8, kF: .25, aN: .9, eN: 1.3, aF: -.85, eF: 1.5 },
  run3: { lean: .28, tN: -.05, kN: 2.1, tF: .3, kF: .2, aN: .35, eN: 1.5, aF: -.3, eF: 1.5 },
  crouch: { lean: .75, tN: 1.35, kN: 2.3, tF: 1.0, kF: 2.1, aN: -1.1, eN: .3, aF: -.95, eF: .4 },
  leap: { lean: .22, tN: 1.25, kN: 1.5, tF: -.7, kF: .35, aN: 2.7, eN: .15, aF: 2.35, eF: .25 },
  fly: { lean: 1.42, tN: -1.25, kN: .35, tF: -1.38, kF: .3, aN: 1.85, eN: .1, aF: .35, eF: .25 },
};
export function blend(a, b, k) { const o = {}; for (const key in a) o[key] = a[key] + (b[key] - a[key]) * k; return o; }

// side view, facing right. P = palette set, o: { pose, ph (cycle phase for hair/scarf), wind (0..1), rim, expr, open, look }
export function girlSide(g, P, o) {
  const Q = o.pose, rim = o.rim, ph = o.ph || 0, wind = o.wind ?? 1;
  const hip = [0, 0], sh = at(hip, Math.PI - Q.lean, L.torso);   // torso points up (angle π from down)
  const leg = (t, k) => { const kn = at(hip, t, L.thigh), an = at(kn, t - k, L.shin); return [kn, an, t - k]; };
  const arm = (a, e) => { const el = at(sh, a, L.upper), wr = at(el, a + e, L.fore); return [el, wr, a + e]; };
  const dim = c => ({ ...c, f: c.s, s: mix(c.s, '#000000', .25), h: c.f });
  const st = (c, d = 2.2) => ({ f: c.f, s: c.s, h: c.h, l: c.l, lw: d });
  const S = (c, so) => ({ ...st(c), so, rim });
  // far arm
  const [elF, wrF] = arm(Q.aF, Q.eF);
  cel(g, limb(sh, elF, 46, 38), S(dim(P.jacket), [-6, -6])); cel(g, limb(elF, wrF, 38, 30), S(dim(P.jacket), [-6, -6]));
  cel(g, limb(wrF, at(wrF, Q.aF + Q.eF, 30), 30, 26), { ...st(dim(P.skin), 1.6) });
  // far leg
  const [knF, anF, shF] = leg(Q.tF, Q.kF);
  cel(g, limb(hip, knF, 72, 54), S(dim(P.pants), [-6, -8])); cel(g, limb(knF, anF, 54, 40), S(dim(P.pants), [-6, -8]));
  boot(g, dim(P.boot), anF, shF, rim);
  // ponytail + ribbon tails streaming behind (drawn behind the torso)
  const head = at(sh, Math.PI - Q.lean * .8, 112), hs = .62;
  const back = Math.PI + .12 + Q.lean * .15;   // direction opposite to travel
  for (let k = 0; k < 2; k++) {
    const sp = flutter(head[0] - 30, head[1] - 40 + k * 8, back * wind + (Math.PI / 2 * .2) * (1 - wind) - (k ? .08 : 0), (300 - k * 60) * (.6 + .4 * wind), 16, (16 + k * 6) * wind + 4, 1.3, ph * TAU + k * 1.7, -12 * wind);
    cel(g, ribbon(sp, u => Math.pow(1 - u, .8) * (58 - k * 14) + 2), { f: k ? P.hair.s : P.hair.f, s: P.hair.s, so: [0, -8], h: P.hair.h, l: P.hair.l, lw: 2, rim });
  }
  const scs = flutter(sh[0] - 6, sh[1] + 8, back * wind + 0.15 * (1 - wind), 230 * (.55 + .45 * wind), 14, 18 * wind + 3, 1.5, ph * TAU + 2.2, -8 * wind);
  cel(g, ribbon(scs, u => 26 - u * 14), { f: P.scarf.f, s: P.scarf.s, so: [0, -6], h: P.scarf.h, ho: [0, 3], l: P.scarf.l, lw: 2, rim });
  // torso: jacket in the torso frame (x across the body, y from hip (0) to shoulder (-300))
  const ca = Math.cos(Q.lean), sa = Math.sin(Q.lean), TF = ([x, y]) => [hip[0] + x * ca - y * sa, hip[1] + x * sa + y * ca];
  const tor = [[-46, 30], [-50, -60], [-44, -180], [-40, -270], [-18, -318], [26, -316], [46, -262], [40, -170], [36, -60], [48, 30]].map(TF);
  cel(g, tor, { f: P.jacket.f, s: P.jacket.s, so: [-10, -16], h: P.jacket.h, ho: [5, 6], l: P.jacket.l, lw: 2.4, rim,
    clipFn: gg => { gg.fillStyle = P.stripe.f; gg.fill(poly([[-70, 4], [70, 4], [70, 22], [-70, 22]].map(TF))); } });
  line(g, [[-10, -60], [16, -40]].map(TF), P.jacket.l, 1.6);
  cel(g, [[-26, -318], [32, -318], [40, -292], [-20, -286]].map(TF), { f: P.scarf.f, s: P.scarf.s, so: [0, -6], h: P.scarf.h, l: P.scarf.l, lw: 2 });
  // near leg
  const [knN, anN, shN] = leg(Q.tN, Q.kN);
  cel(g, limb(hip, knN, 76, 56), S(P.pants, [-6, -10])); cel(g, limb(knN, anN, 56, 42), S(P.pants, [-6, -10]));
  boot(g, P.boot, anN, shN, rim);
  // head (80s profile from head80, no props)
  g.save(); g.translate(head[0], head[1]); g.rotate(Q.lean * .45 - .1); g.scale(hs, hs);
  head80(g, P, { view: 'side', expr: o.expr || 'determined', open: o.open, look: o.look, ph, wind, rim, body: false, neckEnd: 116, ponytail: false });
  g.restore();
  // near arm
  const [elN, wrN, faN] = arm(Q.aN, Q.eN);
  cel(g, limb(sh, elN, 50, 40), S(P.jacket, [-6, -8])); cel(g, limb(elN, wrN, 40, 32), S(P.jacket, [4, -8]));
  line(g, [sh, elN, wrN], P.stripe.f, 4);
  cel(g, limb(wrN, at(wrN, faN, 32), 32, 28), { ...st(P.skin, 1.6), so: [-3, -4] });
  return { sh, head, hip };
}
function boot(g, c, an, a, rim) {
  const fw = a + Math.PI / 2 * .95, toe = at(an, fw, 70), heel = at(an, fw + Math.PI, 16);
  cel(g, limb(heel, toe, 44, 34), { f: c.f, s: c.s, so: [-4, -6], h: c.h, l: c.l, lw: 2, rim });
}

// back view (we see her from behind). o: { mode: 'sit' | 'stand' | 'glide', arms (0 down .. 1 open wide), ph, wind, rim, legs: bool }
export function girlBack(g, P, o) {
  const ph = o.ph || 0, wind = o.wind ?? .3, rim = o.rim, open = o.arms ?? 0, mode = o.mode || 'sit';
  const st = (c, lw = 2.2) => ({ f: c.f, s: c.s, h: c.h, l: c.l, lw, rim });
  // legs (standing / gliding only; when sitting they hang on the far side of the ledge)
  if (mode !== 'sit') {
    for (const s of [-1, 1]) {
      const sp = mode === 'glide' ? .18 : .06, hip = [s * 34, 0], kn = [s * (34 + 215 * Math.sin(sp)), 215 * Math.cos(sp)], an = [s * (34 + 430 * Math.sin(sp)), 430 * Math.cos(sp)];
      cel(g, limb(hip, kn, 78, 58), { ...st(P.pants), so: [s * 8, -10] }); cel(g, limb(kn, an, 58, 44), { ...st(P.pants), so: [s * 8, -10] });
      cel(g, limb([an[0], an[1] - 10], [an[0], an[1] + 26], 50, 46), { ...st(P.boot, 2), so: [0, -6] });
    }
  }
  // arms: from the shoulders, swinging out to the sides as `open` grows
  for (const s of [-1, 1]) {
    const shp = [s * 92, -282], a = (mode === 'sit' ? .32 : .1 + open * 1.4) * s, el = at(shp, a, 150), e2 = a + s * (mode === 'sit' ? .1 : open * .25), wr = at(el, e2, 140);
    cel(g, limb(shp, el, 50, 40), { ...st(P.jacket), so: [-s * 6, -8] }); cel(g, limb(el, wr, 40, 32), { ...st(P.jacket), so: [-s * 6, -8] });
    line(g, [shp, el, wr], P.stripe.f, 4);
    cel(g, limb(wr, at(wr, e2, 32), 32, 28), { ...st(P.skin, 1.6) });
  }
  // jacket back
  cel(g, [[-64, 30], [-70, -80], [-92, -250], [-80, -290], [-30, -312], [30, -312], [80, -290], [92, -250], [70, -80], [64, 30]], { ...st(P.jacket, 2.4), so: [-10, -14], ho: [6, 6],
    clipFn: gg => { gg.fillStyle = P.stripe.f; gg.fillRect(-120, 4, 240, 20);
      // a star stitched on the back of the jacket: the film's emblem
      gg.fillStyle = P.scarf.f; const R = 34, r = 14, c = [0, -170]; gg.beginPath();
      for (let k = 0; k < 10; k++) { const an = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r : R; gg[k ? 'lineTo' : 'moveTo'](c[0] + Math.cos(an) * rr, c[1] + Math.sin(an) * rr); } gg.closePath(); gg.fill();
      gg.strokeStyle = P.scarf.l; gg.lineWidth = 2; gg.stroke(); } });
  line(g, [[0, -300], [0, 24]], P.jacket.l, 1.4);
  // collar + ribbon scarf ends
  cel(g, [[-46, -318], [46, -318], [52, -296], [-52, -296]], { ...st(P.scarf, 2), so: [0, -5] });
  if (wind > .5) for (const s of [-1, 1]) { const sp = flutter(s * 18, -306, Math.PI / 2 + s * .25 - wind * s * .5, 130, 10, 10 * wind + 3, 1.2, ph * TAU + s, 0); cel(g, ribbon(sp, u => 24 - u * 12), { ...st(P.scarf, 2), so: [0, -5] }); }
  // neck + head from behind: hair cap, lower locks with sharp tips, ponytail with the ribbon tie
  cel(g, [[-26, -330], [26, -330], [24, -300], [-24, -300]], { ...st(P.skin, 1.4) });
  const hc = [0, -420];
  cel(g, path([[hc[0] - 78, hc[1] + 10], [hc[0] - 70, hc[1] - 52], [hc[0], hc[1] - 92], [hc[0] + 70, hc[1] - 52], [hc[0] + 78, hc[1] + 10], [hc[0] + 60, hc[1] + 70, 1], [hc[0] + 40, hc[1] + 56], [hc[0] + 20, hc[1] + 84, 1], [hc[0], hc[1] + 60], [hc[0] - 22, hc[1] + 86, 1], [hc[0] - 40, hc[1] + 56], [hc[0] - 62, hc[1] + 72, 1]]),
    { f: P.hair.f, s: P.hair.s, so: [-12, -14], h: P.hair.h, l: P.hair.l, lw: 2, rim });
  // angel-ring highlight from behind
  g.save(); g.strokeStyle = P.hair.h; g.lineWidth = 7; g.beginPath(); g.arc(hc[0], hc[1] - 6, 58, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); g.restore();
  const tail = flutter(hc[0], hc[1] - 50, Math.PI / 2 - wind * .9, 260 - wind * 30, 14, 10 + wind * 18, 1, ph * TAU, 0);
  cel(g, ribbon(tail, u => Math.pow(1 - u, .8) * 56 + 2), { f: P.hair.f, s: P.hair.s, so: [-8, -6], h: P.hair.h, l: P.hair.l, lw: 2, rim });
  cel(g, [[hc[0] - 22, hc[1] - 62], [hc[0] + 22, hc[1] - 62], [hc[0] + 18, hc[1] - 40], [hc[0] - 18, hc[1] - 40]], { ...st(P.ribbon, 1.8), so: [0, -4] });
}
