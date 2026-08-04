import type { Id, ItemDefinition } from './types';

/** All items, keyed by id. */
export const ITEMS: Record<Id, ItemDefinition> = {
  // --- Consumables ---------------------------------------------------------
  'item.minor-potion': {
    id: 'item.minor-potion',
    name: 'Minor Potion',
    description: 'A warm amber draught. Restores 30 HP.',
    category: 'consumable',
    value: 15,
    stackable: true,
    consumable: { kind: 'heal-hp', amount: 30 },
    spriteKey: 'item.minor-potion',
  },
  'item.spore-tonic': {
    id: 'item.spore-tonic',
    name: 'Spore Tonic',
    description: 'Glimmering fungal tonic. Restores 20 MP.',
    category: 'consumable',
    value: 20,
    stackable: true,
    consumable: { kind: 'heal-mp', amount: 20 },
    spriteKey: 'item.spore-tonic',
  },

  // --- Crafting ingredients ------------------------------------------------
  'item.glow-cap': {
    id: 'item.glow-cap',
    name: 'Glow Cap',
    description: 'A softly luminous mushroom cap. A crafting ingredient.',
    category: 'ingredient',
    value: 5,
    stackable: true,
    spriteKey: 'item.glow-cap',
  },
  'item.spring-water': {
    id: 'item.spring-water',
    name: 'Spring Water',
    description: 'Clear water from the hollow spring. A crafting ingredient.',
    category: 'ingredient',
    value: 3,
    stackable: true,
    spriteKey: 'item.spring-water',
  },
  'item.blue-spore': {
    id: 'item.blue-spore',
    name: 'Blue Spore',
    description: 'A shimmering blue spore humming with energy.',
    category: 'ingredient',
    value: 8,
    stackable: true,
    spriteKey: 'item.blue-spore',
  },

  // --- Equipment -----------------------------------------------------------
  'item.oak-charm': {
    id: 'item.oak-charm',
    name: 'Oak Charm',
    description: 'A little carved acorn charm. +3 Defense.',
    category: 'equipment',
    value: 40,
    stackable: false,
    equip: { defense: 3 },
    spriteKey: 'item.oak-charm',
  },

  // --- The King's regalia (light-touched relics) --------------------------
  'item.holy-spore-jar': {
    id: 'item.holy-spore-jar',
    name: 'Holy Spore Jar',
    description: 'Blessed spores from the King. Fully restores one ally in battle.',
    category: 'consumable',
    value: 120,
    stackable: true,
    consumable: { kind: 'heal-hp', amount: 999 },
    spriteKey: 'item.holy-spore-jar',
  },
  'item.luminous-staff': {
    id: 'item.luminous-staff',
    name: 'Luminous Staff',
    description: 'A staff wreathed in light. +4 Attack, +6 MP.',
    category: 'equipment',
    value: 200,
    stackable: false,
    equip: { attack: 4, maxMp: 6 },
    spriteKey: 'item.luminous-staff',
  },
  'item.crown-of-light': {
    id: 'item.crown-of-light',
    name: 'Crown of Light',
    description: "The King's crown. A relic of pure light — its purpose is not yet clear.",
    category: 'key',
    value: 0,
    stackable: false,
    spriteKey: 'item.crown-of-light',
  },

  // --- The Dark Lord's relics ---------------------------------------------
  'item.dark-tonic': {
    id: 'item.dark-tonic',
    name: 'Dark Tonic',
    description: 'A bitter violet brew. Restores 60 HP but leaves a chill.',
    category: 'consumable',
    value: 30,
    stackable: true,
    consumable: { kind: 'heal-hp', amount: 60 },
    spriteKey: 'item.dark-tonic',
  },
  'item.dark-scepter': {
    id: 'item.dark-scepter',
    name: 'Scepter of Enduring',
    description: "The Tyrant's scepter. +6 Attack, but hums with decay.",
    category: 'equipment',
    value: 260,
    stackable: false,
    equip: { attack: 6 },
    spriteKey: 'item.dark-scepter',
  },
  'item.shadow-crown': {
    id: 'item.shadow-crown',
    name: 'Shadow Crown',
    description: "The Dark Lord's crown. Paired with the Crown of Light, it may end the war without a blade.",
    category: 'key',
    value: 0,
    stackable: false,
    spriteKey: 'item.shadow-crown',
  },

  // --- Key items -----------------------------------------------------------
  'item.grove-map': {
    id: 'item.grove-map',
    name: "Grove Map",
    description: "A hand-drawn map toward the King's Grove. A key item.",
    category: 'key',
    value: 0,
    stackable: false,
    spriteKey: 'item.grove-map',
  },
};

/** Convenience accessor with a clear failure when an id is mistyped. */
export function getItem(id: Id): ItemDefinition {
  const item = ITEMS[id];
  if (!item) throw new Error(`Unknown item id: ${id}`);
  return item;
}
