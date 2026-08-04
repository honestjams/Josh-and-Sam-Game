import { CHARACTERS, QUESTS } from '@/data';
import { SELECTABLE_HERO_IDS, DEFAULT_HERO_ID } from '@/data/party';
import type { Condition, Consequence, Id, QuestState } from '@/data/types';
import type {
  CharacterSaveState,
  InventoryStackSave,
  QuestSaveState,
  SaveBlob,
  WorldPosition,
} from '@/core/save/types';
import { SAVE_VERSION } from '@/core/save/types';

/** Where a brand-new game drops the player. */
const NEW_GAME_START: WorldPosition = {
  mapId: 'mycelia-hollow',
  tileX: 15,
  tileY: 12,
  facing: 'down',
};

/**
 * The single source-of-truth game store. It is deliberately Phaser-free and
 * unit-testable: no scene ever mutates game state directly, it goes through
 * these methods. `toBlob()`/`loadBlob()` are exact inverses, guaranteeing a
 * full save round-trip (party, inventory, gold, flags, quests, position).
 */
export class GameStore {
  name = 'Adventurer';
  gold = 0;
  flags: Record<string, boolean> = {};
  roster: CharacterSaveState[] = [];
  activeParty: Id[] = [];
  inventory: InventoryStackSave[] = [];
  quests: QuestSaveState[] = [];
  position: WorldPosition = { ...NEW_GAME_START };

  // --- Lifecycle ----------------------------------------------------------

  /**
   * Reset to a fresh new-game state around the chosen hero. The two heroes the
   * player did NOT pick get their recruit quests seeded as active, so the quest
   * log points toward meeting them later in the story.
   */
  newGame(heroId: Id = DEFAULT_HERO_ID, name = 'Adventurer'): void {
    const hero = CHARACTERS[heroId] ? heroId : DEFAULT_HERO_ID;
    this.name = name;
    this.gold = 20;
    this.flags = { chosen_hero: true };
    this.setFlag(`hero_${hero}`, true);
    this.roster = [this.freshCharacter(hero)];
    this.activeParty = [hero];
    this.inventory = [
      { itemId: 'item.minor-potion', qty: 2 },
      { itemId: 'item.glow-cap', qty: 1 },
    ];
    this.quests = [];
    this.position = { ...NEW_GAME_START };

    for (const otherId of SELECTABLE_HERO_IDS) {
      if (otherId === hero) continue;
      const quest = CHARACTERS[otherId]?.recruitQuestId;
      if (quest) this.startQuest(quest);
    }
  }

  private freshCharacter(id: Id): CharacterSaveState {
    const def = CHARACTERS[id];
    if (!def) throw new Error(`Unknown character id: ${id}`);
    return {
      id,
      level: 1,
      xp: 0,
      currentHp: def.baseStats.maxHp,
      currentMp: def.baseStats.maxMp,
      equipped: {},
    };
  }

  // --- Serialization (save round-trip) ------------------------------------

  toBlob(): SaveBlob {
    return {
      version: SAVE_VERSION,
      name: this.name,
      savedAt: new Date().toISOString(),
      gold: this.gold,
      flags: { ...this.flags },
      roster: this.roster.map((c) => ({ ...c, equipped: { ...c.equipped } })),
      activeParty: [...this.activeParty],
      inventory: this.inventory.map((s) => ({ ...s })),
      quests: this.quests.map((q) => ({ ...q })),
      position: { ...this.position },
    };
  }

  loadBlob(blob: SaveBlob): void {
    // v1 has a single version; future versions migrate here before assignment.
    this.name = blob.name;
    this.gold = blob.gold;
    this.flags = { ...blob.flags };
    this.roster = blob.roster.map((c) => ({ ...c, equipped: { ...c.equipped } }));
    this.activeParty = [...blob.activeParty];
    this.inventory = blob.inventory.map((s) => ({ ...s }));
    this.quests = blob.quests.map((q) => ({ ...q }));
    this.position = { ...blob.position };
  }

  // --- Gold ---------------------------------------------------------------

  addGold(amount: number): void {
    this.gold = Math.max(0, this.gold + amount);
  }

  spendGold(amount: number): boolean {
    if (this.gold < amount) return false;
    this.gold -= amount;
    return true;
  }

  // --- Flags --------------------------------------------------------------

  setFlag(flag: string, value: boolean): void {
    this.flags[flag] = value;
  }

  getFlag(flag: string): boolean {
    return this.flags[flag] === true;
  }

  // --- Inventory ----------------------------------------------------------

