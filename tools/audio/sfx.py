"""Biblioteca de efeitos sonoros sintetizados (48 kHz, estéreo) — sem amostras de terceiros.

Cada efeito é uma função (p = variação de altura, dur = duração quando faz sentido) que devolve
um array float32 (n, 2). Os efeitos são "de desenho animado de papel": papel, pops, bolhas, sinos,
molas, máquinas — curtos, com envelopes cuidadosos e filtragem para não soarem "eletrônicos".
"""
import numpy as np
from scipy import signal

SR = 48000
_rng = np.random.default_rng(7)


def t_(d): return np.arange(int(d * SR)) / SR
def noise(d, seed=None):
    r = np.random.default_rng(seed) if seed is not None else _rng
    return r.standard_normal(int(d * SR))
def pink(d, seed=None):
    w = noise(d, seed)
    b, a = [0.049922035, -0.095993537, 0.050612699, -0.004408786], [1, -2.494956002, 2.017265875, -0.522189400]
    return signal.lfilter(b, a, w) * 4
def bp(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, min(hi, SR / 2 - 100)], 'bandpass', fs=SR, output='sos'), x)
def lp(x, f, order=2): return signal.sosfilt(signal.butter(order, min(f, SR / 2 - 100), 'lowpass', fs=SR, output='sos'), x)
def hp(x, f, order=2): return signal.sosfilt(signal.butter(order, f, 'highpass', fs=SR, output='sos'), x)
def env(n, a=0.005, d=0.1, curve=4.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) * curve / max(d, 1e-4))
    return e
def adsr(n, a, s_level, r):
    t = np.arange(n) / SR; T = n / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.where(t > T - r, np.maximum(0, (T - t) / max(r, 1e-4)), 1) * s_level
    return e
def sine_sweep(d, f0, f1, curve='exp'):
    t = t_(d)
    f = f0 * (f1 / f0) ** (t / d) if curve == 'exp' else f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def osc(freq_arr, kind='sine'):
    ph = 2 * np.pi * np.cumsum(freq_arr) / SR
    if kind == 'sine': return np.sin(ph)
    if kind == 'saw': return signal.sawtooth(ph)
    if kind == 'square': return signal.square(ph)
    if kind == 'tri': return signal.sawtooth(ph, 0.5)
def fm_bell(d, f, ratio=1.4, index=2.2, decay=1.2):
    t = t_(d)
    mod = np.sin(2 * np.pi * f * ratio * t) * index * np.exp(-t * 3 / decay)
    return np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 4 / decay)
def st(x, pan=0.0, width=0.0):
    """mono → estéreo (pan −1..1, lei de potência constante); width adiciona decorrelação leve."""
    a = (pan + 1) * np.pi / 4
    L, R = x * np.cos(a), x * np.sin(a)
    if width > 0:
        k = int(0.011 * SR)
        R = np.concatenate([np.zeros(k), R])[:len(x)] * (1 - width) + R * width
    return np.stack([L, R], -1).astype(np.float32)
def pad(x, d): return np.concatenate([x, np.zeros(int(d * SR))])
def norm(x, peak=0.9):
    m = np.max(np.abs(x)) + 1e-9
    return x / m * peak


# ---------------- papel ----------------
def papel_desliza(p=1.0, dur=None, **_):
    d = 0.32 / p
    x = pink(d) * 0.6 + noise(d) * 0.4
    crink = np.convolve(np.abs(noise(d)) ** 3, np.ones(60) / 60, 'same')
    x = x * (0.35 + crink / (crink.max() + 1e-9))
    lo = np.linspace(1400, 2600, len(x)) * p
    y = np.zeros_like(x)
    for k in range(0, len(x), 1024):
        y[k:k + 1024] = bp(x[k:k + 1024], lo[k] * 0.6, lo[k] * 2.6)
    e = np.sin(np.pi * np.clip(np.arange(len(x)) / len(x), 0, 1)) ** 1.5
    return st(norm(y * e, 0.55), 0, 0.3)

