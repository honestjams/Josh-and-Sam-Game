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
