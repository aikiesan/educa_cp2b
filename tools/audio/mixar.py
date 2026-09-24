"""Mixagem final: trilha editada + narração posicionada + efeitos sintetizados → mix.wav / mix.m4a.

uso: python tools/audio/mixar.py [--video 02-pilar-2b] [--vo entrada/x.wav] [--musica entrada/y.mp3]
     (padrões de voz e trilha vêm de videos/<episódio>/partitura.json)

Etapas
 1. trilha: cortes "invisíveis" em compassos inteiros (preservam a frase), refinados no ataque do tempo forte,
    com crossfade de potência constante; fade no fim.
 2. narração: 24 kHz → 48 kHz (swr, filtro longo), tempo ×1,035 com Rubber Band (sem mudar o tom),
    cada fala recortada e colocada no seu instante do timeline.json, nivelada fala a fala.
 3. efeitos: sintetizados (sfx.py) nos instantes exportados pela cena (sfx_cues.json), com sala leve.
 4. mix: música abaixa sob a voz (sidechain suave), EQ abre espaço para a fala,
    master com compressão leve + limitador; loudness final −15 LUFS, pico real ≤ −1 dBTP.
"""
import json, subprocess, argparse, tempfile, sys
from pathlib import Path
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy import signal
from pedalboard import Pedalboard, HighpassFilter, LowShelfFilter, PeakFilter, HighShelfFilter, Compressor, Limiter, Reverb, Gain

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sfx as SFXLIB

ROOT = Path(__file__).resolve().parents[2]
VID = ROOT / 'videos' / '01-o-que-e-biogas'
AUD = VID / 'audio'
def set_video(name):
    global VID, AUD
    VID = ROOT / 'videos' / name
    AUD = VID / 'audio'
    AUD.mkdir(parents=True, exist_ok=True)
SR = 48000
FFMPEG = 'ffmpeg'
meter = pyln.Meter(SR)


def run(*a): subprocess.run([FFMPEG, '-hide_banner', '-loglevel', 'error', '-y', *map(str, a)], check=True)


def load(path, mono=False):
    y, sr = sf.read(path, dtype='float32', always_2d=True)
    assert sr == SR, (path, sr)
    return y.mean(1) if mono else y


def lufs(y):
    try: return meter.integrated_loudness(y if y.ndim == 1 else y)
    except Exception: return -70


def gain_to(y, target):
    l = lufs(y)
    return y * (10 ** ((target - l) / 20)) if l > -70 else y


# ---------------- 1. trilha ----------------
def onset_near(y, t, win=0.045):
    """Instante do ataque mais forte perto de t (fluxo espectral em alta resolução)."""
    mono = y.mean(1)
    a, b = int((t - win) * SR), int((t + win) * SR)
    seg = mono[max(0, a - 2048):b + 2048]
    f, tt, Z = signal.stft(seg, SR, nperseg=512, noverlap=512 - 64)
    mag = np.abs(Z)
    flux = np.maximum(0, np.diff(mag, axis=1)).sum(0)
    times = tt[1:] + (max(0, a - 2048)) / SR
    m = (times >= t - win) & (times <= t + win)
    return float(times[m][np.argmax(flux[m])]) if m.any() else t


def build_music(tl, src):
    tmp = AUD / '_musica48.wav'
    run('-i', src, '-af', 'aresample=48000:filter_size=64:phase_shift=10:cutoff=0.975', '-c:a', 'pcm_f32le', tmp)
    y = load(tmp)
    m = tl['musica']
    cortes = m.get('cortes') or ([m['corte']] if m.get('corte') else [])
    xf = int(0.012 * SR)
    w = np.linspace(0, np.pi / 2, xf)[:, None]
    # trechos da trilha original que ficam: [0, a1) [b1, a2) … [bn, fim); emendas com crossfade de potência constante
    starts, ends, shift = [0], [], 0.0
    for c in sorted(cortes, key=lambda c: c['de']):
        a = onset_near(y, c['de']) - 0.004
        b = onset_near(y, c['para']) - 0.004
        ends.append(int(a * SR)); starts.append(int(b * SR))
        d = (b - a) - (c['para'] - c['de'])
        shift += d
        print(f'  trilha: corte {a:.3f}s → {b:.3f}s (desvio da grade {d * 1000:+.1f} ms)')
    ends.append(len(y))
    out = y[starts[0]:ends[0] + (xf if len(ends) > 1 else 0)].copy()
    for k in range(1, len(starts)):
        s0, e0 = starts[k], ends[k]
        out[-xf:] = out[-xf:] * np.cos(w) + y[s0:s0 + xf] * np.sin(w)
        out = np.concatenate([out, y[s0 + xf:e0 + (xf if k < len(starts) - 1 else 0)]])
    dur = tl['duracao']
    n = int(dur * SR)
    out = out[:n] if len(out) >= n else np.pad(out, ((0, n - len(out)), (0, 0)))
    fade = int(1.2 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)[:, None] ** 2
    tmp.unlink()
    return out.astype(np.float32), shift


