"""Produção de um episódio no modelo genérico (lib/colagem/episodio.js + videos/NN-slug/cena.json).

uso: python tools/episodio/produzir.py 04                         # todas as etapas, pt-BR
     python tools/episodio/produzir.py 03 --idioma en-GB          # versão em inglês (mesma cena, textos em en-GB)
     python tools/episodio/produzir.py 04 --etapas partitura,legendas,sfx,mix
     python tools/episodio/produzir.py 04 --etapas quadros         # quadros de revisão (tmp/quadros/epNN_<fmt>/)
Etapas: roteiro · alinhar · partitura · legendas · pagina · sfx · mix · quadros · render   (padrão: todas menos quadros)

- roteiro:   roteiros/NN-*.md (bloco ```narracao <idioma>```) → roteiro[.<idioma>].json, com legenda_subst automático
- alinhar:   narração (entrada/narracao/<idioma>/epNN_<idioma>_<voz>_take1.wav) → tempos palavra a palavra (faster-whisper)
- partitura: análise da trilha (entrada/musica/musica_epNN.mp3): grade, golpe final ("ta-da"), cortes/repetições de compasso
             para caber a narração, pausas; a fala LF entra sobre o cartão final → partitura.json + timeline[.<idioma>].json
- legendas → legendas.<idioma>.vtt/.srt · pagina → index.html · sfx → audio/sfx_cues · mix → audio/mix[.<idioma>].wav/.m4a
- render:    dist/epNN/<slug>[_<idioma>]_16x9.mp4 e _9x16.mp4 (marca-d'água CP2B nos dois)
Requer: librosa, faster-whisper (GPU), pedalboard, pyloudnorm, soundfile; node + playwright; ffmpeg com rubberband.
"""
import argparse, difflib, glob, json, os, re, subprocess, sys, unicodedata
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
PY = sys.executable
PUNCT = ',.;:!?…—-'
WTOK = re.compile(r"[\wÀ-ÿ']+")
LTOK = re.compile(r"[\wÀ-ÿ']+[^\s\wÀ-ÿ']*|[—…]+|\.\.\.")   # mesmo recorte de tools/legendas.py


def nrm(s):
    s = unicodedata.normalize('NFKD', str(s).lower())
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in s if not unicodedata.combining(c)))


def roteiro_md(ep):
    fs = sorted(ROOT.glob(f'roteiros/{int(ep):02d}-*.md'))
    if not fs: sys.exit(f'sem roteiro para o ep. {ep}')
    return fs[0]


def ep_dir(ep):
    ex = sorted(p for p in (ROOT / 'videos').glob(f'{int(ep):02d}-*') if p.is_dir())
    d = ex[0] if ex else ROOT / 'videos' / roteiro_md(ep).stem
    (d / 'audio').mkdir(parents=True, exist_ok=True)
    return d


def suf(lang): return '' if lang == 'pt-BR' else '.' + lang


def rel(p): return Path(p).resolve().relative_to(ROOT).as_posix()


# ---------------- roteiro ----------------
def ler_narracao(md, lang):
    s = md.read_text(encoding='utf-8')
    m = re.search(r'```narracao ' + re.escape(lang) + r'\n(.*?)```', s, re.S)
    if not m: sys.exit(f'{md.name}: sem bloco ```narracao {lang}')
    falas = []
    for ln in m.group(1).strip().splitlines():
        if not ln.strip(): continue
        parts = [p.strip() for p in ln.split('|')]
        f = {'id': parts[0], 'texto': parts[1]}
        for p in parts[2:]:
            if p.startswith('fala:'): f['fala'] = p[5:].strip()
        falas.append(f)
    titulo = re.match(r'# \d+ · (.+)', s).group(1).strip()
    return titulo, falas


