// Perfil rápido: quanto custa desenhar vs. codificar um quadro. uso: node tools/perfil.mjs
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { serve } from './render.mjs';
const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = require('A:/Pilar-2b/PILAR-2b Design System/node_modules/playwright');
const server = await serve(ROOT);
const ARGS = (process.env.CARGS || '').split(' ').filter(Boolean);
const browser = await chromium.launch({ args: ARGS, headless: process.env.HEADFUL ? false : true });
console.log('args', ARGS);
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(`http://127.0.0.1:${server.address().port}/videos/01-o-que-e-biogas/index.html?export=1`);
await page.waitForFunction(() => window.__colagem && window.__colagem.ready);
const r = await page.evaluate(() => {
  const out = [];
  const cv = document.getElementById('stage');
  for (const t of [2.2, 7.5, 16.9, 21.8, 33.5, 41.9, 45.2, 51.5]) {
    const a = performance.now();
    window.__colagem.frame(t);   // inclui desfoque quando houver
    const b = performance.now();
    cv.toDataURL('image/png');
    const c = performance.now();
    out.push([t, Math.round(b - a), Math.round(c - b)]);
  }
  return out;
});
const gpu = await page.evaluate(() => { const c = document.createElement('canvas'); const g = c.getContext('webgl'); const d = g && g.getExtension('WEBGL_debug_renderer_info'); return d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'sem webgl'; }); console.log('renderer:', gpu);
console.log('t, desenho+export(ms), só png(ms)'); r.forEach((x) => console.log(x.join('\t')));
await browser.close(); server.close();
