# 06 · O lixo que dá gás

| ficha | |
|---|---|
| série | Série A — Biogás básico |
| duração | ~52 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **Q** — quadrinhos |
| twist | jornada da heroína (a casca de banana) |
| Metaninho | mascote em ponta |
| arquivos | imagens `entrada/imagens/ep06/` · música `entrada/musica/musica_ep06.mp3` · voz `entrada/narracao/<idioma>/ep06_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
O caminhão de lixo do ep. 02 vira protagonista. Duas rotas para os restos de comida: o aterro (onde o gás se
forma e parte é capturada) e o caminho melhor: separar em casa e levar direto ao biodigestor. Fecha com
uma chamada simples: separe o orgânico.

### Estilo & twist
**Quadrinhos** + **jornada da heroína**. **HQ em quadros**: a casca de banana é a heroína que não quer ir pro aterro; a câmera pula de quadro em quadro, onomatopeias (VRUUM, BLUB, TCHAM); a virada é a separação na cozinha e o final feliz no biodigestor. Termina sempre com a assinatura CP2B ([ESTILOS.md](ESTILOS.md)).

### Storyboard
| # | cena |
|---|---|
| L01 | Cozinha de papel; saco de restos na pia; o caminhão de lixo buzina e passa. |
| L02 | Caminhão despeja no aterro (morro em camadas de papel, corte lateral). |
| L03 | Corte do aterro: restos lá embaixo, bolhas sobem entre as camadas; carimbo **SEM O₂**. |
| L04 | Tubos verticais saem do morro; chama/gerador no topo; lâmpada acende. |
| L05 | Três lixeiras coloridas de papel; casca de banana pula na lixeira verde (orgânico). |
| L06 | Caminhão verde leva só orgânico ao biodigestor; tampa fecha; termômetro e manômetro de papel. |
| L07 | Aterro diminui (camadas encolhem); saco de adubo aparece com brotinho. |
| L08 | Mão de papel separa as cascas; carimbo **SEPARE!** |
| L09 | Casquinhas de papel formam um coração em volta da chama azul; cartão final. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| resíduo orgânico em aterro se decompõe sem oxigênio e gera biogás; aterros podem captar o gás | conceito consolidado ✔ |
| separação na fonte + digestão anaeróbia da fração orgânica (FORSU) | ✔; projeto CP2B **Living-Lab de Resíduos Sólidos Urbanos** (restaurantes universitários) — ver ep. 21 |
| digestato como adubo | ✔ |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep06/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **Q** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **Q**) |
|---|---|
| `aterro` | Cross-section of a sanitary landfill as a small hill made of stacked paper layers (brown, cream, grey), a green grass cap on top, a few vertical gas pipes sticking out of the top with a small flare, and a liner layer at the bottom. |
| `lixeiras` | Separate items spaced far apart: three recycling bins in green, amber and petrol blue (no symbols, no text), a small kitchen compost caddy, a dustpan. |
| `cozinha` | A small cheerful kitchen corner: a sink, a counter with a cutting board and vegetable peels, a window — front view. |

Reaproveita: caminhão de lixo, saco de restos, restos de comida, biodigestor, gerador, lâmpada, mão, casas.

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep06.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 56-second educational animation about biogas for all ages (comic book style). Light cartoon adventure: a small heroic melody on muted trumpet or clarinet over pizzicato and brushed snare, a tense little "villain" moment around the landfill, then a triumphant bright finish. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 108 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 58 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Adventure-story narrator: energetic and dramatic in a fun, comic-book way, cheering for the banana-peel heroine.
```

**Texto da narração**

```narracao pt-BR
L01 | Pra onde vai o lixo da sua casa?
L02 | Muita coisa vai parar no aterro sanitário — inclusive restos de comida.
L03 | Enterrados, esses restos apodrecem sem oxigênio… e soltam biogás.
L04 | Alguns aterros capturam esse gás por tubos e usam pra gerar energia.
L05 | Mas tem um jeito ainda melhor: separar o lixo orgânico logo na fonte…
L06 | …e levar direto pro biodigestor, onde tudo acontece num tanque fechado e controlado.
L07 | Assim sobra menos lixo pro aterro — e ainda sai adubo de qualidade.
L08 | E o primeiro passo é bem simples: separar o orgânico aí na sua cozinha!
L09 | O lixo que dá gás: cada casquinha conta!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 06 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 06 --idioma pt-BR        # 2 tomadas
```
