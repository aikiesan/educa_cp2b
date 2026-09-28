#!/usr/bin/env python3
"""
Geração de narração em locutora única (Sulafat) para o Vídeo 2: PILAR-2b Plataforma.
Modelo: gemini-3.8-flash-tts (com fallback transparente para gemini-3.8-flash-lite-tts)
SDK: google-genai
API: client.interactions.create
"""
import os
import sys
import base64
import wave
import time
import shutil
import argparse
from pathlib import Path
from dotenv import load_dotenv

# Carregar variáveis de ambiente explicitamente do diretório do script e do repositório
HERE = Path(__file__).resolve().parent
REPO_ROOT = HERE.parents[1]
load_dotenv(dotenv_path=HERE / ".env")
load_dotenv(dotenv_path=REPO_ROOT / ".env")
load_dotenv(dotenv_path=Path.home() / ".env")

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("ERRO: O pacote google-genai não está instalado.", file=sys.stderr, flush=True)
    print("Instale executando: pip install -U google-genai", file=sys.stderr, flush=True)
    sys.exit(1)


DEFAULT_OUTPUT = HERE / "pilar2b_sulafat.wav"

# ============================================================
# ESTILO DA VOZ (SULAFAT - NARRADORA VÍDEO EXPLICATIVO)
# ============================================================
# Português do Brasil, sotaque paulista neutro.
# Narradora de vídeo explicativo: calorosa, clara e confiante, sorriso na voz,
# ritmo tranquilo (explicativo, não apressado), pausas curtas nas reticências,
# ênfase leve em 'PILAR-2b' e 'na hora'.
SULAFAT_STYLE = (
    "Brazilian Portuguese, neutral São Paulo accent. Explainer video narrator: warm, clear and confident, "
    "smiling voice, relaxed and steady explanatory pace (unhurried and articulate), natural short pauses at ellipses, "
    "subtle and gentle emphasis on 'PILAR-2b' and 'na hora'."
)

SULAFAT_CLOSING_STYLE = (
    "Brazilian Portuguese, neutral São Paulo accent. Explainer video narrator: warm, confident, inspiring call to action. "
    "Smiling voice, clear diction, slight emphasis on 'PILAR-2b', satisfying closure."
)


def fala(texto: str, style: str = SULAFAT_STYLE) -> dict:
    """Cria um turno estruturado com speech_metadata para a locutora única."""
    return {
        "type": "text",
        "text": texto,
        "annotations": [
            {
                "type": "speech_metadata",
                "style": style,
            }
        ],
    }


# ============================================================
# ROTEIRO (9 FALAS - PILAR-2b PLATAFORMA)
# ============================================================
ROTEIRO = [
    # L01 - Título
    fala(
        "Onde está o biogás de São Paulo?"
    ),
    # L02 - Resíduos e municípios
    fala(
        "Ele está escondido nos resíduos: na cana, no esterco, no lixo das cidades... <short pause> espalhados por 645 municípios."
    ),
    # L03 - Apresentação da plataforma pelo CP2B
    fala(
        "Pra encontrar esse potencial, o CP2B criou o PILAR-2b."
    ),
    # L04 - Camadas de dados (agrícola, pecuária, cidades)
    fala(
        "Uma plataforma online que reúne dados da agricultura, da pecuária e das cidades... <short pause>"
    ),
    # L05 - Cálculo do potencial por município
    fala(
        "...e calcula quanto biogás cada município pode gerar."
    ),
    # L06 - Interação prática (filtro 'Tipo de Resíduo' e clique no município)
    fala(
        "É só escolher o tipo de resíduo, clicar na sua cidade... <short pause> e ver o resultado na hora."
    ),
    # L07 - Seção 'Base Científica' e transparência
    fala(
        "Tudo com base científica: as fontes e os métodos ficam à vista."
    ),
    # L08 - Tomada de decisão por gestores, empresas e pesquisadores
    fala(
        "Assim, gestores, empresas e pesquisadores descobrem onde vale a pena investir em energia renovável."
    ),
    # L09 - Fechamento e chamada para ação
    fala(
        "PILAR-2b: o mapa do biogás de São Paulo. Acesse e explore!",
        SULAFAT_CLOSING_STYLE,
    ),
]


def verify_wav(path: str | Path) -> dict:
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
        "file": str(path),
        "size_kb": size_bytes / 1024,
        "channels": n_channels,
        "sample_rate": framerate,
        "sample_width": sampwidth,
        "frames": n_frames,
        "duration_s": duration_s,
    }


def evaluate_take(client: genai.Client, wav_path: Path) -> dict:
    """Avalia o alinhamento e clareza da tomada usando áudio-compreensão via Gemini."""
    try:
        audio_bytes = wav_path.read_bytes()
        prompt = (
            "Transcreva exatamente palavra por palavra o que foi narrado no áudio em português.\n"
            "Em seguida, comente brevemente se a dicção foi clara, natural e se 'CP2B' e 'PILAR-2b' "
            "foram pronunciados com perfeição."
        )
        res = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                types.Part.from_bytes(data=audio_bytes, mime_type="audio/wav"),
                prompt,
            ],
        )
        return {"transcript_eval": res.text.strip()}
    except Exception as e:
        return {"transcript_eval": f"(Avaliação ASR opcional indisponível: {e})"}


