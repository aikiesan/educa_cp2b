"""Compara hipóteses de pronúncia num trecho da narração (alinhador MMS): qual texto casa melhor com o áudio?

uso: python testar_pronuncia.py voz.wav 9.8 12.4 "por seiscentos e quarenta e cinco municípios" "por seis quatro cinco municípios" ...
Imprime, para cada hipótese, a confiança média e a de cada palavra (0–1).
"""
try:
    import truststore; truststore.inject_into_ssl()
except ImportError:
    pass
import sys, re
import numpy as np
import soundfile as sf
import torch, torchaudio
from alinhar_vo import roman


def main():
    wav, t0, t1, *hips = sys.argv[1:]
    y, sr = sf.read(wav, dtype='float32')
    if y.ndim > 1: y = y.mean(1)
    y = y[int(float(t0) * sr):int(float(t1) * sr)]
    w = torch.tensor(y)[None]
    if sr != 16000: w = torchaudio.functional.resample(w, sr, 16000)
    b = torchaudio.pipelines.MMS_FA
    model = b.get_model(with_star=False).eval()
    tok, aligner = b.get_tokenizer(), b.get_aligner()
    with torch.inference_mode():
        em, _ = model(w)
        for h in hips:
            ws = [roman(x) for x in re.findall(r"[\wÀ-ÿ']+", h)]
            ws = [x for x in ws if x]
            sp = aligner(em[0], tok(ws))
            sc = [float(np.mean([s.score for s in p])) for p in sp]
            print(f'{np.mean(sc):.2f}  {h}\n      ' + ' '.join(f'{x}:{s:.2f}' for x, s in zip(ws, sc)))


if __name__ == '__main__':
    main()
