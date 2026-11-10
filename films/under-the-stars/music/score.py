# -*- coding: utf-8 -*-
"""Under the Stars: original city-pop score, synthesised with numpy + numba.
Instrument DSP adapted from the library's 80s Cel Anime engine; harmony, melody, arrangement are this film's own.

Run: $LIB/.venv/bin/python music/score.py   ->  music/score.wav, music/stems/*.wav, song.json (word timings for the picture)

120 BPM, 4/4, bar = 2.0 s, 28 bars, 56.0 s. D major -> Eb major from bar 20 (0-indexed).
  bars 0-3   intro: arp + pad + bell (lo-fi tape for the power-on, opens at bar 1)
  bars 4-11  verse: line 1 (bar 4), line 2 (bar 8); groove; drum fill bar 11; silence 11.3 -> 12
  bars 12-13 drop: impact boom + brass hit at bar 12, leap; freeze at bar 13 (half-beat stop)
  bars 14-19 chorus A: line 3 (bar 14), hook on brass/lead 16-17, rising canyon 18-19
  bars 20-23 lift chorus (Eb): line 4 (bar 21)
  bars 24-27 outro: pad + e-piano + arp, title hit bar 25, tape stop at 55.5
"""
import os, json, numpy as np, soundfile as sf
from numba import njit
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.ndimage import maximum_filter1d, minimum_filter1d, uniform_filter1d

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
DUR = 56.0
N = int(round(DUR * SR))
rng = np.random.default_rng(2026)


def T(bar, beat=0.0): return (bar * 4 + beat) * BEAT


CUT0, CUT1 = T(11, 3), T(12)          # one beat of true silence before the leap
LOFI0, LOFI1 = 0.0, T(1)              # tape warming up during the power-on
KEY_UP = 20                           # up a semitone from this bar on
TAPESTOP = 55.4
def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def ts(n): return np.arange(n) / SR
def noise(n): return rng.standard_normal(n)


def _sos(kind, f, o): return butter(o, f, kind, fs=SR, output='sos')
def lp(x, f, o=2): return sosfilt(_sos('low', f, o), x, axis=0)
def hp(x, f, o=2): return sosfilt(_sos('high', f, o), x, axis=0)
def bp(x, lo, hi, o=2): return sosfilt(_sos('band', [lo, hi], o), x, axis=0)


# ───────────────────────── DSP kernels (numba) ─────────────────────────
@njit(cache=True)
def svf(x, fc, res, mode):
    """TPT state-variable filter, per-sample cutoff. mode 0=low-pass 1=band-pass 2=high-pass"""
    n = x.shape[0]; y = np.empty(n); ic1 = 0.0; ic2 = 0.0; k = 1.0 / res
    for i in range(n):
        f = fc[i]
        if f > 20000.0: f = 20000.0
        if f < 20.0: f = 20.0
        g = np.tan(np.pi * f / 48000.0)
        a1 = 1.0 / (1.0 + g * (g + k)); a2 = g * a1; a3 = g * a2
        v3 = x[i] - ic2; v1 = a1 * ic1 + a2 * v3; v2 = ic2 + a2 * ic1 + a3 * v3
        ic1 = 2 * v1 - ic1; ic2 = 2 * v2 - ic2
        if mode == 0: y[i] = v2
        elif mode == 1: y[i] = v1
        else: y[i] = x[i] - k * v1 - v2
    return y


@njit(cache=True)
def ks_loop(exc, L, P, damp, bright):
    """Karplus-Strong: loop of delay P + averaging filter with adjustable brightness"""
    y = np.zeros(L)
    for i in range(L):
        v = exc[i] if i < exc.shape[0] else 0.0
        if i > P:
            v += damp * (bright * y[i - P] + (1 - bright) * 0.5 * (y[i - P] + y[i - P - 1]))
        elif i == P:
            v += damp * y[0]
        y[i] = v
    return y


@njit(cache=True)
def env_follow(x, att, rel):
    n = x.shape[0]; e = np.empty(n); s = 0.0
    a = np.exp(-1.0 / (att * 48000.0)); r = np.exp(-1.0 / (rel * 48000.0))
    for i in range(n):
        v = x[i]
        if v > s: s = a * s + (1 - a) * v
        else: s = r * s + (1 - r) * v
        e[i] = s
    return e


