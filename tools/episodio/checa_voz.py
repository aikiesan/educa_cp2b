"""Confere a voz mixada fala a fala: começo sem corte (a voz sobe do silêncio no início da fala) e nada "vazando" na pausa
antes da fala seguinte. E transcreve a fala final (LF) para exigir o nome do centro, "CP2B" (o "Cê" já sumiu uma vez, ep. 06,
quando o alinhamento marcou o início tarde — a mixagem agora recorta de forma adaptativa). Rodar depois do mix.

uso: python tools/episodio/checa_voz.py videos/05-suinos-aves [.en-GB]
"""
import json, sys, numpy as np, soundfile as sf
d = sys.argv[1]; suf = sys.argv[2] if len(sys.argv) > 2 else ''
tl = json.load(open(f'{d}/timeline{suf}.json', encoding='utf-8'))
y, sr = sf.read(f'{d}/audio/mix{suf}_stem_voz.wav', always_2d=True); y = y.mean(1)
hop = int(0.01 * sr); db = 20 * np.log10(np.sqrt(np.convolve(y ** 2, np.ones(hop) / hop, 'same'))[::hop] + 1e-9)
ok = True
lang = suf.lstrip('.') or 'pt-BR'
F = tl['falas']
for i, f in enumerate(F):
    a = int(f['inicio'] * 100)
    pre = db[max(0, a - 25):a - 8]            # 80–250 ms antes do início: tem que ser silêncio
    ini = db[max(0, a - 8):a + 12]            # do começo: tem que subir
    sobe = ini.max() > -40
    limpo = pre.max() < -50 if len(pre) else True
    if i + 1 < len(F):
        b0, b1 = int(f['fim'] * 100) + 30, int(F[i + 1]['inicio'] * 100) - 10
        vaza = db[b0:b1].max() > -45 if b1 > b0 else False
    else: vaza = False
    flag = '' if (sobe and limpo and not vaza) else '  <-- conferir'
    ok &= not flag
    print(f"{f['id']}: antes {pre.max() if len(pre) else -180:6.1f} dB | começo {ini.max():6.1f} dB | pausa depois {'VAZA' if vaza else 'limpa'}{flag}")
# o nome do centro na fala final: transcreve a voz mixada e exige "CP2B" (o "Cê" já sumiu uma vez)
lf = next((f for f in F if f['id'] == 'LF'), None)
if lf and '--sem-nome' not in sys.argv:
    try:
        import os, re, tempfile
        os.environ.setdefault('HF_HUB_DISABLE_SYMLINKS_WARNING', '1')
        from faster_whisper import WhisperModel
        a0 = max(0, lf['inicio'] - 0.6); tmpf = os.path.join(tempfile.gettempdir(), 'checa_lf.wav')
        sf.write(tmpf, y[int(a0 * sr):int((lf['fim'] + 0.3) * sr)], sr)
        segs, _ = WhisperModel('small', device='cpu', compute_type='int8').transcribe(tmpf, language='en' if lang.startswith('en') else 'pt')
        txt = ' '.join(x.text for x in segs).strip()
        nome = re.search(r'c\s*\.?\s*p\s*\.?\s*(2|two|dois)\s*\.?\s*b', txt.lower().replace('-', ' ')) is not None
        print(f'LF ouvido: "{txt}" → nome do centro ' + ('OK' if nome else 'NÃO RECONHECIDO  <-- conferir'))
        ok &= nome
    except Exception as e: print('LF: não deu para transcrever', e)
print('tudo limpo' if ok else 'há falas para conferir')
