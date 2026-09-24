/* Colagem — tipografia: letra de mão com tremor, letras recortadas (bilhete de resgate),
 * carimbos e fórmulas químicas com subscrito de verdade. */
(function (G) {
  'use strict';
  const C = G.Colagem;
  const { snoise1, hrand, R, clamp, mixHex, TAU } = C.core;
  const S = C.shapes, P = C.paper, SP = C.sprite;

  /** Texto manuscrito glifo a glifo. o: font, size, weight, color, align, rot, boil, jitter, progress, spacing, lh */
  function hand(ctx, str, x, y, o = {}) {
    const size = o.size ?? 48, font = o.font ?? 'Caveat', weight = o.weight ?? 700;
    const lines = String(str).split('\n');
    const lh = (o.lh ?? 1.05) * size;
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    ctx.font = `${weight} ${size}px "${font}"`;
    ctx.textBaseline = 'alphabetic';
    const total = lines.reduce((n, l) => n + l.length, 0);
    let shown = Math.round(clamp(o.progress ?? 1) * total);
    const jit = o.jitter ?? 0.9, boil = o.boil ?? 0, seed = o.seed ?? 1, sp = o.spacing ?? 0;
    let gi = 0;
    lines.forEach((line, li) => {
      const widths = [...line].map((ch) => ctx.measureText(ch).width + sp);
      const W = widths.reduce((a, b) => a + b, 0) - sp;
      let cx = o.align === 'left' ? 0 : o.align === 'right' ? -W : -W / 2;
      const cy = (li - (lines.length - 1) / 2) * lh + size * 0.34;
      [...line].forEach((ch, k) => {
        if (gi >= shown) { gi++; return; }
        const dx = snoise1(gi * 1.7 + boil * 3.3, seed) * jit, dy = snoise1(gi * 2.3 + boil * 2.9, seed + 3) * jit;
        const rr = snoise1(gi * 0.9 + boil * 1.7, seed + 7) * 0.035 * (jit > 0 ? 1 : 0);
        ctx.save();
        ctx.translate(cx + widths[k] / 2 + dx, cy + dy);
        ctx.rotate(rr);
        if (o.stroke) { ctx.lineJoin = 'round'; ctx.strokeStyle = o.stroke; ctx.lineWidth = o.strokeW ?? size * 0.16; ctx.strokeText(ch, -widths[k] / 2 + sp / 2, 0); }
        ctx.fillStyle = o.color ?? SP.INK;
        ctx.fillText(ch, -widths[k] / 2 + sp / 2, 0);
        ctx.restore();
        cx += widths[k]; gi++;
      });
    });
    ctx.restore();
  }

  /** Mede a largura de uma linha manuscrita. */
  function measure(ctx, str, o = {}) {
    ctx.save();
    ctx.font = `${o.weight ?? 700} ${o.size ?? 48}px "${o.font ?? 'Caveat'}"`;
    const w = [...String(str)].reduce((a, ch) => a + ctx.measureText(ch).width + (o.spacing ?? 0), 0) - (o.spacing ?? 0);
    ctx.restore();
    return w;
  }

  // ---------- letras recortadas ----------
  const RANSOM_FONTS = ['Luckiest Guy', 'Alfa Slab One', 'Abril Fatface', 'Bungee', 'Anton', 'Titan One', 'Archivo Black', 'Lilita One', 'Shrikhand', 'Ultra'];
  /**
   * Cria o sprite de uma letra recortada. o: size, font, paper, ink, seed, pad
   * Retorna {spr, w, h}.
   */
  function letterTile(ch, o = {}) {
    const seed = o.seed ?? 1, rr = R(seed * 13 + ch.charCodeAt(0));
    const size = o.size ?? 120;
    const font = o.font ?? rr.pick(RANSOM_FONTS);
    const key = ['tile', ch, size, font, o.paper, o.ink, seed, o.kind].join('|');
    // mede
    const mc = P.canvas(4, 4).getContext('2d');
    mc.font = `${size}px "${font}"`;
    const m = mc.measureText(ch);
    const asc = m.actualBoundingBoxAscent || size * 0.72, desc = m.actualBoundingBoxDescent || 0;
    const gw = Math.max(m.actualBoundingBoxRight + m.actualBoundingBoxLeft || m.width, size * 0.3);
    const padX = size * (o.padX ?? 0.16), padY = size * (o.padY ?? 0.14);
    const w = gw + padX * 2, h = asc + desc + padY * 2;
    const spr = SP.sprite(key, w, h, (g) => {
      const j = size * 0.06;
      const quad = [[rr.sym(j), rr.sym(j)], [w + rr.sym(j), rr.sym(j)], [w + rr.sym(j), h + rr.sym(j)], [rr.sym(j), h + rr.sym(j)]];
      SP.piece(g, S.cut(quad, { seed, jitter: 0.9, ds: 9 }), { color: o.paper ?? '#f3ead8', kind: o.kind ?? 'paper', seed, edge: 0.22, torn: o.torn ?? false });
      g.font = `${size}px "${font}"`;
      g.textBaseline = 'alphabetic';
      g.fillStyle = o.ink ?? SP.INK;
      g.fillText(ch, padX + (m.actualBoundingBoxLeft || 0), padY + asc);
      // leve desgaste de impressão
      g.globalCompositeOperation = 'destination-out';
      for (let k = 0; k < 18; k++) { g.fillStyle = `rgba(0,0,0,${0.08 + rr.next() * 0.12})`; g.beginPath(); g.arc(rr.next() * w, rr.next() * h, rr.range(0.5, 2.2), 0, TAU); g.fill(); }
      g.globalCompositeOperation = 'source-over';
    }, { res: o.res ?? 2, pad: 26, ax: w / 2, ay: h / 2 });
    return { spr, w, h, font };
  }

  /** Monta uma palavra em letras recortadas; devolve layout [{spr, x, y, rot, s, w}]. */
  function ransom(word, o = {}) {
    const seed = o.seed ?? 7, rr = R(seed);
    const papers = o.papers ?? ['#f3ead8', '#b6e03b', '#1e3e4c', '#d37402', '#fbf8f0', '#5ca032', '#f2c14e', '#e8b4a0'];
    const inkFor = (pc) => ({ '#1e3e4c': '#fbf8f0', '#00573a': '#fbf8f0', '#5ca032': '#fbf8f0', '#d37402': '#fbf8f0' }[pc] ?? SP.INK);
    const out = [];
    let x = 0;
    [...word].forEach((ch, i) => {
      if (ch === ' ') { x += (o.size ?? 120) * 0.42; return; }
      const pc = o.paperFor ? o.paperFor(i, ch) : papers[(i * 3 + rr.int(0, 7)) % papers.length];
      const size = (o.size ?? 120) * (o.vary === false ? 1 : rr.range(0.9, 1.12));
      const t = letterTile(ch, { size, paper: pc, ink: o.inkFor ? o.inkFor(pc) : inkFor(pc), seed: seed + i * 17, font: o.fonts ? o.fonts[i % o.fonts.length] : undefined });
      out.push({ ch, spr: t.spr, x: x + t.w / 2, y: rr.sym((o.size ?? 120) * 0.07), rot: rr.sym(o.tilt ?? 0.12), s: 1, w: t.w, h: t.h });
      x += t.w * (o.overlap ?? 0.9);
    });
    const W = x;
    out.forEach((l) => (l.x -= W / 2));
    out.width = W;
    return out;
  }

  // ---------- carimbo ----------
  function stamp(key, text, o = {}) {
    const size = o.size ?? 64, font = o.font ?? 'Bungee', color = o.color ?? '#c8372d';
    const mc = P.canvas(4, 4).getContext('2d');
    mc.font = `${size}px "${font}"`;
    const tw = mc.measureText(text).width;
    const w = tw + size * 0.9, h = size * 1.55;
    return SP.sprite('stamp|' + key, w, h, (g) => {
      const rr = R(o.seed ?? 3);
      g.strokeStyle = color; g.fillStyle = color;
      g.lineWidth = size * 0.1;
      const inset = size * 0.08;
      g.beginPath(); S.trace(g, S.rrect(inset, inset, w - 2 * inset, h - 2 * inset, size * 0.18, { seed: 4, jitter: 0.8 }), true); g.stroke();
      g.lineWidth = size * 0.035;
      g.beginPath(); S.trace(g, S.rrect(inset + size * 0.13, inset + size * 0.13, w - 2 * inset - size * 0.26, h - 2 * inset - size * 0.26, size * 0.1, { seed: 5, jitter: 0.6 }), true); g.stroke();
      g.font = `${size}px "${font}"`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(text, w / 2, h / 2 + size * 0.05);
      // tinta falhada
      g.globalCompositeOperation = 'destination-out';
      for (let k = 0; k < 520; k++) { g.fillStyle = `rgba(0,0,0,${rr.range(0.2, 0.9)})`; g.beginPath(); g.arc(rr.next() * w, rr.next() * h, rr.range(0.4, 2.4), 0, TAU); g.fill(); }
      for (let k = 0; k < 6; k++) { g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.ellipse(rr.next() * w, rr.next() * h, rr.range(8, 30), rr.range(2, 6), rr.range(0, 3), 0, TAU); g.fill(); }
      g.globalCompositeOperation = 'source-over';
    }, { res: 2, pad: 8, ax: w / 2, ay: h / 2 });
  }

  /** Fórmula com subscritos: formula(ctx, 'CH4', x, y, {size, font, color}) — dígitos viram subscrito. */
  function formula(ctx, f, x, y, o = {}) {
    const size = o.size ?? 60, font = o.font ?? 'Luckiest Guy';
    const parts = [...f].map((ch) => ({ ch, sub: /[0-9]/.test(ch) }));
    ctx.save();
    ctx.textBaseline = 'alphabetic';
    const W = parts.reduce((a, p) => { ctx.font = `${p.sub ? size * 0.58 : size}px "${font}"`; return a + ctx.measureText(p.ch).width; }, 0);
    let cx = x - (o.align === 'left' ? 0 : W / 2);
    for (const p of parts) {
      ctx.font = `${p.sub ? size * 0.58 : size}px "${font}"`;
      const dy = p.sub ? size * 0.2 : 0;
      if (o.stroke) { ctx.lineJoin = 'round'; ctx.strokeStyle = o.stroke; ctx.lineWidth = o.strokeW ?? size * 0.14; ctx.strokeText(p.ch, cx, y + size * 0.36 + dy); }
      ctx.fillStyle = o.color ?? SP.INK;
      ctx.fillText(p.ch, cx, y + size * 0.36 + dy);
      cx += ctx.measureText(p.ch).width;
    }
    ctx.restore();
    return W;
  }

  C.text = { hand, measure, letterTile, ransom, stamp, formula, RANSOM_FONTS };
})(window);
