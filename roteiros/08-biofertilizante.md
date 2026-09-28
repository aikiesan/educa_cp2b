# 08 · Biofertilizante: o que sobra também vale

| ficha | |
|---|---|
| série | Série A — Biogás básico |
| duração | ~48 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **N** — caderno de campo |
| twist | mergulho no solo |
| Metaninho | cientista anota |
| arquivos | imagens `entrada/imagens/ep08/` · música `entrada/musica/musica_ep08.mp3` · voz `entrada/narracao/<idioma>/ep08_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
Aprofunda o final do ep. 01. A câmera mergulha num corte do solo de papel: o digestato chega, minhocas e
raízes aparecem, os nutrientes (N, P, K como bolinhas coloridas) sobem pela raiz e a planta cresce. O ciclo
fecha quando a colheita vira resíduo de novo.

### Estilo & twist
**Caderno de campo** + **mergulho**. Página de **caderno de campo** (kraft, fita washi, folhas prensadas). A câmera **desce** página abaixo, solo adentro, enquanto o **cientista** anota à mão com setas e desenhos. Termina sempre com a assinatura CP2B ([ESTILOS.md](ESTILOS.md)).

### Storyboard
| # | cena |
|---|---|
| L01 | Biodigestor com a escotilha; a lupa espia lá dentro; ponto de interrogação. |
| L02 | Torneira de saída; um creme escuro escorre para um balde; etiqueta "digestato". |
| L03 | Do balde saltam três bolinhas de papel com letras recortadas **N · P · K** (verde, âmbar, azul). |
| L04 | Nariz de papel cheira dois potes: esterco fresco (linhas de cheiro) × digestato (florzinha). |
| L05 | Trator espalha; corte do solo de papel aparece por baixo da lavoura; minhocas com olhinhos. |
| L06 | Raízes crescem em traço à mão; bolinhas NPK sobem; saco de adubo químico encolhe pela metade. |
| L07 | Anel de setas desenhado: planta → prato → sobra → biodigestor. |
| L08 | O anel se fecha com um "clique" e confete. |
| L09 | Brotinho gigante com o título; cartão final. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| digestato mantém N, P, K e é usado como biofertilizante | ✔ (ep. 01; projeto do Eixo 2 "Valorização de digestato… cultivo convencional e hidropônico") |
| digestato é mais estabilizado e com menos odor que o esterco fresco | ✔ conceito consolidado |
| pode substituir parte da adubação mineral | ✔ com manejo — a fala diz "parte" |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep08/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **N** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **N**) |
|---|---|
| `solo_corte` | A wide cross-section of farm soil: grass and a young crop plant on top, layered brown soil strata below with small stones, roots spreading down, wide composition. |
| `pecas_ep08` | Separate items spaced far apart: two cute earthworms (no eyes, two plain white ovals each), a bucket with dark creamy liquid, a small sack of chemical fertilizer (plain, no text), a paper nose, a jar of fresh manure, a jar of dark smooth digestate with a small flower. |

Reaproveita: biodigestor, lupa, trator, plantas, pratos/restos (ep. 01).

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep08.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 52-second educational animation about biogas for all ages (field notebook style). Gentle, earthy and curious: kalimba and marimba with soft warm strings, descending melodic phrases as the camera dives into the soil, a sunny blooming moment when the plant grows. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 90 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 54 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Warm and wonder-filled, a little softer and more intimate as we dive underground, still smiling.
```

**Texto da narração**

```narracao pt-BR
L01 | Depois que o biodigestor faz o biogás… o que sobra lá dentro?
L02 | Sobra o digestato: um material que já foi "digerido" pelos micróbios.
L03 | Ele guarda os nutrientes que as plantas adoram: nitrogênio, fósforo e potássio.
L04 | E, como já está estabilizado, tem bem menos cheiro que o esterco fresco.
L05 | Espalhado na lavoura, ele alimenta o solo…
L06 | …a planta cresce forte — e dá pra trocar parte do adubo químico.
L07 | A planta vira alimento, a sobra vira resíduo, o resíduo volta pro biodigestor…
L08 | É o ciclo se fechando!
L09 | Biofertilizante: o que sobra também vale!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 08 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 08 --idioma pt-BR        # 2 tomadas
```