def papel_pousa(p=1.0, **_):
    d = 0.16
    t = t_(d)
    thump = np.sin(2 * np.pi * np.cumsum(np.linspace(170 * p, 85 * p, len(t))) / SR) * env(len(t), 0.002, 0.05, 5)
    click = hp(noise(d), 3000) * env(len(t), 0.0005, 0.006, 6) * 0.5
    rustle = bp(noise(d), 1500, 7000) * env(len(t), 0.002, 0.035, 5) * 0.35
    return st(norm(thump * 0.8 + click + rustle, 0.7), 0, 0.2)

def palha(p=1.0, **_):
    d = 0.5
    x = noise(d)
    spikes = (np.abs(noise(d)) > 2.6).astype(float) * noise(d)
    y = bp(x * 0.2 + spikes, 1800, 9000) * adsr(len(x), 0.03, 1, 0.25)
    return st(norm(y, 0.45), 0, 0.5)

def rabisco(dur=1.0, p=1.0, **_):
    d = max(0.2, dur)
    t = t_(d)
    strokes = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * (7 + 3 * np.sin(2 * np.pi * 0.7 * t)) * t)) * np.abs(np.sin(2 * np.pi * 9 * t))
    grain = bp(noise(d), 2500, 9000) + 0.4 * bp(noise(d), 800, 2500)
    y = grain * strokes * adsr(len(t), 0.03, 1, 0.08)
    return st(norm(y, 0.3), 0.05, 0.2)

def letra(p=1.0, **_):
    d = 0.12
    t = t_(d)
    tock = (np.sin(2 * np.pi * 880 * p * t) + 0.5 * np.sin(2 * np.pi * 1760 * p * t)) * env(len(t), 0.0008, 0.025, 5)
    tap = papel_pousa(p * 1.3)[:len(t), 0]
    tap = np.pad(tap, (0, len(t) - len(tap)))
    return st(norm(tock * 0.5 + tap * 0.8, 0.6))

def fatia(p=1.0, **_):
    sw = papel_desliza(1.6 * p)[:, 0]
    tap = papel_pousa(0.9 * p)[:, 0]
    y = np.concatenate([sw[:int(0.14 * SR)], np.zeros(int(0.02 * SR))])
    y = np.pad(y, (0, len(tap)))
    y[-len(tap):] += tap
    return st(norm(y, 0.6))

# ---------------- pops, bolhas, molas ----------------
def pop(p=1.0, **_):
    d = 0.09
    x = sine_sweep(d, 380 * p, 1300 * p) * env(int(d * SR), 0.001, 0.03, 5)
    x += hp(noise(d), 2000) * env(int(d * SR), 0.0003, 0.004, 6) * 0.3
    return st(norm(x, 0.6))

def bloop(p=1.0, d=0.07):
    x = sine_sweep(d, 250 * p, 820 * p) * env(int(d * SR), 0.002, d * 0.6, 4)
    return x

