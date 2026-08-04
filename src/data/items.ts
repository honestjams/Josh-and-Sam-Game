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
