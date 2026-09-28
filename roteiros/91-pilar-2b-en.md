# 91 · PILAR-2b: the biogas map of São Paulo (en-GB)

| ficha | |
|---|---|
| série | Derivados — versão em inglês do ep. 02 |
| duração | a do ep. 02 (~58 s, recalculada com a voz nova) |
| formatos | 16:9 e 9:16 · marca-d'água CP2B |
| idiomas | en-GB |
| estilo visual | **C** — colagem de papel (a mesma cena do ep. 02) |
| twist | troca de língua; a tela de papel da plataforma ganha rótulos em inglês |
| Metaninho | mascote de crochê na assinatura |
| arquivos | voz `entrada/narracao/en-GB/ep91_en-GB_<voz>_take1.wav` · música `entrada/musica/Sunlight_on_the_Workbench.mp3` (a do ep. 02) |

---

## 1. Roteiro do vídeo (animação)

### Ideia
A mesma animação do ep. 02 (`videos/02-pilar-2b/`), com narração, legendas e textos da tela em inglês britânico.

### Estilo & twist
Sem mudança visual. Os textos da tela passam por um dicionário en-GB: "ONDE ESTÁ O BIOGÁS?" → "WHERE'S THE
BIOGAS?", "de São Paulo?" → "in São Paulo?", Filtros → Filters, Agrícola · Pecuária · Urbano → Agricultural ·
Livestock · Urban, Mapa · Base Científica → Map · Scientific Base, "Potencial de biogás" → "Biogas potential",
"menos ↔ mais" → "less ↔ more", "o mapa do biogás de São Paulo" → "the biogas map of São Paulo". A assinatura
CP2B usa o slogan em inglês.

### Storyboard
Idêntico ao ep. 02 ([videos/02-pilar-2b/roteiro.md](../videos/02-pilar-2b/roteiro.md)); as deixas seguem as palavras
equivalentes em inglês (ex.: `at('L06', 'city')`).

### Assinatura CP2B
Cartão branco com o logo CP2B e "Living energy, science that transforms." (confirmar versão oficial), o Metaninho de
crochê ao lado; a narradora diz a fala **LF**.

### Checagem de conteúdo
| afirmação | fonte / status |
|---|---|
| mesmo conteúdo checado do ep. 02 | ✔ |
| nomes da interface em inglês | conferir com a versão em inglês da plataforma (`messages/en.json`) antes de desenhar |

---

## 2. Imagens — prompts

Nenhuma imagem nova (reaproveita os recortes do ep. 02).

---

## 3. Música — prompt (Lyria 3 Pro)

Reaproveita "Sunlight on the Workbench" (ep. 02); o logo continua no golpe final.

---

## 4. Narração — prompt (Gemini TTS)

Voz **feminina e animada** (padrão Laomedeia).

**Direção de voz (en-GB)**

```direcao en-GB
British English, standard Southern British accent. Upbeat, bright and energetic female narrator for a fun science explainer for all ages: big smile in the voice, lively bouncy rhythm but always clear, short natural pauses at the ellipses and dashes. Pronounce Brazilian names the Brazilian way: São Paulo (sow POW-loo), Campinas (kahm-PEE-nahs). Say 'PILAR-2b' as 'Pilar two-B' and 'CP2B' as 'C-P-two-B'. Tone for this episode: clear and inviting, with a little extra sparkle on "straight away" and "explore".
```

**Texto da narração**

```narracao en-GB
L01 | Where is São Paulo's biogas?
L02 | It's hidden in waste: in sugarcane, in manure, in city rubbish… spread across 645 municipalities. | fala: It's hidden in waste: in sugarcane, in manure, in city rubbish… spread across six hundred and forty-five municipalities.
L03 | To find that potential, CP2B created PILAR-2b. | fala: To find that potential, C-P-two-B created Pilar two-B.
L04 | An online platform that brings together data from farming, livestock and cities…
L05 | …and calculates how much biogas each municipality could produce.
L06 | Just choose the type of waste, click on your city… and see the result straight away.
L07 | All based on science: the sources and methods are there for everyone to see.
L08 | So public managers, companies and researchers can find where it's worth investing in renewable energy.
L09 | PILAR-2b: the biogas map of São Paulo. Take a look and explore! | fala: Pilar two-B: the biogas map of São Paulo. Take a look and explore!
LF | CP2B: living energy, science that transforms! | fala: C-P-two-B: living energy, science that transforms!
```

**Comando**

```powershell
cd "A:\Pilar-2b\PILAR-2b Design System\educa_cp2b\entrada"
python tools/tts/gerar_narracao.py 91 --idioma en-GB --testar-vozes
python tools/tts/gerar_narracao.py 91 --idioma en-GB
```
