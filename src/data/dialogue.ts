import type { DialogueTree, Id } from './types';

/**
 * Dialogue trees. Nodes may run `onEnter` consequences and offer `choices`
 * gated by `conditions`. This same structure drives the branching main story
 * (including the eventual Dark Lord redemption/combat fork), so the fork is
 * data, not a hardcoded cutscene. The twist is seeded here early.
 */
export const DIALOGUE: Record<Id, DialogueTree> = {
  // --- Elder Morel: hands out the main quest, seeds the twist -------------
  'dlg.elder-morel': {
    id: 'dlg.elder-morel',
    startNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        speaker: 'Elder Morel',
        text: "Ah, young one. The King's roots are sickening — the mushrooms wilt a little more each dawn.",
        next: 'ask',
      },
      ask: {
        id: 'ask',
        speaker: 'Elder Morel',
        text: 'Will you go to the King\'s Grove and learn what poisons him?',
        choices: [
          {
            text: "I'll go. (Accept the quest)",
            conditions: [{ type: 'quest-state', questId: 'quest.reach-grove', state: 'unstarted' }],
            consequences: [{ type: 'start-quest', questId: 'quest.reach-grove' }],
            next: 'accepted',
          },
          {
            text: 'Tell me about the Dark Lord.',
            next: 'twist',
          },
          {
            text: 'Not yet.',
            next: undefined,
          },
        ],
      },
      accepted: {
        id: 'accepted',
        speaker: 'Elder Morel',
        text: 'Bless you. Take the Amberwood Route east, through the Rootway. Mind the blight-things.',
        next: 'twist',
      },
      twist: {
        id: 'twist',
        speaker: 'Elder Morel',
        text:
          'The Dark Lord... some of us are old enough to remember. He walked in the light once, ' +
          'among these very groves. What turned him, no one will say. Grief, perhaps.',
        onEnter: [{ type: 'set-flag', flag: 'heard_dark_lord_was_light', value: true }],
        next: undefined,
      },
    },
  },

  // --- Rustle the Leaf: recruitment sidequest -----------------------------
  'dlg.rustle-leaf': {
    id: 'dlg.rustle-leaf',
    startNodeId: 'router',
    nodes: {
      // Branch on quest/inventory state — pure data-driven flow control.
      router: {
        id: 'router',
        speaker: 'Rustle',
        text: '',
        auto: true,
        choices: [
          {
            text: '(recruited)',
            conditions: [{ type: 'has-party-member', characterId: 'char.leaf' }],
            next: 'joined',
          },
          {
            text: '(has 3 glow caps)',
            conditions: [
              { type: 'quest-state', questId: 'quest.recruit-leaf', state: 'active' },
              { type: 'has-item', itemId: 'item.glow-cap', qty: 3 },
            ],
            next: 'turnin',
          },
          {
            text: '(quest active)',
            conditions: [{ type: 'quest-state', questId: 'quest.recruit-leaf', state: 'active' }],
            next: 'remind',
          },
          { text: '(intro)', next: 'intro' },
        ],
      },
      intro: {
        id: 'intro',
        speaker: 'Rustle',
        text: 'Oh! A traveller! The wind stole three of my Glow Caps — blew them all over the Hollow. Help me find them?',
        choices: [
          {
            text: "Sure, I'll look for them.",
            consequences: [{ type: 'start-quest', questId: 'quest.recruit-leaf' }],
            next: 'thanks',
          },
          { text: 'Maybe later.', next: undefined },
        ],
      },
      thanks: {
        id: 'thanks',
        speaker: 'Rustle',
        text: 'You will? Oh, thank you! Three Glow Caps. I\'ll make it worth your while!',
        next: undefined,
      },
      remind: {
        id: 'remind',
        speaker: 'Rustle',
        text: 'Three Glow Caps, remember! They glow, so look in the shady corners.',
        next: undefined,
      },
      turnin: {
        id: 'turnin',
        speaker: 'Rustle',
        text: 'You found them all! Wonderful! Here — take this gold, and... would you mind if I came along?',
        choices: [
          {
            text: 'Welcome aboard, Rustle!',
            // Gold is granted by the quest's `rewards` on completion (single
            // source of truth) — no explicit give-gold here, to avoid double pay.
            consequences: [
              { type: 'take-item', itemId: 'item.glow-cap', qty: 3 },
              { type: 'complete-quest', questId: 'quest.recruit-leaf' },
              { type: 'recruit', characterId: 'char.leaf' },
            ],
            next: 'joined',
          },
        ],
      },
      joined: {
        id: 'joined',
        speaker: 'Rustle',
        text: "Onward! I'll cut anything that gets in our way. All of them, at once, even!",
        next: undefined,
      },
    },
  },

  // --- Shopkeeper ---------------------------------------------------------
  'dlg.shopkeeper': {
    id: 'dlg.shopkeeper',
    startNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        speaker: 'Fen the Trader',
        text: 'Warm light to you, traveller. Care to see my wares?',
        choices: [
          {
            text: 'Show me the shop.',
            consequences: [{ type: 'open-shop', shopId: 'shop.mycelia-general' }],
            next: undefined,
          },
          { text: 'Just browsing.', next: undefined },
        ],
      },
    },
  },

  // --- Villager (flavour + hint) ------------------------------------------
  'dlg.villager-boletta': {
    id: 'dlg.villager-boletta',
    startNodeId: 'start',
    nodes: {
      start: {
        id: 'start',
        speaker: 'Boletta',
        text: 'The crafting stump by my hut still works — bring ingredients and it\'ll brew potions for you.',
        next: undefined,
      },
    },
  },
};
