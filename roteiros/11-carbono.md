# 11 · Carbono que volta pro ciclo

| ficha | |
|---|---|
| série | Série A — Biogás básico |
| duração | ~52 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **L** — lousa & caderno |
| twist | ponto de vista do átomo de carbono |
| Metaninho | cientista na lousa |
| arquivos | imagens `entrada/imagens/ep11/` · música `entrada/musica/musica_ep11.mp3` · voz `entrada/narracao/<idioma>/ep11_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
Um átomo de carbono de papel (com olhinhos) faz a viagem curta: ar → planta → resíduo → biogás → ar →
planta. Do outro lado da mesa, um carbono "velho" preso num barril de petróleo sai de repente e sobra no ar.
Explica por que o biogás é renovável e ainda evita metano solto.

### Estilo & twist
**Lousa & caderno** + **ponto de vista do átomo**. **Lousa**: a câmera segue o átomo de carbono (personagem a giz com olhinhos); o mundo se desenha em volta dele na hora. O **cientista** aparece na lousa só para puxar as setas. Termina sempre com a assinatura CP2B ([ESTILOS.md](ESTILOS.md)).

### Storyboard
| # | cena |
|---|---|
| L01 | Duas moléculas de CO₂ de papel lado a lado; ponto de interrogação. |
| L02 | Personagem-carbono (bolinha escura com olhinhos) entra na folha de uma planta. |
| L03 | Planta → prato → casca no saco → biodigestor (setas à mão). |
| L04 | Chama azul do fogão solta o carbono de volta, feliz. |
| L05 | Anel de papel verde fecha; o carbono dá a volta rápido (rastro pontilhado). |
| L06 | Do outro lado: barril de petróleo e pedaço de carvão com um carbono "dormindo" (touca de dormir). |
| L07 | Chaminé acorda o carbono antigo, que sobe e se junta a uma nuvem cinza que cresce. |
| L08 | Montinho de esterco na lagoa aberta solta CH₄; tampa do biodigestor fecha em cima: carimbo **METANO CAPTURADO**. |
| L09 | Roda de papel gira leve, a nuvem cinza não cresce; cartão final. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| CO₂ biogênico participa do ciclo curto do carbono; fóssil adiciona carbono antigo | conceito consolidado ✔ (fala evita números de tempo) |
| digestão controlada evita emissão de metano de resíduos a céu aberto | ✔ |
| "sem pesar no clima" — simplificação do balanço (há emissões na cadeia) | **aceitável para o público geral?** confirmar com o Eixo 4 (ACV) |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep11/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **L** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **L**) |
|---|---|
| `pecas_ep11` | Separate items spaced far apart: an oil barrel (plain, no text), a lump of black coal, an industrial chimney, a small grey storm cloud, a plate with food, a green leafy plant in a pot, a tiny sleeping nightcap. |

Reaproveita: plantas, biodigestor, fogão, esterco, moléculas (código), personagem-carbono (código).

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep11.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 56-second educational animation about biogas for all ages (chalkboard & sketchbook style). Light, curious and minimal: plucky pizzicato and marimba loops, pencil-tap percussion, a floating glockenspiel melody that circles like the carbon cycle. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 96 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 58 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Curious and friendly, like following a tiny adventurer on a journey; clear and light.
```

**Texto da narração**

```narracao pt-BR
L01 | Todo gás carbônico é igual? Nem sempre! Olha só.
L02 | A planta cresce tirando gás carbônico do ar.
L03 | Ela vira comida, vira resíduo… e no biodigestor, vira biogás.
L04 | Quando a gente usa esse biogás, o carbono volta pro ar…
L05 | …e a próxima planta pega ele de novo. É um ciclo curtinho, que gira rápido.
L06 | Já o petróleo e o carvão guardam um carbono que ficou enterrado por muito, muito tempo.
L07 | Queimar esse carbono antigo é jogar gás carbônico novo na atmosfera.
L08 | E tem mais: tratar o resíduo no biodigestor evita que o metano escape pro ar.
L09 | Carbono que volta pro ciclo: com biogás, a roda gira sem pesar no clima!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 11 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 11 --idioma pt-BR        # 2 tomadas
```
