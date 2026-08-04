/**
 * Procedural art generator for Mycelia Hollow.
 *
 * We can't ingest the reference PNGs' bytes directly, so this authors original
 * sprites/portraits/backgrounds *from* those references — cozy, storybook,
 * mushroom-fantasy — and writes them into `src/game/assets/art/**` where the
 * manifest imports them (so they bundle into the build, including the
 * single-file artifact). Re-run with: `npm run art`.
 *
 * To hand-replace any asset with real pixel art, drop a PNG over the matching
 * file in `src/game/assets/art/` and rebuild.
 */
import { createCanvas } from '@napi-rs/canvas';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ART = resolve(ROOT, 'src/game/assets/art');

function canvas(w, h) {
  const c = createCanvas(w, h);
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = true;
  return { c, x, w, h };
}
import { existsSync } from 'node:fs';

// Non-destructive by default: never overwrite art the user has dropped in.
// Run with FORCE=1 to regenerate every placeholder.
function save(c, rel) {
  const path = resolve(ART, rel);
  mkdirSync(dirname(path), { recursive: true });
  if (existsSync(path) && process.env.FORCE !== '1') {
    console.log('skip (exists):', rel);
    return;
  }
  writeFileSync(path, c.toBuffer('image/png'));
}

// --- shared drawing helpers ------------------------------------------------

