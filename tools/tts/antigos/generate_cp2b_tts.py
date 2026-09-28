#!/usr/bin/env python3
"""
Narração do episódio 03 (CP2B institucional) em PT-BR e EN-UK — Gemini TTS, voz Sulafat.
Modelo: gemini-3.8-flash-tts · SDK: google-genai · API: client.interactions.create

uso:  python generate_cp2b_tts.py --idioma pt-BR            (2 tomadas → cp2b_pt-BR_take1.wav, _take2.wav)
      python generate_cp2b_tts.py --idioma en-GB --tomadas 2
      python generate_cp2b_tts.py --idioma en-GB --voz Kore   (se quiser testar outra voz no inglês)
A chave vem de GEMINI_API_KEY (ambiente ou .env ao lado deste script / no diretório do usuário).
Siglas vão na forma falada; legenda e tela mostram a grafia (ver videos/03-cp2b/<idioma>/roteiro.json).
"""
import os
import sys
import base64
import wave
import time
import argparse
from pathlib import Path
from dotenv import load_dotenv

HERE = Path(__file__).resolve().parent
load_dotenv(dotenv_path=HERE / ".env")
load_dotenv(dotenv_path=Path.home() / ".env")

try:
    from google import genai
except ImportError:
    print("ERRO: instale o SDK:  pip install -U google-genai python-dotenv", file=sys.stderr)
    sys.exit(1)

MODELO = "gemini-3.8-flash-tts"

ESTILOS = {
    "pt-BR": (
        "Brazilian Portuguese, neutral São Paulo accent. Institutional explainer narrator: warm, confident and "
        "inspiring, smiling voice, clear diction, calm and steady pace (never rushed), short natural pauses at the "
        "ellipses and dashes, light emphasis on 'cê-pê-dois-bê'."
    ),
    "en-GB": (
        "British English, standard Southern British (RP-like) accent. Institutional explainer narrator: warm, "
        "confident and inspiring, smiling voice, clear diction, calm and steady pace (never rushed), short natural "
        "pauses at the ellipses and dashes. Say 'CP2B' as 'C-P-two-B'. Pronounce Brazilian names the Brazilian way: "
        "São Paulo, Unicamp (oo-nee-KAMP), FAPESP (fah-PESP), NIPE (NEE-pee)."
    ),
}
FINAL = {
    "pt-BR": "Brazilian Portuguese, neutral São Paulo accent. Warm, proud and inspiring closing line, slightly slower, satisfying sense of closure.",
    "en-GB": "British English, standard Southern British accent. Warm, proud and inspiring closing line, slightly slower, satisfying sense of closure. Say 'CP2B' as 'C-P-two-B'.",
}

FALAS = {
    "pt-BR": [
        "Resíduo... <short pause> ou recurso?",
        "São Paulo gera muitos resíduos orgânicos, no campo e nas cidades... <short pause> mas só uma pequena parte vira energia.",
        "Pra mudar isso, nasceu o cê-pê-dois-bê: o Centro Paulista de Estudos em Biogás e Bioprodutos.",
        "Com sede no NIPE, na Unicamp, e apoio da FAPESP.",
        "Nossa missão: transformar resíduos em biogás, biometano e bioprodutos... com ciência, tecnologia e impacto social.",
        "Funcionamos como um laboratório vivo, testando soluções no campo... do inventário de resíduos às políticas públicas.",
        "Uma rede de pesquisadores, universidades e empresas, no Brasil e no exterior.",
        "Com excelência, ética, diversidade e compromisso com a sociedade.",
        "Queremos fazer de São Paulo uma vitrine de soluções em biogás... <short pause> e uma referência na América Latina.",
        ("Cê-pê-dois-bê: <short pause> energia viva, ciência que transforma.", "final"),
    ],
    "en-GB": [
        "Waste... <short pause> or resource?",
        "São Paulo produces a great deal of organic waste, on farms and in cities... <short pause> yet only a small share becomes energy.",
        "To change that, C-P-two-B was born: the São Paulo Center for Studies in Biogas and Bioproducts.",
        "Based at NIPE, at Unicamp, and supported by FAPESP.",
        "Our mission: turning waste into biogas, biomethane and bioproducts... through science, technology and social impact.",
        "We work as a living lab, testing solutions in the field... from waste inventories to public policy.",
        "A network of researchers, universities and companies, in Brazil and abroad.",
        "Driven by excellence, ethics, diversity and a commitment to society.",
        "We want São Paulo to become a showcase for biogas solutions... <short pause> and a benchmark across Latin America.",
        ("C-P-two-B: <short pause> living energy, science that transforms.", "final"),
    ],
}


def turno(texto: str, estilo: str) -> dict:
    return {"type": "text", "text": texto, "annotations": [{"type": "speech_metadata", "style": estilo}]}


def roteiro(idioma: str) -> list:
    out = []
    for f in FALAS[idioma]:
        texto, tipo = (f if isinstance(f, tuple) else (f, None))
        out.append(turno(texto, FINAL[idioma] if tipo == "final" else ESTILOS[idioma]))
    return out


def duracao(path: Path) -> float:
    with wave.open(str(path), "rb") as wf:
        return wf.getnframes() / float(wf.getframerate())


def gerar(client, idioma: str, voz: str, destino: Path):
    t0 = time.time()
    it = client.interactions.create(
        model=MODELO,
        input=[{"type": "user_input", "content": roteiro(idioma)}],
        response_format={"type": "audio"},
        generation_config={"speech_config": [{"voice": voz}]},
        timeout=240.0,
    )
    if not it.output_audio or not it.output_audio.data:
        raise RuntimeError("A API respondeu sem áudio.")
    destino.write_bytes(base64.b64decode(it.output_audio.data))
    print(f"  {destino.name}: {duracao(destino):.2f} s  (API {time.time() - t0:.0f} s)", flush=True)


def main():
    ap = argparse.ArgumentParser(description="Gera a narração do ep. 03 (CP2B institucional) com Gemini TTS.")
    ap.add_argument("--idioma", choices=sorted(FALAS), required=True)
    ap.add_argument("--voz", default="Sulafat")
    ap.add_argument("--tomadas", type=int, default=2)
    ap.add_argument("--api-key", default=None)
    a = ap.parse_args()
    key = a.api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        print('ERRO: defina GEMINI_API_KEY (PowerShell: $env:GEMINI_API_KEY="...")', file=sys.stderr)
        sys.exit(1)
    client = genai.Client(api_key=key)
    print(f"{MODELO} · {a.voz} · {a.idioma} · {len(FALAS[a.idioma])} falas · {a.tomadas} tomada(s)", flush=True)
    for k in range(a.tomadas):
        gerar(client, a.idioma, a.voz, HERE / f"cp2b_{a.idioma}_take{k + 1}.wav")


if __name__ == "__main__":
    main()
