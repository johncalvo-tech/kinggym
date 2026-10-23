/* Construye la app web (carpeta dist/) a partir de los archivos de src/.
 *   npm run build              -> versión minificada para publicar
 *   npm run build -- --legible -> sin minificar (para revisar errores)
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { minify } from 'html-minifier-terser';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(RAIZ, 'dist');
const LEGIBLE = process.argv.includes('--legible');

const leer = p => fs.readFileSync(path.join(RAIZ, p), 'utf8');
const cfg = JSON.parse(leer('config.json'));
cfg.API_URL = String(cfg.API_URL || '').trim();

// ---------- Validaciones ----------
if (/PEGUE/i.test(cfg.API_URL || '')) {
  throw new Error('config.json: falta pegar en API_URL la URL de su app web de Apps Script (Implementar > Administrar implementaciones).');
}
if (!/^https:\/\/script\.google\.com\/(a\/[\w.-]+\/macros|a\/macros\/[\w.-]+|macros)\/s\/[\w-]+\/exec$/.test(String(cfg.API_URL || '').trim())) {
  throw new Error('config.json: API_URL debe ser la URL de la app web de Apps Script (empieza por https://script.google.com y termina en /exec).');
}
const dominios = (cfg.DOMINIOS_PERMITIDOS || []).filter(d => d && !/TU-USUARIO/i.test(d));
if (!dominios.length) console.warn('⚠️  config.json: DOMINIOS_PERMITIDOS sin configurar; la app funcionará en cualquier dominio.');
const NOMBRE = String(cfg.NOMBRE || 'GIMNASIO');

const PAGINAS = [
  { src: 'Index', out: 'index.html', titulo: NOMBRE, manifest: 'manifest.webmanifest', icono: 'admin', color: '#111111' },
  { src: 'Socio', out: 'socio.html', titulo: NOMBRE + ' · Socios', manifest: 'manifest-socio.webmanifest', icono: 'socio', color: '#0b0b0b' }
];

const VERSION = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12) + '-' +
  crypto.createHash('sha1').update(fs.readdirSync(path.join(RAIZ, 'src')).map(f => leer('src/' + f)).join('') + JSON.stringify(cfg)).digest('hex').slice(0, 8);

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- Seguridad en el navegador ----------
// CSP: solo se permite hablar con Google Apps Script y cargar el reconocimiento facial desde jsDelivr.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://script.google.com https://script.googleusercontent.com https://cdn.jsdelivr.net",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "base-uri 'self'",
  "form-action 'none'",
  "object-src 'none'"
].join('; ');

// Guardia: evita que la app se muestre dentro de otra página (clickjacking)
// y que una copia funcione en un dominio no autorizado.
const GUARDIA = `(function(){
  if (window.top !== window.self) { try { window.top.location.replace(window.location.href); } catch (e) {} document.documentElement.style.display = 'none'; }
  var c = window.GYM_CONFIG || {}, h = location.hostname, d = c.DOMINIOS || [];
  var local = h === 'localhost' || h === '127.0.0.1' || h === '';
  if (d.length && !local && d.indexOf(h) < 0) {
    document.write('<div style="font-family:sans-serif;padding:24px"><h2>Copia no autorizada</h2><p>Esta aplicación solo funciona en su sitio oficial.</p></div>');
    if (window.stop) window.stop();
    throw new Error('Dominio no autorizado');
  }
})();`;

const PIE = `<script>
(function(){
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(function(){});
  }
  // Botón "Instalar app" cuando el navegador lo permite
  var evt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); evt = e;
    var b = document.createElement('button');
    b.textContent = '📲 Instalar app';
    b.setAttribute('style', 'position:fixed;right:14px;bottom:86px;z-index:300;background:#FFC000;color:#000;border:2px solid #000;border-radius:999px;padding:10px 16px;font-weight:800;font-size:14px;box-shadow:0 4px 14px rgba(0,0,0,.35);cursor:pointer');
    b.onclick = function () { evt.prompt(); evt.userChoice.finally(function () { b.remove(); }); };
    document.body.appendChild(b);
    setTimeout(function () { if (b.isConnected) b.remove(); }, 30000);
  });
})();
</script>`;

function cabecera(p) {
  return `
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="${p.color}">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="apple-mobile-web-app-title" content="${esc(p.titulo)}">
<title>${esc(p.titulo)}</title>
<link rel="manifest" href="${p.manifest}">
<link rel="icon" type="image/png" href="icons/favicon.png">
<link rel="apple-touch-icon" href="icons/${p.icono}-apple-180.png">
<script src="config.js"></script>
<script>${GUARDIA}</script>`;
}

function armar(p) {
  let h = leer('src/' + p.src + '.html');
  h = h.replace(/<\?= urlApp \?>\?p=socio/g, 'socio.html');
  h = h.replace(/<\?= (urlApp|pase) \?>/g, '');   // en GitHub el pase llega en la dirección (?h=)
  h = h.replace(/<\?!= include\('(\w+)'\); \?>/g, (_, n) => leer('src/' + n + '.html'));
  if (/<\?/.test(h)) throw new Error(p.src + ': quedó una instrucción de Apps Script sin convertir');
  if (!/<meta charset="utf-8">/.test(h)) throw new Error(p.src + ': falta <meta charset="utf-8">');
  h = h.replace('<meta charset="utf-8">', '<meta charset="utf-8">' + cabecera(p));
  h = h.replace(/<meta name="theme-color" content="#0b0b0b">\s*/, '');
  h = h.replace('</body>', PIE + '\n</body>');
  h = h.replace('<html>', '<html lang="es">');
  return h;
}

