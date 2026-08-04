import { RECIPES } from '@/data';
import type { Id, RecipeDefinition } from '@/data/types';
import type { GameStore } from '@/core/store/GameStore';

/**
 * Phaser-independent crafting system. Given the store's inventory and a recipe,
 * it checks ingredients and (if asked) consumes them to produce the output.
 * Pure logic — the crafting station scene just calls this.
 */

export function canCraft(store: GameStore, recipe: RecipeDefinition): boolean {
  return recipe.inputs.every((input) => store.hasItem(input.itemId, input.qty));
}

export function craftableRecipes(store: GameStore): RecipeDefinition[] {
  return Object.values(RECIPES).filter((r) => canCraft(store, r));
}

/**
 * Attempt to craft. Returns true on success (ingredients consumed, output
 * added); false and a no-op if any ingredient is missing.
 */
export function craft(store: GameStore, recipeId: Id): boolean {
  const recipe = RECIPES[recipeId];
  if (!recipe || !canCraft(store, recipe)) return false;
  for (const input of recipe.inputs) store.removeItem(input.itemId, input.qty);
  store.addItem(recipe.output.itemId, recipe.output.qty);
  return true;
}
