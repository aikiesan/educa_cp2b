# 23 · Da bancada à planta piloto

| ficha | |
|---|---|
| série | Série C — CP2B por dentro |
| duração | ~52 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **B → D** — planta técnica → maquete de papelão |
| twist | subir de fase (videogame) |
| Metaninho | mascote é o jogador |
| arquivos | imagens `entrada/imagens/ep23/` · música `entrada/musica/musica_ep23.mp3` · voz `entrada/narracao/<idioma>/ep23_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
Como uma ideia sai do tubo de ensaio e chega à indústria. Tratado como um **videogame**: cada "fase" é um passo
de maturidade tecnológica, com um chefão no meio, o "vale da morte", e o CP2B como a ponte que ajuda a
atravessá-lo. Mostra os laboratórios e o que eles fazem, sem jargão.

### Estilo & twist
Começa em **planta técnica** (a fase é um desenho azul) e cada fase vencida vira **maquete de papelão** colorida + twist
**subir de fase**: HUD de videogame feito de papel (barra de progresso, estrelinhas, moedinhas), o **mascote** é o
jogador que pula de plataforma em plataforma. Som de "plim" de fase vencida. Termina com a assinatura CP2B.

### Storyboard
| # | fase |
|---|---|
| L01 | Tela-título "FASE 1" em planta técnica; um tubo de ensaio brilha; o mascote aparece com "START". |
| L02 | Laboratório de bancada (azul → papelão): microscópio, sequenciador, cromatógrafo como "itens" coletados; etiquetas dos laboratórios (CEMARA, CP2b Lab, PPBIOEN, LESP, LABSOS). |
| L03 | Reatores de bancada em fila; tentativas: dois "×" e um "✓"; moedinha de papel. |
| L04 | Reator maior sobe numa plataforma; barra de progresso avança. |
| L05 | Abismo de papel ("vale da morte") com uma ponte quebrada; o mascote hesita na borda. |
| L06 | Peças de ponte chegam (mãos de parceiros de papel, etiquetas Sabesp, Copercana, Embrapii); a ponte se completa; o mascote atravessa. |
| L07 | Planta piloto de papelão acende; bandeira de chegada. |
| L08 | Tela "FASE CONCLUÍDA!" com estrelinhas. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| laboratórios: CEMARA (UNIFAL), CP2b Lab, PPBIOEN, LESP, LABSOS | `cp2b_web/src/data/generated/laboratories.js` ✔ (só as siglas na tela) |
| serviços: identificação de microrganismos, cromatografia (HPLC/GC), caracterização de biomassa, reatores de bancada, otimização de processo | `services.js` ✔ |
| "vale da morte"; parceria com empresas é o coração do Eixo 3 (Sabesp, Copercana, Embrapii) | `content.js` → Eixo 3 ✔ |
| maturidade tecnológica (TRL) | na tela como "fases" do jogo; **não citar níveis numéricos** sem conferir com cada laboratório |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep23/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **D** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **D**) |
|---|---|
| `laboratorio_bancada` | A cardboard diorama of a small research laboratory bench: a microscope, a row of small glass bench-top reactors with tubes, a chromatography machine box, a computer screen with a simple graph, test tubes in a rack. |
| `planta_piloto` | A cardboard diorama of a pilot plant: two medium steel tanks, pipes, a small gas holder dome, stairs and a railing, a little container office. |
| `pecas_ep23` | Separate items spaced far apart: a glowing test tube, a broken wooden bridge over a small cliff gap, three bridge planks, a finish-line checkered flag, a gold coin, a video-game style heart, a progress bar frame (empty). |

Reaproveita: reator do ep. 20, dois tanques (ep. 18), mãos (ep. 02).

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep23.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 56-second educational animation about biogas for all ages (blueprint → cardboard diorama style). Acoustic video-game adventure: glockenspiel and marimba playing chiptune-like arpeggios, bouncy bass, level-up jingles, a slightly tense moment at the "valley of death", then a victory fanfare. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 112 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 58 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Video-game narrator: playful and excited, rising energy as each level is cleared.
```

**Texto da narração**

```narracao pt-BR
L01 | Toda grande solução começa pequenininha… dentro de um tubo de ensaio!
L02 | Nos laboratórios do CP2B, os pesquisadores conhecem os micróbios, analisam os resíduos e medem cada molécula. | fala: Nos laboratórios do cê-pê-dois-bê, os pesquisadores conhecem os micróbios, analisam os resíduos e medem cada molécula.
L03 | Depois, testam tudo em reatores de bancada, pra achar a receita certa.
L04 | Deu certo? Hora de crescer: o processo vai pra reatores maiores, que imitam a vida real.
L05 | Só que, entre o laboratório e a indústria, tem um desafio famoso: o "vale da morte" — onde muita ideia boa fica pelo caminho.
L06 | Por isso o CP2B trabalha junto com empresas parceiras, pra atravessar esse vale em conjunto! | fala: Por isso o cê-pê-dois-bê trabalha junto com empresas parceiras, pra atravessar esse vale em conjunto!
L07 | E aí vem a planta piloto: a tecnologia funcionando em escala de verdade.
L08 | Da bancada à planta piloto: cada fase é uma conquista!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 23 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 23 --idioma pt-BR        # 2 tomadas
```
