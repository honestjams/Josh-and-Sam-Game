import { CHARACTERS, ENEMIES } from '@/data';
import type { Id, StatBlock } from '@/data/types';
import type { CharacterSaveState } from '@/core/save/types';
import type { Combatant } from './resolver';
import { levelFromXp } from './resolver';

/**
 * Bridges save-state / content data and the pure combat resolver. Kept engine-
 * free and unit-testable: turns a character's level and a definition's growth
 * into effective stats, and produces `Combatant`s for a battle.
 */

/** base + growth × (level − 1), per stat. */
export function effectiveStats(base: StatBlock, growth: StatBlock, level: number): StatBlock {
  const n = level - 1;
  return {
    maxHp: base.maxHp + growth.maxHp * n,
    maxMp: base.maxMp + growth.maxMp * n,
    attack: base.attack + growth.attack * n,
    defense: base.defense + growth.defense * n,
    speed: base.speed + growth.speed * n,
  };
}

export function statsForCharacter(id: Id, level: number): StatBlock {
  const def = CHARACTERS[id];
  if (!def) throw new Error(`Unknown character id: ${id}`);
  return effectiveStats(def.baseStats, def.growthPerLevel, level);
}

/** Build a party combatant from its persistent save state. */
export function combatantFromSave(save: CharacterSaveState): Combatant {
  const def = CHARACTERS[save.id]!;
  const stats = statsForCharacter(save.id, save.level);
  const currentHp = Math.min(save.currentHp, stats.maxHp);
  return {
    id: save.id,
    name: def.name,
    side: 'party',
    stats,
    currentHp,
    currentMp: Math.min(save.currentMp, stats.maxMp),
    element: 'neutral',
    alive: currentHp > 0,
  };
}

/** Build an enemy combatant; `slot` disambiguates duplicates of one type. */
export function combatantFromEnemy(id: Id, slot: number): Combatant {
  const def = ENEMIES[id];
  if (!def) throw new Error(`Unknown enemy id: ${id}`);
  return {
    id: `${id}#${slot}`,
    name: slot > 0 ? `${def.name} ${slot + 1}` : def.name,
    side: 'enemy',
    stats: { ...def.stats },
    currentHp: def.stats.maxHp,
    currentMp: def.stats.maxMp,
    element: def.element,
    alive: true,
  };
}

/** Recover the enemy definition id from a combatant's slotted id. */
export function enemyDefId(combatantId: string): Id {
  return combatantId.split('#')[0]!;
}

export interface LevelUpResult {
  id: Id;
  from: number;
  to: number;
}

/**
 * Apply XP to a character's save state, leveling up as thresholds are crossed.
 * Each gained level adds its stat growth to current HP/MP so a level-up heals.
 * Returns a level-up record if the character advanced.
 */
export function grantXp(save: CharacterSaveState, xp: number): LevelUpResult | null {
  const def = CHARACTERS[save.id]!;
  const before = save.level;
  save.xp += xp;
  const after = levelFromXp(save.xp);
  if (after <= before) return null;

  const gainedLevels = after - before;
  save.level = after;
  save.currentHp += def.growthPerLevel.maxHp * gainedLevels;
  save.currentMp += def.growthPerLevel.maxMp * gainedLevels;
  return { id: save.id, from: before, to: after };
}
