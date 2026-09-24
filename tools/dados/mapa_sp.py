"""Prepara o mapa de papel de São Paulo para a cena do ep. 02 (geometria projetada + classes de potencial).

uso: python tools/dados/mapa_sp.py [--pilar A:/Pilar-2b] [--saida videos/02-pilar-2b/dados/sp_mapa.json]

Fontes
  malha:     PILAR-2b Design System/data/sp-municipalities-ibge.geojson (IBGE, 645 municípios)
  potencial: Pilar-2b/analysis/data/02_municipality_summary_SP_2023.csv (GWh/ano por resíduo e município)
  nomes:     Pilar-2b/analysis/data/01_master_residue_streams_SP_2023.csv

Saída (coordenadas de mundo, eixo y para baixo, largura LARG, centrada em 0,0):
  contorno do estado; para cada município: código, nome, polígono(s) recolhidos 1,1 px (vão de papel),
  centróide e classe 0–4 (quintis) do potencial total e dos setores agrícola / pecuária / urbano (−1 = zero).
  Nenhum valor absoluto vai para a tela — só a classe (cor).
"""
import argparse, csv, json
from pathlib import Path
import numpy as np
from shapely.geometry import shape, Polygon, MultiPolygon
from shapely.ops import unary_union
from shapely import affinity

ROOT = Path(__file__).resolve().parents[2]
DS = ROOT.parent  # "PILAR-2b Design System"
LARG = 1600.0

SETORES = {
    'agr': ['sugarcane', 'citrus', 'coffee', 'corn', 'soybean'],
    'pec': ['cattle', 'swine', 'poultry', 'aquaculture'],
    'urb': ['rsu_organic', 'rpo_pruning'],
}


def quintis(vals):
    """Classe 0–4 por posição (quintis entre os valores > 0); zero → −1."""
    v = np.asarray(vals, float)
    nz = np.sort(v[v > 0])
    if not len(nz): return [-1] * len(v)
    br = [nz[int(p * (len(nz) - 1))] for p in (0.2, 0.4, 0.6, 0.8)]
    return [(-1 if x <= 0 else int(np.searchsorted(br, x, side='left'))) for x in v]


def rings(g):
    polys = [g] if isinstance(g, Polygon) else list(g.geoms) if isinstance(g, MultiPolygon) else []
    return [[[round(x, 1), round(y, 1)] for x, y in list(p.exterior.coords)[:-1]] for p in polys if p.area > 4]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--pilar', default='A:/Pilar-2b')
    ap.add_argument('--saida', default=str(ROOT / 'videos' / '02-pilar-2b' / 'dados' / 'sp_mapa.json'))
    a = ap.parse_args()
    geo = json.loads((DS / 'data' / 'sp-municipalities-ibge.geojson').read_text(encoding='utf-8'))
    rows = {r['ibge_code']: r for r in csv.DictReader(open(Path(a.pilar) / 'analysis/data/02_municipality_summary_SP_2023.csv', encoding='utf-8-sig'))}
    nomes = {}
    with open(Path(a.pilar) / 'analysis/data/01_master_residue_streams_SP_2023.csv', encoding='utf-8-sig') as fh:
        rd = csv.reader(fh); next(rd)
        for r in rd: nomes.setdefault(r[0], r[1])
    feats = [(f['properties']['codarea'], shape(f['geometry']).buffer(0)) for f in geo['features']]
    assert len(feats) == 645 and all(c in rows for c, _ in feats), 'malha e dados não batem'
    # projeção equirretangular com correção de latitude média (SP é pequeno: erro desprezível na tela)
    allg = unary_union([g for _, g in feats])
    lon0, lat0 = allg.centroid.x, allg.centroid.y
    k = np.cos(np.radians(lat0))
    x0, y0, x1, y1 = allg.bounds
    s = LARG / ((x1 - x0) * k)
    def proj0(g):
        g = affinity.translate(g, -lon0, -lat0)
        return affinity.scale(g, xfact=s * k, yfact=-s, origin=(0, 0))
    bx0, by0, bx1, by1 = proj0(allg).bounds
    proj = lambda g: affinity.translate(proj0(g), -(bx0 + bx1) / 2, -(by0 + by1) / 2)   # centro do retângulo em 0,0
    state = proj(allg).simplify(0.9)
    b = state.bounds
    out = {
        'fonte': {'malha': 'IBGE (sp-municipalities-ibge.geojson)', 'potencial': '02_municipality_summary_SP_2023.csv (PILAR-2b v3.0.3)'},
        'largura': LARG, 'bbox': [round(v, 1) for v in b],
        'setores': SETORES,
        'contorno': rings(state.buffer(0))[0] if isinstance(state, Polygon) else max(rings(state), key=len),
        'municipios': [],
    }
    tot = [float(rows[c]['mun_total_GWh']) for c, _ in feats]
    sec = {nm: [sum(float(rows[c]['GWh_' + st]) for st in lst) for c, _ in feats] for nm, lst in SETORES.items()}
    cls = {'tot': quintis(tot), **{nm: quintis(v) for nm, v in sec.items()}}
    for i, (c, g) in enumerate(feats):
        pg = proj(g)
        piece = pg.buffer(-0.55, join_style=2).simplify(0.6)   # vão de ~1,1 px entre os papéis vizinhos
        if piece.is_empty: piece = pg.simplify(0.6)
        cen = pg.representative_point()
        m = {'c': c, 'n': nomes.get(c, ''), 'x': round(cen.x, 1), 'y': round(cen.y, 1), 'a': round(pg.area, 1),
             'p': rings(piece), 'k': [cls['tot'][i], cls['agr'][i], cls['pec'][i], cls['urb'][i]],
             # proporção dos setores no município (para as barrinhas do cartão, sem números)
             'f': [round(sec[nm][i] / tot[i], 4) if tot[i] else 0 for nm in ('agr', 'pec', 'urb')]}
        if not m['p']: m['p'] = rings(pg)
        out['municipios'].append(m)
    Path(a.saida).parent.mkdir(parents=True, exist_ok=True)
    Path(a.saida).write_text(json.dumps(out, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    npts = sum(len(r) for m in out['municipios'] for r in m['p'])
    print(f"{len(out['municipios'])} municípios, {npts} vértices, contorno {len(out['contorno'])} pts, bbox {out['bbox']}")
    print('→', a.saida, f"{Path(a.saida).stat().st_size / 1024:.0f} KB")
    for c in ('3509502', '3550308', '3543402'):
        m = next(x for x in out['municipios'] if x['c'] == c)
        print(f"  {m['n']}: classes tot/agr/pec/urb {m['k']}  proporções {m['f']}")


if __name__ == '__main__':
    main()
