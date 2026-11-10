"""Normalise the owner's song to -14 LUFS (BS.1770-4) with a 4x-oversampled true-peak limiter at -1.5 dBTP. Nothing else is changed."""
import os, numpy as np, soundfile as sf
from scipy.signal import lfilter, resample_poly
from scipy.ndimage import minimum_filter1d, uniform_filter1d
HERE = os.path.dirname(os.path.abspath(__file__)); SR = 48000
x, sr = sf.read(os.path.join(HERE, 'audio', 'song.wav')); assert sr == SR
def kw(x):
    return lfilter([1.0, -2.0, 1.0], [1.0, -1.99004745483398, 0.99007225036621], lfilter([1.53512485958697, -2.69169618940638, 1.19839281085285], [1.0, -1.69065929318241, 0.73248077421585], x, axis=0), axis=0)
def lufs(x):
    y = kw(x); b, h = int(.4 * SR), int(.1 * SR)
    ms = np.array([np.sum(np.mean(y[i:i + b] ** 2, 0)) for i in range(0, len(y) - b, h)]); L = -.691 + 10 * np.log10(ms + 1e-12)
    g = L > -70; g &= L > -.691 + 10 * np.log10(ms[g].mean()) - 10; return -.691 + 10 * np.log10(ms[g].mean())
def tp(x): return np.abs(resample_poly(x, 4, 1, axis=0)).max()
def limit(x, c=10 ** (-1.5 / 20)):
    for _ in range(4):
        pk = np.abs(resample_poly(x, 4, 1, axis=0)).max(1).reshape(-1, 4).max(1)[:len(x)]
        need = np.minimum(1, c / np.maximum(pk, 1e-9)); L = int(.003 * SR); gm = minimum_filter1d(need, 2 * L + 1)
        a = np.exp(-1 / (.08 * SR)); out = np.empty_like(gm); cur = 1.0
        for i in range(len(gm)): cur = gm[i] if gm[i] < cur else gm[i] + (cur - gm[i]) * a; out[i] = cur
        x = x * uniform_filter1d(out, L)[:, None]
        if tp(x) <= c * 1.001: break
    return x
L0 = lufs(x); y = x * 10 ** ((-14 - L0) / 20)
for _ in range(3):
    y = limit(y); L1 = lufs(y)
    if abs(L1 + 14) < .15: break
    y *= 10 ** ((-14 - L1) / 20)
y = limit(y); os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out', 'mix.wav'), y.astype(np.float32), SR, subtype='FLOAT')
print(f'song {L0:.1f} LUFS, peak {20*np.log10(tp(x)):.1f} dBTP -> {lufs(y):.2f} LUFS, {20*np.log10(tp(y)):.2f} dBTP')
