/* Colagem — formas "recortadas à mão": polígonos com tremor de tesoura,
 * bordas rasgadas, amostragem de caminhos SVG e utilidades geométricas. */
(function (G) {
  'use strict';
  const C = G.Colagem;
  const { noise2, snoise1, hrand, R, TAU, lerp } = C.core;

  // ---------- utilidades ----------
  function bbox(pts) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) { if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }
  function xform(pts, { x = 0, y = 0, s = 1, sx = s, sy = s, rot = 0 } = {}) {
    const c = Math.cos(rot), n = Math.sin(rot);
    return pts.map(([px, py]) => { const a = px * sx, b = py * sy; return [x + a * c - b * n, y + a * n + b * c]; });
  }
  function trace(ctx, pts, closed = true) {
    if (!pts.length) return;
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (closed) ctx.closePath();
  }
  function length(pts, closed = false) {
    let L = 0;
    for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (closed && pts.length > 1) L += Math.hypot(pts[0][0] - pts.at(-1)[0], pts[0][1] - pts.at(-1)[1]);
    return L;
  }
  /** Reamostra por comprimento de arco (espaçamento ~ds). */
  function resample(pts, ds, closed = false) {
    const src = closed ? pts.concat([pts[0]]) : pts;
    const out = [src[0]];
    let carry = 0;
    for (let i = 1; i < src.length; i++) {
      const [ax, ay] = src[i - 1], [bx, by] = src[i];
      const seg = Math.hypot(bx - ax, by - ay);
      let d = ds - carry;
      while (d <= seg) { const t = d / seg; out.push([ax + (bx - ax) * t, ay + (by - ay) * t]); d += ds; }
      carry = seg - (d - ds);
    }
    if (!closed) out.push(src.at(-1)); else if (out.length > 2) out.pop();
    return out;
  }
  /** Catmull-Rom (fechado ou aberto) → pontos densos. */
  function spline(ctrl, closed = true, per = 8) {
    const n = ctrl.length, out = [];
    const P = (i) => closed ? ctrl[(i + n) % n] : ctrl[Math.max(0, Math.min(n - 1, i))];
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (let k = 0; k < per; k++) {
        const t = k / per, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    if (!closed) out.push(ctrl[n - 1]);
    return out;
  }
  /** Normais (para polígono fechado, orientação qualquer). */
  function normals(pts, closed = true) {
    const n = pts.length, out = new Array(n);
    for (let i = 0; i < n; i++) {
      const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      out[i] = [dy / L, -dx / L];
    }
    return out;
  }
  function area(pts) { let s = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
  /** Desloca o contorno para fora (d>0) ou para dentro. */
  function offset(pts, d) {
    const sgn = area(pts) > 0 ? 1 : -1; // garante "para fora" (y para baixo: área>0 ⇒ normais já apontam para fora)
    const N = normals(pts, true);
    return pts.map(([x, y], i) => [x + N[i][0] * d * sgn, y + N[i][1] * d * sgn]);
  }

  // ---------- geradores ----------
  /** Elipse com tremor orgânico (recorte à mão livre). */
  function blob(cx, cy, rx, ry = rx, o = {}) {
    const n = o.n ?? 72, seed = o.seed ?? 1, wob = o.wobble ?? 0.06, fq = o.freq ?? 1.6, rot = o.rot ?? 0;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const nx = Math.cos(a) * fq, ny = Math.sin(a) * fq;
      const m = 1 + wob * (noise2(nx + 10, ny + 10, seed) * 2 - 1) + wob * 0.35 * (noise2(nx * 3 + 40, ny * 3, seed + 7) * 2 - 1);
      const px = Math.cos(a) * rx * m, py = Math.sin(a) * ry * m;
      pts.push([cx + px * Math.cos(rot) - py * Math.sin(rot), cy + px * Math.sin(rot) + py * Math.cos(rot)]);
    }
    return pts;
  }
  /** Polígono a partir de vértices, com subdivisão e tremor de tesoura. */
  function cut(verts, o = {}) {
    const seed = o.seed ?? 3, jit = o.jitter ?? 1.2, ds = o.ds ?? 10, round = o.round ?? 0;
    let pts = [];
    const n = verts.length;
    for (let i = 0; i < n; i++) {
      const a = verts[i], b = verts[(i + 1) % n];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const steps = Math.max(1, Math.round(L / ds));
      const bow = (hrand(i, seed) * 2 - 1) * (o.bow ?? 0.012) * L; // leve curvatura de cada corte
      const nx = -(b[1] - a[1]) / (L || 1), ny = (b[0] - a[0]) / (L || 1);
      for (let k = 0; k < steps; k++) {
        const t = k / steps, arc = Math.sin(Math.PI * t) * bow;
        const j = snoise1(i * 7.3 + t * L * 0.08, seed) * jit;
        pts.push([lerp(a[0], b[0], t) + nx * (arc + j), lerp(a[1], b[1], t) + ny * (arc + j)]);
      }
    }
    if (round > 0) pts = spline(resample(pts, Math.max(4, round), true), true, 3);
    return pts;
  }
  /** Retângulo arredondado recortado (x,y = canto superior esquerdo). */
  function rrect(x, y, w, h, r = 0, o = {}) {
    if (r <= 0) return cut([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], o);
    const v = [], seg = 5;
    const corner = (cx, cy, a0) => { for (let k = 0; k <= seg; k++) { const a = a0 + (k / seg) * (Math.PI / 2); v.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    corner(x + w - r, y + r, -Math.PI / 2); corner(x + w - r, y + h - r, 0); corner(x + r, y + h - r, Math.PI / 2); corner(x + r, y + r, Math.PI);
    return cut(v, { ds: 8, ...o });
  }
  /** Borda rasgada: fibras de alta frequência ao longo do contorno. */
  function tear(pts, o = {}) {
    const amp = o.amp ?? 3.5, seed = o.seed ?? 11, ds = o.ds ?? 3;
    const P = resample(pts, ds, true);
    const N = normals(P, true);
    const sgn = area(P) > 0 ? -1 : 1;
    let s = 0;
    return P.map(([x, y], i) => {
      s += ds;
      const big = snoise1(s * 0.035, seed) * amp * 1.2;
      const mid = snoise1(s * 0.16, seed + 3) * amp * 0.6;
      const fine = (hrand(i, seed + 9) * 2 - 1) * amp * 0.45;
      const d = (big + mid + fine) * sgn;
      return [x + N[i][0] * d, y + N[i][1] * d];
    });
  }
  /** Estrela / explosão de pontas. */
  function star(cx, cy, r0, r1, spikes = 5, o = {}) {
    const v = [], rot = o.rot ?? -Math.PI / 2, rr = R(o.seed ?? 5);
    for (let i = 0; i < spikes * 2; i++) {
      const a = rot + (i / (spikes * 2)) * TAU, r = (i % 2 ? r0 : r1) * (1 + rr.sym(o.irregular ?? 0.05));
      v.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return cut(v, { ds: 12, jitter: 0.8, ...o });
  }
  /** Engrenagem. */
  function gear(cx, cy, r, teeth = 10, o = {}) {
    const v = [], depth = o.depth ?? r * 0.18, tw = o.tooth ?? 0.42;
    for (let i = 0; i < teeth; i++) {
      const a0 = (i / teeth) * TAU, da = TAU / teeth;
      const pts = [[a0, r - depth], [a0 + da * (0.5 - tw / 2) , r - depth], [a0 + da * (0.5 - tw / 2 + 0.06), r], [a0 + da * (0.5 + tw / 2 - 0.06), r], [a0 + da * (0.5 + tw / 2), r - depth]];
      for (const [a, rr] of pts) v.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    return cut(v, { ds: 6, jitter: 0.5, ...o });
  }

  // ---------- caminhos SVG ----------
  let svgNS = null;
  /** Amostra um "d" de SVG em polígonos (um por subcaminho). */
  function fromSvg(d, o = {}) {
    if (!svgNS) {
      svgNS = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgNS.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden';
      document.body.appendChild(svgNS);
    }
    const ds = o.ds ?? 3;
    const parts = d.match(/[Mm][^Mm]*/g) || [];
    const out = [];
    let cursor = [0, 0];
    for (let p of parts) {
      // subcaminhos relativos (m) precisam do ponto corrente: converte em absoluto
      if (p[0] === 'm') {
        const m = p.match(/m\s*(-?[\d.]+)[\s,]*(-?[\d.]+)/);
        if (m) p = 'M' + (cursor[0] + +m[1]) + ',' + (cursor[1] + +m[2]) + p.slice(m[0].length);
      }
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      el.setAttribute('d', p);
      svgNS.appendChild(el);
      const L = el.getTotalLength();
      const n = Math.max(8, Math.ceil(L / ds));
      const pts = [];
      for (let i = 0; i < n; i++) { const q = el.getPointAtLength((i / n) * L); pts.push([q.x, q.y]); }
      const end = el.getPointAtLength(L); cursor = [end.x, end.y];
      el.remove();
      out.push(pts);
    }
    return out;
  }

  C.shapes = { bbox, xform, trace, length, resample, spline, normals, area, offset, blob, cut, rrect, tear, star, gear, fromSvg };
})(window);
