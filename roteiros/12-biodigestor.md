# 12 · Por dentro do biodigestor

| ficha | |
|---|---|
| série | Série A — Biogás básico |
| duração | ~52 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **B** — planta técnica |
| twist | raio-X / visita guiada |
| Metaninho | cientista guia |
| arquivos | imagens `entrada/imagens/ep12/` · música `entrada/musica/musica_ep12.mp3` · voz `entrada/narracao/<idioma>/ep12_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
O biodigestor do ep. 01 é "aberto" como uma maquete de papel em corte. Cada parte ganha uma etiqueta:
entrada, tanque sem ar, mistura, temperatura, cúpula de gás e saída. No fim, dois modelos comuns:
a lagoa coberta das fazendas e o tanque com mistura.

### Estilo & twist
**Planta técnica** + **raio-X / visita guiada**. Começa como **planta técnica** azul (linhas brancas); a cada fala uma parte **ganha cor e textura de papel**; o **cientista** guia com uma varinha de apontar. Termina sempre com a assinatura CP2B ([ESTILOS.md](ESTILOS.md)).

### Storyboard
| # | cena |
|---|---|
| L01 | Biodigestor inteiro; tesoura de papel "corta" e a frente abre como porta — vista em corte. |
| L02 | Funil de entrada; resíduos entram; etiqueta "entrada". |
| L03 | Cadeado + carimbo **SEM O₂** (ep. 01); molécula O₂ fica do lado de fora. |
| L04 | Termômetro de papel com carinha tranquila; ondas de calor suaves. |
| L05 | Hélice de papel gira devagar; micróbios passam de mão em mão. |
| L06 | Bolhas sobem até a cúpula, que infla; etiqueta "biogás". |
| L07 | Ampulheta de papel vira; saída do outro lado; balde de biofertilizante. |
| L08 | Dois recortes lado a lado: lagoa coberta (lona escura) × tanque cilíndrico com misturador. |
| L09 | Biodigestor fecha de novo; os micróbios acenam pela escotilha; cartão final. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| ausência de oxigênio, temperatura estável, mistura, tempo de retenção, armazenamento do gás, saída de digestato | conceitos básicos de digestão anaeróbia ✔ |
| lagoa coberta (comum em fazendas) e reator de mistura completa (CSTR) | tipos correntes ✔ — **confirmar com o Eixo 3 se querem citar outro modelo (ex.: UASB para vinhaça)** |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep12/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **C** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **C** — os recortes que "ganham cor" sobre a planta técnica) |
|---|---|
| `biodigestor_corte` | A cut-away cross-section of a cylindrical biodigester tank, front view: feeding funnel on the left, brown liquid inside with a slow mixer propeller in the middle, a lime-green gas dome on top holding bubbles, an outlet pipe on the right with a tap, a small thermometer on the wall. Leave the inside liquid area plain brown (microbes will be added later). |
| `lagoa_coberta` | A covered anaerobic lagoon on a farm: a long low rectangular pond covered by a dark green inflated plastic dome, a pipe coming out of it, grass around — side-front view. |
| `pecas_ep12` | Separate items spaced far apart: a pair of scissors, a thermometer with a calm face (no eyes, two plain white ovals), an hourglass, a mixer propeller, a padlock. |

Reaproveita: biodigestor inteiro, micróbios, moléculas, carimbo SEM O₂, balde (ep. 08).

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep12.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 56-second educational animation about biogas for all ages (blueprint style). Discovery and wonder: marimba arpeggios with soft warm pads and gentle pulses, each new section adding an instrument, as if a blueprint is coming to life in colour. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 98 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 58 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Friendly tour-guide voice: inviting and clear, pointing things out with enthusiasm.
```

**Texto da narração**

```narracao pt-BR
L01 | Já imaginou o que acontece dentro de um biodigestor? Vamos abrir um!
L02 | Tudo entra por aqui: os resíduos, bem misturadinhos.
L03 | Lá dentro não pode ter oxigênio — é um tanque bem fechado.
L04 | Os micróbios gostam de um ambiente morninho e estável, sem susto.
L05 | Um misturador mexe devagar, pra comida chegar a todo mundo.
L06 | O biogás sobe e fica guardado aqui em cima, na cúpula.
L07 | E, depois de um tempo lá dentro, o material pronto sai do outro lado, como biofertilizante.
L08 | Tem biodigestor de vários jeitos: a lagoa coberta, comum nas fazendas, e o tanque com misturador, das usinas.
L09 | Por fora, parece simples. Por dentro, é uma cozinha de micróbios!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 12 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 12 --idioma pt-BR        # 2 tomadas
```