def subst_pairs(falas):
    pairs = []
    for f in falas:
        if 'fala' not in f: continue
        a = [t for t in LTOK.findall(f['fala']) if WTOK.match(t)]
        b = [t for t in LTOK.findall(f['texto']) if WTOK.match(t)]
        sm = difflib.SequenceMatcher(None, [nrm(t) for t in a], [nrm(t) for t in b], autojunk=False)
        for tag, i1, i2, j1, j2 in sm.get_opcodes():
            if tag != 'replace': continue
            de, para = ' '.join(a[i1:i2]).rstrip(PUNCT), ' '.join(b[j1:j2]).rstrip(PUNCT)
            if de and para and [de, para] not in pairs: pairs.append([de, para])
    pairs.sort(key=lambda p: -len(p[0]))
    return pairs


def voz_do_arquivo(ep, lang):
    fs = sorted(ROOT.glob(f'entrada/narracao/{lang}/ep{int(ep):02d}_{lang}_*_take1.wav'))
    if not fs: sys.exit(f'sem narração: entrada/narracao/{lang}/ep{int(ep):02d}_{lang}_*_take1.wav')
    return fs[0], fs[0].stem.split('_')[2]


def etapa_roteiro(ep, lang, d):
    titulo, falas = ler_narracao(roteiro_md(ep), lang)
    wav, voz = voz_do_arquivo(ep, lang)
    for f in falas: f['voz'] = voz
    out = {'titulo': titulo, 'idioma': lang, 'narracao': {'arquivo': rel(wav), 'voz': voz}, 'legenda_subst': subst_pairs(falas), 'falas': falas}
    (d / f'roteiro{suf(lang)}.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f'roteiro: {len(falas)} falas, {len(out["legenda_subst"])} substituições de legenda')


# ---------------- alinhar ----------------
def whisper_words(wav, lang):
    import site
    for sp in site.getsitepackages():
        for dd in glob.glob(os.path.join(sp, 'nvidia', '*', 'bin')):
            os.add_dll_directory(dd); os.environ['PATH'] = dd + os.pathsep + os.environ['PATH']
    import soundfile as sf
    from scipy.signal import resample_poly
    from faster_whisper import WhisperModel
    y, sr = sf.read(str(wav), dtype='float32')
    if y.ndim > 1: y = y.mean(1)
    y = resample_poly(y, 16000, sr).astype(np.float32)
    try: m = WhisperModel('mobiuslabsgmbh/faster-whisper-large-v3-turbo', device='cuda', compute_type='float16', local_files_only=True)
    except Exception: m = WhisperModel('mobiuslabsgmbh/faster-whisper-large-v3-turbo', device='cpu', compute_type='int8', local_files_only=True)
    segs, _ = m.transcribe(y, language=lang[:2], beam_size=5, word_timestamps=True, condition_on_previous_text=False)
    ws = []
    for s in segs:
        for w in s.words:
            for k, part in enumerate(WTOK.findall(w.word) or [w.word]):
                ws.append((part, w.start, w.end))
    return ws


def etapa_alinhar(ep, lang, d):
    rot = json.loads((d / f'roteiro{suf(lang)}.json').read_text(encoding='utf-8'))
    wav = ROOT / rot['narracao']['arquivo']
    ws = whisper_words(wav, lang)
    script = [(f['id'], t) for f in rot['falas'] for t in WTOK.findall(f.get('fala', f['texto']))]
    A, B = [nrm(t) for _, t in script], [nrm(w[0]) for w in ws]
    sm = difflib.SequenceMatcher(None, A, B, autojunk=False)
    tim = [None] * len(script)
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal':
            for k in range(i2 - i1): tim[i1 + k] = (ws[j1 + k][1], ws[j1 + k][2], 1.0)
        elif tag == 'replace':
            t0, t1 = ws[j1][1], ws[j2 - 1][2]
            L = [max(1, len(script[i][1])) for i in range(i1, i2)]
            acc, tot = 0, sum(L)
            for k, i in enumerate(range(i1, i2)):
                a = t0 + (t1 - t0) * acc / tot; acc += L[k]; tim[i] = (a, t0 + (t1 - t0) * acc / tot, 0.5)
    # sem correspondência: interpola entre vizinhos
    for i in range(len(tim)):
        if tim[i] is None:
            j = i
            while j < len(tim) and tim[j] is None: j += 1
            a = tim[i - 1][1] if i > 0 and tim[i - 1] else 0.0
            b = tim[j][0] if j < len(tim) and tim[j] else a + 0.3 * (j - i)
            n = j - i
            for k in range(n): tim[i + k] = (a + (b - a) * k / n, a + (b - a) * (k + 1) / n, 0.0)
    ali, k = {}, 0
    for f in rot['falas']:
        n = len(WTOK.findall(f.get('fala', f['texto'])))
        pw = [{'p': script[k + q][1], 'i': round(tim[k + q][0], 3), 'f': round(max(tim[k + q][1], tim[k + q][0] + 0.04), 3), 'score': tim[k + q][2]} for q in range(n)]
        k += n
        ali[f['id']] = {'palavras': pw, 'inicio': pw[0]['i'], 'fim': pw[-1]['f'], 'arquivo': wav.name}
    (d / 'audio' / f'vo_alinhamento{suf(lang)}.json').write_text(json.dumps(ali, ensure_ascii=False, indent=1), encoding='utf-8')
    fraco = [fid for fid, a in ali.items() if np.mean([w['score'] for w in a['palavras']]) < 0.6]
    print(f'alinhar: {len(ws)} palavras ouvidas, {len(script)} no roteiro; falas com casamento fraco: {fraco or "nenhuma"}')


# ---------------- partitura ----------------
def analisar(mp3):
    import librosa
    y, sr = librosa.load(str(mp3), sr=22050, mono=True)
    dur = len(y) / sr
    hop = 256
    oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop, aggregate=np.median)
    _, beats = librosa.beat.beat_track(onset_envelope=oenv, sr=sr, hop_length=hop, tightness=400, units='frames')
    bt = librosa.frames_to_time(beats, sr=sr, hop_length=hop)
    k = np.arange(len(bt))
    period, t0 = np.linalg.lstsq(np.vstack([k, np.ones_like(k)]).T, bt, rcond=None)[0]
    if t0 < 0: t0 += period * np.ceil(-t0 / period)
    ideal = t0 + period * np.arange(int((dur - t0) / period) + 1)
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=hop))
    freqs = librosa.fft_frequencies(sr=sr, n_fft=2048)
    low = S[(freqs > 30) & (freqs < 150)].sum(0)
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr, hop_length=hop)
    fr = librosa.time_to_frames(ideal, sr=sr, hop_length=hop); fr = fr[fr < S.shape[1] - 6]; ideal = ideal[:len(fr)]
    lowb = np.array([low[f:f + 6].max() for f in fr])
    chb = librosa.util.sync(chroma, fr, aggregate=np.median)
    chg = np.r_[0, np.linalg.norm(np.diff(chb, axis=1), axis=0)][:len(fr)]
    oens = np.array([oenv[f:f + 4].max() for f in fr])
    scores = [lowb[p::4].mean() / lowb.mean() + chg[p::4].mean() / (chg.mean() + 1e-9) + 0.5 * oens[p::4].mean() / oens.mean() for p in range(4)]
    down = ideal[int(np.argmax(scores))::4]
    mf = librosa.feature.mfcc(y=y, sr=sr, hop_length=hop, n_mfcc=20)
    bf = librosa.time_to_frames(down, sr=sr, hop_length=hop)
    feats = [np.r_[mf[:, bf[i]:bf[i + 1]].mean(1) / 30, chroma[:, bf[i]:bf[i + 1]].mean(1) * 2, np.log1p(S[:, bf[i]:bf[i + 1]].mean()) * np.ones(1)] for i in range(len(bf) - 1)]
    F = np.array(feats); F = (F - F.mean(0)) / (F.std(0) + 1e-9)
    D = np.linalg.norm(F[:, None] - F[None], axis=-1)
    # golpe final: o último ataque forte antes da cauda
    h2 = 512
    rms = librosa.feature.rms(y=y, hop_length=h2)[0]; tr = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=h2)
    on2 = librosa.onset.onset_strength(y=y, sr=sr, hop_length=h2)
    loud = np.percentile(rms, 90)
    iend = np.where(rms > 0.3 * loud)[0][-1]
    win = (tr >= tr[iend] - 3.5) & (tr <= tr[iend] + 0.1)
    idx = np.where(win)[0]
    peaks = [i for i in idx[1:-1] if on2[i] >= on2[i - 1] and on2[i] >= on2[i + 1] and on2[i] > 0.45 * on2[idx].max()]
    logo = float(tr[peaks[-1]]) if peaks else float(tr[iend] - 1.0)
    # começo: primeiro som
    ion = np.where(rms > 0.03 * loud)[0][0]
    return {'dur': dur, 'period': float(period), 'bpm': 60 / float(period), 'down': [float(x) for x in down], 'D': D, 'logo': logo,
            'inicio_som': float(tr[ion])}


