"""Produção em lote dos episódios do modelo genérico + índice de entregas.

uso: python tools/episodio/lote.py 03 05 06          # legendas → efeitos → mixagem → 16:9 e 9:16 (e en-GB quando houver)
     python tools/episodio/lote.py --indice           # só refaz dist/LEIA-ME.md
Cada episódio: dist/epNN/<slug>_16x9.mp4, _9x16.mp4 (+ _en-GB_…), com as legendas .srt/.vtt copiadas ao lado.
"""
import json, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PY = sys.executable
sys.path.insert(0, str(Path(__file__).resolve().parent))
import produzir as P


def idiomas(d):
    return ['pt-BR'] + (['en-GB'] if (d / 'timeline.en-GB.json').exists() and (d / 'cena.json').exists() and 'en-GB' in (d / 'cena.json').read_text(encoding='utf-8') else [])


FALHAS = []


def produzir(ep):
    d = P.ep_dir(ep)
    for lang in idiomas(d):
        r = subprocess.run([PY, str(ROOT / 'tools/episodio/produzir.py'), ep, '--idioma', lang, '--etapas', 'legendas,pagina,sfx,mix,render'], cwd=ROOT)
        if r.returncode:   # segue para o próximo episódio; o erro fica no log
            print(f'!! ep. {ep} {lang}: falhou (código {r.returncode})', flush=True); FALHAS.append(f'{ep} {lang}'); continue
        dist = ROOT / 'dist' / f'ep{int(ep):02d}'
        for ext in ('srt', 'vtt'):
            src = d / f'legendas.{lang}.{ext}'
            if src.exists(): shutil.copy(src, dist / f'{d.name[3:]}_legendas.{lang}.{ext}')


def dur(p):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(p)], capture_output=True, text=True).stdout.strip()
    return float(out) if out else 0


def indice():
    linhas = ['# Vídeos educa CP2B — entregas', '',
              'Todos com a marca-d\'água CP2B, em 16:9 (1920×1080, desktop/YouTube) e 9:16 (1080×1920, Stories/Reels); H.264 + AAC, 24 qps.',
              'Legendas separadas (.srt/.vtt) ao lado de cada vídeo.', '', '| ep | título | duração | arquivos |', '|---|---|---|---|']
    for pasta in sorted((ROOT / 'dist').glob('ep[0-9][0-9]')):
        ep = pasta.name[2:]
        vids = sorted(v for v in pasta.glob('*.mp4') if not (ep == '90' and v.name.startswith('vinheta')))
        if not vids: continue
        try:
            rot = next((ROOT / 'videos').glob(f'{ep}-*/roteiro.json'), None)
            titulo = json.loads(rot.read_text(encoding='utf-8'))['titulo'] if rot else ''
        except Exception: titulo = ''
        if ep in ('90', '91'):
            titulo = {'90': 'What is biogas? And biomethane? (en-GB, ep. 01)', '91': 'PILAR-2b: the biogas map of São Paulo (en-GB, ep. 02)'}[ep]
        extras = sorted(p.name for p in pasta.glob('*legendas*'))
        linhas.append(f'| {ep} | {titulo} | {dur(vids[0]):.0f} s | ' + ' · '.join(f'`{v.name}`' for v in vids) + (' · legendas: ' + ', '.join(f'`{e}`' for e in extras) if extras else '') + ' |')
        if ep == '90':   # derivados (tools/episodio/derivados.py): vinheta e pílulas
            vin = sorted(pasta.glob('vinheta_*.mp4'))
            if vin: linhas.append(f'| 90 | Vinheta da série (sem narração) | {dur(vin[0]):.0f} s | ' + ' · '.join(f'`{v.name}`' for v in vin) + ' |')
            for p16 in sorted((pasta / 'pilulas').glob('P*_16x9.mp4')):
                base = p16.name[:-len('_16x9.mp4')]
                pid, nome = base.split('_', 1)
                arqs = sorted((pasta / 'pilulas').glob(base + '_*'))
                nome = {'P1': 'A festa dos micróbios', 'P2': 'Do que é feito o biogás', 'P3': 'Nasce o biometano', 'P4': 'Fechando o ciclo',
                        'P5': '645 municípios', 'P6': 'Na hora', 'P7': 'Base científica'}.get(pid, nome.replace('-', ' '))
                linhas.append(f'| 90 | Pílula {pid} · {nome} | {dur(p16):.0f} s | ' + ' · '.join(f'`pilulas/{a.name}`' for a in arqs) + ' |')
    (ROOT / 'dist' / 'LEIA-ME.md').write_text('\n'.join(linhas) + '\n', encoding='utf-8')
    print('→ dist/LEIA-ME.md')


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    for ep in args: produzir(ep)
    indice()
    if FALHAS: print('falhas:', ', '.join(FALHAS))