  itemCount(itemId: Id): number {
    return this.inventory.find((s) => s.itemId === itemId)?.qty ?? 0;
  }

  hasItem(itemId: Id, qty = 1): boolean {
    return this.itemCount(itemId) >= qty;
  }

  addItem(itemId: Id, qty = 1): void {
    const existing = this.inventory.find((s) => s.itemId === itemId);
    if (existing) existing.qty += qty;
    else this.inventory.push({ itemId, qty });
  }

  /** Remove up to `qty`; returns false (and changes nothing) if insufficient. */
  removeItem(itemId: Id, qty = 1): boolean {
    const existing = this.inventory.find((s) => s.itemId === itemId);
    if (!existing || existing.qty < qty) return false;
    existing.qty -= qty;
    if (existing.qty <= 0) {
      this.inventory = this.inventory.filter((s) => s !== existing);
    }
    return true;
  }

  // --- Party --------------------------------------------------------------

  hasCharacter(id: Id): boolean {
    return this.roster.some((c) => c.id === id);
  }

  recruit(id: Id): void {
    if (this.hasCharacter(id)) return;
    this.roster.push(this.freshCharacter(id));
    // Auto-fill an active slot if the party isn't full (max 3).
    if (this.activeParty.length < 3) this.activeParty.push(id);
  }

  // --- Quests -------------------------------------------------------------

  questState(questId: Id): QuestState {
    const q = this.quests.find((x) => x.questId === questId);
    return q ? q.state : 'unstarted';
  }

  startQuest(questId: Id): void {
    if (!QUESTS[questId]) throw new Error(`Unknown quest id: ${questId}`);
    if (this.questState(questId) === 'unstarted') {
      this.quests.push({ questId, state: 'active' });
    }
  }

  completeQuest(questId: Id): void {
    const q = this.quests.find((x) => x.questId === questId);
    if (q) q.state = 'completed';
    else this.quests.push({ questId, state: 'completed' });

    // Auto-grant quest rewards on completion.
    const def = QUESTS[questId];
    if (def?.rewards.gold) this.addGold(def.rewards.gold);
    for (const itemId of def?.rewards.itemIds ?? []) this.addItem(itemId, 1);
  }

  // --- Dialogue condition/consequence bridge ------------------------------
  // The dialogue and quest systems speak in Conditions/Consequences; the store
  // is the single place those are evaluated and applied, keeping mutation in
  // one auditable spot.

  checkCondition(c: Condition): boolean {
    switch (c.type) {
      case 'flag':
        return this.getFlag(c.flag) === (c.equals ?? true);
      case 'has-item':
        return this.hasItem(c.itemId, c.qty ?? 1);
      case 'quest-state':
        return this.questState(c.questId) === c.state;
      case 'has-party-member':
        return this.hasCharacter(c.characterId);
      case 'gold-at-least':
        return this.gold >= c.amount;
    }
  }

  checkAll(conditions: Condition[] | undefined): boolean {
    return (conditions ?? []).every((c) => this.checkCondition(c));
  }

  /**
   * Apply a consequence. Returns an optional side-effect signal the caller
   * (a scene) may act on but that is not itself game state — e.g. opening a
   * shop or starting a battle. All persistent mutation happens here.
   */
  applyConsequence(c: Consequence): ConsequenceSideEffect | void {
    switch (c.type) {
      case 'set-flag':
        this.setFlag(c.flag, c.value);
        return;
      case 'give-item':
        this.addItem(c.itemId, c.qty);
        return;
      case 'take-item':
        this.removeItem(c.itemId, c.qty);
        return;
      case 'give-gold':
        this.addGold(c.amount);
        return;
      case 'take-gold':
        this.spendGold(c.amount);
        return;
      case 'start-quest':
        this.startQuest(c.questId);
        return;
      case 'complete-quest':
        this.completeQuest(c.questId);
        return;
      case 'recruit':
        this.recruit(c.characterId);
        return;
      case 'open-shop':
        return { openShop: c.shopId };
      case 'start-battle':
        return { startBattle: { enemyIds: c.enemyIds, isMiniboss: c.isMiniboss, victoryFlag: c.victoryFlag } };
    }
  }
}

/** Non-persistent signals a consequence may raise for a scene to act on. */
export interface ConsequenceSideEffect {
  openShop?: Id;
  startBattle?: { enemyIds: Id[]; isMiniboss?: boolean; victoryFlag?: string };
}

/** Process-wide singleton store. Scenes read/write through this instance. */
export const gameStore = new GameStore();
