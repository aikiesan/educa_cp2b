/* Colagem — efeitos desenhados em código para o episódio genérico (itens { "fx": … } do cena.json)
 * e molduras de formato (vhs, vlog, tv, palco, game, relógio, cronômetro). */
(function (G) {
  'use strict';
  const C = G.Colagem;
  const { shapes: S, sprite: SP, ink: I, text: T, paper: P, extras: X, core } = C;
  const { E, clamp, lerp, hrand, R: RNG, TAU, shade } = core;
  const INK = SP.INK;

  const geoOf = (tg) => (tg ? (tg.geo ? { cx: tg.geo.cx, cy: tg.geo.cy, w: tg.geo.dw, h: tg.geo.dh } : tg.box ? { cx: tg.box.cx, cy: tg.box.cy, w: tg.box.w * 0.8, h: tg.box.h * 0.8 } : null) : null);
  const inkFor = (info, it) => info.cor(it.cor, info.EST.tinta);
  function edgePoint(g, tx, ty, k = 0.46) {
    const dx = tx - g.cx, dy = ty - g.cy, d = Math.hypot(dx, dy) || 1;
    const rx = g.w * k, ry = g.h * k;
    const s = 1 / Math.max(Math.abs(dx) / rx, Math.abs(dy) / ry, 1e-6);
    return [g.cx + dx * Math.min(s, 1), g.cy + dy * Math.min(s, 1)];
  }

  function prep(it, sc, info) {
    it.fxd = it.fxd || {};
    const d = it.fxd;
    d.rr = RNG(it.seed);
    if (it.fx === 'molecula' || it.fx === 'microbio' || it.fx === 'estrela') {
      const n = it.n ?? 1, b = it.box;
      d.pts = [];
      const cols = Math.ceil(Math.sqrt(n * b.w / Math.max(1, b.h))), rows = Math.ceil(n / cols);
      for (let i = 0; i < n; i++) {
        const c = i % cols, r = Math.floor(i / cols);
        d.pts.push([b.x0 + (c + 0.5) * b.w / cols + d.rr.sym(b.w / cols * 0.18), b.y0 + (r + 0.5) * b.h / rows + d.rr.sym(b.h / rows * 0.18), d.rr.range(0.85, 1.15), d.rr.range(0, TAU)]);
      }
      d.cell = Math.min(b.w / cols, b.h / rows);
    }
    if (it.t1fx == null && (it.ate || it.sai)) it.t1fx = info.tEm(it.ate ?? it.sai.em ?? it.sai, 1e9);
    if (it.fx === 'cano') {   // cano com caminho próprio ("pts"/"ptsV" em frações do quadro, a partir do centro da caixa) e fluxo com hora marcada
      const b = it.box, V = info.FMT === 'v', pts = (V && it.ptsV) || it.pts;
      if (pts) d.pts = pts.map((p) => [b.cx + p[0] * b.w, b.cy + p[1] * b.h]);
      d.tf = it.fluxoEm != null ? info.tEm(it.fluxoEm, null) : null;
      d.tfa = it.fluxoAte != null ? info.tEm(it.fluxoAte, null) : null;
    }
    if (it.fx === 'metro') {   // mapa de metrô: caminhos em px e tempos (uma vez por formato)
      const M = (d.metro = {}), b = it.box, W = b.w, H = b.h, V = info.FMT === 'v';
      const px = (p) => [b.cx + p[0] * W, b.cy + p[1] * H];
      M.linhas = (it.linhas || []).map((ln) => {
        const pts = ((V && ln.ptsV) || ln.pts).map(px);
        const seg = []; let L0 = 0;
        for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L0 += l; }
        const acc = [0]; for (const l of seg) acc.push(acc[acc.length - 1] + l);
        return { ...ln, P: pts, seg, acc, L: L0, t0: info.tEm(ln.em, 0), t1: info.tEm(ln.em, 0) + (ln.dur ?? 1.2) };
      });
      M.tf = it.fantasma ? info.tEm(it.fantasma, null) : null;
      M.tc = it.centro ? info.tEm(it.centro, null) : null;
      M.tv = it.volta ? info.tEm(it.volta, null) : null;
      M.tb = it.brilha ? info.tEm(it.brilha, null) : null;
    }
    if (it.fx === 'celular') d.msgs = (it.msgs || []).map((m) => ({ ...m, t: info.tEm(m.em, 0), tr: m.reacao != null ? info.tEm(m.reacao, null) : null }));
  }

  // ---------- desenhos ----------
  function heart(r) {
    const pts = [];
    for (let k = 0; k < 64; k++) {
      const a = (k / 64) * TAU;
      pts.push([16 * Math.sin(a) ** 3 * r / 17, -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * r / 17]);
    }
    return pts;
  }
  function padlock(ctx, x, y, r, col, rc) {
    I.stroke(ctx, (() => { const p = []; for (let a = Math.PI; a <= TAU; a += 0.15) p.push([x + Math.cos(a) * r * 0.55, y - r * 0.2 + Math.sin(a) * r * 0.7]); return p; })(), { w: r * 0.16, color: col, seed: 3, boil: rc.boil });
    SP.piece(ctx, S.rrect(x - r * 0.8, y - r * 0.25, r * 1.6, r * 1.25, r * 0.18, { seed: 5 }), { color: '#f2c14e', seed: 5, ink: { w: 3, boil: rc.boil }, shadow: { zoom: rc.zoom } });
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x, y + r * 0.2, r * 0.14, 0, TAU); ctx.fill(); ctx.fillRect(x - r * 0.05, y + r * 0.22, r * 0.1, r * 0.35);
  }
  function clockFace(ctx, x, y, r, a1, a2, rc) {
    SP.piece(ctx, S.blob(x, y, r, r, { seed: 9, wobble: 0.02, n: 60 }), { color: '#fbf8f0', seed: 9, ink: { w: Math.max(3, r * 0.06), boil: rc.boil }, shadow: { zoom: rc.zoom }, border: { w: 6 } });
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, r * 0.04, 0, TAU); ctx.fill(); }
    I.stroke(ctx, [[x, y], [x + Math.cos(a1) * r * 0.5, y + Math.sin(a1) * r * 0.5]], { w: r * 0.09, color: INK, seed: 2, boil: rc.boil });
    I.stroke(ctx, [[x, y], [x + Math.cos(a2) * r * 0.72, y + Math.sin(a2) * r * 0.72]], { w: r * 0.05, color: '#e4572e', seed: 4, boil: rc.boil });
  }

  function drawBonde(ctx, e, col, LW, info, rc, comMet) {   // bondinho de papel na ponta da linha do metrô (o Metaninho vai em cima)
    const esq = Math.cos(e.ang) < 0;
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(esq ? e.ang - Math.PI : e.ang); if (esq) ctx.scale(-1, 1);
    const Lb = LW * 4.6, Hb = LW * 2.4;
    SP.setShadow(ctx, rc.zoom, 0.5, 0.9);
    ctx.fillStyle = '#fbf8f0'; ctx.beginPath(); ctx.roundRect(-Lb * 0.8 - 4, -Hb / 2 - 4, Lb + 8, Hb + 8, Hb * 0.45); ctx.fill(); SP.clearShadow(ctx);
    ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(-Lb * 0.8, -Hb / 2, Lb, Hb, Hb * 0.42); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.roundRect(-Lb * 0.7 + i * Lb * 0.24, -Hb * 0.28, Lb * 0.17, Hb * 0.42, 4); ctx.fill(); }
    ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.arc(Lb * 0.14, 0, Hb * 0.16, 0, TAU); ctx.fill();
    ctx.restore();
    if (comMet) {
      const im = info.imgOf('mascote:acena');
      if (im) { const h = LW * 4.4, s = h / im.height; ctx.save(); ctx.translate(e.x, e.y - LW * 0.9); ctx.rotate(Math.sin(rc.t * 9) * 0.06); SP.setShadow(ctx, rc.zoom * s, 0.3, 0.8); ctx.drawImage(im, -im.width * s / 2, -h, im.width * s, h); SP.clearShadow(ctx); ctx.restore(); }
    }
  }

  function draw(rc, sc, it, en, info) {
    const { ctx, t, tq } = rc;
    const b = it.box, d = it.fxd || {};
    if (!b) return;
    const PAL = info.PAL;
    const dt = t - it.t0;
    const on = en.p;
    const fim = it.t1fx ?? 1e9;
    if (t > fim + 0.4) return;
    const fadeOut = 1 - clamp((t - fim) / 0.4);
    ctx.save();
    ctx.globalAlpha *= fadeOut;
    const ink = inkFor(info, it);
    const tg = it.de ? geoOf(sc.byId[it.de]) : null, tg2 = it.para ? geoOf(sc.byId[it.para]) : null;
    switch (it.fx) {
      case 'bolhas': {
        const n = it.n ?? 8, sp = it.vel ?? 0.45, rB = (it.r ?? Math.min(b.w, b.h) * 0.07);
        for (let i = 0; i < n; i++) {
          const ph = dt * sp + i / n;
          if (ph < i / n) continue;
          const q = ph % 1, born = clamp((dt - i / n / sp) / 0.25);
          const x = b.cx + Math.sin(ph * TAU * 0.7 + i * 1.9) * b.w * 0.28 + (hrand(i, it.seed) - 0.5) * b.w * 0.4;
          const y = b.y1 - q * b.h;
          const r = rB * (0.55 + 0.6 * hrand(i, it.seed + 1)) * (0.7 + 0.5 * q) * born;
          if (r > 1) X.bubble(ctx, x, y, r, { alpha: 0.95 * (1 - clamp((q - 0.8) / 0.2)), seed: i + it.seed, tint: it.tinta ? info.cor(it.tinta) : undefined });
        }
        break;
      }
      case 'chama': {
        if (on <= 0) break;
        const h = b.h * 0.9 * E.outBack(on, 1.8) * (it.s ?? 1);
        X.flame(ctx, b.cx, b.y1, h, { blue: it.azul !== false, pose: rc.pose, seed: it.seed, zoom: rc.zoom });
        break;
      }
      case 'molecula': {
        const kind = it.tipo || 'CH4';
        const k = Math.min(1.45, (d.cell || Math.min(b.w, b.h)) / 118) * (it.s ?? 1);   // teto: moléculas legíveis, nunca gigantes
        d.pts.forEach(([x, y, sz, ph], i) => {
          const p = E.outBack(clamp((tq - it.t0 - i * 0.12) / 0.35), 2);
          if (p <= 0) return;
          const rise = it.sobe ? -((t - it.t0 - i * 0.12) * (it.vel ?? 90)) % (b.h * 1.2) : 0;
          const yy = y + Math.sin(t * 2.2 + ph) * 10 + rise, xx = x + Math.sin(t * 1.3 + ph * 2) * 8;
          X.molecule(ctx, kind, xx, yy, k * sz * p, { rot: Math.sin(t * 0.9 + ph) * 0.35 + ph * 0.2, face: it.rosto !== false, mood: it.humor || 'feliz', boil: rc.boil, zoom: rc.zoom, blink: hrand(Math.floor(t * 2), i) < 0.06 });
        });
        break;
      }
      case 'microbio': {
        const k = Math.min(88, (d.cell || Math.min(b.w, b.h)) * 0.3) * (it.s ?? 1);
        const cols = it.cores ? it.cores.map((c) => info.cor(c)) : [PAL.lima, PAL.coral, PAL.amarelo, PAL.ceu, '#9fd18b'];
        d.pts.forEach(([x, y, sz, ph], i) => {
          const p = E.outBack(clamp((tq - it.t0 - i * 0.1) / 0.35), 2);
          if (p <= 0) return;
          const hum = it.humor || 'feliz';
          const mouth = hum === 'comendo' ? 0.2 + 0.5 * Math.abs(Math.sin(t * 7 + ph)) : hum === 'enjoado' ? 0.02 : hum === 'fome' ? 0.12 : 0.55;
          X.microbe(ctx, x + Math.sin(t * 1.7 + ph) * 9, y + Math.cos(t * 1.4 + ph) * 7, k * sz * p, { color: cols[i % cols.length], kind: it.tipo === 'bastao' || (it.tipo == null && i % 2) ? 'rod' : undefined, mouth, look: [Math.sin(t * 0.8 + ph) * 0.6, 0.4], phase: t * 1.2 + ph, seed: it.seed + i, zoom: rc.zoom, boil: rc.boil, rot: Math.sin(t + ph) * 0.2, hat: it.chapeu });
          if (hum === 'enjoado' && p >= 1) I.wavy(ctx, x + k * 0.9, y - k * 1.2, k * 0.8, { amp: 5, waves: 1.5, phase: t * 3 + i, w: 3, color: '#5ca032', seed: i });
        });
        break;
      }
      case 'seta': case 'tracejado': {
        const p0 = tg ? edgePoint(tg, tg2 ? tg2.cx : b.cx, tg2 ? tg2.cy : b.cy) : [b.x0, b.cy];
        const p1 = tg2 ? edgePoint(tg2, tg ? tg.cx : b.cx, tg ? tg.cy : b.cy) : [b.x1, b.cy];
        const prog = clamp(dt / (it.dur ?? 0.55));
        if (prog <= 0) break;
        if (it.fx === 'seta') I.arrow(ctx, p0, p1, { progress: prog, w: it.w ?? 7, color: ink, bend: it.curva ?? 0.2, seed: it.seed, boil: rc.boil, head: 34 });
        else { const mx = (p0[0] + p1[0]) / 2, my = Math.min(p0[1], p1[1]) - Math.abs(p1[0] - p0[0]) * 0.25; const pts = []; for (let k = 0; k <= 30; k++) { const u = k / 30; pts.push([(1 - u) ** 2 * p0[0] + 2 * u * (1 - u) * mx + u * u * p1[0], (1 - u) ** 2 * p0[1] + 2 * u * (1 - u) * my + u * u * p1[1]]); } I.dashed(ctx, pts, { progress: prog, w: it.w ?? 6, color: info.cor(it.cor, '#4a3322'), dash: 22, gap: 16, seed: it.seed, boil: rc.boil }); }
        break;
      }
      case 'ciclo': {
        const ids = it.itens || [];
        const gs = ids.map((id) => geoOf(sc.byId[id])).filter(Boolean);
        const n = gs.length;
        if (n >= 2) {
          for (let i = 0; i < n; i++) {
            const a = gs[i], c = gs[(i + 1) % n];
            const prog = clamp((dt - i * (it.passo ?? 0.35)) / 0.45);
            if (prog <= 0) continue;
            I.arrow(ctx, edgePoint(a, c.cx, c.cy, 0.55), edgePoint(c, a.cx, a.cy, 0.55), { progress: prog, w: it.w ?? 8, color: ink, bend: 0.32, seed: it.seed + i, boil: rc.boil, head: 36 });
          }
        } else {
          const r = Math.min(b.w, b.h) * 0.42;
          for (let i = 0; i < 4; i++) {
            const prog = clamp((dt - i * 0.3) / 0.4);
            if (prog <= 0) continue;
            const a0 = i / 4 * TAU - Math.PI / 2 + 0.25, a1 = a0 + TAU / 4 - 0.5;
            const pts = []; for (let k = 0; k <= 16; k++) { const a = lerp(a0, a1, k / 16 * prog); pts.push([b.cx + Math.cos(a) * r, b.cy + Math.sin(a) * r]); }
            I.stroke(ctx, pts, { w: it.w ?? 9, color: ink, seed: it.seed + i, boil: rc.boil });
            if (prog >= 1) I.arrow(ctx, pts[pts.length - 2], pts[pts.length - 1], { progress: 1, w: it.w ?? 9, color: ink, bend: 0, seed: i, head: 34 });
          }
        }
        break;
      }
      case 'brilho': {
        const g = tg || { cx: b.cx, cy: b.cy, w: b.w, h: b.h };
        for (let k = 0; k < (it.n ?? 5); k++) {
          const s = E.outBack(clamp((tq - it.t0 - k * 0.07) / 0.25), 2) * (0.75 + 0.25 * Math.sin(t * 6 + k));
          if (s <= 0) continue;
          const a = hrand(k, it.seed) * TAU, rr = 0.5 + 0.12 * hrand(k, it.seed + 1);
          I.sparkle(ctx, g.cx + Math.cos(a) * g.w * rr, g.cy + Math.sin(a) * g.h * rr, 26 * s * (it.s ?? 1), { w: 6, color: [PAL.amarelo, PAL.coral, PAL.lima][k % 3], seed: k + it.seed, boil: rc.boil });
        }
        break;
      }
      case 'confete':
        X.confetti(ctx, t, it.t0, b.cx, b.cy + b.h * 0.2, { n: it.n ?? 34, spread: 1.3, speed: Math.max(520, b.h * 1.4), seed: it.seed, life: 2.4, size: 16 });
        break;
      case 'cheiro': {
        if (on <= 0) break;
        const g = tg || { cx: b.cx, cy: b.cy + b.h * 0.3, w: b.w, h: b.h * 0.2 };
        for (let k = 0; k < 3; k++) I.wavy(ctx, g.cx + (k - 1) * g.w * 0.22, g.cy - g.h * 0.55, Math.min(b.h, 220) * on, { amp: 9, waves: 2.2, phase: t * 3.2 + k, w: 5, color: info.cor(it.cor, '#7c8b3a'), seed: k + it.seed, angle: -Math.PI / 2 });
        break;
      }
      case 'mosca': if (on > 0) X.fly(ctx, b.cx, b.cy, t, { r: Math.min(b.w, b.h) * 0.3, speed: 2.4 }); break;
      case 'circulo': {   // jogo dos 7 erros: círculo de caneta vermelha desenhado aos poucos, com a caneta na ponta e o número da diferença
        const p = clamp(dt / (it.dur ?? 0.5)); if (p <= 0) break;
        const rx = b.w / 2, ry = b.h / 2, N = 72, a0 = -Math.PI * 0.62 + (it.seed % 7) * 0.05, voltas = 1.1, q = E.inOutSine(p);
        const pts = [];
        for (let i = 0; i <= Math.ceil(N * q); i++) { const a = a0 + (Math.min(i, N * q) / N) * TAU * voltas, w = 1 + 0.035 * Math.sin(a * 3 + it.seed) + 0.03 * (a - a0) / TAU; pts.push([b.cx + Math.cos(a) * rx * w, b.cy + Math.sin(a) * ry * w]); }
        const cor = info.cor(it.cor, '#d7263d'), lw = it.w ?? Math.max(6, Math.min(b.w, b.h) * 0.05);
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(251,248,240,0.75)'; ctx.lineWidth = lw * 1.8; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
        ctx.strokeStyle = cor; ctx.lineWidth = lw; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
        if (p < 1 && it.caneta !== false && pts.length) {   // a caneta vermelha na ponta do traço
          const [x, y] = pts[pts.length - 1], L = Math.max(60, Math.min(b.w, b.h) * 0.42), W2 = L * 0.24;
          ctx.save(); ctx.translate(x, y); ctx.rotate(-0.75);
          SP.setShadow(ctx, rc.zoom, 0.5, 0.9);
          ctx.fillStyle = '#fbf8f0'; ctx.beginPath(); ctx.roundRect(-W2 / 2 - 3, -L - 3, W2 + 6, L * 0.86 + 6, W2 * 0.4); ctx.fill(); SP.clearShadow(ctx);
          ctx.fillStyle = cor; ctx.beginPath(); ctx.roundRect(-W2 / 2, -L, W2, L * 0.86, W2 * 0.35); ctx.fill();
          ctx.fillStyle = '#1b2a33'; ctx.fillRect(-W2 / 2, -L * 0.5, W2, L * 0.08);
          ctx.fillStyle = '#e8e1d0'; ctx.beginPath(); ctx.moveTo(-W2 / 2, -L * 0.14); ctx.lineTo(W2 / 2, -L * 0.14); ctx.lineTo(W2 * 0.12, 0); ctx.lineTo(-W2 * 0.12, 0); ctx.closePath(); ctx.fill();
          ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(0, -2, W2 * 0.14, 0, TAU); ctx.fill();
          ctx.restore();
        }
        if (it.num != null && p > 0.8) {   // número da diferença numa bolacha vermelha, no alto à direita
          const k2 = E.outBack(clamp((p - 0.8) / 0.2), 2.2), r = (it.nr ?? Math.max(20, Math.min(b.w, b.h) * 0.13)) * k2;
          const x = b.cx + rx * 0.8, y = b.cy - ry * 0.86;
          ctx.fillStyle = '#fbf8f0'; ctx.beginPath(); ctx.arc(x, y, r * 1.18, 0, TAU); ctx.fill();
          ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
          ctx.fillStyle = '#fbf8f0'; ctx.font = `700 ${r * 1.15}px "Archivo Black", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(it.num), x, y + r * 0.06);
        }
        break;
      }
      case 'cano': {
        if (d.pts) {   // caminho próprio; "vidro": tubo transparente (a bolota aparece passando por dentro)
          const fl = d.tf != null ? (t >= d.tf && (d.tfa == null || t < d.tfa) ? t : undefined) : it.fluxo !== false && dt > 0.7 ? t : undefined;
          if (it.vidro) ctx.globalAlpha *= 0.68;
          X.pipe(ctx, d.pts, { w: it.w ?? 34, color: info.cor(it.cor, it.vidro ? '#bfe3ee' : PAL.petrol), progress: clamp(dt / (it.dur ?? 0.7)), flow: fl, flowColor: info.cor(it.fluxoCor, PAL.lima), flanges: !it.vidro, zoom: rc.zoom, t, flowSpeed: it.vel, flowGap: it.gap });
          break;
        }
        const p0 = tg ? [tg.cx + tg.w * (it.saida?.[0] ?? 0.45) * (tg2 && tg2.cx < tg.cx ? -1 : 1), tg.cy + tg.h * (it.saida?.[1] ?? 0.2)] : [b.x0, b.cy];
        const p1 = tg2 ? [tg2.cx - tg2.w * 0.45 * (tg && tg2.cx < tg.cx ? -1 : 1), tg2.cy + tg2.h * (it.chegada ?? 0.2)] : [b.x1, b.cy];
        const my = Math.max(p0[1], p1[1]) + (it.baixo ?? 60);
        const pts = [p0, [p0[0], my], [p1[0], my], p1];
        X.pipe(ctx, pts, { w: it.w ?? 34, color: info.cor(it.cor, PAL.petrol), progress: clamp(dt / 0.7), flow: it.fluxo !== false && dt > 0.7 ? t : undefined, flowColor: info.cor(it.fluxoCor, PAL.lima), zoom: rc.zoom, t });
        break;
      }
      case 'raios': if (on > 0) I.rays(ctx, b.cx, b.cy, Math.min(b.w, b.h) * 0.36 * on, Math.min(b.w, b.h) * 0.62 * on, it.n ?? 14, { w: 8, color: info.cor(it.cor, PAL.amarelo), rot: t * 0.3, seed: it.seed, boil: rc.boil }); break;
      case 'engrenagem': {
        if (on <= 0) break;
        const r = Math.min(b.w, b.h) * 0.3 * E.outBack(on, 1.6);
        X.gearPiece(ctx, b.cx - r * 0.55, b.cy, r, 12, t * 1.4, info.cor(it.cor, PAL.ambar), { zoom: rc.zoom });
        X.gearPiece(ctx, b.cx + r * 0.95, b.cy - r * 0.6, r * 0.62, 8, -t * 2.2 + 0.2, PAL.petrol, { zoom: rc.zoom });
        break;
      }
      case 'relogio': {
        if (on <= 0) break;
        const r = Math.min(b.w, b.h) * 0.42 * E.outBack(on, 2);
        const v = it.vel ?? (it.rapido ? 9 : 0.4);
        if (it.meiodia) {   // os ponteiros correm e param no meio-dia
          const q = E.outCubic(clamp(dt / (it.dur ?? 1.0)));
          clockFace(ctx, b.cx, b.cy, r, -Math.PI / 2 + TAU * (2 / 12) * (q - 1), -Math.PI / 2 + TAU * 2 * (q - 1), rc);
          break;
        }
        clockFace(ctx, b.cx, b.cy, r, -Math.PI / 2 + dt * v / 12, -Math.PI / 2 + dt * v, rc);
        break;
      }
      case 'termometro': {
        if (on <= 0) break;
        const h = b.h * 0.8, w = Math.max(40, h * 0.16), x = b.cx, y0 = b.cy - h / 2;
        SP.piece(ctx, S.rrect(x - w / 2, y0, w, h * 0.86, w / 2, { seed: 4 }), { color: '#fbf8f0', seed: 4, ink: { w: 4, boil: rc.boil }, shadow: { zoom: rc.zoom } });
        const lvl = clamp(dt / (it.dur ?? 1.4)) * (it.nivel ?? 0.8);
        ctx.fillStyle = PAL.coral; ctx.fillRect(x - w * 0.22, y0 + h * 0.86 * (1 - lvl), w * 0.44, h * 0.86 * lvl);
        SP.piece(ctx, S.blob(x, y0 + h * 0.9, w * 0.8, w * 0.8, { seed: 6 }), { color: PAL.coral, seed: 6, ink: { w: 4, boil: rc.boil } });
        break;
      }
      case 'lente': {
        if (on <= 0) break;
        const r = Math.min(b.w, b.h) * 0.36;
        const path = it.caminho !== false ? E.outCubic(clamp(dt / 0.8)) : 1;
        const x = lerp(b.cx - b.w * 0.5, b.cx, path), y = lerp(b.cy + b.h * 0.3, b.cy, path);
        X.lens(ctx, x, y, r * E.outBack(on, 1.4), (g) => {
          g.fillStyle = info.cor(it.fundo, '#6b4a2e'); g.fillRect(-r, -r, 2 * r, 2 * r);
          const n = it.n ?? 4;
          for (let i = 0; i < n; i++) {
            const a = i / n * TAU + t * 0.4, rr = r * 0.42;
            X.microbe(g, Math.cos(a) * rr * (i % 2 ? 0.4 : 1), Math.sin(a) * rr * 0.8, r * 0.22, { color: [PAL.lima, PAL.coral, PAL.amarelo, PAL.ceu][i % 4], mouth: it.humor === 'comendo' ? 0.2 + 0.5 * Math.abs(Math.sin(t * 7 + i)) : 0.5, phase: t + i, seed: i + 3, kind: i % 2 ? 'rod' : undefined, zoom: rc.zoom, boil: rc.boil });
          }
          if (it.bolhas) for (let k = 0; k < 5; k++) { const q = (t * 0.5 + k / 5) % 1; X.bubble(g, (hrand(k, 3) - 0.5) * r, r - q * 2 * r, r * 0.08, { seed: k }); }
        }, { zoom: rc.zoom, handle: it.cabo ?? 0.85 });
        break;
      }
      case 'grafico': {
        const hs = it.alturas || [0.35, 0.55, 0.8, 1];
        const n = hs.length, bw = b.w * 0.7 / n;
        I.stroke(ctx, [[b.x0 + b.w * 0.08, b.y0 + b.h * 0.05], [b.x0 + b.w * 0.08, b.y1 - b.h * 0.08], [b.x1 - b.w * 0.05, b.y1 - b.h * 0.08]], { w: 5, color: ink, seed: it.seed, boil: rc.boil });
        hs.forEach((hh, i) => {
          const g = E.outBack(clamp((dt - i * 0.15) / 0.5), 1.4);
          if (g <= 0) return;
          const hpx = (b.h * 0.82) * hh * g, x0 = b.x0 + b.w * 0.14 + i * (bw + b.w * 0.2 / n);
          SP.piece(ctx, S.rrect(x0, b.y1 - b.h * 0.08 - hpx, bw, hpx, 6, { seed: it.seed + i }), { color: [PAL.lima, PAL.verde, PAL.ambar, PAL.ceu, PAL.coral][i % 5], seed: it.seed + i, ink: { w: 3, boil: rc.boil }, shadow: { zoom: rc.zoom } });
        });
        break;
      }
      case 'cadeado': if (on > 0) padlock(ctx, b.cx, b.cy, Math.min(b.w, b.h) * 0.35 * E.outBack(on, 2), ink, rc); break;
      case 'mapa_sp': {   // mapa de papel de SP (645 municípios, malha IBGE): os municípios acendem do oeste para o leste
        const M = info.dados?.sp_mapa;
        if (!M || on <= 0) break;
        if (!d.paths) {
          d.paths = M.municipios.map((m) => { const p = new Path2D(); for (const ring of m.p) { p.moveTo(ring[0][0], ring[0][1]); for (let k = 1; k < ring.length; k++) p.lineTo(ring[k][0], ring[k][1]); p.closePath(); } return p; });
          const xs = M.municipios.map((m) => m.x); d.x0 = Math.min(...xs); d.x1 = Math.max(...xs);
          d.cont = new Path2D(); M.contorno.forEach((pt, k) => (k ? d.cont.lineTo(pt[0], pt[1]) : d.cont.moveTo(pt[0], pt[1]))); d.cont.closePath();
        }
        const sc0 = Math.min(b.w / 1600, b.h / 1068) * 0.96 * (it.s ?? 1) * E.outBack(on, 1.2);
        const idx = { total: 0, agr: 1, pec: 2, urb: 3 }[it.setor || 'agr'];
        const rampa = it.rampa || ['#efe6cf', '#dcebc4', '#b6e03b', '#7cb342', '#2f7d3a'];
        const dur = it.dur ?? 2.2;
        ctx.translate(b.cx, b.cy); ctx.scale(sc0, sc0);
        SP.setShadow(ctx, rc.zoom * sc0, 0.3, 1); ctx.fillStyle = it.papel || '#f3ead8'; ctx.fill(d.cont); SP.clearShadow(ctx);
        M.municipios.forEach((m, i) => {
          const qq = clamp((dt - 0.25 - ((m.x - d.x0) / (d.x1 - d.x0)) * dur - hrand(i, 7) * 0.25) / 0.3);
          if (qq <= 0) return;
          ctx.globalAlpha = qq * fadeOut; ctx.fillStyle = rampa[clamp(m.k[idx] | 0, 0, rampa.length - 1)]; ctx.fill(d.paths[i]);
        });
        ctx.globalAlpha = fadeOut;
        ctx.lineWidth = 0.7 / sc0; ctx.strokeStyle = 'rgba(27,42,51,0.22)'; for (const pth of d.paths) ctx.stroke(pth);
        ctx.lineWidth = 3.2 / sc0; ctx.strokeStyle = ink; ctx.lineJoin = 'round'; ctx.stroke(d.cont);
        break;
      }
      case 'coracao': {
        if (on <= 0) break;
        const r = Math.min(b.w, b.h) * 0.45 * E.outBack(on, 2) * (1 + 0.04 * Math.sin(t * 7));
        ctx.save(); ctx.translate(b.cx, b.cy);
        SP.piece(ctx, heart(r), { color: info.cor(it.cor, PAL.coral), seed: it.seed, ink: { w: 5, boil: rc.boil }, shadow: { zoom: rc.zoom, lift: 0.2 }, border: { w: 8 } });
        ctx.restore();
        break;
      }
      case 'estrela':
        d.pts.forEach(([x, y, sz, ph], i) => {
          const p = E.outBack(clamp((tq - it.t0 - i * 0.1) / 0.3), 2.2);
          if (p <= 0) return;
          const r = (d.cell || 120) * 0.32 * sz * p;
          SP.piece(ctx, S.star(x, y, r * 0.45, r, 5, { seed: it.seed + i }), { color: [PAL.amarelo, PAL.lima, PAL.coral][i % 3], seed: it.seed + i, ink: { w: 3, boil: rc.boil }, shadow: { zoom: rc.zoom }, border: { w: 5 } });
        });
        break;
      case 'gotas': {
        const src = tg ? [tg.cx + tg.w * (it.saida?.[0] ?? 0), tg.cy + tg.h * (it.saida?.[1] ?? 0.45)] : [b.cx, b.y0];
        const n = it.n ?? 4, fall = it.queda ?? b.h * 0.7, vel = it.vel ?? 0.9;
        for (let i = 0; i < n; i++) {
          const q = dt * vel - i / n;
          if (q < 0) continue;
          const u = q % 1, yy = src[1] + u * u * fall;
          const r = (it.r ?? 18) * (1 - u * 0.2);
          const pts = [];
          for (let k = 0; k < 28; k++) { const a = k / 28 * TAU, c = Math.cos(a); pts.push([r * Math.sin(a) * (c < 0 ? 1 + c * 0.55 : 1), c < 0 ? 1.8 * r * c : r * c]); }
          ctx.save(); ctx.translate(src[0], yy); ctx.globalAlpha *= 1 - clamp((u - 0.85) / 0.15);
          SP.piece(ctx, pts, { color: info.cor(it.cor, '#4a2c18'), seed: i, ink: { w: 2 } }); ctx.restore();
        }
        break;
      }
      case 'fumaca': {
        for (let i = 0; i < (it.n ?? 6); i++) {
          const q = ((dt * 0.5) + i / 6) % 1;
          if (dt < i * 0.12) continue;
          const r = (it.r ?? Math.min(b.w, b.h) * 0.18) * (0.5 + q);
          ctx.globalAlpha = (1 - q) * 0.8 * fadeOut;
          SP.piece(ctx, S.blob(b.cx + Math.sin(q * 5 + i) * 30 + q * b.w * 0.25, b.y1 - q * b.h, r, r * 0.8, { seed: i + it.seed }), { color: info.cor(it.cor, '#9aa3a8'), seed: i, edge: 0.1 });
        }
        break;
      }
      case 'estrada': {
        if (on <= 0) break;
        const w = b.w * E.outCubic(on), h = Math.max(60, b.h * 0.3);
        SP.piece(ctx, S.rrect(b.cx - w / 2, b.cy - h / 2, w, h, 10, { seed: it.seed }), { color: '#5d6468', seed: it.seed, shadow: { zoom: rc.zoom } });
        I.dashed(ctx, [[b.cx - w / 2 + 20, b.cy], [b.cx + w / 2 - 20, b.cy]], { dash: 40, gap: 30, w: 7, color: '#f3ead8', seed: 2, offset: -t * 160 });
        break;
      }
      case 'check': case 'xis': {
        const prog = clamp(dt / 0.35);
        if (prog <= 0) break;
        const r = Math.min(b.w, b.h) * 0.4;
        const col = it.fx === 'check' ? info.cor(it.cor, PAL.verde) : info.cor(it.cor, PAL.coral);
        if (it.fx === 'check') I.stroke(ctx, [[b.cx - r * 0.7, b.cy], [b.cx - r * 0.2, b.cy + r * 0.5], [b.cx + r * 0.8, b.cy - r * 0.6]].slice(0, prog < 0.5 ? 2 : 3), { w: r * 0.22, color: col, seed: it.seed, boil: rc.boil });
        else { I.stroke(ctx, [[b.cx - r * 0.6, b.cy - r * 0.6], [b.cx + r * 0.6, b.cy + r * 0.6]], { w: r * 0.2, color: col, seed: it.seed, boil: rc.boil }); if (prog > 0.5) I.stroke(ctx, [[b.cx + r * 0.6, b.cy - r * 0.6], [b.cx - r * 0.6, b.cy + r * 0.6]], { w: r * 0.2, color: col, seed: it.seed + 1, boil: rc.boil }); }
        break;
      }
      case 'raizes': {   // raízes desenhadas à mão crescendo para baixo a partir do topo da caixa (n ramos, dur s)
        const prog = clamp(dt / (it.dur ?? 1.6)); if (prog <= 0) break;
        const rr = RNG(it.seed), n = it.n ?? 5, col = info.cor(it.cor, '#f3ead8');
        const ramo = (x0, y0, ang, len, w, depth, p, sd) => {
          const pts = [[x0, y0]]; let x = x0, y = y0, a = ang;
          for (let i = 0; i < 12; i++) { a += (hrand(i, sd) - 0.5) * 0.5; x += Math.cos(a) * len / 12; y += Math.sin(a) * len / 12; pts.push([x, y]); }
          const k = Math.max(2, Math.round(pts.length * clamp(p)));
          I.stroke(ctx, pts.slice(0, k), { w, color: col, seed: sd, boil: rc.boil, taper: [0.1, 0.9] });
          if (depth > 0 && p > 0.35) for (let j = 0; j < 2; j++) { const q = pts[4 + j * 3]; ramo(q[0], q[1], a + (j ? 0.7 : -0.7), len * 0.55, w * 0.6, depth - 1, (p - 0.35) / 0.65, sd * 3 + j); }
        };
        for (let i = 0; i < n; i++) ramo(b.cx + (i - (n - 1) / 2) * b.w * 0.08, b.y0, Math.PI / 2 + (i - (n - 1) / 2) * 0.28, b.h * (0.75 + rr.range(0, 0.25)), it.w ?? 10, 2, prog, it.seed + i * 7);
        break;
      }
      case 'metro': {   // mapa de metrô: linhas coloridas desenhadas aos poucos, estações, bondinho com o Metaninho e a estação central
        const M = d.metro; if (!M) break;
        const W = b.w, H = b.h, V = info.FMT === 'v';
        const px = (p) => [b.cx + p[0] * W, b.cy + p[1] * H];
        const ponto = (ln, s) => {   // ponto e direção a uma distância s do começo
          s = clamp(s, 0, ln.L); let i = 0; while (i < ln.seg.length - 1 && s > ln.acc[i + 1]) i++;
          const a = ln.P[i], c = ln.P[i + 1], q = ln.seg[i] ? (s - ln.acc[i]) / ln.seg[i] : 0;
          return { x: a[0] + (c[0] - a[0]) * q, y: a[1] + (c[1] - a[1]) * q, ang: Math.atan2(c[1] - a[1], c[0] - a[0]) };
        };
        const trecho = (ln, s1) => { const out = [ln.P[0]]; for (let i = 1; i < ln.P.length && ln.acc[i] < s1; i++) out.push(ln.P[i]); const e = ponto(ln, s1); out.push([e.x, e.y]); return out; };
        const LW = Math.min(W, H) * 0.028;
        ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        // rotas planejadas (tracejado fantasma)
        if (M.tf != null && t >= M.tf) {
          const a0 = clamp((t - M.tf) / 0.6);
          for (const ln of M.linhas) {
            ctx.save(); ctx.globalAlpha *= 0.45 * a0; ctx.setLineDash([LW * 0.9, LW * 0.8]); ctx.strokeStyle = info.cor(ln.cor); ctx.lineWidth = LW * 0.35;
            ctx.beginPath(); ln.P.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); ctx.restore();
          }
        }
        // linhas desenhadas
        for (const ln of M.linhas) {
          const p = clamp((t - ln.t0) / (ln.t1 - ln.t0)); if (p <= 0) continue;
          const tr = trecho(ln, ln.L * E.inOutSine(p));
          ctx.save();
          SP.setShadow(ctx, rc.zoom, 0.15, 0.6); ctx.strokeStyle = '#fbf8f0'; ctx.lineWidth = LW * 1.55; ctx.beginPath(); tr.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); SP.clearShadow(ctx);
          ctx.strokeStyle = info.cor(ln.cor); ctx.lineWidth = LW; ctx.beginPath(); tr.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
          ctx.restore();
          // estações (nas quinas e no fim)
          const sts = (ln.estacoes || []).map((i) => ln.acc[Math.min(i, ln.acc.length - 1)]);
          for (const s of sts) {
            const sp = clamp((ln.L * E.inOutSine(p) - s) / (LW * 3) + 1); if (sp <= 0) continue;
            const e = ponto(ln, s), fim = Math.abs(s - ln.L) < 1, r = LW * (fim ? 1.25 : 0.85) * E.outBack(clamp(sp), 2.2);
            ctx.fillStyle = '#fbf8f0'; ctx.strokeStyle = '#1b2a33'; ctx.lineWidth = LW * 0.32; ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, TAU); ctx.fill(); ctx.stroke();
            if (fim) { ctx.fillStyle = info.cor(ln.cor); ctx.beginPath(); ctx.arc(e.x, e.y, r * 0.45, 0, TAU); ctx.fill(); }
          }
          // bondinho na ponta da linha (com o Metaninho)
          if (p > 0 && p < 1) drawBonde(ctx, ponto(ln, ln.L * E.inOutSine(p)), info.cor(ln.cor), LW, info, rc, true);
        }
        // volta final: um bondinho de cada linha corre até a estação central
        if (M.tv != null && t >= M.tv) {
          const q = E.inOutCubic(clamp((t - M.tv) / 1.5));
          if (q < 1) for (const ln of M.linhas) drawBonde(ctx, (() => { const e = ponto(ln, ln.L * (1 - q)); return { ...e, ang: e.ang + Math.PI }; })(), info.cor(ln.cor), LW * 0.8, info, rc, false);
        }
        // estação central
        if (M.tc != null && t >= M.tc) {
          const c = px([0, 0]), pc = E.outBack(clamp((t - M.tc) / 0.4), 2), fim = M.tb != null && t >= M.tb ? E.outBack(clamp((t - M.tb) / 0.5), 1.8) : 0;
          const R = LW * 3.1 * pc * (1 + 0.55 * fim);   // no fim a estação central cresce e vira ENERGIA VIVA
          if (M.tb != null && t >= M.tb) {
            const g2 = clamp((t - M.tb) / 0.5), pul = 1 + 0.06 * Math.sin((t - M.tb) * 6);
            const gr = ctx.createRadialGradient(c[0], c[1], R * 0.5, c[0], c[1], R * 3.2 * pul);
            gr.addColorStop(0, `rgba(255,236,160,${0.85 * g2})`); gr.addColorStop(1, 'rgba(255,214,110,0)');
            ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c[0], c[1], R * 3.2 * pul, 0, TAU); ctx.fill();
          }
          SP.setShadow(ctx, rc.zoom, 0.4, 1); ctx.fillStyle = '#fbf8f0'; ctx.beginPath(); ctx.arc(c[0], c[1], R, 0, TAU); ctx.fill(); SP.clearShadow(ctx);
          ctx.strokeStyle = '#1b2a33'; ctx.lineWidth = LW * 0.45; ctx.beginPath(); ctx.arc(c[0], c[1], R, 0, TAU); ctx.stroke();
          ctx.fillStyle = '#1e3e4c'; ctx.font = `700 ${R * 0.52}px "Archivo Black", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          if (fim > 0.5) { ctx.fillStyle = '#00573a'; ctx.font = `700 ${R * 0.3}px "Archivo Black", sans-serif`; ctx.fillText('ENERGIA', c[0], c[1] - R * 0.17); ctx.fillText('VIVA', c[0], c[1] + R * 0.2); }
          else ctx.fillText('CP2B', c[0], c[1] + R * 0.04);
        }
        break;
      }
      case 'celular': {   // celular com um grupo de mensagens: "msgs": [{ em, autor, txt, p (foto), av (avatar), lado: "esq"|"dir", sis: true, cor, reacao: "palavra" }]
        if (on <= 0) break;
        const s0 = E.outBack(on, 1.3), W = b.w, H = b.h, x0 = b.cx - W / 2, y0 = b.cy - H / 2;
        ctx.translate(b.cx, b.cy); ctx.scale(s0, s0); ctx.translate(-b.cx, -b.cy);
        const R = Math.min(W, H) * 0.09, bez = Math.min(W, H) * 0.035;
        SP.setShadow(ctx, rc.zoom, 0.6, 1.2); ctx.fillStyle = '#1b2a33'; ctx.beginPath(); ctx.roundRect(x0, y0, W, H, R); ctx.fill(); SP.clearShadow(ctx);
        const sx0 = x0 + bez, sy0 = y0 + bez * 1.6, sw = W - 2 * bez, sh = H - bez * 3.2;
        ctx.save(); ctx.beginPath(); ctx.roundRect(sx0, sy0, sw, sh, R * 0.7); ctx.clip();
        const fs = Math.max(14, sw * 0.047), hh = fs * 3.4, ib = fs * 3;
        // fundo do chat
        ctx.fillStyle = '#efe6d4'; ctx.fillRect(sx0, sy0, sw, sh);
        ctx.fillStyle = 'rgba(30,62,76,0.05)'; for (let yy = sy0 + hh; yy < sy0 + sh; yy += fs * 2.2) for (let xx = sx0 + ((yy / (fs * 2.2)) % 2 ? fs : 0); xx < sx0 + sw; xx += fs * 2.2) { ctx.beginPath(); ctx.arc(xx, yy, fs * 0.18, 0, TAU); ctx.fill(); }
        const msgs = d.msgs || [];
        const vis = msgs.filter((m) => t >= m.t);
        const typing = msgs.find((m) => !m.sis && t < m.t && t >= m.t - 0.75);
        // layout de baixo para cima
        const wrap = (txt, maxw, font) => { ctx.font = font; const out = []; for (const par of String(txt).split('\n')) { let ln = ''; for (const wd of par.split(' ')) { const tt = ln ? ln + ' ' + wd : wd; if (ctx.measureText(tt).width > maxw && ln) { out.push(ln); ln = wd; } else ln = tt; } out.push(ln); } return out; };
        const fTxt = `500 ${fs}px "Neulis Sans", "Kalam", sans-serif`, fAut = `700 ${fs * 0.82}px "Neulis Sans", "Kalam", sans-serif`;
        const maxw = sw * 0.66, gap = fs * 0.55, pad = fs * 0.6;
        const boxes = vis.map((m) => {
          if (m.sis) { const ls = wrap(info.L(m.txt), sw * 0.8, `600 ${fs * 0.8}px "Neulis Sans", "Kalam", sans-serif`); return { m, ls, h: ls.length * fs * 1.05 + pad * 1.2, w: 0 }; }
          const ls = wrap(info.L(m.txt), maxw, fTxt);
          ctx.font = fTxt; let w = Math.max(...ls.map((l) => ctx.measureText(l).width));
          ctx.font = fAut; if (m.lado !== 'dir') w = Math.max(w, ctx.measureText(m.autor || '').width);
          const im = m.p ? info.imgOf(m.p) : null, ih = im ? sh * 0.2 : 0;
          if (im) w = Math.max(w, Math.min(maxw, ih * im.width / im.height));
          return { m, ls, im, ih, w: w + pad * 2, h: (m.lado !== 'dir' ? fs * 1.1 : 0) + ls.length * fs * 1.2 + ih + (im ? pad * 0.6 : 0) + pad * 1.6 };
        });
        let yb = sy0 + sh - ib - gap;
        if (typing) yb -= fs * 2.4 + gap;
        const last = boxes[boxes.length - 1], pl = last ? E.outCubic(clamp((t - last.m.t) / 0.28)) : 1;
        if (last) yb += (1 - pl) * (last.h + gap);   // o balão novo empurra os outros para cima
        for (let i = boxes.length - 1; i >= 0; i--) {
          const bx = boxes[i], m = bx.m, top = yb - bx.h;
          if (top + bx.h < sy0 + hh) break;
          ctx.save(); if (i === boxes.length - 1) ctx.globalAlpha *= pl;
          if (m.sis) {
            ctx.font = `600 ${fs * 0.8}px "Neulis Sans", "Kalam", sans-serif`; const tw = Math.max(...bx.ls.map((l) => ctx.measureText(l).width)) + pad * 2;
            ctx.fillStyle = 'rgba(30,62,76,0.14)'; ctx.beginPath(); ctx.roundRect(sx0 + sw / 2 - tw / 2, top, tw, bx.h, bx.h / 2); ctx.fill();
            ctx.fillStyle = '#1e3e4c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            bx.ls.forEach((l, k) => ctx.fillText(l, sx0 + sw / 2, top + pad * 0.6 + fs * 0.52 + k * fs * 1.05));
          } else {
            const dir = m.lado === 'dir', av = fs * 1.9;
            const bxx = dir ? sx0 + sw - pad - bx.w : sx0 + pad + av + pad * 0.6;
            if (!dir) {   // avatar
              const ax = sx0 + pad + av / 2, ay = top + bx.h - av / 2, ai = m.av ? info.imgOf(m.av) : null;
              ctx.save(); ctx.beginPath(); ctx.arc(ax, ay, av / 2, 0, TAU); ctx.fillStyle = info.cor(m.cor, '#1e3e4c'); ctx.fill(); ctx.clip();
              if (ai) { const k = av * 1.15 / Math.max(ai.width, ai.height); ctx.drawImage(ai, ax - ai.width * k / 2, ay - ai.height * k / 2, ai.width * k, ai.height * k); }
              else { ctx.fillStyle = '#fbf8f0'; ctx.font = `700 ${fs}px "Archivo Black", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(m.autor || '?')[0], ax, ay + 1); }
              ctx.restore();
            }
            SP.setShadow(ctx, rc.zoom, 0.1, 0.4);
            ctx.fillStyle = dir ? '#d9f2c4' : '#fbf8f0'; ctx.beginPath(); ctx.roundRect(bxx, top, bx.w, bx.h, fs * 0.7); ctx.fill(); SP.clearShadow(ctx);
            let yy = top + pad;
            ctx.textAlign = 'left'; ctx.textBaseline = 'top';
            if (!dir) { ctx.font = fAut; ctx.fillStyle = info.cor(m.cor, '#1e3e4c'); ctx.fillText(m.autor || '', bxx + pad, yy); yy += fs * 1.1; }
            if (bx.im) { const iw = Math.min(bx.w - pad * 2, bx.ih * bx.im.width / bx.im.height), ih = iw * bx.im.height / bx.im.width; ctx.fillStyle = 'rgba(30,62,76,0.08)'; ctx.fillRect(bxx + pad, yy, bx.w - pad * 2, bx.ih); ctx.drawImage(bx.im, bxx + pad + (bx.w - pad * 2 - iw) / 2, yy + (bx.ih - ih) / 2, iw, ih); yy += bx.ih + pad * 0.6; }
            ctx.font = fTxt; ctx.fillStyle = '#1b2a33'; bx.ls.forEach((l, k) => ctx.fillText(l, bxx + pad, yy + k * fs * 1.2));
            ctx.font = `500 ${fs * 0.6}px "Neulis Sans", sans-serif`; ctx.fillStyle = 'rgba(27,42,51,0.5)'; ctx.textAlign = 'right';
            ctx.fillText('10:' + String(10 + i * 3).padStart(2, '0') + (dir ? '  ✓✓' : ''), bxx + bx.w - pad * 0.6, top + bx.h - fs * 0.75);
            if (m.tr != null && t >= m.tr) {   // reação: coraçãozinho no canto
              const pr = E.outBack(clamp((t - m.tr) / 0.3), 2.4), hx = dir ? bxx + fs * 0.4 : bxx + bx.w - fs * 0.4, hy = top + bx.h + fs * 0.1, r = fs * 0.62 * pr;
              ctx.fillStyle = '#fbf8f0'; ctx.beginPath(); ctx.arc(hx, hy, r * 1.25, 0, TAU); ctx.fill();
              ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.moveTo(hx, hy + r * 0.55); ctx.bezierCurveTo(hx - r * 1.1, hy - r * 0.3, hx - r * 0.45, hy - r * 1.05, hx, hy - r * 0.4); ctx.bezierCurveTo(hx + r * 0.45, hy - r * 1.05, hx + r * 1.1, hy - r * 0.3, hx, hy + r * 0.55); ctx.fill();
            }
          }
          ctx.restore();
          yb = top - gap;
        }
        if (typing) {   // "digitando…"
          const tw = fs * 3.2, th = fs * 1.9, dir = typing.lado === 'dir', tx = dir ? sx0 + sw - pad - tw : sx0 + pad + fs * 2.5, ty = sy0 + sh - ib - gap - th;
          ctx.fillStyle = dir ? '#d9f2c4' : '#fbf8f0'; ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, th / 2); ctx.fill();
          for (let k = 0; k < 3; k++) { ctx.fillStyle = 'rgba(27,42,51,0.55)'; ctx.beginPath(); ctx.arc(tx + tw * (0.28 + k * 0.22), ty + th / 2 - Math.max(0, Math.sin(t * 10 - k * 0.9)) * fs * 0.25, fs * 0.2, 0, TAU); ctx.fill(); }
        }
        // cabeçalho
        ctx.fillStyle = '#2f7f84'; ctx.fillRect(sx0, sy0, sw, hh);
        const gi = it.avatar ? info.imgOf(it.avatar) : null, gx = sx0 + fs * 2.2, gy = sy0 + hh * 0.58;
        ctx.save(); ctx.beginPath(); ctx.arc(gx, gy, fs * 1.15, 0, TAU); ctx.fillStyle = '#f3ead8'; ctx.fill(); ctx.clip();
        if (gi) { const k = fs * 2.6 / Math.max(gi.width, gi.height); ctx.drawImage(gi, gx - gi.width * k / 2, gy - gi.height * k / 2, gi.width * k, gi.height * k); }
        ctx.restore();
        ctx.fillStyle = '#fbf8f0'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = `700 ${fs * 1.02}px "Neulis Sans", "Kalam", sans-serif`;
        ctx.fillText(info.L(it.titulo) || 'Grupo', gx + fs * 1.6, gy - fs * 0.5);
        ctx.font = `500 ${fs * 0.72}px "Neulis Sans", "Kalam", sans-serif`; ctx.fillStyle = 'rgba(251,248,240,0.85)';
        ctx.fillText(typing ? `${typing.autor} está digitando…` : (info.L(it.subtitulo) || 'online'), gx + fs * 1.6, gy + fs * 0.6);
        // barra de digitar
        ctx.fillStyle = '#fbf8f0'; ctx.beginPath(); ctx.roundRect(sx0 + pad, sy0 + sh - ib + fs * 0.45, sw - pad * 2 - fs * 2.6, ib - fs * 0.9, (ib - fs * 0.9) / 2); ctx.fill();
        ctx.fillStyle = 'rgba(27,42,51,0.4)'; ctx.font = `500 ${fs * 0.85}px "Neulis Sans", "Kalam", sans-serif`; ctx.fillText('Mensagem', sx0 + pad * 2.2, sy0 + sh - ib / 2);
        ctx.fillStyle = '#2f7f84'; ctx.beginPath(); ctx.arc(sx0 + sw - pad - fs * 1.1, sy0 + sh - ib / 2, fs * 1.05, 0, TAU); ctx.fill();
        ctx.restore();
        // alto-falante e câmera
        ctx.fillStyle = '#3b4a52'; ctx.beginPath(); ctx.roundRect(b.cx - W * 0.1, y0 + bez * 0.55, W * 0.2, bez * 0.45, bez * 0.22); ctx.fill();
        break;
      }
      case 'contagem': {   // suspense: anel que se esvazia com "?" pulsando, do início até "ate" (tique-taque)
        if (on <= 0) break;
        const T = (it.t1fx ?? it.t0 + 1) - it.t0, q = clamp(dt / Math.max(0.2, T)), r = Math.min(b.w, b.h) * 0.42 * E.outBack(on, 1.8);
        ctx.fillStyle = 'rgba(20,32,39,0.85)'; ctx.beginPath(); ctx.arc(b.cx, b.cy, r, 0, TAU); ctx.fill();
        ctx.strokeStyle = q > 0.66 ? '#e4572e' : '#f2c14e'; ctx.lineWidth = r * 0.16; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(b.cx, b.cy, r * 0.82, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - q)); ctx.stroke();
        const pul = 1 + 0.12 * Math.abs(Math.sin(dt * 10));
        ctx.fillStyle = '#fbf8f0'; ctx.font = `700 ${r * 0.9 * pul}px "Luckiest Guy", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', b.cx, b.cy + r * 0.06);
        break;
      }
      case 'notas': {
        ctx.fillStyle = ink; ctx.font = `700 ${Math.min(b.w, b.h) * 0.3}px "Luckiest Guy", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        for (let i = 0; i < (it.n ?? 4); i++) { const q = ((dt * 0.4) + i / 4) % 1; if (dt < 0) break; ctx.globalAlpha = (1 - q) * fadeOut; ctx.fillText(i % 2 ? '♪' : '♫', b.cx + Math.sin(q * 6 + i) * b.w * 0.3, b.y1 - q * b.h); }
        break;
      }
      case 'ondas': {
        if (on <= 0) break;
        for (let k = 0; k < 3; k++) { const q = ((dt * 0.8) + k / 3) % 1; ctx.globalAlpha = (1 - q) * fadeOut; I.stroke(ctx, (() => { const p = []; for (let a = -0.7; a <= 0.7; a += 0.1) p.push([b.cx + Math.cos(a) * (40 + q * b.w * 0.45), b.cy + Math.sin(a) * (40 + q * b.w * 0.45)]); return p; })(), { w: 6, color: ink, seed: k }); }
        break;
      }
      default: break;
    }
    ctx.restore();
  }

  function cue(it, s, info) {
    const t = it.t0;
    if (it.mudo) return;
    if (it.fx === 'celular') { for (const m of (it.fxd?.msgs || [])) { s(m.t, m.sis ? 'clique' : 'plim', { g: m.sis ? 0.3 : 0.32, p: m.lado === 'dir' ? 1.15 : 1.0 }); if (!m.sis) s(m.t - 0.7, 'clique', { g: 0.12, p: 1.6 }); if (m.tr != null) s(m.tr, 'pop', { g: 0.3, p: 1.3 }); } return; }
    if (it.fx === 'metro') {   // tempos já calculados no prep
      const M = it.fxd?.metro || {};
      for (const ln of M.linhas || []) { s(ln.t0, 'whoosh', { g: 0.3, dur: ln.t1 - ln.t0 }); s(ln.t1 - 0.05, 'plim', { g: 0.35, p: 1.1 }); }
      if (M.tc != null) s(M.tc, 'pop', { g: 0.45 });
      if (M.tv != null) s(M.tv, 'whoosh', { g: 0.4, dur: 1.5 });
      if (M.tb != null) s(M.tb, 'estrela', { g: 0.45 });
      return;
    }
    if (it.fx === 'cano' && it.fxd?.tf != null) { s(it.fxd.tf, 'gas_fluxo', { g: 0.3 * (it.ganho ?? 1), dur: Math.min(2.5, (it.fxd.tfa ?? it.fxd.tf + 1.6) - it.fxd.tf) }); return; }
    if (it.fx === 'relogio' && it.meiodia) { s(t + 0.05, 'clique', { g: 0.25, p: 1.3 }); s(t + (it.dur ?? 1.0), 'sino', { g: 0.5 }); return; }
    if (it.fx === 'contagem') { const T = (it.t1fx ?? t + 1) - t; for (let k = 0; k < Math.max(2, Math.round(T / 0.18)); k++) s(t + k * 0.18, 'clique', { g: 0.3, p: k % 2 ? 1.25 : 1.0 }); return; }
    const m = { bolhas: ['bolhas', { g: 0.35, dur: 1.8 }], chama: ['fogo', { g: 0.35, dur: 1.2 }], molecula: ['pop', { g: 0.35, p: 1.3 }], microbio: ['plop', { g: 0.35, p: 1.3 }],
      seta: ['rabisco', { g: 0.25, dur: 0.5 }], tracejado: ['rabisco', { g: 0.22, dur: 0.6 }], ciclo: ['ciclo', { g: 0.35, dur: 1.6 }], brilho: ['brilho', { g: 0.4 }], confete: ['festa', { g: 0.45 }],
      cheiro: ['fedido', { g: 0.35 }], mosca: ['mosca', { g: 0.25, dur: 2 }], cano: ['gas_fluxo', { g: 0.3, dur: 1.2 }], engrenagem: ['maquina', { g: 0.3, dur: 1.5 }], relogio: ['clique', { g: 0.3 }],
      termometro: ['chiado', { g: 0.2, dur: 1 }], lente: ['lupa', { g: 0.4 }], grafico: ['preenche', { g: 0.3, dur: 1 }], cadeado: ['cadeado', { g: 0.45 }], coracao: ['plim', { g: 0.4 }], estrela: ['estrela', { g: 0.4 }],
      gotas: ['plop', { g: 0.35 }], fumaca: ['fumaca', { g: 0.3 }], circulo: ['rabisco', { g: 0.34, dur: 0.5 }], estrada: ['papel_desliza', { g: 0.3 }], check: ['plim', { g: 0.45 }], xis: ['boing', { g: 0.4 }], ondas: ['plim', { g: 0.25 }] };
    const e = m[it.fx];
    if (!e || it.mudo) return;
    if (it.som) return s(t + 0.05, it.som, { g: 0.45 });
    s(t + 0.03, e[0], { ...e[1], g: e[1].g * (it.ganho ?? 1) });
    if (it.fx === 'molecula' || it.fx === 'microbio') for (let i = 1; i < Math.min(4, it.n ?? 1); i++) s(t + i * 0.12, e[0], { ...e[1], g: e[1].g * 0.7, p: 1 + i * 0.1 });
    if (it.fx === 'gotas') for (let i = 1; i < (it.n ?? 4); i++) s(t + i / (it.vel ?? 0.9) / (it.n ?? 4) + 0.3, 'plop', { g: 0.25, p: 0.9 + i * 0.07 });
  }

  // ---------- molduras (espaço de tela) ----------
  function moldura(rc, m, info) {
    const { ctx, t, W, H } = rc;
    if (t < m.a || t > m.b) return;
    const a = clamp((t - m.a) / 0.3) * clamp((m.b - t) / 0.3);
    const V = info.FMT === 'v';
    const PAL = info.PAL;
    ctx.save();
    ctx.globalAlpha = a;
    switch (m.tipo) {
      case 'vhs': {
        ctx.fillStyle = 'rgba(0,0,0,0.10)'; for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 2);
        const band = ((t * 0.9) % 1.4 - 0.2) * H;
        const g = ctx.createLinearGradient(0, band - 60, 0, band + 60);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.fillRect(0, band - 60, W, 120);
        ctx.fillStyle = 'rgba(228,87,46,0.10)'; ctx.fillRect(0, 0, W, H);
        ctx.font = `700 ${V ? 64 : 72}px "Archivo Black", sans-serif`; ctx.fillStyle = '#fbf8f0'; ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(228,87,46,0.9)'; ctx.shadowOffsetX = 4;
        ctx.fillText(m.texto ?? '◄◄ REW', 60, V ? 330 : 50);
        ctx.shadowColor = 'transparent';
        break;
      }
      case 'vlog': {
        const blink = Math.floor(t * 2) % 2 === 0;
        const x0 = 54, y0 = V ? 330 : 50;
        if (blink) { ctx.fillStyle = '#e4572e'; ctx.beginPath(); ctx.arc(x0 + 22, y0 + 26, 20, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#fbf8f0'; ctx.font = `700 48px "Archivo Black", sans-serif`; ctx.textBaseline = 'middle'; ctx.fillText('REC', x0 + 56, y0 + 28);
        ctx.strokeStyle = 'rgba(251,248,240,0.9)'; ctx.lineWidth = 7;
        const mg = V ? 60 : 40, L0 = 90, top = V ? 300 : 30, bot = V ? H - 330 : H - 30;
        for (const [x, y, sx, sy] of [[mg, top, 1, 1], [W - mg, top, -1, 1], [mg, bot, 1, -1], [W - mg, bot, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x, y + sy * L0); ctx.lineTo(x, y); ctx.lineTo(x + sx * L0, y); ctx.stroke(); }
        const s = Math.floor(t), tc = `00:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
        ctx.font = `700 34px "Archivo Black", sans-serif`; ctx.fillText(tc, x0 + 10, bot - 40);
        break;
      }
      case 'tv': {
        const bw = V ? 36 : 46;
        ctx.strokeStyle = m.cor ?? '#3b2a1c'; ctx.lineWidth = bw * 2; ctx.beginPath(); ctx.roundRect(0, 0, W, H, 0); ctx.stroke();
        ctx.strokeStyle = m.cor2 ?? '#6b4a31'; ctx.lineWidth = bw; ctx.beginPath(); ctx.roundRect(bw * 0.5, bw * 0.5, W - bw, H - bw, 60); ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.06)'; for (let y = 0; y < H; y += 5) ctx.fillRect(0, y, W, 2);
        break;
      }
      case 'palco': {
        for (const sg of [-1, 1]) {
          const x = W / 2 + sg * W * 0.42, sw = Math.sin(t * 0.8 + sg) * W * 0.12;
          const g = ctx.createLinearGradient(x, 0, W / 2 + sw, H);
          g.addColorStop(0, 'rgba(255,244,200,0.32)'); g.addColorStop(1, 'rgba(255,244,200,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 30, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(W / 2 + sw + W * 0.2, H); ctx.lineTo(W / 2 + sw - W * 0.2, H); ctx.closePath(); ctx.fill();
        }
        const rr = RNG(5), n = V ? 9 : 16;
        for (let i = 0; i < n; i++) {
          const x = (i + 0.5) / n * W, bob = Math.abs(Math.sin(t * 3 + i)) * 10;
          SP.piece(ctx, S.blob(x, H - (V ? 300 : 30) - bob, 46, 52, { seed: i }), { color: ['#1e3e4c', '#00573a', '#8b5a3c', '#5b3d28'][i % 4], seed: i, edge: 0.1 });
        }
        break;
      }
      case 'game': {
        const x0 = 46, y0 = V ? 320 : 40;
        for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(x0 + 30 + k * 64, y0 + 30); SP.piece(ctx, heart(26), { color: '#e4572e', seed: k, ink: { w: 3 } }); ctx.restore(); }
        const prog = clamp((t - m.a) / Math.max(1, m.b - m.a));
        ctx.fillStyle = 'rgba(27,42,51,0.8)'; ctx.fillRect(x0, y0 + 80, 420, 34);
        ctx.fillStyle = '#b6e03b'; ctx.fillRect(x0 + 5, y0 + 85, 410 * prog, 24);
        ctx.fillStyle = '#fbf8f0'; ctx.font = `700 34px "Archivo Black", sans-serif`; ctx.textBaseline = 'middle';
        ctx.fillText((info.LANG || '').startsWith('en') ? `LEVEL ${1 + Math.floor(prog * 3.999)}` : `FASE ${1 + Math.floor(prog * 3.999)}`, x0 + 240, y0 + 30);
        break;
      }
      case 'relogio': {
        const r = V ? 70 : 64, x = 60 + r, y = (V ? 330 : 50) + r;
        const dt = t - m.a;
        clockFace(ctx, x, y, r, -Math.PI / 2 + dt * 0.25, -Math.PI / 2 + dt * 3, { ...rc, boil: 0, zoom: 1 });
        break;
      }
      case 'cronometro': {
        const s = t - m.a;
        const txt = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}.${String(Math.floor((s % 1) * 10))}`;
        ctx.fillStyle = 'rgba(27,42,51,0.85)'; ctx.beginPath(); ctx.roundRect(46, V ? 320 : 40, 300, 88, 16); ctx.fill();
        ctx.fillStyle = '#b6e03b'; ctx.font = `700 52px "Archivo Black", sans-serif`; ctx.textBaseline = 'middle'; ctx.fillText(txt, 70, (V ? 320 : 40) + 46);
        break;
      }
      default: break;
    }
    ctx.restore();
  }

  C.efeitos = { prep, draw, cue, moldura };
})(window);