def bolhas(dur=2.0, p=1.0, **_):
    n = int(dur * SR)
    y = np.zeros(n + SR // 4)
    r = np.random.default_rng(11)
    t = 0.0
    while t < dur:
        k = int(t * SR)
        b = bloop(p * r.uniform(0.7, 1.6), r.uniform(0.04, 0.09)) * r.uniform(0.3, 1.0)
        y[k:k + len(b)] += b
        t += r.exponential(1 / 11)
    amb = lp(noise(len(y) / SR), 500) * 0.05
    y = (y + amb) * np.pad(adsr(n, 0.1, 1, 0.5), (0, len(y) - n))
    return st(norm(y, 0.5), 0, 0.4)

def plop(p=1.0, **_):
    d = 0.25
    t = t_(d)
    body = sine_sweep(d, 320 * p, 110 * p) * env(len(t), 0.003, 0.09, 4)
    squelch = lp(noise(d), 900) * (0.5 + 0.5 * np.sin(2 * np.pi * 38 * t)) * env(len(t), 0.004, 0.06, 5) * 0.6
    return st(norm(body + squelch, 0.7))

def boing(p=1.0, **_):
    d = 0.6
    t = t_(d)
    f = 180 * p * (1 + 0.55 * np.exp(-t / 0.18) * np.sin(2 * np.pi * 11 * t)) * (1 + 0.4 * t)
    x = osc(f) + 0.3 * osc(f * 2.01)
    x *= env(len(t), 0.003, 0.35, 3)
    return st(norm(x, 0.5))

def balao(p=1.0, **_):
    d = 0.55
    t = t_(d)
    f = (320 + 260 * (t / d)) * p * (1 + 0.04 * np.sin(2 * np.pi * 23 * t) + 0.03 * noise(d, 3)[:len(t)] * 0.2)
    x = osc(f, 'saw')
    x = bp(x, 400, 3000) * adsr(len(t), 0.03, 1, 0.1)
    x += bp(noise(d), 800, 4000) * 0.08 * adsr(len(t), 0.02, 1, 0.1)
    return st(norm(x, 0.35))

def broto(p=1.0, **_):
    d = 0.3
    x = bloop(p * 1.1, 0.06)
    # "pluck" Karplus-Strong curto
    f = 330 * p * 2
    N = int(SR / f)
    buf = np.random.default_rng(5).uniform(-1, 1, N)
    out = np.zeros(int(d * SR))
    for i in range(len(out)):
        out[i] = buf[i % N]
        buf[i % N] = 0.5 * (buf[i % N] + buf[(i + 1) % N]) * 0.994
    y = np.pad(x, (0, len(out) - len(x))) * 0.7 + out * 0.5 * env(len(out), 0.001, 0.2, 3)
    return st(norm(y, 0.5))

# ---------------- ar, vento, câmera ----------------
def whoosh(dur=0.9, p=1.0, **_):
    d = max(0.25, dur)
    x = pink(d, 21)
    n = len(x)
    ph = np.linspace(0, 1, n)
    center = (500 + 2200 * np.sin(np.pi * ph) ** 1.5) * p
    y = np.zeros(n)
    blk = 512
    for k in range(0, n, blk):
        c = center[k]
        y[k:k + blk] = bp(x[k:k + blk], c * 0.5, c * 2.0, 1)
    e = np.sin(np.pi * ph) ** 2
    y = lp(y * e, 7000)
    pan = np.linspace(-0.7, 0.7, n)
    L, R = y * np.cos((pan + 1) * np.pi / 4), y * np.sin((pan + 1) * np.pi / 4)
    return norm(np.stack([L, R], -1), 0.55).astype(np.float32)

def whoosh_curto(p=1.0, **_): return whoosh(0.35, 1.5 * p)

def fumaca(p=1.0, **_):
    d = 0.35
    x = lp(noise(d), 1200 * p) * env(int(d * SR), 0.01, 0.12, 3)
    return st(norm(x, 0.45), 0, 0.3)

def gas_fluxo(dur=1.2, p=1.0, **_):
    d = dur
    x = bp(pink(d), 300, 2500) * adsr(int(d * SR), 0.15, 1, 0.4)
    x *= 0.8 + 0.2 * np.sin(2 * np.pi * 3 * t_(d))
    return st(norm(x, 0.4), 0, 0.5)

def spray(dur=1.5, p=1.0, **_):
    d = dur
    t = t_(d)
    puls = 0.35 + 0.65 * (np.sin(2 * np.pi * 5.5 * t) > 0.2)
    puls = np.convolve(puls, np.ones(400) / 400, 'same')
    x = hp(noise(d), 3500) * puls * adsr(len(t), 0.05, 1, 0.2)
    return st(norm(x, 0.3), 0, 0.5)

def ciclo(dur=2.4, p=1.0, **_):
    w = whoosh(dur, 0.7)
    n = len(w)
    y = np.zeros((n, 2), np.float32)
    y += w * 0.8
    notes = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98]
    for i, f in enumerate(notes):
        k = int((0.25 + i * 0.16) * SR)
        b = fm_bell(1.2, f, 2.0, 1.2, 1.0) * 0.35
        m = min(len(b), n - k)
        if m > 0:
            pan = -0.6 + i * 0.24
            y[k:k + m] += st(b[:m], pan)
    return norm(y, 0.6)

# ---------------- metal, sinos, brilhos ----------------
def cadeado(p=1.0, **_):
    d = 0.3
    t = t_(d)
    y = np.zeros(len(t))
    for k0 in (0.0, 0.07):
        k = int(k0 * SR)
        m = len(t) - k
        ring = sum(np.sin(2 * np.pi * f * p * t[:m]) * a for f, a in [(2100, 1), (3380, 0.6), (5200, 0.35)])
        y[k:] += (hp(noise(m / SR), 3000) * env(m, 0.0003, 0.004, 6) + ring * env(m, 0.0005, 0.06, 5) * 0.3)
    return st(norm(y, 0.5))

