"""Transcreve a narração (checagem de conteúdo: o TTS disse o que o roteiro pede?).

uso: python transcrever.py voz.wav [--modelo tiny] [--de 9.5 --ate 12.6]
Usa faster-whisper com modelo já em cache (local_files_only) — não baixa nada.
"""
try:
    import truststore; truststore.inject_into_ssl()
except ImportError:
    pass
import argparse
import soundfile as sf
import numpy as np
from faster_whisper import WhisperModel


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('wav')
    ap.add_argument('--modelo', default='tiny')
    ap.add_argument('--de', type=float, default=0)
    ap.add_argument('--ate', type=float, default=None)
    a = ap.parse_args()
    y, sr = sf.read(a.wav, dtype='float32')
    if y.ndim > 1: y = y.mean(1)
    y = y[int(a.de * sr):int(a.ate * sr) if a.ate else None]
    if sr != 16000:
        from scipy.signal import resample_poly
        y = resample_poly(y, 16000, sr).astype(np.float32)
    m = WhisperModel(a.modelo, device='cpu', compute_type='int8', local_files_only=True)
    segs, _ = m.transcribe(y, language='pt', beam_size=5, word_timestamps=False, vad_filter=False)
    for s in segs: print(f'{s.start + a.de:6.2f}–{s.end + a.de:6.2f}  {s.text.strip()}')


if __name__ == '__main__':
    main()