def saw(freq, phase0=0.0):
    """PolyBLEP band-limited sawtooth; freq may be a per-sample array"""
    dt = np.asarray(freq, dtype=float) / SR
    ph = (phase0 + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    m = ph < dt; x = ph[m] / dt[m]; y[m] -= x + x - x * x - 1
    m = ph > 1 - dt; x = (ph[m] - 1) / dt[m]; y[m] -= x * x + x + x + 1
    return y


def adsr(dur, a, d, s, r):
    n = int((dur + r) * SR); t = ts(n)
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    ig = min(int(dur * SR), n - 1); v = e[ig]
    return np.where(t < dur, e, v * np.exp(-(t - dur) / (r / 4.6)))


def make_ir(dur, rt60, predelay=0.02, damp=3500, seed=1, early=True):
    n = int(dur * SR); t = ts(n); r = np.random.default_rng(seed)
    dec = np.exp(-6.9 * t / rt60); out = []
    for c in range(2):
        x = r.standard_normal(n) * dec
        dark = lp(x, damp, 1); w = np.clip(t / (rt60 * .45), 0, 1)
        x = x * (1 - w) * .6 + dark * w
        x[:int(.003 * SR)] *= np.linspace(0, 1, int(.003 * SR))
        if early:
            for k in range(6):
                d = int((0.007 + 0.011 * k + r.random() * .006) * SR); x[d] += (0.5 - k * .06) * (1 if r.random() > .5 else -1) * 8
        out.append(np.concatenate([np.zeros(int(predelay * SR)), x]))
    ir = np.stack(out, 1); return ir / np.sqrt((ir ** 2).sum(0).mean())


IR_HALL = make_ir(2.6, 1.9, .024, 3800, 11)
IR_PLATE = make_ir(1.1, 0.9, .006, 6500, 12, early=False)

# ───────────────────────── instruments ─────────────────────────


def epiano(m, dur, vel=0.7):
    """DX7-style FM electric piano: 1:1 carrier pair (body of the tone, modulation index decays over time) + 14:1 bell transient"""
    f = mtof(m); rel = 0.22; n = int((dur + rel) * SR); t = ts(n)
    tau = 1.2 * (262 / f) ** .5 + .35
    rel_env = np.where(t < dur, 1.0, np.exp(-(t - dur) / .06))
    amp = np.exp(-t / tau) * rel_env * np.minimum(1, t / .0015)
    I1 = vel * 1.5 * np.exp(-t / .5) + .3 * vel
    ph = 2 * np.pi * f * t; ph2 = 2 * np.pi * f * 1.0015 * t
    body = .62 * np.sin(ph + I1 * np.sin(ph)) + .38 * np.sin(ph2 + .7 * I1 * np.sin(ph2))
    tine = np.sin(ph + 2.2 * vel * np.exp(-t / .016) * np.sin(14 * ph)) * np.exp(-t / .11) * .3 * vel * rel_env
    return (body * amp + tine) * vel


def bass(m, dur, vel=.8, kind='T'):
    """Additive slap bass: higher harmonics decay faster (the natural filtering of a plucked string) + pitch drop on attack + string-slap noise"""
    f0 = mtof(m); rel = .025; n = int((dur + rel) * SR); t = ts(n)
    P = dict(T=(1.1, .30, 1.0, .03, .5), P=(.8, .12, .8, .045, .9), D=(.045, .9, 1.5, 0, .7), F=(1.8, .7, 1.5, .01, .1))[kind]
    base_tau, kk, tilt, drop, click = P
    ph = 2 * np.pi * np.cumsum(f0 * (1 + drop * np.exp(-t / .009))) / SR
    y = np.zeros(n); nh = int(min(46, 9000 / f0))
    for k in range(1, nh + 1):
        y += np.sin(k * ph + .37 * k) / k ** tilt * np.exp(-t / (base_tau / (1 + kk * k ** 1.15)))
    y /= 2.2
    cl = hp(noise(n), 2500) * np.exp(-t / .0022) * click
    env = np.minimum(1, t / .0012) * np.where(t < dur, 1, np.exp(-(t - dur) / .01))
    return np.tanh(1.5 * (y + cl) * env) * vel


def kick(vel=1.0):
    n = int(.42 * SR); t = ts(n)
    f = 50 + 85 * np.exp(-t / .028) + 380 * np.exp(-t / .0025)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .15) + hp(noise(n), 3000) * np.exp(-t / .004) * .22
    return np.tanh(1.4 * y) * vel


def _gate(n, hold, fall=.018):
    t = ts(n); return np.where(t < hold, 1.0, np.clip(1 - (t - hold) / fall, 0, 1))


def snare(vel=1.0, gate=.26):
    """Gated-reverb snare: dry + plate reverb, the reverb tail is cut by a hard gate at ~260 ms"""
    n = int(.6 * SR); t = ts(n)
    tone = np.sin(2 * np.pi * np.cumsum(190 * (1 + .12 * np.exp(-t / .01))) / SR) * np.exp(-t / .05) * .6 \
        + np.sin(2 * np.pi * 335 * t) * np.exp(-t / .03) * .3
    nz = bp(noise(n), 1200, 9000) * np.exp(-t / .1) * .9 + hp(noise(n), 5500) * np.exp(-t / .03) * .3
    dry = tone + nz
    wet = np.stack([fftconvolve(dry, IR_PLATE[:, c])[:n] for c in range(2)], 1)
    g = _gate(n, gate)[:, None]
    return (dry[:, None] * .8 + wet * 1.1 * g) * vel


def tom(f, vel=1.0):
    n = int(.55 * SR); t = ts(n)
    dry = np.sin(2 * np.pi * np.cumsum(f * (1 + .6 * np.exp(-t / .018))) / SR) * np.exp(-t / .22) + bp(noise(n), 300, 4000) * np.exp(-t / .03) * .3
    wet = np.stack([fftconvolve(dry, IR_PLATE[:, c])[:n] for c in range(2)], 1)
    return (dry[:, None] * .9 + wet * .9 * _gate(n, .24)[:, None]) * vel


HAT_F = np.array([205.3, 304.4, 369.6, 522.7, 540.0, 800.0]) * 2.1


def hat(vel=1.0, open_=False):
    n = int((.5 if open_ else .09) * SR); t = ts(n)
    x = sum(np.sign(np.sin(2 * np.pi * f * t + i)) for i, f in enumerate(HAT_F)) / 6
    x = hp(bp(x, 6000, 16000) + hp(noise(n), 8000) * .5, 6000)
    return x * np.exp(-t / (.13 if open_ else .017)) * vel


def crash(vel=1.0, dur=2.6):
    n = int(dur * SR); t = ts(n); out = []
    for c in range(2):
        x = hp(noise(n), 3500) + .5 * bp(sum(np.sign(np.sin(2 * np.pi * f * 1.37 * t + c)) for f in HAT_F), 3000, 12000)
        out.append(x * np.exp(-t / 1.1) * np.minimum(1, t / .002))
    return np.stack(out, 1) * vel * .5


def clap(vel=1.0):
    n = int(.3 * SR); t = ts(n); e = np.zeros(n)
    for k, d in enumerate([0, .009, .018, .03]):
        s = int(d * SR); e[s:] += np.exp(-(t[:n - s]) / (.006 if k < 3 else .09))
    return bp(noise(n), 900, 3500) * e * vel * .6


def tamb(vel=1.0):
    n = int(.12 * SR); t = ts(n)
    x = hp(noise(n), 7000) + .4 * sum(np.sin(2 * np.pi * f * t) for f in (5200, 6900, 8300))
    return x * np.exp(-t / .045) * vel


