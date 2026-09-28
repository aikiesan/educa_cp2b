# NN · Título do vídeo

<!-- MODELO — copie para roteiros/NN-slug.md e preencha. Mantenha os títulos das seções e os blocos
     ```musica, ```direcao e ```narracao: os scripts leem esses blocos.
     Regras da série: nenhum número na narração · uma ideia por cena · estilo + twist diferentes do vídeo anterior
     (ver ESTILOS.md) · termina SEMPRE com a assinatura CP2B (fala LF + cartão). -->

| ficha | |
|---|---|
| série | Série A — Biogás básico · Série B — Além do biogás · Série C — CP2B por dentro |
| duração | ~50 s (+ ~4 s de assinatura CP2B) |
| formatos | 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B |
| idiomas | pt-BR (+ en-GB) |
| estilo visual | **X** — nome do estilo (C, F, P, D, L, B, Q ou N) |
| twist | o formato que muda (ver lista em ESTILOS.md) |
| Metaninho | cientista (apresenta/explica) · mascote de crochê (fofo, ajudante) · os dois |
| arquivos | imagens `entrada/imagens/epNN/` · música `entrada/musica/musica_epNN.mp3` · voz `entrada/narracao/<idioma>/epNN_<idioma>_<voz>_take1.wav` |

---

## 1. Roteiro do vídeo (animação)

### Ideia
Duas ou três frases: qual é a ideia central e qual imagem conduz o vídeo.

### Estilo & twist
Como o estilo visual e o twist aparecem na tela (materiais, câmera, ritmo, efeitos). Termina com a assinatura CP2B.

### Storyboard
| # | cena |
|---|---|
| L01 | o que acontece na tela durante a fala L01 (a deixa principal cai numa palavra da fala) |
| L02 | … |

### Assinatura CP2B
Nos últimos ~4 s: cartão branco com o logo CP2B e "Energia viva, ciência que transforma.", o Metaninho de crochê ao
lado dando tchau, `cp2b.unicamp.br`; a narradora diz a fala **LF**. Ver [ESTILOS.md](ESTILOS.md).

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| cada fato da narração ou da tela | onde foi conferido (código, dados, material institucional, literatura) ✔ — ou **a confirmar** com quem |

---

## 2. Imagens — prompts

Salvar em **`entrada/imagens/epNN/`** com o nome da coluna "arquivo". Prompt-mestre do estilo **X** + regras em
[PROMPT_IMAGENS.md](PROMPT_IMAGENS.md); **prompt completo, pronto para colar**, em [PROMPTS_PRONTOS.md](PROMPTS_PRONTOS.md)
(rode `python tools/prompts_producao.py`). Personagens fixos ficam em `entrada/imagens/personagens/`.

| arquivo | prompt (depois do prompt-mestre **X**) |
|---|---|
| `nome_do_arquivo` | Descrição do objeto em inglês (um objeto por imagem para protagonistas; "Separate items spaced far apart: …" para folhas com vários itens). |

Reaproveita: recortes que já existem (ver PROMPT_IMAGENS.md, seção 6).

---

## 3. Música — prompt (Lyria 3 Pro)

Salvar como **`entrada/musica/musica_epNN.mp3`**. Anexe uma trilha anterior da série como referência de família sonora.

```musica
Instrumental for a NN-second educational animation about biogas for all ages (STYLE style). VARIAÇÃO DO TWIST EM INGLÊS. Keep it in the educa CP2B musical family: pizzicato strings, marimba and glockenspiel, plucked ukulele, upright bass, light woodblock and brushed kit, a warm clarinet — at least glockenspiel and marimba must be present. Steady NN BPM in 4/4, major key, friendly and never busy: it sits under a narrator. Total length NN seconds. End with the series' sonic signature: a clean final "ta-da" button — one tight full-band hit with a glockenspiel sparkle — followed by about 2 seconds of natural ring-out and silence. No vocals, no lyrics, no risers, no heavy drums, no sudden tempo changes.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada**. Padrão **Laomedeia**; alternativas femininas Zephyr, Autonoe, Leda, Aoede
(`--testar-vozes` gera L01–L02 em todas). Siglas e números vão na forma falada (campo `fala:`); a legenda usa o texto.

**Direção de voz (pt-BR)**

```direcao pt-BR
Brazilian Portuguese, neutral São Paulo accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear and easy to follow, playful emphasis on key words, short natural pauses at the ellipses and dashes. Tone for this episode: TOM DO TWIST EM INGLÊS.
```

**Texto da narração**

```narracao pt-BR
L01 | Texto da legenda. | fala: forma falada, se for diferente (ex.: "cê-pê-dois-bê")
L02 | …
LF | CP2B: energia viva, ciência que transforma! | fala: Cê-pê-dois-bê: energia viva, ciência que transforma!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py NN --testar-vozes      # escolher a voz
python tools/tts/gerar_narracao.py NN --idioma pt-BR        # 2 tomadas
```
