import type { SaveService, SaveSlotMeta } from './SaveService';
import type { SaveBlob } from './types';

/**
 * localStorage-backed SaveService for v1. Each slot is one JSON blob under a
 * namespaced key. Async signatures are honoured (returning resolved promises)
 * so a future Supabase implementation is a drop-in with zero call-site edits.
 */
const KEY_PREFIX = 'mycelia-hollow:save:';

export class LocalStorageSaveService implements SaveService {
  private keyFor(slotId: string): string {
    return `${KEY_PREFIX}${slotId}`;
  }

  async list(): Promise<SaveSlotMeta[]> {
    const metas: SaveSlotMeta[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(KEY_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const blob = JSON.parse(raw) as SaveBlob;
        metas.push({
          slotId: key.slice(KEY_PREFIX.length),
          name: blob.name,
          savedAt: blob.savedAt,
        });
      } catch {
        // Corrupt slot — skip it rather than crash the load screen.
      }
    }
    return metas.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  }

  async load(slotId: string): Promise<SaveBlob | null> {
    const raw = localStorage.getItem(this.keyFor(slotId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SaveBlob;
    } catch {
      return null;
    }
  }

  async save(slotId: string, blob: SaveBlob): Promise<void> {
    localStorage.setItem(this.keyFor(slotId), JSON.stringify(blob));
  }

  async remove(slotId: string): Promise<void> {
    localStorage.removeItem(this.keyFor(slotId));
  }

  async hasAny(): Promise<boolean> {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(KEY_PREFIX)) return true;
    }
    return false;
  }
}
