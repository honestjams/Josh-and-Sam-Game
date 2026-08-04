import type { Id, ShopDefinition } from './types';

/** Shop inventories, defined in data per the data-driven content rule. */
export const SHOPS: Record<Id, ShopDefinition> = {
  'shop.mycelia-general': {
    id: 'shop.mycelia-general',
    name: "Fen's Sundries",
    stock: [
      { itemId: 'item.minor-potion' },
      { itemId: 'item.spore-tonic' },
      { itemId: 'item.oak-charm' },
      { itemId: 'item.spring-water' },
    ],
    buyBackRate: 0.5,
  },
};
