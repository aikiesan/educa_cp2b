/* Colagem — traço à mão: pinceladas com espessura variável, pontas afinadas,
 * "boil" (tremor quadro a quadro de desenho animado) e revelação progressiva. */
(function (G) {
  'use strict';
  const C = G.Colagem;
  const { snoise1, noise1, hrand, clamp, smooth, TAU, lerp } = C.core;
  const S = C.shapes;

  /**
   * Pincelada: pts = linha central; o = { w, color, boil, jitter, seed, progress, taper:[a,b], closed, alpha, press }
   * Devolve o comprimento desenhado (útil para saber a posição da "caneta").
   */
  function stroke(ctx, pts, o = {}) {
    if (!pts || pts.length < 2) return null;
    const w = o.w ?? 4, seed = o.seed ?? 1, boil = o.boil ?? 0, jit = o.jitter ?? 1.1;
    const closed = !!o.closed;
    let P = S.resample(pts, o.ds ?? 3.2, closed);
    if (closed) P.push([P[0][0], P[0][1]]);
    const N = S.normals(P, false);
    const L = S.length(P);
    const prog = clamp(o.progress ?? 1);
    if (prog <= 0) return null;
    const Lend = L * prog;
    const ta = o.taper ? o.taper[0] : 0.08, tb = o.taper ? o.taper[1] : 0.12;
    const left = [], right = [];
    let s = 0, tip = P[0];
    const bx = snoise1(boil * 3.1 + 0.5, seed + 71) * jit * 0.5, by = snoise1(boil * 2.7 + 9.5, seed + 73) * jit * 0.5;
    for (let i = 0; i < P.length; i++) {
      if (i > 0) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
      if (s > Lend && i > 0) break;
      const u = L > 0 ? s / L : 0;
      const j = snoise1(s * 0.018 + boil * 5.3, seed) * jit + snoise1(s * 0.07 + boil * 7.7, seed + 5) * jit * 0.35;
      const x = P[i][0] + N[i][0] * j + bx, y = P[i][1] + N[i][1] * j + by;
      const taper = (ta > 0 ? smooth(0, ta, u) * 0.85 + 0.15 : 1) * (tb > 0 ? smooth(0, tb, 1 - u) * 0.85 + 0.15 : 1);
      const press = o.press ?? 0.28;
      const ww = w * taper * (1 - press + press * 2 * noise1(s * 0.013 + boil * 1.3, seed + 3));
      left.push([x + N[i][0] * ww * 0.5, y + N[i][1] * ww * 0.5]);
      right.push([x - N[i][0] * ww * 0.5, y - N[i][1] * ww * 0.5]);
      tip = [x, y];
    }
    if (left.length < 2) return null;
    ctx.save();
    if (o.alpha != null) ctx.globalAlpha *= o.alpha;
    ctx.fillStyle = o.color ?? '#1d2f38';
    ctx.beginPath();
    S.trace(ctx, left.concat(right.reverse()), true);
    ctx.fill();
    // pontas arredondadas quando não afinadas
    if (!o.taper || o.taper[0] === 0 || o.taper[1] === 0) {
      const r0 = Math.hypot(left[0][0] - right.at(-1)[0], left[0][1] - right.at(-1)[1]) / 2;
      if (!o.taper || o.taper[0] === 0) { ctx.beginPath(); ctx.arc((left[0][0] + right.at(-1)[0]) / 2, (left[0][1] + right.at(-1)[1]) / 2, r0, 0, TAU); ctx.fill(); }
      const li = left.length - 1;
      const r1 = Math.hypot(left[li][0] - right[0][0], left[li][1] - right[0][1]) / 2;
      if (!o.taper || o.taper[1] === 0) { ctx.beginPath(); ctx.arc((left[li][0] + right[0][0]) / 2, (left[li][1] + right[0][1]) / 2, r1, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
    return { tip, drawn: Math.min(Lend, L), length: L };
  }

  /** Traço "esboçado": duas passadas levemente diferentes. */
  function sketch(ctx, pts, o = {}) {
    stroke(ctx, pts, o);
    if (o.passes !== 1) stroke(ctx, pts, { ...o, w: (o.w ?? 4) * 0.55, seed: (o.seed ?? 1) + 101, alpha: (o.alpha ?? 1) * 0.55, jitter: (o.jitter ?? 1.1) * 1.6 });
  }

  /** Círculo à mão (volta com sobreposição, como rabisco de marcador). */
  function circle(ctx, cx, cy, rx, ry = rx, o = {}) {
    const seed = o.seed ?? 3, turns = o.turns ?? 1.12, a0 = (o.start ?? hrand(seed, 1) * TAU), n = 90;
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, a = a0 + u * turns * TAU;
      const m = 1 + snoise1(u * 3 + seed, seed) * 0.04 + (u - 0.5) * 0.05;
      pts.push([cx + Math.cos(a) * rx * m, cy + Math.sin(a) * ry * m]);
    }
    return stroke(ctx, pts, { taper: [0.06, 0.1], ...o });
  }

  /** Seta curva desenhada à mão. bend = deslocamento lateral do meio (px). */
  function arrow(ctx, [x0, y0], [x1, y1], o = {}) {
    const bend = o.bend ?? 0.18, prog = clamp(o.progress ?? 1);
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
    const cx = mx - (dy / L) * L * bend, cy = my + (dx / L) * L * bend;
    const pts = [];
    for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1]); }
    const shaftP = clamp(prog / 0.8);
    stroke(ctx, pts, { taper: [0.05, 0], ...o, progress: shaftP });
    if (prog > 0.8) {
      const hp = clamp((prog - 0.8) / 0.2);
      const [ex, ey] = pts.at(-1), [px, py] = pts.at(-4);
      const ang = Math.atan2(ey - py, ex - px), hl = o.head ?? Math.max(16, (o.w ?? 5) * 4.2);
      for (const sgn of [-1, 1]) {
        const a = ang + Math.PI + sgn * 0.52;
        stroke(ctx, [[ex, ey], [ex + Math.cos(a) * hl, ey + Math.sin(a) * hl]], { ...o, taper: [0, 0.5], progress: hp, seed: (o.seed ?? 1) + (sgn > 0 ? 17 : 29) });
      }
    }
    return pts;
  }

  /** Linhas onduladas de cheiro (fedor!). phase anima a ondulação. */
  function wavy(ctx, x, y, len, o = {}) {
    const amp = o.amp ?? 8, waves = o.waves ?? 2.2, phase = o.phase ?? 0, ang = o.angle ?? -Math.PI / 2;
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const u = i / 30, off = Math.sin(u * waves * TAU + phase) * amp * (0.4 + 0.6 * u);
      pts.push([x + Math.cos(ang) * u * len - Math.sin(ang) * off, y + Math.sin(ang) * u * len + Math.cos(ang) * off]);
    }
    return stroke(ctx, pts, { taper: [0.15, 0.4], ...o });
  }

  /** Brilho de 4 pontas. */
  function sparkle(ctx, x, y, r, o = {}) {
    const rot = o.rot ?? 0;
    for (let k = 0; k < 2; k++) {
      const a = rot + k * Math.PI / 2;
      stroke(ctx, [[x - Math.cos(a) * r, y - Math.sin(a) * r], [x + Math.cos(a) * r, y + Math.sin(a) * r]], { taper: [0.45, 0.45], press: 0.1, ...o, seed: (o.seed ?? 1) + k * 7 });
    }
  }

  /** Raios em volta (explosão de energia / luz). */
  function rays(ctx, x, y, r0, r1, n, o = {}) {
    const rot = o.rot ?? 0;
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * TAU;
      const k = 0.85 + 0.3 * hrand(i, o.seed ?? 3);
      stroke(ctx, [[x + Math.cos(a) * r0, y + Math.sin(a) * r0], [x + Math.cos(a) * r1 * k, y + Math.sin(a) * r1 * k]], { taper: [0.1, 0.5], ...o, seed: (o.seed ?? 3) + i * 5 });
    }
  }

  /** Trilha tracejada (lápis) com revelação progressiva. */
  function dashed(ctx, pts, o = {}) {
    const dash = o.dash ?? 26, gap = o.gap ?? 18, prog = clamp(o.progress ?? 1);
    const P = S.resample(pts, 3, false);
    const L = S.length(P), Lend = L * prog;
    let s = 0, seg = [], k = 0, on = true, acc = 0;
    for (let i = 1; i < P.length; i++) {
      const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
      s += d; acc += d;
      if (s > Lend) break;
      if (on) seg.push(P[i]);
      if (on && acc >= dash) { if (seg.length > 1) stroke(ctx, seg, { taper: [0.2, 0.2], ...o, seed: (o.seed ?? 1) + k * 13, progress: 1 }); seg = []; on = false; acc = 0; k++; }
      else if (!on && acc >= gap) { on = true; acc = 0; seg = [P[i]]; }
    }
    if (on && seg.length > 1) stroke(ctx, seg, { taper: [0.2, 0.2], ...o, seed: (o.seed ?? 1) + k * 13, progress: 1 });
  }

  /** Hachura (sombreado de lápis de cor) dentro de um polígono. */
  function hatch(ctx, poly, o = {}) {
    const b = S.bbox(poly), ang = o.angle ?? -0.9, gapH = o.gap ?? 9;
    ctx.save();
    ctx.beginPath(); S.trace(ctx, poly, true); ctx.clip();
    const diag = Math.hypot(b.w, b.h), cx = b.cx, cy = b.cy;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    let i = 0;
    for (let d = -diag / 2; d <= diag / 2; d += gapH) {
      const x0 = cx - ca * diag / 2 - sa * d, y0 = cy - sa * diag / 2 + ca * d;
      const x1 = cx + ca * diag / 2 - sa * d, y1 = cy + sa * diag / 2 + ca * d;
      stroke(ctx, [[x0, y0], [x1, y1]], { w: o.w ?? 2, color: o.color, alpha: o.alpha ?? 0.35, taper: [0.1, 0.1], jitter: 1.4, seed: (o.seed ?? 1) + i++, boil: o.boil ?? 0 });
    }
    ctx.restore();
  }

  C.ink = { stroke, sketch, circle, arrow, wavy, sparkle, rays, dashed, hatch };
})(window);
