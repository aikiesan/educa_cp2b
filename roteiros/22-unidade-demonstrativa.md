# 22 · A usina de biogás na cooperativa

| ficha | |
|---|---|
| série | Série C — CP2B por dentro |
| duração | ~48 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **C** — colagem de papel |
| twist | antes × depois (tela dividida) |
| Metaninho | cientista com prancheta |
| arquivos | imagens `entrada/imagens/ep22/` · música `entrada/musica/musica_ep22.mp3` · voz `entrada/narracao/<idioma>/ep22_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
O outro projeto de destaque: uma unidade demonstrativa de biogás numa cooperativa agroindustrial. As sobras da
própria cooperativa viram eletricidade ou biometano, e o biometano pode substituir o diesel da frota.
Mostrado em **tela dividida**: antes (diesel, fumaça, lixo) × depois (biodigestor, biometano, ciclo).

### Estilo & twist
**Colagem de papel** + **antes × depois**. Uma folha rasgada ao meio: à esquerda, o "antes" em tons cinza-sépia; à
direita, o "depois" colorido. A cada fala a linha do rasgo avança e o colorido "ganha terreno". O **cientista**
aparece com uma prancheta fazendo check. Termina com a assinatura CP2B.

### Storyboard
| # | cena |
|---|---|
| L01 | Galpão da cooperativa de papel; a folha se rasga ao meio: ANTES | DEPOIS. |
| L02 | Lado "antes" (sépia): pilha de resíduos, caminhão com fumaça cinza de diesel. |
| L03 | Lado "depois": biodigestor cai ao lado do galpão; sobras entram. |
| L04 | Gerador acende as lâmpadas do galpão. |
| L05 | Máquina de purificação → bomba → caminhão da frota abastece; a fumaça cinza do outro lado some. |
| L06 | Trator espalha biofertilizante no campo da cooperativa. |
| L07 | O rasgo some: tudo colorido; placa de papel "unidade demonstrativa"; o cientista faz check na prancheta. |
| L08 | Caminhão parte com um coração de fumacinha verde (estilizada). |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| Unidade Demonstrativa em Cooperativa Agroindustrial: digestão anaeróbia de resíduos (do varejo agroindustrial) para eletricidade ou biometano, substituindo diesel em frotas | `cp2b_web/src/data/content.js` → `projectsItems` ✔ |
| **qual cooperativa** e em que estágio está | não citado na fala — **confirmar se podemos nomear e mostrar** |
| digestato como biofertilizante | ✔ (conceito) |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep22/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **C** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **C**) |
|---|---|
| `cooperativa` | A large agro-industrial cooperative warehouse with a loading dock, a few crates and sacks, a small office, side-front view (no text, no logos). |
| `pecas_ep22` | Separate items spaced far apart: a delivery truck with a big grey diesel exhaust cloud, a pile of mixed agro-industrial waste (crates, fruit, vegetable scraps), a clipboard with a big check mark, a small plain signpost (no text). |

Reaproveita: biodigestor, gerador, lâmpada, máquina, bomba, caminhão, trator, plantas.

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep22.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 52-second educational animation about biogas for all ages (paper-cut collage style). Starts sepia and muted (sparse, slightly melancholic clarinet and pizzicato), then switches at "Depois" to a bright, confident major-key groove with the full series band. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 100 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 54 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Starts reflective on the "before", then confident and upbeat on the "after".
```

**Texto da narração**

```narracao pt-BR
L01 | Imagina uma cooperativa que produz energia com as próprias sobras.
L02 | Antes: resíduo acumulado, e caminhões rodando a diesel.
L03 | Depois: as sobras entram num biodigestor, ali mesmo na cooperativa…
L04 | …e viram biogás, que pode gerar eletricidade…
L05 | …ou ser purificado em biometano, pra abastecer a frota no lugar do diesel!
L06 | E o que sai do biodigestor ainda volta pro campo como biofertilizante.
L07 | Essa é a ideia de uma unidade demonstrativa do CP2B: mostrar, na prática, que funciona. | fala: Essa é a ideia de uma unidade demonstrativa do cê-pê-dois-bê: mostrar, na prática, que funciona.
L08 | Do resíduo pro tanque: a cooperativa movida a biogás!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 22 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 22 --idioma pt-BR        # 2 tomadas
```
