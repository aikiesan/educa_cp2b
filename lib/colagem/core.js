/* Colagem — núcleo determinístico: PRNG, ruído, easing, tempo em "stop-motion".
 * Tudo que é aleatório deriva de sementes: o mesmo instante t sempre gera o mesmo quadro. */
(function (G) {
  'use strict';
  const C = (G.Colagem = G.Colagem || {});

  // ---------- PRNG & hash ----------
  function hashStr(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function mix32(h) {
    h ^= h >>> 16; h = Math.imul(h, 0x7feb352d);
    h ^= h >>> 15; h = Math.imul(h, 0x846ca68b);
    h ^= h >>> 16; return h >>> 0;
  }
  function seedOf(s) { return typeof s === 'string' ? hashStr(s) : (s >>> 0); }
  /** Hash de inteiros → [0,1). */
  function hrand(a, b = 0, c = 0) {
    let h = mix32((a | 0) ^ 0x9e3779b9);
    h = mix32(h ^ ((b | 0) + 0x85ebca6b));
    h = mix32(h ^ ((c | 0) + 0xc2b2ae35));
    return h / 4294967296;
  }
  function rng(seed) {
    let a = seedOf(seed) || 1;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /** Utilidades sobre um rng: faixa, sinal, escolha. */
  function R(seed) {
    const r = rng(seed);
    return {
      next: r,
      range: (a, b) => a + (b - a) * r(),
      sym: (a) => (r() * 2 - 1) * a,
      int: (a, b) => Math.floor(a + (b - a + 1) * r()),
      pick: (arr) => arr[Math.floor(r() * arr.length) % arr.length],
      chance: (p) => r() < p,
    };
  }

  // ---------- ruído ----------
  const fade = (f) => f * f * (3 - 2 * f);
  function noise1(x, seed = 0) {
    const i = Math.floor(x), f = x - i;
    return hrand(i, seed) + (hrand(i + 1, seed) - hrand(i, seed)) * fade(f);
  }
  const snoise1 = (x, seed = 0) => noise1(x, seed) * 2 - 1;
  function noise2(x, y, seed = 0) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const a = hrand(ix, iy, seed), b = hrand(ix + 1, iy, seed);
    const c = hrand(ix, iy + 1, seed), d = hrand(ix + 1, iy + 1, seed);
    const u = fade(fx), v = fade(fy);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm1(x, seed = 0, oct = 3) {
    let s = 0, amp = 0.5, f = 1, n = 0;
    for (let o = 0; o < oct; o++) { s += amp * snoise1(x * f, seed + o * 131); n += amp; amp *= 0.5; f *= 2.03; }
    return s / n;
  }

  // ---------- matemática ----------
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const invlerp = (a, b, v) => clamp((v - a) / (b - a));
  const remap = (v, a, b, c, d) => lerp(c, d, invlerp(a, b, v));
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
  const TAU = Math.PI * 2;
  const deg = (d) => (d * Math.PI) / 180;

  // ---------- easing ----------
  const E = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    outSine: (t) => Math.sin((t * Math.PI) / 2),
    outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inOutExpo: (t) => (t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2),
    outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
    inBack: (t, s = 1.70158) => (s + 1) * t * t * t - s * t * t,
    outElastic: (t) => (t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin(((t * 10 - 0.75) * TAU) / 3) + 1),
    outBounce: (t) => {
      const n1 = 7.5625, d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
  };

  /** Progresso 0→1 entre t0 e t1 com easing. */
  function tw(t, t0, t1, ease = E.inOutCubic) {
    if (t <= t0) return 0;
    if (t >= t1) return 1;
    return ease((t - t0) / (t1 - t0));
  }
  /** Tempo quantizado ("animação em dois" = 12 poses por segundo). */
  function step(t, fps = 12) { return Math.floor(t * fps + 1e-6) / fps; }
  /** Oscilação amortecida que começa em t0 (para "assentar" peças). */
  function settle(t, t0, freq = 2.6, decay = 5.5) {
    if (t < t0) return 0;
    const d = t - t0;
    return Math.exp(-decay * d) * Math.sin(TAU * freq * d);
  }
  /** Pulso 0→1→0 centrado em tc com meia-largura w. */
  function pulse(t, tc, w) { const d = Math.abs(t - tc) / w; return d >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * d); }
  /** Interpola uma lista de keyframes [{t, v, e}] (v numérico ou array). */
  function keys(t, kf) {
    if (t <= kf[0].t) return kf[0].v;
    for (let i = 1; i < kf.length; i++) {
      if (t <= kf[i].t) {
        const a = kf[i - 1], b = kf[i];
        const p = (b.e || E.inOutCubic)((t - a.t) / (b.t - a.t));
        if (Array.isArray(a.v)) return a.v.map((x, k) => lerp(x, b.v[k], p));
        return lerp(a.v, b.v, p);
      }
    }
    return kf[kf.length - 1].v;
  }

  // ---------- cor ----------
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgbToHex([r, g, b]) {
    return '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
  }
  function shade(hex, amt) { // amt −1..1 (escurece/clareia)
    const c = hexToRgb(hex);
    return rgbToHex(c.map((v) => (amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  }
  function mixHex(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(A.map((v, i) => lerp(v, B[i], t))); }
  function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }

  C.core = {
    hashStr, seedOf, hrand, rng, R, noise1, snoise1, noise2, fbm1,
    clamp, lerp, invlerp, remap, smooth, TAU, deg, E, tw, step, settle, pulse, keys,
    hexToRgb, rgbToHex, shade, mixHex, rgba,
  };
})(typeof window !== 'undefined' ? window : globalThis);
