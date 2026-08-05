import type { SaveService } from '@/core/save/SaveService';
import { LocalStorageSaveService } from '@/core/save/LocalStorageSaveService';
import type { AudioService } from '@/core/audio/AudioService';
import { WebAudioService } from '@/core/audio/WebAudioService';

/**
 * Service wiring. Concrete services are chosen here and nowhere else, so
 * swapping localStorage for a Supabase backend — or synthesised audio for real
 * audio files — is a one-line change that touches no game or scene code.
 */
export const saveService: SaveService = new LocalStorageSaveService();
export const audioService: AudioService = new WebAudioService();
