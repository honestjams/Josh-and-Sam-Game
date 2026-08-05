import * as Phaser from 'phaser';
import { SceneKeys, TILE_SIZE, DESIGN_WIDTH, DESIGN_HEIGHT, PALETTE } from '@/game/config';
import { NPCS, CHARACTERS } from '@/data';
import { ASSETS_BY_KEY } from '@/game/assets/manifest';
import { getMap, type MapDef } from '@/game/maps/registry';
import { gameStore } from '@/core/store/GameStore';
import { saveService, audioService } from '@/core/services';
import { DEFAULT_SLOT } from '@/core/save/SaveService';
import { eventBus } from '@/core/events/EventBus';
import type { WorldPosition } from '@/core/save/types';

type Facing = WorldPosition['facing'];
const FACE_DELTA: Record<Facing, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

interface NpcInstance { tileX: number; tileY: number; npcId: string; }
interface PropInstance { tileX: number; tileY: number; action: string; }
interface PickupInstance { tileX: number; tileY: number; flag: string; itemId: string; sprite: Phaser.GameObjects.Image; }
interface TransitionInstance { tileX: number; tileY: number; target: string; entryX: number; entryY: number; label: string; }
interface BattleInstance {
  tileX: number; tileY: number; enemyIds: string[]; victoryFlag: string;
  isMiniboss: boolean; block: boolean; label: string; sprite?: Phaser.GameObjects.Image;
}

/**
 * The overworld: a painterly background beneath a logical grid. Movement is
 * grid-based; collision comes from the map's `walkable`/`collision` object
 * layers (art-aligned, no visual tileset). NPCs painted into the scene are
 * invisible interaction zones. Handles map-to-map travel, random encounters,
 * boss gates, dialogue, save/load, and per-area music.
 */
export class OverworldScene extends Phaser.Scene {
  private mapDef!: MapDef;
  private collision: Phaser.Geom.Rectangle[] = [];
  private walkableZones: Phaser.Geom.Rectangle[] = [];
  private npcs: NpcInstance[] = [];
  private props: PropInstance[] = [];
  private pickups: PickupInstance[] = [];
  private transitions: TransitionInstance[] = [];
  private battles: BattleInstance[] = [];

  private player!: Phaser.GameObjects.Image;
  private playerTile = { x: 14, y: 11 };
  private playerBaseScale = 1;
  private facing: Facing = 'down';
  private stepParity = false;
  private isMoving = false;
  private transitioning = false;
  private encounterCooldown = 3;

  private dialogueActive = false;
  private frozenBy = new Set<string>();

  private mapWidth = 30;
  private mapHeight = 17;

  private goldText!: Phaser.GameObjects.Text;
  private questText!: Phaser.GameObjects.Text;
  private areaText!: Phaser.GameObjects.Text;
  private prompt!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  private unsub: Array<() => void> = [];

  // Parsed-object staging (reset per (re)build).
  private defaultStart = { x: 14, y: 11 };
  private pendingNpcs: Array<{ tileX: number; tileY: number; npcId: string; render: boolean }> = [];
  private pendingPickups: Array<{ tileX: number; tileY: number; flag: string; itemId: string }> = [];

  constructor() {
    super(SceneKeys.Overworld);
  }

  create(): void {
    this.resetState();
    this.mapDef = getMap(gameStore.position.mapId);
    this.buildFromMap();
    this.drawBackground();
    this.spawnObjects();
    this.spawnPlayer();
    this.setupInput();
    this.buildHud();
    this.wireEvents();
    audioService.playMusic(this.mapDef.music);
    this.checkEnding();
    this.cameras.main.fadeIn(250);
  }

  /** Scenes are reused across restarts, so clear all per-map state up front. */
  private resetState(): void {
    this.collision = [];
    this.walkableZones = [];
    this.npcs = [];
    this.props = [];
    this.pickups = [];
    this.transitions = [];
    this.battles = [];
    this.pendingNpcs = [];
    this.pendingPickups = [];
    this.isMoving = false;
    this.transitioning = false;
    this.frozenBy.clear();
    this.dialogueActive = false;
    this.encounterCooldown = 3;
  }

  // --- Map parsing --------------------------------------------------------