def plim(p=1.0, **_):
    d = 0.35
    t = t_(d)
    y = sum(np.sin(2 * np.pi * f * p * t) * a * np.exp(-t * dcy) for f, a, dcy in [(1800, 1, 14), (2950, 0.5, 18), (4600, 0.25, 25)])
    y += hp(noise(d), 4000) * env(len(t), 0.0003, 0.003, 6) * 0.4
    return st(norm(y, 0.45))

def janela(p=1.0, **_):
    d = 0.4
    y = fm_bell(d, 2200 * p, 1.5, 0.8, 0.35) + 0.4 * fm_bell(d, 1100 * p, 2.0, 0.5, 0.3)
    return st(norm(y, 0.35))

def brilho(p=1.0, **_):
    n = int(1.4 * SR)
    y = np.zeros((n, 2), np.float32)
    notes = [1046.5, 1318.5, 1567.98, 2093.0, 2637.0, 3136.0, 4186.0]
    for i, f in enumerate(notes):
        k = int(i * 0.055 * SR)
        b = fm_bell(0.9, f * p, 1.0, 0.6, 0.6) * (0.7 - i * 0.05)
        m = min(len(b), n - k)
        y[k:k + m] += st(b[:m], -0.5 + i * 0.16)
    sh = hp(noise(1.4), 6000) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 13 * t_(1.4)))) * adsr(n, 0.05, 1, 0.9) * 0.08
    y += st(sh, 0, 0.6)
    return norm(y, 0.55)

def estrela(p=1.0, **_):
    n = int(1.8 * SR)
    y = np.zeros((n, 2), np.float32)
    for k0, f, pan in [(0, 2093.0, -0.3), (0.09, 3136.0, 0.3), (0.18, 2637.0, 0)]:
        k = int(k0 * SR)
        b = fm_bell(1.6, f * p, 2.0, 1.0, 1.4) * 0.6
        y[k:k + len(b)] += st(b[:n - k], pan)
    return norm(y, 0.5)

def lupa(p=1.0, **_):
    w = whoosh(0.4, 1.8)
    b = st(fm_bell(1.0, 1568 * p, 1.5, 1.2, 0.8) * 0.5, 0.3)
    y = np.zeros((len(b) + int(0.2 * SR), 2), np.float32)
    y[:len(w)] += w * 0.6
    k = int(0.25 * SR)
    y[k:k + len(b)] += b[:len(y) - k]
    return norm(y, 0.5)

def lampada(p=1.0, **_):
    n = int(1.4 * SR)
    ding = fm_bell(1.4, 1318.5 * p, 1.0, 1.4, 1.1)
    t = t_(1.4)
    hum = (np.sin(2 * np.pi * 100 * t) + 0.5 * np.sin(2 * np.pi * 200 * t) + 0.25 * np.sin(2 * np.pi * 300 * t)) * adsr(n, 0.02, 1, 0.6) * 0.08
    return st(norm(ding * 0.8 + hum, 0.5), 0, 0.2)

def logo(p=1.0, **_):
    n = int(2.2 * SR)
    y = np.zeros((n, 2), np.float32)
    for f, pan, k0 in [(523.25, -0.3, 0), (659.25, 0.3, 0.03), (783.99, 0, 0.06), (1046.5, 0, 0.09)]:
        k = int(k0 * SR)
        b = fm_bell(2.0, f * p, 2.0, 0.8, 1.8) * 0.4
        y[k:k + len(b)] += st(b[:n - k], pan)
    boom = lp(noise(0.6), 200) * env(int(0.6 * SR), 0.01, 0.25, 3) * 0.6
    y[:len(boom)] += st(boom, 0)
    sh = hp(noise(2.2), 7000) * adsr(n, 0.2, 1, 1.4) * 0.05
    y += st(sh, 0, 0.7)
    return norm(y, 0.5)

