#!/usr/bin/env python3
"""
Geração de narração em lote com Microsoft Edge-TTS (100% Gratuito, Sem Chave, Ilimitado).

Alterna as vozes oficiais aprovadas:
  - pt-BR-FranciscaNeural (Francisca: clássica, acolhedora, explicativa)
  - pt-BR-ThalitaMultilingualNeural (Thalita: jovem, moderna, dinâmica)

Salva em entrada/narracao/edge/epNN_pt-BR_<Voz>_take1.wav (24 kHz, 16-bit PCM Mono) e .mp3.

Uso:
  python tools/tts/gerar_narracao_edge.py 04                  # ep. 04 individual
  python tools/tts/gerar_narracao_edge.py --serie A           # Série A (eps 04 a 14, 27) alternando vozes
  python tools/tts/gerar_narracao_edge.py --todos             # Todos os episódios alternando vozes
  python tools/tts/gerar_narracao_edge.py 04 --voz Francisca  # Força Francisca
  python tools/tts/gerar_narracao_edge.py 04 --voz Thalita    # Força Thalita
"""
import os
import re
import sys
import wave
import time
import asyncio
import subprocess
import argparse
from pathlib import Path
import edge_tts

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
ROTEIROS = ROOT / "roteiros"
SAIDA = ROOT / "entrada" / "narracao" / "edge"

VOZES = {
    "Francisca": "pt-BR-FranciscaNeural",
    "Thalita": "pt-BR-ThalitaMultilingualNeural",
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


def ler_narracao(md: Path, idioma="pt-BR") -> list[tuple[str, str, str | None]]:
    """[(id, texto, fala)] a partir dos blocos ```narracao <idioma>."""
    corpos = re.findall(rf"```narracao[ \t]*{idioma}\n(.*?)```", md.read_text(encoding="utf-8"), flags=re.S)
    if not corpos:
        # Fallback sem idioma explícito
        corpos = re.findall(r"```narracao\n(.*?)```", md.read_text(encoding="utf-8"), flags=re.S)
    if not corpos:
        return []
    falas = []
    for linha in corpos[0].strip().splitlines():
        if not linha.strip() or linha.lstrip().startswith("#"):
            continue
        partes = [p.strip() for p in linha.split("|")]
        if len(partes) < 2:
            continue
        fid, texto = partes[0], partes[1]
        fala = next((p[5:].strip() for p in partes[2:] if p.lower().startswith("fala:")), None)
        falas.append((fid, texto, fala))
    return falas


def escolher_voz(ep_str: str, voz_forcada: str | None = None) -> tuple[str, str]:
    if voz_forcada and voz_forcada in VOZES:
        return voz_forcada, VOZES[voz_forcada]
    
    # Alternância automática: pares = Francisca, ímpares = Thalita
    try:
        num = int(ep_str)
        if num % 2 == 0:
            return "Francisca", VOZES["Francisca"]
        else:
            return "Thalita", VOZES["Thalita"]
    except ValueError:
        return "Francisca", VOZES["Francisca"]


def montar_texto(falas: list[tuple[str, str, str | None]]) -> str:
    """Junta as falas aplicando pequenas pausas naturais entre cenas."""
    linhas = []
    for fid, texto, fala in falas:
        frase = (fala or texto).strip()
        # Garante pontuação final suave para respiração do sintetizador
        if not frase.endswith((".", "!", "?", "…")):
            frase += "."
        linhas.append(frase)
    return "\n\n".join(linhas)


async def sintetizar_episodio(ep_str: str, voz_nome: str, voz_codigo: str) -> Path:
    md = arquivo_do_episodio(ep_str)
    falas = ler_narracao(md, "pt-BR")
    if not falas:
        print(f"  [AVISO] {md.name} não tem falas em pt-BR. Pulando.")
        return None
    
    ep_num = f"{int(ep_str):02d}" if ep_str.isdigit() else ep_str
    SAIDA.mkdir(parents=True, exist_ok=True)
    dest_mp3 = SAIDA / f"ep{ep_num}_pt-BR_{voz_nome}_take1.mp3"
    dest_wav = SAIDA / f"ep{ep_num}_pt-BR_{voz_nome}_take1.wav"
    
    texto_completo = montar_texto(falas)
    
    t0 = time.time()
    communicate = edge_tts.Communicate(texto_completo, voz_codigo, rate="+2%")
    await communicate.save(str(dest_mp3))
    
    # Converter para WAV 24 kHz Mono 16-bit PCM padrão da série
    cmd_ffmpeg = [
        "ffmpeg", "-y", "-i", str(dest_mp3),
        "-ar", "24000", "-ac", "1", str(dest_wav)
    ]
    subprocess.run(cmd_ffmpeg, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    
    with wave.open(str(dest_wav), "rb") as wf:
        dur = wf.getnframes() / float(wf.getframerate())
    
    elapsed = time.time() - t0
    print(f"  [OK] ep{ep_num} ({md.stem}) | Voz: {voz_nome} | {dur:.2f} s | gerado em {elapsed:.2f} s", flush=True)
    return dest_wav


async def main_async():
    ap = argparse.ArgumentParser(description="Gera a narração dos episódios com Edge-TTS.")
    ap.add_argument("episodio", nargs="?", help="número do episódio (ex.: 04) ou início do nome do arquivo")
    ap.add_argument("--serie", choices=["A", "B", "C"], help="Gera todos os episódios da série escolhida (ex.: --serie A)")
    ap.add_argument("--todos", action="store_true", help="Gera todos os episódios do catálogo")
    ap.add_argument("--voz", choices=["Francisca", "Thalita"], help="Força uma voz específica (sem alternar)")
    a = ap.parse_args()

    if a.todos:
        lista_eps = [f.name[:2] for f in sorted(ROTEIROS.glob("[0-9][0-9]-*.md"))]
    elif a.serie:
        lista_eps = SERIES[a.serie]
    elif a.episodio:
        lista_eps = [a.episodio]
    else:
        ap.error("informe o episódio (ex.: 04), --serie A ou --todos")

    print("=" * 65)
    print(f"PRODUCAO DE AUDIO EDGE-TTS (100% GRATUITO) - {len(lista_eps)} episodio(s)")
    if a.voz:
        print(f"Voz fixa: {a.voz}")
    else:
        print("Modo: Alternando automaticamente entre Francisca e Thalita")
    print("=" * 65)

    gerados = []
    t_total_inicio = time.time()

    for ep in lista_eps:
        v_nome, v_cod = escolher_voz(ep, a.voz)
        out = await sintetizar_episodio(ep, v_nome, v_cod)
        if out:
            gerados.append((ep, v_nome, out))
        await asyncio.sleep(0.5)

    t_total = time.time() - t_total_inicio
    print("\n" + "=" * 65)
    print(f"[CONCLUIDO] {len(gerados)} audios gerados com sucesso em {t_total:.1f} s!")
    print(f"Arquivos salvos em: {SAIDA}")
    print("=" * 65)


def main():
    asyncio.run(main_async())


if __name__ == "__main__":
    main()
