"""Versões em inglês dos eps. 01 e 02 (eps. 90 e 91): a MESMA cena (cena.js, com ?idioma=en-GB para os textos da tela),
voz e legendas en-GB, na trilha do episódio de origem.

uso: python tools/episodio/derivado_en.py 90            # ep. 01 em inglês → dist/ep90/o-que-e-biogas_en-GB_16x9.mp4 e _9x16.mp4
     python tools/episodio/derivado_en.py 91 --etapas preparar,quadros
Etapas: preparar (roteiro + alinhamento + partitura + legendas + timeline da cena) · sfx · mix · quadros · render

A cena antiga marca tempos por palavras em português (at('L07', 'eletricidade')). A timeline da cena em inglês mantém essas
palavras, com os tempos levados proporcionalmente para dentro de cada fala em inglês; as legendas usam as palavras em inglês.
"""
import argparse, json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import produzir as P

ROOT = P.ROOT
LANG = 'en-GB'
MAP = {'90': ('01-o-que-e-biogas', 'entrada/musica/The_Papercut_Invention.mp3', 'o-que-e-biogas'),
       '91': ('02-pilar-2b', 'entrada/musica/Sunlight_on_the_Workbench.mp3', 'pilar-2b')}


def preparar(ep, d, o):
    P.etapa_roteiro(ep, LANG, d)
    P.etapa_alinhar(ep, LANG, d)
    P.etapa_partitura(ep, LANG, d, argparse.Namespace(musica=MAP[ep][1], tempo=o.tempo, pausa=o.pausa))
    P.etapa_legendas(ep, LANG, d)                      # legendas.en-GB.* a partir das palavras em inglês
    en_path = d / 'timeline.en-GB.json'
    en = json.loads(en_path.read_text(encoding='utf-8'))
    (d / 'audio' / 'timeline.en-GB.palavras.json').write_text(json.dumps(en, ensure_ascii=False, indent=1), encoding='utf-8')
    pt = {f['id']: f for f in json.loads((d / 'timeline.json').read_text(encoding='utf-8'))['falas']}
    for f in en['falas']:
        src = pt.get(f['id'])
        if not src: continue
        k = (f['fim'] - f['inicio']) / max(0.01, src['fim'] - src['inicio'])
        f['palavras'] = [{'p': w['p'], 'i': round(f['inicio'] + (w['i'] - src['inicio']) * k, 3), 'f': round(f['inicio'] + (w['f'] - src['inicio']) * k, 3)} for w in src['palavras']]
    en['_nota'] = 'palavras = âncoras em português (a cena as procura), com tempos levados para as falas em inglês; legendas: audio/timeline.en-GB.palavras.json'
    en_path.write_text(json.dumps(en, ensure_ascii=False, indent=1), encoding='utf-8')
    print('timeline da cena:', P.rel(en_path))


def query(fmt):
    return f'tl=timeline.en-GB.json&idioma={LANG}' + ('&formato=vertical' if fmt == 'v' else '')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('ep', choices=sorted(MAP))
    ap.add_argument('--etapas', default='preparar,sfx,mix,render')
    ap.add_argument('--formatos', default='h,v')
    ap.add_argument('--tempo', type=float, default=None)
    ap.add_argument('--pausa', type=float, default=0.55)
    ap.add_argument('--crf', type=int, default=21)
    ap.add_argument('--workers', type=int, default=3)
    o = ap.parse_args()
    folder, musica, slug = MAP[o.ep]
    d = ROOT / 'videos' / folder
    et = o.etapas.split(',')
    page = P.rel(d / 'index.html')
    if 'preparar' in et: preparar(o.ep, d, o)
    if 'sfx' in et: P.run('node', 'tools/render.mjs', page, '--query', query('h'), '--sfx-out', P.rel(d / 'audio' / 'sfx_cues.en-GB.json'))
    if 'mix' in et:
        rot = json.loads((d / 'roteiro.en-GB.json').read_text(encoding='utf-8'))
        P.run(P.PY, 'tools/audio/mixar.py', '--video', folder, '--vo', rot['narracao']['arquivo'], '--musica', musica,
              '--timeline', P.rel(d / 'timeline.en-GB.json'), '--cues', P.rel(d / 'audio' / 'sfx_cues.en-GB.json'), '--saida', P.rel(d / 'audio' / 'mix.en-GB'))
    if 'quadros' in et:
        tl = json.loads((d / 'timeline.en-GB.json').read_text(encoding='utf-8'))
        ts = [round(f['inicio'] + 0.72 * (f['fim'] - f['inicio']), 2) for f in tl['falas'] if f['id'] != 'LF'] + [round(tl['musica']['logo'] + 1.6, 2)]
        for fmt in o.formatos.split(','):
            out = ROOT / 'tmp' / 'quadros' / f'ep{o.ep}_{fmt}'
            out.mkdir(parents=True, exist_ok=True)
            P.run('node', 'tools/render.mjs', page, '--query', query(fmt), '--stills', ','.join(map(str, ts)), '--out', P.rel(out))
            P.folha(out, ts, ROOT / 'tmp' / 'quadros' / f'ep{o.ep}_{fmt}.jpg', fmt)
    if 'render' in et:
        dist = ROOT / 'dist' / f'ep{o.ep}'
        dist.mkdir(parents=True, exist_ok=True)
        for fmt in o.formatos.split(','):
            nome = f'{slug}_en-GB_{"16x9" if fmt == "h" else "9x16"}.mp4'
            P.run('node', 'tools/render.mjs', page, '--query', query(fmt), '--video', P.rel(dist / nome), '--audio', P.rel(d / 'audio' / 'mix.en-GB.wav'),
                  '--fps', '24', '--crf', str(o.crf), '--workers', str(o.workers))


if __name__ == '__main__':
    main()
