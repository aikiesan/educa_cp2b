# Episódio genérico (cena.json)

Os episódios 03 em diante usam um motor dirigido por dados: **`lib/colagem/episodio.js`** (quadros, câmera, layout,
cartão final, marca-d'água) + **`lib/colagem/efeitos.js`** (efeitos desenhados em código e molduras de formato).
Cada episódio é só um arquivo **`videos/NN-slug/cena.json`**: para cada fala, que peças entram, onde e quando.
O mesmo arquivo gera os dois formatos (16:9 e 9:16) — o layout é por **arranjo**, não por coordenada.

## Fluxo

```bash
python tools/episodio/produzir.py 04 --etapas roteiro,alinhar,partitura   # voz + trilha → timeline.json
# escreva videos/04-vinhaca/cena.json
python tools/episodio/produzir.py 04 --etapas legendas,pagina,quadros     # quadros de revisão
#   → tmp/quadros/ep04_h.jpg e ep04_v.jpg (um quadro a ~72% de cada fala + o cartão final)
#   --frac 0.97 fotografa o fim de cada fala (tudo o que entra tarde já está na tela)
python tools/episodio/produzir.py 04 --etapas sfx,mix,render              # dist/ep04/<slug>_16x9.mp4 e _9x16.mp4
python tools/episodio/produzir.py 03 --idioma en-GB                        # versão em inglês (textos com {"pt-BR":…, "en-GB":…})
```
Recortes das folhas: `python tools/preparar_ativos.py epNN` → `assets/recortes/epNN/_folha/<folha>_<n>.png`
(ordem: linhas de cima para baixo, esquerda → direita; folha de uma peça só vira `<folha>.png`).

## Estrutura

```jsonc
{
  "estilo": "D",                 // C colagem · D papelão · F feltro · Q quadrinhos · N caderno de campo · L lousa · P livro pop-up · B planta técnica
  "seed": 4,
  "mascote": "papel",            // opcional: "papel" troca o mascote de crochê pela versão em papel nas cenas (a assinatura é sempre crochê)
  "percurso": "direita",         // como os quadros se sucedem: direita (padrão) · esquerda · desce · sobe · zigue · quadros (página de HQ)
  "pecas": { "cana": "ep04/_folha/pecas_ep04_6", "usina": "ep04/_folha/usina_etanol" },   // apelido → recorte
  "molduras": [ { "tipo": "vhs", "de": "L01:inicio", "ate": "L01:fim" } ],                  // opcional
  "assinatura": { "cientista": true, "texto": "Processo FAPESP 2024/01112-1" },           // opcional; "parceiro": "arqueia:feliz" põe outro personagem no lugar do cientista
  "cenas": [ { "fala": "L01", "arranjo": "palco", "itens": [ … ] }, … ]
}
```
- Uma **cena** = um quadro de papel. `"fala": "L03"` ou `"falas": ["L03", "L04"]` (um quadro para duas falas).
  Falas sem cena continuam no quadro anterior. A fala **LF** não precisa de cena: é o **cartão final** automático
  (logo CP2B no golpe final da trilha, slogan, `cp2b.unicamp.br`, Metaninho de crochê pulando e dando tchau;
  com `"assinatura": {"cientista": true}` o cientista aparece do outro lado).
- A câmera passa de quadro em quadro no início de cada cena (≈0,6 s, com desfoque de movimento) e aproxima 3,5% durante a cena.

### Campos da cena
| campo | efeito |
|---|---|
| `arranjo` | `palco` (1ª peça grande no centro, as outras nas laterais — no 9:16, em cima e embaixo) · `fila` (em linha; no 9:16 em coluna, 3 peças = 1 em cima + 2 embaixo) · `dupla` · `grade` · omitido = automático |
| `colunas` | número de colunas da `grade` (no 9:16 no máximo 2) |
| `arranjoV`, `colunasV` | arranjo / colunas só no 9:16 (o 16:9 usa `arranjo` / `colunas`) |
| `batida` | padrão da cena para os itens (ver `batida` nos itens) |
| `zoom`, `foco` | zoom da câmera no quadro (1 = quadro inteiro) e deslocamento `[u, v]` em frações do quadro |
| `cam` | lista de movimentos: `{ "em": "micróbios", "alvo": "lente", "z": 1.6, "d": 0.7 }` (aproxima numa peça) ou `{ "em": …, "foco": [u, v], "z": 1 }` |
| `recua` | `true` ou `"palavra"`: a câmera recua para mostrar todos os quadros (bom com `"percurso": "quadros"`) |
| `transicao` | `"corta"` = corte seco em vez de passar · `pan` = duração da passagem (s) · `empurra` = aproximação durante a cena (0.035) |
| `folha` | cor do papel deste quadro (nome da paleta ou #hex) |
| `revela` | (estilo B) palavra em que a planta técnica "ganha cor": antes disso as peças aparecem como desenho azul |

### Itens
Cada item é uma **peça** (`"p"`), um **texto** (`"txt"`) ou um **efeito** (`"fx"`).

| campo | efeito |
|---|---|
| `p` | apelido da peça (em `pecas`), nome da biblioteca comum, personagem `"cientista:lupa"` (ver abaixo) ou `"marca"` (o logo do CP2B) |
| `id` | nome para referir o item (`sobre`, `de`, `para`, `alvo`, `ciclo`); sem `id`, vale o próprio `p` |
| `lugar` | tira o item do arranjo e o põe numa faixa: `titulo` (faixa de cima) · `rodape` · `narrador` (personagem na lateral direita / embaixo no 9:16) · `centro` · `topo` · `base` · `esquerda` · `direita` · `canto` (sup. esq.) · `canto_dir` · `tudo` |
| `sobre`, `rel`, `tam` | posiciona em relação a outra peça: `rel` = [x, y] em frações do tamanho dela (0,0 = centro; −0.5 = borda), `tam` = tamanho relativo (0.45 peça / 0.38 texto) |
| `pos`, `caixa` (`posV`, `caixaV`) | posição livre em frações do quadro [−0.5…0.5] e tamanho da caixa (16:9; os `V` são do 9:16) |
| `em` | quando entra: `"palavra"` (1ª ocorrência na fala), `"palavra#2"`, `"L05:palavra"`, `"palavra+0.3"`, `"inicio"`, `"fim-0.5"` ou um número (s desde o início do quadro). Sem `em`, entra no início, em cascata. Em episódio com duas línguas, use a palavra de cada uma: `{"pt-BR": "campo", "en-GB": "farms"}` (vale para `sai`, `brilha`, `muda`…) |
| `entra` | `pop` (padrão) · `cai` · `sobe` (dobra de livro pop-up) · `cresce` (planta: cresce do chão) · `desliza_esq` / `desliza_dir` · `voa` · `gira` · `carimbo` · `aparece` · `abre` · `nenhum`; `dur` muda a duração |
| `anima` | depois de entrar: `balanca` · `flutua` · `quica` (no tempo da música) · `pulsa` · `treme` · `gira` (`vel`) · `acena`. Personagens respiram sozinhos |
| `batida` | `true`: a entrada (depois de `em`) cai na batida da trilha mais próxima · `"forte"`: no 1º tempo do compasso (se houver um perto; senão, na batida). Vale também dentro de `muda` |
| `poses` | personagens: `[{ "em": "palavra", "p": "surpreso" }]` troca a pose na palavra (a nova cabe na caixa da primeira) — o Metaninho reagindo em cada quadro |
| `rosto` | carinha de HQ desenhada sobre a peça: `{ "pos": [u, v], "tam": 0.3, "humor": "feliz", "olhar": [x, y], "trocas": [{ "em": "palavra", "humor": "medo" }] }` · humores: feliz · alegre · piscando · medo · surpresa · decidida · brava · enjoada · triste |
| `capa` | capa de heroína esvoaçando atrás da peça: `{ "em": "palavra", "cor": "coral", "pos": [u, v], "larg": 0.5, "comp": 0.7 }` |
| `sai` | `"palavra"` ou `{ "em": "palavra", "como": "voa" }`: some antes do fim do quadro |
| `muda` | `[ { "em": "palavra", "s": 0.5, "dx": 0.1, "dy": 0, "rot": 0.2, "alpha": 1, "d": 0.6, "som": "papel_desliza" } ]` — transforma a peça (encolher, andar, girar); `dx`/`dy` em larguras/alturas da caixa da peça. `"para": "id"` (com `rel` opcional) leva a peça até outro item do quadro, na mesma posição relativa do seu `sobre` — funciona igual nos dois formatos; `"arco": 0.9` faz o trajeto em salto (altura em caixas) |
| `brilha` | `"palavra"`: acende um halo atrás da peça (lâmpada, casa) com som de lâmpada |
| `s`, `dx`, `dy`, `rot`, `flip`, `chao`, `fundo`, `z`, `alpha` | escala extra, deslocamento na caixa (frações), rotação, espelhar, alinhar embaixo, desenhar atrás, ordem, opacidade |
| `som`, `ganho`, `mudo` | troca / ajusta / silencia o efeito sonoro automático |

**Textos** (`"txt"`, pode ser `{"pt-BR": "…", "en-GB": "…"}`), com `"tipo"`:
`letras` (recortadas de revista, padrão — títulos e palavras-chave) · `carimbo` (`cor`) · `mao` (escrita à mão progressiva) ·
`giz` · `etiqueta` (papel com fita; `papel`, `fita`) · `formula` (`"CH4"` vira CH₄) · `balao` (fala; `cauda: [x, y]`) · `pow` (onomatopeia de HQ).
`cor`, `max` (tamanho máx.), `fonte`, `contorno: false`, `papeis` (cores das letras recortadas). Textos curtos!

**Efeitos** (`"fx"`), todos desenhados em código:
| fx | parâmetros |
|---|---|
| `bolhas` | `n`, `vel`, `r`, `tinta` — bolhas subindo na caixa |
| `chama` | chama azul (`azul: false` = amarela); a base fica embaixo da caixa |
| `molecula` | `tipo`: CH4 · CO2 · H2S · O2; `n`, `humor`: feliz · nojo; `sobe: true` (flutuam para cima); `rosto: false` |
| `microbio` | `n`, `humor`: feliz · comendo · enjoado · fome; `tipo`: bastao; `cores`, `chapeu` |
| `seta` / `tracejado` | `de` → `para` (ids); `curva`, `w`, `cor` |
| `ciclo` | `itens`: [ids em ordem] → setas fechando o ciclo (sem itens: anel de setas); `passo` |
| `cano` | `de` → `para`, com gás correndo (`fluxoCor`); `baixo` = quanto o cano desce antes de virar |
| `brilho` · `confete` · `estrela` (`n`) · `coracao` · `check` · `xis` | destaques |
| `cheiro` (`de` = peça que fede) · `mosca` · `fumaca` · `gotas` (`de`, `saida: [x, y]`, `n`, `cor`) | sujeira e cheiro |
| `relogio` (`rapido`) · `termometro` (`nivel`) · `grafico` (`alturas`) · `engrenagem` · `cadeado` · `raios` · `ondas` · `notas` · `estrada` | objetos |
| `lente` | lupa com micróbios dentro (`n`, `humor`, `bolhas: true`, `fundo`) que entra deslizando |

**Molduras** (sobre a tela inteira, entre `de` e `ate`): `vhs` (◄◄ REW, `texto`), `vlog` (● REC), `tv` (`cor`, `cor2` = cores da moldura), `palco` (holofotes e plateia),
`game` (corações + barra de fase), `relogio` (relógio no canto), `cronometro`.

### Estilo P — o livro
Cada fala é uma página dupla do mesmo livro; a folha vira (em uma batida da trilha) em vez de a câmera passar de quadro.
No 16:9 o livro abre na horizontal (páginas esquerda | direita); no 9:16 a lombada fica no meio e a folha vira para cima.
- Cada item mora numa página: `"pagina": 1` (esquerda / de cima) ou `2` (direita / de baixo, padrão); quem está `sobre` outra
  peça herda a página dela. O arranjo e os lugares (`titulo`, `rodape`, `narrador`…) valem dentro da página;
  `"paginas": [{ "arranjo": "dupla" }, { "arranjo": "grade", "colunas": 2 }]` escolhe o arranjo de cada uma. Nada atravessa a dobra.
- `"capa": { "titulo": {"pt-BR": …, "en-GB": …} }`: o livro começa fechado (capa azul-petróleo com o logo) e abre no tempo forte antes da 1ª fala.
  O verso da capa é a página 1 da primeira cena.
- A sombra da dobra passa por cima das peças (ficam "impressas" no papel); entradas e tremido mais suaves; som de página (`pagina`).

### Estilo F — a colcha de retalhos (`"colcha": true` ou `{ "enfeites": [...] }`)
Como a maquete: todas as cenas encostadas numa superfície só, em cobrinha, com as passagens no tempo da música — mas cada
fala é um **retalho de feltro** costurado aos vizinhos (forro azul-petróleo nas emendas, botões nos cruzamentos, viés coral
com pesponto em volta). Na passagem, uma **agulha costura uma linha de lã coral** de um retalho ao outro (som `costura`);
`"recua"` na última cena mostra a colcha inteira. Retalhos sem cena (a grade é quadrada) recebem os `enfeites`:
`{ "p": "alfineteira", "retalho": 0, "pos": [u, v], "h": 300, "rot": 0.1, "posV": […], "hV": … }` (apelidos de `pecas`).
Textura `felt` (penugem curta) em `paper.js`. Exemplo: ep. 05.

### Estilo C — a mesa (`"mesa": true`)
Como a maquete, mas sobre uma toalha xadrez de café da manhã; a trilha entre as áreas é de grãos de café. Exemplo: ep. 07.

### Superfícies contínuas — posição das áreas
Nos modos maquete / colcha / mesa / caderno / estrada as áreas ficam encostadas em cobrinha. Uma cena pode fixar a sua
área com `"celula": [coluna, fileira]` (pode ser negativa: acima da primeira) ou reusar a área de outra com
`"lugar_de": "L06"` (as peças das duas cenas convivem: faça as da primeira saírem com `sai`). `"pan": 1.3` alonga a passagem.

### Estilo N — caderno em mergulho (`"caderno": { "solo": 4.55 }`)
Uma página comprida de caderno (uma coluna de áreas, a câmera desce). Acima de `solo` (linha do chão, em fileiras:
4.55 = 55% da 5ª fileira) é papel pautado; abaixo, camadas de solo de papel cada vez mais escuras, com pedrinhas e grama
na linha do chão. Entre as áreas, um lápis risca a trilha (descendo pela margem direita; subindo, pela esquerda). Exemplo: ep. 08.

### Estilo C — a estrada (`"estrada": { "viajante": {...} }`)
Uma paisagem de papel com uma estrada que passa por todas as áreas (na faixa de baixo de cada uma). O viajante anda pela
estrada junto com a câmera: `"viajante": { "p": "caminhao", "vira": true, "h": 150, "carona": "mascote:acena", "caronaRel": [0.1, -0.62], "caronaTam": 0.95 }`
(`vira: true` porque o caminhão da biblioteca olha para a esquerda). Cada cena diz onde ele para: `"parada": -0.33`
(fração da largura; padrão −0.33). Cena com `"rebobina": true`: ele volta de ré (som de chiado). Deixe a faixa de baixo
(estrada) e o lugar da parada livres de peças. Exemplo: ep. 09.

### Estilo F — estúdio de TV (`"estudio": true`)
Cada quadro é o cenário de um programa de culinária: parede de azulejos de feltro e bancada de madeira embaixo (peças
com `chao` ficam em cima da bancada). Combine com `"transicao": "corta"` (cortes secos, na batida, com clique) e a
moldura `tv`. Exemplo: ep. 10.

### Outros
- `"transicao": "corta"` no nível do episódio vale para todas as cenas; `"naBatida": true` põe as passagens na batida.
- Item `"segue": true` (com `sobre`): acompanha o movimento da peça de baixo (chapéu de chef na cabeça do personagem).
- Efeito `raizes` (`n`, `dur`, `cor`, `w`): raízes desenhadas à mão crescendo para baixo a partir do topo da caixa.

### Peças desenhadas em código
`"p": "@laranja"`, `"@meia_laranja"`, `"@gomo"`, `"@cafe"`, `"@bola_n"`, `"@bola_p"`, `"@bola_k"` (nutrientes N·P·K), `"@broto"` — recortes gerados em alta resolução (com borda de adesivo) quando a
biblioteca não tem a peça; aceitam `rosto`, `capa`, `muda`… como qualquer peça.

### Personagens (`"p": "<personagem>:<pose>"`)
| personagem | poses |
|---|---|
| `cientista` (no estilo Q vira a versão HQ) | acena · aponta_esq · aponta · pensa · lupa · prancheta · pula · jaleco / apresenta |
| `mascote` (crochê; `"mascote": "papel"` usa o de papel) | em_pe · pula · senta · acena · dorme · surpreso |
| `arqueia` (crochê) | em_pe · feliz · brava · alta · bolha · deitada · pula · sopra · cansada · curiosa |
| `arqueia_papel` | em_pe · deitada · brava · sopra · bolha · emburrada · cansada |
| `arqueia_eng` (engenheira) | acena · joinha · valvula · pipeta · ferramenta · nao · comemora · aponta · costas |
| `arqueia_rosto` (close) | feliz · concentrada · brava · enjoada · surpresa · rindo · piscando · orgulhosa |

### Biblioteca comum (sem declarar em `pecas`)
`biodigestor` · `bomba` (combustível) · `broto` · `caminhao` · `caminhao_lixo` · `cana_feixe` · `cana_planta` · `casa_creme` · `casa_verde` ·
`cenoura` · `esterco` · `fabrica` · `fogao` · `gerador` · `lampada` · `laranja` (casca) · `maca` · `maquina` (purificação) · `milho_espiga` ·
`milho_planta` · `muda` · `onibus` · `ovos` · `palha` · `sol_nuvens` · `sol` · `tomateiro` · `trator` · `vaca` · `vaca_deitada` · `alface` · `banana` ·
`artigo` · `cursor` · `empresario` · `gestora` · `pesquisadora` · `folha` · `livros` · `lupa` · `mao` (dedo apontando) · `notebook` · `nuvem` ·
`pergaminho` · `pino_ambar` · `pino_coral` · `pino_lima` · `pino_petrol` · `ramo` · `ramo2` · `saco_restos`.

## Dicas
- **Uma ideia por quadro** e poucas peças (2–5). O arranjo `palco` funciona bem para a peça principal + apoio.
- Setas, canos, ciclos e tracejados não ocupam lugar no arranjo; aponte-os com `de`/`para`.
- Palavras no fim da fala entram tarde — o quadro seguinte chega logo depois. Prefira palavras do meio.
- Textos na tela são **curtos** (1–3 palavras) e seguem a grafia da legenda (CP2B, CH₄); nada de números que a narração não diz.
- Revise sempre os quadros de revisão nos **dois formatos** antes de renderizar.
- Automático: no 9:16, quadros cobertos por uma moldura com HUD no canto (`game`, `cronometro`, `relogio`, `vhs`, `vlog`) descem o conteúdo
  para não esbarrar nela; no 16:9, o `rodape` termina onde começa a coluna do `narrador`.
- Efeitos (`fx`) saem com `sai` ou `ate`. Em balões, quebre a linha (`"Como
funciona?"`): o texto fica bem maior.
- Rótulos em volta de um efeito (`molecula` etc.) ficam melhores em `topo`/`base` do que com `sobre`: a caixa do efeito é o quadro inteiro.
