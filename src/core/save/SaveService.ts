import type { SaveBlob } from './types';

/**
 * Storage-agnostic save interface. Game code depends only on this; the
 * concrete backend (localStorage today, Supabase later) is injected once at
 * startup. Dropping in cloud saves means writing a new implementer — no game
 * code changes. All methods are async so a network backend fits the same shape.
 */
export interface SaveSlotMeta {
  slotId: string;
  name: string;
  savedAt: string;
}

export interface SaveService {
  /** List saved slots (for the Continue / load screen). */
  list(): Promise<SaveSlotMeta[]>;
  /** Load a slot's blob, or null if empty. */
  load(slotId: string): Promise<SaveBlob | null>;
  /** Write a blob to a slot. */
  save(slotId: string, blob: SaveBlob): Promise<void>;
  /** Delete a slot. */
  remove(slotId: string): Promise<void>;
  /** True if at least one slot has data (drives the Continue button). */
  hasAny(): Promise<boolean>;
}

/** The single default slot used by the vertical slice. */
export const DEFAULT_SLOT = 'slot-1';
