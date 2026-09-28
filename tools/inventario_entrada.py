"""Índice do material de entrada por episódio → entrada/LEIA-ME.md

uso: python tools/inventario_entrada.py   (rode de novo quando chegar material novo)
Para cada episódio: imagens (feitas / pedidas no PROMPTS_PRONTOS), trilha, narração por idioma e durações, com avisos
automáticos: trilha duplicada de outro episódio, arquivo faltando, narração mais longa do que cabe antes do logo.
"""
import hashlib
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
E = ROOT / 'entrada'
R = ROOT / 'roteiros'
IMG_EXT = ('.png', '.jpg', '.jpeg', '.webp')
# episódios que reaproveitam a trilha (e a animação) de outro
MUSICA_FIXA = {'01': 'The_Papercut_Invention.mp3', '02': 'Sunlight_on_the_Workbench.mp3',
               '90': 'The_Papercut_Invention.mp3', '91': 'Sunlight_on_the_Workbench.mp3'}
FOLGA_LOGO = 3.5   # o golpe final cai ~2,5 s antes do fim da trilha e a última fala termina ~1 s antes dele


def dur(p):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)],
                         capture_output=True, text=True).stdout.strip()
    return float(out) if out else 0.0


def sha(p):
    return hashlib.sha1(p.read_bytes()).hexdigest()


def episodios():
    eps = {'01': ('O que é biogás? E biometano?', '—'), '02': ('PILAR-2b: o mapa do biogás de São Paulo', '—')}
    for md in sorted(R.glob('[0-9][0-9]-*.md')):
        s = md.read_text(encoding='utf-8')
        titulo = re.match(r'# \d+ · (.+)', s).group(1).strip()
        est = re.search(r'\| estilo visual \| ([^|]+) \|', s)
        eps[md.name[:2]] = (titulo, re.sub(r'\*', '', est.group(1)).strip() if est else '—')
    return eps


def pedidas():
    """imagens pedidas por pasta (entrada/imagens/<pasta>/<nome>) segundo o PROMPTS_PRONTOS"""
    md = (R / 'PROMPTS_PRONTOS.md').read_text(encoding='utf-8')
    out = {}
    for nome in re.findall(r'^### \d+\. `([^`]+)`', md, flags=re.M):
        rel = nome[len('entrada/imagens/'):] if nome.startswith('entrada/') else f'personagens/{nome}.png'
        out.setdefault(Path(rel).parent.as_posix(), []).append(Path(rel).stem)
    return out


def main():
    eps, ped = episodios(), pedidas()
    musicas = {p.name: p for p in (E / 'musica').glob('*.mp3')}
    hashes = {}
    for p in musicas.values():
        hashes.setdefault(sha(p), []).append(p.name)
    linhas, avisos = [], []
    for ep, (titulo, estilo) in sorted(eps.items()):
        pasta = E / 'imagens' / f'ep{ep}'
        feitas = {p.stem for p in pasta.glob('*') if p.suffix.lower() in IMG_EXT} if pasta.exists() else set()
        pede = ped.get(f'ep{ep}', [])
        falt = [n for n in pede if n not in feitas]
        if ep in ('90', '91'):
            img = 'as do ep. ' + ('01' if ep == '90' else '02')
        elif pede:
            img = f'{len(pede) - len(falt)}/{len(pede)}' + (f' (faltam: {", ".join(falt)})' if falt else '')
        else:
            img = f'{len(feitas)} arquivos' if feitas else '—'
        mnome = MUSICA_FIXA.get(ep, f'musica_ep{ep}.mp3')
        mp = musicas.get(mnome)
        md_ = dur(mp) if mp else 0
        mus = f'`{mnome}` ({md_:.0f} s)' if mp else '**falta**'
        if mp and ep not in MUSICA_FIXA:
            iguais = [n for n in hashes[sha(mp)] if n != mnome]
            if iguais:
                mus += f' ⚠ igual a {", ".join(iguais)}'
                avisos.append(f'ep. {ep}: a trilha `{mnome}` é idêntica a {", ".join(iguais)}')
        vozes = []
        for idioma in ('pt-BR', 'en-GB'):
            for v in sorted((E / 'narracao' / idioma).glob(f'ep{ep}_{idioma}_*.wav')):
                d = dur(v)
                aviso = ''
                if mp and d > md_ - FOLGA_LOGO:
                    aviso = f' ⚠ {d - (md_ - FOLGA_LOGO):.1f} s além da trilha'
                    avisos.append(f'ep. {ep} {idioma}: a narração ({d:.1f} s) passa {d - (md_ - FOLGA_LOGO):.1f} s do espaço antes do logo '
                                  f'({md_:.0f} s de trilha) — encurtar pausas/acelerar ou trilha mais longa')
                vozes.append(f'{idioma} `{v.stem.split("_", 2)[2]}` ({d:.1f} s){aviso}')
        if not vozes and ep not in ('90', '91') and ep != '01' and ep != '02':
            avisos.append(f'ep. {ep}: sem narração')
        linhas.append(f'| {ep} | {titulo} | {estilo} | {img} | {mus} | {"<br>".join(vozes) or "—"} |')

    avulsas = sorted(p.name for p in (E / 'musica' / '_avulsas').glob('*')) if (E / 'musica' / '_avulsas').exists() else []
    txt = [
        '# Material de entrada — educa CP2B', '',
        'Índice gerado por `python tools/inventario_entrada.py` (rode de novo quando chegar material novo).', '',
        '## Pastas', '',
        '| pasta | conteúdo |', '|---|---|',
        '| `imagens/epNN/` | folhas do Nano Banana de cada episódio ([catálogo](imagens/CATALOGO.html) · [revisão](imagens/PENDENTES.md)) |',
        '| `imagens/personagens/` | folhas de poses do Metaninho e da Arqueia; `referencias/`, `institucional/`, `_rascunhos/` (descartadas) |',
        '| `musica/` | trilhas do Lyria: `musica_epNN.mp3`; eps. 01/02 (e as versões em inglês 90/91) usam `The_Papercut_Invention.mp3` e `Sunlight_on_the_Workbench.mp3` |',
        '| `musica/_avulsas/` | trilhas sem episódio definido ou não usadas: ' + (', '.join(f'`{n}`' for n in avulsas) or '—') + ' |',
        '| `narracao/pt-BR/`, `narracao/en-GB/` | narração por episódio: `epNN_<idioma>_<voz>_takeN.wav` (voz usada nos vídeos) |',
        '| `narracao/brutos/` | gravações longas originais e o registro dos cortes (`cortes_*.json`) |',
        '| `narracao/alternativas/`, `narracao/testes/` | outras tomadas e testes de voz |',
        '| `_historico/` | pedidos antigos (substituídos pelas fichas em `roteiros/`) |',
        '| `_outros/` | arquivos que não são do projeto |', '',
        'Scripts de narração: `tools/tts/gerar_narracao.py NN` (Gemini) e `tools/tts/gerar_narracao_edge.py NN` (Edge);',
        'eles já salvam em `narracao/<idioma>/` (Edge em `narracao/edge/`).', '',
        '## Por episódio', '',
        '| ep | título | estilo | imagens | trilha | narração |', '|---|---|---|---|---|---|',
        *linhas, '',
        '## Avisos', '',
        *([f'- {a}' for a in avisos] or ['- nenhum']), '',
    ]
    (E / 'LEIA-ME.md').write_text('\n'.join(txt), encoding='utf-8')
    print(f'{len(linhas)} episódios, {len(avisos)} avisos → entrada/LEIA-ME.md')


if __name__ == '__main__':
    main()