def escolhe_saltos(an, barras, logo_bar=None, max_saltos=3):
    """conjunto de saltos entre compassos parecidos (i ≈ j) que soma exatamente `barras` compassos, com o menor custo:
    distância timbral/harmônica dos compassos + penalidade por emenda; evita a introdução e a cadência final."""
    D, n = an['D'], an['D'].shape[0]
    lb = min(n - 1, logo_bar if logo_bar is not None else n - 2)
    cands = []
    for i in range(3, lb - 2):
        for j in range(i + 1, min(lb - 2, i + 17)):
            cands.append((float(D[i, j] + 0.5 * D[i - 1, j - 1]), i, j))
    if not cands or barras < 1: return []
    cands.sort()
    cands = cands[:400]
    PEN = 0.8
    best = None
    for c in cands:
        if c[2] - c[1] == barras and (best is None or c[0] + PEN < best[0]): best = (c[0] + PEN, [c])
    if max_saltos >= 2:
        for x in range(len(cands)):
            a = cands[x]
            for y in range(x + 1, len(cands)):
                b = cands[y]
                if (a[2] - a[1]) + (b[2] - b[1]) != barras: continue
                if not (a[2] < b[1] or b[2] < a[1]): continue
                cost = a[0] + b[0] + 2 * PEN
                if best is None or cost < best[0]: best = (cost, [a, b])
    if best is None and max_saltos >= 3:   # guloso
        esc, rest = [], barras
        for c in cands:
            k = c[2] - c[1]
            if k > rest or any(not (c[2] < e[1] or e[2] < c[1]) for e in esc): continue
            esc.append(c); rest -= k
            if rest == 0: break
        if rest == 0: best = (0, esc)
    return best[1] if best else []


