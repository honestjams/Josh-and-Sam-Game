import * as Phaser from 'phaser';
import { SceneKeys, DESIGN_WIDTH, DESIGN_HEIGHT, PALETTE } from '@/game/config';
import { CHARACTERS, ITEMS, RECIPES } from '@/data';
import type { Id } from '@/data/types';
import { gameStore } from '@/core/store/GameStore';
import { eventBus } from '@/core/events/EventBus';
import { craft, canCraft } from '@/core/crafting/crafting';
import { statsForCharacter } from '@/core/combat/party';

type Tab = 'inventory' | 'party' | 'crafting';
const TABS: Tab[] = ['inventory', 'party', 'crafting'];

interface MenuSceneData {
  tab?: Tab;
}

/**
 * Pause-menu overlay: Inventory (use consumables), Party (stats/level), and
 * Crafting (brew recipes at the station). All content is data-driven and all
 * mutation goes through the GameStore / crafting module.
 */
export class MenuScene extends Phaser.Scene {
  private tab: Tab = 'inventory';
  private index = 0;
  private rows: Phaser.GameObjects.Text[] = [];
  private tabTexts: Phaser.GameObjects.Text[] = [];
  private hint!: Phaser.GameObjects.Text;
  private title!: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKeys.Menu);
  }

  create(data: MenuSceneData): void {
    this.tab = data.tab ?? 'inventory';

    const g = this.add.graphics();
    g.fillStyle(PALETTE.night, 0.86);
    g.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    g.fillStyle(PALETTE.ink, 0.96);
    g.fillRoundedRect(60, 40, DESIGN_WIDTH - 120, DESIGN_HEIGHT - 80, 14);
    g.lineStyle(3, PALETTE.amber, 1);
    g.strokeRoundedRect(60, 40, DESIGN_WIDTH - 120, DESIGN_HEIGHT - 80, 14);

    this.title = this.add.text(84, 58, '', { fontFamily: 'Georgia, serif', fontSize: '22px', color: '#f0c674' });

    TABS.forEach((t, i) => {
      const tx = this.add
        .text(84 + i * 150, 96, t[0]!.toUpperCase() + t.slice(1), {
          fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#f5e9d0',
          backgroundColor: '#241d14', padding: { x: 10, y: 4 },
        })
        .setInteractive({ useHandCursor: true });
      tx.on('pointerdown', () => { this.tab = t; this.index = 0; this.render(); });
      this.tabTexts.push(tx);
    });

    this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 60, 'Gold: ', { fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#f0c674' })
      .setOrigin(0.5)
      .setName('goldline');

    this.hint = this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 58, '', { fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#9b8a6f' })
      .setOrigin(0.5);

    this.bindInput();
    this.render();
  }

  private bindInput(): void {
    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => this.move(-1));
    kb.on('keydown-W', () => this.move(-1));
    kb.on('keydown-DOWN', () => this.move(1));
    kb.on('keydown-S', () => this.move(1));
    kb.on('keydown-LEFT', () => this.switchTab(-1));
    kb.on('keydown-A', () => this.switchTab(-1));
    kb.on('keydown-RIGHT', () => this.switchTab(1));
    kb.on('keydown-D', () => this.switchTab(1));
    kb.on('keydown-SPACE', () => this.act());
    kb.on('keydown-ENTER', () => this.act());
    kb.on('keydown-ESC', () => this.close());
    kb.on('keydown-M', () => this.close());
    kb.on('keydown-I', () => this.close());
  }

  private switchTab(delta: number): void {
    const i = (TABS.indexOf(this.tab) + delta + TABS.length) % TABS.length;
    this.tab = TABS[i]!;
    this.index = 0;
    this.render();
  }

  private move(delta: number): void {
    const n = this.rows.length;
    if (n === 0) return;
    this.index = (this.index + delta + n) % n;
    this.paint();
  }

  private render(): void {
    this.rows.forEach((r) => r.destroy());
    this.rows = [];
    this.title.setText(this.tab[0]!.toUpperCase() + this.tab.slice(1));
    this.tabTexts.forEach((t) => t.setColor(t.text.toLowerCase() === this.tab ? '#f0c674' : '#f5e9d0'));

    if (this.tab === 'inventory') this.renderInventory();
    else if (this.tab === 'party') this.renderParty();
    else this.renderCrafting();

    this.updateGold();
    this.paint();
  }

  private renderInventory(): void {
    const items = gameStore.inventory;
    if (items.length === 0) this.addRow('(empty)', false);
    items.forEach((stack) => {
      const def = ITEMS[stack.itemId]!;
      const usable = !!def.consumable;
      this.addRow(`${def.name}  x${stack.qty}${usable ? '   [use]' : ''}`, usable, stack.itemId);
    });
    this.hint.setText('Use consumables on your leader · ←→ tabs · Esc close');
  }

  private renderParty(): void {
    gameStore.roster.forEach((save) => {
      const def = CHARACTERS[save.id]!;
      const stats = statsForCharacter(save.id, save.level);
      const active = gameStore.activeParty.includes(save.id) ? '★ ' : '  ';
      this.addRow(
        `${active}${def.name}  Lv.${save.level}  HP ${save.currentHp}/${stats.maxHp}  MP ${save.currentMp}/${stats.maxMp}  (${def.role})`,
        false,
      );
    });
    this.hint.setText('★ = active party · ←→ tabs · Esc close');
  }

  private renderCrafting(): void {
    Object.values(RECIPES).forEach((recipe) => {
      const ok = canCraft(gameStore, recipe);
      const ingredients = recipe.inputs
        .map((i) => `${ITEMS[i.itemId]!.name} x${i.qty} (${gameStore.itemCount(i.itemId)})`)
        .join(', ');
      this.addRow(`${recipe.name} → ${ITEMS[recipe.output.itemId]!.name}   [${ingredients}]`, ok, recipe.id);
    });
    this.hint.setText('Brew with ingredients you hold · ←→ tabs · Esc close');
  }

  private addRow(text: string, enabled: boolean, refId?: Id): void {
    const t = this.add.text(84, 140 + this.rows.length * 28, text, {
      fontFamily: 'system-ui, sans-serif', fontSize: '15px',
      color: enabled ? '#f5e9d0' : '#8a7f6a',
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
    const refId = row.getData('refId') as Id;

    if (this.tab === 'inventory') this.useItem(refId);
    else if (this.tab === 'crafting') this.craftRecipe(refId);
  }

  private useItem(itemId: Id): void {
    const def = ITEMS[itemId];
    if (!def?.consumable) return;
    const leaderId = gameStore.activeParty[0];
    const save = gameStore.roster.find((r) => r.id === leaderId);
    if (!save) return;
    const stats = statsForCharacter(save.id, save.level);
    const eff = def.consumable;
    if (eff.kind === 'heal-hp') save.currentHp = Math.min(stats.maxHp, save.currentHp + eff.amount);
    else if (eff.kind === 'heal-mp') save.currentMp = Math.min(stats.maxMp, save.currentMp + eff.amount);
    gameStore.removeItem(itemId, 1);
    eventBus.emit('toast', { message: `Used ${def.name}.` });
    this.render();
  }

  private craftRecipe(recipeId: Id): void {
    if (craft(gameStore, recipeId)) {
      const out = RECIPES[recipeId]!.output;
      eventBus.emit('toast', { message: `Brewed ${ITEMS[out.itemId]!.name}!` });
    }
    this.render();
  }

  private updateGold(): void {
    const gold = this.children.getByName('goldline') as Phaser.GameObjects.Text | null;
    gold?.setText(`Gold: ${gameStore.gold}`);
  }

  private close(): void {
    eventBus.emit('menu:close', {});
    this.scene.stop();
  }
}
