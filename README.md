# educa CP2B

Animações educativas do **CP2B — Centro Paulista de Estudos em Biogás e Bioprodutos** (NIPE‑Unicamp),
feitas em código: uma "mesa de colagem" em JavaScript que desenha papel recortado, fita crepe, carimbos
e traço à mão quadro a quadro, sincronizada palavra a palavra com a narração.

## 01 · O que é biogás? E biometano?

<p align="center"><img src="docs/previa-ciclo.gif" width="560" alt="Prévia: a câmera se afasta e revela o anel de estações de papel — o ciclo do biogás"></p>

**57 s · 1920×1080 · 24 qps · pt-BR** · baixar na [Release v1.0](https://github.com/aikiesan/educa_cp2b/releases/tag/v1.0):

| versão | arquivo |
|---|---|
| principal (duas vozes) | [`o-que-e-biogas.mp4`](https://github.com/aikiesan/educa_cp2b/releases/download/v1.0/o-que-e-biogas.mp4) · H.264 9 Mb/s + AAC 256 kb/s |
| com legendas embutidas (redes sociais) | [`o-que-e-biogas_legendado.mp4`](https://github.com/aikiesan/educa_cp2b/releases/download/v1.0/o-que-e-biogas_legendado.mp4) |
| narração com uma voz (Sulafat) | [`o-que-e-biogas_voz-unica.mp4`](https://github.com/aikiesan/educa_cp2b/releases/download/v1.0/o-que-e-biogas_voz-unica.mp4) |
| master (CRF 16, para edição/arquivo) | [`o-que-e-biogas_master.mp4`](https://github.com/aikiesan/educa_cp2b/releases/download/v1.0/o-que-e-biogas_master.mp4) |

Legendas [`.vtt`](videos/01-o-que-e-biogas/legendas.pt-BR.vtt) / [`.srt`](videos/01-o-que-e-biogas/legendas.pt-BR.srt) ·
roteiro, storyboard e checagem de conteúdo em [`videos/01-o-que-e-biogas/roteiro.md`](videos/01-o-que-e-biogas/roteiro.md) ·
capa [`docs/capa.jpg`](docs/capa.jpg)

<p align="center"><img src="docs/festa-dos-microbios.jpg" width="720" alt="Quadro do vídeo: o biodigestor com o carimbo SEM O₂! e a lupa mostrando micróbios de chapéu de festa"></p>

Sete estações de papel rasgado dispostas em anel ao redor de um laboratório: sobras → biodigestor
(a festa dos micróbios, vista por uma lupa) → composição do biogás → calor e eletricidade → purificação
→ biometano no gasoduto, em casas, indústrias, caminhões e ônibus → biofertilizante na lavoura. Em
*"fechando o ciclo!"* a câmera se afasta e revela o círculo inteiro; o filme termina no logo CP2B.

### Assistir no navegador (com áudio e legendas)

```bash
npm install
npm run servir
```

Abra <http://127.0.0.1:8080/videos/01-o-que-e-biogas/> (espaço = play/pausa; botão CC = legendas).
A página desenha a animação em tempo real no `<canvas>`, sincronizada ao áudio.

## Como é feito

| etapa | ferramenta | arquivo |
|---|---|---|
| ilustrações recortadas (vaca, biodigestor, máquina, veículos, plantas…) | Nano Banana 2 (Gemini), fundo magenta | `entrada/imagens/` → `tools/preparar_ativos.py` (recorte por chroma key, "defringe", separação de itens) → `assets/recortes/` |
| papel, bordas rasgadas, sombras, traço à mão, letras recortadas, carimbos, micróbios, moléculas | motor próprio `lib/colagem/` (canvas 2D determinístico) | `core.js`, `paper.js`, `shapes.js`, `ink.js`, `sprite.js`, `text.js`, `extras.js`, `stage.js` |
| narração (2 vozes: Sulafat e Puck) | Gemini 3.8 Flash TTS | `entrada/biogas_multispeaker.wav` (roteiro em `videos/01-o-que-e-biogas/roteiro.json`) |
| alinhamento palavra a palavra | torchaudio MMS forced aligner | `tools/audio/alinhar_vo.py` → `audio/vo_alinhamento.json` |
| partitura (tempos de cada palavra, grade de compassos, logo na batida final) | — | `tools/audio/montar_timeline.py` → `videos/01-o-que-e-biogas/timeline.json` |
| trilha "The Papercut Invention" | Lyria 3 Pro | editada em compasso (corte de 4 compassos que preserva a frase musical) |
| efeitos sonoros (papel, pops, bolhas, mola, carimbo, fogo, sinos, máquina, trator…) | sintetizados do zero | `tools/audio/sfx.py` (146 eventos exportados pela própria cena) |
| mixagem (ducking sob a voz, EQ, compressão, −15 LUFS, pico real ≤ −1 dBTP) | pedalboard + pyloudnorm + Rubber Band | `tools/audio/mixar.py` → `audio/mix.wav`, `audio/mix.m4a` |
| render quadro a quadro (com desfoque de movimento nas viradas de câmera) | Playwright + Chromium (GPU) + ffmpeg (x264) | `tools/render.mjs` |

A animação é **função pura do tempo**: o mesmo instante gera sempre o mesmo quadro. Todas as deixas
visuais e sonoras são ancoradas em palavras da narração (`at('L03', 'micróbios')`), então trocar a
narração e rodar o pipeline de novo re-sincroniza tudo.

### Refazer o vídeo

```bash
# 1. ambiente Python (ferramentas de áudio/imagem)
python -m venv .venv && .venv/Scripts/pip install -r tools/requirements.txt
# 2. (se trocar as ilustrações) recortar os PNGs
python tools/preparar_ativos.py
# 3. (se trocar a narração) alinhar e montar a partitura
python tools/audio/alinhar_vo.py entrada/biogas_multispeaker.wav      # requer torch + torchaudio
python tools/audio/montar_timeline.py
python tools/legendas.py
# 4. exportar as deixas de efeitos e mixar
npm run sfx
python tools/audio/mixar.py
# 5. renderizar
npm run render
```

Variações pela URL da página: `?cc=1` (legendas desenhadas no quadro), `?tl=timeline_single.json&audio=audio/mix_single.m4a`
(versão com uma voz). Para a versão de uma voz: `montar_timeline.py --alinhamento audio/vo_alinhamento_single.json --tempo 1.05 --pausas 0.8 --saida .../timeline_single.json`.
A codificação de distribuição (2 passagens, ~9 Mb/s) está em `tools/codificar.sh` (use `--keep` no render para manter os quadros PNG).

A fonte da marca (Neulis Sans) tem licença comercial e **não** está no repositório: coloque os `.otf`
em `assets/fonts/licenciadas/` (ignorado pelo git). Sem ela, o slogan final usa uma fonte livre.

`tools/audio/tts_qwen.py` e `tts_voxcpm.py` são alternativas locais de narração (Qwen3-TTS / VoxCPM2, Apache-2.0),
e `avaliar_vo.py` pontua tomadas (WER, sotaque PT-BR, MOS) — não usados na versão final, que usa Gemini TTS.

## Créditos e licenças

Ver [`CREDITOS.md`](CREDITOS.md).