def refina_limites(ali, wav):
    """Ajusta início e fim de cada fala ao som de verdade (energia da voz), em vez de confiar só no reconhecedor:
    o reconhecedor às vezes começa a palavra tarde (corta o "R" de "Resíduo") ou termina cedo (o "…or" de "exterior"
    vai parar no começo da fala seguinte). Falas em ordem; nunca invade a fala anterior."""
    import soundfile as sf
    y, sr = sf.read(str(wav), always_2d=True)
    y = y.mean(1)
    hop = int(0.01 * sr)
    rms = np.sqrt(np.convolve(y ** 2, np.ones(hop) / hop, 'same'))[::hop]
    db = 20 * np.log10(rms + 1e-9)
    ruido, fala = np.percentile(db, 10), np.median(db[db > np.percentile(db, 60)])
    thr = max(ruido + 14, fala - 30)          # quadro de voz
    voz = db > thr
    n = len(voz)
    def silencio_de(i, passo, minimo):         # anda até achar um silêncio de pelo menos `minimo` quadros
        k, run = i, 0
        while 0 <= k < n:
            run = run + 1 if not voz[k] else 0
            if run >= minimo: return k - passo * (minimo - 1)
            k += passo
        return max(0, min(n - 1, k))
    out, fim_ant = {}, 0.0
    for fid in sorted(ali, key=lambda f: ali[f]['inicio']):
        a = dict(ali[fid]); w = [dict(x) for x in a['palavras']]
        i0 = max(int(a['inicio'] * 100), int((fim_ant + 0.06) * 100))
        if i0 < n and not voz[i0]:              # começou no silêncio: a voz vem logo depois
            k = i0
            while k < n and not voz[k] and k - i0 < 110: k += 1
            ini = k / 100 if k - i0 < 110 else a['inicio']
        else:                                   # começou no meio da voz: volta até o começo do trecho
            lim = int((fim_ant + 0.06) * 100)
            ini = max(lim, silencio_de(i0, -1, 6) + 1) / 100
        i1 = min(n - 1, int(a['fim'] * 100))
        fim = silencio_de(i1, +1, 15) / 100 if voz[i1] or voz[min(n - 1, i1 + 1)] else a['fim']
        fim = max(fim, a['fim']) if fim - a['fim'] < 0.8 else a['fim']   # o fim só estica (até 0,8 s), nunca encurta
        if ini < a['inicio'] and a['inicio'] - ini > 0.5: ini = a['inicio']   # antecipa no máximo 0,5 s
        if ini > a['inicio'] and ini - a['inicio'] > 1.15: ini = a['inicio']   # atrasa no máximo ~1 s (início caiu no silêncio / no fim da anterior)
        if w:
            w[0]['i'] = round(ini, 3); w[0]['f'] = round(max(w[0]['f'], ini + 0.05), 3)
            w[-1]['f'] = round(max(w[-1]['f'], fim), 3)
        a['inicio'], a['fim'], a['palavras'] = round(ini, 3), round(fim, 3), w
        out[fid] = a; fim_ant = fim
    return out


