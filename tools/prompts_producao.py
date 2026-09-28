"""Monta os arquivos de produção a partir dos roteiros (roteiros/NN-*.md, formato de 4 partes):
  roteiros/PROMPTS_PRONTOS.md   — cada imagem com o prompt COMPLETO (estilo + item), nome do arquivo e pasta
  roteiros/PROMPTS_MUSICA.md    — o prompt de música de cada vídeo (parte 3)
  roteiros/NARRACAO_COMPLETA.md — o texto de narração de todos, para leitura (parte 4)

uso: python tools/prompts_producao.py
Fontes: roteiros/PROMPT_IMAGENS.md (estilo-mestre C, frases dos outros estilos, personagens) e as partes
"2. Imagens" (o estilo vem do cabeçalho da tabela: "prompt-mestre **X**") e "3. Música" de cada roteiro.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
R = ROOT / 'roteiros'
NOMES = {'C': 'colagem de papel', 'F': 'feltro & crochê', 'P': 'livro pop-up', 'D': 'maquete de papelão',
         'L': 'lousa & caderno (adesivos)', 'Q': 'quadrinhos', 'N': 'caderno de campo'}
SEP = ('Several separate objects spaced far apart from each other on the same magenta background, each with its own '
       'white sticker border, none touching or overlapping, arranged in a loose grid with wide magenta gaps.')
AVISO = '> Arquivo gerado por `python tools/prompts_producao.py` — edite os roteiros, não este arquivo.'


def estilos():
    s = (R / 'PROMPT_IMAGENS.md').read_text(encoding='utf-8')
    mestre = re.search(r'## 1\. Estilo-mestre.*?```\n(.*?)\n```', s, flags=re.S).group(1).strip()
    # o estilo C é o bloco inteiro; os outros trocam as frases até a paleta ("Limited, cheerful palette …")
    resto = mestre[mestre.index('Limited, cheerful palette'):]
    out = {'C': mestre}
    for cod, frase in re.findall(r'\| \*\*([FPDLQN])\*\*[^|]*\| `([^`]+)` \|', s):
        r = resto.replace('Flat orthographic front or side view, no perspective distortion, ', '') if cod == 'D' else resto
        out[cod] = frase.strip() + ' ' + r
    return out, s


def personagens(E, fonte, n):
    linhas = ['## Personagens fixos — `entrada/imagens/personagens/`', '']
    for arq, ref, prompt in re.findall(r'\| `(cientista_\w+|mascote_\w+|arqueia_\w+)` \| ([^|]+) \| ([^\n]+) \|', fonte):
        m = re.match(r'\[estilo (\w)\] \+ `(.+)`$', prompt.strip())
        if m:
            cod, corpo = m.group(1), m.group(2)
        else:
            m2 = re.match(r'\[estilo (\w)\] \+ (.+)$', prompt.strip())
            cod, corpo = m2.group(1), m2.group(2)
            base = 'cientista_colagem`[^`]*\\| [^|]+\\| \\[estilo C\\]' if arq.startswith('cientista') else 'mascote_croche`[^`]*\\| [^|]+\\| \\[estilo F\\]'
            corpo = re.search('`' + base + r' \+ `([^`]+)`', fonte).group(1)
        n += 1
        linhas += [f'### {n}. `{arq}` — estilo {cod} ({NOMES[cod]}) · anexar: {ref.strip()}', '', '```',
                   E[cod] + ' ' + SEP + ' ' + corpo, '```', '']
    return linhas, n


def main():
    E, fonte = estilos()
    img = ['# Prompts prontos para gerar as imagens (Nano Banana / Gemini)', '',
           'Cada bloco é **um prompt completo** — copie e cole inteiro. Salve com o **nome** indicado na **pasta** indicada',
           '(PNG ou JPG, na maior resolução). Regras e conferência: [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md).',
           'Para manter a família visual, anexe como referência uma imagem já aprovada da série',
           '(ex.: `entrada/imagens/ep02/GERACAO_FINAL_MELHOR.jpg`).', '', AVISO, '']
    mus = ['# Prompts de música (Lyria 3 Pro)', '',
           'Um prompt por vídeo (parte 3 de cada roteiro). Salve como `entrada/musica/musica_epNN.mp3` e anexe uma trilha anterior',
           'da série como referência de família sonora. Todas terminam com a mesma assinatura: o "ta-da" com brilho de',
           'glockenspiel, onde entra o cartão CP2B.', '', AVISO, '']
    bloco, n = personagens(E, fonte, 0)
    img += bloco
    for md in sorted(R.glob('[0-9][0-9]-*.md')):
        s = md.read_text(encoding='utf-8')
        cab = s.splitlines()[0].lstrip('# ').strip()
        ep = md.name[:2]
        m = re.search(r'```musica\n(.*?)```', s, flags=re.S)
        if m:
            tw = re.search(r'\| twist \| ([^|]+) \|', s)
            mus += [f'## {cab}' + (f' — {tw.group(1).strip()}' if tw else ''), f'`entrada/musica/musica_ep{ep}.mp3`', '',
                    '```', m.group(1).strip(), '```', '']
        blk = re.search(r'## (?:2\. Imagens|Imagens novas)[^\n]*\n(.*?)(?=\n## |\Z)', s, flags=re.S)
        if not blk:
            continue
        pasta = re.search(r'`(entrada/imagens/ep\d+/)`', blk.group(0))
        pasta = pasta.group(1) if pasta else f'entrada/imagens/ep{ep}/'
        itens = re.findall(r'^\| `([\w_]+)` \| (.+) \|$', blk.group(1), flags=re.M)
        if not itens:
            continue
        mc = re.search(r'prompt-mestre \*\*(\w)\*\*', blk.group(1))
        cod = mc.group(1) if mc else 'C'
        cod = 'C' if cod == 'B' else cod
        img += [f'## {cab} — estilo {cod} ({NOMES[cod]}) — `{pasta}`', '']
        for arq, corpo in itens:
            n += 1
            varios = re.match(r'(separate|\w+ separate|several|two |three |four |five |six )', corpo.strip(), flags=re.I)
            img += [f'### {n}. `{pasta}{arq}.png`', '', '```',
                    E[cod] + (' ' + SEP if varios else '') + ' ' + corpo.strip(), '```', '']
    (R / 'PROMPTS_PRONTOS.md').write_text('\n'.join(img), encoding='utf-8')
    (R / 'PROMPTS_MUSICA.md').write_text('\n'.join(mus), encoding='utf-8')
    print(f'{n} prompts de imagem → {R / "PROMPTS_PRONTOS.md"}')
    print(f'{sum(1 for x in mus if x.startswith("## "))} prompts de música → {R / "PROMPTS_MUSICA.md"}')
    sys.path.insert(0, str(ROOT / 'tools' / 'tts'))
    import gerar_narracao
    gerar_narracao.exportar()


if __name__ == '__main__':
    main()
