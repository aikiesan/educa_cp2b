#!/usr/bin/env node
/**
 * Renderizador determinístico: abre a página da cena num Chromium headless (Playwright),
 * busca cada instante exato e captura o <canvas>.
 *
 *   node tools/render.mjs <pagina.html> --stills 0,1.5,3 --out pasta/        (quadros para revisão)
 *   node tools/render.mjs <pagina.html> --video saida.mp4 [--audio mix.wav] [--fps 24] [--from 0 --to 10]
 *   node tools/render.mjs <pagina.html> --sheet folha.png --every 1           (folha de contato)
 */
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadPlaywright() {
  for (const c of ['playwright', path.join(ROOT, 'node_modules', 'playwright'), 'A:/Pilar-2b/PILAR-2b Design System/node_modules/playwright']) {
    try { return require(c); } catch { /* próximo */ }
  }
  throw new Error('Playwright não encontrado: rode `npm install`.');
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.vtt': 'text/vtt; charset=utf-8', '.mp4': 'video/mp4' };

export function serve(root = ROOT, port = 0) {
  const server = http.createServer(async (req, res) => {
    try {
      const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
      const file = path.resolve(root, rel || 'index.html');
      if (path.relative(root, file).startsWith('..')) return res.writeHead(403).end();
      const body = await fsp.readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(body);
    } catch { res.writeHead(404).end('404'); }
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok(server)));
}

function parse(argv) {
  const a = { page: argv[0], fps: 24, crf: 16 };
  for (let i = 1; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k === '--stills') { a.stills = v.split(',').map(Number); i++; }
    else if (k === '--out') { a.out = v; i++; }
    else if (k === '--video') { a.video = v; i++; }
    else if (k === '--audio') { a.audio = v; i++; }
    else if (k === '--fps') { a.fps = +v; i++; }
    else if (k === '--crf') { a.crf = +v; i++; }
    else if (k === '--from') { a.from = +v; i++; }
    else if (k === '--to') { a.to = +v; i++; }
    else if (k === '--sheet') { a.sheet = v; i++; }
    else if (k === '--every') { a.every = +v; i++; }
    else if (k === '--scale') { a.scale = +v; i++; }
    else if (k === '--query') { a.query = v; i++; }
    else if (k === '--sfx-out') { a.sfxOut = v; i++; }
    else if (k === '--workers') { a.workers = +v; i++; }
    else if (k === '--keep') { a.keep = true; }
  }
  return a;
}

const FFMPEG = fs.existsSync('C:/ffmpeg/ffmpeg-2025-03-31-git-35c091f4b7-essentials_build/ffmpeg-2025-03-31-git-35c091f4b7-essentials_build/bin/ffmpeg.exe')
  ? 'C:/ffmpeg/ffmpeg-2025-03-31-git-35c091f4b7-essentials_build/ffmpeg-2025-03-31-git-35c091f4b7-essentials_build/bin/ffmpeg.exe' : 'ffmpeg';

