import { describe, it, expect, beforeEach } from 'vitest';
import { GameStore } from '@/core/store/GameStore';
import { DialogueRunner } from '@/core/dialogue/DialogueRunner';
import { DIALOGUE } from '@/data';

describe('DialogueRunner branching & consequences', () => {
  let store: GameStore;
  beforeEach(() => {
    store = new GameStore();
    store.newGame();
    store.inventory = [];
  });

  it('Elder Morel: accepting starts the main quest and seeds the twist flag', () => {
    const runner = new DialogueRunner(DIALOGUE['dlg.elder-morel']!, store);
    runner.start();
    const view = runner.advance(); // start -> ask (has choices)
    expect(view?.choices.some((c) => c.label.includes('Accept'))).toBe(true);

    // Choose the "accept" option.
    const accept = view!.choices.find((c) => c.label.includes('Accept'))!;
    runner.choose(accept.index); // ask -> accepted
    expect(store.questState('quest.reach-grove')).toBe('active');

    // Advancing past the accepted line reaches the twist node, whose onEnter
    // seeds the redemption-arc flag.
    runner.advance(); // accepted -> twist
    expect(store.getFlag('heard_dark_lord_was_light')).toBe(true);
  });

  it('Rustle router: first visit shows the intro branch', () => {
    const runner = new DialogueRunner(DIALOGUE['dlg.rustle-leaf']!, store);
    const view = runner.start(); // auto router -> intro
    expect(view?.text).toContain('wind stole three');
  });

  it('Rustle router: with 3 glow caps and quest active, turn-in recruits the Leaf and pays gold', () => {
    store.startQuest('quest.recruit-leaf');
    store.addItem('item.glow-cap', 3);
    const goldBefore = store.gold;

    const runner = new DialogueRunner(DIALOGUE['dlg.rustle-leaf']!, store);
    const view = runner.start(); // auto router -> turnin
    expect(view?.choices[0]?.label).toContain('Welcome aboard');

    runner.choose(view!.choices[0]!.index);
    expect(store.hasCharacter('char.leaf')).toBe(true);
    expect(store.itemCount('item.glow-cap')).toBe(0);
    expect(store.gold).toBe(goldBefore + 50);
    expect(store.questState('quest.recruit-leaf')).toBe('completed');
  });

  it('Dark Lord fork: redemption path only appears with the twist known AND the Crown of Light', () => {
    // Without the flag/crown, only the combat choice is offered.
    let runner = new DialogueRunner(DIALOGUE['dlg.dark-lord']!, store);
    let view = runner.start();
    expect(view?.choices.length).toBe(1);
    expect(view?.choices[0]?.label).toContain('end you');

    // With the twist known and the Crown of Light held, redemption unlocks.
    store.setFlag('heard_dark_lord_was_light', true);
    store.addItem('item.crown-of-light', 1);
    runner = new DialogueRunner(DIALOGUE['dlg.dark-lord']!, store);
    view = runner.start();
    expect(view?.choices.length).toBe(2);
    const redeem = view!.choices.find((c) => c.label.includes('Crown of Light'))!;
    runner.choose(redeem.index); // -> redemption node
    view = runner.choose(runner.view()!.choices[0]!.index); // "No one has to die today."
    expect(store.getFlag('ending_redemption')).toBe(true);
    expect(store.hasItem('item.crown-of-light')).toBe(false);
    expect(store.hasItem('item.shadow-crown')).toBe(true);
  });

  it('Dark Lord fork: combat choice raises a start-battle side effect against the Tyrant', () => {
    const runner = new DialogueRunner(DIALOGUE['dlg.dark-lord']!, store);
    const view = runner.start();
    const fight = view!.choices.find((c) => c.label.includes('end you'))!;
    runner.choose(fight.index);
    expect(store.getFlag('ending_combat')).toBe(true);
    const battle = runner.sideEffects.find((e) => e.startBattle)?.startBattle;
    expect(battle?.enemyIds).toEqual(['enemy.mycelial-tyrant']);
    expect(battle?.victoryFlag).toBe('dark_lord_defeated');
  });

  it('shopkeeper choice surfaces an open-shop side effect', () => {
    const runner = new DialogueRunner(DIALOGUE['dlg.shopkeeper']!, store);
    const view = runner.start();
    const show = view!.choices.find((c) => c.label.includes('shop'))!;
    runner.choose(show.index);
    expect(runner.sideEffects.some((e) => e.openShop === 'shop.mycelia-general')).toBe(true);
  });
});
