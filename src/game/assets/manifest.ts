import { PALETTE, DESIGN_WIDTH, DESIGN_HEIGHT, TILE_SIZE } from '@/game/config';

/**
 * The asset manifest is the single place assets are declared. Everything the
 * game renders loads through here, so real illustrations drop in by placing a
 * file at `path` — no code changes. Until then, PreloadScene generates a
 * clearly-labelled placeholder texture per entry using `color`/`label`.
 *
 * Expected dimensions are documented here (and mirrored in the README) so
 * AI-generated or commissioned art is trivially drop-in compatible.
 */
export interface AssetEntry {
  key: string;
  /** Where the real file will live under `public/`. */
  path: string;
  width: number;
  height: number;
  /** Placeholder tint until real art exists. */
  color: number;
  /** Short label drawn on the placeholder block. */
  label: string;
  kind: 'background' | 'sprite';
}

export const ASSETS: AssetEntry[] = [
  // --- Scene backgrounds (painterly, per-screen) --------------------------
  {
    // The Mushroom Kingdom hub — the King's main area. Drop the reference art
    // (authored at/above the design resolution) here to replace the placeholder.
    key: 'bg.village',
    path: 'assets/backgrounds/mushroom-kingdom.png',
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    color: PALETTE.mossDark,
    label: 'Mushroom Kingdom (hub bg)',
    kind: 'background',
  },
  {
    key: 'bg.title',
    path: 'assets/backgrounds/title.png',
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    color: PALETTE.ink,
    label: 'Title Backdrop',
    kind: 'background',
  },

  // --- Selectable hero sprites (drop real pixel art at these paths) -------
  { key: 'char.squirrel', path: 'assets/sprites/squirrel.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0xa0522d, label: 'Squirrel', kind: 'sprite' },
  { key: 'char.gnome', path: 'assets/sprites/gnome.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0x5b7f3a, label: 'Gnome', kind: 'sprite' },
  { key: 'char.woodelf', path: 'assets/sprites/woodelf.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0x2f5d50, label: 'Wood Elf', kind: 'sprite' },
  // Portrait slots for the character-select / party screens (square).
  { key: 'portrait.squirrel', path: 'assets/portraits/squirrel.png', width: 128, height: 128, color: 0xa0522d, label: 'Squirrel', kind: 'sprite' },
  { key: 'portrait.gnome', path: 'assets/portraits/gnome.png', width: 128, height: 128, color: 0x5b7f3a, label: 'Gnome', kind: 'sprite' },
  { key: 'portrait.woodelf', path: 'assets/portraits/woodelf.png', width: 128, height: 128, color: 0x2f5d50, label: 'Wood Elf', kind: 'sprite' },

  // --- Other party / NPC sprites (illustrated, few frames) ----------------
  { key: 'char.leaf', path: 'assets/sprites/leaf.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0x6ab04c, label: 'Leaf', kind: 'sprite' },
  { key: 'npc.elder-morel', path: 'assets/sprites/elder-morel.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0x9b6b3f, label: 'Elder', kind: 'sprite' },
  { key: 'npc.rustle', path: 'assets/sprites/rustle.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0x6ab04c, label: 'Rustle', kind: 'sprite' },
  { key: 'npc.fen', path: 'assets/sprites/fen.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0xd4a017, label: 'Fen', kind: 'sprite' },
  { key: 'npc.boletta', path: 'assets/sprites/boletta.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0xc86b8a, label: 'Boletta', kind: 'sprite' },
  // The Mushroom King — larger sprite; drop his art (throne/idle pose) here.
  { key: 'npc.mushroom-king', path: 'assets/sprites/mushroom-king.png', width: TILE_SIZE * 1.5, height: TILE_SIZE * 2, color: 0xb5423a, label: 'King', kind: 'sprite' },
  { key: 'portrait.mushroom-king', path: 'assets/portraits/mushroom-king.png', width: 128, height: 128, color: 0xb5423a, label: 'King', kind: 'sprite' },

  // --- Enemy sprites (drop real pixel art at these paths) -----------------
  { key: 'enemy.blight-mite', path: 'assets/sprites/enemies/blight-mite.png', width: TILE_SIZE * 1.5, height: TILE_SIZE * 1.5, color: 0x4b3b57, label: 'Mite', kind: 'sprite' },
  { key: 'enemy.wither-cap', path: 'assets/sprites/enemies/wither-cap.png', width: TILE_SIZE * 1.5, height: TILE_SIZE * 1.5, color: 0x5a4632, label: 'Cap', kind: 'sprite' },
  { key: 'enemy.gloom-moth', path: 'assets/sprites/enemies/gloom-moth.png', width: TILE_SIZE * 1.5, height: TILE_SIZE * 1.5, color: 0x3a3550, label: 'Moth', kind: 'sprite' },
  { key: 'enemy.dark-minion', path: 'assets/sprites/enemies/dark-minion.png', width: TILE_SIZE * 1.75, height: TILE_SIZE * 2, color: 0x2b2b33, label: 'Minion', kind: 'sprite' },
  { key: 'enemy.rot-warden', path: 'assets/sprites/enemies/rot-warden.png', width: TILE_SIZE * 2.5, height: TILE_SIZE * 2.5, color: 0x6b2e3a, label: 'Rot Warden', kind: 'sprite' },
  // The Dark Lord — the Mycelial Tyrant. Large boss sprite.
  { key: 'enemy.mycelial-tyrant', path: 'assets/sprites/enemies/mycelial-tyrant.png', width: TILE_SIZE * 3, height: TILE_SIZE * 3.5, color: 0x1c1c22, label: 'Mycelial Tyrant', kind: 'sprite' },
  { key: 'npc.dark-lord', path: 'assets/sprites/dark-lord.png', width: TILE_SIZE * 2, height: TILE_SIZE * 2.5, color: 0x1c1c22, label: 'Dark Lord', kind: 'sprite' },
  { key: 'portrait.dark-lord', path: 'assets/portraits/dark-lord.png', width: 128, height: 128, color: 0x1c1c22, label: 'Dark Lord', kind: 'sprite' },

  // Interactable props placed on the map.
  { key: 'prop.crafting-stump', path: 'assets/sprites/crafting-stump.png', width: TILE_SIZE, height: TILE_SIZE, color: PALETTE.soil, label: 'Stump', kind: 'sprite' },
  { key: 'prop.training-post', path: 'assets/sprites/training-post.png', width: TILE_SIZE, height: TILE_SIZE, color: 0x8a5a2b, label: 'Spar', kind: 'sprite' },
];

export const ASSETS_BY_KEY: Record<string, AssetEntry> = Object.fromEntries(
  ASSETS.map((a) => [a.key, a]),
);