/** A classic red mushroom cap with white spots. */
function cap(x, cx, cy, rx, ry, color = '#c0392b', spots = '#f6e7c1') {
  x.save();
  x.fillStyle = color;
  x.beginPath();
  x.ellipse(cx, cy, rx, ry, 0, Math.PI, 0);
  x.fill();
  // underside
  x.fillStyle = shade(color, -0.25);
  x.beginPath();
  x.ellipse(cx, cy, rx, ry * 0.35, 0, 0, Math.PI);
  x.fill();
  x.fillStyle = spots;
  for (const [dx, dy, r] of [[-rx * 0.45, -ry * 0.45, rx * 0.16], [rx * 0.35, -ry * 0.55, rx * 0.13], [0, -ry * 0.7, rx * 0.11], [rx * 0.6, -ry * 0.2, rx * 0.1]]) {
    x.beginPath();
    x.ellipse(cx + dx, cy + dy, r, r * 0.85, 0, 0, Math.PI * 2);
    x.fill();
  }
  x.restore();
}
function ellipse(x, cx, cy, rx, ry, color) {
  x.fillStyle = color;
  x.beginPath();
  x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  x.fill();
}
function roundRect(x, px, py, w, h, r, color) {
  x.fillStyle = color;
  x.beginPath();
  x.roundRect(px, py, w, h, r);
  x.fill();
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  r = Math.round(r + (f - r) * p); g = Math.round(g + (f - g) * p); b = Math.round(b + (f - b) * p);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
function eyes(x, cx, y, sp = 4, color = '#20140c') {
  ellipse(x, cx - sp, y, 1.6, 2, color);
  ellipse(x, cx + sp, y, 1.6, 2, color);
}
function shadow(x, cx, cy, rx) {
  x.fillStyle = 'rgba(0,0,0,0.18)';
  x.beginPath();
  x.ellipse(cx, cy, rx, rx * 0.3, 0, 0, Math.PI * 2);
  x.fill();
}

// ---------------------------------------------------------------------------
// Heroes (32x48 overworld sprites) + portraits (128x128)
// ---------------------------------------------------------------------------

function squirrel() {
  const { c, x } = canvas(32, 48);
  shadow(x, 16, 45, 11);
  // bushy tail behind
  x.fillStyle = '#8a4b28';
  x.beginPath(); x.ellipse(7, 26, 7, 12, -0.3, 0, Math.PI * 2); x.fill();
  ellipse(x, 7, 26, 4.5, 9, '#a05a30');
  // body
  roundRect(x, 10, 22, 13, 18, 6, '#9c5a2f');
  ellipse(x, 16, 32, 5, 7, '#e7c79a'); // belly
  // leaf pauldron
  ellipse(x, 12, 24, 3.5, 2, '#5b8c3a');
  // head
  ellipse(x, 16, 15, 8, 8, '#a05a30');
  ellipse(x, 11, 8, 3, 4, '#8a4b28'); // ears
  ellipse(x, 21, 8, 3, 4, '#8a4b28');
  ellipse(x, 16, 18, 4, 3, '#e7c79a'); // muzzle
  eyes(x, 16, 13, 3.5);
  ellipse(x, 16, 16, 1.2, 1, '#3a241a');
  // sword + shield
  x.strokeStyle = '#cfd6dc'; x.lineWidth = 2; x.beginPath(); x.moveTo(25, 30); x.lineTo(29, 20); x.stroke();
  x.fillStyle = '#c9a24a'; x.fillRect(23, 29, 4, 2);
  ellipse(x, 9, 33, 4, 5, '#7d8790'); ellipse(x, 9, 33, 2.5, 3.5, '#9aa4ad');
  save(c, 'sprites/squirrel.png');
}

function gnome() {
  const { c, x } = canvas(32, 48);
  shadow(x, 16, 45, 10);
  // body / tunic
  roundRect(x, 9, 26, 14, 15, 5, '#5b7f3a');
  roundRect(x, 9, 34, 14, 7, 3, '#6b4a2a'); // trousers
  x.fillStyle = '#3d2a17'; x.fillRect(9, 32, 14, 2); // belt
  // head
  ellipse(x, 16, 20, 7, 6, '#e9c39a');
  // beard
  x.fillStyle = '#eef0ea';
  x.beginPath(); x.moveTo(10, 20); x.quadraticCurveTo(16, 40, 22, 20); x.quadraticCurveTo(16, 26, 10, 20); x.fill();
  eyes(x, 16, 19, 3, '#2a3b6a');
  // long pointed hat
  x.fillStyle = '#b23a2e';
  x.beginPath(); x.moveTo(8, 15); x.lineTo(16, -2); x.lineTo(24, 15); x.closePath(); x.fill();
  x.fillStyle = shade('#b23a2e', -0.2); x.fillRect(8, 13, 16, 3);
  save(c, 'sprites/gnome.png');
}

function woodelf() {
  const { c, x } = canvas(32, 48);
  shadow(x, 16, 45, 9);
  // hair behind
  x.fillStyle = '#e8d27a';
  x.beginPath(); x.ellipse(16, 16, 8, 10, 0, 0, Math.PI * 2); x.fill();
  // tunic
  roundRect(x, 10, 24, 12, 17, 5, '#3e6b4a');
  ellipse(x, 16, 30, 4, 6, '#2f5238');
  // legs
  x.fillStyle = '#2b2b30'; x.fillRect(12, 39, 3, 6); x.fillRect(17, 39, 3, 6);
  // head (dark teal skin)
  ellipse(x, 16, 15, 6.5, 7, '#3a5f57');
  // pointed ears
  x.fillStyle = '#3a5f57';
  x.beginPath(); x.moveTo(9, 13); x.lineTo(5, 9); x.lineTo(10, 15); x.fill();
  x.beginPath(); x.moveTo(23, 13); x.lineTo(27, 9); x.lineTo(22, 15); x.fill();
  // hair fringe
  x.fillStyle = '#f0dc86'; x.beginPath(); x.moveTo(10, 11); x.quadraticCurveTo(16, 6, 22, 11); x.quadraticCurveTo(16, 12, 10, 11); x.fill();
  eyes(x, 16, 15, 3, '#eae0c0');
  save(c, 'sprites/woodelf.png');
}

function mushroomVillager(name, capColor) {
  const { c, x } = canvas(32, 48);
  shadow(x, 16, 45, 9);
  // stubby cream body
  roundRect(x, 10, 26, 13, 15, 6, '#efe3c5');
  x.fillStyle = '#5b7f3a'; x.fillRect(11, 30, 11, 4); // little green tunic band
  // face area
  ellipse(x, 16, 24, 7, 6, '#e9d8b8');
  eyes(x, 16, 24, 3);
  ellipse(x, 16, 27, 1.6, 1, '#caa');
  // mushroom cap head
  cap(x, 16, 20, 12, 8, capColor);
  save(c, `sprites/${name}.png`);
}
function leafSprite() {
  const { c, x } = canvas(32, 48);
  shadow(x, 16, 45, 8);
  // leaf body
  x.fillStyle = '#5fa544';
  x.beginPath(); x.moveTo(16, 8); x.quadraticCurveTo(28, 26, 16, 42); x.quadraticCurveTo(4, 26, 16, 8); x.fill();
  x.strokeStyle = '#3d7a2c'; x.lineWidth = 1.5;
  x.beginPath(); x.moveTo(16, 12); x.lineTo(16, 40); x.moveTo(16, 22); x.lineTo(23, 20); x.moveTo(16, 26); x.lineTo(9, 24); x.stroke();
  eyes(x, 16, 22, 3, '#20140c');
  ellipse(x, 16, 26, 2, 1.2, '#2a3b1a');
  save(c, 'sprites/leaf.png');
}
function mushroomKing() {
  const { c, x } = canvas(48, 64);
  shadow(x, 24, 60, 16);
  // leafy green robe
  x.fillStyle = '#4f7a3a';
  x.beginPath(); x.moveTo(12, 34); x.quadraticCurveTo(24, 24, 36, 34); x.lineTo(40, 60); x.lineTo(8, 60); x.closePath(); x.fill();
  // leaf collar
  for (let i = -2; i <= 2; i++) ellipse(x, 24 + i * 6, 34, 4, 6, i % 2 ? '#5b8c3a' : '#6fa347');
  // body/face area
  ellipse(x, 24, 30, 9, 8, '#e6c9a0');
  // long white beard
  x.fillStyle = '#f2f3ee';
  x.beginPath(); x.moveTo(15, 30); x.quadraticCurveTo(24, 58, 33, 30); x.quadraticCurveTo(24, 40, 15, 30); x.fill();
  eyes(x, 24, 28, 4, '#3a2a1a');
  // big mushroom-cap crown
  cap(x, 24, 22, 18, 12, '#c0392b');
  // golden staff
  x.strokeStyle = '#caa64a'; x.lineWidth = 3; x.beginPath(); x.moveTo(39, 58); x.lineTo(42, 20); x.stroke();
  x.fillStyle = '#ffe9a8'; ellipse(x, 42, 18, 4, 4, '#ffe9a8'); ellipse(x, 42, 18, 2, 2, '#fff6d8');
  save(c, 'sprites/mushroom-king.png');
}

function darkLord() {
  const { c, x } = canvas(64, 80);
  shadow(x, 32, 76, 20);
  // tattered robe
  x.fillStyle = '#2b2c30';
  x.beginPath(); x.moveTo(16, 40); x.quadraticCurveTo(32, 28, 48, 40); x.lineTo(52, 74);
  for (let i = 48; i >= 16; i -= 8) x.lineTo(i, 68 + (i % 16 ? 6 : 0));
  x.closePath(); x.fill();
  // spiky cap-hat
  x.fillStyle = '#1c1d22';
  x.beginPath(); x.ellipse(32, 26, 22, 10, 0, Math.PI, 0); x.fill();
  x.beginPath(); x.moveTo(20, 26); x.lineTo(32, 8); x.lineTo(44, 26); x.fill();
  // void face
  ellipse(x, 32, 30, 9, 11, '#0a0a0c');
  ellipse(x, 29, 28, 1.6, 2.4, '#b8c4ff');
  ellipse(x, 35, 28, 1.6, 2.4, '#b8c4ff');
  // wispy tendrils
  x.strokeStyle = '#15161a'; x.lineWidth = 2;
  for (const sx of [14, 50]) { x.beginPath(); x.moveTo(sx, 44); x.quadraticCurveTo(sx + (sx < 32 ? -8 : 8), 52, sx, 62); x.stroke(); }
  // staff
  x.strokeStyle = '#3a3320'; x.lineWidth = 3; x.beginPath(); x.moveTo(50, 72); x.lineTo(52, 18); x.stroke();
  ellipse(x, 52, 16, 4, 4, '#6b4a7a');
  save(c, 'sprites/dark-lord.png');
}

function portrait(name, drawInner, bg1, bg2) {
  const { c, x } = canvas(128, 128);
  const g = x.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, bg1); g.addColorStop(1, bg2);
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  x.save(); x.translate(64, 70); x.scale(3.4, 3.4); x.translate(-16, -20);
  drawInner(x);
  x.restore();
  // vignette frame
  x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 6; x.strokeRect(3, 3, 122, 122);
  save(c, `portraits/${name}.png`);
}

