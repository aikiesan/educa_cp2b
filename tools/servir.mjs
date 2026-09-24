// Servidor local para assistir às animações: node tools/servir.mjs [porta]
import { serve } from './render.mjs';
const port = +(process.argv[2] || 8080);
const server = await serve(undefined, port);
console.log(`educa CP2B em http://127.0.0.1:${server.address().port}/videos/01-o-que-e-biogas/  (Ctrl+C para sair)`);
