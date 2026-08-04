import type { SaveService } from '@/core/save/SaveService';
import { LocalStorageSaveService } from '@/core/save/LocalStorageSaveService';

/**
 * Service wiring. The concrete SaveService is chosen here and nowhere else, so
 * swapping localStorage for a Supabase-backed implementation later is a
 * one-line change and touches no game or scene code.
 */
export const saveService: SaveService = new LocalStorageSaveService();
