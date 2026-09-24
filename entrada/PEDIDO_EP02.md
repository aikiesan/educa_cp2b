# Pedidos para o episódio 02 — "PILAR-2b: o mapa do biogás de São Paulo"

## 1) Imagens — Nano Banana 2 (Gemini) → salvar em `entrada/imagens/ep02/`

PNG ou JPG na maior resolução disponível, com o **nome de arquivo indicado**. Cole o estilo-mestre no início
de cada prompt. Para manter a família visual do ep. 01, anexe `assets/recortes/v3/vaca_pe.png` (ou outra
imagem do ep. 01) como referência de estilo: *"same paper-collage style as the reference image"*.

**Estilo-mestre (igual ao ep. 01):**

```
Handmade paper-cut collage illustration for a whimsical children's science animation. The object is cut out of textured construction paper with visible paper fibers, slightly irregular scissor-cut and torn edges, layered paper pieces, and a thin white paper border around the entire silhouette like a sticker. Small details drawn with a dark petrol-blue ink pen (#1E3E4C). Limited palette: petrol blue #1E3E4C, dark green #00573A, green #5CA032, lime #B6E03B, amber #D37402, cream #F3EAD8, warm yellow #F2C14E, sky blue #8EC5D6, coral #E4572E, brown #8B5A3C. Flat front/side orthographic view, centered, whole object visible with generous margin. Isolated on a perfectly flat pure magenta (#FF00FF) background. No shadows, no text, no letters, no logos.
```

Em ordem de prioridade (os 3 primeiros são os protagonistas — uma imagem por objeto):

| arquivo | prompt (depois do estilo-mestre) |
|---|---|
| `notebook` | An open laptop computer, straight-on front view, seen very slightly from above so the keyboard deck is visible as a shallow trapezoid below the screen. The lid is upright. Petrol-blue paper bezel with rounded corners; cream and light-grey paper keyboard deck with a few rows of small paper keys and a touchpad. IMPORTANT: the entire screen area inside the bezel is one large clean rectangle (16:10) of perfectly flat pure magenta #FF00FF, like a cut-out hole — no reflections, no interface, no icons, no gradient. The laptop fills most of the image width. |
| `personagens` | Three separate friendly cartoon characters, half body (waist up), facing the viewer, spaced far apart from each other: (1) a public manager woman with a blazer, a lanyard badge and a clipboard; (2) a businessman in shirt and tie holding a folder; (3) a researcher woman in a white lab coat holding a small notebook. Varied skin tones and hair. Simple smiling mouths drawn in ink. IMPORTANT: no eyes and no glasses — leave two plain white oval areas where the eyes would be on each character. |
| `mao_cursor` | Two separate objects spaced far apart: (1) a cartoon paper hand pointing with the index finger, seen from the side, with a small shirt cuff, pointing up-left; (2) a classic computer mouse-pointer arrow made of white paper with a thick petrol-blue outline. |
| `residuos` | Three separate objects spaced far apart: (1) a cheerful city garbage truck, side view facing right, green and cream, blank sides (no text); (2) a small tied cream paper bag overflowing with food scraps (banana peel, apple core, leaves); (3) a friendly whole dairy cow standing, side view facing right, white with petrol-blue patches — IMPORTANT: no eyes, leave two plain white oval areas where the eyes would be. |
| `livros` | Separate items spaced far apart: (1) a stack of four thick hardcover books lying flat, different colors (petrol, green, amber, cream), no text on the spines; (2) two loose scientific article pages, slightly curled, with a title bar, a small chart and grey squiggle lines instead of text; (3) a rolled paper scroll tied with a string. |
| `pinos` | Separate items spaced far apart: four map pins (teardrop map markers with a round hole) in coral, amber, lime and petrol blue; and one magnifying glass with a wooden handle whose round lens area is perfectly flat pure magenta #FF00FF, like a hole. |
| `extras` | Separate small items spaced far apart: a fluffy cloud, a round sun with separate rays, three small leafy sprigs, five small paper stars in yellow, lime and coral. |

Reaproveito do ep. 01: feixe de cana (`cana_feixe`), vaca de pé (`v3/vaca_pe`, se a vaca nova não vier),
sol e nuvens. Pastas, mapa, interface, etiquetas, fita, carimbos e letras são desenhados em código.

## 2) Voz — Gemini TTS, Sulafat → `entrada/pilar2b_sulafat.wav` (+ `_2.wav`)

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python generate_pilar2b_tts.py --tomadas 2
```

Gera duas tomadas (`pilar2b_sulafat.wav` e `pilar2b_sulafat_2.wav`). Se preferir o AI Studio, a direção é:
*"Português do Brasil, sotaque paulista neutro. Narradora de vídeo explicativo: calorosa, clara e confiante,
sorriso na voz, ritmo tranquilo, pausas curtas nas reticências, ênfase leve em 'PILAR-2b' e 'na hora'."*
Eu avalio as duas pelo alinhamento (confiança palavra a palavra + duração) e escolho, a menos que você prefira uma.

## 3) Música — Lyria 3 Pro → `entrada/musica_ep02.mp3` (ou .wav)

Se o Lyria aceitar referência de áudio, anexe `entrada/musica_The_Papercut_Invention.mp3`.

```
Whimsical, optimistic instrumental for a children's paper-cut stop-motion explainer about a map that finds clean energy. Same musical family as "The Papercut Invention": pizzicato strings, marimba and glockenspiel melody, plucked ukulele, upright bass, light woodblock and finger-snap percussion, soft brushed kit, a warm bassoon or clarinet countermelody. A little calmer and more spacious than the reference, steady 100 BPM in 4/4, major key, curious and friendly, never busy — it sits under a narrator. Structure: 2-bar gentle intro (glockenspiel + plucks); verse with a simple memorable hook; around 35 seconds a brighter lift with light strings and claps; a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. Total length 60 seconds. No vocals, no risers, no heavy drums, no sudden tempo changes.
```

Eu corto em compassos inteiros (sem emenda perceptível) para a batida final cair exatamente no cartão do logo.
