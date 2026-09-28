# 03 · O que é o CP2B

| ficha | |
|---|---|
| série | Série C — CP2B por dentro |
| duração | ~55 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR + en-GB |
| estilo visual | **P** — livro pop-up |
| twist | o livro do CP2B (cada página é uma ideia) |
| Metaninho | cientista abre o livro; mascote na lombada e na assinatura |
| arquivos | imagens `entrada/imagens/ep03/` · música `entrada/musica/musica_ep03.mp3` · voz `entrada/narracao/<idioma>/ep03_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
O "cartão de visitas" da série. O **cientista Metaninho** abre sobre a mesa o **livro pop-up do CP2B**: cada
página que vira é uma ideia, e o cenário sobe dobrando. Carimbo **RESÍDUO?** → **RECURSO!**, o mapa de SP, o
nome do centro, a sede, a missão, o laboratório vivo e os eixos, a rede de parceiros, os valores e a visão.
O mesmo filme sai nas duas línguas, com os textos da tela num dicionário.

### Estilo & twist
**Livro pop-up** + **o livro do CP2B**. Cada fala = uma página: virar a página (som de papel grosso), o cenário se
ergue da dobra, abas de puxar revelam detalhes (ex.: puxar a aba e a máquina solta biogás). O cientista vira
as páginas; o **mascote de crochê** mora na lombada e espia a cada virada. Termina com a assinatura CP2B.

### Storyboard (uma página pop-up por fala)
| # | página |
|---|---|
| L01 | Capa do livro; o cientista abre. Pop-up de um saco de restos; carimbo **RESÍDUO?**; em *recurso* a aba vira e mostra **RECURSO!** com uma lâmpada acesa. |
| L02 | O mapa de SP (645 municípios, ep. 02) sobe da dobra; cana, vaca e caminhão de lixo em pé sobre ele; medidor de papel "energia aproveitada" enche só um pouquinho — **sem número**. |
| L03 | Letras **CP2B** sobem em camadas; o nome completo numa faixa que desenrola. |
| L04 | Prédio de papel ergue-se; alfinete em Campinas; etiquetas "NIPE · Unicamp" e "FAPESP" (só texto). |
| L05 | A máquina de papel sobe; puxar a aba: saem bolha de biogás, ônibus a biometano, frascos de bioprodutos. |
| L06 | Barraca-laboratório no campo em pop-up; abas laterais com os eixos (Resíduos · Ciência de base · Processos · Avaliação integrada · Bioprodutos · Educação · Comunicação · Políticas públicas). |
| L07 | Página-mural: barbante vermelho liga alfinetes com etiquetas das instituições (Unicamp, USP, Unifal, IAC, IZ, Embrapii, Comgás, Sabesp, Copercana, Amplum, Cádiz, TU Delft, LNEG…); pesquisadores recortados em volta. |
| L08 | Quatro carimbos batem na página, no ritmo: EXCELÊNCIA · ÉTICA · DIVERSIDADE · SOCIEDADE. |
| L09 | Vitrine com toldo listrado sobe; o mapa de SP acende dentro; a câmera recua: SP destacado no Brasil; etiqueta "América Latina". |
| LF | O livro fecha; assinatura CP2B com "Processo FAPESP 2024/01112-1"; o mascote de crochê pula para o lado do cartão. |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte |
|---|---|
| nome, sede NIPE/Unicamp, processo FAPESP 2024/01112-1 | material institucional; `cp2b_web/src/data/content.js` ✔ |
| nome oficial em inglês | site CP2B: **"São Paulo Center for Biogas and Bioproducts Studies"** (a plataforma PILAR-2b usa "…Center for Studies in Biogas and Bioproducts" — alinhar) |
| "só uma fração do potencial é aproveitada" | resumo executivo ✔ |
| missão, laboratório vivo, eixos, parceiros, valores, visão (vitrine; referência latino-americana em 2035) | material institucional ✔ |
| slogan em inglês | **sem versão oficial encontrada** — proposta "Living energy, science that transforms." (confirmar) |
| números | nenhum na narração; na tela só o processo FAPESP |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/ep03/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **P** + regras em [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md). Personagens fixos (cientista e mascote) ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **P**) |
|---|---|
| `livro` | A large open pop-up book lying flat, seen from the front and slightly above, cream pages with a visible centre fold and thick hardcover edges in petrol blue, pages empty (the pop-up scenes will be added later), wide composition. |
| `pesquisadores` | Six separate friendly cartoon researchers, half body, facing the viewer: (1) a young woman in a lab coat holding a test tube; (2) an older man with grey hair and a field vest holding a clipboard; (3) a woman in a hard hat and safety vest; (4) a young man with a laptop under his arm; (5) a woman with curly hair holding a seedling; (6) a man in a lab coat holding a small flask. Varied skin tones, ages and hair. Simple smiling mouths in ink. IMPORTANT: no eyes and no glasses — leave two plain white oval areas where the eyes would be. |
| `laboratorio_campo` | A small outdoor field research station: a white canvas tent open at the front, a folding table with flasks and a microscope, a small biodigester tank beside it, a few test plots of young plants in front, side-front view. |
| `predio` | A friendly generic university research building, two floors, big windows, a tree beside it, front view (not a real building, no text). |
| `pecas_ep03` | Separate items spaced far apart: a ball of red string, a shop awning in green and cream stripes, a wooden rubber stamp, a simple gauge meter with a needle (no numbers), a pull-tab strip with an arrow shape, a small cork board. |

Personagens: cientista e mascote (ver [PROMPT_IMAGENS.md](PROMPT_IMAGENS.md)). Reaproveita: saco de restos, mapa de SP,
cana, vaca, caminhão de lixo, máquina, ônibus, alfinetes, frascos (ep. 15).

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_ep03.mp3`**. Anexe uma trilha anterior da série como referência de família sonora (ex.: `entrada/musica/Sunlight_on_the_Workbench.mp3`).