# ---------------- carimbo, festa, mastigar, fedor ----------------
def carimbo(p=1.0, **_):
    d = 0.3
    t = t_(d)
    thud = np.sin(2 * np.pi * np.cumsum(np.linspace(120, 60, len(t))) / SR) * env(len(t), 0.001, 0.09, 4)
    knock = bp(noise(d), 500, 1600) * env(len(t), 0.0005, 0.03, 5) * 0.8
    slap = hp(noise(d), 2500) * env(len(t), 0.0003, 0.008, 6) * 0.4
    return st(norm(thud + knock + slap, 0.8))

def festa(p=1.0, **_):
    n = int(1.2 * SR)
    y = np.zeros(n)
    crack = hp(noise(0.02), 1500) * env(int(0.02 * SR), 0.0002, 0.006, 6)
    y[:len(crack)] += crack * 1.0
    air = bp(noise(0.2), 900, 5000) * env(int(0.2 * SR), 0.002, 0.08, 4) * 0.5
    y[:len(air)] += air
    # chuva de confete (papelzinho)
    r = np.random.default_rng(3)
    for i in range(40):
        k = int(r.uniform(0.05, 1.0) * SR)
        c = bp(noise(0.012), 3000, 9000) * env(int(0.012 * SR), 0.0005, 0.004, 5) * r.uniform(0.05, 0.2)
        y[k:k + len(c)] += c[:n - k]
    # língua de sogra (buzina de festa)
    d = 0.42
    t = t_(d)
    f = (520 + 120 * np.minimum(1, t / 0.08)) * p * (1 + 0.01 * np.sin(2 * np.pi * 7 * t))
    horn = bp(osc(f, 'saw'), 700, 3200) * adsr(len(t), 0.02, 1, 0.08) * 0.35
    k = int(0.06 * SR)
    y[k:k + len(horn)] += horn
    return st(norm(y, 0.6), 0, 0.4)

def nhac(p=1.0, **_):
    n = int(0.25 * SR)
    y = np.zeros(n)
    r = np.random.default_rng(int(p * 100))
    for k0 in (0.0, 0.09):
        k = int(k0 * SR)
        d = 0.05
        c = bp(noise(d), 1500 * p, 6000) * ((np.abs(noise(d)) > 1.2) * 1.0 + 0.3) * env(int(d * SR), 0.001, 0.02, 4)
        jaw = np.sin(2 * np.pi * 110 * p * t_(d)) * env(int(d * SR), 0.001, 0.02, 5) * 0.4
        y[k:k + len(c)] += c + jaw
    return st(norm(y, 0.5))

def fedido(p=1.0, **_):
    d = 0.55
    t = t_(d)
    f = (230 - 90 * (t / d)) * p
    x = osc(f, 'saw') * (0.6 + 0.4 * np.sin(2 * np.pi * 26 * t))
    x = bp(x, 250, 1800) * adsr(len(t), 0.02, 1, 0.12)
    return st(norm(x, 0.45))

def mosca(dur=2.0, p=1.0, **_):
    d = dur
    t = t_(d)
    f = 205 * p * (1 + 0.08 * np.sin(2 * np.pi * 1.3 * t) + 0.05 * np.sin(2 * np.pi * 3.7 * t))
    x = osc(f, 'saw') * (0.7 + 0.3 * np.sin(2 * np.pi * 31 * t))
    x = bp(x, 180, 2600)
    amp = 0.55 + 0.45 * np.sin(2 * np.pi * 0.9 * t)
    x *= amp * adsr(len(t), 0.1, 1, 0.3)
    pan = 0.6 * np.sin(2 * np.pi * 0.45 * t)
    L, R = x * np.cos((pan + 1) * np.pi / 4), x * np.sin((pan + 1) * np.pi / 4)
    return norm(np.stack([L, R], -1), 0.3).astype(np.float32)

# ---------------- fogo, eletricidade, máquina, veículos ----------------
def fogo(p=1.0, **_):
    n = int(0.9 * SR)
    y = np.zeros(n)
    for k0 in (0.0, 0.11):   # tic-tic do acendedor
        k = int(k0 * SR)
        c = hp(noise(0.006), 2500) * env(int(0.006 * SR), 0.0002, 0.002, 6) * 0.6
        y[k:k + len(c)] += c
    k = int(0.2 * SR)
    d = 0.6
    x = noise(d)
    cut = np.linspace(300, 3500, int(0.1 * SR))
    xx = np.zeros(int(d * SR))
    for i in range(0, len(xx), 480):
        c = cut[min(i, len(cut) - 1)]
        xx[i:i + 480] = lp(x[i:i + 480], c)
    boom = np.sin(2 * np.pi * np.cumsum(np.linspace(90, 55, len(xx))) / SR) * 0.6
    body = (xx + boom) * env(len(xx), 0.02, 0.25, 3)
    y[k:k + len(body)] += body[:n - k]
    return st(norm(y, 0.7), 0, 0.3)

