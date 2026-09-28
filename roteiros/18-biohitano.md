# 18 · Biohitano: a aposta do CP2B

| ficha | |
|---|---|
| série | Série B — Além do biogás |
| duração | ~50 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **Q** — quadrinhos |
| twist | dupla de heróis (Hidro & Metaninho) |
| Metaninho | cientista narra a HQ |
| arquivos | imagens `entrada/imagens/ep18/` · música `entrada/musica/musica_ep18.mp3` · voz `entrada/narracao/<idioma>/ep18_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
Um biodigestor que vira dois: no primeiro tanque nasce o hidrogênio, no segundo o metano. As moléculas se
juntam num balão duplo, **biohitano**, e seguem para um ônibus do campus. Liga a pesquisa básica (vinhaça,
torta de filtro) ao Living-Lab de restos de comida.

### Estilo & twist
**Quadrinhos** + **dupla de heróis**. **HQ**: Hidro (H₂, um herói novo, pequeno e veloz) e o **Metaninho** (CH₄) como heróis de capa; a **Arqueia** é quem fabrica o metano na 2ª etapa; quadros de "origem" em cada tanque; a união vira o biohitano (POW!). O **cientista** narra como quem lê a revistinha. Termina sempre com a assinatura CP2B ([ESTILOS.md](ESTILOS.md)).

### Storyboard
| # | cena |
|---|---|
| L01 | Duas moléculas (H₂ e CH₄, em código, com olhinhos) se olham, desconfiadas. |
| L02 | Letras recortadas **BIOHITANO**; carimbo **APOSTA CP2B**. |
| L03 | Biodigestor "se divide" em dois tanques ligados por um cano (tesoura de papel corta). |
| L04 | Tanque 1: bolhas de H₂ sobem; etiqueta "etapa 1". |
| L05 | Tanque 2: bolhas de CH₄; etiqueta "etapa 2". |
| L06 | As moléculas entram num balão duplo e se abraçam; brilho. |
| L07 | Três entradas, uma por palavra: garrafa de vinhaça, montinho de torta de filtro, bandeja de restaurante. |
| L08 | Ônibus do campus de papel abastece e parte por uma rua arborizada. |
| L09 | Balão duplo sobe; cartão final. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| biohitano = hidrogênio + metano; "a aposta" do Eixo 5 | `cp2b_web/src/data/content.js` (Eixo 5) ✔ |
| digestão em duas etapas (H₂ na 1ª, CH₄ na 2ª) | projeto "Optimizing continuous biohydrogen and methane production: one- and two-stage" (Eixo 7) ✔ |
| substratos: vinhaça, torta de filtro, restos de comida | projetos "Biohitano a partir da vinhaça e da torta de filtro"; Living-Lab (restaurantes universitários) ✔ |
| destino: ônibus do campus da Unicamp | projeto Living-Lab ("biohidrogênio e biometano (Biohitano) para ônibus do campus da UNICAMP") ✔ — fala usa "o objetivo é", **confirmar estágio atual** |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep18/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **Q** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **Q**) |
|---|---|
| `dois_tanques` | Two connected biodigester tanks side by side, a smaller one on the left and a bigger one on the right, joined by a pipe, each with its own small gas dome, side view. |
| `pecas_ep18` | Separate items spaced far apart: a campus shuttle bus in green and cream, side view facing right, blank sides (no text); a double balloon (two round balloons tied together); a cafeteria food tray with leftovers. |

Reaproveita: vinhaça e torta de filtro (eps. 04/16), moléculas H₂/CH₄ (código), biodigestor.

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep18.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 54-second educational animation about biogas for all ages (comic book style). Light superhero theme: a bold heroic melody on french horn and clarinet over bouncy pizzicato and brushed snare, a big team-up moment in the second half. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 110 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 56 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Comic-book narrator: dramatic and fun, heroic emphasis on the team-up.
```

**Texto da narração**

```narracao pt-BR
L01 | Hidrogênio ou metano? E se fossem os dois juntos?
L02 | Esse é o biohitano, uma das grandes apostas de pesquisa do CP2B. | fala: Esse é o biohitano, uma das grandes apostas de pesquisa do cê-pê-dois-bê.
L03 | A ideia é dividir a digestão em duas etapas.
L04 | Na primeira, os micróbios produzem hidrogênio…
L05 | …e, na segunda, outros micróbios produzem metano.
L06 | Misturados, os dois formam um combustível renovável — o biohitano!
L07 | Os pesquisadores testam isso com vinhaça, com torta de filtro da cana e com restos de comida.
L08 | E o objetivo é ver esse combustível rodando nos ônibus do campus da Unicamp!
L09 | Biohitano: dois gases, uma energia só!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 18 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 18 --idioma pt-BR        # 2 tomadas
```
