# Método educa CP2B — como produzir um episódio

Guia de produção das animações em colagem de papel do CP2B, registrado a partir dos episódios
[01 · O que é biogás?](../videos/01-o-que-e-biogas/) e [02 · PILAR-2b](../videos/02-pilar-2b/).
Use o **ep. 02 como modelo**: ele já tem layout por formato (16:9 e 9:16), marca-d'água, forma falada
separada da legenda e partitura com o logo no golpe final da trilha.

**Divisão do trabalho:** a equipe CP2B gera **imagens (Nano Banana / Gemini), voz (Gemini TTS) e música (Lyria)**
a partir de prompts prontos; todo o resto — mapa, animação, efeitos sonoros, mixagem, render — é código deste
repositório. Não usamos modelos locais de TTS ou de imagem na versão final.

---

## 1. Visão geral

```
roteiro.md / roteiro.json ──► pedidos (imagens · voz · música) ──► entrada/
        │                                                           │
        │        tools/preparar_ativos + nomear + meta_recortes ◄───┤ imagens
        │        tools/audio/transcrever + alinhar_vo          ◄────┤ voz
        │        tools/audio/analisar_musica                    ◄───┘ música
        ▼
partitura.json ─► montar_timeline ─► timeline.json ─► legendas (.vtt/.srt)
                                         │
                            cena.js (função pura do tempo, deixas por palavra)
                                         │
      render --sfx-out ─► sfx_cues.json ─► mixar ─► mix.wav ─► grafico_mix (QA)
                                         │
      render --stills / --sheet / --video --keep ─► codificar.sh ─► dist/ ─► GitHub Release
```

- **Determinismo:** `cena.js` desenha o quadro a partir de `t` e nada mais. O mesmo instante gera sempre o
  mesmo quadro; por isso o render pode ter vários workers e ser refeito a qualquer momento.
- **Deixas por palavra:** tudo que acontece na tela ou no som é ancorado numa palavra da narração
  (`at('L06', 'cidade')`). Trocar a voz e rodar o pipeline de novo re-sincroniza o filme inteiro.
- **Grade musical:** as falas entram a partir do 1º tempo forte e o cartão do logo cai no golpe final da trilha.

## 2. Estrutura do repositório

| pasta | conteúdo |
|---|---|
| `lib/colagem/` | motor em canvas 2D: papel procedural (`paper.js`), recortes e bordas rasgadas (`shapes.js`), traço à mão com *boil* (`ink.js`), peças/fita/olhinhos (`sprite.js`), letras recortadas e carimbos (`text.js`), micróbios, moléculas, lupa, confete, imagens, **marca-d'água** (`extras.js`), câmera + pós-processamento + camada `hud` (`stage.js`) |
| `videos/NN-slug/` | um episódio: `roteiro.md` (storyboard e checagem), `roteiro.json`, `partitura.json`, `timeline.json`, `cena.js`, `index.html`, legendas, `audio/` (alinhamento, deixas de efeitos, `mix.m4a`), `dados/` |
| `assets/recortes/` | recortes PNG (ep. 01 na raiz e `v3/`; episódios novos em `epNN/` + `meta.json`) |
| `assets/fonts/` | fontes livres (OFL/Apache); `licenciadas/` (Neulis) é **gitignored** |
| `entrada/` | material gerado pela equipe (imagens, WAVs, MP3) — **não vai para o git**; só os pedidos e os scripts de TTS |
| `tools/` | pipeline (ver seções abaixo) |
| `dist/`, `tmp/` | saídas (gitignored); os vídeos vão como assets de **GitHub Release** |

## 3. Passo a passo

### 3.0 Pesquisa e checagem (antes de escrever)
- Toda afirmação do roteiro é conferida na fonte (código da plataforma, dados, literatura). A tabela
  "Checagem de conteúdo" do `roteiro.md` registra **onde** cada fato foi verificado.
- **Nenhum número inventado na tela.** Números só entram se vierem de dados conferidos; na dúvida, mostre
  relações (cores, barras proporcionais, "menos ↔ mais") em vez de valores.
- Nomes de seções e botões seguem a interface real (ex.: "Base Científica", "Filtros").

