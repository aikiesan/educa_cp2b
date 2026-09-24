"""Alinhamento forçado palavra a palavra (torchaudio MMS_FA, multilíngue) da narração com o roteiro.

uso: python alinhar_vo.py <narracao.wav> [--video 02-pilar-2b] [--saida vo_alinhamento.json]

Saída: para cada fala Lxx → inicio/fim (s, no áudio original) e palavras [{p, i, f, score}].
O texto é romanizado (sem acentos/pontuação) só para o alinhador; as palavras exibidas mantêm a grafia.
Se a fala tem o campo "fala" (forma pronunciada: siglas soletradas, números por extenso), é ele que se alinha.
"""
try:
    import truststore; truststore.inject_into_ssl()
except ImportError:
    pass
import json, re, unicodedata, argparse
from pathlib import Path
import torch, torchaudio
import soundfile as sf
import numpy as np

HERE = Path(__file__).resolve().parent
VIDEOS = HERE.parents[1] / 'videos'


def roman(w):
    w = unicodedata.normalize('NFD', w.lower())
    w = ''.join(c for c in w if unicodedata.category(c) != 'Mn')
    return re.sub(r"[^a-z']", '', w)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('wav')
    ap.add_argument('--video', default='01-o-que-e-biogas')
    ap.add_argument('--saida', default=None)
    a = ap.parse_args()
    a.saida = a.saida or str(VIDEOS / a.video / 'audio' / 'vo_alinhamento.json')
    rot = json.loads((VIDEOS / a.video / 'roteiro.json').read_text(encoding='utf-8'))
    y, sr = sf.read(a.wav, dtype='float32')
    if y.ndim > 1: y = y.mean(1)
    wav = torch.tensor(y)[None]
    if sr != 16000: wav = torchaudio.functional.resample(wav, sr, 16000)
    dev = 'cuda' if torch.cuda.is_available() else 'cpu'
    bundle = torchaudio.pipelines.MMS_FA
    model = bundle.get_model(with_star=False).to(dev).eval()
    tok, aligner = bundle.get_tokenizer(), bundle.get_aligner()
    words, owner = [], []
    for f in rot['falas']:
        for w in re.findall(r"[\wÀ-ÿ']+", f.get('fala', f['texto'])):
            r = roman(w)
            if r: words.append((w, r)); owner.append(f['id'])
    with torch.inference_mode():
        em, _ = model(wav.to(dev))
        spans = aligner(em[0], tok([r for _, r in words]))
    ratio = wav.size(1) / em.size(1) / 16000
    out = {}
    for (w, r), fid, sp in zip(words, owner, spans):
        i, f_ = sp[0].start * ratio, sp[-1].end * ratio
        score = float(np.mean([s.score for s in sp]))
        d = out.setdefault(fid, {'palavras': []})
        d['palavras'].append({'p': w, 'i': round(i, 3), 'f': round(f_, 3), 'score': round(score, 3)})
    for fid, d in out.items():
        d['inicio'] = d['palavras'][0]['i']; d['fim'] = d['palavras'][-1]['f']
        d['arquivo'] = str(Path(a.wav).name)
        low = [p['p'] for p in d['palavras'] if p['score'] < 0.35]
        print(f"{fid}: {d['inicio']:6.2f} → {d['fim']:6.2f}  ({d['fim'] - d['inicio']:.2f}s)  score médio {np.mean([p['score'] for p in d['palavras']]):.2f}" + (f"  baixos: {low}" if low else ''))
    Path(a.saida).parent.mkdir(parents=True, exist_ok=True)
    Path(a.saida).write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
    print('→', a.saida)


if __name__ == '__main__':
    main()
