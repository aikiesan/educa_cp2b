# 09 · Biometano no tanque

| ficha | |
|---|---|
| série | Série A — Biogás básico |
| duração | ~50 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **C** — colagem de papel |
| twist | rebobinar (VHS) |
| Metaninho | mascote de carona |
| arquivos | imagens `entrada/imagens/ep09/` · música `entrada/musica/musica_ep09.mp3` · voz `entrada/narracao/<idioma>/ep09_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
Um caminhão de papel abastece e sai buzinando. Voltamos no tempo: biogás → purificação → biometano →
gasoduto ou carreta de cilindros ("gasoduto virtual") → posto → caminhão, ônibus e trator.

### Estilo & twist
**Colagem de papel** + **rebobinar**. Começa no fim (caminhão abastecido) e **rebobina** com efeito de fita VHS (listras, ◄◄) até o biodigestor; depois toca pra frente em alta velocidade até a estrada. O **mascote** vai de carona. Termina sempre com a assinatura CP2B ([ESTILOS.md](ESTILOS.md)).

### Storyboard
| # | cena |
|---|---|
| L01 | Caminhão de papel no posto buzina (balão "fom-fom!"); câmera volta rebobinando (fita de vídeo desenhada). |
| L02 | Biodigestor com bolhas. |
| L03 | Máquina de purificação (ep. 01): CO₂ e H₂S caem na lixeira; molécula CH₄ brilhante sai; letras **BIOMETANO**. |
| L04 | Cano leva moléculas por um gasoduto até uma cidade. |
| L05 | Carreta com feixe de cilindros verdes sai da usina; estrada de papel; placa "sem gasoduto" (desenho). |
| L06 | Bomba no posto; caminhão, ônibus e trator em fila, um por palavra. |
| L07 | Motor de papel em corte com pistões girando; carimbo **RENOVÁVEL**. |
| L08 | Estrada em loop: campo → cidade → estrada; cartão final. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| purificação remove CO₂ e impurezas → biometano | ✔ (ep. 01) |
| injeção em gasoduto com o gás natural; parceiro Comgás | ✔ (parceiros CP2B) |
| biometano comprimido transportado em cilindros ("gasoduto virtual") | ✔ prática corrente |
| veículos a gás (caminhão, ônibus, trator) usam biometano | ✔; Unidade Demonstrativa CP2B mira substituir diesel em frotas (ep. 22) |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep09/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **C** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **C**) |
|---|---|
| `carreta_cilindros` | A semi-trailer truck carrying a large bundle of lime-green horizontal gas cylinders, side view facing right, blank sides. |
| `pecas_ep09` | Separate items spaced far apart: a simple gas engine cut-away with two pistons, a road sign post with a crossed-out pipe drawing (no text), a paper cassette tape, a roadside gas station canopy (no text). |

Reaproveita: biodigestor, máquina de purificação, bomba, ônibus, caminhão, trator, casas, fábrica, gasoduto (código).

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep09.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 54-second educational animation about biogas for all ages (paper-cut collage style). Upbeat road-trip groove: driving ukulele strums, bass and brushed kit, bright glockenspiel hook; keep it steady and clean (the rewind effect will be added in post). Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 108 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 56 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Upbeat road-trip energy, playful surprise on the first line.
```

**Texto da narração**

```narracao pt-BR
L01 | Esse caminhão anda com gás feito de lixo e esterco. É sério!
L02 | Tudo começa no biodigestor, com o biogás…
L03 | …que passa por uma limpeza: sai o gás carbônico, saem as impurezas. Nasce o biometano!
L04 | Ele pode seguir pelo gasoduto, junto com o gás natural…
L05 | …ou ser comprimido em cilindros e viajar de carreta até onde o cano não chega.
L06 | No posto, a bomba enche o tanque do caminhão, do ônibus… e até do trator!
L07 | Os motores a gás funcionam do mesmo jeito — só que com combustível renovável.
L08 | Biometano no tanque: energia que sai do campo e da cidade… e volta pra estrada!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 09 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 09 --idioma pt-BR        # 2 tomadas
```