### 3.1 Roteiro e storyboard
- 45–58 s, uma ideia por cena, pouco texto na tela. Tabela `# | fala | s | cena` no `roteiro.md`.
- `roteiro.json` — uma entrada por fala:
  ```json
  { "id": "L03", "voz": "Sulafat", "texto": "…o CP2B criou o PILAR-2b.",
    "fala": "…o cê pê dois bê criou o Pilar dois bê." }
  ```
  `texto` = legenda e tela; `fala` = o que a narradora **realmente diz** (siglas soletradas, números por extenso),
  usado pelo alinhador. `legenda_subst` devolve a grafia da tela (`["cê pê dois bê", "CP2B"]`).

### 3.2 Pedidos para a equipe (arquivo `entrada/PEDIDO_EPNN.md`)
**Imagens (Nano Banana):** sempre o mesmo estilo-mestre (ver `entrada/PEDIDO_EP02.md`): papel recortado com
fibras, borda branca de adesivo, tinta azul-petróleo, paleta da marca, **fundo magenta puro #FF00FF**, sem
texto, sem sombra. Regras que funcionaram:
- partes que o código vai preencher (tela de notebook, lente de lupa, escotilha) em **magenta puro** — viram buraco;
- olhos: pedir **ovais brancos sem pupila** se quisermos olhinhos móveis (o código detecta e desenha);
- uma folha com vários itens bem separados funciona bem; para o protagonista, peça também uma imagem só dele
  em resolução máxima (o notebook do ep. 02 veio numa folha e fica levemente macio nos closes).

**Voz (Gemini TTS):** script em `entrada/generate_<ep>_tts.py` (modelo `generate_pilar2b_tts.py`), uma chamada
por fala com `speech_metadata.style`, **2 tomadas**. Direção em inglês funciona melhor; `<short pause>` nas reticências.

**Música (Lyria 3 Pro):** instrumental, andamento fixo (~100 bpm), 60 s, estrutura descrita por compassos
(intro curta → tema → *lift* ~35 s → **"ta-da" final seco** + 2 s de cauda), "no vocals, no risers".
Anexar a trilha anterior como referência mantém a identidade sonora da série.

### 3.3 Ativos (imagens → recortes)
```bash
python tools/preparar_ativos.py ep02 GERACAO_FINAL_MELHOR   # chroma key + defringe + separa itens → assets/recortes/ep02/_folha/
python tools/nomear_ep02.py                                 # dá nomes (confere tamanhos) → assets/recortes/ep02/<nome>.png
python tools/meta_recortes.py ep02                          # buracos (tela/lente), limpa franja magenta, olhos → meta.json
```
- `meta_recortes.py` **reescreve** os PNGs com buraco (limpeza da franja): rode sempre **depois** do `nomear_*`.
- Na cena, cada recorte tem escala/âncora em `CUT` (ex.: ponta do dedo da mão, ponta do alfinete) e
  alternativas em `ASSETS` (se a imagem não existir, entra um desenho provisório em código — dá para animar
  o episódio inteiro antes de as imagens chegarem).

### 3.4 Voz
```bash
python tools/audio/transcrever.py entrada/<voz>_take1.wav            # faster-whisper (modelo em cache): o que foi dito?
python tools/audio/alinhar_vo.py entrada/<voz>_take1.wav --video NN-slug --saida tmp/ali_take1.json
python tools/audio/testar_pronuncia.py <wav> 9.8 12.4 "hipótese 1" "hipótese 2"   # desempate de pronúncia
```
- **A equipe pode ajustar o texto no script de TTS antes de gerar**: transcreva as tomadas e sincronize
  `roteiro.json` com o que foi realmente dito (no ep. 02: "reúne", "calcula").
- Escolha da tomada: confiança média do alinhamento por fala (prioridade às falas com a marca), duração,
  transcrição. O alinhador MMS dá pontuação baixa a números falados mesmo quando estão certos — confirme
  com a transcrição.
- Copie o alinhamento escolhido para `videos/NN-slug/audio/vo_alinhamento.json`.

### 3.5 Música e partitura
```bash
python tools/audio/analisar_musica.py entrada/<trilha>.mp3 --json tmp/musica.json   # bpm, 1º tempo forte, energia por compasso, cortes
```
`videos/NN-slug/partitura.json`:
```json
{ "roteiro": "roteiro.json", "vo": "entrada/<voz>.wav", "tempo_narracao": 1.0,
  "musica": { "arquivo": "entrada/<trilha>.mp3", "bpm": 103.116, "downbeat0": 1.816,
              "cortes": [], "logo_musica": 54.71, "cauda": 3.2 },
  "inicio": { "compasso": 0, "offset": 0.05 },
  "pausas": { "L02": 0.6, "L03": 0.8 } }
```
- `cortes`: pulos entre inícios de compasso (use os "saltos candidatos" do analisador) para encurtar a trilha
  sem emenda audível; `logo_musica`: instante exato do golpe final (ache no pico de graves/onset perto do fim);
  sem ele, usa-se `logo_compasso`.
