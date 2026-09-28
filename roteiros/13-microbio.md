# 13 · Um dia na vida de um micróbio

| ficha | |
|---|---|
| série | Série A — Biogás básico |
| duração | ~55 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **F** — feltro & crochê |
| twist | vlog "um dia na vida" |
| Metaninho | mascote visita |
| arquivos | imagens `entrada/imagens/ep13/` · música `entrada/musica/musica_ep13.mp3` · voz `entrada/narracao/<idioma>/ep13_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
A narradora é a **Arqueia** ([ficha](personagens/ARQUEIA.md)), a arqueia metanogênica parceira do Metaninho (aqui na versão de crochê,
como os micróbios do ep. 01). Ela apresenta as colegas de cada etapa da digestão anaeróbia como uma linha
de montagem animada, e no fim é a vez dela fazer o metano.

### Estilo & twist
**Feltro & crochê** + **vlog**. A **Arqueia de crochê** (parceira do mascote) grava um vlog: moldura de câmera com ● REC, fala direto com quem assiste; o **mascote** faz uma visita. Termina sempre com a assinatura CP2B ([ESTILOS.md](ESTILOS.md)).

### Storyboard
| # | cena |
|---|---|
| L01 | A Arqueia de crochê (cápsula amarela, rabinho espiral coral) acorda numa caminha de feltro dentro da escotilha; boceja e liga a câmera do vlog. |
| L02 | Restos caem como entrega de comida numa esteira de papel. |
| L03 | Bactérias de capacete e tesoura picam os pedaços; etiqueta **HIDRÓLISE**. |
| L04 | Outras mexem panelinhas; pedaços viram gotinhas "ácidas" (amarelas com cara azeda); **ACIDOGÊNESE**. |
| L05 | Máquina de papel separa em três bandejas: acetato · H₂ · CO₂ (moléculas em código); **ACETOGÊNESE**. |
| L06 | A Arqueia pega tudo, gira o rabinho, e solta moléculas de CH₄ sorridentes — o Metaninho entre elas; **METANOGÊNESE**; confete. |
| L07 | Molécula O₂ bate na janela; todas fecham a cortina (carimbo SEM O₂). |
| L08 | Cúpula cheia; a Arqueia deitada de volta na caminha, com um troféu de feltro; o mascote Metaninho dá boa-noite. |
| L09 | Todas acenam; cartão final. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| quatro etapas: hidrólise → acidogênese → acetogênese (acetato, H₂, CO₂) → metanogênese | ✔ bioquímica básica da DA |
| metanogênicas são arqueias; processo anaeróbio estrito | ✔ |
| **narradora como personagem** ("eu sou a Arqueia") — mesma voz feminina da série, direção da ficha da Arqueia | personagem apresentada no ep. 27; revisão do Eixo 2 ✔ pendente |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep13/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **F** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

Nenhuma obrigatória — personagens e moléculas em código. Opcional em `entrada/imagens/ep13/`:

| arquivo | prompt (depois do prompt-mestre **F**) |
|---|---|
| `pecas_ep13` | Separate items spaced far apart: a tiny bed with a blanket, a small trophy cup, a conveyor belt segment, a tiny safety helmet, a tiny cooking pot, a window with curtains. |

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep13.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 59-second educational animation about biogas for all ages (felt & crochet style). Cosy lo-fi acoustic vlog groove: soft brushed kit, warm upright bass, mellow ukulele and a gentle glockenspiel, relaxed but happy. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 86 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 61 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Casual and intimate vlogger talking straight to camera: chatty, warm, a little proud, with a smile in every line.
```

**Texto da narração**

```narracao pt-BR
L01 | Bom dia! Eu sou a Arqueia e moro num biodigestor. Quer ver o meu dia?
L02 | Tudo começa quando chega comida: restos, esterco, palha…
L03 | Primeiro, minhas colegas bactérias quebram os pedaços grandes em pedacinhos. É a hidrólise!
L04 | Depois, outras transformam esses pedacinhos em ácidos. É a acidogênese!
L05 | Aí vem a acetogênese: os ácidos viram acetato, hidrogênio e gás carbônico.
L06 | E agora é a minha vez: eu transformo tudo isso em metano! É a metanogênese!
L07 | Tudo isso sem oxigênio, viu? A gente não se dá nada bem com ele.
L08 | No fim do dia, o biodigestor tá cheio de biogás… e eu, cheia de orgulho!
L09 | Um dia na vida de um micróbio: pequenininhos, mas movendo energia!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 13 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 13 --idioma pt-BR        # 2 tomadas
```
