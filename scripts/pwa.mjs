// Post-processes the Expo web export into an installable iOS/Android PWA for GitHub Pages.
// - manifest + apple meta tags (Add to Home Screen → full screen, icon, name)
// - viewport-fit=cover so safe-area insets (Dynamic Island / home indicator) work
// - 404.html = index.html so deep links work on GitHub Pages; .nojekyll keeps the _expo folder
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const DIST = 'dist';
const BASE = '/Mizrahi-pinto';
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
writeFileSync(`${DIST}/404.html`, html);
writeFileSync(`${DIST}/.nojekyll`, '');
if (!existsSync(`${DIST}/index.html`)) throw new Error('export missing');
console.log('PWA ready in dist/');
