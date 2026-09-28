# 19 · Quem faz o CP2B

| ficha | |
|---|---|
| série | Série C — CP2B por dentro |
| duração | ~50 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **C** — colagem de papel |
| twist | foto de turma |
| Metaninho | os dois na foto |
| arquivos | imagens `entrada/imagens/ep19/` · música `entrada/musica/musica_ep19.mp3` · voz `entrada/narracao/<idioma>/ep19_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
Uma "foto de turma" que se monta aos poucos. Cada fala traz um grupo de pessoas recortadas, identificadas por
**papel** e não por nome: estudantes de iniciação científica, mestrado e doutorado, pós-docs, professoras e
professores, técnicos, equipe administrativa e parceiros de empresas. Áreas muito diferentes somam forças.

### Estilo & twist
**Colagem de papel** + **foto de turma**. Um cartaz em branco num cavalete; cada grupo pula para a sua fila com
um "plop"; um fotógrafo de papel ajusta o tripé. No fim o flash dispara e a foto se "revela" (de sépia para
colorida), com o **cientista** e o **mascote** no meio. Termina com a assinatura CP2B.

### Storyboard
| # | cena |
|---|---|
| L01 | O cientista sozinho diante do cartaz vazio "foto de turma"; olha em volta; o mascote espia atrás do cavalete. |
| L02 | Três estudantes pulam para a primeira fila (mochila, caderno, jaleco). |
| L03 | Pós-docs e professores entram na segunda fila. |
| L04 | Técnicos (luvas, pipeta) e equipe administrativa (pasta, computador) completam a fila. |
| L05 | Ícones de papel voam sobre as cabeças, um por palavra: engrenagem, folha, frasco, gráfico, balança da justiça, mapa, megafone. |
| L06 | Bandeirinhas com as siglas das instituições (texto) presas por fita no alto do cartaz. |
| L07 | Óculos de papel de cores diferentes passam de mão em mão; ao se sobrepor, formam uma lâmpada. |
| L08 | Flash; a foto revela; o cientista e o mascote entram no meio. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| papéis na equipe (IC, mestrado, doutorado, pós-doc, professores/pesquisadores, apoio técnico e administrativo, parceiros) | lista "Equipe — Quem faz o CP2b" (material da equipe) ✔ |
| áreas (engenharias, biologia, química, economia, direito, geografia, comunicação) | unidades da equipe (FEEC, FEM, FEQ, IB, IQ, IE, IG, jornalismo científico…) ✔ |
| **nomes e fotos de pessoas** | não usados — decidir com a coordenação (autorização de imagem) |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep19/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **C** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

Os `pesquisadores` do ep. 03 servem aqui também.

| arquivo | prompt (depois do prompt-mestre **C**) |
|---|---|
| `equipe` | Six separate friendly cartoon people, half body, facing the viewer: (1) an undergraduate student with a backpack; (2) a lab technician with gloves and a pipette; (3) an administrative staff member holding a folder; (4) a professor with a pointer; (5) a young researcher in a lab coat with a notebook; (6) a company engineer in a polo shirt with a hard hat under the arm. Varied skin tones, ages, genders and hair. IMPORTANT: no eyes and no glasses — two plain white oval areas where the eyes would be. |
| `pecas_ep19` | Separate items spaced far apart: a vintage camera on a tripod with a flash, a blank poster board on an easel, a gear, a leaf, a flask, a bar chart, scales of justice, a folded map, a megaphone, three pairs of glasses in different colours. |

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep19.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 54-second educational animation about biogas for all ages (paper-cut collage style). Warm and communal: instruments join one by one like people stepping into a group photo (glockenspiel, then ukulele, marimba, bass, claps), building to a joyful full band. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 100 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 56 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Warm and welcoming, celebrating people, with pride and a big smile.
```

**Texto da narração**

```narracao pt-BR
L01 | Quem transforma resíduo em energia? Gente! Muita gente.
L02 | No CP2B tem estudante de iniciação científica, de mestrado e de doutorado… | fala: No cê-pê-dois-bê tem estudante de iniciação científica, de mestrado e de doutorado…
L03 | …pesquisadoras e pesquisadores de pós-doutorado, professoras e professores…
L04 | …e uma equipe técnica e administrativa que faz tudo funcionar.
L05 | Tem gente da engenharia, da biologia, da química, da economia, do direito, da geografia, da comunicação…
L06 | …de várias universidades e institutos, e de empresas parceiras.
L07 | Cada um enxerga o resíduo de um jeito — e é juntando esses olhares que nascem as soluções.
L08 | Quem faz o CP2B? A gente — e quem mais quiser vir junto! | fala: Quem faz o cê-pê-dois-bê? A gente — e quem mais quiser vir junto!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 19 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 19 --idioma pt-BR        # 2 tomadas
```