def boom(vel=1.0):
    n = int(.9 * SR); t = ts(n)
    return np.sin(2 * np.pi * np.cumsum(38 + 45 * np.exp(-t / .12)) / SR) * np.exp(-t / .35) * np.minimum(1, t / .004) * vel


def brass(m, dur, vel=.8, bright=1.0, att=.012):
    """Synth brass: 3 detuned PolyBLEP saws + pitch drop on attack (scoop) + filter-envelope swell + delayed vibrato"""
    f = mtof(m); rel = .14; n = int((dur + rel) * SR); t = ts(n)
    scoop = 2 ** ((-.3 * np.exp(-t / .035)) / 12)
    vib = 1 + .0035 * np.sin(2 * np.pi * 5.3 * t) * np.clip((t - .35) / .3, 0, 1)
    y = sum(saw(f * 2 ** (d / 1200) * scoop * vib, rng.random()) for d in (-8, 0, 7)) / 3
    fe = np.where(t < att + .03, np.minimum(1, t / (att + .03)), .5 + .5 * np.exp(-(t - att - .03) / .25))
    fe = np.where(t < dur, fe, fe[min(int(dur * SR), n - 1)] * np.exp(-(t - dur) / .05))
    fc = f * 1.3 + (1200 + 5.5 * f) * bright * (.35 + .65 * vel) * fe
    y = svf(y, fc, .85, 0)
    return y * adsr(dur, att, .3, .78, rel)[:n] * vel


def pad(m, dur, vel=.5):
    f = mtof(m); rel = .9; n = int((dur + rel) * SR); t = ts(n)
    y = sum(saw(f * 2 ** (d / 1200) * (1 + .0015 * np.sin(2 * np.pi * .31 * t + d)), rng.random()) for d in (-12, -4, 4, 12)) / 4
    y = lp(y, 2400, 2)
    return y * adsr(dur, .45, .6, .85, rel)[:n] * vel


def gtr(m, dur, vel=.7, mute=False):
    """Karplus-Strong electric guitar: pick-noise excitation, high damping for muted strums"""
    f = mtof(m); P = int(round(SR / f - .5)); L = int((dur + .06) * SR)
    exc = lp(noise(P), 2500 + 3500 * vel, 1) * vel
    y = ks_loop(exc, L, P, .975 if mute else .9965, .15 if mute else .35)
    t = ts(L); env = np.where(t < dur, 1, np.exp(-(t - dur) / .012))
    if mute: y = lp(y, 2200, 1)
    return y * env


def bell(m, dur=2.8, vel=.5):
    f = mtof(m); n = int(dur * SR); t = ts(n)
    I = 2.6 * vel * np.exp(-t / .3) + .25
    y = np.sin(2 * np.pi * f * t + I * np.sin(2 * np.pi * 3.5 * f * t)) * np.exp(-t / .95) \
        + .25 * np.sin(2 * np.pi * 2.001 * f * t) * np.exp(-t / .4)
    return y * np.minimum(1, t / .002) * vel


def riser(dur, vel=1.0, f0=250, f1=7000):
    n = int(dur * SR); t = ts(n); u = t / dur
    fc = f0 * (f1 / f0) ** (u ** 1.6)
    y = svf(noise(n), fc, 2.2, 1) * (u ** 2.2)
    return y * vel


# ───────────────────────── harmony data (D major, lifted to Eb at bar 20) ─────────────────────────
PC = dict(C=0, Db=1, **{'C#': 1}, D=2, Eb=3, E=4, F=5, **{'F#': 6}, G=7, Ab=8, **{'G#': 8}, A=9, Bb=10, B=11)
Q = {'M7': [0, 4, 7, 11], 'M9': [0, 4, 7, 11, 14], 'm7': [0, 3, 7, 10], 'm9': [0, 3, 7, 10, 14], '7': [0, 4, 7, 10],
     '13': [0, 4, 10, 14, 21], '7sus4': [0, 5, 7, 10], '7b9': [0, 4, 7, 10, 13], 'add9': [0, 4, 7, 14], '6': [0, 4, 7, 9]}
_V = [[(0, 4, 'G', 'M9')], [(0, 4, 'A', '6')], [(0, 4, 'F#', 'm7')], [(0, 4, 'B', 'm9')]]
CH = {0: [(0, 4, 'G', 'M9')], 1: [(0, 4, 'A', '6')], 2: [(0, 4, 'F#', 'm7')], 3: [(0, 2, 'B', 'm9'), (2, 2, 'A', '7sus4')]}
for b in range(4, 12): CH[b] = _V[(b - 4) % 4]
CH[11] = [(0, 2, 'B', 'm9'), (2, 2, 'A', '7sus4')]
CH[12] = [(0, 4, 'G', 'M9')]; CH[13] = [(0, 2, 'A', '13'), (2, 2, 'A', '7')]
_C = [[(0, 4, 'G', 'M9')], [(0, 4, 'A', '13')], [(0, 4, 'F#', 'm7')], [(0, 2, 'B', 'm9'), (2, 2, 'D', 'add9')]]
for b in range(14, 18): CH[b] = _C[(b - 14) % 4]
CH[18] = [(0, 4, 'E', 'm9')]; CH[19] = [(0, 2, 'A', '7sus4'), (2, 1, 'Bb', '7sus4'), (3, 1, 'Bb', '7')]
_E = [[(0, 4, 'Ab', 'M9')], [(0, 4, 'Bb', '13')], [(0, 4, 'G', 'm7')], [(0, 2, 'C', 'm9'), (2, 2, 'Eb', 'add9')]]
for b in range(20, 24): CH[b] = _E[(b - 20) % 4]
CH[24] = [(0, 4, 'Ab', 'M9')]; CH[25] = [(0, 4, 'Eb', 'M9')]; CH[26] = [(0, 4, 'Ab', 'M9')]; CH[27] = [(0, 4, 'Eb', 'M9')]
LAST = 27

def chord_at(b, beat):
    while beat >= 4: b += 1; beat -= 4
    for s, d, r, q in CH.get(b, CH[LAST]):
        if s <= beat < s + d: return r, q
    return CH.get(b, CH[LAST])[-1][2:]