def etapa_partitura(ep, lang, d, o):
    rot = json.loads((d / f'roteiro{suf(lang)}.json').read_text(encoding='utf-8'))
    ali = json.loads((d / 'audio' / f'vo_alinhamento{suf(lang)}.json').read_text(encoding='utf-8'))
    ali = refina_limites(ali, ROOT / rot['narracao']['arquivo'])
    mp3 = ROOT / (o.musica or f'entrada/musica/musica_ep{int(ep):02d}.mp3')
    an = analisar(mp3)
    per, bar = an['period'], an['period'] * 4
    down = an['down']
    logo_bar = int(np.argmin([abs(x - an['logo']) for x in down]))
    ids = [f['id'] for f in rot['falas']]
    fechamento = 'LF' if 'LF' in ids else None
    corpo = [i for i in ids if i != fechamento]
    tempo = o.tempo or 1.0
    dur = {i: (ali[i]['fim'] - ali[i]['inicio']) / tempo for i in ids}
    cortes = []
    # silêncio no começo da trilha: corta até o primeiro som
    trim = an['inicio_som'] - 0.05 if an['inicio_som'] > 0.45 else 0.0
    if trim > 0: cortes.append({'de': 0.0, 'para': round(trim, 3)})
    d0 = next(x for x in down if x - trim >= max(0.9, o.intro or 0)) - trim   # 1º tempo forte (tempo editado) a partir de ~0,9 s (ou de --intro)
    t_first = d0 + 0.05
    fala_total = sum(dur[i] for i in corpo)
    P0, PMIN, PMAX = o.pausa, 0.3, 1.05
    npaus = len(corpo) - 1

    def logo_edit(cs):
        return an['logo'] - sum(c['para'] - c['de'] for c in cs if c['para'] <= an['logo'] + 1e-6)

    need = t_first + fala_total + npaus * P0 + 1.0
    folga = logo_edit(cortes) - need
    saltos = []
    alvo = 0.35 + npaus * 0.12            # sobra desejada depois das pausas-base (pausas finais ~0,65 s)
    if folga > alvo + bar * 0.6:
        nb = int(round((folga - alvo) / bar))
        while nb >= 1:
            esc = escolhe_saltos(an, nb, logo_bar=logo_bar)
            if esc: break
            nb -= 1
        for _, i, j in esc if nb >= 1 else []:
            cortes.append({'de': round(down[i], 3), 'para': round(down[j], 3)}); saltos.append(f'-{j - i}c ({down[i]:.1f}→{down[j]:.1f}s)')
    elif folga < 0:
        # a narração não cabe: repete compassos da trilha (melhor que acelerar a voz); aceleração leve só em último caso
        falta = -folga + 0.2
        nb = int(np.ceil(falta / bar))
        esc = []
        while nb <= 12:
            esc = escolhe_saltos(an, nb, logo_bar=logo_bar)
            if esc: break
            nb += 1
        for _, i, j in esc:
            cortes.append({'de': round(down[j], 3), 'para': round(down[i], 3)}); saltos.append(f'+{j - i}c ({down[j]:.1f}→{down[i]:.1f}s)')
        if not esc and o.tempo is None:
            tempo = min(1.04, (fala_total + falta) / fala_total)
            dur = {i: (ali[i]['fim'] - ali[i]['inicio']) / tempo for i in ids}
            fala_total = sum(dur[i] for i in corpo)
    cortes.sort(key=lambda c: c['de'])
    LOGO = logo_edit(cortes)
    livre = LOGO - 1.0 - t_first - fala_total
    p = float(np.clip(livre / max(1, npaus), PMIN, PMAX)) if npaus else 0
    extra = livre - p * npaus
    # sobra depois das pausas: segura mais antes da 1ª fala (até 1 compasso) e antes do logo
    t_first += min(max(0, extra - 1.2), bar) if extra > 1.2 else 0
    falas, t = [], t_first
    for k, fid in enumerate(corpo):
        if k: t = falas[-1]['fim'] + p
        falas.append(item_fala(rot, ali, fid, t, tempo))
    if fechamento:
        falas.append(item_fala(rot, ali, fechamento, LOGO + 0.15, tempo))
    fim = max(LOGO + 3.3, falas[-1]['fim'] + 1.0)
    folga_logo = LOGO - falas[len(corpo) - 1]['fim']
    tl = {'fonte': 'alinhamento', 'tempo_narracao': round(tempo, 4), 'duracao': round(fim, 3),
          'musica': {'bpm': an['bpm'], 'periodo': per, 'downbeat0': round(d0, 3), 'compasso': bar, 'logo': round(LOGO, 3), 'cortes': cortes},
          'falas': falas, 'legenda_subst': rot['legenda_subst']}
    (d / f'timeline{suf(lang)}.json').write_text(json.dumps(tl, ensure_ascii=False, indent=1), encoding='utf-8')
    part = {'_sobre': 'gerado por tools/episodio/produzir.py (etapa partitura); tempos da trilha em segundos no arquivo ORIGINAL',
            'roteiro': f'roteiro{suf(lang)}.json', 'vo': rot['narracao']['arquivo'], 'tempo_narracao': round(tempo, 4),
            'musica': {'arquivo': rel(mp3), 'bpm': round(an['bpm'], 3), 'downbeat0': round(down[0], 3), 'cortes': cortes, 'logo_musica': round(an['logo'], 3), 'cauda': round(fim - LOGO, 2)},
            'plano': {'pausa': round(p, 2), 'primeira_fala': round(t_first, 2), 'folga_antes_do_logo': round(folga_logo, 2), 'saltos': saltos, 'duracao_trilha': round(an['dur'], 2)}}
    pp = d / ('partitura.json' if lang == 'pt-BR' else f'partitura.{lang}.json')
    pp.write_text(json.dumps(part, ensure_ascii=False, indent=1), encoding='utf-8')
    if lang != 'pt-BR' and not (d / 'partitura.json').exists(): (d / 'partitura.json').write_text(json.dumps(part, ensure_ascii=False, indent=1), encoding='utf-8')
    print(f"partitura: {an['bpm']:.1f} bpm · logo {an['logo']:.2f}s (trilha) → {LOGO:.2f}s · cortes {saltos or '—'}{' · início aparado ' + format(trim, '.2f') + 's' if trim else ''}"
          f" · narração ×{tempo:.3f} · pausa {p:.2f}s · 1ª fala {t_first:.2f}s · folga antes do logo {folga_logo:.2f}s · duração {fim:.1f}s")


