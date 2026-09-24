"""Monta videos/01-o-que-e-biogas/timeline.json — a "partitura" que sincroniza animação, narração e música.

Fontes para os tempos de cada palavra:
  --alinhamento a.json   alinhamento forçado da narração real (alinhar_vo.py) — padrão
  --estimativa           estimativa por sílabas (enquanto não há narração)

As falas entram em sequência com as pausas de PAUSAS (a narração é acelerada por --tempo, sem mudar o tom),
começando no 1º tempo forte da trilha; a última termina antes da batida final, onde entra o logo.
"""
import json, re, argparse, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
VID = ROOT / 'videos' / '01-o-que-e-biogas'

# grade da trilha editada (The Papercut Invention, 105 bpm; corte c02→c06 = −4 compassos, preserva a frase musical)
BPM = 105.013
PERIOD = 60 / BPM
DOWNBEAT0 = 1.080
BAR = PERIOD * 4
CORTE = {'de': 5.651, 'para': 14.794}      # segundos na trilha original (inícios de compasso)
def bar(n): return DOWNBEAT0 + n * BAR
LOGO = bar(23)          # batida final ("ta-da") da trilha editada
FIM = LOGO + 3.35       # quadro final

INICIO_L01 = bar(0) + 0.02
# pausa ANTES de cada fala (s): trocas de cena ganham um respiro maior
PAUSAS = {'L02': 0.55, 'L03': 0.55, 'L04': 0.30, 'L05': 0.55, 'L06': 0.20, 'L07': 0.50, 'L08': 0.50, 'L09': 0.50, 'L10': 0.50, 'L11': 0.55}


def syllables(w):
    groups = re.findall(r'[aeiouáéíóúâêôãõàü]+', w.lower())
    return max(1, len(groups))


def estimate_words(text, t0, rate=6.4):
    toks = re.findall(r"[\wÀ-ÿ]+|[—…,.:;!?]", text)
    t, words = t0, []
    for tok in toks:
        if re.match(r'[\wÀ-ÿ]', tok):
            d = syllables(tok) / rate + 0.03
            words.append({'p': tok, 'i': round(t, 3), 'f': round(t + d, 3)}); t += d
        else:
            t += {',': 0.16, ':': 0.28, '—': 0.24, '.': 0.3, '…': 0.42, '!': 0.25, '?': 0.25}.get(tok, 0.1)
    return words, words[-1]['f']


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--estimativa', action='store_true')
    ap.add_argument('--alinhamento', default=str(VID / 'audio' / 'vo_alinhamento.json'))
    ap.add_argument('--tempo', type=float, default=1.035, help='aceleração da narração (1.0 = original)')
    ap.add_argument('--saida', default=str(VID / 'timeline.json'))
    ap.add_argument('--pausas', type=float, default=1.0, help='escala das pausas entre falas')
    a = ap.parse_args()
    rot = json.loads((VID / 'roteiro.json').read_text(encoding='utf-8'))
    ali = None if a.estimativa else json.loads(Path(a.alinhamento).read_text(encoding='utf-8'))
    k = 1.0 / a.tempo
    falas, t = [], INICIO_L01
    for f in rot['falas']:
        fid = f['id']
        if falas: t = falas[-1]['fim'] + PAUSAS.get(fid, 0.5) * a.pausas
        if ali:
            src = ali[fid]
            words = [{'p': w['p'], 'i': round(t + (w['i'] - src['inicio']) * k, 3), 'f': round(t + (w['f'] - src['inicio']) * k, 3)} for w in src['palavras']]
            item = {'id': fid, 'voz': f.get('voz'), 'inicio': round(t, 3), 'fim': words[-1]['f'],
                    'origem': {'inicio': src['inicio'], 'fim': src['fim']}, 'palavras': words}
        else:
            words, end = estimate_words(f['texto'], t)
            item = {'id': fid, 'voz': f.get('voz'), 'inicio': round(t, 3), 'fim': round(end, 3), 'palavras': words}
        item['texto'] = f['texto']
        falas.append(item)
    out = {
        'fonte': 'alinhamento' if ali else 'estimativa', 'tempo_narracao': a.tempo,
        'duracao': round(FIM, 3),
        'musica': {'bpm': BPM, 'periodo': PERIOD, 'downbeat0': DOWNBEAT0, 'compasso': BAR, 'logo': round(LOGO, 3), 'corte': CORTE},
        'falas': falas,
    }
    Path(a.saida).write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    for it in falas:
        b = (it['inicio'] - DOWNBEAT0) / BAR
        print(f"{it['id']} {it.get('voz') or '':8s} {it['inicio']:6.2f} → {it['fim']:6.2f}  ({it['fim'] - it['inicio']:.2f}s, compasso {b:5.2f})  {it['texto'][:58]}")
    folga = LOGO - falas[-1]['fim']
    print(f'última fala termina em {falas[-1]["fim"]:.2f}s; logo em {LOGO:.2f}s (folga {folga:.2f}s); fim {FIM:.2f}s')
    if folga < 0.15: print('ATENÇÃO: sem folga antes da batida final — reduza PAUSAS ou aumente --tempo')


if __name__ == '__main__':
    main()