// ---------------------------------------------------------------------------
// Enemies
// ---------------------------------------------------------------------------

function blightMite() {
  const { c, x } = canvas(48, 48);
  shadow(x, 24, 44, 12);
  ellipse(x, 24, 28, 12, 10, '#4b3b57');
  ellipse(x, 24, 24, 8, 7, '#5d4a6d');
  x.strokeStyle = '#3a2e45'; x.lineWidth = 2;
  for (const s of [-1, 1]) for (const dy of [24, 30, 36]) { x.beginPath(); x.moveTo(24 + s * 8, dy); x.lineTo(24 + s * 16, dy + 4); x.stroke(); }
  ellipse(x, 20, 24, 2, 2.5, '#d9b3ff'); ellipse(x, 28, 24, 2, 2.5, '#d9b3ff');
  save(c, 'enemies/blight-mite.png');
}
function witherCap() {
  const { c, x } = canvas(48, 48);
  shadow(x, 24, 44, 13);
  roundRect(x, 16, 26, 16, 16, 5, '#6a513a');
  cap(x, 24, 24, 15, 9, '#7a4a3a', '#c9b48a');
  eyes(x, 24, 30, 4, '#2a1c12');
  x.strokeStyle = '#3a2a1c'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(20, 36); x.quadraticCurveTo(24, 34, 28, 36); x.stroke();
  save(c, 'enemies/wither-cap.png');
}
function gloomMoth() {
  const { c, x } = canvas(48, 48);
  shadow(x, 24, 44, 11);
  x.fillStyle = 'rgba(80,74,110,0.85)';
  ellipse(x, 12, 22, 11, 13, '#4a4568'); ellipse(x, 36, 22, 11, 13, '#4a4568');
  ellipse(x, 14, 30, 7, 8, '#3a3550'); ellipse(x, 34, 30, 7, 8, '#3a3550');
  ellipse(x, 24, 26, 4, 10, '#2b2740');
  ellipse(x, 22, 18, 1.8, 2, '#e6d7ff'); ellipse(x, 26, 18, 1.8, 2, '#e6d7ff');
  save(c, 'enemies/gloom-moth.png');
}
function rotWarden() {
  const { c, x } = canvas(80, 80);
  shadow(x, 40, 74, 24);
  roundRect(x, 24, 40, 32, 32, 8, '#5a3a3a');
  cap(x, 40, 40, 30, 18, '#6b2e3a', '#c7a06a');
  // oozing spots
  x.fillStyle = '#8fbf5a'; for (const [dx, dy] of [[28, 30], [50, 26], [40, 20]]) ellipse(x, dx, dy, 3, 3, '#8fbf5a');
  eyes(x, 40, 50, 7, '#1a0e0e');
  ellipse(x, 34, 50, 2, 2.6, '#ff6b5a'); ellipse(x, 46, 50, 2, 2.6, '#ff6b5a');
  x.strokeStyle = '#3a2020'; x.lineWidth = 2; x.beginPath(); x.moveTo(32, 60); x.quadraticCurveTo(40, 66, 48, 60); x.stroke();
  save(c, 'enemies/rot-warden.png');
}
function darkMinion() {
  const { c, x } = canvas(56, 64);
  shadow(x, 28, 60, 16);
  // spindly dark body
  x.fillStyle = '#26262e';
  x.beginPath(); x.moveTo(20, 30); x.lineTo(36, 30); x.lineTo(40, 58); x.lineTo(16, 58); x.closePath(); x.fill();
  x.strokeStyle = '#1a1a20'; x.lineWidth = 3;
  for (const s of [-1, 1]) { x.beginPath(); x.moveTo(28 + s * 6, 36); x.lineTo(28 + s * 18, 30); x.lineTo(28 + s * 22, 40); x.stroke(); }
  // cap head
  x.fillStyle = '#1c1d22'; x.beginPath(); x.ellipse(28, 24, 20, 9, 0, Math.PI, 0); x.fill();
  ellipse(x, 28, 26, 8, 9, '#0c0c10');
  ellipse(x, 24, 24, 1.8, 2.4, '#c9b3ff'); ellipse(x, 32, 24, 1.8, 2.4, '#c9b3ff');
  save(c, 'enemies/dark-minion.png');
}
function mycelialTyrant() {
  const { c, x } = canvas(96, 112);
  shadow(x, 48, 104, 34);
  // vast robe
  x.fillStyle = '#202127';
  x.beginPath(); x.moveTo(22, 54); x.quadraticCurveTo(48, 40, 74, 54); x.lineTo(84, 104); x.lineTo(12, 104); x.closePath(); x.fill();
  // arms wide
  x.strokeStyle = '#17181d'; x.lineWidth = 5;
  x.beginPath(); x.moveTo(26, 58); x.lineTo(6, 46); x.stroke();
  x.beginPath(); x.moveTo(70, 58); x.lineTo(90, 46); x.stroke();
  // huge dark cap
  x.fillStyle = '#191a1f'; x.beginPath(); x.ellipse(48, 40, 36, 16, 0, Math.PI, 0); x.fill();
  x.fillStyle = '#2a2b33'; for (const dx of [-18, 0, 18]) ellipse(x, 48 + dx, 30, 4, 3, '#3a3b45');
  // void face + glowing eyes
  ellipse(x, 48, 46, 13, 16, '#08080a');
  ellipse(x, 43, 43, 2.4, 3.4, '#9fb0ff'); ellipse(x, 53, 43, 2.4, 3.4, '#9fb0ff');
  // corruption cracks
  x.strokeStyle = '#6b4a7a'; x.lineWidth = 2; x.beginPath(); x.moveTo(48, 62); x.lineTo(44, 74); x.lineTo(52, 82); x.stroke();
  save(c, 'enemies/mycelial-tyrant.png');
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

function craftingStump() {
  const { c, x } = canvas(32, 32);
  shadow(x, 16, 29, 12);
  roundRect(x, 7, 14, 18, 14, 4, '#6b4a2a');
  ellipse(x, 16, 14, 9, 4, '#8a6238');
  ellipse(x, 16, 14, 5, 2.2, '#a07a48');
  cap(x, 22, 12, 6, 4, '#c0392b'); // little mushroom on top
  save(c, 'props/crafting-stump.png');
}
function trainingPost() {
  const { c, x } = canvas(32, 32);
  shadow(x, 16, 29, 10);
  x.fillStyle = '#7a5a34'; x.fillRect(14, 8, 4, 20);
  roundRect(x, 8, 8, 16, 8, 3, '#b08a50');
  x.strokeStyle = '#5a4020'; x.lineWidth = 1; x.strokeRect(8, 8, 16, 8);
  x.fillStyle = '#8a3a2a'; ellipse(x, 16, 12, 3, 3, '#8a3a2a'); // target
  ellipse(x, 16, 12, 1.4, 1.4, '#e7c79a');
  save(c, 'props/training-post.png');
}

// ---------------------------------------------------------------------------
// Backgrounds (960x540)
// ---------------------------------------------------------------------------

function mushroomKingdomBg() {
  const { c, x, w, h } = canvas(960, 540);
  // warm glowing sky between trees
  const sky = x.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#f3e2b0'); sky.addColorStop(0.5, '#e8d59a'); sky.addColorStop(1, '#cdd98a');
  x.fillStyle = sky; x.fillRect(0, 0, w, h);
  // distant tree silhouettes / light shafts
  x.fillStyle = 'rgba(180,200,120,0.25)';
  for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(120 + i * 140, 0); x.lineTo(160 + i * 140, 0); x.lineTo(140 + i * 140, 260); x.closePath(); x.fill(); }
  // ground
  const ground = x.createLinearGradient(0, 250, 0, h);
  ground.addColorStop(0, '#8fb85a'); ground.addColorStop(1, '#6fa044');
  x.fillStyle = ground; x.beginPath(); x.moveTo(0, 300); x.quadraticCurveTo(480, 250, 960, 300); x.lineTo(960, 540); x.lineTo(0, 540); x.fill();
  // big flanking tree trunks
  for (const [tx, tw] of [[0, 150], [830, 130]]) {
    const tg = x.createLinearGradient(tx, 0, tx + tw, 0);
    tg.addColorStop(0, '#6a4a2c'); tg.addColorStop(1, '#8a6238');
    x.fillStyle = tg; x.fillRect(tx, 0, tw, h);
    x.fillStyle = 'rgba(90,140,60,0.4)';
    for (let i = 0; i < 20; i++) ellipse(x, tx + (tx ? 10 : tw - 10) + Math.sin(i) * 8, i * 30, 6, 10, 'rgba(90,140,60,0.35)');
  }
  // winding river
  x.fillStyle = '#6fb0d6';
  x.beginPath(); x.moveTo(140, 540); x.quadraticCurveTo(300, 380, 380, 300); x.quadraticCurveTo(430, 250, 520, 240);
  x.lineTo(560, 260); x.quadraticCurveTo(470, 300, 430, 340); x.quadraticCurveTo(340, 420, 220, 540); x.closePath(); x.fill();
  x.strokeStyle = 'rgba(255,255,255,0.4)'; x.lineWidth = 2; x.beginPath(); x.moveTo(180, 520); x.quadraticCurveTo(320, 380, 420, 300); x.stroke();
  // wooden bridge hint
  x.fillStyle = '#b58a52'; x.save(); x.translate(470, 300); x.rotate(-0.35); x.fillRect(-40, -8, 80, 14); x.restore();
  // scattered mushrooms + sunflowers
  for (const [mx, my, s, col] of [[300, 430, 1.4, '#c0392b'], [700, 470, 1.6, '#c0392b'], [820, 360, 1, '#c99'], [600, 500, 1.2, '#c0392b'], [180, 430, 1, '#d98']]) {
    x.save(); x.translate(mx, my); x.scale(s, s); cap(x, 0, 0, 12, 8, col); x.fillStyle = '#efe3c5'; x.fillRect(-4, 0, 8, 10); x.restore();
  }
  for (const [sx, sy] of [[250, 470], [285, 500]]) { ellipse(x, sx, sy, 12, 12, '#e8b93a'); ellipse(x, sx, sy, 6, 6, '#7a4a20'); }
  // greenhouse hint (right)
  x.strokeStyle = 'rgba(120,90,50,0.9)'; x.lineWidth = 3; x.strokeRect(640, 380, 120, 70);
  x.fillStyle = 'rgba(200,230,220,0.35)'; x.fillRect(640, 380, 120, 70);
  save(c, 'backgrounds/mushroom-kingdom.png');
}

