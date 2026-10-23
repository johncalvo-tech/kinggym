/* Servidor local para probar la app: npm run servir  ->  http://localhost:8080 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };
http.createServer((req, res) => {
  const ruta = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(DIST, ruta === '/' ? 'index.html' : ruta);
  if (!f.startsWith(DIST) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('No encontrado'); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(8080, () => console.log('Abra http://localhost:8080'));
