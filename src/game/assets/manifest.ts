import { PALETTE, DESIGN_WIDTH, DESIGN_HEIGHT, TILE_SIZE } from '@/game/config';

/**
 * The asset manifest is the single place assets are declared.
 *
 * Art lives in `src/game/assets/art/**` and is resolved to bundled URLs via the
 * Vite glob below. Because it is imported (not fetched from `public/`), it is
 * embedded into the build — including the single-file artifact. Generate/refresh
 * the art with `npm run art`; to hand-replace any piece, overwrite its PNG in
 * `art/` (matching the `file` path) and rebuild.
 *
 * If an entry has no `file` (or the file is absent), PreloadScene draws a
 * clearly-labelled placeholder at the authored dimensions instead.
 */

// Eagerly resolve every generated art file to its bundled URL.
const ART_URLS = import.meta.glob('./art/**/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function artUrl(file: string): string | undefined {
  return ART_URLS[`./art/${file}`];
}

export interface AssetEntry {
  key: string;
  /** Art file under `src/game/assets/art/`. Absent → placeholder only. */
  file?: string;
  /** Resolved bundled URL (filled in from the glob). */
  url?: string;
  width: number;
  height: number;
  /** Placeholder tint until real art exists. */
  color: number;
  /** Short label drawn on the placeholder block. */
  label: string;
  kind: 'background' | 'sprite';
}

const RAW: AssetEntry[] = [
  // --- Scene backgrounds ---------------------------------------------------
  { key: 'bg.village', file: 'backgrounds/mushroom-kingdom.png', width: DESIGN_WIDTH, height: DESIGN_HEIGHT, color: PALETTE.mossDark, label: 'Mushroom Kingdom', kind: 'background' },
  { key: 'bg.cave', file: 'backgrounds/cave.png', width: DESIGN_WIDTH, height: DESIGN_HEIGHT, color: 0x5a4028, label: 'The Rootway Caves', kind: 'background' },
  { key: 'bg.blighted-reach', file: 'backgrounds/blighted-reach.png', width: DESIGN_WIDTH, height: DESIGN_HEIGHT, color: 0x2b2429, label: 'The Blighted Reach', kind: 'background' },
  { key: 'bg.title', file: 'backgrounds/title.png', width: DESIGN_WIDTH, height: DESIGN_HEIGHT, color: PALETTE.ink, label: 'Title Backdrop', kind: 'background' },

  // --- Selectable hero sprites + portraits --------------------------------
  { key: 'char.squirrel', file: 'sprites/squirrel.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0xa0522d, label: 'Squirrel', kind: 'sprite' },
  { key: 'char.gnome', file: 'sprites/gnome.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0x5b7f3a, label: 'Gnome', kind: 'sprite' },
  { key: 'char.woodelf', file: 'sprites/woodelf.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0x2f5d50, label: 'Wood Elf', kind: 'sprite' },
  { key: 'portrait.squirrel', file: 'portraits/squirrel.png', width: 128, height: 128, color: 0xa0522d, label: 'Squirrel', kind: 'sprite' },
  { key: 'portrait.gnome', file: 'portraits/gnome.png', width: 128, height: 128, color: 0x5b7f3a, label: 'Gnome', kind: 'sprite' },
  { key: 'portrait.woodelf', file: 'portraits/woodelf.png', width: 128, height: 128, color: 0x2f5d50, label: 'Wood Elf', kind: 'sprite' },

  // --- Other party / NPC sprites ------------------------------------------
  { key: 'char.leaf', file: 'sprites/leaf.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0x6ab04c, label: 'Leaf', kind: 'sprite' },
  { key: 'npc.rustle', file: 'sprites/leaf.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0x6ab04c, label: 'Rustle', kind: 'sprite' },
  { key: 'npc.elder-morel', file: 'sprites/elder-morel.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0x9b6b3f, label: 'Elder', kind: 'sprite' },
  { key: 'npc.fen', file: 'sprites/fen.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0xd4a017, label: 'Fen', kind: 'sprite' },
  { key: 'npc.boletta', file: 'sprites/boletta.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0xc86b8a, label: 'Boletta', kind: 'sprite' },
  { key: 'npc.mushroom-king', file: 'sprites/mushroom-king.png', width: TILE_SIZE * 1.5, height: TILE_SIZE * 2, color: 0xb5423a, label: 'King', kind: 'sprite' },
  { key: 'portrait.mushroom-king', file: 'portraits/mushroom-king.png', width: 128, height: 128, color: 0xb5423a, label: 'King', kind: 'sprite' },

  // --- Enemy sprites ------------------------------------------------------
  { key: 'enemy.blight-mite', file: 'enemies/blight-mite.png', width: TILE_SIZE * 1.5, height: TILE_SIZE * 1.5, color: 0x4b3b57, label: 'Mite', kind: 'sprite' },
  { key: 'enemy.wither-cap', file: 'enemies/wither-cap.png', width: TILE_SIZE * 1.5, height: TILE_SIZE * 1.5, color: 0x5a4632, label: 'Cap', kind: 'sprite' },
  { key: 'enemy.gloom-moth', file: 'enemies/gloom-moth.png', width: TILE_SIZE * 1.5, height: TILE_SIZE * 1.5, color: 0x3a3550, label: 'Moth', kind: 'sprite' },
  { key: 'enemy.dark-minion', file: 'enemies/dark-minion.png', width: TILE_SIZE * 1.75, height: TILE_SIZE * 2, color: 0x2b2b33, label: 'Minion', kind: 'sprite' },
  { key: 'enemy.rot-warden', file: 'enemies/rot-warden.png', width: TILE_SIZE * 2.5, height: TILE_SIZE * 2.5, color: 0x6b2e3a, label: 'Rot Warden', kind: 'sprite' },
  { key: 'enemy.mycelial-tyrant', file: 'enemies/mycelial-tyrant.png', width: TILE_SIZE * 3, height: TILE_SIZE * 3.5, color: 0x1c1c22, label: 'Mycelial Tyrant', kind: 'sprite' },
  { key: 'npc.dark-lord', file: 'sprites/dark-lord.png', width: TILE_SIZE * 2, height: TILE_SIZE * 2.5, color: 0x1c1c22, label: 'Dark Lord', kind: 'sprite' },
  { key: 'portrait.dark-lord', file: 'portraits/dark-lord.png', width: 128, height: 128, color: 0x1c1c22, label: 'Dark Lord', kind: 'sprite' },

  // --- Props --------------------------------------------------------------
  { key: 'prop.crafting-stump', file: 'props/crafting-stump.png', width: TILE_SIZE, height: TILE_SIZE, color: PALETTE.soil, label: 'Stump', kind: 'sprite' },
  { key: 'prop.training-post', file: 'props/training-post.png', width: TILE_SIZE, height: TILE_SIZE, color: 0x8a5a2b, label: 'Spar', kind: 'sprite' },
];

export const ASSETS: AssetEntry[] = RAW.map((a) => ({
  ...a,
  url: a.file ? artUrl(a.file) : undefined,
}));

export const ASSETS_BY_KEY: Record<string, AssetEntry> = Object.fromEntries(
  ASSETS.map((a) => [a.key, a]),
);
