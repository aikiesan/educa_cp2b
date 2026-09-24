#!/usr/bin/env python3
"""
Geração de narração multi-locutor em Português do Brasil usando Gemini TTS.
Modelo: gemini-3.8-flash-tts
SDK: google-genai
API: client.interactions.create
"""
import os
import sys
import base64
import wave
import time
import argparse
from pathlib import Path
from dotenv import load_dotenv

# Carregar variáveis de ambiente explicitamente do diretório do script
HERE = Path(__file__).resolve().parent
load_dotenv(dotenv_path=HERE / ".env")
load_dotenv(dotenv_path=Path.home() / ".env")

try:
    from google import genai
except ImportError:
    print("ERRO: O pacote google-genai não está instalado.", file=sys.stderr, flush=True)
    print("Instale executando: pip install -U google-genai", file=sys.stderr, flush=True)
    sys.exit(1)


OUTPUT_FILE = "biogas_multispeaker.wav"

# Estilos das vozes (direção de interpretação por turno)
SULAFAT_STYLE = (
    "Brazilian Portuguese. Warm, curious and cheerful educational animation narration. "
    "Smiling voice, clear diction, natural conversational rhythm, São Paulo neutral cadence."
)

PUCK_STYLE = (
    "Brazilian Portuguese. Energetic, playful and humorous educational animation narration. "
    "Smiling voice, expressive comic delivery, clear diction, lively conversational pace."
)

SULAFAT_CLOSING_STYLE = (
    "Brazilian Portuguese. Warm, optimistic and inspiring conclusion. "
    "Smiling voice, clear diction, slightly slower cadence with a satisfying sense of closure."
)


def fala(texto: str, speaker: str, style: str) -> dict:
    """Cria um turno estruturado com speech_metadata conforme a API Interactions do Gemini."""
    return {
        "type": "text",
        "text": texto,
        "annotations": [
            {
                "type": "speech_metadata",
                "speaker": speaker,
                "style": style,
            }
        ],
    }


ROTEIRO = [
    fala(
        "O que é biogás? E biometano?",
        "Sulafat",
        SULAFAT_STYLE,
    ),
    fala(
        "Tudo começa com o que ninguém quer: restos de comida, esterco, resíduos da lavoura... <short pause>",
        "Puck",
        PUCK_STYLE,
    ),
    fala(
        "No biodigestor — um tanque fechado, sem oxigênio — micróbios FAZEM A FESTA... <short pause>",
        "Sulafat",
        SULAFAT_STYLE,
    ),
    fala(
        "...e liberam um gás: o biogás!",
        "Puck",
        PUCK_STYLE,
    ),
    fala(
        "Ele é principalmente metano e gás carbônico, com uma pitadinha de outros gases... <short pause>",
        "Sulafat",
        SULAFAT_STYLE,
    ),
    fala(
        "...alguns BEM FEDIDOS!",
        "Puck",
        PUCK_STYLE,
    ),
    fala(
        "Mas queimando o biogás, dá pra gerar calor e eletricidade.",
        "Sulafat",
        SULAFAT_STYLE,
    ),
    fala(
        "E tem mais: tirando o gás carbônico e as impurezas, nasce o biometano — metano quase puro!",
        "Puck",
        PUCK_STYLE,
    ),
    fala(
        "É como o gás natural, só que renovável: pode ir pelo gasoduto até casas e indústrias, ou abastecer caminhões e ônibus.",
        "Sulafat",
        SULAFAT_STYLE,
    ),
    fala(
        "E o que sobra no biodigestor vira biofertilizante pra lavoura... <short pause> FECHANDO O CICLO!",
        "Puck",
        PUCK_STYLE,
    ),
    fala(
        "Biogás e biometano: o resíduo de hoje é a energia de amanhã!",
        "Sulafat",
        SULAFAT_CLOSING_STYLE,
    ),
]


