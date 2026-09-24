"""Narração com VoxCPM2 (OpenBMB, Apache-2.0, 48 kHz) — desenho de voz por descrição e
clonagem a partir da tomada escolhida (timbre consistente entre falas).

uso:
  python tts_voxcpm.py design <saida_dir> [--takes 2] [--voices a,b]
  python tts_voxcpm.py clone  <ref.wav> <saida_dir> [--takes 3] [--ref-text "..."] [--ids L01,L02]
"""
try:
    import truststore; truststore.inject_into_ssl()  # usa o repositório de certificados do Windows (antivírus com inspeção HTTPS)
except ImportError:
    pass
import json, time, argparse
from pathlib import Path
import numpy as np
import soundfile as sf
import torch

HERE = Path(__file__).resolve().parent
ROTEIRO = HERE.parents[1] / 'videos' / '01-o-que-e-biogas' / 'roteiro.json'

VOICES = {
    'narradora_calorosa': 'A warm, cheerful Brazilian Portuguese female narrator from São Paulo, bright friendly voice with a smile, lively storytelling, clear diction',
    'narradora_brincalhona': 'A playful, expressive young Brazilian woman narrating a whimsical science cartoon, sparkling and warm, natural Brazilian Portuguese intonation',
    'narrador_amigo': 'A friendly, upbeat Brazilian Portuguese male narrator from São Paulo, warm mid-low voice, smiling and curious, clear diction',
}


def load():
    from voxcpm import VoxCPM
    return VoxCPM.from_pretrained('openbmb/VoxCPM2', load_denoiser=False, optimize=False)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('mode')
    ap.add_argument('args', nargs='*')
    ap.add_argument('--takes', type=int, default=2)
    ap.add_argument('--voices', default=','.join(VOICES))
    ap.add_argument('--ref-text', default=None)
    ap.add_argument('--ids', default=None)
    ap.add_argument('--cfg', type=float, default=2.0)
    ap.add_argument('--steps', type=int, default=10)
    a = ap.parse_args()
    rot = json.loads(ROTEIRO.read_text(encoding='utf-8'))
    model = load()
    sr = model.tts_model.sample_rate
    if a.mode == 'design':
        out = Path(a.args[0]); out.mkdir(parents=True, exist_ok=True)
        text = ' '.join(f['texto'] for f in rot['falas'])
        for vname in a.voices.split(','):
            for k in range(a.takes):
                torch.manual_seed(3000 + k); np.random.seed(3000 + k)
                t0 = time.time()
                wav = model.generate(text=f'({VOICES[vname]}){text}', cfg_value=a.cfg, inference_timesteps=a.steps)
                f = out / f'vox_{vname}_t{k}.wav'
                sf.write(f, wav, sr)
                print(f'{f.name}: {len(wav) / sr:.1f}s em {time.time() - t0:.1f}s', flush=True)
    elif a.mode == 'clone':
        ref, out = a.args[0], Path(a.args[1]); out.mkdir(parents=True, exist_ok=True)
        ids = set(a.ids.split(',')) if a.ids else None
        for fala in rot['falas']:
            if ids and fala['id'] not in ids: continue
            for k in range(a.takes):
                torch.manual_seed(4000 + k); np.random.seed(4000 + k)
                kw = dict(reference_wav_path=ref)
                if a.ref_text: kw.update(prompt_wav_path=ref, prompt_text=a.ref_text)
                wav = model.generate(text=fala['texto'], cfg_value=a.cfg, inference_timesteps=a.steps, **kw)
                f = out / f"{fala['id']}_t{k}.wav"
                sf.write(f, wav, sr)
                print(f'{f.name}: {len(wav) / sr:.2f}s', flush=True)


if __name__ == '__main__':
    main()
