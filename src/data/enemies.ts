import type { EnemyDefinition, Id } from './types';

/**
 * The three route/dungeon enemy types plus the dungeon miniboss.
 * AI is data-driven: the resolver picks from `ai` by weight, respecting
 * any `whenHpBelow` gate. No enemy-specific code lives in the battle scene.
 */
export const ENEMIES: Record<Id, EnemyDefinition> = {
  'enemy.blight-mite': {
    id: 'enemy.blight-mite',
    name: 'Blight Mite',
    stats: { maxHp: 22, maxMp: 6, attack: 8, defense: 3, speed: 12 },
    element: 'decay',
    skillIds: ['skill.spore-bite'],
    ai: [
      { action: 'attack', weight: 3 },
      { action: 'skill.spore-bite', weight: 1 },
    ],
    xpReward: 6,
    goldReward: 4,
    drops: [{ itemId: 'item.blue-spore', chance: 0.4 }],
    spriteKey: 'enemy.blight-mite',
  },
  'enemy.wither-cap': {
    id: 'enemy.wither-cap',
    name: 'Wither Cap',
    stats: { maxHp: 34, maxMp: 4, attack: 11, defense: 6, speed: 7 },
    element: 'decay',
    skillIds: [],
    ai: [{ action: 'attack', weight: 1 }],
    xpReward: 9,
    goldReward: 7,
    drops: [
      { itemId: 'item.glow-cap', chance: 0.5 },
      { itemId: 'item.oak-charm', chance: 0.05 },
    ],
    spriteKey: 'enemy.wither-cap',
  },
  'enemy.gloom-moth': {
    id: 'enemy.gloom-moth',
    name: 'Gloom Moth',
    stats: { maxHp: 18, maxMp: 10, attack: 7, defense: 2, speed: 16 },
    element: 'decay',
    skillIds: ['skill.spore-bite'],
    ai: [
      { action: 'attack', weight: 2 },
      { action: 'skill.spore-bite', weight: 2 },
    ],
    xpReward: 7,
    goldReward: 5,
    drops: [{ itemId: 'item.spring-water', chance: 0.35 }],
    spriteKey: 'enemy.gloom-moth',
  },

  // --- Miniboss ------------------------------------------------------------
  'enemy.rot-warden': {
    id: 'enemy.rot-warden',
    name: 'The Rot Warden',
    stats: { maxHp: 120, maxMp: 30, attack: 16, defense: 9, speed: 8 },
    element: 'decay',
    skillIds: ['skill.spore-bite', 'skill.blight-wave'],
    ai: [
      { action: 'attack', weight: 3 },
      { action: 'skill.spore-bite', weight: 2 },
      // Only unleashes the AoE when wounded — a simple data-driven "enrage".
      { action: 'skill.blight-wave', weight: 4, whenHpBelow: 0.5 },
    ],
    xpReward: 60,
    goldReward: 80,
    drops: [{ itemId: 'item.grove-map', chance: 1 }],
    spriteKey: 'enemy.rot-warden',
    isMiniboss: true,
  },
};
