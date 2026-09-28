# 15 · Bioprodutos: muito além da energia

| ficha | |
|---|---|
| série | Série B — Além do biogás |
| duração | ~50 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **D** — maquete de papelão |
| twist | comercial retrô de TV |
| Metaninho | mascote garoto-propaganda |
| arquivos | imagens `entrada/imagens/ep15/` · música `entrada/musica/musica_ep15.mp3` · voz `entrada/narracao/<idioma>/ep15_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
Uma "vitrine de loja" de papel com prateleiras. Cada prateleira ganha um produto que sai da cadeia do
biogás: biometano, biofertilizante, gás carbônico recuperado, ácidos orgânicos, biohitano e até materiais
tirados do lodo. O recado: o resíduo vira muito mais que energia.

### Estilo & twist
**Maquete de papelão** + **comercial retrô**. Anúncio de TV antiga: moldura de TV de **papelão**, cores levemente desbotadas, estrelinhas, "jingle" na trilha; o **mascote** é o garoto-propaganda da vitrine. Piada visual no fim: plaquinha "não está à venda — está na pesquisa!". Termina sempre com a assinatura CP2B ([ESTILOS.md](ESTILOS.md)).

### Storyboard
| # | cena |
|---|---|
| L01 | Chama azul de papel; a câmera recua e revela uma estante vazia. |
| L02 | Letras recortadas **BIOPRODUTOS** sobre a estante; resíduos entram por um funil no topo. |
| L03 | Cilindro verde de biometano pousa na prateleira 1; ônibus e fogão pequenos ao lado. |
| L04 | Saco de biofertilizante com broto na prateleira 2. |
| L05 | Cilindro de CO₂ azul; balão desenhado com bolhas de refrigerante e uma estufa pequena. |
| L06 | Frasquinhos de laboratório (âmbar, lima) na prateleira 3; etiqueta "ácidos orgânicos". |
| L07 | Balão duplo H₂ + CH₄ (moléculas em código) na prateleira 4. |
| L08 | Pote de gel verde tirado do lodo (etiqueta "do lodo") na prateleira 5; lupa. |
| L09 | Estante cheia com brilho; cartão final. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| biometano substitui gás natural e diesel | ✔ (Unidade Demonstrativa: "substituindo diesel em frotas") |
| digestato/biofertilizante | ✔ |
| CO₂ do biogás pode ser recuperado para uso industrial | ✔ conceito (upgrading) — **confirmar com o Eixo 5 se o CP2B pesquisa isso** |
| ácidos orgânicos de alto valor a partir da vinhaça | ✔ Eixo 5 / projeto "Biorrefinaria de Vinhaça e Resíduos da Cana" |
| biohitano (H₂ + CH₄) | ✔ Eixo 5 ("a aposta é o biohitano") |
| material a partir do lodo | ✔ projeto do Eixo 3 "bioproduto à base de alginato extraído de lodo granular" — **confirmar se pode ser citado** |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep15/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **D** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **D**) |
|---|---|
| `estante` | A tall wooden shop shelf unit with five empty shelves, front view, wide composition. |
| `pecas_ep15` | Separate items spaced far apart: a lime-green biomethane gas cylinder, a petrol-blue CO₂ gas cylinder, a sack of organic fertilizer with a sprout (no text), three small laboratory flasks with amber and lime liquids, a small jar of green translucent gel, a small greenhouse, a soda glass with bubbles. |

Reaproveita: ônibus, fogão, funil/máquina, lupa, moléculas (código), biohitano (ep. 18).

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep15.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 54-second educational animation about biogas for all ages (cardboard diorama style). Retro 1960s TV-commercial jingle: vibraphone, bright pizzicato, bouncy upright bass, a whistling-like flute melody, optimistic and a bit cheesy in a charming way (no vocals). Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 104 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 56 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Cheerful retro TV announcer: bright, bouncy, a little theatrical, with a wink.
```

**Texto da narração**

```narracao pt-BR
L01 | Biogás é energia, né? Mas ele pode ser muito mais!
L02 | Da mesma cadeia saem vários bioprodutos — produtos feitos a partir da biomassa e dos resíduos.
L03 | O biometano, que substitui o gás natural e o diesel…
L04 | …o biofertilizante, que volta pro campo…
L05 | …e até o gás carbônico, que pode ser recuperado e usado pela indústria.
L06 | Os pesquisadores também tiram da vinhaça ácidos orgânicos de alto valor…
L07 | …e testam novos combustíveis, como o biohitano: hidrogênio e metano juntos!
L08 | Tem pesquisa até pra transformar o lodo em matéria-prima de novos materiais.
L09 | Bioprodutos: o resíduo de hoje é a prateleira de amanhã!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 15 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 15 --idioma pt-BR        # 2 tomadas
```
