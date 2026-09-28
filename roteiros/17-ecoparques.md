# 17 · Ecoparques: a sobra de um é a matéria-prima do outro

| ficha | |
|---|---|
| série | Série B — Além do biogás |
| duração | ~50 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **D** — maquete de papelão |
| twist | jogo de tabuleiro |
| Metaninho | mascote é o peão |
| arquivos | imagens `entrada/imagens/ep17/` · música `entrada/musica/musica_ep17.mp3` · voz `entrada/narracao/<idioma>/ep17_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
Um quarteirão de papel visto de cima, como tabuleiro de jogo: usina, granja, cidade, estufa e um
biodigestor no meio. Barbantes coloridos mostram quem entrega o quê para quem, até formar uma teia
fechada. É a ideia de ecoparque do CP2B.

### Estilo & twist
**Maquete de papelão** + **jogo de tabuleiro**. A maquete de **papelão** vista de cima é um tabuleiro; um dado de papelão rola a cada fala e o **mascote** é o peão que anda de lote em lote. Termina sempre com a assinatura CP2B ([ESTILOS.md](ESTILOS.md)).

### Storyboard
| # | cena |
|---|---|
| L01 | Tabuleiro de papel visto de cima com lotes vazios. |
| L02 | Usina cai no lote 1; gotas de vinhaça e pilha de bagaço. |
| L03 | Granja no lote 2 com porquinhos (ep. 05). |
| L04 | Casas e restaurante no lote 3; saco de restos. |
| L05 | Biodigestor no centro; barbantes coloridos partem de cada lote até ele. |
| L06 | Barbantes de volta: raio de energia para usina e casas; caminhão a biometano circula. |
| L07 | Barbante verde para lavoura e estufa; brotos. |
| L08 | A teia se fecha; letras recortadas **ECOPARQUE**. |
| L09 | Todos os lotes acenam (bandeirinhas); cartão final. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| ecopolos/ecoparques integrando setores | resumo executivo CP2B ("integração com outros setores por meio de ecopólos ou ecoparques") ✔ |
| trocas de resíduos, energia e biofertilizante (simbiose industrial) | conceito ✔ — exemplo ilustrativo, **não é um ecoparque específico** (dizer isso na legenda? decidir com a equipe) |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep17/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **D** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **D**) |
|---|---|
| `tabuleiro` | A top-down view of an empty board-game-like neighbourhood map: green grass lots separated by light grey paper roads, a round empty plot in the centre, wide composition. |
| `pecas_ep17` | Separate top-down (bird's-eye) items spaced far apart: a sugarcane mill, a livestock barn, a small group of houses with a restaurant, a greenhouse, a crop field, a round biodigester seen from above. |

Reaproveita: usina (ep. 04), granja e animais (ep. 05), casas, caminhão, biodigestor, barbante (código).

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep17.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 54-second educational animation about biogas for all ages (cardboard diorama style). Playful board-game music: a hopping step-by-step marimba motif, dice-roll woodblock rolls, ukulele and claps, cheerful and cooperative. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 104 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 56 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Playful game-night energy, like explaining the rules of a fun board game.
```

**Texto da narração**

```narracao pt-BR
L01 | Imagina um bairro onde a sobra de um vizinho é o ingrediente do outro.
L02 | A usina de cana tem vinhaça e bagaço…
L03 | …a granja tem esterco…
L04 | …e a cidade tem restos de comida.
L05 | No meio de todo mundo, um biodigestor transforma tudo isso em biogás.
L06 | A energia volta pra usina e pra cidade, o biometano abastece os caminhões…
L07 | …e o biofertilizante vai pras lavouras e pra estufa.
L08 | Isso é um ecoparque: empresas e cidades trabalhando juntas, em ciclo.
L09 | Ecoparques: quando todo mundo ganha com o resíduo!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 17 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 17 --idioma pt-BR        # 2 tomadas
```
