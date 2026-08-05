import type { Id, NpcDefinition } from './types';

/**
 * NPC definitions. Placement (map coordinates) lives in the Tiled map's
 * object layer and references these by id, keeping content and layout apart.
 */
export const NPCS: Record<Id, NpcDefinition> = {
  'npc.elder-morel': {
    id: 'npc.elder-morel',
    name: 'Elder Morel',
    dialogueId: 'dlg.elder-morel',
    spriteKey: 'npc.elder-morel',
    placeholderColor: 0x9b6b3f,
  },
  'npc.rustle': {
    id: 'npc.rustle',
    name: 'Rustle the Leaf',
    dialogueId: 'dlg.rustle-leaf',
    spriteKey: 'npc.rustle',
    placeholderColor: 0x6ab04c,
  },
  'npc.fen': {
    id: 'npc.fen',
    name: 'Fen the Trader',
    dialogueId: 'dlg.shopkeeper',
    spriteKey: 'npc.fen',
    placeholderColor: 0xd4a017,
  },
  'npc.mushroom-king': {
    id: 'npc.mushroom-king',
    name: 'The Mushroom King',
    dialogueId: 'dlg.mushroom-king',
    spriteKey: 'npc.mushroom-king',
    placeholderColor: 0xb5423a,
  },
  'npc.boletta': {
    id: 'npc.boletta',
    name: 'Boletta',
    dialogueId: 'dlg.villager-boletta',
    spriteKey: 'npc.boletta',
    placeholderColor: 0xc86b8a,
  },
  'npc.dark-lord': {
    id: 'npc.dark-lord',
    name: 'The Dark Lord',
    dialogueId: 'dlg.dark-lord',
    spriteKey: 'npc.dark-lord',
    placeholderColor: 0x1c1c22,
  },
};
