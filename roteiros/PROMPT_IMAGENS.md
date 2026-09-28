# Prompt-mestre de imagens — educa CP2B (Nano Banana / Gemini)

Todas as ilustrações da série saem deste prompt. O código recorta o fundo sozinho, separa os itens de uma folha,
detecta buracos (telas, lentes) e ovais dos olhos — **desde que as regras abaixo sejam seguidas**.

**Onde salvar:** `entrada/imagens/epNN/` (a pasta de cada episódio já está criada), com o **nome de arquivo**
indicado no roteiro do episódio (ex.: `entrada/imagens/ep04/usina_etanol.png`). PNG ou JPG, na maior resolução
que o Gemini oferecer.

## 1. Estilo-mestre — cole no início de TODO prompt

```
Handmade paper-cut collage illustration for a joyful children's science animation (stop-motion look). Every object is built from cut and layered pieces of textured construction paper with visible paper fibres, slightly irregular scissor-cut edges and a few gently torn edges. A thin, continuous WHITE PAPER BORDER surrounds the whole silhouette of each object, like a sticker cut-out. Small details (lines, rivets, leaf veins, stitches) drawn with a dark petrol-blue ink pen (#1E3E4C), slightly wobbly, hand-drawn. Limited, cheerful palette ONLY: petrol blue #1E3E4C, dark green #00573A, green #5CA032, lime #B6E03B, amber #D37402, cream #F3EAD8, warm yellow #F2C14E, sky blue #8EC5D6, coral #E4572E, brown #8B5A3C, plus white. Friendly rounded shapes, simple and readable at small size. Flat orthographic front or side view, no perspective distortion, whole object visible with generous empty margin around it. BACKGROUND: a perfectly flat, uniform, pure magenta pink (#FF00FF, RGB 255,0,255) filling the entire image edge to edge — no gradient, no texture, no vignette, no floor, no horizon. No drop shadows, no cast shadows, no glow. No text, no letters, no numbers, no logos, no watermarks, no signatures.
```

> O "rosa" do fundo é o **magenta puro #FF00FF** — não rosa-bebê, não pink pastel. É ele que o código
> transforma em transparência.

O bloco acima é o **estilo C (colagem de papel)**. Cada vídeo usa um estilo (ver [`ESTILOS.md`](ESTILOS.md)); para
os outros estilos, **troque a primeira frase do estilo-mestre** pelo trecho abaixo e mantenha o resto (paleta,
fundo magenta, sem sombra, sem texto).

| estilo | troque a 1ª frase por |
|---|---|
| **F** feltro & crochê | `Handmade felt-and-crochet craft illustration for a joyful children's science animation (stop-motion look). Every object is built from soft wool felt pieces with visible blanket-stitch edges, tiny running stitches, crocheted yarn parts with visible loops, and small button details, slightly puffy like a plush toy. A thin continuous WHITE FELT BORDER surrounds the whole silhouette, like a sticker cut-out. Stitch lines in dark petrol-blue thread (#1E3E4C).` |
| **P** livro pop-up | `Pop-up book paper-craft illustration for a joyful children's science animation. Every object is a flat piece of thick coloured cardstock with visible fold lines, small folded tabs at the base (as if glued into a pop-up page) and crisp scissor-cut edges, layered in two or three depths. A thin continuous WHITE CARD BORDER surrounds the whole silhouette. Small details drawn in dark petrol-blue ink (#1E3E4C).` |
| **D** maquete de papelão | `Handmade cardboard diorama model for a joyful children's science animation (stop-motion look), seen in a gentle three-quarter top view (unless a side view is asked for below). Every object is built from corrugated cardboard with visible corrugated edges, painted with matte gouache in the palette below, with a few paper labels without text and small toothpick or bottle-cap details. A thin continuous WHITE BORDER surrounds the whole silhouette, like a sticker cut-out.` |
| **L** lousa & caderno (só adesivos) | `Hand-drawn marker doodle sticker for a joyful children's science animation: thick wobbly dark petrol-blue marker outline (#1E3E4C), flat colour fills with a few marker-stroke textures, playful and simple. A thick continuous WHITE STICKER BORDER surrounds the whole silhouette.` |
| **Q** quadrinhos | `Comic-book paper cut-out illustration for a joyful children's science animation: bold, slightly wobbly black-blue ink outlines (#1E3E4C), flat colours with halftone dot shading, dynamic friendly shapes, like a character cut out of a comic page. A thin continuous WHITE PAPER BORDER surrounds the whole silhouette.` |
| **N** caderno de campo | `Field-notebook sticker illustration for a joyful children's science animation: a soft pencil sketch with light watercolour wash on cream paper, like a naturalist's notebook drawing, delicate ink details in dark petrol-blue (#1E3E4C). A thin continuous WHITE PAPER BORDER surrounds the whole silhouette, like a cut-out sticker.` |
| **B** planta técnica | não precisa de imagem: as linhas técnicas são desenhadas em código e os objetos "ganham cor" com os recortes do estilo C |

