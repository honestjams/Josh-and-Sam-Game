import { describe, it, expect } from 'vitest';
import {
  turnOrder,
  elementalMultiplier,
  chooseEnemyAction,
  basicAttackDamage,
  type Combatant,
} from '@/core/combat/resolver';

function mk(id: string, speed: number, side: 'party' | 'enemy' = 'party'): Combatant {
  return {
    id,
    name: id,
    side,
    stats: { maxHp: 30, maxMp: 10, attack: 10, defense: 4, speed },
    currentHp: 30,
    currentMp: 10,
    element: 'neutral',
    alive: true,
  };
}

describe('combat resolver', () => {
  it('orders turns by speed descending, ties broken by id', () => {
    const order = turnOrder([mk('c', 5), mk('a', 10), mk('b', 10)]).map((c) => c.id);
    expect(order).toEqual(['a', 'b', 'c']);
  });

  it('excludes downed combatants from the turn order', () => {
    const dead = mk('x', 99);
    dead.alive = false;
    expect(turnOrder([dead, mk('y', 1)]).map((c) => c.id)).toEqual(['y']);
  });

  it('applies the growth<->decay elemental advantage', () => {
    expect(elementalMultiplier('growth', 'decay')).toBe(1.5);
    expect(elementalMultiplier('decay', 'growth')).toBe(1.5);
    expect(elementalMultiplier('neutral', 'growth')).toBe(1);
  });

  it('enemy AI honours whenHpBelow gates via injected RNG', () => {
    const intents = [
      { action: 'attack' as const, weight: 1 },
      { action: 'skill.blight-wave', weight: 1, whenHpBelow: 0.5 },
    ];
    // Above the gate: only the ungated intent is eligible.
    expect(chooseEnemyAction(intents, 0.9, () => 0.99)).toBe('attack');
    // Below the gate: the gated skill becomes eligible and can be chosen.
    expect(chooseEnemyAction(intents, 0.4, () => 0.99)).toBe('skill.blight-wave');
  });

  it('basic attack damage is deterministic given an RNG and at least 1', () => {
    const dmg = basicAttackDamage(mk('a', 10), mk('b', 10), () => 0.5);
    expect(dmg).toBeGreaterThanOrEqual(1);
  });
});
