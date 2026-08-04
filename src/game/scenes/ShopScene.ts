import * as Phaser from 'phaser';
import { SceneKeys, DESIGN_WIDTH, DESIGN_HEIGHT, PALETTE } from '@/game/config';
import { ITEMS, SHOPS } from '@/data';
import type { Id } from '@/data/types';
import { gameStore } from '@/core/store/GameStore';
import { eventBus } from '@/core/events/EventBus';

type Mode = 'buy' | 'sell';

interface ShopSceneData {
  shopId: string;
}

/**
 * Buy/sell shop against the gold economy. Stock is defined per shop in data
 * (`SHOPS`); sell prices derive from item value × the shop's buy-back rate.
 * Key items can't be sold.
 */
export class ShopScene extends Phaser.Scene {
  private shopId!: string;
  private mode: Mode = 'buy';
  private index = 0;
  private rows: Phaser.GameObjects.Text[] = [];
  private goldText!: Phaser.GameObjects.Text;
  private tabText!: Phaser.GameObjects.Text;
  private choices: Id[] = [];

  constructor() {
    super(SceneKeys.Shop);
  }

  create(data: ShopSceneData): void {
    this.shopId = data.shopId;
    const shop = SHOPS[this.shopId];

    const g = this.add.graphics();
    g.fillStyle(PALETTE.night, 0.88);
    g.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    g.fillStyle(PALETTE.ink, 0.96);
    g.fillRoundedRect(60, 40, DESIGN_WIDTH - 120, DESIGN_HEIGHT - 80, 14);
    g.lineStyle(3, PALETTE.amber, 1);
    g.strokeRoundedRect(60, 40, DESIGN_WIDTH - 120, DESIGN_HEIGHT - 80, 14);

    this.add.text(84, 58, shop?.name ?? 'Shop', { fontFamily: 'Georgia, serif', fontSize: '22px', color: '#f0c674' });
    this.goldText = this.add.text(DESIGN_WIDTH - 96, 62, '', { fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#f0c674' }).setOrigin(1, 0);
    this.tabText = this.add.text(84, 96, '', { fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: '#f5e9d0' });
    this.add.text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 58, 'Space buy/sell · Tab or ←→ switch · Esc close', {
      fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#9b8a6f',
    }).setOrigin(0.5);

    this.bindInput();
    this.render();
  }

  private bindInput(): void {
    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-W', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    kb.on('keydown-S', () => this.move(1));
    kb.on('keydown-LEFT', () => this.toggleMode());
    kb.on('keydown-A', () => this.toggleMode());
    kb.on('keydown-RIGHT', () => this.toggleMode());
    kb.on('keydown-D', () => this.toggleMode());
    kb.on('keydown-TAB', () => this.toggleMode());
    kb.on('keydown-SPACE', () => this.act());
    kb.on('keydown-ENTER', () => this.act());
    kb.on('keydown-ESC', () => this.close());
  }

  private toggleMode(): void {
    this.mode = this.mode === 'buy' ? 'sell' : 'buy';
    this.index = 0;
    this.render();
  }

  private move(delta: number): void {
    if (this.rows.length === 0) return;
    this.index = (this.index + delta + this.rows.length) % this.rows.length;
    this.paint();
  }

  private buyPrice(itemId: Id): number {
    const shop = SHOPS[this.shopId]!;
    const entry = shop.stock.find((s) => s.itemId === itemId);
    return entry?.price ?? ITEMS[itemId]!.value;
  }

  private sellPrice(itemId: Id): number {
    const shop = SHOPS[this.shopId]!;
    return Math.max(1, Math.floor(ITEMS[itemId]!.value * shop.buyBackRate));
  }

  private render(): void {
    this.rows.forEach((r) => r.destroy());
    this.rows = [];
    this.goldText.setText(`Gold: ${gameStore.gold}`);
    this.tabText.setText(this.mode === 'buy' ? '[ BUY ]   sell' : ' buy   [ SELL ]');

    if (this.mode === 'buy') {
      this.choices = SHOPS[this.shopId]!.stock.map((s) => s.itemId);
      this.choices.forEach((id) => {
        const item = ITEMS[id]!;
        const price = this.buyPrice(id);
        const afford = gameStore.gold >= price;
        this.addRow(`${item.name}  —  ${price}g   ${item.description}`, afford, id);
      });
    } else {
      // Sell: everything but key items.
      this.choices = gameStore.inventory.filter((s) => ITEMS[s.itemId]?.category !== 'key').map((s) => s.itemId);
      if (this.choices.length === 0) this.addRow('(nothing to sell)', false);
      this.choices.forEach((id) => {
        const item = ITEMS[id]!;
        this.addRow(`${item.name} x${gameStore.itemCount(id)}  —  ${this.sellPrice(id)}g each`, true, id);
      });
    }
    this.paint();
  }

  private addRow(text: string, enabled: boolean, refId?: Id): void {
    const t = this.add.text(84, 136 + this.rows.length * 28, text, {
      fontFamily: 'system-ui, sans-serif', fontSize: '15px',
      color: enabled ? '#f5e9d0' : '#8a7f6a',
      wordWrap: { width: DESIGN_WIDTH - 200 },
    });
    t.setData('enabled', enabled);
    t.setData('refId', refId ?? '');
    if (enabled) {
      t.setInteractive({ useHandCursor: true });
      t.on('pointerover', () => { this.index = this.rows.indexOf(t); this.paint(); });
      t.on('pointerdown', () => { this.index = this.rows.indexOf(t); this.act(); });
    }
    this.rows.push(t);
  }

  private paint(): void {
    this.rows.forEach((t, i) => {
      const sel = i === this.index;
      const enabled = t.getData('enabled') as boolean;
      t.setColor(sel ? '#f0c674' : enabled ? '#f5e9d0' : '#8a7f6a');
      t.setX(sel ? 92 : 84);
    });
  }

  private act(): void {
    const row = this.rows[this.index];
    if (!row || !row.getData('enabled')) return;
    const id = row.getData('refId') as Id;
    if (this.mode === 'buy') this.buy(id);
    else this.sell(id);
  }

  private buy(itemId: Id): void {
    const price = this.buyPrice(itemId);
    if (!gameStore.spendGold(price)) {
      eventBus.emit('toast', { message: 'Not enough gold.' });
      return;
    }
    gameStore.addItem(itemId, 1);
    eventBus.emit('toast', { message: `Bought ${ITEMS[itemId]!.name}.` });
    this.render();
  }

  private sell(itemId: Id): void {
    if (!gameStore.removeItem(itemId, 1)) return;
    gameStore.addGold(this.sellPrice(itemId));
    eventBus.emit('toast', { message: `Sold ${ITEMS[itemId]!.name}.` });
    this.render();
  }

  private close(): void {
    eventBus.emit('shop:close', {});
    this.scene.stop();
  }
}
