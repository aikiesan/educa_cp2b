# 07 · Laranja inteira: nada se perde

| ficha | |
|---|---|
| série | Série A — Biogás básico |
| duração | ~50 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **C** — colagem de papel |
| twist | tempo real (café da manhã) |
| Metaninho | mascote |
| arquivos | imagens `entrada/imagens/ep07/` · música `entrada/musica/musica_ep07.mp3` · voz `entrada/narracao/<idioma>/ep07_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
Suco de laranja e cafezinho: duas marcas de São Paulo que deixam muitas sobras. Uma laranja de papel se
desmonta em gomos, casca e bagaço, e cada pedaço ganha um destino: ração, óleo, adubo, biogás. Com um
detalhe: o óleo da casca atrapalha os micróbios, e a mistura com esterco resolve.

### Estilo & twist
**Colagem de papel** + **tempo real**. Um café da manhã em tempo real: relógio de papel no canto; a laranja "explode" em vista explodida (casca, gomos, bagaço flutuando) e cada peça segue para seu destino; ritmo rápido. Termina sempre com a assinatura CP2B ([ESTILOS.md](ESTILOS.md)).

### Storyboard
| # | cena |
|---|---|
| L01 | Copo de suco e xícara de café de papel na mesa; vapor desenhado. |
| L02 | Laranjal e pé de café; fábrica de suco; pilha de cascas cresce. |
| L03 | A laranja se desmonta em peças que voam para quatro etiquetas: ração · óleo · adubo · biogás. |
| L04 | Gotinha de óleo amarela com cara brava pula no biodigestor; micróbios com cara de enjoo. |
| L05 | Vaca entra com esterco; a gotinha se dilui; micróbios voltam a sorrir (bolhas). |
| L06 | Grãos e cascas de café entram no biodigestor; chama azul. |
| L07 | Laranja e grão de café de papel de mãos dadas. |
| L08 | Casca de laranja vira espiral que envolve o logo final. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| SP é grande produtor de laranja e de café | ✔ (cinturão citrícola; região da Mogiana) — sem número na fala |
| subprodutos de citros: polpa/ração, óleo essencial (d-limoneno), adubo | ✔ |
| d-limoneno inibe a digestão anaeróbia; codigestão com esterco dilui | CSV de codigestões ("Bagaço de citros + dejetos bovinos … dilui d-limoneno") ✔ |
| casca e polpa de café na digestão anaeróbia (com dejetos) | CSV de codigestões (Matos et al. 2017; Dhungana et al. 2022) ✔ |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep07/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **C** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **C**) |
|---|---|
| `laranjal_cafe` | Separate items spaced far apart: a small orange tree full of oranges, a coffee plant branch with red coffee cherries, a juice factory building with a big orange on the roof sign (no text). |
| `pecas_ep07` | Separate items spaced far apart: a glass of orange juice, a steaming coffee cup on a saucer, a spiral orange peel, a pile of orange peels, a small heap of coffee husks and pulp, a small yellow oil drop, a bag of animal feed pellets (no text). |

Reaproveita: laranja, biodigestor, vaca, esterco, micróbios (código).

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep07.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 54-second educational animation about biogas for all ages (paper-cut collage style). Brisk breakfast-time groove: a ticking woodblock clock motif, jazzy ukulele and marimba, walking upright bass, cheerful and fast-moving like a morning rush. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 110 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 56 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Brisk and cheerful like a busy morning, quick but always clear.
```

**Texto da narração**

```narracao pt-BR
L01 | Suco de laranja no café da manhã… e um cafezinho depois. Hum!
L02 | São Paulo é terra de laranja e de café — e as indústrias deixam muita sobra: casca, bagaço, polpa.
L03 | Essas sobras podem virar ração, óleo, adubo… e também biogás!
L04 | Mas a casca da laranja tem um óleo que atrapalha os micróbios.
L05 | Por isso os pesquisadores misturam as sobras com outros resíduos, como esterco — e a digestão volta a andar bem.
L06 | No café, a casca e a polpa também viram energia no biodigestor.
L07 | Da fruta ao cafezinho, nada precisa se perder.
L08 | Laranja inteira: aproveitada até a casca!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 07 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 07 --idioma pt-BR        # 2 tomadas
```