# ---------------- 2. narração ----------------
def build_vo(tl, src, ali, tempo):
    t48 = AUD / '_vo48.wav'
    tst = AUD / '_vo48_tempo.wav'
    run('-i', src, '-af', 'aresample=48000:filter_size=64:phase_shift=10:cutoff=0.975', '-ac', '1', '-c:a', 'pcm_f32le', t48)
    run('-i', t48, '-af', f'rubberband=tempo={tempo}:pitchq=quality:transients=smooth:formant=preserved', '-c:a', 'pcm_f32le', tst)
    y = load(tst, mono=True)
    n = int(tl['duracao'] * SR)
    out = np.zeros(n, np.float32)
    PRE, POST = 0.07, 0.22
    falas = tl['falas']
    for i, f in enumerate(falas):
        o0, o1 = f['origem']['inicio'] / tempo, f['origem']['fim'] / tempo
        # não invade a fala vizinha no áudio original
        prev_end = falas[i - 1]['origem']['fim'] / tempo if i else 0
        next_start = falas[i + 1]['origem']['inicio'] / tempo if i + 1 < len(falas) else len(y) / SR
        s0 = max(o0 - PRE, (prev_end + o0) / 2)
        s1 = min(o1 + POST, (o1 + next_start) / 2)
        seg = y[int(s0 * SR):int(s1 * SR)].copy()
        fi, fo = int(0.012 * SR), int(0.05 * SR)
        seg[:fi] *= np.linspace(0, 1, fi); seg[-fo:] *= np.linspace(1, 0, fo)
        seg = gain_to(seg, -17.0)   # nivela as duas vozes fala a fala
        at = int((f['inicio'] - (o0 - s0)) * SR)
        out[at:at + len(seg)] += seg[:max(0, n - at)]
    for p in (t48, tst): p.unlink()
    chain = Pedalboard([
        HighpassFilter(75), LowShelfFilter(180, -1.0, 0.7), PeakFilter(320, -1.5, 1.0), PeakFilter(3800, 1.5, 0.9), HighShelfFilter(10000, 1.0, 0.7),
        Compressor(threshold_db=-21, ratio=2.4, attack_ms=6, release_ms=110), Limiter(threshold_db=-2.0, release_ms=60)])
    out = chain(out[None], SR)[0]
    return out.astype(np.float32)


# ---------------- 3. efeitos ----------------
def build_sfx(cues, n):
    bus = np.zeros((n, 2), np.float32)
    for c in cues:
        y = SFXLIB.render(c['nome'], p=c.get('p') or 1.0, dur=c.get('dur'))
        pan = c.get('pan', 0) or 0
        if pan:  # balanço estéreo
            a = (pan + 1) * np.pi / 4
            y = y * np.array([np.cos(a), np.sin(a)], np.float32) * np.sqrt(2)
        y = y * (c.get('ganho', 1) or 1)
        k = int(c['t'] * SR)
        if k >= n: continue
        k0 = max(0, k)
        y = y[k0 - k:]
        m = min(len(y), n - k0)
        bus[k0:k0 + m] += y[:m]
    room = Pedalboard([Reverb(room_size=0.22, damping=0.6, wet_level=0.14, dry_level=0.9, width=0.8), HighpassFilter(60)])
    return room(bus.T, SR).T.astype(np.float32)


