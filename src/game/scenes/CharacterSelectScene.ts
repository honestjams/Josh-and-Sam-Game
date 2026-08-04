import * as Phaser from 'phaser';
import { SceneKeys, DESIGN_WIDTH, DESIGN_HEIGHT, PALETTE } from '@/game/config';
import { CHARACTERS } from '@/data';
import { SELECTABLE_HERO_IDS } from '@/data/party';
import { gameStore } from '@/core/store/GameStore';

/**
 * New Game character select. The player picks one of the three heroes; the two
 * they don't choose are seeded as recruit quests (see GameStore.newGame) and
 * met later in the story. Portrait art loads through the manifest, so real
 * illustrations drop in by file at `assets/portraits/*`.
 */
export class CharacterSelectScene extends Phaser.Scene {
  private selected = 0;
  private cards: Phaser.GameObjects.Container[] = [];

  constructor() {
    super(SceneKeys.CharacterSelect);
  }

  create(): void {
    this.add.image(DESIGN_WIDTH / 2, DESIGN_HEIGHT / 2, 'bg.title').setAlpha(0.5);
    this.add
      .text(DESIGN_WIDTH / 2, 48, 'Choose Your Hero', {
        fontFamily: 'Georgia, serif',
        fontSize: '34px',
        color: '#f0c674',
      })
      .setOrigin(0.5);
    this.add
      .text(DESIGN_WIDTH / 2, 84, "You'll meet the other two on your journey and they can join your party.", {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#f5e9d0',
      })
      .setOrigin(0.5);

    const cardW = 260;
    const gap = 30;
    const totalW = SELECTABLE_HERO_IDS.length * cardW + (SELECTABLE_HERO_IDS.length - 1) * gap;
    const startX = (DESIGN_WIDTH - totalW) / 2 + cardW / 2;

    SELECTABLE_HERO_IDS.forEach((id, i) => {
      const card = this.buildCard(id, startX + i * (cardW + gap), 300, cardW);
      card.setData('index', i);
      card.setData('heroId', id);
      this.cards.push(card);
    });

    this.bindInput();
    this.highlight();
  }

  private buildCard(id: string, x: number, y: number, w: number): Phaser.GameObjects.Container {
    const def = CHARACTERS[id]!;
    const h = 300;
    const container = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(PALETTE.ink, 0.9);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
    container.add(bg);
    container.setData('bg', bg);

    const portraitKey = `portrait.${id.split('.')[1]}`;
    const portrait = this.add
      .image(0, -h / 2 + 84, this.textures.exists(portraitKey) ? portraitKey : def.spriteKey)
      .setDisplaySize(120, 120);
    container.add(portrait);

    container.add(
      this.add.text(0, -h / 2 + 158, def.name, { fontFamily: 'Georgia, serif', fontSize: '19px', color: '#f0c674' }).setOrigin(0.5),
    );
    container.add(
      this.add.text(0, -h / 2 + 182, `Role: ${def.role}`, { fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#9bbf7a' }).setOrigin(0.5),
    );
    container.add(
      this.add
        .text(0, -h / 2 + 210, def.blurb, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: '#f5e9d0',
          align: 'center',
          wordWrap: { width: w - 28 },
        })
        .setOrigin(0.5, 0),
    );

    // Whole card is clickable.
    bg.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
    bg.on('pointerover', () => {
      this.selected = container.getData('index') as number;
      this.highlight();
    });
    bg.on('pointerdown', () => {
      this.selected = container.getData('index') as number;
      this.confirm();
    });
    return container;
  }

  private bindInput(): void {
    const kb = this.input.keyboard!;
    kb.on('keydown-LEFT', () => this.move(-1));
    kb.on('keydown-A', () => this.move(-1));
    kb.on('keydown-RIGHT', () => this.move(1));
    kb.on('keydown-D', () => this.move(1));
    kb.on('keydown-SPACE', () => this.confirm());
    kb.on('keydown-ENTER', () => this.confirm());
  }

  private move(delta: number): void {
    const n = this.cards.length;
    this.selected = (this.selected + delta + n) % n;
    this.highlight();
  }

  private highlight(): void {
    this.cards.forEach((card, i) => {
      const bg = card.getData('bg') as Phaser.GameObjects.Graphics;
      const w = 260;
      const h = 300;
      bg.clear();
      bg.fillStyle(PALETTE.ink, i === this.selected ? 0.96 : 0.82);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 14);
      bg.lineStyle(i === this.selected ? 4 : 2, i === this.selected ? PALETTE.amber : PALETTE.mossDark, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 14);
      card.setScale(i === this.selected ? 1.03 : 1);
    });
  }

  private confirm(): void {
    const heroId = this.cards[this.selected]!.getData('heroId') as string;
    gameStore.newGame(heroId);
    this.cameras.main.fadeOut(250, PALETTE.night >> 16, (PALETTE.night >> 8) & 0xff, PALETTE.night & 0xff);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SceneKeys.Overworld);
    });
  }
}
