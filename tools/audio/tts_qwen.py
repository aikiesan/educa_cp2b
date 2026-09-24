"""Narração com Qwen3-TTS (Apache-2.0) — VoiceDesign (voz criada a partir de descrição) e
clonagem da voz desenhada para manter o timbre consistente entre falas.

uso:
  python tts_qwen.py design  <saida_dir> [--takes 3]      # roteiro inteiro, várias vozes/tomadas
  python tts_qwen.py clone   <ref.wav> <ref_texto> <saida_dir> [--takes 3]   # fala a fala com a voz escolhida
"""
try:
    import truststore; truststore.inject_into_ssl()  # usa o repositório de certificados do Windows (antivírus com inspeção HTTPS)
except ImportError:
    pass
import json, sys, os, time, argparse
from pathlib import Path
import torch
import soundfile as sf

HERE = Path(__file__).resolve().parent
ROTEIRO = HERE.parents[1] / 'videos' / '01-o-que-e-biogas' / 'roteiro.json'

VOICES = {
    'narradora_calorosa': (
        'A warm, cheerful Brazilian Portuguese female narrator in her early thirties with a native São Paulo accent. '
        'Bright, friendly mid-pitched voice with a smile in it, lively storytelling rhythm, clear diction, playful and curious, '
        'like the narrator of a charming educational stop-motion animation for families.'),
    'narradora_brincalhona': (
        'A playful, expressive young Brazilian woman from São Paulo narrating a whimsical science cartoon. '
        'Energetic but not rushed, sparkling and warm, with gentle comic timing, natural Brazilian Portuguese intonation and crisp articulation.'),
    'narrador_amigo': (
        'A friendly, upbeat Brazilian Portuguese male narrator in his thirties with a native São Paulo accent. '
        'Warm mid-low timbre, smiling and curious, playful storytelling energy, clear diction, like the host of an educational cartoon.'),
}


def full_text(rot):
    return ' '.join(f['texto'] for f in rot['falas'])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('mode')
    ap.add_argument('args', nargs='*')
    ap.add_argument('--takes', type=int, default=2)
    ap.add_argument('--voices', default=','.join(VOICES))
    a = ap.parse_args()
    rot = json.loads(ROTEIRO.read_text(encoding='utf-8'))
    from qwen_tts import Qwen3TTSModel
    if a.mode == 'design':
        out = Path(a.args[0]); out.mkdir(parents=True, exist_ok=True)
        model = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign', device_map='cuda:0', dtype=torch.bfloat16, attn_implementation='sdpa')
        text = full_text(rot)
        for vname in a.voices.split(','):
            for k in range(a.takes):
                torch.manual_seed(1000 + k)
                t0 = time.time()
                wavs, sr = model.generate_voice_design(text=text, language='Portuguese', instruct=VOICES[vname])
                f = out / f'qwen_{vname}_t{k}.wav'
                sf.write(f, wavs[0], sr)
                print(f'{f.name}: {len(wavs[0]) / sr:.1f}s em {time.time() - t0:.1f}s', flush=True)
    elif a.mode == 'clone':
        ref, ref_text, out = a.args[0], a.args[1], Path(a.args[2]); out.mkdir(parents=True, exist_ok=True)
        model = Qwen3TTSModel.from_pretrained('Qwen/Qwen3-TTS-12Hz-1.7B-Base', device_map='cuda:0', dtype=torch.bfloat16, attn_implementation='sdpa')
        for fala in rot['falas']:
            for k in range(a.takes):
                torch.manual_seed(2000 + k)
                wavs, sr = model.generate_voice_clone(text=fala['texto'], language='Portuguese', ref_audio=ref, ref_text=ref_text)
                f = out / f"{fala['id']}_t{k}.wav"
                sf.write(f, wavs[0], sr)
                print(f'{f.name}: {len(wavs[0]) / sr:.2f}s', flush=True)


if __name__ == '__main__':
    main()
