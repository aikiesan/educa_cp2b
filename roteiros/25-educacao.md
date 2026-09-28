# 25 · Aprender biogás: cursos e escolas

| ficha | |
|---|---|
| série | Série C — CP2B por dentro |
| duração | ~50 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **L** — lousa & caderno |
| twist | aula relâmpago |
| Metaninho | cientista professor |
| arquivos | imagens `entrada/imagens/ep25/` · música `entrada/musica/musica_ep25.mp3` · voz `entrada/narracao/<idioma>/ep25_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
Uma **aula relâmpago** na lousa sobre como o CP2B forma gente: cursos para profissionais e estudantes, atividades
nas escolas (compostagem e bioenergia), visitas e palestras, educação ambiental com as comunidades. Termina com
um convite: proponha ou faça um curso.

### Estilo & twist
**Lousa** + **aula relâmpago**: o **cientista** professor desenha a giz enquanto fala, o sinal da escola toca no começo
e no fim, a lousa se enche de desenhos rápidos e é apagada com o apagador entre os tópicos (transição). Termina
com a assinatura CP2B.

### Storyboard
| # | cena na lousa |
|---|---|
| L01 | Sino de escola desenhado toca; título a giz "AULA RELÂMPAGO". |
| L02 | O cientista desenha o logo da chama e um livro aberto. |
| L03 | Giz desenha profissionais de capacete e estudantes; setas para BIOGÁS · BIOMETANO · BIOPRODUTOS. |
| L04 | Três ícones: sala de aula, notebook, sala + notebook; uma maleta (empresas). |
| L05 | Apagador limpa; escola desenhada; composteira, broto, lâmpada. |
| L06 | Microscópio, microfone de palestra, casinhas com uma árvore (comunidade). |
| L07 | Papel de proposta preso com fita na lousa; lápis de papel faz um "✓". |
| L08 | Sino toca; o giz vira confete de lousa. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| curso "Biogás, Biometano e Bioprodutos para a Transição Energética" | `cp2b_web/src/data/capacitacao.js` ✔ |
| modalidades presencial/online/híbrido; in company; proposta de cursos por pesquisadores | idem ✔ |
| atividade nas escolas (compostagem e bioenergia) | projeto de extensão "Do Lixo ao Luxo: Compostagem e bioEnergia nas Escolas" (eixo 7) ✔ — **confirmar vínculo com o CP2B** |
| visitas, palestras (Eixo 7); educação socioambiental com comunidades (Eixo 6) | `content.js` → eixos 6 e 7 ✔ (a comunidade não é nomeada) |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep25/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **L** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

Quase tudo desenhado a giz em código. Adesivos opcionais:

| arquivo | prompt (depois do prompt-mestre **L**) |
|---|---|
| `pecas_ep25` | Separate doodle stickers spaced far apart: a school bell, a chalk eraser, a stick of chalk, a compost bin with a sprout, a laptop, a microphone on a stand, a briefcase, a course proposal sheet with a check mark (no readable text). |

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep25.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 54-second educational animation about biogas for all ages (chalkboard & sketchbook style). Light school-day music: a school-bell glockenspiel motif at start and end, playful pizzicato and marimba, chalk-tap percussion, brisk and friendly. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 100 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 56 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Friendly, lively teacher: clear, encouraging, a bit playful.
```

**Texto da narração**

```narracao pt-BR
L01 | Triiim! Aula relâmpago: como se aprende biogás?
L02 | No CP2B, aprender faz parte da missão. | fala: No cê-pê-dois-bê, aprender faz parte da missão.
L03 | Tem curso pra profissionais e estudantes: biogás, biometano e bioprodutos pra transição energética.
L04 | Presencial, online ou híbrido — e até turmas feitas sob medida pra empresas.
L05 | Nas escolas, a criançada aprende que resto de comida vira adubo e energia.
L06 | Tem também visitas aos laboratórios, palestras e educação ambiental com as comunidades.
L07 | E quem é pesquisador pode propor um curso novo pro centro!
L08 | Triiim! Fim da aula — e começo de muitas ideias!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 25 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 25 --idioma pt-BR        # 2 tomadas
```
