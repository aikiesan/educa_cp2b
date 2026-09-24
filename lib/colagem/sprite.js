/* Colagem — peças de papel recortado, sprites em cache, fita crepe e olhinhos móveis. */
(function (G) {
  'use strict';
  const C = G.Colagem;
  const { hrand, mixHex, shade, rgba, clamp, TAU } = C.core;
  const S = C.shapes, P = C.paper, I = C.ink;

  const INK = '#1b2a33';

  function fillPoly(ctx, pts) { ctx.beginPath(); S.trace(ctx, pts, true); ctx.fill(); }

  /** Sombra projetada (em pixels de tela) de acordo com o zoom corrente. */
  function setShadow(ctx, zoom = 1, lift = 0, strength = 1) {
    ctx.shadowColor = `rgba(38, 24, 10, ${0.26 * strength * (1 - lift * 0.25)})`;
    ctx.shadowBlur = (5 + lift * 22) * zoom;
    ctx.shadowOffsetX = (2.5 + lift * 10) * zoom;
    ctx.shadowOffsetY = (4 + lift * 16) * zoom;
  }
  function clearShadow(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; }

  /**
   * Peça de papel recortado desenhada em coordenadas LOCAIS (a textura acompanha a peça).
   * o: color, kind, strength, seed, torn, border{w,color,torn}, shade, edge, ink{w,color,offset,boil}, shadow{zoom,lift,strength}
   */
  function piece(ctx, pts, o = {}) {
    const seed = o.seed ?? 1;
    const col = o.color ?? '#e9dcc4';
    const patOpt = { strength: o.strength ?? 1, seed: o.texSeed ?? 7, ox: hrand(seed, 1) * 640, oy: hrand(seed, 2) * 640, scale: o.patScale ?? 1, rot: o.patRot ?? hrand(seed, 3) * 360 };
    let poly = pts;
    let shadowed = false;
    const applyShadow = () => { if (o.shadow && !shadowed) { setShadow(ctx, o.shadow.zoom ?? 1, o.shadow.lift ?? 0, o.shadow.strength ?? 1); shadowed = true; } };
    if (o.border) {
      const bw = o.border.w ?? 7;
      let bp = S.offset(S.resample(poly, 4, true), bw);
      if (o.border.torn) bp = S.tear(bp, { amp: o.border.torn === true ? 2.6 : o.border.torn, seed: seed + 50 });
      ctx.fillStyle = P.pattern(ctx, o.border.color ?? '#fbf8f0', 'smooth', { ...patOpt, strength: 0.8 });
      applyShadow();
      fillPoly(ctx, bp);
      clearShadow(ctx);
      ctx.strokeStyle = 'rgba(60,40,20,0.14)'; ctx.lineWidth = 1;
      ctx.beginPath(); S.trace(ctx, bp, true); ctx.stroke();
    }
    if (o.torn) {
      const amp = o.torn === true ? 3.2 : o.torn;
      const outer = S.tear(poly, { amp, seed });
      ctx.fillStyle = P.pattern(ctx, mixHex(col, '#fffaf0', 0.8), 'smooth', patOpt);
      applyShadow();
      fillPoly(ctx, outer);
      clearShadow(ctx);
      poly = S.tear(S.offset(S.resample(poly, 4, true), -amp * 0.75), { amp: amp * 0.65, seed: seed + 1 });
    }
    ctx.fillStyle = P.pattern(ctx, col, o.kind ?? 'paper', patOpt);
    applyShadow();
    fillPoly(ctx, poly);
    clearShadow(ctx);
    if ((o.shade ?? 1) > 0) {
      const b = S.bbox(poly);
      const g = ctx.createLinearGradient(b.x0, b.y0, b.x1, b.y1);
      const k = o.shade ?? 1;
      g.addColorStop(0, `rgba(255,250,235,${0.12 * k})`);
      g.addColorStop(0.55, 'rgba(0,0,0,0)');
      g.addColorStop(1, `rgba(30,15,0,${0.14 * k})`);
      ctx.fillStyle = g; fillPoly(ctx, poly);
    }
    if ((o.edge ?? 0.18) > 0 && !o.torn) {
      ctx.strokeStyle = `rgba(35,20,5,${o.edge ?? 0.18})`; ctx.lineWidth = o.edgeW ?? 1.1;
      ctx.beginPath(); S.trace(ctx, poly, true); ctx.stroke();
    }
    if (o.ink) {
      const [dx, dy] = o.ink.offset ?? [1.6, -1.2];
      I.stroke(ctx, S.xform(poly, { x: dx, y: dy }), { closed: true, w: o.ink.w ?? 3, color: o.ink.color ?? INK, seed: seed + 9, boil: o.ink.boil ?? 0, jitter: o.ink.jitter ?? 0.7, taper: [0, 0], alpha: o.ink.alpha ?? 0.92 });
    }
    return poly;
  }

  // ---------- sprites em cache ----------
  const cache = new Map();
  class Sprite {
    constructor(w, h, o = {}) {
      this.w = w; this.h = h;
      this.res = o.res ?? 1.5;
      this.pad = o.pad ?? 24;
      this.ax = o.ax ?? w / 2; this.ay = o.ay ?? h / 2;
      this.canvas = P.canvas((w + 2 * this.pad) * this.res, (h + 2 * this.pad) * this.res);
      const g = this.canvas.getContext('2d');
      g.scale(this.res, this.res);
      g.translate(this.pad, this.pad);
      this.g = g;
    }
    /** Desenha com a origem no ponto de ancoragem, já transformado pelo chamador. */
    blit(ctx, alpha = 1) {
      const a = ctx.globalAlpha; ctx.globalAlpha = a * alpha;
      ctx.drawImage(this.canvas, -this.ax - this.pad, -this.ay - this.pad, this.w + 2 * this.pad, this.h + 2 * this.pad);
      ctx.globalAlpha = a;
    }
  }
  function sprite(key, w, h, draw, o = {}) {
    if (cache.has(key)) return cache.get(key);
    const s = new Sprite(w, h, o);
    draw(s.g, s);
    cache.set(key, s);
    return s;
  }
  /** Coloca sprite: posição/rotação/escala + sombra que cresce quando a peça é "erguida". */
  function place(ctx, spr, x, y, o = {}) {
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    const sx = (o.sx ?? o.s ?? 1), sy = (o.sy ?? o.s ?? 1);
    if (sx !== 1 || sy !== 1) ctx.scale(sx, sy);
    if (o.shadow !== false) setShadow(ctx, (o.zoom ?? 1) * Math.abs(sx), o.lift ?? 0, o.shadowStrength ?? 1);
    spr.blit(ctx, o.alpha ?? 1);
    ctx.restore();
  }

  // ---------- fita crepe ----------
  function tape(ctx, x, y, w, h, rot = 0, o = {}) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    const seed = o.seed ?? 5;
    const pts = [];
    const zig = (x0, y0, x1, y1, n) => { for (let i = 0; i <= n; i++) { const t = i / n; pts.push([x0 + (x1 - x0) * t + (hrand(i, seed) - 0.5) * 3, y0 + (y1 - y0) * t]); } };
    pts.push([-w / 2, -h / 2], [w / 2, -h / 2]);
    zig(w / 2, -h / 2, w / 2, h / 2, 6);
    pts.push([-w / 2, h / 2]);
    const left = []; for (let i = 6; i >= 0; i--) { const t = i / 6; left.push([-w / 2 + (hrand(i, seed + 3) - 0.5) * 3, -h / 2 + h * t]); }
    const poly = pts.concat(left);
    ctx.globalAlpha = o.alpha ?? 0.86;
    setShadow(ctx, o.zoom ?? 1, 0, 0.35);
    ctx.fillStyle = P.pattern(ctx, o.color ?? '#efe2b8', 'smooth', { seed: 9, ox: seed * 31, oy: seed * 17, strength: 1.4 });
    fillPoly(ctx, poly);
    clearShadow(ctx);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(-w / 2, -h / 2, w, h * 0.3);
    ctx.restore();
  }

  // ---------- olhinhos móveis (googly eyes) ----------
  /** px,py em [-1,1] = direção da pupila (a gravidade puxa para baixo). */
  function googly(ctx, x, y, r, px = 0, py = 0.6, o = {}) {
    ctx.save();
    ctx.translate(x, y);
    setShadow(ctx, o.zoom ?? 1, 0, 0.8);
    ctx.fillStyle = '#fbfbf7';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    clearShadow(ctx);
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(90,90,100,0.28)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(30,30,40,0.35)'; ctx.lineWidth = Math.max(1, r * 0.06);
    ctx.beginPath(); ctx.arc(0, 0, r * 0.97, 0, TAU); ctx.stroke();
    const pr = r * (o.pupil ?? 0.52);
    const m = Math.hypot(px, py), lim = r - pr - r * 0.06;
    const k = m > 1 ? 1 / m : 1;
    ctx.fillStyle = '#121417';
    ctx.beginPath(); ctx.arc(px * k * lim, py * k * lim, pr, 0, TAU); ctx.fill();
    // reflexo fixo da cúpula de plástico
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.ellipse(-r * 0.38, -r * 0.42, r * 0.2, r * 0.13, -0.6, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /** Pupila "atrasada": desloca na direção oposta à velocidade (física de olhinho). */
  function lagPupil(vx, vy, k = 0.004, wob = 0) {
    let px = -vx * k + Math.sin(wob) * 0.12, py = 0.62 - vy * k + Math.cos(wob * 1.3) * 0.08;
    const m = Math.hypot(px, py); if (m > 1) { px /= m; py /= m; }
    return [px, py];
  }

  C.sprite = { INK, piece, fillPoly, setShadow, clearShadow, Sprite, sprite, place, tape, googly, lagPupil, cache };
})(window);
