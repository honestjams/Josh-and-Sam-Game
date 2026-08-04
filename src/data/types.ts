/**
 * Content type definitions for Mycelia Hollow.
 *
 * Every piece of game content — enemies, items, recipes, party members,
 * NPCs, dialogue, quests, shops — is described by one of the interfaces
 * below and authored in the sibling data files. Scene logic reads these
 * definitions; it never hardcodes content. This is the single most
 * important architectural rule in the project (see README).
 *
 * The full-game spec is modelled here even where the vertical slice only
 * exercises a subset, so new content drops in by editing data, not code.
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** A branded id type keeps content references honest at the type level. */
export type Id = string;

export type StatBlock = {
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  /** Drives turn order in combat (higher acts first). */
  speed: number;
};

export type ElementType =
  | 'neutral'
  | 'growth' // the fungal/mycelial life force — the game's "light" element
  | 'decay' // the Dark Lord's poison
  | 'water'
  | 'fire';

// ---------------------------------------------------------------------------
// Skills (shared by party members and enemies)
// ---------------------------------------------------------------------------

export type SkillTarget = 'single-enemy' | 'all-enemies' | 'single-ally' | 'self' | 'all-allies';

export type SkillEffectKind = 'damage' | 'heal' | 'buff' | 'debuff';

export interface SkillDefinition {
  id: Id;
  name: string;
  description: string;
  mpCost: number;
  element: ElementType;
  target: SkillTarget;
  effect: SkillEffectKind;
  /** Base magnitude before stats/variance are applied by the combat resolver. */
  power: number;
}

// ---------------------------------------------------------------------------
// Party members & recruitable allies
// ---------------------------------------------------------------------------

/** A distinct combat archetype for readability in the party screen. */
export type CombatRole = 'hero' | 'striker' | 'support' | 'defender';

export interface CharacterDefinition {
  id: Id;
  name: string;
  role: CombatRole;
  /** Personality blurb surfaced in menus/dialogue — flavour, save-safe as id only. */
  blurb: string;
  baseStats: StatBlock;
  /** Flat stat gain applied per level-up. */
  growthPerLevel: StatBlock;
  skillIds: Id[];
  /** Preload manifest key for this character's illustrated sprite. */
  spriteKey: string;
  /** Quest that must be completed to recruit this ally. Absent for the starting hero. */
  recruitQuestId?: Id;
}

// ---------------------------------------------------------------------------
// Enemies & data-driven AI
// ---------------------------------------------------------------------------

/**
 * Enemy AI is expressed as a small ordered list of weighted intents,
 * evaluated by the combat resolver — never as bespoke per-enemy code.
 */
export interface EnemyAiIntent {
  /** 'attack' uses the basic attack; otherwise a skill id this enemy owns. */
  action: 'attack' | Id;
  weight: number;
  /** Optional gate, e.g. only use when the enemy is below this HP fraction. */
  whenHpBelow?: number;
}

export interface EnemyDefinition {
  id: Id;
  name: string;
  stats: StatBlock;
  element: ElementType;
  skillIds: Id[];
  ai: EnemyAiIntent[];
  xpReward: number;
  goldReward: number;
  /** Weighted drop table resolved on victory. */
  drops: Array<{ itemId: Id; chance: number }>;
  spriteKey: string;
  isMiniboss?: boolean;
}

// ---------------------------------------------------------------------------
// Items, equipment & crafting
// ---------------------------------------------------------------------------

export type ItemCategory = 'consumable' | 'ingredient' | 'equipment' | 'key';

export type ConsumableEffect =
  | { kind: 'heal-hp'; amount: number }
  | { kind: 'heal-mp'; amount: number }
  | { kind: 'cure'; status: string };

export interface ItemDefinition {
  id: Id;
  name: string;
  description: string;
  category: ItemCategory;
  /** Base shop value in gold. Sell price is derived (see economy config). */
  value: number;
  stackable: boolean;
  /** Present for consumables — what using the item does in/out of battle. */
  consumable?: ConsumableEffect;
  /** Present for equipment — flat stat modifiers while equipped. */
  equip?: Partial<StatBlock>;
  spriteKey: string;
}

export interface RecipeDefinition {
  id: Id;
  name: string;
  /** Ingredients consumed, by item id and quantity. */
  inputs: Array<{ itemId: Id; qty: number }>;
  /** Item produced and how many. */
  output: { itemId: Id; qty: number };
}

// ---------------------------------------------------------------------------
// Dialogue & branching
// ---------------------------------------------------------------------------

/**
 * A condition is a pure predicate over game state. The dialogue and quest
 * systems share this vocabulary so the branching main story is fully
 * data-driven — including the Dark Lord redemption/combat fork.
 */
export type Condition =
  | { type: 'flag'; flag: string; equals?: boolean }
  | { type: 'has-item'; itemId: Id; qty?: number }
  | { type: 'quest-state'; questId: Id; state: QuestState }
  | { type: 'has-party-member'; characterId: Id }
  | { type: 'gold-at-least'; amount: number };

/** A consequence mutates game state when a dialogue node/choice resolves. */
export type Consequence =
  | { type: 'set-flag'; flag: string; value: boolean }
  | { type: 'give-item'; itemId: Id; qty: number }
  | { type: 'take-item'; itemId: Id; qty: number }
  | { type: 'give-gold'; amount: number }
  | { type: 'take-gold'; amount: number }
  | { type: 'start-quest'; questId: Id }
  | { type: 'complete-quest'; questId: Id }
  | { type: 'recruit'; characterId: Id }
  | { type: 'open-shop'; shopId: Id };

export interface DialogueChoice {
  text: string;
  /** Choice only shown when all conditions pass. */
  conditions?: Condition[];
  consequences?: Consequence[];
  /** Next node id, or undefined to end the conversation. */
  next?: Id;
}

export interface DialogueNode {
  id: Id;
  speaker: string;
  text: string;
  /** Fired once when the node is shown. */
  onEnter?: Consequence[];
  choices?: DialogueChoice[];
  /** Linear fallthrough when there are no choices. */
  next?: Id;
  /**
   * Router node: not rendered. The engine picks the first choice whose
   * conditions pass, applies its consequences, and jumps to its `next`.
   * Used to branch a conversation on game state without showing UI.
   */
  auto?: boolean;
}

export interface DialogueTree {
  id: Id;
  startNodeId: Id;
  nodes: Record<Id, DialogueNode>;
}

// ---------------------------------------------------------------------------
// Quests
// ---------------------------------------------------------------------------

export type QuestState = 'unstarted' | 'active' | 'completed';

export interface QuestDefinition {
  id: Id;
  title: string;
  description: string;
  isMainQuest: boolean;
  /** Objective lines shown in the quest log. */
  objectives: string[];
  /** Handed out on completion. */
  rewards: { gold?: number; itemIds?: Id[] };
}

// ---------------------------------------------------------------------------
// NPCs
// ---------------------------------------------------------------------------

export interface NpcDefinition {
  id: Id;
  name: string;
  dialogueId: Id;
  spriteKey: string;
  /** Tint applied to the placeholder block so NPCs read apart in the slice. */
  placeholderColor: number;
}

// ---------------------------------------------------------------------------
// Shops
// ---------------------------------------------------------------------------

export interface ShopDefinition {
  id: Id;
  name: string;
  /** Items on sale, with an optional per-shop price override. */
  stock: Array<{ itemId: Id; price?: number }>;
  /** Fraction of item value paid when the player sells. */
  buyBackRate: number;
}