def chiado(dur=2.5, p=1.0, **_):
    d = dur
    t = t_(d)
    x = bp(pink(d), 250, 1800) * (0.85 + 0.15 * np.sin(2 * np.pi * 6.3 * t) * np.sin(2 * np.pi * 1.1 * t))
    return st(norm(x * adsr(len(t), 0.25, 1, 0.5), 0.25), 0, 0.5)

def zap(p=1.0, **_):
    d = 0.3
    t = t_(d)
    f = 120 * (1 + 0.3 * noise(d, 9)[:len(t)] * 0.1)
    x = osc(f, 'saw') * (np.abs(noise(d)) > 1.0)
    x = hp(x, 400) + hp(noise(d), 5000) * (np.abs(noise(d)) > 2.2) * 0.5
    return st(norm(x * adsr(len(t), 0.005, 1, 0.08), 0.4))

def maquina(dur=5.0, p=1.0, **_):
    d = dur
    n = int(d * SR)
    t = t_(d)
    hum = lp(osc(55 * (1 + 0.01 * np.sin(2 * np.pi * 0.5 * t)), 'saw'), 400) * 0.25
    y = hum.copy()
    r = np.random.default_rng(8)
    k = 0.0
    while k < d:   # tiques de engrenagem
        i = int(k * SR)
        c = plim(r.uniform(1.4, 2.2))[:, 0] * 0.12
        y[i:i + len(c)] += c[:n - i]
        k += 0.125
    beat = 60 / 105.013
    k = 0.0
    while k < d:   # "clanc" na batida
        i = int(k * SR)
        c = carimbo(0.8)[:, 0] * 0.35
        y[i:i + len(c)] += c[:n - i]
        k += beat
    y *= adsr(n, 0.2, 1, 0.5)
    return st(norm(y, 0.45), 0, 0.3)

def motor(dur=1.0, p=1.0, **_):
    d = dur
    t = t_(d)
    f = (38 + 30 * (t / d)) * p
    x = lp(osc(f, 'saw') + 0.5 * osc(f * 2, 'square') * 0.3, 900)
    road = lp(noise(d), 600) * 0.3
    y = (x + road) * adsr(len(t), 0.15, 1, 0.3)
    return st(norm(y, 0.45), 0, 0.3)

def buzina(p=1.0, **_):
    n = int(0.45 * SR)
    y = np.zeros(n)
    for k0 in (0.0, 0.2):
        k = int(k0 * SR)
        d = 0.13
        t = t_(d)
        h = osc(np.full(len(t), 330 * p), 'saw') + osc(np.full(len(t), 415 * p), 'saw')
        h = bp(h, 350, 2600) * adsr(len(t), 0.008, 1, 0.03)
        y[k:k + len(h)] += h
    return st(norm(y, 0.45))

def trator(dur=3.0, p=1.0, **_):
    d = dur
    n = int(d * SR)
    y = np.zeros(n)
    k = 0.0
    while k < d:
        i = int(k * SR)
        pd = 0.06
        th = lp(noise(pd), 300) * env(int(pd * SR), 0.003, 0.035, 4) + np.sin(2 * np.pi * 70 * t_(pd)) * env(int(pd * SR), 0.002, 0.03, 4) * 0.6
        y[i:i + len(th)] += th[:n - i]
        k += 1 / 8.5
    y += lp(noise(d), 200) * 0.1
    y *= adsr(n, 0.3, 1, 0.6)
    return st(norm(y, 0.5), 0, 0.3)