def generate_take(client: genai.Client, take_idx: int, output_wav: Path, preferred_model: str = "gemini-3.8-flash-tts") -> dict:
    """Gera uma tomada com suporte a modelos primário e fallback automático."""
    models_to_try = [preferred_model]
    if preferred_model != "gemini-3.8-flash-lite-tts":
        models_to_try.append("gemini-3.8-flash-lite-tts")

    last_error = None
    for model_name in models_to_try:
        try:
            print(f"\n" + "-" * 55, flush=True)
            print(f"Gerando Tomada {take_idx} com modelo: {model_name}...", flush=True)
            print(f"Destino: {output_wav.name}", flush=True)

            t0 = time.time()
            interaction = client.interactions.create(
                model=model_name,
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
                    "speech_config": [
                        {"voice": "Sulafat"},
                    ]
                },
                timeout=240.0,
            )
            elapsed = time.time() - t0
            print(f"Resposta recebida com sucesso em {elapsed:.1f}s!", flush=True)

            if not interaction.output_audio or not interaction.output_audio.data:
                raise RuntimeError(f"A API respondeu para a tomada {take_idx}, mas sem dados de áudio.")

            audio_bytes = base64.b64decode(interaction.output_audio.data)
            output_wav.write_bytes(audio_bytes)
            print(f"Áudio salvo em: {output_wav.resolve()}", flush=True)

            stats = verify_wav(output_wav)
            stats["elapsed"] = elapsed
            stats["model"] = model_name
            return stats

        except Exception as e:
            err_str = str(e)
            print(f"Aviso no modelo {model_name}: {err_str}", flush=True)
            last_error = e
            if "429" in err_str or "Rate limit" in err_str or "too_many_requests" in err_str:
                print(f"Alternando para próximo modelo disponível...", flush=True)
                continue
            else:
                raise

    raise RuntimeError(f"Falha ao gerar tomada {take_idx}. Último erro: {last_error}")


def main():
    parser = argparse.ArgumentParser(description="Gera narração em locutora única (Sulafat) para o PILAR-2b.")
    parser.add_argument("--takes", type=int, default=2, help="Número de tomadas a gerar (padrão: 2)")
    parser.add_argument("--model", default="gemini-3.8-flash-lite-tts", help="Modelo preferencial (padrão: gemini-3.8-flash-lite-tts)")
    parser.add_argument("--api-key", default=None, help="Chave da API Gemini (opcional)")
    parser.add_argument("--output", "-o", default=str(DEFAULT_OUTPUT), help=f"Caminho final do arquivo WAV (padrão: {DEFAULT_OUTPUT})")
    args = parser.parse_args()

    key = args.api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        print("\n" + "=" * 60, file=sys.stderr, flush=True)
        print("ERRO: Nenhuma chave de API encontrada!", file=sys.stderr, flush=True)
        print("Configure GEMINI_API_KEY no seu ambiente ou no arquivo .env", file=sys.stderr, flush=True)
        print("=" * 60 + "\n", file=sys.stderr, flush=True)
        sys.exit(1)

    client = genai.Client(api_key=key)

    print("=" * 60, flush=True)
    print("SÍNTESE DE VOZ: PILAR-2b VÍDEO EXPLICATIVO (SULAFAT SOLO)", flush=True)
    print(f"Modelo:         {args.model}", flush=True)
    print("Voz:            Sulafat", flush=True)
    print(f"Tomadas:        {args.takes} tomadas solicitadas", flush=True)
    print(f"Falas:          {len(ROTEIRO)} turnos estruturados", flush=True)
    print("=" * 60, flush=True)

    takes_results = []
    out_final = Path(args.output)
    out_dir = out_final.parent
    out_dir.mkdir(parents=True, exist_ok=True)

    for i in range(1, args.takes + 1):
        if i > 1:
            print("\nAguardando intervalo de 15s entre tomadas...", flush=True)
            time.sleep(15)

        take_file = out_dir / f"pilar2b_sulafat_take{i}.wav"
        stats = generate_take(client, i, take_file, preferred_model=args.model)

        print(f"\nAvaliando alinhamento da Tomada {i}...", flush=True)
        eval_res = evaluate_take(client, take_file)
        stats["eval"] = eval_res["transcript_eval"]
        print(f"Transcrição & Análise:\n{stats['eval']}", flush=True)

        takes_results.append((take_file, stats))

    print("\n" + "=" * 60, flush=True)
    print("RESUMO DAS TOMADAS GERADAS", flush=True)
    print("=" * 60, flush=True)
    for i, (tf, st) in enumerate(takes_results, 1):
        print(f"Tomada {i}: {tf.name} | Duração: {st['duration_s']:.2f}s | Modelo: {st['model']} | Tamanho: {st['size_kb']:.1f} KB", flush=True)

    # Avaliação de ritmo: ritmo explicativo tranquilo
    best_file, best_stats = takes_results[0]
    if len(takes_results) > 1:
        t1_dur = takes_results[0][1]["duration_s"]
        t2_dur = takes_results[1][1]["duration_s"]
        print(f"\nComparativo de duração: Tomada 1 = {t1_dur:.2f}s vs Tomada 2 = {t2_dur:.2f}s", flush=True)
        # Seleciona a tomada mais cadenciada/tranquila (> 45s)
        if t2_dur >= t1_dur:
            best_file, best_stats = takes_results[1]
            print(f"Selecionada Tomada 2 como tomada principal por cadência mais tranquila.", flush=True)
        else:
            print(f"Selecionada Tomada 1 como tomada principal.", flush=True)

    shutil.copy2(best_file, out_final)
    print(f"\nArquivo final salvo em: {out_final.resolve()}", flush=True)
    print(f"Tomadas individuais preservadas em:")
    for tf, _ in takes_results:
        print(f"  - {tf.resolve()}", flush=True)
    print("=" * 60, flush=True)


if __name__ == "__main__":
    main()
