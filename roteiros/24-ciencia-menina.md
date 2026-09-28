# 24 · Ciência, coisa de menina

| ficha | |
|---|---|
| série | Série C — CP2B por dentro |
| duração | ~48 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **Q** — quadrinhos |
| twist | super-heroínas da ciência (HQ) |
| Metaninho | cientista coadjuvante |
| arquivos | imagens `entrada/imagens/ep24/` · música `entrada/musica/musica_ep24.mp3` · voz `entrada/narracao/<idioma>/ep24_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
Diversidade e equidade de gênero, um dos valores do CP2B, contada como uma **HQ de super-heroínas da ciência**:
uma estudante do ensino médio descobre que o "superpoder" é a curiosidade, e a revistinha mostra meninas e
mulheres cientistas em todas as áreas do biogás. Liga ao projeto de extensão "Ciência, coisa de menina".

### Estilo & twist
**Quadrinhos** + **super-heroínas**: capa de revista, quadros dinâmicos, onomatopeias (ZAP, UAU, TCHAM), capas
esvoaçantes feitas de jaleco. O **cientista** aparece só como coadjuvante, segurando a porta do laboratório. Termina
com a assinatura CP2B.

### Storyboard
| # | quadro |
|---|---|
| L01 | Capa de revistinha "CIÊNCIA!"; a estudante (jaleco-capa) pousa com ZAP. |
| L02 | Quadro: ela olha uma casca de banana; balão de pensamento com uma lâmpada. |
| L03 | Quadros em mosaico: cientistas no microscópio, na planta piloto, no mapa, com um livro de leis. |
| L04 | Página dupla: fila de cientistas mulheres, heroicas, com o prédio do centro atrás. |
| L05 | Quadro: ônibus escolar chega ao laboratório; placa "Ciência, coisa de menina". |
| L06 | Quadros rápidos: pipetas, bolhas, UAU!, conversa com pesquisadora (balões). |
| L07 | Dois carimbos: DIVERSIDADE · EQUIDADE DE GÊNERO. |
| L08 | Última página: a estudante já de jaleco, piscando para o leitor; o cientista segura a porta. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| valor "Diversidade & Equidade de Gênero" | "Nossos Valores" (material institucional) ✔ |
| direção do centro por cientistas mulheres (Diretora e Vice-Diretora) | lista "Direção do CP2b" ✔ — sem nomes na fala |
| projeto "Ciência, coisa de menina: ciência para alunas de ensino médio e ingressantes da UNIFAL-MG" | eixos 6/7 (`axisDetails.js`) ✔ — **confirmar formato (visitas, experimentos) e se é projeto do CP2B ou parceiro** |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep24/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **Q** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **Q**) |
|---|---|
| `herois` | Five separate women scientists as friendly comic heroines, full body, dynamic poses, lab coats flowing like capes: (1) a teenage high-school student with a backpack and a lab coat; (2) a microbiologist with a pipette; (3) an engineer with a hard hat next to a small tank; (4) a geographer holding a rolled map; (5) a policy researcher holding a book. Varied skin tones, ages, body types and hair. IMPORTANT: no eyes and no glasses — two plain white oval areas where the eyes would be. |
| `pecas_ep24` | Separate items spaced far apart: a school bus side view (no text), a comic-book cover frame (empty, no text), a thought bubble with a light bulb, a microscope, a small building with a flag pole (no flag), a banana peel. |

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep24.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 52-second educational animation about biogas for all ages (comic book style). Empowering upbeat heroic theme: bright horn melody, driving pizzicato and claps, joyful and confident. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 110 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 54 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Empowering and joyful, confident comic-book narrator cheering on the heroines.
```

**Texto da narração**

```narracao pt-BR
L01 | Toda heroína tem um superpoder. O dela é a curiosidade!
L02 | Ela olha pra um resto de comida e pergunta: "e se isso virasse energia?"
L03 | Na ciência do biogás tem lugar pra todo mundo: nos micróbios, nas máquinas, nos mapas, nas leis…
L04 | …e muitas dessas cientistas são mulheres — inclusive quem dirige o CP2B! | fala: …e muitas dessas cientistas são mulheres — inclusive quem dirige o cê-pê-dois-bê!
L05 | Com projetos como o "Ciência, coisa de menina", estudantes do ensino médio conhecem os laboratórios por dentro…
L06 | …fazem experimentos, conversam com pesquisadoras e descobrem novos caminhos.
L07 | Porque diversidade e equidade de gênero também são valores da boa ciência.
L08 | Ciência? Coisa de menina — e de todo mundo que tem curiosidade!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 24 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 24 --idioma pt-BR        # 2 tomadas
```
