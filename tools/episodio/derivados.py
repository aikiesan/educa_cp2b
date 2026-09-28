"""Derivados do ep. 90 (roteiros/90-derivados.md): vinheta da série e pílulas, em 16:9 e 9:16.

uso: python tools/episodio/derivados.py vinheta     # videos/vinheta (motor genérico) → dist/ep90/vinheta_16x9.mp4 e _9x16.mp4
     python tools/episodio/derivados.py pilulas     # recortes dos eps. 01/02 + a assinatura CP2B → dist/ep90/pilulas/

Vinheta: sem narração; o Metaninho de crochê cai no quadro, a bolinha de cima vira chama azul, a câmera se aproxima e
entra o cartão do logo no golpe final ("ta-da") da trilha entrada/musica/_avulsas/musica_ep90.mp3.
Pílulas: um trecho de um episódio pronto + o cartão final do próprio episódio (a trilha termina no golpe final),
com fusão curta entre os dois; as legendas do trecho vão junto (.srt/.vtt).
"""
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools' / 'episodio')); sys.path.insert(0, str(ROOT / 'tools' / 'audio'))
import produzir as P

DIST = ROOT / 'dist' / 'ep90'
MUSICA_VINHETA = ROOT / 'entrada' / 'musica' / '_avulsas' / 'musica_ep90.mp3'
# pílula: (id, título curto, pasta de origem, primeira fala, última fala)
PILULAS = [
    ('P1', 'festa-dos-microbios', '01-o-que-e-biogas', 'L03', 'L04'),
    ('P2', 'do-que-e-feito-o-biogas', '01-o-que-e-biogas', 'L05', 'L06'),
    ('P3', 'nasce-o-biometano', '01-o-que-e-biogas', 'L08', 'L09'),
    ('P4', 'fechando-o-ciclo', '01-o-que-e-biogas', 'L10', 'L10'),
    ('P5', '645-municipios', '02-pilar-2b', 'L02', 'L02'),
    ('P6', 'na-hora', '02-pilar-2b', 'L06', 'L06'),
    ('P7', 'base-cientifica', '02-pilar-2b', 'L07', 'L07'),
]
# vídeos de origem (entregas dos eps. 01/02, sem legenda gravada)
ORIGEM = {'01-o-que-e-biogas': {'16x9': 'dist/ep01/o-que-e-biogas.mp4', '9x16': 'dist/ep01/o-que-e-biogas_vertical.mp4'},
          '02-pilar-2b': {'16x9': 'dist/ep02/pilar-2b.mp4', '9x16': 'dist/ep02/pilar-2b_vertical.mp4'}}
FUSAO = 0.3


def run(*a):
    print('  $', ' '.join(map(str, a))[:220])
    subprocess.run([str(x) for x in a], cwd=ROOT, check=True)


# ---------------------------------------------------------------- vinheta
CENA_VINHETA = {
    "_sobre": "Vinheta da série educa CP2B (ep. 90 · derivados): o Metaninho de crochê cai no quadro, a bolinha de cima vira chama azul, a câmera se aproxima e entra o cartão do logo no 'ta-da'. Gerada por tools/episodio/derivados.py.",
    "estilo": "C",
    "seed": 90,
    "assinatura": {"texto": "educa CP2B"},
    "cenas": [
        {"fala": "L01", "arranjo": "palco", "empurra": 0.02,
         "cam": [{"em": 1.25, "alvo": "m", "z": 1.45, "d": 0.9}],
         "itens": [
             {"p": "mascote:em_pe", "id": "m", "em": 0.2, "entra": "cai", "s": 0.82},
             {"fx": "chama", "sobre": "m", "rel": [0.0, -0.47], "tam": 0.34, "em": 1.05},
             {"fx": "brilho", "sobre": "m", "rel": [0.0, -0.4], "tam": 0.6, "em": 1.1, "n": 5},
             {"txt": "educa CP2B", "tipo": "mao", "lugar": "rodape", "em": 0.5, "cor": "petrol"},
         ]},
    ],
}


