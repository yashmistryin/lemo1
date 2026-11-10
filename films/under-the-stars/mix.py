"""Under the Stars: foley from the picture's events + the score -> mastered mix.wav.

Mastering is done here rather than in ffmpeg (this machine has ffmpeg 6, whose loudnorm under-reports length):
ITU-R BS.1770-4 integrated loudness (K-weighting, 400 ms blocks, -70 LUFS absolute and -10 LU relative gates),
gain to -14 LUFS, then a 4x-oversampled look-ahead true-peak limiter to -1.5 dBTP (headroom for the AAC encode).
Run: $LIB/.venv/bin/python mix.py
"""
import os, json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, lfilter, resample_poly
from scipy.ndimage import minimum_filter1d, uniform_filter1d

HERE = os.path.dirname(os.path.abspath(__file__))
SR = 48000
song = json.load(open(os.path.join(HERE, 'song.json')))
ev = json.load(open(os.path.join(HERE, 'events.json')))
EV = ev['ev']
DUR = song['dur']; N = int(round(DUR * SR))
rng = np.random.default_rng(56)
score, sr = sf.read(os.path.join(HERE, 'music', 'score.wav')); assert sr == SR
score = score[:N] if len(score) >= N else np.pad(score, ((0, N - len(score)), (0, 0)))

def ts(n): return np.arange(n) / SR
def noise(n): return rng.standard_normal(n)
def filt(x, kind, f, o=2): return sosfilt(butter(o, f, kind, fs=SR, output='sos'), x)
def env(n, a, r):
    t = ts(n); return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / r)
FX = np.zeros((N, 2)); BED = np.zeros((N, 2))
def put(bus, x, t, gain=1.0, pan=0.0):
    s = int(round(t * SR)); x = x[:max(0, N - s)]
    if s < 0: x = x[-s:]; s = 0
    st = np.stack([x * np.cos((pan + 1) * np.pi / 4), x * np.sin((pan + 1) * np.pi / 4)], 1) * 1.4142 * gain
    bus[s:s + len(st)] += st

# —— sound generators ——
def wind(d, v):
    n = int(d * SR); t = ts(n); x = noise(n)
    mod = .6 + .4 * np.sin(2 * np.pi * .13 * t + 1) * np.sin(2 * np.pi * .31 * t)
    y = filt(filt(x, 'low', 900, 2), 'high', 120, 2) * mod
    fade = np.minimum(1, np.minimum(t / .8, (d - t) / .8)); return y * fade * v
def city(d, v):
    n = int(d * SR); t = ts(n); y = filt(noise(n), 'low', 260, 3) * (.8 + .2 * np.sin(2 * np.pi * .07 * t))
    for k in range(5):   # distant car horns / traffic swells
        c = rng.uniform(0, d - 1.2); i = int(c * SR); m = int(1.1 * SR); f = rng.uniform(300, 520)
        y[i:i + m] += .08 * np.sin(2 * np.pi * f * ts(m)) * np.sin(np.pi * ts(m) / 1.1) ** 2
    return y * np.minimum(1, np.minimum(t / .5, (d - t) / .6)) * v
def whoosh(d, v):
    n = int(d * SR); t = ts(n); u = t / d
    fc = 300 * (12 ** np.sin(np.pi * u)); y = np.zeros(n); x = noise(n)
    for i0 in range(0, n, 480):   # block-wise sweeping band-pass
        f = fc[i0]; seg = x[max(0, i0 - 960):i0 + 480]
        y[i0:i0 + 480] = filt(seg, 'band', [max(60, f * .6), min(16000, f * 1.6)], 2)[-len(y[i0:i0 + 480]):]
    return y * np.sin(np.pi * u) ** 1.5 * v
def sparkle(v):
    n = int(1.6 * SR); y = np.zeros(n)
    for k in range(9):
        f = 2400 * 2 ** (rng.uniform(0, 2)); i = int(k * .07 * SR); m = n - i
        y[i:] += np.sin(2 * np.pi * f * ts(m)) * env(m, .002, .25) * (1 - k / 12)
    return y * .2 * v
def impact():
    n = int(1.4 * SR); t = ts(n)
    body = np.sin(2 * np.pi * (48 + 90 * np.exp(-t / .05)) * t) * env(n, .001, .35)
    crack = filt(noise(n), 'high', 1500, 2) * env(n, .0005, .03)
    return body * .9 + crack * .5
def step(v):
    n = int(.12 * SR); x = filt(noise(n), 'band', [300, 3200], 2) * env(n, .001, .025)
    g = filt(noise(n), 'high', 2500, 2) * (rng.random(n) < .02) * env(n, .001, .06)   # gravel grit
    return (x + g * 2) * v * .7
def scuff():
    n = int(.35 * SR); return filt(noise(n), 'band', [500, 4000], 2) * env(n, .01, .12) * .6
def land():
    n = int(.6 * SR); t = ts(n)
    return np.sin(2 * np.pi * (70 + 60 * np.exp(-t / .03)) * t) * env(n, .001, .12) * .7 + np.pad(step(1.3), (0, n - int(.12 * SR)))
