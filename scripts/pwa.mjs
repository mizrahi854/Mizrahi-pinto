// Post-processes the Expo web export into an installable iOS/Android PWA for GitHub Pages.
// - manifest + apple meta tags (Add to Home Screen → full screen, icon, name)
// - viewport-fit=cover so safe-area insets (Dynamic Island / home indicator) work
// - 404.html = index.html so deep links work on GitHub Pages; .nojekyll keeps the _expo folder
import { readFileSync, writeFileSync, copyFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const DIST = 'dist';
const BASE = process.env.EXPO_BASE_URL ?? '/Mizrahi-pinto';
const icon = 'assets/icon.png';

const resize = (size, out) => {
  try {
    execFileSync('python3', ['-c', `from PIL import Image; Image.open('${icon}').convert('RGB').resize((${size},${size}), Image.LANCZOS).save('${DIST}/${out}')`]);
  } catch {
    copyFileSync(icon, `${DIST}/${out}`); // fallback: full-size icon
  }
};
resize(180, 'apple-touch-icon.png');
resize(192, 'icon-192.png');
resize(512, 'icon-512.png');

writeFileSync(`${DIST}/manifest.webmanifest`, JSON.stringify({
  name: 'MIZRAHI PINTO',
  short_name: 'MIZRAHI',
  lang: 'he',
  dir: 'rtl',
  start_url: `${BASE}/`,
  scope: `${BASE}/`,
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#0B0705',
  theme_color: '#0B0705',
  icons: [
    { src: `${BASE}/icon-192.png`, sizes: '192x192', type: 'image/png' },
    { src: `${BASE}/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
}, null, 2));

let html = readFileSync(`${DIST}/index.html`, 'utf8');
html = html.replace(/<html[^>]*>/, '<html lang="he" dir="rtl">');
html = html.replace(/<meta name="viewport"[^>]*>/, '');
html = html.replace(/<title>[^<]*<\/title>/, '<title>MIZRAHI PINTO</title>');
const head = `
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0B0705">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="MIZRAHI">
<link rel="apple-touch-icon" href="${BASE}/apple-touch-icon.png">
<link rel="manifest" href="${BASE}/manifest.webmanifest">
<style>html,body{background:#070403;overscroll-behavior:none;-webkit-tap-highlight-color:transparent}</style>
`;
html = html.replace('</head>', `${head}</head>`);
writeFileSync(`${DIST}/index.html`, html);
// ---- offline: service worker precaching the whole export (app shell, JS, fonts, images) ----
const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(DIST).map((f) => '/' + relative(DIST, f).split('\\').join('/')).filter((f) => !f.endsWith('.map') && f !== '/404.html' && f !== '/sw.js');
const version = Date.now().toString(36);
writeFileSync(`${DIST}/sw.js`, `
const CACHE = 'mp-${version}';
const BASE = '${BASE}';
const PRECACHE = ${JSON.stringify(files)}.map((f) => BASE + f);
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k.startsWith('mp-')).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match(BASE + '/index.html')));
    return;
  }
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })));
    return;
  }
  // product images (Open Food Facts): cache on first view so they work offline later
  if (url.hostname === 'images.openfoodfacts.org') {
    e.respondWith(caches.open('mp-img').then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { c.put(req, res.clone()); return res; }).catch(() => hit))));
  }
});
`);
html = html.replace('</body>', `<script>if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('${BASE}/sw.js',{scope:'${BASE}/'}).catch(function(){})})}</script></body>`);
writeFileSync(`${DIST}/index.html`, html);
writeFileSync(`${DIST}/404.html`, html);
writeFileSync(`${DIST}/.nojekyll`, '');
if (!existsSync(`${DIST}/index.html`)) throw new Error('export missing');
console.log('PWA ready in dist/');