function manifiesto(p, id, descripcion) {
  return JSON.stringify({
    id: './' + p.out, name: p.titulo, short_name: p.icono === 'socio' ? 'Mi Gym' : NOMBRE,
    description: descripcion, lang: 'es', start_url: './' + p.out, scope: './', display: 'standalone',
    orientation: 'portrait', background_color: p.color, theme_color: p.color,
    icons: [
      { src: `icons/${p.icono}-192.png`, sizes: '192x192', type: 'image/png' },
      { src: `icons/${p.icono}-512.png`, sizes: '512x512', type: 'image/png' },
      { src: `icons/${p.icono}-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  }, null, 2);
}

// ---------- Construcción ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'icons'), { recursive: true });

for (const p of PAGINAS) {
  let html = armar(p);
  if (!LEGIBLE) {
    html = await minify(html, {
      collapseWhitespace: true, conservativeCollapse: true, removeComments: true,
      minifyCSS: true, minifyJS: { compress: { passes: 2 }, mangle: true, format: { comments: false } }
    });
  }
  fs.writeFileSync(path.join(DIST, p.out), html);
}

fs.writeFileSync(path.join(DIST, 'config.js'),
  'window.GYM_CONFIG=Object.freeze(' + JSON.stringify({ API_URL: cfg.API_URL, NOMBRE, DOMINIOS: dominios, VERSION }) + ');\n');
fs.writeFileSync(path.join(DIST, PAGINAS[0].manifest), manifiesto(PAGINAS[0], 'admin', 'Recepción, pagos, ingresos e informes del gimnasio'));
fs.writeFileSync(path.join(DIST, PAGINAS[1].manifest), manifiesto(PAGINAS[1], 'socio', 'Rutinas, entrenamientos y progreso'));

for (const f of fs.readdirSync(path.join(RAIZ, 'pwa/icons'))) fs.copyFileSync(path.join(RAIZ, 'pwa/icons', f), path.join(DIST, 'icons', f));

const archivos = ['./', 'index.html', 'socio.html', 'config.js', 'manifest.webmanifest', 'manifest-socio.webmanifest']
  .concat(fs.readdirSync(path.join(DIST, 'icons')).map(f => 'icons/' + f));
fs.writeFileSync(path.join(DIST, 'sw.js'),
  leer('pwa/sw.js').replace('__VERSION__', VERSION).replace('__ARCHIVOS__', JSON.stringify(archivos)));

fs.writeFileSync(path.join(DIST, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
fs.writeFileSync(path.join(DIST, '.nojekyll'), '');
fs.writeFileSync(path.join(DIST, '404.html'), '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=./index.html"><title>Gimnasio</title>');

console.log('✅ App construida en dist/ (versión ' + VERSION + (LEGIBLE ? ', sin minificar' : '') + ')');
