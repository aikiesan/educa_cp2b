"""Põe pupilas nos personagens de olhos brancos (sem pupila) dos recortes — os "olhinhos vazios" ficavam estranhos.

uso: python tools/olhos.py                 # todos os grupos abaixo → pinta pupilas (guarda o original em assets/recortes/_sem_pupila/)
     python tools/olhos.py --folha x.jpg   # também salva uma folha de conferência

Detecta cada olho como uma mancha branca pequena, fechada por pele (não encosta no fundo transparente nem na borda
branca do adesivo), mais ou menos oval, na parte de cima da figura; os olhos vêm em par, na mesma altura.
Sempre parte do original guardado, então rodar de novo não pinta duas vezes.
"""
import shutil, sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parents[1]
REC = ROOT / 'assets' / 'recortes'
GRUPOS = ['ep03/_folha/pesquisadores_*.png', 'ep19/_folha/equipe_*.png', 'ep24/_folha/herois_*.png']
# bichos de feltro: o branco do feltro engana o detector — olhos marcados à mão (cx, cy, largura, altura, no original)
# e a pupila olha para a frente (direita) nos bichos de perfil
MANUAL = {
    'ep05/_folha/animais_1.png': ([(470, 162, 48, 67), (520, 142, 35, 51)], 0.12),
    'ep05/_folha/animais_2.png': ([(299, 132, 36, 52), (336, 116, 26, 38)], 0.12),
    'ep05/_folha/animais_3.png': ([(363, 133, 39, 56)], 0.12),
    'ep05/_folha/animais_4.png': ([(371, 134, 37, 54)], 0.12),
    'ep05/_folha/animais_5.png': ([(189, 120, 30, 45), (223, 107, 23, 34)], 0.12),
    'ep05/_folha/pecas_ep05_3.png': ([(208, 160, 33, 62), (132, 157, 26, 55)], 0.0),
    'ep12/_folha/pecas_ep12_2.png': ([(79, 125, 48, 58), (141, 120, 31, 37)], 0.0),
    'ep08/_folha/pecas_ep08_1.png': ([(303, 57, 16, 29), (331, 50, 16, 27)], 0.15),   # minhoca olhando para a direita
    'ep08/_folha/pecas_ep08_3.png': ([(73, 57, 16, 28), (44, 50, 16, 27)], -0.15),    # minhoca olhando para a esquerda
}
TINTA = (27, 42, 51)


def olhos_de(rgba):
    a = rgba[..., 3] > 200
    rgb = rgba[..., :3].astype(int)
    branco = a & (rgb.min(-1) > 222) & (rgb.max(-1) - rgb.min(-1) < 28)
    # a borda branca do adesivo encosta no fundo: tudo que é branco ligado ao fundo transparente fica de fora
    fundo = ndi.binary_dilation(~a, iterations=3)
    lab, n = ndi.label(branco)
    h, w = a.shape
    ys_fig = np.where(a.any(1))[0]
    y0, y1 = ys_fig.min(), ys_fig.max()
    cands = []
    for k in range(1, n + 1):
        m = lab == k
        area = int(m.sum())
        if area < 8 or area > h * w * 0.004: continue
        if (m & fundo).any(): continue
        ys, xs = np.where(m)
        bh, bw = ys.max() - ys.min() + 1, xs.max() - xs.min() + 1
        if not (0.45 < bw / bh < 1.8): continue
        if area < 0.55 * bh * bw: continue                         # oval cheia (não é risco nem letra)
        cy = ys.mean()
        if cy > y0 + (y1 - y0) * 0.45: continue                    # olho fica na cabeça
        # em volta do olho tem pele (cor, não branco nem tinta escura)
        anel = ndi.binary_dilation(m, iterations=3) & ~ndi.binary_dilation(m, iterations=1) & a
        c = rgb[anel]
        if len(c) == 0 or (c.min(-1) > 215).mean() > 0.5: continue
        cands.append({'cx': xs.mean(), 'cy': cy, 'w': bw, 'h': bh, 'area': area})
    # pares: mesma altura, tamanhos parecidos, separados de 1,2 a 6 larguras
    melhor = None
    for i in range(len(cands)):
        for j in range(i + 1, len(cands)):
            p, q = cands[i], cands[j]
            dy, dx = abs(p['cy'] - q['cy']), abs(p['cx'] - q['cx'])
            ref = (p['h'] + q['h']) / 2
            if dy > ref * 0.6 or not (1.2 * ref < dx < 6.5 * ref): continue
            if max(p['area'], q['area']) > 2.2 * min(p['area'], q['area']): continue
            custo = dy / ref + abs(p['area'] - q['area']) / max(p['area'], q['area']) + (p['cy'] + q['cy']) / (2 * h)
            if melhor is None or custo < melhor[0]: melhor = (custo, [p, q])
    return melhor[1] if melhor else []


def pinta(img, olhos, frente=0.0):
    s = 4                                                         # desenha em 4× e reduz (borda lisa)
    big = img.resize((img.width * s, img.height * s), Image.LANCZOS)
    d = ImageDraw.Draw(big)
    for o in olhos:
        r = min(o['w'], o['h']) * 0.36 * s
        cx, cy = (o['cx'] + o['w'] * frente) * s, (o['cy'] + o['h'] * 0.06) * s
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=TINTA + (255,))
        rr = r * 0.32
        d.ellipse([cx + r * 0.28 - rr, cy - r * 0.34 - rr, cx + r * 0.28 + rr, cy - r * 0.34 + rr], fill=(255, 255, 255, 255))
    out = big.resize(img.size, Image.LANCZOS)
    alpha = img.split()[3]
    out.putalpha(alpha)
    return out


def main():
    orig = REC / '_sem_pupila'
    feitos, falhas, folha = [], [], []
    for g, um in [(g, False) for g in GRUPOS] + [(g, True) for g in MANUAL]:
        for f in sorted(REC.glob(g)):
            rel = f.relative_to(REC)
            bak = orig / rel
            if not bak.exists():
                bak.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(f, bak)
            img = Image.open(bak).convert('RGBA')
            key = rel.as_posix()
            if key in MANUAL:
                ol, fr = MANUAL[key]
                novo = pinta(img, [{'cx': x, 'cy': y, 'w': w, 'h': h} for x, y, w, h in ol], fr)
                novo.save(f); feitos.append(str(rel)); folha.append((img, novo, rel)); continue
            olhos = olhos_de(np.asarray(img))
            if not olhos or (len(olhos) != 2 and not um): falhas.append(str(rel)); folha.append((img, img, rel)); continue
            novo = pinta(img, olhos)
            novo.save(f)
            feitos.append(str(rel)); folha.append((img, novo, rel))
    print(f'{len(feitos)} com pupilas; sem par de olhos detectado: {falhas or "nenhum"}')
    if '--folha' in sys.argv:
        dest = Path(sys.argv[sys.argv.index('--folha') + 1])
        W = 170
        sheet = Image.new('RGB', (W * 2 * 6, 250 * ((len(folha) + 5) // 6)), (220, 214, 200))
        for k, (a, b, rel) in enumerate(folha):
            for j, im in enumerate((a, b)):
                t = im.copy(); t.thumbnail((W, 240))
                bg = Image.new('RGBA', t.size, (236, 222, 196, 255)); bg.alpha_composite(t)
                sheet.paste(bg.convert('RGB'), ((k % 6) * 2 * W + j * W, (k // 6) * 250))
        sheet.save(dest, quality=88)
        print('folha:', dest)


if __name__ == '__main__':
    main()