def vinheta():
    d = ROOT / 'videos' / 'vinheta'
    (d / 'audio').mkdir(parents=True, exist_ok=True)
    an = P.analisar(MUSICA_VINHETA)
    hit = an['logo']
    antes = [x for x in an['down'] if x <= hit - 2.2]
    inicio = antes[-1] if antes else max(0.0, hit - 2.6)
    logo = round(hit - inicio, 3)
    dur = round(logo + 2.6, 3)
    print(f'vinheta: golpe final {hit:.2f}s → trilha a partir de {inicio:.2f}s, logo em {logo:.2f}s, {dur:.2f}s')
    tl = {'fonte': 'tools/episodio/derivados.py (sem narração)', 'tempo_narracao': 1.0, 'duracao': dur,
          'musica': {'bpm': an['bpm'], 'periodo': an['period'], 'downbeat0': 0.0, 'compasso': 4 * an['period'], 'logo': logo,
                     'cortes': [{'de': 0.0, 'para': round(inicio, 3)}]},
          'falas': [{'id': 'L01', 'voz': '-', 'inicio': 0.2, 'fim': round(logo - 0.1, 3), 'palavras': [], 'texto': ''}]}
    (d / 'timeline.json').write_text(json.dumps(tl, ensure_ascii=False, indent=1), encoding='utf-8')
    (d / 'cena.json').write_text(json.dumps(CENA_VINHETA, ensure_ascii=False, indent=1), encoding='utf-8')
    (d / 'index.html').write_text(P.PAGINA.replace('{{TITULO}}', 'educa CP2B · vinheta'), encoding='utf-8')
    cues = d / 'audio' / 'sfx_cues.json'
    run('node', 'tools/render.mjs', P.rel(d / 'index.html'), '--query', 'idioma=pt-BR', '--sfx-out', P.rel(cues))
    mix_sem_voz(tl, cues, d / 'audio' / 'mix')
    DIST.mkdir(parents=True, exist_ok=True)
    for fmt, q in (('16x9', 'idioma=pt-BR'), ('9x16', 'idioma=pt-BR&formato=vertical')):
        run('node', 'tools/render.mjs', P.rel(d / 'index.html'), '--query', q, '--video', P.rel(DIST / f'vinheta_{fmt}.mp4'),
            '--audio', P.rel(d / 'audio' / 'mix.wav'), '--fps', '24', '--crf', '21', '--workers', '3')


def mix_sem_voz(tl, cues_path, saida):
    """trilha + efeitos, sem narração (a mixagem normal pede uma voz): mesmos níveis e o mesmo master da série."""
    import numpy as np, soundfile as sf
    import mixar as M
    from pedalboard import Pedalboard, Compressor, Limiter
    M.set_video('vinheta')
    n = int(tl['duracao'] * M.SR)
    mus, _ = M.build_music(tl, str(MUSICA_VINHETA))
    fx = M.build_sfx(json.loads(Path(cues_path).read_text(encoding='utf-8')), n)
    mix = M.gain_to(mus, -17.0) + M.gain_to(fx, -23.0)
    mix = Pedalboard([Compressor(threshold_db=-16, ratio=1.8, attack_ms=25, release_ms=250), Limiter(threshold_db=-1.5, release_ms=80)])(mix.T, M.SR).T
    mix = M.gain_to(mix, -15.0)
    peak = np.max(np.abs(mix))
    if peak > 0.89: mix *= 0.89 / peak   # ≤ −1 dBFS
    sf.write(str(saida) + '.wav', mix.astype(np.float32), M.SR, subtype='PCM_24')
    print(f'  mix da vinheta: {M.lufs(mix):.1f} LUFS → {P.rel(Path(str(saida) + ".wav"))}')


