/**
 * One-off: turn the raw uploads in the repo root into game-ready art.
 * Backgrounds are downscaled to the design resolution (keeps the bundle small);
 * portraits are cropped from the character showcase. Sprites are handled by a
 * second pass (background-keyed).
 */
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ART = resolve(ROOT, 'src/game/assets/art');
const R = (f) => resolve(ROOT, f);

async function resizeBg(srcRel, outRel, w = 960, h = 540) {
  const img = await loadImage(R(srcRel));
  const c = createCanvas(w, h);
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = true;
  x.drawImage(img, 0, 0, img.width, img.height, 0, 0, w, h);
  writeFileSync(resolve(ART, outRel), c.toBuffer('image/png'));
  console.log('bg ->', outRel, `(${img.width}x${img.height} -> ${w}x${h})`);
}

// Crop a square-ish region and fit it into a 128x128 portrait.
async function portrait(srcRel, sx, sy, sw, sh, outRel) {
  const img = await loadImage(R(srcRel));
  const c = createCanvas(128, 128);
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = true;
  x.drawImage(img, sx, sy, sw, sh, 0, 0, 128, 128);
  writeFileSync(resolve(ART, outRel), c.toBuffer('image/png'));
  console.log('portrait ->', outRel);
}

const UPSCALE1 = 'ElevenLabs Image Upscale Aug 4 2026 (1).png'; // mushroom kingdom
const WITCH = 'ElevenLabs AI Voice Generator Aug 4 2026.png';
const BLIGHT = 'ElevenLabs AI Voice Image Aug 4 2026.png'; // lava cavern
const CAVE = 'ElevenLabs AI Voice Image Aug 4 2026 (4).png'; // cave/forest boundary
const TAVERN = 'orc-tavern.png';
const SHOWCASE = 'ElevenLabs Character Generation Aug 4 2026 (1).png'; // 1376x768 trio + strip

await resizeBg(UPSCALE1, 'backgrounds/mushroom-kingdom.png');
await resizeBg(WITCH, 'backgrounds/witch-house.png');
await resizeBg(BLIGHT, 'backgrounds/blighted-reach.png');
await resizeBg(CAVE, 'backgrounds/cave.png');
await resizeBg(TAVERN, 'backgrounds/orc-tavern.png');

// Portrait busts from the showcase (1376x768): elf (left), gnome (centre), squirrel (right).
await portrait(SHOWCASE, 150, 70, 240, 240, 'portraits/woodelf.png');
await portrait(SHOWCASE, 560, 95, 300, 300, 'portraits/gnome.png');
await portrait(SHOWCASE, 945, 205, 320, 320, 'portraits/squirrel.png');

console.log('done backgrounds + portraits');
