"""Gera legendas WebVTT e SRT (pt-BR) a partir do timeline.json (tempos palavra a palavra).

Falas longas são quebradas em blocos de até ~42 caracteres por linha (máx. 2 linhas),
preferindo pontuação; cada bloco começa na 1ª palavra e termina na última.
uso: python tools/legendas.py [videos/01-o-que-e-biogas/timeline.json]
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TL = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'videos' / '01-o-que-e-biogas' / 'timeline.json'
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
    for f in tl['falas']:
        for b in blocks(tokens(f['texto'], f['palavras'])):
            txt = ' '.join(t[0] for t in b).replace(' — ', ' – ').replace('...', '…')
            cues.append((b[0][1] - 0.05, b[-1][2] + 0.25, wrap(txt.strip())))
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
