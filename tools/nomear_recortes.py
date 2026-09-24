"""Dá nomes aos recortes da folha de ativos e separa itens cujas bordas se tocam.

uso: python tools/nomear_recortes.py   (lê assets/recortes/manifest.json)
"""
import json, shutil
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / 'assets' / 'recortes'

NOMES = {
    1: 'banana', 2: 'maca', 3: 'ovos', 4: 'vaca', 5: 'biodigestor', 6: 'maquina', 7: 'cenoura', 8: 'alface_folha',
    9: 'laranja', 10: 'cana_feixe', 11: 'palha', 12: 'milho_espiga', 13: 'caminhao', 14: 'onibus', 15: 'trator',
    16: 'fogao', 17: 'lampada', 18: 'casa_marrom', 19: 'casa_verde', 20: 'casa_amarela', 21: 'fabrica',
    22: 'cana_planta', 23: ('milho_planta', 'alface_pe'), 24: 'tomateiro', 25: 'bomba', 26: 'sol', 27: 'gerador',
    28: ('nuvem_pequena', 'nuvem_grande'), 29: 'muda', 30: 'esterco',
}
NOMES_V3 = {
    1: 'vaca_pe', 2: 'biodigestor', 3: 'maquina', 4: 'cenoura', 5: 'banana', 6: 'maca', 7: 'alface_folha', 8: 'ovos',
    9: 'laranja', 10: 'cana_feixe', 11: 'palha', 12: 'milho_espiga', 13: 'caminhao', 14: 'onibus', 15: 'trator',
    16: 'casa_creme', 17: 'casa_verde', 18: 'fabrica', 19: 'fogao', 20: 'lampada', 21: 'cana_planta', 22: 'milho_planta',
    23: 'sol_nuvens', 24: 'tomateiro', 25: 'bomba', 26: ('gerador', 'esterco'), 27: 'muda', 28: 'broto', 29: 'alface_pe',
}


def split(img, n, erode=10):
    """Separa n itens que se tocam: erode, rotula, e cada pixel vai para a semente mais próxima."""
    a = np.asarray(img)[..., 3] > 128
    core = ndi.binary_erosion(a, iterations=erode)
    lab, k = ndi.label(core)
    sizes = ndi.sum(core, lab, range(1, k + 1))
    keep = np.argsort(sizes)[::-1][:n] + 1
    seeds = np.where(np.isin(lab, keep), lab, 0)
    _, (iy, ix) = ndi.distance_transform_edt(seeds == 0, return_indices=True)
    owner = seeds[iy, ix]
    out = []
    arr = np.asarray(img).copy()
    for lbl in keep:
        m = (owner == lbl) & (arr[..., 3] > 0)
        ys, xs = np.where(m)
        piece = arr.copy(); piece[..., 3] = piece[..., 3] * m
        crop = piece[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        out.append(((xs.min() + xs.max()) / 2, Image.fromarray(crop, 'RGBA')))
    out.sort(key=lambda t: t[0])  # esquerda → direita
    return [p for _, p in out]


def main():
    import sys
    global DIR
    versao = sys.argv[1] if len(sys.argv) > 1 else ''
    if versao:
        DIR = DIR / versao
    nomes = NOMES_V3 if versao == 'v3' else NOMES
    man = next(iter(json.loads((DIR / 'manifest.json').read_text(encoding='utf-8')).values()))
    final = {}
    for i, it in enumerate(man, start=1):
        src = DIR / it['arquivo']
        nome = nomes[i]
        if isinstance(nome, tuple):
            for nm, im in zip(nome, split(Image.open(src).convert('RGBA'), len(nome))):
                im.save(DIR / f'{nm}.png', optimize=True)
                final[nm] = {'w': im.width, 'h': im.height}
        else:
            shutil.copyfile(src, DIR / f'{nome}.png')
            final[nome] = {'w': it['w'], 'h': it['h']}
        src.unlink()
    if (DIR / 'laboratorio.png').exists():
        lab = Image.open(DIR / 'laboratorio.png'); final['laboratorio'] = {'w': lab.width, 'h': lab.height}
    (DIR / 'ativos.json').write_text(json.dumps(final, ensure_ascii=False, indent=1), encoding='utf-8')
    (DIR / 'manifest.json').unlink()
    print(len(final), 'ativos:', ', '.join(sorted(final)))


if __name__ == '__main__':
    main()