## Personagens fixos — gerar uma vez, usar em todos os vídeos
Salvar em `entrada/imagens/personagens/`. Anexe as imagens de referência indicadas e peça **"keep the character
exactly on-model"**.

| arquivo | referência | prompt |
|---|---|---|
| `cientista_colagem` | `Metaninho.png` | [estilo C] + `Character pose sheet of the scientist character from the reference image, kept exactly on-model (round petrol-blue head with lime-green balls on orange sticks, big black glasses, green eyes, white CP2b t-shirt without any text, grey trousers, lime sneakers), rebuilt as paper-cut collage. Eight separate full-body poses spaced far apart: waving hello, pointing up-left, pointing up-right, thinking with hand on chin, holding a magnifying glass, holding a clipboard, jumping with joy, wearing a white lab coat and presenting with open arms. No text on the t-shirt.` |
| `cientista_hq` | `Metaninho.png` | [estilo Q] + a mesma folha de poses, no estilo quadrinhos |
| `mascote_croche` | foto do Metaninho de crochê | [estilo F] + `Pose sheet of the cute crochet methane mascot from the reference photo, kept exactly on-model: a round petrol-blue crocheted ball body, four lime-green crocheted balls on short orange crocheted sticks arranged as a tetrahedron (one on top like an antenna, three as legs), shiny black bead eyes, round soft rosy cheeks in a warm peach-coral tone (#E8A090, clearly NOT magenta), a small stitched smile; no glasses, no clothes, no arms. Six separate poses spaced far apart: standing, jumping, sitting tilted, waving with the top ball, sleeping with closed eyes, surprised with open mouth.` |
| `mascote_papel` | foto do Metaninho de crochê | [estilo C] + a mesma folha de poses do mascote, em papel recortado (para os vídeos C, D, P, N) |
| `arqueia_croche` | foto do Metaninho de crochê (família visual) | [estilo F] + `Pose sheet of a NEW cute crochet mascot, the partner of the crochet methane mascot in the reference photo and made in exactly the same amigurumi style and scale family: Arqueia, a friendly methane-making archaea microbe. Her body is an upright rounded capsule (a short pill / rod shape, a little taller than the round reference mascot) crocheted in warm yellow #F2C14E, with a subtle hexagon mosaic pattern embroidered in amber #D37402 thread all over it; from the top of her head a thin, springy, spiral curly ponytail made of coral #E4572E crochet chain, ending in a small lime-green #B6E03B bead; shiny black bead eyes (same size and style as the reference mascot), round soft peach-coral felt cheeks (#E8A090, clearly NOT magenta), a small stitched smile; no arms, no legs, no clothes, no glasses. Six separate poses spaced far apart: standing proudly, jumping with the ponytail flying, leaning to one side curious, puffing her cheeks angrily (saying no to oxygen), blowing three small lime-green bubbles, sitting tilted and tired but happy.` |
| `arqueia_personagem` | `Metaninho.png` (família visual) | [estilo C] + `Character pose sheet of a NEW cartoon character, the female partner of the scientist character in the reference image and drawn in the same friendly style and proportions: Arqueia, a hands-on bioprocess engineer who is a methane-making archaea microbe. Her head is an upright rounded yellow capsule (#F2C14E) with a subtle amber hexagon mosaic pattern, a springy coral spiral curly ponytail on top ending in a lime-green bead, big friendly amber-brown eyes, peach-coral cheeks (clearly NOT magenta), a confident smile; safety lab goggles pushed up on her forehead (no prescription glasses), a lime-green work jumpsuit with rolled-up sleeves and a blank badge (no text), a tool belt with a pipette and a small wrench, coral sneakers, cartoon arms and hands. Eight separate full-body poses spaced far apart: waving hello, thumbs up, turning a valve with the wrench, holding a pipette, arms crossed saying no (to oxygen), jumping to celebrate, pointing up-right, standing back to back with an invisible partner.` |
| `arqueia_papel` | a folha `arqueia_croche` aprovada | [estilo C] + `Pose sheet of the crochet archaea mascot from the reference image, kept exactly on-model (yellow capsule body with amber hexagon pattern, coral spiral curly ponytail with a lime-green bead, black bead eyes, peach-coral cheeks, no arms, no legs), rebuilt as paper-cut collage. Six separate poses spaced far apart: standing proudly, jumping, leaning curious, puffing cheeks angrily, blowing three lime-green bubbles, sitting tired but happy.` |
| `arqueia_expressoes` | a folha `arqueia_personagem` aprovada | [estilo C] + `Expression sheet of the archaea engineer character from the reference image, kept exactly on-model: eight separate head-and-shoulders close-ups spaced far apart — happy with bubbles, concentrated with tongue out, angry puffed cheeks, queasy with a slightly greenish tint on the cheeks, surprised, laughing, winking, proud with chin up.` |