def bass_root(r): return 28 + (PC[r] - 4) % 12


def voicing(r, q, center, drop_root=True, nmax=5):
    ints = Q[q]
    tones = sorted(set((PC[r] + i) % 12 for i in ints if not (drop_root and i == 0 and len(ints) > 3)))
    best, bs = None, 1e9
    for k in range(len(tones)):
        rot = tones[k:] + tones[:k]; v = [rot[0]]
        for p in rot[1:]:
            while p <= v[-1]: p += 12
            v.append(p)
        v = np.array(v[-nmax:], float); v += 12 * round((center - v.mean()) / 12)
        s = abs(v.mean() - center) + .15 * (v.max() - v.min())
        if s < bs: best, bs = v, s
    return [int(x) for x in best]


def harm(top, r, q, nv=4):
    pcs = set((PC[r] + i) % 12 for i in Q[q]); out = [top]; c = top - 2
    while len(out) < nv and c > top - 13:
        if c % 12 in pcs and out[-1] - c >= 2: out.append(c)
        c -= 1
    return out + [top - 12]


# ───────────────────────── buses and placement ─────────────────────────
STEMS = ['drums', 'bass', 'keys', 'guitar', 'pad', 'brass', 'lead', 'fx']
BUS = {k: np.zeros((N, 2)) for k in STEMS}
SEND = {k: np.zeros(N) for k in STEMS}          # reverb send (mono)
SEND_AMT = dict(drums=.05, bass=0, keys=.22, guitar=.12, pad=.35, brass=.2, lead=.28, fx=.45)
KICKS = []


def place(bus, sig, t, gain=1.0, pan=0.0, send=None):
    s = int(round(t * SR))
    if s >= N: return
    st = sig if sig.ndim == 2 else np.stack([sig * np.cos((pan + 1) * np.pi / 4), sig * np.sin((pan + 1) * np.pi / 4)], 1) * 1.4142
    st = st * gain
    if t < CUT0 - 1e-6:                      # sounds that start before the silent section must not leak into it
        c = int(CUT0 * SR) - s
        if c < len(st):
            fl = min(int(.012 * SR), c)
            if fl > 0: st[c - fl:c] *= np.linspace(1, 0, fl)[:, None]
            st[c:] = 0
    if s < 0: st = st[-s:]; s = 0
    e = min(N, s + len(st))
    BUS[bus][s:e] += st[:e - s]
    SEND[bus][s:e] += st[:e - s].mean(1) * (SEND_AMT[bus] if send is None else send)


def hum(ms=3.0): return rng.normal(0, ms / 1000)
def jv(v, j=.08): return v * (1 + rng.uniform(-j, j))
def tr(m, b): return m + (1 if b >= KEY_UP else 0)   # melody data is written in the original key, +1 in the key-changed section


# ───────────────────────── arrangement ─────────────────────────
SNARES = [snare(1, .26) for _ in range(3)]
KICKW = [kick(1) for _ in range(2)]


def drums_bar(b, style, dyn=1.0, crash_=False):
    t0 = T(b)
    def at(s): return t0 + s * BEAT / 4
    def K(s, v=1.0):
        place('drums', KICKW[s % 2], at(s) + hum(1), .5 * v * dyn); KICKS.append(at(s))
    def S(s, v=1.0): place('drums', SNARES[rng.integers(3)], at(s) + hum(2), .36 * v * dyn)
    def H(s, v=1.0, o=False): place('drums', hat(jv(1), o), at(s) + hum(3), (.09 if o else .075) * v * dyn, .3)
    if crash_: place('drums', crash(1), t0, .24 * dyn); K(0, 1.1)
    acc = [1, .45, .72, .45]
    if style == 'groove':
        for s in (0, 6, 10, 13): K(s, .95 if s else 1.0)
        S(4); S(12); S(7, .16); S(15, .14)
        for s in range(16):
            if s == 14: H(s, .9, True)
            elif s != 15: H(s, acc[s % 4])
    elif style == 'chorus':
        for s in (0, 3, 6, 8, 10, 14): K(s, 1.0 if s in (0, 8) else .85)
        S(4); S(12); S(7, .15); S(15, .18)
        for s in (4, 12): place('drums', clap(jv(1)), at(s) + .004, .22 * dyn, -.1)
        for s in range(16):
            if s % 4 == 2: H(s, .75, True)
            else: H(s, acc[s % 4])
            place('drums', tamb(jv(1, .15)), at(s) + hum(4), .032 * acc[s % 4] * dyn, -.4)
    elif style == 'title':
        for s in (0, 3, 8, 11): K(s)
        S(4); S(12); S(13, .2)
        for s in range(0, 16, 2): H(s, 1 if s % 4 == 0 else .7)
        for s in (4, 12): place('drums', clap(jv(1)), at(s) + .004, .2 * dyn, -.1)
    elif style == 'pullback':
        for s in (0, 8, 10): K(s, .85)
        S(4, .8); S(12, .8)
        for s in range(0, 16, 2): H(s, .8 if s % 4 == 0 else .55)
    elif style == 'pre13':
        for s in (0, 4, 8, 12): K(s, .9)
        S(4, .85); S(12, .85)
        for s in range(16):
            if s % 4 == 2: H(s, .8, True)
            elif s % 2 == 0: H(s, .6)
    elif style == 'pre14':
        for s in (0, 4, 8, 12): K(s, .95)
        S(4, .9)
        for i, s in enumerate(range(8, 16, 2)): S(s, .45 + .12 * i)
        for s in range(16):
            if s % 4 == 2: H(s, .85, True)
            elif s % 2 == 0: H(s, .6)
    elif style == 'pre15':
        for s in (0, 4, 8): K(s, 1.0)
        for s in range(12): S(s, .45 + .55 * s / 11)
        for s in (0, 4, 8): place('drums', tom(95), at(s), .22 * dyn)
    elif style == 'intro':
        for s in range(0, 16, 2): place('drums', tamb(jv(1, .2)), at(s) + hum(5), .035 * (1 if s % 4 == 2 else .6), .35)
    elif style == 'fill4':
        K(0, .7)
        for i, (s, f) in enumerate(zip(range(8, 16), [225, 215, 180, 172, 142, 136, 108, 104])):
            place('drums', tom(f, .6 + .04 * i), at(s) + hum(1), .2 * dyn, .5 - i * .13)
        S(15, .55)
    elif style == 'fill25':
        for s in (0, 8, 10): K(s, .9)
        S(4, .85)
        for i, (s, f) in enumerate(zip(range(8, 16), [230, 225, 182, 176, 140, 134, 106, 100])):
            place('drums', tom(f, .7 + .04 * i), at(s) + hum(1), .3 * dyn, .5 - i * .13)
        S(15, 1.0)
        for s in range(0, 8, 2): H(s, .7)


