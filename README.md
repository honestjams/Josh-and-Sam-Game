# Mycelia Hollow

A cozy, old-school turn-based fantasy RPG for the web — in the spirit of classic
Final Fantasy and Pokémon Mystery Dungeon. Warm ambers, mossy greens, friendly odd
little creatures, and existential stakes told gently.

> **Story seed.** The light-touched lands are sustained by a vast underground
> mycelial network ruled by the **Mushroom King**. The **Dark Lord** has poisoned
> the King's roots; as the King sickens, mushrooms everywhere perish — and because
> mushrooms sustain all life, everything will die if he is not stopped. You are a
> young adventurer setting out to reach and stop him. (The twist, seeded early: the
> Dark Lord was once a being of the light. The endgame will branch toward
> redemption *or* combat, driven by choices you accumulate.)

**This repository is a vertical slice**, not the full game. See
[`ROADMAP.md`](./ROADMAP.md) for what is built vs. stubbed and the recommended
order to expand.

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173  — the playable slice
npm run build        # typecheck + static production build into dist/
npm run build:single # one self-contained dist/index.html (no external requests)
npm run preview      # serve the production build locally
npm test             # run the unit tests (Vitest, no engine required)
```

Requires Node 18+ (developed on Node 22).

### What you can do in the slice right now

- **Title screen** — New Game, or Continue (loads the `localStorage` save).
- **Mycelia Hollow village** — grid-walk around, talk to four NPCs with branching
  dialogue (Elder Morel, Rustle, Fen the trader, Boletta).
- **Main quest** — accept "Reach the King's Grove" from Elder Morel.
- **Sidequest** — pick up three Glow Caps around the village and return them to
  Rustle to recruit the Leaf and earn gold.
- **Save / load** — press **Enter** to save; the state fully round-trips.

Controls: **WASD / Arrows** move · **Space** talk/interact · **Enter** save ·
**☰ Title** button returns to the title screen.

> The scenes that complete the loop (Battle, Crafting, Shop, the route + dungeon)
> are designed but not yet built — this is the step-3 review checkpoint described in
> the brief. Their data and interfaces already exist; see the roadmap.

---

## Tech stack

| Concern    | Choice                                                          |
| ---------- | -------------------------------------------------------------- |
| Engine     | **Phaser 4** (`import * as Phaser from 'phaser'`)              |
| Language   | **TypeScript**, strict mode                                    |
| Bundler    | **Vite**                                                       |
| Maps       | **Tiled** JSON (`.tmj`), loaded via Phaser's tilemap API       |
| Saves      | `localStorage` behind a `SaveService` interface (cloud-ready)  |
| Tests      | **Vitest** (systems are engine-free and unit-tested)           |
| Deploy     | Static build → Vercel or Netlify (config included, not deployed) |

**Design resolution:** 960×540, scaled with `Scale.FIT`. Painted art is authored at
or above this size and downscaled — never upscaled.

---

## Project structure

```
public/assets/maps/mycelia-hollow.tmj   Hand-made Tiled map (village)
src/
  main.ts                     Phaser bootstrap (resolution, scene list)
  game/
    config.ts                 Resolution, tile size, palette, scene keys
    assets/manifest.ts        Asset manifest — the single place art is declared
    scenes/
      BootScene.ts            Minimal pre-preload setup
      PreloadScene.ts         Swappable loader + placeholder generation
      TitleScene.ts           New Game / Continue
      OverworldScene.ts       Village map, grid movement, NPCs, save/load
      DialogueScene.ts        Branching-dialogue overlay (renders DialogueRunner)
  core/                       Phaser-INDEPENDENT systems (all unit-testable)
    store/GameStore.ts        Single source of truth; serializes to a save blob
    save/                     SaveService interface + localStorage impl + types
    events/EventBus.ts        Typed cross-scene event bus
    combat/resolver.ts        Turn order, damage, data-driven enemy AI
    crafting/crafting.ts      Recipe checking + crafting
    dialogue/DialogueRunner.ts Branching/consequence engine (no Phaser)
    services.ts               Wires the concrete SaveService (swap point)
  data/                       ALL game content, typed — never hardcoded in scenes
    types.ts                  Every content interface
    skills.ts items.ts recipes.ts party.ts enemies.ts
    quests.ts dialogue.ts npcs.ts shops.ts
    index.ts                  Content registry (one import surface)