def item_fala(rot, ali, fid, t, tempo):
    f = next(x for x in rot['falas'] if x['id'] == fid)
    src = ali[fid]
    k = 1 / tempo
    words = [{'p': w['p'], 'i': round(t + (w['i'] - src['inicio']) * k, 3), 'f': round(t + (w['f'] - src['inicio']) * k, 3)} for w in src['palavras']]
    it = {'id': fid, 'voz': f.get('voz'), 'inicio': round(t, 3), 'fim': words[-1]['f'], 'origem': {'inicio': src['inicio'], 'fim': src['fim']}, 'palavras': words, 'texto': f['texto']}
    if f.get('fala'): it['fala'] = f['fala']
    return it


# ---------------- legendas, página, efeitos, mixagem, vídeo ----------------
def run(*a, **k):
    print('  $', ' '.join(str(x) for x in a)[:200])
    subprocess.run([str(x) for x in a], check=True, cwd=ROOT, **k)


PAGINA = open(Path(__file__).with_name('pagina.html'), encoding='utf-8').read() if Path(__file__).with_name('pagina.html').exists() else None


def etapa_pagina(ep, lang, d, o):
    rot = json.loads((d / f'roteiro{suf(lang)}.json').read_text(encoding='utf-8'))
    out = d / 'index.html'
    if out.exists() and not o.forcar: print('página: já existe (use --forcar para refazer)'); return
    out.write_text(PAGINA.replace('{{TITULO}}', rot['titulo']), encoding='utf-8')
    print('página:', rel(out))