> O mascote também pode ser **desenhado em código** (esfera + hastes + bolinhas, como o CH₄ com carinha do ep. 01):
> fica sempre no modelo e anima com mais liberdade. As folhas acima servem de referência e para os closes.

## 2. Regras técnicas (acrescente as que se aplicam ao item)

| situação | frase para acrescentar ao prompt |
|---|---|
| **folha com vários itens** | `Several separate objects spaced far apart from each other on the same magenta background, each with its own white sticker border, none touching or overlapping, arranged in a loose grid with wide magenta gaps.` |
| **olhinhos móveis** (personagens, bichos) | `IMPORTANT: no eyes and no glasses — leave two plain white oval areas where the eyes would be.` |
| **buraco** (tela, lente, janela, escotilha) | `IMPORTANT: the [screen/lens/window] area is perfectly flat pure magenta #FF00FF, exactly like the background, like a cut-out hole — no reflection, no gradient, nothing drawn inside.` |
| **objeto que vai girar ou cair** | `Centered, upright, compact silhouette.` |
| **cenário / fundo grande** | `Wide composition filling most of the image, still with a thin magenta margin all around.` |
| **consistência** | anexe `entrada/imagens/ep02/GERACAO_FINAL_MELHOR.jpg` (ou outra imagem da série) e diga: `Same paper-collage style, line work and colours as the reference image.` |

## 3. O que evitar (o recorte falha ou a imagem destoa)
- fundo rosa claro, degradê, textura de papel no fundo, chão ou sombra embaixo do objeto;
- objetos encostando uns nos outros numa folha (viram um só recorte);
- texto, números, marcas ou logotipos desenhados (não usamos logos de terceiros);
- magenta dentro do objeto quando não é um buraco (roupas, flores, frutas rosadas → use coral #E4572E);
- olhos desenhados quando o roteiro pede olhinhos móveis;
- estilo 3D, brilho plástico, fotografia, aquarela realista.

## 4. Tamanho e quantidade
- **Protagonista** (o objeto que aparece grande e perto da câmera): uma imagem só dele, na maior resolução.
- **Coadjuvantes** pequenos: folhas com 3–8 itens.
- Pessoas e bichos: meio corpo ou corpo inteiro conforme o roteiro; todos na mesma "família" visual dos eps. 01–02.

## 5. Conferência rápida antes de salvar
- [ ] fundo magenta puro de borda a borda
- [ ] borda branca contínua em volta de cada item
- [ ] nenhum item encostado em outro
- [ ] sem texto, sem sombra
- [ ] olhos em branco / buracos em magenta, quando pedido
- [ ] nome do arquivo igual ao do roteiro, na pasta `entrada/imagens/epNN/`

Depois é comigo: `python tools/preparar_ativos.py epNN <arquivo>` recorta, eu nomeio os itens e
`tools/meta_recortes.py` acha buracos e olhos.

## 6. Recortes que já existem (não precisa gerar de novo)
**Ep. 01:** vaca (cabeça e de pé), esterco, restos de comida (banana, maçã, ovos, cenoura, alface, laranja), cana
(feixe e planta), palha, milho, sol, nuvens, biodigestor (com escotilha vazada), máquina de purificação, fogão,
gerador, lâmpada, casas, fábrica, bomba de combustível, ônibus, caminhão, trator, mudas e plantas, laboratório.
**Ep. 02:** notebook (tela vazada), cursor, mão apontando, gestora, empresário, pesquisadora, livros, artigo,
pergaminho, lupa (lente vazada), alfinetes (4 cores), caminhão de lixo, saco de restos, vaca de corpo inteiro,
ramos, folha, nuvem.
