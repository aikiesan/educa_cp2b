/* "O que é biogás? E biometano?" — cena completa (CP2B · educa).
 * Um mundo de colagem em anel: 7 estações ao redor de um laboratório; a câmera percorre o ciclo
 * e, em "fechando o ciclo!", se afasta para revelar o círculo inteiro.
 * Tudo é função do tempo t (determinístico). Os tempos vêm de timeline.json (alinhamento da narração). */
(function (G) {
  'use strict';
  const C = G.Colagem;
  const { core, shapes: S, sprite: SP, ink: I, text: T, paper: P, extras: X } = C;
  const { tw, E, clamp, lerp, settle, pulse, hrand, R: RNG, snoise1, TAU, mixHex, shade, smooth, keys } = core;
  const INK = SP.INK;

  const PAL = {
    petrol: '#1e3e4c', verdeEsc: '#00573a', verde: '#5ca032', lima: '#b6e03b', ambar: '#d37402',
    creme: '#f3ead8', papel: '#fbf8f0', amarelo: '#f2c14e', ceu: '#9fd0df', coral: '#e4572e',
    marrom: '#8b5a3c', kraft: '#d6bf98', grama: '#79b544', terra: '#9a6a44',
  };

  // ---------- anel de estações ----------
  const RING = 2200, NST = 7;
  const angOf = (i) => -Math.PI / 2 + (i * TAU) / NST;
  const posOf = (i) => [RING * Math.cos(angOf(i)), RING * Math.sin(angOf(i))];
  const ST = ['sobras', 'digestor', 'composicao', 'queima', 'purificacao', 'usos', 'lavoura'].map((n, i) => ({ n, i, a: angOf(i), p: posOf(i) }));

  // ---------- linha do tempo ----------
  let TL = null, WORDS = {};
  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function indexWords() {
    WORDS = {};
    for (const f of TL.falas) WORDS[f.id] = { ...f, idx: f.palavras.map((w) => ({ ...w, k: norm(w.p) })) };
  }
  /** Palavra n-ésima (0 = primeira) de uma fala → {i, f}. */
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
  let BAR = 2.2857, DB0 = 1.08, BEAT = 0.5714;
  const beatPhase = (t) => ((t - DB0) / BEAT) % 1;

  // ---------- efeitos sonoros (lista gerada junto com a animação) ----------
  const SFX = [];
  function sfx(t, nome, o = {}) { SFX.push({ t: +t.toFixed(3), nome, ganho: o.g ?? 1, pan: o.pan ?? 0, dur: o.dur, p: o.p }); }

  // ---------- auxiliares de animação (usar tq = tempo "em dois") ----------
  const pop = (t, t0, d = 0.34, s = 2.1) => (t < t0 ? 0 : t >= t0 + d ? 1 : E.outBack((t - t0) / d, s));
  const lin = (t, t0, d) => clamp((t - t0) / d);
  function drop(t, t0, h = 520, d = 0.46) {
    const p = clamp((t - t0) / d);
    return { dy: -(1 - E.outBounce(p)) * h, lift: (1 - p) * 0.9, on: t >= t0, p };
  }
  const sway = (t, seed, amp = 0.03, f = 0.9) => Math.sin(t * f * TAU + seed * 1.7) * amp;
  const jit = (seed, pose, a = 0.7) => [snoise1(pose * 1.3, seed) * a, snoise1(pose * 1.7, seed + 9) * a];
  function place(ctx, name, x, y, o) { return X.img(ctx, name, x, y, o); }
  const ZOOM = { v: 1 };
  // formato: 'h' = 16:9 (original) · 'v' = 9:16 (Stories/Reels). No vertical a câmera usa o mesmo percurso,
  // com zoom menor e um deslocamento horizontal que acompanha a ação dentro de cada estação (VCAM).
  let FMT = 'h', MARCA = true, VCAM = null;
  const Z = (o = {}) => ({ zoom: ZOOM.v, ...o });

  // ---------- câmera ----------
  let CAM = [];
  function buildCamera() {
    const center = { x: 0, y: -40, z: 1 };
    const s = (i, z = 1, dx = 0, dy = 0) => ({ x: ST[i].p[0] + dx, y: ST[i].p[1] + dy, z, a: ST[i].a });
    const mv = (t0, t1, from, to, arc = true) => ({ t0, t1, from, to, arc });
    const L = Lin;
    const k = [];
    k.push(mv(0, 3.30, { ...center, z: 0.985 }, { ...center, z: 1.03 }, false));
    k.push(mv(3.30, 4.20, { ...center, z: 1.03 }, s(0, 1), false));
    k.push(mv(4.20, L('L02').fim - 0.15, s(0, 1), s(0, 1.035)));
    const m1 = L('L02').fim - 0.2;
    k.push(mv(m1, m1 + 0.95, s(0, 1.035), s(1, 1)));
    k.push(mv(m1 + 0.95, at('L03', 'micróbios') - 0.1, s(1, 1), s(1, 1.02, 60, 0)));
    k.push(mv(at('L03', 'micróbios') - 0.1, at('L03', 'micróbios') + 0.6, s(1, 1.02, 60, 0), s(1, 1.06, 140, -10)));
    k.push(mv(at('L03', 'micróbios') + 0.6, L('L04').fim - 0.2, s(1, 1.06, 140, -10), s(1, 1.08, 150, -20)));
    const m2 = L('L04').fim - 0.2;
    k.push(mv(m2, m2 + 0.95, s(1, 1.08, 150, -20), s(2, 1)));
    k.push(mv(m2 + 0.95, L('L06').fim - 0.1, s(2, 1), s(2, 1.04)));
    const m3 = L('L06').fim - 0.1;
    k.push(mv(m3, m3 + 0.9, s(2, 1.04), s(3, 1)));
    k.push(mv(m3 + 0.9, L('L07').fim - 0.15, s(3, 1), s(3, 1.04)));
    const m4 = L('L07').fim - 0.15;
    k.push(mv(m4, m4 + 0.9, s(3, 1.04), s(4, 1)));
    k.push(mv(m4 + 0.9, L('L08').fim - 0.15, s(4, 1), s(4, 1.035)));
    const m5 = L('L08').fim - 0.15;
    k.push(mv(m5, m5 + 0.95, s(4, 1.035), s(5, 1, -330, 0)));
    k.push(mv(m5 + 0.95, at('L09', 'gasoduto') - 0.3, s(5, 1, -330, 0), s(5, 1.01, -300, 0)));
    k.push(mv(at('L09', 'gasoduto') - 0.3, at('L09', 'caminhões') - 0.15, s(5, 1.01, -300, 0), s(5, 1.0, 400, 0), false));
    k.push(mv(at('L09', 'caminhões') - 0.15, L('L09').fim, s(5, 1.0, 400, 0), s(5, 1.02, 420, 0), false));
    const m6 = L('L09').fim - 0.1;
    k.push(mv(m6, m6 + 0.9, s(5, 1.02, 420, 0), s(6, 1, -80, 0)));
    k.push(mv(m6 + 0.9, at('L10', 'fechando') - 0.05, s(6, 1, -80, 0), s(6, 1.03, 80, 0), false));
    const m7 = at('L10', 'fechando') - 0.05;
    k.push(mv(m7, m7 + 2.3, s(6, 1.03, 80, 0), { x: 0, y: 0, z: 0.205 }, false));
    k.push(mv(m7 + 2.3, TL.duracao + 1, { x: 0, y: 0, z: 0.205 }, { x: 0, y: 0, z: 0.222 }, false));
    CAM = k;
    FINALE = m7;
    if (FMT === 'v') buildVCam(m1, m2, m3, m4, m5, m6, m7);
  }
  /** Trilha do vertical: [t, dx (mundo), multiplicador de zoom]. dx soma-se à câmera 16:9 (que já tem seus próprios
   *  deslocamentos em algumas estações); cada mudança leva ~0,6 s e acontece pouco antes da palavra. */
  function buildVCam(m1, m2, m3, m4, m5, m6, m7) {
    const kf = [{ t: 0, v: [0, 0.61] }];
    let cur = [0, 0.61];
    const go = (t, dx, m = 0.85, d = 0.6) => { t = Math.max(t, kf[kf.length - 1].t); kf.push({ t, v: cur }); cur = [dx, m]; kf.push({ t: t + d, v: cur, e: E.inOutCubic }); };
    go(3.3, -330, 0.85, 0.9);                                 // título → sobras (vaca, "o que ninguém quer")
    go(at('L02', 'restos') - 0.3, -40);                      // pilha de restos + esterco
    go(at('L02', 'resíduos') - 0.3, 470);                    // resíduos da lavoura
    go(m1, -270, 0.85, 0.95);                                 // → biodigestor
    go(at('L03', 'micróbios') - 0.1, 90, 0.85, 0.7);          // lupa da festa dos micróbios
    go(at('L04', 'gás') - 0.35, -210);                       // bolhas + BIOGÁS!
    go(m2, -420, 0.85, 0.95);                                 // → balão de biogás
    go(at('L05', 'metano') - 0.35, 380);                     // pizza + rótulos
    go(at('L06', 'alguns') - 0.25, 60);                      // H₂S fedido
    go(m3, -300, 0.85, 0.9);                                  // → fogão (calor)
    go(at('L07', 'eletricidade') - 0.4, 360);                // gerador + lâmpada
    go(m4, -130, 0.85, 0.9);                                  // → máquina de purificação
    go(at('L08', 'nasce') - 0.35, 380);                      // BIOMETANO + estrela
    go(m5, -70, 0.85, 0.95);                                  // → biometano = gás natural (a câmera 16:9 já está em −330)
    go(at('L09', 'gasoduto') - 0.3, 50);
    go(at('L09', 'indústrias') - 0.3, 110);
    go(at('L09', 'caminhões') - 0.3, 300);
    go(at('L09', 'ônibus') - 0.3, 380);
    go(m6, -270, 0.85, 0.9);                                  // → lavoura (trator, biofertilizante)
    go(at('L10', 'lavoura') - 0.3, 50);
    go(m7, 0, 0.8, 2.3);                                     // câmera se afasta: o anel inteiro
    VCAM = kf;
  }
  let FINALE = 46.5;
  function camera(t) {
    let seg = CAM[CAM.length - 1];
    for (const c of CAM) { if (t < c.t1) { seg = c; break; } }
    const moving = seg.t1 - seg.t0 < 2.5;
    const p = clamp((t - seg.t0) / (seg.t1 - seg.t0));
    const e = moving ? E.inOutCubic(p) : E.inOutSine(p);
    let x, y;
    if (seg.arc && seg.from.a != null && seg.to.a != null && seg.from.a !== seg.to.a) {
      let a0 = seg.from.a, a1 = seg.to.a;
      if (a1 < a0) a1 += TAU;
      const a = lerp(a0, a1, e);
      const off = [lerp(seg.from.x - RING * Math.cos(a0), seg.to.x - RING * Math.cos(a1), e), lerp(seg.from.y - RING * Math.sin(a0), seg.to.y - RING * Math.sin(a1), e)];
      x = RING * Math.cos(a) + off[0]; y = RING * Math.sin(a) + off[1];
    } else { x = lerp(seg.from.x, seg.to.x, e); y = lerp(seg.from.y, seg.to.y, e); }
    let z = lerp(seg.from.z, seg.to.z, e);
    if (moving && seg.t1 - seg.t0 < 1.2) z *= 1 - 0.16 * Math.sin(Math.PI * p);
    // leve respiração de câmera na mão
    x += snoise1(t * 0.35, 11) * 4; y += snoise1(t * 0.31, 17) * 3;
    if (VCAM) { const [dx, m] = keys(t, VCAM); x += dx; z *= m; }
    let rot = 0;
    if (t > FINALE) rot = -0.075 * E.inOutSine(clamp((t - FINALE - 0.8) / 9));
    return { x, y, zoom: z, rot };
  }
  function camSpeed(t) {
    const a = camera(t), b = camera(t + 1 / 48);
    return Math.hypot(b.x - a.x, b.y - a.y) * 48 * a.zoom + Math.abs(b.zoom - a.zoom) * 48 * 900;
  }

  // ---------- geometria estática (fundos de papel rasgado) ----------
  const BG = [];
  let BG_ST = -1;
  function torn(key, pts, color, kind = 'paper', o = {}) { BG.push({ key, st: BG_ST, pts: S.tear(pts, { amp: o.amp ?? 5, seed: o.seed ?? key.length }), color, kind, o }); }
  function buildBackdrops() {
    const R0 = (sx, sy, w, h, rot = 0, seed = 1) => {
      if (FMT === 'v') { const ex = 440; if (sy - ST[Math.max(0, BG_ST)].p[1] < -60) { sy -= ex / 2; h += ex; } else if (sy - ST[Math.max(0, BG_ST)].p[1] > 60) { sy += ex / 2; h += ex; } else h += ex * 2; }
      return R0h(sx, sy, w, h, rot, seed);
    };
    const R0h = (sx, sy, w, h, rot = 0, seed = 1) => S.xform(S.cut([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], { seed, jitter: 3, ds: 40, bow: 0.01 }), { x: sx, y: sy, rot });
    const at_ = (i, dx, dy) => [ST[i].p[0] + dx, ST[i].p[1] + dy];
    // centro: grande círculo de papel creme (o "laboratório" no coração do ciclo)
    torn('centro', S.blob(0, 40, 1320, 1180, { seed: 3, wobble: 0.035, n: 120 }), PAL.creme, 'paper', { amp: 7 });
    // 1 sobras: céu + grama
    BG_ST = 0; { const [x, y] = at_(0, 0, 0); torn('s1ceu', R0(x, y - 150, 2050, 900, -0.01, 2), '#a9d6e3', 'watercolor'); torn('s1grama', R0(x, y + 380, 2150, 520, 0.012, 3), PAL.grama, 'paper', { amp: 7 }); }
    // 2 biodigestor: céu + morro
    BG_ST = 1; { const [x, y] = at_(1, 0, 0); torn('s2ceu', R0(x, y - 120, 2000, 980, 0.012, 4), '#bfe0e6', 'watercolor'); torn('s2morro', S.blob(x - 60, y + 520, 1150, 380, { seed: 9, wobble: 0.05, n: 90 }), '#6aa83d', 'paper', { amp: 7 }); }
    // 3 composição: folha de caderno quadriculado
    BG_ST = 2; { const [x, y] = at_(2, 0, 0); torn('s3folha', R0(x, y, 1950, 1120, -0.018, 5), '#f7f3e6', 'smooth', { amp: 6, grid: true }); }
    // 4 queima: papel âmbar quente
    BG_ST = 3; { const [x, y] = at_(3, 0, 0); torn('s4', R0(x, y, 2000, 1100, 0.015, 6), '#f4c46a', 'paper', { amp: 7 }); }
    // 5 purificação: azul-petróleo (a máquina laranja salta aos olhos)
    BG_ST = 4; { const [x, y] = at_(4, 0, 0); torn('s5', R0(x, y, 2000, 1120, -0.012, 7), PAL.petrol, 'paper', { amp: 7 }); }
    // 6 usos: céu + chão da cidade
    BG_ST = 5; { const [x, y] = at_(5, 0, 0); torn('s6ceu', R0(x + 60, y - 120, 2800, 960, 0.01, 8), '#b3dbe8', 'watercolor'); torn('s6chao', R0(x + 60, y + 410, 2900, 360, -0.006, 9), '#c9b99c', 'kraft', { amp: 6 }); }
    // 7 lavoura: céu + campo
    BG_ST = 6; { const [x, y] = at_(6, 0, 0); torn('s7ceu', R0(x, y - 150, 2050, 900, -0.012, 10), '#a9d6e3', 'watercolor'); torn('s7campo', R0(x, y + 330, 2150, 620, 0.01, 11), '#8cc152', 'paper', { amp: 7 }); }
  }

  // ---------- desenho: fundo, trilha, enfeites ----------
  function drawBackground(rc) {
    const { ctx } = rc;
    const v = rc.view;
    ctx.fillStyle = P.pattern(ctx, PAL.kraft, 'kraft', { seed: 7, scale: 1.6 });
    ctx.fillRect(v.x0 - 50, v.y0 - 50, v.x1 - v.x0 + 100, v.y1 - v.y0 + 100);
    // a estação mais próxima da câmera fica por cima (evita emendas de folhas vizinhas no quadro)
    const near = ST.reduce((m, s) => { const d = Math.hypot(s.p[0] - rc.cam.x, s.p[1] - rc.cam.y); return d < m.d ? { d, i: s.i } : m; }, { d: Math.hypot(rc.cam.x, rc.cam.y) * 1.15, i: -1 }).i;
    const order = BG.filter((b) => b.st !== near).concat(BG.filter((b) => b.st === near));
    for (const b of order) {
      const bb = b.bb || (b.bb = S.bbox(b.pts));
      if (bb.x1 < v.x0 || bb.x0 > v.x1 || bb.y1 < v.y0 || bb.y0 > v.y1) continue;
      SP.piece(ctx, b.pts, { color: b.color, kind: b.kind, seed: b.key.length * 7, torn: false, shadow: { zoom: rc.zoom, strength: 0.9 }, edge: 0.12, shade: 0.5 });
      if (b.o.grid) {
        ctx.save(); ctx.beginPath(); S.trace(ctx, b.pts, true); ctx.clip();
        ctx.strokeStyle = 'rgba(70,130,180,0.22)'; ctx.lineWidth = 1.6;
        for (let gx = bb.x0; gx < bb.x1; gx += 46) { ctx.beginPath(); ctx.moveTo(gx, bb.y0); ctx.lineTo(gx + 20, bb.y1); ctx.stroke(); }
        for (let gy = bb.y0; gy < bb.y1; gy += 46) { ctx.beginPath(); ctx.moveTo(bb.x0, gy); ctx.lineTo(bb.x1, gy - 30); ctx.stroke(); }
        ctx.restore();
      }
    }
  }
  function trailHead(t) {
    // ângulo percorrido (a partir da estação 1), segue a câmera; no final fecha o círculo
    const a0 = ST[0].a;
    if (t < 4.0) return a0;
    if (t > FINALE) return a0 + TAU * (6 / 7 + (1 / 7) * E.inOutCubic(clamp((t - FINALE - 0.2) / 2.2)));
    const c = camera(t);
    let a = Math.atan2(c.y, c.x);
    while (a < a0 - 0.1) a += TAU;
    return Math.max(a0, a);
  }
  const TRAIL_MAX = { v: -Math.PI / 2 };
  function drawTrail(rc) {
    const { ctx, t } = rc;
    const a0 = ST[0].a, head = trailHead(t);
    if (head <= a0 + 0.01) return;
    // a trilha só aparece nos vãos de kraft entre as estações (não risca o interior das cenas)
    const r = RING + 40;
    const segs = [];
    let cur = [];
    for (let a = a0; a <= head; a += 0.004) {
      const p = [Math.cos(a) * r + Math.sin(a * 7) * 18, Math.sin(a) * r - Math.cos(a * 7) * 18];
      const inside = ST.some((s) => Math.hypot(p[0] - s.p[0], p[1] - s.p[1]) < 930);
      if (inside) { if (cur.length > 4) segs.push(cur); cur = []; } else cur.push(p);
    }
    if (cur.length > 4) segs.push(cur);
    segs.forEach((pts, k) => I.dashed(ctx, pts, { w: 9, color: 'rgba(27,42,51,0.8)', dash: 34, gap: 22, seed: 5 + k, boil: rc.boil, jitter: 1.2 }));
    // setinhas entre estações
    for (let k = 0; k < NST; k++) {
      const am = a0 + (k + 0.5) * (TAU / NST);
      if (head < am + 0.02) continue;
      const x = Math.cos(am) * r, y = Math.sin(am) * r, dir = am + Math.PI / 2;
      for (const s of [-1, 1]) I.stroke(ctx, [[x, y], [x - Math.cos(dir + s * 0.55) * 46, y - Math.sin(dir + s * 0.55) * 46]], { w: 8, color: 'rgba(27,42,51,0.8)', seed: k * 3 + s, boil: rc.boil, taper: [0, 0.4] });
    }
  }
  // enfeites espalhados no kraft entre as estações (estrelinhas, pontinhos, folhinhas)
  const DECOR = [];
  function buildDecor() {
    const rr = RNG(77);
    for (let k = 0; k < 90; k++) {
      const a = rr.next() * TAU, r = rr.range(1350, 3400);
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      // evita o miolo das estações
      if (ST.some((s) => Math.hypot(x - s.p[0], y - s.p[1]) < 1050)) continue;
      if (Math.hypot(x, y) < 1400) continue;
      DECOR.push({ x, y, kind: rr.pick(['estrela', 'ponto', 'folha', 'espiral', 'confete']), s: rr.range(0.7, 1.4), rot: rr.sym(3), col: rr.pick([PAL.lima, PAL.ambar, PAL.coral, PAL.papel, PAL.ceu, PAL.verde]), seed: k });
    }
  }
  function drawDecor(rc) {
    const { ctx } = rc;
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

  // ---------- CENTRO: título + laboratório ----------
  function drawCenter(rc) {
    const { ctx, t, tq } = rc;
    if (!rc.visible(0, 0, 1500)) return;
    // laboratório (a ciência no meio do ciclo)
    const labIn = pop(tq, 0.08, 0.5, 1.4);
    if (labIn > 0) place(ctx, 'laboratorio', 0, 330 + (1 - labIn) * 120, Z({ s: 0.47 * (0.9 + 0.1 * labIn), lift: (1 - labIn) * 0.8 }));
    // bolhas saindo dos frascos
    for (let k = 0; k < 7; k++) {
      const ph = (tq * 0.55 + k * 0.143) % 1;
      if (tq < 0.8 + k * 0.1) continue;
      X.bubble(ctx, -330 + k * 70 + Math.sin(ph * 9 + k) * 12, 150 - ph * 330, 10 + (k % 3) * 6, { alpha: 1 - ph });
    }
    if (t > 7 && t < FINALE - 0.5) return; // título inicial some depois que a câmera sai
    if (t < 7) QMARKS.forEach(([x, y, sz, rot, col, t0], k) => { const pr = clamp((t - t0) / 0.35); if (pr > 0) T.hand(ctx, '?', x, y, { size: sz, font: 'Caveat Brush', color: col, rot: rot + Math.sin(tq * 3 + k) * 0.06, progress: 1, boil: rc.boil, seed: 70 + k, jitter: 1.4 }), pr < 1 && I.circle(ctx, x, y - sz * 0.3, sz * 0.5 * pr, sz * 0.5 * pr, { w: 3, color: col, progress: pr, seed: k, boil: rc.boil, alpha: 0.5 }); });
    if (t < 7) for (let k = 0; k < 6; k++) { const a = k * 1.05 + 0.4, r = 820 + (k % 2) * 90; const s = pop(tq, 0.25 + k * 0.1, 0.3); if (s > 0) I.sparkle(ctx, Math.cos(a) * r * 1.05, -60 + Math.sin(a) * r * 0.55, 24 * s * (0.7 + 0.3 * Math.abs(Math.sin(tq * 4 + k))), { w: 6, color: [PAL.amarelo, PAL.lima, PAL.coral][k % 3], seed: k, boil: rc.boil }); }
    const out = t > FINALE ? 0 : 1;
    if (!out) return;
    // painel azul-petróleo rasgado + faixa limão
    const pin = drop(tq, 0.0, 380, 0.42);
    ctx.save(); ctx.translate(0, pin.dy);
    SP.piece(ctx, PANEL, { color: PAL.petrol, seed: 12, shadow: { zoom: rc.zoom, lift: pin.lift }, edge: 0.1 });
    ctx.restore();
    const sIn = pop(tq, 0.2, 0.38);
    if (sIn > 0) { ctx.save(); ctx.translate(-30, 110); ctx.rotate(0.018); ctx.scale(sIn, 1); SP.piece(ctx, STRIP, { color: PAL.lima, seed: 13, shadow: { zoom: rc.zoom }, torn: 4 }); ctx.restore(); }
    // "O QUE É" (letras pequenas) e "BIOGÁS?" (grandes) entram com as sílabas
    const t1 = at('L01', 'O'), tb = at('L01', 'biogás'), te = at('L01', 'E'), tbm = at('L01', 'biometano');
    TITLE1.forEach((l, i) => { const p = pop(tq, t1 - 0.12 + i * 0.07, 0.3, 2.6); if (p > 0) SP.place(ctx, l.spr, -250 + l.x, -265 + l.y, { rot: l.rot, s: p, zoom: rc.zoom, lift: (1 - p) * 0.8 }); });
    TITLE2.forEach((l, i) => { const p = pop(tq, tb - 0.1 + i * 0.075, 0.32, 2.6); if (p > 0) SP.place(ctx, l.spr, 40 + l.x, -110 + l.y, { rot: l.rot + (1 - p) * 0.5, s: p, zoom: rc.zoom, lift: (1 - p) * 0.9 }); });
    // "E biometano?" escrito à mão
    const wp = clamp((t - te + 0.05) / (endOf('L01', 'biometano') - te + 0.1));
    if (wp > 0) {
      T.hand(ctx, 'E biometano?', -30, 112, { size: 112, font: 'Caveat Brush', color: PAL.petrol, progress: wp, boil: rc.boil, rot: -0.03, seed: 21 });
      if (wp >= 1) I.stroke(ctx, [[-300, 172], [-40, 180], [250, 166]], { w: 8, color: PAL.coral, progress: clamp((t - endOf('L01', 'biometano')) / 0.3), boil: rc.boil, seed: 4 });
    }
    // metaninho espiando pela borda do painel, acenando
    const peek = tw(tq, 0.9, 1.5, E.outBack);
    if (peek > 0) {
      const wav = Math.sin(tq * 7) * 0.22;
      X.molecule(ctx, 'CH4', 900 - peek * 150, -170, 2.1, { rot: -0.35 + wav, face: true, blink: (Math.floor(tq * 12) % 30) === 0, boil: rc.boil, zoom: rc.zoom });
    }
  }
  let PANEL, STRIP, TITLE1, TITLE2, FTITLE1, FTITLE2;
  const QMARKS = [[-900, -330, 150, -0.25, '#e4572e', 0.1], [880, 60, 130, 0.2, '#d37402', 0.22], [-860, 150, 110, 0.15, '#5ca032', 0.34], [950, -380, 100, -0.1, '#1e3e4c', 0.46], [-640, -470, 90, 0.3, '#00573a', 0.58]];
  function buildTitle() {
    PANEL = S.tear(S.cut([[-760, -380], [760, -392], [748, 190], [-770, 205]], { seed: 21, jitter: 3, ds: 30 }), { amp: 6, seed: 22 });
    STRIP = S.cut([[-470, -64], [470, -58], [462, 62], [-476, 58]], { seed: 31, jitter: 2, ds: 30 });
    TITLE1 = T.ransom('O QUE É', { size: 92, seed: 3, papers: ['#fbf8f0', '#f2c14e', '#b6e03b', '#f3ead8'] });
    TITLE2 = T.ransom('BIOGÁS?', { size: 188, seed: 8, tilt: 0.1 });
    FTITLE1 = T.ransom('BIOGÁS &', { size: 150, seed: 41, tilt: 0.09 });
    FTITLE2 = T.ransom('BIOMETANO', { size: 150, seed: 57, tilt: 0.09 });
  }

  // ---------- ESTAÇÃO 1: sobras ----------
  const COW_EYES = [[311, 184, 26], [419, 162, 25]];
  function drawSobras(rc) {
    const { ctx, t, tq } = rc;
    const [cx, cy] = ST[0].p;
    if (!rc.visible(cx, cy, 1300)) return;
    ctx.save(); ctx.translate(cx, cy);
    const tL = Lin('L02').inicio;
    // sol e nuvens
    place(ctx, 'sol', 690, -330, Z({ s: 0.8, rot: tq * 0.15 }));
    place(ctx, 'nuvem_grande', 330, -390 + Math.sin(tq * 0.8) * 6, Z({ s: 0.9 }));
    place(ctx, 'nuvem_pequena', -150, -420, Z({ s: 0.8 }));
    // faixa "o que ninguém quer..."
    const bIn = pop(tq, tL - 0.05, 0.4);
    if (bIn > 0) X.tag(ctx, 'o que ninguém quer...', -330, -300, { size: 64, s: bIn, rot: -0.04, seed: 3, progress: clamp((t - tL) / (endOf('L02', 'quer') - tL)), boil: rc.boil, zoom: rc.zoom, paper: PAL.papel });
    // vaca espiando pela esquerda
    const cIn = tw(tq, tL - 0.1, tL + 0.45, E.outBack);
    const cowX = lerp(-1320, -700, cIn), cowY = 300;
    const bob = sway(tq, 1, 0.025, 0.7);
    if (cIn > 0) {
      ctx.save(); ctx.translate(cowX - 270, cowY + 247); ctx.rotate(bob);
      const s = 0.98;
      X.img(ctx, 'vaca', 270 * s, -247 * s, Z({ s }));
      // olhinhos móveis sobre os ovais brancos
      const v = cIn < 1 ? 900 : 0;
      const [px, py] = SP.lagPupil(-v, 0, 0.001, tq * 2);
      for (const [ex, ey, er] of COW_EYES) SP.googly(ctx, ex * s, (ey - 495) * s, er * s, px + 0.25, py, { zoom: rc.zoom });
      ctx.restore();
    }
    // "eca!"
    const eca = pop(tq, at('L02', 'ninguém') + 0.05, 0.3);
    if (eca > 0 && t < at('L02', 'esterco') + 0.6) {
      ctx.save(); ctx.translate(-330, 60); ctx.scale(eca, eca); ctx.rotate(-0.1);
      SP.piece(ctx, S.blob(0, 0, 90, 56, { seed: 5, wobble: 0.06 }), { color: PAL.papel, seed: 5, ink: { w: 4, boil: rc.boil }, shadow: { zoom: rc.zoom } });
      I.stroke(ctx, [[-60, 40], [-95, 80], [-40, 48]], { w: 4, seed: 6, boil: rc.boil });
      T.hand(ctx, 'eca!', 0, 0, { size: 62, font: 'Caveat Brush', color: PAL.coral, boil: rc.boil });
      ctx.restore();
    }
    // esterco + mosca + cheiro
    const tE = at('L02', 'esterco');
    const e1 = drop(tq, tE - 0.12, 420);
    if (e1.on) {
      place(ctx, 'esterco', -300, 330 + e1.dy, Z({ s: 0.95, lift: e1.lift, sy: 1 - Math.max(0, settle(tq, tE + 0.3, 3, 7)) * 0.15 }));
      if (e1.p >= 1) {
        for (let k = 0; k < 3; k++) I.wavy(ctx, -345 + k * 42, 250, 110, { w: 5, color: '#6f8f3a', phase: tq * 6 + k, seed: 30 + k, boil: rc.boil, amp: 9 });
        X.fly(ctx, -300, 190, t, { r: 60 });
        X.tag(ctx, 'esterco', -300, 470, { size: 50, seed: 8, rot: 0.03, s: pop(tq, tE + 0.1), boil: rc.boil, zoom: rc.zoom, tape: 'pin' });
      }
    }
    // restos de comida caem numa pilha
    const tR = at('L02', 'restos');
    const pile = [['banana', 20, 360, -0.2, 0.9], ['maca', 175, 330, 0.1, 0.9], ['ovos', 300, 380, 0.05, 0.85], ['cenoura', 80, 250, -0.6, 0.9], ['alface_folha', 230, 245, 0.3, 0.9], ['laranja', 380, 300, 0.2, 0.85]];
    pile.forEach(([n, x, y, r, s], i) => {
      const d = drop(tq, tR - 0.1 + i * 0.1, 560);
      if (d.on) place(ctx, n, x, y + d.dy, Z({ s, rot: r + (1 - d.p) * 0.8, lift: d.lift }));
    });
    const tC = at('L02', 'comida');
    if (tq > tC) X.tag(ctx, 'restos de comida', 200, 480, { size: 50, seed: 9, rot: -0.02, s: pop(tq, tC), boil: rc.boil, zoom: rc.zoom, tape: 'pin', pinColor: PAL.amarelo });
    // resíduos da lavoura
    const tRe = at('L02', 'resíduos');
    [['cana_feixe', 620, 245, 0.05, 0.9], ['palha', 760, 380, 0, 0.85], ['milho_espiga', 860, 250, 0.25, 0.85]].forEach(([n, x, y, r, s], i) => {
      const d = drop(tq, tRe - 0.1 + i * 0.12, 560);
      if (d.on) place(ctx, n, x, y + d.dy, Z({ s, rot: r + (1 - d.p) * 0.6, lift: d.lift }));
    });
    const tLv = at('L02', 'lavoura');
    if (tq > tLv) X.tag(ctx, 'resíduos da lavoura', 700, 490, { size: 50, seed: 10, rot: 0.03, s: pop(tq, tLv), boil: rc.boil, zoom: rc.zoom, tape: 'pin', pinColor: PAL.lima });
    ctx.restore();
  }
  function cuesSobras() {
    const tL = Lin('L02').inicio;
    sfx(tL - 0.1, 'papel_desliza', { g: 0.8, pan: -0.6 });
    sfx(tL + 0.35, 'boing', { g: 0.5, pan: -0.6, p: 1.2 });
    sfx(at('L02', 'ninguém') + 0.05, 'pop', { g: 0.6, pan: -0.3, p: 1.4 });
    sfx(at('L02', 'esterco') + 0.25, 'plop', { g: 0.9, pan: -0.3 });
    sfx(at('L02', 'esterco') + 0.5, 'mosca', { g: 0.35, pan: -0.3, dur: 2.2 });
    const tR = at('L02', 'restos');
    for (let i = 0; i < 6; i++) sfx(tR - 0.1 + i * 0.1 + 0.2, 'papel_pousa', { g: 0.7, pan: 0.1 + i * 0.05, p: 0.9 + i * 0.07 });
    const tRe = at('L02', 'resíduos');
    for (let i = 0; i < 3; i++) sfx(tRe - 0.1 + i * 0.12 + 0.2, 'papel_pousa', { g: 0.7, pan: 0.6, p: 0.8 + i * 0.1 });
    sfx(tRe, 'palha', { g: 0.45, pan: 0.6 });
  }

  // ---------- trânsito: sobras voam até o funil do biodigestor ----------
  const HOPPER = [115, 360], PORT = [430, 452], OUTBOX = [780, 520], DIG = { x: -150, y: 60, s: 1.0, w: 790, h: 602 };
  const digPt = ([ix, iy]) => [ST[1].p[0] + DIG.x + (ix - DIG.w / 2) * DIG.s, ST[1].p[1] + DIG.y + (iy - DIG.h / 2) * DIG.s];
  function drawFlyers(rc) {
    const { ctx, tq } = rc;
    const t0 = Lin('L02').fim - 0.25;
    const items = [['banana', [20, 360]], ['maca', [175, 330]], ['esterco', [-300, 330]], ['cenoura', [80, 250]]];
    const [hx, hy] = digPt(HOPPER);
    items.forEach(([n, [lx, ly]], i) => {
      const s0 = t0 + i * 0.12, d = 1.15;
      const p = clamp((tq - s0) / d);
      if (p <= 0 || p >= 1) return;
      const x0 = ST[0].p[0] + lx, y0 = ST[0].p[1] + ly;
      const e = E.inOutSine(p);
      const x = lerp(x0, hx, e), y = lerp(y0, hy - 40, e) - Math.sin(Math.PI * p) * 520;
      place(ctx, n, x, y, Z({ s: 0.85 * (1 - 0.35 * p), rot: p * 6 * (i % 2 ? 1 : -1), lift: 0.9 }));
    });
  }

  // ---------- ESTAÇÃO 2: biodigestor ----------
  function drawDigestor(rc) {
    const { ctx, t, tq } = rc;
    const [cx, cy] = ST[1].p;
    if (!rc.visible(cx, cy, 1400)) return;
    ctx.save(); ctx.translate(cx, cy);
    const tL = Lin('L03').inicio;
    // cerquinha
    for (let k = 0; k < 9; k++) SP.piece(ctx, S.rrect(-930 + k * 60, 290, 18, 150, 6, { seed: k }), { color: PAL.papel, seed: k, shadow: { zoom: rc.zoom }, edge: 0.3 });
    SP.piece(ctx, S.rrect(-950, 320, 560, 16, 4, { seed: 40 }), { color: PAL.papel, seed: 40, shadow: { zoom: rc.zoom }, edge: 0.3 });
    // cúpula infla quando o gás é liberado
    const tGas = at('L04', 'gás');
    const inflate = tq > tGas ? 0.03 * E.outElastic(clamp((tq - tGas) / 1.2)) + 0.01 * Math.sin(tq * 3) : 0;
    ctx.save();
    ctx.translate(DIG.x, DIG.y + DIG.h / 2 * DIG.s);
    ctx.scale(1 + inflate * 0.4, 1 + inflate);
    // interior visto pela escotilha (atrás do tanque)
    const [pxl, pyl] = [(PORT[0] - DIG.w / 2) * DIG.s, (PORT[1] - DIG.h) * DIG.s];
    ctx.save(); ctx.beginPath(); ctx.arc(pxl, pyl, 48, 0, TAU); ctx.clip();
    ctx.fillStyle = P.pattern(ctx, '#5a3a26', 'paper', { seed: 3 }); ctx.fillRect(pxl - 60, pyl - 60, 120, 120);
    for (let k = 0; k < 3; k++) X.microbe(ctx, pxl - 22 + k * 22, pyl + Math.sin(tq * 6 + k) * 8, 13, { color: [PAL.lima, PAL.amarelo, '#8ec5d6'][k], seed: k + 3, mouth: 0.5, zoom: rc.zoom, boil: rc.boil });
    ctx.restore();
    X.img(ctx, 'v3/biodigestor', 0, -DIG.h / 2 * DIG.s, Z({ s: DIG.s }));
    ctx.restore();
    // etiqueta "biodigestor"
    const tBd = at('L03', 'biodigestor');
    if (tq > tBd - 0.1) X.tag(ctx, 'biodigestor', -520, -170, { size: 62, seed: 11, rot: -0.05, s: pop(tq, tBd - 0.1), boil: rc.boil, zoom: rc.zoom, font: 'Caveat Brush' });
    // "tanque fechado" + cadeado desenhado
    const tF = at('L03', 'fechado');
    if (tq > tF - 0.05) {
      const p = pop(tq, tF - 0.05);
      ctx.save(); ctx.translate(-610, 30); ctx.scale(p, p); ctx.rotate(-0.1);
      SP.piece(ctx, S.rrect(-34, -6, 68, 52, 8, { seed: 3 }), { color: PAL.amarelo, seed: 3, ink: { w: 3.5, boil: rc.boil }, shadow: { zoom: rc.zoom } });
      I.stroke(ctx, [[-20, -6], [-20, -30], [0, -44], [20, -30], [20, -6]], { w: 7, seed: 5, boil: rc.boil, taper: [0, 0] });
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(0, 18, 6, 0, TAU); ctx.fill();
      ctx.restore();
    }
    // O₂ tenta entrar e é barrado pelo carimbo
    const tO = at('L03', 'oxigênio');
    const o2p = clamp((tq - (tO - 0.55)) / 0.55);
    if (o2p > 0 && tq < tO + 2.2) {
      const hit = tq > tO + 0.05;
      const bx = hit ? lerp(-330, 180, E.outCubic(clamp((tq - tO - 0.05) / 0.9))) : lerp(250, -330, E.inQuad(o2p));
      const by = hit ? -160 - Math.sin(Math.PI * clamp((tq - tO - 0.05) / 0.9)) * 170 : -160;
      const spin = hit ? (tq - tO) * 9 : 0;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(spin);
      X.molecule(ctx, 'O2', 0, 0, 1.25, { boil: rc.boil, zoom: rc.zoom });
      ctx.restore();
      SP.googly(ctx, bx - 20, by - 8, 13, hit ? -0.8 : -0.9, 0.3, { zoom: rc.zoom }); SP.googly(ctx, bx + 16, by - 10, 14, hit ? -0.8 : -0.9, 0.3, { zoom: rc.zoom });
      if (hit) { const q = pop(tq, tO + 0.1, 0.25); if (q > 0 && tq < tO + 1.4) T.hand(ctx, '?!', bx + 60, by - 70, { size: 70 * q, font: 'Caveat Brush', color: PAL.coral, boil: rc.boil }); }
    }
    const stp = tq > tO ? 1 + 0.35 * (1 - E.outCubic(clamp((tq - tO) / 0.12))) : 0;
    if (stp > 0) SP.place(ctx, STAMP_O2, -170, -80, { rot: -0.13, s: stp, shadow: false });
    // lupa: festa dos micróbios
    const tM = at('L03', 'micróbios');
    const lensP = tw(tq, tM - 0.05, tM + 0.45, E.outBack);
    if (lensP > 0) {
      const [px, py] = [DIG.x + (PORT[0] - DIG.w / 2) * DIG.s, DIG.y + (PORT[1] - DIG.h / 2) * DIG.s];
      const lx = lerp(px, 520, lensP), ly = lerp(py, -40, lensP), lr = lerp(48, 300, lensP);
      // linhas de chamada
      I.stroke(ctx, [[px + 30, py - 38], [lx - lr * 0.62, ly + lr * 0.78]], { w: 4, color: 'rgba(27,42,51,0.7)', seed: 3, boil: rc.boil });
      I.stroke(ctx, [[px + 44, py + 20], [lx - lr * 0.2, ly + lr * 1.02]], { w: 4, color: 'rgba(27,42,51,0.7)', seed: 4, boil: rc.boil });
      X.lens(ctx, lx, ly, lr, (g) => party(g, rc, lr, tM), { zoom: rc.zoom, handle: 0.75, lift: 0.4 });
    }
    // bolhas de biogás subindo da cúpula e letras BIOGÁS
    const tB = at('L04', 'biogás');
    if (tq > tGas - 0.2) {
      for (let k = 0; k < 9; k++) {
        const ph = ((tq - tGas) * 0.7 + k * 0.111) % 1;
        const bx = -260 + (k * 97) % 330 + Math.sin(ph * 8 + k) * 16, by = -170 - ph * 260;
        X.bubble(ctx, bx, by, 14 + (k % 3) * 7, { alpha: clamp(1 - ph) * clamp((tq - tGas + 0.2) * 3) });
      }
    }
    if (tq > tB - 0.15) BIOGAS_WORD.forEach((l, i) => { const p = pop(tq, tB - 0.15 + i * 0.06, 0.32, 2.6); if (p > 0) SP.place(ctx, l.spr, -120 + l.x * 0.9, -390 + l.y, { rot: l.rot, s: p * 0.85, zoom: rc.zoom, lift: (1 - p) * 0.8 }); });
    ctx.restore();
  }
  let STAMP_O2, BIOGAS_WORD;
  // interior da lupa: sopa marrom, restos, micróbios de chapeuzinho, bandeirinhas e confete
  function party(g, rc, r, tM) {
    const { tq, t } = rc;
    g.fillStyle = P.pattern(g, '#6b4429', 'paper', { seed: 4 });
    g.fillRect(-r, -r, 2 * r, 2 * r);
    const rr = RNG(12);
    for (let k = 0; k < 16; k++) { const x = rr.sym(r), y = rr.sym(r); SP.piece(g, S.blob(x, y, rr.range(20, 60), rr.range(14, 40), { seed: k }), { color: mixHex('#6b4429', k % 2 ? '#3d2415' : '#8a5e3a', 0.5), seed: k, edge: 0, shade: 0.3 }); }
    // restos boiando (sendo comidos)
    const tF = at('L03', 'festa');
    const bites = clamp((tq - tM) / 3.2);
    X.img(g, 'banana', -140, 150, { s: 0.42 * (1 - bites * 0.45), rot: 0.3 + Math.sin(tq * 2) * 0.1, shadow: false });
    X.img(g, 'alface_folha', 150, 170, { s: 0.36 * (1 - bites * 0.45), rot: -0.4, shadow: false });
    X.img(g, 'maca', 20, 210, { s: 0.3 * (1 - bites * 0.4), rot: 0.2, shadow: false });
    // bandeirinhas de festa junina na "festa"
    if (tq > tF - 0.1) {
      const bp = clamp((tq - tF + 0.1) / 0.4);
      const cols = [PAL.coral, PAL.amarelo, PAL.lima, '#8ec5d6', PAL.papel, PAL.ambar];
      const pts = []; for (let k = 0; k <= 20; k++) { const u = k / 20; pts.push([-r * 0.95 + u * r * 1.9, -r * 0.62 + Math.sin(u * Math.PI) * r * 0.14]); }
      I.stroke(g, pts, { w: 3, color: INK, seed: 2, boil: rc.boil, progress: bp });
      for (let k = 0; k < 11; k++) {
        const u = (k + 0.5) / 11; if (u > bp) break;
        const x = -r * 0.95 + u * r * 1.9, y = -r * 0.62 + Math.sin(u * Math.PI) * r * 0.14;
        const sw = Math.sin(tq * 5 + k) * 0.12;
        g.save(); g.translate(x, y); g.rotate(sw);
        SP.piece(g, S.cut([[-17, 0], [17, 0], [0, 38]], { seed: k, jitter: 0.6, ds: 8 }), { color: cols[k % cols.length], seed: k, edge: 0.2, shade: 0.4 });
        g.restore();
      }
    }
    // micróbios dançando no compasso
    const mic = [[-150, -10, 60, PAL.lima, 'round', true], [10, 40, 68, '#8ec5d6', 'rod', true], [160, -30, 56, PAL.amarelo, 'round', false], [-60, -150, 44, PAL.coral, 'round', true], [120, -170, 40, PAL.papel, 'rod', false]];
    mic.forEach(([x, y, rad, col, kind, hat], i) => {
      const ph = beatPhase(tq + i * 0.13);
      const party_ = tq > tF - 0.1;
      const bounce = party_ ? Math.abs(Math.sin(Math.PI * ph)) * 26 : Math.sin(tq * 3 + i) * 5;
      const squash = party_ ? (ph < 0.12 ? 0.12 * (1 - ph / 0.12) : 0) : 0;
      const munch = Math.abs(Math.sin(tq * 9 + i * 1.3));
      const lookX = Math.sin(tq * 1.7 + i) * 0.6;
      X.microbe(g, x + Math.sin(tq * 1.3 + i * 2) * 10, y - bounce, rad, { color: col, kind, seed: i + 5, hat: hat && party_, mouth: 0.25 + munch * 0.75, squash, look: [lookX, 0.3 + (party_ ? -0.2 : 0.3)], phase: tq, boil: rc.boil, rot: Math.sin(tq * 4 + i) * (party_ ? 0.15 : 0.05), zoom: rc.zoom });
    });
    // bolhinhas subindo dos micróbios quando o gás é liberado
    const tG = at('L04', 'liberam');
    if (tq > tG - 0.3) for (let k = 0; k < 10; k++) {
      const ph = ((tq - tG) * 0.9 + k * 0.1) % 1;
      X.bubble(g, -170 + k * 38 + Math.sin(ph * 7 + k) * 10, 60 - ph * 340, 7 + (k % 3) * 4, { alpha: 1 - ph });
    }
    X.confetti(g, tq, tF - 0.05, 0, 40, { n: 30, seed: 3, speed: 560, spread: 1.3, life: 2.4 });
    X.confetti(g, tq, tF + 0.35, -80, 60, { n: 22, seed: 8, speed: 480, spread: 1.0, life: 2.0 });
  }
  function cuesDigestor() {
    const [hx] = digPt(HOPPER);
    const t0 = Lin('L02').fim - 0.25;
    for (let i = 0; i < 4; i++) sfx(t0 + i * 0.12, 'whoosh_curto', { g: 0.35, p: 1 + i * 0.1 });
    for (let i = 0; i < 4; i++) sfx(t0 + i * 0.12 + 1.12, 'plop', { g: 0.55, pan: -0.4, p: 0.9 + i * 0.12 });
    sfx(at('L03', 'biodigestor') - 0.1, 'papel_desliza', { g: 0.5, pan: -0.4 });
    sfx(at('L03', 'fechado') - 0.05, 'cadeado', { g: 0.6, pan: -0.6 });
    sfx(at('L03', 'oxigênio'), 'carimbo', { g: 1.0, pan: -0.1 });
    sfx(at('L03', 'oxigênio') + 0.06, 'boing', { g: 0.6, pan: 0.2, p: 1.0 });
    sfx(at('L03', 'micróbios') - 0.05, 'lupa', { g: 0.7, pan: 0.4 });
    sfx(at('L03', 'festa') - 0.08, 'festa', { g: 0.9, pan: 0.45 });
    sfx(at('L03', 'festa') + 0.3, 'festa', { g: 0.6, pan: 0.35 });
    for (let k = 0; k < 6; k++) sfx(at('L03', 'micróbios') + 0.4 + k * 0.42, 'nhac', { g: 0.4, pan: 0.45, p: 0.9 + (k % 3) * 0.1 });
    sfx(at('L04', 'liberam') - 0.2, 'bolhas', { g: 0.6, pan: 0.2, dur: 2.4 });
    const tB = at('L04', 'biogás');
    for (let i = 0; i < 7; i++) sfx(tB - 0.15 + i * 0.06 + 0.1, 'letra', { g: 0.55, pan: -0.1 + i * 0.04, p: 0.9 + i * 0.06 });
    sfx(Lin('L04').fim - 0.2, 'whoosh', { g: 0.6, dur: 0.95 });
  }

  // ---------- ESTAÇÃO 3: composição ----------
  const BALLOON = { x: -480, y: -50, r: 290 };
  function balloonMolecules(tq) {
    const out = [];
    const rr = RNG(55);
    const kinds = ['CH4', 'CH4', 'CO2', 'CH4', 'CO2', 'CH4', 'CH4', 'CO2', 'CH4', 'CO2', 'H2S'];
    kinds.forEach((k, i) => {
      const a = (i / kinds.length) * TAU + rr.sym(0.3), sp = rr.range(0.25, 0.5), rad = rr.range(95, 205);
      const x = Math.cos(a + tq * sp) * rad + Math.sin(tq * 1.3 + i) * 14, y = Math.sin(a + tq * sp) * rad * 0.9 + Math.cos(tq * 1.1 + i) * 12;
      out.push({ k, x, y, rot: tq * rr.sym(1.2) + a, s: k === 'H2S' ? 0.95 : 1.2 });
    });
    return out;
  }
  function drawComposicao(rc) {
    const { ctx, t, tq } = rc;
    const [cx, cy] = ST[2].p;
    if (!rc.visible(cx, cy, 1400)) return;
    ctx.save(); ctx.translate(cx, cy);
    const tL = Lin('L05').inicio;
    // cano vindo do biodigestor
    X.pipe(ctx, [[-980, -560], [-860, -470], [-700, -380], [-600, -300]], { w: 44, color: '#8ec5d6', flow: tq > Lin('L04').inicio ? tq : null, zoom: rc.zoom });
    // balão de biogás
    const bIn = pop(tq, tL - 0.5, 0.6, 1.6);
    if (bIn > 0) {
      const { x, y, r } = BALLOON;
      const rs = r * (0.6 + 0.4 * bIn) * (1 + 0.012 * Math.sin(tq * 2.2));
      // conteúdo: moléculas
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, rs * 0.95, 0, TAU); ctx.clip();
      const mols = balloonMolecules(tq);
      const tFd = at('L06', 'fedidos');
      mols.forEach((m) => { if (m.k === 'H2S' && tq > at('L06', 'alguns') - 0.1) return; X.molecule(ctx, m.k, x + m.x * rs / r, y + m.y * rs / r, m.s * (rs / r), { rot: m.rot, boil: rc.boil, zoom: rc.zoom, face: m.k === 'CH4', mood: tq > tFd ? 'nojo' : 'feliz' }); });
      ctx.restore();
      X.bubble(ctx, x, y, rs, { tint: '#e8f4f0' });
      X.tag(ctx, 'biogás', x - 150, y + rs - 10, { size: 64, seed: 13, rot: 0.03, font: 'Caveat Brush', zoom: rc.zoom, s: bIn, tape: 'pin', pinColor: PAL.coral });
    }
    // pizza: ~60% metano, ~40% gás carbônico, pitadinha de outros
    const tMe = at('L05', 'metano'), tCa = at('L05', 'gás'), tPi = at('L05', 'pitadinha');
    if (tq > tMe - 0.2) {
      const pp = [lin(tq, tMe - 0.15, 0.5), lin(tq, tCa - 0.1, 0.5), lin(tq, tPi - 0.05, 0.4)];
      X.pie(ctx, 300, -100, 210, [{ frac: 0.6, color: PAL.lima }, { frac: 0.37, color: PAL.ambar }, { frac: 0.03, color: PAL.amarelo }], { progress: pp, zoom: rc.zoom, start: -Math.PI / 2 });
      // rótulos
      const l1 = pop(tq, tMe + 0.1);
      if (l1 > 0) { tagFormula(ctx, 'CH4', 'metano', '≈ 60%', 700, -300, l1, 0.04, rc, PAL.lima); }
      const l2 = pop(tq, at('L05', 'carbônico'));
      if (l2 > 0) { tagFormula(ctx, 'CO2', 'gás carbônico', '≈ 40%', 740, 140, l2, -0.04, rc, PAL.ambar); }
      const l3 = pop(tq, tPi + 0.2);
      if (l3 > 0) X.tag(ctx, '+ uma pitadinha\nde outros gases', 330, 300, { size: 42, seed: 17, rot: 0.05, s: l3, zoom: rc.zoom, boil: rc.boil, tape: 'pin', pinColor: PAL.amarelo });
    }
    // "...alguns bem fedidos!" — H₂S salta do balão
    const tA = at('L06', 'alguns'), tFd = at('L06', 'fedidos');
    if (tq > tA - 0.1) {
      const p = tw(tq, tA - 0.1, tA + 0.5, E.outBack);
      const x = lerp(BALLOON.x + 60, -80, p), y = lerp(BALLOON.y, 230, p) - Math.sin(Math.PI * clamp(p)) * 160;
      const shake = tq > tFd ? Math.sin(tq * 40) * 0.08 : 0;
      X.molecule(ctx, 'H2S', x, y, 1.9, { rot: shake, face: true, mood: 'nojo', boil: rc.boil, zoom: rc.zoom });
      if (tq > tFd - 0.1) {
        for (let k = 0; k < 4; k++) I.wavy(ctx, x - 70 + k * 45, y - 70, 140, { w: 6, color: '#7d9a3a', phase: tq * 7 + k, seed: 60 + k, boil: rc.boil, amp: 10 });
        X.fly(ctx, x, y - 40, t * 1.3, { r: 90 });
        const q = pop(tq, tFd - 0.05, 0.3);
        X.tag(ctx, 'H₂S & cia.: fedidos!', x - 20, y + 175, { size: 46, seed: 19, rot: -0.05, s: q, zoom: rc.zoom, boil: rc.boil, paper: '#f6f0c8', tape: 'pin', pinColor: PAL.verde });
      }
    }
    ctx.restore();
  }
  function tagFormula(ctx, f, nome, pct, x, y, s, rot, rc, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    const w = 390, h = 150;
    SP.piece(ctx, S.cut([[-w / 2, -h / 2], [w / 2, -h / 2 + 4], [w / 2 - 3, h / 2], [-w / 2 + 2, h / 2 - 2]], { seed: f.length * 7, jitter: 0.8 }), { color: PAL.papel, kind: 'smooth', seed: 3, shadow: { zoom: rc.zoom }, edge: 0.2 });
    SP.piece(ctx, S.rrect(-w / 2 + 10, -h / 2 + 10, 16, h - 20, 4, { seed: 2 }), { color: col, seed: 2, edge: 0.1 });
    T.formula(ctx, f, -160, -48, { size: 64, font: 'Luckiest Guy', color: INK, align: 'left' });
    T.hand(ctx, pct, 95, -14, { size: 60, font: 'Caveat Brush', color: PAL.coral, boil: rc.boil });
    T.hand(ctx, nome, 0, 46, { size: 46, font: 'Caveat', color: INK, boil: rc.boil });
    SP.tape(ctx, 0, -h / 2 + 2, 70, 26, 0.08, { seed: 9, zoom: rc.zoom });
    ctx.restore();
  }
  function cuesComposicao() {
    const tL = Lin('L05').inicio;
    sfx(tL - 0.5, 'balao', { g: 0.6, pan: -0.4 });
    sfx(at('L05', 'metano') - 0.1, 'fatia', { g: 0.8, pan: 0.3 });
    sfx(at('L05', 'metano') + 0.1, 'pop', { g: 0.45, pan: 0.5, p: 1.1 });
    sfx(at('L05', 'gás') - 0.05, 'fatia', { g: 0.75, pan: 0.2, p: 0.92 });
    sfx(at('L05', 'carbônico'), 'pop', { g: 0.45, pan: 0.1, p: 1.0 });
    sfx(at('L05', 'pitadinha'), 'fatia', { g: 0.55, pan: 0.35, p: 1.25 });
    sfx(at('L06', 'alguns') - 0.1, 'boing', { g: 0.6, pan: -0.1, p: 0.8 });
    sfx(at('L06', 'fedidos') - 0.05, 'fedido', { g: 0.7, pan: 0 });
    sfx(at('L06', 'fedidos') + 0.1, 'mosca', { g: 0.3, pan: 0.1, dur: 1.4 });
    sfx(Lin('L06').fim - 0.1, 'whoosh', { g: 0.55, dur: 0.9 });
  }

  // ---------- ESTAÇÃO 4: queimar → calor e eletricidade ----------
  function drawQueima(rc) {
    const { ctx, t, tq } = rc;
    const [cx, cy] = ST[3].p;
    if (!rc.visible(cx, cy, 1400)) return;
    ctx.save(); ctx.translate(cx, cy);
    const tQ = at('L07', 'queimando'), tCa = at('L07', 'calor'), tEl = at('L07', 'eletricidade');
    // raios de sol desenhados no fundo
    I.rays(ctx, 0, 60, 560, 820, 22, { w: 7, color: 'rgba(211,116,2,0.35)', seed: 3, boil: rc.boil, rot: tq * 0.05 });
    // canos: do alto (vindo da composição) para o fogão e para o gerador
    const flow = tq > Lin('L06').fim - 0.4 ? tq : null;
    X.pipe(ctx, [[980, -560], [700, -430], [200, -380], [-150, -330], [-270, -180], [-290, 60]], { w: 40, color: PAL.verdeEsc, flow, zoom: rc.zoom, flowColor: PAL.lima });
    X.pipe(ctx, [[200, -380], [300, -250], [330, 90]], { w: 36, color: PAL.verdeEsc, flow, zoom: rc.zoom, flowColor: PAL.lima });
    // fogão com chama azul acesa no "queimando"
    X.img(ctx, 'v3/fogao', -330, 170, Z({ s: 1.35 }));
    const fl = tq > tQ + 0.05;
    if (fl) {
      const pose = Math.floor(tq * 12);
      const g = clamp((tq - tQ - 0.05) / 0.25);
      for (let k = 0; k < 5; k++) X.flame(ctx, -207 + (k - 2) * 20, 162, (46 + (k % 2) * 14) * g, { blue: true, pose: pose + k * 3, seed: k + 1, zoom: rc.zoom, width: 0.5 });
      // panela esquentando: ondas de calor
      const hp = clamp((tq - tCa + 0.2) / 0.4);
      if (hp > 0) for (let k = 0; k < 3; k++) I.wavy(ctx, -520 + k * 60, -10, 150, { w: 7, color: PAL.coral, phase: tq * 6 + k, seed: 80 + k, boil: rc.boil, amp: 12, progress: hp });
    }
    const cIn = pop(tq, tCa - 0.05);
    if (cIn > 0) { ctx.save(); ctx.translate(-480, -230); ctx.scale(cIn, cIn); ctx.rotate(-0.06); X.flame(ctx, -150, 30, 130, { pose: Math.floor(tq * 12), seed: 9, zoom: rc.zoom }); T.hand(ctx, 'CALOR', 40, 0, { size: 110, font: 'Luckiest Guy', color: PAL.coral, stroke: PAL.papel, strokeW: 14, boil: rc.boil }); ctx.restore(); }
    // gerador + fio + lâmpada
    X.img(ctx, 'gerador', 330, 200, Z({ s: 1.35, rot: fl ? Math.sin(tq * 38) * 0.006 : 0 }));
    const wire = [[500, 170], [600, 120], [640, 0], [610, -120]];
    I.stroke(ctx, wire, { w: 6, color: INK, seed: 8, boil: rc.boil });
    const on = tq > tEl;
    if (on) {
      const zz = clamp((tq - tEl + 0.05) / 0.25);
      const zig = [[505, 165], [540, 130], [560, 150], [595, 100], [615, 110], [640, 30], [625, -40], [650, -60]];
      I.stroke(ctx, zig, { w: 9, color: PAL.amarelo, seed: 9, boil: rc.boil, progress: zz });
      // brilho
      const gl = ctx.createRadialGradient(610, -240, 20, 610, -240, 260);
      gl.addColorStop(0, 'rgba(255,240,170,0.85)'); gl.addColorStop(1, 'rgba(255,240,170,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(610, -240, 260, 0, TAU); ctx.fill();
      I.rays(ctx, 610, -250, 130, 210, 12, { w: 7, color: PAL.amarelo, seed: 5, boil: rc.boil });
    }
    X.img(ctx, 'lampada', 610, -250, Z({ s: 1.25, rot: Math.sin(tq * 2) * 0.05 }));
    if (on) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(255,230,120,0.55)'; ctx.beginPath(); ctx.arc(608, -280, 72, 0, TAU); ctx.fill(); ctx.restore(); }
    const eIn = pop(tq, tEl + 0.1);
    if (eIn > 0) { ctx.save(); ctx.translate(310, -440); ctx.scale(eIn, eIn); ctx.rotate(0.04); T.hand(ctx, 'ELETRICIDADE', 0, 0, { size: 96, font: 'Luckiest Guy', color: PAL.petrol, stroke: PAL.papel, strokeW: 14, boil: rc.boil }); ctx.restore(); }
    ctx.restore();
  }
  function cuesQueima() {
    sfx(at('L07', 'queimando') + 0.05, 'fogo', { g: 0.85, pan: -0.4 });
    sfx(at('L07', 'queimando') + 0.25, 'chiado', { g: 0.3, pan: -0.4, dur: 3.0 });
    sfx(at('L07', 'calor') - 0.05, 'pop', { g: 0.55, pan: -0.5, p: 0.9 });
    sfx(at('L07', 'eletricidade') - 0.05, 'zap', { g: 0.55, pan: 0.4 });
    sfx(at('L07', 'eletricidade') + 0.12, 'lampada', { g: 0.75, pan: 0.5 });
    sfx(Lin('L07').fim - 0.15, 'whoosh', { g: 0.55, dur: 0.9 });
  }

  // ---------- ESTAÇÃO 5: purificação → biometano ----------
  const MQ = { x: -130, y: 20, s: 1.28, w: 548, h: 506 };
  const mqPt = ([ix, iy]) => [MQ.x + (ix - MQ.w / 2) * MQ.s, MQ.y + (iy - MQ.h / 2) * MQ.s];
  function drawPurificacao(rc) {
    const { ctx, t, tq } = rc;
    const [cx, cy] = ST[4].p;
    if (!rc.visible(cx, cy, 1400)) return;
    ctx.save(); ctx.translate(cx, cy);
    const tL = Lin('L08').inicio, tT = at('L08', 'tirando'), tI = at('L08', 'impurezas'), tN = at('L08', 'nasce'), tBm = at('L08', 'biometano'), tP = at('L08', 'puro');
    const working = tq > tL - 0.2 && tq < Lin('L08').fim + 0.5;
    // bolhas de biogás entrando no funil
    const [fx, fy] = mqPt([98, 88]);
    for (let k = 0; k < 6; k++) {
      const ph = ((tq - tL + 1) * 0.6 + k / 6) % 1;
      if (tq < tL - 0.6) break;
      const bx = lerp(fx - 520, fx, ph) + Math.sin(ph * 6 + k) * 20, by = lerp(fy - 380, fy + 20, E.inQuad(ph));
      X.bubble(ctx, bx, by, 34, { alpha: ph > 0.9 ? (1 - ph) * 10 : 1 });
      X.molecule(ctx, k % 3 ? 'CH4' : 'CO2', bx, by, 0.5, { rot: tq * 2 + k, zoom: rc.zoom });
    }
    // máquina trepidando
    const shake = working ? [Math.sin(tq * 47) * 2.2, Math.sin(tq * 53) * 1.6, Math.sin(tq * 41) * 0.006] : [0, 0, 0];
    ctx.save(); ctx.translate(shake[0], shake[1]);
    X.img(ctx, 'maquina', MQ.x, MQ.y, Z({ s: MQ.s, rot: shake[2] }));
    // engrenagens girando por cima das desenhadas
    const [g1x, g1y] = mqPt([285, 290]), [g2x, g2y] = mqPt([360, 272]);
    const spin = working ? tq * 2.6 : 0;
    X.gearPiece(ctx, g1x, g1y, 60, 10, spin, '#2e5566', { zoom: rc.zoom });
    X.gearPiece(ctx, g2x, g2y, 37, 8, -spin * 1.6 + 0.3, '#2e5566', { zoom: rc.zoom });
    // ponteiro do manômetro oscilando
    const [gx, gy] = mqPt([220, 205]);
    const needle = -0.9 + (working ? 1.3 + Math.sin(tq * 9) * 0.25 : 0) + (tq > tBm ? 0.3 : 0);
    I.stroke(ctx, [[gx, gy], [gx + Math.cos(needle - Math.PI / 2) * 38, gy + Math.sin(needle - Math.PI / 2) * 38]], { w: 5, color: PAL.coral, seed: 3, boil: rc.boil });
    ctx.restore();
    // lixeira de CO₂ e impurezas
    const binX = 150, binY = 400;
    SP.piece(ctx, S.cut([[binX - 120, binY - 70], [binX + 120, binY - 70], [binX + 100, binY + 110], [binX - 100, binY + 110]], { seed: 7, jitter: 1 }), { color: '#6d7b80', seed: 7, ink: { w: 4, boil: rc.boil }, shadow: { zoom: rc.zoom } });
    // CO₂ e H₂S caindo pela calha
    const [chx, chy] = mqPt([390, 480]);
    if (tq > tT - 0.1) for (let k = 0; k < 5; k++) {
      const st = tT - 0.1 + k * 0.33;
      const p = clamp((tq - st) / 0.6);
      if (p <= 0 || p >= 1) continue;
      const x = lerp(chx, binX + (k % 3 - 1) * 40, p), y = lerp(chy, binY - 40, E.inQuad(p)) - Math.sin(Math.PI * p) * 60;
      X.molecule(ctx, k === 3 ? 'H2S' : 'CO2', x, y, 0.8, { rot: p * 5, zoom: rc.zoom });
    }
    const t1 = pop(tq, at('L08', 'carbônico'));
    if (t1 > 0) { ctx.save(); ctx.translate(binX - 20, binY + 20); ctx.scale(t1, t1); T.formula(ctx, 'CO2', 0, -40, { size: 64, font: 'Luckiest Guy', color: PAL.papel }); ctx.restore(); }
    const t2 = pop(tq, tI);
    if (t2 > 0) X.tag(ctx, 'impurezas', binX + 240, binY + 30, { size: 50, seed: 21, rot: 0.06, s: t2, zoom: rc.zoom, boil: rc.boil, tape: 'pin', pinColor: PAL.coral });
    if (t1 > 0) X.tag(ctx, 'gás carbônico', binX - 290, binY + 40, { size: 46, seed: 22, rot: -0.05, s: t1, zoom: rc.zoom, boil: rc.boil, tape: 'pin', pinColor: PAL.ambar });
    // biometano nasce: CH₄ brilhantes saindo pelo cano da direita
    const [ox, oy] = mqPt([525, 345]);
    const bx = 600, by = -110;
    if (tq > tN - 0.15) {
      for (let k = 0; k < 6; k++) {
        const st = tN - 0.15 + k * 0.16;
        const p = clamp((tq - st) / 0.7);
        if (p <= 0) continue;
        const rr = RNG(k + 90);
        const tx = bx + rr.sym(110), ty = by + rr.sym(90);
        const x = lerp(ox + 10, tx, E.outCubic(p)), y = lerp(oy + 20, ty, E.outCubic(p)) - Math.sin(Math.PI * p) * 120;
        X.molecule(ctx, 'CH4', x + (p >= 1 ? Math.sin(tq * 2 + k) * 8 : 0), y + (p >= 1 ? Math.cos(tq * 2.3 + k) * 8 : 0), 0.95, { rot: tq * 1.5 + k, face: true, zoom: rc.zoom, boil: rc.boil });
      }
      const bb = pop(tq, tN + 0.2, 0.5, 1.8);
      if (bb > 0) X.bubble(ctx, bx, by, 240 * bb, { tint: '#fff6d6' });
      // brilhos
      for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + tq * 0.8, r = 270 + Math.sin(tq * 3 + k) * 20; const s = 0.6 + 0.4 * Math.abs(Math.sin(tq * 5 + k * 1.7)); I.sparkle(ctx, bx + Math.cos(a) * r, by + Math.sin(a) * r, 26 * s * bb, { w: 7, color: PAL.amarelo, seed: k, boil: rc.boil }); }
    }
    if (tq > tBm - 0.1) BIOMETANO_WORD.forEach((l, i) => { const p = pop(tq, tBm - 0.1 + i * 0.05, 0.3, 2.6); if (p > 0) SP.place(ctx, l.spr, 470 + l.x * 0.68, -410 + l.y, { rot: l.rot, s: p * 0.66, zoom: rc.zoom, lift: (1 - p) * 0.8 }); });
    const q = pop(tq, at('L08', 'metano', 1) + 0.05);
    if (q > 0) {
      X.tag(ctx, 'metano quase puro!', 610, 230, { size: 56, seed: 25, rot: -0.04, s: q, zoom: rc.zoom, boil: rc.boil, font: 'Caveat Brush', paper: '#fff4cc' });
      const st = pop(tq, tP, 0.35);
      if (st > 0) { ctx.save(); ctx.translate(860, 150); ctx.rotate(tq * 0.8); SP.piece(ctx, S.star(0, 0, 34 * st, 80 * st, 5, { seed: 3 }), { color: PAL.amarelo, seed: 3, border: { w: 6 }, shadow: { zoom: rc.zoom, lift: 0.3 }, ink: { w: 3 } }); ctx.restore(); }
    }
    ctx.restore();
  }
  let BIOMETANO_WORD;
  function cuesPurificacao() {
    const tL = Lin('L08').inicio;
    sfx(tL - 0.3, 'bolhas', { g: 0.35, pan: -0.5, dur: 1.4 });
    sfx(tL - 0.1, 'maquina', { g: 0.5, pan: -0.1, dur: Lin('L08').fim - tL + 0.5 });
    const tT = at('L08', 'tirando');
    for (let k = 0; k < 5; k++) sfx(tT - 0.1 + k * 0.33 + 0.58, 'plim', { g: 0.55, pan: 0.15, p: 0.85 + k * 0.08 });
    sfx(at('L08', 'impurezas'), 'pop', { g: 0.5, pan: 0.3, p: 0.8 });
    sfx(at('L08', 'nasce') - 0.1, 'brilho', { g: 0.6, pan: 0.5 });
    const tBm = at('L08', 'biometano');
    for (let i = 0; i < 9; i++) sfx(tBm - 0.1 + i * 0.05 + 0.08, 'letra', { g: 0.45, pan: 0.4 + i * 0.03, p: 0.95 + i * 0.05 });
    sfx(at('L08', 'puro'), 'estrela', { g: 0.8, pan: 0.6 });
    sfx(Lin('L08').fim - 0.15, 'whoosh', { g: 0.55, dur: 0.95 });
  }

  // ---------- ESTAÇÃO 6: usos do biometano ----------
  function drawUsos(rc) {
    const { ctx, t, tq } = rc;
    const [cx, cy] = ST[5].p;
    if (!rc.visible(cx, cy, 1700)) return;
    ctx.save(); ctx.translate(cx, cy);
    const tNa = at('L09', 'natural'), tRe = at('L09', 'renovável'), tGd = at('L09', 'gasoduto'), tCs = at('L09', 'casas'), tIn = at('L09', 'indústrias'), tCm = at('L09', 'caminhões'), tOn = at('L09', 'ônibus');
    // equação: CH₄ = gás natural (renovável!)
    const e1 = pop(tq, Lin('L09').inicio - 0.1);
    if (e1 > 0) {
      ctx.save(); ctx.translate(-700, -250); ctx.scale(e1 * 1.45, e1 * 1.45);
      X.bubble(ctx, -120, 0, 105, { tint: '#fff6d6' });
      X.molecule(ctx, 'CH4', -120, 0, 1.05, { rot: tq * 0.8, face: true, zoom: rc.zoom, boil: rc.boil });
      T.hand(ctx, 'biometano', -120, 150, { size: 50, font: 'Caveat Brush', color: INK, boil: rc.boil });
      const eq = pop(tq, at('L09', 'como'));
      if (eq > 0) for (const dy of [-14, 14]) I.stroke(ctx, [[10, dy], [70, dy + 2]], { w: 11, color: PAL.petrol, progress: eq, seed: 40 + dy, boil: rc.boil, taper: [0.1, 0.1] });
      const gn = pop(tq, tNa - 0.1);
      if (gn > 0) { ctx.save(); ctx.translate(230, 10); ctx.scale(gn, gn); X.flame(ctx, 0, 50, 150, { blue: true, pose: Math.floor(tq * 12), seed: 4, zoom: rc.zoom }); T.hand(ctx, 'gás natural', 0, 140, { size: 50, font: 'Caveat Brush', color: INK, boil: rc.boil }); ctx.restore(); }
      ctx.restore();
    }
    const sR = tq > tRe ? 1 + 0.35 * (1 - E.outCubic(clamp((tq - tRe) / 0.12))) : 0;
    if (sR > 0) SP.place(ctx, STAMP_REN, -690, 150, { rot: -0.1, s: sR * 1.1, shadow: false });
    // gasoduto até casas e indústria
    const pp = clamp((tq - tGd + 0.1) / 0.9);
    const pipePts = [[-1300, 420], [-800, 420], [-500, 400], [-120, 400], [250, 400], [600, 395], [700, 330]];
    if (pp > 0) X.pipe(ctx, pipePts, { w: 42, color: PAL.petrol, progress: pp, flow: pp >= 1 ? tq : null, zoom: rc.zoom, flowColor: PAL.lima, flangeEvery: 260 });
    if (pp > 0 && pp < 1) T.hand(ctx, 'gasoduto', -620, 478, { size: 54, font: 'Caveat Brush', color: INK, progress: pp * 1.5, boil: rc.boil });
    else if (pp >= 1) X.tag(ctx, 'gasoduto', -620, 478, { size: 50, seed: 30, s: 1, zoom: rc.zoom, boil: rc.boil, tape: 'pin', pinColor: PAL.lima });
    const houses = [['casa_amarela', -380, 250, [[85, 135], [135, 135]], 206, 289], ['casa_verde', -160, 262, [[70, 120], [145, 120]], 207, 273], ['casa_marrom', 60, 252, [[75, 150], [155, 150]], 231, 271]];
    houses.forEach(([n, x, y, wins, w, h], i) => {
      place(ctx, n, x, y, Z({ s: 0.95 }));
      const lt = tq > tCs + i * 0.12;
      if (lt) for (const [wx, wy] of wins) {
        const gx = x + (wx - w / 2) * 0.95, gy = y + (wy - h / 2) * 0.95;
        ctx.save(); ctx.globalCompositeOperation = 'screen';
        const g = ctx.createRadialGradient(gx, gy, 2, gx, gy, 46); g.addColorStop(0, 'rgba(255,225,120,0.95)'); g.addColorStop(1, 'rgba(255,225,120,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, 46, 0, TAU); ctx.fill(); ctx.restore();
      }
    });
    const fb = [330, 225];
    place(ctx, 'fabrica', fb[0], fb[1], Z({ s: 1.0 }));
    if (tq > tIn) {
      for (let k = 0; k < 3; k++) { const ph = ((tq - tIn) * 0.5 + k / 3) % 1; X.bubble(ctx, fb[0] + 95 + ph * 60, fb[1] - 150 - ph * 220, 22 + ph * 30, { alpha: 1 - ph, tint: '#ffffff' }); }
      for (const wx of [60, 115, 165, 220]) { const gx = fb[0] + (wx - 142), gy = fb[1] + (190 - 151); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(255,225,120,0.7)'; ctx.fillRect(gx - 14, gy - 10, 28, 20); ctx.restore(); }
    }
    if (tq > tCs - 0.05) X.tag(ctx, 'casas', -110, 45, { size: 50, seed: 31, rot: -0.05, s: pop(tq, tCs - 0.05), zoom: rc.zoom, boil: rc.boil, tape: 'pin', pinColor: PAL.coral });
    if (tq > tIn - 0.05) X.tag(ctx, 'indústrias', 360, -30, { size: 50, seed: 32, rot: 0.05, s: pop(tq, tIn - 0.05), zoom: rc.zoom, boil: rc.boil, tape: 'pin', pinColor: PAL.amarelo });
    // posto + caminhão + ônibus
    place(ctx, 'bomba', 640, 250, Z({ s: 1.0 }));
    const bs = tw(tq, tOn - 0.35, tOn + 0.4, E.outCubic);
    if (bs > 0) {
      const lv = tq > tOn + 0.9 ? E.inCubic(clamp((tq - tOn - 0.9) / 0.9)) : 0;
      const x = lerp(2250, 1165, bs) + lv * 1100, bounce = Math.abs(Math.sin(tq * 14 + 1)) * (bs < 1 || lv > 0 ? 4 : 0);
      place(ctx, 'onibus', x, 322 - bounce, Z({ s: 0.84, flip: true }));
      T.hand(ctx, 'BIOMETANO', x + (240 - 203) * 0.84, 322 - bounce + (120 - 113) * 0.84, { size: 30, font: 'Luckiest Guy', color: PAL.verdeEsc, boil: rc.boil });
    }
    const tr = tw(tq, tCm - 0.35, tCm + 0.35, E.outCubic);
    if (tr > 0) {
      const lv = tq > tOn + 0.6 ? E.inCubic(clamp((tq - tOn - 0.6) / 0.9)) : 0;
      const x = lerp(2100, 930, tr) + lv * 1100;
      const bounce = Math.abs(Math.sin(tq * 16)) * (tr < 1 || lv > 0 ? 4 : 0);
      place(ctx, 'v3/caminhao', x, 300 - bounce, Z({ s: 0.78, flip: true }));
      T.hand(ctx, 'BIOMETANO', x - (405 - 302) * 0.78, 300 - bounce + (120 - 150) * 0.78, { size: 44, font: 'Luckiest Guy', color: PAL.verdeEsc, boil: rc.boil });
    }
    if (tq > tCm) X.tag(ctx, 'caminhões e ônibus', 1050, 40, { size: 50, seed: 33, rot: 0.04, s: pop(tq, tCm), zoom: rc.zoom, boil: rc.boil, tape: 'pin', pinColor: PAL.lima });
    ctx.restore();
  }
  let STAMP_REN;
  function cuesUsos() {
    sfx(Lin('L09').inicio - 0.1, 'pop', { g: 0.5, pan: -0.6, p: 1.1 });
    sfx(at('L09', 'natural') - 0.1, 'fogo', { g: 0.4, pan: -0.4 });
    sfx(at('L09', 'renovável'), 'carimbo', { g: 0.85, pan: -0.5 });
    sfx(at('L09', 'gasoduto') - 0.1, 'gas_fluxo', { g: 0.55, pan: -0.3, dur: 1.2 });
    for (let i = 0; i < 3; i++) sfx(at('L09', 'casas') + i * 0.12, 'janela', { g: 0.5, pan: -0.2 + i * 0.1, p: 1 + i * 0.12 });
    sfx(at('L09', 'indústrias'), 'fumaca', { g: 0.5, pan: 0.2 });
    sfx(at('L09', 'caminhões') - 0.35, 'motor', { g: 0.45, pan: 0.6, dur: 0.9 });
    sfx(at('L09', 'caminhões') + 0.25, 'buzina', { g: 0.45, pan: 0.5 });
    sfx(at('L09', 'ônibus') - 0.35, 'motor', { g: 0.4, pan: 0.7, dur: 0.9, p: 0.85 });
    sfx(at('L09', 'ônibus') + 0.6, 'motor', { g: 0.35, pan: 0.8, dur: 1.4, p: 1.1 });
    sfx(Lin('L09').fim - 0.1, 'whoosh', { g: 0.55, dur: 0.9 });
  }

  // ---------- ESTAÇÃO 7: lavoura ----------
  function drawLavoura(rc) {
    const { ctx, t, tq } = rc;
    const [cx, cy] = ST[6].p;
    if (!rc.visible(cx, cy, 1400)) return;
    ctx.save(); ctx.translate(cx, cy);
    const tS = at('L10', 'sobra'), tBf = at('L10', 'biofertilizante'), tLv = at('L10', 'lavoura'), tFc = at('L10', 'fechando');
    place(ctx, 'v3/sol_nuvens', 620, -330, Z({ s: 1.0 }));
    // canteiros de terra
    for (let k = 0; k < 3; k++) {
      const y = 170 + k * 120;
      SP.piece(ctx, ROWS[k], { color: PAL.terra, seed: 50 + k, shadow: { zoom: rc.zoom }, torn: 4 });
      for (let j = 0; j < 22; j++) { ctx.fillStyle = 'rgba(60,35,20,0.35)'; ctx.fillRect(-950 + j * 90 + (k % 2) * 40, y - 6, 26, 5); }
    }
    // trator puxando o tanque de biofertilizante
    const tp = tw(tq, Lin('L10').inicio - 0.55, tLv + 0.6, E.inOutSine);
    const trX = lerp(-880, 820, tp), trY = 90;
    const bump = Math.abs(Math.sin(tq * 14)) * 3;
    // tanque
    ctx.save(); ctx.translate(trX - 360, trY + 30 - bump);
    SP.piece(ctx, S.rrect(-160, -80, 320, 160, 70, { seed: 5 }), { color: '#7a5233', seed: 5, ink: { w: 4, boil: rc.boil }, shadow: { zoom: rc.zoom } });
    for (const wx of [-90, 90]) { SP.piece(ctx, S.blob(wx, 90, 42, 42, { seed: wx }), { color: '#2a2622', seed: 9, shadow: { zoom: rc.zoom } }); SP.piece(ctx, S.blob(wx, 90, 18, 18, { seed: wx + 1 }), { color: '#9aa7ab', seed: 3 }); }
    I.stroke(ctx, [[160, 10], [240, 20]], { w: 8, seed: 3, boil: rc.boil });
    if (tq > tBf - 0.15) T.hand(ctx, 'BIOFERTILIZANTE', 0, 4, { size: 40, font: 'Luckiest Guy', color: PAL.papel, progress: clamp((tq - tBf + 0.15) / 0.5), boil: rc.boil });
    ctx.restore();
    place(ctx, 'trator', trX, trY - bump, Z({ s: 1.2, flip: true }));
    // gotinhas caindo atrás do tanque
    if (tp > 0 && tp < 1) for (let k = 0; k < 12; k++) {
      const ph = (tq * 2.2 + k / 12) % 1;
      const dx = trX - 520 - ph * 80 + (k % 4) * 14, dy = trY + 60 + ph * 140;
      SP.piece(ctx, S.blob(dx, dy, 9, 12, { seed: k }), { color: k % 3 ? '#7a5233' : PAL.verde, seed: k, edge: 0.2 });
    }
    // plantas brotando por onde o trator passou
    const plants = ['muda', 'v3/broto', 'cana_planta', 'milho_planta', 'alface_pe', 'tomateiro', 'muda', 'milho_planta', 'cana_planta', 'tomateiro', 'alface_pe', 'v3/broto'];
    plants.forEach((n, j) => {
      const row = j % 3, px = -840 + Math.floor(j / 1) * 150 + row * 30, py = 150 + row * 120;
      const passT = Lin('L10').inicio - 0.55 + ((px + 880 + 360) / 1700) * (tLv + 0.6 - Lin('L10').inicio + 0.55);
      const g = pop(tq, passT + 0.3 + row * 0.05, 0.4, 2.4);
      if (g > 0) place(ctx, n, px, py, Z({ s: 0.75 * g, ay: 0.95, rot: sway(tq, j, 0.04, 0.6) }));
    });
    if (tq > tBf) X.tag(ctx, 'biofertilizante', -600, -250, { size: 60, seed: 41, rot: -0.04, s: pop(tq, tBf), zoom: rc.zoom, boil: rc.boil, font: 'Caveat Brush', tape: 'pin', pinColor: PAL.verde });
    if (tq > tLv) X.tag(ctx, 'pra lavoura', 20, -300, { size: 56, seed: 42, rot: 0.05, s: pop(tq, tLv), zoom: rc.zoom, boil: rc.boil, tape: 'pin', pinColor: PAL.amarelo });
    ctx.restore();
  }
  let ROWS;
  function cuesLavoura() {
    sfx(Lin('L10').inicio - 0.55, 'trator', { g: 0.5, pan: -0.5, dur: 3.6 });
    sfx(at('L10', 'biofertilizante') - 0.1, 'spray', { g: 0.4, pan: 0, dur: 1.6 });
    for (let j = 0; j < 12; j++) sfx(at('L10', 'sobra') + 0.4 + j * 0.24, 'broto', { g: 0.4, pan: -0.6 + j * 0.1, p: 0.8 + (j % 6) * 0.1 });
    sfx(at('L10', 'fechando') - 0.1, 'ciclo', { g: 0.5, dur: 2.4 });
  }

  // ---------- FINAL: título, frase e logo (em tela) ----------
  // legendas "queimadas" (versão para redes sociais): lidas do .vtt gerado a partir do alinhamento
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
    const cs = FMT === 'v' ? 42 : 44;
    ctx.font = `500 ${cs}px "Neulis Sans", "Kalam", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = c.txt.split('\n');
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 56, lh = cs * 1.27, h = lines.length * lh + 26;
    const y = H - (FMT === 'v' ? 420 : 74) - h / 2;
    ctx.fillStyle = 'rgba(20,32,39,0.84)';
    ctx.beginPath(); ctx.roundRect(Wd / 2 - w / 2, y - h / 2, w, h, 14); ctx.fill();
    ctx.fillStyle = '#fbf8f0';
    lines.forEach((l, i) => ctx.fillText(l, Wd / 2, y + (i - (lines.length - 1) / 2) * lh + 2));
    ctx.restore();
  }
  function overlay(rc) {
    const { ctx, t, tq, W: Wd, H } = rc;
    drawCaptions(rc);
    if (t < FINALE + 1.2) return;
    const V = FMT === 'v', fs = V ? 0.72 : 1;
    const tB = at('L11', 'Biogás'), tBm = at('L11', 'biometano'), tO = at('L11', 'o'), tLogo = TL.musica.logo;
    const dim = clamp((t - tLogo + 0.1) / 0.5);
    // título
    const cxs = Wd / 2, cys = H / 2 - 40;
    FTITLE1.forEach((l, i) => { const p = pop(tq, tB - 0.1 + i * 0.06, 0.3, 2.6); if (p > 0) SP.place(ctx, l.spr, cxs + l.x * fs, cys - 150 * fs + l.y * fs, { rot: l.rot, s: p * fs, lift: (1 - p) * 0.9 }); });
    FTITLE2.forEach((l, i) => { const p = pop(tq, tBm - 0.1 + i * 0.05, 0.3, 2.6); if (p > 0) SP.place(ctx, l.spr, cxs + l.x * fs, cys + 20 * fs + l.y * fs, { rot: l.rot, s: p * fs, lift: (1 - p) * 0.9 }); });
    // frase escrita à mão numa tira de papel
    const wp = clamp((t - tO + 0.05) / (endOf('L11', 'amanhã') - tO + 0.1));
    if (wp > 0) {
      const sIn = pop(tq, tO - 0.2, 0.35);
      ctx.save(); ctx.translate(cxs, cys + (V ? 215 : 225)); ctx.rotate(-0.012); ctx.scale(sIn, sIn);
      if (V) {   // 9:16: a frase quebra em duas linhas numa tira mais alta
        SP.piece(ctx, S.tear(S.cut([[-440, -92], [440, -88], [436, 92], [-444, 90]], { seed: 3 }), { amp: 3, seed: 4 }), { color: PAL.papel, kind: 'smooth', seed: 5, shadow: { zoom: 1 }, edge: 0.15 });
        T.hand(ctx, 'o resíduo de hoje é\na energia de amanhã!', 0, 0, { size: 66, font: 'Caveat', weight: 700, color: PAL.verdeEsc, progress: wp, boil: rc.boil });
      } else {
        SP.piece(ctx, S.tear(S.cut([[-640, -52], [640, -48], [636, 52], [-644, 50]], { seed: 3 }), { amp: 3, seed: 4 }), { color: PAL.papel, kind: 'smooth', seed: 5, shadow: { zoom: 1 }, edge: 0.15 });
        T.hand(ctx, 'o resíduo de hoje é a energia de amanhã!', 0, 0, { size: 66, font: 'Caveat', weight: 700, color: PAL.verdeEsc, progress: wp, boil: rc.boil });
      }
      ctx.restore();
    }
    // cartão do logo na batida final
    if (dim > 0) {
      ctx.save(); ctx.globalAlpha = 0.55 * dim; ctx.fillStyle = '#1b2a33'; ctx.fillRect(0, 0, Wd, H); ctx.restore();
      const p = pop(tq, tLogo - 0.04, 0.45, 1.5);
      const [cw, ch, lwMax] = V ? [900, 470, 700] : [1100, 520, 860];
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
      // fita crepe segurando o cartão (fora do logo)
      if (p > 0.9) { SP.tape(ctx, Wd / 2 - cw / 2 + 40, H / 2 - ch / 2 + 10, 150, 46, -0.6, { seed: 3 }); SP.tape(ctx, Wd / 2 + cw / 2 - 40, H / 2 + ch / 2 - 10, 150, 46, -0.6, { seed: 5 }); }
    }
  }
  function cuesFinal() {
    const tB = at('L11', 'Biogás'), tBm = at('L11', 'biometano');
    for (let i = 0; i < 8; i++) sfx(tB - 0.1 + i * 0.06 + 0.08, 'letra', { g: 0.45, pan: -0.3 + i * 0.08, p: 0.9 + i * 0.05 });
    for (let i = 0; i < 9; i++) sfx(tBm - 0.1 + i * 0.05 + 0.08, 'letra', { g: 0.45, pan: -0.3 + i * 0.07, p: 1.0 + i * 0.05 });
    sfx(at('L11', 'o') - 0.1, 'rabisco', { g: 0.3, dur: endOf('L11', 'amanhã') - at('L11', 'o') + 0.1 });
    sfx(TL.musica.logo - 0.04, 'logo', { g: 0.8 });
  }
  function cuesTitulo() {
    sfx(0.02, 'papel_desliza', { g: 0.8 });
    sfx(0.22, 'papel_pousa', { g: 0.8, p: 0.7 });
    sfx(0.3, 'papel_desliza', { g: 0.4, p: 1.3 });
    const t1 = at('L01', 'O'), tb = at('L01', 'biogás');
    for (let i = 0; i < 5; i++) sfx(t1 - 0.12 + i * 0.07 + 0.08, 'letra', { g: 0.4, p: 1.1 + i * 0.05 });
    for (let i = 0; i < 7; i++) sfx(tb - 0.1 + i * 0.075 + 0.1, 'letra', { g: 0.6, p: 0.85 + i * 0.05 });
    sfx(at('L01', 'E') - 0.05, 'rabisco', { g: 0.35, dur: endOf('L01', 'biometano') - at('L01', 'E') + 0.1 });
    sfx(0.95, 'boing', { g: 0.35, pan: 0.6, p: 1.4 });
    sfx(3.3, 'whoosh', { g: 0.6, dur: 0.9 });
  }

  // ---------- montagem ----------
  const scene = {
    duration: 57,
    boilFps: 8,
    async init(base = '', tlName = 'timeline.json', captions = null, opts = {}) {
      FMT = opts.formato === 'vertical' || opts.formato === 'v' ? 'v' : 'h';
      MARCA = opts.marca !== false;
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
      BAR = TL.musica.compasso; DB0 = TL.musica.downbeat0; BEAT = TL.musica.periodo;
      const R = G.COLAGEM_ROOT || '../..';
      const A = (n) => `${R}/assets/recortes/${n}.png`;
      const names = ['vaca', 'esterco', 'banana', 'maca', 'ovos', 'cenoura', 'alface_folha', 'laranja', 'cana_feixe', 'palha', 'milho_espiga', 'sol', 'nuvem_grande', 'nuvem_pequena',
        'maquina', 'gerador', 'lampada', 'casa_amarela', 'casa_verde', 'casa_marrom', 'fabrica', 'bomba', 'onibus', 'trator', 'muda', 'cana_planta', 'milho_planta', 'alface_pe', 'tomateiro', 'laboratorio',
        'v3/biodigestor', 'v3/fogao', 'v3/caminhao', 'v3/sol_nuvens', 'v3/broto'];
      const map = Object.fromEntries(names.map((n) => [n, A(n)]));
      map.logo = `${R}/assets/brand/cp2b-logo.svg`;
      await X.loadImages(map);
      buildBackdrops(); buildDecor(); buildTitle(); buildCamera();
      STAMP_O2 = T.stamp('o2', 'SEM O₂!', { size: 70, color: '#c8372d' });
      STAMP_REN = T.stamp('ren', 'RENOVÁVEL', { size: 64, color: '#2f7d32' });
      BIOGAS_WORD = T.ransom('BIOGÁS!', { size: 150, seed: 19 });
      BIOMETANO_WORD = T.ransom('BIOMETANO', { size: 150, seed: 23 });
      ROWS = [0, 1, 2].map((k) => S.cut([[-1000, 150 + k * 120], [1000, 140 + k * 120], [1000, 205 + k * 120], [-1000, 212 + k * 120]], { seed: 60 + k, jitter: 2, ds: 40 }));
      SFX.length = 0;
      cuesTitulo(); cuesSobras(); cuesDigestor(); cuesComposicao(); cuesQueima(); cuesPurificacao(); cuesUsos(); cuesLavoura(); cuesFinal();
      SFX.sort((a, b) => a.t - b.t);
    },
    camera,
    camSpeed,
    draw(rc) {
      ZOOM.v = rc.zoom;
      const vis = (i) => rc.t > FINALE + 0.35 || Math.hypot(ST[i].p[0] - rc.cam.x, ST[i].p[1] - rc.cam.y) < 1650;
      drawBackground(rc);
      drawDecor(rc);
      drawTrail(rc);
      drawCenter(rc);
      if (vis(0)) drawSobras(rc);
      if (vis(1)) drawDigestor(rc);
      if (vis(2)) drawComposicao(rc);
      if (vis(3)) drawQueima(rc);
      if (vis(4)) drawPurificacao(rc);
      if (vis(5)) drawUsos(rc);
      if (vis(6)) drawLavoura(rc);
      drawFlyers(rc);
    },
    overlay,
    // marca-d'água CP2B no canto, por cima do grão (sai antes do título final)
    hud(rc) {
      if (!MARCA) return;
      X.watermark(rc.ctx, rc.W, rc.H, rc.t, FMT === 'v' ? { w: 170, y: 250, margin: 40, t1: at('L11', 'Biogás') - 0.45 } : { w: 190, t1: at('L11', 'Biogás') - 0.45 });
    },
    sfx: () => SFX,
    timeline: () => TL,
  };
  G.CENA = scene;
})(window);
