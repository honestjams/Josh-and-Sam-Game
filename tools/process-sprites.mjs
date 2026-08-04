/**
 * Extract transparent hero sprites from the parchment character sheet.
 * Crops each front pose, flood-fills the parchment background to transparency
 * (from the borders, so interior colours are safe), trims to content, writes PNG.
 */
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ART = resolve(ROOT, 'src/game/assets/art');
const SHEET = resolve(ROOT, 'ElevenLabs Image Upscale Aug 4 2026 (2).png');

const TOL = 62; // colour distance to treat as background

function dist(d, i, r, g, b) {
  const dr = d[i] - r, dg = d[i + 1] - g, db = d[i + 2] - b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

async function extract(sx, sy, sw, sh, outRel) {
  const img = await loadImage(SHEET);
  const c = createCanvas(sw, sh);
  const x = c.getContext('2d');
  x.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  const id = x.getImageData(0, 0, sw, sh);
  const d = id.data;

  // Background colour = average of the four corners.
  const corners = [0, (sw - 1) * 4, (sh - 1) * sw * 4, ((sh - 1) * sw + sw - 1) * 4];
  let r = 0, g = 0, b = 0;
  for (const ci of corners) { r += d[ci]; g += d[ci + 1]; b += d[ci + 2]; }
  r /= 4; g /= 4; b /= 4;

  // Flood fill from every border pixel.
  const visited = new Uint8Array(sw * sh);
  const stack = [];
  const push = (px, py) => { if (px >= 0 && px < sw && py >= 0 && py < sh && !visited[py * sw + px]) stack.push(px, py); };
  for (let px = 0; px < sw; px++) { push(px, 0); push(px, sh - 1); }
  for (let py = 0; py < sh; py++) { push(0, py); push(sw - 1, py); }
  while (stack.length) {
    const py = stack.pop(), px = stack.pop();
    const p = py * sw + px;
    if (visited[p]) continue;
    visited[p] = 1;
    const i = p * 4;
    if (dist(d, i, r, g, b) > TOL) continue; // hit the figure edge
    d[i + 3] = 0; // transparent
    push(px + 1, py); push(px - 1, py); push(px, py + 1); push(px, py - 1);
  }

  // Trim to opaque bounding box.
  let minX = sw, minY = sh, maxX = 0, maxY = 0;
  for (let py = 0; py < sh; py++) for (let px = 0; px < sw; px++) {
    if (d[(py * sw + px) * 4 + 3] > 16) {
      if (px < minX) minX = px; if (px > maxX) maxX = px;
      if (py < minY) minY = py; if (py > maxY) maxY = py;
    }
  }
  x.putImageData(id, 0, 0);
  const pad = 4;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(sw - 1, maxX + pad); maxY = Math.min(sh - 1, maxY + pad);
  const tw = maxX - minX + 1, th = maxY - minY + 1;
  const out = createCanvas(tw, th);
  out.getContext('2d').drawImage(c, minX, minY, tw, th, 0, 0, tw, th);
  writeFileSync(resolve(ART, outRel), out.toBuffer('image/png'));
  console.log(`sprite -> ${outRel}  crop ${tw}x${th}  bg(${r | 0},${g | 0},${b | 0})`);
}

// Crop boxes in the 2752x1536 sheet (front-facing poses).
await extract(600, 110, 180, 360, 'sprites/woodelf.png');   // row 1, figure 1
await extract(1520, 505, 240, 405, 'sprites/gnome.png');     // row 2, front figure
await extract(1480, 950, 300, 380, 'sprites/squirrel.png');  // row 3, sword+shield front