- Ajuste `pausas` (0,3–0,8 s; maiores nas trocas de cena) até a última fala terminar ~1–2 s antes do logo.
```bash
python tools/audio/montar_timeline.py --video NN-slug        # --estimativa enquanto não há voz
python tools/legendas.py videos/NN-slug/timeline.json --balancear
```

### 3.6 Cena (`cena.js`)
Estrutura de referência (ep. 02):
- **auxiliares de tempo:** `at(id, palavra)`, `endOf`, `Lin(id)`; `pop` (entra com mola), `drop` (cai quicando),
  `tw` (tween), `settle` (assenta), `tq` = tempo "em dois" (12 poses/s, cara de stop-motion);
- **uma função `draw…` e uma `cues…` por cena:** a mesma âncora gera o movimento e o efeito sonoro
  (`sfx(at('L06','cidade'), 'clique', {pan})`);
- **`LAYOUTS = { h: {...}, v: {...} }`:** câmeras, posições e textos por formato (ver seção 4);
- **`overlay(rc)`:** textos em coordenadas de tela (título final, legendas queimadas, cartão do logo);
- **`hud(rc)`:** marca-d'água, desenhada **depois** do grão/luz;
- dados grandes (ex.: mapa de SP) ficam em `dados/` e são desenhados de cache quando estáticos.

`index.html` (copie o do ep. 02): `?export=1` (render), `?cc=1` (legendas no quadro), `?formato=vertical`,
`?marca=0`, `?tl=` / `?audio=` (versões alternativas).

### 3.7 Revisão visual (a cada rodada)
```bash
npm run servir                                                                     # assistir no navegador
node tools/render.mjs videos/NN-slug/index.html --stills 2,5.5,11,… --out tmp/q1    # quadros-chave
node tools/render.mjs videos/NN-slug/index.html --video tmp/previa.mp4 --scale 0.5 --crf 24 --workers 3   # prévia (sem som)
ffmpeg -i tmp/previa.mp4 -vf "fps=1.5,scale=320:-1,tile=8x11" -frames:v 1 tmp/contato.jpg                # folha de contato
```
Monte folhas de contato (vários quadros numa imagem) em vez de olhar quadro a quadro.

### 3.8 Som
```bash
npm run sfx:NN                                   # exporta as deixas de efeitos que a cena registrou
python tools/audio/mixar.py --video NN-slug      # trilha editada + voz + efeitos sintetizados → mix.wav / mix.m4a
python tools/audio/grafico_mix.py --video NN-slug
```
Alvos: **−15 LUFS integrado**, pico real ≤ −1 dBTP, voz ~10 dB acima da trilha (ducking), trilha sobe no logo.
Efeitos novos entram em `tools/audio/sfx.py` (funções sintetizadas; nunca arquivos de terceiros).

### 3.9 Render e entregas
```bash
node tools/render.mjs videos/NN-slug/index.html --video dist/x_master.mp4 --audio videos/NN-slug/audio/mix.wav \
     --fps 24 --crf 16 --workers 3 --keep --query marca=0          # master sem marca; mantém os PNG
bash tools/codificar.sh <pasta_quadros> videos/NN-slug/audio/mix.wav dist/x.mp4 9000   # distribuição (2 passagens)
```
Versões padrão de cada episódio (nomes `slug.mp4`, `slug_legendado.mp4`, `slug_vertical.mp4`,
`slug_vertical_legendado.mp4`, `slug_master.mp4`):

| versão | query | marca |
|---|---|---|
| principal 16:9 | — | sim |
| legendada 16:9 | `cc=1` | sim |
| vertical 9:16 | `formato=vertical` | sim |
| vertical legendada | `formato=vertical&cc=1` | sim |
| master 16:9 (CRF 16) | `marca=0` | não |

Um lote completo roda sozinho a partir de um script (render `--keep` → `codificar.sh` → apaga os PNG).
Velocidade: ~13 quadros/s com GPU (ANGLE/D3D11) e 3 workers → ~2 min de render por versão de 58 s.

