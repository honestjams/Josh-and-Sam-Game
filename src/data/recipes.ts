import type { Id, RecipeDefinition } from './types';

/** Crafting/potion recipes available at the crafting station. */
export const RECIPES: Record<Id, RecipeDefinition> = {
  'recipe.minor-potion': {
    id: 'recipe.minor-potion',
    name: 'Brew Minor Potion',
    inputs: [
      { itemId: 'item.glow-cap', qty: 1 },
      { itemId: 'item.spring-water', qty: 1 },
    ],
    output: { itemId: 'item.minor-potion', qty: 1 },
  },
  'recipe.spore-tonic': {
    id: 'recipe.spore-tonic',
    name: 'Brew Spore Tonic',
    inputs: [
      { itemId: 'item.blue-spore', qty: 1 },
      { itemId: 'item.spring-water', qty: 1 },
    ],
    output: { itemId: 'item.spore-tonic', qty: 1 },
  },
};
