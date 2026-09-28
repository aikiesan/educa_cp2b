#!/usr/bin/env python3
"""
Narração de QUALQUER episódio a partir do roteiro em roteiros/NN-*.md — Gemini TTS.

Voz oficial aprovada: Sulafat com sotaque mineiro suave (acolhedora, didática e natural).

O roteiro (parte 4) traz a direção de voz num bloco ```direcao <idioma> e a narração num bloco:
    ```narracao pt-BR
    L01 | texto que aparece na legenda | fala: forma falada (opcional: siglas soletradas, números por extenso)
    L02 | ...
    ```
(um bloco por idioma: pt-BR, en-GB…). O TTS usa a "fala" quando existe; senão, o texto.

uso:
  python tools/tts/gerar_narracao.py 04                # ep. 04, pt-BR, Sulafat (mineiro suave) → entrada/narracao/pt-BR/ep04_pt-BR_Sulafat_take1.wav
  python tools/tts/gerar_narracao.py --serie A                 # todos os eps da Série A (04 a 14, 27)
  python tools/tts/gerar_narracao.py --todos                 # todos os episódios do catálogo
  python tools/tts/gerar_narracao.py 04 --sotaque paulista     # sotaque paulista neutro
  python tools/tts/gerar_narracao.py 04 --voz Zephyr     # outra voz
  python tools/tts/gerar_narracao.py --exportar     # roteiros/NARRACAO_COMPLETA.md
"""
import os
import re
import sys
import base64
import wave
import time
import argparse
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]                 # educa_cp2b
REPO_ROOT = ROOT.parent                # repositório do design system (.env)
ROTEIROS = ROOT / "roteiros"
SAIDA = ROOT / "entrada" / "narracao"  # narracao/<idioma>/epNN_<idioma>_<voz>_takeN.wav
MODELO_PADRAO = "gemini-3.8-flash-lite-tts"

# Vozes do catálogo Gemini TTS. A 1ª é a padrão oficial aprovada.
VOZES = ["Sulafat", "Laomedeia", "Zephyr", "Autonoe", "Leda", "Aoede"]

SOTAQUES = {
    "mineiro": (
        "Brazilian Portuguese with a charming, authentic Minas Gerais (Mineiro) accent. "
        "Gentle, warm, welcoming, with a subtle melodious cadence and soft rhythm. "
        "Not exaggerated, natural and cozy. Clear educational diction, big smile in the voice."
    ),
    "paulista": (
        "Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator "
        "for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm, "
        "playful emphasis on key words, short natural pauses at ellipses and dashes."
    ),
    "nordestino": (
        "Brazilian Portuguese with a subtle, friendly Northeastern (Nordestino) accent. "
        "Engaging, expressive, warm melodious cadence, clear and natural without caricature."
    ),
    "carioca": (
        "Brazilian Portuguese with a light, natural Rio de Janeiro (Carioca) accent. "
        "Friendly, relaxed and articulate, gentle natural cadence without exaggeration."
    ),
}

ESTILO = {
    "pt-BR": SOTAQUES["mineiro"],
    "en-GB": (
        "British English, standard Southern British accent. Upbeat, bright and energetic female narrator for a fun "
        "science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear, playful "
        "emphasis on key words, short natural pauses at the ellipses and dashes. Pronounce Brazilian names the "
        "Brazilian way: São Paulo, Unicamp (oo-nee-KAMP), FAPESP (fah-PESP), NIPE (NEE-pee)."
    ),
}

ESTILO_FINAL = {
    "pt-BR": (
        "Brazilian Portuguese with a charming, authentic Minas Gerais accent. "
        "Upbeat and proud closing line, smiling, slightly slower, with a satisfying sense of closure."
    ),
    "en-GB": "British English, standard Southern British accent. Upbeat and proud closing line, smiling, slightly slower, with a satisfying sense of closure.",
}

