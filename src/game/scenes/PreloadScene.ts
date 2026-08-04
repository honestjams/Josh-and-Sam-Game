import * as Phaser from 'phaser';
import { SceneKeys, PALETTE, DESIGN_WIDTH, DESIGN_HEIGHT } from '@/game/config';
import { ASSETS, type AssetEntry } from '@/game/assets/manifest';

/** Convert a Phaser hex int color to a CSS `#rrggbb` string. */
function hexColor(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

/**
 * PreloadScene: the swappable loader.
 *
 * For each manifest entry we attempt to load the real file from its `path`.
 * If the file is missing (loaderror), we generate a clearly-labelled
 * placeholder texture of the exact expected dimensions in its place. Dropping
 * a real PNG at the documented path is therefore all it takes to replace
 * placeholder art — no code changes. The map JSON always loads.
 */
export class PreloadScene extends Phaser.Scene {
  private missing = new Set<string>();

  constructor() {
    super(SceneKeys.Preload);
  }

  preload(): void {
    this.drawLoadingBar();

    // The hand-made Tiled map (object layers for collision + triggers).
    this.load.tilemapTiledJSON('map.mycelia-hollow', 'assets/maps/mycelia-hollow.tmj');

    // Track which real files are absent so we can substitute placeholders.
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      this.missing.add(file.key);
    });

    for (const asset of ASSETS) {
      this.load.image(asset.key, asset.path);
    }
  }

  create(): void {
    for (const asset of ASSETS) {
      if (this.missing.has(asset.key) || !this.textures.exists(asset.key)) {
        this.generatePlaceholder(asset);
      }
    }
    this.scene.start(SceneKeys.Title);
  }

  /**
   * Draw a labelled placeholder block at the asset's authored dimensions,
   * using a Canvas texture. We build the texture directly on a 2D context so
   * the label bakes in reliably, and we drop any broken texture key left
   * behind by the failed image load first (otherwise the key is taken).
   */
  private generatePlaceholder(asset: AssetEntry): void {
    const { key, width, height, color, label, kind } = asset;
    if (this.textures.exists(key)) this.textures.remove(key);

    const canvas = this.textures.createCanvas(key, width, height);
    if (!canvas) return;
    const ctx = canvas.getContext();

    ctx.fillStyle = hexColor(color);
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = hexColor(PALETTE.cream);
    ctx.lineWidth = kind === 'background' ? 6 : 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);

    ctx.fillStyle = '#2b2016';
    ctx.font = `${kind === 'background' ? 22 : 9}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, width / 2, height / 2, width - 8);

    canvas.refresh();
  }

  private drawLoadingBar(): void {
    const cx = DESIGN_WIDTH / 2;
    const cy = DESIGN_HEIGHT / 2;
    this.add
      .text(cx, cy - 40, 'Mycelia Hollow', {
        fontFamily: 'Georgia, serif',
        fontSize: '28px',
        color: '#f0c674',
      })
      .setOrigin(0.5);

    const barWidth = 320;
    const border = this.add.graphics();
    border.lineStyle(2, PALETTE.amberGlow, 1);
    border.strokeRect(cx - barWidth / 2, cy, barWidth, 18);

    const fill = this.add.graphics();
    this.load.on(Phaser.Loader.Events.PROGRESS, (p: number) => {
      fill.clear();
      fill.fillStyle(PALETTE.amber, 1);
      fill.fillRect(cx - barWidth / 2 + 2, cy + 2, (barWidth - 4) * p, 14);
    });
  }
}
