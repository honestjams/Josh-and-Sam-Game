import type { Id } from '@/data/types';

/**
 * The serialized save blob. This is the ONLY shape that persists. Everything
 * that matters for a save — party, inventory, gold, quest flags, story branch
 * choices, world position, recruited allies — round-trips through here.
 *
 * Keep this shape flat and primitive (no class instances, no functions) so it
 * survives `JSON.stringify` and any future backend (e.g. Supabase) equally.
 * Bump `version` and add a migration when the shape changes.
 */
export const SAVE_VERSION = 1;

/** Per-character runtime state (definitions live in data; this is the delta). */
export interface CharacterSaveState {
  id: Id;
  level: number;
  xp: number;
  currentHp: number;
  currentMp: number;
  /** Equipped item ids by slot; slot vocabulary expands with the equip system. */
  equipped: Record<string, Id | null>;
}

export interface InventoryStackSave {
  itemId: Id;
  qty: number;
}

export interface QuestSaveState {
  questId: Id;
  state: 'active' | 'completed';
}

export interface WorldPosition {
  mapId: string;
  /** Tile coordinates on the logical grid. */
  tileX: number;
  tileY: number;
  /** Facing, for restoring the player's orientation. */
  facing: 'up' | 'down' | 'left' | 'right';
}

export interface SaveBlob {
  version: number;
  /** Player-facing save name / slot label. */
  name: string;
  savedAt: string; // ISO timestamp

  gold: number;
  /** Story/quest flags and branch choices. Drives dialogue and endings. */
  flags: Record<string, boolean>;

  /** All characters the player owns (recruited), including the hero. */
  roster: CharacterSaveState[];
  /** Ordered active party (ids), max 3. First is the hero/leader. */
  activeParty: Id[];

  inventory: InventoryStackSave[];
  quests: QuestSaveState[];

  position: WorldPosition;
}
