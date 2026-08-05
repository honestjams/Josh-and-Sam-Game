import * as Phaser from 'phaser';
import { SceneKeys, DESIGN_WIDTH, DESIGN_HEIGHT, PALETTE } from '@/game/config';
import { gameStore } from '@/core/store/GameStore';
import { saveService, audioService } from '@/core/services';
import { DEFAULT_SLOT } from '@/core/save/SaveService';

/**
 * Title screen: New Game always available; Continue is enabled only when a
 * save exists and loads it from localStorage via the SaveService.
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SceneKeys.Title);
  }

  async create(): Promise<void> {
    // Unlock the AudioContext on the first user gesture, then start title music.
    const startAudio = () => { audioService.init(); audioService.playMusic('title'); };
    this.input.once('pointerdown', startAudio);
    this.input.keyboard?.once('keydown', startAudio);

    this.add.image(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, 'bg.title');

    this.add
      .text(DESIGN_WIDTH / 2, 150, 'Mycelia Hollow', {
        fontFamily: 'Georgia, serif',
        fontSize: '52px',
        color: '#f0c674',
      })
      .setOrigin(0.5);
    this.add
      .text(DESIGN_WIDTH / 2, 200, 'A Cozy Fungal Adventure', {
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        color: '#f5e9d0',
      })
      .setOrigin(0.5);

    const hasSave = await saveService.hasAny();

    this.makeButton(DESIGN_HEIGHT / 2 + 40, 'New Game', () => this.startNewGame());
    this.makeButton(DESIGN_HEIGHT / 2 + 100, 'Continue', () => this.continueGame(), hasSave);

    this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 30, 'Vertical slice · placeholder art', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#9b8a6f',
      })
      .setOrigin(0.5);
  }

  private makeButton(y: number, label: string, onClick: () => void, enabled = true): void {
    const color = enabled ? '#f5e9d0' : '#6b5f4a';
    const btn = this.add
      .text(DESIGN_WIDTH / 2, y, label, {
        fontFamily: 'Georgia, serif',
        fontSize: '26px',
        color,
        backgroundColor: enabled ? '#35502c' : '#241d14',
        padding: { x: 24, y: 10 },
      })
      .setOrigin(0.5);

    if (!enabled) return;

    btn.setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setColor('#f0c674'));
    btn.on('pointerout', () => btn.setColor(color));
    btn.on('pointerdown', onClick);
  }

  private startNewGame(): void {
    // Hero identity is chosen on the next screen (which calls gameStore.newGame).
    this.cameras.main.fadeOut(250, PALETTE.night >> 16, (PALETTE.night >> 8) & 0xff, PALETTE.night & 0xff);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SceneKeys.CharacterSelect);
    });
  }

  private async continueGame(): Promise<void> {
    const blob = await saveService.load(DEFAULT_SLOT);
    if (!blob) {
      this.startNewGame();
      return;
    }
    gameStore.loadBlob(blob);
    this.scene.start(SceneKeys.Overworld);
  }
}