B_VERSE = [(0, 'T', 0, 3), (3, 'D', 0, 1), (4, 'P', 12, 1), (6, 'T', 0, 2), (8, 'T', 7, 2), (10, 'P', 12, 1), (11, 'D', 0, 1), (12, 'T', 0, 2), (14, 'T', 'b7', 1), (15, 'T', 'A', 1)]
B_CHORUS = [(0, 'T', 0, 2), (2, 'P', 12, 1), (3, 'D', 0, 1), (4, 'T', 0, 2), (6, 'P', 12, 2), (8, 'T', 7, 2), (10, 'P', 12, 1), (11, 'T', 0, 1), (12, 'T', 0, 2), (14, 'P', 12, 1), (15, 'T', 'A', 1)]
B_TITLE = [(0, 'T', 0, 3), (3, 'P', 12, 1), (5, 'T', 0, 3), (8, 'T', 0, 3), (11, 'P', 12, 1), (13, 'T', 0, 2), (15, 'D', 0, 1)]
B_PULL = [(0, 'T', 0, 4), (6, 'T', 0, 2), (8, 'T', 7, 3), (12, 'T', 0, 2), (14, 'P', 12, 1), (15, 'T', 'A', 1)]


def bass_bar(b, pat, dyn=1.0, stop=16):
    for s, kind, iv, ln in pat:
        if s >= stop: continue
        beat = s / 4; r, q = chord_at(b, beat); root = bass_root(r)
        if iv == 'A':
            nr = bass_root(chord_at(b + 1, 0)[0]); cands = [nr - 1, nr + 1, nr + 11, nr - 11]
            m = min(cands, key=lambda c: abs(c - root))
        elif iv == 'b7': m = root + (9 if q.startswith('M') or q == 'add9' else 10)
        else: m = root + iv
        v = {'T': .85, 'P': .8, 'D': .5, 'F': .7}[kind]
        place('bass', bass(m, ln * BEAT / 4 * .92, jv(v, .06), kind), T(b, beat) + hum(1.5), .36 * dyn)


def ep_bar(b, pat, dyn=1.0, center=64):
    for beat, d, vm in pat:
        r, q = chord_at(b, beat + (.5 if beat % 1 == .5 and beat >= 3.5 else 0))   # the syncopation on beat 3.5 anticipates the next chord
        for i, m in enumerate(voicing(r, q, center)):
            place('keys', epiano(m, d * BEAT, jv(.62 * vm)), T(b, beat) + i * .004 + hum(2), .27 * dyn, -.35 + .18 * i)


def pad_bar(b, dyn=1.0, center=62):
    for s, d, r, q in CH[b]:
        dur = d * BEAT
        for i, m in enumerate(voicing(r, q, center)):
            place('pad', pad(m, dur, .5), T(b, s), .22 * dyn, (-.6, .6)[i % 2])


G_VERSE = '..x.X..x..x.X.x.'
G_CHORUS = 'x.xxX.xxx.xxX.xx'
G_TITLE = 'X..X.X..X..X.X..'


def gtr_bar(b, pat, dyn=1.0):
    for s, ch in enumerate(pat):
        if ch == '.': continue
        r, q = chord_at(b, s / 4); v = voicing(r, q, 71, nmax=4)[-3:]
        if s % 2: v = v[::-1]
        mute = ch == 'x'
        for i, m in enumerate(v):
            place('guitar', gtr(m, .045 if mute else .2, jv(.5 if mute else .85), mute), T(b, s / 4) + i * .006 + hum(2.5), .4 * dyn, 0)


def stab(b, beat, dur, top, dyn=1.0, bright=1.0, att=.012, vel=.85):
    r, q = chord_at(b, beat)
    for i, m in enumerate(harm(top, r, q)):
        place('brass', brass(m, dur, jv(vel, .05), bright, att), T(b, beat) + hum(3), .15 * dyn, (-.45, .45, -.2, .2, 0)[i % 5])


def lead_line(notes, bright, gain):
    """Monophonic lead: continuous-phase sawtooth + glide + delayed vibrato; notes=[(t, dur, midi, vel)]"""
    if not notes: return
    notes = sorted(notes); t0 = max(0, notes[0][0] - .2); t1 = min(DUR, notes[-1][0] + notes[-1][1] + .6)
    a, b_ = int(t0 * SR), int(t1 * SR); n = b_ - a; t = ts(n) + t0
    pitch = np.full(n, float(notes[0][2])); gate = np.zeros(n); acc = np.zeros(n); vib = np.zeros(n); vel = np.zeros(n)
    for (s, d, m, v) in notes:
        i0, i1 = int((s - t0) * SR), int((s + d - t0) * SR)
        pitch[i0:] = m; gate[i0:max(i0 + 1, i1 - int(.02 * SR))] = 1; vel[i0:i1] = v
        k = np.arange(n - i0) / SR; acc[i0:] = np.maximum(acc[i0:], np.exp(-k / .16))
        if d > .45: vib[i0:i1] = np.clip((k[:i1 - i0] - .22) / .3, 0, 1)
    al = np.exp(-1 / (.028 * SR)); from scipy.signal import lfilter
    pitch = lfilter([1 - al], [1, -al], pitch, zi=[pitch[0] * al])[0]
    pitch = pitch + .16 * vib * np.sin(2 * np.pi * 5.6 * t)
    f = mtof(pitch)
    osc = .5 * saw(f) + .3 * saw(f * 1.004, .3) + .2 * (saw(f, 0) - saw(f, .5))
    amp = env_follow(gate * np.maximum(vel, .01), .006, .07)
    fc = 700 + f * 2.0 + (2600 * acc + 900) * bright
    y = svf(osc, fc, 1.05, 0) * amp
    s = np.stack([y, y], 1) * gain
    BUS['lead'][a:b_] += s; SEND['lead'][a:b_] += y * gain * SEND_AMT['lead']


