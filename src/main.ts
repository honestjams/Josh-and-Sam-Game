import * as Phaser from 'phaser';
import { DESIGN_WIDTH, DESIGN_HEIGHT, PALETTE } from '@/game/config';
import { BootScene } from '@/game/scenes/BootScene';
import { PreloadScene } from '@/game/scenes/PreloadScene';
import { TitleScene } from '@/game/scenes/TitleScene';
import { OverworldScene } from '@/game/scenes/OverworldScene';
import { DialogueScene } from '@/game/scenes/DialogueScene';

/**
 * Entry point. One fixed design resolution scaled to fit the viewport
 * (Scale.FIT) so painted art is only ever downscaled. Scenes not yet built
 * (Battle, Menu/Crafting, Shop) are tracked in ROADMAP.md and register here
 * as they land.
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-root',
  width: DESIGN_WIDTH,
  height: DESIGN_HEIGHT,
  backgroundColor: `#${PALETTE.night.toString(16).padStart(6, '0')}`,
  pixelArt: false,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, PreloadScene, TitleScene, OverworldScene, DialogueScene],
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