```musica
Instrumental for a 59-second educational animation about biogas for all ages (pop-up book style). Warm, proud and quietly cinematic storybook feel, like pages of a pop-up book turning: soft strings and french horn join the series instruments; a gentle page-turn motif on glockenspiel at the start of each phrase; builds to its proudest, fullest statement in the last third. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady 96 BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length 61 seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede (`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: Warm, confident and inspiring — the proud voice of the centre introducing itself, still smiling and upbeat.
```

**Direção de voz (en-GB)**

```direcao en-GB
British English, standard Southern British accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear, short natural pauses at the ellipses and dashes. Pronounce Brazilian names the Brazilian way: São Paulo, Unicamp (oo-nee-KAMP), FAPESP (fah-PESP), NIPE (NEE-pee). Tone for this episode: Warm, confident and inspiring — the proud voice of the centre introducing itself, still smiling and upbeat.
```

**Texto da narração**

```narracao pt-BR
L01 | Resíduo… ou recurso?
L02 | São Paulo gera muitos resíduos orgânicos, no campo e nas cidades — mas só uma pequena parte vira energia.
L03 | Pra mudar isso, nasceu o CP2B: o Centro Paulista de Estudos em Biogás e Bioprodutos! | fala: Pra mudar isso, nasceu o cê-pê-dois-bê: o Centro Paulista de Estudos em Biogás e Bioprodutos!
L04 | Com sede no NIPE, na Unicamp, e apoio da FAPESP.
L05 | Nossa missão: transformar resíduos em biogás, biometano e bioprodutos — com ciência, tecnologia e impacto social.
L06 | Funcionamos como um laboratório vivo, testando soluções no campo — do inventário de resíduos às políticas públicas.
L07 | Somos uma rede de pesquisadores, universidades e empresas, no Brasil e no exterior.
L08 | Com excelência, ética, diversidade e compromisso com a sociedade.
L09 | Queremos fazer de São Paulo uma vitrine de soluções em biogás — e uma referência na América Latina!
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

```narracao en-GB
L01 | Waste… or resource?
L02 | São Paulo produces a great deal of organic waste, on farms and in cities — yet only a small share becomes energy.
L03 | To change that, CP2B was born: the São Paulo Center for Biogas and Bioproducts Studies! | fala: To change that, C-P-two-B was born: the São Paulo Center for Biogas and Bioproducts Studies!
L04 | Based at NIPE, at Unicamp, and supported by FAPESP.
L05 | Our mission: turning waste into biogas, biomethane and bioproducts — through science, technology and social impact.
L06 | We work as a living lab, testing solutions in the field — from waste inventories to public policy.
L07 | We are a network of researchers, universities and companies, in Brazil and abroad.
L08 | Driven by excellence, ethics, diversity and a commitment to society.
L09 | We want São Paulo to become a showcase for biogas solutions — and a benchmark across Latin America!
LF | CP2B: living energy, science that transforms! | fala: C-P-two-B: living energy, science that transforms!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 03 --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py 03 --idioma pt-BR        # 2 tomadas
python tools/tts/gerar_narracao.py 03 --idioma en-GB        # 2 tomadas
```