SERIES = {
    "A": ["04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "27"],
    "B": ["15", "16", "17", "18"],
    "C": ["03", "19", "20", "21", "22", "23", "24", "25", "26"],
}


def arquivo_do_episodio(ep: str) -> Path:
    fs = sorted(ROTEIROS.glob(f"{int(ep):02d}-*.md")) if ep.isdigit() else sorted(ROTEIROS.glob(f"{ep}*.md"))
    if not fs:
        sys.exit(f"ERRO: não achei roteiros/{ep}-*.md")
    return fs[0]


def ler_narracao(md: Path) -> dict:
    """{idioma: [(id, texto, fala)]} a partir dos blocos ```narracao <idioma>."""
    out = {}
    for lang, corpo in re.findall(r"```narracao[ \t]*([\w-]*)\n(.*?)```", md.read_text(encoding="utf-8"), flags=re.S):
        falas = []
        for linha in corpo.strip().splitlines():
            if not linha.strip() or linha.lstrip().startswith("#"):
                continue
            partes = [p.strip() for p in linha.split("|")]
            if len(partes) < 2:
                continue
            fid, texto = partes[0], partes[1]
            fala = next((p[5:].strip() for p in partes[2:] if p.lower().startswith("fala:")), None)
            falas.append((fid, texto, fala))
        out[lang or "pt-BR"] = falas
    return out


def ler_direcao(md: Path) -> dict:
    """{idioma: direção de voz} dos blocos ```direcao <idioma> do roteiro (parte 4)."""
    return {lang or "pt-BR": " ".join(corpo.split())
            for lang, corpo in re.findall(r"```direcao[ \t]*([\w-]*)\n(.*?)```", md.read_text(encoding="utf-8"), flags=re.S)}


def construir_estilo(idioma: str, direcao_original: str | None, sotaque: str) -> str:
    if idioma != "pt-BR":
        return direcao_original or ESTILO.get(idioma, "")
    
    base_sotaque = SOTAQUES.get(sotaque, SOTAQUES["mineiro"])
    if direcao_original:
        # Extrai instrução de tom específica do episódio se houver (ex.: Tone for this episode: ...)
        m_tom = re.search(r"Tone for this episode:\s*(.*?)$", direcao_original, re.I)
        if m_tom:
            return f"{base_sotaque} Tone for this episode: {m_tom.group(1).strip()}"
        # Se contiver apenas São Paulo accent, substitui pela base do sotaque escolhido
        direcao_adaptada = re.sub(
            r"Brazilian Portuguese[,\s]+neutral S[ãa]o Paulo accent\.?",
            base_sotaque,
            direcao_original,
            flags=re.I
        )
        return direcao_adaptada
    return base_sotaque


def turnos(falas, idioma, direcao_geral):
    t = []
    for i, (fid, texto, fala) in enumerate(falas):
        estilo = ESTILO_FINAL[idioma] if i == len(falas) - 1 else direcao_geral
        t.append({"type": "text", "text": fala or texto, "annotations": [{"type": "speech_metadata", "style": estilo}]})
    return t


def duracao(path: Path) -> float:
    with wave.open(str(path), "rb") as wf:
        return wf.getnframes() / float(wf.getframerate())


def gerar(client, modelo, falas, idioma, voz, destino: Path, direcao_geral):
    t0 = time.time()
    it = client.interactions.create(
        model=modelo,
        input=[{"type": "user_input", "content": turnos(falas, idioma, direcao_geral)}],
        response_format={"type": "audio"},
        generation_config={"speech_config": [{"voice": voz}]},
        timeout=120.0,
    )
    if not it.output_audio or not it.output_audio.data:
        raise RuntimeError("A API respondeu sem áudio.")
    destino.write_bytes(base64.b64decode(it.output_audio.data))
    dur = duracao(destino)
    print(f"  [OK] {destino.name}: {dur:.2f} s  (gerado em {time.time() - t0:.1f} s)", flush=True)
    return dur


def exportar():
    """Junta a narração de todos os roteiros num texto para leitura (teleprompter)."""
    linhas = ["# Narração completa — todos os roteiros", "",
              "Texto para leitura (o que aparece na legenda). A forma falada, quando diferente, vem entre colchetes.", ""]
    for md in sorted(ROTEIROS.glob("[0-9][0-9]-*.md")):
        titulo = md.read_text(encoding="utf-8").splitlines()[0].lstrip("# ").strip()
        for lang, falas in ler_narracao(md).items():
            linhas += [f"## {titulo} · {lang}", ""]
            for fid, texto, fala in falas:
                linhas.append(f"**{fid}** — {texto}" + (f"  \n  *[fala: {fala}]*" if fala else ""))
                linhas.append("")
    (ROTEIROS / "NARRACAO_COMPLETA.md").write_text("\n".join(linhas), encoding="utf-8")
    print("->", ROTEIROS / "NARRACAO_COMPLETA.md")


def processar_episodio(client, modelo, ep_str, idioma, voz, sotaque, tomadas):
    md = arquivo_do_episodio(ep_str)
    nar = ler_narracao(md)
    if idioma not in nar:
        print(f"  [AVISO] {md.name} não tem bloco ```narracao {idioma}. Pulando.")
        return
    falas = nar[idioma]
    dir_orig = ler_direcao(md).get(idioma)
    direcao_final = construir_estilo(idioma, dir_orig, sotaque)
    ep_num = md.name[:2]
    print(f"\n>> [{ep_num}] {md.stem} | {idioma} | {len(falas)} falas | Voz: {voz} ({sotaque})", flush=True)
    for k in range(tomadas):
        dest = SAIDA / idioma / f"ep{ep_num}_{idioma}_{voz}_take{k + 1}.wav"
        dest.parent.mkdir(parents=True, exist_ok=True)
        gerar(client, modelo, falas, idioma, voz, dest, direcao_final)
        if k < tomadas - 1:
            time.sleep(2)


def main():
    ap = argparse.ArgumentParser(description="Gera a narração dos episódios com Gemini TTS.")
    ap.add_argument("episodio", nargs="?", help="número do episódio (ex.: 04) ou início do nome do arquivo")
    ap.add_argument("--serie", choices=["A", "B", "C"], help="Gera todos os episódios da série escolhida (ex.: --serie A)")
    ap.add_argument("--todos", action="store_true", help="Gera todos os episódios do catálogo")
    ap.add_argument("--idioma", default="pt-BR")
    ap.add_argument("--voz", default=VOZES[0])
    ap.add_argument("--sotaque", default="mineiro", choices=list(SOTAQUES.keys()))
    ap.add_argument("--tomadas", type=int, default=1)
    ap.add_argument("--modelo", default=MODELO_PADRAO)
    ap.add_argument("--exportar", action="store_true", help="gera roteiros/NARRACAO_COMPLETA.md e sai")
    ap.add_argument("--api-key", default=None)
    a = ap.parse_args()

    if a.exportar:
        return exportar()

    try:
        from dotenv import load_dotenv
        load_dotenv(dotenv_path=REPO_ROOT / ".env")
        load_dotenv(dotenv_path=ROOT / ".env")
        load_dotenv(dotenv_path=ROOT / "entrada" / ".env")
        load_dotenv(dotenv_path=Path.home() / ".env")
    except ImportError:
        pass

    try:
        from google import genai
    except ImportError:
        sys.exit("ERRO: instale o SDK: pip install -U google-genai python-dotenv")

    key = a.api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not key:
        sys.exit('ERRO: defina GEMINI_API_KEY (PowerShell: $env:GEMINI_API_KEY="...")')
    client = genai.Client(api_key=key)

    if a.todos:
        lista_eps = [f.name[:2] for f in sorted(ROTEIROS.glob("[0-9][0-9]-*.md"))]
    elif a.serie:
        lista_eps = SERIES[a.serie]
    elif a.episodio:
        lista_eps = [a.episodio]
    else:
        ap.error("informe o episódio (ex.: 04), --serie A, --todos ou use --exportar")

    print(f"============================================================")
    print(f"PRODUCAO DE AUDIO EDUCA CP2B - {len(lista_eps)} episodio(s)")
    print(f"Voz: {a.voz} | Sotaque: {a.sotaque} | Modelo: {a.modelo}")
    print(f"============================================================")

    for idx, ep in enumerate(lista_eps):
        processar_episodio(client, a.modelo, ep, a.idioma, a.voz, a.sotaque, a.tomadas)
        if idx < len(lista_eps) - 1:
            time.sleep(3)

    print("\n[OK] Todos os episodios selecionados foram gerados com sucesso!")


if __name__ == "__main__":
    main()