def verify_wav(path: str | Path):
    """Valida o arquivo WAV gerado inspecionando cabeçalhos e propriedades acústicas."""
    path = Path(path)
    if not path.is_file():
        raise FileNotFoundError(f"Arquivo WAV não encontrado: {path}")

    size_bytes = path.stat().st_size
    if size_bytes < 44:
        raise ValueError(f"Arquivo pequeno demais para ser um WAV válido ({size_bytes} bytes).")

    with wave.open(str(path), "rb") as wf:
        n_channels = wf.getnchannels()
        sampwidth = wf.getsampwidth()
        framerate = wf.getframerate()
        n_frames = wf.getnframes()
        duration_s = n_frames / float(framerate) if framerate else 0.0

    print("\n[VALIDAÇÃO WAV]", flush=True)
    print(f"  Arquivo:       {path.name}", flush=True)
    print(f"  Caminho total: {path.resolve()}", flush=True)
    print(f"  Tamanho:       {size_bytes / 1024:.1f} KB ({size_bytes:,} bytes)", flush=True)
    print(f"  Canais:        {n_channels} ({'Mono' if n_channels == 1 else 'Estéreo' if n_channels == 2 else f'{n_channels} canais'})", flush=True)
    print(f"  Taxa amostr.:  {framerate} Hz", flush=True)
    print(f"  Bits/amostra:  {sampwidth * 8} bits", flush=True)
    print(f"  Quadros:       {n_frames:,}", flush=True)
    print(f"  Duração:       {duration_s:.2f} segundos", flush=True)

    if duration_s <= 0:
        raise ValueError("O arquivo WAV gerado não possui duração válida.")

    return {
        "channels": n_channels,
        "sample_rate": framerate,
        "sample_width": sampwidth,
        "frames": n_frames,
        "duration_s": duration_s,
    }


def generate(api_key: str | None = None, output_path: str = OUTPUT_FILE):
    key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        print("\n" + "=" * 60, file=sys.stderr, flush=True)
        print("ERRO: Nenhuma chave de API encontrada!", file=sys.stderr, flush=True)
        print("Configure GEMINI_API_KEY no seu ambiente ou no arquivo .env:", file=sys.stderr, flush=True)
        print("  Windows PowerShell:", file=sys.stderr, flush=True)
        print('    $env:GEMINI_API_KEY="SUA_CHAVE_AQUI"', file=sys.stderr, flush=True)
        print("  ou adicione ao arquivo .env no diretório do projeto:", file=sys.stderr, flush=True)
        print('    GEMINI_API_KEY=AIzaSy...', file=sys.stderr, flush=True)
        print("=" * 60 + "\n", file=sys.stderr, flush=True)
        sys.exit(1)

    client = genai.Client(api_key=key)

    print("=" * 60, flush=True)
    print("Iniciando síntese multi-locutor com Gemini TTS...", flush=True)
    print("Modelo:         gemini-3.8-flash-tts", flush=True)
    print("Interlocutores: Sulafat (Voz: Sulafat) & Puck (Voz: Puck)", flush=True)
    print("Modo:           conversational", flush=True)
    print(f"Total de falas: {len(ROTEIRO)} turnos", flush=True)
    print(f"Destino:        {output_path}", flush=True)
    print("Aguardando resposta da API do Google (isso costuma levar de 20 a 60 segundos)...", flush=True)
    print("=" * 60, flush=True)

    t0 = time.time()
    interaction = client.interactions.create(
        model="gemini-3.8-flash-tts",
        input=[
            {
                "type": "user_input",
                "content": ROTEIRO,
            }
        ],
        response_format={
            "type": "audio"
        },
        generation_config={
            "speech_config": {
                "mode": "conversational",
                "speakers": [
                    {"speaker": "Sulafat", "voice": "Sulafat"},
                    {"speaker": "Puck", "voice": "Puck"},
                ],
            }
        },
        timeout=180.0,
    )
    elapsed = time.time() - t0
    print(f"\nResposta da API recebida em {elapsed:.1f}s!", flush=True)

    if not interaction.output_audio or not interaction.output_audio.data:
        raise RuntimeError("A API respondeu, mas nenhum conteúdo de áudio foi retornado.")

    audio_bytes = base64.b64decode(interaction.output_audio.data)

    out_file = HERE / output_path if not Path(output_path).is_absolute() else Path(output_path)
    out_file.write_bytes(audio_bytes)
    print(f"Áudio gravado com sucesso em: {out_file.resolve()}", flush=True)

    # Validar formato WAV
    stats = verify_wav(out_file)
    print("\n==========================================", flush=True)
    print("ÁUDIO MULTI-LOCUTOR GERADO COM SUCESSO!", flush=True)
    print("==========================================", flush=True)
    return stats


def main():
    parser = argparse.ArgumentParser(description="Gera narração multi-locutor em WAV usando gemini-3.8-flash-tts.")
    parser.add_argument("--api-key", default=None, help="Chave da API Gemini (opcional, pode vir de GEMINI_API_KEY)")
    parser.add_argument("--output", "-o", default=OUTPUT_FILE, help=f"Caminho do arquivo WAV de saída (padrão: {OUTPUT_FILE})")
    args = parser.parse_args()

    generate(api_key=args.api_key, output_path=args.output)


if __name__ == "__main__":
    main()
