# 26 · Metaninho: de molécula a mascote

| ficha | |
|---|---|
| série | Série C — CP2B por dentro |
| duração | ~45 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **F** — feltro & crochê + colagem de papel |
| twist | história de origem ("era uma vez") |
| Metaninho | os dois (mascote e cientista) |
| arquivos | imagens `entrada/imagens/ep26/` · música `entrada/musica/musica_ep26.mp3` · voz `entrada/narracao/<idioma>/ep26_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
A **história de origem** dos dois Metaninhos. Uma molécula de metano "acorda", ganha forma de crochê, vira o
**mascote fofinho** do CP2B e, no fim, apresenta seu "primo" famoso, o **cientista de óculos**, que explica as
coisas nos vídeos. Serve de abertura da temporada e de apresentação dos personagens nas redes.

### Estilo & twist
Metade **feltro & crochê** (o mundo macio do mascote: novelos, agulhas de crochê, a molécula sendo "tricotada"), metade
**colagem de papel** (o laboratório do cientista); a passagem entre os dois é uma porta de papel. Twist **história
de origem**: "Era uma vez uma molécula…". Termina com a assinatura CP2B com os dois juntos.

### Storyboard
| # | cena |
|---|---|
| L01 | Mesa de crochê: novelos, agulha; uma molécula CH₄ de papel com olhinhos fechados; "Era uma vez…" à mão. |
| L02 | Setas desenhadas mostram a bolinha azul (carbono) e as bolinhas verdes (hidrogênio) em volta. |
| L03 | A molécula entra numa chama de papel; a chama fica azul; brilho. |
| L04 | Agulhas "tricotam" a molécula em crochê (transição de papel → crochê); bochechas surgem; plaquinha "Metaninho". |
| L05 | O mascote de crochê pula, acena com a bolinha de cima; poses da folha `mascote_croche`. |
| L06 | Porta de papel abre para o laboratório de colagem: o cientista Metaninho aparece de jaleco; os dois se cumprimentam. |
| L07 | Os dois olham um mural com miniaturas dos episódios (capas de papel). |
| L08 | Os dois saltam juntos; confete. Gancho: uma sombra amarela com rabinho espiral passa ao fundo — "e quem me fez foi… a Arqueia!" (estreia no ep. 27); assinatura CP2B com os dois. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| Metaninho: mascote do CP2B que representa a molécula de metano; "ferramenta lúdica para educação científica" | notícia "Conheça o Metaninho: o novo mascote do CP2b!" (`content.js`, dez/2025) ✔ |
| dois visuais: mascote de crochê (real) e personagem cientista | orientação da equipe (set/2026) ✔ |
| CH₄: um carbono ligado a hidrogênios | ✔ (a fala evita o número) |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep26/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **F** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

Personagens fixos em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md) (`cientista_colagem`, `mascote_croche`, `mascote_papel`), em
`entrada/imagens/personagens/`. Acrescentar em `entrada/imagens/ep26/`:

| arquivo | prompt (depois do prompt-mestre **F**) |
|---|---|
| `mesa_croche` | Separate items spaced far apart: three balls of yarn (petrol blue, lime green, orange), two crochet hooks, a small pincushion, a tape measure, a small wooden name plaque (blank, no text), a paper door in a frame (closed). |

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep26.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 49-second educational animation about biogas for all ages (felt & crochet + paper-cut collage style). Storybook "once upon a time": a music-box glockenspiel intro, soft and magical, growing into the full cheerful series theme when the mascot comes to life. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 92 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 51 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Storyteller "once upon a time" warmth: tender at the start, then bright and excited as the mascot is born.
```

**Texto da narração**

```narracao pt-BR
L01 | Era uma vez… uma molécula de metano.
L02 | Uma bolinha de carbono no meio, rodeada de hidrogênios.
L03 | Ela é a estrela do biogás: é o metano que faz a chama azul e vira energia!
L04 | Um dia, essa molécula ganhou pontinhos de crochê, bochechas rosadas… e um nome: Metaninho!
L05 | Hoje ele é o mascote do CP2B: fofinho, curioso e sempre por perto quando o assunto é ciência. | fala: Hoje ele é o mascote do cê-pê-dois-bê: fofinho, curioso e sempre por perto quando o assunto é ciência.
L06 | E ele tem um parceiro de aventuras: o grande cientista, de óculos e jaleco, que explica tudo tim-tim por tim-tim!
L07 | Juntos, eles vão mostrar como os resíduos viram energia… episódio por episódio.
L08 | Tá pronto? A aventura do biogás tá só começando!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 26 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 26 --idioma pt-BR        # 2 tomadas
```
