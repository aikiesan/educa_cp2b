# 20 · Os eixos do CP2B

| ficha | |
|---|---|
| série | Série C — CP2B por dentro |
| duração | ~58 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR |
| estilo visual | **N** — caderno de campo |
| twist | fichário com abas (uma página por eixo) |
| Metaninho | cientista vira as abas |
| arquivos | imagens `entrada/imagens/ep20/` · música `entrada/musica/musica_ep20.mp3` · voz `entrada/narracao/<idioma>/ep20_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
O episódio "índice" da série C. O **caderno de campo** do cientista tem abas coloridas, e cada aba abre uma página
com um mini-cenário de 3–4 segundos. Depois, cada aba pode virar um episódio próprio (um por eixo).

### Estilo & twist
**Caderno de campo** + **fichário com abas**. Páginas de kraft com anotações à mão, fita washi e folhas prensadas;
cada página se desenha enquanto a narradora fala (traço que aparece), com adesivos que pulam. O **cientista** vira
as abas; o **mascote** é o marcador de página. Termina com a assinatura CP2B.

### Storyboard (aba → página)
| # | página |
|---|---|
| L01 | Caderno fechado com oito abas; o cientista abre; as abas se abrem em leque (texto curto nas abas). |
| L02 | **Resíduos**: mapa de SP desenhado com alfinetes (ep. 02). |
| L03 | **Ciência de base**: lupa sobre micróbios. |
| L04 | **Processos**: um reator de bancada cresce até virar tanque grande; capacete de obra. |
| L05 | **Avaliação integrada**: balança com moeda, folha e raio. |
| L06 | **Bioprodutos**: prateleira de frascos (ep. 15). |
| L07 | **Educação**: lousa pequena, estudantes. |
| L08 | **Comunicação**: câmera filmando o próprio cientista (metalinguagem). |
| L09 | **Políticas públicas**: prédio com colunas, documento carimbado. |
| L10 | As abas se fecham num feixe e viram uma chama azul. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte |
|---|---|
| eixos e focos (inventário; ciência de base; processos e escala com empresas; avaliação integrada com ACV e insumo-produto; bioprodutos e biorrefinaria; educação e capacitação; difusão científica; políticas públicas e inovação regulatória) | `cp2b_web/src/data/content.js` → `researchAxes` ✔ |
| número de eixos | só na tela (oito abas); a fala evita o número |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep20/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **N** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **N**) |
|---|---|
| `caderno` | An open naturalist field notebook lying flat, kraft-paper pages with a spiral binding, eight coloured index tabs sticking out on the right edge (green, lime, amber, petrol, coral, yellow, sky blue, dark green), pages empty, wide composition. |
| `pecas_ep20` | Separate items spaced far apart: a small bench-top glass reactor, a hard hat, a balance scale with a coin on one side and a leaf on the other, a small chalkboard, a vintage film camera on a tripod, a government building with columns (no text), an official document with a round stamp mark (no text), a pressed leaf, a strip of washi tape. |

Reaproveita: mapa de SP, alfinetes, lupa, micróbios, frascos (ep. 15), estudantes (ep. 19).

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep20.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 62-second educational animation about biogas for all ages (field notebook style). Gentle, exploratory and organised: a page-turn glockenspiel motif repeating for each new tab, kalimba and marimba with soft strings, steady and friendly. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 96 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 64 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Clear, friendly and organised, like a guided tour through a notebook, with energy on each new tab.
```

**Texto da narração**

```narracao pt-BR
L01 | Como o CP2B se organiza? Em eixos de pesquisa, que trabalham juntos! | fala: Como o cê-pê-dois-bê se organiza? Em eixos de pesquisa, que trabalham juntos!
L02 | Um eixo faz o inventário dos resíduos e mapeia onde eles estão.
L03 | Outro cuida da ciência de base: entender os micróbios e os processos.
L04 | Tem o eixo que leva as ideias pra escala maior, junto com as empresas.
L05 | Um que avalia os impactos: na economia, no ambiente e na energia.
L06 | Um que inventa bioprodutos, na lógica da biorrefinaria.
L07 | Um de educação e capacitação, pra formar gente nova no biogás.
L08 | Um de difusão científica — é ele que ajuda a fazer vídeos como este!
L09 | E um de políticas públicas, pra transformar pesquisa em regras e programas.
L10 | Muitos jeitos de olhar pro resíduo… e um só objetivo: energia viva!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 20 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 20 --idioma pt-BR        # 2 tomadas
```