async function main() {
  const a = parse(process.argv.slice(2));
  if (!a.page) { console.log('uso: node tools/render.mjs <pagina.html> [--stills ...|--video ...|--sheet ...]'); process.exit(1); }
  const server = await serve();
  const { chromium } = loadPlaywright();
  // canvas 2D acelerado na GPU (ANGLE/D3D11): 3–10× mais rápido que a rasterização por software
  const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--enable-accelerated-2d-canvas', '--enable-gpu', '--disable-gpu-vsync', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ': ' + m.text()); else if (m.type() === 'log') console.log('[page]', m.text()); });
  const url = `http://127.0.0.1:${server.address().port}/${a.page.replace(/\\/g, '/')}?export=1${a.query ? '&' + a.query : ''}`;
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__colagem && window.__colagem.ready === true, null, { timeout: 180000 }).catch((e) => { console.error(errs.join('\n')); throw e; });
  const meta = await page.evaluate(() => ({ duration: window.__colagem.duration, w: window.__colagem.width, h: window.__colagem.height }));
  const grab = async (t, file) => {
    const b64 = await page.evaluate((tt) => window.__colagem.frame(tt), t);
    const buf = Buffer.from(b64, 'base64');
    if (file) await fsp.writeFile(file, buf);
    return buf;
  };
  try {
    if (a.sfxOut) {
      const cues = await page.evaluate(() => window.__colagem.sfx());
      await fsp.writeFile(a.sfxOut, JSON.stringify(cues, null, 1));
      console.log('sfx', a.sfxOut, cues.length, 'efeitos');
    }
    if (a.stills) {
      const out = a.out || path.join(ROOT, 'tmp', 'stills');
      await fsp.mkdir(out, { recursive: true });
      for (const t of a.stills) { const f = path.join(out, `t${t.toFixed(2).padStart(6, '0')}.png`); await grab(t, f); console.log('still', f); }
    }
    if (a.sheet) {
      const every = a.every ?? 1, times = [];
      for (let t = a.from ?? 0; t < (a.to ?? meta.duration); t += every) times.push(+t.toFixed(3));
      const imgs = [];
      for (const t of times) imgs.push((await grab(t)).toString('base64'));
      const html = `<html><body style="margin:0;background:#222;display:flex;flex-wrap:wrap;width:1920px">${imgs.map((b, i) => `<div style="position:relative;width:384px;height:216px"><img src="data:image/png;base64,${b}" style="width:384px;height:216px;display:block"><span style="position:absolute;left:4px;top:2px;color:#fff;font:bold 14px sans-serif;text-shadow:0 0 3px #000">${times[i].toFixed(2)}s</span></div>`).join('')}</body></html>`;
      const p2 = await browser.newPage({ viewport: { width: 1920, height: Math.ceil(imgs.length / 5) * 216 } });
      await p2.setContent(html, { waitUntil: 'load' });
      await p2.screenshot({ path: a.sheet, fullPage: true });
      console.log('sheet', a.sheet, times.length, 'quadros');
    }
    if (a.video) {
      const from = a.from ?? 0, to = a.to ?? meta.duration;
      const n = Math.round((to - from) * a.fps);
      const W = Math.max(1, a.workers ?? 1);
      const dir = await fsp.mkdtemp(path.join(os.tmpdir(), 'colagem-quadros-'));
      console.log(`renderizando ${n} quadros @ ${a.fps} fps (${from}s → ${to}s) com ${W} worker(s) → ${dir}`);
      const pages = [page];
      for (let w = 1; w < W; w++) {
        const p2 = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
        p2.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
        await p2.goto(url, { waitUntil: 'load' });
        await p2.waitForFunction(() => window.__colagem && window.__colagem.ready === true, null, { timeout: 180000 });
        pages.push(p2);
      }
      const t0 = Date.now();
      let done = 0, next = 0;
      await Promise.all(pages.map(async (pg) => {
        while (true) {
          const i = next++;
          if (i >= n) break;
          const t = from + i / a.fps;
          const b64 = await pg.evaluate((tt) => window.__colagem.frame(tt), t);
          await fsp.writeFile(path.join(dir, `q${String(i).padStart(5, '0')}.png`), Buffer.from(b64, 'base64'));
          done++;
          if (done % 48 === 0) { const el = (Date.now() - t0) / 1000; console.log(`  ${done}/${n}  ${(done / el).toFixed(2)} q/s  (~${Math.round((n - done) / (done / el))} s restantes)`); }
        }
      }));
      console.log(`quadros prontos em ${((Date.now() - t0) / 1000).toFixed(0)} s; codificando…`);
      const args = ['-y', '-framerate', String(a.fps), '-i', path.join(dir, 'q%05d.png')];
      if (a.audio) args.push('-ss', String(from), '-t', String(to - from), '-i', a.audio);
      const vf = a.scale ? ['-vf', `scale=${Math.round(1920 * a.scale)}:-2:flags=lanczos`] : [];
      args.push(...vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(a.crf), '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-tune', 'film', '-x264-params', 'aq-mode=3:deblock=-1,-1', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart');
      if (a.audio) args.push('-c:a', 'aac', '-b:a', '256k', '-ar', '48000');
      args.push(a.video);
      await new Promise((ok, bad) => { const ff = spawn(FFMPEG, args, { stdio: ['ignore', 'inherit', 'inherit'] }); ff.on('exit', (c) => (c === 0 ? ok() : bad(new Error('ffmpeg ' + c)))); });
      if (!a.keep) await fsp.rm(dir, { recursive: true, force: true }); else console.log('quadros mantidos em', dir);
      console.log('vídeo', a.video);
    }
  } finally {
    if (errs.length) console.log('CONSOLE:\n' + errs.join('\n'));
    await browser.close();
    server.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((e) => { console.error(e); process.exit(1); });
