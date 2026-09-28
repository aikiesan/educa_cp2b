# 90 · Derivados: versões em inglês, vinheta e pílulas

| ficha | |
|---|---|
| série | Derivados (baratos: reaproveitam o que já existe) |
| duração | vinheta 5 s · pílulas 12–15 s · versões en-GB com a duração original |
| formatos | pílulas e vinheta só 9:16; versões en-GB em 16:9 e 9:16 |
| idiomas | en-GB (versões dos eps. 01 e 02) · pt-BR (vinheta e pílulas) |
| estilo visual | o do episódio de origem (**C**, colagem de papel) |
| twist | **troca de língua** (en-GB) · **vinheta** da série · **pílula** (um único momento, com a assinatura) |
| Metaninho | mascote de crochê na vinheta e na assinatura das pílulas |
| arquivos | voz `entrada/narracao/en-GB/ep90_en-GB_<voz>_take1.wav` (ep. 01) e `entrada/narracao/en-GB/ep91_en-GB_…` (ep. 02) · música: a do episódio de origem |

---

## 1. Roteiro do vídeo (animação)

### A · Versões em inglês (en-GB) dos eps. 01 e 02
Mesma animação, mesma trilha e efeitos; troca a voz, as legendas e os textos da tela (etiquetas, carimbos, letras
recortadas) por um dicionário en-GB na cena. No ep. 02, a interface de papel da plataforma também ganha rótulos em
inglês (Filters · Agricultural · Livestock · Urban · Scientific Base). A narração do ep. 01 original tinha duas vozes;
a versão inglesa usa **uma narradora** (voz feminina da série).

### B · Vinheta da série (5 s, sem narração)
Mesa de papel vazia → o **Metaninho de crochê** cai quicando no centro → a bolinha de cima vira uma chama azul → a
câmera se aproxima e a chama se abre no **cartão do logo CP2B** + "educa CP2B" escrito à mão. Som: o "ta-da" da série.
Serve de abertura das pílulas e de fechamento alternativo.

### C · Pílulas de 15 s (9:16, pt-BR)
Recortes dos episódios prontos, cada um com a **assinatura CP2B** (4 s) acrescentada no fim. Tempos do timeline atual:

| pílula | origem | trecho | ideia única |
|---|---|---|---|
| P1 · A festa dos micróbios | ep. 01 | 9,4 s → 17,9 s (L03–L04) | o que acontece no biodigestor |
| P2 · Do que é feito o biogás | ep. 01 | 17,6 s → 25,0 s (L05–L06) | metano, gás carbônico e o cheiro |
| P3 · Nasce o biometano | ep. 01 | 28,5 s → 42,5 s (L08–L09) | purificação e usos |
| P4 · Fechando o ciclo | ep. 01 | 42,2 s → 51,0 s (L10) | biofertilizante e o anel completo |
| P5 · 645 municípios | ep. 02 | 4,3 s → 14,2 s (L02) | onde está o biogás de SP |
| P6 · Na hora | ep. 02 | 28,5 s → 34,8 s (L06) | filtro + clique + resultado |
| P7 · Base científica | ep. 02 | 34,6 s → 39,6 s (L07) | fontes e métodos à vista |

Os episódios novos também viram pílulas (ex.: cada afirmação do ep. 14, *Mitos e verdades*, é uma pílula pronta).

### Checagem de conteúdo
Tradução fiel aos roteiros já checados dos eps. 01 e 02; termos em inglês britânico (*lorries*, *biofertiliser*,
*rubbish*). O nome do centro segue o site: "São Paulo Center for Biogas and Bioproducts Studies" (confirmar).

---

## 2. Imagens — prompts

Nenhuma imagem nova: tudo reaproveita os recortes dos eps. 01–02 e os personagens fixos.

---

## 3. Música — prompt (Lyria 3 Pro)

Versões en-GB e pílulas usam a trilha do episódio de origem. A vinheta usa só o "ta-da" final. Se quiserem uma vinheta
própria:

```musica
A 5-second sonic logo for the educa CP2B series of paper-cut educational animations: a quick glockenspiel and marimba sparkle rising into one tight, joyful full-band "ta-da" hit (pizzicato strings, plucked ukulele, upright bass, light woodblock), then a short natural ring-out. Major key, bright, friendly. No vocals.
```

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada** (padrão Laomedeia). A vinheta e as pílulas não precisam de narração nova.

**Direção de voz (en-GB)**

```direcao en-GB
British English, standard Southern British accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear, short natural pauses at the ellipses and dashes. Pronounce Brazilian names the Brazilian way: São Paulo (sow POW-loo). Tone for this episode: curious and cheerful, a playful surprise on the funny lines ("some of them really smelly!").
```

**Texto da narração — ep. 01 em inglês**

```narracao en-GB
L01 | What is biogas? And biomethane?
L02 | It all starts with what nobody wants: food scraps, manure, crop leftovers…
L03 | Inside the biodigester — a sealed tank with no oxygen — microbes throw a party…
L04 | …and release a gas: biogas!
L05 | It's mostly methane and carbon dioxide, with a pinch of other gases…
L06 | …some of them really smelly!
L07 | But by burning biogas, we can make heat and electricity.
L08 | And there's more: take out the carbon dioxide and impurities, and biomethane is born — almost pure methane!
L09 | It's just like natural gas, only renewable: it can travel through the gas grid to homes and industries, or fuel lorries and buses.
L10 | And what's left in the biodigester becomes biofertiliser for the fields… closing the loop!
L11 | Biogas and biomethane: today's waste is tomorrow's energy!
LF | CP2B: living energy, science that transforms! | fala: C-P-two-B: living energy, science that transforms!
```

A versão em inglês do ep. 02 tem ficha própria: [91-pilar-2b-en.md](91-pilar-2b-en.md).

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 90 --idioma en-GB --testar-vozes
python tools/tts/gerar_narracao.py 90 --idioma en-GB
```
