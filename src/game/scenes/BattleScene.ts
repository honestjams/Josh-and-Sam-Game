import * as Phaser from 'phaser';
import { SceneKeys, DESIGN_WIDTH, DESIGN_HEIGHT, PALETTE } from '@/game/config';
import { getMap } from '@/game/maps/registry';
import { CHARACTERS, ENEMIES, ITEMS, SKILLS } from '@/data';
import type { Id, SkillDefinition } from '@/data/types';
import { gameStore } from '@/core/store/GameStore';
import { eventBus } from '@/core/events/EventBus';
import { audioService } from '@/core/services';
import {
  type Combatant,
  turnOrder,
  basicAttackDamage,
  skillDamage,
  chooseEnemyAction,
} from '@/core/combat/resolver';
import {
  combatantFromSave,
  combatantFromEnemy,
  enemyDefId,
  grantXp,
  statsForCharacter,
} from '@/core/combat/party';

interface BattleSceneData {
  enemyIds: Id[];
  isMiniboss?: boolean;
  /** Flag set on victory (e.g. to mark a miniboss defeated). */
  victoryFlag?: string;
}

type Phase = 'intro' | 'menu' | 'target' | 'skill' | 'item' | 'resolving' | 'done';

/**
 * Menu-driven, turn-based battle (Attack / Skill / Item / Defend / Flee).
 * Turn order is by speed each round — one action per turn — using the pure
 * combat resolver. Enemy behaviour is data-driven (`EnemyDefinition.ai`).
 * On victory it grants XP/gold/drops and writes results back to the store.
 */
export class BattleScene extends Phaser.Scene {
  private battleData!: BattleSceneData;
  private party: Combatant[] = [];
  private enemies: Combatant[] = [];
  private queue: Combatant[] = [];
  private queueIndex = 0;
  private phase: Phase = 'intro';
  private defending = new Set<string>();

  private actor: Combatant | null = null;
  private menuIndex = 0;
  private subIndex = 0;
  private targetIndex = 0;
  private pendingSkill: SkillDefinition | null = null;

  private sprites = new Map<string, Phaser.GameObjects.Container>();
  private message!: Phaser.GameObjects.Text;
  private menuGroup: Phaser.GameObjects.Text[] = [];

  private readonly actions = ['Attack', 'Skill', 'Item', 'Defend', 'Flee'];

  constructor() {
    super(SceneKeys.Battle);
  }

  create(data: BattleSceneData): void {
    this.battleData = data;
    this.cameras.main.setBackgroundColor('#120d08');
    // Area-themed backdrop, dimmed for readability (FF/Pokémon feel).
    const bgKey = getMap(gameStore.position.mapId).backgroundKey;
    if (this.textures.exists(bgKey)) {
      this.add.image(0, 0, bgKey).setOrigin(0, 0).setDisplaySize(DESIGN_WIDTH, DESIGN_HEIGHT).setTint(0x556070).setAlpha(0.55).setDepth(-10);
    }
    this.add.graphics().fillStyle(PALETTE.night, 0.35).fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT).setDepth(-9);
    this.party = gameStore.activeParty
      .map((id) => gameStore.roster.find((r) => r.id === id))
      .filter((s): s is NonNullable<typeof s> => !!s)
      .map(combatantFromSave);
    // Number only duplicates of the same enemy type (per-type slot).
    const typeCounts: Record<string, number> = {};
    this.enemies = data.enemyIds.map((id) => {
      const slot = typeCounts[id] ?? 0;
      typeCounts[id] = slot + 1;
      return combatantFromEnemy(id, slot);
    });

    this.drawScene();
    this.bindInput();
    audioService.playMusic('battle');

