#!/usr/bin/env node
/**
 * Audit SVG content that renders outside its frame or is clipped by a wrapper in course HTML files.
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
 *   also checks painted primitives and clipping ancestors. Measure; do not model.
 *
 * A green run is not a substitute for looking at the figure — it only proves
 * content stays inside its frame and remains reachable, not that the label sits
 * where it belongs. Large screens also retain the shared 1280px content canvas.
 *
 * Usage:  node scripts/audit-svg-clip.mjs [--self-test | files...]     (default: courses/*.html)
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
  const builds = (existsSync(cache) ? readdirSync(cache) : [])
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
  const systemChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  if (existsSync(systemChrome)) return systemChrome;
  return undefined;
}

const PROBE = () => {
  // Navigation links also have data-lesson; reveal only the lesson articles.
  document.querySelectorAll('article[data-lesson]').forEach(a => {
    a.style.display = 'block';
    a.hidden = false;
  });
  const out = [];
  const overflow = (inner, outer) => Object.entries({
    left: outer.left - inner.left, right: inner.right - outer.right,
    top: outer.top - inner.top, bottom: inner.bottom - outer.bottom,
  }).sort((a, b) => b[1] - a[1])[0];
  document.querySelectorAll('svg[viewBox]').forEach(svg => {
    const sb = svg.getBoundingClientRect();
    if (!sb.width) return;
    const common = {
      lesson: svg.closest('article[data-lesson]')?.id || '(overview)',
      figure: (svg.getAttribute('aria-label') || '(no aria-label)').slice(0, 60),
    };
    const report = (text, side, px) => out.push({
      ...common, text, side, px: Math.round(px * 10) / 10,
    });
    // Dense figures must not scroll merely because a narrow reading column
    // wastes space that the shared 1280px course canvas makes available.
    const main = svg.closest('.main');
    const container = svg.closest('.container');
    if (innerWidth >= 1440 && main && container) {
      const available = Math.min(1280, main.getBoundingClientRect().width);
      const missing = available - container.getBoundingClientRect().width;
      if (missing > 1) report('course container leaves usable desktop width', 'layout', missing);
    }

    // Test painted primitives too: text can fit while its box or connector is cut.
    svg.querySelectorAll('text,rect,circle,ellipse,line,polyline,polygon,path,image,use').forEach(el => {
      if (el.closest('defs,marker,clipPath,mask,pattern,symbol')) return;
      const b = el.getBoundingClientRect();
      if (!b.width && !b.height) return;
      const [side, px] = overflow(b, sb);
      if (px > 1) report(el.tagName === 'text'
        ? el.textContent.trim().slice(0, 60) : `<${el.tagName}>`, side, px);
    });
    // A labelled keyboard-scrollable region may deliberately show part of an
    // SVG. Its viewport, however, must not be cropped by an outer wrapper.
    let visible = { left: sb.left, right: sb.right, top: sb.top, bottom: sb.bottom };
    for (let ancestor = svg.parentElement; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor);
      const rect = ancestor.getBoundingClientRect();
      const xClips = /hidden|clip|auto|scroll/.test(style.overflowX);
      const yClips = /hidden|clip|auto|scroll/.test(style.overflowY);
      const xOverflow = Math.max(rect.left - visible.left, visible.right - rect.right);
      const yOverflow = Math.max(rect.top - visible.top, visible.bottom - rect.bottom);
      const xScroll = /auto|scroll/.test(style.overflowX) && ancestor.scrollWidth > ancestor.clientWidth + 1;
      const yScroll = /auto|scroll/.test(style.overflowY) && ancestor.scrollHeight > ancestor.clientHeight + 1;
      if ((xClips && xOverflow > 1) || (yClips && yOverflow > 1)) {
        const accessible = ancestor.tabIndex >= 0 && ancestor.getAttribute('role') === 'region'
          && (ancestor.getAttribute('aria-label') || ancestor.getAttribute('aria-labelledby'));
        if ((xClips && xOverflow > 1 && !(xScroll && accessible)) ||
            (yClips && yOverflow > 1 && !(yScroll && accessible))) {
          report(`clipped by <${ancestor.tagName.toLowerCase()}>.${ancestor.className}`, 'wrapper', Math.max(xOverflow, yOverflow));
          break;
        }
      }
      if (xClips) visible = { ...visible, left: Math.max(visible.left, rect.left), right: Math.min(visible.right, rect.right) };
      if (yClips) visible = { ...visible, top: Math.max(visible.top, rect.top), bottom: Math.min(visible.bottom, rect.bottom) };
    }
  });
  return out;
};

// AGENTS §5: measure rendered text, not document overflow or nominal SVG font size.
const READABILITY_PROBE = () => {
  const out = [];
  document.querySelectorAll('figure svg[viewBox] text').forEach(t => {
    if (!t.textContent.trim() || !t.getBoundingClientRect().width) return;
    const matrix = t.getScreenCTM();
    if (!matrix) return;
    const size = parseFloat(getComputedStyle(t).fontSize) * Math.hypot(matrix.a, matrix.b);
    if (size < 7.99) out.push({
      lesson: t.closest('[data-lesson]')?.id || '(overview)',
      text: t.textContent.trim().slice(0, 60),
      size: Math.round(size * 100) / 100,
    });
  });
  return out;
};

const args = process.argv.slice(2);
const selfTest = args.includes('--self-test');
const files = selfTest ? [] : args.length
  ? args.map(f => resolve(f))
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

if (selfTest) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 900 } });
  const cases = [
    ['shape beyond viewBox', '<svg viewBox="0 0 100 100" width="100"><rect x="80" y="20" width="30" height="20"/></svg>', 1],
    ['cropped wrapper', '<div style="width:70px;overflow:hidden"><svg viewBox="0 0 100 100" width="100"><rect x="10" y="10" width="80" height="80"/></svg></div>', 1],
    ['accessible horizontal scroll', '<div role="region" aria-label="Diagram" tabindex="0" style="width:70px;overflow:auto"><svg viewBox="0 0 100 100" width="100"><rect x="10" y="10" width="80" height="80"/></svg></div>', 0],
    ['unreachable horizontal scroll', '<div style="width:70px;overflow:auto"><svg viewBox="0 0 100 100" width="100"><rect x="10" y="10" width="80" height="80"/></svg></div>', 1],
    ['scroll viewport cropped by outer wrapper', '<div style="width:50px;overflow:hidden"><div role="region" aria-label="Diagram" tabindex="0" style="width:70px;overflow:auto"><svg viewBox="0 0 100 100" width="100"><rect x="10" y="10" width="80" height="80"/></svg></div></div>', 1],
    ['vertical crop outside horizontal scroller', '<div style="width:70px;height:50px;overflow:hidden"><div role="region" aria-label="Diagram" tabindex="0" style="width:70px;overflow:auto"><svg viewBox="0 0 100 100" width="100"><rect x="10" y="10" width="80" height="80"/></svg></div></div>', 1],
    ['wasted desktop canvas', '<main class="main" style="width:1600px"><div class="container" style="width:820px"><svg viewBox="0 0 100 100" width="100"><rect x="10" y="10" width="80" height="80"/></svg></div></main>', 1],
    ['rotated content inside frame', '<svg viewBox="0 0 100 100" width="100"><rect x="40" y="40" width="20" height="20" transform="rotate(45 50 50)"/></svg>', 0],
  ];
  for (const [name, html, expected] of cases) {
    await page.setContent(html);
    const actual = (await page.evaluate(PROBE)).length;
    if (actual !== expected) throw new Error(`${name}: expected ${expected} issue(s), got ${actual}`);
    console.log(`PASS ${name}`);
  }
  await page.close();
}


for (const file of files) {
  const { origin } = await serve(dirname(file));
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.goto(`${origin}/${encodeURIComponent(basename(file))}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts?.ready);
    for (const width of [375, 768, 1440, 1920, 2560]) {
      await page.setViewportSize({ width, height: 900 });
      const found = await page.evaluate(PROBE);
      for (const f of found) {
        hits++;
        console.log(
          `${basename(file)} | ${f.lesson} | ${f.figure} | ${width}px\n` +
          `    "${f.text}"\n` +
          `    -> clips ${f.side} by ${f.px}px\n`
        );
      }
      const tiny = await page.evaluate(READABILITY_PROBE);
      for (const f of tiny) {
        hits++;
        console.log(`${basename(file)} | ${f.lesson} | AGENTS §5 | ${width}px\n` +
          `    "${f.text}" renders at ${f.size}px; minimum 8px.\n` +
          '    Preserve readable diagram scale in a labelled keyboard-scrollable region; keep the caption at page width.\n');
      }
    }
  } finally {
    await page.close();
  }
}

await browser.close();
for (const { server } of servers.values()) server.close();
console.log(`SVG clip audit: ${hits} issue(s) across ${files.length} file(s)`);
process.exit(hits ? 1 : 0);
