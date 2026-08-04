import * as Phaser from 'phaser';
import { SceneKeys } from '@/game/config';

/**
 * BootScene: minimal, synchronous setup before the (heavier) preload. Kept
 * separate so global config, input, or scale tweaks have a home that runs
 * before any assets load.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Boot);
  }

  create(): void {
    this.scene.start(SceneKeys.Preload);
  }
}
