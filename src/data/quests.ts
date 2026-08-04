import type { Id, QuestDefinition } from './types';

/** Quest definitions. The slice ships one main step and one gold sidequest. */
export const QUESTS: Record<Id, QuestDefinition> = {
  'quest.reach-grove': {
    id: 'quest.reach-grove',
    title: "Reach the King's Grove",
    description:
      "The Mushroom King is falling ill. Cross the Amberwood Route, clear the " +
      "Rootway dungeon, and reach the King's Grove to learn what poisons him.",
    isMainQuest: true,
    objectives: [
      'Speak with Elder Morel in Mycelia Hollow.',
      'Travel the Amberwood Route to the Rootway.',
      'Defeat the Rot Warden blocking the Grove path.',
    ],
    rewards: { itemIds: ['item.grove-map'] },
  },
  // The two heroes the player did NOT pick are met and recruited on the road.
  // These are seeded when the hero is chosen and completed later in the story.
  'quest.recruit-squirrel': {
    id: 'quest.recruit-squirrel',
    title: 'The Squirrel Sentinel',
    description: 'Nutkin guards a forest crossing. Earn their trust to travel together.',
    isMainQuest: false,
    objectives: ['Meet Nutkin on the Amberwood Route.'],
    rewards: {},
  },
  'quest.recruit-gnome': {
    id: 'quest.recruit-gnome',
    title: 'The Gnome of the Glade',
    description: 'Fizzwick tends a hidden glade. Help them and they will join you.',
    isMainQuest: false,
    objectives: ['Find Fizzwick in the Rootway.'],
    rewards: {},
  },
  'quest.recruit-woodelf': {
    id: 'quest.recruit-woodelf',
    title: 'The Wandering Elf',
    description: 'Sylwen roams the deep wood. Cross paths and prove yourself an ally.',
    isMainQuest: false,
    objectives: ['Encounter Sylwen beyond the Rootway.'],
    rewards: {},
  },
  'quest.recruit-leaf': {
    id: 'quest.recruit-leaf',
    title: 'A Leaf on the Wind',
    description:
      'Rustle the Leaf lost three Glow Caps to the wind. Recover them and the ' +
      'Leaf will join your journey — and pay you for the trouble.',
    isMainQuest: false,
    objectives: [
      'Talk to Rustle near the village spring.',
      'Bring 3 Glow Caps to Rustle.',
    ],
    rewards: { gold: 50 },
  },
};
