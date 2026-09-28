# 16 · Biorrefinaria: um resíduo, vários produtos

| ficha | |
|---|---|
| série | Série B — Além do biogás |
| duração | ~52 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **B** — planta técnica |
| twist | antes × depois |
| Metaninho | cientista |
| arquivos | imagens `entrada/imagens/ep16/` · música `entrada/musica/musica_ep16.mp3` · voz `entrada/narracao/<idioma>/ep16_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
Uma refinaria de petróleo de papel vira uma biorrefinaria de cana diante dos olhos: o barril sai, entra o
feixe de cana, e cada cano leva a um produto: açúcar, etanol, eletricidade do bagaço, biogás da vinhaça e
da torta de filtro, adubo. Fecha com a ideia de integrar cana e pecuária.

### Estilo & twist
**Planta técnica** + **antes × depois**. Tela dividida: à esquerda a refinaria de petróleo em **planta técnica** cinza; à direita a biorrefinaria de cana que se colore de papel a cada fala. Termina sempre com a assinatura CP2B ([ESTILOS.md](ESTILOS.md)).

### Storyboard
| # | cena |
|---|---|
| L01 | Refinaria de papel cinza com barril; setas para garrafas. |
| L02 | O barril sai voando; feixe de cana entra; a refinaria "troca de roupa" para verde. |
| L03 | Canos: saco de açúcar e garrafinha de etanol pousam. |
| L04 | Montanha de bagaço entra na caldeira; lâmpada e chama. |
| L05 | Vinhaça e torta de filtro entram no biodigestor; letras **BIOGÁS** e **BIOMETANO**. |
| L06 | Cano volta ao canavial; brotos. |
| L07 | Vaca e granja ao lado da usina; setas de esterco para o biodigestor; mais bolhas. |
| L08 | Tudo girando num anel de setas desenhado. |
| L09 | Letras recortadas **BIORREFINARIA**; cartão final. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| conceito de biorrefinaria (vários produtos a partir de biomassa/resíduos) | objetivos CP2B ("conceitos de biorrefinaria, bioenergia e bioeconomia") ✔ |
| cana → açúcar, etanol; bagaço → calor e eletricidade | ✔ setor sucroenergético |
| vinhaça e torta de filtro → biogás/biometano (e biohitano) | projeto CP2B "Biohitano a partir da vinhaça e da torta de filtro" (Eixo 7) ✔ |
| integração cana-pecuária para biometano | projetos "Produção de biometano em biorrefinarias de cana integradas a resíduos da pecuária" ✔ |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep16/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **C** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **C** — os recortes que "ganham cor" sobre a planta técnica) |
|---|---|
| `refinaria` | A small oil refinery with two distillation towers and pipes, grey and petrol blue, side view (friendly, simple). |
| `pecas_ep16` | Separate items spaced far apart: an oil barrel, a sack of sugar (no text), a small bottle of ethanol, a pile of sugarcane bagasse, a boiler with a small flame window, a heap of filter cake (dark brown crumbly mud). |

Reaproveita: usina de etanol (ep. 04), cana, biodigestor, lâmpada, vaca, granja (ep. 05), trator.

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep16.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 56-second educational animation about biogas for all ages (blueprint style). Starts muted, grey and minimal (sparse pizzicato and a low clarinet), then blooms at the halfway point into the full warm, colourful series orchestration. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 98 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 58 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Begins a touch more serious on the "before", then lights up with enthusiasm on the "after".
```

**Texto da narração**

```narracao pt-BR
L01 | Sabe a refinaria de petróleo, que tira vários produtos de uma coisa só?
L02 | A biorrefinaria faz o mesmo… mas com biomassa e resíduos!
L03 | Pega a cana: dela saem o açúcar e o etanol.
L04 | O bagaço vira calor e eletricidade…
L05 | …a vinhaça e a torta de filtro viram biogás e biometano…
L06 | …e o que sobra ainda volta pro canavial como adubo.
L07 | E dá pra ir além, juntando a usina com a pecuária da região: mais resíduo, mais biometano!
L08 | Nada se perde, tudo se aproveita.
L09 | Biorrefinaria: um resíduo, vários produtos!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 16 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 16 --idioma pt-BR        # 2 tomadas
```
