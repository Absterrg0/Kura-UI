"""Fit a constant-tempo beat grid to a track and report per-bar energy.

usage: python -I beatmap.py <audio> <out.json> [bpm_lo bpm_hi]
"""
import json
import subprocess
import sys

import numpy as np

path, out = sys.argv[1], sys.argv[2]
lo, hi = (float(sys.argv[3]), float(sys.argv[4])) if len(sys.argv) > 4 else (100.0, 140.0)
sr = 22050
raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"])
y = np.frombuffer(raw, dtype=np.float32).copy()
n, hop = 1024, 128
win = np.hanning(n)
idx = np.arange(0, len(y) - n, hop)
S = np.abs(np.array([np.fft.rfft(y[i:i + n] * win) for i in idx])).T  # freq x time
f = np.fft.rfftfreq(n, 1 / sr)
t = (idx + n / 2) / sr
logS = np.log1p(10 * S)
flux = np.maximum(0, np.diff(logS, axis=1, prepend=logS[:, :1]))
env = flux.sum(0)
low = flux[f < 150].sum(0)
high = flux[f > 5000].sum(0)
env = env / env.max()
low = low / low.max()


def score(period, phase, e):
    beats = np.arange(phase, t[-1], period)
    return np.interp(beats, t, e).sum() / len(beats)


best = (0, 0, 0)
for bpm in np.arange(lo, hi, 0.02):
    p = 60 / bpm
    for ph in np.arange(0, p, 0.004):
        s = score(p, ph, env)
        if s > best[0]:
            best = (s, p, ph)
_, P, ph = best
# refine
for p in np.arange(P - 0.002, P + 0.002, 0.00002):
    for q in np.arange(ph - 0.01, ph + 0.01, 0.0005):
        s = score(p, q, env)
        if s > best[0]:
            best = (s, p, q)
_, P, ph = best
beats = np.arange(ph, t[-1], P)
# downbeat: which of the 4 phases carries the most low-end attack
bar_scores = [np.interp(beats[k::4], t, low).mean() for k in range(4)]
k0 = int(np.argmax(bar_scores))
downbeats = beats[k0::4]
rms_t = np.array([np.sqrt(np.mean(y[int(a * sr):int((a + 4 * P) * sr)] ** 2) + 1e-12) for a in downbeats])
hi_t = np.array([np.interp(np.arange(a, a + 4 * P, 0.01), t, high).mean() for a in downbeats])
lo_t = np.array([np.interp(np.arange(a, a + 4 * P, 0.01), t, low).mean() for a in downbeats])
res = {
    "file": path.split("/")[-1], "bpm": round(60 / P, 4), "beat": round(P, 6),
    "firstBeat": round(float(ph), 4), "downbeatPhase": k0,
    "beats": [round(float(b), 4) for b in beats],
    "downbeats": [round(float(b), 4) for b in downbeats],
    "bars": [
        {"t": round(float(a), 3), "db": round(float(20 * np.log10(r)), 1), "high": round(float(h), 4), "low": round(float(lw), 4)}
        for a, r, h, lw in zip(downbeats, rms_t, hi_t, lo_t)
    ],
}
# onsets relative to the grid: where within each beat the attacks fall (16ths)
sub = np.arange(ph, t[-1], P / 4)
res["sixteenths"] = [round(float(np.interp(s, t, env)), 3) for s in sub]
json.dump(res, open(out, "w"), indent=1)
print(f"bpm {res['bpm']}  beat {P:.5f}s  first beat {ph:.3f}s  downbeat phase {k0}")
for i, b in enumerate(res["bars"]):
    print(f"bar {i:3d} @ {b['t']:7.3f}s  {b['db']:6.1f} dB  high {b['high']:.4f}  low {b['low']:.4f}")
