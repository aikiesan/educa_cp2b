"""Monta videos/<episódio>/timeline.json — a "partitura" que sincroniza animação, narração e música.

uso: python tools/audio/montar_timeline.py [--video 02-pilar-2b] [--estimativa] [--tempo 1.03]

Parâmetros do episódio em videos/<episódio>/partitura.json (trilha: bpm, 1º tempo forte, cortes em compasso,
compasso do logo — ou "logo_musica", o instante exato do golpe final; pausas antes de cada fala; aceleração da narração).
Fontes para os tempos de cada palavra:
  --alinhamento a.json   alinhamento forçado da narração real (alinhar_vo.py) — padrão
  --estimativa           estimativa por sílabas (enquanto não há narração)

As falas entram em sequência com as pausas (a narração é acelerada por --tempo, sem mudar o tom),
começando no tempo forte indicado; a última termina antes da batida final, onde entra o logo.
"""
import json, re, argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def carregar(video):
    vid = ROOT / 'videos' / video
    cfg = json.loads((vid / 'partitura.json').read_text(encoding='utf-8'))
    m = cfg['musica']
    period = 60 / m['bpm']
    grade = {'bpm': m['bpm'], 'periodo': period, 'downbeat0': m['downbeat0'], 'compasso': period * m.get('tempos', 4)}
    grade['bar'] = lambda n: m['downbeat0'] + n * grade['compasso']
    return vid, cfg, grade


def syllables(w):
    groups = re.findall(r'[aeiouáéíóúâêôãõàü]+', w.lower())
    return max(1, len(groups))


def estimate_words(text, t0, rate=6.0):
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
    ap.add_argument('--video', default='01-o-que-e-biogas')
    ap.add_argument('--estimativa', action='store_true')
    ap.add_argument('--alinhamento', default=None)
    ap.add_argument('--tempo', type=float, default=None, help='aceleração da narração (1.0 = original)')
    ap.add_argument('--saida', default=None)
    ap.add_argument('--pausas', type=float, default=1.0, help='escala das pausas entre falas')
    a = ap.parse_args()
    VID, cfg, G = carregar(a.video)
    m = cfg['musica']
    tempo = a.tempo if a.tempo is not None else cfg.get('tempo_narracao', 1.0)
    if 'logo_musica' in m:   # instante exato do golpe final na trilha ORIGINAL → tempo da trilha editada
        LOGO = m['logo_musica'] - sum(c['para'] - c['de'] for c in m.get('cortes', []) if c['para'] <= m['logo_musica'])
    else:
        LOGO = G['bar'](m['logo_compasso'])
    FIM = LOGO + m.get('cauda', 3.35)
    ini = cfg.get('inicio', {'compasso': 0, 'offset': 0.02})
    rot = json.loads((VID / cfg.get('roteiro', 'roteiro.json')).read_text(encoding='utf-8'))
    ali_path = Path(a.alinhamento) if a.alinhamento else VID / 'audio' / 'vo_alinhamento.json'
    ali = None if a.estimativa else json.loads(ali_path.read_text(encoding='utf-8'))
    k = 1.0 / tempo
    falas, t = [], G['bar'](ini['compasso']) + ini.get('offset', 0.02)
    for f in rot['falas']:
        fid = f['id']
        if falas: t = falas[-1]['fim'] + cfg['pausas'].get(fid, 0.5) * a.pausas
        if ali:
            src = ali[fid]
            words = [{'p': w['p'], 'i': round(t + (w['i'] - src['inicio']) * k, 3), 'f': round(t + (w['f'] - src['inicio']) * k, 3)} for w in src['palavras']]
            item = {'id': fid, 'voz': f.get('voz'), 'inicio': round(t, 3), 'fim': words[-1]['f'],
                    'origem': {'inicio': src['inicio'], 'fim': src['fim']}, 'palavras': words}
        else:
            words, end = estimate_words(f.get('fala', f['texto']), t)
            item = {'id': fid, 'voz': f.get('voz'), 'inicio': round(t, 3), 'fim': round(end, 3), 'palavras': words}
        item['texto'] = f['texto']
        if f.get('fala'): item['fala'] = f['fala']
        falas.append(item)
    cortes = [{'de': c['de'], 'para': c['para']} for c in m.get('cortes', [])]
    mus = {'bpm': G['bpm'], 'periodo': G['periodo'], 'downbeat0': G['downbeat0'], 'compasso': G['compasso'], 'logo': round(LOGO, 3)}
    if len(cortes) == 1: mus['corte'] = cortes[0]
    else: mus['cortes'] = cortes
    out = {'fonte': 'alinhamento' if ali else 'estimativa', 'tempo_narracao': tempo, 'duracao': round(FIM, 3), 'musica': mus, 'falas': falas}
    if rot.get('legenda_subst'): out['legenda_subst'] = rot['legenda_subst']
    saida = Path(a.saida) if a.saida else VID / 'timeline.json'
    saida.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    for it in falas:
        b = (it['inicio'] - G['downbeat0']) / G['compasso']
        print(f"{it['id']} {it.get('voz') or '':8s} {it['inicio']:6.2f} → {it['fim']:6.2f}  ({it['fim'] - it['inicio']:.2f}s, compasso {b:5.2f})  {it['texto'][:58]}")
    folga = LOGO - falas[-1]['fim']
    print(f'última fala termina em {falas[-1]["fim"]:.2f}s; logo em {LOGO:.2f}s (folga {folga:.2f}s); fim {FIM:.2f}s')
    if folga < 0.15: print('ATENÇÃO: sem folga antes da batida final — reduza as pausas, aumente --tempo ou mude logo_compasso')


if __name__ == '__main__':
    main()
