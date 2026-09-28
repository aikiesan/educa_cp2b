"""Página com os prompts de imagem que ainda não têm arquivo, cada um com botão de copiar:
  entrada/imagens/PROMPTS_PENDENTES.html

uso: python tools/prompts_pendentes.py   (rode de novo depois de salvar novas imagens)
Fonte: roteiros/PROMPTS_PRONTOS.md (gerado por tools/prompts_producao.py). Uma imagem conta como feita se
existir o arquivo com o nome indicado em .png, .jpg, .jpeg ou .webp.
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / 'entrada' / 'imagens'
SAIDA = IMG / 'PROMPTS_PENDENTES.html'
EXT = ('.png', '.jpg', '.jpeg', '.webp')
# imagem aprovada de cada estilo, para anexar como referência de família visual
REF = {'C': 'ep07/laranjal_cafe.png', 'D': 'ep04/usina_etanol.png', 'F': 'ep05/animais.png',
       'Q': 'ep06/aterro.png', 'N': 'ep08/solo_corte.png', 'L': 'ep11/pecas_ep11.png'}
EXTRA = {'arqueia_croche': 'referencias/personagens/arqueia_conceito.jpg',
         'arqueia_personagem': 'referencias/personagens/arqueia_conceito.jpg'}


def pendentes():
    md = (ROOT / 'roteiros' / 'PROMPTS_PRONTOS.md').read_text(encoding='utf-8')
    grupos, atual = [], None
    for bloco in re.split(r'^(?=## |### )', md, flags=re.M):
        if bloco.startswith('## '):
            titulo = bloco.splitlines()[0][3:]
            m = re.search(r'estilo (\w) \(', titulo)
            atual = {'titulo': re.sub(r' — `[^`]+`$', '', titulo), 'estilo': m.group(1) if m else None, 'itens': []}
            grupos.append(atual)
            continue
        m = re.match(r'### (\d+)\. `([^`]+)`([^\n]*)\n\n```\n(.*?)\n```', bloco, flags=re.S)
        if not m:
            continue
        n, nome, meta, prompt = m.groups()
        rel = nome[len('entrada/imagens/'):] if nome.startswith('entrada/') else f'personagens/{nome}.png'
        base = (IMG / rel).with_suffix('')
        if any(base.with_suffix(e).exists() for e in EXT):
            continue
        estilo = (re.search(r'estilo (\w) \(', meta) or [None, atual['estilo']])[1]
        anexos = [a.strip().replace('foto do Metaninho de crochê', 'foto do Metaninho de crochê (`METANINHO_REAL.jpeg`)')
                  for a in re.findall(r'anexar: (.+)$', meta)]
        stem = Path(rel).stem
        if stem in EXTRA and (IMG / EXTRA[stem]).exists():
            anexos.append(f'`{Path(EXTRA[stem]).name}`')
        if not anexos and estilo in REF and (IMG / REF[estilo]).exists():
            anexos.append(f'`{Path(REF[estilo]).name}` ({Path(REF[estilo]).parent.name}, mesmo estilo)')
        atual['itens'].append({'n': int(n), 'arquivo': rel, 'estilo': estilo, 'anexos': anexos, 'prompt': prompt})
    return [g for g in grupos if g['itens']]


def codigo(s):
    return re.sub(r'`([^`]+)`', r'<code>\1</code>', html.escape(s))


def main():
    grupos = pendentes()
    total = sum(len(g['itens']) for g in grupos)
    secoes = []
    for g in grupos:
        dica = ''
        if g['estilo'] == 'P':
            dica = ('<p class="dica">Primeiro estilo pop-up da série: gere <code>livro</code> antes e anexe-a '
                    'como referência nas outras imagens deste episódio.</p>')
        elif g['titulo'].startswith('Personagens'):
            dica = ('<p class="dica">Gere a 5 e a 6 primeiro. A 7 e a 8 usam essas folhas, depois de aprovadas, '
                    'como referência.</p>')
        cards = []
        for i in g['itens']:
            anexo = ('<p class="anexo">Anexar: ' + ', '.join(codigo(a) for a in i['anexos']) + '</p>') if i['anexos'] else ''
            if 'METANINHO_REAL' in anexo:
                anexo += ('<p class="anexo">Se vierem o pedestal ou o microfone da foto, acrescente ao fim: <code>Use the '
                          'reference only for style and scale; omit pedestal, microphone and all surroundings.</code></p>')
            cards.append(
                f'<article data-id="{html.escape(i["arquivo"])}"><header><span class="n">{i["n"]}</span>'
                f'<div><h3>{html.escape(Path(i["arquivo"]).name)}</h3>'
                f'<p class="pasta">entrada/imagens/{html.escape(str(Path(i["arquivo"]).parent.as_posix()))}/</p></div>'
                f'<label class="feito"><input type="checkbox"> feito</label></header>{anexo}'
                f'<pre>{html.escape(i["prompt"])}</pre><div class="acoes">'
                f'<button data-copy="prompt">Copiar prompt</button>'
                f'<button data-copy="nome" class="sec">Copiar nome do arquivo</button></div></article>')
        secoes.append(f'<section><h2>{html.escape(g["titulo"])}</h2>{dica}{"".join(cards)}</section>')
    dados = json.dumps({i['arquivo']: i['prompt'] for g in grupos for i in g['itens']}, ensure_ascii=False)
    pagina = PAGINA.replace('TOTAL', str(total)).replace('SECOES', ''.join(secoes)).replace('DADOS', dados.replace('</', '<\\/'))
    SAIDA.write_text(pagina, encoding='utf-8')
    print(f'{total} prompts pendentes → {SAIDA.relative_to(ROOT).as_posix()}')


PAGINA = '''<!doctype html><html lang="pt-BR"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Prompts pendentes</title>
<style>
:root{--petrol:#1e3e4c;--lime:#b6e03b;--cream:#f3ead8;--ink:#1e3e4c;--muted:#576c6a;--card:#fff;--line:#dcded6;--bg:#f3ead8;--pre:#f7f5ef}
@media (prefers-color-scheme:dark){:root{--ink:#e8ede6;--muted:#a7b5b0;--card:#16262e;--line:#2c3f47;--bg:#0f1c22;--pre:#10201f}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,sans-serif}
.topo{background:var(--petrol);color:#fff;padding:32px 16px 24px}.topo div,main{max-width:900px;margin:0 auto}
.topo small{color:var(--lime);letter-spacing:.08em}.topo h1{margin:6px 0 8px;font-size:30px}.topo p{margin:0;color:#dfe6de;max-width:680px}
main{padding:8px 16px 48px}h2{font-size:20px;margin:36px 0 10px}.dica{margin:0 0 14px;padding:10px 14px;border-left:4px solid var(--lime);background:var(--card);border-radius:6px}
article{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px;margin:0 0 14px}
article.ok{opacity:.5}article header{display:flex;gap:12px;align-items:flex-start}
.n{flex:none;width:36px;height:36px;border-radius:50%;background:var(--lime);color:#1e3e4c;display:grid;place-items:center;font-weight:700}
article header div{flex:1;min-width:0}h3{margin:0;font-size:17px;overflow-wrap:anywhere}.pasta,.anexo{margin:2px 0 0;font-size:13px;color:var(--muted);overflow-wrap:anywhere}
.anexo{margin:10px 0 0;color:var(--ink)}code{font-size:13px;background:var(--pre);padding:1px 5px;border-radius:4px}
.feito{flex:none;font-size:14px;display:flex;gap:6px;align-items:center;color:var(--muted)}
pre{margin:12px 0;padding:12px;background:var(--pre);border-radius:8px;white-space:pre-wrap;font-size:13px;line-height:1.45;max-height:9.5em;overflow:auto}
.acoes{display:flex;gap:8px;flex-wrap:wrap}button{font:inherit;font-size:14px;padding:8px 14px;border-radius:8px;border:0;background:var(--petrol);color:#fff;cursor:pointer}
@media (prefers-color-scheme:dark){button{background:var(--lime);color:#1e3e4c}}
button.sec{background:transparent;color:var(--ink);border:1px solid var(--line)}button.copiado{background:#5ca032;color:#fff}
</style>
<div class="topo"><div><small>EDUCA CP2B · IMAGENS</small><h1>TOTAL prompts pendentes</h1>
<p>Copie o prompt, gere no Gemini com a referência indicada e salve com o nome e na pasta mostrados.
Para atualizar a lista: <code style="background:#2c5263;color:#fff">python tools/prompts_pendentes.py</code></p></div></div>
<main>SECOES</main>
<script>
const P=DADOS;
function copiar(t,b){const fim=()=>{const o=b.textContent;b.textContent='Copiado!';b.classList.add('copiado');setTimeout(()=>{b.textContent=o;b.classList.remove('copiado')},1500)};
 const alt=()=>{const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy')}catch(e){}a.remove();fim()};
 if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(fim,alt)}else alt()}
let marcados={};try{marcados=JSON.parse(localStorage.getItem('pendentes')||'{}')}catch(e){}
for(const a of document.querySelectorAll('article')){const id=a.dataset.id,cb=a.querySelector('input');
 cb.checked=!!marcados[id];a.classList.toggle('ok',cb.checked);
 cb.addEventListener('change',()=>{marcados[id]=cb.checked;a.classList.toggle('ok',cb.checked);try{localStorage.setItem('pendentes',JSON.stringify(marcados))}catch(e){}});
 for(const b of a.querySelectorAll('button'))b.addEventListener('click',()=>copiar(b.dataset.copy==='prompt'?P[id]:id.split('/').pop(),b))}
</script></html>
'''

if __name__ == '__main__':
    main()
