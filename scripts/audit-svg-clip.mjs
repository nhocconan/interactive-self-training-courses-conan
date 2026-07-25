#!/usr/bin/env node
/**
 * Audit SVG text that renders outside its own <svg> box in course HTML files.
 *
 * The bug: a <text> label is longer than the space the viewBox gives it, so the
 * end of the string is clipped off at the edge of the figure. It is invisible to
 * the validator and to tsc/eslint, it only shows up in a browser, and it bites
 * hardest on EN siblings because English strings run longer than the Vietnamese
 * they were laid out for. Nine such bugs shipped across two sessions in 07/2026.
 *
 * WHY THIS NEEDS A BROWSER — and why the obvious cheap versions are wrong:
 *
 *   - Estimating width from character count × font size is guesswork. It cannot
 *     see the actual font, letter-spacing, or the fallback face, and it produces
 *     both misses and false alarms.
 *
 *   - `getBBox()` is the trap. It returns the box in the element's OWN local
 *     coordinate system, BEFORE that element's `transform` is applied. Every
 *     `transform="rotate(-90 …)"` axis label therefore gets compared in
 *     un-rotated coordinates and is flagged even though it renders perfectly.
 *     On 2026-07-25 that mistake produced 8 false positives out of 11 hits, and
 *     an agent then "fixed" 8 healthy diagrams to satisfy the broken check.
 *
 *   `getBoundingClientRect()` accounts for transforms and for the SVG's own
 *   scaling, so this script compares the <text> rect against its <svg> rect and
 *   nothing else. Measure; do not model.
 *
 * A green run is not a substitute for looking at the figure — it only proves
 * nothing spills out of the frame, not that the label sits where it belongs.
 *
 * Usage:  node scripts/audit-svg-clip.mjs [files...]     (default: courses/*.html)
 * Exit 1 if anything is flagged.
 */
import { createRequire } from 'node:module';
import { readdirSync, existsSync, statSync, createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename, resolve, extname } from 'node:path';
import { homedir } from 'node:os';
import { glob } from 'node:fs/promises';
import { createServer } from 'node:http';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(HERE);
const SLACK = 1.0;   // px of overflow to tolerate — sub-pixel rounding, not a bug

const require = createRequire(join(ROOT, 'app', 'node_modules', 'x.js'));
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Cannot resolve playwright. Run `npm install` inside app/ first.');
  process.exit(2);
}

/** Newest installed chromium build. Never pin a version — the pinned build is
 *  routinely absent from the cache while a newer one sits right next to it. */
function findBrowser() {
  const cache = join(homedir(), 'Library', 'Caches', 'ms-playwright');
  if (!existsSync(cache)) return undefined;
  const builds = readdirSync(cache)
    .filter(d => /^chromium(_headless_shell)?-\d+$/.test(d))
    .sort((a, b) => Number(a.match(/\d+$/)[0]) - Number(b.match(/\d+$/)[0]))
    .reverse();
  const candidates = [
    'chrome-headless-shell-mac-arm64/chrome-headless-shell',
    'chrome-headless-shell-mac-x64/chrome-headless-shell',
    'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
    'chrome-linux/chrome',
  ];
  for (const b of builds) {
    for (const c of candidates) {
      const p = join(cache, b, c);
      if (existsSync(p) && statSync(p).isFile()) return p;
    }
  }
  return undefined;
}

const PROBE = () => {
  // Reveal every lesson: articles are hidden until navigated to, and a hidden
  // element has no layout, so an un-revealed figure would measure as 0×0.
  document.querySelectorAll('[data-lesson]').forEach(a => {
    a.style.display = 'block';
    a.hidden = false;
  });
  const out = [];
  document.querySelectorAll('svg[viewBox]').forEach(svg => {
    const sb = svg.getBoundingClientRect();
    if (!sb.width) return;
    const label = svg.getAttribute('aria-label') || '(no aria-label)';
    svg.querySelectorAll('text').forEach(t => {
      const b = t.getBoundingClientRect();
      if (!b.width) return;
      const over = {
        left: sb.left - b.left,
        right: b.right - sb.right,
        top: sb.top - b.top,
        bottom: b.bottom - sb.bottom,
      };
      const worst = Object.entries(over).sort((a, c) => c[1] - a[1])[0];
      if (worst[1] > 1.0) {
        out.push({
          lesson: t.closest('[data-lesson]')?.id || '(overview)',
          figure: label.slice(0, 60),
          text: t.textContent.trim().slice(0, 60),
          side: worst[0],
          px: Math.round(worst[1] * 10) / 10,
        });
      }
    });
  });
  return out;
};

const files = process.argv.slice(2).length
  ? process.argv.slice(2).map(f => resolve(f))
  : (await Array.fromAsync(glob(join(ROOT, 'courses', '*.html')))).sort();

/** Serve over HTTP, not file://. Over file:// the webfont request is blocked,
 *  the page falls back to a narrower system face, and text that really does
 *  overflow measures as fitting — a silent false negative. Measure in the same
 *  font production renders in. */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css',
               '.js': 'text/javascript', '.svg': 'image/svg+xml',
               '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const servers = new Map();
async function serve(dir) {
  if (servers.has(dir)) return servers.get(dir);
  const s = createServer((req, res) => {
    const p = join(dir, decodeURIComponent(req.url.split('?')[0]));
    if (!p.startsWith(dir) || !existsSync(p) || !statSync(p).isFile()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
    createReadStream(p).pipe(res);
  });
  await new Promise(r => s.listen(0, '127.0.0.1', r));
  const origin = `http://127.0.0.1:${s.address().port}`;
  servers.set(dir, { server: s, origin });
  return servers.get(dir);
}

const exe = findBrowser();
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
let hits = 0;

for (const file of files) {
  const { origin } = await serve(dirname(file));
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(`${origin}/${encodeURIComponent(basename(file))}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts?.ready);
    const found = await page.evaluate(PROBE);
    for (const f of found) {
      hits++;
      console.log(
        `${basename(file)} | ${f.lesson} | ${f.figure}\n` +
        `    "${f.text}"\n` +
        `    -> overflows ${f.side} edge of its <svg> by ${f.px}px\n`
      );
    }
  } finally {
    await page.close();
  }
}

await browser.close();
for (const { server } of servers.values()) server.close();
console.log(`SVG clip audit: ${hits} issue(s) across ${files.length} file(s)`);
process.exit(hits ? 1 : 0);