### 3.10 QA final
- `ffprobe` de todos os MP4: resolução, 24 qps, duração igual, H.264 + AAC;
- `ffmpeg -af ebur128=peak=true` no principal: −15 LUFS;
- folha de contato de cada versão (principal e vertical legendada no mínimo);
- legendas: sem quebra ruim (artigo/preposição no fim da linha), fora das áreas cobertas no vertical;
- marca: cartão branco limpo, some antes do título/cartão final.

### 3.11 Publicação
- commit do código, dados, recortes e documentação (sem `entrada/` e sem vídeos); mensagem descreve o episódio;
- `gh release create vN.0 --notes-file dist/…/NOTAS_RELEASE.md <mp4s>`; o README do repositório lista os links
  de download de cada versão.

## 4. Formato vertical (9:16)

A mesma cena gera o vertical; muda só o layout. Áreas que o Instagram cobre: **~250 px no alto** (perfil) e
**~320 px embaixo** (resposta) — títulos, marca e legendas ficam entre elas (legenda com centro ~1500 px).
Duas estratégias, conforme a cena:
- **mundo compacto (ep. 02):** reposicionar elementos por formato (`LAYOUTS.v`): título acima do objeto
  principal, coadjuvantes **embaixo** em vez de ao lado, câmera que passa de um painel a outro;
- **mundo largo (ep. 01, estações lado a lado):** mesmo percurso de câmera com zoom ~0,85× e uma trilha de
  deslocamento ancorada nas palavras (`buildVCam`) que acompanha a ação dentro de cada estação; fundos de papel
  esticados para cima/baixo; textos finais reduzidos ou quebrados em duas linhas.

A vinheta do pós-processamento usa o lado maior/menor do quadro, então vale para os dois formatos.

## 5. Marca CP2B
- Cartão final: logo oficial (`assets/brand/cp2b-logo.svg`) em cartão branco limpo, sem rotação, sombra,
  textura ou contorno sobre o logo; slogan **"Energia viva, ciência que transforma."** na batida final.
- Marca-d'água: `X.watermark` no `hud` — logo colorido em cartão branco no canto superior direito, entra
  em 0,6 s e sai antes do título/cartão final; masters sem marca.
- Paleta: azul-petróleo #1E3E4C, verde-escuro #00573A, verde #5CA032, limão #B6E03B, âmbar #D37402
  (+ creme, amarelo, céu, coral). Fonte da marca Neulis só localmente (licença comercial).
- A grafia é **PILAR-2b** (b minúsculo): nas letras recortadas, use para o "b" uma fonte com caixa-baixa.

## 6. Armadilhas conhecidas
| sintoma | causa e solução |
|---|---|
| recorte com tela/janela vazada some | o filtro de "legenda impressa" via a moldura escura interna; `recortar.py` agora mede só a borda externa |
| linha roxa em volta do buraco | franja magenta do JPEG; `meta_recortes.py` apaga (várias passadas) |
| sigla/número lido errado pelo TTS | escreva a forma falada no script; confira pela transcrição |
| MMS dá nota ~0 para números | normal para números falados; confirme com `transcrever.py` |
| TLS falha em Python (Kaspersky) | `truststore.inject_into_ssl()`; `pip --use-feature=truststore` |
| heredoc do bash estraga `\n`/`\\`/aspas | escreva scripts com a ferramenta de arquivo e rode depois |
| vinheta escura no alto/baixo do vertical | resolvido no `stage.js` (raios pelo lado maior/menor) |
| marca-d'água ficou creme | desenhar no `hud` (depois do grão), não no `overlay` |
| legendas com quebra ruim | `legendas.py --balancear` (ep. 01 mantém o modo antigo, para não mudar) |

Ao mudar o motor ou as ferramentas, **confira que os episódios anteriores não mudam** (compare timeline,
legendas, trilha editada e um quadro renderizado com o original — diferença máxima 0).

## 7. Esqueleto de um episódio novo
1. copiar `videos/02-pilar-2b/` para `videos/NN-slug/` (manter `index.html`; limpar `cena.js` até o esqueleto:
   auxiliares, `LAYOUTS`, câmera, `overlay`, `hud`, `scene`);
2. escrever `roteiro.md` + `roteiro.json`; `partitura.json` provisório (100 bpm, sem cortes) e
   `montar_timeline.py --estimativa` para animar antes da voz;
3. `entrada/PEDIDO_EPNN.md` com os três blocos (imagens, voz, música) e o script de TTS;
4. animar com desenhos provisórios; trocar pelos recortes quando chegarem;
5. voz → alinhamento → timeline → legendas → efeitos → mixagem → render → QA → Release.
