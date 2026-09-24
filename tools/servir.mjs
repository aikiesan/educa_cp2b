// Servidor local para assistir às animações: node tools/servir.mjs [porta]
import { serve } from './render.mjs';
const port = +(process.argv[2] || 8080);
const server = await serve(undefined, port);
const base = `http://127.0.0.1:${server.address().port}/videos`;
console.log(`educa CP2B (Ctrl+C para sair)
  01 · ${base}/01-o-que-e-biogas/
  02 · ${base}/02-pilar-2b/`);