def etapa_legendas(ep, lang, d):
    run(PY, 'tools/legendas.py', rel(d / f'timeline{suf(lang)}.json'), '--balancear', '--idioma', lang)


def etapa_sfx(ep, lang, d):
    run('node', 'tools/render.mjs', rel(d / 'index.html'), '--query', f'idioma={lang}', '--sfx-out', rel(d / 'audio' / f'sfx_cues{suf(lang)}.json'))


def etapa_mix(ep, lang, d, o):
    rot = json.loads((d / f'roteiro{suf(lang)}.json').read_text(encoding='utf-8'))
    part = json.loads((d / ('partitura.json' if lang == 'pt-BR' else f'partitura.{lang}.json')).read_text(encoding='utf-8'))
    run(PY, 'tools/audio/mixar.py', '--video', d.name, '--vo', rot['narracao']['arquivo'], '--musica', part['musica']['arquivo'],
        '--timeline', rel(d / f'timeline{suf(lang)}.json'), '--cues', rel(d / 'audio' / f'sfx_cues{suf(lang)}.json'), '--saida', rel(d / 'audio' / f'mix{suf(lang)}'))


def etapa_quadros(ep, lang, d, o):
    tl = json.loads((d / f'timeline{suf(lang)}.json').read_text(encoding='utf-8'))
    ts = [round(f['inicio'] + o.frac * (f['fim'] - f['inicio']), 2) for f in tl['falas'] if f['id'] != 'LF'] + [round(tl['musica']['logo'] + 1.6, 2)]
    for fmt in o.formatos.split(','):
        q = f'idioma={lang}' + ('&formato=vertical' if fmt == 'v' else '')
        out = ROOT / 'tmp' / 'quadros' / f'ep{int(ep):02d}{suf(lang)}_{fmt}'
        out.mkdir(parents=True, exist_ok=True)
        for velho in out.glob('*.png'): velho.unlink()
        run('node', 'tools/render.mjs', rel(d / 'index.html'), '--query', q, '--stills', ','.join(map(str, ts)), '--out', rel(out))
        folha(out, ts, ROOT / 'tmp' / 'quadros' / f'ep{int(ep):02d}{suf(lang)}_{fmt}.jpg', fmt)