function caveBg() {
  const { c, x, w, h } = canvas(960, 540);
  // warm cavern glow
  const g = x.createRadialGradient(560, 200, 40, 480, 260, 640);
  g.addColorStop(0, '#f0d99a'); g.addColorStop(0.5, '#b78a4e'); g.addColorStop(1, '#5a4028');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  // rock walls (dark vignette sides + top)
  x.fillStyle = '#4a3421';
  x.beginPath(); x.moveTo(0, 0); x.lineTo(300, 0); x.quadraticCurveTo(120, 180, 0, 300); x.fill();
  x.beginPath(); x.moveTo(w, 0); x.lineTo(660, 0); x.quadraticCurveTo(840, 180, w, 300); x.fill();
  // stalactites
  x.fillStyle = '#3d2c1b';
  for (let i = 0; i < 12; i++) { const sx = 80 + i * 75; x.beginPath(); x.moveTo(sx, 0); x.lineTo(sx + 14, 0); x.lineTo(sx + 7, 40 + (i % 4) * 20); x.fill(); }
  // ground
  x.fillStyle = '#6a4d30'; x.beginPath(); x.moveTo(0, 360); x.quadraticCurveTo(480, 330, 960, 360); x.lineTo(960, 540); x.lineTo(0, 540); x.fill();
  // stone path
  x.fillStyle = '#8a6f4a'; x.beginPath(); x.moveTo(360, 540); x.lineTo(600, 540); x.lineTo(540, 380); x.lineTo(420, 380); x.closePath(); x.fill();
  // glowing crystals
  for (const [cx, cy, s, col] of [[150, 430, 1.3, '#f4c34a'], [820, 420, 1.1, '#f4c34a'], [700, 470, 0.9, '#ffd76a']]) {
    x.save(); x.translate(cx, cy); x.scale(s, s);
    x.fillStyle = col; x.beginPath(); x.moveTo(0, -30); x.lineTo(8, 0); x.lineTo(0, 8); x.lineTo(-8, 0); x.fill();
    x.fillStyle = 'rgba(255,240,180,0.4)'; ellipse(x, 0, -10, 16, 20, 'rgba(255,240,180,0.25)');
    x.restore();
  }
  // lantern glow near path
  ellipse(x, 380, 400, 26, 26, 'rgba(255,210,120,0.3)');
  save(c, 'backgrounds/cave.png');
}

