// Colour model (iro shitei, 色指定): standard daytime colours → converted automatically per time of day (night / dawn), the same as real anime's "時間帯別 色指定" (per-time-of-day colour models)
import { hex } from './cel.js';

export const BASE = {
  skin: { f: '#ffd9c4', s: '#e2a395', h: '#fff1e8', l: '#5a2e2e' },
  blush: '#ff9a9a',
  hair: { f: '#8a3e3c', s: '#5a2230', h: '#d77a6e', l: '#3e1420' },
  lash: '#1c0f26',
  jacket: { f: '#ece6f4', s: '#a99cc8', h: '#ffffff', l: '#4a3c6e' },
  stripe: { f: '#3a4aa8', s: '#26307a', l: '#141a48' },
  scarf: { f: '#ffc83d', s: '#d88a1e', h: '#fff0a8', l: '#7a4410' },
  ribbon: { f: '#ffc83d', s: '#d88a1e', h: '#fff0a8', l: '#7a4410' },
  pants: { f: '#2c3566', s: '#1a1f44', h: '#4f5ca0', l: '#0b0e26' },
  boot: { f: '#f2f0f4', s: '#b4aec4', h: '#ffffff', l: '#3a3450' },
  glove: { f: '#3e3a4a', s: '#26232f', h: '#7a7690', l: '#100e16' },
  cuff: { f: '#22c3b2', s: '#138578', l: '#0b3d38' },
  strap: { f: '#5a4c66', s: '#3a3044', l: '#16101c' },
  lens: { f: '#86e6ff', s: '#3a9fd0', h: '#ffffff', l: '#1d3a58' },
  phone: { f: '#2a2a34', s: '#16161d', h: '#5c5c70', l: '#08080c' },
  white: { f: '#f3f6fc', s: '#a9b3cd', h: '#ffffff', l: '#39456a' },
  teal: { f: '#1fc4b2', s: '#12857c', h: '#8ff5e8', l: '#0b3e3a' },
  magenta: { f: '#ff4fa8', s: '#b8327a', l: '#5c1238' },
  dark: { f: '#2b2d40', s: '#181a26', h: '#50546e', l: '#08090f' },
  chrome: { f: '#dfe7f3', s: '#646f90', h: '#ffffff', l: '#2b3350' },
  gold: { f: '#e2b24e', s: '#9a6c28', h: '#fff0b0', l: '#4d3210' },
  tire: { f: '#23232f', s: '#15151c', h: '#565873', l: '#07070b' },
  seat: { f: '#2e2a36', s: '#1b1822', h: '#5d5670', l: '#0a090d' },
  eye: { f: '#c07a2a', s: '#6e3a12', h: '#ffd080', l: '#2e1606' },
  white_eye: '#fbf8ff',
  mouth: '#9a3b4a',
};

const mul = (c, m) => { const v = hex(c); return '#' + v.map((x, i) => Math.max(0, Math.min(255, Math.round(x * m[i]))).toString(16).padStart(2, '0')).join(''); };

// Time of day: f/h are multiplied by lit, s by shade, and line colours are darkened along with them
export const LIGHTS = {
  day: { lit: [1, 1, 1], shade: [1, 1, 1], line: [1, 1, 1] },
  night: { lit: [.78, .74, 1.0], shade: [.58, .52, .92], line: [.8, .7, 1.1] },
  dawn: { lit: [1.04, .9, .84], shade: [.86, .66, .8], line: [1, .8, .85] },
  sil: { lit: [.2, .16, .32], shade: [.14, .1, .24], line: [.3, .2, .5] },
  backlit: { lit: [.42, .3, .55], shade: [.24, .16, .36], line: [.4, .25, .5] },
};
export function palette(name) {
  const L = LIGHTS[name], out = {};
  for (const [k, v] of Object.entries(BASE)) {
    if (typeof v === 'string') { out[k] = mul(v, L.lit); continue; }
    out[k] = {};
    for (const [kk, c] of Object.entries(v)) out[k][kk] = mul(c, kk === 's' ? L.shade : kk === 'l' ? L.line : L.lit);
  }
  return out;
}
export const PAL = { day: palette('day'), night: palette('night'), dawn: palette('dawn'), sil: palette('sil'), backlit: palette('backlit') };
// Night skin is specified by hand: neutral-cool lit area + cool purple shadow (converting by multiplication turns the whole face pink)
Object.assign(PAL.night.skin, { f: '#e9c9c4', s: '#9b82b4', h: '#fff2f2' });
PAL.night.blush = '#e0869a';
