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
    key: 'bg.village',
    path: 'assets/backgrounds/mycelia-hollow.png',
    width: DESIGN_WIDTH,
    height: DESIGN_HEIGHT,
    color: PALETTE.mossDark,
    label: 'Mycelia Hollow (village bg)',
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

  // --- Character / NPC sprites (illustrated, few frames) ------------------
  { key: 'char.hero', path: 'assets/sprites/hero.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0x3f6fb0, label: 'Sam', kind: 'sprite' },
  { key: 'char.leaf', path: 'assets/sprites/leaf.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0x6ab04c, label: 'Leaf', kind: 'sprite' },
  { key: 'npc.elder-morel', path: 'assets/sprites/elder-morel.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0x9b6b3f, label: 'Elder', kind: 'sprite' },
  { key: 'npc.rustle', path: 'assets/sprites/rustle.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0x6ab04c, label: 'Rustle', kind: 'sprite' },
  { key: 'npc.fen', path: 'assets/sprites/fen.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0xd4a017, label: 'Fen', kind: 'sprite' },
  { key: 'npc.boletta', path: 'assets/sprites/boletta.png', width: TILE_SIZE, height: TILE_SIZE * 1.5, color: 0xc86b8a, label: 'Boletta', kind: 'sprite' },

  // Interactable props placed on the map (crafting station).
  { key: 'prop.crafting-stump', path: 'assets/sprites/crafting-stump.png', width: TILE_SIZE, height: TILE_SIZE, color: PALETTE.soil, label: 'Stump', kind: 'sprite' },
];

export const ASSETS_BY_KEY: Record<string, AssetEntry> = Object.fromEntries(
  ASSETS.map((a) => [a.key, a]),
);
