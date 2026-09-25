/* Colagem — palco: câmera, relógio de stop-motion, pós-processamento (luz, grão,
 * cintilação de exposição) e API de busca determinística para exportar quadro a quadro. */
(function (G) {
  'use strict';
  const C = G.Colagem;
  const { step, hrand, clamp } = C.core;
  const P = C.paper;

  async function loadFonts(list) {
    const missing = [];
    await Promise.all(list.map(async (f) => {
      try {
        const face = new FontFace(f.family, `url("${f.url}")`, { weight: f.weight ?? 'normal', style: f.style ?? 'normal' });
        await face.load();
        document.fonts.add(face);
      } catch (e) {
        if (!f.optional) throw new Error('fonte não carregou: ' + f.url);
        missing.push(f.family);
      }
    }));
    await document.fonts.ready;
    C.missingFonts = missing;
    return missing;
  }

  class Stage {
    constructor(canvas, o = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: false });
      this.W = canvas.width; this.H = canvas.height;
      this.fps = o.fps ?? 24;
      this.stepFps = o.stepFps ?? 12;
      this.post = { grain: 0.085, vignette: 1, flicker: 0.012, ...(o.post || {}) };
    }
    render(t, scene) {
      const ctx = this.ctx, W = this.W, H = this.H;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      const cam = scene.camera(t);
      const tq = step(t, this.stepFps);
      const rc = {
        ctx, t, tq, W, H, cam, zoom: cam.zoom, stage: this,
        boil: Math.floor(t * (scene.boilFps ?? 8)),
        pose: Math.floor(t * this.stepFps + 1e-6),
      };
      rc.world = () => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.translate(W / 2, H / 2);
        ctx.scale(cam.zoom, cam.zoom);
        if (cam.rot) ctx.rotate(cam.rot);
        ctx.translate(-cam.x, -cam.y);
      };
      rc.screen = () => ctx.setTransform(1, 0, 0, 1, 0, 0);
      const hw = W / 2 / cam.zoom, hh = H / 2 / cam.zoom, pad = Math.hypot(hw, hh);
      rc.view = { x0: cam.x - pad, y0: cam.y - pad, x1: cam.x + pad, y1: cam.y + pad };
      rc.visible = (x, y, r = 0) => x + r > rc.view.x0 && x - r < rc.view.x1 && y + r > rc.view.y0 && y - r < rc.view.y1;
      rc.world();
      scene.draw(rc);
      rc.screen();
      if (scene.overlay) scene.overlay(rc);
      rc.screen();
      this.postFX(rc);
      // camada final (depois do grão/luz): marcas que precisam ficar limpas, como o logo no canto
      if (scene.hud) { rc.screen(); scene.hud(rc); }
      return rc;
    }
    postFX(rc) {
      const { ctx, W, H } = rc, p = this.post;
      ctx.save();
      // luz de mesa quente (queda de luz nas bordas)
      if (p.vignette) {
        const Lm = Math.max(W, H), Sm = Math.min(W, H);   // 16:9 → Sm = H, Lm = W (como antes); 9:16 também cobre o quadro
        const g = ctx.createRadialGradient(W * 0.46, H * 0.42, Sm * 0.25, W * 0.5, H * 0.5, Lm * 0.78);
        g.addColorStop(0, 'rgb(255,253,248)');
        g.addColorStop(0.6, 'rgb(246,238,224)');
        g.addColorStop(1, 'rgb(196,178,150)');
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = p.vignette;
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      // grão de filme (troca a cada pose)
      if (p.grain) {
        const gr = P.grain(rc.pose);
        const pat = ctx.createPattern(gr, 'repeat');
        pat.setTransform(new DOMMatrix().translateSelf(hrand(rc.pose, 1) * 384, hrand(rc.pose, 2) * 384));
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = p.grain;
        ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H);
      }
      // cintilação de exposição, como em stop-motion fotografado quadro a quadro
      if (p.flicker) {
        const f = (hrand(rc.pose, 77) * 2 - 1) * p.flicker;
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = Math.abs(f);
        ctx.fillStyle = f > 0 ? '#fff6e6' : '#000000';
        ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
    }
  }

  /** Liga uma cena a um <canvas> + <audio> para reprodução em tempo real. */
  function player(stage, scene, audio, o = {}) {
    let raf = 0, t0 = 0, playing = false, tFree = 0;
    const clock = () => (audio && !audio.paused ? audio.currentTime : playing ? (performance.now() - t0) / 1000 : tFree);
    const loop = () => {
      const t = Math.min(clock(), scene.duration - 1e-3);
      stage.render(t, scene);
      o.onTime && o.onTime(t);
      if (t >= scene.duration - 1e-3 && (!audio || audio.paused || audio.ended)) { playing = false; o.onEnd && o.onEnd(); return; }
      raf = requestAnimationFrame(loop);
    };
    return {
      play() { playing = true; t0 = performance.now() - tFree * 1000; if (audio) audio.play(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); },
      pause() { playing = false; tFree = clock(); if (audio) audio.pause(); cancelAnimationFrame(raf); stage.render(tFree, scene); },
      seek(t) { tFree = clamp(t, 0, scene.duration); if (audio) audio.currentTime = tFree; t0 = performance.now() - tFree * 1000; stage.render(tFree, scene); },
      get time() { return clock(); },
      get playing() { return playing; },
    };
  }

  C.stage = { Stage, loadFonts, player };
})(window);