    this.setMessage(
      data.isMiniboss ? `${this.enemies[0]?.name} blocks the way!` : 'Enemies appear!',
    );
    this.time.delayedCall(900, () => this.startRound());
  }

  // --- Layout -------------------------------------------------------------

  private drawScene(): void {
    this.add.text(DESIGN_WIDTH / 2, 24, 'BATTLE', {
      fontFamily: 'Georgia, serif', fontSize: '20px', color: '#f0c674',
    }).setOrigin(0.5);

    this.enemies.forEach((e, i) => {
      const x = DESIGN_WIDTH / 2 + (i - (this.enemies.length - 1) / 2) * 150;
      this.sprites.set(e.id, this.makeCombatantView(e, x, 150, true));
    });
    this.party.forEach((p, i) => {
      const x = 150 + i * 200;
      this.sprites.set(p.id, this.makeCombatantView(p, x, 330, false));
    });

    this.message = this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 150, '', {
        fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#f5e9d0',
        backgroundColor: '#1a140dcc', padding: { x: 12, y: 6 }, align: 'center',
        wordWrap: { width: DESIGN_WIDTH - 80 },
      })
      .setOrigin(0.5);
  }

  private makeCombatantView(c: Combatant, x: number, y: number, isEnemy: boolean): Phaser.GameObjects.Container {
    const key = isEnemy ? ENEMIES[enemyDefId(c.id)]?.spriteKey : CHARACTERS[c.id]?.spriteKey;
    const container = this.add.container(x, y);
    const sprite = this.add
      .image(0, 0, this.textures.exists(key ?? '') ? key! : 'char.squirrel')
      .setDisplaySize(isEnemy ? 96 : 72, isEnemy ? 96 : 108);
    container.add(sprite);
    container.setData('sprite', sprite);

    const name = this.add.text(0, isEnemy ? 56 : 62, c.name, {
      fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#f5e9d0',
    }).setOrigin(0.5);
    container.add(name);

    const hp = this.add.text(0, isEnemy ? 72 : 78, '', {
      fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: '#9bbf7a',
    }).setOrigin(0.5);
    container.add(hp);
    container.setData('hp', hp);
    this.refreshBars(c);
    return container;
  }

  private refreshBars(c: Combatant): void {
    const view = this.sprites.get(c.id);
    if (!view) return;
    const hp = view.getData('hp') as Phaser.GameObjects.Text;
    const isEnemy = c.side === 'enemy';
    hp.setText(isEnemy ? `HP ${Math.max(0, c.currentHp)}/${c.stats.maxHp}` : `HP ${Math.max(0, c.currentHp)}/${c.stats.maxHp}  MP ${c.currentMp}/${c.stats.maxMp}`);
    const sprite = view.getData('sprite') as Phaser.GameObjects.Image;
    sprite.setAlpha(c.alive ? 1 : 0.25);
  }

  private setMessage(text: string): void {
    this.message.setText(text);
  }

  // --- Turn flow ----------------------------------------------------------

  private startRound(): void {
    // Recompute order from living combatants at the top of each round.
    this.queue = turnOrder([...this.party, ...this.enemies]);
    this.queueIndex = 0;
    this.nextTurn();
  }

  private nextTurn(): void {
    if (this.checkEnd()) return;
    if (this.queueIndex >= this.queue.length) {
      this.startRound();
      return;
    }
    this.actor = this.queue[this.queueIndex]!;
    if (!this.actor.alive) {
      this.queueIndex += 1;
      this.nextTurn();
      return;
    }
    this.defending.delete(this.actor.id); // defence lasts until this actor acts again
    this.highlightActor();

    if (this.actor.side === 'enemy') {
      this.phase = 'resolving';
      this.time.delayedCall(650, () => this.enemyAct());
    } else {
      this.openActionMenu();
    }
  }

  private advance(): void {
    this.queueIndex += 1;
    this.clearMenu();
    this.time.delayedCall(650, () => this.nextTurn());
  }

  private highlightActor(): void {
    this.sprites.forEach((view, id) => {
      const sprite = view.getData('sprite') as Phaser.GameObjects.Image;
      const c = this.find(id);
      if (c?.alive) sprite.setTint(id === this.actor?.id ? 0xffffff : 0xbfbfbf);
    });
  }

  // --- Player menu --------------------------------------------------------

  private openActionMenu(): void {
    this.phase = 'menu';
    this.menuIndex = 0;
    this.setMessage(`${this.actor!.name}'s turn.`);
    this.renderMenu(this.actions, (i) => this.actions[i]!);
  }

  private renderMenu(items: string[], label: (i: number, sel: boolean) => string, activeIndex = 0): void {
    this.clearMenu();
    const x = DESIGN_WIDTH - 220;
    const y = DESIGN_HEIGHT - 128;
    items.forEach((_, i) => {
      const t = this.add
        .text(x, y + i * 24, '', {
          fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#f5e9d0',
          backgroundColor: '#1a140dcc', padding: { x: 8, y: 2 },
        })
        .setInteractive({ useHandCursor: true });
      t.on('pointerover', () => { this.setActive(i); });
      t.on('pointerdown', () => { this.setActive(i); this.confirm(); });
      this.menuGroup.push(t);
    });
    this.activeIndex = activeIndex;
    this.labelFn = label;
    this.paintMenu();
  }

  private activeIndex = 0;
  private labelFn: (i: number, sel: boolean) => string = (i) => `${i}`;

  private targetCursor?: Phaser.GameObjects.Text;

  private setActive(i: number): void {
    this.activeIndex = i;
    if (this.phase === 'menu') this.menuIndex = i;
    else this.subIndex = i;
    this.paintMenu();
    this.updateTargetCursor();
  }

  /** Bobbing arrow over the currently-selected target. */
  private updateTargetCursor(): void {
    if (this.phase !== 'target' || !this.targetPool[this.activeIndex]) {
      this.targetCursor?.destroy();
      this.targetCursor = undefined;
      return;
    }
    const view = this.sprites.get(this.targetPool[this.activeIndex]!.id);
    if (!view) return;
    if (!this.targetCursor) {
      this.targetCursor = this.add.text(0, 0, '▼', { fontFamily: 'system-ui, sans-serif', fontSize: '24px', color: '#f0c674', stroke: '#1a140d', strokeThickness: 3 }).setOrigin(0.5).setDepth(600);
    }
    this.targetCursor.setPosition(view.x, view.y - 58);
  }

  private paintMenu(): void {
    this.menuGroup.forEach((t, i) => {
      const sel = i === this.activeIndex;
      t.setText(`${sel ? '▸ ' : '  '}${this.labelFn(i, sel)}`);
      t.setColor(sel ? '#f0c674' : '#f5e9d0');
    });
  }

  private clearMenu(): void {
    this.menuGroup.forEach((t) => t.destroy());
    this.menuGroup = [];
    this.targetCursor?.destroy();
    this.targetCursor = undefined;
  }

  private bindInput(): void {
    const kb = this.input.keyboard!;
    kb.on('keydown-UP', () => this.nav(-1));
    kb.on('keydown-W', () => this.nav(-1));
    kb.on('keydown-DOWN', () => this.nav(1));
    kb.on('keydown-S', () => this.nav(1));
    kb.on('keydown-LEFT', () => this.nav(-1));
    kb.on('keydown-A', () => this.nav(-1));
    kb.on('keydown-RIGHT', () => this.nav(1));
    kb.on('keydown-D', () => this.nav(1));
    kb.on('keydown-SPACE', () => this.confirm());
    kb.on('keydown-ENTER', () => this.confirm());
    kb.on('keydown-ESC', () => this.cancel());
  }

  private nav(delta: number): void {
    if (this.menuGroup.length === 0) return;
    const n = this.menuGroup.length;
    this.setActive((this.activeIndex + delta + n) % n);
  }

  private confirm(): void {
    switch (this.phase) {
      case 'menu': return this.chooseAction(this.menuIndex);
      case 'skill': return this.chooseSkill(this.subIndex);
      case 'item': return this.chooseItem(this.subIndex);
      case 'target': return this.chooseTarget(this.targetIndex);
      default: return;
    }
  }

  private cancel(): void {
    if (this.phase === 'skill' || this.phase === 'item' || this.phase === 'target') {
      this.pendingSkill = null;
      this.openActionMenu();
    }
  }

  private chooseAction(index: number): void {
    const action = this.actions[index];
    switch (action) {
      case 'Attack':
        this.pendingSkill = null;
        this.beginTargetSelect();
        break;
      case 'Skill':
        this.openSkillMenu();
        break;
      case 'Item':
        this.openItemMenu();
        break;
      case 'Defend':
        this.defending.add(this.actor!.id);
        this.setMessage(`${this.actor!.name} braces for the next blow.`);
        this.advance();
        break;
      case 'Flee':
        this.attemptFlee();
        break;
    }
  }

  private openSkillMenu(): void {
    const skillIds = CHARACTERS[this.actor!.id]?.skillIds ?? [];
    if (skillIds.length === 0) {
      this.setMessage('No skills known.');
      return;
    }
    this.phase = 'skill';
    this.subIndex = 0;
    this.renderMenu(skillIds, (i) => {
      const s = SKILLS[skillIds[i]!]!;
      const affordable = this.actor!.currentMp >= s.mpCost;
      return `${s.name}  ${s.mpCost}MP${affordable ? '' : ' (low)'}`;
    });
  }

  private chooseSkill(index: number): void {
    const skillIds = CHARACTERS[this.actor!.id]?.skillIds ?? [];
    const skill = SKILLS[skillIds[index]!];
    if (!skill) return;
    if (this.actor!.currentMp < skill.mpCost) {
      this.setMessage('Not enough MP.');
      return;
    }
    this.pendingSkill = skill;
    if (skill.target === 'single-enemy') this.beginTargetSelect();
    else if (skill.target === 'single-ally') this.beginTargetSelect(true);
    else this.applySkill(skill, this.groupTargets(skill));
  }

  private openItemMenu(): void {
    const consumables = gameStore.inventory.filter((s) => ITEMS[s.itemId]?.consumable);
    if (consumables.length === 0) {
      this.setMessage('No usable items.');
      return;
    }
    this.phase = 'item';
    this.subIndex = 0;
    this.renderMenu(
      consumables.map((s) => s.itemId),
      (i) => `${ITEMS[consumables[i]!.itemId]!.name} x${consumables[i]!.qty}`,
    );
    this.itemChoices = consumables.map((s) => s.itemId);
  }

  private itemChoices: Id[] = [];

  private chooseItem(index: number): void {
    const itemId = this.itemChoices[index];
    const item = itemId ? ITEMS[itemId] : undefined;
    if (!item?.consumable) return;
    const eff = item.consumable;
    if (eff.kind === 'heal-hp') {
      this.actor!.currentHp = Math.min(this.actor!.stats.maxHp, this.actor!.currentHp + eff.amount);
      this.setMessage(`${this.actor!.name} uses ${item.name}. +${eff.amount} HP.`);
    } else if (eff.kind === 'heal-mp') {
      this.actor!.currentMp = Math.min(this.actor!.stats.maxMp, this.actor!.currentMp + eff.amount);
      this.setMessage(`${this.actor!.name} uses ${item.name}. +${eff.amount} MP.`);
    } else {
      this.setMessage(`${this.actor!.name} uses ${item.name}.`);
    }
    gameStore.removeItem(itemId!, 1);
    this.refreshBars(this.actor!);
    this.advance();
  }

  // --- Targeting ----------------------------------------------------------

  private beginTargetSelect(allies = false): void {
    this.phase = 'target';
    const pool = (allies ? this.party : this.enemies).filter((c) => c.alive);
    this.targetIndex = 0;
    this.renderMenu(pool.map((c) => c.id), (i) => pool[i]!.name);
    this.targetPool = pool;
    // Reuse subIndex-driven paint for target list.
    this.activeIndex = 0;
    this.paintMenu();
    this.updateTargetCursor();
  }

  private targetPool: Combatant[] = [];

  private chooseTarget(_index: number): void {
    const target = this.targetPool[this.activeIndex];
    if (!target) return;
    if (this.pendingSkill) this.applySkill(this.pendingSkill, [target]);
    else this.applyBasicAttack(target);
  }

  private groupTargets(skill: SkillDefinition): Combatant[] {
    switch (skill.target) {
      case 'all-enemies': return this.enemies.filter((c) => c.alive);
      case 'all-allies': return this.party.filter((c) => c.alive);
      case 'self': return [this.actor!];
      default: return [];
    }
  }

  // --- Resolution ---------------------------------------------------------

  private applyBasicAttack(target: Combatant): void {
    const dmg = this.mitigate(basicAttackDamage(this.actor!, target), target);
    this.damage(target, dmg);
    this.setMessage(`${this.actor!.name} attacks ${target.name} for ${dmg}.`);
    this.advance();
  }

  private applySkill(skill: SkillDefinition, targets: Combatant[]): void {
    this.actor!.currentMp -= skill.mpCost;
    if (skill.effect === 'heal') {
      const amount = skill.power + Math.round(this.actor!.stats.attack * 0.5);
      audioService.playSfx('heal');
      for (const t of targets) {
        t.currentHp = Math.min(t.stats.maxHp, t.currentHp + amount);
        this.refreshBars(t);
        const v = this.sprites.get(t.id);
        if (v) this.floatNumber(v.x, v.y - 20, `+${amount}`, '#9be07a');
      }
      this.setMessage(`${this.actor!.name} casts ${skill.name}. +${amount} HP.`);
    } else {
      let total = 0;
      for (const t of targets) {
        const dmg = this.mitigate(skillDamage(this.actor!, t, skill), t);
        this.damage(t, dmg);
        total += dmg;
      }
      this.setMessage(`${this.actor!.name} casts ${skill.name} for ${total}.`);
    }
    this.refreshBars(this.actor!);
    this.advance();
  }

  private mitigate(dmg: number, target: Combatant): number {
    return this.defending.has(target.id) ? Math.max(1, Math.round(dmg / 2)) : dmg;
  }

  private damage(target: Combatant, dmg: number): void {
    audioService.playSfx('hit');
    target.currentHp -= dmg;
    if (target.currentHp <= 0) {
      target.currentHp = 0;
      target.alive = false;
    }
    this.refreshBars(target);
    const view = this.sprites.get(target.id);
    if (view) {
      this.tweens.add({ targets: view, x: view.x + 6, duration: 40, yoyo: true, repeat: 3 });
      const sprite = view.getData('sprite') as Phaser.GameObjects.Image;
      sprite.setTint(0xff6655);
      this.time.delayedCall(110, () => sprite.clearTint());
      this.floatNumber(view.x, view.y - 20, `${dmg}`, '#ff6b5a');
    }
  }

  /** Rising, fading combat number over a combatant. */
  private floatNumber(x: number, y: number, text: string, color: string): void {
    const t = this.add.text(x, y, text, {
      fontFamily: 'Georgia, serif', fontSize: '22px', color, stroke: '#1a140d', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(500);
    this.tweens.add({ targets: t, y: y - 34, alpha: 0, duration: 720, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  }

  // --- Enemy AI -----------------------------------------------------------

  private enemyAct(): void {
    const actor = this.actor!;
    const def = ENEMIES[enemyDefId(actor.id)]!;
    const action = chooseEnemyAction(def.ai, actor.currentHp / actor.stats.maxHp);
    const livingParty = this.party.filter((c) => c.alive);
    if (livingParty.length === 0) return;

    if (action === 'attack') {
      const target = Phaser.Utils.Array.GetRandom(livingParty) as Combatant;
      const dmg = this.mitigate(basicAttackDamage(actor, target), target);
      this.damage(target, dmg);
      this.setMessage(`${actor.name} attacks ${target.name} for ${dmg}.`);
    } else {
      const skill = SKILLS[action];
      if (skill) {
        // From the enemy's perspective, "enemies" are the party.
        const targets = skill.target === 'all-enemies'
          ? livingParty
          : [Phaser.Utils.Array.GetRandom(livingParty) as Combatant];
        actor.currentMp = Math.max(0, actor.currentMp - skill.mpCost);
        let total = 0;
        for (const t of targets) {
          const dmg = this.mitigate(skillDamage(actor, t, skill), t);
          this.damage(t, dmg);
          total += dmg;
        }
        this.setMessage(`${actor.name} uses ${skill.name} for ${total}.`);
      }
    }
    this.advance();
  }

  // --- End conditions -----------------------------------------------------

  private checkEnd(): boolean {
    if (this.enemies.every((e) => !e.alive)) {
      this.victory();
      return true;
    }
    if (this.party.every((p) => !p.alive)) {
      this.defeat();
      return true;
    }
    return false;
  }

  private victory(): void {
    this.phase = 'done';
    this.clearMenu();
    audioService.playSfx('victory');

    let xp = 0;
    let gold = 0;
    const drops: Id[] = [];
    for (const e of this.enemies) {
      const def = ENEMIES[enemyDefId(e.id)]!;
      xp += def.xpReward;
      gold += def.goldReward;
      for (const drop of def.drops) {
        if (Math.random() < drop.chance) drops.push(drop.itemId);
      }
    }

    // Write combat HP/MP back, revive the downed at 1 HP, then apply XP.
    const levelUps: string[] = [];
    for (const c of this.party) {
      const save = gameStore.roster.find((r) => r.id === c.id);
      if (!save) continue;
      save.currentHp = c.alive ? c.currentHp : 1;
      save.currentMp = c.currentMp;
      const up = grantXp(save, xp);
      const max = statsForCharacter(save.id, save.level);
      save.currentHp = Math.min(save.currentHp, max.maxHp);
      save.currentMp = Math.min(save.currentMp, max.maxMp);
      if (up) levelUps.push(`${CHARACTERS[save.id]!.name} reached Lv.${up.to}!`);
    }

    gameStore.addGold(gold);
    for (const itemId of drops) gameStore.addItem(itemId, 1);
    if (this.battleData.victoryFlag) gameStore.setFlag(this.battleData.victoryFlag, true);

    const dropNames = drops.map((d) => ITEMS[d]?.name ?? d);
    const lines = [
      'Victory!',
      `+${xp} XP   +${gold} gold`,
      dropNames.length ? `Found: ${dropNames.join(', ')}` : '',
      ...levelUps,
      '',
      'Press Space to continue.',
    ].filter(Boolean);
    this.setMessage(lines.join('\n'));
    this.waitForExit(true);
  }

  private defeat(): void {
    this.phase = 'done';
    this.clearMenu();
    audioService.playSfx('defeat');
    this.setMessage('Your party has fallen...\nPress Space to return to the title.');
    this.waitForExit(false, true);
  }

  private attemptFlee(): void {
    if (this.battleData.isMiniboss) {
      this.setMessage("You can't flee this fight!");
      return;
    }
    const heroSpeed = this.actor!.stats.speed;
    const enemySpeed = Math.max(...this.enemies.filter((e) => e.alive).map((e) => e.stats.speed));
    const chance = 0.4 + Math.max(0, heroSpeed - enemySpeed) * 0.05;
    if (Math.random() < chance) {
      this.phase = 'done';
      this.clearMenu();
      this.setMessage('Got away safely!\nPress Space to continue.');
      this.waitForExit(false);
    } else {
      this.setMessage("Couldn't escape!");
      this.advance();
    }
  }

  private waitForExit(victory: boolean, toTitle = false): void {
    const exit = () => {
      this.input.keyboard?.off('keydown-SPACE', exit);
      this.input.keyboard?.off('keydown-ENTER', exit);
      eventBus.emit('battle:end', { victory });
      this.scene.stop();
      if (toTitle) {
        this.scene.start(SceneKeys.Title);
      } else {
        this.scene.resume(SceneKeys.Overworld);
      }
    };
    this.input.keyboard?.on('keydown-SPACE', exit);
    this.input.keyboard?.on('keydown-ENTER', exit);
  }

  private find(id: string): Combatant | undefined {
    return this.party.find((c) => c.id === id) ?? this.enemies.find((c) => c.id === id);
  }
}
