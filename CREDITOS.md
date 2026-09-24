# Créditos

**Produção:** CP2B — Centro Paulista de Estudos em Biogás e Bioprodutos (NIPE‑Unicamp) · educa CP2B
**Roteiro, direção de arte, animação, desenho de som e mixagem:** feitos com Claude (Anthropic) a partir
do briefing da equipe CP2B.

## Material gerado pela equipe CP2B

- **Ilustrações recortadas** (vaca, biodigestor, máquina de purificação, laboratório, restos de comida,
  resíduos da lavoura, casas, fábrica, veículos, posto, plantas, sol e nuvens): geradas com
  **Nano Banana 2 (Google Gemini)** — `entrada/imagens/`.
- **Narração** (vozes *Sulafat* e *Puck*): gerada com **Gemini 3.8 Flash TTS** — `entrada/biogas_multispeaker.wav`
  (versão alternativa com uma voz: `entrada/biogas_single_sulafat.wav`). Script: `entrada/generate_biogas_tts.py`.
- **Trilha** "The Papercut Invention": gerada com **Lyria 3 Pro** — `entrada/musica_The_Papercut_Invention.mp3`.
- **Episódio 02** — recortes (notebook, personagens, mão, cursor, livros, artigos, alfinetes, lupa, caminhão de lixo,
  vaca, saco de restos, ramos, nuvem): **Nano Banana 2** (`entrada/imagens/ep02/GERACAO_FINAL_MELHOR.jpg`);
  narração *Sulafat*: **Gemini 3.8 Flash TTS** (`entrada/pilar2b_sulafat_take2.wav`, script `entrada/generate_pilar2b_tts.py`);
  trilha "Sunlight on the Workbench": **Lyria 3 Pro** (`entrada/Sunlight_on_the_Workbench.mp3`).
- **Dados do mapa (ep. 02)**: malha municipal do **IBGE** e potencial de biogás por município do **PILAR-2b**
  (`analysis/data/02_municipality_summary_SP_2023.csv`, repositório aikiesan/Pilar-2b) — usados só como classes de cor.
- **Marca CP2B**: logotipo e slogan conforme o *Manual de Identidade Visual CP2B* (jul. 2025).

## Fontes tipográficas (arquivos em `assets/fonts/`)

| fonte | licença |
|---|---|
| Caveat, Caveat Brush, Gochi Hand, Kalam, Bungee, Alfa Slab One, Abril Fatface, Anton, Titan One, Archivo Black, Lilita One, Shrikhand | SIL Open Font License 1.1 (`assets/fonts/OFL-Caveat.txt`) |
| Luckiest Guy, Ultra | Apache License 2.0 (`assets/fonts/LICENSE-Apache-2.0.txt`) |
| Neulis Sans / Neulis Neue (fonte da marca) | licença comercial — **não distribuída** neste repositório |

Todas obtidas do repositório oficial [google/fonts](https://github.com/google/fonts).

## Efeitos sonoros e texturas

Todos os efeitos sonoros (`tools/audio/sfx.py`) e todas as texturas de papel (`lib/colagem/paper.js`)
são **sintetizados proceduralmente** — nenhum arquivo de terceiros.

## Ferramentas

Playwright/Chromium, ffmpeg (x264, Rubber Band), Python (NumPy, SciPy, soundfile, pyloudnorm,
Spotify pedalboard, Pillow), torchaudio (alinhador MMS), faster-whisper (checagem de transcrição).
