import * as Phaser from 'phaser';
import { SceneKeys, TILE_SIZE, DESIGN_WIDTH, DESIGN_HEIGHT, PALETTE } from '@/game/config';
import { NPCS, QUESTS, CHARACTERS } from '@/data';
import { ASSETS_BY_KEY } from '@/game/assets/manifest';
import { gameStore } from '@/core/store/GameStore';
import { saveService } from '@/core/services';
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

interface NpcInstance {
  tileX: number;
  tileY: number;
  npcId: string;
  sprite: Phaser.GameObjects.Image;
}
interface PropInstance {
  tileX: number;
  tileY: number;
  action: string;
}
interface PickupInstance {
  tileX: number;
  tileY: number;
  flag: string;
  itemId: string;
  sprite: Phaser.GameObjects.Image;
}
interface TransitionInstance {
  tileX: number;
  tileY: number;
  target: string;
  label: string;
}

/**
 * The village overworld: painterly background beneath a logical grid. Movement
 * is grid-based (classic FF/PMD feel); collision and interaction come from the
 * Tiled object layers, never a visual tileset. Handles NPC dialogue, quest
 * pickups, and full save/load round-tripping through the GameStore.
 */
export class OverworldScene extends Phaser.Scene {
  private collision: Phaser.Geom.Rectangle[] = [];
  private npcs: NpcInstance[] = [];
  private props: PropInstance[] = [];
  private pickups: PickupInstance[] = [];
  private transitions: TransitionInstance[] = [];

  private player!: Phaser.GameObjects.Image;
  private playerTile = { x: 15, y: 12 };
  private facing: Facing = 'down';
  private isMoving = false;
  private dialogueActive = false;

  private mapWidth = 30;
  private mapHeight = 17;

  private goldText!: Phaser.GameObjects.Text;
  private questText!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  private unsub: Array<() => void> = [];

  constructor() {
    super(SceneKeys.Overworld);
  }

  create(): void {
    this.buildFromMap();
    this.drawBackground();
    this.spawnObjects();
    this.spawnPlayer();
    this.setupInput();
    this.buildHud();
    this.wireEvents();
    this.cameras.main.fadeIn(250);
  }

  // --- Map parsing --------------------------------------------------------

  private buildFromMap(): void {
    const map = this.make.tilemap({ key: 'map.mycelia-hollow' });
    this.mapWidth = map.width;
    this.mapHeight = map.height;

    for (const obj of map.getObjectLayer('collision')?.objects ?? []) {
      this.collision.push(new Phaser.Geom.Rectangle(obj.x!, obj.y!, obj.width!, obj.height!));
    }

    for (const obj of map.getObjectLayer('objects')?.objects ?? []) {
      const tileX = Math.floor((obj.x ?? 0) / TILE_SIZE);
      const tileY = Math.floor((obj.y ?? 0) / TILE_SIZE);
      const props = this.readProps(obj);
      switch (obj.type) {
        case 'player-start':
          // Fallback spawn for a fresh game if the store lacks this map.
          this.defaultStart = { x: tileX, y: tileY };
          break;
        case 'npc':
          this.pendingNpcs.push({ tileX, tileY, npcId: String(props.npcId) });
          break;
        case 'prop':
          this.props.push({ tileX, tileY, action: String(props.action ?? '') });
          this.pendingSprites.push({ tileX, tileY, spriteKey: String(props.spriteKey) });
          break;
        case 'pickup':
          this.pendingPickups.push({
            tileX,
            tileY,
            flag: String(props.flag),
            itemId: String(props.itemId),
          });
          break;
        case 'transition':
          this.transitions.push({
            tileX,
            tileY,
            target: String(props.target),
            label: String(props.label ?? props.target),
          });
          break;
      }
    }
  }

  private defaultStart = { x: 15, y: 12 };
  private pendingNpcs: Array<{ tileX: number; tileY: number; npcId: string }> = [];
  private pendingPickups: Array<{ tileX: number; tileY: number; flag: string; itemId: string }> = [];
  private pendingSprites: Array<{ tileX: number; tileY: number; spriteKey: string }> = [];