tests/                        Vitest specs for store, crafting, combat, dialogue
```

---

## Architecture principles

1. **Data-driven content.** Enemies, items, recipes, dialogue, quests, shops, and
   party members live in `src/data/*.ts` as typed records. Scene logic *reads* them;
   it never hardcodes content.
2. **Scene-based structure** with a lightweight typed **event bus**
   (`core/events/EventBus.ts`) for cross-scene messages.
3. **Separation of systems.** Combat, crafting, and dialogue are plain TS modules in
   `src/core/` that run — and are tested — without Phaser.
4. **Deterministic, save-safe state.** Everything that matters for a save lives in
   `GameStore` and round-trips through `toBlob()` / `loadBlob()`.

---

## How to add content

### A new item
Edit `src/data/items.ts` and add an entry to `ITEMS` implementing `ItemDefinition`.
Reference its `id` from recipes, shops, drop tables, or dialogue consequences. Add a
sprite slot in `src/game/assets/manifest.ts` if it needs art.

### A new enemy
Edit `src/data/enemies.ts` and add an `EnemyDefinition` to `ENEMIES`. AI is fully
data-driven: express behaviour as a list of weighted `ai` intents (optionally gated
by `whenHpBelow`). No battle-scene code changes are needed.

### A new NPC
1. Add an `NpcDefinition` to `src/data/npcs.ts` (with a `dialogueId`).
2. Add its `DialogueTree` to `src/data/dialogue.ts`.
3. Place it on the map: open `mycelia-hollow.tmj` in Tiled, add a **point object** to
   the `objects` layer with `type: "npc"` and a string property `npcId` pointing at
   your NPC id. (Coordinates are in pixels; the scene snaps them to the 32px grid.)

### A new map
Export a Tiled map as JSON (`.tmj`) into `public/assets/maps/`. Give it a `collision`
object layer (rectangles the player can't cross) and an `objects` object layer
(points/rects with a `type`: `player-start`, `npc`, `prop`, `pickup`, `transition`).
Add a background image slot to the manifest. Load it in `PreloadScene`. The painted
background renders beneath the invisible logic grid.

### Real art (replacing placeholders)
Every asset loads through `src/game/assets/manifest.ts`. Each entry documents its
**key**, **path** (under `public/`), and **expected dimensions**. Drop a real PNG at
that path and it is used automatically; if the file is missing, `PreloadScene`
generates a labelled placeholder of the exact dimensions instead. **Replacing art is
a file drop — never a code change.**

Current expected dimensions:

| Slot                 | Path                                  | Size (px) |
| -------------------- | ------------------------------------- | --------- |
| Village background   | `assets/backgrounds/mycelia-hollow.png` | 960×540 |
| Title background     | `assets/backgrounds/title.png`        | 960×540   |
| Character/NPC sprite | `assets/sprites/*.png`                | 32×48     |
| Crafting stump prop  | `assets/sprites/crafting-stump.png`   | 32×32     |

---

## How the save system works

- **`GameStore`** (`core/store/GameStore.ts`) is the single source of truth: gold,
  story/quest flags, the full character roster, the active party, inventory, quest
  progress, and world position.
- **`toBlob()`** produces a flat, primitive-only `SaveBlob` (see
  `core/save/types.ts`) that survives `JSON.stringify`. **`loadBlob()`** is its exact
  inverse. A unit test asserts the full round-trip, including a JSON cycle.
- **`SaveService`** (`core/save/SaveService.ts`) is the storage-agnostic interface.
  The only concrete wiring is in `core/services.ts`, which today constructs a
  `LocalStorageSaveService`.
- **Swapping in cloud saves later** (e.g. Supabase) means writing a new class that
  implements `SaveService` and changing the one line in `core/services.ts`. No game
  or scene code changes — every method is already async.
- `SaveBlob.version` + a migration hook in `loadBlob()` handle future format changes.

---

## Testing

```bash
npm test
```

The `core/` systems have no Phaser dependency, so they are unit-tested directly:
save round-trip (`tests/gameStore.test.ts`), crafting (`tests/crafting.test.ts`),
combat ordering / AI / damage (`tests/combat.test.ts`), and branching dialogue with
consequences (`tests/dialogue.test.ts`).

---

## Deployment

The build is fully static. Both host configs are included:

- **Vercel** — `vercel.json` (build `npm run build`, output `dist/`).
- **Netlify** — `netlify.toml` (same).

For a quick, portable playtest without a host, `npm run build:single` inlines the
entire game (including the map) into one `dist/index.html` with **no external
requests** — open it directly or drop it anywhere static.
