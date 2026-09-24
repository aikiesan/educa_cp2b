"""Gera legendas WebVTT e SRT (pt-BR) a partir do timeline.json (tempos palavra a palavra).

Falas longas são quebradas em blocos de até ~42 caracteres por linha (máx. 2 linhas),
preferindo pontuação; cada bloco começa na 1ª palavra e termina na última.
Quando a fala tem forma pronunciada ("fala": siglas soletradas, números por extenso), os tempos vêm dela e
"legenda_subst" do timeline devolve a grafia da tela ("seiscentos e quarenta e cinco" → "645").
uso: python tools/legendas.py [videos/01-o-que-e-biogas/timeline.json] [--balancear]
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARGS = [x for x in sys.argv[1:] if not x.startswith('--')]
BAL = '--balancear' in sys.argv   # blocos de tamanho parecido (ep. 02 em diante)
TL = Path(ARGS[0]) if ARGS else ROOT / 'videos' / '01-o-que-e-biogas' / 'timeline.json'
MAXC = 42


def ts(t, sep='.'):
    h, r = divmod(max(0, t), 3600); m, s = divmod(r, 60)
    return f'{int(h):02d}:{int(m):02d}:{s:06.3f}'.replace('.', sep)


def tokens(texto, palavras):
    """Casa as palavras do alinhamento com o texto original (mantém pontuação e acentos)."""
    toks = re.findall(r"[\wÀ-ÿ']+[^\s\wÀ-ÿ']*|[—…]+|\.\.\.", texto)
    out, k = [], 0
    for tk in toks:
        if re.match(r"[\wÀ-ÿ']", tk) and k < len(palavras):
            out.append((tk, palavras[k]['i'], palavras[k]['f'])); k += 1
        elif out:
            out[-1] = (out[-1][0] + ' ' + tk if tk in '—' else out[-1][0] + tk.strip(), out[-1][1], out[-1][2])
    return out


def blocks(toks):
    res, cur = [], []
    def flush():
        if cur: res.append(cur.copy()); cur.clear()
    for tk in toks:
        cur.append(tk)
        txt = ' '.join(t[0] for t in cur)
        if len(txt) > MAXC * 2 - 6: flush(); continue
        if len(txt) > MAXC * 1.2 and re.search(r'[,:;!?…—]$|\.\.\.$', tk[0]): flush()
    flush()
    return res


FUNC = {'a', 'o', 'as', 'os', 'e', 'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos', 'que', 'por', 'pra', 'um', 'uma', 'com'}
PUN = r'[,:;!?…—]$|\.\.\.$|\.$'


def corte(a_last):
    """Custo de cortar logo depois desta palavra: pontuação é ótimo; artigo/preposição no fim é ruim."""
    if re.search(PUN, a_last): return 0
    return 30 if a_last.lower() in FUNC else 14


def blocks_bal(toks):
    """Blocos balanceados: divide a fala em partes de tamanho parecido, preferindo cortar após pontuação
    (e nunca deixando artigo/preposição pendurado); frases completas longas viram blocos próprios."""
    txt = lambda ts: ' '.join(t[0] for t in ts)
    L = len(txt(toks))
    n = -(-L // (MAXC * 2 - 6))
    if n <= 1:
        # duas frases num bloco longo → um bloco por frase
        if L > MAXC:
            for i in range(1, len(toks)):
                if re.search(r'[.!?]$', toks[i - 1][0]) and min(len(txt(toks[:i])), len(txt(toks[i:]))) >= 12:
                    return [toks[:i], toks[i:]]
        return [toks]
    best, bi = None, None
    for i in range(1, len(toks)):
        a, b = txt(toks[:i]), txt(toks[i:])
        if max(len(a), len(b)) > MAXC * 2 - 4 and n == 2: continue
        sc = abs(len(a) - len(b)) * 0.5 + corte(toks[i - 1][0])
        if best is None or sc < best: best, bi = sc, i
    if bi is None: return blocks(toks)
    return blocks_bal(toks[:bi]) + blocks_bal(toks[bi:])


def wrap_bal(txt):
    if len(txt) <= MAXC: return txt
    words = txt.split(' ')
    best, bi = 1e9, 1
    for i in range(1, len(words)):
        a, b = ' '.join(words[:i]), ' '.join(words[i:])
        sc = abs(len(a) - len(b)) + corte(words[i - 1]) * 0.6 + (40 if max(len(a), len(b)) > MAXC + 4 else 0)
        if sc < best: best, bi = sc, i
    return ' '.join(words[:bi]) + '\n' + ' '.join(words[bi:])


def wrap(txt):
    if len(txt) <= MAXC: return txt
    words = txt.split(' ')
    best, bi = 1e9, 1
    for i in range(1, len(words)):
        a, b = ' '.join(words[:i]), ' '.join(words[i:])
        score = abs(len(a) - len(b)) + (0 if re.search(r'[,:;—]$', a) else 6)
        if score < best: best, bi = score, i
    return ' '.join(words[:bi]) + '\n' + ' '.join(words[bi:])


def main():
    tl = json.loads(TL.read_text(encoding='utf-8'))
    cues = []
    subst = tl.get('legenda_subst', [])
    for f in tl['falas']:
        for b in (blocks_bal if BAL else blocks)(tokens(f.get('fala', f['texto']), f['palavras'])):
            txt = ' '.join(t[0] for t in b).replace(' — ', ' – ').replace('...', '…')
            for de, para in subst: txt = re.sub(re.escape(de), para, txt, flags=re.I)
            cues.append((b[0][1] - 0.05, b[-1][2] + 0.25, (wrap_bal if BAL else wrap)(txt.strip())))
    # sem sobreposição
    for i in range(len(cues) - 1):
        if cues[i][1] > cues[i + 1][0] - 0.04: cues[i] = (cues[i][0], cues[i + 1][0] - 0.04, cues[i][2])
    out = TL.parent
    vtt = ['WEBVTT', 'Language: pt-BR', '']
    srt = []
    for i, (a, b, txt) in enumerate(cues, 1):
        vtt += [f'{ts(a)} --> {ts(b)} line:84%', txt, '']
        srt += [str(i), f'{ts(a, ",")} --> {ts(b, ",")}', txt, '']
    (out / 'legendas.pt-BR.vtt').write_text('\n'.join(vtt), encoding='utf-8')
    (out / 'legendas.pt-BR.srt').write_text('\n'.join(srt), encoding='utf-8')
    print(len(cues), 'legendas →', out / 'legendas.pt-BR.vtt')
    for a, b, txt in cues: print(f'  {a:6.2f}–{b:6.2f}  {txt!r}')


if __name__ == '__main__':
    main()
