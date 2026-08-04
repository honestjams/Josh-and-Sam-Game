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

  // --- The Mushroom King: heart of the story, gives the main quest --------
  'dlg.mushroom-king': {
    id: 'dlg.mushroom-king',
    startNodeId: 'router',
    nodes: {
      router: {
        id: 'router',
        speaker: 'The Mushroom King',
        text: '',
        auto: true,
        choices: [
          {
            text: '(grove cleansed)',
            conditions: [{ type: 'flag', flag: 'grove_cleansed', equals: true }],
            next: 'thanks',
          },
          {
            text: '(quest active)',
            conditions: [{ type: 'quest-state', questId: 'quest.reach-grove', state: 'active' }],
            next: 'urging',
          },
          { text: '(first meeting)', next: 'intro' },
        ],
      },
      intro: {
        id: 'intro',
        speaker: 'The Mushroom King',
        text:
          'Come closer, child of the light. I am the Mushroom King — my roots reach every living thing. ' +
          'But the Dark Lord has poisoned them, and I am... fading.',
        next: 'plea',
      },
      plea: {
        id: 'plea',
        speaker: 'The Mushroom King',
        text: 'Will you journey to my grove beyond the Rootway and cleanse the poison at its source?',
        choices: [
          {
            text: 'I will, your Majesty.',
            conditions: [{ type: 'quest-state', questId: 'quest.reach-grove', state: 'unstarted' }],
            consequences: [{ type: 'start-quest', questId: 'quest.reach-grove' }],
            next: 'blessing',
          },
          { text: 'Tell me of the Dark Lord.', next: 'twist' },
          { text: 'I need time to prepare.', next: undefined },
        ],
      },
      blessing: {
        id: 'blessing',
        speaker: 'The Mushroom King',
        text: 'Then take my blessing, and this — a token of the light. Go east, through Amberwood.',
        onEnter: [{ type: 'give-item', itemId: 'item.holy-spore-jar', qty: 1 }],
        next: 'twist',
      },
      twist: {
        id: 'twist',
        speaker: 'The Mushroom King',
        text:
          'The Dark Lord... he was not always dark. He walked among us in the light, long ago. ' +
          'Remember that, when you find him. Not every battle is won with a blade.',
        onEnter: [{ type: 'set-flag', flag: 'heard_dark_lord_was_light', value: true }],
        next: undefined,
      },
      urging: {
        id: 'urging',
        speaker: 'The Mushroom King',
        text: 'Hurry, brave one. Each day the poison spreads further through my roots.',
        next: undefined,
      },
      thanks: {
        id: 'thanks',
        speaker: 'The Mushroom King',
        text: 'The poison recedes... I can feel the light returning. You have my eternal gratitude.',
        next: undefined,
      },
    },
  },

  // --- The Dark Lord: the endgame fork (redemption OR combat) -------------
  // Fully data-driven: the reconciliation path only appears if the player
  // learned the twist (heard_dark_lord_was_light) AND carries the Crown of
  // Light. Otherwise only the blade remains. This is the payoff of the seed.
  'dlg.dark-lord': {
    id: 'dlg.dark-lord',
    startNodeId: 'router',
    nodes: {
      router: {
        id: 'router',
        speaker: 'The Mycelial Tyrant',
        text: '',
        auto: true,
        choices: [
          { text: '(redeemed)', conditions: [{ type: 'flag', flag: 'ending_redemption', equals: true }], next: 'redeemed' },
          { text: '(confront)', next: 'confront' },
        ],
      },
      confront: {
        id: 'confront',
        speaker: 'The Mycelial Tyrant',
        text: 'So. The little spark of the King reaches me at last. I am the Enduring. I will outlast your light.',
        choices: [
          {
            text: 'You were of the light once. Come back. (offer the Crown of Light)',
            conditions: [
              { type: 'flag', flag: 'heard_dark_lord_was_light' },
              { type: 'has-item', itemId: 'item.crown-of-light' },
            ],
            next: 'redemption',
          },
          {
            text: 'Then I will end you.',
            consequences: [
              { type: 'set-flag', flag: 'ending_combat', value: true },
              { type: 'start-battle', enemyIds: ['enemy.mycelial-tyrant'], isMiniboss: true, victoryFlag: 'dark_lord_defeated' },
            ],
            next: undefined,
          },
        ],
      },
      redemption: {
        id: 'redemption',
        speaker: 'The Mycelial Tyrant',
        text:
          '...That crown. I wore its twin, once, beneath the King\'s light. I had forgotten. ' +
          'You would truly offer this, instead of your blade?',
        choices: [
          {
            text: 'No one has to die today.',
            consequences: [
              { type: 'set-flag', flag: 'ending_redemption', value: true },
              { type: 'take-item', itemId: 'item.crown-of-light', qty: 1 },
              { type: 'give-item', itemId: 'item.shadow-crown', qty: 1 },
            ],
            next: 'redeemed',
          },
        ],
      },
      redeemed: {
        id: 'redeemed',
        speaker: 'Amanos, of the Light',
        text: 'The shadow lifts from the roots. The mushrooms will grow again. Thank you, child. Let us go home.',
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
