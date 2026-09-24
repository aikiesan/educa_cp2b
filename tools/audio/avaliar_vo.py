"""Avaliação automática de tomadas de narração.

Para cada WAV: transcrição (Whisper large-v3-turbo) e WER contra o roteiro; fonemas
(wav2vec2 XLSR espeak) para checar sotaque brasileiro — em PT-BR "de"/"te" átonos viram
[dʒi]/[tʃi], o que não acontece em PT-PT; MOS previsto (UTMOS22) e expressividade (faixa de F0).

uso: python avaliar_vo.py <wav ou pasta> [...] [--texto roteiro|linha] [--json saida.json]
"""
try:
    import truststore; truststore.inject_into_ssl()  # usa o repositório de certificados do Windows (antivírus com inspeção HTTPS)
except ImportError:
    pass
import sys, json, re, unicodedata, argparse
from pathlib import Path
import numpy as np
import torch, soundfile as sf, librosa

HERE = Path(__file__).resolve().parent
ROTEIRO = HERE.parents[1] / 'videos' / '01-o-que-e-biogas' / 'roteiro.json'
dev = 'cuda' if torch.cuda.is_available() else 'cpu'


def norm(s):
    s = s.lower().replace('—', ' ').replace('...', ' ')
    s = re.sub(r"[^\wáàâãéêíóôõúüç\s]", ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def wer(ref, hyp):
    r, h = norm(ref).split(), norm(hyp).split()
    d = np.zeros((len(r) + 1, len(h) + 1), dtype=int)
    d[:, 0] = range(len(r) + 1); d[0, :] = range(len(h) + 1)
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            d[i, j] = min(d[i - 1, j] + 1, d[i, j - 1] + 1, d[i - 1, j - 1] + (r[i - 1] != h[j - 1]))
    return d[len(r), len(h)] / max(1, len(r))


_asr = _ph = _mos = None


def asr(y16):
    global _asr
    if _asr is None:
        from transformers import pipeline
        _asr = pipeline('automatic-speech-recognition', model='openai/whisper-large-v3-turbo', torch_dtype=torch.float16, device=dev)
    return _asr({'raw': y16, 'sampling_rate': 16000}, generate_kwargs={'language': 'portuguese', 'task': 'transcribe'}, return_timestamps=True)['text']


def phonemes(y16):
    global _ph
    if _ph is None:
        from transformers import AutoProcessor, AutoModelForCTC
        name = 'facebook/wav2vec2-xlsr-53-espeak-cv-ft'
        _ph = (AutoProcessor.from_pretrained(name), AutoModelForCTC.from_pretrained(name).to(dev).eval())
    proc, model = _ph
    with torch.no_grad():
        x = proc(y16, sampling_rate=16000, return_tensors='pt').input_values.to(dev)
        ids = model(x).logits.argmax(-1)
    return proc.batch_decode(ids)[0]


def mos(y16):
    global _mos
    try:
        if _mos is None:
            _mos = torch.hub.load('tarepan/SpeechMOS:v1.2.0', 'utmos22_strong', trust_repo=True).to(dev).eval()
        with torch.no_grad():
            return float(_mos(torch.tensor(y16, dtype=torch.float32)[None].to(dev), 16000).item())
    except Exception as e:
        print('  (MOS indisponível:', e, ')')
        return float('nan')


def f0_stats(y, sr):
    y22 = librosa.resample(y, orig_sr=sr, target_sr=22050)
    f0, vflag, _ = librosa.pyin(y22, fmin=70, fmax=500, sr=22050, frame_length=1024)
    f0 = f0[~np.isnan(f0)]
    if len(f0) < 10: return 0, 0, 0
    st = 12 * np.log2(f0 / np.median(f0))
    return float(np.median(f0)), float(np.percentile(st, 95) - np.percentile(st, 5)), float(np.std(st))


def evaluate(path, ref):
    y, sr = sf.read(path, dtype='float32')
    if y.ndim > 1: y = y.mean(1)
    y16 = librosa.resample(y, orig_sr=sr, target_sr=16000)
    dur = len(y) / sr
    hyp = asr(y16)
    ph = phonemes(y16)
    tsh, dzh = ph.count('tʃ'), ph.count('dʒ')
    esh = len(re.findall(r'ʃ(?=\s|$)', ph))
    m = mos(y16)
    f0m, f0range, f0sd = f0_stats(y, sr)
    peak = float(np.max(np.abs(y)))
    words = len(norm(ref).split())
    return dict(file=str(path), dur=round(dur, 2), wps=round(words / dur, 2), wer=round(wer(ref, hyp), 3), mos=round(m, 2),
                tsh=tsh, dzh=dzh, final_sh=esh, f0_med=round(f0m), f0_range_st=round(f0range, 1), f0_sd=round(f0sd, 2),
                peak=round(peak, 3), hyp=hyp.strip(), phon=ph)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('paths', nargs='+')
    ap.add_argument('--texto', default=None, help='texto de referência (padrão: roteiro inteiro, ou fala pelo nome Lxx)')
    ap.add_argument('--json', default=None)
    a = ap.parse_args()
    rot = json.loads(ROTEIRO.read_text(encoding='utf-8'))
    full = ' '.join(f['texto'] for f in rot['falas'])
    byid = {f['id']: f['texto'] for f in rot['falas']}
    files = []
    for p in a.paths:
        p = Path(p)
        files += sorted(p.glob('*.wav')) if p.is_dir() else [p]
    res = []
    for f in files:
        m = re.match(r'(L\d\d)', f.name)
        ref = a.texto or (byid[m.group(1)] if m else full)
        r = evaluate(f, ref)
        res.append(r)
        print(f"{f.name:42s} dur={r['dur']:5.1f}s wps={r['wps']:.2f} WER={r['wer']:.3f} MOS={r['mos']:.2f} tʃ={r['tsh']} dʒ={r['dzh']} ʃ#={r['final_sh']} F0={r['f0_med']}Hz faixa={r['f0_range_st']}st", flush=True)
        print('   ASR:', r['hyp'][:220])
    if a.json:
        Path(a.json).write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding='utf-8')


if __name__ == '__main__':
    main()
