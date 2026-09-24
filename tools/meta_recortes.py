"""Metadados dos recortes de um episódio: buracos magenta (tela do notebook, lente da lupa) e ovais dos olhos.

uso: python tools/meta_recortes.py ep02            → atualiza assets/recortes/ep02/meta.json

- "tela": bbox [x0, y0, x1, y1] do maior buraco transparente FECHADO dentro do recorte (a tela magenta).
- "olhos_auto": ovais brancos quase puros, pequenos e fechados, candidatos a olhos ([cx, cy, r] em px da imagem).
Os valores escritos à mão no meta.json (s, ax, ay, eyes…) são preservados; só as chaves automáticas são refeitas.
"""
import sys, json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]


def holes(alpha):
    tr = alpha < 40
    lab, n = ndi.label(tr)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    out = []
    for k, sl in enumerate(ndi.find_objects(lab), start=1):
        if sl is None or k in border: continue
        area = int((lab[sl] == k).sum())
        out.append((area, [int(sl[1].start), int(sl[0].start), int(sl[1].stop), int(sl[0].stop)]))
    return sorted(out, reverse=True)


def franja(rgba, bb, pad=10):
    """Apaga a franja arroxeada (restos do magenta no JPEG) em volta de um buraco: pixels com tom magenta
    perto do buraco ficam transparentes. Devolve a imagem nova, ou None se não havia o que limpar."""
    x0, y0, x1, y1 = bb
    H, W = rgba.shape[:2]
    X0, Y0, X1, Y1 = max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad)
    sub = rgba[Y0:Y1, X0:X1].astype(int)
    r, g, b, a = sub[..., 0], sub[..., 1], sub[..., 2], sub[..., 3]
    hole = np.zeros(a.shape, bool); hole[y0 - Y0:y1 - Y0, x0 - X0:x1 - X0] = True
    near = ndi.binary_dilation(a < 40, iterations=pad) & hole | ndi.binary_dilation(a < 40, iterations=4)
    pink = ((r + b) / 2 - g > 18) & (r > 65) & (b > 90) & near
    if not pink.any(): return None
    out = rgba.copy()
    out[Y0:Y1, X0:X1, 3] = np.where(pink, 0, a).astype(np.uint8)
    return out


def eyes(rgba):
    rgb, a = rgba[..., :3].astype(int), rgba[..., 3]
    white = (a > 200) & (rgb.min(-1) > 232) & (np.ptp(rgb, -1) < 18)
    white = ndi.binary_opening(white, iterations=2)
    lab, n = ndi.label(white)
    H, W = a.shape
    out = []
    for k, sl in enumerate(ndi.find_objects(lab), start=1):
        if sl is None: continue
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        area = (lab[sl] == k).sum()
        # oval pequeno, compacto, longe da borda (a borda branca de adesivo é fina e comprida)
        if not (0.004 * W < w < 0.12 * W and 0.6 < h / max(w, 1) < 1.8 and area > 0.62 * h * w): continue
        if sl[0].start < 4 or sl[1].start < 4 or sl[0].stop > H - 4 or sl[1].stop > W - 4: continue
        out.append([round((sl[1].start + sl[1].stop) / 2), round((sl[0].start + sl[0].stop) / 2), round(max(h, w) / 2)])
    return out


def main():
    ep = sys.argv[1] if len(sys.argv) > 1 else 'ep02'
    d = ROOT / 'assets' / 'recortes' / ep
    mp = d / 'meta.json'
    meta = json.loads(mp.read_text(encoding='utf-8')) if mp.exists() else {}
    for f in sorted(d.glob('*.png')):
        im = np.asarray(Image.open(f).convert('RGBA'))
        m = meta.setdefault(f.stem, {})
        m['w'], m['h'] = int(im.shape[1]), int(im.shape[0])
        hs = holes(im[..., 3])
        if hs and hs[0][0] > 0.02 * im.shape[0] * im.shape[1]:
            for _ in range(4):   # cada passada come um anel da franja; repete até limpar
                limpo = franja(im, hs[0][1])
                if limpo is None: break
                im = limpo; hs = holes(im[..., 3])
                Image.fromarray(im, 'RGBA').save(f, optimize=True)
            m['tela'] = hs[0][1]
        else: m.pop('tela', None)
        ey = eyes(im)
        if ey: m['olhos_auto'] = ey
        else: m.pop('olhos_auto', None)
        print(f"{f.stem:22s} {m['w']}×{m['h']}  tela={m.get('tela')}  olhos_auto={m.get('olhos_auto')}")
    mp.write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding='utf-8')
    print('→', mp)


if __name__ == '__main__':
    main()