function blightedReachBg() {
  const { c, x, w, h } = canvas(960, 540);
  // bruised purple sky
  const sky = x.createLinearGradient(0, 0, 0, 320);
  sky.addColorStop(0, '#2a1e33'); sky.addColorStop(1, '#4a2b2b');
  x.fillStyle = sky; x.fillRect(0, 0, w, 340);
  // ashen ground
  x.fillStyle = '#2b2429'; x.fillRect(0, 300, w, 240);
  // cathedral silhouettes
  x.fillStyle = '#1b1620';
  for (const [bx, bw, bh] of [[120, 90, 220], [260, 60, 170], [640, 110, 250], [790, 70, 190]]) {
    x.fillRect(bx, 320 - bh, bw, bh);
    x.beginPath(); x.moveTo(bx, 320 - bh); x.lineTo(bx + bw / 2, 320 - bh - 40); x.lineTo(bx + bw, 320 - bh); x.fill();
    x.fillStyle = '#e0663a'; for (let i = 0; i < 3; i++) x.fillRect(bx + 10 + i * (bw / 3), 320 - bh + 30, 6, 14);
    x.fillStyle = '#1b1620';
  }
  // lava rivers
  const lava = x.createLinearGradient(0, 340, 0, 540);
  lava.addColorStop(0, '#ff8a3a'); lava.addColorStop(1, '#c0341a');
  x.fillStyle = lava;
  x.beginPath(); x.moveTo(0, 460); x.quadraticCurveTo(300, 420, 520, 470); x.quadraticCurveTo(760, 520, 960, 470); x.lineTo(960, 540); x.lineTo(0, 540); x.fill();
  x.strokeStyle = 'rgba(255,220,120,0.6)'; x.lineWidth = 2; x.beginPath(); x.moveTo(40, 470); x.quadraticCurveTo(320, 435, 540, 480); x.stroke();
  // dead trees
  x.strokeStyle = '#15100f'; x.lineWidth = 4;
  for (const tx of [70, 900, 470]) { x.beginPath(); x.moveTo(tx, 340); x.lineTo(tx, 250); x.moveTo(tx, 290); x.lineTo(tx - 16, 270); x.moveTo(tx, 300); x.lineTo(tx + 16, 275); x.stroke(); }
  // ember particles
  x.fillStyle = 'rgba(255,170,80,0.7)';
  for (let i = 0; i < 40; i++) ellipse(x, (i * 137) % w, 340 + ((i * 53) % 180), 1.5, 1.5, 'rgba(255,170,80,0.6)');
  save(c, 'backgrounds/blighted-reach.png');
}

