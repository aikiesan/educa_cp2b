"""Gráfico de QA da mixagem: loudness de curto prazo (3 s) do mix e de cada barramento, falas e batida do logo.

uso: python tools/audio/grafico_mix.py --video 02-pilar-2b [--saida tmp/mix.png]
"""
import argparse, json
from pathlib import Path
import numpy as np
import soundfile as sf
import pyloudnorm as pyln
from scipy import signal
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[2]


def curto(y, sr, win=3.0, hop=0.1):
    m = pyln.Meter(sr, block_size=0.4)
    out, ts = [], []
    n, h = int(win * sr), int(hop * sr)
    for i in range(0, max(1, len(y) - n), h):
        seg = y[i:i + n]
        try: v = m.integrated_loudness(seg)
        except Exception: v = -70
        out.append(max(-60, v)); ts.append((i + n / 2) / sr)
    return np.array(ts), np.array(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--video', default='02-pilar-2b')
    ap.add_argument('--saida', default=None)
    a = ap.parse_args()
    vid = ROOT / 'videos' / a.video
    aud = vid / 'audio'
    tl = json.loads((vid / 'timeline.json').read_text(encoding='utf-8'))
    mix, sr = sf.read(aud / 'mix.wav', dtype='float32')
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(16, 7), sharex=True, gridspec_kw={'height_ratios': [2, 1]})
    for nm, col in (('voz', '#1e3e4c'), ('musica', '#5ca032'), ('efeitos', '#d37402')):
        y, _ = sf.read(aud / f'mix_stem_{nm}.wav', dtype='float32')
        t, l = curto(y, sr); ax1.plot(t, l, color=col, lw=1.2, label=nm)
    t, l = curto(mix, sr); ax1.plot(t, l, color='k', lw=2, label='mix (3 s)')
    integ = pyln.Meter(sr).integrated_loudness(mix)
    tp = 20 * np.log10(np.max(np.abs(signal.resample_poly(mix, 4, 1, axis=0))) + 1e-9)
    ax1.axhline(-15, color='k', ls=':', lw=1)
    for f in tl['falas']:
        ax1.axvspan(f['inicio'], f['fim'], color='#b6e03b', alpha=0.18)
        ax1.text(f['inicio'], -8.5, f['id'], fontsize=8)
    ax1.axvline(tl['musica']['logo'], color='#e4572e', lw=1.5); ax1.text(tl['musica']['logo'] + 0.2, -12, 'logo', color='#e4572e')
    ax1.set_ylim(-45, -6); ax1.set_ylabel('LUFS (curto prazo)'); ax1.legend(loc='lower left', ncol=4)
    ax1.set_title(f'{a.video} · integrado {integ:.1f} LUFS · pico real {tp:.1f} dBTP · {len(mix) / sr:.2f} s')
    m = mix.mean(1); tt = np.arange(len(m)) / sr
    ax2.plot(tt[::40], m[::40], color='#1e3e4c', lw=0.4); ax2.set_ylim(-1, 1); ax2.set_xlabel('s')
    for b in np.arange(tl['musica']['downbeat0'], tl['duracao'], tl['musica']['compasso']): ax2.axvline(b, color='#999', lw=0.4)
    fig.tight_layout()
    out = a.saida or str(ROOT / 'tmp' / f'mix_{a.video}.png')
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out, dpi=90)
    print(out, f'integrado {integ:.2f} LUFS, pico real {tp:.2f} dBTP')


if __name__ == '__main__':
    main()
