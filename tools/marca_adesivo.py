"""Transforma logos com fundo transparente em adesivos da série (borda branca de recorte), prontos para as cenas.

uso: python tools/marca_adesivo.py            # entrada/imagens/<logo> → assets/recortes/marcas/<nome>.png

Cada logo: recorta o que tem conteúdo, leva a uma largura de trabalho (logos pequenos sobem com Lanczos + nitidez),
e ganha a borda branca arredondada dos outros recortes. Nas cenas: "pecas": { "nipe": "marcas/nipe" }.
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
LOGOS = {   # nome → arquivo em entrada/imagens
    'nipe': 'logo-nipe-fundo-transparente.png',
    'fapesp': 'fapesp-logo-png_seeklogo-51965.png',
    'unicamp': 'unicamp-logo-png_seeklogo-144966.png',
}
LARGURA = 900          # largura do logo no adesivo (px, antes da borda)
PAPEL = (251, 248, 240)


def adesivo(src, largura=LARGURA):
    im = Image.open(src).convert('RGBA')
    a = np.asarray(im)[..., 3]
    ys, xs = np.where(a > 8)
    im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    k = largura / im.width
    im = im.resize((largura, max(1, round(im.height * k))), Image.LANCZOS)
    if k > 1.5: im = im.filter(ImageFilter.UnsharpMask(radius=2, percent=80, threshold=2))
    r = max(10, round(largura * 0.028))            # espessura da borda branca
    pad = r + 6
    canvas = Image.new('RGBA', (im.width + 2 * pad, im.height + 2 * pad), (0, 0, 0, 0))
    canvas.alpha_composite(im, (pad, pad))
    alpha = canvas.split()[3]
    borda = alpha.filter(ImageFilter.MaxFilter(2 * (r // 2) + 1)).filter(ImageFilter.MaxFilter(2 * (r // 2) + 1))
    borda = borda.filter(ImageFilter.GaussianBlur(r * 0.35)).point(lambda v: 255 if v > 90 else 0)
    from scipy.ndimage import binary_fill_holes   # adesivo é papel inteiro por dentro do contorno (sem "furos" transparentes)
    borda = Image.fromarray((binary_fill_holes(np.asarray(borda) > 127) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
    base = Image.new('RGBA', canvas.size, PAPEL + (0,))
    base.putalpha(borda)
    base.alpha_composite(canvas)
    return base


def main():
    out = ROOT / 'assets' / 'recortes' / 'marcas'
    out.mkdir(parents=True, exist_ok=True)
    for nome, arq in LOGOS.items():
        src = ROOT / 'entrada' / 'imagens' / arq
        if not src.exists(): print('falta', src); continue
        im = adesivo(src)
        im.save(out / f'{nome}.png')
        print(f'{nome}: {im.size[0]}x{im.size[1]} → {(out / f"{nome}.png").relative_to(ROOT)}')


if __name__ == '__main__':
    main()
