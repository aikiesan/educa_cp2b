# 21 · Living-Lab: comida que vira combustível no campus

| ficha | |
|---|---|
| série | Série C — CP2B por dentro |
| duração | ~50 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **D** — maquete de papelão |
| twist | corrida contra o relógio |
| Metaninho | mascote de passageiro |
| arquivos | imagens `entrada/imagens/ep21/` · música `entrada/musica/musica_ep21.mp3` · voz `entrada/narracao/<idioma>/ep21_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
Um projeto de destaque do CP2B contado como **corrida contra o relógio**. O almoço acaba no restaurante
universitário e as sobras correm pelo campus: separação, planta piloto, biohitano, ônibus do campus. É a
ideia de laboratório vivo, com a pesquisa acontecendo no dia a dia da universidade.

### Estilo & twist
**Maquete de papelão** do campus, vista em ¾, + **corrida contra o relógio**: um cronômetro de papelão no canto e
uma trilha pontilhada que as sobras percorrem, estilo mapa de corrida. O **mascote** vai de passageiro no
ônibus no final. Termina com a assinatura CP2B.

### Storyboard
| # | cena |
|---|---|
| L01 | Maquete do campus; relógio de papelão bate meio-dia; fila no restaurante (bonequinhos de papelão). |
| L02 | Close numa bandeja com sobras; o cronômetro começa a correr. |
| L03 | Carimbo **PESQUISA!** sobre o saco de sobras; linha pontilhada de corrida acende no mapa. |
| L04 | Carrinho leva os baldes pela trilha até a planta piloto (galpão de papelão com tanques). |
| L05 | Dois tanques (ep. 18); bolhas de H₂ e CH₄ se juntam no balão duplo **BIOHITANO**. |
| L06 | O ônibus do campus abastece e parte pela avenida arborizada; o mascote acena da janela; o cronômetro para. |
| L07 | Câmera sobe: o campus inteiro vira um anel (restaurante → piloto → ônibus); etiqueta "laboratório vivo". |
| L08 | Prato e ônibus lado a lado com um coração de papel. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| Living-Lab de Resíduos Sólidos Urbanos: planta piloto para resíduos de restaurantes universitários, produzindo biohidrogênio e biometano (biohitano) para ônibus do campus da Unicamp | `cp2b_web/src/data/content.js` → `projectsItems` ✔ |
| projetos associados ("Biometano e bioprodutos a partir de restos de alimentos: criação de um laboratório-vivo…"; "Gestão de resíduos alimentares no campus…") | eixos 7 (axisDetails) ✔ |
| **estágio atual** (a planta piloto já opera? os ônibus já rodam?) | a fala usa "a ideia é" — **confirmar com a coordenação** antes de afirmar mais |
| citar "Unicamp" e "restaurante universitário" | ok pelo material do site — confirmar com a coordenação do projeto |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep21/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **D** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **D**) |
|---|---|
| `campus` | A top three-quarter view of a small generic university campus diorama: a cafeteria building, a small pilot plant shed with two tanks, a tree-lined avenue with a bus stop, green lawns and paths (not a real campus, no text), wide composition. |
| `pecas_ep21` | Separate items spaced far apart: a cafeteria tray with leftovers, a hand cart with two food-waste buckets, a stopwatch, a big wall clock, a group of four tiny cardboard people in a queue. |

Reaproveita: dois tanques e ônibus do campus (ep. 18), balão duplo, micróbios, moléculas.

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep21.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 54-second educational animation about biogas for all ages (cardboard diorama style). Brisk cartoon chase: fast ticking woodblock, galloping pizzicato, marimba runs, a triumphant arrival hit when the bus leaves. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 120 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 56 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Energetic race commentary feel, fast-paced but clear, cheering at the finish.
```

**Texto da narração**

```narracao pt-BR
L01 | Meio-dia no campus: o restaurante universitário tá cheio!
L02 | E, depois do almoço, sempre sobra comida no prato.
L03 | No CP2B, essas sobras não vão pro lixo: elas viram pesquisa! | fala: No cê-pê-dois-bê, essas sobras não vão pro lixo: elas viram pesquisa!
L04 | Primeiro, os restos são separados e levados pra uma planta piloto, ali mesmo na universidade.
L05 | Lá dentro, os micróbios transformam a comida em hidrogênio e metano — o biohitano!
L06 | E a ideia é usar esse combustível pra rodar os ônibus do campus.
L07 | Isso é um laboratório vivo: ciência testada no mundo real, no dia a dia de quem estuda e trabalha ali.
L08 | Do prato pro ônibus: a universidade dando o exemplo!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 21 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 21 --idioma pt-BR        # 2 tomadas
```
