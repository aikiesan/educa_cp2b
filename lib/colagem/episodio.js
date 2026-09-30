/* Colagem — episódio genérico dirigido por dados.
 * Lê videos/<ep>/cena.json (quadros por fala: peças, textos, efeitos) + timeline.json (tempos palavra a palavra)
 * e monta a cena completa nos dois formatos (16:9 e 9:16): quadros de papel por estilo, câmera que passa de quadro
 * em quadro, entradas em stop-motion (12 poses/s), efeitos sonoros, marca-d'água CP2B e o cartão final da série.
 * Formato do cena.json: docs/EPISODIO_GENERICO.md. Efeitos desenhados em código: efeitos.js (C.efeitos). */
(function (G) {
  'use strict';
  const C = G.Colagem;
  const { shapes: S, sprite: SP, ink: I, text: T, paper: P, extras: X, core } = C;
  const { E, clamp, lerp, hrand, R: RNG, snoise1, TAU, mixHex, shade } = core;
  const INK = SP.INK;
  const PAL = {
    petrol: '#1e3e4c', verdeEsc: '#00573a', verde: '#5ca032', lima: '#b6e03b', ambar: '#d37402',
    creme: '#f3ead8', papel: '#fbf8f0', amarelo: '#f2c14e', ceu: '#8ec5d6', coral: '#e4572e',
    marrom: '#8b5a3c', kraft: '#d6bf98', cinza: '#dfe3e0', branco: '#ffffff',
  };
  const cor = (c, def) => (c == null ? def : PAL[c] ?? c);

  // ---------- personagens: pose → recorte (assets/recortes/…) ----------
  const PERS = 'personagens/_folha/';
  const POSES = {
    cientista: { acena: 'cientista_colagem_1', aponta_esq: 'cientista_colagem_2', aponta: 'cientista_colagem_3', aponta_dir: 'cientista_colagem_3', pensa: 'cientista_colagem_4', lupa: 'cientista_colagem_5', prancheta: 'cientista_colagem_6', pula: 'cientista_colagem_7', jaleco: 'cientista_colagem_8', apresenta: 'cientista_colagem_8' },
    cientista_hq: { acena: 'cientista_hq_1', aponta_esq: 'cientista_hq_2', aponta: 'cientista_hq_3', aponta_dir: 'cientista_hq_3', pensa: 'cientista_hq_4', lupa: 'cientista_hq_5', prancheta: 'cientista_hq_6', pula: 'cientista_hq_7', jaleco: 'cientista_hq_8', apresenta: 'cientista_hq_8' },
    mascote: { em_pe: 'mascote_croche_1', pula: 'mascote_croche_2', senta: 'mascote_croche_3', acena: 'mascote_croche_4', dorme: 'mascote_croche_5', surpreso: 'mascote_croche_6' },
    mascote_papel: { em_pe: 'mascote_papel_1', pula: 'mascote_papel_2', senta: 'mascote_papel_3', acena: 'mascote_papel_4', dorme: 'mascote_papel_5', surpreso: 'mascote_papel_6' },
    arqueia: { em_pe: 'arqueia_croche_v2_1', feliz: 'arqueia_croche_v2_2', brava: 'arqueia_croche_v2_3', alta: 'arqueia_croche_v2_4', bolha: 'arqueia_croche_v2_7', deitada: 'arqueia_croche_v2_8', pula: 'arqueia_croche_5', sopra: 'arqueia_croche_7', cansada: 'arqueia_croche_8', curiosa: 'arqueia_croche_2' },
    arqueia_papel: { em_pe: 'arqueia_papel_1', deitada: 'arqueia_papel_2', brava: 'arqueia_papel_3', sopra: 'arqueia_papel_5', bolha: 'arqueia_papel_5', emburrada: 'arqueia_papel_6', cansada: 'arqueia_papel_7' },
    arqueia_eng: { acena: 'arqueia_personagem_1', joinha: 'arqueia_personagem_2', valvula: 'arqueia_personagem_3', pipeta: 'arqueia_personagem_5', ferramenta: 'arqueia_personagem_4', nao: 'arqueia_personagem_6', comemora: 'arqueia_personagem_7', aponta: 'arqueia_personagem_8', costas: 'arqueia_personagem_9' },
    arqueia_rosto: { feliz: 'arqueia_expressoes_1', concentrada: 'arqueia_expressoes_2', brava: 'arqueia_expressoes_3', enjoada: 'arqueia_expressoes_4', surpresa: 'arqueia_expressoes_5', rindo: 'arqueia_expressoes_6', piscando: 'arqueia_expressoes_7', orgulhosa: 'arqueia_expressoes_8' },
  };
  // biblioteca comum (eps. 01 e 02): nome → recorte
  const COMUM = {
    biodigestor: 'v3/biodigestor', bomba: 'v3/bomba', broto: 'v3/broto', caminhao: 'v3/caminhao', cana_feixe: 'v3/cana_feixe',
    cana_planta: 'v3/cana_planta', casa_creme: 'v3/casa_creme', casa_verde: 'v3/casa_verde', cenoura: 'v3/cenoura', esterco: 'v3/gerador',   // os arquivos v3/esterco e v3/gerador estão com os desenhos trocados
    fabrica: 'v3/fabrica', fogao: 'v3/fogao', gerador: 'v3/esterco', lampada: 'v3/lampada', laranja: 'v3/laranja', maca: 'v3/maca',
    maquina: 'v3/maquina', milho_espiga: 'v3/milho_espiga', milho_planta: 'v3/milho_planta', muda: 'v3/muda', onibus: 'v3/onibus',
    ovos: 'v3/ovos', palha: 'v3/palha', sol_nuvens: 'v3/sol_nuvens', tomateiro: 'v3/tomateiro', trator: 'v3/trator', vaca: 'v3/vaca_pe',
    alface: 'v3/alface_pe', alface_folha: 'v3/alface_folha', banana: 'v3/banana',
    artigo: 'ep02/artigo', caminhao_lixo: 'ep02/caminhao_lixo', cursor: 'ep02/cursor', empresario: 'ep02/empresario', folha: 'ep02/folha',
    gestora: 'ep02/gestora', livros: 'ep02/livros', lupa: 'ep02/lupa', mao: 'ep02/mao', notebook: 'ep02/notebook', nuvem: 'ep02/nuvem',
    pergaminho: 'ep02/pergaminho', pesquisadora: 'ep02/pesquisadora', pino_ambar: 'ep02/pino_ambar2', pino_coral: 'ep02/pino_coral2',
    pino_lima: 'ep02/pino_lima2', pino_petrol: 'ep02/pino_petrol', ramo: 'ep02/ramo', ramo2: 'ep02/ramo2', saco_restos: 'ep02/saco_restos',
    sol: 'ep02/sol_disco', vaca_deitada: 'ep02/vaca',
  };

  // ---------- estilos visuais (quadro + mesa) ----------
  const ESTILOS = {
    C: { mesa: ['#d6bf98', 'kraft'], folhas: ['#f3ead8', '#cfe6ed', '#f8e6c8', '#e3eed6', '#fbf8f0', '#f6d9cc'], kind: 'paper', borda: 'rasgada', tinta: INK, fonte: 'Caveat', decor: true },
    D: { mesa: ['#7a5638', 'kraft'], folhas: ['#c9a574', '#d4b384', '#be9965'], kind: 'cardboard', borda: 'papelao', tinta: INK, fonte: 'Caveat', decor: false },
    F: { mesa: ['#2f5d45', 'paper'], folhas: ['#f3ead8', '#f2d7a0', '#e3eed6', '#f6d9cc', '#d9ecf2'], kind: 'paper', borda: 'costura', tinta: INK, fonte: 'Caveat', decor: false },
    Q: { mesa: ['#f2c14e', 'smooth'], folhas: ['#fbf8f0', '#fdf3dc', '#eef6f7'], kind: 'smooth', borda: 'quadro', tinta: INK, fonte: 'Luckiest Guy', decor: false },
    N: { mesa: ['#5b3d28', 'kraft'], folhas: ['#e9d6b1', '#eddcb9'], kind: 'kraft', borda: 'caderno', tinta: '#1e3e4c', fonte: 'Caveat', decor: false },
    L: { mesa: ['#6b4a31', 'kraft'], folhas: ['#27453a', '#2b4a3f'], kind: 'smooth', borda: 'lousa', tinta: '#f4f1e6', fonte: 'Gochi Hand', decor: false },
    P: { mesa: ['#9a7650', 'kraft'], folhas: ['#f3ead8', '#f6efdf'], kind: 'paper', borda: 'livro', tinta: INK, fonte: 'Caveat', decor: false, tremor: 0.45, suave: true },
    B: { mesa: ['#16405e', 'smooth'], folhas: ['#1f5d86', '#21628c'], kind: 'smooth', borda: 'planta', tinta: '#eaf4fb', fonte: 'Gochi Hand', decor: false },
  };

  // ---------- estado ----------
  let CFG = null, TL = null, WORDS = {}, FMT = 'h', LANG = 'pt-BR', MARCA = true, CAPS = null;
  let EST = ESTILOS.C, FW = 1920, FH = 1080;
  let SCENES = [], BOARDS = [], SFX = [], LOGO = 50, FIM = 54, MOLD = [];
  const IMG = new Map();   // alias → nome carregado em X.images
  let MEAS = null;          // contexto para medir texto

  const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const L = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? (v[LANG] ?? v['pt-BR'] ?? Object.values(v)[0]) : v);
  function indexWords() {
    WORDS = {};
    for (const f of TL.falas) WORDS[f.id] = { ...f, idx: f.palavras.map((w) => ({ ...w, k: norm(w.p) })) };
  }
  const Lin = (id) => WORDS[id] || { inicio: 0, fim: 0, idx: [] };
  function sfx(t, nome, o = {}) { if (t == null || !isFinite(t)) return; SFX.push({ t: +Math.max(0, t).toFixed(3), nome, ganho: o.g ?? 1, pan: o.pan ?? 0, dur: o.dur, p: o.p }); }

  /** "em": número (s desde o início do quadro) · "palavra" · "palavra#2" · "L03:palavra" · "inicio" / "fim" · sufixo ±s */
  function tEm(sc, em, dflt) {
    if (em == null) return dflt;
    if (typeof em === 'object' && !Array.isArray(em)) em = em[LANG] ?? em['pt-BR'] ?? Object.values(em)[0];   // âncora por língua
    if (em == null) return dflt;
    if (typeof em === 'number') return sc.t0 + em;
    let s = String(em).trim(), off = 0;
    const m = s.match(/^(.*?[^+-])([+-]\d+(?:\.\d+)?)$/);
    if (m) { s = m[1]; off = +m[2]; }
    let ids = sc.falas;
    const mm = s.match(/^(L\d\d|LF):(.*)$/);
    if (mm) { ids = [mm[1]]; s = mm[2]; }
    if (s === 'inicio') return Lin(ids[0]).inicio + off;
    if (s === 'fim') return Lin(ids[ids.length - 1]).fim + off;
    let n = 0;
    const h = s.match(/^(.*)#(\d+)$/);
    if (h) { s = h[1]; n = +h[2] - 1; }
    const k = norm(s);
    const exact = [], pref = [];
    for (const id of ids) for (const w of Lin(id).idx) { if (w.k === k) exact.push(w); else if (k.length >= 3 && w.k.startsWith(k)) pref.push(w); }
    const hits = exact.length ? exact : pref;
    if (!hits.length) { console.warn('palavra não encontrada:', sc.falas.join(','), em); return dflt; }
    return hits[Math.min(n, hits.length - 1)].i + off;
  }

  // ---------- layout ----------
  function area() {
    return FMT === 'v' ? { x0: -430, x1: 430, y0: -590, y1: 640 } : { x0: -805, x1: 805, y0: -405, y1: 425 };
  }
  const box = (x0, y0, x1, y1) => ({ x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 });
  function split(b, n, dir, gap = 34, wts = null) {
    const out = [];
    const W = wts && wts.length === n ? wts : Array(n).fill(1), T = W.reduce((a, c) => a + c, 0);
    let acc = 0;
    if (dir === 'x') { const tot = b.w - gap * (n - 1); for (let i = 0; i < n; i++) { const w = tot * W[i] / T; out.push(box(b.x0 + acc, b.y0, b.x0 + acc + w, b.y1)); acc += w + gap; } }
    else { const tot = b.h - gap * (n - 1); for (let i = 0; i < n; i++) { const h = tot * W[i] / T; out.push(box(b.x0, b.y0 + acc, b.x1, b.y0 + acc + h)); acc += h + gap; } }
    return out;
  }
  function aspectOf(it) {
    if (it.p) { const im = imgOf(it.p); if (im) return im.width / im.height; }
    if (it.txt != null) return 3;
    return 1;
  }
  function grid(b, n, cols, gap = 30) {
    const rows = Math.ceil(n / cols), out = [];
    const rs = split(b, rows, 'y', gap);
    for (let r = 0; r < rows; r++) {
      const k = Math.min(cols, n - r * cols);
      const cs = split(rs[r], cols, 'x', gap);
      const off = (cols - k) * (cs[0].w + gap) / 2;   // última linha centrada
      for (let c = 0; c < k; c++) { const q = cs[c]; out.push(box(q.x0 + off, q.y0, q.x1 + off, q.y1)); }
    }
    return out;
  }
  function arrange(main, items, arr, colunas) {
    const n = items.length;
    if (n <= 0) return [];
    const V = LIVRO() ? main.h > main.w * 1.05 : FMT === 'v';   // página de livro: decide pelo formato da própria página
    const asp = items.map(aspectOf);
    if (arr === 'palco' && n > 1) {
      const out = [];
      if (!V) {
        const hw = main.w * clamp(0.36 + 0.13 * asp[0], 0.44, n === 2 ? 0.66 : 0.6);
        const hero = box(main.cx - hw / 2, main.y0, main.cx + hw / 2, main.y1);
        out.push(hero);
        const left = box(main.x0, main.y0, hero.x0 - 30, main.y1), right = box(hero.x1 + 30, main.y0, main.x1, main.y1);
        const rest = n - 1, nl = Math.ceil(rest / 2), nr = rest - nl;
        const Ls = split(left, nl, 'y'), Rs = nr ? split(right, nr, 'y') : [];
        for (let i = 0; i < rest; i++) out.push(i % 2 === 0 ? Ls[i >> 1] : Rs[i >> 1]);
        if (n === 2) out[1] = box(main.x0, main.y0 + main.h * 0.2, hero.x0 - 30, main.y1);
      } else {
        const hh = main.h * clamp(0.62 - 0.08 * asp[0], 0.36, n === 2 ? 0.6 : 0.5);
        const hero = box(main.x0, main.cy - hh / 2, main.x1, main.cy + hh / 2);
        out.push(hero);
        const top = box(main.x0, main.y0, main.x1, hero.y0 - 30), bot = box(main.x0, hero.y1 + 30, main.x1, main.y1);
        const rest = n - 1, nt = Math.ceil(rest / 2), nb = rest - nt;
        const Ts = split(top, nt, 'x'), Bs = nb ? split(bot, nb, 'x') : [];
        for (let i = 0; i < rest; i++) out.push(i % 2 === 0 ? Ts[i >> 1] : Bs[i >> 1]);
      }
      return out;
    }
    if (n === 1) return [main];
    if (arr === 'grade' || (n >= 4 && arr !== 'fila') || (arr === 'fila' && (V ? n > 3 : n > 6))) {
      const cols = colunas ? Math.min(colunas, V ? 2 : colunas) : V ? 2 : (arr === 'grade' ? Math.ceil(Math.sqrt(n * 1.7)) : (n <= 4 ? n : Math.ceil(n / 2)));
      return grid(main, n, Math.min(cols, n));
    }
    // dupla / fila / auto: fatias proporcionais ao formato de cada peça
    if (V && n === 3) {   // 9:16: a primeira peça em cima, as outras duas lado a lado embaixo
      const [top, bot] = split(main, 2, 'y', 34, [clamp(1 / asp[0], 0.7, 1.3), 1]);
      return [top, ...split(bot, 2, 'x', 30, [clamp(asp[1], 0.6, 1.6), clamp(asp[2], 0.6, 1.6)])];
    }
    return V ? split(main, n, 'y', 34, asp.map((a) => clamp(Math.sqrt(1 / a), 0.75, 1.35))) : split(main, n, 'x', 34, asp.map((a) => clamp(a, 0.55, 2.4)));
  }

  // molduras com HUD no canto de cima (9:16): o conteúdo desce para não esbarrar nelas
  function hudCobre(sc) {
    if (FMT !== 'v') return false;
    const sc0 = { t0: 0, falas: TL.falas.map((f) => f.id) };
    const a0 = sc.t0, a1 = Lin(sc.falas[sc.falas.length - 1]).fim;
    if (CFG.live || CFG.placar || CFG.jogo) return true;   // tela de live: HUD em cima e chat embaixo
    return (CFG.molduras || []).some((m) => ['game', 'cronometro', 'relogio', 'vhs', 'vlog'].includes(m.tipo)
      && (m.de ? tEm(sc0, m.de, 0) : 0) < a1 - 0.3 && (m.ate ? tEm(sc0, m.ate, LOGO) : LOGO) > a0 + 0.3);
  }
  function planScene(sc) {
    const V0 = FMT === 'v';
    if (!LIVRO()) return planArea(sc, area(), sc.itens, (V0 ? sc.arranjoV : null) ?? sc.arranjo, (V0 ? sc.colunasV : null) ?? sc.colunas);
    // livro: cada página é uma área própria (1 = esquerda / de cima, 2 = direita / de baixo); nada atravessa a dobra
    const by = {};
    for (const it of sc.itens) if (it.id || it.p) by[it.id || it.p] = it;
    for (const it of sc.itens) if (it.pagina == null && it.sobre && by[it.sobre]) it.pagina = by[it.sobre].pagina;
    for (const it of sc.itens) if (it.pagina == null) it.pagina = 2;
    const pg = paginasArea(), cfg = sc.paginas || [];
    for (const n of [1, 2]) {   // arranjo por página (e por formato: arranjoV / colunasV valem só no 9:16)
      const pc = cfg[n - 1] || {}, V = FMT === 'v';
      planArea(sc, pg[n - 1], sc.itens.filter((it) => it.pagina === n), (V ? pc.arranjoV : null) ?? pc.arranjo ?? sc.arranjo, (V ? pc.colunasV : null) ?? pc.colunas ?? sc.colunas);
    }
    const todos = sc.itens.filter((it) => it.pagina === 0);   // 0 = o livro aberto inteiro (conectores entre páginas)
    if (todos.length) planArea(sc, area(), todos, sc.arranjo, sc.colunas);
  }
  function planArea(sc, A0, itens, arranjo, colunas) {
    const A = { ...A0 };
    const V = FMT === 'v';
    if (hudCobre(sc)) A.y0 += 105;
    let top = A.y0, bottom = A.y1, right = A.x1;
    const has = (lugar) => itens.some((it) => it.lugar === lugar);
    const TB = has('titulo') ? box(A.x0, A.y0, A.x1, A.y0 + (V ? (LIVRO() ? 120 : 230) : 170)) : null;
    if (TB) top = TB.y1 + 18;
    let RB = has('rodape') ? box(A.x0, A.y1 - (V ? (LIVRO() ? 105 : 210) : 150), A.x1, A.y1) : null;
    if (RB) bottom = RB.y0 - 18;
    let NB = null;
    if (has('narrador')) {
      if (V && LIVRO()) { NB = box(A.x1 - 300, top, A.x1, bottom); right = NB.x0 - 12; }   // página de livro no 9:16: narrador ao lado
      else if (V) { NB = box(A.x1 - 360, bottom - 400, A.x1, bottom); bottom = NB.y0 - 10; }
      else { NB = box(A.x1 - 330, top + 60, A.x1, A.y1); right = NB.x0 - 16; if (RB) RB = box(A.x0, RB.y0, right, RB.y1); }   // o rodapé não passa por baixo do narrador
    }
    const main = box(A.x0, top, right, bottom);
    const VV = LIVRO() ? main.h > main.w : V;
    const conector = (it) => it.fx && (['seta', 'tracejado', 'cano', 'ciclo'].includes(it.fx) || (it.de && !it.lugar && !it.sobre));
    const mains = itens.filter((it) => !it.lugar && !it.sobre && !it.pos && !conector(it));
    const cells = arrange(main, mains, arranjo, colunas);
    mains.forEach((it, i) => { it.box = cells[i]; });
    const lug = {
      titulo: TB, rodape: RB, narrador: NB, centro: box(main.cx - main.w * 0.32, main.cy - main.h * 0.3, main.cx + main.w * 0.32, main.cy + main.h * 0.3),
      topo: box(main.x0, main.y0, main.x1, main.y0 + main.h * 0.3), base: box(main.x0, main.y1 - main.h * 0.28, main.x1, main.y1),
      esquerda: box(main.x0, main.y0, main.x0 + main.w * 0.3, main.y1), direita: box(main.x1 - main.w * 0.3, main.y0, main.x1, main.y1),
      canto: box(main.x0, main.y0, main.x0 + main.w * (VV ? 0.62 : 0.32), main.y0 + main.h * (VV ? 0.16 : 0.26)),
      canto_dir: box(main.x1 - main.w * (VV ? 0.62 : 0.32), main.y0 + main.h * (VV ? 0.07 : 0.16), main.x1, main.y0 + main.h * (VV ? 0.23 : 0.42)),   // abaixo da marca-d'água
      tudo: main,
    };
    for (const it of itens) {
      if (it.pos) {   // posição livre (frações do quadro): pos (16:9) e posV (9:16)
        const p = (V ? it.posV : null) || it.pos, c = (V ? it.caixaV : null) || it.caixa || [0.3, 0.3];
        const cx = V && !it.posV ? p[0] * 0.8 * FW : p[0] * FW, cy = V && !it.posV ? p[1] * 0.7 * FH : p[1] * FH;
        const w = c[0] * FW * (V && !it.caixaV ? 1.5 : 1), h = c[1] * FH * (V && !it.caixaV ? 0.62 : 1);
        it.box = box(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2);
      } else if (it.lugar) it.box = lug[it.lugar] || main;
      else if (conector(it)) it.box = main;
    }
  }

  // ---------- peças desenhadas em código ("p": "@laranja", "@gomo", "@cafe", "@meia_laranja") ----------
  // Recortes de papel gerados em alta resolução (com borda branca de adesivo), usados como qualquer peça: aceitam
  // rosto, capa, muda… Servem quando a biblioteca não tem a peça (a laranja inteira, o gomo, o grão de café).
  function desenho(nome) {
    const k = nome.slice(1);
    const W = { laranja: [640, 680], gomo: [420, 360], cafe: [380, 480], meia_laranja: [640, 420], bola_n: [420, 420], bola_p: [420, 420], bola_k: [420, 420], broto: [620, 760], carbono: [420, 420], pedacinhos: [520, 300], vending: [900, 1400], h2: [460, 300], bloco: [300, 300], bloco_vazio: [300, 300], bandeira: [360, 900], moeda: [240, 240], dado1: [300, 300], dado2: [300, 300], dado3: [300, 300], dado4: [300, 300], dado5: [300, 300], dado6: [300, 300], botao_mito: [460, 330], botao_verdade: [460, 330], botao_parte: [460, 330], gota_acida: [300, 380], bandeja: [640, 300], ch4: [420, 420],
      bolota: [420, 420], domino: [150, 420], tabua: [1000, 64], chao: [1000, 150], ru: [900, 820], lixo: [360, 440], tampa: [400, 90], botao: [260, 190],
      copinho: [170, 210], guardanapo: [200, 170], esteira: [1600, 120], poste: [70, 600], ponto: [300, 760],
      quadro_antes: [1500, 1000], quadro_depois: [1500, 1000], vazio: [220, 220] }[k] || (k.startsWith('marca_') || k.startsWith('achado_') ? [220, 220] : null);
    if (!W) return desenhoAlbum(k);
    const c = P.canvas(W[0], W[1]), g = c.getContext('2d');
    const bord = { w: 12 };
    if (k === 'laranja') {
      const cx = 320, cy = 380, r = 255;
      SP.piece(g, S.blob(cx, cy, r, r * 0.96, { seed: 21, wobble: 0.025, n: 90 }), { color: '#f28c28', kind: 'paper', seed: 21, border: bord, shade: 0.8, edge: 0.2 });
      const rr = RNG(22);
      g.fillStyle = 'rgba(160,70,0,0.22)';
      for (let i = 0; i < 160; i++) { const a = rr.range(0, TAU), d = Math.sqrt(rr.range(0, 1)) * r * 0.9; g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, rr.range(2, 4.5), 0, TAU); g.fill(); }
      g.fillStyle = 'rgba(255,236,190,0.45)'; g.beginPath(); g.ellipse(cx - r * 0.38, cy - r * 0.42, r * 0.2, r * 0.12, -0.6, 0, TAU); g.fill();
      SP.piece(g, S.rrect(cx - 12, cy - r - 44, 24, 60, 8, { seed: 23 }), { color: '#6b4a2e', seed: 23, border: { w: 8 } });
      SP.piece(g, S.blob(cx + 70, cy - r - 30, 80, 34, { seed: 24, wobble: 0.08 }), { color: '#5ca032', seed: 24, border: { w: 8 }, patRot: 30 });
      g.strokeStyle = 'rgba(0,70,30,0.45)'; g.lineWidth = 4; g.beginPath(); g.moveTo(cx + 5, cy - r - 30); g.lineTo(cx + 140, cy - r - 32); g.stroke();
    } else if (k === 'gomo') {   // gomo (fatia de laranja vista de lado): casca, polpa e sementinha
      const pts = []; for (let i = 0; i <= 40; i++) { const a = Math.PI + (i / 40) * Math.PI; pts.push([210 + Math.cos(a) * 180, 250 + Math.sin(a) * 170]); }
      SP.piece(g, pts, { color: '#f28c28', kind: 'paper', seed: 31, border: bord, shade: 0.5 });
      const inn = pts.map(([x, y]) => [210 + (x - 210) * 0.84, 250 + (y - 250) * 0.84]);
      SP.piece(g, inn, { color: '#ffc04d', kind: 'paper', seed: 32, shade: 0.3, edge: 0 });
      g.strokeStyle = 'rgba(255,245,210,0.9)'; g.lineWidth = 5;
      for (let i = 1; i < 6; i++) { const a = Math.PI + (i / 6) * Math.PI; g.beginPath(); g.moveTo(210, 246); g.lineTo(210 + Math.cos(a) * 140, 250 + Math.sin(a) * 132); g.stroke(); }
      g.fillStyle = '#f7ecd0'; g.beginPath(); g.ellipse(170, 200, 11, 17, 0.4, 0, TAU); g.fill();
    } else if (k === 'meia_laranja') {
      SP.piece(g, S.blob(320, 210, 290, 180, { seed: 41, wobble: 0.02, n: 90 }), { color: '#f28c28', kind: 'paper', seed: 41, border: bord, shade: 0.4 });
      SP.piece(g, S.blob(320, 210, 250, 148, { seed: 42, wobble: 0.02, n: 90 }), { color: '#ffc04d', kind: 'paper', seed: 42, shade: 0.2, edge: 0 });
      g.strokeStyle = 'rgba(255,245,210,0.95)'; g.lineWidth = 6;
      for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; g.beginPath(); g.moveTo(320, 210); g.lineTo(320 + Math.cos(a) * 240, 210 + Math.sin(a) * 142); g.stroke(); }
      g.fillStyle = '#fff3d6'; g.beginPath(); g.ellipse(320, 210, 22, 14, 0, 0, TAU); g.fill();
    } else if (k === 'h2') {   // molécula de hidrogênio H–H (o herói Hidro): duas bolinhas azul-claro
      g.strokeStyle = '#fbf8f0'; g.lineWidth = 50; g.beginPath(); g.moveTo(140, 150); g.lineTo(320, 150); g.stroke();
      g.strokeStyle = '#1b2a33'; g.lineWidth = 26; g.beginPath(); g.moveTo(150, 150); g.lineTo(310, 150); g.stroke();
      for (const [x, sd] of [[130, 1], [330, 2]]) {
        SP.piece(g, S.blob(x, 150, 108, 108, { seed: 230 + sd, wobble: 0.015, n: 80 }), { color: '#8ec5d6', kind: 'paper', seed: 230 + sd, border: bord, shade: 0.8, edge: 0.25 });
        g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.ellipse(x - 38, 108, 28, 16, -0.5, 0, TAU); g.fill();
        g.fillStyle = '#1e3e4c'; g.font = '700 58px "Archivo Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('H', x + 40, 200);
      }
    } else if (k === 'bloco' || k === 'bloco_vazio') {   // bloco de pergunta de papel
      const vz = k === 'bloco_vazio';
      SP.piece(g, S.rrect(22, 22, 256, 256, 18, { seed: 241 }), { color: vz ? '#b5895a' : '#f2c14e', kind: 'kraft', seed: 241, border: bord, shade: 0.9, edge: 0.3 });
      g.fillStyle = 'rgba(80,40,10,0.55)'; for (const [x, y] of [[50, 50], [250, 50], [50, 250], [250, 250]]) { g.beginPath(); g.arc(x, y, 10, 0, TAU); g.fill(); }
      if (!vz) { g.fillStyle = '#fbf8f0'; g.strokeStyle = '#8b4a1c'; g.lineWidth = 12; g.font = '700 190px "Luckiest Guy", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeText('?', 150, 162); g.fillText('?', 150, 162); }
    } else if (k === 'bandeira') {   // mastro da chegada com bandeira verde e estrela
      SP.piece(g, S.rrect(160, 60, 30, 800, 12, { seed: 251 }), { color: '#dfe3e0', kind: 'paper', seed: 251, border: bord, shade: 0.6 });
      SP.piece(g, S.blob(175, 50, 34, 34, { seed: 252 }), { color: '#f2c14e', seed: 252, border: { w: 8 } });
      SP.piece(g, [[190, 90], [345, 150], [190, 230]], { color: '#5ca032', kind: 'paper', seed: 253, border: { w: 8 }, shade: 0.5 });
      SP.piece(g, S.star(245, 160, 14, 32, 5, { seed: 254 }), { color: '#fbf8f0', seed: 254 });
      SP.piece(g, S.rrect(110, 840, 130, 50, 10, { seed: 255 }), { color: '#6b4a31', kind: 'kraft', seed: 255, border: { w: 8 } });
    } else if (k === 'moeda') {   // moeda de folha
      SP.piece(g, S.blob(120, 120, 100, 100, { seed: 261, wobble: 0.01, n: 70 }), { color: '#f2c14e', kind: 'paper', seed: 261, border: bord, shade: 0.9, edge: 0.3 });
      g.strokeStyle = '#d39a1e'; g.lineWidth = 10; g.beginPath(); g.arc(120, 120, 72, 0, TAU); g.stroke();
      SP.piece(g, S.blob(120, 120, 26, 48, { seed: 262 }).map(([x, y]) => [120 + (x - 120) * 0.9 + (y - 120) * 0.35, y]), { color: '#5ca032', seed: 262 });
    } else if (k.startsWith('dado')) {   // dado de papel com a face N
      const n = +k.slice(4);
      SP.piece(g, S.rrect(30, 30, 240, 240, 44, { seed: 200 + n }), { color: '#fbf8f0', kind: 'paper', seed: 200 + n, border: bord, shade: 0.9, edge: 0.3 });
      const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[n];
      g.fillStyle = n === 1 ? '#e4572e' : '#1e3e4c';
      for (const [dx, dy] of P) { g.beginPath(); g.arc(150 + dx * 62, 150 + dy * 62, n === 1 ? 34 : 24, 0, TAU); g.fill(); }
    } else if (k === 'vending') {   // máquina de vender retrô (900×1400): vitrine 2×3 com molas, painel com visor/teclado/entrada, bandeja
      const B = (x, y, w, h, r, col, sd, o = {}) => SP.piece(g, S.rrect(x, y, w, h, r, { seed: sd }), { color: col, kind: 'paper', seed: sd, ...o });
      B(40, 60, 820, 1290, 46, '#2f7f84', 131, { border: bord, shade: 0.7, edge: 0.25 });
      B(70, 80, 760, 120, 28, '#e4572e', 132, { shade: 0.4 });
      for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#fff3b0' : '#f2c14e'; g.beginPath(); g.arc(100 + i * 58, 96, 9, 0, TAU); g.fill(); g.beginPath(); g.arc(100 + i * 58, 186, 9, 0, TAU); g.fill(); }
      g.fillStyle = '#fbf8f0'; g.font = '700 70px "Luckiest Guy", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('BIO-MÁQUINA', 450, 145);
      // vitrine de vidro
      B(84, 214, 562, 836, 20, '#123b45', 133, { shade: 0.3, edge: 0.1 });
      const gl = g.createLinearGradient(84, 214, 646, 1050); gl.addColorStop(0, 'rgba(200,240,255,0.22)'); gl.addColorStop(0.5, 'rgba(200,240,255,0.05)'); gl.addColorStop(1, 'rgba(200,240,255,0.16)');
      for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) {
        const x = 90 + c * 275, y = 220 + r * 273;
        g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(x + 6, y + 6, 263, 261);
        // mola (espiral) e trilho
        g.strokeStyle = '#b8c0c4'; g.lineWidth = 7; g.beginPath();
        for (let q = 0; q <= 60; q++) { const u = q / 60, xx = x + 30 + u * 215, yy = y + 238 + Math.sin(u * TAU * 5) * 12; q ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke();
        g.fillStyle = '#6b7478'; g.fillRect(x + 14, y + 252, 247, 8);
        // etiqueta do código (A1, A2…)
        B(x + 100, y + 262, 76, 34, 8, '#f3ead8', 140 + r * 2 + c, { edge: 0 });
        g.fillStyle = '#1b2a33'; g.font = '700 26px "Archivo Black", sans-serif'; g.fillText('ABC'[r] + (c + 1), x + 138, y + 280);
      }
      g.fillStyle = gl; g.fillRect(84, 214, 562, 836);
      g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 10; g.beginPath(); g.moveTo(130, 260); g.lineTo(220, 520); g.stroke();
      // painel da direita: visor, teclado, entrada de resíduo
      B(664, 214, 170, 836, 20, '#1e3e4c', 150, { shade: 0.3 });
      B(684, 238, 130, 92, 12, '#0f2a1c', 151, { edge: 0 });
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
        SP.piece(g, S.blob(706 + c * 43, 380 + r * 56, 17, 17, { seed: 160 + r * 3 + c }), { color: r === 3 && c === 2 ? '#5ca032' : r === 3 && c === 0 ? '#e4572e' : '#f3ead8', seed: 161, edge: 0.2 });
        g.fillStyle = '#1b2a33'; g.font = '700 16px "Archivo Black", sans-serif'; g.fillText(r < 3 ? String(r * 3 + c + 1) : ['✕', '0', 'OK'][c], 706 + c * 43, 381 + r * 56);
      }
      B(700, 640, 98, 110, 14, '#2b2f33', 170, { edge: 0 });
      g.fillStyle = '#000'; g.fillRect(720, 668, 58, 12);
      g.fillStyle = '#f2c14e'; g.font = '700 20px "Archivo Black", sans-serif'; g.fillText('RESÍDUO', 749, 712); g.fillText('AQUI ▼', 749, 734);
      SP.piece(g, S.star(750, 880, 34, 70, 10, { seed: 171 }), { color: '#f2c14e', seed: 171, edge: 0.2 });
      g.fillStyle = '#e4572e'; g.font = '700 26px "Luckiest Guy", sans-serif'; g.fillText('NOVO!', 750, 884);
      // bandeja de retirada
      B(110, 1080, 520, 190, 24, '#123b45', 180, { edge: 0.1 });
      B(126, 1096, 488, 70, 14, '#2f7f84', 181, { edge: 0.1, shade: 0.6 });
      g.fillStyle = '#fbf8f0'; g.font = '700 30px "Archivo Black", sans-serif'; g.fillText('RETIRE AQUI', 370, 1133);
      for (const x of [110, 690]) B(x, 1340, 100, 40, 10, '#1b2a33', 190 + x);
    } else if (k.startsWith('botao_')) {   // botão de auditório (base + cúpula colorida + placa com a palavra)
      const cfg = { mito: ['#e4572e', 'MITO'], verdade: ['#5ca032', 'VERDADE'], parte: ['#d37402', 'EM PARTE'] }[k.slice(6)];
      SP.piece(g, S.rrect(40, 170, 380, 120, 30, { seed: 121 }), { color: '#3b3f44', kind: 'paper', seed: 121, border: bord, shade: 0.6 });
      SP.piece(g, S.blob(230, 150, 150, 78, { seed: 122, wobble: 0.02 }), { color: cfg[0], kind: 'paper', seed: 122, border: { w: 8 }, shade: 0.9, edge: 0.3 });
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(180, 120, 50, 18, -0.2, 0, TAU); g.fill();
      g.fillStyle = '#fbf8f0'; g.font = `700 ${cfg[1].length > 5 ? 48 : 60}px "Archivo Black", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(cfg[1], 230, 238);
    } else if (k === 'pedacinhos') {   // restos picadinhos: montinho de pedacinhos de feltro
      const rr = RNG(91), cols = ['#8b5a3c', '#5ca032', '#e39a2d', '#b6e03b', '#c9784a', '#f2c14e'];
      for (let i = 0; i < 16; i++) { const x = 90 + rr.range(0, 340), y = 190 - Math.sin((x - 90) / 340 * Math.PI) * rr.range(40, 120) + rr.range(0, 30); SP.piece(g, S.blob(x, y, rr.range(26, 46), rr.range(20, 34), { seed: 90 + i, wobble: 0.15 }), { color: cols[i % cols.length], kind: 'felt', seed: 90 + i, border: { w: 8 }, shade: 0.5 }); }
    } else if (k === 'gota_acida') {   // gotinha ácida (amarelo-limão) — a cara azeda vem do "rosto"
      const pts = []; for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, c = Math.cos(a); pts.push([150 + 115 * Math.sin(a) * (c < 0 ? 1 + c * 0.55 : 1), 230 + (c < 0 ? 1.7 * 115 * c : 115 * c)]); }
      SP.piece(g, pts, { color: '#e8e04a', kind: 'felt', seed: 101, border: bord, shade: 0.7 });
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(105, 200, 20, 42, 0.3, 0, TAU); g.fill();
    } else if (k === 'bandeja') {   // bandeja com as três saídas da acetogênese
      SP.piece(g, S.rrect(30, 150, 580, 110, 26, { seed: 111 }), { color: '#8b5a3c', kind: 'felt', seed: 111, border: bord, shade: 0.5 });
      [['acetato', '#e39a2d', 140], ['H₂', '#8ec5d6', 320], ['CO₂', '#b0b8bc', 500]].forEach(([tx, col, x], i) => {
        SP.piece(g, S.blob(x, 130, 78, 78, { seed: 112 + i }), { color: col, kind: 'felt', seed: 112 + i, border: { w: 8 }, shade: 0.6 });
        g.fillStyle = '#1b2a33'; g.font = `700 ${tx.length > 3 ? 40 : 56}px "Archivo Black", sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(tx, x, 132);
      });
    } else if (k === 'ch4') {   // molécula de metano (a mesma dos efeitos), grande, para ser a carga final
      X.molecule(g, 'CH4', 210, 210, 3.1, { face: true, mood: 'feliz', zoom: 1 });
    } else if (k === 'carbono') {   // átomo de carbono: bolinha de carvão com brilho (o rosto vem do item/viajante)
      SP.piece(g, S.blob(210, 210, 178, 178, { seed: 81, wobble: 0.02, n: 90 }), { color: '#3a4146', kind: 'paper', seed: 81, border: bord, shade: 0.9, edge: 0.25 });
      const rr = RNG(82); g.fillStyle = 'rgba(0,0,0,0.18)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(210 + rr.sym(140), 210 + rr.sym(140), rr.range(3, 7), 0, TAU); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,0.2)'; g.beginPath(); g.ellipse(140, 130, 56, 30, -0.6, 0, TAU); g.fill();
      g.fillStyle = 'rgba(244,241,230,0.85)'; g.font = '700 70px "Archivo Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('C', 300, 318);
    } else if (k === 'broto') {   // broto grande: montinho de terra, caule e duas folhas
      SP.piece(g, S.blob(310, 660, 250, 80, { seed: 71, wobble: 0.05 }), { color: '#8b5a3c', kind: 'kraft', seed: 71, border: bord, shade: 0.6 });
      g.fillStyle = 'rgba(40,20,10,0.25)'; for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(120 + (i * 37) % 380, 630 + (i * 13) % 60, 4, 0, TAU); g.fill(); }
      const caule = [[310, 640], [312, 520], [305, 400], [310, 300]];
      SP.piece(g, S.offset ? S.offset(S.resample(caule, 6, false).concat(S.resample(caule, 6, false).reverse()), 13) : caule, { color: '#5ca032', seed: 72, edge: 0.1 });
      SP.piece(g, S.blob(190, 250, 150, 70, { seed: 73, wobble: 0.06 }).map(([x, y]) => [x + (y - 250) * 0.9 * 0, y - (x - 190) * 0.45]), { color: '#7cc242', kind: 'paper', seed: 73, border: bord, shade: 0.6 });
      SP.piece(g, S.blob(430, 230, 160, 76, { seed: 74, wobble: 0.06 }).map(([x, y]) => [x, y + (x - 430) * 0.4]), { color: '#6fb33a', kind: 'paper', seed: 74, border: bord, shade: 0.6 });
      g.strokeStyle = 'rgba(0,70,30,0.5)'; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(300, 305); g.quadraticCurveTo(210, 250, 70, 300); g.stroke();
      g.beginPath(); g.moveTo(318, 300); g.quadraticCurveTo(430, 230, 580, 290); g.stroke();
    } else if (k.startsWith('bola_')) {   // bolinha de nutriente de papel com a letra recortada: N verde · P âmbar · K azul
      const L = k.slice(5).toUpperCase(), col = { N: '#5ca032', P: '#e39a2d', K: '#3a7ca5' }[L];
      SP.piece(g, S.blob(210, 210, 180, 180, { seed: 60 + L.charCodeAt(0), wobble: 0.02, n: 80 }), { color: col, kind: 'paper', seed: 61, border: bord, shade: 0.8, edge: 0.2 });
      g.fillStyle = 'rgba(255,255,255,0.28)'; g.beginPath(); g.ellipse(150, 140, 50, 30, -0.6, 0, TAU); g.fill();
      SP.piece(g, S.rrect(120, 110, 180, 190, 18, { seed: 62 }), { color: '#fbf8f0', kind: 'smooth', seed: 62, shade: 0.2, edge: 0.1 });
      g.fillStyle = col; g.font = '700 190px "Archivo Black", "Luckiest Guy", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(L, 210, 214);
    } else if (k === 'bolota') {   // bolota de sobras (ep. 21): bolinha de feltro com arroz, ervilha e cenoura grudados na borda — o rosto vem do item
      SP.piece(g, S.blob(210, 214, 176, 170, { seed: 301, wobble: 0.05, n: 90 }), { color: '#c98a45', kind: 'felt', seed: 301, border: bord, shade: 0.85, edge: 0.25 });
      const rr = RNG(302), nas = (d0, d1) => { const a = rr.range(0, TAU), d = rr.range(d0, d1) * 160; return [210 + Math.cos(a) * d, 214 + Math.sin(a) * d]; };
      g.fillStyle = '#fbf6e8'; g.strokeStyle = 'rgba(120,80,40,0.35)'; g.lineWidth = 2;
      for (let i = 0; i < 26; i++) { const [x, y] = nas(0.6, 0.93); g.save(); g.translate(x, y); g.rotate(rr.range(0, TAU)); g.beginPath(); g.ellipse(0, 0, 12, 5.5, 0, 0, TAU); g.fill(); g.stroke(); g.restore(); }
      for (let i = 0; i < 6; i++) { const [x, y] = nas(0.62, 0.9); SP.piece(g, S.blob(x, y, 15, 15, { seed: 303 + i }), { color: '#6fb33a', kind: 'felt', seed: 303 + i, border: { w: 4 }, shade: 0.6 }); }
      for (let i = 0; i < 4; i++) { const [x, y] = nas(0.6, 0.88); SP.piece(g, S.rrect(x - 13, y - 13, 26, 26, 5, { seed: 310 + i }), { color: '#f08a2c', kind: 'felt', seed: 310 + i, border: { w: 4 }, shade: 0.6 }); }
      SP.piece(g, S.blob(318, 74, 64, 30, { seed: 315, wobble: 0.12 }).map(([x, y]) => [x, y + (x - 318) * 0.35]), { color: '#8fd14f', kind: 'paper', seed: 315, border: { w: 6 }, shade: 0.5 });
      g.fillStyle = 'rgba(255,240,215,0.28)'; g.beginPath(); g.ellipse(138, 128, 44, 26, -0.6, 0, TAU); g.fill();
    } else if (k === 'domino') {   // dominó de papel em pé (metade de cima e de baixo com pintas)
      SP.piece(g, S.rrect(16, 16, 118, 388, 16, { seed: 321 }), { color: '#fbf8f0', kind: 'paper', seed: 321, border: { w: 10 }, shade: 0.8, edge: 0.3 });
      g.fillStyle = '#1b2a33'; g.fillRect(28, 206, 94, 8);
      for (const [x, y] of [[52, 70], [98, 150], [75, 110], [52, 260], [98, 260], [52, 350], [98, 350]]) { g.beginPath(); g.arc(x, y, 12, 0, TAU); g.fill(); }
    } else if (k === 'tabua') {   // tábua de papelão (rampa, escorregador, prateleira): borda ondulada e veios
      SP.piece(g, S.rrect(8, 8, 984, 48, 10, { seed: 331 }), { color: '#b98a55', kind: 'cardboard', seed: 331, border: { w: 6 }, shade: 0.8, edge: 0.3 });
      g.strokeStyle = 'rgba(90,55,25,0.35)'; g.lineWidth = 3;
      for (let x = 30; x < 980; x += 22) { g.beginPath(); g.arc(x, 50, 9, Math.PI, TAU); g.stroke(); }
      g.strokeStyle = 'rgba(90,55,25,0.25)'; g.beginPath(); g.moveTo(40, 22); g.bezierCurveTo(300, 16, 600, 30, 960, 20); g.stroke();
    } else if (k === 'chao') {   // chão da máquina: faixa de grama de feltro sobre a prateleira de papelão ondulado
      SP.piece(g, S.rrect(0, 46, 1000, 100, 8, { seed: 341 }), { color: '#a57a4a', kind: 'cardboard', seed: 341, shade: 0.8, edge: 0.3 });
      g.strokeStyle = 'rgba(70,40,15,0.35)'; g.lineWidth = 4;
      for (let x = 10; x < 1000; x += 26) { g.beginPath(); g.arc(x, 146, 11, Math.PI, TAU); g.stroke(); }
      const pts = [[0, 60]]; for (let x = 0; x <= 1000; x += 25) pts.push([x, 22 + ((x / 25) % 2 ? 14 : 0) + Math.sin(x * 0.07) * 4]); pts.push([1000, 64], [0, 64]);
      SP.piece(g, pts, { color: '#6fb33a', kind: 'felt', seed: 342, shade: 0.6 });
    } else if (k.startsWith('marca_')) {   // selo de letra da máquina maluca (A, B, C…): como nos cartuns de reação em cadeia
      SP.piece(g, S.blob(110, 110, 92, 92, { seed: 350 + k.charCodeAt(6), wobble: 0.015, n: 70 }), { color: '#fbf8f0', kind: 'paper', seed: 351, border: bord, shade: 0.7, edge: 0.2 });
      g.strokeStyle = '#1e3e4c'; g.lineWidth = 10; g.beginPath(); g.arc(110, 110, 74, 0, TAU); g.stroke();
      g.fillStyle = '#e4572e'; g.font = '700 104px "Archivo Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(k.slice(6), 110, 116);
    } else if (k === 'ru') {   // restaurante universitário de papelão: fachada, toldo listrado, portas, janelas, placa RU e o relógio no frontão
      SP.piece(g, [[90, 250], [450, 70], [810, 250]], { color: '#e4572e', kind: 'cardboard', seed: 361, border: bord, shade: 0.8 });
      SP.piece(g, S.rrect(110, 240, 680, 560, 10, { seed: 362 }), { color: '#f2e2c0', kind: 'cardboard', seed: 362, border: bord, shade: 0.8, edge: 0.3 });
      SP.piece(g, S.blob(450, 180, 64, 64, { seed: 363, wobble: 0.01 }), { color: '#fbf8f0', seed: 363, border: { w: 8 } });
      SP.piece(g, S.rrect(250, 262, 400, 92, 14, { seed: 364 }), { color: '#1e5f8c', kind: 'paper', seed: 364, border: { w: 8 }, shade: 0.5 });
      g.fillStyle = '#fbf8f0'; g.font = '700 70px "Archivo Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('RU', 450, 312);
      for (let i = 0; i < 8; i++) SP.piece(g, [[130 + i * 80, 380], [210 + i * 80, 380], [200 + i * 80, 450], [140 + i * 80, 450]], { color: i % 2 ? '#fbf8f0' : '#2e9e5b', kind: 'paper', seed: 365 + i, shade: 0.4 });
      for (const x of [170, 590]) { SP.piece(g, S.rrect(x, 490, 140, 130, 8, { seed: 370 + x }), { color: '#8ec5d6', kind: 'paper', seed: 370 + x, border: { w: 8 }, shade: 0.6 }); g.strokeStyle = 'rgba(30,62,76,0.6)'; g.lineWidth = 6; g.beginPath(); g.moveTo(x + 70, 494); g.lineTo(x + 70, 616); g.moveTo(x + 4, 555); g.lineTo(x + 136, 555); g.stroke(); }
      SP.piece(g, S.rrect(360, 520, 180, 280, 10, { seed: 375 }), { color: '#8b5a3c', kind: 'cardboard', seed: 375, border: { w: 8 }, shade: 0.7 });
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(446, 530, 8, 262);
      g.fillStyle = '#f2c14e'; for (const x of [430, 470]) { g.beginPath(); g.arc(x, 670, 9, 0, TAU); g.fill(); }
      SP.piece(g, S.rrect(700, 300, 90, 70, 8, { seed: 376 }), { color: '#3a4146', kind: 'paper', seed: 376, border: { w: 6 } });   // janela de devolução das bandejas (lado direito)
    } else if (k === 'lixo') {   // lixeira comum cinza (sem tampa: a tampa é outra peça, que abre e fecha)
      SP.piece(g, [[40, 20], [320, 20], [296, 420], [64, 420]], { color: '#7d8a90', kind: 'paper', seed: 381, border: bord, shade: 0.9, edge: 0.3 });
      g.strokeStyle = 'rgba(30,40,45,0.35)'; g.lineWidth = 8; for (const x of [120, 180, 240]) { g.beginPath(); g.moveTo(x, 70); g.lineTo(x + (x - 180) * 0.1, 380); g.stroke(); }
      SP.piece(g, S.rrect(80, 170, 200, 80, 10, { seed: 382 }), { color: '#fbf8f0', kind: 'paper', seed: 382, border: { w: 6 } });
      g.fillStyle = '#3a4146'; g.font = '700 54px "Archivo Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('LIXO', 180, 212);
    } else if (k === 'tampa') {   // tampa da lixeira com alça
      SP.piece(g, S.rrect(10, 36, 380, 44, 14, { seed: 391 }), { color: '#5d686d', kind: 'paper', seed: 391, border: { w: 8 }, shade: 0.9, edge: 0.3 });
      SP.piece(g, S.rrect(150, 10, 100, 34, 12, { seed: 392 }), { color: '#3a4146', kind: 'paper', seed: 392, border: { w: 6 } });
    } else if (k === 'botao') {   // botão vermelho grande numa base cinza
      SP.piece(g, S.rrect(10, 110, 240, 70, 14, { seed: 401 }), { color: '#5d686d', kind: 'paper', seed: 401, border: bord, shade: 0.8 });
      SP.piece(g, S.blob(130, 104, 86, 56, { seed: 402, wobble: 0.01 }), { color: '#e4572e', kind: 'paper', seed: 402, border: { w: 8 }, shade: 0.9, edge: 0.3 });
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(100, 84, 30, 13, -0.2, 0, TAU); g.fill();
    } else if (k === 'copinho') {   // copinho plástico listrado (o que não é comida)
      SP.piece(g, [[20, 20], [150, 20], [128, 196], [42, 196]], { color: '#fbf8f0', kind: 'smooth', seed: 411, border: { w: 8 }, shade: 0.7 });
      g.fillStyle = '#39a7cf'; for (const y of [60, 110, 160]) { const w0 = 62 - (y - 20) * 0.12; g.fillRect(85 - w0, y, w0 * 2, 16); }
    } else if (k === 'guardanapo') {   // guardanapo amassado
      SP.piece(g, S.blob(100, 90, 82, 64, { seed: 421, wobble: 0.22, n: 40 }), { color: '#fbf8f0', kind: 'paper', seed: 421, border: { w: 8 }, shade: 0.9, edge: 0.4 });
      g.strokeStyle = 'rgba(120,120,110,0.4)'; g.lineWidth = 4; for (const [a, b, c, d] of [[50, 70, 120, 110], [90, 40, 140, 90], [60, 120, 110, 60]]) { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }
    } else if (k === 'esteira') {   // esteira de devolução das bandejas: correia escura sobre roletes
      SP.piece(g, S.rrect(8, 20, 1584, 58, 29, { seed: 431 }), { color: '#3a4146', kind: 'paper', seed: 431, border: { w: 8 }, shade: 0.8 });
      g.fillStyle = '#9aa5aa'; for (let x = 40; x < 1580; x += 64) { g.beginPath(); g.arc(x, 49, 17, 0, TAU); g.fill(); }
      for (const x of [160, 800, 1440]) SP.piece(g, S.rrect(x - 12, 76, 24, 40, 4, { seed: 432 + x }), { color: '#5d686d', seed: 432 + x });
    } else if (k === 'poste') {   // poste de placa (a placa é uma etiqueta por cima)
      SP.piece(g, S.rrect(22, 10, 26, 560, 10, { seed: 441 }), { color: '#8b5a3c', kind: 'cardboard', seed: 441, border: { w: 6 } });
      SP.piece(g, S.rrect(4, 560, 62, 32, 8, { seed: 442 }), { color: '#6b4a31', kind: 'cardboard', seed: 442, border: { w: 6 } });
    } else if (k === 'ponto') {   // ponto de ônibus: poste com a placa redonda e o ônibus desenhado
      SP.piece(g, S.rrect(136, 200, 28, 540, 10, { seed: 451 }), { color: '#7d8a90', kind: 'paper', seed: 451, border: { w: 8 } });
      SP.piece(g, S.blob(150, 140, 132, 132, { seed: 452, wobble: 0.01 }), { color: '#1e5f8c', kind: 'paper', seed: 452, border: bord, shade: 0.7 });
      SP.piece(g, S.rrect(70, 90, 160, 84, 18, { seed: 453 }), { color: '#fbf8f0', seed: 453 });
      g.fillStyle = '#1e5f8c'; for (const x of [90, 132, 174]) g.fillRect(x, 102, 30, 26);
      for (const x of [104, 196]) { g.beginPath(); g.arc(x, 180, 15, 0, TAU); g.fill(); }
      SP.piece(g, S.rrect(100, 724, 100, 30, 8, { seed: 454 }), { color: '#5d686d', seed: 454 });
    } else if (k === 'quadro_antes' || k === 'quadro_depois') {   // quadro do jogo dos 7 erros (ep. 22): moldura de tinta + paisagem — antes: céu de fumaça e chão seco; depois: céu azul e grama
      const dep = k === 'quadro_depois', X0 = 30, Y0 = 30, X1 = 1470, Y1 = 970, GY = 567, rr = RNG(dep ? 481 : 471);
      g.fillStyle = '#fbf8f0'; g.fillRect(0, 0, 1500, 1000);
      const ceu = g.createLinearGradient(0, Y0, 0, GY);
      if (dep) { ceu.addColorStop(0, '#8fcbe6'); ceu.addColorStop(1, '#e2f2f6'); } else { ceu.addColorStop(0, '#8f877a'); ceu.addColorStop(1, '#cfc4aa'); }
      g.fillStyle = ceu; g.fillRect(X0, Y0, X1 - X0, GY - Y0 + 4);
      if (!dep) { g.fillStyle = 'rgba(70,62,52,0.28)'; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(rr.range(X0, X1), rr.range(Y0 + 40, GY - 160), rr.range(120, 260), rr.range(40, 80), 0, 0, TAU); g.fill(); } }   // fumaça no céu
      const morro = (y0, amp, cor, seed) => { const pts = [[X0, GY + 4]]; for (let x = X0; x <= X1; x += 30) pts.push([x, y0 - amp * (0.55 + 0.45 * Math.sin(x * 0.004 + seed)) * (0.8 + 0.2 * Math.sin(x * 0.013 + seed * 2))]); pts.push([X1, GY + 4]); return pts; };
      SP.piece(g, morro(GY - 40, 150, 0, dep ? 1.3 : 2.1), { color: dep ? '#9ccf7e' : '#b8a984', kind: 'paper', seed: 473, shade: 0.4 });
      SP.piece(g, morro(GY + 2, 70, 0, dep ? 3.7 : 4.4), { color: dep ? '#7fbf57' : '#a99468', kind: 'paper', seed: 474, shade: 0.4 });
      SP.piece(g, [[X0, GY], [X1, GY], [X1, Y1], [X0, Y1]], { color: dep ? '#6fb33a' : '#a6875a', kind: dep ? 'felt' : 'kraft', seed: 475, shade: 0.5 });
      SP.piece(g, [[620, GY], [760, GY], [1010, Y1], [420, Y1]], { color: dep ? '#d9c79c' : '#bfa47a', kind: 'kraft', seed: 476, shade: 0.4 });   // estradinha de terra
      if (dep) { g.fillStyle = 'rgba(40,110,30,0.45)'; for (let i = 0; i < 70; i++) { const x = rr.range(X0 + 10, X1 - 10), y = rr.range(GY + 20, Y1 - 10); if (x > 400 && x < 1030 && y > GY + (x - 420) * 0) continue; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 6, y - 18); g.lineTo(x + 2, y - 4); g.lineTo(x + 8, y - 20); g.lineTo(x + 6, y); g.fill(); } }
      else { g.strokeStyle = 'rgba(80,55,30,0.5)'; g.lineWidth = 5; for (let i = 0; i < 16; i++) { let x = rr.range(X0 + 40, X1 - 40), y = rr.range(GY + 40, Y1 - 30); g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 4; j++) { x += rr.sym(40); y += rr.range(6, 20); g.lineTo(x, y); } g.stroke(); } }   // rachaduras do chão seco
      g.strokeStyle = '#1b2a33'; g.lineWidth = 18; g.strokeRect(X0, Y0, X1 - X0, Y1 - Y0);
    } else if (k === 'vazio') {   // vaga do placar do jogo dos 7 erros: círculo tracejado
      g.fillStyle = 'rgba(251,248,240,0.85)'; g.beginPath(); g.arc(110, 110, 84, 0, TAU); g.fill();
      g.setLineDash([22, 16]); g.strokeStyle = 'rgba(27,42,51,0.55)'; g.lineWidth = 10; g.beginPath(); g.arc(110, 110, 84, 0, TAU); g.stroke(); g.setLineDash([]);
    } else if (k.startsWith('achado_')) {   // diferença achada: bolacha vermelha com o número
      SP.piece(g, S.blob(110, 110, 92, 92, { seed: 490 + k.charCodeAt(7), wobble: 0.02, n: 70 }), { color: '#d7263d', kind: 'paper', seed: 491, border: bord, shade: 0.8, edge: 0.2 });
      g.fillStyle = '#fbf8f0'; g.font = '700 118px "Archivo Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(k.slice(7), 110, 118);
    } else if (k === 'cafe') {   // grão de café: oval marrom com o sulco em S
      SP.piece(g, S.blob(190, 240, 150, 205, { seed: 51, wobble: 0.03, n: 80 }), { color: '#7a4a2a', kind: 'paper', seed: 51, border: bord, shade: 0.9, edge: 0.25 });
      g.strokeStyle = '#3e2414'; g.lineWidth = 16; g.lineCap = 'round';
      g.beginPath(); g.moveTo(190, 60); g.bezierCurveTo(120, 170, 260, 300, 190, 420); g.stroke();
      g.fillStyle = 'rgba(255,230,200,0.25)'; g.beginPath(); g.ellipse(125, 150, 32, 62, 0.3, 0, TAU); g.fill();
    }
    return c;
  }

  // ---------- álbum de figurinhas (estilo P com "album": {...}) ----------
  // Peças compostas: "@fig|<apelido>|<TÍTULO>|<cor>|<nº>|<b>" (figurinha com o personagem; b = brilhante),
  // "@escudo|<apelido do ícone>|<TÍTULO>|<cor>" (escudo redondo de área), "@slot|<nº>|<TÍTULO>" (espaço vazio),
  // "@voce" (o último espaço: VOCÊ?), "@pacote", "@pacote_aberto", "@verso" (verso da figurinha).
  function textoCabe(g, txt, x, y, maxw, size, font, lh = 1.05) {   // escreve em até 2 linhas, diminuindo até caber
    const ls = String(txt).split('\n');
    let s = size;
    const med = () => { g.font = `700 ${s}px ${font}`; return Math.max(...ls.map((l) => g.measureText(l).width)); };
    while (med() > maxw && s > 10) s -= 2;
    ls.forEach((l, i) => g.fillText(l, x, y + (i - (ls.length - 1) / 2) * s * lh));
    return s;
  }
  function figurinha(parts, im) {
    const [, , tit, corNome, num, brilho] = parts, br = brilho === 'b';
    const W = 420, H = 560, c = P.canvas(W, H), g = c.getContext('2d'), col = cor(corNome, PAL.coral);
    SP.piece(g, S.rrect(14, 14, W - 28, H - 28, 26, { seed: 301 }), { color: br ? '#f2c14e' : col, kind: 'paper', seed: 301, border: { w: 12 }, shade: 0.5, edge: 0.2 });
    // janela do retrato
    const wx = 40, wy = 64, ww = W - 80, wh = 356;
    const gr = g.createLinearGradient(0, wy, 0, wy + wh); gr.addColorStop(0, '#fbf8f0'); gr.addColorStop(1, mixHex(br ? '#f2c14e' : col, '#fbf8f0', 0.55));
    g.fillStyle = gr; g.beginPath(); g.roundRect(wx, wy, ww, wh, 16); g.fill();
    g.save(); g.beginPath(); g.roundRect(wx, wy, ww, wh, 16); g.clip();
    g.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(W / 2, wy + wh); g.arc(W / 2, wy + wh, 520, Math.PI + i * 0.35, Math.PI + i * 0.35 + 0.17); g.closePath(); g.fill(); }
    if (im) { const s = Math.min(ww * 0.92 / im.width, (wh - 14) / im.height); g.drawImage(im, W / 2 - im.width * s / 2, wy + wh - im.height * s, im.width * s, im.height * s); }
    g.restore();
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 3; g.beginPath(); g.roundRect(wx, wy, ww, wh, 16); g.stroke();
    // número e selo CP2B
    SP.piece(g, S.blob(66, 60, 36, 36, { seed: 302 }), { color: '#1e3e4c', seed: 302, border: { w: 6 } });
    g.fillStyle = '#fbf8f0'; g.font = '700 30px "Archivo Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(num || '', 66, 62);
    g.fillStyle = 'rgba(255,255,255,0.9)'; g.font = '700 26px "Archivo Black", sans-serif'; g.textAlign = 'right'; g.fillText('CP2B', W - 40, 42);
    // faixa do título
    SP.piece(g, S.rrect(30, 430, W - 60, 96, 16, { seed: 303 }), { color: '#1e3e4c', kind: 'paper', seed: 303, shade: 0.3, edge: 0.1 });
    g.fillStyle = '#fbf8f0'; g.textAlign = 'center'; g.textBaseline = 'middle';
    textoCabe(g, tit.replace(/\\n/g, '\n'), W / 2, 478, W - 90, 40, '"Archivo Black", sans-serif');
    if (br) {   // brilhante: faixas de arco-íris e estrelinhas
      g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.55;
      const cs = ['#e4572e', '#f2c14e', '#b6e03b', '#8ec5d6', '#b388e0'];
      for (let i = -6; i < 12; i++) { g.fillStyle = cs[((i % 5) + 5) % 5]; g.beginPath(); g.moveTo(i * 60, 0); g.lineTo(i * 60 + 40, 0); g.lineTo(i * 60 - 260, H); g.lineTo(i * 60 - 300, H); g.closePath(); g.fill(); }
      g.restore();
      for (const [x, y, r] of [[340, 110, 22], [90, 380, 16], [360, 390, 12]]) SP.piece(g, S.star(x, y, r * 0.4, r, 4, { seed: x }), { color: '#fbf8f0', seed: 3, edge: 0 });
    }
    return c;
  }
  function escudo(parts, im) {
    const [, , tit, corNome] = parts, col = cor(corNome, PAL.verde);
    const W = 440, H = 520, c = P.canvas(W, H), g = c.getContext('2d');
    const pts = [[W / 2, 24], [W - 30, 70], [W - 40, 300], [W / 2, H - 24], [40, 300], [30, 70]];
    SP.piece(g, S.resample(pts, 6, true), { color: col, kind: 'paper', seed: 311, border: { w: 12 }, shade: 0.7, edge: 0.2 });
    SP.piece(g, S.blob(W / 2, 210, 130, 130, { seed: 312, wobble: 0.01, n: 80 }), { color: '#fbf8f0', kind: 'paper', seed: 312, shade: 0.3, edge: 0.1 });
    if (im) { const s = Math.min(200 / im.width, 200 / im.height); g.drawImage(im, W / 2 - im.width * s / 2, 210 - im.height * s / 2, im.width * s, im.height * s); }
    g.fillStyle = '#fbf8f0'; g.textAlign = 'center'; g.textBaseline = 'middle';
    textoCabe(g, tit, W / 2, 392, W - 120, 44, '"Archivo Black", sans-serif');
    return c;
  }
  function desenhoAlbum(k) {
    if (k.startsWith('slot')) {   // espaço vazio: tracejado, número grande e o título apagadinho
      const [, num, tit] = k.split('|');
      const W = 420, H = 560, c = P.canvas(W, H), g = c.getContext('2d');
      g.fillStyle = 'rgba(30,62,76,0.08)'; g.beginPath(); g.roundRect(16, 16, W - 32, H - 32, 24); g.fill();
      g.setLineDash([22, 14]); g.strokeStyle = 'rgba(30,62,76,0.5)'; g.lineWidth = 7; g.beginPath(); g.roundRect(16, 16, W - 32, H - 32, 24); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(30,62,76,0.35)'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 150px "Archivo Black", sans-serif'; g.fillText(num || '?', W / 2, 250);
      if (tit) { g.fillStyle = 'rgba(30,62,76,0.55)'; textoCabe(g, tit, W / 2, 470, W - 80, 36, '"Archivo Black", sans-serif'); }
      return c;
    }
    if (k === 'voce') {
      const W = 420, H = 560, c = P.canvas(W, H), g = c.getContext('2d');
      g.fillStyle = 'rgba(242,193,78,0.25)'; g.beginPath(); g.roundRect(16, 16, W - 32, H - 32, 24); g.fill();
      g.setLineDash([22, 14]); g.strokeStyle = '#e4572e'; g.lineWidth = 9; g.beginPath(); g.roundRect(16, 16, W - 32, H - 32, 24); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#e4572e'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 190px "Luckiest Guy", sans-serif'; g.fillText('?', W / 2, 250);
      g.font = '700 64px "Archivo Black", sans-serif'; g.fillText('VOCÊ!', W / 2, 460);
      return c;
    }
    if (k === 'pacote' || k === 'pacote_aberto' || k === 'verso') {
      const ab = k === 'pacote_aberto', W = k === 'verso' ? 420 : 460, H = k === 'verso' ? 560 : 620, c = P.canvas(W, H), g = c.getContext('2d');
      if (k === 'verso') {
        SP.piece(g, S.rrect(14, 14, W - 28, H - 28, 26, { seed: 321 }), { color: '#1e3e4c', kind: 'paper', seed: 321, border: { w: 12 }, shade: 0.5 });
        g.strokeStyle = 'rgba(182,224,59,0.6)'; g.lineWidth = 6; g.beginPath(); g.roundRect(44, 44, W - 88, H - 88, 18); g.stroke();
        g.fillStyle = '#b6e03b'; g.font = '700 88px "Archivo Black", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('CP2B', W / 2, H / 2);
        return c;
      }
      // pacotinho metalizado com dentes em cima e embaixo
      const top = ab ? 130 : 40, pts = [];
      for (let x = 30; x <= W - 30; x += 20) pts.push([x, top + ((x / 20) % 2 ? 12 : 0)]);
      for (let x = W - 30; x >= 30; x -= 20) pts.push([x, H - 40 + ((x / 20) % 2 ? 12 : 0)]);
      SP.piece(g, pts, { color: '#e4572e', kind: 'paper', seed: 331, border: { w: 12 }, shade: 0.9, edge: 0.3 });
      const gl = g.createLinearGradient(0, 0, W, H); gl.addColorStop(0, 'rgba(255,255,255,0.35)'); gl.addColorStop(0.5, 'rgba(255,255,255,0)'); gl.addColorStop(0.7, 'rgba(255,255,255,0.25)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gl; g.fillRect(30, top, W - 60, H - 40 - top);
      g.fillStyle = '#f2c14e'; g.font = '700 58px "Luckiest Guy", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('FIGURINHAS', W / 2, top + 110); g.fillStyle = '#fbf8f0'; g.font = '700 110px "Archivo Black", sans-serif'; g.fillText('CP2B', W / 2, top + 250);
      g.font = '700 30px "Archivo Black", sans-serif'; g.fillStyle = '#1e3e4c'; g.fillText('5 FIGURINHAS', W / 2, H - 110);
      if (ab) {   // aberto: figurinhas saindo pela boca do pacote
        for (const [x, r, cc] of [[140, -0.25, '#8ec5d6'], [230, 0.05, '#b6e03b'], [320, 0.3, '#f2c14e']]) {
          g.save(); g.translate(x, 110); g.rotate(r);
          SP.piece(g, S.rrect(-60, -90, 120, 160, 12, { seed: x }), { color: cc, kind: 'paper', seed: x, border: { w: 8 }, shade: 0.5 });
          g.restore();
        }
      }
      return c;
    }
    return null;
  }
  function decoraPagina(rc, b, lado, k) {   // página de álbum: bolinhas de fundo, faixa de cabeçalho e número da página
    const A = CFG.album; if (!A) return;
    const { ctx } = rc, r = pagRect(b, lado), V = FMT === 'v';
    ctx.save();
    ctx.fillStyle = 'rgba(30,62,76,0.06)';
    for (let y = r[1] + 30; y < r[3]; y += 46) for (let x = r[0] + 30 + ((Math.round(y / 46)) % 2 ? 23 : 0); x < r[2]; x += 46) { ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill(); }
    const cab = (SCENES[k].cab || [])[lado] ?? L(A.titulo) ?? '';
    const hy = r[1] + (V ? 30 : 34), hh = V ? 58 : 64, hx0 = lado || V ? r[0] + 40 : r[0] + 40, hw = (r[2] - r[0]) * (V ? 0.6 : 0.62);
    if (cab) {
      SP.piece(ctx, S.cut(rectPts(hx0, hy, hx0 + hw, hy + hh), { seed: 400 + k * 2 + lado, jitter: 1.5, ds: 40 }), { color: cor(A.faixa, PAL.coral), kind: 'paper', seed: 400 + k, edge: 0.15, shade: 0.4 });
      ctx.fillStyle = '#fbf8f0'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `700 ${V ? 30 : 32}px "Archivo Black", sans-serif`;
      ctx.fillText(cab, hx0 + 22, hy + hh / 2 + 2);
    }
    const pg = 2 + k * 2 + lado;
    ctx.fillStyle = 'rgba(30,62,76,0.45)'; ctx.font = `700 ${V ? 24 : 26}px "Archivo Black", sans-serif`; ctx.textAlign = lado ? 'right' : 'left';
    ctx.fillText(String(pg), lado ? r[2] - 30 : r[0] + 30, r[3] - 30);
    ctx.restore();
  }

  // ---------- recursos ----------
  function aliasPath(a) {
    if (a === 'sig:acena') return PERS + POSES.mascote.acena;   // assinatura: sempre o Metaninho de crochê
    if (a === 'sig:pula') return PERS + POSES.mascote.pula;
    if (a.includes(':')) {
      let [ch, pose] = a.split(':');
      if (ch === 'cientista' && CFG.estilo === 'Q') ch = 'cientista_hq';
      if (ch === 'mascote' && CFG.mascote === 'papel') ch = 'mascote_papel';
      const tb = POSES[ch];
      if (!tb || !tb[pose]) { console.warn('pose desconhecida', a); return null; }
      return PERS + tb[pose];
    }
    return (CFG.pecas && CFG.pecas[a]) || COMUM[a] || a;
  }
  async function loadAssets(R) {
    const need = new Set();
    for (const sc of SCENES) for (const it of sc.itens) { if (it.fx === 'celular') { for (const m of it.msgs || []) { if (m.p) need.add(m.p); if (m.av) need.add(m.av); } if (it.avatar) need.add(it.avatar); }
      if (it.p) need.add(it.p); for (const k of it.poses || []) need.add(k.p.includes(':') || k.p.startsWith('@') || !it.p.includes(':') ? k.p : it.p.split(':')[0] + ':' + k.p); }
    need.add('sig:acena'); need.add('sig:pula');
    if (CFG.assinatura?.cientista) need.add('cientista:acena');
    if (CFG.assinatura?.parceiro) need.add(CFG.assinatura.parceiro);
    for (const a of CFG.assinatura?.extras || []) need.add(a);
    for (const e of CFG.colcha?.enfeites || []) need.add(e.p);
    if (CFG.lousa?.viajante) need.add(CFG.lousa.viajante.p);
    if (CFG.abertura?.p) need.add(CFG.abertura.p);
    for (const sc of SCENES) { const c = sc.carga; if (c) need.add(typeof c === 'string' ? c : c.p); }
    if (CFG.estrada?.viajante) { need.add(CFG.estrada.viajante.p); if (CFG.estrada.viajante.carona) need.add(CFG.estrada.viajante.carona); }
    const base = `${R}/assets/recortes/`;
    if (CFG.capa) need.add('marca_negativo');
    await Promise.all([...need].map(async (a) => {
      if (a === 'marca' || a === 'marca_negativo') {   // logo do CP2B (SVG da marca) como peça
        try { await X.loadImages({ ['ep|' + a]: `${R}/assets/brand/cp2b-logo${a === 'marca' ? '' : '-negativo'}.svg` }); IMG.set(a, 'ep|' + a); } catch (e) { console.warn('marca ausente', a); }
        return;
      }
      if (a.startsWith('@fig|') || a.startsWith('@escudo|')) {
        const parts = a.split('|'), al = parts[1], p2 = aliasPath(al), nm = 'ep|' + al;
        try { if (!IMG.has(al)) { await X.loadImages({ [nm]: base + p2 + '.png' }); IMG.set(al, nm); } } catch (e) { console.warn('recorte ausente', al); }
        const cv = a.startsWith('@fig|') ? figurinha(parts, imgOf(al)) : escudo(parts, imgOf(al));
        X.images.set('ep|' + a, cv); IMG.set(a, 'ep|' + a); return;
      }
      if (a.startsWith('@')) { const cv = desenho(a); if (cv) { X.images.set('ep|' + a, cv); IMG.set(a, 'ep|' + a); } else console.warn('desenho desconhecido', a); return; }
      const p = aliasPath(a);
      if (!p) return;
      const name = 'ep|' + a;
      try { await X.loadImages({ [name]: base + p + '.png' }); IMG.set(a, name); } catch (e) { console.warn('recorte ausente', a, p); }
    }));
    await X.loadImages({ logo: `${R}/assets/brand/cp2b-logo.svg` });
  }
  const imgOf = (a) => (IMG.has(a) ? X.images.get(IMG.get(a)) : null);
  const DADOS = {};
  async function loadDados(R) {   // dados usados por efeitos (ex.: mapa de SP com os 645 municípios)
    const usa = (fx) => SCENES.some((sc) => sc.itens.some((it) => it.fx === fx));
    if (usa('mapa_sp') && !DADOS.sp_mapa) {
      try { DADOS.sp_mapa = await (await fetch(`${R}/assets/dados/sp_mapa.json`)).json(); } catch (e) { console.warn('sem mapa de SP', e); }
    }
  }

  // ---------- quadros (um por cena) ----------
  function buildBoards() {
    const V = FMT === 'v';
    const bw = FW * 0.9, bh = FH * 0.9;
    const rr = RNG(CFG.seed ?? 11);
    const per = CFG.percurso || 'direita';
    const n = SCENES.length;
    const cols = Math.max(2, Math.round(Math.sqrt(n * (V ? 0.6 : 1.4))));
    const posCont = {};
    if (CONT()) {
      const livres = SCENES.filter((sc) => !sc.celula && !sc.lugar_de);
      const cmC = CFG.caderno ? 1 : (CFG.grade?.colunas ?? Math.ceil(Math.sqrt(livres.length)));
      let idx = 0;
      for (const sc of SCENES) {
        if (sc.celula) posCont[sc.k] = sc.celula;
        else if (!sc.lugar_de) { const row = Math.floor(idx / cmC), c = idx % cmC; posCont[sc.k] = [row % 2 ? cmC - 1 - c : c, row]; idx++; }
      }
      for (const sc of SCENES) if (sc.lugar_de) { const o = SCENES.find((q) => q.falas.includes(sc.lugar_de)); posCont[sc.k] = o ? posCont[o.k] : [0, 0]; }
    }
    BOARDS = SCENES.map((sc, k) => {
      let x = 0, y = 0;
      if (per === 'desce') { y = k * (FH * 1.18); x = rr.sym(FW * 0.05); }
      else if (per === 'sobe') { y = -k * (FH * 1.18); x = rr.sym(FW * 0.05); }
      else if (per === 'esquerda') { x = -k * (FW * 1.22); y = rr.sym(FH * 0.05); }
      else if (per === 'quadros') { x = (k % cols) * (FW * 1.04); y = Math.floor(k / cols) * (FH * 1.04); }
      else if (per === 'zigue') { x = k * (FW * 1.1); y = (k % 2 ? 1 : -1) * FH * 0.32; }
      else { x = k * (FW * 1.22); y = rr.sym(FH * 0.05); }
      if (LIVRO()) { x = 0; y = 0; }
      if (CONT()) { const [c, r] = posCont[k]; x = c * FW; y = r * FH; }   // maquete / colcha / mesa / caderno / estrada: áreas encostadas
      const rot = per === 'quadros' || LIVRO() || CONT() ? 0 : rr.sym(0.018);
      const col = sc.folha ? cor(sc.folha) : EST.folhas[k % EST.folhas.length];
      const seed = 100 + k * 7;
      const q = (V && sc.quadroV) || sc.quadro || [1, 1], qw = bw * q[0], qh = bh * q[1];   // "quadro": [2, 2] = folha do tamanho de 2×2 telas (mural)
      const poly = S.tear(S.cut([[-qw / 2, -qh / 2], [qw / 2, -qh / 2], [qw / 2, qh / 2], [-qw / 2, qh / 2]], { seed, jitter: 2.5, ds: 40 }), { amp: EST.borda === 'rasgada' ? 5 : 1.2, seed: seed + 1 });
      return { x, y, rot, w: qw, h: qh, col, seed, poly, k };
    });
    // decoração da mesa (estilo colagem)
    DECOR = [];
    if (EST.decor) {
      const b0 = BOARDS.reduce((a, b) => ({ x0: Math.min(a.x0, b.x - b.w), y0: Math.min(a.y0, b.y - b.h), x1: Math.max(a.x1, b.x + b.w), y1: Math.max(a.y1, b.y + b.h) }), { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 });
      const cols2 = [PAL.lima, PAL.amarelo, PAL.coral, PAL.ceu, PAL.verde, PAL.ambar];
      for (let k = 0; k < 90 + n * 18; k++) {
        const x = rr.range(b0.x0, b0.x1), y = rr.range(b0.y0, b0.y1);
        if (BOARDS.some((b) => Math.abs(x - b.x) < b.w / 2 + 40 && Math.abs(y - b.y) < b.h / 2 + 40)) continue;
        DECOR.push({ x, y, rot: rr.range(0, TAU), s: rr.range(0.7, 1.4), col: rr.pick(cols2), kind: rr.pick(['estrela', 'ponto', 'folha', 'confete', 'espiral']), seed: k });
      }
    }
  }
  let DECOR = [];

  function drawMesa(rc) {
    const { ctx } = rc, v = rc.view;
    ctx.fillStyle = P.pattern(ctx, EST.mesa[0], EST.mesa[1], { seed: 7, scale: 1.6 });
    ctx.fillRect(v.x0 - 50, v.y0 - 50, v.x1 - v.x0 + 100, v.y1 - v.y0 + 100);
    if (CFG.estilo === 'Q') {   // retícula de quadrinhos na mesa
      ctx.fillStyle = 'rgba(228,87,46,0.22)';
      const st = 26, x0 = Math.floor(v.x0 / st) * st, y0 = Math.floor(v.y0 / st) * st;
      for (let y = y0; y < v.y1; y += st) for (let x = x0 + ((y / st) % 2 ? st / 2 : 0); x < v.x1; x += st) { ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill(); }
    }
    if (CFG.estilo === 'B') {
      ctx.strokeStyle = 'rgba(234,244,251,0.08)'; ctx.lineWidth = 2;
      const st = 120, x0 = Math.floor(v.x0 / st) * st, y0 = Math.floor(v.y0 / st) * st;
      ctx.beginPath();
      for (let x = x0; x < v.x1; x += st) { ctx.moveTo(x, v.y0); ctx.lineTo(x, v.y1); }
      for (let y = y0; y < v.y1; y += st) { ctx.moveTo(v.x0, y); ctx.lineTo(v.x1, y); }
      ctx.stroke();
    }
    for (const d of DECOR) {
      if (!rc.visible(d.x, d.y, 80)) continue;
      ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.rot); ctx.scale(d.s, d.s);
      if (d.kind === 'estrela') SP.piece(ctx, S.star(0, 0, 14, 34, 5, { seed: d.seed }), { color: d.col, seed: d.seed, shadow: { zoom: rc.zoom }, border: { w: 4 } });
      else if (d.kind === 'ponto') SP.piece(ctx, S.blob(0, 0, 16, 16, { seed: d.seed }), { color: d.col, seed: d.seed, shadow: { zoom: rc.zoom } });
      else if (d.kind === 'folha') SP.piece(ctx, S.blob(0, 0, 38, 14, { seed: d.seed, wobble: 0.12 }), { color: PAL.verde, seed: d.seed, shadow: { zoom: rc.zoom }, ink: { w: 2.5, boil: rc.boil } });
      else if (d.kind === 'espiral') { const pts = []; for (let a = 0; a < 12; a += 0.2) pts.push([Math.cos(a) * a * 3.2, Math.sin(a) * a * 3.2]); I.stroke(ctx, pts, { w: 4, color: 'rgba(27,42,51,0.55)', seed: d.seed, boil: rc.boil }); }
      else SP.piece(ctx, S.rrect(-14, -8, 28, 16, 2, { seed: d.seed }), { color: d.col, seed: d.seed, shadow: { zoom: rc.zoom } });
      ctx.restore();
    }
  }

  // ---------- maquete (estilo D com "maquete": true): uma única folha de papelão, cenas lado a lado em "cobrinha" ----------
  // A câmera anda de uma área para a vizinha (no tempo da música) e uma trilha de gotas escuras liga as áreas,
  // aparecendo enquanto a câmera passa — como pegadas que o detetive segue. No fim, "recua" mostra a maquete inteira.
  let MAQ = null, TRILHA = [], PONTOS = [];
  function CONT() { return !!(CFG.maquete || CFG.colcha || CFG.mesa || CFG.caderno || CFG.estrada || CFG.lousa || CFG.jogo); }   // quadros encostados numa superfície só
  function buildMaquete() {
    if (!CONT()) { MAQ = null; TRILHA = []; PONTOS = []; return; }
    const V = FMT === 'v', m = CFG.colcha ? -64 : CFG.mesa || CFG.estrada ? -40 : CFG.caderno ? -20 : CFG.lousa ? 20 : CFG.jogo ? -60 : 30;
    const xs = BOARDS.map((b) => b.x), ys = BOARDS.map((b) => b.y);
    MAQ = { x0: Math.min(...xs) - FW / 2 + m, x1: Math.max(...xs) + FW / 2 - m, y0: Math.min(...ys) - FH / 2 + m, y1: Math.max(...ys) + FH / 2 - m };
    MAQ.poly = S.tear(S.cut(rectPts(MAQ.x0, MAQ.y0, MAQ.x1, MAQ.y1), { seed: 5, jitter: 3, ds: 60 }), { amp: 1.4, seed: 6 });
    // caminho da trilha: pela faixa de baixo de cada área; na troca de fileira, desce pela margem de fora
    const off = FH * (V ? 0.4 : CFG.colcha ? 0.425 : 0.44), lado = FW * 0.46;
    const P = BOARDS.map((b) => [b.x, b.y + off]);
    const pts = [];
    for (let k = 0; k + 1 < BOARDS.length; k++) {
      const a = P[k], b = P[k + 1], seg = [];
      if (Math.abs(a[0] - b[0]) < 1 && Math.abs(a[1] - b[1]) < 1) continue;   // mesma área ("lugar_de")
      if (Math.abs(a[1] - b[1]) < 1) seg.push(a, b);
      else { const s = b[1] < a[1] ? -1 : BOARDS[k].x >= Math.max(...xs) - 1 ? 1 : -1; seg.push(a, [a[0] + s * lado, a[1]], [a[0] + s * lado, b[1]], b); }   // subindo: pela margem esquerda
      pts.push({ k: k + 1, seg });
    }
    // colcha: a linha de lã é costurada (com a agulha na ponta) enquanto a câmera passa
    PONTOS = CFG.colcha || CFG.caderno ? pts.map(({ k, seg }) => { const c = CAMS[k]; const P = S.resample(seg, 4, false); return { P, L: S.length(P), ta: c.t0 - c.pan - 0.12, tb: c.t0 + 0.08, k }; }) : [];
    // gotas a cada ~66 px; cada trecho aparece durante a passagem da câmera para a área seguinte
    TRILHA = [];
    if (CFG.colcha || CFG.caderno || CFG.estrada || CFG.lousa || CFG.jogo) return;
    for (const { k, seg } of pts) {
      const c = CAMS[k], ta = c.t0 - c.pan - 0.15, tb = c.t0 + 0.1;
      let tot = 0; const L2 = [];
      for (let i = 1; i < seg.length; i++) { const l = Math.hypot(seg[i][0] - seg[i - 1][0], seg[i][1] - seg[i - 1][1]); L2.push(l); tot += l; }
      const nGotas = Math.max(2, Math.round(tot / 66));
      for (let j = 0; j < nGotas; j++) {
        let dist = (j + 0.5) / nGotas * tot, i = 0;
        while (i < L2.length - 1 && dist > L2[i]) { dist -= L2[i]; i++; }
        const q = dist / (L2[i] || 1), p0 = seg[i], p1 = seg[i + 1];
        const ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]), lat = (j % 2 ? 1 : -1) * 9;
        const x = p0[0] + (p1[0] - p0[0]) * q - Math.sin(ang) * lat, y = p0[1] + (p1[1] - p0[1]) * q + Math.cos(ang) * lat + snoise1(j * 0.7, k) * 5;
        TRILHA.push({ x, y, ang, t: ta + (tb - ta) * (j / nGotas), r: 11 + hrand(j, k) * 4, seed: k * 100 + j });
      }
    }
  }
  function gota(ctx, x, y, r, ang, s, zoom) {   // gotinha de vinhaça (ponta para onde a trilha segue)
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang + Math.PI / 2); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, -r * 1.9); ctx.bezierCurveTo(r * 0.9, -r * 0.7, r * 1.05, r * 0.2, r * 0.95, r * 0.45);
    ctx.arc(0, r * 0.35, r, 0.1, Math.PI - 0.1); ctx.bezierCurveTo(-r * 1.05, r * 0.2, -r * 0.9, -r * 0.7, 0, -r * 1.9); ctx.closePath();
    SP.setShadow(ctx, zoom, 0, 0.6); ctx.fillStyle = '#3a2416'; ctx.fill(); SP.clearShadow(ctx);
    ctx.fillStyle = 'rgba(255,240,220,0.35)'; ctx.beginPath(); ctx.ellipse(-r * 0.35, r * 0.05, r * 0.22, r * 0.34, -0.4, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function grao(ctx, x, y, r, ang, s, zoom) {   // grão de café da trilha da mesa
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang + 0.5); ctx.scale(s, s);
    SP.setShadow(ctx, zoom, 0, 0.6); ctx.fillStyle = '#6b3f24'; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.8, r * 1.1, 0, 0, TAU); ctx.fill(); SP.clearShadow(ctx);
    ctx.strokeStyle = '#2e1a0e'; ctx.lineWidth = r * 0.22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -r * 0.85); ctx.bezierCurveTo(-r * 0.45, -r * 0.3, r * 0.45, r * 0.3, 0, r * 0.85); ctx.stroke();
    ctx.restore();
  }
  function drawToalha(ctx, zoom) {   // toalha xadrez (vichy) coral sobre creme, com barra costurada
    SP.piece(ctx, MAQ.poly, { color: '#fbf3e4', kind: 'smooth', seed: 5, shadow: { zoom, strength: 1 }, edge: 0.08, shade: 0.25 });
    ctx.save(); ctx.beginPath(); S.trace(ctx, MAQ.poly, true); ctx.clip();
    const st = 96;
    ctx.fillStyle = 'rgba(228,87,46,0.1)';
    for (let x = Math.floor(MAQ.x0 / st) * st; x < MAQ.x1; x += st * 2) ctx.fillRect(x, MAQ.y0, st, MAQ.y1 - MAQ.y0);
    for (let y = Math.floor(MAQ.y0 / st) * st; y < MAQ.y1; y += st * 2) ctx.fillRect(MAQ.x0, y, MAQ.x1 - MAQ.x0, st);
    ctx.restore();
    I.dashed(ctx, rectPts(MAQ.x0 + 26, MAQ.y0 + 26, MAQ.x1 - 26, MAQ.y1 - 26).concat([[MAQ.x0 + 26, MAQ.y0 + 26]]), { dash: 24, gap: 16, w: 4, color: 'rgba(160,50,20,0.55)', seed: 6, boil: 0 });
  }
  function drawMaquete(rc) {
    const { ctx, t } = rc;
    if (CFG.mesa) drawToalha(ctx, rc.zoom);
    else {
      SP.piece(ctx, MAQ.poly, { color: EST.folhas[0], kind: EST.kind, seed: 5, shadow: { zoom: rc.zoom, strength: 1 }, edge: 0.14, shade: 0.45 });
      for (const [x, y, a] of [[MAQ.x0 + 70, MAQ.y0 + 22, -0.6], [MAQ.x1 - 70, MAQ.y0 + 22, 0.6], [MAQ.x0 + 70, MAQ.y1 - 22, 0.6], [MAQ.x1 - 70, MAQ.y1 - 22, -0.6]]) SP.tape(ctx, x, y, 170, 52, a, { seed: 3 + x, zoom: rc.zoom });
    }
    for (const g of TRILHA) {
      if (t < g.t) continue;
      if (!rc.visible(g.x, g.y, 40)) continue;
      (CFG.mesa ? grao : gota)(ctx, g.x, g.y, g.r, g.ang, E.outBack(clamp((t - g.t) / 0.25), 2), rc.zoom);
    }
    SCENES.forEach((sc, k) => {
      const b = BOARDS[k];
      if (!rc.visible(b.x, b.y, Math.hypot(FW, FH) / 2)) return;
      ctx.save(); ctx.translate(b.x, b.y);
      const order = sc.itens.slice().sort((a, c) => (a.fundo ? -1 : 0) - (c.fundo ? -1 : 0) || (a.z ?? 0) - (c.z ?? 0));
      for (const it of order) drawItem(rc, sc, it);
      ctx.restore();
    });
  }

  // ---------- colcha de retalhos (estilo F com "colcha": true) ----------
  // Cada fala é um retalho de feltro costurado aos vizinhos (em cobrinha, como a maquete); botões nas emendas,
  // viés com pesponto em volta. Na passagem de um retalho ao outro, a agulha costura uma linha de lã entre eles.
  // "colcha": { "enfeites": [{ "p": "alfineteira", "retalho": 0, "pos": [u, v], "h": 380, "rot": 0.1 }] } enfeita os retalhos vazios.
  const LA = '#e4572e';
  function agulha(ctx, x, y, ang, zoom) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(2, 2);
    SP.setShadow(ctx, zoom, 0.5, 0.8);
    const g = ctx.createLinearGradient(0, -6, 0, 6);
    g.addColorStop(0, '#f4f6f7'); g.addColorStop(0.5, '#b8c0c4'); g.addColorStop(1, '#7d878c');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(78, 0); ctx.quadraticCurveTo(40, -5.5, -34, -5.5); ctx.arc(-34, 0, 5.5, -Math.PI / 2, Math.PI / 2, true); ctx.quadraticCurveTo(40, 5.5, 78, 0); ctx.closePath(); ctx.fill();
    SP.clearShadow(ctx);
    ctx.fillStyle = 'rgba(40,50,55,0.8)'; ctx.beginPath(); ctx.ellipse(-28, 0, 6, 2, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function botao(ctx, x, y, r, col, seed, zoom) {
    SP.piece(ctx, S.blob(x, y, r, r, { seed }), { color: col, kind: 'felt', seed, shadow: { zoom }, ink: { w: 2 } });
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r * 0.72, 0, TAU); ctx.stroke();
    const h = r * 0.3;
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; for (const [dx, dy] of [[-h, -h], [h, -h], [-h, h], [h, h]]) { ctx.beginPath(); ctx.arc(x + dx, y + dy, r * 0.13, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#f3ead8'; ctx.lineWidth = r * 0.12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - h, y - h); ctx.lineTo(x + h, y + h); ctx.moveTo(x + h, y - h); ctx.lineTo(x - h, y + h); ctx.stroke();
  }
  let RETALHOS = null;
  function retalhos() {   // todas as células da grade (com ou sem cena)
    if (RETALHOS && RETALHOS.fmt === FMT) return RETALHOS;
    const g = 15, cells = [];
    const xs = BOARDS.map((b) => b.x), ys = BOARDS.map((b) => b.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    let vaz = 0;
    for (let y = y0; y <= y1 + 1; y += FH) for (let x = x0; x <= x1 + 1; x += FW) {
      const b = BOARDS.find((q) => Math.abs(q.x - x) < 1 && Math.abs(q.y - y) < 1);
      const seed = 300 + cells.length * 11;
      const col = b ? b.col : EST.folhas[(cells.length + 2) % EST.folhas.length];
      const poly = S.cut(rectPts(x - FW / 2 + g, y - FH / 2 + g, x + FW / 2 - g, y + FH / 2 - g), { seed, jitter: 2, ds: 50 });
      cells.push({ x, y, col, seed, poly, vazio: !b, iv: b ? -1 : vaz++ });
    }
    const pinos = [];
    const cols = [PAL.coral, PAL.ambar, PAL.lima, '#8ec5d6', PAL.amarelo];
    for (let y = y0 - FH / 2 + FH; y < y1 + FH / 2 - 1; y += FH) for (let x = x0 - FW / 2 + FW; x < x1 + FW / 2 - 1; x += FW) pinos.push([x, y, cols[pinos.length % cols.length]]);
    RETALHOS = { fmt: FMT, cells, pinos, box: { x0: x0 - FW / 2, y0: y0 - FH / 2, x1: x1 + FW / 2, y1: y1 + FH / 2 } };
    return RETALHOS;
  }
  function drawColcha(rc) {
    const { ctx, t } = rc, z = rc.zoom;
    const R = retalhos(), B = R.box, vb = 58;
    // viés (borda) coral e o forro azul-petróleo que aparece nas emendas
    SP.piece(ctx, S.cut(rectPts(B.x0 - vb, B.y0 - vb, B.x1 + vb, B.y1 + vb), { seed: 8, jitter: 2, ds: 60 }), { color: PAL.coral, kind: 'felt', seed: 8, shadow: { zoom: z, strength: 1.1 }, edge: 0.12 });
    I.dashed(ctx, rectPts(B.x0 - vb / 2, B.y0 - vb / 2, B.x1 + vb / 2, B.y1 + vb / 2).concat([[B.x0 - vb / 2, B.y0 - vb / 2]]), { dash: 26, gap: 16, w: 5, color: '#fbf8f0', seed: 9, boil: 0 });
    ctx.fillStyle = P.pattern(ctx, '#27495a', 'felt', { seed: 4 }); ctx.fillRect(B.x0 - 2, B.y0 - 2, B.x1 - B.x0 + 4, B.y1 - B.y0 + 4);
    for (const c of R.cells) {
      if (!rc.visible(c.x, c.y, Math.hypot(FW, FH) / 2 + 40)) continue;
      SP.piece(ctx, c.poly, { color: c.col, kind: 'felt', seed: c.seed, shadow: { zoom: z, strength: 0.7 }, edge: 0.1, shade: 0.3 });
      const e = 36;
      I.dashed(ctx, rectPts(c.x - FW / 2 + e, c.y - FH / 2 + e, c.x + FW / 2 - e, c.y + FH / 2 - e).concat([[c.x - FW / 2 + e, c.y - FH / 2 + e]]), { dash: 20, gap: 15, w: 4, color: shade(c.col, -0.42), seed: c.seed, boil: 0 });
      if (c.vazio) {
        for (const en of (CFG.colcha?.enfeites || []).filter((q) => (q.retalho ?? 0) === c.iv)) {
          const im = imgOf(en.p); if (!im) continue;
          const pos = (FMT === 'v' && en.posV) || en.pos || [0, 0], h = (FMT === 'v' && en.hV) || en.h || 360;
          X.img(ctx, IMG.get(en.p), c.x + pos[0] * FW, c.y + pos[1] * FH, { s: h / im.height, rot: en.rot ?? 0 });
        }
      }
    }
    // linha de lã costurada entre os retalhos (por baixo das peças)
    for (const s of PONTOS) {
      const p = clamp((t - s.ta) / (s.tb - s.ta));
      if (p <= 0) continue;
      I.dashed(ctx, s.P, { dash: 30, gap: 20, w: 8, color: LA, seed: 50 + s.k, boil: 0, progress: p, jitter: 0.5 });
      if (p < 1) {
        let d = p * s.L, i = 1;
        for (; i < s.P.length - 1; i++) { const l = Math.hypot(s.P[i][0] - s.P[i - 1][0], s.P[i][1] - s.P[i - 1][1]); if (d <= l) break; d -= l; }
        const a = s.P[i - 1], b = s.P[i], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        const bob = Math.sin(p * s.L / 50 * Math.PI) * 7;   // a agulha sobe e desce a cada ponto
        agulha(ctx, a[0] - Math.sin(ang) * bob, a[1] + Math.cos(ang) * bob, ang, z);
      }
    }
    for (const [x, y, col] of R.pinos) if (rc.visible(x, y, 60)) botao(ctx, x, y, 30, col, Math.round(x + y), z);
    SCENES.forEach((sc, k) => {
      const b = BOARDS[k];
      if (!rc.visible(b.x, b.y, Math.hypot(FW, FH) / 2)) return;
      ctx.save(); ctx.translate(b.x, b.y);
      const order = sc.itens.slice().sort((a, c) => (a.fundo ? -1 : 0) - (c.fundo ? -1 : 0) || (a.z ?? 0) - (c.z ?? 0));
      for (const it of order) drawItem(rc, sc, it);
      ctx.restore();
    });
  }

  // ---------- caderno de campo em mergulho (estilo N com "caderno": { "solo": 4.55 }) ----------
  // Uma página comprida de caderno (uma coluna de áreas). Acima de "solo" (linha do chão, em fileiras: 4.55 = 55% da
  // 5ª fileira) é papel pautado de anotações; abaixo, camadas de solo de papel cada vez mais escuras. Entre as áreas,
  // um lápis risca a trilha tracejada enquanto a câmera desce (e, se uma cena volta para cima, sobe pela margem).
  function lapis(ctx, x, y, ang, zoom) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(1.6, 1.6);
    SP.setShadow(ctx, zoom, 0.5, 0.8);
    ctx.fillStyle = '#f2c14e'; ctx.fillRect(-120, -9, 96, 18); SP.clearShadow(ctx);
    ctx.fillStyle = '#e8b33a'; ctx.fillRect(-120, -2, 96, 4);
    ctx.fillStyle = '#e8a0a0'; ctx.fillRect(-138, -9, 14, 18); ctx.fillStyle = '#b8c0c4'; ctx.fillRect(-126, -9, 6, 18);
    ctx.fillStyle = '#f3d9b0'; ctx.beginPath(); ctx.moveTo(-24, -9); ctx.lineTo(0, 0); ctx.lineTo(-24, 9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.moveTo(-8, -3); ctx.lineTo(0, 0); ctx.lineTo(-8, 3); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function drawCaderno(rc) {
    const { ctx, t } = rc, z = rc.zoom, v = rc.view;
    SP.piece(ctx, MAQ.poly, { color: '#eddcb9', kind: 'kraft', seed: 5, shadow: { zoom: z, strength: 1 }, edge: 0.1, shade: 0.2 });
    const yG = (CFG.caderno.solo ?? 1e9) * FH - FH / 2;
    ctx.save(); ctx.beginPath(); S.trace(ctx, MAQ.poly, true); ctx.clip();
    // pauta (acima do chão) e margem vermelha
    ctx.strokeStyle = 'rgba(70,120,160,0.22)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let y = Math.max(MAQ.y0 + 90, Math.floor(v.y0 / 58) * 58); y < Math.min(yG, v.y1 + 60, MAQ.y1); y += 58) { ctx.moveTo(MAQ.x0 + 70, y); ctx.lineTo(MAQ.x1 - 20, y); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(228,87,46,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(MAQ.x0 + 150, MAQ.y0); ctx.lineTo(MAQ.x0 + 150, Math.min(yG, MAQ.y1)); ctx.stroke();
    // solo: camadas de papel com a borda de cima ondulada
    if (yG < MAQ.y1) {
      const camadas = [[0, '#caa676'], [FH * 0.36, '#ad8152'], [FH * 0.95, '#8f663f'], [FH * 1.7, '#724e31']];
      camadas.forEach(([dy, col], i) => {
        const y0 = yG + dy + (i ? 0 : 22), pts = [];
        for (let x = MAQ.x0 - 20; x <= MAQ.x1 + 20; x += 40) pts.push([x, y0 + snoise1(x * 0.004, 30 + i) * (i ? 26 : 10)]);
        pts.push([MAQ.x1 + 20, MAQ.y1 + 20], [MAQ.x0 - 20, MAQ.y1 + 20]);
        SP.piece(ctx, pts, { color: col, kind: 'kraft', seed: 60 + i, edge: 0.12, shade: 0.2, shadow: i ? undefined : { zoom: z, strength: 0.6 } });
      });
      const rr = RNG(77);   // pedrinhas
      for (let k = 0; k < 90; k++) {
        const x = rr.range(MAQ.x0 + 40, MAQ.x1 - 40), y = rr.range(yG + 60, MAQ.y1 - 30), r = rr.range(7, 20);
        if (!rc.visible(x, y, 30)) continue;
        SP.piece(ctx, S.blob(x, y, r, r * rr.range(0.6, 0.9), { seed: k }), { color: rr.pick(['#9aa3a8', '#c9b79c', '#7c6a58']), seed: k, edge: 0.2 });
      }
      // grama de papel na linha do chão
      const gr = []; for (let x = MAQ.x0 - 10; x <= MAQ.x1 + 10; x += 22) { gr.push([x, yG + 26], [x + 11, yG - 14 - hrand(x, 3) * 18]); }
      gr.push([MAQ.x1 + 10, yG + 40], [MAQ.x0 - 10, yG + 40]);
      SP.piece(ctx, gr, { color: '#6fae3f', seed: 88, edge: 0.15, shade: 0.3 });
    }
    ctx.restore();
    // espiral do caderno na borda esquerda
    for (let y = MAQ.y0 + 50; y < MAQ.y1 - 30; y += 74) {
      if (y < v.y0 - 60 || y > v.y1 + 60) continue;
      ctx.fillStyle = '#3b2a1c'; ctx.beginPath(); ctx.arc(MAQ.x0 + 40, y, 11, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#9aa3a8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(MAQ.x0 + 22, y, 24, -1.25, 1.25); ctx.stroke();
    }
    SP.tape(ctx, MAQ.x1 - 110, MAQ.y0 + 16, 180, 50, 0.15, { seed: 3, color: '#b6e03b', zoom: z });
    SP.tape(ctx, MAQ.x0 + 260, MAQ.y0 + 14, 170, 48, -0.12, { seed: 4, color: '#f2c14e', zoom: z });
    // trilha de lápis entre as áreas
    for (const s of PONTOS) {
      const p = clamp((t - s.ta) / (s.tb - s.ta));
      if (p <= 0) continue;
      I.dashed(ctx, s.P, { dash: 22, gap: 14, w: 5, color: 'rgba(40,40,40,0.75)', seed: 50 + s.k, boil: rc.boil, progress: p, jitter: 0.8 });
      const ponta = pontoEm(s, p);
      if (p < 1) lapis(ctx, ponta.x, ponta.y, ponta.ang, z);
      else I.arrow(ctx, [ponta.x - Math.cos(ponta.ang) * 40, ponta.y - Math.sin(ponta.ang) * 40], [ponta.x, ponta.y], { progress: 1, w: 5, color: 'rgba(40,40,40,0.8)', bend: 0, seed: s.k, head: 26, boil: rc.boil });
    }
    drawCenasCont(rc);
  }
  function pontoEm(s, p) {   // ponto e direção numa trilha reamostrada, na fração p do comprimento
    let d = clamp(p) * s.L, i = 1;
    for (; i < s.P.length - 1; i++) { const l = Math.hypot(s.P[i][0] - s.P[i - 1][0], s.P[i][1] - s.P[i - 1][1]); if (d <= l) break; d -= l; }
    const a = s.P[i - 1], b = s.P[i] || a, l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, q = clamp(d / l);
    return { x: a[0] + (b[0] - a[0]) * q, y: a[1] + (b[1] - a[1]) * q, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  }
  function drawCenasCont(rc) {
    const { ctx } = rc;
    SCENES.forEach((sc, k) => {
      const b = BOARDS[k];
      if (!rc.visible(b.x, b.y, Math.hypot(FW, FH) / 2)) return;
      ctx.save(); ctx.translate(b.x, b.y);
      const order = sc.itens.slice().sort((a, c) => (a.fundo ? -1 : 0) - (c.fundo ? -1 : 0) || (a.z ?? 0) - (c.z ?? 0));
      for (const it of order) drawItem(rc, sc, it);
      ctx.restore();
    });
  }

  // ---------- estrada (estilo C com "estrada": { "viajante": {…} }) ----------
  // Uma paisagem de papel só, com uma estrada que passa por todas as áreas (em cobrinha). O viajante (um caminhão,
  // com o Metaninho de carona) anda pela estrada junto com a câmera; numa cena com "rebobina": true ele volta de ré.
  // "viajante": { "p": "caminhao", "h": 150, "vira": true (a imagem olha para a esquerda, como o caminhao da biblioteca), "carona": "mascote:acena", "caronaRel": [0.1, -0.62], "caronaTam": 0.95 }
  // Cada cena pode dizer onde o viajante para: "parada": -0.33 (fração da largura do quadro; padrão −0.33).
  let ESTRADA = null;
  function buildEstrada() {
    ESTRADA = null;
    if (!CFG.estrada) return;
    const V = FMT === 'v', off = FH * (V ? 0.34 : 0.415), lado = FW * 0.47;
    // células únicas, na ordem da cobrinha (fileira a fileira, alternando o sentido)
    const cel = []; for (const b of BOARDS) if (!cel.some((c) => Math.abs(c.x - b.x) < 1 && Math.abs(c.y - b.y) < 1)) cel.push({ x: b.x, y: b.y });
    cel.sort((a, c) => a.y - c.y || ((Math.round(a.y / FH) % 2 ? c.x - a.x : a.x - c.x)));
    const xs = cel.map((c) => c.x), xmax = Math.max(...xs), xmin = Math.min(...xs);
    const pts = [];
    const r0 = cel[0], dir0 = cel.length > 1 && cel[1].x < r0.x ? -1 : 1;
    pts.push([r0.x - dir0 * FW * 0.5, r0.y + off]);
    for (let k = 0; k < cel.length; k++) {
      const a = cel[k], b = cel[k + 1];
      pts.push([a.x, a.y + off]);
      if (b && Math.abs(a.y - b.y) > 1) { const s = a.x >= xmax - 1 ? 1 : a.x <= xmin + 1 ? -1 : 1; pts.push([a.x + s * lado, a.y + off], [a.x + s * lado, b.y + off]); }
    }
    const last = cel[cel.length - 1], prev = cel[cel.length - 2];
    const dirN = prev && Math.abs(prev.y - last.y) < 1 ? Math.sign(last.x - prev.x) || 1 : 1;
    pts.push([last.x + dirN * FW * 0.5, last.y + off]);
    const P = S.resample(pts, 6, false), L = S.length(P);
    const sAt = (x, y) => { let best = 0, bd = 1e18, acc = 0; for (let i = 1; i < P.length; i++) { acc += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); const d = (P[i][0] - x) ** 2 + (P[i][1] - y) ** 2; if (d < bd) { bd = d; best = acc; } } return best; };
    const st = SCENES.map((sc, k) => sAt(BOARDS[k].x + (sc.parada ?? -0.33) * FW, BOARDS[k].y + off));
    ESTRADA = { P, L, st, off, seg: { P, L } };
  }
  function drawEsteira(rc) {
    const { ctx, t } = rc, z = rc.zoom;
    SP.piece(ctx, MAQ.poly, { color: '#f3e3c3', kind: 'felt', seed: 5, shadow: { zoom: z, strength: 1 }, edge: 0.1, shade: 0.2 });
    // painéis de feltro costurados (a parede de dentro do biodigestor)
    const cores = ['#f6d9cc', '#e3eed6', '#f2d7a0', '#d9ecf2'];
    for (const b of BOARDS) {
      if (!rc.visible(b.x, b.y, Math.hypot(FW, FH) / 2)) continue;
      const i = Math.abs(Math.round(b.x / FW) + Math.round(b.y / FH) * 3) % cores.length;
      SP.piece(ctx, S.cut(rectPts(b.x - FW / 2 + 26, b.y - FH / 2 + 26, b.x + FW / 2 - 26, b.y + FH / 2 - 26), { seed: b.seed, jitter: 2, ds: 60 }), { color: cores[i], kind: 'felt', seed: b.seed, edge: 0.08, shade: 0.25 });
      I.dashed(ctx, rectPts(b.x - FW / 2 + 50, b.y - FH / 2 + 50, b.x + FW / 2 - 50, b.y + FH / 2 - 50).concat([[b.x - FW / 2 + 50, b.y - FH / 2 + 50]]), { dash: 20, gap: 15, w: 4, color: shade(cores[i], -0.4), seed: b.seed, boil: 0 });
    }
    const E2 = ESTRADA, path = new Path2D();
    E2.P.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)));
    const mov = viajanteEm(t).s;   // as ripas andam junto com a carga
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    SP.setShadow(ctx, z, 0.4, 1); ctx.strokeStyle = '#fbf8f0'; ctx.lineWidth = 128; ctx.stroke(path); SP.clearShadow(ctx);
    ctx.strokeStyle = P.pattern(ctx, '#27495a', 'felt', { seed: 12 }); ctx.lineWidth = 110; ctx.stroke(path);
    ctx.lineCap = 'butt'; ctx.setLineDash([26, 30]); ctx.lineDashOffset = -mov; ctx.strokeStyle = '#8fa7b3'; ctx.lineWidth = 84; ctx.stroke(path);
    ctx.setLineDash([14, 12]); ctx.lineDashOffset = 0; ctx.strokeStyle = 'rgba(243,234,216,0.7)'; ctx.lineWidth = 104; ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
    // rodinhas de botão sob a esteira
    for (let i = 0; i < E2.P.length; i += 44) {
      const [x, y] = E2.P[i]; if (!rc.visible(x, y, 60)) continue;
      SP.piece(ctx, S.blob(x, y + 70, 22, 22, { seed: i }), { color: '#f2c14e', kind: 'felt', seed: i, shadow: { zoom: z }, ink: { w: 2 } });
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; for (const [dx, dy] of [[-6, -6], [6, -6], [-6, 6], [6, 6]]) { ctx.beginPath(); ctx.arc(x + dx, y + 70 + dy, 2.6, 0, TAU); ctx.fill(); }
    }
    drawCenasCont(rc);
    drawViajante(rc);
  }
  function drawEstrada(rc) {
    const { ctx, t } = rc, z = rc.zoom;
    if (CFG.estrada.visual === 'esteira') return drawEsteira(rc);
    SP.piece(ctx, MAQ.poly, { color: '#e3edd0', kind: 'paper', seed: 5, shadow: { zoom: z, strength: 1 }, edge: 0.1, shade: 0.25 });
    // arbustos e arvorezinhas de papel na beira da estrada (atrás das peças)
    const rr = RNG(91);
    for (let i = 0; i < ESTRADA.P.length; i += 28) {
      const [px, py] = ESTRADA.P[i], lado = hrand(i, 5) < 0.5 ? -1 : 1, x = px + rr.sym(60), y = py + lado * (86 + rr.range(0, 30));
      if (!rc.visible(x, y, 80)) continue;
      if (hrand(i, 7) < 0.35) { SP.piece(ctx, S.rrect(x - 7, y - 10, 14, 34, 4, { seed: i }), { color: '#8b5a3c', seed: i }); SP.piece(ctx, S.blob(x, y - 30, 34, 38, { seed: i + 1, wobble: 0.1 }), { color: rr.pick(['#5ca032', '#7cb342', '#4e8c2a']), seed: i, shadow: { zoom: z }, edge: 0.15 }); }
      else SP.piece(ctx, S.blob(x, y, rr.range(22, 34), rr.range(16, 24), { seed: i + 2, wobble: 0.12 }), { color: rr.pick(['#7cb342', '#9fc56b', '#5ca032']), seed: i, shadow: { zoom: z }, edge: 0.15 });
    }
    const E2 = ESTRADA, path = new Path2D();
    E2.P.forEach(([x, y], i) => (i ? path.lineTo(x, y) : path.moveTo(x, y)));
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    SP.setShadow(ctx, z, 0.2, 0.8); ctx.strokeStyle = '#fbf8f0'; ctx.lineWidth = 118; ctx.stroke(path); SP.clearShadow(ctx);
    ctx.strokeStyle = P.pattern(ctx, '#5d6468', 'kraft', { seed: 12 }); ctx.lineWidth = 100; ctx.stroke(path);
    ctx.setLineDash([46, 38]); ctx.strokeStyle = '#f3ead8'; ctx.lineWidth = 8; ctx.stroke(path); ctx.setLineDash([]);
    ctx.restore();
    drawCenasCont(rc);
    drawViajante(rc);
  }
  function viajanteEm(t) {
    const E2 = ESTRADA; let k = 0;
    for (let i = 0; i < CAMS.length; i++) if (t >= CAMS[i].t0 - CAMS[i].pan) k = i;
    const c = CAMS[k];
    if (k > 0 && t < c.t0) { const p = E.inOutCubic(clamp((t - (c.t0 - c.pan)) / c.pan)); return { s: lerp(E2.st[k - 1], E2.st[k], p), dir: Math.sign(E2.st[k] - E2.st[k - 1]), anda: true, re: !!SCENES[k].rebobina }; }
    return { s: E2.st[k], dir: 0, anda: false, re: false };
  }
  let VIAJ_LADO = 1;
  // Carga (esteira): cada cena pode trocar o que o viajante carrega — "carga": "@pedacinhos" (ou {"p": …, "rosto": {…}},
  // ou false = some); "cargaEm": "palavra" = momento da transformação (antes disso segue a carga da cena anterior).
  const cargaDe = (c) => (c == null ? undefined : c === false ? false : typeof c === 'string' ? { p: c } : c);
  function cargaFinal(k) { for (let i = k; i >= 0; i--) { const c = cargaDe(SCENES[i].carga); if (c !== undefined) return c; } return { p: CFG.estrada.viajante.p, rosto: CFG.estrada.viajante.rosto }; }
  function cargaEm(t) {
    let k = 0; for (let i = 0; i < CAMS.length; i++) if (t >= CAMS[i].t0 - CAMS[i].pan) k = i;
    const c = CAMS[k], sc = SCENES[k];
    if (k > 0 && t < c.t0) return { c: cargaFinal(k - 1), pop: 1 };
    const minha = cargaDe(sc.carga);
    if (minha === undefined) return { c: cargaFinal(k), pop: 1 };
    const tt = sc.cargaEm != null ? tEm(sc, sc.cargaEm, sc.t0) : sc.t0;
    if (t < tt) return { c: k > 0 ? cargaFinal(k - 1) : minha, pop: 1 };
    return { c: minha, pop: E.outBack(clamp((t - tt) / 0.35), 2.2) };
  }
  const RostoCarga = new Map();
  function drawViajante(rc) {
    const vj = CFG.estrada.viajante; if (!vj) return;
    const cg = CFG.estrada.visual === 'esteira' ? cargaEm(rc.t) : { c: { p: vj.p }, pop: 1 };
    if (!cg.c) return;
    const { ctx, t } = rc, pAtual = cg.c.p, im = imgOf(pAtual); if (!im) return;
    const pos = viajanteEm(t), pt = pontoEm(ESTRADA, pos.s / ESTRADA.L);
    if (pos.anda && pos.dir) {   // para onde o caminhão aponta (de ré, ao rebobinar, ele não vira)
      const fwd = Math.cos(pt.ang) * pos.dir;
      if (Math.abs(fwd) > 0.3) VIAJ_LADO = (fwd > 0 ? 1 : -1) * (pos.re ? -1 : 1);
    }
    const vira = (vj.vira ? -1 : 1) * VIAJ_LADO;
    const h = (cg.c.h ?? vj.h ?? 150), s = h / im.height * cg.pop;
    const bob = pos.anda ? -Math.abs(Math.sin(t * 18)) * 5 : 0;
    const fade = 1 - clamp((t - LOGO + 0.12) / 0.25);
    if (fade <= 0) return;
    ctx.save(); ctx.globalAlpha *= fade;
    const y = pt.y + 26 + bob;
    X.img(ctx, IMG.get(pAtual), pt.x, y, { s, flip: vira < 0 && !cg.c.rosto, ay: 1, zoom: rc.zoom });
    if (cg.c.rosto) {   // carinha na carga (o mesmo objeto guarda o piscar)
      if (!RostoCarga.has(pAtual)) RostoCarga.set(pAtual, { rosto: { ...cg.c.rosto }, seed: 5, rostoT: [] });
      ctx.save(); ctx.translate(pt.x, y); ctx.scale(s, s); drawRosto(ctx, RostoCarga.get(pAtual), im.width, im.height, -im.height / 2, t); ctx.restore();
    }
    if (vj.carona) {
      const ci = imgOf(vj.carona);
      if (ci) { const rel = vj.caronaRel || [0.1, -0.62], cs = (vj.caronaTam ?? 0.95) * h / ci.height; X.img(ctx, IMG.get(vj.carona), pt.x + rel[0] * im.width * s * vira, y + rel[1] * h + Math.sin(t * 3) * 3, { s: cs, flip: vira < 0 && vj.caronaVira !== false, ay: 1, zoom: rc.zoom }); }
    }
    ctx.restore();
  }

  // ---------- lousa com viajante (estilo L com "lousa": { "viajante": {...} }) ----------
  // Uma lousa inteira (moldura de madeira, marcas de apagador, calha com gizes). Cada cena tem uma "estação"
  // ("parada": [u, v], fração do quadro; padrão [0, 0.1]) onde o viajante (ex.: o átomo @carbono com rosto) fica;
  // na passagem para a cena seguinte ele voa até a próxima estação deixando um rastro de giz pontilhado.
  // "viajante": { "p": "@carbono", "h": 150, "rosto": { "pos": [0, 0], "tam": 0.34, "humor": "feliz" } }
  // Por cena: "viajante": false (esconde), "humorViajante": "surpresa", "curva": 0.25 (curvatura do rastro até ela).
  let LOUSA = null;
  function buildLousa() {
    LOUSA = null;
    if (!CFG.lousa) return;
    const est = SCENES.map((sc, k) => { const p = sc.parada || [0, 0.1]; return [BOARDS[k].x + p[0] * FW, BOARDS[k].y + p[1] * FH]; });
    const segs = [];
    for (let k = 1; k < SCENES.length; k++) {
      const a = est[k - 1], b = est[k], L0 = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (L0 < 2) { segs[k] = null; continue; }
      const cv = SCENES[k].curva ?? 0.2, nx = -(b[1] - a[1]) / L0, ny = (b[0] - a[0]) / L0;
      const cx = (a[0] + b[0]) / 2 + nx * cv * L0, cy = (a[1] + b[1]) / 2 + ny * cv * L0;
      const pts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; pts.push([(1 - u) ** 2 * a[0] + 2 * u * (1 - u) * cx + u * u * b[0], (1 - u) ** 2 * a[1] + 2 * u * (1 - u) * cy + u * u * b[1]]); }
      const P2 = S.resample(pts, 5, false), c = CAMS[k];
      segs[k] = { P: P2, L: S.length(P2), ta: c.t0 - c.pan, tb: c.t0, k };
    }
    LOUSA = { est, segs, vj: CFG.lousa.viajante ? { rosto: { ...(CFG.lousa.viajante.rosto || {}) }, seed: 7, rostoT: [] } : null };
  }
  function drawLousa(rc) {
    const { ctx, t } = rc, z = rc.zoom;
    const fr = 46;
    SP.piece(ctx, S.cut(rectPts(MAQ.x0 - fr, MAQ.y0 - fr, MAQ.x1 + fr, MAQ.y1 + fr), { seed: 5, jitter: 1.5, ds: 80 }), { color: '#8b5a3c', kind: 'kraft', seed: 5, shadow: { zoom: z, strength: 1.1 }, edge: 0.2, shade: 0.5 });
    ctx.fillStyle = P.pattern(ctx, '#27453a', 'smooth', { seed: 6 }); ctx.fillRect(MAQ.x0, MAQ.y0, MAQ.x1 - MAQ.x0, MAQ.y1 - MAQ.y0);
    const rr = RNG(31);
    ctx.fillStyle = 'rgba(244,241,230,0.045)';
    for (let k = 0; k < 26 * BOARDS.length; k++) { const x = rr.range(MAQ.x0, MAQ.x1), y = rr.range(MAQ.y0, MAQ.y1); if (!rc.visible(x, y, 200)) continue; ctx.beginPath(); ctx.ellipse(x, y, rr.range(60, 200), rr.range(12, 34), rr.range(0, 3), 0, TAU); ctx.fill(); }
    // calha de giz embaixo, com gizes e um apagador
    SP.piece(ctx, S.rrect(MAQ.x0 - fr, MAQ.y1 + fr - 10, MAQ.x1 - MAQ.x0 + 2 * fr, 34, 6, { seed: 8 }), { color: '#6b4a31', kind: 'kraft', seed: 8, shadow: { zoom: z }, edge: 0.2 });
    for (let x = MAQ.x0 + 300; x < MAQ.x1; x += 1400) {
      if (!rc.visible(x, MAQ.y1 + fr, 300)) continue;
      SP.piece(ctx, S.rrect(x, MAQ.y1 + fr - 22, 90, 18, 8, { seed: x }), { color: '#fbf8f0', seed: 3, shadow: { zoom: z } });
      SP.piece(ctx, S.rrect(x + 120, MAQ.y1 + fr - 22, 80, 18, 8, { seed: x + 1 }), { color: '#f2c14e', seed: 4, shadow: { zoom: z } });
      SP.piece(ctx, S.rrect(x + 260, MAQ.y1 + fr - 40, 170, 36, 6, { seed: x + 2 }), { color: '#1e3e4c', seed: 5, shadow: { zoom: z } });
    }
    // rastro de giz do viajante
    for (const sg of LOUSA.segs) {
      if (!sg) continue;
      const p = clamp((t - sg.ta) / Math.max(0.05, sg.tb - sg.ta));
      if (p <= 0) continue;
      I.dashed(ctx, sg.P, { dash: 12, gap: 14, w: 7, color: 'rgba(244,241,230,0.8)', seed: 40 + sg.k, boil: rc.boil, progress: p, jitter: 0.7 });
    }
    drawCenasCont(rc);
    drawViajanteLousa(rc);
  }
  function drawViajanteLousa(rc) {
    const vj = CFG.lousa.viajante; if (!vj || !LOUSA.vj) return;
    const { ctx, t } = rc, im = imgOf(vj.p); if (!im) return;
    let k = 0; for (let i = 0; i < CAMS.length; i++) if (t >= CAMS[i].t0 - CAMS[i].pan) k = i;
    const c = CAMS[k], sg = LOUSA.segs[k];
    let x, y, anda = false, alpha = 1;
    if (k > 0 && t < c.t0 && sg) {
      const p = E.inOutCubic(clamp((t - (c.t0 - c.pan)) / c.pan)), pt = pontoEm(sg, p);
      x = pt.x; y = pt.y - Math.sin(p * Math.PI) * 40; anda = true;
      const vis0 = SCENES[k - 1].viajante !== false, vis1 = SCENES[k].viajante !== false;
      alpha = lerp(vis0 ? 1 : 0, vis1 ? 1 : 0, p);
    } else { [x, y] = LOUSA.est[k]; alpha = SCENES[k].viajante === false ? 0 : 1; }
    alpha *= 1 - clamp((t - LOGO + 0.12) / 0.25);
    if (alpha <= 0.01) return;
    const h = vj.h ?? 150, s = h / im.height;
    const bob = anda ? 0 : Math.sin(t * TAU * 0.9) * 6;
    const sq = anda ? 0.08 : 0.03 * Math.sin(t * TAU * 1.8);
    LOUSA.vj.rosto.humor = SCENES[k].humorViajante ?? (vj.rosto?.humor || 'feliz');
    ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y + bob);
    ctx.scale(s * (1 + sq), s * (1 - sq));
    SP.setShadow(ctx, rc.zoom * s, anda ? 0.8 : 0.3, 1);
    ctx.drawImage(im, -im.width / 2, -im.height / 2); SP.clearShadow(ctx);
    drawRosto(ctx, LOUSA.vj, im.width, im.height, 0, t);
    ctx.restore();
  }

  // ---------- estúdio de TV (estilo F com "estudio": true): parede de azulejos de feltro + bancada ----------
  function drawEstudio(rc, b) {
    const { ctx } = rc, z = rc.zoom, w = b.w, h = b.h, V = FMT === 'v';
    SP.piece(ctx, S.cut(rectPts(-w / 2, -h / 2, w / 2, h / 2), { seed: b.seed, jitter: 1.5, ds: 50 }), { color: b.col, kind: 'felt', seed: b.seed, shadow: { zoom: z, strength: 1 }, edge: 0.1, shade: 0.3 });
    const topo = (V ? 640 : 425) - 34, tl = V ? 132 : 120;   // bancada: tampo a partir de "topo"
    ctx.save(); ctx.beginPath(); ctx.rect(-w / 2 + 18, -h / 2 + 18, w - 36, topo + h / 2 - 18); ctx.clip();
    for (let y = -h / 2 + 18, r = 0; y < topo; y += tl, r++) for (let x = -w / 2 + 18 + (r % 2 ? tl / 2 : 0) - tl, c = 0; x < w / 2; x += tl, c++) {
      ctx.fillStyle = (r + c) % 2 ? 'rgba(255,255,255,0.22)' : 'rgba(0,60,40,0.06)';
      ctx.beginPath(); ctx.roundRect(x + 6, y + 6, tl - 12, tl - 12, 16); ctx.fill();
    }
    ctx.restore();
    // tampo e frente da bancada (feltro de madeira com pesponto)
    SP.piece(ctx, S.cut(rectPts(-w / 2 + 8, topo, w / 2 - 8, topo + 42), { seed: b.seed + 3, jitter: 1, ds: 60 }), { color: '#d9a066', kind: 'felt', seed: b.seed + 3, shadow: { zoom: z, strength: 0.6 }, edge: 0.1, shade: 0.4 });
    SP.piece(ctx, S.cut(rectPts(-w / 2 + 18, topo + 42, w / 2 - 18, h / 2), { seed: b.seed + 4, jitter: 1, ds: 60 }), { color: '#9a6a45', kind: 'felt', seed: b.seed + 4, edge: 0.1, shade: 0.5 });
    I.dashed(ctx, [[-w / 2 + 40, topo + 62], [w / 2 - 40, topo + 62]], { dash: 20, gap: 14, w: 4, color: '#f3ead8', seed: b.seed, boil: 0 });
    for (const x of [-w * 0.3, 0, w * 0.3]) { SP.piece(ctx, S.blob(x, topo + 100, 16, 16, { seed: Math.round(x) }), { color: '#f2c14e', seed: 7, ink: { w: 2 } }); }
  }

  // ---------- livro (estilo P): duas páginas, dobra, virada de página e capa ----------
  // 16:9 = livro aberto na horizontal (páginas esquerda | direita); 9:16 = livro de lombada no meio, páginas de cima / de baixo
  // (a folha vira para cima, como um calendário). Cada peça fica numa página ("pagina": 1 | 2) e é recortada nela.
  function LIVRO() { return EST.borda === 'livro'; }
  let CAPA = null;
  function naBatida(t) {   // batida da trilha mais próxima de t (de preferência um pouco antes)
    const per = TL.musica?.periodo, d0 = TL.musica?.downbeat0 ?? 0;
    if (!per) return t;
    const n = Math.round((t - d0) / per);
    const c = [n - 1, n, n + 1].map((i) => d0 + i * per).filter((b) => b >= t - 0.5 && b <= t + 0.15);
    return c.length ? c.reduce((a, b) => (Math.abs(b - t) < Math.abs(a - t) ? b : a)) : t;
  }
  function noForte(t) {   // 1º tempo do compasso mais próximo (até ~meio compasso); senão, a batida mais próxima
    const bar = TL.musica?.compasso, d0 = TL.musica?.downbeat0 ?? 0;
    if (!bar) return naBatida(t);
    const b = d0 + Math.round((t - d0) / bar) * bar;
    return b >= t - 0.4 && b <= t + 0.3 ? b : naBatida(t);
  }
  function paginasArea() {   // área útil de cada página (com margem da dobra); no 9:16, longe da marca-d'água e da interface dos Stories
    const A = area();
    return FMT === 'v' ? [box(A.x0, -625, A.x1, -44), box(A.x0, 44, A.x1, 690)] : [box(A.x0, A.y0, -62, A.y1), box(62, A.y0, A.x1, A.y1)];
  }
  function pagRect(b, lado) {   // retângulo inteiro da página (0 = esquerda/cima, 1 = direita/baixo)
    const w = b.w, h = b.h;
    if (FMT === 'v') return lado ? [-w / 2, 1, w / 2, h / 2] : [-w / 2, -h / 2, w / 2, -1];
    return lado ? [1, -h / 2, w / 2, h / 2] : [-w / 2, -h / 2, -1, h / 2];
  }
  function clipR(ctx, r) { ctx.beginPath(); ctx.rect(r[0], r[1], r[2] - r[0], r[3] - r[1]); ctx.clip(); }
  function drawCapaDura(rc, b, lados, espessura = true) {   // capa dura por baixo das páginas + espessura do bloco de folhas
    const { ctx } = rc, V = FMT === 'v', m = 22, w = b.w, h = b.h;
    const x0 = V ? -w / 2 - m : (lados[0] ? -w / 2 - m : -3), x1 = V ? w / 2 + m : (lados[1] ? w / 2 + m : 3);
    const y0 = V ? (lados[0] ? -h / 2 - m : -3) : -h / 2 - m, y1 = V ? (lados[1] ? h / 2 + m : 3) : h / 2 + m;
    SP.piece(ctx, S.rrect(x0, y0, x1 - x0, y1 - y0, 18, { seed: 7 }), { color: cor(CFG.capa?.cor, PAL.petrol), seed: 7, shadow: { zoom: rc.zoom, strength: 1.1 }, edge: 0.3 });
    if (!espessura) return;
    for (const lado of [0, 1]) {
      if (!lados[lado]) continue;
      const r = pagRect(b, lado);
      for (const k of [2, 1]) {   // folhas de baixo aparecendo na borda de fora
        const o = k * 5, dx = V ? 0 : (lado ? o : -o), dy = V ? (lado ? o : -o) : 0;
        ctx.fillStyle = shade(EST.folhas[0], -0.07 * k);
        ctx.fillRect(r[0] + dx, r[1] + dy, r[2] - r[0], r[3] - r[1]);
      }
    }
  }
  function drawPapel(rc, b, lado, col) {
    const r = pagRect(b, lado);
    SP.piece(rc.ctx, S.cut(rectPts(r[0], r[1], r[2], r[3]), { seed: b.seed + lado, jitter: 1.2, ds: 40 }), { color: col, kind: 'paper', seed: b.seed + 3 + lado, edge: 0.18 });
  }
  function drawPagina(rc, k, lado) {   // papel + peças da página (recortadas nela: nada passa da dobra)
    const { ctx } = rc, sc = SCENES[k], b = BOARDS[k];
    ctx.save(); clipR(ctx, pagRect(b, lado));
    drawPapel(rc, b, lado, b.col);
    decoraPagina(rc, b, lado, k);
    const order = sc.itens.filter((it) => it.pagina === lado + 1).sort((a, c) => (a.fundo ? -1 : 0) - (c.fundo ? -1 : 0) || (a.z ?? 0) - (c.z ?? 0));
    for (const it of order) drawItem(rc, sc, it);
    ctx.restore();
  }
  function drawSobreLivro(rc, k) {   // itens do livro inteiro ("pagina": 0), por cima das duas páginas
    const sc = SCENES[k];
    for (const it of sc.itens) if (it.pagina === 0) drawItem(rc, sc, it);
  }
  function drawDobra(rc, b) {   // sombra da dobra e curvatura da folha por cima das peças: elas ficam "impressas" na página
    const { ctx } = rc, V = FMT === 'v', w = b.w, h = b.h;
    const faixa = (r, a) => {
      const g = V ? ctx.createLinearGradient(0, -r, 0, r) : ctx.createLinearGradient(-r, 0, r, 0);
      g.addColorStop(0, 'rgba(60,40,20,0)'); g.addColorStop(0.5, `rgba(60,40,20,${a})`); g.addColorStop(1, 'rgba(60,40,20,0)');
      ctx.fillStyle = g;
      if (V) ctx.fillRect(-w / 2, -r, w, 2 * r); else ctx.fillRect(-r, -h / 2, 2 * r, h);
    };
    faixa(95, 0.3); faixa(330, 0.07);
  }
  function drawCapaFrente(rc, b) {   // capa fechada (sobre a página da direita / de baixo): azul-petróleo com o logo em negativo
    const { ctx } = rc, V = FMT === 'v', r = pagRect(b, 1), m = 22;
    const x0 = V ? r[0] - m : r[0] - 3, x1 = r[2] + m, y0 = V ? r[1] - 3 : r[1] - m, y1 = r[3] + m;
    SP.piece(ctx, S.rrect(x0, y0, x1 - x0, y1 - y0, 18, { seed: 9 }), { color: cor(CFG.capa?.cor, PAL.petrol), seed: 9, edge: 0.3 });
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cw = x1 - x0, ch = y1 - y0;
    ctx.save();
    ctx.strokeStyle = 'rgba(182,224,59,0.85)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(x0 + 34, y0 + 34, cw - 68, ch - 68, 12); ctx.stroke();
    const logo = imgOf('marca_negativo');
    if (logo) { const lw = Math.min(cw * 0.66, 560), lh = lw * logo.height / logo.width; ctx.drawImage(logo, cx - lw / 2, cy - lh * 0.9, lw, lh); }
    const tit = L(CFG.capa?.titulo);
    if (tit) {
      ctx.fillStyle = '#fbf8f0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `700 ${V ? 64 : 60}px "Caveat Brush", "Caveat", sans-serif`;
      ctx.fillText(tit, cx, cy + ch * 0.2);
    }
    if (CFG.capa?.selo) {   // selo redondo no canto ("ÁLBUM OFICIAL")
      const sx = x0 + 120, sy = y0 + 120;   // no canto esquerdo: o direito fica embaixo da marca-d’água
      SP.piece(ctx, S.star(sx, sy, 70, 92, 14, { seed: 12 }), { color: '#f2c14e', seed: 12, edge: 0.2 });
      ctx.fillStyle = '#1e3e4c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 26px "Archivo Black", sans-serif';
      String(L(CFG.capa.selo)).split('\n').forEach((l, i, a) => ctx.fillText(l, sx, sy + (i - (a.length - 1) / 2) * 28));
    }
    ctx.restore();
  }
  function sombraNaPagina(rc, b, lado, borda, forca) {   // sombra que a folha em pé projeta na página de baixo
    if (forca <= 0.01) return;
    const { ctx } = rc, V = FMT === 'v', r = pagRect(b, lado), s = lado ? 1 : -1, L0 = 150 * forca;
    ctx.save(); clipR(ctx, r);
    const g = V ? ctx.createLinearGradient(0, borda, 0, borda + s * L0) : ctx.createLinearGradient(borda, 0, borda + s * L0, 0);
    g.addColorStop(0, `rgba(30,20,10,${0.28 * forca})`); g.addColorStop(1, 'rgba(30,20,10,0)');
    ctx.fillStyle = g; ctx.fillRect(r[0], r[1], r[2] - r[0], r[3] - r[1]);
    ctx.restore();
  }
  function drawFolha(rc, b, p, frente, verso) {   // a folha girando na dobra: frente (até 90°), verso (depois)
    const { ctx } = rc, V = FMT === 'v';
    const th = p * Math.PI, c = Math.cos(th), s = Math.sin(th), k = Math.max(0.002, Math.abs(c));
    ctx.save();
    if (V) ctx.scale(1 + 0.05 * s, k); else ctx.scale(k, 1 + 0.05 * s);
    if (c > 0) frente(); else verso();
    // a folha escurece quando fica de lado para a luz, mais na borda solta (parece curva)
    const r = pagRect(b, c > 0 ? 1 : 0), fora = c > 0 ? 1 : -1;
    const g = V ? ctx.createLinearGradient(0, 0, 0, fora * (b.h / 2)) : ctx.createLinearGradient(0, 0, fora * (b.w / 2), 0);
    g.addColorStop(0, `rgba(30,20,10,${0.12 * s})`); g.addColorStop(0.7, `rgba(30,20,10,${0.3 * s})`); g.addColorStop(1, `rgba(30,20,10,${0.42 * s})`);
    ctx.fillStyle = g; ctx.fillRect(r[0], r[1], r[2] - r[0], r[3] - r[1]);
    ctx.restore();
  }
  function drawLivro(rc) {
    const { ctx, t } = rc;
    let k = 0;
    for (let i = 0; i < CAMS.length; i++) if (t >= CAMS[i].t0 - CAMS[i].pan) k = i;
    const b = BOARDS[k], V = FMT === 'v', meia = V ? b.h / 2 : b.w / 2;
    ctx.save(); ctx.translate(b.x, b.y);
    if (CAPA && k === 0 && t < CAPA.t1) {   // capa: fechado → abrindo
      drawCapaDura(rc, b, [false, true]);
      if (t < CAPA.t0) { drawCapaFrente(rc, b); ctx.restore(); return; }
      const p = E.inOutSine(clamp((t - CAPA.t0) / (CAPA.t1 - CAPA.t0)));
      const c = Math.cos(p * Math.PI);
      drawPagina(rc, 0, 1);
      sombraNaPagina(rc, b, 1, meia * Math.max(0, c), Math.sin(p * Math.PI));
      drawFolha(rc, b, p, () => drawCapaFrente(rc, b), () => { drawCapaDura(rc, b, [true, false], false); drawPagina(rc, 0, 0); });
      drawDobra(rc, b);
      ctx.restore(); return;
    }
    drawCapaDura(rc, b, [true, true]);
    const c = CAMS[k];
    if (k > 0 && t < c.t0) {   // virando: sai a página direita (de baixo) do quadro anterior, entra a esquerda (de cima) do novo
      const p = E.inOutSine(clamp((t - (c.t0 - c.pan)) / c.pan));
      const cs = Math.cos(p * Math.PI), sn = Math.sin(p * Math.PI);
      drawPagina(rc, k - 1, 0);
      drawPagina(rc, k, 1);
      if (cs > 0) sombraNaPagina(rc, b, 1, meia * cs, sn); else sombraNaPagina(rc, b, 0, meia * cs, sn);
      drawFolha(rc, b, p, () => drawPagina(rc, k - 1, 1), () => drawPagina(rc, k, 0));
    } else {
      drawPagina(rc, k, 0); drawPagina(rc, k, 1);
      drawSobreLivro(rc, k);
    }
    drawDobra(rc, b);
    ctx.restore();
  }

  function rectPts(x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }
  function drawBoard(rc, b) {
    const { ctx } = rc, z = rc.zoom, w = b.w, h = b.h;
    const st = EST.borda;
    if (st === 'livro') {
      // livro aberto: capa por baixo, duas páginas e a dobra no meio
      SP.piece(ctx, S.rrect(-w / 2 - 26, -h / 2 - 18, w + 52, h + 44, 18, { seed: b.seed }), { color: cor(CFG.capa?.cor, PAL.petrol), seed: b.seed, shadow: { zoom: z, strength: 1.1 }, edge: 0.3 });
      for (const sg of [-1, 1]) {
        const pts = sg < 0 ? rectPts(-w / 2, -h / 2, -2, h / 2) : rectPts(2, -h / 2, w / 2, h / 2);
        SP.piece(ctx, S.cut(pts, { seed: b.seed + sg, jitter: 1.2, ds: 40 }), { color: b.col, kind: 'paper', seed: b.seed + 3 + sg, edge: 0.18 });
      }
      const g = ctx.createLinearGradient(-90, 0, 90, 0);
      g.addColorStop(0, 'rgba(60,40,20,0)'); g.addColorStop(0.5, 'rgba(60,40,20,0.28)'); g.addColorStop(1, 'rgba(60,40,20,0)');
      ctx.fillStyle = g; ctx.fillRect(-90, -h / 2, 180, h);
      return;
    }
    if (st === 'quadro') {
      ctx.fillStyle = P.pattern(ctx, b.col, 'smooth', { seed: b.seed });
      SP.setShadow(ctx, z, 0, 0.6); ctx.fillRect(-w / 2, -h / 2, w, h); SP.clearShadow(ctx);
      // retícula num canto
      ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.clip();
      ctx.fillStyle = 'rgba(142,197,214,0.35)';
      for (let y = -h / 2; y < h / 2; y += 22) for (let x = -w / 2; x < w / 2; x += 22) {
        const k = clamp(1 - Math.hypot(x - w / 2, y + h / 2) / (w * 0.75));
        if (k > 0.05) { ctx.beginPath(); ctx.arc(x + ((y / 22) % 2 ? 11 : 0), y, 7 * k, 0, TAU); ctx.fill(); }
      }
      ctx.restore();
      I.stroke(ctx, rectPts(-w / 2, -h / 2, w / 2, h / 2), { closed: true, w: 12, color: INK, seed: b.seed, boil: 0, jitter: 0.6, taper: [0, 0] });
      return;
    }
    if (CFG.estudio) return drawEstudio(rc, b);
    if (CFG.show) return drawShowBoard(rc, b);
    if (CFG.tabuleiro) return drawTabuleiro(rc, b);
    const kind = EST.kind;
    SP.piece(ctx, b.poly, { color: b.col, kind, seed: b.seed, shadow: { zoom: z, strength: 1 }, edge: 0.14, shade: 0.45, torn: st === 'rasgada' ? 4 : false });
    if (st === 'papelao') {
      SP.tape(ctx, -w / 2 + 60, -h / 2 + 18, 150, 48, -0.6, { seed: b.seed, zoom: z });
      SP.tape(ctx, w / 2 - 60, h / 2 - 18, 150, 48, -0.6, { seed: b.seed + 1, zoom: z });
    } else if (st === 'costura') {
      I.dashed(ctx, rectPts(-w / 2 + 30, -h / 2 + 30, w / 2 - 30, h / 2 - 30).concat([[-w / 2 + 30, -h / 2 + 30]]), { dash: 22, gap: 16, w: 5, color: shade(b.col, -0.45), seed: b.seed, boil: 0 });
      for (const [bx, by] of [[-w / 2 + 64, -h / 2 + 64], [w / 2 - 64, -h / 2 + 64], [-w / 2 + 64, h / 2 - 64], [w / 2 - 64, h / 2 - 64]]) {
        SP.piece(ctx, S.blob(bx, by, 17, 17, { seed: bx }), { color: PAL.coral, seed: 5, shadow: { zoom: z }, ink: { w: 2 } });
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; for (const [dx, dy] of [[-5, -5], [5, -5], [-5, 5], [5, 5]]) { ctx.beginPath(); ctx.arc(bx + dx, by + dy, 2.4, 0, TAU); ctx.fill(); }
      }
    } else if (st === 'caderno') {
      ctx.strokeStyle = 'rgba(70,120,160,0.28)'; ctx.lineWidth = 2;
      ctx.beginPath(); for (let y = -h / 2 + 90; y < h / 2 - 20; y += 58) { ctx.moveTo(-w / 2 + 70, y); ctx.lineTo(w / 2 - 20, y); } ctx.stroke();
      ctx.strokeStyle = 'rgba(228,87,46,0.35)'; ctx.beginPath(); ctx.moveTo(-w / 2 + 130, -h / 2 + 10); ctx.lineTo(-w / 2 + 130, h / 2 - 10); ctx.stroke();
      for (let y = -h / 2 + 60; y < h / 2 - 40; y += 70) {
        ctx.fillStyle = '#3b2a1c'; ctx.beginPath(); ctx.arc(-w / 2 + 36, y, 10, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#9aa3a8'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(-w / 2 + 20, y, 20, -1.2, 1.2); ctx.stroke();
      }
      SP.tape(ctx, w / 2 - 90, -h / 2 + 14, 170, 46, 0.12, { seed: b.seed, color: '#b6e03b', zoom: z });
    } else if (st === 'lousa') {
      ctx.strokeStyle = P.pattern(ctx, '#8b5a3c', 'kraft', { seed: 9 }); ctx.lineWidth = 36;
      ctx.strokeRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12);
      ctx.fillStyle = 'rgba(244,241,230,0.05)';
      const rr = RNG(b.seed);
      for (let k = 0; k < 14; k++) { ctx.beginPath(); ctx.ellipse(rr.sym(w * 0.42), rr.sym(h * 0.42), rr.range(60, 180), rr.range(12, 30), rr.range(0, 3), 0, TAU); ctx.fill(); }
    } else if (st === 'planta') {
      ctx.save(); ctx.beginPath(); S.trace(ctx, b.poly, true); ctx.clip();
      ctx.strokeStyle = 'rgba(234,244,251,0.16)'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let x = -w / 2; x < w / 2; x += 48) { ctx.moveTo(x, -h / 2); ctx.lineTo(x, h / 2); }
      for (let y = -h / 2; y < h / 2; y += 48) { ctx.moveTo(-w / 2, y); ctx.lineTo(w / 2, y); }
      ctx.stroke(); ctx.restore();
      ctx.strokeStyle = 'rgba(234,244,251,0.7)'; ctx.lineWidth = 3; ctx.strokeRect(-w / 2 + 26, -h / 2 + 26, w - 52, h - 52);
      ctx.strokeRect(w / 2 - 330, h / 2 - 130, 304, 104);
    }
  }

  // ---------- itens ----------
  const DUR = { pop: 0.34, cai: 0.5, sobe: 0.5, desliza: 0.5, desliza_esq: 0.5, desliza_dir: 0.5, cresce: 0.6, voa: 0.65, gira: 0.5, carimbo: 0.16, aparece: 0.35, escreve: 0.9, letras: 0.3, nenhum: 0, abre: 0.5 };
  function resolveItems(sc) {
    const rr = RNG(sc.seed);
    sc.itens.forEach((it, i) => {
      it.seed = sc.seed * 31 + i * 7;
      it.kind = it.fx ? 'fx' : it.txt != null ? 'txt' : 'img';
      if (it.kind === 'img' && !it.p) it.kind = 'fx';
      const stagger = i * 0.16;
      it.t0 = tEm(sc, it.em, sc.t0 + 0.08 + stagger);
      if (sc.pop) it.t0 = Math.max(it.t0, sc.t0 - 0.2);
      const bt = it.batida ?? sc.batida;   // "batida": true = entra na batida mais próxima · "forte" = no 1º tempo do compasso
      if (bt && it.em != null) it.t0 = bt === 'forte' ? noForte(it.t0) : naBatida(it.t0);
      it.entra = it.entra || (it.kind === 'txt' ? ({ letras: 'letras', carimbo: 'carimbo', mao: 'escreve', giz: 'escreve' }[it.tipo || 'letras'] || 'pop') : EST.borda === 'livro' ? 'sobe' : it.p && it.p.includes(':') ? 'desliza' : 'pop');
      if (it.entra === 'desliza') it.entra = (it.box && it.box.cx < 0) ? 'desliza_esq' : 'desliza_dir';
      it.d = it.dur ?? (it.entra === 'escreve' ? clamp(String(L(it.txt)).length * 0.045, 0.5, 1.8) : DUR[it.entra] ?? 0.34);
      it.t1 = it.sai ? tEm(sc, it.sai.em ?? it.sai, 1e9) : 1e9;
      it.rot0 = (FMT === 'v' && it.rotV != null ? it.rotV : it.rot) ?? rr.sym(it.kind === 'img' ? 0.05 : 0.04);   // "rotV": rotação só no 9:16
      it.muda = (it.muda || []).filter((k) => !(FMT === 'v' ? k.soH : k.soV)).map((k) => { const t = tEm(sc, k.em, sc.t0);   // "soH"/"soV": chave só num formato
         return { ...k, t: k.batida ? (k.batida === 'forte' ? noForte(t) : naBatida(t)) : t, d: k.d ?? 0.6 }; });
      it.brilha = it.brilha != null ? tEm(sc, it.brilha, null) : null;
      it.rostoT = (it.rosto?.trocas || []).map((k) => ({ t: tEm(sc, k.em, sc.t0), humor: k.humor }));
      it.capaT = it.capa ? tEm(sc, it.capa.em, it.t0) : null;
      // "partes": [{ "em": "palavra", "rel": [u, v], "r": 0.15 }] — a peça começa em azul de planta técnica e cada parte ganha cor (raio-X)
      it.partesT = (it.partes || []).map((k) => ({ t: tEm(sc, k.em, sc.t0), u: k.rel?.[0] ?? 0, v: k.rel?.[1] ?? 0, r: k.r ?? 0.15 }));
      // "poses": [{ "em": "palavra", "p": "surpreso" }] — o personagem troca de pose (mesmo tamanho de caixa)
      it.posesT = (it.poses || []).map((k) => ({ t: tEm(sc, k.em, sc.t0), p: k.p.includes(':') || k.p.startsWith('@') || !it.p.includes(':') ? k.p : it.p.split(':')[0] + ':' + k.p }));   // peça comum: a pose é outro apelido
      // "espelho": true (16:9) / "espelhoV": true|false (9:16) — a peça é desenhada espelhada (a máquina corre para o outro lado naquele formato)
      if (FMT === 'v' ? it.espelhoV ?? it.espelho : it.espelho) {
        it.flip = !it.flip; it.rot0 = -it.rot0;
        if (it.pivo) it.pivo = [-it.pivo[0], it.pivo[1]];
        it.muda = it.muda.map((k) => ({ ...k, rot: k.rot != null ? -k.rot : k.rot, rotV: k.rotV != null ? -k.rotV : k.rotV, dx: k.dx != null && !k.pos && !k.para ? -k.dx : k.dx }));
      }
    });
  }
  function fitImg(it) {
    const im = imgOf(it.p);
    if (!im || !it.box) return null;
    const b = it.box, pad = it.p.includes(':') ? 0.96 : 0.94;
    const s = Math.min(b.w * pad / im.width, b.h * pad / im.height) * (it.s ?? 1);
    if (it.estica) { it.estX = (b.w * pad / im.width) * (it.s ?? 1) / s; it.estY = (b.h * pad / im.height) * (it.s ?? 1) / s; }   // "estica": preenche a caixa (faixas de chão)
    const dw = im.width * s * (it.estX ?? 1), dh = im.height * s * (it.estY ?? 1);
    const chao = it.chao ?? (it.entra === 'sobe' || it.entra === 'cresce' || it.p.includes(':'));
    const cx = b.cx + (it.dx ?? 0) * b.w, cy = (chao ? b.y1 - dh / 2 : b.cy) + (it.dy ?? 0) * b.h;
    return { s, dw, dh, cx, cy };
  }
  // muda com "para": desloca o item até outro item do quadro (mesma posição relativa de "sobre"/"rel")
  function resolveMuda(sc) {
    const geoOf = (x) => x && (x.geo || (x.box && { cx: x.box.cx, cy: x.box.cy, dw: x.box.w * 0.8, dh: x.box.h * 0.8 }));
    for (const it of sc.itens) {
      if (!it.box) continue;
      for (const k of it.muda || []) {
        const p = (FMT === 'v' && k.posV) || k.pos;
        if (!p) continue;
        const ox = it.geo?.cx ?? it.box.cx, oy = it.geo?.cy ?? it.box.cy;
        k.dx = (p[0] * FW - ox) / it.box.w; k.dy = (p[1] * FH - oy) / it.box.h;
      }
      if (!it.muda?.some((k) => k.para)) continue;
      const gs = it.sobre ? geoOf(sc.byId[it.sobre]) : null;
      const r0 = (FMT === 'v' && it.relV) || it.rel || [0, -0.5];
      const ax = gs ? gs.cx + r0[0] * gs.dw : it.box.cx, ay = gs ? gs.cy + r0[1] * gs.dh : it.box.cy;
      for (const k of it.muda) {
        if (!k.para) continue;
        const g = geoOf(sc.byId[k.para]);
        if (!g) { console.warn('muda: alvo não encontrado', k.para); continue; }
        const rel = k.rel || (gs ? r0 : [0, 0]);
        k.dx = (g.cx + rel[0] * g.dw - ax) / it.box.w;
        k.dy = (g.cy + rel[1] * g.dh - ay) / it.box.h;
      }
    }
  }
  function layoutSobre(sc) {
    const by = {};
    for (const it of sc.itens) if (it.id || it.p) by[it.id || it.p] = it;
    for (const it of sc.itens) {
      if (!it.sobre) continue;
      const tg = by[it.sobre];
      const g = tg && (tg.geo || (tg.box && { cx: tg.box.cx, cy: tg.box.cy, dw: tg.box.w * 0.8, dh: tg.box.h * 0.8 }));
      if (!g) { it.box = box(-100, -100, 100, 100); continue; }
      const rel = (FMT === 'v' && it.relV) || it.rel || [0, -0.5];   // "relV": só no 9:16
      const k = it.tam ?? (it.txt != null ? 0.38 : 0.45);
      const cx = g.cx + rel[0] * g.dw, cy = g.cy + rel[1] * g.dh;
      const w = Math.max(g.dw, g.dh) * k;
      it.box = box(cx - w / 2, cy - w / 2, cx + w / 2, cy + w / 2);
    }
  }

  function jit(it, rc) {
    // "stop-motion" leve: ruído contínuo nas poses (12 qps), sem rotação — nada de pulos aleatórios de quadro a quadro
    const a = it.fixo ? 0 : (EST.tremor ?? 1);
    if (!a) return { dx: 0, dy: 0, dr: 0 };
    const q = rc.pose * 0.45;
    return { dx: snoise1(q, it.seed) * 0.8 * a, dy: snoise1(q, it.seed + 9) * 0.8 * a, dr: 0 };
  }
  function idle(it, t) {
    const ph = it.seed * 0.37, beat = TL.musica.periodo || 0.6;
    switch (it.anima) {
      case 'balanca': return { rot: Math.sin(t * TAU * 0.45 + ph) * 0.045 };
      case 'flutua': return { dy: Math.sin(t * TAU * 0.35 + ph) * 12 };
      case 'quica': { const b = ((t - (TL.musica.downbeat0 || 0)) / beat) % 1; return { dy: -Math.abs(Math.sin(Math.PI * b)) * 20, sy: 1 - 0.05 * Math.abs(Math.cos(Math.PI * b)) }; }
      case 'pulsa': return { s: 1 + 0.035 * Math.sin(t * TAU * 1.1 + ph) };
      case 'treme': return { dx: Math.sin(t * 61 + ph) * 3, rot: Math.sin(t * 47 + ph) * 0.02 };
      case 'gira': return { rot: t * (it.vel ?? 0.8) };
      case 'acena': return { rot: Math.sin(t * TAU * 1.4 + ph) * 0.09 };
      default: return it.p && it.p.includes(':') ? { dy: Math.sin(t * TAU * 0.5 + ph) * 5, rot: Math.sin(t * TAU * 0.25 + ph) * 0.015 } : {};
    }
  }
  /** transformação de entrada: fração 0→1 e deslocamentos */
  function enter(it, tq, V) {
    if (tq < it.t0) return null;
    const p = it.d > 0 ? clamp((tq - it.t0) / it.d) : 1;
    const o = { p, s: 1, sx: 1, sy: 1, dx: 0, dy: 0, rot: 0, alpha: 1, lift: 0 };
    switch (it.entra) {
      case 'pop': o.s = E.outBack(p, EST.suave ? 1.3 : 2.1); o.lift = (1 - p) * 0.9; break;
      case 'cai': o.dy = -(1 - E.outBounce(p)) * 560; o.lift = (1 - p) * 0.9; break;
      case 'sobe': case 'cresce': o.sy = E.outBack(p, it.entra === 'sobe' ? (EST.suave ? 1.1 : 1.5) : 1.8); o.sx = it.entra === 'sobe' ? 0.92 + 0.08 * p : o.sy; o.lift = (1 - p) * 0.4; break;
      case 'desliza_esq': o.dx = -(1 - E.outCubic(p)) * (V ? 900 : 1500); o.rot = (1 - p) * -0.2; o.lift = (1 - p) * 0.6; break;
      case 'desliza_dir': o.dx = (1 - E.outCubic(p)) * (V ? 900 : 1500); o.rot = (1 - p) * 0.2; o.lift = (1 - p) * 0.6; break;
      case 'voa': { const e = E.outCubic(p); o.dx = (1 - e) * 1300; o.dy = -Math.sin(e * Math.PI) * 260 + (1 - e) * -500; o.rot = (1 - e) * 1.6; o.lift = (1 - p); break; }
      case 'gira': o.rot = (1 - E.outBack(p, 1.5)) * -3.2; o.s = E.outBack(p, 1.6); break;
      case 'carimbo': o.s = 1.9 - 0.9 * E.outCubic(p); o.alpha = clamp(p * 3); o.lift = (1 - p) * 1.4; break;
      case 'aparece': o.alpha = E.outCubic(p); break;
      case 'abre': o.sx = E.outBack(p, 1.3); break;
      default: break;
    }
    return o;
  }
  function tweenMuda(it, t) {
    const o = { s: 1, dx: 0, dy: 0, rot: 0, alpha: 1 };
    let cur = { s: 1, dx: 0, dy: 0, rot: 0, alpha: 1 }, arco = 0;
    for (const k of it.muda) {
      const e = (E[(FMT === 'v' && k.easeV) || k.ease] || E.inOutCubic)(clamp((t - k.t) / k.d));   // "ease": "linear" | "inQuad" (queda) | "outQuad" | "outBounce"…
      const nx = { s: k.s ?? cur.s, dx: (k.dx ?? cur.dx), dy: (k.dy ?? cur.dy), rot: (FMT === 'v' && k.rotV != null ? k.rotV : k.rot) ?? cur.rot, alpha: k.alpha ?? cur.alpha };
      if (e <= 0) break;
      cur = { s: lerp(cur.s, nx.s, e), dx: lerp(cur.dx, nx.dx, e), dy: lerp(cur.dy, nx.dy, e), rot: lerp(cur.rot, nx.rot, e), alpha: lerp(cur.alpha, nx.alpha, e) };
      arco = k.arco && e < 1 ? -k.arco * Math.sin(Math.PI * clamp((t - k.t) / k.d)) : 0;
    }
    Object.assign(o, cur);
    o.dy += arco;
    return o;
  }
  function leave(it, tq) {
    if (tq < it.t1) return 1;
    const q = clamp((tq - it.t1) / 0.3);
    return 1 - q;
  }

  function drawItem(rc, sc, it) {
    const { ctx, t, tq } = rc;
    const V = FMT === 'v';
    const en = enter(it, tq, V);
    if (!en) return;
    const lv = leave(it, tq);
    if (lv <= 0) return;
    const j = jit(it, rc), id = idle(it, tq), mu = tweenMuda(it, t);
    const blue = CFG.estilo === 'B' && sc.revela != null && t < sc.revela + 0.6;
    if (it.kind === 'img') {
      const g = it.geo;
      if (!g) return;
      let pAtual = it.p;
      for (const k of it.posesT || []) if (t >= k.t && IMG.has(k.p)) pAtual = k.p;
      const im0 = imgOf(it.p), im = imgOf(pAtual);
      const kPose = im0 && im !== im0 ? Math.min(im0.width / im.width, im0.height / im.height) : 1;   // a nova pose cabe na caixa da primeira
      const s = g.s * kPose * en.s * (id.s ?? 1) * mu.s * (lv < 1 && it.sai?.como !== 'voa' ? E.outCubic(lv) : 1);
      const flip = it.flip ? -1 : 1;
      const chaoY = g.cy + g.dh / 2;
      const bottomAnchor = en.sy !== 1 || it.entra === 'sobe' || it.entra === 'cresce';
      let x = g.cx + en.dx + j.dx + (id.dx ?? 0) + mu.dx * (it.box?.w ?? 0);
      let y = (bottomAnchor ? chaoY : g.cy) + en.dy + j.dy + (id.dy ?? 0) + mu.dy * (it.box?.h ?? 0);
      if (lv < 1 && it.sai?.como === 'voa') { x += (1 - lv) * 1400; y -= (1 - lv) * 300; }
      if (it.segue && it.sobre) { const par = sc.byId[it.sobre]; if (par && par._off) { x += par._off[0]; y += par._off[1]; } }
      if (it.pivo && mu.rot) {   // "pivo": [u, v] (frações da peça, a partir do centro) — a rotação de "muda" gira em torno desse ponto
        const px = it.pivo[0] * im.width * s, py = it.pivo[1] * im.height * s, c = Math.cos(mu.rot), sn = Math.sin(mu.rot);
        x += px - (c * px - sn * py); y += py - (sn * px + c * py);
      }
      it._off = [x - g.cx, y - (bottomAnchor ? chaoY : g.cy)];
      const rot = it.rot0 + en.rot + j.dr + (id.rot ?? 0) + mu.rot;
      if (it.brilha != null && t >= it.brilha) drawGlow(ctx, x, y - (bottomAnchor ? g.dh / 2 : 0), Math.max(g.dw, g.dh) * 0.7, clamp((t - it.brilha) / 0.4), it.corBrilho);
      ctx.save();
      // personagens do último quadro saem quando entra o cartão final (o cartão traz os seus)
      const saiFinal = it.p.includes(':') ? 1 - clamp((t - LOGO + 0.12) / 0.25) : 1;
      if (saiFinal <= 0) { ctx.restore(); return; }
      ctx.globalAlpha *= en.alpha * mu.alpha * (it.alpha ?? 1) * saiFinal;
      if (blue) ctx.filter = sc.revela != null && t > sc.revela ? `grayscale(${1 - clamp((t - sc.revela) / 0.6)})` : 'grayscale(1) brightness(1.5) sepia(0.6) hue-rotate(160deg) saturate(2.2) contrast(0.85)';
      else if (it.filtro) ctx.filter = it.filtro;   // "filtro": filtro de canvas da peça (ex. "sepia(0.8) saturate(0.6)" = foto do ANTES)
      const local = (fn) => {   // desenha no referencial da peça (px da imagem, origem na âncora)
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(flip * s * en.sx, s * en.sy * (id.sy ?? 1));
        fn(im.width, im.height, (0.5 - (bottomAnchor ? 1 : 0.5)) * im.height); ctx.restore();
      };
      if (it.capa) local((w, h, oy) => drawCapa(ctx, it, w, h, oy, t, rc.zoom / Math.max(0.05, s)));
      if (it.partesT?.length) {
        ctx.save(); ctx.filter = 'grayscale(1) brightness(1.55) sepia(0.6) hue-rotate(160deg) saturate(2.2) contrast(0.85)';
        X.img(ctx, IMG.get(pAtual), x, y, { s, sx: en.sx, sy: en.sy * (id.sy ?? 1), rot, flip: flip < 0, ay: bottomAnchor ? 1 : 0.5, lift: en.lift, zoom: rc.zoom });
        ctx.restore();
        for (const pt of it.partesT) {
          const q = clamp((t - pt.t) / 0.7); if (q <= 0) continue;
          local((w, h, oy) => {
            const R = pt.r * Math.max(w, h) * E.outCubic(q), cx0 = pt.u * w, cy0 = oy + pt.v * h;
            ctx.save(); ctx.beginPath(); ctx.arc(cx0, cy0, R, 0, TAU); ctx.clip(); ctx.drawImage(im, -w / 2, oy - h / 2, w, h); ctx.restore();
            if (pt.r < 0.9) {   // contorno de lupa de raio-X (tracejado de planta técnica depois de revelado)
              ctx.save(); ctx.strokeStyle = q < 1 ? 'rgba(255,255,255,0.95)' : 'rgba(234,244,251,0.75)'; ctx.lineWidth = (q < 1 ? 9 : 5) / Math.max(0.05, s);
              if (q >= 1) ctx.setLineDash([22 / s, 14 / s]); ctx.beginPath(); ctx.arc(cx0, cy0, R, 0, TAU); ctx.stroke(); ctx.restore();
            }
          });
        }
      } else X.img(ctx, IMG.get(pAtual), x, y, { s, sx: en.sx * (it.estX ?? 1), sy: en.sy * (id.sy ?? 1) * (it.estY ?? 1), rot, flip: flip < 0, ay: bottomAnchor ? 1 : 0.5, lift: en.lift + (it.lift ?? 0), zoom: rc.zoom, shadowStrength: LIVRO() ? 0.5 : 1 });
      if (it.rosto) local((w, h, oy) => drawRosto(ctx, it, w, h, oy, t));
      ctx.restore();
      return;
    }
    if (it.kind === 'txt') return drawText(rc, sc, it, en, j, id, mu, lv);
    if (C.efeitos) C.efeitos.draw(rc, sc, it, en, { PAL, EST, cor, FMT, LANG, L, imgOf, IMG, TL, byId: sc.byId, dados: DADOS });
  }

  // ---------- rosto e capa desenhados em peças (a heroína da HQ) ----------
  // "rosto": { "pos": [u, v] (fração da peça, 0,0 = centro), "tam": 0.3 (distância entre os olhos, fração da largura),
  //            "humor": "feliz", "trocas": [{ "em": "palavra", "humor": "medo" }], "olhar": [x, y] }
  // humores: feliz · alegre (olhos fechados ^^) · medo · decidida · brava · enjoada · triste · surpresa · piscando · dormindo (com zzz)
  // "capa": { "em": "palavra", "cor": "coral", "pos": [u, v] (ombros), "larg": 0.5 (fração da largura) } — esvoaça para trás
  function humorEm(it, t) {
    const r = it.rosto; let h = r.humor || 'feliz';
    for (const k of it.rostoT || []) if (t >= k.t) h = k.humor;
    return h;
  }
  function drawCapa(ctx, it, w, h, oy, t, zoom) {
    const c = it.capa, p = clamp((t - it.capaT) / 0.4);
    if (!c || p <= 0) return;
    const e = E.outBack(p, 1.6), [u, v] = c.pos || [0, -0.1];
    const x0 = u * w, y0 = oy + v * h, cw = (c.larg ?? 0.5) * w * e, len = (c.comp ?? 0.75) * h * e;
    const pts = [];
    const n = 14;
    for (let i = 0; i <= n; i++) { const q = i / n; pts.push([x0 - cw * 0.35 + cw * 0.7 * q, y0]); }
    for (let i = 0; i <= n; i++) {   // barra de baixo, ondulando, jogada para trás (esquerda)
      const q = 1 - i / n;
      const wav = Math.sin(t * 7 + q * 5) * len * 0.06;
      pts.push([x0 - cw * 0.35 - len * 0.55 + (cw * 1.2) * q, y0 + len + wav]);
    }
    SP.piece(ctx, pts, { color: cor(c.cor, PAL.coral), seed: it.seed + 3, ink: { w: 5 }, shadow: { zoom, lift: 0.2 } });
  }
  function drawRosto(ctx, it, w, h, oy, t) {
    const r = it.rosto; if (!r) return;
    const hum = humorEm(it, t);
    const [u, v] = r.pos || [0, -0.1], d = (r.tam ?? 0.28) * w, cx = u * w, cy = oy + v * h;
    const er = d * 0.36, look = r.olhar || [0.25, 0];
    const blink = hum !== 'alegre' && hum !== 'piscando' && ((t + it.seed * 0.37) % 3.3) < 0.12;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const L = Math.max(3, d * 0.07);
    for (const sx of [-1, 1]) {
      const ex = cx + sx * d / 2, ey = cy;
      const fech = blink || hum === 'alegre' || hum === 'dormindo' || (hum === 'piscando' && sx > 0);
      if (fech) {   // olho fechado: arco ^
        ctx.strokeStyle = INK; ctx.lineWidth = L * 1.3;
        if (hum === 'dormindo') { ctx.beginPath(); ctx.arc(ex, ey - er * 0.2, er * 0.7, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(ex, ey + er * 0.3, er * 0.7, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
      } else {
        const ry = hum === 'enjoada' ? er * 0.55 : hum === 'medo' || hum === 'surpresa' ? er * 1.15 : er;
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = INK; ctx.lineWidth = L;
        ctx.beginPath(); ctx.ellipse(ex, ey, er * 0.82, ry, 0, 0, TAU); ctx.fill(); ctx.stroke();
        const pr = hum === 'medo' ? er * 0.26 : er * 0.42;
        const px = ex + look[0] * er * 0.35, py = ey + look[1] * er * 0.35 + (hum === 'enjoada' ? ry * 0.2 : 0);
        ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(px, py, pr, 0, TAU); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(px + pr * 0.35, py - pr * 0.38, pr * 0.34, 0, TAU); ctx.fill();
        if (hum === 'enjoada') { ctx.fillStyle = '#9fc56b'; ctx.beginPath(); ctx.ellipse(ex, ey - ry * 0.45, er * 0.84, ry * 0.6, 0, Math.PI, TAU); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = L; ctx.beginPath(); ctx.moveTo(ex - er * 0.84, ey - ry * 0.1); ctx.lineTo(ex + er * 0.84, ey - ry * 0.1); ctx.stroke(); }
      }
      // sobrancelhas
      if (hum === 'decidida' || hum === 'brava' || hum === 'triste' || hum === 'medo' || hum === 'surpresa') {
        const k = hum === 'decidida' || hum === 'brava' ? 1 : hum === 'triste' || hum === 'medo' ? -1 : 0;
        ctx.strokeStyle = INK; ctx.lineWidth = L * 1.2;
        const by = ey - er * (hum === 'surpresa' ? 1.65 : 1.35);
        ctx.beginPath(); ctx.moveTo(ex - sx * er * 0.75, by - k * er * 0.25); ctx.lineTo(ex + sx * er * 0.75, by + k * er * 0.25); ctx.stroke();
      }
    }
    // boca
    const my = cy + d * 0.62, mw = d * 0.42;
    ctx.strokeStyle = INK; ctx.lineWidth = L * 1.2;
    if (hum === 'feliz' || hum === 'alegre' || hum === 'piscando') {
      ctx.fillStyle = '#7a2e22'; ctx.beginPath(); ctx.moveTo(cx - mw, my - mw * 0.15); ctx.quadraticCurveTo(cx, my + mw * (hum === 'alegre' ? 1.2 : 0.95), cx + mw, my - mw * 0.15); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f28b82'; ctx.beginPath(); ctx.ellipse(cx, my + mw * 0.42, mw * 0.4, mw * 0.18, 0, 0, TAU); ctx.fill();
    } else if (hum === 'decidida') {
      ctx.beginPath(); ctx.moveTo(cx - mw * 0.8, my + mw * 0.1); ctx.quadraticCurveTo(cx + mw * 0.2, my + mw * 0.35, cx + mw * 0.9, my - mw * 0.2); ctx.stroke();
    } else if (hum === 'medo' || hum === 'enjoada') {
      ctx.beginPath(); for (let i = 0; i <= 12; i++) { const q = i / 12; const xx = cx - mw * 0.8 + q * mw * 1.6, yy = my + Math.sin(q * TAU * 1.5) * mw * 0.12; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke();
      if (hum === 'medo') {   // gota de suor
        const gx = cx + d * 0.95, gy = cy - d * 0.25, gr = d * 0.11;
        ctx.fillStyle = '#8ec5d6'; ctx.beginPath(); ctx.moveTo(gx, gy - gr * 1.8); ctx.quadraticCurveTo(gx + gr, gy - gr * 0.2, gx, gy + gr); ctx.quadraticCurveTo(gx - gr, gy - gr * 0.2, gx, gy - gr * 1.8); ctx.fill(); ctx.lineWidth = L * 0.7; ctx.stroke();
      }
    } else if (hum === 'triste' || hum === 'brava') {
      ctx.beginPath(); ctx.moveTo(cx - mw * 0.7, my + mw * 0.3); ctx.quadraticCurveTo(cx, my - mw * 0.25, cx + mw * 0.7, my + mw * 0.3); ctx.stroke();
    } else if (hum === 'dormindo') {   // boquinha e zzz subindo
      ctx.fillStyle = '#7a2e22'; ctx.beginPath(); ctx.ellipse(cx, my + mw * 0.05, mw * 0.18, mw * 0.14, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f4f1e6'; ctx.strokeStyle = INK; ctx.lineWidth = L * 0.8; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let i = 0; i < 3; i++) { const q = ((t * 0.45) + i / 3) % 1, fs = d * (0.35 + 0.25 * q); ctx.globalAlpha = 1 - q; ctx.font = `700 ${fs}px "Luckiest Guy", sans-serif`; const zx = cx + d * (0.9 + q * 0.6), zy = cy - d * (0.6 + q * 1.4); ctx.strokeText('z', zx, zy); ctx.fillText('z', zx, zy); }
      ctx.globalAlpha = 1;
    } else if (hum === 'surpresa') {
      ctx.fillStyle = '#7a2e22'; ctx.beginPath(); ctx.ellipse(cx, my + mw * 0.1, mw * 0.32, mw * 0.42, 0, 0, TAU); ctx.fill(); ctx.stroke();
    }
    // bochechas
    if (hum === 'feliz' || hum === 'alegre' || hum === 'piscando' || hum === 'decidida') {
      ctx.fillStyle = 'rgba(242,120,110,0.45)';
      for (const sx of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + sx * d * 0.85, cy + d * 0.45, er * 0.55, er * 0.32, 0, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }

  function drawGlow(ctx, x, y, r, a, col) {
    const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
    g.addColorStop(0, `rgba(255,236,160,${0.75 * a})`); g.addColorStop(0.5, `rgba(255,214,110,${0.35 * a})`); g.addColorStop(1, 'rgba(255,214,110,0)');
    ctx.fillStyle = col ? col : g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }

  // ---------- texto ----------
  const RANSOM = new Map();
  function textPlan(it) {
    const txt = String(L(it.txt));
    const tipo = it.tipo || 'letras';
    const b = it.box || box(-300, -80, 300, 80);
    const ink = cor(it.cor, EST.tinta);
    if (tipo === 'letras') {
      if (!RANSOM.has(it.seed)) {
        const lines = txt.split('\n').map((ln, i) => T.ransom(ln, { size: 150, seed: it.seed + i * 5, tilt: 0.1, papers: it.papeis ? it.papeis.map((c) => cor(c)) : undefined }));
        RANSOM.set(it.seed, lines);
      }
      const lines = RANSOM.get(it.seed);
      const wMax = Math.max(...lines.map((l) => l.width)), hTot = lines.length * 170;
      const sc = Math.min(b.w * 0.94 / wMax, b.h * 0.92 / hTot, it.max ?? 1.3) * (it.s ?? 1);
      return { tipo, lines, sc, ink };
    }
    if (tipo === 'carimbo') {
      const spr = T.stamp('ep' + it.seed, txt.toUpperCase(), { size: 90, color: cor(it.cor, PAL.coral), seed: it.seed });
      const sc = Math.min(b.w * 0.9 / spr.w, b.h * 0.9 / spr.h, it.max ?? 1.6) * (it.s ?? 1);
      return { tipo, spr, sc };
    }
    const font = it.fonte || (tipo === 'giz' ? 'Gochi Hand' : tipo === 'pow' || tipo === 'hq' || tipo === 'pontos' ? 'Luckiest Guy' : EST.fonte === 'Luckiest Guy' && tipo !== 'mao' ? 'Luckiest Guy' : tipo === 'balao' ? 'Caveat Brush' : EST.fonte);
    const lines = txt.split('\n');
    const base = 100;
    const wMax = Math.max(...lines.map((ln) => T.measure(MEAS, ln, { size: base, font, weight: 700 })));
    let size = Math.min(base * (b.w * (tipo === 'balao' || tipo === 'pow' ? 0.66 : 0.92)) / Math.max(1, wMax), b.h * (tipo === 'balao' || tipo === 'pow' ? 0.46 : 0.8) / (lines.length * 1.1), it.max ?? 150);
    size *= it.s ?? 1;
    return { tipo, font, size, lines, ink, txt };
  }
  function drawText(rc, sc, it, en, j, id, mu, lv) {
    const { ctx, tq, t } = rc;
    const b = it.box;
    if (!it.tp) it.tp = textPlan(it);
    const tp = it.tp;
    const x = b.cx + j.dx + (id.dx ?? 0) + mu.dx * b.w, y = b.cy + j.dy + (id.dy ?? 0) + mu.dy * b.h;
    const rot = it.rot0 + (id.rot ?? 0) + mu.rot;
    const fade = lv < 1 ? E.outCubic(lv) : 1;
    ctx.save();
    ctx.globalAlpha *= fade * mu.alpha;
    if (tp.tipo === 'letras') {
      tp.lines.forEach((ln, li) => {
        const ly = y + (li - (tp.lines.length - 1) / 2) * 170 * tp.sc;
        ln.forEach((l, i) => {
          const p = E.outBack(clamp((tq - (it.t0 + (li * ln.length + i) * 0.055)) / 0.3), 2.4);
          if (p <= 0) return;
          SP.place(ctx, l.spr, x + l.x * tp.sc, ly + l.y * tp.sc, { rot: l.rot + rot * 0.5, s: p * tp.sc * mu.s, lift: (1 - p) * 0.9, zoom: rc.zoom });
        });
      });
    } else if (tp.tipo === 'carimbo') {
      if (en.p <= 0) { ctx.restore(); return; }
      ctx.globalAlpha *= en.alpha;
      SP.place(ctx, tp.spr, x, y, { rot: rot - 0.08, s: tp.sc * en.s * mu.s, lift: en.lift, zoom: rc.zoom, shadow: false });
    } else if (tp.tipo === 'etiqueta') {
      if (en.p <= 0) { ctx.restore(); return; }
      X.tag(ctx, tp.txt, x, y, { size: tp.size * 0.8, rot: rot - 0.04, s: E.outBack(en.p, 2) * mu.s, seed: it.seed, zoom: rc.zoom, paper: cor(it.papel, PAL.papel), ink: cor(it.cor, INK), tape: it.fita ?? true, lift: en.lift });
    } else if (tp.tipo === 'formula') {
      if (en.p <= 0) { ctx.restore(); return; }
      ctx.translate(x, y); ctx.rotate(rot); ctx.scale(E.outBack(en.p, 2) * mu.s, E.outBack(en.p, 2) * mu.s);
      T.formula(ctx, tp.txt, 0, 0, { size: tp.size, color: tp.ink, stroke: CFG.estilo === 'L' || CFG.estilo === 'B' ? null : '#fbf8f0', strokeW: tp.size * 0.14 });
    } else if (tp.tipo === 'pontos') {   // +100 que sobe e some
      const q = clamp((t - it.t0) / 0.9); if (q <= 0 || q >= 1) { ctx.restore(); return; }
      ctx.translate(x, y - E.outCubic(q) * 90); ctx.globalAlpha *= 1 - clamp((q - 0.6) / 0.4);
      T.hand(ctx, tp.lines.join('\n'), 0, 0, { size: tp.size, font: tp.font, weight: 700, color: cor(it.cor, PAL.amarelo), stroke: '#1b2a33', strokeW: tp.size * 0.18, seed: it.seed, boil: 0, jitter: 0 });
    } else if (tp.tipo === 'balao' || tp.tipo === 'pow') {
      if (en.p <= 0) { ctx.restore(); return; }
      const s = E.outBack(en.p, 2.2) * mu.s;
      ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
      const w = b.w * 0.5, h = b.h * 0.42;
      if (tp.tipo === 'pow') {
        // a estrela abraça o texto (não a caixa): em faixas largas (título, canto) os raios não viram um sol gigante
        const tw = Math.max(...tp.lines.map((ln) => T.measure(MEAS, ln, { size: tp.size, font: tp.font, weight: 700 }))), th = tp.lines.length * tp.size;
        const rin = Math.min(Math.max(tw * 0.58, th * 0.95), Math.max(w, h) * 0.9), rout = rin * 1.42;
        SP.piece(ctx, S.star(0, 0, rin, rout, 13, { seed: it.seed }), { color: cor(it.fundo, PAL.amarelo), seed: it.seed, shadow: { zoom: rc.zoom, lift: 0.2 }, ink: { w: 7, boil: rc.boil }, edge: 0.3 });
      } else {
        const tail = (FMT === 'v' && it.caudaV) || it.cauda || [-0.35, 0.9];   // "caudaV": cauda só no 9:16
        const bub = S.blob(0, 0, w, h, { seed: it.seed, wobble: 0.04, n: 70 });
        SP.piece(ctx, S.cut([[w * tail[0] - 30, h * 0.6], [w * tail[0] * 1.6, h * tail[1] * 1.5], [w * tail[0] + 40, h * 0.62]], { seed: it.seed + 2 }), { color: PAL.papel, seed: it.seed, ink: { w: 5, boil: rc.boil } });
        SP.piece(ctx, bub, { color: cor(it.fundo, PAL.papel), seed: it.seed + 1, shadow: { zoom: rc.zoom, lift: 0.15 }, ink: { w: 5, boil: rc.boil } });
      }
      T.hand(ctx, tp.lines.join('\n'), 0, 0, { size: tp.size, font: tp.font, weight: 700, color: cor(it.cor, tp.tipo === 'pow' ? PAL.coral : INK), stroke: tp.tipo === 'pow' ? '#fbf8f0' : null, strokeW: tp.size * 0.16, seed: it.seed, boil: rc.boil, jitter: 0.6 });
    } else {
      // mao / giz / hq: escrita progressiva
      const prog = clamp((t - it.t0) / Math.max(0.35, it.d));
      if (prog <= 0) { ctx.restore(); return; }
      const giz = tp.tipo === 'giz' || CFG.estilo === 'L';
      ctx.translate(x, y); ctx.rotate(rot); ctx.scale(mu.s, mu.s);
      T.hand(ctx, tp.lines.join('\n'), 0, 0, { size: tp.size, font: tp.font, weight: 700, color: tp.ink, progress: prog, boil: rc.boil, seed: it.seed, stroke: giz || CFG.estilo === 'B' ? null : (it.contorno === false ? null : '#fbf8f0'), strokeW: tp.size * 0.14, lh: 1.05 });
    }
    ctx.restore();
  }

  // ---------- câmera ----------
  let CAMS = [];
  function sceneCam(k) {
    const b = BOARDS[k], sc = SCENES[k];
    const z0 = (FMT === 'v' && sc.zoomV != null ? sc.zoomV : sc.zoom) ?? 1, fc = (FMT === 'v' && sc.focoV) || sc.foco;
    return { x: b.x + (fc ? fc[0] * FW : 0), y: b.y + (fc ? fc[1] * FH : 0), z: z0 };
  }
  function buildCamera() {
    CAMS = SCENES.map((sc, k) => {
      const base = sceneCam(k);
      const keys = (sc.cam || []).map((c) => {
        const t0 = tEm(sc, c.em, sc.t0);
        let x = base.x, y = base.y;
        if (c.alvo) {
          const tg = sc.byId[c.alvo];
          const g = tg && (tg.geo || tg.box);
          if (g) { const b = BOARDS[k]; const lx = g.cx, ly = g.cy; const cs = Math.cos(b.rot), sn = Math.sin(b.rot); x = b.x + lx * cs - ly * sn; y = b.y + lx * sn + ly * cs; }
        } else if (c.foco) { const fc = (FMT === 'v' && c.focoV) || c.foco; x = BOARDS[k].x + fc[0] * FW; y = BOARDS[k].y + fc[1] * FH; }   // "focoV": foco só no 9:16
        return { t: t0, d: c.d ?? 0.7, x, y, z: (FMT === 'v' && c.zV != null ? c.zV : c.z) ?? base.z };   // "zV": zoom só no 9:16
      });
      if (sc.recua) keys.push({ t: tEm(sc, sc.recua === true ? 'inicio' : sc.recua, sc.t0), d: 1.4, ...overview() });
      return { base, keys, t0: sc.t0, pan: (sc.transicao ?? CFG.transicao) === 'corta' ? 0.001 : (sc.pan ?? (LIVRO() ? clamp(TL.musica?.periodo || 0.62, 0.55, 0.8) : CONT() ? clamp((TL.musica?.periodo || 0.6) * 1.35, 0.7, 0.95) : 0.62)) };
    });
    // capa do livro: fecha o livro até a 1ª virada (a capa abre no tempo forte antes da 1ª fala)
    CAPA = null;
    if (LIVRO() && CFG.capa && SCENES.length) {
      const t1 = naBatida(Lin(SCENES[0].falas[0]).inicio - 0.1);
      const d = clamp((TL.musica?.periodo || 0.62) * 1.3, 0.7, 1.0);
      CAPA = { t0: Math.max(0.35, t1 - d), t1 };
    }
  }
  function overview() {
    const x0 = Math.min(...BOARDS.map((b) => b.x - b.w / 1.8)), x1 = Math.max(...BOARDS.map((b) => b.x + b.w / 1.8));
    const y0 = Math.min(...BOARDS.map((b) => b.y - b.h / 1.8)), y1 = Math.max(...BOARDS.map((b) => b.y + b.h / 1.8));
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, z: Math.min(FW / (x1 - x0), FH / (y1 - y0)) * 0.96 };
  }
  function poseIn(k, t) {
    const c = CAMS[k];
    const sc = SCENES[k];
    const tEnd = k + 1 < SCENES.length ? CAMS[k + 1].t0 - CAMS[k + 1].pan : FIM;
    const span = Math.max(1, tEnd - c.t0);
    const push = 1 + (sc.empurra ?? 0.035) * E.inOutSine(clamp((t - c.t0) / span));
    let x = c.base.x, y = c.base.y, z = c.base.z;
    for (const kf of c.keys) {
      if (t < kf.t) break;
      const e = E.inOutCubic(clamp((t - kf.t) / kf.d));
      x = lerp(x, kf.x, e); y = lerp(y, kf.y, e); z = lerp(z, kf.z, e);
    }
    return { x, y, z: z * push };
  }
  function camera(t) {
    let k = 0;
    for (let i = 0; i < CAMS.length; i++) if (t >= CAMS[i].t0 - CAMS[i].pan) k = i;
    let pose;
    const c = CAMS[k];
    if (k > 0 && t < c.t0) {
      const a = poseIn(k - 1, c.t0 - c.pan), b = poseIn(k, c.t0);
      const p = clamp((t - (c.t0 - c.pan)) / c.pan);
      const e = E.inOutCubic(p);
      const dip = 1 - (LIVRO() ? 0.012 : 0.07) * Math.sin(Math.PI * p);
      pose = { x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e), z: lerp(a.z, b.z, e) * dip };
    } else pose = poseIn(k, Math.max(t, c.t0));
    const drift = { x: snoise1(t * 0.35, 11) * 4, y: snoise1(t * 0.31, 17) * 3 };
    return { x: pose.x + drift.x, y: pose.y + drift.y, zoom: pose.z, rot: 0 };
  }
  function camSpeed(t) {
    const a = camera(t), b = camera(t + 1 / 48);
    return Math.hypot(b.x - a.x, b.y - a.y) * 48 * a.zoom + Math.abs(b.zoom - a.zoom) * 48 * 900;
  }

  // ---------- efeitos sonoros (deixas) ----------
  const SOM = { pop: 'pop', cai: 'papel_pousa', sobe: 'papel_desliza', cresce: 'broto', desliza_esq: 'papel_desliza', desliza_dir: 'papel_desliza', voa: 'whoosh_curto', gira: 'whoosh_curto', carimbo: 'carimbo', aparece: 'brilho', abre: 'abre' };
  function cues() {
    SFX.length = 0;
    SCENES.forEach((sc, k) => {
      const corta = (sc.transicao ?? CFG.transicao) === 'corta';
      if (k > 0 && corta) sfx(CAMS[k].t0, 'clique', { g: 0.3, p: 0.9 });
      if (k > 0 && CFG.jogo) sfx(CAMS[k].t0 - CAMS[k].pan, 'pulo', { g: 0.3 });
      if (k > 0 && CFG.lousa) sfx(CAMS[k].t0 - CAMS[k].pan, 'rabisco', { g: 0.26, dur: CAMS[k].pan });
      if (k > 0 && CFG.caderno) sfx(CAMS[k].t0 - CAMS[k].pan - 0.1, 'rabisco', { g: 0.3, dur: CAMS[k].pan + 0.15 });
      if (k > 0 && CFG.estrada) sfx(CAMS[k].t0 - CAMS[k].pan, CFG.estrada.visual === 'esteira' ? 'maquina' : sc.rebobina ? 'chiado' : 'motor', { g: sc.rebobina ? 0.3 : 0.24, dur: CAMS[k].pan });
      if (CFG.estrada?.visual === 'esteira' && sc.carga && sc.cargaEm != null) { sfx(tEm(sc, sc.cargaEm, sc.t0), 'estrela', { g: 0.35 }); sfx(tEm(sc, sc.cargaEm, sc.t0) + 0.02, 'pop', { g: 0.4, p: 0.9 }); }
      if (k > 0 && !corta) sfx(CAMS[k].t0 - CAMS[k].pan, LIVRO() ? 'pagina' : 'whoosh', { g: LIVRO() ? 0.55 : 0.32, dur: LIVRO() ? CAMS[k].pan + 0.05 : 0.8, p: 1.1 + (k % 3) * 0.08, pan: FMT === 'v' ? 0 : 0.3 });
      if (k > 0 && CFG.maquete) sfx(CAMS[k].t0 - CAMS[k].pan, 'plop', { g: 0.22, p: 0.8, pan: 0 });
      if (k > 0 && CFG.colcha) sfx(CAMS[k].t0 - CAMS[k].pan - 0.12, 'costura', { g: 0.34, dur: CAMS[k].pan + 0.2, pan: 0 });
      if (k === 0 && CAPA) sfx(CAPA.t0, 'pagina', { g: 0.65, dur: CAPA.t1 - CAPA.t0 + 0.05, p: 0.8, pan: FMT === 'v' ? 0 : 0.2 });
      sc.itens.forEach((it, i) => {
        if (it.mudo) return;
        const pan = clamp((it.box?.cx ?? 0) / (FW * 0.6), -0.8, 0.8);
        const g = (it.ganho ?? 1);
        if (it.som) { sfx(it.t0 + (it.somEm ?? 0.05), it.som, { g: 0.5 * g, pan, dur: it.somDur }); }
        else if (it.kind === 'txt') {
          const tipo = it.tipo || 'letras';
          if (tipo === 'letras') { const n = Math.min(10, String(L(it.txt)).replace(/\s/g, '').length); for (let q = 0; q < n; q++) sfx(it.t0 + q * 0.055 + 0.07, 'letra', { g: 0.4 * g, pan: pan - 0.2 + q * 0.04, p: 0.9 + q * 0.04 }); }
          else if (tipo === 'carimbo') sfx(it.t0 + 0.12, 'carimbo', { g: 0.6 * g, pan });
          else if (tipo === 'etiqueta' || tipo === 'balao' || tipo === 'pow') sfx(it.t0 + 0.05, tipo === 'pow' ? 'boing' : 'pop', { g: 0.45 * g, pan, p: 1.1 });
          else sfx(it.t0, 'rabisco', { g: 0.28 * g, pan, dur: Math.max(0.4, it.d) });
        } else if (it.kind === 'img') {
          const nm = SOM[it.entra];
          if (nm) sfx(it.t0 + (it.entra === 'cai' ? it.d * 0.55 : 0.04), nm, { g: (it.entra === 'pop' ? 0.42 : it.entra === 'sobe' ? 0.3 : 0.38) * g, pan, p: 0.9 + hrand(it.seed, 3) * 0.3 });
          if (it.brilha != null && it.somBrilho !== false) sfx(it.brilha, it.somBrilho || 'lampada', { g: 0.4 * g * (it.somBrilhoG ?? 1), pan, p: it.somBrilhoP });   // "somBrilho": outro som (ou false) ao acender
          for (const m of it.muda) { if (m.som) sfx(m.t, m.som, { g: 0.4 * g * (m.somG ?? 1), pan, dur: m.d, p: m.somP }); if (m.somFim) sfx(m.t + m.d, m.somFim, { g: 0.4 * g * (m.somFimG ?? 1), pan, p: m.somP }); }   // "somFim": som na chegada
        } else if (C.efeitos) C.efeitos.cue(it, (t, n, o) => sfx(t, n, { pan, ...o }), { L });
      });
    });
    if (CFG.abertura) {
      const A = CFG.abertura, vir = A.virada ?? 1.7, fimA = A.ate ?? (Lin(SCENES[0].falas[0]).inicio - 0.15);
      sfx(0.2, 'logo', { g: 0.7 }); sfx(vir, 'pagina', { g: 0.5, dur: 0.5 }); sfx(vir + 0.3, 'festa', { g: 0.35 }); sfx(fimA, 'whoosh', { g: 0.4, dur: 0.6 });
    }
    sfx(LOGO - 0.04, 'logo', { g: 0.8 });
    sfx(LOGO + 0.35, 'boing', { g: 0.35, pan: FMT === 'v' ? 0 : 0.5, p: 1.2 });
    SFX.sort((a, b) => a.t - b.t);
  }

  // ---------- molduras (sobreposições de formato: vhs, vlog, tv, palco, game, relógio) ----------
  function buildMolduras() {
    MOLD = (CFG.molduras || []).map((m) => {
      const sc0 = { t0: 0, falas: TL.falas.map((f) => f.id) };
      return { ...m, a: m.de ? tEm(sc0, m.de, 0) : 0, b: m.ate ? tEm(sc0, m.ate, LOGO) : LOGO - 0.2 };
    });
  }

  // ---------- legenda embutida (opcional) ----------
  function drawCaptions(rc) {
    if (!CAPS) return;
    const { ctx, t, W: Wd, H } = rc;
    if (t > LOGO - 0.05) return;
    const c = CAPS.find((c) => t >= c.a && t <= c.b);
    if (!c) return;
    const k = Math.min(1, (t - c.a) / 0.12, (c.b - t) / 0.12);
    ctx.save();
    ctx.globalAlpha = Math.max(0, k);
    const size = FMT === 'v' ? 44 : 44;
    ctx.font = `500 ${size}px "Neulis Sans", "Kalam", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = c.txt.split('\n');
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 56, lh = size * 1.27, h = lines.length * lh + 26;
    const y = FMT === 'v' ? H - 470 : H - 74 - h / 2;
    ctx.fillStyle = 'rgba(20,32,39,0.84)';
    ctx.beginPath(); ctx.roundRect(Wd / 2 - w / 2, y - h / 2, w, h, 14); ctx.fill();
    ctx.fillStyle = '#fbf8f0';
    lines.forEach((l, i) => ctx.fillText(l, Wd / 2, y + (i - (lines.length - 1) / 2) * lh + 2));
    ctx.restore();
  }

  // ---------- abertura com o logo e tela de live (vlog) ----------
  // "abertura": { "canal": "DIÁRIO DA ARQUEIA", "sub": "ep. 13 · …", "p": "arqueia:feliz", "ate": 4.4 } — o logo CP2B entra
  //   num cartão branco, vira e mostra o cartão do "canal"; tudo antes da 1ª fala (use produzir.py --intro para abrir espaço).
  // "live": { "de": "L01:inicio", "ate": "L09:fim", "espectadores": [120, 3400],
  //   "chat": [{ "em": "L01:dia", "autor": "Metaninho", "txt": "bom dia!", "cor": "petrol" }],
  //   "capitulos": [{ "em": "L03:inicio", "txt": "hidrólise" }, …], "coracoes": ["L06:metano", …] }
  function drawAbertura(rc) {
    const A = CFG.abertura; if (!A) return;
    const { ctx, t, tq, W: Wd, H } = rc, V = FMT === 'v';
    const fim = A.ate ?? (Lin(SCENES[0].falas[0]).inicio - 0.15);
    if (t > fim + 0.5) return;
    const sai = clamp((t - fim) / 0.5);   // cortina de papel que sobe
    ctx.save();
    ctx.translate(0, -E.inCubic(sai) * H * 1.05);
    ctx.fillStyle = P.pattern(ctx, '#f3ead8', 'felt', { seed: 3 }); ctx.fillRect(0, 0, Wd, H * 1.05);
    ctx.fillStyle = 'rgba(0,0,0,0.05)'; for (let y = 40; y < H; y += 80) for (let x = ((y / 80) % 2) * 40; x < Wd; x += 80) { ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); }
    I.dashed(ctx, rectPts(36, 36, Wd - 36, H - 36).concat([[36, 36]]), { dash: 24, gap: 16, w: 5, color: 'rgba(30,62,76,0.45)', seed: 3, boil: 0 });
    const vira = clamp((t - (A.virada ?? 1.7)) / 0.45);   // o cartão vira (escala horizontal passa por 0)
    const cx = Wd / 2, cy = V ? H * 0.45 : H / 2;
    const pIn = pop(tq, 0.15, 0.55, 1.6);
    const sx = vira < 0.5 ? 1 - vira * 2 : (vira - 0.5) * 2;
    const [cw, ch] = V ? [880, 620] : [1100, 560];
    ctx.save(); ctx.translate(cx, cy + (1 - pIn) * 400); ctx.scale(Math.max(0.001, sx) * pIn, pIn); ctx.rotate(vira < 0.5 ? -0.02 : 0.015);
    SP.setShadow(ctx, 1, 0.5, 1.1);
    ctx.fillStyle = vira < 0.5 ? '#ffffff' : '#1e3e4c'; ctx.beginPath(); ctx.roundRect(-cw / 2, -ch / 2, cw, ch, 26); ctx.fill(); SP.clearShadow(ctx);
    if (vira < 0.5) {
      const logo = X.images.get('logo');
      if (logo) { const lw = cw * 0.78, lh = lw * logo.height / logo.width; ctx.drawImage(logo, -lw / 2, -lh / 2 - 30, lw, lh); }
      ctx.fillStyle = PAL.petrol; ctx.font = `700 ${V ? 40 : 42}px "Neulis Sans", "Kalam", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('apresenta', 0, ch / 2 - 70);
    } else {
      I.dashed(ctx, rectPts(-cw / 2 + 22, -ch / 2 + 22, cw / 2 - 22, ch / 2 - 22).concat([[-cw / 2 + 22, -ch / 2 + 22]]), { dash: 22, gap: 14, w: 5, color: '#f2c14e', seed: 4, boil: 0 });
      const im = A.p ? imgOf(A.p) : null;
      if (im) { const h = ch * (V ? 0.42 : 0.62), s = h / im.height; X.img(ctx, IMG.get(A.p), -cw / 2 + 40 + im.width * s / 2, ch / 2 - 40, { s, ay: 1, rot: Math.sin(t * 5) * 0.05 }); }
      const tx = im ? (V ? 60 : 90) : 0;
      ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.roundRect(tx - 150, -ch / 2 + 70, 300, 64, 32); ctx.fill();
      ctx.fillStyle = '#fbf8f0'; ctx.font = `700 34px "Archivo Black", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(A.selo ? L(A.selo) : (Math.floor(t * 2) % 2 ? '● ' : '○ ') + 'AO VIVO', tx, -ch / 2 + 103);   // "selo": texto da pílula (padrão ● AO VIVO)
      ctx.fillStyle = '#f2c14e'; ctx.font = `700 ${V ? 64 : 76}px "Luckiest Guy", sans-serif`;
      String(L(A.canal) || '').split('\n').forEach((ln, i, a) => ctx.fillText(ln, tx, -10 + (i - (a.length - 1) / 2) * 80));
      ctx.fillStyle = '#fbf8f0'; ctx.font = `600 ${V ? 30 : 36}px "Neulis Sans", "Kalam", sans-serif`;
      String(L(A.sub) || '').split(V ? ' · ' : ' ').forEach((ln, i, a) => ctx.fillText(ln, tx, ch / 2 - 90 - (a.length - 1 - i) * 40));
    }
    ctx.restore();
    ctx.restore();
  }
  let LIVE = null;
  function buildLive() {
    LIVE = null; const Lv = CFG.live; if (!Lv) return;
    const sc0 = { t0: 0, falas: TL.falas.map((f) => f.id) };
    const T = (em, d) => tEm(sc0, em, d);
    LIVE = { a: T(Lv.de ?? 'L01:inicio', 0), b: T(Lv.ate, LOGO - 0.2),
      chat: (Lv.chat || []).map((c) => ({ ...c, t: T(c.em, 0) })).sort((x, y) => x.t - y.t),
      caps: (Lv.capitulos || []).map((c) => ({ ...c, t: T(c.em, 0) })),
      cor: (Lv.coracoes || []).map((e) => T(e, 0)) };
  }
  function liveCues() {
    if (!LIVE) return;
    for (const c of LIVE.chat) sfx(c.t, 'plim', { g: 0.28, p: 1.3 });
    for (const c of LIVE.caps) sfx(c.t, 'clique', { g: 0.35, p: 1.1 });
    for (const t of LIVE.cor) sfx(t, 'brilho', { g: 0.3 });
  }
  function drawLive(rc) {
    if (!LIVE) return;
    const { ctx, t, W: Wd, H } = rc, V = FMT === 'v';
    if (t < LIVE.a - 0.1 || t > LIVE.b + 0.3) return;
    const a = clamp((t - LIVE.a) / 0.3) * clamp((LIVE.b + 0.3 - t) / 0.3);
    ctx.save(); ctx.globalAlpha = a;
    const x0 = V ? 50 : 44, y0 = V ? 250 : 36;
    // ● AO VIVO + espectadores
    ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.roundRect(x0, y0, 220, 58, 12); ctx.fill();
    ctx.fillStyle = '#fbf8f0'; ctx.font = '700 30px "Archivo Black", sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    if (Math.floor(t * 2) % 2) { ctx.beginPath(); ctx.arc(x0 + 30, y0 + 29, 10, 0, TAU); ctx.fill(); }
    ctx.fillText('AO VIVO', x0 + 50, y0 + 31);
    const [v0, v1] = CFG.live.espectadores || [120, 3400];
    const q = clamp((t - LIVE.a) / Math.max(1, LIVE.b - LIVE.a)), n = Math.round(v0 + (v1 - v0) * q * q + Math.sin(t * 3) * 3);
    const nt = n >= 1000 ? (n / 1000).toFixed(1).replace('.', ',') + ' mil' : String(n);
    ctx.fillStyle = 'rgba(20,32,39,0.72)'; ctx.beginPath(); ctx.roundRect(x0 + 232, y0, 250, 58, 12); ctx.fill();
    ctx.fillStyle = '#fbf8f0'; ctx.font = '600 28px "Neulis Sans", "Kalam", sans-serif'; ctx.fillText('👁 ' + nt, x0 + 250, y0 + 31);
    // barra de capítulos (as etapas acendem uma a uma)
    const caps = LIVE.caps;
    if (caps.length && t >= caps[0].t - 0.4) {
      const cwid = V ? 232 : 250, gap = 12, tot = caps.length * cwid + (caps.length - 1) * gap;
      const cx0 = (Wd - tot) / 2, cy0 = V ? 330 : 112;
      caps.forEach((c, i) => {
        const on = t >= c.t, feito = i + 1 < caps.length && t >= caps[i + 1].t, x = cx0 + i * (cwid + gap);
        const pp = on ? E.outBack(clamp((t - c.t) / 0.35), 2) : 1;
        ctx.save(); ctx.translate(x + cwid / 2, cy0 + 26); ctx.scale(on && !feito ? 0.9 + 0.1 * pp + 0.04 : 1, on && !feito ? 0.9 + 0.1 * pp + 0.04 : 1);
        ctx.fillStyle = feito ? '#5ca032' : on ? '#f2c14e' : 'rgba(20,32,39,0.55)';
        ctx.beginPath(); ctx.roundRect(-cwid / 2, -26, cwid, 52, 26); ctx.fill();
        ctx.fillStyle = on && !feito ? '#1b2a33' : '#fbf8f0'; ctx.font = `700 ${V ? 24 : 26}px "Archivo Black", sans-serif`; ctx.textAlign = 'center';
        ctx.fillText((feito ? '✓ ' : `${i + 1}. `) + L(c.txt), 0, 2);
        ctx.restore();
      });
    }
    // chat (os 3 últimos comentários, deslizando de baixo)
    const vis = LIVE.chat.filter((c) => t >= c.t && t < c.t + (c.dur ?? 6)).slice(V ? -2 : -3);
    const bx = V ? 50 : 44, by = V ? H - 430 : H - 48, bw = V ? 640 : 600;
    vis.slice().reverse().forEach((c, i) => {
      const p = E.outCubic(clamp((t - c.t) / 0.3)), fo = clamp((c.t + (c.dur ?? 6) - t) / 0.4);
      const yy = by - i * 78 - 64 + (1 - p) * 40;
      ctx.save(); ctx.globalAlpha = a * p * fo;
      ctx.fillStyle = 'rgba(251,248,240,0.94)'; SP.setShadow(ctx, 1, 0.2, 0.6); ctx.beginPath(); ctx.roundRect(bx, yy, bw, 64, 18); ctx.fill(); SP.clearShadow(ctx);
      ctx.fillStyle = cor(c.cor, PAL.petrol); ctx.beginPath(); ctx.arc(bx + 34, yy + 32, 20, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fbf8f0'; ctx.font = '700 22px "Archivo Black", sans-serif'; ctx.textAlign = 'center'; ctx.fillText(String(c.autor || '?')[0], bx + 34, yy + 34);
      ctx.textAlign = 'left'; ctx.fillStyle = cor(c.cor, PAL.petrol); ctx.font = '700 26px "Neulis Sans", "Kalam", sans-serif';
      const au = (c.autor || '') + ':'; ctx.fillText(au, bx + 66, yy + 33);
      const aw = ctx.measureText(au).width;
      ctx.fillStyle = '#1b2a33'; ctx.font = '500 26px "Neulis Sans", "Kalam", sans-serif'; ctx.fillText(L(c.txt), bx + 76 + aw, yy + 33);
      ctx.restore();
    });
    // corações flutuando pela direita (rajadas nos momentos marcados, e alguns soltos)
    const hx = Wd - (V ? 110 : 90), hy = V ? H - 460 : H - 90;
    const burst = LIVE.cor.concat(LIVE.chat.map((c) => c.t));
    for (let k = 0; k < burst.length; k++) for (let j = 0; j < 5; j++) {
      const u = (t - burst[k] - j * 0.12) / 2.2; if (u < 0 || u > 1) continue;
      const x = hx + Math.sin(u * 7 + j * 2 + k) * 34, y = hy - u * (V ? 520 : 420), r = 18 + hrand(j, k) * 10;
      ctx.save(); ctx.globalAlpha = a * (1 - u) * 0.95; ctx.translate(x, y); ctx.scale(r / 18, r / 18);
      ctx.fillStyle = ['#e4572e', '#f28b82', '#f2c14e', '#b6e03b'][(j + k) % 4];
      ctx.beginPath(); ctx.moveTo(0, 6); ctx.bezierCurveTo(-18, -8, -8, -22, 0, -10); ctx.bezierCurveTo(8, -22, 18, -8, 0, 6); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  }

  // ---------- palco de game show (estilo C com "show": true) e placar ----------
  // Cada quadro é o palco: fundo azul-noite com estrelas recortadas, moldura de lâmpadas que piscam em onda e um piso de
  // tábuas embaixo. "placar": { "nome": "Metaninho", "pontos": [{ "em": "L03:Mito", "r": "ok" | "erro" | "meio" }] } desenha
  // o placar no canto (uma casinha por pergunta, que vira ✓ / ✗ / ½ na palavra).
  function drawShowBoard(rc, b) {
    const { ctx, t } = rc, z = rc.zoom, w = b.w, h = b.h;
    SP.piece(ctx, S.cut(rectPts(-w / 2 - 20, -h / 2 - 20, w / 2 + 20, h / 2 + 20), { seed: b.seed, jitter: 1.5, ds: 60 }), { color: '#8b2f2f', kind: 'paper', seed: b.seed, shadow: { zoom: z, strength: 1.1 }, edge: 0.2, shade: 0.5 });
    ctx.fillStyle = P.pattern(ctx, b.col || '#1e3e4c', 'paper', { seed: b.seed + 1 }); ctx.fillRect(-w / 2 + 30, -h / 2 + 30, w - 60, h - 60);
    const g = ctx.createRadialGradient(0, -h * 0.1, 40, 0, -h * 0.1, w * 0.6);
    g.addColorStop(0, 'rgba(255,236,170,0.28)'); g.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = g; ctx.fillRect(-w / 2 + 30, -h / 2 + 30, w - 60, h - 60);
    const rr = RNG(b.seed);
    for (let k = 0; k < 16; k++) { const x = rr.sym(w * 0.44), y = rr.range(-h * 0.44, h * 0.1), r = rr.range(10, 22); SP.piece(ctx, S.star(x, y, r * 0.45, r, 5, { seed: k }), { color: rr.pick(['#f2c14e', '#fbf8f0', '#b6e03b']), seed: k, edge: 0.1 }); }
    // piso de tábuas
    const fy = h / 2 - 150;
    ctx.fillStyle = P.pattern(ctx, '#b0703c', 'kraft', { seed: 4 }); ctx.fillRect(-w / 2 + 30, fy, w - 60, h / 2 - 30 - fy);
    ctx.strokeStyle = 'rgba(60,30,10,0.35)'; ctx.lineWidth = 3;
    for (let x = -w / 2 + 30; x < w / 2 - 30; x += 140) { ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x - 40, h / 2 - 30); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-w / 2 + 30, fy, w - 60, 10);
    // moldura de lâmpadas que piscam em onda
    const per = 2 * (w + h), n = Math.round(per / 70);
    for (let i = 0; i < n; i++) {
      const s = (i / n) * per; let x, y;
      if (s < w) { x = -w / 2 + s; y = -h / 2 + 8; } else if (s < w + h) { x = w / 2 - 8; y = -h / 2 + (s - w); } else if (s < 2 * w + h) { x = w / 2 - (s - w - h); y = h / 2 - 8; } else { x = -w / 2 + 8; y = h / 2 - (s - 2 * w - h); }
      const on = (Math.floor(t * 6) + i) % 3 === 0;
      if (on) { ctx.fillStyle = 'rgba(255,230,140,0.45)'; ctx.beginPath(); ctx.arc(x, y, 20, 0, TAU); ctx.fill(); }
      ctx.fillStyle = on ? '#fff3b0' : '#c9a24a'; ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill();
    }
  }
  let PLACAR = null;
  function buildPlacar() {
    PLACAR = null; const Pc = CFG.placar; if (!Pc) return;
    const sc0 = { t0: 0, falas: TL.falas.map((f) => f.id) };
    PLACAR = { pts: (Pc.pontos || []).map((p) => ({ ...p, t: tEm(sc0, p.em, 0) })), a: tEm(sc0, Pc.de ?? 'L02:inicio', 0) };
  }
  function drawPlacar(rc) {
    if (!PLACAR) return;
    const { ctx, t } = rc, V = FMT === 'v';
    if (t < PLACAR.a - 0.2 || t > LOGO - 0.1) return;
    const a = clamp((t - PLACAR.a + 0.2) / 0.3) * clamp((LOGO - 0.1 - t) / 0.3);
    const n = PLACAR.pts.length, cw = 58, x0 = V ? 60 : 50, y0 = V ? 250 : 40;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(20,32,39,0.85)'; ctx.beginPath(); ctx.roundRect(x0, y0, 230 + n * (cw + 8), 72, 16); ctx.fill();
    ctx.fillStyle = '#f2c14e'; ctx.font = '700 26px "Archivo Black", sans-serif'; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(L(CFG.placar.nome) || 'PLACAR', x0 + 20, y0 + 37);
    PLACAR.pts.forEach((p, i) => {
      const x = x0 + 220 + i * (cw + 8), y = y0 + 9, on = t >= p.t, pp = on ? E.outBack(clamp((t - p.t) / 0.35), 2.4) : 0;
      ctx.fillStyle = 'rgba(251,248,240,0.18)'; ctx.beginPath(); ctx.roundRect(x, y, cw, 54, 10); ctx.fill();
      if (!on) return;
      const col = p.r === 'ok' ? '#5ca032' : p.r === 'erro' ? '#e4572e' : '#d37402';
      ctx.save(); ctx.translate(x + cw / 2, y + 27); ctx.scale(pp, pp);
      ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-cw / 2, -27, cw, 54, 10); ctx.fill();
      ctx.fillStyle = '#fbf8f0'; ctx.font = '700 34px "Archivo Black", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(p.r === 'ok' ? '✓' : p.r === 'erro' ? '✗' : '½', 0, 3);
      ctx.restore();
    });
    ctx.restore();
  }

  // ---------- tabuleiro de jogo (estilo C com "tabuleiro": true) ----------
  function drawTabuleiro(rc, b) {
    const { ctx } = rc, z = rc.zoom, w = b.w, h = b.h;
    SP.piece(ctx, S.cut(rectPts(-w / 2 - 16, -h / 2 - 16, w / 2 + 16, h / 2 + 16), { seed: b.seed, jitter: 1.5, ds: 60 }), { color: '#1e3e4c', kind: 'paper', seed: b.seed, shadow: { zoom: z, strength: 1.2 }, edge: 0.2, shade: 0.5 });
    SP.piece(ctx, S.cut(rectPts(-w / 2 + 18, -h / 2 + 18, w / 2 - 18, h / 2 - 18), { seed: b.seed + 1, jitter: 1, ds: 60 }), { color: b.col || '#f3ead8', kind: 'paper', seed: b.seed + 1, edge: 0.12, shade: 0.35 });
    ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = '#1e3e4c';
    for (let y = -h / 2 + 40; y < h / 2 - 30; y += 60) for (let x = -w / 2 + 40 + ((y / 60) % 2 ? 30 : 0); x < w / 2 - 30; x += 60) { ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fill(); }
    ctx.restore();
    I.dashed(ctx, rectPts(-w / 2 + 40, -h / 2 + 40, w / 2 - 40, h / 2 - 40).concat([[-w / 2 + 40, -h / 2 + 40]]), { dash: 26, gap: 14, w: 5, color: 'rgba(30,62,76,0.45)', seed: b.seed, boil: 0 });
    for (const [x, y, c] of [[-w / 2 + 60, -h / 2 + 60, '#e4572e'], [w / 2 - 60, -h / 2 + 60, '#f2c14e'], [-w / 2 + 60, h / 2 - 60, '#5ca032'], [w / 2 - 60, h / 2 - 60, '#8ec5d6']])
      SP.piece(ctx, S.star(x, y, 12, 28, 5, { seed: x + y }), { color: c, seed: 3, shadow: { zoom: z }, border: { w: 4 } });
  }

  // ---------- fase de videogame (estilo C com "jogo": {...}) ----------
  // Uma fase de plataforma horizontal: céu de papel, nuvens, morros, chão de tijolos contínuo, canos de biogás.
  // "jogo": { "selecao": true (a 1ª área é a tela ESCOLHA SEU JOGADOR), "jogadores": [["HIDRO", "@h2"], ["METANINHO", "mascote:em_pe"]],
  //   "fases": [{ "em": "L04:inicio", "txt": "1-1" }], "pontos": [{ "em": "L04:hidrogênio", "n": 100 }] }
  function chaoY(b) { return b.y + FH * (FMT === 'v' ? 0.26 : 0.3); }
  function drawFase(rc) {
    const { ctx, t } = rc, z = rc.zoom, v = rc.view;
    const B = { x0: MAQ.x0 - 200, x1: MAQ.x1 + 200, y0: MAQ.y0 - 200, y1: MAQ.y1 + 200 };
    const g = ctx.createLinearGradient(0, B.y0, 0, B.y1); g.addColorStop(0, '#7cc4e0'); g.addColorStop(0.7, '#cfeaf2'); g.addColorStop(1, '#e8f4f0');
    ctx.fillStyle = g; ctx.fillRect(v.x0 - 50, v.y0 - 50, v.x1 - v.x0 + 100, v.y1 - v.y0 + 100);
    ctx.fillStyle = P.pattern(ctx, '#bfe3ee', 'paper', { seed: 2, strength: 0.4 }); ctx.globalAlpha = 0.35; ctx.fillRect(v.x0 - 50, v.y0 - 50, v.x1 - v.x0 + 100, v.y1 - v.y0 + 100); ctx.globalAlpha = 1;
    const yG = chaoY(BOARDS[0]), rr = RNG(181);
    // morros ao fundo e nuvens
    for (let x = B.x0; x < B.x1; x += 520) {
      const hx = x + rr.range(0, 200), hw = rr.range(380, 620), hh = rr.range(160, 300);
      if (hx + hw < v.x0 - 100 || hx - hw > v.x1 + 100) continue;
      SP.piece(ctx, S.blob(hx, yG, hw / 2, hh, { seed: Math.round(x), wobble: 0.04 }), { color: rr.pick(['#8cc56a', '#7bb85a', '#9fd07a']), kind: 'paper', seed: Math.round(x), edge: 0.12, shade: 0.4 });
    }
    const rc2 = RNG(77);
    for (let x = B.x0; x < B.x1; x += 420) {
      const cx = x + rc2.range(0, 300), cy = BOARDS[0].y - FH * rc2.range(0.25, 0.42), s = rc2.range(0.7, 1.2);
      if (cx < v.x0 - 300 || cx > v.x1 + 300) continue;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
      SP.piece(ctx, S.blob(0, 0, 110, 40, { seed: Math.round(x) + 1, wobble: 0.1 }), { color: '#fbf8f0', seed: 3, shadow: { zoom: z }, edge: 0.1 });
      SP.piece(ctx, S.blob(-40, -28, 50, 40, { seed: Math.round(x) + 2 }), { color: '#fbf8f0', seed: 4, edge: 0.1 });
      SP.piece(ctx, S.blob(30, -34, 60, 46, { seed: Math.round(x) + 3 }), { color: '#fbf8f0', seed: 5, edge: 0.1 });
      ctx.restore();
    }
    // chão de tijolos (grama por cima)
    const tl = 88;
    const x0 = Math.floor((v.x0 - 100) / tl) * tl;
    ctx.fillStyle = P.pattern(ctx, '#c46a3c', 'kraft', { seed: 8 }); ctx.fillRect(x0, yG, v.x1 - x0 + 200, B.y1 - yG);
    ctx.strokeStyle = 'rgba(70,30,10,0.45)'; ctx.lineWidth = 4;
    for (let y = yG, r = 0; y < Math.min(B.y1, v.y1 + 50); y += tl / 2, r++) {
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(v.x1 + 100, y); ctx.stroke();
      for (let x = x0 + (r % 2 ? tl / 2 : 0); x < v.x1 + 100; x += tl) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + tl / 2); ctx.stroke(); }
    }
    SP.piece(ctx, rectPts(x0, yG - 18, v.x1 + 200, yG + 14), { color: '#5ca032', kind: 'paper', seed: 9, edge: 0.15, shade: 0.3 });
    // canos de biogás saindo do chão, entre as áreas
    for (let k = 0; k + 1 < BOARDS.length; k++) {
      const px = (BOARDS[k].x + BOARDS[k + 1].x) / 2; if (px < v.x0 - 200 || px > v.x1 + 200) continue;
      SP.piece(ctx, rectPts(px - 60, yG - 170, px + 60, yG), { color: '#3f9a4a', kind: 'paper', seed: 10 + k, shadow: { zoom: z }, edge: 0.2, shade: 0.6 });
      SP.piece(ctx, rectPts(px - 76, yG - 210, px + 76, yG - 160), { color: '#4fb35a', kind: 'paper', seed: 20 + k, shadow: { zoom: z }, edge: 0.2, shade: 0.6 });
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(px - 44, yG - 160, 14, 150);
    }
    // tela de seleção de jogadores na 1ª área
    if (CFG.jogo.selecao && rc.visible(BOARDS[0].x, BOARDS[0].y, FW)) {
      const b = BOARDS[0], w = FW * (FMT === 'v' ? 0.9 : 0.86), h = FH * (FMT === 'v' ? 0.62 : 0.8);
      ctx.save(); ctx.translate(b.x, b.y - (FMT === 'v' ? FH * 0.05 : FH * 0.04));
      SP.piece(ctx, S.rrect(-w / 2, -h / 2, w, h, 40, { seed: 31 }), { color: '#1e3e4c', kind: 'paper', seed: 31, shadow: { zoom: z, strength: 1.2 }, border: { w: 10 }, shade: 0.4 });
      ctx.globalAlpha = 0.08; ctx.fillStyle = '#fbf8f0';
      for (let y = -h / 2 + 30; y < h / 2 - 20; y += 60) for (let x = -w / 2 + 30 + ((y / 60) % 2 ? 30 : 0); x < w / 2 - 20; x += 60) ctx.fillRect(x, y, 30, 30);
      ctx.restore();
    }
    drawCenasCont(rc);
  }
  let JOGO = null;
  function buildJogo() {
    JOGO = null; const J = CFG.jogo; if (!J) return;
    const sc0 = { t0: 0, falas: TL.falas.map((f) => f.id) };
    JOGO = { fases: (J.fases || []).map((f) => ({ ...f, t: tEm(sc0, f.em, 0) })), pts: (J.pontos || []).map((p) => ({ ...p, t: tEm(sc0, p.em, 0) })), a: tEm(sc0, J.de ?? 'L01:inicio', 0) };
    for (const p of JOGO.pts) sfx(p.t, p.som || 'moeda', { g: 0.3 });
  }
  function drawJogoHud(rc) {
    if (!JOGO) return;
    const { ctx, t, W: Wd } = rc, V = FMT === 'v';
    if (t < JOGO.a - 0.2 || t > LOGO - 0.1) return;
    const a = clamp((t - JOGO.a + 0.2) / 0.3) * clamp((LOGO - 0.1 - t) / 0.3);
    const alvo = JOGO.pts.filter((p) => t >= p.t).reduce((s, p) => s + p.n, 0);
    const ult = JOGO.pts.filter((p) => t >= p.t).pop(), pulso = ult ? clamp(1 - (t - ult.t) / 0.3) : 0;
    const prev = JOGO.pts.filter((p) => t >= p.t + 0.35).reduce((s, p) => s + p.n, 0);
    const shown = Math.round(prev + (alvo - prev) * (ult ? clamp((t - ult.t) / 0.35) : 1));
    const fase = JOGO.fases.filter((f) => t >= f.t).pop();
    ctx.save(); ctx.globalAlpha = a;
    const y0 = V ? 250 : 34, x0 = V ? 50 : 44, H = 70;
    const cells = [[L(CFG.jogo.jogadores?.[0]?.[0]) || 'P1', '×3'], [L(CFG.jogo.jogadores?.[1]?.[0]) || 'P2', '×3'], ['PONTOS', String(shown).padStart(6, '0')], ['FASE', fase ? L(fase.txt) : '—']];
    const cw = V ? [210, 250, 0, 0] : [190, 250, 230, 190];
    let x = x0;
    cells.forEach(([k, val], i) => {
      if (V && i >= 2) return;
      const w = cw[i];
      ctx.fillStyle = 'rgba(20,32,39,0.82)'; ctx.beginPath(); ctx.roundRect(x, y0, w, H, 14); ctx.fill();
      ctx.fillStyle = '#f2c14e'; ctx.font = '700 20px "Archivo Black", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(k, x + 14, y0 + 8);
      ctx.fillStyle = '#fbf8f0'; ctx.font = `700 ${i === 2 ? 30 : 28}px "Archivo Black", sans-serif`;
      if (i === 2 && pulso > 0) { ctx.save(); ctx.fillStyle = '#b6e03b'; }
      ctx.fillText(val, x + 14, y0 + 32);
      if (i === 2 && pulso > 0) ctx.restore();
      x += w + 10;
    });
    if (V) {   // no 9:16, pontos e fase numa 2ª linha
      let xx = x0; [['PONTOS', String(shown).padStart(6, '0'), 250], ['FASE', fase ? L(fase.txt) : '—', 210]].forEach(([k, val, w]) => {
        ctx.fillStyle = 'rgba(20,32,39,0.82)'; ctx.beginPath(); ctx.roundRect(xx, y0 + H + 10, w, H, 14); ctx.fill();
        ctx.fillStyle = '#f2c14e'; ctx.font = '700 20px "Archivo Black", sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; ctx.fillText(k, xx + 14, y0 + H + 18);
        ctx.fillStyle = k === 'PONTOS' && pulso > 0 ? '#b6e03b' : '#fbf8f0'; ctx.font = '700 28px "Archivo Black", sans-serif'; ctx.fillText(val, xx + 14, y0 + H + 42); xx += w + 10;
      });
    }
    ctx.restore();
  }

  // ---------- cartão final (assinatura CP2B) ----------
  const pop = (t, t0, d = 0.34, s = 2.1) => (t < t0 ? 0 : t >= t0 + d ? 1 : E.outBack((t - t0) / d, s));
  let URLSTRIP = null;
  function drawAssinatura(rc) {
    const { ctx, t, tq, W: Wd, H } = rc;
    const dim = clamp((t - LOGO + 0.1) / 0.5);
    if (dim <= 0) return;
    const V = FMT === 'v';
    ctx.save(); ctx.globalAlpha = 0.55 * dim; ctx.fillStyle = '#1b2a33'; ctx.fillRect(0, 0, Wd, H); ctx.restore();
    const p = pop(tq, LOGO - 0.04, 0.45, 1.5);
    const [cw, ch, lwMax] = V ? [900, 520, 720] : [1100, 540, 860];
    const cy = V ? H / 2 - 230 : H / 2 - 20;
    const extra = L(CFG.assinatura?.texto);
    ctx.save(); ctx.translate(Wd / 2, cy + (1 - p) * 700);
    SP.setShadow(ctx, 1, 0.6, 1.2);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(-cw / 2, -ch / 2, cw, ch, 22); ctx.fill();
    SP.clearShadow(ctx);
    const logo = X.images.get('logo');
    if (logo) { const lw = lwMax, lh = lw * logo.height / logo.width; ctx.drawImage(logo, -lw / 2, -ch / 2 + 46, lw, lh); }
    ctx.fillStyle = PAL.petrol; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${V ? 42 : 46}px "Neulis Sans", "Kalam", sans-serif`;
    ctx.fillText(LANG.startsWith('en') ? 'Living energy, science that transforms.' : 'Energia viva, ciência que transforma.', 0, ch / 2 - (extra ? 118 : 96));
    ctx.fillStyle = PAL.verde; ctx.fillRect(-120, ch / 2 - (extra ? 80 : 54), 240, 6);
    if (extra) { ctx.fillStyle = '#5b6f76'; ctx.font = `500 28px "Neulis Sans", "Kalam", sans-serif`; ctx.fillText(extra, 0, ch / 2 - 40); }
    ctx.restore();
    if (p > 0.9) { SP.tape(ctx, Wd / 2 - cw / 2 + 40, cy - ch / 2 + 10, 150, 46, -0.6, { seed: 3 }); SP.tape(ctx, Wd / 2 + cw / 2 - 40, cy + ch / 2 - 10, 150, 46, -0.6, { seed: 5 }); }
    // faixa com o endereço
    const u = pop(tq, LOGO + 0.3, 0.4);
    if (u > 0) {
      if (!URLSTRIP) URLSTRIP = S.tear(S.cut([[-230, -38], [230, -34], [226, 38], [-234, 36]], { seed: 42, jitter: 1.5, ds: 30 }), { amp: 3, seed: 43 });
      const ux = Wd / 2, uy = cy + ch / 2 + 78;
      ctx.save(); ctx.translate(ux, uy); ctx.rotate(-0.02); ctx.scale(u, u);
      SP.piece(ctx, URLSTRIP, { color: PAL.lima, seed: 41, shadow: { zoom: 1, lift: (1 - u) * 0.6 }, edge: 0.15 });
      ctx.fillStyle = PAL.petrol; ctx.font = `700 40px "Neulis Sans", "Kalam", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('cp2b.unicamp.br', 0, 3);
      ctx.restore();
    }
    // mascote de crochê pula para o lado do cartão e dá tchau (nunca por cima do logo)
    const mp = clamp((t - LOGO - 0.25) / 0.55);
    const im = imgOf('sig:acena'), jumpIm = imgOf('sig:pula');
    if (mp > 0 && im) {
      const e = E.outCubic(mp);
      const tx = V ? Wd / 2 + 215 : Wd / 2 + cw / 2 + 170, ty = V ? H - 380 : cy + 140;
      const x = lerp(V ? Wd + 260 : Wd + 260, tx, e), y = ty - Math.sin(mp * Math.PI) * 180;
      const use = mp < 1 ? (jumpIm || im) : im;
      const s = (V ? 400 : 400) / use.height;
      const wave = mp >= 1 ? Math.sin((t - LOGO - 0.8) * TAU * 1.5) * 0.12 : 0;
      X.img(ctx, IMG.get(mp < 1 && jumpIm ? 'sig:pula' : 'sig:acena'), x, y, { s, rot: wave, ay: 1, lift: (1 - e) * 0.6 });
    }
    // do outro lado do cartão: o cientista ("cientista": true) ou outro personagem ("parceiro": "arqueia:feliz")
    const esq = CFG.assinatura?.parceiro || (CFG.assinatura?.cientista ? 'cientista:acena' : null);
    if (esq) {
      const cp = clamp((t - LOGO - 0.45) / 0.5), ci = imgOf(esq);
      if (cp > 0 && ci) {
        const e = E.outBack(cp, 1.4);
        const tx = V ? Wd / 2 - 215 : Wd / 2 - cw / 2 - 170, ty = V ? H - 380 : cy + 190;
        X.img(ctx, IMG.get(esq), tx, ty, { s: (V ? 420 : 470) / ci.height * e, ay: 1, rot: Math.sin((t - LOGO) * TAU * 0.8) * 0.03 });
      }
    }
  }

  // ---------- montagem ----------
  function buildScenes() {
    const ids = TL.falas.map((f) => f.id);
    const used = new Set();
    SCENES = (CFG.cenas || []).map((c, k) => {
      const falas = c.falas || (c.fala ? [c.fala] : []);
      falas.forEach((f) => used.add(f));
      return { ...c, falas, k, seed: (CFG.seed ?? 11) * 97 + k * 13, itens: (c.itens || []).map((it) => ({ ...it })) };
    }).filter((sc) => sc.falas.length && sc.falas.every((f) => WORDS[f]));
    // falas sem quadro próprio continuam no quadro anterior
    SCENES.sort((a, b) => ids.indexOf(a.falas[0]) - ids.indexOf(b.falas[0]));
    SCENES.forEach((sc, k) => {
      sc.k = k;
      sc.t0 = k === 0 ? 0 : Lin(sc.falas[0]).inicio - (sc.antes ?? 0.12);
      if ((LIVRO() || CONT() || CFG.estudio || CFG.naBatida) && k > 0) sc.t0 = naBatida(sc.t0);
      sc.revela = sc.revela != null ? tEm(sc, sc.revela, null) : null;
    });
  }

  const scene = {
    duration: 56,
    boilFps: 8,
    async init(base = '', tlName = 'timeline.json', captions = null, opts = {}) {
      FMT = opts.formato === 'vertical' ? 'v' : 'h';
      MARCA = opts.marca !== false;
      LANG = opts.idioma || 'pt-BR';
      [FW, FH] = FMT === 'v' ? [1080, 1920] : [1920, 1080];
      CFG = await (await fetch(base + (opts.cena || 'cena.json'), { cache: 'no-store' })).json();
      EST = { ...ESTILOS[CFG.estilo || 'C'], ...(CFG.visual || {}) };
      TL = await (await fetch(base + tlName, { cache: 'no-store' })).json();
      if (captions) {
        try {
          const vtt = await (await fetch(base + captions, { cache: 'no-store' })).text();
          const sec = (s) => { const [h, m, x] = s.split(':'); return +h * 3600 + +m * 60 + +x; };
          CAPS = vtt.split(/\r?\n\r?\n/).map((b) => b.split(/\r?\n/)).filter((ls) => ls.some((l) => l.includes('-->'))).map((ls) => {
            const i = ls.findIndex((l) => l.includes('-->'));
            const [a, b] = ls[i].split('-->').map((s) => sec(s.trim().split(' ')[0]));
            return { a, b, txt: ls.slice(i + 1).join('\n') };
          });
        } catch (e) { CAPS = null; }
      }
      indexWords();
      LOGO = TL.musica.logo; FIM = TL.duracao;
      scene.duration = TL.duracao;
      MEAS = P.canvas(8, 8).getContext('2d');
      buildScenes();
      const R = G.COLAGEM_ROOT || '../..';
      await loadAssets(R);
      await loadDados(R);
      for (const sc of SCENES) { planScene(sc); resolveItems(sc); }
      for (const sc of SCENES) {
        sc.byId = {};
        for (const it of sc.itens) { if (it.kind === 'img') it.geo = fitImg(it); if (it.id || it.p) sc.byId[it.id || it.p] = it; }
        layoutSobre(sc);
        for (const it of sc.itens) if (it.sobre && it.kind === 'img') it.geo = fitImg(it);
        resolveMuda(sc);
        if (C.efeitos) for (const it of sc.itens) if (it.kind === 'fx') C.efeitos.prep(it, sc, { PAL, EST, cor, FMT, L, tEm: (em, d) => tEm(sc, em, d), imgOf, dados: DADOS });
      }
      buildBoards(); buildCamera(); buildMaquete(); buildEstrada(); buildLousa(); buildMolduras(); buildLive(); buildPlacar(); cues(); liveCues(); buildJogo();
      if (PLACAR) for (const p of PLACAR.pts) sfx(p.t + 0.02, p.r === 'erro' ? 'buzina' : 'plim', { g: 0.35 });
    },
    camera,
    camSpeed,
    draw(rc) {
      const { ctx } = rc;
      drawMesa(rc);
      if (LIVRO()) return drawLivro(rc);
      if (CFG.colcha) return drawColcha(rc);
      if (CFG.caderno) return drawCaderno(rc);
      if (CFG.estrada) return drawEstrada(rc);
      if (CFG.lousa) return drawLousa(rc);
      if (CFG.jogo) return drawFase(rc);
      if (CFG.maquete || CFG.mesa) return drawMaquete(rc);
      SCENES.forEach((sc, k) => {
        const b = BOARDS[k];
        const r = Math.hypot(b.w, b.h) / 2;
        if (!rc.visible(b.x, b.y, r)) return;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot);
        drawBoard(rc, b);
        const order = sc.itens.slice().sort((a, c) => (a.fundo ? -1 : 0) - (c.fundo ? -1 : 0) || (a.z ?? 0) - (c.z ?? 0));
        for (const it of order) drawItem(rc, sc, it);
        ctx.restore();
      });
    },
    overlay(rc) {
      if (C.efeitos) for (const m of MOLD) C.efeitos.moldura(rc, m, { PAL, LOGO, FMT, LANG, L });
      drawLive(rc);
      drawPlacar(rc);
      drawJogoHud(rc);
      drawCaptions(rc);
      drawAbertura(rc);
      drawAssinatura(rc);
    },
    hud(rc) {
      if (!MARCA) return;
      X.watermark(rc.ctx, rc.W, rc.H, rc.t, FMT === 'v' ? { w: 170, y: 250, margin: 40, t1: LOGO - 0.45 } : { w: 190, t1: LOGO - 0.45 });
    },
    sfx: () => SFX,
    timeline: () => TL,
  };
  C.episodio = { scene, POSES, COMUM, ESTILOS, PAL };
  G.CENA = scene;
})(window);