function titleBg() {
  const { c, x, w, h } = canvas(960, 540);
  const g = x.createRadialGradient(480, 240, 60, 480, 240, 560);
  g.addColorStop(0, '#2e2417'); g.addColorStop(1, '#140f09');
  x.fillStyle = g; x.fillRect(0, 0, w, h);
  // glowing mushrooms scattered
  for (let i = 0; i < 26; i++) {
    const mx = (i * 137) % w, my = 120 + ((i * 89) % 380), s = 0.6 + ((i * 7) % 10) / 10;
    x.globalAlpha = 0.5 + ((i * 13) % 5) / 10;
    x.save(); x.translate(mx, my); x.scale(s, s);
    ellipse(x, 0, 6, 3, 8, 'rgba(240,220,150,0.5)');
    cap(x, 0, 0, 10, 7, i % 4 ? '#a5432f' : '#caa04a', 'rgba(255,240,200,0.8)');
    x.restore();
  }
  x.globalAlpha = 1;
  // soft golden haze top
  const haze = x.createLinearGradient(0, 0, 0, 200);
  haze.addColorStop(0, 'rgba(240,198,116,0.25)'); haze.addColorStop(1, 'rgba(240,198,116,0)');
  x.fillStyle = haze; x.fillRect(0, 0, w, 200);
  save(c, 'backgrounds/title.png');
}

