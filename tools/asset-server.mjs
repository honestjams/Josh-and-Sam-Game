/**
 * Local asset upload tool for Mycelia Hollow.
 *
 *   npm run assets       (then open http://localhost:5178)
 *
 * Shows every art slot in the game with its current image, expected filename,
 * path, and size. Drag-and-drop (or click) a PNG onto a slot and it is written
 * straight into `src/game/assets/art/<path>`, replacing the placeholder. Then
 * rebuild (`npm run dev` or `npm run build:single`) to see it in the game.
 *
 * Pure Node — no dependencies. Only writes .png files inside the art folder.
 */
import http from 'node:http';
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, relative, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ART = resolve(ROOT, 'src/game/assets/art');
const PORT = process.env.PORT ? Number(process.env.PORT) : 5178;

// Friendly descriptions per folder.
const GROUPS = {
  backgrounds: 'Area Backgrounds — fill the 960×540 screen (author 16:9)',
  sprites: 'Characters & NPCs — transparent PNG, ≈32×48 (King/Dark Lord larger)',
  portraits: 'Portraits — 128×128, shown on select/party screens',
  enemies: 'Enemies — transparent PNG',
  props: 'Props — transparent PNG, ≈32×32',
};

function listArt() {
  const files = readdirSync(ART, { recursive: true })
    .map((f) => String(f))
    .filter((f) => extname(f).toLowerCase() === '.png')
    .map((f) => f.split('\\').join('/'));
  return files.sort();
}

/** Read width/height from a PNG's IHDR chunk. */
function pngSize(abs) {
  try {
    const b = readFileSync(abs);
    if (b.length < 24) return null;
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  } catch {
    return null;
  }
}

function safeArtPath(rel) {
  const abs = resolve(ART, rel);
  if (!abs.startsWith(ART + '/') && abs !== ART) return null;
  if (extname(abs).toLowerCase() !== '.png') return null;
  return abs;
}

function page() {
  const files = listArt();
  const byGroup = {};
  for (const f of files) {
    const group = f.split('/')[0];
    (byGroup[group] ??= []).push(f);
  }
  const sections = Object.keys(byGroup)
    .sort()
    .map((group) => {
      const cards = byGroup[group]
        .map((f) => {
          const sz = pngSize(join(ART, f));
          const dim = sz ? `${sz.w}×${sz.h}` : '';
          const name = f.split('/').slice(1).join('/');
          return `<div class="card" data-path="${f}">
            <div class="thumb"><img src="/art/${f}?t=${Date.now()}" alt=""></div>
            <div class="meta"><b>${name}</b><span>${dim}</span><code>src/game/assets/art/${f}</code></div>
            <div class="drop">Drop PNG or click</div>
            <input type="file" accept="image/png" hidden>
          </div>`;
        })
        .join('');
      return `<h2>${GROUPS[group] ?? group}</h2><div class="grid">${cards}</div>`;
    })
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>Mycelia Hollow — Asset Uploader</title>
<style>
  :root{color-scheme:dark}
  body{margin:0;background:#1a140d;color:#f5e9d0;font-family:system-ui,sans-serif;padding:24px}
  h1{color:#f0c674;font-family:Georgia,serif}
  h2{color:#9bbf7a;border-bottom:1px solid #3a2f1e;padding-bottom:6px;margin-top:32px;font-size:16px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}
  .card{background:#241d14;border:1px solid #3a2f1e;border-radius:10px;padding:10px;cursor:pointer;transition:.15s}
  .card.over{border-color:#f0c674;background:#2e2417}
  .thumb{height:120px;display:flex;align-items:center;justify-content:center;background:repeating-conic-gradient(#2b2016 0 25%,#20180f 0 50%) 50%/16px 16px;border-radius:6px;overflow:hidden}
  .thumb img{max-width:100%;max-height:100%;image-rendering:pixelated}
  .meta{margin:8px 0 4px}
  .meta b{display:block;color:#f0c674;font-size:13px}
  .meta span{color:#9b8a6f;font-size:12px}
  .meta code{display:block;color:#6b5f4a;font-size:10px;margin-top:2px;word-break:break-all}
  .drop{text-align:center;color:#9b8a6f;font-size:12px;padding:6px;border:1px dashed #4a3f2a;border-radius:6px;margin-top:6px}
  .card.ok .drop{color:#9bbf7a;border-color:#5b7f3a}
  .hint{color:#9b8a6f;max-width:760px;line-height:1.5}
</style></head><body>
<h1>🍄 Mycelia Hollow — Asset Uploader</h1>
<p class="hint">Drag a PNG onto any slot (or click it) to replace that piece of art. Files are written into
<code>src/game/assets/art/</code>. Any resolution works — the game scales each image. After uploading,
run <code>npm run dev</code> to preview, or tell Claude to rebuild &amp; redeploy.</p>
${sections}
<script>
for (const card of document.querySelectorAll('.card')) {
  const input = card.querySelector('input');
  const drop = card.querySelector('.drop');
  const send = (file) => {
    if (!file || file.type !== 'image/png') { drop.textContent = 'PNG files only'; return; }
    const reader = new FileReader();
    reader.onload = async () => {
      drop.textContent = 'Uploading…';
      const data = String(reader.result).split(',')[1];
      const res = await fetch('/api/upload', {method:'POST',headers:{'content-type':'application/json'},
        body: JSON.stringify({ path: card.dataset.path, data })});
      if (res.ok) {
        card.classList.add('ok'); drop.textContent = '✓ Saved';
        card.querySelector('img').src = '/art/' + card.dataset.path + '?t=' + Date.now();
      } else { drop.textContent = 'Failed: ' + (await res.text()); }
    };
    reader.readAsDataURL(file);
  };
  card.addEventListener('click', () => input.click());
  input.addEventListener('change', () => send(input.files[0]));
  card.addEventListener('dragover', (e) => { e.preventDefault(); card.classList.add('over'); });
  card.addEventListener('dragleave', () => card.classList.remove('over'));
  card.addEventListener('drop', (e) => { e.preventDefault(); card.classList.remove('over'); send(e.dataTransfer.files[0]); });
}
</script></body></html>`;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/') {
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.end(page());
    return;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/art/')) {
    const abs = safeArtPath(decodeURIComponent(url.pathname.slice('/art/'.length)));
    if (abs && existsSync(abs)) {
      res.setHeader('content-type', 'image/png');
      res.end(readFileSync(abs));
    } else {
      res.statusCode = 404;
      res.end('not found');
    }
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/upload') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const { path, data } = JSON.parse(body);
        const abs = safeArtPath(path);
        if (!abs) { res.statusCode = 400; res.end('invalid path'); return; }
        mkdirSync(dirname(abs), { recursive: true });
        writeFileSync(abs, Buffer.from(data, 'base64'));
        console.log('saved', relative(ROOT, abs));
        res.end('ok');
      } catch (e) {
        res.statusCode = 500;
        res.end(String(e));
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end('not found');
});

server.listen(PORT, () => {
  console.log(`\n  🍄 Asset uploader running:  http://localhost:${PORT}\n`);
  console.log('  Drag PNGs onto slots to replace art in src/game/assets/art/\n');
});
