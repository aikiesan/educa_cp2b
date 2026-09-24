/* Colagem — texturas de papel procedurais e "tileáveis".
 * Um mapa de detalhe em cinza (128 = neutro) é gerado por tipo de papel; cada cor
 * recebe uma versão tingida (modo overlay), usada como padrão de preenchimento. */
(function (G) {
  'use strict';
  const C = G.Colagem;
  const { hrand, rng, clamp } = C.core;

  const SIZE = 640;
  const detailCache = new Map();
  const tileCache = new Map();

  function canvas(w, h = w) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(w); c.height = Math.ceil(h);
    return c;
  }

  // Ruído de valor periódico (período P células) → tileável.
  function periodicLayer(size, P, seed) {
    const lat = new Float32Array(P * P);
    for (let j = 0; j < P; j++) for (let i = 0; i < P; i++) lat[j * P + i] = hrand(i, j, seed) * 2 - 1;
    const out = new Float32Array(size * size);
    const cell = size / P;
    for (let y = 0; y < size; y++) {
      const gy = y / cell, j0 = Math.floor(gy), fy = gy - j0, v = fy * fy * (3 - 2 * fy);
      const r0 = (j0 % P) * P, r1 = ((j0 + 1) % P) * P;
      for (let x = 0; x < size; x++) {
        const gx = x / cell, i0 = Math.floor(gx), fx = gx - i0, u = fx * fx * (3 - 2 * fx);
        const i1 = (i0 + 1) % P, ii = i0 % P;
        const a = lat[r0 + ii], b = lat[r0 + i1], c = lat[r1 + ii], d = lat[r1 + i1];
        out[y * size + x] = a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
      }
    }
    return out;
  }

  const KINDS = {
    // papel-cartão / color set: fibras e manchas suaves
    paper: { mottle: [[4, 9], [9, 5]], mid: [[24, 4], [48, 3]], grain: 7, fibers: 2600, fiberA: 0.07, tooth: 26, flecks: 0 },
    // papel kraft: manchas fortes + pintinhas escuras
    kraft: { mottle: [[3, 14], [7, 8]], mid: [[20, 6], [44, 4]], grain: 9, fibers: 4200, fiberA: 0.1, tooth: 30, flecks: 900 },
    // papel liso (etiquetas, cartões)
    smooth: { mottle: [[4, 4]], mid: [[32, 2]], grain: 5, fibers: 900, fiberA: 0.045, tooth: 14, flecks: 0 },
    // aquarela: manchas grandes e bordas de poça
    watercolor: { mottle: [[3, 22], [6, 14], [12, 7]], mid: [[40, 3]], grain: 6, fibers: 700, fiberA: 0.05, tooth: 40, flecks: 0, pools: true },
    // papelão ondulado (listras)
    cardboard: { mottle: [[4, 8]], mid: [[28, 4]], grain: 8, fibers: 1800, fiberA: 0.08, tooth: 20, flecks: 300, stripes: 18 },
  };

  function detail(kind = 'paper', seed = 7) {
    const key = kind + ':' + seed;
    if (detailCache.has(key)) return detailCache.get(key);
    const k = KINDS[kind] || KINDS.paper;
    const S = SIZE;
    const acc = new Float32Array(S * S);
    let sd = seed * 97 + 13;
    for (const [P, amp] of k.mottle) { const L = periodicLayer(S, P, sd++); for (let i = 0; i < acc.length; i++) acc[i] += L[i] * amp; }
    for (const [P, amp] of k.mid) { const L = periodicLayer(S, P, sd++); for (let i = 0; i < acc.length; i++) acc[i] += L[i] * amp; }
    if (k.pools) { // realça bordas de manchas (efeito aquarela)
      const L = periodicLayer(S, 5, sd++);
      for (let i = 0; i < acc.length; i++) { const e = 1 - Math.min(1, Math.abs(L[i]) * 6); acc[i] -= e * e * 10; }
    }
    // "dente" do papel: relevo com luz diagonal
    const H = periodicLayer(S, 96, sd++);
    const H2 = periodicLayer(S, 190, sd++);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const i = y * S + x;
      const xm = (x + S - 1) % S, ym = (y + S - 1) % S, xp = (x + 1) % S, yp = (y + 1) % S;
      const dh = (H[ym * S + xm] - H[yp * S + xp]) + 0.6 * (H2[ym * S + xm] - H2[yp * S + xp]);
      acc[i] += dh * k.tooth * 0.5;
    }
    if (k.stripes) {
      for (let y = 0; y < S; y++) {
        const s = Math.sin((y / S) * Math.PI * 2 * k.stripes);
        for (let x = 0; x < S; x++) acc[y * S + x] += s * 7;
      }
    }
    const r = rng(seed * 31 + 5);
    const c = canvas(S);
    const g = c.getContext('2d');
    const img = g.createImageData(S, S);
    for (let i = 0; i < acc.length; i++) {
      const v = clamp(128 + acc[i] + (r() * 2 - 1) * k.grain, 0, 255);
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    // fibras: curvas finas claras/escuras, desenhadas com "wrap" para manter o tile
    g.lineCap = 'round';
    for (let f = 0; f < k.fibers; f++) {
      const x = r() * S, y = r() * S, len = 6 + r() * 34, a0 = r() * Math.PI * 2, bend = (r() - 0.5) * 1.2;
      const light = r() < 0.55;
      g.strokeStyle = light ? `rgba(255,255,255,${k.fiberA * (0.6 + r())})` : `rgba(0,0,0,${k.fiberA * (0.4 + r() * 0.8)})`;
      g.lineWidth = 0.4 + r() * 0.9;
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
        if (x + ox < -60 || x + ox > S + 60 || y + oy < -60 || y + oy > S + 60) continue;
        g.beginPath();
        g.moveTo(x + ox, y + oy);
        g.quadraticCurveTo(x + ox + Math.cos(a0 + bend) * len * 0.5, y + oy + Math.sin(a0 + bend) * len * 0.5,
          x + ox + Math.cos(a0) * len, y + oy + Math.sin(a0) * len);
        g.stroke();
      }
    }
    for (let f = 0; f < k.flecks; f++) {
      const x = r() * S, y = r() * S, rr = 0.4 + r() * 1.3;
      g.fillStyle = `rgba(40,25,10,${0.18 + r() * 0.35})`;
      g.beginPath(); g.ellipse(x, y, rr, rr * (0.5 + r() * 0.5), r() * 3, 0, Math.PI * 2); g.fill();
    }
    detailCache.set(key, c);
    return c;
  }

  /** Tile tingido: cor base × detalhe do papel (overlay). */
  function tile(color, kind = 'paper', strength = 1, seed = 7) {
    const key = [color, kind, strength, seed].join('|');
    if (tileCache.has(key)) return tileCache.get(key);
    const d = detail(kind, seed);
    const c = canvas(SIZE);
    const g = c.getContext('2d');
    g.fillStyle = color; g.fillRect(0, 0, SIZE, SIZE);
    g.globalCompositeOperation = 'overlay';
    g.globalAlpha = strength;
    g.drawImage(d, 0, 0);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    tileCache.set(key, c);
    return c;
  }

  /** Padrão de preenchimento com deslocamento/escala/rotação (transform do padrão). */
  function pattern(ctx, color, kind = 'paper', o = {}) {
    const p = ctx.createPattern(tile(color, kind, o.strength ?? 1, o.seed ?? 7), 'repeat');
    const s = o.scale ?? 1;
    const m = new DOMMatrix().translateSelf(o.ox ?? 0, o.oy ?? 0).rotateSelf(o.rot ?? 0).scaleSelf(s, s);
    p.setTransform(m);
    return p;
  }

  /** Quadros de granulação de filme (tileáveis) para pós-processamento. */
  const grainFrames = [];
  function grain(i) {
    if (!grainFrames.length) {
      for (let f = 0; f < 6; f++) {
        const S = 384, c = canvas(S), g = c.getContext('2d');
        const img = g.createImageData(S, S), r = rng(900 + f);
        for (let p = 0; p < S * S; p++) {
          const v = 128 + (r() + r() + r() - 1.5) * 70;
          img.data[p * 4] = img.data[p * 4 + 1] = img.data[p * 4 + 2] = v;
          img.data[p * 4 + 3] = 255;
        }
        g.putImageData(img, 0, 0);
        grainFrames.push(c);
      }
    }
    return grainFrames[((i % grainFrames.length) + grainFrames.length) % grainFrames.length];
  }

  C.paper = { SIZE, canvas, detail, tile, pattern, grain, KINDS };
})(window);
