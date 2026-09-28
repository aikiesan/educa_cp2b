# 05 · Do chiqueiro à tomada

| ficha | |
|---|---|
| série | Série A — Biogás básico |
| duração | ~48 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **F** — feltro & crochê |
| twist | musical (onomatopeias no compasso) |
| Metaninho | mascote marca o ritmo |
| arquivos | imagens `entrada/imagens/ep05/` · música `entrada/musica/musica_ep05.mp3` · voz `entrada/narracao/<idioma>/ep05_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
Uma granja de papel com porquinhos e galinhas de olhinhos móveis. O esterco que se acumula vira um problema
(cheiro, metano no ar) até entrar no biodigestor, e aí vira calor para os leitões, luz para a fazenda e adubo.

### Estilo & twist
**Feltro & crochê** + **musical**. Tudo em **feltro**. As onomatopeias (OINC, CÓ, PLOP) entram no tempo forte da trilha e os bichos balançam no compasso; o **mascote de crochê** marca o ritmo pulando. Trilha mais dançante. Termina sempre com a assinatura CP2B ([ESTILOS.md](ESTILOS.md)).

### Storyboard
| # | cena |
|---|---|
| L01 | Porquinho e galinha entram quicando (olhinhos móveis); balões "oinc!" e "có!" desenhados; montinho de esterco com mosca. |
| L02 | Granja de papel; montinhos crescem em *todo santo dia* (relógio desenhado gira). |
| L03 | Lagoa aberta; linhas de cheiro; moléculas de CH₄ sobem até um termômetro que esquenta. |
| L04 | Tampa do biodigestor fecha; moléculas batem na cúpula e ficam presas: **COMBUSTÍVEL!** |
| L05 | Cano leva o gás: lâmpada de aquecimento sobre os leitões, gerador gira, casa da fazenda acende. |
| L06 | Trator espalha biofertilizante; brotos nascem. |
| L07 | Três carimbos: MENOS CHEIRO · MENOS POLUIÇÃO · MAIS ENERGIA; cofrinho de papel sorri. |
| L08 | Tomada de papel com carinha, fio até o biodigestor; cartão final. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| esterco em lagoa aberta emite metano, gás de efeito estufa | conceito consolidado ✔ |
| biogás de granjas aquece instalações, gera eletricidade | usos correntes em suinocultura ✔ |
| digestato como biofertilizante | ✔ (ep. 01) |
| aves: esterco de galinha também é digerido (costuma exigir mistura/controle de amônia) | ✔ — a fala não entra no detalhe; **confirmar com eixos 2/3 se preferem focar só em suínos** |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep05/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **F** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **F**) |
|---|---|
| `animais` | Separate farm animals spaced far apart, whole body, side view facing right: a chubby pink-coral pig, a small piglet, a brown hen, a white hen, a small yellow chick. IMPORTANT: no eyes — leave two plain white oval areas where the eyes would be on each animal. (Use coral #E4572E for the pigs, never magenta.) |
| `granja` | A small livestock barn with a sloped roof and open side, straw on the floor, and a covered biogas lagoon beside it (a long low mound of dark green plastic cover), side-front view. |
| `pecas_ep05` | Separate items spaced far apart: a heat lamp hanging from a cord, a farmhouse with lit windows, a wall power socket with a friendly face (no eyes, two plain white ovals), a piggy bank, a small puddle of open manure lagoon. |

Reaproveita: biodigestor, gerador, lâmpada, trator, plantas, esterco, mosca (código).

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep05.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 52-second educational animation about biogas for all ages (felt & crochet style). Bouncy, danceable farmyard groove: ukulele strums, hand claps, woodblock and a cheeky bassoon, with short rhythmic breaks on the downbeats so sound effects (oink, cluck, plop) can land in the gaps. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 112 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 54 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Extra bouncy and rhythmic, almost dancing with the music, playful on the animal sounds.
```

**Texto da narração**

```narracao pt-BR
L01 | Oinc! Có-có-ri-có! Na fazenda, bicho feliz também faz… muito esterco!
L02 | Nas granjas de porcos e de galinhas, esse esterco se acumula todo santo dia.
L03 | Se ficar a céu aberto, ele cheira mal e solta metano no ar — um gás que esquenta o planeta.
L04 | Mas dentro de um biodigestor, esse mesmo metano vira combustível!
L05 | O biogás pode aquecer a granja, girar um gerador… e acender as luzes da fazenda.
L06 | E o que sobra volta pro campo como biofertilizante.
L07 | Menos cheiro, menos poluição, mais energia — e economia pro produtor.
L08 | Do chiqueiro à tomada: é o esterco trabalhando a favor!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 05 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 05 --idioma pt-BR        # 2 tomadas
```