// ---------------------------------------------------------------------------

function all() {
  squirrel(); gnome(); woodelf(); mushroomKing(); darkLord();
  leafSprite();
  mushroomVillager('elder-morel', '#9b5b3a');
  mushroomVillager('fen', '#d4a017');
  mushroomVillager('boletta', '#c86b8a');
  blightMite(); witherCap(); gloomMoth(); rotWarden(); darkMinion(); mycelialTyrant();
  craftingStump(); trainingPost();
  mushroomKingdomBg(); caveBg(); blightedReachBg(); titleBg();

  // Portraits reuse the sprite drawings, re-centered.
  portrait('squirrel', (x) => { x.translate(0, 2); drawMini(x, squirrelHead); }, '#3a2a18', '#1c140b');
  portrait('gnome', (x) => drawMini(x, gnomeHead), '#2c3a1e', '#141c0d');
  portrait('woodelf', (x) => drawMini(x, woodelfHead), '#1e3a30', '#0d1c17');
  portrait('mushroom-king', (x) => { x.scale(0.8, 0.8); x.translate(4, 6); drawMini(x, kingHead); }, '#3a2a18', '#1c140b');
  portrait('dark-lord', (x) => { x.scale(0.7, 0.7); x.translate(6, 8); drawMini(x, darkHead); }, '#1a1a22', '#0a0a0e');
  console.log('Art generated into src/game/assets/art/');
}

