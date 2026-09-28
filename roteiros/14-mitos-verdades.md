# 14 · Mitos e verdades do biogás

| ficha | |
|---|---|
| série | Série A — Biogás básico |
| duração | ~55 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **C** — colagem de papel |
| twist | programa de auditório (quiz) |
| Metaninho | cientista apresentador |
| arquivos | imagens `entrada/imagens/ep14/` · música `entrada/musica/musica_ep14.mp3` · voz `entrada/narracao/<idioma>/ep14_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
Formato rápido de quiz. Cada afirmação entra num cartão de papel, a narradora lê, faz uma pausa de
suspense (tique-taque) e um carimbo bate: **VERDADE** (verde) ou **MITO** (coral), com a explicação curtinha.
Cada bloco L02–L06 funciona sozinho como pílula de Reels.

### Estilo & twist
**Colagem de papel** + **programa de auditório**. Palco de papel com luzes piscando, plateia recortada, **cientista** apresentador de microfone; buzina e aplausos; carimbos VERDADE / MITO. Cada bloco vira pílula. Termina sempre com a assinatura CP2B ([ESTILOS.md](ESTILOS.md)).

### Storyboard
| # | cena |
|---|---|
| L01 | Letras recortadas **MITO ou VERDADE?**; relógio de papel. |
| L02 | Cartão com ovo de papel e linhas de cheiro; carimbo **EM PARTE** (âmbar); máquina de purificação filtra e o cheiro some. |
| L03 | Fazenda enorme × sítio pequeno × prédio da cidade, cada um com seu biodigestor; carimbo **MITO**. |
| L04 | Panela no fogão; depois gerador, lâmpada e caminhão entram; carimbo **MITO**. |
| L05 | Saco de lixo vira saco de adubo com broto; carimbo **MITO**. |
| L06 | Anel resíduo → biogás → resíduo girando; carimbo **VERDADE**. |
| L07 | Mão de papel aponta para o espectador; setinha "compartilhe" desenhada; cartão final. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| biogás bruto contém H₂S (odor), removido na purificação | ✔ (ep. 01) |
| biodigestores de pequena a grande escala | ✔ |
| usos: calor, eletricidade, biometano veicular | ✔ |
| digestato = biofertilizante | ✔ |
| renovável enquanto houver resíduo orgânico | ✔ |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep14/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **C** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **C**) |
|---|---|
| `pecas_ep14` | Separate items spaced far apart: a cracked egg with stink lines, a tiny smallholding farmhouse with a small biodigester, a big modern farm with silos, an apartment building, a kitchen alarm clock, a sack of fertilizer with a sprout (no text). |

Reaproveita: máquina, fogão, gerador, lâmpada, caminhão, mão, biodigestor.

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep14.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 59-second educational animation about biogas for all ages (paper-cut collage style). Bright game-show quiz music: bouncy marimba and claps, short suspense tick-tock breaks before each answer, and quick celebratory stings on the answers. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 112 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 61 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Game-show host energy: big, bright and playful, dramatic pauses before each answer.
```

**Texto da narração**

```narracao pt-BR
L01 | Biogás: mito ou verdade? Bora testar!
L02 | "Biogás tem cheiro de ovo podre." Em parte, é verdade: o biogás bruto tem um pouco de gás sulfídrico, que cheira mal — mas ele é tirado na limpeza!
L03 | "Só fazenda grande consegue fazer biogás." Mito! Tem biodigestor de todo tamanho: do sítio à cidade.
L04 | "Biogás só serve pra cozinhar." Mito! Ele gera calor, eletricidade e, purificado, vira combustível até de caminhão.
L05 | "O que sobra do biodigestor é lixo." Mito! Vira biofertilizante pra lavoura.
L06 | "Biogás é energia renovável." Verdade! Enquanto houver resíduo, tem biogás.
L07 | E aí, acertou todas? Manda pra alguém que ainda acredita em mito!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 14 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 14 --idioma pt-BR        # 2 tomadas
```
