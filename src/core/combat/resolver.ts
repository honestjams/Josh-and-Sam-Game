import type { EnemyAiIntent, ElementType, SkillDefinition, StatBlock } from '@/data/types';

/**
 * Phaser-independent turn-based combat resolver.
 *
 * Classic turn order: a queue ordered by each combatant's speed, one action
 * per turn (FF1 / Pokémon Mystery Dungeon feel — NOT an ATB time bar). The
 * resolver is intentionally modular so an ATB layer could sit on top later,
 * but scheduling here is strictly speed-sorted.
 *
 * BattleScene (next pass) drives this module; the math and ordering live here
 * so they can be unit-tested with no engine present.
 */

export interface Combatant {
  id: string;
  name: string;
  side: 'party' | 'enemy';
  stats: StatBlock;
  currentHp: number;
  currentMp: number;
  element: ElementType;
  alive: boolean;
}

/** Simple rock-paper-scissors-ish elemental table. growth <-> decay is the core axis. */
export function elementalMultiplier(attack: ElementType, defender: ElementType): number {
  if (attack === 'growth' && defender === 'decay') return 1.5;
  if (attack === 'decay' && defender === 'growth') return 1.5;
  if (attack === 'fire' && defender === 'water') return 0.5;
  if (attack === 'water' && defender === 'fire') return 1.5;
  return 1;
}

/**
 * Order combatants for a round by speed, descending. Ties are broken
 * deterministically by id so replays and tests are stable.
 */
export function turnOrder(combatants: Combatant[]): Combatant[] {
  return [...combatants]
    .filter((c) => c.alive)
    .sort((a, b) => b.stats.speed - a.stats.speed || a.id.localeCompare(b.id));
}

/** Deterministic-by-injection RNG so combat is testable and replayable. */
export type Rng = () => number;

export function basicAttackDamage(attacker: Combatant, defender: Combatant, rng: Rng = Math.random): number {
  const base = attacker.stats.attack * 2 - defender.stats.defense;
  const variance = 0.85 + rng() * 0.3; // ±15%
  const mult = elementalMultiplier(attacker.element, defender.element);
  return Math.max(1, Math.round(base * variance * mult));
}

export function skillDamage(
  attacker: Combatant,
  defender: Combatant,
  skill: SkillDefinition,
  rng: Rng = Math.random,
): number {
  const base = skill.power + attacker.stats.attack - defender.stats.defense * 0.5;
  const variance = 0.9 + rng() * 0.2;
  const mult = elementalMultiplier(skill.element, defender.element);
  return Math.max(1, Math.round(base * variance * mult));
}

/**
 * Pick an enemy action from its data-driven intent list. Honours `whenHpBelow`
 * gates and weights. Pure given an injected RNG.
 */
export function chooseEnemyAction(intents: EnemyAiIntent[], hpFraction: number, rng: Rng = Math.random): EnemyAiIntent['action'] {
  const eligible = intents.filter((i) => i.whenHpBelow === undefined || hpFraction < i.whenHpBelow);
  const pool = eligible.length > 0 ? eligible : intents;
  const total = pool.reduce((sum, i) => sum + i.weight, 0);
  let roll = rng() * total;
  for (const intent of pool) {
    roll -= intent.weight;
    if (roll <= 0) return intent.action;
  }
  return pool[pool.length - 1]!.action;
}

/** XP required to advance from `level` to `level + 1`. */
export function xpForNextLevel(level: number): number {
  return Math.round(20 * Math.pow(level, 1.5));
}