def duck_env(vo, depth_db=-7.0, att=0.06, rel=0.38):
    """Envelope de ducking a partir da energia da voz (rápido para abaixar, lento para voltar)."""
    hop = 240
    e = np.sqrt(np.convolve(vo ** 2, np.ones(hop * 4) / (hop * 4), 'same'))[::hop]
    on = (20 * np.log10(e + 1e-9) > -42).astype(float)
    g = np.zeros_like(on)
    ka, kr = np.exp(-hop / (att * SR)), np.exp(-hop / (rel * SR))
    cur = 0.0
    for i, v in enumerate(on):
        k = ka if v > cur else kr
        cur = v + (cur - v) * k
        g[i] = cur
    g = np.repeat(g, hop)[:len(vo)]
    g = np.pad(g, (0, len(vo) - len(g)), constant_values=g[-1] if len(g) else 0)
    return (10 ** (depth_db * g / 20)).astype(np.float32)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--video', default='01-o-que-e-biogas')
    ap.add_argument('--vo', default=None)
    ap.add_argument('--musica', default=None)
    ap.add_argument('--timeline', default=None)
    ap.add_argument('--cues', default=None)
    ap.add_argument('--saida', default=None)
    ap.add_argument('--alvo', type=float, default=-15.0)
    a = ap.parse_args()
    set_video(a.video)
    cfg = json.loads((VID / 'partitura.json').read_text(encoding='utf-8'))
    a.vo = a.vo or str(ROOT / cfg['vo'])
    a.musica = a.musica or str(ROOT / cfg['musica']['arquivo'])
    a.timeline = a.timeline or str(VID / 'timeline.json')
    a.cues = a.cues or str(AUD / 'sfx_cues.json')
    a.saida = a.saida or str(AUD / 'mix')
    tl = json.loads(Path(a.timeline).read_text(encoding='utf-8'))
    cues = json.loads(Path(a.cues).read_text(encoding='utf-8'))
    n = int(tl['duracao'] * SR)
    print('trilha…'); mus, shift = build_music(tl, a.musica)
    print('narração…'); vo = build_vo(tl, a.vo, None, tl.get('tempo_narracao', 1.0))
    print('efeitos…', len(cues)); fx = build_sfx(cues, n)
    # níveis relativos (LUFS de cada barramento antes da soma)
    vo = gain_to(vo, -16.5)
    mus = Pedalboard([PeakFilter(2600, -2.5, 0.9), PeakFilter(1200, -1.0, 1.0)])(mus.T, SR).T
    mus = gain_to(mus, -19.5)
    mus = mus * duck_env(vo)[:, None]
    fx = gain_to(fx, -25.0)
    vo2 = np.stack([vo, vo], -1)
    mix = vo2 + mus + fx
    master = Pedalboard([Compressor(threshold_db=-16, ratio=1.8, attack_ms=25, release_ms=250), Limiter(threshold_db=-1.5, release_ms=80)])
    mix = master(mix.T, SR).T
    mix = gain_to(mix, a.alvo)
    # limitador de pico real (4× sobreamostragem) → ≤ −1 dBTP
    up = signal.resample_poly(mix, 4, 1, axis=0)
    tp = 20 * np.log10(np.max(np.abs(up)) + 1e-9)
    if tp > -1.0:
        mix = Limiter(threshold_db=-1.0 - (tp + 1.0) * 0.1 - 0.3, release_ms=50)(mix.T, SR).T
    print(f'  loudness {lufs(mix):.1f} LUFS | voz {lufs(vo):.1f} | música {lufs(mus):.1f} | efeitos {lufs(fx):.1f}')
    out = Path(a.saida)
    sf.write(str(out) + '.wav', mix.astype(np.float32), SR, subtype='PCM_24')
    for nm, st in (('voz', vo2), ('musica', mus), ('efeitos', fx)):
        sf.write(f'{out}_stem_{nm}.wav', st.astype(np.float32), SR, subtype='PCM_24')
    run('-i', str(out) + '.wav', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', str(out) + '.m4a')
    print('→', str(out) + '.wav', '/', str(out) + '.m4a')


if __name__ == '__main__':
    main()
