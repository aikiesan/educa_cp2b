"""Organiza cópias das imagens da raiz e cataloga o acervo sem alterar pixels."""
from pathlib import Path
import hashlib
import html
import json
import shutil
from urllib.parse import quote
from PIL import Image
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'entrada' / 'imagens'
EXT = {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif'}


def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    copies = []
    for src in sorted(ROOT.iterdir()):
        if not src.is_file() or src.suffix.lower() not in EXT:
            continue
        name = src.name.lower()
        if name.startswith(('metaninho', 'metaninho_real')):
            folder = 'referencias/personagens'
        elif name.startswith('cemara-'):
            folder = 'institucional/cemara'
        elif name.startswith('cp2b-lab-'):
            folder = 'institucional/cp2b'
        elif name.startswith('ppbioen-'):
            folder = 'institucional/ppbioen'
        else:
            folder = 'referencias/gerais'
        dst = OUT / folder / src.name
        dst.parent.mkdir(parents=True, exist_ok=True)
        if dst.exists() and digest(dst) != digest(src):
            raise RuntimeError(f'Destino diferente já existe: {dst}')
        if not dst.exists():
            shutil.copy2(src, dst)
        assert digest(src) == digest(dst)
        copies.append({'original': src.relative_to(ROOT).as_posix(), 'copia': dst.relative_to(ROOT).as_posix()})

    generated = json.loads((OUT / 'geracao_2026-09-26.json').read_text(encoding='utf-8'))
    new = {p['path']: p for p in generated}
    inventory = []
    for base in [OUT, ROOT / 'assets', ROOT / 'docs']:
        for path in sorted(base.rglob('*')):
            if not path.is_file() or path.suffix.lower() not in EXT:
                continue
            rel = path.relative_to(ROOT).as_posix()
            group = path.parent.relative_to(ROOT).as_posix()
            item = {'arquivo': rel, 'grupo': group, 'novo': rel in new, 'bytes': path.stat().st_size}
            if path.suffix.lower() != '.svg':
                with Image.open(path) as im:
                    im.load()
                    item['largura'], item['altura'] = im.size
                    if rel in new:
                        rgb = np.asarray(im.convert('RGB'))
                        edge = np.concatenate((rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]))
                        key = ((edge[:, 0] > 230) & (edge[:, 1] < 30) & (edge[:, 2] > 230))
                        item['borda_magenta_percentual'] = round(float(key.mean() * 100), 2)
                        item['cantos_rgb'] = [rgb[y, x].tolist() for y, x in [(0, 0), (0, -1), (-1, 0), (-1, -1)]]
            inventory.append(item)
    found = {i['arquivo'] for i in inventory}
    missing = sorted(set(new) - found)
    if missing:
        raise RuntimeError(f'Imagens ausentes: {missing}')
    inventory.sort(key=lambda i: (not i['novo'], i['grupo'], i['arquivo']))
    (OUT / 'inventario.json').write_text(json.dumps({'copias_preservando_originais': copies, 'imagens': inventory}, ensure_ascii=False, indent=2), encoding='utf-8')
    groups = sorted({i['grupo'] for i in inventory})
    options = ''.join(f'<option value="{html.escape(g)}">{html.escape(g)}</option>' for g in groups)
    cards = []
    for i in inventory:
        rel = i['arquivo']
        target = quote(Path('../../').joinpath(rel).as_posix(), safe='/')
        label = Path(rel).name
        dims = f"{i.get('largura', '')} × {i.get('altura', '')}" if 'largura' in i else 'SVG'
        badge = '<span class="badge">Nova · 26/09</span>' if i['novo'] else '<span class="old">Acervo</span>'
        cards.append(f'<article data-group="{html.escape(i["grupo"])}" data-new="{str(i["novo"]).lower()}" data-search="{html.escape(rel.lower())}"><a href="{target}" target="_blank"><img loading="lazy" src="{target}" alt="{html.escape(label)}"></a><div class="info">{badge}<h2>{html.escape(label)}</h2><p>{html.escape(i["grupo"])}</p><small>{dims}</small></div></article>')
    page = '''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Acervo de imagens · educa CP2B</title>
<style>*{box-sizing:border-box}body{margin:0;background:#f3ead8;color:#1e3e4c;font:16px system-ui,sans-serif}header{padding:38px 5vw 26px;background:#1e3e4c;color:white}header p{max-width:760px;line-height:1.6;color:#e5eadf}h1{font-size:34px;margin:8px 0}nav{position:sticky;top:0;z-index:2;display:flex;gap:12px;flex-wrap:wrap;padding:18px 5vw;background:#fff;border-bottom:1px solid #dcded6}input,select{padding:12px;border:1px solid #cad2cc;border-radius:8px;font:inherit;max-width:100%}input{flex:1;min-width:210px}label{display:flex;align-items:center;gap:7px}label input{min-width:0;flex:none}main{padding:24px 5vw}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px}article{background:white;border-radius:12px;overflow:hidden;border:1px solid #d9ded5}article[hidden]{display:none}article img{display:block;width:100%;height:220px;object-fit:contain;background:#e9ede8}article a{display:block}.info{padding:16px}h2{font-size:16px;overflow-wrap:anywhere;margin:12px 0 7px}article p{font-size:12px;overflow-wrap:anywhere;margin:0 0 10px;color:#576c6a}.badge,.old{font-size:11px;padding:5px 8px;border-radius:20px;background:#b6e03b;color:#1e3e4c}.old{background:#edf0e9}#count{margin:0 0 18px;font-weight:600}small{color:#576c6a}</style>
<header><small style="color:#b6e03b">EDUCA CP2B · ACERVO VISUAL</small><h1>Imagens da série</h1><p>35 novas imagens, referências, materiais institucionais e recortes existentes. Selecione uma pasta ou procure pelo nome. Clique na imagem para abrir o arquivo original.</p></header>
<nav><input id="search" type="search" placeholder="Buscar imagem ou episódio…" aria-label="Buscar imagem"><select id="group" aria-label="Pasta"><option value="">Todas as pastas</option>OPTIONS</select><label><input id="newOnly" type="checkbox" checked>Somente as 35 novas</label></nav><main><p id="count"></p><div class="grid">CARDS</div></main>
<script>const cards=[...document.querySelectorAll('article')];const search=document.querySelector('#search'),group=document.querySelector('#group'),only=document.querySelector('#newOnly');function filter(){const q=search.value.toLowerCase();let n=0;for(const c of cards){const show=(!q||c.dataset.search.includes(q))&&(!group.value||c.dataset.group===group.value)&&(!only.checked||c.dataset.new==='true');c.hidden=!show;if(show)n++;}document.querySelector('#count').textContent=n+' imagens exibidas';}for(const el of [search,group,only])el.addEventListener('input',filter);filter();</script></html>'''
    (OUT / 'CATALOGO.html').write_text(page.replace('OPTIONS', options).replace('CARDS', ''.join(cards)), encoding='utf-8')
    lines = ['# Acervo de imagens — educa CP2B', '', 'Atualizado em 26/09/2026.', '', '[Abrir catálogo visual](CATALOGO.html)', '', '## Organização', '', '- `personagens/`: quatro folhas novas de poses.', '- `ep04/` a `ep18/`: 31 imagens novas, uma por prompt.', '- `ep02/`: imagens anteriores preservadas.', '- `referencias/personagens/`: cópias das referências do Metaninho.', '- `referencias/gerais/`: demais referências da raiz.', '- `institucional/cemara/`, `institucional/cp2b/`, `institucional/ppbioen/`: cópias das imagens institucionais.', '- `../../assets/recortes/`: recortes anteriores preservados e incluídos no catálogo.', '- `../../docs/` e `../../assets/brand/`: imagens de apresentação e marcas incluídas no catálogo.', '', 'Os arquivos originais foram preservados em seus caminhos para manter as referências existentes. Não foram apagados arquivos nem alterados pixels das imagens antigas.', '', '## Geração', '', 'Ferramenta: gerador de imagens integrado (`image_gen`). Fonte: [PROMPTS_PRONTOS.md](../../roteiros/PROMPTS_PRONTOS.md).', 'O registro [geracao_2026-09-26.json](geracao_2026-09-26.json) contém os 35 prompts, destinos, origens e revisões.', 'A versão HQ foi gerada em quadrinhos e o mascote de papel em colagem, corrigindo instruções conflitantes nos blocos originais.', 'As folhas que pedem vários objetos ou poses continuam sendo folhas; cada prompt tem seu próprio PNG. O recorte automático ainda não foi executado.', '', '## Imagens novas', '', '| Prompt | Arquivo |', '|---|---|']
    for p in generated:
        rel = Path(p['path']).relative_to('entrada/imagens').as_posix()
        lines.append(f"| {p['number']} | [{rel}]({quote(rel, safe='/')}) |")
    lines += ['', '## Inventário', '', f'{len(inventory)} arquivos catalogados; {len(copies)} cópias organizadas com igualdade de conteúdo verificada.', '', '[Inventário completo](inventario.json)', '']
    (OUT / 'LEIA-ME.md').write_text('\n'.join(lines), encoding='utf-8')
    print(json.dumps({'novas': len(new), 'catalogadas': len(inventory), 'copias': len(copies), 'menor_percentual_borda_magenta': min(i['borda_magenta_percentual'] for i in inventory if i['novo']), 'cantos_diferentes_magenta_exato': sum(any(c != [255, 0, 255] for c in i['cantos_rgb']) for i in inventory if i['novo'])}, ensure_ascii=False))


if __name__ == '__main__':
    main()
