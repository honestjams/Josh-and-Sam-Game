import type { AudioService, MusicTrack, SfxName } from './AudioService';

const MUTE_KEY = 'mycelia-hollow:muted';

interface TrackConfig {
  /** MIDI-ish semitone offsets from the root for the melody scale. */
  scale: number[];
  root: number; // base frequency (Hz)
  beatMs: number;
  wave: OscillatorType;
  melodyGain: number;
  /** Probability a melody note plays on a given beat. */
  density: number;
  /** Optional sustained drone (Hz offsets from root) for ominous areas. */
  drone?: number[];
  droneGain?: number;
}

const TRACKS: Record<Exclude<MusicTrack, 'none'>, TrackConfig> = {
  // Warm, gentle major pentatonic.
  title: { scale: [0, 2, 4, 7, 9, 12], root: 261.6, beatMs: 620, wave: 'triangle', melodyGain: 0.16, density: 0.55 },
  hub: { scale: [0, 2, 4, 7, 9, 12, 16], root: 293.7, beatMs: 500, wave: 'triangle', melodyGain: 0.15, density: 0.6 },
  // Sparse, mysterious minor.
  cave: { scale: [0, 3, 5, 7, 10, 12], root: 220.0, beatMs: 640, wave: 'sine', melodyGain: 0.14, density: 0.42, drone: [0, 7], droneGain: 0.05 },
  // Low, dissonant, ominous.
  blighted: { scale: [0, 1, 5, 6, 8, 11], root: 174.6, beatMs: 700, wave: 'sawtooth', melodyGain: 0.1, density: 0.4, drone: [0, 6], droneGain: 0.07 },
  // Faster, tense.
  battle: { scale: [0, 2, 3, 5, 7, 8, 10], root: 246.9, beatMs: 300, wave: 'square', melodyGain: 0.12, density: 0.85 },
};

/** Web Audio implementation: synthesised SFX + generative music loops. */
export class WebAudioService implements AudioService {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private muted = false;

  private timer: ReturnType<typeof setInterval> | null = null;
  private droneNodes: OscillatorNode[] = [];
  private currentTrack: MusicTrack = 'none';
  private beat = 0;

  constructor() {
    this.muted = localStorage.getItem(MUTE_KEY) === '1';
  }

  init(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.5;
    this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.9;
    this.sfxGain.connect(this.master);
  }

  // --- SFX ----------------------------------------------------------------

  playSfx(name: SfxName): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'step':
        this.blip(70 + Math.random() * 20, 0.07, 'sine', 0.16, t, 0.0);
        break;
      case 'talk':
        this.blip(420, 0.05, 'square', 0.12, t);
        this.blip(520, 0.05, 'square', 0.1, t + 0.06);
        break;
      case 'confirm':
        this.blip(520, 0.06, 'square', 0.14, t);
        this.blip(700, 0.08, 'square', 0.12, t + 0.06);
        break;
      case 'cancel':
        this.blip(300, 0.09, 'square', 0.12, t);
        break;
      case 'pickup':
        this.arp([523, 659, 784], 0.09, 'triangle', 0.16, t);
        break;
      case 'coin':
        this.blip(988, 0.05, 'square', 0.14, t);
        this.blip(1319, 0.1, 'square', 0.12, t + 0.05);
        break;
      case 'heal':
        this.arp([440, 554, 659, 880], 0.1, 'sine', 0.14, t);
        break;
      case 'hit':
        this.noise(0.12, 0.25, t);
        this.blip(110, 0.12, 'sawtooth', 0.18, t);
        break;
      case 'victory':
        this.arp([523, 659, 784, 1047], 0.14, 'triangle', 0.18, t);
        break;
      case 'defeat':
        this.arp([392, 330, 262, 196], 0.2, 'sawtooth', 0.16, t);
        break;
      case 'transition':
        this.arp([392, 523, 659], 0.12, 'sine', 0.14, t);
        break;
    }
  }

  private blip(freq: number, dur: number, wave: OscillatorType, gain: number, when: number, attack = 0.005): void {
    if (!this.ctx || !this.sfxGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + attack + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(g).connect(this.sfxGain);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  private arp(freqs: number[], step: number, wave: OscillatorType, gain: number, when: number): void {
    freqs.forEach((f, i) => this.blip(f, step * 1.4, wave, gain, when + i * step));
  }

  private noise(dur: number, gain: number, when: number): void {
    if (!this.ctx || !this.sfxGain) return;
    const n = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(this.sfxGain);
    src.start(when);
  }

  // --- Music --------------------------------------------------------------

  playMusic(track: MusicTrack): void {
    if (track === this.currentTrack) return;
    this.currentTrack = track;
    this.stopLoop();
    if (track === 'none' || !this.ctx || !this.musicGain) return;

    const cfg = TRACKS[track];
    this.beat = 0;

    // Sustained drone for ominous areas.
    for (const semi of cfg.drone ?? []) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = cfg.root * Math.pow(2, semi / 12) * 0.5;
      g.gain.value = cfg.droneGain ?? 0.05;
      osc.connect(g).connect(this.musicGain);
      osc.start();
      this.droneNodes.push(osc);
    }

    this.timer = setInterval(() => this.tick(cfg), cfg.beatMs);
    this.tick(cfg);
  }

  private tick(cfg: TrackConfig): void {
    if (!this.ctx || !this.musicGain || this.muted) return;
    const t = this.ctx.currentTime + 0.02;
    this.beat++;

    // Bass note every other beat.
    if (this.beat % 2 === 0) {
      const bassSemi = cfg.scale[(this.beat / 2) % cfg.scale.length]!;
      this.musicNote(cfg.root * Math.pow(2, bassSemi / 12) * 0.5, cfg.beatMs / 1000 * 1.6, cfg.wave, 0.09, t);
    }
    // Melody note with some probability.
    if (Math.random() < cfg.density) {
      const semi = cfg.scale[Math.floor(Math.random() * cfg.scale.length)]!;
      const freq = cfg.root * Math.pow(2, semi / 12);
      this.musicNote(freq, cfg.beatMs / 1000 * 0.9, cfg.wave, cfg.melodyGain, t);
    }
  }

  private musicNote(freq: number, dur: number, wave: OscillatorType, gain: number, when: number): void {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1800;
    osc.type = wave;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(g).connect(lp).connect(this.musicGain);
    osc.start(when);
    osc.stop(when + dur + 0.05);
  }

  stopMusic(): void {
    this.currentTrack = 'none';
    this.stopLoop();
  }

  private stopLoop(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    for (const osc of this.droneNodes) { try { osc.stop(); } catch { /* already stopped */ } }
    this.droneNodes = [];
  }

  // --- Mute ---------------------------------------------------------------

  setMuted(muted: boolean): void {
    this.muted = muted;
    localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.05);
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }
}