# ───────────────────────── the lyric melody (written in D; bars >= KEY_UP sound a semitone up) ─────────────────────────
# (bar, beat, beats, midi, word or None)  ->  one note per sung syllable; None = instrumental answer
LYR = [
    # line 1  "Under the stars, we come alive,"
    (4, .5, .5, 69, 'Un-'), (4, 1, .5, 71, 'der'), (4, 1.5, .5, 74, 'the'), (4, 2, 1.5, 78, 'stars,'), (4, 3.5, .5, 76, 'we'),
    (5, 0, 1, 74, 'come'), (5, 1, .5, 76, 'a-'), (5, 1.5, 2.5, 73, 'live,'),
    # line 2  "Chasing dreams, we learn to fly."
    (8, .5, .5, 69, 'Chas-'), (8, 1, .5, 71, 'ing'), (8, 1.5, 1.5, 74, 'dreams,'), (8, 3.5, .5, 76, 'we'),
    (9, 0, 1, 78, 'learn'), (9, 1, .5, 79, 'to'), (9, 1.5, 2.5, 81, 'fly.'),
    # line 3  "Through every beat, through every night,"
    (14, 0, .5, 78, 'Through'), (14, .5, .5, 79, 'ev-'), (14, 1, .5, 78, 'ery'), (14, 1.5, 1.5, 74, 'beat,'), (14, 3.5, .5, 76, 'through'),
    (15, 0, .5, 78, 'ev-'), (15, .5, .5, 79, 'ery'), (15, 1, 2.5, 81, 'night,'),
    # line 4  "We find our way into the light."
    (21, 0, .5, 76, 'We'), (21, .5, 1, 78, 'find'), (21, 1.5, .5, 79, 'our'), (21, 2, 1.5, 81, 'way'), (21, 3.5, .5, 78, 'in-'),
    (22, 0, .5, 76, 'to'), (22, .5, .5, 78, 'the'), (22, 1, 4.5, 81, 'light.'),
]
LINES = [(0, 8), (8, 15), (15, 23), (23, 31)]          # slices of LYR per lyric line
ANSWER = [  # lead answers between the sung lines (softer), and the chorus hook
    (6, .5, .5, 78), (6, 1, .5, 76), (6, 1.5, 1, 73), (6, 2.5, 1.5, 69), (7, 0, .5, 71), (7, .5, .5, 73), (7, 1, 2.5, 74),
    (10, .5, .5, 81), (10, 1, .5, 78), (10, 1.5, 1, 76), (10, 2.5, 1.5, 73), (11, 0, .5, 74), (11, .5, .5, 76), (11, 1, 1, 78), (11, 2, .9, 76),
]
HOOK = [(12, 0, 1.5, 81), (12, 1.5, .5, 78), (12, 2, 2, 74), (13, 1, .5, 76), (13, 1.5, .5, 78), (13, 2, 2, 81),
        (16, 0, 1, 81), (16, 1, .5, 78), (16, 1.5, .5, 76), (16, 2, 1, 73), (16, 3, 1, 76), (17, 0, 1.5, 78), (17, 1.5, .5, 74), (17, 2, .5, 76), (17, 2.5, 1.5, 78),
        (18, 0, .5, 74), (18, .5, .5, 76), (18, 1, .5, 78), (18, 1.5, .5, 79), (18, 2, 1, 81), (18, 3, 1, 83), (19, 0, 2, 81), (19, 2, 1, 81), (19, 3, 1, 85),
        (20, 0, 1.5, 81), (20, 1.5, .5, 79), (20, 2, .5, 81), (20, 2.5, 1.5, 83),
        (23, 2, .5, 81), (23, 2.5, .5, 83), (23, 3, 1, 86)]
OUTRO = [(24, .5, .5, 69), (24, 1, .5, 71), (24, 1.5, .5, 74), (24, 2, 1.5, 78), (24, 3.5, .5, 76), (25, 0, 1, 74), (25, 1, .5, 76), (25, 1.5, 3, 78)]