// Bust drawings for portraits (drawn around 16,20 origin).
function drawMini(x, fn) { fn(x); }
function squirrelHead(x) {
  ellipse(x, 6, 20, 5, 9, '#8a4b28');
  ellipse(x, 16, 15, 8, 8, '#a05a30');
  ellipse(x, 11, 8, 3, 4, '#8a4b28'); ellipse(x, 21, 8, 3, 4, '#8a4b28');
  ellipse(x, 16, 18, 4, 3, '#e7c79a'); eyes(x, 16, 13, 3.5);
}
function gnomeHead(x) {
  ellipse(x, 16, 20, 7, 6, '#e9c39a');
  x.fillStyle = '#eef0ea'; x.beginPath(); x.moveTo(10, 20); x.quadraticCurveTo(16, 42, 22, 20); x.fill();
  eyes(x, 16, 19, 3, '#2a3b6a');
  x.fillStyle = '#b23a2e'; x.beginPath(); x.moveTo(8, 15); x.lineTo(16, -4); x.lineTo(24, 15); x.fill();
}
function woodelfHead(x) {
  ellipse(x, 16, 16, 8, 10, '#e8d27a');
  ellipse(x, 16, 15, 6.5, 7, '#3a5f57');
  x.fillStyle = '#3a5f57'; x.beginPath(); x.moveTo(9, 13); x.lineTo(5, 9); x.lineTo(10, 15); x.fill();
  x.beginPath(); x.moveTo(23, 13); x.lineTo(27, 9); x.lineTo(22, 15); x.fill();
  eyes(x, 16, 15, 3, '#eae0c0');
}
function kingHead(x) {
  ellipse(x, 24, 30, 9, 8, '#e6c9a0');
  x.fillStyle = '#f2f3ee'; x.beginPath(); x.moveTo(15, 30); x.quadraticCurveTo(24, 58, 33, 30); x.fill();
  eyes(x, 24, 28, 4, '#3a2a1a'); cap(x, 24, 22, 18, 12, '#c0392b');
}
function darkHead(x) {
  x.fillStyle = '#1c1d22'; x.beginPath(); x.ellipse(32, 26, 22, 10, 0, Math.PI, 0); x.fill();
  x.beginPath(); x.moveTo(20, 26); x.lineTo(32, 8); x.lineTo(44, 26); x.fill();
  ellipse(x, 32, 30, 9, 11, '#0a0a0c');
  ellipse(x, 29, 28, 1.6, 2.4, '#b8c4ff'); ellipse(x, 35, 28, 1.6, 2.4, '#b8c4ff');
}

all();
