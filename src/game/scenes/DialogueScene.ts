import * as Phaser from 'phaser';
import { SceneKeys, DESIGN_WIDTH, DESIGN_HEIGHT, PALETTE } from '@/game/config';
import { DIALOGUE } from '@/data';
import { gameStore } from '@/core/store/GameStore';
import { DialogueRunner, type DialogueView } from '@/core/dialogue/DialogueRunner';
import { eventBus } from '@/core/events/EventBus';

interface DialogueSceneData {
  dialogueId: string;
}

/**
 * DialogueScene runs as a transparent overlay above the overworld. It is a
 * thin renderer over DialogueRunner: it draws the box, speaker, text, and any
 * choices, and forwards input. All branching/consequence logic lives in the
 * runner. Emits `dialogue:end` and drains side effects (e.g. `shop:open`).
 */
export class DialogueScene extends Phaser.Scene {
  private runner!: DialogueRunner;
  private dialogueId!: string;
  private boxText!: Phaser.GameObjects.Text;
  private speakerText!: Phaser.GameObjects.Text;
  private choiceTexts: Phaser.GameObjects.Text[] = [];
  private selected = 0;
  private view: DialogueView | null = null;

  constructor() {
    super(SceneKeys.Dialogue);
  }

  create(data: DialogueSceneData): void {
    this.dialogueId = data.dialogueId;
    const tree = DIALOGUE[data.dialogueId];
    if (!tree) {
      this.close();
      return;
    }
    this.runner = new DialogueRunner(tree, gameStore);

    this.drawBox();
    this.bindInput();

    this.view = this.runner.start();
    this.render();
  }

  private drawBox(): void {
    const boxH = 150;
    const boxY = DESIGN_HEIGHT - boxH - 16;
    const g = this.add.graphics();
    g.fillStyle(PALETTE.ink, 0.92);
    g.fillRoundedRect(16, boxY, DESIGN_WIDTH - 32, boxH, 12);
    g.lineStyle(3, PALETTE.amber, 1);
    g.strokeRoundedRect(16, boxY, DESIGN_WIDTH - 32, boxH, 12);

    this.speakerText = this.add.text(36, boxY + 12, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#f0c674',
    });
    this.boxText = this.add.text(36, boxY + 42, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '17px',
      color: '#f5e9d0',
      wordWrap: { width: DESIGN_WIDTH - 80 },
      lineSpacing: 4,
    });
  }

  private bindInput(): void {
    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => this.moveSelection(-1));
    kb.on('keydown-DOWN', () => this.moveSelection(1));
    kb.on('keydown-W', () => this.moveSelection(-1));
    kb.on('keydown-S', () => this.moveSelection(1));
    kb.on('keydown-SPACE', () => this.confirm());
    kb.on('keydown-ENTER', () => this.confirm());
    kb.on('keydown-ESC', () => this.close());
  }

  private render(): void {
    this.choiceTexts.forEach((t) => t.destroy());
    this.choiceTexts = [];
    this.selected = 0;

    if (!this.view) {
      this.close();
      return;
    }

    this.speakerText.setText(this.view.speaker);
    this.boxText.setText(this.view.text);

    if (this.view.choices.length > 0) {
      const startY = DESIGN_HEIGHT - 90;
      this.view.choices.forEach((choice, i) => {
        const t = this.add
          .text(DESIGN_WIDTH - 340, startY + i * 26, choice.label, {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '16px',
            color: '#f5e9d0',
          })
          .setInteractive({ useHandCursor: true });
        t.on('pointerover', () => {
          this.selected = i;
          this.highlight();
        });
        t.on('pointerdown', () => {
          this.selected = i;
          this.confirm();
        });
        this.choiceTexts.push(t);
      });
      this.highlight();
    } else {
      // No choices: show a prompt to advance.
      const t = this.add.text(DESIGN_WIDTH - 200, DESIGN_HEIGHT - 44, '▸ space', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        color: '#9b8a6f',
      });
      this.choiceTexts.push(t);
    }
  }

  private moveSelection(delta: number): void {
    if (!this.view || this.view.choices.length === 0) return;
    const n = this.view.choices.length;
    this.selected = (this.selected + delta + n) % n;
    this.highlight();
  }

  private highlight(): void {
    if (!this.view || this.view.choices.length === 0) return;
    this.choiceTexts.forEach((t, i) => {
      const isSel = i === this.selected;
      t.setColor(isSel ? '#f0c674' : '#f5e9d0');
      t.setText(`${isSel ? '▸ ' : '  '}${this.view!.choices[i]!.label}`);
    });
  }

  private confirm(): void {
    if (!this.view) {
      this.close();
      return;
    }
    if (this.view.choices.length > 0) {
      const choice = this.view.choices[this.selected]!;
      this.view = this.runner.choose(choice.index);
    } else {
      this.view = this.runner.advance();
    }
    this.render();
  }

  private close(): void {
    // Surface any side effects the runner collected (e.g. open a shop).
    for (const effect of this.runner?.sideEffects ?? []) {
      if (effect.openShop) eventBus.emit('shop:open', { shopId: effect.openShop });
    }
    eventBus.emit('dialogue:end', { dialogueId: this.dialogueId });
    this.scene.stop();
  }
}