def build():
    soft, full = [], []
    ARP = [0, 1, 2, 3, 4, 3, 2, 1]
    def arp(b, g=.24, center=66):
        r, q = chord_at(b, 0); v = voicing(r, q, center, nmax=5)
        for k in range(8):
            m = v[ARP[k] % len(v)]
            place('keys', epiano(m, BEAT * 1.2, jv(.4 + .06 * (k % 4 == 0))), T(b, k * .5) + hum(3), g, -.4 + .1 * ARP[k])
    # ── intro 0-3 ──
    for b in range(4):
        pad_bar(b, .7 + .1 * b); arp(b)
        if b >= 2: drums_bar(b, 'intro')
        if b == 2: place('bass', bass(bass_root(chord_at(b, 0)[0]), BAR * .95, .55, 'F'), T(b), .3)
    for s, d, m in [(0, .5, 81), (.5, .5, 78), (1, 1, 74), (2, 2, 86)]:      # bell: a star twinkle before the hook
        place('fx', bell(m, 3.0, .4), T(0, s) + .3, .08, .25)
    drums_bar(3, 'fill4'); bass_bar(3, [(0, 'F', 0, 8), (8, 'T', 0, 2), (10, 'P', 12, 1), (12, 'T', 0, 2), (14, 'T', 'A', 2)], .9)
    place('fx', riser(BAR, .9), T(3), .1)
    # ── verse 4-11 ──
    for b in range(4, 12):
        drums_bar(b, 'pre15' if b == 11 else 'groove', .78 if b < 11 else .9)
        bass_bar(b, B_VERSE, .85, stop=12 if b == 11 else 16)
        ep_bar(b, [(0, 1.0, 1.0), (1.5, .4, .7), (2.5, .9, .9), (3.5, .4, .75)][: 3 if b == 11 else 4], 1.0)
        gtr_bar(b, G_VERSE, .7)
        pad_bar(b, .45 + .2 * (b >= 8))
    place('fx', riser(CUT0 - T(10), 1.0, 300, 9000), T(10), .22)
    # ── drop 12-13: impact + leap ──
    place('fx', boom(1.2), T(12), .4); place('drums', crash(1.1), T(12), .3)
    for b in (12, 13):
        drums_bar(b, 'title', 1.0, crash_=(b == 12))
        bass_bar(b, B_TITLE); pad_bar(b, .9); gtr_bar(b, G_TITLE, .9)
        ep_bar(b, [(0, 1.0, 1), (2, 1.0, .9), (3.5, .45, .8)], .9)
    r, q = chord_at(12, 0); stab(12, 0, BEAT * 1.6, max(voicing(r, q, 74)), 2.0, 1.3, vel=1.0)
    stab(13, 0, BEAT * .5, 81, 1.6, 1.1); stab(13, 3.5, BEAT * .45, 81, 1.4, 1.0)
    # ── chorus A 14-19 ──
    for b in range(14, 20):
        drums_bar(b, 'fill25' if b == 19 else 'chorus', 1.0, crash_=b in (14, 16, 18))
        bass_bar(b, B_CHORUS, 1.0)
        ep_bar(b, [(0, 1.4, 1), (1.5, .45, .7), (2, 1.4, .9), (3.5, .45, .8)], .85, 65)
        gtr_bar(b, G_CHORUS, .9); pad_bar(b, .75)
    place('fx', boom(1), T(14), .3); place('fx', riser(BAR * 2, 1.0, 300, 9000), T(18), .2)
    for b, s, top in [(15, 3.5, 79), (17, 3.5, 78), (18, 3.5, 83)]: stab(b, s, BEAT * .45, top, 1.3, 1.0)
    # ── lift chorus 20-23 (Eb) ──
    place('fx', boom(1.1), T(20), .36)
    rc = crash(1.0, 1.0)[::-1] * np.linspace(0, 1, int(1.0 * SR))[:, None] ** 2; place('fx', rc, T(20) - 1.0, .12)
    for b in range(20, 24):
        drums_bar(b, 'chorus', 1.05, crash_=b in (20, 22))
        bass_bar(b, B_CHORUS, 1.0)
        ep_bar(b, [(0, 1.4, 1), (1.5, .45, .7), (2, 1.4, .9), (3.5, .45, .8)], .95, 65)
        gtr_bar(b, G_CHORUS, 1.0); pad_bar(b, .9)
        for s, d, rr, qq in CH[b]:
            for i, m in enumerate(voicing(rr, qq, 77, nmax=4)): place('pad', pad(m, d * BEAT, .55), T(b, s), .2, (-.7, .7)[i % 2])
    r, q = chord_at(20, 0); stab(20, 0, BEAT * 1.6, max(voicing(r, q, 75)), 1.9, 1.3, vel=1.0)
    # ── outro 24-27 ──
    drums_bar(24, 'pullback', .7); bass_bar(24, B_PULL, .8); gtr_bar(24, G_VERSE, .6)
    for b in range(24, 28):
        pad_bar(b, .8); arp(b, .2)
        if b >= 25: drums_bar(b, 'intro')
    place('drums', crash(1.2, 5.0), T(25), .34); place('drums', KICKW[0], T(25), .55); place('fx', boom(1), T(25), .3)
    for m in harm(82, 'Eb', 'M9', 4): place('brass', brass(m, BAR * 1.1, .95, 1.15, .015), T(25), .2, rng.uniform(-.4, .4))
    place('bass', bass(bass_root('Eb'), BAR * 1.8, .85, 'T'), T(25), .34)
    for i, m in enumerate(voicing('Eb', 'M9', 63)): place('keys', epiano(m, BAR * 3, .7), T(26) + i * .012, .25, -.35 + .18 * i)
    for k, m in enumerate([82, 86, 89, 91, 94, 98, 89, 94]):
        place('fx', bell(m, 3.5, .45 - .03 * k), T(26, k * .5), .07, (-.5, .5)[k % 2])
    # ── leads ──
    for b, s, d, m, w in LYR: full.append((T(b, s), d * BEAT, tr(m, b), 1.0 if b >= 14 else .9))
    for b, s, d, m in ANSWER: soft.append((T(b, s), d * BEAT, tr(m, b), .75))
    for b, s, d, m in HOOK: full.append((T(b, s), d * BEAT, tr(m, b), .95))
    for b, s, d, m in OUTRO: soft.append((T(b, s), d * BEAT, tr(m, b), .7))
    # brass doubles the chorus lyric an octave down for weight
    for b, s, d, m, w in LYR:
        if b >= 14: place('brass', brass(tr(m, b) - 12, d * BEAT * .95, .8, .9), T(b, s), .16, .15)
    lead_line(sorted(full), 1.0, .3)
    lead_line(sorted(soft), .45, .22)


def song_json():
    words = [dict(w=w, t=round(T(b, s), 4), d=round(d * BEAT, 4), line=next(i for i, (a, z) in enumerate(LINES) if a <= k < z))
             for k, (b, s, d, m, w) in enumerate(LYR)]
    return dict(bpm=BPM, beat=BEAT, bar=BAR, dur=DUR, cut=[CUT0, CUT1], key_up=T(KEY_UP), title=T(25), tapestop=TAPESTOP, words=words)