  private buildFromMap(): void {
    const map = this.make.tilemap({ key: this.mapDef.tmjKey });
    this.mapWidth = map.width;
    this.mapHeight = map.height;

    for (const obj of map.getObjectLayer('walkable')?.objects ?? []) {
      this.walkableZones.push(new Phaser.Geom.Rectangle(obj.x!, obj.y!, obj.width!, obj.height!));
    }
    for (const obj of map.getObjectLayer('collision')?.objects ?? []) {
      this.collision.push(new Phaser.Geom.Rectangle(obj.x!, obj.y!, obj.width!, obj.height!));
    }

    for (const obj of map.getObjectLayer('objects')?.objects ?? []) {
      const tileX = Math.floor((obj.x ?? 0) / TILE_SIZE);
      const tileY = Math.floor((obj.y ?? 0) / TILE_SIZE);
      const p = this.readProps(obj);
      switch (obj.type) {
        case 'player-start':
          this.defaultStart = { x: tileX, y: tileY };
          break;
        case 'npc':
          this.pendingNpcs.push({ tileX, tileY, npcId: String(p.npcId), render: p.render === true });
          break;
        case 'prop':
          this.props.push({ tileX, tileY, action: String(p.action ?? '') });
          break;
        case 'pickup':
          this.pendingPickups.push({ tileX, tileY, flag: String(p.flag), itemId: String(p.itemId) });
          break;
        case 'transition':
          this.transitions.push({
            tileX, tileY, target: String(p.target),
            entryX: Number(p.entryX ?? tileX), entryY: Number(p.entryY ?? tileY),
            label: String(p.label ?? p.target),
          });
          break;
        case 'battle':
          this.battles.push({
            tileX, tileY,
            enemyIds: String(p.enemyIds).split(',').filter(Boolean),
            victoryFlag: String(p.victoryFlag),
            isMiniboss: p.isMiniboss === true,
            block: p.block !== false,
            label: String(p.label ?? 'A foe'),
          });
          break;
      }
    }
  }

