"""Refaz todos os recortes a partir de entrada/imagens (folhas do Nano Banana).

uso: python tools/preparar_ativos.py            (ep. 01 — refaz assets/recortes/, preservando as pastas epNN/)
     python tools/preparar_ativos.py ep02 [folha]   (só entrada/imagens/ep02/[folha.*] → assets/recortes/ep02/_folha/)
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


def episodio(ep, folha=None):
    """Episódios novos: cada imagem vira <nome>_N.png em assets/recortes/<ep>/_folha/ (nomes finais: tools/nomear_<ep>.py)."""
    src, dst = IN / ep, OUT / ep / '_folha'
    if dst.exists(): shutil.rmtree(dst)
    fs = sorted(p for p in src.iterdir() if p.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp') and (folha is None or p.stem == folha))
    cut(fs, dst)


def main():
    if len(sys.argv) > 1: return episodio(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
    OUT.mkdir(parents=True, exist_ok=True)
    for p in OUT.iterdir():   # limpa só os recortes do ep. 01 (as pastas de outros episódios ficam)
        if p.is_dir() and p.name.startswith('ep'): continue
        shutil.rmtree(p) if p.is_dir() else p.unlink()
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