# ---------------------------------------------------------------- pílulas
def ts(t, sep='.'):
    h, r = divmod(max(0.0, t), 3600); m, s = divmod(r, 60)
    return f'{int(h):02d}:{int(m):02d}:{s:06.3f}'.replace('.', sep)


def legendas_trecho(vtt, a, b):
    """cues do .vtt de origem que caem em [a, b], com o tempo relativo ao começo do trecho."""
    sec = lambda s: sum(float(x) * k for x, k in zip(s.split(':'), (3600, 60, 1)))
    out = []
    for bloco in re.split(r'\r?\n\r?\n', vtt.read_text(encoding='utf-8')):
        ls = bloco.strip().splitlines()
        i = next((k for k, ln in enumerate(ls) if '-->' in ln), None)
        if i is None: continue
        t0, t1 = (sec(x.strip().split(' ')[0]) for x in ls[i].split('-->'))
        if t1 <= a + 0.05 or t0 >= b - 0.05: continue
        out.append((max(0.0, t0 - a), min(b, t1) - a, '\n'.join(ls[i + 1:])))
    return out


def pilulas():
    (DIST / 'pilulas').mkdir(parents=True, exist_ok=True)
    for pid, nome, pasta, f0, f1 in PILULAS:
        d = ROOT / 'videos' / pasta
        tl = json.loads((d / 'timeline.json').read_text(encoding='utf-8'))
        F = {f['id']: f for f in tl['falas']}
        a = max(0.0, F[f0]['inicio'] - 0.3)
        b = F[f1]['fim'] + 0.35
        cauda = tl['musica']['logo'] - 0.25            # o cartão final entra no golpe final da trilha
        fim = tl['duracao']
        seg = b - a
        print(f'{pid} {nome}: {pasta} {a:.2f}–{b:.2f}s + cartão {cauda:.2f}–{fim:.2f}s → {seg + fim - cauda - FUSAO:.1f}s')
        for fmt, src in ORIGEM[pasta].items():
            out = DIST / 'pilulas' / f'{pid}_{nome}_{fmt}.mp4'
            fc = (f'[0:v]trim=start={a:.3f}:end={b:.3f},setpts=PTS-STARTPTS[v1];[0:v]trim=start={cauda:.3f}:end={fim:.3f},setpts=PTS-STARTPTS[v2];'
                  f'[v1][v2]xfade=transition=fade:duration={FUSAO}:offset={seg - FUSAO:.3f},format=yuv420p[v];'
                  f'[0:a]atrim=start={a:.3f}:end={b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.12[a1];[0:a]atrim=start={cauda:.3f}:end={fim:.3f},asetpts=PTS-STARTPTS[a2];'
                  f'[a1][a2]acrossfade=d={FUSAO}:c1=tri:c2=tri[a]')
            run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-filter_complex', fc, '-map', '[v]', '-map', '[a]',
                '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-r', '24', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', P.rel(out))
        cues = legendas_trecho(d / 'legendas.pt-BR.vtt', a, b)
        base = DIST / 'pilulas' / f'{pid}_{nome}_legendas.pt-BR'
        vtt = ['WEBVTT', 'Language: pt-BR', ''] + [ln for c in cues for ln in (f'{ts(c[0])} --> {ts(c[1])} line:84%', c[2], '')]
        srt = [ln for k, c in enumerate(cues, 1) for ln in (str(k), f'{ts(c[0], ",")} --> {ts(c[1], ",")}', c[2], '')]
        Path(str(base) + '.vtt').write_text('\n'.join(vtt), encoding='utf-8')
        Path(str(base) + '.srt').write_text('\n'.join(srt), encoding='utf-8')


if __name__ == '__main__':
    alvo = sys.argv[1] if len(sys.argv) > 1 else ''
    if alvo == 'vinheta': vinheta()
    elif alvo == 'pilulas': pilulas()
    else: print(__doc__)
