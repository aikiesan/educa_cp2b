"""Análise da trilha: grade de tempos (beats), compassos (downbeats) e pontos de corte "invisíveis"
(compassos musicalmente parecidos, bons para pular trechos sem que se perceba).

uso: python analisar_musica.py <musica> [--json saida.json]
"""
import sys, json, argparse
import numpy as np
import librosa


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('audio')
    ap.add_argument('--json', default=None)
    a = ap.parse_args()
    y, sr = librosa.load(a.audio, sr=22050, mono=True)
    dur = len(y) / sr
    hop = 256
    oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop, aggregate=np.median)
    tempo, beats = librosa.beat.beat_track(onset_envelope=oenv, sr=sr, hop_length=hop, tightness=400, units='frames')
    bt = librosa.frames_to_time(beats, sr=sr, hop_length=hop)
    # regressão linear da grade (tempo constante) → beats "ideais"
    k = np.arange(len(bt))
    A = np.vstack([k, np.ones_like(k)]).T
    period, t0 = np.linalg.lstsq(A, bt, rcond=None)[0]
    resid = bt - (t0 + period * k)
    print(f'duração {dur:.2f}s  bpm {60 / period:.3f}  período {period:.4f}s  1º beat {t0:.3f}s  resíduo máx {np.abs(resid).max() * 1000:.0f} ms')
    # energia de graves por beat (bumbo) e mudança harmônica por beat → fase do compasso
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    low = S[(freqs > 30) & (freqs < 150)].sum(0)
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop)
    ideal = t0 + period * np.arange(int((dur - t0) / period) + 1)
    fr = librosa.time_to_frames(ideal, sr=sr, hop_length=hop)
    fr = fr[fr < S.shape[1] - 2]
    lowb = np.array([low[f:f + 6].max() for f in fr])
    chb = librosa.util.sync(chroma, fr, aggregate=np.median)
    chg = np.r_[0, np.linalg.norm(np.diff(chb, axis=1), axis=0)][:len(fr)]
    oens = np.array([oenv[f:f + 4].max() for f in fr])
    scores = []
    for p in range(4):
        idx = np.arange(p, len(fr), 4)
        scores.append(lowb[idx].mean() / lowb.mean() + chg[idx].mean() / (chg.mean() + 1e-9) + 0.5 * oens[idx].mean() / oens.mean())
    phase = int(np.argmax(scores))
    down = ideal[phase::4]
    print('fase do compasso', phase, 'scores', np.round(scores, 3))
    print('downbeats:', ' '.join(f'{d:.2f}' for d in down))
    # similaridade por compasso (MFCC + chroma) → saltos candidatos
    mf = librosa.feature.mfcc(y=y, sr=sr, hop_length=hop, n_mfcc=20)
    bar_fr = librosa.time_to_frames(down, sr=sr, hop_length=hop)
    feats = []
    for i in range(len(bar_fr) - 1):
        s, e = bar_fr[i], bar_fr[i + 1]
        f = np.r_[mf[:, s:e].mean(1) / 30, chroma[:, s:e].mean(1) * 2, np.log1p(S[:, s:e].mean()) * np.ones(1)]
        feats.append(f)
    F = np.array(feats)
    F = (F - F.mean(0)) / (F.std(0) + 1e-9)
    D = np.linalg.norm(F[:, None] - F[None], axis=-1)
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    bar_rms = [float(rms[bar_fr[i]:bar_fr[i + 1]].mean()) for i in range(len(bar_fr) - 1)]
    print('\nenergia por compasso:')
    for i, r in enumerate(bar_rms):
        print(f'  c{i:02d} {down[i]:6.2f}s  {"#" * int(50 * r / max(bar_rms))}')
    print('\nsaltos candidatos (de compasso i para j, pulando j−i compassos): ')
    cands = []
    for i in range(1, len(F)):
        for j in range(i + 2, min(len(F), i + 6)):
            # pular do início do compasso i para o início do compasso j: compasso i ≈ compasso j
            d = D[i, j] + 0.5 * D[i - 1, j - 1]
            cands.append((d, i, j))
    cands.sort()
    for d, i, j in cands[:14]:
        print(f'  c{i:02d}({down[i]:.2f}s) → c{j:02d}({down[j]:.2f}s)  remove {down[j] - down[i]:.2f}s  dist {d:.2f}')
    if a.json:
        json.dump({'duracao': dur, 'bpm': 60 / period, 'periodo': period, 't0': t0, 'fase': phase,
                   'beats': ideal.tolist(), 'downbeats': down.tolist(), 'energia_compasso': bar_rms,
                   'saltos': [(float(d), int(i), int(j)) for d, i, j in cands[:30]]}, open(a.json, 'w'), indent=1)


if __name__ == '__main__':
    main()
