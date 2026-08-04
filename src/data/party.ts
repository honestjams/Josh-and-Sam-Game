import type { CharacterDefinition, Id } from './types';

/**
 * Playable and recruitable characters. The player travels with up to three
 * (hero + two active allies). Only the hero starts in the party; the Leaf is
 * recruited in the vertical slice via `quest.recruit-leaf`.
 */
/**
 * The three heroes offered at the start. The player picks one; the two they
 * don't choose are recruited later in the story (each has a recruit quest).
 */
export const SELECTABLE_HERO_IDS: Id[] = ['char.squirrel', 'char.gnome', 'char.woodelf'];

/** Fallback hero used when a save predates selection or a test omits a choice. */
export const DEFAULT_HERO_ID: Id = 'char.squirrel';

export const CHARACTERS: Record<Id, CharacterDefinition> = {
  // --- Selectable heroes ---------------------------------------------------
  'char.squirrel': {
    id: 'char.squirrel',
    name: 'Nutkin the Squirrel',
    role: 'defender',
    blurb: 'A brave sword-and-shield squirrel. Tough, loyal, quick on their feet.',
    baseStats: { maxHp: 64, maxMp: 10, attack: 12, defense: 10, speed: 11 },
    growthPerLevel: { maxHp: 9, maxMp: 2, attack: 2, defense: 2, speed: 1 },
    skillIds: ['skill.slash', 'skill.guard-bash'],
    spriteKey: 'char.squirrel',
    recruitQuestId: 'quest.recruit-squirrel',
    selectableHero: true,
  },
  'char.gnome': {
    id: 'char.gnome',
    name: 'Fizzwick the Gnome',
    role: 'support',
    blurb: 'A kindly old gnome brimming with growth magic. Frail, but heals the party.',
    baseStats: { maxHp: 50, maxMp: 22, attack: 8, defense: 7, speed: 9 },
    growthPerLevel: { maxHp: 6, maxMp: 4, attack: 1, defense: 1, speed: 1 },
    skillIds: ['skill.rustle', 'skill.spore-heal'],
    spriteKey: 'char.gnome',
    recruitQuestId: 'quest.recruit-gnome',
    selectableHero: true,
  },
  'char.woodelf': {
    id: 'char.woodelf',
    name: 'Sylwen the Wood Elf',
    role: 'striker',
    blurb: 'A swift wood elf who bends leaf and wind. Hits fast and often, all at once.',
    baseStats: { maxHp: 54, maxMp: 16, attack: 13, defense: 6, speed: 15 },
    growthPerLevel: { maxHp: 7, maxMp: 3, attack: 2, defense: 1, speed: 2 },
    skillIds: ['skill.leaf-cutter', 'skill.gale'],
    spriteKey: 'char.woodelf',
    recruitQuestId: 'quest.recruit-woodelf',
    selectableHero: true,
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
