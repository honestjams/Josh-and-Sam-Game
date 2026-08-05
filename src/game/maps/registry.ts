import type { Id } from '@/data/types';
import type { MusicTrack } from '@/core/audio/AudioService';
import kingdomRaw from '../../../public/assets/maps/mycelia-hollow.tmj?raw';
import caveRaw from '../../../public/assets/maps/cave.tmj?raw';
import blightRaw from '../../../public/assets/maps/blighted-reach.tmj?raw';

/**
 * The world map registry. Each area's geometry lives in a Tiled `.tmj`
 * (embedded so it bundles into the single-file build); presentation and rules
 * (background, music, random-encounter table) are declared here, typed.
 */
export interface EncounterTable {
  pool: Id[];
  /** Chance per step to trigger a battle. */
  rate: number;
}

export interface MapDef {
  id: string;
  tmjKey: string;
  backgroundKey: string;
  displayName: string;
  music: MusicTrack;
  encounters?: EncounterTable;
  data: object;
}

export const MAPS: Record<string, MapDef> = {
  'mycelia-hollow': {
    id: 'mycelia-hollow',
    tmjKey: 'map.mycelia-hollow',
    backgroundKey: 'bg.village',
    displayName: 'The Mushroom Kingdom',
    music: 'hub',
    data: JSON.parse(kingdomRaw) as object,
  },
  cave: {
    id: 'cave',
    tmjKey: 'map.cave',
    backgroundKey: 'bg.cave',
    displayName: 'The Rootway',
    music: 'cave',
    encounters: { pool: ['enemy.blight-mite', 'enemy.gloom-moth', 'enemy.wither-cap', 'enemy.dark-minion'], rate: 0.12 },
    data: JSON.parse(caveRaw) as object,
  },
  'blighted-reach': {
    id: 'blighted-reach',
    tmjKey: 'map.blighted-reach',
    backgroundKey: 'bg.blighted-reach',
    displayName: 'The Blighted Reach',
    music: 'blighted',
    encounters: { pool: ['enemy.dark-minion', 'enemy.dark-brute'], rate: 0.14 },
    data: JSON.parse(blightRaw) as object,
  },
};

export function getMap(id: string): MapDef {
  return MAPS[id] ?? MAPS['mycelia-hollow']!;
}
