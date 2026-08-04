/**
 * Content registry. A single import surface for all typed game content.
 * Systems and scenes read content through here.
 */
export { SKILLS } from './skills';
export { ITEMS, getItem } from './items';
export { RECIPES } from './recipes';
export { CHARACTERS } from './party';
export { ENEMIES } from './enemies';
export { QUESTS } from './quests';
export { DIALOGUE } from './dialogue';
export { NPCS } from './npcs';
export { SHOPS } from './shops';
export * from './types';
