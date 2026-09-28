# Estilos e twists — educa CP2B

Para a série não ficar repetitiva, **cada vídeo combina um estilo visual com um twist de formato**. O que fica
igual em todos, para dar a cara da série:
- mundo de **materiais feitos à mão** (papel, feltro, papelão, giz…), sempre na **paleta CP2B**;
- uma narradora (voz feminina, animada), **nenhum número na narração**, uma ideia por cena;
- o **Metaninho**: o **cientista de óculos** (personagem que apresenta e explica) e/ou o **mascote fofinho de crochê**
  (a molécula de metano: esfera azul-petróleo, bolinhas verde-limão em hastes laranja, olhinhos pretos, bochechas rosa);
- a **Arqueia**, parceira do Metaninho: a arqueia metanogênica que fabrica o metano (cápsula amarela com mosaico
  hexagonal, rabinho espiral coral) — também em dois visuais, crochê e personagem; fichas em `personagens/`;
- **assinatura CP2B** no fim de todos (abaixo).

## Assinatura CP2B (fim de todos os vídeos, ~4 s)
1. Na batida final da trilha, a cena "congela" e vira um cartão de papel branco limpo com o **logo CP2B**
   (sem rotação, sombra, textura ou contorno sobre o logo) e o slogan **"Energia viva, ciência que transforma."**
2. O **Metaninho de crochê** pula para o lado do cartão (nunca por cima do logo) e dá tchau; em episódios do cientista,
   os dois aparecem juntos.
3. Linha pequena: `cp2b.unicamp.br` (e "Processo FAPESP 2024/01112-1" no institucional).
4. A narradora fecha sempre com a mesma frase curta — a vinheta sonora da série:
   **"CP2B: energia viva, ciência que transforma!"** (fala: *"Cê-pê-dois-bê…"*). Em en-GB: *"CP2B: living energy,
   science that transforms!"*
