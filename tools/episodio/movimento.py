"""Mede o tremor: % de pixels que mudam de um quadro ao outro num momento parado (sem entrada nem passagem de câmera).
Parado de verdade ≈ 0 %. Antes da correção do motor (tremido aleatório a cada pose) dava 1–5 % a cada quadro.

uso: python tools/episodio/movimento.py dist/ep05/suinos-aves_16x9.mp4 <segundo> <nome>
"""
import json, subprocess, sys
import numpy as np
from PIL import Image
from pathlib import Path
S = Path(__file__).resolve().parents[2] / 'tmp'
video, t0, nome = sys.argv[1], float(sys.argv[2]), sys.argv[3]
d = S / 'mov' / nome
d.mkdir(parents=True, exist_ok=True)
for f in d.glob('*.png'): f.unlink()
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-ss', str(t0), '-i', video, '-frames:v', '24', '-vf', 'scale=960:-1', str(d / 'f%02d.png')], check=True)
fr = [np.asarray(Image.open(p).convert('L'), dtype=np.float32) for p in sorted(d.glob('*.png'))]
dif = [np.abs(fr[i] - fr[i - 1]) for i in range(1, len(fr))]
m = [float((x > 12).mean() * 100) for x in dif]
print(f'{nome} @ {t0:.2f}s — pixels mudando por quadro (%): média {np.mean(m):.2f}, máx {max(m):.2f} |', ' '.join(f'{v:.1f}' for v in m))
