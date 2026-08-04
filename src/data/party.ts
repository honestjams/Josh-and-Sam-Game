import type { CharacterDefinition, Id } from './types';

/**
 * Playable and recruitable characters. The player travels with up to three
 * (hero + two active allies). Only the hero starts in the party; the Leaf is
 * recruited in the vertical slice via `quest.recruit-leaf`.
 */
export const CHARACTERS: Record<Id, CharacterDefinition> = {
  'char.hero': {
    id: 'char.hero',
    name: 'Sam',
    role: 'hero',
    blurb: 'A young adventurer from Mycelia Hollow, brave and a little homesick.',
    baseStats: { maxHp: 60, maxMp: 12, attack: 12, defense: 8, speed: 10 },
    growthPerLevel: { maxHp: 8, maxMp: 2, attack: 2, defense: 1, speed: 1 },
    skillIds: ['skill.slash'],
    spriteKey: 'char.hero',
  },
  'char.leaf': {
    id: 'char.leaf',
    name: 'Rustle the Leaf',
    role: 'striker',
    blurb: 'A chatty windblown leaf who never sits still. Hits everything at once.',
    baseStats: { maxHp: 42, maxMp: 18, attack: 10, defense: 5, speed: 14 },
    growthPerLevel: { maxHp: 5, maxMp: 3, attack: 2, defense: 1, speed: 2 },
    skillIds: ['skill.leaf-cutter', 'skill.rustle'],
    spriteKey: 'char.leaf',
    recruitQuestId: 'quest.recruit-leaf',
  },
  // Designed-for but not recruited in the slice — proves the data pattern.
  'char.acorn': {
    id: 'char.acorn',
    name: 'Pip the Acorn',
    role: 'defender',
    blurb: 'A stoic little acorn with a hard shell and a soft heart.',
    baseStats: { maxHp: 75, maxMp: 8, attack: 9, defense: 14, speed: 6 },
    growthPerLevel: { maxHp: 10, maxMp: 1, attack: 1, defense: 3, speed: 1 },
    skillIds: [],
    spriteKey: 'char.acorn',
    recruitQuestId: 'quest.recruit-acorn',
  },
  'char.mushroom': {
    id: 'char.mushroom',
    name: 'Bella the Baby Mushroom',
    role: 'support',
    blurb: 'A tiny glowing mushroom, shy but full of healing spores.',
    baseStats: { maxHp: 48, maxMp: 24, attack: 7, defense: 6, speed: 9 },
    growthPerLevel: { maxHp: 6, maxMp: 4, attack: 1, defense: 1, speed: 1 },
    skillIds: ['skill.rustle'],
    spriteKey: 'char.mushroom',
    recruitQuestId: 'quest.recruit-mushroom',
  },
};
