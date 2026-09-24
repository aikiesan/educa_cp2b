"""Refaz todos os recortes a partir de entrada/imagens (folhas do Nano Banana).

uso: python tools/preparar_ativos.py
  folha_ativos.jpg     → assets/recortes/        (nomes em nomear_recortes.NOMES)
  folha_ativos_v3.jpg  → assets/recortes/v3/     (NOMES_V3)
  folha_ativos_v2.jpg  → assets/recortes/v2/     (reserva, sem nomes)
  laboratorio.jpg      → assets/recortes/laboratorio.png
  *_hd.* / lupa.*      → assets/recortes/hd/     (itens avulsos em alta resolução, se houver)
"""
import shutil, tempfile, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IN = ROOT / 'entrada' / 'imagens'
OUT = ROOT / 'assets' / 'recortes'
PY = sys.executable


def run(*a):
    subprocess.run([PY, *map(str, a)], check=True)


def cut(files, dst):
    with tempfile.TemporaryDirectory() as tmp:
        for f in files: shutil.copy(f, tmp)
        dst.mkdir(parents=True, exist_ok=True)
        run(ROOT / 'tools' / 'recortar.py', tmp, dst)


def main():
    if OUT.exists(): shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    cut([IN / 'folha_ativos.jpg', IN / 'laboratorio.jpg'], OUT)
    run(ROOT / 'tools' / 'nomear_recortes.py')
    if (IN / 'folha_ativos_v3.jpg').exists():
        cut([IN / 'folha_ativos_v3.jpg'], OUT / 'v3'); run(ROOT / 'tools' / 'nomear_recortes.py', 'v3')
    if (IN / 'folha_ativos_v2.jpg').exists():
        cut([IN / 'folha_ativos_v2.jpg'], OUT / 'v2')
    hd = [p for p in IN.iterdir() if p.stem.endswith('_hd') or p.stem == 'lupa']
    if hd: cut(hd, OUT / 'hd')


if __name__ == '__main__':
    main()
