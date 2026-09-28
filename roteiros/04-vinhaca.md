# 04 · Vinhaça: o tesouro líquido da cana

| ficha | |
|---|---|
| série | Série A — Biogás básico |
| duração | ~50 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **D** — maquete de papelão |
| twist | mistério / detetive |
| Metaninho | cientista detetive |
| arquivos | imagens `entrada/imagens/ep04/` · música `entrada/musica/musica_ep04.mp3` · voz `entrada/narracao/<idioma>/ep04_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
O resíduo mais "paulista" de todos. Uma usina de papel faz etanol, e pela torneira de trás escorre um caldo
escuro: a vinhaça. Em vez de ir direto para o canavial, ela passa antes pelo biodigestor, sai biogás, e o que
sobra continua adubando a cana. Mesma vinhaça, duas riquezas.

### Estilo & twist
**Maquete de papelão** + **mistério / detetive**. O **cientista Metaninho** (óculos, chapéu de detetive de papelão) investiga uma maquete de usina: pegadas de gotas escuras, lupa, cada fala é uma pista (ícones, não números). A "solução do mistério" é o biodigestor; o mascote de crochê aparece na assinatura. Termina sempre com a assinatura CP2B ([ESTILOS.md](ESTILOS.md)).

### Storyboard
| # | cena |
|---|---|
| L01 | Feixe de cana na mesa; um cadeado desenhado aparece no colmo; ponto de interrogação; gota escura pinga. |
| L02 | Usina de etanol de papel (chaminé, tanques); garrafinha de etanol sai de um lado, **vinhaça** escorre do outro para um tanque; etiqueta "vinhaça". |
| L03 | Caminhão-tanque espalha vinhaça no canavial (traço tracejado das gotas). |
| L04 | Um cano "desvia" a vinhaça para o biodigestor; placa de papel "PARE" com carinha. |
| L05 | Lupa mostra micróbios comendo; bolhas sobem; letras recortadas **BIOGÁS!** |
| L06 | Saída do biodigestor volta para o canavial; a cana cresce um pouquinho. |
| L07 | Balança de papel com dois pratos: chama de gás / broto de cana — equilibrada. |
| L08 | Mapa de SP (malha IBGE, ep. 02) coberto de canas brotando; brilho. |
| L09 | Ciclo desenhado à mão: usina → biodigestor → energia → canavial; cartão final. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| vinhaça = resíduo líquido da destilação do etanol, rico em matéria orgânica | literatura clássica do setor; eixo 5 do CP2B trata a vinhaça como foco da biorrefinaria (`cp2b_web/src/data/content.js`) ✔ |
| uso tradicional em fertirrigação do canavial | prática corrente no setor ✔ (a fala diz "adubar a terra" sem detalhar) |
| digestão anaeróbia da vinhaça gera biogás e mantém o valor fertilizante | projeto CP2B "Biorrefinaria de Vinhaça e Resíduos da Cana"; CSV de codigestões (Moraes et al. 2015) ✔ |
| SP é o maior produtor de cana do Brasil | material institucional CP2B (50% da produção nacional de cana, safra 2023/24) ✔ — sem número na fala |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep04/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **D** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **D**) |
|---|---|
| `usina_etanol` | A friendly sugarcane ethanol mill, side view: two tall cylindrical tanks, a distillation column, a short chimney with a round puff of cream paper smoke, a small pipe with a tap at the back dripping a dark brown liquid, a pile of cane stalks at the entrance. |
| `caminhao_tanque` | A farm tanker truck, side view facing right, with a big round brown tank and a sprinkler bar at the back, blank sides. |
| `pecas_ep04` | Separate items spaced far apart: a small glass bottle of clear ethanol with a cork, three dark brown liquid drops of different sizes, a small stop sign with a friendly face (no text, plain octagon), a balance scale with two empty pans, a sugarcane sprout. |

Reaproveita: cana (feixe e planta), biodigestor, lupa, micróbios, trator, mapa de SP.

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep04.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 54-second educational animation about biogas for all ages (cardboard diorama style). Playful cartoon detective mystery: sneaky pizzicato walking bass, tiptoe marimba, a curious clarinet melody, finger snaps; in the second half the mystery is solved and the music brightens into the full, happy series theme. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 100 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 56 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Playful intrigue, like a friendly detective story: slightly hushed and curious on the clues, bursting with delight at the discovery.
```

**Texto da narração**

```narracao pt-BR
L01 | Você sabia que a cana guarda um segredo… líquido?
L02 | Quando a usina produz etanol, sobra a vinhaça: um caldo escuro, cheio de matéria orgânica.
L03 | Por muito tempo, ela foi direto pro canavial, pra adubar a terra.
L04 | Mas antes disso, a vinhaça pode dar uma paradinha no biodigestor…
L05 | …onde os micróbios transformam essa matéria orgânica em biogás!
L06 | E o que sai do biodigestor continua sendo um ótimo adubo pra lavoura.
L07 | Ou seja: a mesma vinhaça dá energia… e ainda alimenta a cana!
L08 | E São Paulo é o estado que mais produz cana no Brasil. Imagina o tamanho desse tesouro!
L09 | Vinhaça: da usina pro biodigestor, e do biodigestor pra energia.
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 04 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 04 --idioma pt-BR        # 2 tomadas
```
