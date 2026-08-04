import { describe, it, expect, beforeEach } from 'vitest';
import { GameStore } from '@/core/store/GameStore';
import { canCraft, craft, craftableRecipes } from '@/core/crafting/crafting';
import { RECIPES } from '@/data';

describe('crafting system', () => {
  let store: GameStore;
  beforeEach(() => {
    store = new GameStore();
    store.newGame();
    // Clear starter inventory to isolate the test.
    store.inventory = [];
  });

  it('cannot craft without ingredients', () => {
    expect(canCraft(store, RECIPES['recipe.minor-potion']!)).toBe(false);
    expect(craft(store, 'recipe.minor-potion')).toBe(false);
  });

  it('consumes exact ingredients and produces the output', () => {
    store.addItem('item.glow-cap', 1);
    store.addItem('item.spring-water', 1);
    expect(craft(store, 'recipe.minor-potion')).toBe(true);
    expect(store.itemCount('item.minor-potion')).toBe(1);
    expect(store.itemCount('item.glow-cap')).toBe(0);
    expect(store.itemCount('item.spring-water')).toBe(0);
  });

  it('lists only currently-craftable recipes', () => {
    store.addItem('item.blue-spore', 1);
    store.addItem('item.spring-water', 1);
    const ids = craftableRecipes(store).map((r) => r.id);
    expect(ids).toEqual(['recipe.spore-tonic']);
  });
});