def folha(pasta, ts, destino, fmt):
    from PIL import Image, ImageDraw
    ims = sorted(Path(pasta).glob('*.png'))
    if not ims: return
    w = 480 if fmt == 'h' else 270
    h = w * 9 // 16 if fmt == 'h' else w * 16 // 9
    cols = 4 if fmt == 'h' else 6
    rows = -(-len(ims) // cols)
    sheet = Image.new('RGB', (cols * w, rows * (h + 22)), (30, 30, 30))
    d = ImageDraw.Draw(sheet)
    for k, p in enumerate(ims):
        im = Image.open(p).convert('RGB').resize((w, h))
        x, y = (k % cols) * w, (k // cols) * (h + 22)
        sheet.paste(im, (x, y + 22)); d.text((x + 4, y + 4), p.stem, fill=(230, 230, 230))
    sheet.save(destino, quality=85)
    print('folha:', rel(destino))


def etapa_render(ep, lang, d, o):
    slug = d.name[3:]
    dist = ROOT / 'dist' / f'ep{int(ep):02d}'
    dist.mkdir(parents=True, exist_ok=True)
    for fmt in o.formatos.split(','):
        q = f'idioma={lang}' + ('&formato=vertical' if fmt == 'v' else '')
        nome = f'{slug}{"_" + lang if lang != "pt-BR" else ""}_{"16x9" if fmt == "h" else "9x16"}.mp4'
        run('node', 'tools/render.mjs', rel(d / 'index.html'), '--query', q, '--video', rel(dist / nome), '--audio', rel(d / 'audio' / f'mix{suf(lang)}.wav'),
            '--fps', '24', '--crf', str(o.crf), '--workers', str(o.workers))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('ep')
    ap.add_argument('--idioma', default='pt-BR')
    ap.add_argument('--etapas', default='roteiro,alinhar,partitura,legendas,pagina,sfx,mix,render')
    ap.add_argument('--formatos', default='h,v')
    ap.add_argument('--musica', default=None, help='trilha (padrão entrada/musica/musica_epNN.mp3)')
    ap.add_argument('--tempo', type=float, default=None, help='aceleração fixa da narração')
    ap.add_argument('--pausa', type=float, default=0.55)
    ap.add_argument('--intro', type=float, default=None, help='partitura: segundos livres antes da 1ª fala (abertura com o logo)')
    ap.add_argument('--crf', type=int, default=21)
    ap.add_argument('--frac', type=float, default=0.72, help='quadros: ponto de cada fala a fotografar (0-1)')
    ap.add_argument('--workers', type=int, default=3)
    ap.add_argument('--forcar', action='store_true')
    o = ap.parse_args()
    d = ep_dir(o.ep)
    et = o.etapas.split(',')
    print(f'== ep. {int(o.ep):02d} · {d.name} · {o.idioma}')
    if 'roteiro' in et: etapa_roteiro(o.ep, o.idioma, d)
    if 'alinhar' in et: etapa_alinhar(o.ep, o.idioma, d)
    if 'partitura' in et: etapa_partitura(o.ep, o.idioma, d, o)
    if 'legendas' in et: etapa_legendas(o.ep, o.idioma, d)
    if 'pagina' in et: etapa_pagina(o.ep, o.idioma, d, o)
    if 'sfx' in et: etapa_sfx(o.ep, o.idioma, d)
    if 'mix' in et: etapa_mix(o.ep, o.idioma, d, o)
    if 'quadros' in et: etapa_quadros(o.ep, o.idioma, d, o)
    if 'render' in et: etapa_render(o.ep, o.idioma, d, o)


if __name__ == '__main__':
    main()
