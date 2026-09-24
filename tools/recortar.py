"""Recorta ilustrações geradas sobre fundo magenta (#FF00FF) e separa folhas com vários itens.

uso: python tools/recortar.py [entrada/imagens] [assets/recortes]

- chave de cor por diferença (R+B)/2 − G (magenta puro ≈ 255; branco/papel ≈ 0; tons coral/rosa < 60)
- remove o "vazamento" de magenta nas bordas (des-premultiplica pela cor-chave)
- o fundo é o magenta conectado às bordas + qualquer região magenta pura (ex.: a janela do biodigestor)
- itens separados viram PNGs separados (componentes conexos após dilatação), ordenados ←→ e ↑↓
"""
import sys, json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
KEY = np.array([255.0, 0.0, 255.0])


def key_alpha(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    d = (r + b) / 2 - g
    # distância total à cor-chave (evita pegar vermelhos puros)
    dist = np.sqrt(((rgb - KEY) ** 2).sum(-1))
    a = 1 - np.clip((d - 70) / (210 - 70), 0, 1)
    a = np.maximum(a, np.clip((dist - 60) / 120, 0, 1))
    return a


def process(path, outdir, min_frac=0.0015):
    im = Image.open(path).convert('RGB')
    rgb = np.asarray(im).astype(np.float32)
    H, W = rgb.shape[:2]
    a = key_alpha(rgb)
    # fundo = magenta ligado à borda OU magenta muito puro
    bg = a < 0.5
    lab, n = ndi.label(bg)
    border_labels = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    pure = a < 0.08
    bgmask = np.isin(lab, list(border_labels)) | pure
    near_bg = ndi.binary_dilation(bgmask, iterations=3)
    # alfa "chaveado" só no fundo e na franja junto dele; o resto (ex.: rosa do focinho) fica opaco
    alpha = np.where(near_bg, a, 1.0)
    alpha = ndi.gaussian_filter(alpha, 0.6)
    alpha = np.clip(alpha, 0, 1)
    # despill: F = (C - (1-α)K) / α
    al = np.clip(alpha, 1e-3, 1)[..., None]
    fg = (rgb - (1 - al) * KEY) / al
    fg = np.clip(fg, 0, 255)
    # restos de magenta em pixels opacos → neutraliza puxando o verde
    spill = np.clip(((fg[..., 0] + fg[..., 2]) / 2 - fg[..., 1] - 90) / 100, 0, 1)[..., None]
    fg = fg * (1 - spill) + np.stack([fg[..., 0], (fg[..., 0] + fg[..., 2]) / 2, fg[..., 2]], -1) * spill
    # remove legendas impressas (texto escuro direto no magenta, sem a borda branca de "adesivo")
    solid = alpha > 0.5
    lab0, n0 = ndi.label(solid)
    luma = fg[..., 0] * 0.299 + fg[..., 1] * 0.587 + fg[..., 2] * 0.114
    for k, sl in enumerate(ndi.find_objects(lab0), start=1):
        if sl is None: continue
        comp = lab0[sl] == k
        # só a borda de FORA conta (uma tela/janela vazada tem moldura escura por dentro, mas não é legenda)
        filled = ndi.binary_fill_holes(comp)
        ring = filled & ~ndi.binary_erosion(filled, iterations=3)
        light = (luma[sl][ring] > 185).mean() if ring.any() else 0
        if light < 0.35:
            alpha[sl][comp] = 0
            solid[sl][comp] = False
    # "defringe": pixels semitransparentes herdam a cor do pixel opaco mais próximo (some a franja magenta)
    opaque = alpha > 0.97
    if opaque.any():
        _, (iy, ix) = ndi.distance_transform_edt(~opaque, return_indices=True)
        edge = (alpha > 0.002) & ~opaque
        fg[edge] = fg[iy[edge], ix[edge]]
    # borda branca contaminada pelo JPEG (subamostragem de croma): neutraliza o rosado perto da borda
    near_edge = ndi.binary_dilation(alpha < 0.5, iterations=7) & (alpha > 0)
    pinkish = near_edge & (fg[..., 0] > 170) & (fg[..., 2] > 150) & (fg[..., 1] < (fg[..., 0] + fg[..., 2]) / 2 - 4)
    fg[..., 1] = np.where(pinkish, np.minimum(fg[..., 0], fg[..., 2]) * 0.985, fg[..., 1])
    rgba = np.dstack([fg, alpha * 255]).astype(np.uint8)
    # componentes (cada adesivo tem borda branca contínua; dilatação pequena só junta lascas)
    rad = int(sys.argv[3]) if len(sys.argv) > 3 else 3
    grown = ndi.binary_dilation(solid, iterations=rad)
    lab2, n2 = ndi.label(grown)
    items = []
    for k in range(1, n2 + 1):
        m = (lab2 == k) & (alpha > 0.02)
        area = (m & solid).sum()
        if area < min_frac * H * W: continue
        ys, xs = np.where(m)
        y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        items.append((y0, y1, x0, x1, m))
    # ordena por linhas (↑↓) e depois ←→
    items.sort(key=lambda it: (round(((it[0] + it[1]) / 2) / (H / 4)), (it[2] + it[3]) / 2))
    out = []
    stem = path.stem
    for i, (y0, y1, x0, x1, m) in enumerate(items):
        pad = 6
        y0, x0 = max(0, y0 - pad), max(0, x0 - pad)
        y1, x1 = min(H, y1 + pad), min(W, x1 + pad)
        crop = rgba[y0:y1, x0:x1].copy()
        crop[..., 3] = (crop[..., 3] * m[y0:y1, x0:x1]).astype(np.uint8)
        name = f'{stem}.png' if len(items) == 1 else f'{stem}_{i + 1}.png'
        Image.fromarray(crop, 'RGBA').save(outdir / name, optimize=True)
        out.append({'arquivo': name, 'w': int(x1 - x0), 'h': int(y1 - y0), 'origem': path.name, 'bbox': [int(x0), int(y0), int(x1), int(y1)]})
        print(f'  {name}: {x1 - x0}×{y1 - y0}')
    return out


def main():
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'entrada' / 'imagens'
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / 'assets' / 'recortes'
    dst.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for p in sorted(list(src.glob('*.png')) + list(src.glob('*.jpg')) + list(src.glob('*.jpeg')) + list(src.glob('*.webp'))):
        print(p.name)
        manifest[p.stem] = process(p, dst)
    (dst / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1), encoding='utf-8')
    print('manifest:', dst / 'manifest.json')


if __name__ == '__main__':
    main()