  private readProps(obj: Phaser.Types.Tilemaps.TiledObject): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const prop of obj.properties ?? []) out[prop.name] = prop.value;
    return out;
  }

  // --- Rendering ----------------------------------------------------------

  private drawBackground(): void {
    this.add
      .image(0, 0, this.mapDef.backgroundKey)
      .setOrigin(0, 0)
      .setDisplaySize(DESIGN_WIDTH, DESIGN_HEIGHT)
      .setDepth(-100);
  }

  private spawnObjects(): void {
    // NPCs are painted into the background — only render the flagged ones.
    for (const n of this.pendingNpcs) {
      this.npcs.push({ tileX: n.tileX, tileY: n.tileY, npcId: n.npcId });
      if (n.render) {
        const key = NPCS[n.npcId]?.spriteKey ?? n.npcId;
        this.placeSprite(n.tileX, n.tileY, key);
      }
    }
    // Boss/encounter markers that ARE drawn (not in the art) — unless defeated.
    for (const b of this.battles) {
      if (gameStore.getFlag(b.victoryFlag)) continue;
      if (this.textures.exists('enemy.rot-warden') || true) {
        const key = b.isMiniboss ? (b.enemyIds[0] ?? 'enemy.rot-warden') : 'enemy.dark-minion';
        b.sprite = this.placeSprite(b.tileX, b.tileY, key);
      }
    }
    // Pickups — skip any already collected.
    for (const p of this.pendingPickups) {
      if (gameStore.getFlag(p.flag)) continue;
      const sprite = this.add.image(this.centerX(p.tileX), this.centerY(p.tileY), this.textureKey('item.glow-cap'));
      sprite.setDisplaySize(TILE_SIZE * 0.7, TILE_SIZE * 0.7).setTint(PALETTE.amberGlow).setDepth(this.centerY(p.tileY));
      // Gentle bob + glow to draw the eye (cozy collectible feel).
      this.tweens.add({ targets: sprite, y: sprite.y - 5, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: sprite, alpha: 0.6, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.pickups.push({ ...p, sprite });
    }
  }

  private placeSprite(tileX: number, tileY: number, key: string): Phaser.GameObjects.Image {
    const img = this.add.image(this.centerX(tileX), this.centerY(tileY), this.textureKey(key));
    img.setOrigin(0.5, 0.7);
    const entry = ASSETS_BY_KEY[key];
    if (entry && img.height) img.setScale(entry.height / img.height);
    img.setDepth(this.centerY(tileY));
    return img;
  }

  private textureKey(key: string): string {
    return this.textures.exists(key) ? key : 'char.squirrel';
  }

  private spawnPlayer(): void {
    const pos = gameStore.position;
    this.playerTile =
      pos.mapId === this.mapDef.id ? { x: pos.tileX, y: pos.tileY } : { ...this.defaultStart };
    this.facing = pos.facing ?? 'down';

    const heroKey = CHARACTERS[gameStore.activeParty[0] ?? '']?.spriteKey ?? 'char.squirrel';
    this.player = this.add.image(this.centerX(this.playerTile.x), this.centerY(this.playerTile.y), this.textureKey(heroKey));
    this.player.setOrigin(0.5, 0.8);
    const heroEntry = ASSETS_BY_KEY[heroKey];
    if (heroEntry && this.player.height) this.player.setScale(heroEntry.height / this.player.height);
    this.playerBaseScale = this.player.scaleX;
    this.player.setDepth(this.centerY(this.playerTile.y));
    this.cameras.main.setBounds(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
  }

  // --- Input & movement ---------------------------------------------------

  private setupInput(): void {
    const kb = this.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.wasd = {
      up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    kb.on('keydown-SPACE', () => this.interact());
    kb.on('keydown-ENTER', () => this.saveGame());
    kb.on('keydown-M', () => this.openMenu());
    kb.on('keydown-I', () => this.openMenu());
    kb.on('keydown-G', () => this.toggleDebug());
    if (new URLSearchParams(location.search).has('debug')) this.toggleDebug();
  }

  private debugGfx?: Phaser.GameObjects.Graphics;
  /** Tint each tile by walkability to align collision against the painted art. */
  private toggleDebug(): void {
    if (this.debugGfx) { this.debugGfx.destroy(); this.debugGfx = undefined; return; }
    const g = this.add.graphics().setDepth(500);
    for (let ty = 0; ty < this.mapHeight; ty++) {
      for (let tx = 0; tx < this.mapWidth; tx++) {
        const ok = this.isWalkable(tx, ty);
        g.fillStyle(ok ? 0x33ff66 : 0xff3344, 0.28);
        g.fillRect(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE - 1, TILE_SIZE - 1);
      }
    }
    this.debugGfx = g;
  }

  update(): void {
    if (this.dialogueActive || this.isMoving || this.transitioning) return;

    let dir: Facing | null = null;
    if (this.cursors.up.isDown || this.wasd.up.isDown) dir = 'up';
    else if (this.cursors.down.isDown || this.wasd.down.isDown) dir = 'down';
    else if (this.cursors.left.isDown || this.wasd.left.isDown) dir = 'left';
    else if (this.cursors.right.isDown || this.wasd.right.isDown) dir = 'right';

    this.updatePrompt();
    if (!dir) return;
    this.facing = dir;
    const d = FACE_DELTA[dir];
    const tx = this.playerTile.x + d.x;
    const ty = this.playerTile.y + d.y;

    // Bumping a boss gate starts its fight.
    const boss = this.battles.find((b) => b.tileX === tx && b.tileY === ty && !gameStore.getFlag(b.victoryFlag));
    if (boss) { this.startBossFight(boss); return; }

    if (this.isWalkable(tx, ty)) this.moveTo(tx, ty);
  }

  private moveTo(tx: number, ty: number): void {
    this.isMoving = true;
    this.playerTile = { x: tx, y: ty };
    const targetY = this.centerY(ty);
    audioService.playSfx('step');

    // Walk waddle: tilt into each step and squash, easing back — reads as walking.
    this.stepParity = !this.stepParity;
    this.player.setAngle(this.stepParity ? 6 : -6);
    this.tweens.add({ targets: this.player, angle: 0, duration: 150, ease: 'Sine.easeOut' });
    this.tweens.add({ targets: this.player, scaleY: this.playerBaseScale * 0.9, duration: 75, yoyo: true });

    this.tweens.add({
      targets: this.player,
      x: this.centerX(tx),
      y: targetY,
      duration: 150,
      ease: 'Linear',
      onComplete: () => {
        this.player.setDepth(targetY);
        this.player.setScale(this.playerBaseScale);
        this.isMoving = false;
        this.onArrive(tx, ty);
      },
    });
  }

  private onArrive(tx: number, ty: number): void {
    // Pickups collect on step.
    const pickup = this.pickups.find((p) => p.tileX === tx && p.tileY === ty);
    if (pickup) {
      gameStore.addItem(pickup.itemId, 1);
      gameStore.setFlag(pickup.flag, true);
      pickup.sprite.destroy();
      this.pickups = this.pickups.filter((p) => p !== pickup);
      audioService.playSfx('pickup');
      eventBus.emit('toast', { message: 'Found a Glow Cap!' });
      this.refreshHud();
    }
    // Map exits.
    const t = this.transitions.find((z) => z.tileX === tx && z.tileY === ty);
    if (t) { this.doTransition(t); return; }
    // Random encounters.
    if (this.encounterCooldown > 0) this.encounterCooldown--;
    else this.rollEncounter();
  }

  private rollEncounter(): void {
    const enc = this.mapDef.encounters;
    if (!enc || Math.random() >= enc.rate) return;
    const pool = enc.pool;
    const count = Math.random() < 0.5 ? 1 : 2;
    const ids: string[] = [];
    for (let i = 0; i < count; i++) ids.push(pool[Math.floor(Math.random() * pool.length)]!);
    this.encounterCooldown = 4;
    eventBus.emit('battle:start', { enemyIds: ids });
  }

  private doTransition(t: TransitionInstance): void {
    this.transitioning = true;
    audioService.playSfx('transition');
    gameStore.position = { mapId: t.target, tileX: t.entryX, tileY: t.entryY, facing: this.facing };
    this.cameras.main.fadeOut(220);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.restart());
  }

  private startBossFight(b: BattleInstance): void {
    audioService.playSfx('confirm');
    eventBus.emit('battle:start', { enemyIds: b.enemyIds, isMiniboss: b.isMiniboss, victoryFlag: b.victoryFlag });
  }

  private interact(): void {
    if (this.dialogueActive || this.isMoving || this.transitioning) return;
    const d = FACE_DELTA[this.facing];
    const fx = this.playerTile.x + d.x;
    const fy = this.playerTile.y + d.y;

    const boss = this.battles.find((b) => b.tileX === fx && b.tileY === fy && !gameStore.getFlag(b.victoryFlag));
    if (boss) { this.startBossFight(boss); return; }

    const npc = this.npcs.find((n) => n.tileX === fx && n.tileY === fy);
    if (npc) {
      audioService.playSfx('talk');
      this.openDialogue(NPCS[npc.npcId]?.dialogueId ?? '');
      return;
    }
    const prop = this.props.find((pr) => pr.tileX === fx && pr.tileY === fy);
    if (prop?.action === 'crafting') {
      audioService.playSfx('confirm');
      this.freeze('menu', true);
      this.scene.launch(SceneKeys.Menu, { tab: 'crafting' });
    }
  }

  /** Show a small prompt when the player faces something interactable. */
  private updatePrompt(): void {
    const d = FACE_DELTA[this.facing];
    const fx = this.playerTile.x + d.x;
    const fy = this.playerTile.y + d.y;
    const hit =
      this.npcs.some((n) => n.tileX === fx && n.tileY === fy) ||
      this.props.some((p) => p.tileX === fx && p.tileY === fy) ||
      this.battles.some((b) => b.tileX === fx && b.tileY === fy && !gameStore.getFlag(b.victoryFlag));
    this.prompt.setVisible(hit);
    if (hit) this.prompt.setPosition(this.player.x, this.player.y - this.player.displayHeight - 6);
  }

  // --- Dialogue / menu handoff --------------------------------------------

  private openDialogue(dialogueId: string): void {
    if (!dialogueId) return;
    this.freeze('dialogue', true);
    this.scene.launch(SceneKeys.Dialogue, { dialogueId });
  }

  private openMenu(): void {
    if (this.dialogueActive || this.isMoving) return;
    audioService.playSfx('confirm');
    this.freeze('menu', true);
    this.scene.launch(SceneKeys.Menu, { tab: 'inventory' });
  }

  private freeze(key: string, on: boolean): void {
    if (on) this.frozenBy.add(key);
    else this.frozenBy.delete(key);
    this.dialogueActive = this.frozenBy.size > 0;
  }

  private wireEvents(): void {
    this.unsub.push(eventBus.on('dialogue:end', () => { this.freeze('dialogue', false); this.afterOverlay(); }));
    this.unsub.push(eventBus.on('menu:close', () => { this.freeze('menu', false); this.afterOverlay(); }));
    this.unsub.push(eventBus.on('shop:open', ({ shopId }) => { this.freeze('shop', true); this.scene.launch(SceneKeys.Shop, { shopId }); }));
    this.unsub.push(eventBus.on('shop:close', () => { this.freeze('shop', false); this.afterOverlay(); }));
    this.unsub.push(
      eventBus.on('battle:start', ({ enemyIds, isMiniboss, victoryFlag }) => {
        this.freeze('battle', true);
        this.scene.pause();
        this.scene.launch(SceneKeys.Battle, { enemyIds, isMiniboss, victoryFlag });
      }),
    );
    this.unsub.push(eventBus.on('battle:end', () => { this.freeze('battle', false); this.onBattleEnd(); }));
    this.unsub.push(eventBus.on('toast', ({ message }) => this.showToast(message)));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsub.forEach((u) => u());
      this.unsub = [];
    });
  }

  private afterOverlay(): void {
    audioService.playMusic(this.mapDef.music);
    this.refreshHud();
    this.checkEnding();
  }

  private onBattleEnd(): void {
    // Clear any defeated boss gate so the path opens.
    for (const b of this.battles) {
      if (gameStore.getFlag(b.victoryFlag) && b.sprite) {
        b.sprite.destroy();
        b.sprite = undefined;
      }
    }
    this.afterOverlay();
  }

  // --- Ending -------------------------------------------------------------

  private checkEnding(): void {
    if (gameStore.getFlag('__ending_shown')) return;
    const redeemed = gameStore.getFlag('ending_redemption');
    const defeated = gameStore.getFlag('dark_lord_defeated');
    if (!redeemed && !defeated) return;
    gameStore.setFlag('__ending_shown', true);
    this.showEnding(redeemed);
  }

  private showEnding(redeemed: boolean): void {
    this.freeze('ending', true);
    audioService.playMusic('title');
    audioService.playSfx('victory');
    const g = this.add.graphics().setDepth(3000).setScrollFactor(0);
    g.fillStyle(PALETTE.night, 0.92);
    g.fillRect(0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);
    const title = redeemed ? 'The light returns.' : 'The blight is broken.';
    const body = redeemed
      ? 'You offered the Crown of Light instead of your blade. Amanos remembers who he was,\nand the roots begin to heal. Not every war ends in ashes.'
      : 'The Mycelial Tyrant falls, and the poison recedes from the King’s roots.\nMushrooms bloom again across the light-touched lands.';
    this.add.text(DESIGN_WIDTH / 2, 180, title, { fontFamily: 'Georgia, serif', fontSize: '34px', color: '#f0c674' }).setOrigin(0.5).setDepth(3001);
    this.add.text(DESIGN_WIDTH / 2, 260, body, { fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#f5e9d0', align: 'center', lineSpacing: 6 }).setOrigin(0.5).setDepth(3001);
    this.add.text(DESIGN_WIDTH / 2, 360, 'Thank you for playing the vertical slice!', { fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#9bbf7a' }).setOrigin(0.5).setDepth(3001);
    const btn = this.add.text(DESIGN_WIDTH / 2, 430, 'Return to Title', {
      fontFamily: 'Georgia, serif', fontSize: '22px', color: '#f5e9d0', backgroundColor: '#35502c', padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setDepth(3001).setScrollFactor(0).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => this.scene.start(SceneKeys.Title));
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start(SceneKeys.Title));
  }

  // --- Save / load --------------------------------------------------------

  private async saveGame(): Promise<void> {
    if (this.dialogueActive) return;
    gameStore.position = { mapId: this.mapDef.id, tileX: this.playerTile.x, tileY: this.playerTile.y, facing: this.facing };
    await saveService.save(DEFAULT_SLOT, gameStore.toBlob());
    audioService.playSfx('confirm');
    eventBus.emit('game:saved', { slotId: DEFAULT_SLOT });
    this.showToast('Game saved.');
  }

  private quitToTitle(): void {
    if (this.dialogueActive) return;
    this.cameras.main.fadeOut(200);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => this.scene.start(SceneKeys.Title));
  }

  // --- HUD ----------------------------------------------------------------

  private buildHud(): void {
    this.goldText = this.add.text(16, 12, '', {
      fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#f0c674', backgroundColor: '#241d14cc', padding: { x: 8, y: 4 },
    }).setScrollFactor(0).setDepth(1000);

    this.areaText = this.add.text(DESIGN_WIDTH / 2, 12, '', {
      fontFamily: 'Georgia, serif', fontSize: '16px', color: '#f5e9d0', backgroundColor: '#241d14cc', padding: { x: 10, y: 4 },
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1000);

    this.questText = this.add.text(16, 44, '', {
      fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#f5e9d0', backgroundColor: '#241d14cc', padding: { x: 8, y: 4 }, wordWrap: { width: 320 },
    }).setScrollFactor(0).setDepth(1000);

    this.add.text(DESIGN_WIDTH - 16, 12, 'WASD/Arrows · Space · Menu M · Save Enter', {
      fontFamily: 'system-ui, sans-serif', fontSize: '11px', color: '#f0e0c0',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000);

    // Sound toggle + quit.
    const sound = this.add.text(DESIGN_WIDTH - 16, 34, audioService.isMuted() ? '\u{1F507} Sound' : '\u{1F50A} Sound', {
      fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#f5e9d0', backgroundColor: '#241d14cc', padding: { x: 8, y: 4 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000).setInteractive({ useHandCursor: true });
    sound.on('pointerdown', () => {
      const m = audioService.toggleMute();
      sound.setText(m ? '\u{1F507} Sound' : '\u{1F50A} Sound');
      if (!m) audioService.playMusic(this.mapDef.music);
    });

    const titleBtn = this.add.text(DESIGN_WIDTH - 16, 58, '☰ Title', {
      fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#f5e9d0', backgroundColor: '#241d14cc', padding: { x: 8, y: 4 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000).setInteractive({ useHandCursor: true });
    titleBtn.on('pointerdown', () => this.quitToTitle());

    this.prompt = this.add.text(0, 0, '▸ Space', {
      fontFamily: 'system-ui, sans-serif', fontSize: '12px', color: '#f0c674', backgroundColor: '#241d14dd', padding: { x: 6, y: 2 },
    }).setOrigin(0.5, 1).setDepth(2500).setVisible(false);

    this.refreshHud();
  }

  private refreshHud(): void {
    this.goldText.setText(`\u{1F7E1} ${gameStore.gold} gold`);
    this.areaText.setText(this.mapDef.displayName);

    const lines: string[] = [];
    if (gameStore.questState('quest.reach-grove') === 'active') lines.push('◆ Reach the King’s Grove');
    if (gameStore.questState('quest.recruit-leaf') === 'active') {
      lines.push(`○ A Leaf on the Wind (Glow Caps ${gameStore.itemCount('item.glow-cap')}/3)`);
    }
    if (lines.length === 0) lines.push('Explore, and speak with those you meet.');
    this.questText.setText(lines.join('\n'));
  }

  private showToast(message: string): void {
    const toast = this.add.text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 40, message, {
      fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: '#f5e9d0', backgroundColor: '#241d14ee', padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2600);
    this.tweens.add({ targets: toast, alpha: 0, y: DESIGN_HEIGHT - 70, delay: 1400, duration: 600, onComplete: () => toast.destroy() });
  }

  // --- Grid helpers -------------------------------------------------------

  private centerX(tileX: number): number { return tileX * TILE_SIZE + TILE_SIZE / 2; }
  private centerY(tileY: number): number { return tileY * TILE_SIZE + TILE_SIZE / 2; }

  private isWalkable(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= this.mapWidth || ty >= this.mapHeight) return false;
    const px = this.centerX(tx);
    const py = this.centerY(ty);
    // If walkable zones are defined, the tile must be inside one.
    if (this.walkableZones.length > 0 && !this.walkableZones.some((r) => Phaser.Geom.Rectangle.Contains(r, px, py))) {
      // Exception: transition/exit tiles are always steppable.
      if (!this.transitions.some((t) => t.tileX === tx && t.tileY === ty)) return false;
    }
    for (const rect of this.collision) if (Phaser.Geom.Rectangle.Contains(rect, px, py)) return false;
    if (this.npcs.some((n) => n.tileX === tx && n.tileY === ty)) return false;
    if (this.props.some((p) => p.tileX === tx && p.tileY === ty)) return false;
    if (this.battles.some((b) => b.tileX === tx && b.tileY === ty && b.block && !gameStore.getFlag(b.victoryFlag))) return false;
    return true;
  }
}
