import { describe, it, expect, beforeEach } from 'vitest';
import { GameStore } from '@/core/store/GameStore';

describe('GameStore save round-trip', () => {
  let store: GameStore;
  beforeEach(() => {
    store = new GameStore();
    store.newGame(); // default hero (char.squirrel)
  });

  it('new game seeds the chosen hero, starter items, and gold', () => {
    // Default hero when none is chosen (used by tests).
    expect(store.activeParty).toEqual(['char.squirrel']);
    expect(store.hasCharacter('char.squirrel')).toBe(true);
    expect(store.gold).toBe(20);
    expect(store.itemCount('item.minor-potion')).toBe(2);
  });

  it('picking a hero seeds recruit quests for the two not chosen', () => {
    store.newGame('char.gnome');
    expect(store.activeParty).toEqual(['char.gnome']);
    expect(store.questState('quest.recruit-squirrel')).toBe('active');
    expect(store.questState('quest.recruit-woodelf')).toBe('active');
    expect(store.questState('quest.recruit-gnome')).toBe('unstarted');
  });

  it('round-trips all save-relevant state through toBlob/loadBlob', () => {
    store.addGold(30);
    store.addItem('item.glow-cap', 2);
    store.setFlag('heard_dark_lord_was_light', true);
    store.startQuest('quest.recruit-leaf');
    store.recruit('char.leaf');
    store.position = { mapId: 'mycelia-hollow', tileX: 7, tileY: 9, facing: 'left' };

    const blob = store.toBlob();
    const restored = new GameStore();
    restored.loadBlob(blob);

    expect(restored.gold).toBe(store.gold);
    expect(restored.itemCount('item.glow-cap')).toBe(3);
    expect(restored.getFlag('heard_dark_lord_was_light')).toBe(true);
    expect(restored.questState('quest.recruit-leaf')).toBe('active');
    expect(restored.hasCharacter('char.leaf')).toBe(true);
    expect(restored.activeParty).toContain('char.leaf');
    expect(restored.position).toEqual({ mapId: 'mycelia-hollow', tileX: 7, tileY: 9, facing: 'left' });
  });

  it('survives a JSON serialization cycle (localStorage-equivalent)', () => {
    store.recruit('char.leaf');
    store.completeQuest('quest.recruit-leaf'); // grants 50 gold reward
    const json = JSON.stringify(store.toBlob());
    const restored = new GameStore();
    restored.loadBlob(JSON.parse(json));
    expect(restored.gold).toBe(70);
    expect(restored.questState('quest.recruit-leaf')).toBe('completed');
  });

  it('removeItem refuses to over-remove and prunes empty stacks', () => {
    expect(store.removeItem('item.minor-potion', 5)).toBe(false);
    expect(store.itemCount('item.minor-potion')).toBe(2);
    expect(store.removeItem('item.minor-potion', 2)).toBe(true);
    expect(store.hasItem('item.minor-potion')).toBe(false);
  });
});