def apply_lofi(st):
    a, b = int(LOFI0 * SR), int(LOFI1 * SR); pad_ = int(.15 * SR)
    seg = lofi(st[a:b + pad_])[:b - a]
    w = np.ones(b - a); f = int(.6 * SR); w[-f:] = np.linspace(1, 0, f)   # tape warms up: lo-fi opening, opens over 0.6 s
    out = st.copy(); out[a:b] = st[a:b] * (1 - w[:, None]) + seg * w[:, None]
    return out


def tape_stop(st, t0, dur=.55):
    a = int(t0 * SR); n = min(N - a, int(dur * SR))
    sp = np.linspace(1, 0, n) ** 1.3; pos = a + np.cumsum(sp)
    out = st.copy()
    for c in range(2): out[a:a + n, c] = np.interp(pos, np.arange(N), st[:, c]) * np.linspace(1, 0, n) ** .5
    out[a + n:] = 0
    return out
# ───────────────────────── effects and mastering ─────────────────────────
def chorus_fx(x, base=.009, depth=.0028, rates=(.73, 1.11), mix=.55):
    n = len(x); ar = np.arange(n); t = ar / SR; mono = x.mean(1); out = x.copy()
    for c in range(2):
        d = (base + depth * np.sin(2 * np.pi * rates[c] * t + c * 1.7)) * SR
        out[:, c] = x[:, c] * (1 - mix * .4) + np.interp(ar - d, ar, mono) * mix
    return out


def pingpong(mono, dt, fb=.36, taps=5, lpf=4200):
    out = np.zeros((N, 2)); y = mono.copy()
    for k in range(1, taps + 1):
        y = lp(y, lpf, 1); sh = int(k * dt * SR); g = fb ** k
        out[sh:, k % 2] += y[:N - sh] * g
    return out


def split_fx(dry_mono_or_st, fx):
    """Effect tails from before the silent section are cut at CUT0; those after it are left as normal"""
    A = np.ones(N); c0, c1 = int(CUT0 * SR), int(CUT1 * SR); fl = int(.012 * SR)
    A[c0 - fl:c0] = np.linspace(1, 0, fl); A[c0:] = 0
    B = np.zeros(N); B[c1:] = 1
    sh = (slice(None), None) if dry_mono_or_st.ndim == 2 else slice(None)
    a = fx(dry_mono_or_st * (A[:, None] if dry_mono_or_st.ndim == 2 else A)); b = fx(dry_mono_or_st * (B[:, None] if dry_mono_or_st.ndim == 2 else B))
    return a * A[:, None] + b


def lofi(seg):
    n = len(seg); ar = np.arange(n); t = ar / SR
    mid = seg.mean(1); side = (seg[:, 0] - seg[:, 1]) * .5 * .25
    wow = .0014 * np.sin(2 * np.pi * .55 * t) + .00022 * np.sin(2 * np.pi * 6.7 * t) + .0012
    idx = ar - wow * SR
    x = np.stack([np.interp(idx, ar, mid + side), np.interp(idx, ar, mid - side)], 1)
    x = bp(x, 320, 3100, 3)
    x = np.tanh(x * 2.4) / 2.4 * 1.35
    hiss = hp(noise(n), 3500) * .006
    return x * 10 ** (-2.5 / 20) + hiss[:, None]




def main():
    import time; t0 = time.time()
    build(); print('build', round(time.time() - t0, 1), 's')
    t = ts(N); trem = .22 * np.sin(2 * np.pi * 3.4 * t)
    BUS['keys'][:, 0] *= 1 - trem; BUS['keys'][:, 1] *= 1 + trem
    BUS['keys'] = chorus_fx(BUS['keys'], .007, .0018, (.5, .63), .35)
    BUS['guitar'] = chorus_fx(hp(BUS['guitar'], 180), .010, .0032, (.8, 1.13), .6)
    BUS['pad'] = chorus_fx(BUS['pad'], .012, .004, (.25, .33), .5)
    pump = np.ones(N)
    for k in KICKS:
        s = int(k * SR); e = min(N, s + int(.3 * SR)); pump[s:e] = np.minimum(pump[s:e], 1 - .28 * np.exp(-ts(e - s) / .09))
    BUS['pad'] *= pump[:, None]; BUS['keys'] *= (1 - (1 - pump) * .5)[:, None]
    BUS['bass'] = hp(BUS['bass'], 32, 2)
    dl = split_fx(BUS['lead'].mean(1), lambda x: pingpong(x, BEAT * .75, .34, 5))
    BUS['lead'] += dl * .32
    send = sum(SEND.values())
    wet = split_fx(send, lambda x: np.stack([fftconvolve(x, IR_HALL[:, c])[:N] for c in range(2)], 1))
    BUS['fx'] += hp(wet, 200) * .42
    c0, c1 = int(CUT0 * SR), int(CUT1 * SR)
    for k in STEMS:
        x = BUS[k]; x[c0:c1] = 0; BUS[k] = tape_stop(apply_lofi(x), TAPESTOP)
    BUS['drums'] *= .85
    mix = sum(BUS.values()); mix = hp(mix, 28, 2)
    pre = 1.0 / np.abs(mix).max(); mix *= pre
    det = uniform_filter1d(np.abs(mix).max(1), int(.005 * SR))
    g = np.ones(N); lv = env_follow(det, .012, .2); thr = .45
    over = lv > thr; g[over] = (thr * (lv[over] / thr) ** (1 / 2.0)) / lv[over]
    mix *= g[:, None]; mix /= np.abs(mix).max()
    mix = np.tanh(mix * 1.25) / np.tanh(1.25)
    mix[c0:c1] = 0
    sf.write(os.path.join(HERE, 'score.wav'), (mix * .9).astype(np.float32), SR, subtype='FLOAT')
    os.makedirs(os.path.join(HERE, 'stems'), exist_ok=True)
    for k in STEMS: sf.write(os.path.join(HERE, 'stems', k + '.wav'), (BUS[k] * pre * .9).astype(np.float32), SR, subtype='FLOAT')
    json.dump(song_json(), open(os.path.join(HERE, '..', 'song.json'), 'w'), indent=1)
    print('done', round(time.time() - t0, 1), 's')


if __name__ == '__main__':
    main()
