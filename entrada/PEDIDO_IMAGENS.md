# Pedido de imagens — Nano Banana 2 (Gemini)

Salve cada imagem em `entrada/imagens/` com o nome indicado (PNG ou JPG, idealmente 2048 px).
O pipeline recorta automaticamente o fundo magenta (`tools/recortar.py`), separa os itens de
"folhas" com vários objetos e aplica as sombras/animação na colagem.

**Dica de consistência:** gere primeiro a `vaca`; depois anexe-a como imagem de referência de estilo
nas demais ("same paper-collage style as the reference").

## Estilo-mestre (cole no início de TODOS os prompts)

> Handmade paper-cut collage illustration for a whimsical children's science animation. The object is cut
> out of textured construction paper with visible paper fibers, slightly irregular scissor-cut and torn edges,
> layered paper pieces, and a thin white paper border around the entire silhouette like a sticker. Small details
> drawn with a dark petrol-blue ink pen (#1E3E4C). Limited palette: petrol blue #1E3E4C, dark green #00573A,
> green #5CA032, lime #B6E03B, amber #D37402, cream #F3EAD8, warm yellow #F2C14E, sky blue #8EC5D6,
> coral #E4572E, brown #8B5A3C. Flat front/side orthographic view, centered, whole object visible with generous
> margin. Isolated on a perfectly flat pure magenta (#FF00FF) background. No shadows, no text, no letters, no logos.

## Itens (em ordem de prioridade)

| arquivo | prompt (após o estilo-mestre) |
|---|---|
| `vaca` | A friendly cartoon dairy cow, head and shoulders only, facing right, white paper with dark petrol-blue patches, pink muzzle with two nostrils, small cream horns, floppy ears. IMPORTANT: no eyes — leave two plain white oval areas where the eyes would be. |
| `biodigestor` | A farm biodigester, side view: a wide cylindrical tank with a big lime-green inflated dome roof, a feeding hopper on the left side, a gas pipe with a valve on top of the dome, rivets, a small ladder. In the middle of the tank a large round porthole window whose glass area is completely pure magenta (#FF00FF), like a hole. |
| `maquina` | A whimsical biogas purification machine: a cheerful contraption of amber and copper paper with round pressure gauges, gears, pipes and valves, a big funnel inlet on the upper left, a shiny outlet pipe on the right, a small chute at the bottom. |
| `restos` | Six separate food scraps spaced far apart from each other: an open banana peel, an apple core, two cracked eggshell halves, a carrot top with leaves, a wilted lettuce leaf, an orange peel spiral. |
| `lavoura_residuos` | Separate items spaced far apart: a bundle of three sugarcane stalks with long leaves, a small pile of dry straw, a corn husk. |
| `caminhao` | A cargo truck, side view facing right, with a large blank cream side panel (no text). |
| `onibus` | A city bus, side view facing right, blank sides (no text). |
| `trator` | A farm tractor pulling a round tank trailer, side view facing right (no text). |
| `cidade` | Separate buildings spaced apart: three small colorful houses with pitched roofs and windows, and a small factory with a sawtooth roof and a chimney. |
| `energia` | Three separate objects spaced far apart: a gas stove burner with a cooking pot on it (no flame), an old-fashioned light bulb (unlit), a small engine-generator with a pipe inlet. |
| `plantas` | Separate plants spaced apart: a tiny seedling with two leaves, a young sugarcane plant, a corn plant with a cob, a lettuce head, a small tomato plant. |
| `bomba` | A gas station fuel pump with a hose and nozzle, blank front (no text). |
| `esterco` | A small cute pile of cow manure made of brown paper swirls, with a tiny fly doodle. |
| `ceu` | Separate pieces: a round sun with separate ray pieces, three fluffy clouds. |