  private readProps(obj: Phaser.Types.Tilemaps.TiledObject): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const p of obj.properties ?? []) out[p.name] = p.value;
    return out;
  }

  // --- Rendering ----------------------------------------------------------

  private drawBackground(): void {
    this.add.image(0, 0, 'bg.village').setOrigin(0, 0).setDepth(-100);
  }

  private spawnObjects(): void {
    // NPCs
    for (const n of this.pendingNpcs) {
      const def = NPCS[n.npcId];
      const key = def?.spriteKey ?? n.npcId;
      const sprite = this.placeSprite(n.tileX, n.tileY, key);
      if (def) sprite.setTint(def.placeholderColor);
      this.npcs.push({ ...n, sprite });
    }
    // Static prop sprites (crafting stump, etc.)
    for (const s of this.pendingSprites) {
      this.placeSprite(s.tileX, s.tileY, s.spriteKey);
    }
    // Pickups — skip any already collected in a loaded save.
    for (const p of this.pendingPickups) {
      if (gameStore.getFlag(p.flag)) continue;
      const sprite = this.placeSprite(p.tileX, p.tileY, ASSETS_BY_KEY['item.glow-cap'] ? 'item.glow-cap' : p.itemId);
      sprite.setDisplaySize(TILE_SIZE * 0.6, TILE_SIZE * 0.6).setTint(PALETTE.amberGlow);
      this.pickups.push({ ...p, sprite });
    }
  }

  private placeSprite(tileX: number, tileY: number, key: string): Phaser.GameObjects.Image {
    const img = this.add.image(this.centerX(tileX), this.centerY(tileY), this.textureKey(key));
    img.setOrigin(0.5, 0.7);
    img.setDepth(this.centerY(tileY));
    return img;
  }

  /** Fall back to a known texture if a key somehow didn't load. */
  private textureKey(key: string): string {
    return this.textures.exists(key) ? key : 'char.squirrel';
  }

  private spawnPlayer(): void {
    // The store is the source of truth: newGame() seeds the start tile and
    // loadBlob() restores the saved tile — both flow through gameStore.position.
    const pos = gameStore.position;
    this.playerTile =
      pos.mapId === 'mycelia-hollow' ? { x: pos.tileX, y: pos.tileY } : { ...this.defaultStart };
    this.facing = pos.facing ?? 'down';

    // Use the chosen hero's sprite (activeParty leader).
    const heroKey = CHARACTERS[gameStore.activeParty[0] ?? '']?.spriteKey ?? 'char.squirrel';
    this.player = this.add.image(
      this.centerX(this.playerTile.x),
      this.centerY(this.playerTile.y),
      this.textureKey(heroKey),
    );
    this.player.setOrigin(0.5, 0.7);
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
    // Note: Escape is intentionally NOT bound here — it belongs to the
    // dialogue overlay. Quit-to-title is a HUD button to avoid the clash.
  }

  update(): void {
    if (this.dialogueActive || this.isMoving) return;

    let dir: Facing | null = null;
    if (this.cursors.up.isDown || this.wasd.up.isDown) dir = 'up';
    else if (this.cursors.down.isDown || this.wasd.down.isDown) dir = 'down';
    else if (this.cursors.left.isDown || this.wasd.left.isDown) dir = 'left';
    else if (this.cursors.right.isDown || this.wasd.right.isDown) dir = 'right';

    if (!dir) return;
    this.facing = dir;
    const d = FACE_DELTA[dir];
    const tx = this.playerTile.x + d.x;
    const ty = this.playerTile.y + d.y;
    if (this.isWalkable(tx, ty)) this.moveTo(tx, ty);
  }

  private moveTo(tx: number, ty: number): void {
    this.isMoving = true;
    this.playerTile = { x: tx, y: ty };
    const targetY = this.centerY(ty);
    this.tweens.add({
      targets: this.player,
      x: this.centerX(tx),
      y: targetY,
      duration: 140,
      onComplete: () => {
        this.player.setDepth(targetY);
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
      eventBus.emit('toast', { message: 'Found a Glow Cap!' });
      this.refreshHud();
    }
    // Transition zones (stubbed until the route map exists).
    const t = this.transitions.find((z) => z.tileX === tx && z.tileY === ty);
    if (t) {
      eventBus.emit('toast', { message: `The ${t.label} lies ahead — coming in the next build.` });
    }
  }

  private interact(): void {
    if (this.dialogueActive || this.isMoving) return;
    const d = FACE_DELTA[this.facing];
    const fx = this.playerTile.x + d.x;
    const fy = this.playerTile.y + d.y;

    const npc = this.npcs.find((n) => n.tileX === fx && n.tileY === fy);
    if (npc) {
      this.openDialogue(NPCS[npc.npcId]?.dialogueId ?? '');
      return;
    }
    const prop = this.props.find((p) => p.tileX === fx && p.tileY === fy);
    if (prop?.action === 'crafting') {
      this.dialogueActive = true;
      this.scene.launch(SceneKeys.Menu, { tab: 'crafting' });
    } else if (prop?.action === 'sparring') {
      eventBus.emit('battle:start', {
        enemyIds: ['enemy.blight-mite', 'enemy.gloom-moth'],
      });
    }
  }

  // --- Dialogue handoff ---------------------------------------------------

  private openDialogue(dialogueId: string): void {
    if (!dialogueId) return;
    this.dialogueActive = true;
    this.scene.launch(SceneKeys.Dialogue, { dialogueId });
  }

  private openMenu(): void {
    if (this.dialogueActive || this.isMoving) return;
    this.dialogueActive = true;
    this.scene.launch(SceneKeys.Menu, { tab: 'inventory' });
  }

  private wireEvents(): void {
    this.unsub.push(
      eventBus.on('dialogue:end', () => {
        this.dialogueActive = false;
        this.refreshHud();
      }),
    );
    this.unsub.push(
      eventBus.on('shop:open', ({ shopId }) => {
        // Shop scene arrives in the next build; acknowledge the intent for now.
        eventBus.emit('toast', { message: `Fen opens his wares (${shopId}) — shop coming soon.` });
      }),
    );
    this.unsub.push(
      eventBus.on('battle:start', ({ enemyIds, isMiniboss }) => {
        this.dialogueActive = true; // freeze overworld input while paused
        this.scene.pause();
        this.scene.launch(SceneKeys.Battle, { enemyIds, isMiniboss });
      }),
    );
    this.unsub.push(
      eventBus.on('battle:end', () => {
        this.dialogueActive = false;
        this.refreshHud();
      }),
    );
    this.unsub.push(
      eventBus.on('menu:close', () => {
        this.dialogueActive = false;
        this.refreshHud();
      }),
    );
    this.unsub.push(eventBus.on('toast', ({ message }) => this.showToast(message)));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsub.forEach((u) => u());
      this.unsub = [];
    });
  }

  // --- Save / load --------------------------------------------------------

  private async saveGame(): Promise<void> {
    if (this.dialogueActive) return;
    gameStore.position = {
      mapId: 'mycelia-hollow',
      tileX: this.playerTile.x,
      tileY: this.playerTile.y,
      facing: this.facing,
    };
    await saveService.save(DEFAULT_SLOT, gameStore.toBlob());
    eventBus.emit('game:saved', { slotId: DEFAULT_SLOT });
    this.showToast('Game saved.');
  }

  private quitToTitle(): void {
    if (this.dialogueActive) return;
    this.cameras.main.fadeOut(200);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SceneKeys.Title);
    });
  }

  // --- HUD ----------------------------------------------------------------

  private buildHud(): void {
    this.goldText = this.add
      .text(16, 12, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#f0c674',
        backgroundColor: '#241d14aa',
        padding: { x: 8, y: 4 },
      })
      .setScrollFactor(0)
      .setDepth(1000);

    this.questText = this.add
      .text(16, 44, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#f5e9d0',
        backgroundColor: '#241d14aa',
        padding: { x: 8, y: 4 },
        wordWrap: { width: 320 },
      })
      .setScrollFactor(0)
      .setDepth(1000);

    this.add
      .text(DESIGN_WIDTH - 16, 12, 'Move: WASD/Arrows · Talk: Space · Menu: M · Save: Enter', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        color: '#9b8a6f',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1000);

    const titleBtn = this.add
      .text(DESIGN_WIDTH - 16, 34, '☰ Title', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#f5e9d0',
        backgroundColor: '#241d14aa',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive({ useHandCursor: true });
    titleBtn.on('pointerover', () => titleBtn.setColor('#f0c674'));
    titleBtn.on('pointerout', () => titleBtn.setColor('#f5e9d0'));
    titleBtn.on('pointerdown', () => this.quitToTitle());

    this.refreshHud();
  }

  private refreshHud(): void {
    this.goldText.setText(`⬤ ${gameStore.gold} gold`);

    const main = QUESTS['quest.reach-grove'];
    const side = QUESTS['quest.recruit-leaf'];
    const lines: string[] = [];
    if (gameStore.questState('quest.reach-grove') === 'active') {
      lines.push(`◆ ${main.title}`);
    }
    if (gameStore.questState('quest.recruit-leaf') === 'active') {
      const caps = gameStore.itemCount('item.glow-cap');
      lines.push(`○ ${side.title} (Glow Caps: ${caps}/3)`);
    }
    if (lines.length === 0) lines.push('Talk to the villagers of Mycelia Hollow.');
    this.questText.setText(lines.join('\n'));
  }

  private showToast(message: string): void {
    const toast = this.add
      .text(DESIGN_WIDTH / 2, DESIGN_HEIGHT - 40, message, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#f5e9d0',
        backgroundColor: '#241d14dd',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2000);
    this.tweens.add({
      targets: toast,
      alpha: 0,
      y: DESIGN_HEIGHT - 70,
      delay: 1400,
      duration: 600,
      onComplete: () => toast.destroy(),
    });
  }

  // --- Grid helpers -------------------------------------------------------

  private centerX(tileX: number): number {
    return tileX * TILE_SIZE + TILE_SIZE / 2;
  }
  private centerY(tileY: number): number {
    return tileY * TILE_SIZE + TILE_SIZE / 2;
  }

  private isWalkable(tx: number, ty: number): boolean {
    if (tx < 0 || ty < 0 || tx >= this.mapWidth || ty >= this.mapHeight) return false;
    const px = this.centerX(tx);
    const py = this.centerY(ty);
    for (const rect of this.collision) {
      if (Phaser.Geom.Rectangle.Contains(rect, px, py)) return false;
    }
    if (this.npcs.some((n) => n.tileX === tx && n.tileY === ty)) return false;
    if (this.props.some((p) => p.tileX === tx && p.tileY === ty)) return false;
    return true;
  }
}
