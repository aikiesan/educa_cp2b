# Roteiros — educa CP2B

Todos os vídeos seguem **o mesmo formato de ficha**, com **quatro partes sempre**. Isso garante reprodutibilidade
(qualquer pessoa refaz o vídeo a partir da ficha) e mantém o estilo da série.

| parte | o quê | quem usa | vira |
|---|---|---|---|
| **ficha técnica** | série, duração, formatos, idiomas, **estilo visual**, **twist**, papel do Metaninho, onde salvar cada arquivo | todos | — |
| **1. Roteiro do vídeo** | ideia · estilo & twist · storyboard fala a fala · assinatura CP2B · checagem de conteúdo | Claude (animação) | `videos/NN-slug/cena.js` |
| **2. Imagens — prompts** | tabela `arquivo` → prompt, no prompt-mestre do estilo | equipe (Nano Banana) | `entrada/imagens/epNN/*.png` |
| **3. Música — prompt** | bloco ` ```musica `: variação do twist + família sonora + assinatura "ta-da" | equipe (Lyria 3 Pro) | `entrada/musica/musica_epNN.mp3` |
| **4. Narração — prompt** | direção de voz (` ```direcao `) + texto (` ```narracao `, com a forma falada) + comando | equipe (Gemini TTS) | `entrada/narracao/<idioma>/epNN_<idioma>_<voz>_take1.wav` |

Modelo em branco: [`_MODELO.md`](_MODELO.md). Estilos, twists e assinatura CP2B: [`ESTILOS.md`](ESTILOS.md).
Personagens: [`personagens/METANINHO.md`](personagens/METANINHO.md) e [`personagens/ARQUEIA.md`](personagens/ARQUEIA.md).

## Arquivos prontos para colar (gerados a partir das fichas)
Depois de editar qualquer ficha, rode `python tools/prompts_producao.py`:

| arquivo | conteúdo |
|---|---|
| [`PROMPTS_PRONTOS.md`](PROMPTS_PRONTOS.md) | **cada imagem com o prompt completo** (estilo + objeto), nome e pasta — inclui os personagens fixos |
| [`PROMPTS_MUSICA.md`](PROMPTS_MUSICA.md) | o prompt de música de cada vídeo |
| [`NARRACAO_COMPLETA.md`](NARRACAO_COMPLETA.md) | o texto de narração de todos os vídeos, para leitura |
| [`PROMPT_IMAGENS.md`](PROMPT_IMAGENS.md) | regras do fundo rosa-magenta, prompts-mestre de cada estilo, personagens, checklist |

## Regras da série
- ~45–58 s + ~4 s de **assinatura CP2B** · 16:9 e 9:16 (Stories/Reels) · marca-d'água CP2B no canto;
- **nenhum número na narração**; números na tela só se conferidos; uma ideia por cena;
- **cada vídeo com estilo e twist diferentes do anterior** (ver o plano em [`ESTILOS.md`](ESTILOS.md));
- narradora **sempre feminina, animada** (padrão Laomedeia; `--testar-vozes` compara Zephyr, Autonoe, Leda, Aoede e a Sulafat);
- **Metaninho**: o **cientista de óculos** apresenta e explica; o **mascote de crochê** é o ajudante fofinho e está em toda assinatura;
- **Arqueia**: a parceira do Metaninho, a arqueia que fabrica o metano ("ela faz, ele brilha"); estreia no ep. 27;
- **sempre termina com o CP2B**: fala **LF** ("CP2B: energia viva, ciência que transforma!") + cartão do logo.

## Fluxo de produção de um vídeo
1. Ficha pronta e checada → a equipe gera **imagens** (parte 2), **música** (parte 3) e **narração** (parte 4) nas pastas indicadas.
2. Claude recorta as imagens, alinha a voz, monta a partitura na grade da trilha, anima a cena (parte 1), mixa e renderiza
   16:9 e 9:16, com e sem legenda (ver [`../docs/METODO.md`](../docs/METODO.md)).
3. QA (quadros, folhas de contato, gráfico da mixagem) → Release no GitHub.

## Catálogo

### Série A — Biogás básico
| ep | título | estilo | twist |
|---|---|---|---|
| 04 | [Vinhaça: o tesouro líquido da cana](04-vinhaca.md) | D papelão | mistério / detetive |
| 05 | [Do chiqueiro à tomada](05-suinos-aves.md) | F feltro | musical |
| 06 | [O lixo que dá gás](06-lixo-organico.md) | Q HQ | jornada da heroína |
| 07 | [Laranja inteira: nada se perde](07-citros-cafe.md) | C colagem | tempo real |
| 08 | [Biofertilizante: o que sobra também vale](08-biofertilizante.md) | N caderno de campo | mergulho no solo |
| 09 | [Biometano no tanque](09-biometano-veicular.md) | C colagem | rebobinar (VHS) |
| 10 | [Codigestão: a mistura certa](10-codigestao.md) | F feltro | programa de culinária |
| 11 | [Carbono que volta pro ciclo](11-carbono.md) | L lousa | ponto de vista do átomo |
| 12 | [Por dentro do biodigestor](12-biodigestor.md) | B planta técnica | raio-X / visita guiada |
| 13 | [Um dia na vida de um micróbio](13-microbio.md) | F crochê | vlog |
| 14 | [Mitos e verdades do biogás](14-mitos-verdades.md) | C colagem | programa de auditório |
| 27 | [Conheça a Arqueia: quem faz o metano](27-arqueia.md) | N caderno de campo | diário de descoberta |

### Série B — Além do biogás
| ep | título | estilo | twist |
|---|---|---|---|
| 15 | [Bioprodutos: muito além da energia](15-bioprodutos.md) | D papelão | comercial retrô |
| 16 | [Biorrefinaria: um resíduo, vários produtos](16-biorrefinaria.md) | B planta técnica | antes × depois |
| 17 | [Ecoparques](17-ecoparques.md) | D papelão | jogo de tabuleiro |
| 18 | [Biohitano: a aposta do CP2B](18-biohitano.md) | Q HQ | dupla de heróis |

### Série C — CP2B por dentro
| ep | título | estilo | twist |
|---|---|---|---|
| 03 | [O que é o CP2B](03-cp2b-institucional.md) (pt-BR + en-GB) | P pop-up | o livro do CP2B |
| 19 | [Quem faz o CP2B](19-quem-faz.md) | C colagem | foto de turma |
| 20 | [Os eixos do CP2B](20-eixos.md) | N caderno de campo | fichário com abas |
| 21 | [Living-Lab: comida que vira combustível](21-living-lab.md) | D papelão | corrida contra o relógio |
| 22 | [A usina de biogás na cooperativa](22-unidade-demonstrativa.md) | C colagem | antes × depois |
| 23 | [Da bancada à planta piloto](23-laboratorios.md) | B → D | subir de fase (videogame) |
| 24 | [Ciência, coisa de menina](24-ciencia-menina.md) | Q HQ | super-heroínas |
| 25 | [Aprender biogás: cursos e escolas](25-educacao.md) | L lousa | aula relâmpago |
| 26 | [Metaninho: de molécula a mascote](26-metaninho.md) | F + C | história de origem |

Próximo passo da série C (com o resumo da equipe): **um vídeo por eixo** (Eixo 1 a Eixo 8), cada um com seu estilo e twist.

### Derivados
| id | o quê |
|---|---|
| [90](90-derivados.md) | ep. 01 em inglês · vinheta da série (5 s) · pílulas de 15 s dos eps. 01–02 |
| [91](91-pilar-2b-en.md) | ep. 02 em inglês |

### Ordem de publicação sugerida (alternando séries e estilos)
26 Metaninho (abre a temporada) → 27 Arqueia → 03 CP2B → 04 Vinhaça → 05 Chiqueiro → 19 Quem faz → 06 Lixo → 15 Bioprodutos →
07 Laranja → 21 Living-Lab → 08 Biofertilizante → 12 Biodigestor → 24 Ciência, coisa de menina → 10 Codigestão →
18 Biohitano → 09 Biometano → 20 Eixos → 11 Carbono → 22 Cooperativa → 13 Micróbio → 16 Biorrefinaria → 17 Ecoparques →
25 Educação → 23 Laboratórios → 14 Mitos e verdades (fecha a temporada com o quiz).
Nessa ordem, dois vídeos seguidos nunca repetem o mesmo estilo.
