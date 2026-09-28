# 10 · Codigestão: a mistura certa

| ficha | |
|---|---|
| série | Série A — Biogás básico |
| duração | ~50 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **F** — feltro & crochê |
| twist | programa de culinária |
| Metaninho | cientista de chef |
| arquivos | imagens `entrada/imagens/ep10/` · música `entrada/musica/musica_ep10.mp3` · voz `entrada/narracao/<idioma>/ep10_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
Um programa de culinária de papel. Os ingredientes (palha, bagaço, esterco, vinhaça, casca de laranja)
entram numa tigela gigante que é o biodigestor. Sozinhos, a receita "desanda"; juntos, na proporção certa,
os micróbios fazem festa e o biogás sobe.

### Estilo & twist
**Feltro & crochê** + **programa de culinária**. Cozinha de **feltro**; o **cientista** de chapéu de chef apresenta; ingredientes de feltro caem na tigela; "ding" do forno e sai uma bolha de biogás. Vinheta de programa de TV na abertura. Termina sempre com a assinatura CP2B ([ESTILOS.md](ESTILOS.md)).

### Storyboard
| # | cena |
|---|---|
| L01 | Chapéu de chef de papel cai na mesa; colher de pau mexe o ar. |
| L02 | Biodigestor vira tigela; micróbios de guardanapo no pescoço esperando. |
| L03 | Palha e bagaço caem; etiqueta **C** grande. |
| L04 | Esterco cai; etiqueta **N**. |
| L05 | Metade da tela: tigela só de palha (micróbio com fome) × só de esterco (micróbio enjoado); depois as duas se juntam e os micróbios sorriem. |
| L06 | Letras recortadas **CODIGESTÃO**; bolhas sobem num gráfico de papel (sem números). |
| L07 | Três pares entram um a um, presos por fita: bagaço + vinhaça · palha + esterco · casca de laranja + esterco. |
| L08 | Balança de cozinha de papel pesa porções; caderno de receitas com tabela rabiscada (sem números legíveis). |
| L09 | Bolo de papel com vela-chama azul; cartão final. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| balanço carbono/nitrogênio (C/N) e sinergia na codigestão | `Possiveis_co_digestoes - Página1.csv` (Wang et al. 2018; Zhu et al. 2022 …) ✔ |
| pares citados (bagaço+vinhaça, palha+esterco, citros+esterco) | CSV de codigestões ✔ (Silva et al. 2017; Fuess et al. 2018; …) |
| "mais biogás, com mais estabilidade" | CSV (ganhos de CH₄, correção de C/N, diluição de inibidores) ✔ — sem número na fala |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep10/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **F** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **F**) |
|---|---|
| `cozinha_chef` | Separate items spaced far apart: a tall white chef hat, a big wooden spoon, a large mixing bowl, a kitchen scale with an empty tray, an open recipe notebook with squiggle lines (no readable text), a small cake with one candle. |
| `ingredientes` | Separate items spaced far apart: a pile of sugarcane bagasse fibres, a bottle of dark vinasse, a bundle of dry straw, a small heap of cow manure, a pile of orange peels. |

Reaproveita: biodigestor, micróbios (com guardanapo, em código), palha, esterco, laranja, vaca.

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep10.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 54-second educational animation about biogas for all ages (felt & crochet style). Cheerful TV cooking-show theme: bright bossa-jazz ukulele and marimba, a playful clarinet, a "kitchen timer" glockenspiel ding motif. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 100 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 56 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Charismatic TV-chef host energy: warm, playful and enthusiastic, like presenting a favourite recipe.
```

**Texto da narração**

```narracao pt-BR
L01 | Todo cozinheiro sabe: a mistura certa faz toda a diferença!
L02 | No biodigestor é igualzinho. Os micróbios gostam de uma dieta equilibrada.
L03 | Alguns resíduos têm muito carbono, como a palha e o bagaço…
L04 | …outros têm muito nitrogênio, como o esterco.
L05 | Sozinhos, eles podem desandar a receita. Juntos, eles se completam!
L06 | Isso se chama codigestão: misturar resíduos pra produzir mais biogás, com mais estabilidade.
L07 | Bagaço com vinhaça, palha com esterco, casca de laranja com esterco…
L08 | …e os pesquisadores testam as proporções, como numa receita de bolo.
L09 | Codigestão: juntos, os resíduos rendem mais!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 10 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 10 --idioma pt-BR        # 2 tomadas
```
