"""Lê/grava videos/NN-*/cena.json mantendo o formato compacto (um item por linha) — para ajustes feitos por script.

uso (da raiz do repositório):
    import sys; sys.path.insert(0, "tools/episodio")
    from cena_io import load, dump, cena, item
    p, c = load("05"); item(cena(c, "L02"), p="porco")["s"] = 1.2; dump(p, c)
"""
import json
from pathlib import Path

def load(ep):
    p = next(Path('videos').glob(f'{ep}-*')) / 'cena.json'
    return p, json.loads(p.read_text(encoding='utf-8'))

def dump(p, c):
    j = lambda o: json.dumps(o, ensure_ascii=False)
    out = ['{']
    keys = [k for k in c if k != 'cenas']
    for k in keys:
        v = c[k]
        if k == 'pecas':
            items = list(v.items())
            rows = [', '.join(f'{j(a)}: {j(b)}' for a, b in items[i:i + 3]) for i in range(0, len(items), 3)]
            out.append(f'  "pecas": {{\n    ' + ',\n    '.join(rows) + '\n  },')
        else:
            out.append(f'  {j(k)}: {j(v)},')
    out.append('  "cenas": [')
    cenas = []
    for sc in c['cenas']:
        head = {k: v for k, v in sc.items() if k != 'itens'}
        h = j(head)[:-1]
        its = ',\n'.join('      ' + j(it) for it in sc['itens'])
        cenas.append(f'    {h}, "itens": [\n{its}\n    ]}}')
    out.append(',\n'.join(cenas))
    out.append('  ]\n}\n')
    s = '\n'.join(out)
    assert json.loads(s) == c
    p.write_text(s, encoding='utf-8')

def cena(c, fala):
    return next(sc for sc in c['cenas'] if sc.get('fala') == fala)

def item(sc, **kw):
    return next(it for it in sc['itens'] if all(it.get(k) == v for k, v in kw.items()))
