/* Colagem — personagens e objetos: imagens recortadas, micróbios, moléculas, bolhas, chamas,
 * engrenagens, canos, etiquetas, confete, mosca, pizza de papel e lupa. */
(function (G) {
  'use strict';
  const C = G.Colagem;
  const { hrand, R, clamp, lerp, TAU, snoise1, noise1, mixHex, shade, E, tw } = C.core;
  const S = C.shapes, P = C.paper, I = C.ink, SP = C.sprite, T = C.text;
  const INK = SP.INK;

  // ---------- imagens recortadas (PNG com alfa) ----------
  const images = new Map();
  function loadImages(map) {
    return Promise.all(Object.entries(map).map(([name, url]) => new Promise((ok, bad) => {
      const im = new Image();
      im.onload = () => { images.set(name, im); ok(); };
      im.onerror = () => bad(new Error('imagem não carregou: ' + url));
      im.src = url;
    })));
  }
  /** Desenha a imagem centrada (ou na âncora ax,ay em fração) com sombra de papel. */
  function img(ctx, name, x, y, o = {}) {
    const im = images.get(name);
    if (!im) return null;
    const s = o.s ?? 1, w = im.width * s * (o.sx ?? 1), h = im.height * s * (o.sy ?? 1);
    const ax = o.ax ?? 0.5, ay = o.ay ?? 0.5;
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    if (o.flip) ctx.scale(-1, 1);
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    if (o.shadow !== false) SP.setShadow(ctx, (o.zoom ?? 1) * s, o.lift ?? 0, o.shadowStrength ?? 1);
    ctx.drawImage(im, -ax * w, -ay * h, w, h);
    ctx.restore();
    return { w, h };
  }
  const imgSize = (name) => { const im = images.get(name); return im ? [im.width, im.height] : [0, 0]; };

  // ---------- micróbios ----------
  const HAT_COLORS = [['#e4572e', '#f2c14e'], ['#1e3e4c', '#b6e03b'], ['#d37402', '#fbf8f0'], ['#8ec5d6', '#e4572e']];
  /** o: color, kind('round'|'rod'), seed, squash, mouth(0..1 aberta), hat(bool), look[px,py], boil, zoom, rot, happy */
  function microbe(ctx, x, y, r, o = {}) {
    const seed = o.seed ?? 1, col = o.color ?? '#b6e03b';
    const sq = o.squash ?? 0;
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    ctx.scale(1 + sq, 1 - sq);
    const rx = o.kind === 'rod' ? r * 1.45 : r, ry = o.kind === 'rod' ? r * 0.78 : r;
    const body = S.blob(0, 0, rx, ry, { seed, wobble: 0.07, n: 64 });
    // cílios
    const nc = o.kind === 'rod' ? 14 : 11;
    for (let i = 0; i < nc; i++) {
      const a = (i / nc) * TAU + hrand(i, seed) * 0.3;
      const wig = Math.sin((o.phase ?? 0) * 9 + i * 1.7) * 0.35;
      const x0 = Math.cos(a) * rx * 0.98, y0 = Math.sin(a) * ry * 0.98;
      const x1 = Math.cos(a + wig * 0.3) * (rx + r * 0.32), y1 = Math.sin(a + wig * 0.3) * (ry + r * 0.32);
      I.stroke(ctx, [[x0, y0], [(x0 + x1) / 2 + Math.cos(a + 1.57) * wig * r * 0.12, (y0 + y1) / 2 + Math.sin(a + 1.57) * wig * r * 0.12], [x1, y1]], { w: Math.max(1.6, r * 0.06), color: shade(col, -0.45), seed: seed + i, boil: o.boil ?? 0, taper: [0, 0.6], jitter: 0.5 });
    }
    SP.piece(ctx, body, { color: col, seed, ink: { w: Math.max(2, r * 0.07), boil: o.boil ?? 0 }, shadow: { zoom: o.zoom ?? 1, lift: o.lift ?? 0 } });
    // organelas (manchinhas mais claras)
    const rr = R(seed + 5);
    for (let k = 0; k < 3; k++) {
      const px = rr.sym(rx * 0.5), py = rr.range(ry * 0.1, ry * 0.55);
      SP.piece(ctx, S.blob(px, py, r * rr.range(0.1, 0.17), r * rr.range(0.08, 0.13), { seed: seed + 30 + k }), { color: mixHex(col, '#ffffff', 0.45), seed: seed + 30 + k, edge: 0.1, shade: 0 });
    }
    // boca
    const m = clamp(o.mouth ?? 0.25);
    const my = ry * 0.28, mw = r * 0.42;
    if (m > 0.12) {
      ctx.fillStyle = '#3a1d1d';
      ctx.beginPath(); ctx.ellipse(0, my, mw * 0.55, r * 0.05 + m * r * 0.26, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#e4776a';
      ctx.beginPath(); ctx.ellipse(0, my + m * r * 0.13, mw * 0.3, m * r * 0.09, 0, 0, TAU); ctx.fill();
    } else {
      I.stroke(ctx, [[-mw * 0.5, my - r * 0.02], [0, my + r * 0.1], [mw * 0.5, my - r * 0.02]], { w: Math.max(2, r * 0.06), seed: seed + 3, boil: o.boil ?? 0 });
    }
    // olhinhos
    const [lx, ly] = o.look ?? [0, 0.6];
    const er = r * 0.27;
    SP.googly(ctx, -r * 0.33, -ry * 0.2, er, lx, ly, { zoom: o.zoom });
    SP.googly(ctx, r * 0.3, -ry * 0.24, er * 1.08, lx, ly, { zoom: o.zoom });
    // chapéu de festa
    if (o.hat) {
      const [c1, c2] = HAT_COLORS[seed % HAT_COLORS.length];
      ctx.save();
      ctx.translate(r * 0.12, -ry * 0.82);
      ctx.rotate(0.22 + Math.sin((o.phase ?? 0) * 5) * 0.08);
      const hh = r * 0.95, hw = r * 0.42;
      const cone = S.cut([[-hw, 0], [hw, 0], [0, -hh]], { seed: seed + 9, jitter: 0.6, ds: 6 });
      SP.piece(ctx, cone, { color: c1, seed: seed + 9, shadow: { zoom: o.zoom ?? 1 }, edge: 0.2 });
      ctx.save(); ctx.beginPath(); S.trace(ctx, cone, true); ctx.clip();
      ctx.fillStyle = P.pattern(ctx, c2, 'paper', { seed: 3 });
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.rect(-hw, -hh * (0.22 + k * 0.28), hw * 2, hh * 0.1); ctx.fill(); }
      ctx.restore();
      SP.piece(ctx, S.blob(0, -hh, r * 0.13, r * 0.13, { seed: seed + 11 }), { color: c2, seed: seed + 11, edge: 0.2 });
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- moléculas ----------
  const ATOM = { C: ['#3b4248', 1], H: ['#fbf8f0', 0.64], O: ['#e4572e', 0.94], S: ['#f2c14e', 1.02] };
  function atom(ctx, el, x, y, r, o = {}) {
    const [col, k] = ATOM[el];
    const rr = r * k;
    SP.piece(ctx, S.blob(x, y, rr, rr, { seed: (o.seed ?? 1) + x * 3.1, wobble: 0.04 }), { color: col, seed: (o.seed ?? 1) + 7, ink: { w: Math.max(1.6, r * 0.09), boil: o.boil ?? 0, alpha: 0.85 }, shadow: o.shadow === false ? null : { zoom: o.zoom ?? 1, lift: o.lift ?? 0, strength: 0.7 }, edge: 0.15 });
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.ellipse(x - rr * 0.35, y - rr * 0.38, rr * 0.28, rr * 0.16, -0.6, 0, TAU); ctx.fill();
  }
  const GEOM = {
    CH4: { c: 'C', arms: [['H', -90, 1], ['H', 30, 1], ['H', 150, 1], ['H', 250, 0.72]] },
    CO2: { c: 'C', arms: [['O', 180, 1.25], ['O', 0, 1.25]] },
    H2S: { c: 'S', arms: [['H', 142, 1], ['H', 38, 1]] },
    O2: { c: 'O', arms: [['O', 0, 1.2]] },
  };
  /** Molécula de bolinhas e palitos. o: rot, face(bool), mood('feliz'|'nojo'), boil, zoom */
  function molecule(ctx, kind, x, y, s, o = {}) {
    const g = GEOM[kind];
    const r = 26 * s;
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    const pts = g.arms.map(([el, a, d]) => [el, Math.cos((a * Math.PI) / 180) * r * 1.75 * d, Math.sin((a * Math.PI) / 180) * r * 1.75 * d]);
    for (const [, px, py] of pts) I.stroke(ctx, [[0, 0], [px, py]], { w: r * 0.26, color: '#cdbfa6', seed: 5, taper: [0, 0], jitter: 0.4, boil: o.boil ?? 0 });
    const back = pts.filter((p) => p[2] < 0), front = pts.filter((p) => p[2] >= 0);
    for (const [el, px, py] of back) atom(ctx, el, px, py, r, o);
    atom(ctx, g.c, 0, 0, r, o);
    for (const [el, px, py] of front) atom(ctx, el, px, py, r, o);
    if (o.face) {
      ctx.save();
      if (o.rot) ctx.rotate(-o.rot);
      const cr = r * ATOM[g.c][1];
      const eyeC = g.c === 'C' ? '#fbf8f0' : INK;
      const blink = o.blink ? 0.15 : 1;
      ctx.fillStyle = eyeC;
      for (const ex of [-cr * 0.32, cr * 0.32]) { ctx.beginPath(); ctx.ellipse(ex, -cr * 0.12, cr * 0.1, cr * 0.14 * blink, 0, 0, TAU); ctx.fill(); }
      const mood = o.mood ?? 'feliz';
      if (mood === 'feliz') I.stroke(ctx, [[-cr * 0.3, cr * 0.22], [0, cr * 0.42], [cr * 0.3, cr * 0.22]], { w: cr * 0.1, color: eyeC, seed: 3, boil: o.boil ?? 0, taper: [0.2, 0.2] });
      else I.stroke(ctx, [[-cr * 0.3, cr * 0.38], [-cr * 0.1, cr * 0.26], [cr * 0.1, cr * 0.38], [cr * 0.3, cr * 0.26]], { w: cr * 0.1, color: eyeC, seed: 4, boil: o.boil ?? 0 });
      ctx.restore();
    }
    ctx.restore();
  }

  // ---------- bolha de papel vegetal ----------
  function bubble(ctx, x, y, r, o = {}) {
    ctx.save();
    ctx.translate(x, y);
    const pts = S.blob(0, 0, r, r * (o.sy ?? 1), { seed: o.seed ?? 2, wobble: 0.025, n: 60 });
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.fillStyle = P.pattern(ctx, o.tint ?? '#eef6f2', 'smooth', { seed: 4, strength: 1.2 });
    ctx.globalAlpha *= 0.42;
    ctx.beginPath(); S.trace(ctx, pts, true); ctx.fill();
    ctx.globalAlpha /= 0.42;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(1.5, r * 0.06);
    ctx.beginPath(); S.trace(ctx, pts, true); ctx.stroke();
    ctx.strokeStyle = 'rgba(40,60,70,0.25)'; ctx.lineWidth = Math.max(1, r * 0.025);
    ctx.beginPath(); S.trace(ctx, S.offset(pts, r * 0.03), true); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = Math.max(1.5, r * 0.09); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.7, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(r * 0.42, -r * 0.45, r * 0.07, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // ---------- chama ----------
  function flameShape(h, w, seed, pose) {
    const pts = [];
    const n = 40;
    for (let i = 0; i <= n; i++) {
      const u = i / n; // 0..1 ao redor
      const a = u * TAU;
      // gota: base arredondada, ponta em cima
      const yy = -Math.cos(a) * 0.5 - 0.5; // 0 (base) .. -1 (ponta)
      const tip = Math.pow(-yy, 1.8);
      const xx = Math.sin(a) * (1 - tip) * 0.5;
      const wob = snoise1(i * 0.35 + pose * 2.3, seed) * 0.08 * (-yy);
      pts.push([(xx + wob) * w, yy * h]);
    }
    return pts;
  }
  /** Chama recortada que tremula em "poses". o: pose, seed, blue (chama de gás) */
  function flame(ctx, x, y, h, o = {}) {
    const pose = o.pose ?? 0, seed = o.seed ?? 3, w = h * (o.width ?? 0.62);
    const layers = o.blue
      ? [['#2f6fb0', 1, 1], ['#6fb6e8', 0.72, 0.8], ['#f2c14e', 0.34, 0.45]]
      : [['#e4572e', 1, 1], ['#f29a38', 0.74, 0.8], ['#f7d35c', 0.46, 0.55]];
    ctx.save();
    ctx.translate(x, y);
    layers.forEach(([col, kh, kw], li) => {
      const hh = h * kh * (1 + snoise1(pose * 1.7 + li, seed + 40) * 0.08);
      const pts = flameShape(hh, w * kw, seed + li * 11, pose + li * 0.37);
      SP.piece(ctx, pts, { color: col, seed: seed + li + pose * 3, shadow: li === 0 ? { zoom: o.zoom ?? 1, strength: 0.5 } : null, edge: 0.12, shade: 0.4 });
    });
    ctx.restore();
  }

  // ---------- engrenagem ----------
  const gearCache = new Map();
  function gearPiece(ctx, x, y, r, teeth, ang, col, o = {}) {
    const key = [r, teeth].join('|');
    if (!gearCache.has(key)) gearCache.set(key, S.gear(0, 0, r, teeth, { seed: teeth }));
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    SP.piece(ctx, gearCache.get(key), { color: col, seed: teeth + 3, ink: { w: Math.max(1.5, r * 0.05), boil: 0 }, shadow: { zoom: o.zoom ?? 1, strength: 0.8 } });
    SP.piece(ctx, S.blob(0, 0, r * 0.28, r * 0.28, { seed: 4 }), { color: shade(col, -0.35), seed: 9, edge: 0.3 });
    ctx.fillStyle = '#fbf8f0'; ctx.beginPath(); ctx.arc(0, 0, r * 0.09, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // ---------- cano ----------
  /** Cano de papel ao longo de pts. o: w, color, flow(tempo p/ pulsos), flowColor, progress */
  function pipe(ctx, pts, o = {}) {
    const w = o.w ?? 40, col = o.color ?? '#1e3e4c';
    const P2 = S.resample(pts, 6, false);
    const L = S.length(P2);
    const prog = clamp(o.progress ?? 1);
    const cut = [];
    let s = 0;
    for (let i = 0; i < P2.length; i++) { if (i) s += Math.hypot(P2[i][0] - P2[i - 1][0], P2[i][1] - P2[i - 1][1]); if (s > L * prog) break; cut.push(P2[i]); }
    if (cut.length < 2) return;
    ctx.save();
    ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
    SP.setShadow(ctx, o.zoom ?? 1, 0, 0.8);
    ctx.strokeStyle = P.pattern(ctx, col, 'paper', { seed: 5 });
    ctx.lineWidth = w;
    ctx.beginPath(); S.trace(ctx, cut, false); ctx.stroke();
    SP.clearShadow(ctx);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = w * 0.22;
    ctx.save(); ctx.translate(-w * 0.18, -w * 0.18); ctx.beginPath(); S.trace(ctx, cut, false); ctx.stroke(); ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.2;
    const N = S.normals(cut, false);
    for (const sg of [1, -1]) { ctx.beginPath(); S.trace(ctx, cut.map(([px, py], i) => [px + N[i][0] * w / 2 * sg, py + N[i][1] * w / 2 * sg]), false); ctx.stroke(); }
    // flanges
    if (o.flanges !== false) {
      let acc = 0;
      for (let i = 1; i < cut.length; i++) {
        acc += Math.hypot(cut[i][0] - cut[i - 1][0], cut[i][1] - cut[i - 1][1]);
        if (acc > (o.flangeEvery ?? 220)) {
          acc = 0;
          const [nx, ny] = N[i];
          ctx.fillStyle = P.pattern(ctx, shade(col, 0.18), 'paper', { seed: 6 });
          ctx.save(); ctx.translate(cut[i][0], cut[i][1]); ctx.rotate(Math.atan2(ny, nx));
          ctx.fillRect(-w * 0.62, -w * 0.13, w * 1.24, w * 0.26);
          ctx.restore();
        }
      }
    }
    // pulsos de gás
    if (o.flow != null) {
      const sp = o.flowSpeed ?? 420, gap = o.flowGap ?? 160;
      const Lc = S.length(cut);
      for (let d = ((o.flow * sp) % gap); d < Lc; d += gap) {
        const p = pointAt(cut, d);
        ctx.fillStyle = o.flowColor ?? '#b6e03b';
        ctx.globalAlpha = 0.9;
        ctx.beginPath(); ctx.ellipse(p[0], p[1], w * 0.28, w * 0.2, p[2], 0, TAU); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  }
  function pointAt(pts, d) {
    let s = 0;
    for (let i = 1; i < pts.length; i++) {
      const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (s + seg >= d) { const t = (d - s) / seg; return [lerp(pts[i - 1][0], pts[i][0], t), lerp(pts[i - 1][1], pts[i][1], t), Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0])]; }
      s += seg;
    }
    const a = pts.at(-1), b = pts.at(-2);
    return [a[0], a[1], Math.atan2(a[1] - b[1], a[0] - b[0])];
  }

  // ---------- etiqueta de papel com texto manuscrito ----------
  /** o: size, font, paper, ink, rot, seed, tape(bool|'pin'), progress(0..1 escrita), boil, zoom, s(escala) */
  function tag(ctx, text, x, y, o = {}) {
    const size = o.size ?? 46, font = o.font ?? 'Caveat', seed = o.seed ?? 1;
    const tw_ = T.measure(ctx, text, { size, font, weight: o.weight ?? 700 });
    const lines = String(text).split('\n').length;
    const w = (o.w ?? tw_) + size * 0.9, h = size * (0.95 + (lines - 1) * 1.05) + size * 0.55;
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    if (o.s != null) ctx.scale(o.s, o.s);
    const poly = S.cut([[-w / 2, -h / 2], [w / 2, -h / 2 + hrand(seed, 1) * 4], [w / 2 - hrand(seed, 2) * 4, h / 2], [-w / 2 + hrand(seed, 3) * 3, h / 2 - 2]], { seed, jitter: 0.8 });
    SP.piece(ctx, poly, { color: o.paper ?? '#fbf8f0', kind: o.kind ?? 'smooth', seed, torn: o.torn ?? false, shadow: { zoom: (o.zoom ?? 1) * (o.s ?? 1), lift: o.lift ?? 0 }, edge: 0.2 });
    if (o.lines) { ctx.strokeStyle = 'rgba(80,130,170,0.25)'; ctx.lineWidth = 1.5; for (let ly = -h / 2 + size * 0.62; ly < h / 2; ly += size * 0.5) { ctx.beginPath(); ctx.moveTo(-w / 2 + 6, ly); ctx.lineTo(w / 2 - 6, ly); ctx.stroke(); } }
    T.hand(ctx, text, 0, 0, { size, font, color: o.ink ?? INK, progress: o.progress ?? 1, boil: o.boil ?? 0, seed, weight: o.weight ?? 700 });
    if (o.tape === 'pin') {
      ctx.fillStyle = o.pinColor ?? '#e4572e';
      SP.setShadow(ctx, o.zoom ?? 1, 0, 0.8);
      ctx.beginPath(); ctx.arc(0, -h / 2 + 6, size * 0.16, 0, TAU); ctx.fill();
      SP.clearShadow(ctx);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(-size * 0.05, -h / 2 + 2, size * 0.05, 0, TAU); ctx.fill();
    } else if (o.tape !== false) {
      SP.tape(ctx, -w / 2 + size * 0.2, -h / 2 + 4, size * 1.1, size * 0.42, -0.5, { seed: seed + 2, zoom: o.zoom });
    }
    ctx.restore();
    return { w, h };
  }

  // ---------- confete ----------
  const CONF = ['#e4572e', '#f2c14e', '#b6e03b', '#8ec5d6', '#d37402', '#fbf8f0', '#5ca032'];
  function confetti(ctx, t, t0, x, y, o = {}) {
    const d = t - t0;
    if (d < 0 || d > (o.life ?? 2.2)) return;
    const n = o.n ?? 26, rr = R(o.seed ?? 4), sp = o.speed ?? 520, g = o.gravity ?? 900;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + rr.sym(o.spread ?? 1.1), v = sp * rr.range(0.5, 1.1);
      const px = x + Math.cos(a) * v * d, py = y + Math.sin(a) * v * d + 0.5 * g * d * d * 0.6;
      const spin = rr.range(6, 14) * d + rr.next() * 6;
      const col = CONF[i % CONF.length];
      ctx.save(); ctx.translate(px, py); ctx.rotate(spin * 0.4); ctx.scale(1, Math.cos(spin));
      ctx.globalAlpha = clamp(1 - (d - (o.life ?? 2.2) + 0.5) / 0.5);
      ctx.fillStyle = P.pattern(ctx, col, 'paper', { seed: 2 });
      const s = o.size ?? 12;
      if (i % 3 === 0) { ctx.beginPath(); ctx.arc(0, 0, s * 0.45, 0, TAU); ctx.fill(); } else ctx.fillRect(-s * 0.6, -s * 0.3, s * 1.2, s * 0.6);
      ctx.restore();
    }
  }

  // ---------- mosca ----------
  function fly(ctx, x, y, t, o = {}) {
    const sp = o.speed ?? 2.2, rad = o.r ?? 46;
    const a = t * sp;
    const px = x + Math.sin(a) * rad * 1.4, py = y + Math.sin(a * 2) * rad * 0.5;
    const vx = Math.cos(a) * rad * 1.4, vy = Math.cos(a * 2) * rad;
    // trilha pontilhada
    for (let k = 1; k <= 6; k++) {
      const b = a - k * 0.16;
      ctx.fillStyle = 'rgba(27,42,51,0.45)';
      ctx.beginPath(); ctx.arc(x + Math.sin(b) * rad * 1.4, y + Math.sin(b * 2) * rad * 0.5, 1.8, 0, TAU); ctx.fill();
    }
    ctx.save(); ctx.translate(px, py); ctx.rotate(Math.atan2(vy, vx));
    const flap = Math.abs(Math.sin(t * 60)) * 0.8 + 0.2;
    ctx.fillStyle = 'rgba(220,235,245,0.85)';
    ctx.beginPath(); ctx.ellipse(-2, -7 * flap, 6, 9 * flap, -0.3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-2, 7 * flap, 6, 9 * flap, 0.3, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1b2a33'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 5, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  // ---------- pizza de papel (proporções) ----------
  /** slices: [{frac, color}]; o.progress[i] 0..1 (voo de cada fatia); o.gap entre fatias */
  function pie(ctx, x, y, r, slices, o = {}) {
    let a0 = o.start ?? -Math.PI / 2;
    slices.forEach((sl, i) => {
      const a1 = a0 + sl.frac * TAU;
      const p = clamp((o.progress && o.progress[i]) ?? 1);
      if (p > 0) {
        const mid = (a0 + a1) / 2;
        const off = (1 - E.outBack(p)) * r * 1.8 + (o.gap ?? 6);
        const ox = Math.cos(mid) * off, oy = Math.sin(mid) * off;
        const pts = [[0, 0]];
        const steps = Math.max(4, Math.ceil(sl.frac * 64));
        for (let k = 0; k <= steps; k++) { const a = a0 + (a1 - a0) * (k / steps); pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
        ctx.save();
        ctx.translate(x + ox, y + oy);
        ctx.rotate((1 - p) * 0.8);
        SP.piece(ctx, S.cut(pts, { seed: i + 3, jitter: 0.8, ds: 12 }), { color: sl.color, seed: i + 7, border: { w: 5 }, shadow: { zoom: o.zoom ?? 1, lift: (1 - p) * 0.8 } });
        ctx.restore();
      }
      a0 = a1;
    });
  }

  // ---------- lupa ----------
  /** Lente de aumento: inside(ctx) desenha o conteúdo ampliado dentro do círculo. */
  function lens(ctx, x, y, r, inside, o = {}) {
    const hAng = o.handle ?? 0.85;
    ctx.save();
    ctx.translate(x, y);
    if (o.s != null) ctx.scale(o.s, o.s);
    // cabo
    ctx.save(); ctx.rotate(hAng);
    SP.piece(ctx, S.rrect(r * 0.92, -r * 0.13, r * 0.95, r * 0.26, r * 0.1, { seed: 3 }), { color: '#8b5a3c', kind: 'paper', seed: 3, ink: { w: 3 }, shadow: { zoom: o.zoom ?? 1, lift: o.lift ?? 0.3 } });
    SP.piece(ctx, S.rrect(r * 0.86, -r * 0.18, r * 0.2, r * 0.36, r * 0.05, { seed: 4 }), { color: '#d37402', seed: 4, ink: { w: 3 } });
    ctx.restore();
    // aro e conteúdo
    SP.setShadow(ctx, o.zoom ?? 1, o.lift ?? 0.3, 1);
    ctx.fillStyle = '#2a2622'; ctx.beginPath(); ctx.arc(0, 0, r * 1.08, 0, TAU); ctx.fill();
    SP.clearShadow(ctx);
    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip();
    inside(ctx);
    // reflexo do vidro
    const g = ctx.createLinearGradient(-r, -r, r, r);
    g.addColorStop(0, 'rgba(255,255,255,0.28)'); g.addColorStop(0.35, 'rgba(255,255,255,0.04)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(-r, -r, 2 * r, 2 * r);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = r * 0.05; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(0, 0, r * 0.8, Math.PI * 1.08, Math.PI * 1.38); ctx.stroke();
    ctx.restore();
    const ring = (rr, col, w) => { ctx.strokeStyle = P.pattern(ctx, col, 'paper', { seed: 8 }); ctx.lineWidth = w; ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.stroke(); };
    ring(r * 1.04, o.rim ?? '#1e3e4c', r * 0.11);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = r * 0.02; ctx.beginPath(); ctx.arc(0, 0, r * 1.0, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
    ctx.restore();
  }

  C.extras = { loadImages, img, imgSize, images, microbe, atom, molecule, bubble, flame, gearPiece, pipe, pointAt, tag, confetti, fly, pie, lens };
})(window);
