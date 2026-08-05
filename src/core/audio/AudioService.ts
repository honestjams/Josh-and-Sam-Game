/**
 * Audio, behind a storage-agnostic-style interface so real audio files can be
 * dropped in later without touching game code (mirrors SaveService). The v1
 * implementation synthesises everything with the Web Audio API — cozy chiptune
 * SFX and generative per-area music — so there are zero audio asset files and
 * it works in the single-file artifact.
 */
export type SfxName =
  | 'step'
  | 'talk'
  | 'pickup'
  | 'confirm'
  | 'cancel'
  | 'coin'
  | 'hit'
  | 'heal'
  | 'victory'
  | 'defeat'
  | 'transition';

export type MusicTrack = 'title' | 'hub' | 'cave' | 'blighted' | 'battle' | 'none';

export interface AudioService {
  /** Must be called from a user gesture to unlock the AudioContext. */
  init(): void;
  playSfx(name: SfxName): void;
  playMusic(track: MusicTrack): void;
  stopMusic(): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  toggleMute(): boolean;
}
