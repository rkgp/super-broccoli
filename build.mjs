#!/usr/bin/env node
/* Zero-dependency build. Reads content/site.json and src/*, writes dist/.
 *
 *   node build.mjs                      real site -> dist/index.html (+ dist/assets)
 *   node build.mjs --variant=deep       choose the branch: line | deep | console
 *   node build.mjs --route=galaxy       choose the line shape: metro | serpentine | galaxy | river | loops
 *   node build.mjs --review             add the look and route switches (for comparing, not for the live site)
 *   node build.mjs --noindex            ask search engines not to list the page (for previews)
 *   node build.mjs --artifact           also write dist/artifact.html (a page fragment for previews)
 *   node build.mjs --fonts=google       load fonts from Google instead of the self-hosted files
 */
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const read = (p) => readFileSync(join(root, p), 'utf8');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const VARIANTS = ['line', 'deep', 'console'];
const variant = VARIANTS.includes(args.variant) ? args.variant : 'line';
const ROUTES = ['metro', 'serpentine', 'galaxy', 'river', 'loops'];
const route = ROUTES.includes(args.route) ? args.route : 'metro';
const site = JSON.parse(read('content/site.json'));

/* ---------- check the content file, so a typo fails here and not on the live site ---------- */
function validate(s) {
  const errors = [], ids = new Set(), reserved = /^(about|settings|sidebar|customize|upgrade|downloads|comment-.*)$/;
  const need = (obj, keys, where) => keys.forEach((k) => { if (obj[k] === undefined || obj[k] === '') errors.push(`${where}: "${k}" is missing`); });
  need(s.meta || {}, ['name', 'monogram', 'role', 'pitch', 'cta', 'linkedin', 'pageTitle', 'description'], 'meta');
  if (!Array.isArray(s.lines) || !s.lines.length) errors.push('lines: at least one line is needed');
  (s.lines || []).forEach((L) => {
    need(L, ['key', 'title', 'short', 'color'], `line ${L.key || '?'}`);
    if (!/^#[0-9A-Fa-f]{6}$/.test(L.color || '')) errors.push(`line ${L.key}: color must look like #RRGGBB`);
    if (!L.stations || !L.stations.length) errors.push(`line ${L.key}: needs at least one station`);
    if (L.stations && !L.stations[0].express) errors.push(`line ${L.key}: the first station must be an express stop`);
    (L.stations || []).forEach((st) => {
      need(st, ['id', 'name', 'kicker'], `station ${st.id || st.name || '?'}`);
      if (!/^[a-z0-9][a-z0-9-]*$/.test(st.id || '')) errors.push(`station ${st.id}: id may only use a-z, 0-9 and hyphens`);
      if (reserved.test(st.id || '')) errors.push(`station ${st.id}: this id is reserved, pick another`);
      if (ids.has(st.id)) errors.push(`station ${st.id}: id is used twice`);
      ids.add(st.id);
      if (typeof st.express !== 'boolean') errors.push(`station ${st.id}: "express" must be true or false`);
      (st.media || []).forEach((m) => { if (m.src && !m.alt) errors.push(`station ${st.id}: a photo needs "alt" text`); });
    });
  });
  (s.lines || []).forEach((L) => (L.stations || []).forEach((st) => (st.related || []).forEach((r) => {
    if (!ids.has(r.id)) errors.push(`station ${st.id}: related station "${r.id}" does not exist`);
  })));
  return errors;
}
const errors = validate(site);
if (errors.length) { console.error('The content file has problems:\n  - ' + errors.join('\n  - ')); process.exit(1); }

/* ---------- pieces ---------- */
const M = site.meta;
function body() {
  return `<script>document.documentElement.className += ' js';</script>
<div class="stage" id="stage">
  <canvas id="cv" role="img" aria-label="Animated map: a hub with ${site.lines.map((L) => 'a ' + esc(L.title)).join(' and ')}"></canvas>
  <div class="bar">
    <div class="seg" role="group" aria-label="Service">
      <button type="button" id="svc-express" data-svc="express" aria-pressed="true">Express</button>
      <button type="button" id="svc-all" data-svc="all" aria-pressed="false">All stops</button>
    </div>
    <button class="chip" id="mapbtn" type="button">See everything</button>
  </div>
  <div class="mappills gone" id="mappills"></div>
  <div class="panelwrap" id="hubwrap">
    <div class="panel">
      <h1 class="name">${esc(M.name)}</h1>
      <div class="role">${esc(M.role)}</div>
      <p class="pitch">${esc(M.pitch)}</p>
      <div class="cta">${esc(M.cta)}</div>
      <div class="links">
        <button class="link" type="button" data-about="1">${esc(site.about.title)}</button>
        <a class="link" href="${esc(M.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>
      </div>
    </div>
  </div>
  <div class="station" id="station" hidden><div class="st-inner" id="st-inner"></div></div>
  <div class="sheet" id="sheet" hidden></div>
</div>`;
}
/* The same content as a plain document, for browsers without JavaScript and for search engines. */
function plain() {
  const A = site.about;
  let h = `<div class="plain"><h1>${esc(M.name)}</h1><p class="dimtext">${esc(M.role)}</p>`;
  h += A.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('') + `<p>${esc(A.how)}</p>`;
  h += `<p><a href="${esc(M.linkedin)}">Contact me on LinkedIn</a></p>`;
  site.lines.forEach((L) => {
    h += `<h2>${esc(L.title)}</h2>`;
    L.stations.forEach((st) => {
      h += `<h3>${esc(st.name)}</h3><p>${esc(st.kicker)}</p>`;
      if (st.stats && st.stats.length) h += `<p class="dimtext">${st.stats.map((s) => esc(s.n) + ' ' + esc(s.l)).join(' · ')}</p>`;
      if (st.did && st.did.length) h += `<ul>${st.did.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>`;
    });
  });
  h += `<h2>Experience</h2><ul>${A.experience.map((x) => `<li>${esc(x.role)}, ${esc(x.org)} (${esc(x.period)})</li>`).join('')}</ul></div>`;
  return h;
}
const FONT_FILES = [
  ['Inter', 400, 'inter-400.woff2'], ['Inter', 500, 'inter-500.woff2'],
  ['Source Serif 4', 500, 'source-serif-4-500.woff2'],
  ['IBM Plex Mono', 400, 'ibm-plex-mono-400.woff2'], ['IBM Plex Mono', 500, 'ibm-plex-mono-500.woff2'],
  ['Bodoni Moda', 500, 'bodoni-moda-500.woff2']
];
const haveFonts = FONT_FILES.every((f) => existsSync(join(root, 'assets/fonts', f[2])));
const GOOGLE = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:wght@500&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500&family=Source+Serif+4:wght@500&display=swap">';
function fontCss() {
  return FONT_FILES.map((f) => `@font-face{font-family:'${f[0]}';font-style:normal;font-weight:${f[1]};font-display:swap;src:url(assets/fonts/${f[2]}) format('woff2')}`).join('\n');
}
function analytics() {
  const a = site.meta.analytics;
  if (a && a.provider === 'plausible' && a.domain) return `<script defer data-domain="${esc(a.domain)}" src="https://plausible.io/js/script.js"></script>`;
  return '';
}
const data = JSON.stringify(site).replace(/</g, '\\u003c');
const css = read('src/styles.css');
const scripts = (review) => `<script>window.SITE=${data};window.SITE_OPTS=${JSON.stringify({ variant, route, review: !!review })};</script>
<script>${read('src/diagrams.js')}</script>
<script>${read('src/engine.js')}</script>${review ? `\n<script>${read('src/review.js')}</script>` : ''}`;

/* ---------- write ---------- */
const out = resolve(root, typeof args.out === 'string' ? args.out : 'dist');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const selfFonts = args.fonts !== 'google' && haveFonts;
const page = `<!doctype html>
<html lang="en" data-variant="${variant}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(M.pageTitle)}</title>
<meta name="description" content="${esc(M.description)}">
<meta property="og:title" content="${esc(M.pageTitle)}">
<meta property="og:description" content="${esc(M.description)}">
<meta property="og:type" content="website">
${args.noindex ? '<meta name="robots" content="noindex, nofollow">' : (M.siteUrl ? `<meta property="og:url" content="${esc(M.siteUrl)}">\n<link rel="canonical" href="${esc(M.siteUrl)}">` : '')}
${M.siteUrl && existsSync(join(root, 'assets/og.png')) ? `<meta property="og:image" content="${esc(M.siteUrl)}assets/og.png">\n<meta name="twitter:card" content="summary_large_image">` : ''}
<meta name="theme-color" content="#090C14">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
${selfFonts ? '' : GOOGLE}
<style>
${selfFonts ? fontCss() + '\n' : ''}${css}
</style>
${analytics()}
</head>
<body class="bleed">
${body()}
<noscript>${plain()}</noscript>
${scripts(args.review)}
</body>
</html>
`;
writeFileSync(join(out, 'index.html'), page);
if (existsSync(join(root, 'assets'))) cpSync(join(root, 'assets'), join(out, 'assets'), { recursive: true });

if (args.artifact) {
  const frag = `<title>${esc(typeof args.title === 'string' ? args.title : M.name)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
${GOOGLE}
<style>
${css}
</style>
${body()}
<noscript>${plain()}</noscript>
${scripts(args.review)}
`;
  writeFileSync(join(out, 'artifact.html'), frag);
}

const stations = site.lines.reduce((a, L) => a + L.stations.length, 0);
console.log(`Built ${variant}${args.review ? ' (review)' : ''}: ${site.lines.length} lines, ${stations} stations, fonts ${selfFonts ? 'self-hosted' : 'from Google'} -> ${out}`);