# ---------------- ep. 02: mouse, alfinete, papelada, notebook, preenchimento ----------------
def clique(p=1.0, **_):
    """Clique de mouse de papel: dois estalos curtos (aperta / solta)."""
    n = int(0.16 * SR)
    y = np.zeros(n)
    for k0, f, a in [(0.0, 3400, 1.0), (0.055, 2600, 0.6)]:
        k = int(k0 * SR); m = int(0.03 * SR)
        tk = hp(noise(0.03), 1800) * env(m, 0.0002, 0.004, 7) + np.sin(2 * np.pi * f * p * t_(0.03)) * env(m, 0.0003, 0.006, 6) * 0.4
        y[k:k + m] += tk * a
    return st(norm(y, 0.6))

def alfinete(p=1.0, **_):
    """Alfinete espetado no mapa: 'tic' agudo + corpinho de papel batendo."""
    d = 0.22
    t = t_(d)
    tic = np.sin(2 * np.pi * 2400 * p * t) * np.exp(-t * 60) * 0.6 + hp(noise(d), 5000) * env(len(t), 0.0002, 0.003, 7) * 0.5
    body = papel_pousa(1.4 * p)[:, 0]
    y = np.zeros(len(t) + len(body))
    y[:len(t)] += tic
    k = int(0.012 * SR); y[k:k + len(body)] += body * 0.7
    return st(norm(y, 0.55))

def papelada(dur=1.5, p=1.0, **_):
    """Chuva de pedacinhos de papel pousando (muitos toques curtos, densidade em arco)."""
    d = max(0.3, dur)
    n = int(d * SR)
    y = np.zeros(n + int(0.2 * SR))
    rs = np.random.default_rng(int(d * 1000) + int(p * 97))
    tt = 0.0
    while tt < d:
        dens = 0.25 + 0.75 * np.sin(np.pi * tt / d)
        k = int(tt * SR)
        m = int(0.02 * SR)
        f0 = rs.uniform(1600, 5200) * p
        tap = bp(rs.standard_normal(m), f0 * 0.5, min(f0 * 1.8, SR / 2 - 200)) * env(m, 0.0003, 0.006, 6) * rs.uniform(0.3, 1.0)
        y[k:k + m] += tap
        tt += rs.exponential(1 / (70 * dens))
    y[:n] *= adsr(n, 0.05, 1, 0.3)
    return st(norm(y, 0.4), 0, 0.6)

def abre(p=1.0, **_):
    """Tampa do notebook abrindo: dobradiça de papelão + 'tóin' suave de ligar."""
    d = 0.9
    t = t_(d)
    hinge = bp(noise(d), 600, 2400) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 18 * t))) * adsr(len(t), 0.05, 1, 0.3) * np.exp(-t * 3) * 0.5
    y = hinge.copy()
    ch = fm_bell(0.8, 784 * p, 2.0, 0.6, 0.9) * 0.35 + fm_bell(0.8, 1175 * p, 2.0, 0.4, 0.9) * 0.25
    k = int(0.35 * SR); m = min(len(ch), len(y) - k)
    y[k:k + m] += ch[:m]
    return st(norm(y, 0.5), 0, 0.3)

def preenche(dur=2.0, p=1.0, **_):
    """Brilho ascendente sob o mapa se pintando (arpejo suave em escala maior)."""
    d = max(0.5, dur)
    n = int(d * SR)
    y = np.zeros((n + int(0.9 * SR), 2), np.float32)
    notas = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.5, 1567.98]
    for i, f in enumerate(notas):
        k = int(i / len(notas) * d * SR)
        b = fm_bell(0.8, f * p, 1.0, 0.5, 0.7) * (0.35 + 0.04 * i)
        m = min(len(b), len(y) - k)
        y[k:k + m] += st(b[:m], -0.6 + i * 0.15)
    return norm(y, 0.4)


LIB = {k: v for k, v in globals().items() if callable(v) and not k.startswith('_') and k not in {
    't_', 'noise', 'pink', 'bp', 'lp', 'hp', 'env', 'adsr', 'sine_sweep', 'osc', 'fm_bell', 'st', 'pad', 'norm', 'bloop'} and v.__module__ == __name__}


def render(name, p=1.0, dur=None):
    f = LIB[name]
    kw = {'p': p if p else 1.0}
    if dur: kw['dur'] = dur
    y = f(**kw)
    if y.ndim == 1: y = st(y)
    return y.astype(np.float32)