def crton():
    n = int(1.2 * SR); t = ts(n)
    thunk = np.sin(2 * np.pi * 55 * t) * env(n, .001, .08)
    whine = np.sin(2 * np.pi * 7800 * t) * np.minimum(1, t / .05) * np.exp(-t / .6) * .05
    stat = filt(noise(n), 'high', 2000) * env(n, .002, .15) * .3
    return thunk * .8 + whine + stat
def tapeout():
    n = int(.6 * SR); t = ts(n)
    clunk = filt(noise(n), 'band', [150, 1200], 2) * env(n, .001, .05)
    hiss = filt(noise(n), 'high', 3000) * np.minimum(1, t / .05) * .08
    return clunk * .8 + hiss
def birds(d):
    n = int(d * SR); y = np.zeros(n)
    for k in range(7):   # two-note synth chirps, high and quiet
        i = int(rng.uniform(0, d - .4) * SR); m = int(.12 * SR); f = rng.uniform(3200, 4800)
        for j, df in enumerate((1, 1.18)):
            c = np.sin(2 * np.pi * f * df * ts(m) * (1 + .3 * ts(m))) * env(m, .004, .04)
            y[i + j * m:i + (j + 1) * m] += c[:len(y[i + j * m:i + (j + 1) * m])]
    return y * .08

for x in EV:
    t, k, v, d = x['t'], x['type'], x.get('v', 1.0), x.get('d', 1.0)
    if k == 'wind': put(BED, wind(d, v), t, .05)
    elif k == 'city': put(BED, city(d, v), t, .07)
    elif k in ('air', 'highwind'): put(BED, filt(wind(d, v), 'high', 300 if k == 'air' else 600), t, .08 if k == 'air' else .06)
    elif k == 'whoosh': put(FX, whoosh(d, v), t, .16, rng.uniform(-.5, .5))
    elif k == 'sweep': put(FX, whoosh(d, .5) * .5, t, .12, -.3)
    elif k == 'sparkle': put(FX, sparkle(v), t, .5, .3)
    elif k == 'impact': put(FX, impact(), t, .3)
    elif k == 'step': put(FX, step(v), t, .5, .1)
    elif k == 'scuff': put(FX, scuff(), t, .4, .1)
    elif k == 'land': put(FX, land(), t, .4)
    elif k == 'crton': put(FX, crton(), t, .3)
    elif k == 'tapeout': put(FX, tapeout(), t, .5)
    elif k == 'birds': put(BED, birds(d), t, 1.0, .4)
    else: print('unhandled event', k)

# beds sit under the music; keep the silent beat silent except for the wind (the only sound before the leap)
c0, c1 = (int(v * SR) for v in song['cut'])
mix = score + BED + FX

# —— loudness (BS.1770-4) ——
def kweight(x):
    b1, a1 = [1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585]
    b2, a2 = [1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621]
    return lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)
def lufs(x):
    y = kweight(x); blk, hop = int(.4 * SR), int(.1 * SR)
    ms = np.array([np.sum(np.mean(y[i:i + blk] ** 2, axis=0)) for i in range(0, len(y) - blk, hop)])
    L = -0.691 + 10 * np.log10(ms + 1e-12); g = L > -70
    rel = -0.691 + 10 * np.log10(ms[g].mean()) - 10; g &= L > rel
    return -0.691 + 10 * np.log10(ms[g].mean())
def true_peak(x): return np.abs(resample_poly(x, 4, 1, axis=0)).max()
def limit(x, ceil_db=-1.5, look=.003, rel=.08):
    ceil = 10 ** (ceil_db / 20)
    for _ in range(4):
        os_ = np.abs(resample_poly(x, 4, 1, axis=0)).max(1).reshape(-1, 4).max(1)[:len(x)]
        need = np.minimum(1, ceil / np.maximum(os_, 1e-9))
        L = int(look * SR); gmin = minimum_filter1d(need, 2 * L + 1)
        a = np.exp(-1 / (rel * SR)); gsm = np.empty_like(gmin); cur = 1.0
        for i in range(len(gmin)):   # instant attack (already looked ahead), smooth release
            cur = gmin[i] if gmin[i] < cur else gmin[i] + (cur - gmin[i]) * a; gsm[i] = cur
        gsm = uniform_filter1d(gsm, L)
        x = x * gsm[:, None]
        if true_peak(x) <= ceil * 1.001: break
    return x

L0 = lufs(mix); mix *= 10 ** ((-14.0 - L0) / 20)
for _ in range(3):   # limiting lowers loudness a little: re-aim and re-limit
    mix = limit(mix); L1 = lufs(mix)
    if abs(L1 + 14) < .15: break
    mix *= 10 ** ((-14.0 - L1) / 20)
mix = limit(mix)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), mix.astype(np.float32), SR, subtype='FLOAT')
print(f'loudness {L0:.1f} -> {lufs(mix):.2f} LUFS, true peak {20*np.log10(true_peak(mix)):.2f} dBTP, silent beat rms {20*np.log10(np.sqrt(np.mean(mix[c0:c1]**2))+1e-9):.1f} dB')