5. No resto do filme, o logo CP2B fica no canto (marca-d'água) e sai antes do cartão.

## Os estilos visuais

| código | estilo | como fica | o que muda no código | imagens (IA) |
|---|---|---|---|---|
| **C** | Colagem de papel | o dos eps. 01–02: recortes, fita crepe, carimbos, letras recortadas, traço que ferve | motor atual | prompt-mestre **C** |
| **F** | Feltro & crochê | tudo macio: feltro com ponto caseado, crochê, lã, botões — a casa do Metaninho fofinho | textura de feltro/lã procedural; movimento "fofo" (squash & stretch) | prompt-mestre **F** |
| **P** | Livro pop-up | cada ideia é uma página que se abre e os cenários sobem dobrando; abas de puxar | dobra 3D falsa (escala + sombra na dobra), virar página | prompt-mestre **P** |
| **D** | Maquete de papelão | diorama de papelão ondulado pintado, visto de cima em ¾, peças de miniatura | textura de papelão; câmera isométrica | prompt-mestre **D** |
| **L** | Lousa & caderno | desenho animado a giz/caneta que se desenha na hora, setas, rabiscos, adesivos | traço de giz e revelação de traço (já existe o traço à mão) | quase tudo em código; adesivos com prompt **L** |
| **B** | Planta técnica | blueprint azul com linhas brancas que "ganha vida" e se colore de papel | grade + traço técnico; transição para colagem | em código |
| **Q** | Quadrinhos (HQ) | quadros, balões, onomatopeias (POW, BLUB), retícula; a câmera pula de quadro em quadro | layout de painéis, balões, retícula | prompt-mestre **Q** |
| **N** | Caderno de campo | páginas de kraft com anotações, folhas prensadas, fita washi, aquarela leve | página como cenário; anotações escritas à mão | prompt-mestre **N** |

## Os twists de formato
mistério/detetive · musical (ritmo das onomatopeias no compasso) · jornada do herói · tempo real (relógio) ·
mergulho (câmera desce/entra) · rebobinar (fita VHS) · programa de culinária · ponto de vista de um átomo ·
visita guiada / raio-X · vlog "um dia na vida" · programa de auditório (quiz) · comercial retrô · antes × depois
(tela dividida) · jogo de tabuleiro · subir de fase (videogame) · dupla de heróis · foto de turma · aula relâmpago ·
história de origem.

## Plano da série

| ep | título | estilo | twist | Metaninho |
|---|---|---|---|---|
| 03 | O que é o CP2B (pt-BR + en-GB) | **P** pop-up | o "livro do CP2B": cada página é uma ideia | cientista abre o livro; mascote na assinatura |
| 04 | Vinhaça | **D** papelão | **mistério**: o cientista investiga o "segredo líquido" da cana com a lupa | cientista detetive |
| 05 | Do chiqueiro à tomada | **F** feltro | **musical**: oinc/có/plop no compasso da trilha | mascote |
| 06 | O lixo que dá gás | **Q** HQ | **jornada da casca de banana** (a heroína que não quer ir pro aterro) | mascote em ponta |
| 07 | Laranja inteira | **C** colagem | **tempo real**: um café da manhã em 50 s, relógio no canto, a fruta "explode" em peças | mascote |
| 08 | Biofertilizante | **N** caderno de campo | **mergulho** no solo, a câmera desce página abaixo | cientista anota |
| 09 | Biometano no tanque | **C** colagem | **rebobinar** (VHS) do posto de volta ao biodigestor | mascote de carona |
| 10 | Codigestão | **F** feltro | **programa de culinária** (comidinhas de feltro) | cientista de chef |
| 11 | Carbono que volta pro ciclo | **L** lousa | **ponto de vista do átomo de carbono** (a câmera segue ele) | cientista na lousa |
| 12 | Por dentro do biodigestor | **B** planta técnica | **raio-X / visita guiada**: a planta ganha cor e vida | cientista guia |
| 13 | Um dia na vida de um micróbio | **F** crochê | **vlog** da **Arqueia** de crochê | mascote visita |
| 14 | Mitos e verdades | **C** colagem | **programa de auditório** (luzes, plateia de papel, carimbos) | cientista apresentador |
| 15 | Bioprodutos | **D** papelão | **comercial retrô** "compre já!" (sem vender nada: é uma vitrine) | mascote garoto-propaganda |
| 16 | Biorrefinaria | **B** planta técnica | **antes × depois**: refinaria cinza vira biorrefinaria verde | cientista |
| 17 | Ecoparques | **D** papelão | **jogo de tabuleiro** (dado, peões, cartas) | mascote é o peão |
| 18 | Biohitano | **Q** HQ | **dupla de heróis**: Hidro & Metaninho se unem | cientista narra; Arqueia faz o metano |
| 19 | Quem faz o CP2B | **C** colagem | **foto de turma** que se monta | os dois na foto |
| 20 | Os eixos do CP2B | **N** caderno de campo | **fichário com abas**, uma página por eixo | cientista |
| 21 | Living-Lab | **D** papelão | **corrida contra o relógio**: da bandeja do restaurante ao ônibus | mascote de passageiro |
| 22 | A usina na cooperativa | **C** colagem | **antes × depois** (diesel × biometano), tela dividida | cientista |
| 23 | Da bancada à planta piloto | **B → D** | **subir de fase** (videogame): da bancada ao piloto | mascote é o jogador |
| 24 | Ciência, coisa de menina | **Q** HQ | **super-heroínas da ciência** | cientista de coadjuvante |
| 25 | Aprender biogás | **L** lousa | **aula relâmpago** | cientista professor |
| 26 | Metaninho | **F** + **C** | **história de origem**: do crochê ao cientista | os dois (gancho para a Arqueia) |
| 27 | Conheça a Arqueia | **N** caderno de campo | **diário de descoberta** + carta colecionável | cientista descobre; Arqueia estreia |

Cada roteiro traz o bloco **"Estilo & twist"** com o que muda na cena, e as imagens pedem o prompt-mestre do estilo
indicado ([`PROMPT_IMAGENS.md`](PROMPT_IMAGENS.md)).
