/**
 * Global game configuration constants. One fixed design resolution, scaled to
 * fit the viewport (see main.ts Scale.FIT). Painted assets are authored at or
 * above this size and downscaled — never upscaled.
 */
export const DESIGN_WIDTH = 960;
export const DESIGN_HEIGHT = 540;

/** Logical movement grid. Collision/interaction use this; visuals are painterly. */
export const TILE_SIZE = 32;

/** Cozy palette (hex ints for Phaser). Warm ambers, mossy greens, soft browns. */
export const PALETTE = {
  night: 0x1a140d,
  amber: 0xd4a017,
  amberGlow: 0xf0c674,
  moss: 0x4f7942,
  mossDark: 0x35502c,
  soil: 0x6b4f3a,
  cream: 0xf5e9d0,
  ink: 0x2b2016,
  water: 0x4a7a8c,
} as const;

export const SceneKeys = {
  Boot: 'BootScene',
  Preload: 'PreloadScene',
  Title: 'TitleScene',
  CharacterSelect: 'CharacterSelectScene',
  Overworld: 'OverworldScene',
  Dialogue: 'DialogueScene',
  Battle: 'BattleScene',
  Menu: 'MenuScene',
  Shop: 'ShopScene',
} as const;
