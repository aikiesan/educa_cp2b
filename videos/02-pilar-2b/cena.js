/* "PILAR-2b: o mapa do biogás de São Paulo" — cena completa (CP2B · educa, episódio 02).
 * Um único mapa de papel de SP (645 recortes, malha IBGE) começa na mesa, voa para a tela de um notebook
 * de papel e vira a plataforma: pastas de dados, preenchimento oeste→leste, filtro, clique, cartão de resultado.
 * Tudo é função do tempo t (determinístico). Os tempos vêm de timeline.json (alinhamento da narração). */
(function (G) {
  'use strict';
  const C = G.Colagem;
  const { core, shapes: S, sprite: SP, ink: I, text: T, paper: P, extras: X } = C;
  const { tw, E, clamp, lerp, settle, pulse, hrand, R: RNG, snoise1, TAU, mixHex, shade, smooth } = core;
  const INK = SP.INK;

  const PAL = {
    petrol: '#1e3e4c', verdeEsc: '#00573a', verde: '#5ca032', lima: '#b6e03b', ambar: '#d37402',
    creme: '#f3ead8', papel: '#fbf8f0', amarelo: '#f2c14e', ceu: '#9fd0df', coral: '#e4572e',
    marrom: '#8b5a3c', kraft: '#d6bf98', cinza: '#dfe3e0',
  };
  // rampas de potencial (classe 0 = menor … 4 = maior; −1 = sem esse resíduo)
  const RAMP = {
    tot: ['#e3eed6', '#b6e03b', '#7fbb3f', '#2f7d32', '#00573a'],
    agr: ['#e3eed6', '#b6e03b', '#7fbb3f', '#2f7d32', '#00573a'],
    pec: ['#f8e6c8', '#f2c14e', '#e59a2f', '#d37402', '#8f4d06'],
    urb: ['#eef5f7', '#cfe6ed', '#9fcbd9', '#5f9fb5', '#2f6478'],
  };
  const ZERO = '#e6dccb';
  const BLANK = ['#f3ead8', '#f8f2e4', '#ecdfc4', '#efe5cf'];
  const KIDX = { tot: 0, agr: 1, pec: 2, urb: 3 };

  // ---------- linha do tempo ----------
  let TL = null, WORDS = {};
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function indexWords() {
    WORDS = {};
    for (const f of TL.falas) WORDS[f.id] = { ...f, idx: f.palavras.map((w) => ({ ...w, k: norm(w.p) })) };
  }
  function W(id, word, n = 0) {
    const L = WORDS[id];
    const k = norm(word);
    const hits = L.idx.filter((w) => w.k === k);
    if (!hits.length) { console.warn('palavra não encontrada', id, word); return { i: L.inicio, f: L.fim }; }
    return hits[Math.min(n, hits.length - 1)];
  }
  const at = (id, w, n) => W(id, w, n).i;
  const endOf = (id, w, n) => W(id, w, n).f;
  const Lin = (id) => WORDS[id];

  // ---------- efeitos sonoros ----------
  const SFX = [];
  function sfx(t, nome, o = {}) { SFX.push({ t: +t.toFixed(3), nome, ganho: o.g ?? 1, pan: o.pan ?? 0, dur: o.dur, p: o.p }); }

  // ---------- auxiliares ----------
  const pop = (t, t0, d = 0.34, s = 2.1) => (t < t0 ? 0 : t >= t0 + d ? 1 : E.outBack((t - t0) / d, s));
  const lin = (t, t0, d) => clamp((t - t0) / d);
  function drop(t, t0, h = 520, d = 0.46) {
    const p = clamp((t - t0) / d);
    return { dy: -(1 - E.outBounce(p)) * h, lift: (1 - p) * 0.9, on: t >= t0, p };
  }
  const sway = (t, seed, amp = 0.03, f = 0.9) => Math.sin(t * f * TAU + seed * 1.7) * amp;
  const ZOOM = { v: 1 };
  const Z = (o = {}) => ({ zoom: ZOOM.v, ...o });

  // ---------- recortes (imagens) com alternativas ----------
  // nome lógico → candidatos (o primeiro que existir). Sem imagem, a cena usa um desenho em código.
  const ASSETS = {
    cana: ['ep02/cana', 'v3/cana_feixe'],
    vaca: ['ep02/vaca', 'v3/vaca_pe'],
    esterco: ['v3/esterco'],
    lixo: ['ep02/caminhao_lixo', 'v3/caminhao'],
    saco: ['ep02/saco_restos'],
    casa: ['v3/casa_verde'],
    notebook: ['ep02/notebook'],
    mao: ['ep02/mao'],
    cursor: ['ep02/cursor'],
    gestora: ['ep02/gestora'], empresario: ['ep02/empresario'], pesquisadora: ['ep02/pesquisadora'],
    livros: ['ep02/livros'], artigo: ['ep02/artigo'], pergaminho: ['ep02/pergaminho'],
    lupa: ['ep02/lupa'],
    pino_coral: ['ep02/pino_coral'], pino_ambar: ['ep02/pino_ambar'], pino_lima: ['ep02/pino_lima'], pino_petrol: ['ep02/pino_petrol'],
    ramo: ['ep02/ramo'], ramo2: ['ep02/ramo2'], folha: ['ep02/folha'], nuvem: ['ep02/nuvem', 'nuvem_grande'], sol: ['sol'],
  };
  // escala (px da imagem → mundo) e âncora (ponta/base) de cada recorte do ep. 02
  const CUT = {
    mao: { s: 0.92, ax: 0.11, ay: 0.07 },          // ponta do indicador
    gestora: { s: 1.34 }, empresario: { s: 1.3 }, pesquisadora: { s: 1.32 },
    livros: { s: 1.3 }, artigo: { s: 0.82 }, pergaminho: { s: 0.8 },
    pino: { s: 0.34, ax: 0.5, ay: 0.975 },       // ponta do alfinete
  };
  const HAS = (n) => X.images.has(n);
  // metadados dos recortes do ep. 02 (olhos, âncoras, tela do notebook) — preenchidos quando as imagens chegam
  let META = {};
  async function loadAssets(R) {
    const base = `${R}/assets/recortes/`;
    await Promise.all(Object.entries(ASSETS).map(async ([name, cands]) => {
      for (const c of cands) {
        try { await X.loadImages({ [name]: base + c + '.png' }); return; } catch (e) { /* tenta o próximo */ }
      }
    }));
    try { META = await (await fetch(base + 'ep02/meta.json', { cache: 'no-store' })).json(); } catch (e) { META = {}; }
    await X.loadImages({ logo: `${R}/assets/brand/cp2b-logo.svg` });
  }

  // ---------- geometria da tela do notebook (mundo) ----------
  const SCR = { x: -750, y: -560, w: 1500, h: 940 };
  const HINGE = SCR.y + SCR.h + 70;          // dobradiça (y do mundo)
  const BARH = 84;
  const PANEL = { x: -725, y: -455, w: 390, h: 800 };
  const MAPBOX = { x: -315, y: -455, w: 1045, h: 800 };
  const MAP_SCR = { x: 207, y: -100, s: 0.628 };  // pose do mapa dentro da tela
  const MAP_TAB = { x: 0, y: 25, s: 1 };          // pose do mapa sobre a mesa
  const SLOT = [-268, -28, 212].map((y) => ({ x: -530, y }));
  const CATS = [
    { id: 'agr', nome: 'Agrícola', cor: PAL.verde, img: 'cana', imgS: 0.26 },
    { id: 'pec', nome: 'Pecuária', cor: PAL.ambar, img: 'vaca', imgS: 0.2 },
    { id: 'urb', nome: 'Urbano', cor: PAL.petrol, img: 'casa', imgS: 0.3 },
  ];
  // ---------- layout por formato (h = 16:9 · v = 9:16 Stories) ----------
  let FMT = 'h';
  const LAYOUTS = {
    h: {
      books: { x: -1560, y: 420 },
      people: [[1180, 1085], [1470, 1100], [-1330, 1085]],
      cam: { A: [0, 25, 0.925], NB: [0, 140, 0.61], MP: [207, -90, 1.06], UI: [-40, -85, 0.975], UI2: [-40, -85, 0.975], SCI: [-1010, 60, 0.84], PPL: [0, 70, 0.55], FIN: [0, -265, 0.435] },
      title: { y1: -225, y2: -40, y3: 160, x: 0 },
      hero: { y: -160, s: 1 },
      qmarks: [[-860, -360, 150, -0.25, '#e4572e', 0.1], [870, -300, 130, 0.2, '#d37402', 0.24], [-900, 330, 110, 0.15, '#5ca032', 0.36], [900, 360, 120, -0.1, '#1e3e4c', 0.48], [640, -520, 90, 0.3, '#00573a', 0.6]],
      ov: { titleY: 150, subY: 282, subS: 70, urlX: 0.5, urlY: 1000, cap: { y: -74, size: 44 }, card: [1100, 520, 860] },
    },
    v: {
      books: { x: -560, y: 1260 },
      people: [[20, 2020], [560, 2035], [-560, 2020]],
      cam: { A: [0, -250, 0.62], NB: [0, 150, 0.45], MP: [207, -70, 1.02], UI: [-440, -80, 0.97], UI2: [230, -120, 1.0], SCI: [-330, 1000, 0.78], PPL: [0, 850, 0.42], FIN: [0, 384, 0.38] },
      title: { y1: -1000, y2: -820, y3: -640, x: 0 },
      hero: { y: -980, s: 1.35 },
      qmarks: [[-420, -1150, 150, -0.25, '#e4572e', 0.1], [430, -1080, 130, 0.2, '#d37402', 0.24], [-440, 820, 120, 0.15, '#5ca032', 0.36], [420, 900, 130, -0.1, '#1e3e4c', 0.48], [60, 1150, 100, 0.3, '#00573a', 0.6]],
      ov: { titleY: 330, subY: 452, subS: 64, urlX: 0.5, urlY: 1262, cap: { y: -420, size: 42 }, card: [900, 470, 700] },
    },
  };
  let LAY = LAYOUTS.h;
  const BOOKS = { x: 0, y: 0 };

  // ---------- mapa de SP (645 municípios) ----------
  let MAP = null, ALLPATH = null, OUTLINE = null, CAMP = -1, PINS = [];
  function buildMap(d) {
    MAP = d;
    const xs = d.municipios.map((m) => m.x);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    ALLPATH = new Path2D();
    d.municipios.forEach((m, i) => {
      const p = new Path2D();
      for (const ring of m.p) { p.moveTo(ring[0][0], ring[0][1]); for (let k = 1; k < ring.length; k++) p.lineTo(ring[k][0], ring[k][1]); p.closePath(); }
      m.path = p; ALLPATH.addPath(p);
      m.ord = (m.x - x0) / (x1 - x0);                 // 0 = oeste … 1 = leste
      m.jit = hrand(i, 91);
      m.blank = BLANK[Math.floor(hrand(i, 5) * BLANK.length)];
      m.r = Math.sqrt(m.a / Math.PI);
    });
    OUTLINE = d.contorno.concat([d.contorno[0]]);
    CAMP = d.municipios.findIndex((m) => m.c === '3509502');
    // alfinetes: municípios da classe mais alta de potencial total, espalhados (amostragem por ponto mais distante)
    const top = d.municipios.map((m, i) => ({ m, i })).filter((o) => o.m.k[0] === 4 && o.i !== CAMP);
    const pick = [top.reduce((a, b) => (b.m.x < a.m.x ? b : a))];
    while (pick.length < 9) {
      let best = null, bd = -1;
      for (const o of top) {
        const dd = Math.min(...pick.map((q) => Math.hypot(q.m.x - o.m.x, q.m.y - o.m.y)), Math.hypot(d.municipios[CAMP].x - o.m.x, d.municipios[CAMP].y - o.m.y));
        if (dd > bd) { bd = dd; best = o; }
      }
      pick.push(best);
    }
    PINS = pick.map((o, k) => ({ i: o.i, x: o.m.x, y: o.m.y, col: [PAL.coral, PAL.ambar, PAL.lima, PAL.petrol][k % 4], seed: k }));
  }

  // ondas de cor sobre o mapa: cada município vira (pop / virada de papel) no seu instante
  let WAVES = [];
  function buildWaves() {
    const tSp = at('L02', 'espalhados') - 0.05;
    const tF = at('L05', 'calcula') - 0.05, dF = Math.max(1.6, endOf('L05', 'gerar') - tF - 0.2);
    const tU = CLICK1 + 0.08;
    const cu = MAP.municipios[0];
    const pan = CAMP >= 0 ? MAP.municipios[CAMP] : cu;
    const tB = Lin('L09').inicio - 0.1;
    WAVES = [
      { mode: 'blank', kind: 'pop', d: 0.32, start: (m) => tSp + m.ord * 1.35 + m.jit * 0.18 },
      { mode: 'tot', kind: 'flip', d: 0.3, start: (m) => tF + m.ord * dF + m.jit * 0.12 },
      // a recoloração sai do painel de filtros (à esquerda) e varre o mapa
      { mode: 'urb', kind: 'flip', d: 0.26, start: (m) => tU + m.ord * 0.75 + m.jit * 0.08 },
      { mode: 'tot', kind: 'flip', d: 0.26, start: (m) => tB + (1 - m.ord) * 0.9 + m.jit * 0.08 },
    ];
    for (const w of WAVES) {
      let a = Infinity, b = -Infinity;
      for (const m of MAP.municipios) { const s = w.start(m); if (s < a) a = s; if (s > b) b = s; }
      w.t0 = a; w.t1 = b + w.d;
    }
    void pan;
  }
  const colorOf = (m, mode) => (mode === 'blank' ? m.blank : m.k[KIDX[mode]] < 0 ? ZERO : RAMP[mode][m.k[KIDX[mode]]]);
  /** Estado de um município no instante t: {vis, col, sx, sy, lift}. */
  function cellState(m, t) {
    let wi = -1;
    for (let k = 0; k < WAVES.length; k++) if (t >= WAVES[k].start(m)) wi = k;
    if (wi < 0) return null;
    const w = WAVES[wi], p = (t - w.start(m)) / w.d;
    if (p >= 1) return { col: colorOf(m, w.mode), sx: 1, sy: 1, lift: 0 };
    if (w.kind === 'pop') { const s = E.outBack(clamp(p), 2.4); return { col: colorOf(m, w.mode), sx: s, sy: s, lift: 1 - p }; }
    const prev = wi > 0 ? WAVES[wi - 1].mode : 'blank';
    const c = Math.cos(Math.PI * p);
    return { col: colorOf(m, p < 0.5 ? prev : w.mode), sx: 1 + 0.12 * Math.sin(Math.PI * p), sy: Math.max(0.04, Math.abs(c)), lift: Math.sin(Math.PI * p) * 0.6 };
  }
  /** Modo estático no instante t (todos os municípios assentados) ou null se há animação. */
  function staticMode(t) {
    let mode = null;
    for (const w of WAVES) {
      if (t < w.t0) break;
      if (t < w.t1) return null;
      mode = w.mode;
    }
    return mode;
  }
  const patCache = new Map();
  function pat(ctx, col, seed = 7) {
    const k = col + '|' + seed;
    if (!patCache.has(k)) patCache.set(k, P.pattern(ctx, col, 'paper', { seed, ox: seed * 37, oy: seed * 53, scale: 0.8 }));
    return patCache.get(k);
  }
  const mapCache = new Map();
  const CRES = 1.35;
  function cachedMap(mode) {
    if (mapCache.has(mode)) return mapCache.get(mode);
    const [bx0, by0, bx1, by1] = MAP.bbox, pad = 16;
    const cv = P.canvas((bx1 - bx0 + 2 * pad) * CRES, (by1 - by0 + 2 * pad) * CRES);
    const g = cv.getContext('2d');
    g.scale(CRES, CRES); g.translate(-bx0 + pad, -by0 + pad);
    // sombra curta (papel colado) e depois as peças
    g.fillStyle = 'rgba(40,26,10,0.28)';
    g.save(); g.translate(1.6, 2.4); g.fill(ALLPATH); g.restore();
    const groups = new Map();
    MAP.municipios.forEach((m) => { const c = colorOf(m, mode); if (!groups.has(c)) groups.set(c, new Path2D()); groups.get(c).addPath(m.path); });
    for (const [c, path] of groups) { g.fillStyle = pat(g, c); g.fill(path); }
    g.strokeStyle = 'rgba(35,20,5,0.2)'; g.lineWidth = 0.7; g.stroke(ALLPATH);
    const out = { cv, x: bx0 - pad, y: by0 - pad, w: bx1 - bx0 + 2 * pad, h: by1 - by0 + 2 * pad };
    mapCache.set(mode, out);
    return out;
  }
  function drawMapCells(ctx, t, o = {}) {
    const mode = staticMode(t);
    if (mode) {
      const c = cachedMap(mode);
      ctx.drawImage(c.cv, c.x, c.y, c.w, c.h);
      return;
    }
    const st = MAP.municipios.map((m) => cellState(m, t));
    ctx.fillStyle = 'rgba(40,26,10,0.28)';
    MAP.municipios.forEach((m, i) => { const s = st[i]; if (!s || s.sx < 0.05) return; ctx.save(); ctx.translate(m.x + 1.6 + s.lift * 4, m.y + 2.4 + s.lift * 6); ctx.scale(s.sx, s.sy); ctx.translate(-m.x, -m.y); ctx.fill(m.path); ctx.restore(); });
    ctx.strokeStyle = 'rgba(35,20,5,0.2)'; ctx.lineWidth = 0.7;
    MAP.municipios.forEach((m, i) => {
      const s = st[i]; if (!s || s.sx < 0.05) return;
      ctx.save(); ctx.translate(m.x, m.y); ctx.scale(s.sx, s.sy); ctx.translate(-m.x, -m.y);
      ctx.fillStyle = pat(ctx, s.col); ctx.fill(m.path); ctx.stroke(m.path);
      ctx.restore();
    });
    void o;
  }
  /** Mapa completo numa pose {x,y,s,rot,lift}; outline = progresso do contorno à mão (0..1). */
  function drawMap(rc, pose, o = {}) {
    const { ctx, t } = rc;
    ctx.save();
    ctx.translate(pose.x, pose.y); if (pose.rot) ctx.rotate(pose.rot); ctx.scale(pose.s, pose.s);
    if (pose.lift > 0.02) {   // mapa erguido: sombra grande do conjunto
      SP.setShadow(ctx, rc.zoom * pose.s, pose.lift, 1.1);
      ctx.fillStyle = 'rgba(0,0,0,0.01)';
      ctx.fill(ALLPATH);
      SP.clearShadow(ctx);
    }
    drawMapCells(ctx, t);
    if (o.highlight) o.highlight(ctx);
    const op = o.outline ?? 1;
    if (op > 0) I.stroke(ctx, OUTLINE, { w: (o.outlineW ?? 5) / Math.max(0.5, pose.s), color: o.outlineColor ?? 'rgba(27,42,51,0.88)', progress: op, boil: rc.boil, seed: 7, jitter: 1.4, taper: op < 1 ? [0.02, 0.04] : [0, 0], ds: 5 });
    ctx.restore();
  }
  const toWorld = (pose, x, y) => [pose.x + (x * Math.cos(pose.rot || 0) - y * Math.sin(pose.rot || 0)) * pose.s, pose.y + (x * Math.sin(pose.rot || 0) + y * Math.cos(pose.rot || 0)) * pose.s];

  // pose do mapa ao longo do filme (mesa → voo → tela)
  let T_LIFT = 0, T_FLY = 0, D_FLY = 0.95, T_NB = 0, T_LID = 0;
  function mapPose(t) {
    const lift = tw(t, T_LIFT, T_LIFT + 0.45, E.outCubic) * 0.55;
    const p = tw(t, T_FLY, T_FLY + D_FLY, E.inOutCubic);
    if (p <= 0) return { ...MAP_TAB, s: MAP_TAB.s * (1 + 0.02 * lift / 0.55), rot: 0, lift };
    const arc = Math.sin(Math.PI * p);
    return {
      x: lerp(MAP_TAB.x, MAP_SCR.x, p), y: lerp(MAP_TAB.y, MAP_SCR.y, p) - arc * 160,
      s: lerp(MAP_TAB.s * 1.02, MAP_SCR.s, p), rot: -0.07 * arc, lift: lerp(0.55, 0, p) + arc * 0.3,
    };
  }

  // ---------- câmera ----------
  let CAM = [];
  const mv = (t0, t1, from, to, ease) => ({ t0, t1, from, to, ease });
  function buildCamera() {
    const L = Lin;
    const c = (k) => ({ x: LAY.cam[k][0], y: LAY.cam[k][1], z: LAY.cam[k][2] });
    const A = c('A'), NB = c('NB'), MP = c('MP'), UI = c('UI'), UI2 = c('UI2'), SCI = c('SCI'), PPL = c('PPL'), FIN = c('FIN');
    const k = [];
    const t3 = L('L03').inicio - 0.1;
    k.push(mv(0, t3, A, { ...A, z: A.z * 1.04 }));
    k.push(mv(t3, t3 + 1.05, { ...A, z: A.z * 1.04 }, NB, E.inOutCubic));
    const t5 = at('L05', 'calcula') - 0.35;
    k.push(mv(t3 + 1.05, t5, NB, { ...NB, z: NB.z * 1.02 }));
    k.push(mv(t5, t5 + 1.0, { ...NB, z: NB.z * 1.02 }, MP, E.inOutCubic));
    const t6 = L('L06').inicio - 0.15;
    k.push(mv(t5 + 1.0, t6, MP, { ...MP, z: MP.z * 1.02 }));
    k.push(mv(t6, t6 + 0.85, { ...MP, z: MP.z * 1.02 }, UI, E.inOutCubic));
    const t7 = L('L07').inicio - 0.25;
    const tU2 = CLICK1 + 0.3;   // no vertical a câmera vai do painel de filtros para o mapa depois do 1º clique
    k.push(mv(t6 + 0.85, tU2, UI, { ...UI, z: UI.z * 1.01 }));
    k.push(mv(tU2, tU2 + 0.7, { ...UI, z: UI.z * 1.01 }, UI2, E.inOutCubic));
    k.push(mv(tU2 + 0.7, t7, UI2, { ...UI2, x: UI2.x + 30, z: UI2.z * 1.025 }));
    k.push(mv(t7, t7 + 1.0, { ...UI2, x: UI2.x + 30, z: UI2.z * 1.025 }, SCI, E.inOutCubic));
    const t8 = L('L08').inicio - 0.2;
    k.push(mv(t7 + 1.0, t8, SCI, { ...SCI, z: SCI.z * 1.025 }));
    k.push(mv(t8, t8 + 1.1, { ...SCI, z: SCI.z * 1.025 }, PPL, E.inOutCubic));
    const t9 = L('L09').inicio - 0.3;
    k.push(mv(t8 + 1.1, t9, PPL, { ...PPL, z: PPL.z * 1.03 }));
    k.push(mv(t9, t9 + 1.5, { ...PPL, z: PPL.z * 1.03 }, FIN, E.inOutCubic));
    k.push(mv(t9 + 1.5, TL.duracao + 1, FIN, { ...FIN, z: FIN.z * 1.035 }));
    CAM = k;
  }
  function camera(t) {
    let seg = CAM[CAM.length - 1];
    for (const c of CAM) { if (t < c.t1) { seg = c; break; } }
    const p = clamp((t - seg.t0) / (seg.t1 - seg.t0));
    const e = (seg.ease || E.inOutSine)(p);
    let x = lerp(seg.from.x, seg.to.x, e), y = lerp(seg.from.y, seg.to.y, e), z = lerp(seg.from.z, seg.to.z, e);
    if (seg.ease && seg.t1 - seg.t0 < 1.6) z *= 1 - 0.05 * Math.sin(Math.PI * p);
    x += snoise1(t * 0.35, 11) * 4; y += snoise1(t * 0.31, 17) * 3;
    return { x, y, zoom: z, rot: 0 };
  }
  function camSpeed(t) {
    const a = camera(t), b = camera(t + 1 / 48);
    return Math.hypot(b.x - a.x, b.y - a.y) * 48 * a.zoom + Math.abs(b.zoom - a.zoom) * 48 * 900;
  }

  // ---------- mesa: fundo, folha azul, enfeites ----------
  let SHEET = null;
  const DECOR = [];
  function buildTable() {
    const [sw, sh, sy] = FMT === 'v' ? [860, 1500, -80] : [960, 630, 20];   // folha de planejamento sob o mapa
    SHEET = S.tear(S.xform(S.cut([[-sw, -sh], [sw, -sh], [sw, sh], [-sw, sh]], { seed: 4, jitter: 3, ds: 40, bow: 0.01 }), { rot: -0.012, y: sy }), { amp: 6, seed: 5 });
    const rr = RNG(77);
    for (let k = 0; k < 160; k++) {
      const x = rr.range(-2600, 2600), y = rr.range(-1500, 1500);
      if (Math.abs(x) < 1040 && Math.abs(y) < 780) continue;
      if (Math.hypot(x - BOOKS.x, y - BOOKS.y) < 420) continue;
      DECOR.push({ x, y, kind: rr.pick(['estrela', 'ponto', 'folha', 'espiral', 'confete', 'ponto']), s: rr.range(0.7, 1.35), rot: rr.sym(3), col: rr.pick([PAL.lima, PAL.ambar, PAL.coral, PAL.papel, PAL.ceu, PAL.verde]), seed: k });
    }
  }
  // enfeites recortados (ramos, folha, nuvem, sol) nas bordas da mesa
  const IMG_DECOR = [
    ['ramo', -2150, -950, 1.1, 0.4], ['ramo2', 2100, 980, 1.1, -2.6], ['folha', 1900, -1050, 1.0, 0.8], ['nuvem', -1850, 1150, 1.0, 0.05],
    ['ramo', 1450, -1350, 1.0, 2.2], ['folha', -1450, -1450, 0.9, -0.5], ['ramo2', -900, 2350, 1.0, 1.1], ['folha', 820, 2380, 0.9, 2.0],
    ['nuvem', 520, -1700, 0.95, -0.04], ['ramo', -620, -1720, 1.0, -0.9], ['sol', 2250, -300, 0.9, 0], ['ramo2', -2300, 250, 1.0, 1.6],
  ];
  function drawTable(rc) {
    const { ctx } = rc, v = rc.view;
    ctx.fillStyle = P.pattern(ctx, PAL.kraft, 'kraft', { seed: 7, scale: 1.6 });
    ctx.fillRect(v.x0 - 50, v.y0 - 50, v.x1 - v.x0 + 100, v.y1 - v.y0 + 100);
    // folha azul-céu sob o mapa (o "papel de planejamento")
    SP.piece(ctx, SHEET, { color: '#bfdde6', kind: 'watercolor', seed: 3, shadow: { zoom: rc.zoom, strength: 0.9 }, edge: 0.12, shade: 0.5 });
    for (const [nm, x, y, sc, rot] of IMG_DECOR) if (HAS(nm) && rc.visible(x, y, 300)) X.img(ctx, nm, x, y, Z({ s: sc, rot }));
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

  // ---------- L01: título ----------
  let TITLE1, TITLE2, HERO, FTITLE, STRIP;
  let QMARKS = [];
  function buildTitle() {
    TITLE1 = T.ransom('ONDE ESTÁ O', { size: 96, seed: 3, papers: ['#fbf8f0', '#f2c14e', '#b6e03b', '#f3ead8'] });
    TITLE2 = T.ransom('BIOGÁS?', { size: 200, seed: 8, tilt: 0.1 });
    // a marca é "PILAR-2b" (b minúsculo): a última letra usa uma fonte com caixa-baixa
    const PF = ['Luckiest Guy', 'Alfa Slab One', 'Bungee', 'Titan One', 'Archivo Black', 'Luckiest Guy', 'Lilita One', 'Abril Fatface'];
    const PP = ['#b6e03b', '#1e3e4c', '#fbf8f0', '#d37402', '#5ca032', '#fbf8f0', '#f2c14e', '#1e3e4c'];
    const byIdx = (i) => PP[i];   // cores fixas por letra; o hífen fica em papel claro para aparecer
    HERO = T.ransom('PILAR-2b', { size: 190, seed: 29, tilt: 0.08, paperFor: byIdx, fonts: PF });
    FTITLE = T.ransom('PILAR-2b', { size: 160, seed: 29, tilt: 0.08, paperFor: byIdx, fonts: PF });
    STRIP = S.tear(S.cut([[-420, -58], [420, -52], [414, 56], [-426, 52]], { seed: 31, jitter: 2, ds: 30 }), { amp: 3, seed: 32 });
  }
  function drawTitle(rc) {
    const { ctx, t, tq } = rc;
    const tEnd = Lin('L02').inicio + 0.25;
    if (t > tEnd + 1.2) return;
    const tO = at('L01', 'Onde'), tB = at('L01', 'biogás'), tS = at('L01', 'São');
    const fall = (i) => { const p = clamp((t - tEnd - i * 0.035) / 0.7); return { dy: E.inQuad(p) * 1300, rot: p * (hrand(i, 3) - 0.5) * 2.4 }; };
    if (t < tEnd + 0.4) QMARKS.forEach(([x, y, sz, rot, col, t0], k) => {
      const pr = clamp((t - t0) / 0.35) * (1 - clamp((t - tEnd) / 0.25));
      if (pr > 0) T.hand(ctx, '?', x, y, { size: sz * (0.6 + 0.4 * pr), font: 'Caveat Brush', color: col, rot: rot + Math.sin(tq * 3 + k) * 0.06, boil: rc.boil, seed: 70 + k, jitter: 1.4 });
    });
    const TT = LAY.title;
    TITLE1.forEach((l, i) => { const p = pop(tq, tO - 0.12 + i * 0.06, 0.3, 2.6); const f = fall(i); if (p > 0) SP.place(ctx, l.spr, TT.x + l.x, TT.y1 + l.y + f.dy, { rot: l.rot + f.rot, s: p, zoom: rc.zoom, lift: (1 - p) * 0.8 + (f.dy > 0 ? 0.6 : 0) }); });
    TITLE2.forEach((l, i) => { const p = pop(tq, tB - 0.1 + i * 0.07, 0.32, 2.6); const f = fall(i + 11); if (p > 0) SP.place(ctx, l.spr, TT.x + 20 + l.x, TT.y2 + l.y + f.dy, { rot: l.rot + (1 - p) * 0.5 + f.rot, s: p, zoom: rc.zoom, lift: (1 - p) * 0.9 + (f.dy > 0 ? 0.6 : 0) }); });
    const wp = clamp((t - tS + 0.05) / (endOf('L01', 'Paulo') - tS + 0.1));
    if (wp > 0) {
      const f = fall(20);
      ctx.save(); ctx.translate(TT.x + 20, TT.y3 + f.dy); ctx.rotate(-0.02 + f.rot * 0.3);
      const sIn = pop(tq, tS - 0.2, 0.3);
      ctx.save(); ctx.scale(sIn, 1); SP.piece(ctx, STRIP, { color: PAL.papel, kind: 'smooth', seed: 5, shadow: { zoom: rc.zoom }, edge: 0.15 }); ctx.restore();
      T.hand(ctx, 'de São Paulo?', 0, -4, { size: 104, font: 'Caveat Brush', color: PAL.verdeEsc, progress: wp, boil: rc.boil, seed: 21 });
      ctx.restore();
    }
  }
  function cuesTitulo() {
    sfx(0.05, 'papel_desliza', { g: 0.6 });
    sfx(0.35, 'rabisco', { g: 0.3, dur: 1.6 });
    const tO = at('L01', 'Onde'), tB = at('L01', 'biogás');
    for (let i = 0; i < 9; i++) sfx(tO - 0.12 + i * 0.06 + 0.08, 'letra', { g: 0.38, pan: -0.3 + i * 0.05, p: 1.1 + i * 0.04 });
    for (let i = 0; i < 7; i++) sfx(tB - 0.1 + i * 0.07 + 0.1, 'letra', { g: 0.55, pan: -0.1 + i * 0.05, p: 0.85 + i * 0.05 });
    sfx(at('L01', 'São') - 0.05, 'rabisco', { g: 0.32, dur: endOf('L01', 'Paulo') - at('L01', 'São') + 0.1 });
    for (let k = 0; k < 5; k++) sfx(QMARKS[k][5] + 0.05, 'pop', { g: 0.25, pan: QMARKS[k][0] / 1000, p: 1.3 + k * 0.08 });
    sfx(Lin('L02').inicio + 0.25, 'whoosh', { g: 0.45, dur: 0.8, p: 0.8 });
  }

  // ---------- L02: resíduos caem no mapa ----------
  const REG = { cana: [149, -257], vaca: [-470, -95], lixo: [330, 205] };  // Ribeirão Preto · Pres. Prudente · São Paulo
  function drawResiduos(rc, pose) {
    const { ctx, t, tq } = rc;
    const tOut = Lin('L03').inicio - 0.05;
    if (t < at('L02', 'cana') - 0.3 || t > tOut + 0.8) return;
    const out = (k) => { const p = clamp((t - tOut - k * 0.08) / 0.4); return p <= 0 ? 1 : 1 - E.inBack(p); };
    const item = (name, wkey, k, s, dx = 0, dy = 0, extra) => {
      const t0 = at('L02', wkey) - 0.12;
      const d = drop(tq, t0, 560, 0.5);
      if (!d.on) return;
      const [wx, wy] = toWorld(pose, REG[name][0], REG[name][1]);
      const o = out(k);
      if (o <= 0.01) return;
      const sq = settle(tq, t0 + 0.5, 3, 7) * 0.06;
      ctx.save(); ctx.translate(wx + dx, wy + dy + d.dy); ctx.scale(o * (1 + sq), o * (1 - sq));
      if (HAS(name)) X.img(ctx, name, 0, 0, Z({ s, ay: 0.9, lift: d.lift }));
      else fallbackItem(ctx, name, s, rc);
      if (extra) extra();
      ctx.restore();
    };
    item('cana', 'cana', 0, 0.62, 0, 30);
    item('vaca', 'esterco', 1, 0.62, 0, 40, () => { const p = pop(tq, at('L02', 'esterco') + 0.25, 0.3); if (p > 0 && HAS('esterco')) X.img(ctx, 'esterco', -170, 0, Z({ s: 0.55 * p, ay: 0.9 })); });
    item('lixo', 'lixo', 2, 0.36, -40, 25, () => { const p = pop(tq, at('L02', 'cidades') - 0.1, 0.3); if (p > 0 && HAS('saco')) X.img(ctx, 'saco', 170, -10, Z({ s: 0.36 * p, ay: 0.9 })); });
    // anel desenhado em volta de cada resíduo quando ele aparece
    for (const [name, wkey] of [['cana', 'cana'], ['vaca', 'esterco'], ['lixo', 'lixo']]) {
      const t0 = at('L02', wkey) + 0.3, pr = clamp((t - t0) / 0.35), fade = 1 - clamp((t - at('L02', 'espalhados')) / 0.3);
      if (pr <= 0 || fade <= 0) continue;
      const [wx, wy] = toWorld(pose, REG[name][0], REG[name][1]);
      I.circle(ctx, wx, wy - 40, 190, 140, { w: 6, color: PAL.coral, progress: pr, seed: name.length, boil: rc.boil, alpha: 0.85 * fade });
    }
  }
  /** Lupa: usa o recorte (lente magenta = buraco, meta.json → tela) ou a lupa desenhada do motor. */
  function lupa(ctx, x, y, r, inside, o = {}) {
    const m = META.lupa;
    if (!HAS('lupa') || !m || !m.tela) return X.lens(ctx, x, y, r, inside, o);
    const im = X.images.get('lupa'), [hx0, hy0, hx1, hy1] = m.tela;
    const hr = (hx1 - hx0 + hy1 - hy0) / 4, k = (r / hr) * 1.04;
    const hcx = (hx0 + hx1) / 2, hcy = (hy0 + hy1) / 2, rot = o.rot ?? -0.35;
    ctx.save(); ctx.translate(x, y); if (o.s != null) ctx.scale(o.s, o.s);
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip();
    inside(ctx);
    const g = ctx.createLinearGradient(-r, -r, r, r);
    g.addColorStop(0, 'rgba(255,255,255,0.3)'); g.addColorStop(0.4, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r);
    ctx.restore();
    ctx.rotate(rot);
    SP.setShadow(ctx, (o.zoom ?? 1) * k, o.lift ?? 0.4, 1);
    ctx.drawImage(im, -hcx * k, -hcy * k, im.width * k, im.height * k);
    ctx.restore();
  }
  /** "Ele está escondido…": uma lupa varre o mapa e mostra, ampliados, os resíduos escondidos. */
  function drawBusca(rc, pose) {
    const { ctx, t, tq } = rc;
    const t0 = at('L02', 'escondido') - 0.25, t1 = at('L02', 'cana') - 0.05;
    const lIn = pop(tq, t0, 0.35) * (1 - tw(t, t1 - 0.15, t1 + 0.2, E.inBack));
    if (lIn <= 0) return;
    const p = tw(t, t0, t1, E.inOutSine);
    const [mx, my] = toWorld(pose, lerp(-420, 330, p), -60 + Math.sin(p * TAU * 1.2) * 150);
    const which = p < 0.36 ? 'vaca' : p < 0.7 ? 'cana' : 'lixo';
    lupa(ctx, mx, my, 150, (g) => {
      g.fillStyle = P.pattern(g, '#f3ead8', 'paper', { seed: 4 }); g.fillRect(-160, -160, 320, 320);
      g.strokeStyle = 'rgba(35,20,5,0.25)'; g.lineWidth = 2;
      for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-160 + k * 70 + snoise1(k, 3) * 20, -160); g.lineTo(-140 + k * 60, 160); g.stroke(); }
      const bob = Math.sin(tq * 8) * 6;
      if (HAS(which)) X.img(g, which, 0, 40 + bob, { s: which === 'cana' ? 0.42 : 0.32, ay: 0.75, zoom: rc.zoom });
    }, { s: lIn, zoom: rc.zoom, handle: 0.8, lift: 0.5 });
  }
  function fallbackItem(ctx, name, s, rc) {
    const col = { cana: PAL.verde, vaca: PAL.papel, lixo: PAL.verdeEsc }[name] || PAL.creme;
    SP.piece(ctx, S.rrect(-150 * s * 2, -260 * s * 2, 300 * s * 2, 260 * s * 2, 30, { seed: 3 }), { color: col, seed: 4, border: { w: 8 }, shadow: { zoom: rc.zoom } });
    T.hand(ctx, name, 0, -130 * s * 2, { size: 60, color: INK });
  }
  function cuesResiduos() {
    sfx(at('L02', 'escondido') - 0.25, 'lupa', { g: 0.6, pan: -0.3 });
    sfx(at('L02', 'cana') - 0.12 + 0.18, 'plop', { g: 0.75, pan: 0.1 });
    sfx(at('L02', 'cana') + 0.1, 'palha', { g: 0.45, pan: 0.1 });
    sfx(at('L02', 'esterco') - 0.12 + 0.2, 'plop', { g: 0.8, pan: -0.5, p: 0.85 });
    sfx(at('L02', 'esterco') + 0.3, 'boing', { g: 0.35, pan: -0.5, p: 1.3 });
    sfx(at('L02', 'lixo') - 0.12 + 0.2, 'plop', { g: 0.75, pan: 0.45, p: 0.9 });
    sfx(at('L02', 'lixo') + 0.15, 'motor', { g: 0.35, pan: 0.45, dur: 0.8 });
    for (const w of ['cana', 'esterco', 'lixo']) sfx(at('L02', w) + 0.3, 'rabisco', { g: 0.2, dur: 0.35 });
    sfx(at('L02', 'espalhados') - 0.05, 'papelada', { g: 0.8, dur: 1.7 });
    sfx(Lin('L03').inicio - 0.05, 'whoosh_curto', { g: 0.4 });
  }

  // ---------- notebook de papel ----------
  let LID, BEZEL_IN, BASE, KEYS = [];
  function buildNotebook() {
    LID = S.rrect(SCR.x - 62, SCR.y - 60, SCR.w + 124, SCR.h + 130, 44, { seed: 61, jitter: 0.9 });
    BEZEL_IN = S.rrect(SCR.x, SCR.y, SCR.w, SCR.h, 10, { seed: 62, jitter: 0.6 });
    BASE = S.cut([[SCR.x - 110, HINGE], [SCR.x + SCR.w + 110, HINGE], [SCR.x + SCR.w + 230, HINGE + 200], [SCR.x - 230, HINGE + 200]], { seed: 63, jitter: 1.2, ds: 14 });
    const rr = RNG(64);
    for (let r = 0; r < 4; r++) {
      const y0 = HINGE + 22 + r * 34, y1 = y0 + 26, inset = 110 + (3 - r) * 22 - r * 8;
      const x0 = SCR.x - inset + 140, x1 = SCR.x + SCR.w + inset - 140;
      const n = 13 - (r === 3 ? 4 : 0);
      for (let k = 0; k < n; k++) {
        const kw = (x1 - x0) / n;
        const wide = r === 3 && k === Math.floor(n / 2);
        KEYS.push({ poly: S.rrect(x0 + k * kw + 4, y0, kw * (wide ? 1 : 1) - 8, y1 - y0, 5, { seed: 100 + r * 20 + k, jitter: 0.5 }), col: rr.chance(0.1) ? PAL.lima : '#e9e6dc' });
      }
    }
  }
  /** Transformação da tampa: sobe com o notebook e abre a partir da dobradiça. */
  function nbState(t) {
    const rise = tw(t, T_NB, T_NB + 0.75, E.outBack);
    const open = tw(t, T_LID, T_LID + 0.6, (p) => E.outBack(p, 1.6));
    return { dy: (1 - rise) * 1900, open: Math.max(0.03, open), on: t >= T_NB };
  }
  /** Recorte do notebook (se existir): o buraco magenta da tela (meta.json → tela) é encaixado em SCR. */
  function nbImage() {
    if (!HAS('notebook') || !META.notebook || !META.notebook.tela) return null;
    const im = X.images.get('notebook'), [hx0, hy0, hx1, hy1] = META.notebook.tela;
    const k = SCR.w / (hx1 - hx0);
    const ox = SCR.x - hx0 * k, oy = SCR.y - hy0 * k;
    const hingeImg = META.notebook.dobradica ?? (hy1 + (hy1 - hy0) * 0.07);
    return { im, k, ox, oy, hingeImg, hingeW: oy + hingeImg * k };
  }
  function drawNotebookBase(rc, nb) {
    const { ctx } = rc;
    const ni = nbImage();
    if (ni) {   // metade de baixo da imagem (teclado), sem transformação da tampa
      ctx.save(); ctx.translate(0, nb.dy);   // a imagem é contínua: o buraco fica exatamente em SCR
      SP.setShadow(ctx, rc.zoom * ni.k, 0.2, 1);
      ctx.drawImage(ni.im, 0, ni.hingeImg, ni.im.width, ni.im.height - ni.hingeImg, ni.ox, ni.hingeW, ni.im.width * ni.k, (ni.im.height - ni.hingeImg) * ni.k);
      ctx.restore();
      return;
    }
    ctx.save(); ctx.translate(0, nb.dy);
    SP.piece(ctx, BASE, { color: '#cfd5d2', seed: 65, shadow: { zoom: rc.zoom, lift: 0.2 }, edge: 0.2, ink: { w: 3, boil: rc.boil, alpha: 0.6 } });
    SP.piece(ctx, S.cut([[SCR.x - 230, HINGE + 200], [SCR.x + SCR.w + 230, HINGE + 200], [SCR.x + SCR.w + 222, HINGE + 236], [SCR.x - 222, HINGE + 236]], { seed: 66, jitter: 1 }), { color: '#9fa9a6', seed: 66, edge: 0.25 });
    for (const k of KEYS) SP.piece(ctx, k.poly, { color: k.col, kind: 'smooth', seed: 7, edge: 0.3, shade: 0.4 });
    SP.piece(ctx, S.rrect(-170, HINGE + 160, 340, 30, 8, { seed: 67 }), { color: '#bcc4c1', kind: 'smooth', seed: 8, edge: 0.25 });
    ctx.restore();
  }
  /** Abre um contexto já transformado para a tampa (conteúdo da tela) — devolve false se fechada. */
  function lidTransform(ctx, nb) {
    const hy = nbImage()?.hingeW ?? HINGE;
    ctx.translate(0, nb.dy + hy);
    ctx.scale(1, nb.open);
    ctx.translate(0, -hy);
  }
  function drawLidBack(rc) {
    const { ctx } = rc;
    if (nbImage()) { SP.piece(ctx, S.rrect(SCR.x - 30, SCR.y - 30, SCR.w + 60, SCR.h + 70, 10, { seed: 62 }), { color: '#fbf9f2', kind: 'smooth', seed: 69, edge: 0, shade: 0.35 }); return; }
    SP.piece(ctx, LID, { color: PAL.petrol, seed: 68, shadow: { zoom: rc.zoom, lift: 0.25 }, edge: 0.2 });
    // papel da tela
    SP.piece(ctx, BEZEL_IN, { color: '#fbf9f2', kind: 'smooth', seed: 69, edge: 0.3, shade: 0.35 });
  }
  function drawLidFront(rc) {
    const { ctx } = rc;
    const ni = nbImage();
    if (ni) {   // metade de cima da imagem (moldura com a tela vazada) por cima da interface
      ctx.save();
      SP.setShadow(ctx, rc.zoom * ni.k, 0.25, 1);
      ctx.drawImage(ni.im, 0, 0, ni.im.width, ni.hingeImg, ni.ox, ni.oy, ni.im.width * ni.k, ni.hingeImg * ni.k);
      ctx.restore();
      return;
    }
    // câmera do notebook (bolinha) e sombra interna da moldura
    ctx.fillStyle = '#0f2530'; ctx.beginPath(); ctx.arc(0, SCR.y - 30, 7, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(10,25,32,0.35)'; ctx.lineWidth = 6;
    ctx.beginPath(); S.trace(ctx, BEZEL_IN, true); ctx.stroke();
  }

  // ---------- interface de papel (dentro da tela) ----------
  let UI_BAR, UI_PANEL, UI_MAPBG, UI_LEG = [];
  function buildUI() {
    UI_BAR = S.cut([[SCR.x + 4, SCR.y + 4], [SCR.x + SCR.w - 4, SCR.y + 4], [SCR.x + SCR.w - 4, SCR.y + BARH], [SCR.x + 4, SCR.y + BARH + 2]], { seed: 71, jitter: 1, ds: 30 });
    UI_PANEL = S.rrect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 18, { seed: 72, jitter: 0.8 });
    UI_MAPBG = S.rrect(MAPBOX.x, MAPBOX.y, MAPBOX.w, MAPBOX.h, 18, { seed: 73, jitter: 0.8 });
    for (let k = 0; k < 5; k++) UI_LEG.push(S.rrect(-60 + k * 64, 0, 58, 30, 5, { seed: 80 + k, jitter: 0.6 }));
  }
  const uiFont = (w, px) => `${w} ${px}px "Neulis Sans", "Kalam", sans-serif`;
  function drawUI(rc) {
    const { ctx, t, tq } = rc;
    const tBar = T_LID + 0.45;
    const bIn = tw(tq, tBar, tBar + 0.35, E.outBack);
    // fundo do mapa e painel
    const pIn = pop(tq, Lin('L04').inicio - 0.1, 0.35);
    const mIn = pop(tq, T_FLY + 0.35, 0.35);
    if (mIn > 0) {
      ctx.save(); ctx.globalAlpha *= clamp(mIn * 1.5);
      SP.piece(ctx, UI_MAPBG, { color: '#e5f1f3', kind: 'smooth', seed: 74, edge: 0.18, shade: 0.3 });
      ctx.restore();
    }
    if (pIn > 0) {
      ctx.save(); ctx.translate(PANEL.x + PANEL.w / 2, PANEL.y + PANEL.h / 2); ctx.scale(1, pIn); ctx.translate(-(PANEL.x + PANEL.w / 2), -(PANEL.y + PANEL.h / 2));
      SP.piece(ctx, UI_PANEL, { color: '#f1ede2', kind: 'smooth', seed: 75, edge: 0.18, shade: 0.3 });
      ctx.fillStyle = PAL.petrol; ctx.font = uiFont(700, 40); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      ctx.fillText('Filtros', PANEL.x + 26, PANEL.y + 38);
      ctx.restore();
    }
    // barra superior
    if (bIn > 0) {
      ctx.save(); ctx.translate(0, (1 - bIn) * -60); ctx.globalAlpha *= clamp(bIn * 2);
      SP.piece(ctx, UI_BAR, { color: PAL.petrol, seed: 76, edge: 0.1, shade: 0.4 });
      ctx.font = uiFont(700, 34); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      const tabs = [['Mapa', -250], ['Base Científica', -60]];
      const tSci = at('L07', 'científica');
      tabs.forEach(([nm, x], k) => {
        const active = k === 0 ? t < tSci : t >= tSci;
        ctx.fillStyle = active ? '#fbf8f0' : 'rgba(251,248,240,0.62)';
        ctx.fillText(nm, x, SCR.y + BARH / 2 + 4);
        if (active) { const w = ctx.measureText(nm).width; ctx.fillStyle = PAL.lima; ctx.fillRect(x, SCR.y + BARH - 16, w, 6); }
      });
      // "buscar" e "entrar" (formas sem texto)
      SP.piece(ctx, S.rrect(SCR.x + SCR.w - 330, SCR.y + 20, 220, 44, 22, { seed: 77 }), { color: '#2e5566', seed: 77, edge: 0.1 });
      SP.piece(ctx, S.blob(SCR.x + SCR.w - 60, SCR.y + 42, 22, 22, { seed: 78 }), { color: PAL.lima, seed: 78, edge: 0.15 });
      ctx.restore();
    }
    // destaque da aba "Base Científica" (círculo à mão)
    const tSci = at('L07', 'científica') - 0.1, cp = clamp((t - tSci) / 0.45), cf = 1 - clamp((t - Lin('L08').inicio) / 0.3);
    if (cp > 0 && cf > 0) I.circle(ctx, 60, SCR.y + BARH / 2, 150, 40, { w: 6, color: PAL.amarelo, progress: cp, seed: 9, boil: rc.boil, alpha: cf });
  }
  function drawLegend(rc, mode) {
    const { ctx, t, tq } = rc;
    const lIn = pop(tq, at('L05', 'gerar') - 0.15, 0.35);
    if (lIn <= 0) return;
    const x = MAPBOX.x + MAPBOX.w / 2 - 100, y = MAPBOX.y + MAPBOX.h - 52;
    ctx.save(); ctx.translate(x, y); ctx.scale(lIn, lIn);
    UI_LEG.forEach((poly, k) => SP.piece(ctx, poly, { color: RAMP[mode === 'blank' ? 'tot' : mode][k], seed: 80 + k, edge: 0.25, shade: 0.3, shadow: { zoom: rc.zoom, strength: 0.5 } }));
    ctx.fillStyle = INK; ctx.font = uiFont(700, 30); ctx.textBaseline = 'middle';
    ctx.textAlign = 'right'; ctx.fillText('menos', -76, 17);
    ctx.textAlign = 'left'; ctx.fillText('mais', 272, 17);
    ctx.restore();
    void t;
  }

  // ---------- L04: pastas de dados → filtros ----------
  const FOLDER = { w: 350, h: 200 };
  let FOLDER_BACK, FOLDER_FRONT;
  function buildFolders() {
    const w = FOLDER.w, h = FOLDER.h;
    FOLDER_BACK = S.cut([[-w / 2, -h / 2 - 26], [-w / 2 + 120, -h / 2 - 26], [-w / 2 + 146, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], { seed: 90, jitter: 0.8, ds: 12 });
    FOLDER_FRONT = S.cut([[-w / 2, -h / 2 + 22], [w / 2 + 4, -h / 2 + 14], [w / 2, h / 2], [-w / 2, h / 2]], { seed: 91, jitter: 0.8, ds: 12 });
  }
  function folderT(k) {
    const words = ['agricultura', 'pecuária', 'cidades'];
    return at('L04', words[k]) - 0.35;
  }
  function drawFolder(ctx, cat, x, y, s, rot, rc, o = {}) {
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(s, s);
    const lift = o.lift ?? 0;
    SP.piece(ctx, FOLDER_BACK, { color: shade(cat.cor, -0.22), seed: 92, shadow: { zoom: rc.zoom * s, lift }, edge: 0.2 });
    // folhinhas saindo da pasta
    SP.piece(ctx, S.rrect(-FOLDER.w / 2 + 18, -FOLDER.h / 2 - 8, FOLDER.w - 40, 60, 4, { seed: 93 }), { color: '#fbf8f0', kind: 'smooth', seed: 93, edge: 0.2 });
    SP.piece(ctx, FOLDER_FRONT, { color: cat.cor, seed: 94 + cat.id.length, edge: 0.18, shade: 0.6 });
    ctx.fillStyle = '#fbf8f0'; ctx.font = uiFont(700, 46); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(cat.nome, -FOLDER.w / 2 + 24, 24);
    if (HAS(cat.img)) X.img(ctx, cat.img, FOLDER.w / 2 - 58, 12, Z({ s: cat.imgS * s > 0 ? cat.imgS : cat.imgS, zoom: rc.zoom * s, shadowStrength: 0.6 }));
    if (o.sel > 0) {   // selecionada: contorno lima + visto
      I.stroke(ctx, S.offset(S.resample(FOLDER_BACK, 6, true), 9), { closed: true, w: 7, color: PAL.lima, progress: o.sel, seed: 95, boil: rc.boil, taper: [0, 0] });
      const cs = pop(rc.tq, o.selT, 0.3);
      if (cs > 0) { ctx.save(); ctx.translate(FOLDER.w / 2 - 6, -FOLDER.h / 2 - 6); ctx.scale(cs, cs); SP.piece(ctx, S.blob(0, 0, 28, 28, { seed: 96 }), { color: PAL.lima, seed: 96, border: { w: 4 }, shadow: { zoom: rc.zoom } }); I.stroke(ctx, [[-12, 0], [-3, 10], [14, -10]], { w: 6, color: PAL.petrol, seed: 97, boil: rc.boil, taper: [0, 0] }); ctx.restore(); }
    }
    if (o.dim) { ctx.globalAlpha = o.dim; ctx.fillStyle = '#f1ede2'; ctx.fillRect(-FOLDER.w / 2 - 4, -FOLDER.h / 2 - 30, FOLDER.w + 12, FOLDER.h + 34); }
    ctx.restore();
  }
  function drawFolders(rc) {
    const { ctx, t, tq } = rc;
    CATS.forEach((cat, k) => {
      const t0 = folderT(k);
      if (t < t0) return;
      const p = tw(tq, t0, t0 + 0.7, E.inOutCubic);
      const from = [FMT === 'v' ? 300 + k * 120 : 1900, FMT === 'v' ? 1300 + k * 90 : -150 + k * 60], to = [SLOT[k].x, SLOT[k].y];
      const arc = Math.sin(Math.PI * p);
      const x = lerp(from[0], to[0], p), y = lerp(from[1], to[1], p) - arc * 260;
      const s = lerp(1.35, 1, p) * (1 + settle(tq, t0 + 0.7, 3, 7) * 0.05);
      const rot = lerp(0.35 - k * 0.2, 0, p) + settle(tq, t0 + 0.7, 2.4, 6) * 0.05;
      const sel = k === 2 ? clamp((t - CLICK1) / 0.35) : 0;
      const dim = t > CLICK1 && k !== 2 ? 0.35 * clamp((t - CLICK1) / 0.3) * (1 - clamp((t - Lin('L09').inicio) / 0.4)) : 0;
      drawFolder(ctx, cat, x, y, s, rot, rc, { lift: arc * 0.9, sel: sel * (1 - clamp((t - Lin('L09').inicio) / 0.3)), selT: CLICK1 + 0.1, dim });
      // faíscas de dados: da pasta para o mapa
      const fp = clamp((t - t0 - 0.72) / 0.8);
      if (fp > 0 && fp < 1) for (let j = 0; j < 7; j++) {
        const m = MAP.municipios[Math.floor(hrand(j, k + 3) * MAP.municipios.length)];
        const [tx, ty] = toWorld(MAP_SCR, m.x, m.y);
        const q = E.outCubic(clamp(fp * 1.3 - j * 0.05));
        const px = lerp(to[0] + 150, tx, q), py = lerp(to[1], ty, q) - Math.sin(Math.PI * q) * 120;
        ctx.save(); ctx.globalAlpha = 1 - q * q;
        SP.piece(ctx, S.star(px, py, 7, 17, 4, { seed: j }), { color: [cat.cor, PAL.amarelo, PAL.lima][j % 3], seed: j, edge: 0.2, shadow: { zoom: rc.zoom, strength: 0.5 } });
        ctx.restore();
      }
    });
  }
  function cuesFolders() {
    CATS.forEach((c, k) => {
      const t0 = folderT(k);
      sfx(t0, 'papel_desliza', { g: 0.55, pan: 0.6 - k * 0.1, p: 1 + k * 0.08 });
      sfx(t0 + 0.68, 'papel_pousa', { g: 0.75, pan: -0.5, p: 0.9 + k * 0.08 });
      sfx(t0 + 0.8, 'plim', { g: 0.3, pan: -0.1, p: 0.9 + k * 0.12 });
    });
  }

  // ---------- L03: notebook + PILAR-2b ----------
  function drawHero(rc) {
    const { ctx, t, tq } = rc;
    const tP = at('L03', 'Pilar') - 0.12, tGo = Lin('L04').inicio + 0.1;
    if (t < tP) return;
    const g = tw(t, tGo, tGo + 0.6, E.inOutCubic);
    const logoX = SCR.x + 190, logoY = SCR.y + BARH / 2 + 2;
    const cx = lerp(0, logoX, g), cy = lerp(LAY.hero.y, logoY, g), s = lerp(LAY.hero.s, 0.235, g);
    HERO.forEach((l, i) => {
      const p = pop(tq, tP + i * 0.06, 0.3, 2.6);
      if (p > 0) SP.place(ctx, l.spr, cx + l.x * s, cy + l.y * s, { rot: l.rot * (1 - g * 0.5) + (1 - p) * 0.5, s: p * s, zoom: rc.zoom, lift: (1 - p) * 0.9 + Math.sin(Math.PI * g) * 0.5 });
    });
  }
  function cuesNotebook() {
    sfx(T_LIFT, 'papel_desliza', { g: 0.45, p: 0.8 });
    sfx(T_NB + 0.05, 'whoosh', { g: 0.5, dur: 0.7, p: 0.9 });
    sfx(T_NB + 0.6, 'papel_pousa', { g: 0.9, p: 0.65 });
    sfx(T_LID, 'abre', { g: 0.7 });
    sfx(T_FLY + 0.05, 'whoosh', { g: 0.45, dur: 0.8, p: 1.2 });
    sfx(T_FLY + D_FLY - 0.05, 'papel_pousa', { g: 0.85, p: 0.8 });
    const tP = at('L03', 'Pilar') - 0.12;
    for (let i = 0; i < 8; i++) sfx(tP + i * 0.06 + 0.08, 'letra', { g: 0.5, pan: -0.25 + i * 0.07, p: 0.9 + i * 0.05 });
    sfx(tP + 0.55, 'carimbo', { g: 0.55 });
    sfx(Lin('L04').inicio + 0.1, 'whoosh_curto', { g: 0.35, pan: -0.5 });
  }

  // ---------- L05: preenchimento ----------
  function cuesPreenche() {
    const t0 = WAVES[1].t0;
    sfx(t0, 'papelada', { g: 0.55, dur: WAVES[1].t1 - t0 + 0.2, p: 1.15 });
    sfx(t0, 'preenche', { g: 0.5, dur: WAVES[1].t1 - t0 + 0.4 });
    sfx(at('L05', 'gerar') - 0.1, 'pop', { g: 0.45, p: 1.2 });
  }

  // ---------- L06: cursor, filtro, clique na cidade, cartão ----------
  let CLICK1 = 0, CLICK2 = 0;
  function cursorPath(t) {
    // pontos (mundo): entra pela direita-baixo → pasta "Urbano" → Campinas
    const pc = CAMP >= 0 ? toWorld(MAP_SCR, MAP.municipios[CAMP].x, MAP.municipios[CAMP].y) : [300, 0];
    const tIn = Lin('L06').inicio + 0.1;
    const P0 = [900, 600], P1 = [SLOT[2].x + 40, SLOT[2].y + 10], P2 = [pc[0] + 6, pc[1] + 8];
    const tOut = Lin('L07').inicio - 0.1;
    if (t < tIn) return null;
    const seg = (a, b, t0, t1, e = E.inOutCubic) => { const p = tw(t, t0, t1, e); return [lerp(a[0], b[0], p) + Math.sin(Math.PI * p) * 40, lerp(a[1], b[1], p) - Math.sin(Math.PI * p) * 70]; };
    let p;
    if (t < CLICK1) p = seg(P0, P1, tIn, CLICK1 - 0.08);
    else if (t < CLICK2) p = seg(P1, P2, CLICK1 + 0.3, CLICK2 - 0.08);
    else if (t < tOut + 0.5) p = seg(P2, [P2[0] + 700, P2[1] + 900], tOut - 0.2, tOut + 0.5, E.inCubic);
    else return null;
    const press = Math.max(pulse(t, CLICK1, 0.09), pulse(t, CLICK2, 0.09));
    return { x: p[0], y: p[1], press };
  }
  function drawCursor(rc) {
    const { ctx, t } = rc;
    const c = cursorPath(t);
    if (!c) return;
    // anéis do clique
    for (const tc of [CLICK1, CLICK2]) {
      const q = clamp((t - tc) / 0.45);
      if (q > 0 && q < 1) { ctx.save(); ctx.globalAlpha = 1 - q; I.circle(ctx, c.x, c.y, 20 + q * 60, 20 + q * 60, { w: 6, color: PAL.lima, seed: 3, boil: rc.boil, turns: 1.02 }); ctx.restore(); }
    }
    ctx.save(); ctx.translate(c.x, c.y); ctx.scale(1 - c.press * 0.14, 1 - c.press * 0.14); ctx.rotate(-0.05 + sway(t, 3, 0.03, 0.7));
    if (HAS('mao')) {
      const m = META.mao || { ax: 0.1, ay: 0.08, s: 0.5 };
      X.img(ctx, 'mao', 0, 0, Z({ s: m.s, ax: m.ax, ay: m.ay, lift: 0.3 + c.press * -0.25 }));
    } else if (HAS('cursor')) {
      const m = META.cursor || { ax: 0.08, ay: 0.06, s: 0.45 };
      X.img(ctx, 'cursor', 0, 0, Z({ s: m.s, ax: m.ax, ay: m.ay, lift: 0.3 }));
    } else {
      const arrow = S.cut([[0, 0], [0, 118], [30, 90], [52, 138], [74, 128], [52, 82], [92, 80]], { seed: 5, jitter: 0.6, ds: 8 });
      SP.piece(ctx, arrow, { color: '#fbfbf6', kind: 'smooth', seed: 5, border: { w: 7, color: PAL.petrol }, shadow: { zoom: rc.zoom, lift: 0.35 - c.press * 0.3 } });
    }
    ctx.restore();
  }
  function camHighlight(t) {
    return function (ctx) {
      if (CAMP < 0 || t < CLICK2) return;
      const m = MAP.municipios[CAMP];
      const up = pop(t, CLICK2 + 0.02, 0.3, 2.2) * (1 - tw(t, Lin('L07').inicio + 0.3, Lin('L07').inicio + 0.7));
      if (up <= 0) return;
      const s = 1 + up * 1.7;
      ctx.save(); ctx.translate(m.x, m.y); ctx.scale(s, s); ctx.translate(-m.x, -m.y);
      SP.setShadow(ctx, ZOOM.v * s * MAP_SCR.s, up * 0.5, 1.2);
      ctx.fillStyle = '#fbf8f0'; ctx.fill(m.path);      // borda de adesivo
      SP.clearShadow(ctx);
      ctx.fillStyle = pat(ctx, colorOf(m, 'urb')); ctx.save(); ctx.translate(0, 0); ctx.scale(1, 1); ctx.fill(m.path); ctx.restore();
      ctx.strokeStyle = PAL.lima; ctx.lineWidth = 3.2; ctx.stroke(m.path);
      ctx.restore();
    };
  }
  function drawCard(rc) {
    const { ctx, t, tq } = rc;
    if (CAMP < 0) return;
    const t0 = at('L06', 'ver') - 0.2;
    const p = pop(tq, t0, 0.42, 1.8);
    const out = tw(t, Lin('L07').inicio + 0.2, Lin('L07').inicio + 0.6, E.inBack);
    if (p <= 0 || out >= 1) return;
    const m = MAP.municipios[CAMP];
    const [cx, cy] = toWorld(MAP_SCR, m.x, m.y);
    const W0 = 470, H0 = 330;
    const x = cx - W0 / 2 - 120, y = cy - H0 - 60;
    ctx.save();
    ctx.translate(lerp(cx, x + W0 / 2, p), lerp(cy, y + H0 / 2, p) + out * 900);
    ctx.scale(p, p); ctx.rotate(-0.02 + (1 - p) * 0.3);
    const poly = S.rrect(-W0 / 2, -H0 / 2, W0, H0, 20, { seed: 111, jitter: 0.8 });
    // rabinho apontando para Campinas
    const tail = S.cut([[40, H0 / 2 - 6], [140, H0 / 2 - 6], [120 + 20, H0 / 2 + 70]], { seed: 112, jitter: 0.5 });
    SP.piece(ctx, tail, { color: '#fbf8f0', kind: 'smooth', seed: 112, shadow: { zoom: rc.zoom, lift: 0.4 }, edge: 0.15 });
    SP.piece(ctx, poly, { color: '#fbf8f0', kind: 'smooth', seed: 111, shadow: { zoom: rc.zoom, lift: 0.4 }, edge: 0.15 });
    SP.tape(ctx, -W0 / 2 + 50, -H0 / 2 + 6, 110, 38, -0.45, { seed: 7, zoom: rc.zoom });
    ctx.fillStyle = PAL.petrol; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.font = uiFont(700, 58); ctx.fillText(m.n, -W0 / 2 + 34, -H0 / 2 + 62);
    ctx.fillStyle = '#51666f'; ctx.font = uiFont(700, 30); ctx.fillText('Potencial de biogás', -W0 / 2 + 34, -H0 / 2 + 118);
    const rows = [['agrícola', PAL.verde], ['pecuária', PAL.ambar], ['urbano', PAL.petrol]];
    rows.forEach(([nm, col], k) => {
      const yy = -H0 / 2 + 170 + k * 50;
      const gp = E.outCubic(clamp((t - t0 - 0.25 - k * 0.12) / 0.5));
      ctx.fillStyle = INK; ctx.font = uiFont(700, 28); ctx.fillText(nm, -W0 / 2 + 34, yy);
      const bw = Math.max(10, m.f[k] * 250) * gp;
      SP.piece(ctx, S.rrect(-W0 / 2 + 180, yy - 14, 250, 28, 8, { seed: 120 + k }), { color: '#ebe6da', kind: 'smooth', seed: 120 + k, edge: 0.15, shade: 0 });
      if (bw > 2) SP.piece(ctx, S.rrect(-W0 / 2 + 180, yy - 14, bw, 28, 8, { seed: 130 + k }), { color: col, seed: 130 + k, edge: 0.15, shade: 0.4 });
    });
    ctx.restore();
    // brilhos "na hora"
    const th = at('L06', 'hora');
    for (let k = 0; k < 5; k++) {
      const s = pop(tq, th - 0.05 + k * 0.05, 0.25) * (1 - clamp((t - th - 0.8) / 0.3));
      if (s > 0) I.sparkle(ctx, x + [-30, W0 + 20, W0 - 40, 20, W0 / 2][k], y + [20, 40, H0 + 10, H0 - 20, -40][k], 26 * s, { w: 6, color: [PAL.amarelo, PAL.lima, PAL.coral][k % 3], seed: k, boil: rc.boil });
    }
  }
  function cuesClique() {
    sfx(Lin('L06').inicio + 0.1, 'whoosh_curto', { g: 0.25, pan: 0.6 });
    sfx(CLICK1, 'clique', { g: 0.9, pan: -0.5 });
    sfx(CLICK1 + 0.1, 'papelada', { g: 0.45, dur: 1.0, p: 1.25 });
    sfx(CLICK2, 'clique', { g: 0.9, pan: 0.2 });
    sfx(CLICK2 + 0.05, 'pop', { g: 0.5, pan: 0.2, p: 1.1 });
    sfx(at('L06', 'ver') - 0.2, 'papel_desliza', { g: 0.5, pan: 0.1, p: 1.2 });
    sfx(at('L06', 'hora') - 0.05, 'plim', { g: 0.75, pan: 0.1 });
    sfx(at('L06', 'hora'), 'brilho', { g: 0.5, pan: 0.1 });
  }

  // ---------- L07: livros e artigos, etiquetas DOI, lupa ----------
  let BOOK_POLYS = null;
  function buildBooks() {
    const cols = [PAL.petrol, PAL.verde, PAL.ambar, '#e8dcc2'];
    BOOK_POLYS = cols.map((c, k) => ({ col: c, poly: S.rrect(-230 + (k % 2) * 16 - k * 6, -k * 74, 460 - k * 22, 70, 10, { seed: 140 + k, jitter: 0.8 }), rot: (hrand(k, 4) - 0.5) * 0.08 }));
  }
  function drawBooks(rc) {
    const { ctx, t, tq } = rc;
    if (!rc.visible(BOOKS.x, BOOKS.y, 700)) return;
    const tIn = Lin('L07').inicio - 0.1;
    ctx.save(); ctx.translate(BOOKS.x, BOOKS.y);
    if (HAS('livros')) {
      const d = drop(tq, tIn, 520, 0.45);
      if (d.on) X.img(ctx, 'livros', 0, d.dy, Z({ s: CUT.livros.s, ay: 0.85, lift: d.lift }));
      const pg = pop(tq, tIn + 0.5, 0.35);
      if (pg > 0 && HAS('pergaminho')) X.img(ctx, 'pergaminho', 250, 40, Z({ s: CUT.pergaminho.s * pg, rot: -0.12, ay: 0.8 }));
    } else BOOK_POLYS.forEach((b, k) => {
      const d = drop(tq, tIn + k * 0.1, 400, 0.4);
      if (!d.on && t < Lin('L08').inicio) return;
      ctx.save(); ctx.translate(0, d.dy); ctx.rotate(b.rot);
      SP.piece(ctx, b.poly, { color: b.col, seed: 150 + k, shadow: { zoom: rc.zoom, lift: d.lift }, edge: 0.2 });
      ctx.fillStyle = 'rgba(251,248,240,0.9)'; const bb = S.bbox(b.poly);
      ctx.fillRect(bb.x1 - 34, bb.y0 + 8, 12, bb.h - 16);
      ctx.restore();
    });
    // artigos soltos
    const arts = [[-330, -250, -0.18], [300, -210, 0.14]];
    arts.forEach(([ax, ay, ar], k) => {
      const p = pop(tq, tIn + 0.35 + k * 0.12, 0.35);
      if (p <= 0) return;
      ctx.save(); ctx.translate(ax, ay); ctx.rotate(ar); ctx.scale(p, p);
      if (HAS('artigo')) X.img(ctx, 'artigo', 0, 0, Z({ s: CUT.artigo.s * (k ? 0.92 : 1), flip: k === 1 }));
      else {
        SP.piece(ctx, S.rrect(-120, -160, 240, 320, 6, { seed: 160 + k }), { color: '#fbf8f0', kind: 'smooth', seed: 160 + k, shadow: { zoom: rc.zoom }, edge: 0.18 });
        ctx.fillStyle = [PAL.verde, PAL.petrol][k]; ctx.fillRect(-96, -134, 150, 18);
        for (let l = 0; l < 9; l++) I.stroke(ctx, [[-96, -92 + l * 26], [96 - (l % 3) * 22, -92 + l * 26]], { w: 3.5, color: 'rgba(80,90,95,0.45)', seed: l + k * 10, boil: 0, taper: [0.1, 0.1] });
      }
      ctx.restore();
    });
    // etiquetas "DOI" presas com fita
    const tags = [[-150, -150, -0.08], [150, -82, 0.07], [-20, 40, -0.03]];
    tags.forEach(([tx, ty, tr], k) => {
      const tt = at('L07', 'fontes') - 0.2 + k * 0.16;
      const s = pop(tq, tt, 0.3);
      if (s > 0) X.tag(ctx, 'DOI', tx, ty, { size: 54, s, rot: tr, seed: 170 + k, paper: [PAL.amarelo, PAL.lima, '#fbf8f0'][k], font: 'Luckiest Guy', weight: 400, boil: rc.boil, zoom: rc.zoom });
    });
    // lupa percorre as etiquetas
    const l0 = at('L07', 'métodos') - 0.35, l1 = endOf('L07', 'vista') + 0.35;
    const lp = tw(t, l0, l1, E.inOutSine), lIn = pop(tq, l0 - 0.15, 0.35) * (1 - tw(t, Lin('L08').inicio, Lin('L08').inicio + 0.4));
    if (lIn > 0) {
      const lx = lerp(-230, 220, lp), ly = -120 + Math.sin(lp * TAU) * 60;
      lupa(ctx, lx, ly, 120, (g) => {
        g.fillStyle = P.pattern(g, '#fbf8f0', 'smooth', { seed: 3 }); g.fillRect(-130, -130, 260, 260);
        g.fillStyle = PAL.petrol; g.font = '400 70px "Luckiest Guy"'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText('DOI', 0, -26);
        for (let l = 0; l < 3; l++) I.stroke(g, [[-80, 26 + l * 26], [80 - l * 30, 26 + l * 26]], { w: 5, color: 'rgba(60,70,75,0.5)', seed: l, boil: rc.boil });
      }, { s: lIn, zoom: rc.zoom, handle: 0.9 });
    }
    ctx.restore();
  }
  function cuesCiencia() {
    const tIn = Lin('L07').inicio - 0.1;
    for (let k = 0; k < 4; k++) sfx(tIn + k * 0.1 + 0.25, 'papel_pousa', { g: 0.6, pan: -0.6, p: 0.8 + k * 0.08 });
    sfx(Lin('L07').inicio - 0.25, 'whoosh', { g: 0.5, dur: 0.9 });
    sfx(at('L07', 'científica') - 0.1, 'rabisco', { g: 0.3, dur: 0.45 });
    for (let k = 0; k < 3; k++) sfx(at('L07', 'fontes') - 0.2 + k * 0.16 + 0.05, 'pop', { g: 0.45, pan: -0.5, p: 1 + k * 0.1 });
    sfx(at('L07', 'métodos') - 0.5, 'lupa', { g: 0.6, pan: -0.5 });
  }

  // ---------- L08: pessoas e alfinetes ----------
  const PEOPLE = [
    { id: 'gestora', word: 'gestores', x: 1180, y: 330, s: 1, col: '#2f6478', skin: '#c68a62', hair: '#3b2418', prop: 'prancheta' },
    { id: 'empresario', word: 'empresas', x: 1490, y: 390, s: 0.96, col: '#44525a', skin: '#e9b995', hair: '#6b4a2e', prop: 'pasta' },
    { id: 'pesquisadora', word: 'pesquisadores', x: -1330, y: 240, s: 1, col: '#fbf8f0', skin: '#8d5a3b', hair: '#1b1410', prop: 'caderno' },
  ];
  function lookAt(p, t) {
    // os olhinhos acompanham os alfinetes caindo; depois olham a câmera
    const tI = at('L08', 'investir');
    const [mx, my] = toWorld(MAP_SCR, 0, 0);
    let dx = mx - p.x, dy = my - p.y;
    const L = Math.hypot(dx, dy) || 1;
    const k = t > tI - 0.3 && t < tI + 1.2 ? 0.9 : 0.35;
    return [dx / L * k, dy / L * k + 0.1];
  }
  function drawPeople(rc) {
    const { ctx, t, tq } = rc;
    PEOPLE.forEach((p, k) => {
      const t0 = at('L08', p.word) - 0.15;
      const u = pop(tq, t0, 0.45, 1.9);
      if (u <= 0) return;
      const wave = t > at('L09', 'explore') - 0.2 ? Math.sin((t - at('L09', 'explore')) * 9) * 0.06 * (1 - clamp((t - at('L09', 'explore') - 1.5) / 0.6)) : 0;
      ctx.save(); ctx.translate(p.x, p.y + (1 - u) * 600); ctx.rotate(sway(tq, k, 0.02, 0.6) + wave);
      const [lx, ly] = lookAt(p, t);
      if (HAS(p.id)) {
        X.img(ctx, p.id, 0, 0, Z({ s: (CUT[p.id] || { s: 1 }).s * p.s, ay: 1 }));   // estes recortes já têm olhos desenhados
      } else person(ctx, p, rc, lx, ly);
      ctx.restore();
    });
  }
  /** Personagem provisório em papel (até chegarem os recortes). Origem = base do busto. */
  function person(ctx, p, rc, lx, ly) {
    const s = p.s;
    ctx.save(); ctx.scale(s, s);
    SP.piece(ctx, S.cut([[-170, 0], [-150, -250], [-60, -300], [60, -300], [150, -250], [170, 0]], { seed: 181, jitter: 1, round: 22 }), { color: p.col, seed: 182, border: { w: 8 }, shadow: { zoom: rc.zoom * s } });
    if (p.id === 'pesquisadora') SP.piece(ctx, S.cut([[-40, -300], [0, -170], [40, -300]], { seed: 183 }), { color: '#8ec5d6', seed: 183, edge: 0.2 });
    if (p.id === 'empresario') SP.piece(ctx, S.cut([[-14, -290], [14, -290], [22, -150], [0, -120], [-22, -150]], { seed: 184 }), { color: PAL.coral, seed: 184, edge: 0.2 });
    SP.piece(ctx, S.rrect(-34, -340, 68, 60, 14, { seed: 185 }), { color: p.skin, seed: 185, edge: 0.2 });
    SP.piece(ctx, S.blob(0, -440, 105, 118, { seed: 186 + p.x, wobble: 0.04 }), { color: p.skin, seed: 186, border: { w: 8 }, shadow: { zoom: rc.zoom * s } });
    SP.piece(ctx, S.blob(0, -520, 118, 62, { seed: 187 + p.x, wobble: 0.08 }), { color: p.hair, seed: 187, edge: 0.2 });
    if (p.id !== 'empresario') SP.piece(ctx, S.blob(-100, -440, 36, 90, { seed: 188 }), { color: p.hair, seed: 188, edge: 0.2 });
    I.stroke(ctx, [[-34, -388], [0, -370], [34, -388]], { w: 6, seed: 189, boil: rc.boil, color: '#5a2a1a' });
    SP.googly(ctx, -40, -452, 25, lx, ly, { zoom: rc.zoom });
    SP.googly(ctx, 40, -456, 26, lx, ly, { zoom: rc.zoom });
    const prop = { prancheta: [PAL.marrom, 90, 140], pasta: [PAL.coral, 150, 105], caderno: [PAL.lima, 110, 140] }[p.prop];
    ctx.save(); ctx.translate(95, -130); ctx.rotate(0.12);
    SP.piece(ctx, S.rrect(-prop[1] / 2, -prop[2] / 2, prop[1], prop[2], 8, { seed: 190 }), { color: prop[0], seed: 190, border: { w: 6 }, shadow: { zoom: rc.zoom * s } });
    ctx.restore();
    ctx.restore();
  }
  const PIN_IMG = { [PAL.coral]: 'pino_coral', [PAL.ambar]: 'pino_ambar', [PAL.lima]: 'pino_lima', [PAL.petrol]: 'pino_petrol' };
  function drawPin(ctx, x, y, col, s, rc, seed, lift = 0.3) {
    const nm = PIN_IMG[col];
    if (HAS(nm)) { X.img(ctx, nm, x, y, Z({ s: CUT.pino.s * s, ax: CUT.pino.ax, ay: CUT.pino.ay, lift, rot: (hrand(seed, 2) - 0.5) * 0.2 })); return; }
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const body = S.cut([[0, 0], [-22, -40], [-26, -62], [-16, -80], [0, -88], [16, -80], [26, -62], [22, -40]], { seed, jitter: 0.5, round: 6 });
    SP.piece(ctx, body, { color: col, seed, border: { w: 4 }, shadow: { zoom: rc.zoom * s, lift: 0.3 }, edge: 0.2 });
    ctx.fillStyle = '#fbf8f0'; ctx.beginPath(); ctx.arc(0, -60, 9, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawPins(rc) {
    const { ctx, t, tq } = rc;
    const tI = at('L08', 'investir') - 0.2;
    PINS.forEach((p, k) => {
      const t0 = tI + k * 0.07;
      const d = drop(tq, t0, 360, 0.42);
      if (!d.on) return;
      const [x, y] = toWorld(MAP_SCR, p.x, p.y);
      drawPin(ctx, x, y + d.dy, p.col, 0.95, rc, 200 + k, 0.2 + d.lift);
    });
    const tR = at('L08', 'renovável');
    PINS.forEach((p, k) => {
      const s = pop(tq, tR + k * 0.04, 0.25) * (1 - clamp((t - tR - 0.9) / 0.3));
      if (s <= 0) return;
      const [x, y] = toWorld(MAP_SCR, p.x, p.y);
      I.sparkle(ctx, x + 26, y - 100, 18 * s, { w: 5, color: PAL.amarelo, seed: k, boil: rc.boil });
    });
  }
  function cuesPessoas() {
    sfx(Lin('L08').inicio - 0.2, 'whoosh', { g: 0.5, dur: 1.0, p: 0.85 });
    PEOPLE.forEach((p, k) => { sfx(at('L08', p.word) - 0.1, 'boing', { g: 0.45, pan: p.x > 0 ? 0.6 : -0.6, p: 0.95 + k * 0.1 }); sfx(at('L08', p.word) + 0.05, 'papel_desliza', { g: 0.35, pan: p.x > 0 ? 0.6 : -0.6, p: 1.2 }); });
    const tI = at('L08', 'investir') - 0.2;
    PINS.forEach((p, k) => sfx(tI + k * 0.07 + 0.18, 'alfinete', { g: 0.55, pan: clamp((p.x / 800) * 0.7, -0.7, 0.7), p: 0.9 + (k % 4) * 0.08 }));
    sfx(at('L08', 'renovável'), 'brilho', { g: 0.45 });
  }

  // ---------- L09: título final, endereço e cartão CP2B (tela) ----------
  let CAPS = null;
  function drawCaptions(rc) {
    if (!CAPS) return;
    const { ctx, t, W: Wd, H } = rc;
    if (t > TL.musica.logo - 0.05) return;
    const c = CAPS.find((c) => t >= c.a && t <= c.b);
    if (!c) return;
    const k = Math.min(1, (t - c.a) / 0.12, (c.b - t) / 0.12);
    ctx.save();
    ctx.globalAlpha = Math.max(0, k);
    const cap = LAY.ov.cap;
    ctx.font = `500 ${cap.size}px "Neulis Sans", "Kalam", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = c.txt.split('\n');
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 56, lh = cap.size * 1.27, h = lines.length * lh + 26;
    const y = H + cap.y - h / 2;
    ctx.fillStyle = 'rgba(20,32,39,0.84)';
    ctx.beginPath(); ctx.roundRect(Wd / 2 - w / 2, y - h / 2, w, h, 14); ctx.fill();
    ctx.fillStyle = '#fbf8f0';
    lines.forEach((l, i) => ctx.fillText(l, Wd / 2, y + (i - (lines.length - 1) / 2) * lh + 2));
    ctx.restore();
  }
  let URLSTRIP;
  function overlay(rc) {
    const { ctx, t, tq, W: Wd, H } = rc;
    const tLogo = TL.musica.logo;
    if (t > Lin('L09').inicio - 0.3) {
      const tP = at('L09', 'Pilar'), tO = at('L09', 'o'), tA = at('L09', 'Acesse');
      const OV = LAY.ov, fs = FMT === 'v' ? 0.82 : 1;
      FTITLE.forEach((l, i) => { const p = pop(tq, tP - 0.1 + i * 0.055, 0.3, 2.6); if (p > 0) SP.place(ctx, l.spr, Wd / 2 + l.x * fs, OV.titleY + l.y * fs, { rot: l.rot, s: p * fs, lift: (1 - p) * 0.9 }); });
      const wp = clamp((t - tO + 0.05) / (endOf('L09', 'Paulo') - tO + 0.1));
      if (wp > 0) T.hand(ctx, 'o mapa do biogás de São Paulo', Wd / 2, OV.subY, { size: OV.subS, font: 'Caveat', weight: 700, color: PAL.verdeEsc, progress: wp, boil: rc.boil, seed: 31, stroke: '#fbf8f0', strokeW: 12 });
      const u = pop(tq, tA - 0.15, 0.4);
      if (u > 0) {
        const ux = Wd * OV.urlX, uy = OV.urlY;
        ctx.save(); ctx.translate(ux, uy); ctx.rotate(-0.025); ctx.scale(u, u);
        SP.piece(ctx, URLSTRIP, { color: PAL.lima, seed: 41, shadow: { zoom: 1, lift: (1 - u) * 0.6 }, edge: 0.15 });
        ctx.fillStyle = PAL.petrol; ctx.font = uiFont(700, 40); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('cp2b.unicamp.br/pilar2b', 0, 3);
        ctx.restore();
        if (u >= 1) { SP.tape(ctx, ux - 255, uy - 26, 96, 36, -0.6, { seed: 12 }); SP.tape(ctx, ux + 255, uy + 24, 96, 36, -0.6, { seed: 13 }); }
        // brilhos em "explore!"
        const ap = at('L09', 'explore') - 0.05;
        for (let k = 0; k < 4; k++) { const s = pop(tq, ap + k * 0.06, 0.25) * (1 - clamp((t - ap - 1.2) / 0.3)); if (s > 0) I.sparkle(ctx, ux + [-330, 330, -300, 310][k], uy + [-40, -30, 36, 40][k], 22 * s, { w: 5, color: [PAL.amarelo, PAL.coral][k % 2], seed: k, boil: rc.boil }); }
      }
    }
    drawCaptions(rc);
    // cartão do logo na batida final
    const dim = clamp((t - tLogo + 0.1) / 0.5);
    if (dim > 0) {
      ctx.save(); ctx.globalAlpha = 0.55 * dim; ctx.fillStyle = '#1b2a33'; ctx.fillRect(0, 0, Wd, H); ctx.restore();
      const p = pop(tq, tLogo - 0.04, 0.45, 1.5);
      const [cw, ch, lwMax] = LAY.ov.card;
      ctx.save(); ctx.translate(Wd / 2, H / 2 + (1 - p) * 700);
      SP.setShadow(ctx, 1, 0.6, 1.2);
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(-cw / 2, -ch / 2, cw, ch, 22); ctx.fill();
      SP.clearShadow(ctx);
      const logo = X.images.get('logo');
      if (logo) { const lw = lwMax, lh = lw * logo.height / logo.width; ctx.drawImage(logo, -lw / 2, -ch / 2 + 50, lw, lh); }
      ctx.fillStyle = PAL.petrol; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `700 46px "Neulis Sans", "Kalam", sans-serif`;
      ctx.fillText('Energia viva, ciência que transforma.', 0, ch / 2 - 88);
      ctx.fillStyle = PAL.verde; ctx.fillRect(-120, ch / 2 - 44, 240, 6);
      ctx.restore();
      if (p > 0.9) { SP.tape(ctx, Wd / 2 - cw / 2 + 40, H / 2 - ch / 2 + 10, 150, 46, -0.6, { seed: 3 }); SP.tape(ctx, Wd / 2 + cw / 2 - 40, H / 2 + ch / 2 - 10, 150, 46, -0.6, { seed: 5 }); }
    }
  }
  function cuesFinal() {
    sfx(Lin('L09').inicio - 0.3, 'whoosh', { g: 0.5, dur: 1.4, p: 0.75 });
    sfx(WAVES[3].t0, 'papelada', { g: 0.35, dur: WAVES[3].t1 - WAVES[3].t0, p: 1.2 });
    const tP = at('L09', 'Pilar');
    for (let i = 0; i < 8; i++) sfx(tP - 0.1 + i * 0.055 + 0.08, 'letra', { g: 0.5, pan: -0.3 + i * 0.08, p: 0.9 + i * 0.05 });
    sfx(at('L09', 'o') - 0.05, 'rabisco', { g: 0.3, dur: endOf('L09', 'Paulo') - at('L09', 'o') + 0.1 });
    sfx(at('L09', 'Acesse') - 0.15, 'pop', { g: 0.55, pan: 0.6, p: 0.95 });
    sfx(at('L09', 'explore') - 0.1, 'rabisco', { g: 0.25, pan: 0.4, dur: 0.45 });
    sfx(TL.musica.logo - 0.04, 'logo', { g: 0.8 });
  }

  // ---------- montagem ----------
  const scene = {
    duration: 56,
    boilFps: 8,
    async init(base = '', tlName = 'timeline.json', captions = null, opts = {}) {
      FMT = opts.formato === 'vertical' || opts.formato === 'v' ? 'v' : 'h';
      LAY = LAYOUTS[FMT];
      Object.assign(BOOKS, LAY.books);
      PEOPLE.forEach((p, k) => { p.x = LAY.people[k][0]; p.y = LAY.people[k][1]; });
      QMARKS = LAY.qmarks;
      TL = await (await fetch(base + tlName, { cache: 'no-store' })).json();
      if (captions) {
        const vtt = await (await fetch(base + captions, { cache: 'no-store' })).text();
        const sec = (s) => { const [h, m, x] = s.split(':'); return +h * 3600 + +m * 60 + +x; };
        CAPS = vtt.split(/\r?\n\r?\n/).map((b) => b.split(/\r?\n/)).filter((ls) => ls.some((l) => l.includes('-->'))).map((ls) => {
          const i = ls.findIndex((l) => l.includes('-->'));
          const [a, b] = ls[i].split('-->').map((s) => sec(s.trim().split(' ')[0]));
          return { a, b, txt: ls.slice(i + 1).join('\n') };
        });
      }
      indexWords();
      scene.duration = TL.duracao;
      const R = G.COLAGEM_ROOT || '../..';
      const [mapa] = await Promise.all([fetch(base + 'dados/sp_mapa.json').then((r) => r.json()), loadAssets(R)]);
      buildMap(mapa);
      // tempos-chave
      T_LIFT = Lin('L03').inicio - 0.1;
      T_NB = Lin('L03').inicio;
      T_LID = T_NB + 0.5;
      T_FLY = Math.max(at('L03', 'cê') - 0.4, T_LID + 0.4);
      CLICK1 = at('L06', 'resíduo') + 0.05;
      CLICK2 = at('L06', 'cidade') + 0.05;
      buildWaves(); buildTable(); buildTitle(); buildNotebook(); buildUI(); buildFolders(); buildBooks(); buildCamera();
      URLSTRIP = S.tear(S.cut([[-290, -40], [290, -36], [286, 40], [-294, 38]], { seed: 42, jitter: 1.5, ds: 30 }), { amp: 3, seed: 43 });
      SFX.length = 0;
      cuesTitulo(); cuesResiduos(); cuesNotebook(); cuesFolders(); cuesPreenche(); cuesClique(); cuesCiencia(); cuesPessoas(); cuesFinal();
      SFX.sort((a, b) => a.t - b.t);
    },
    camera,
    camSpeed,
    draw(rc) {
      ZOOM.v = rc.zoom;
      const { ctx, t } = rc;
      drawTable(rc);
      drawBooks(rc);
      const nb = nbState(t);
      const pose = mapPose(t);
      const landed = t >= T_FLY + D_FLY;
      if (nb.on) {
        drawNotebookBase(rc, nb);
        ctx.save(); lidTransform(ctx, nb);
        drawLidBack(rc);
        drawUI(rc);
        if (landed) {
          drawMap(rc, MAP_SCR, { outline: 1, outlineW: 3.4, highlight: camHighlight(t) });
          drawLegend(rc, t >= WAVES[2].t0 + 0.3 && t < WAVES[3].t0 + 0.3 ? 'urb' : 'tot');
        }
        drawLidFront(rc);
        ctx.restore();
      }
      if (!landed) {
        const op = clamp((t - 0.25) / Math.max(0.8, Lin('L01').fim - 0.4));
        drawMap(rc, pose, { outline: op, outlineW: 5.5 });
      }
      drawResiduos(rc, pose);
      if (!landed && t < Lin('L03').inicio) drawBusca(rc, pose);
      drawTitle(rc);
      if (nb.on) {
        drawFolders(rc);
        drawPins(rc);
        drawCard(rc);
        drawHero(rc);
      }
      drawPeople(rc);
      drawCursor(rc);
    },
    overlay,
    sfx: () => SFX,
    timeline: () => TL,
  };
  G.CENA = scene;
})(window);
