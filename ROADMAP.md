# Roadmap

Where the project stands against the full-game spec, and the recommended order to
expand. The **first pass** intentionally stops at the step-3 review checkpoint from
the brief: scaffold + data interfaces + the village overworld with movement,
branching dialogue, and working save/load.

---

## ✅ Built (this pass)

**Tooling & architecture**
- Vite + Phaser 4 + TypeScript (strict) project; `npm run dev` / `build` / `test`.
- Fixed 960×540 design resolution with `Scale.FIT`.
- Typed data layer for **all** content (`src/data/*`) with interfaces for the full
  spec, not just what the slice uses.
- `GameStore` single source of truth with full save round-trip.
- `SaveService` interface + `localStorage` implementation (cloud-swap ready).
- Typed cross-scene `EventBus`.
- Engine-free, unit-tested systems: combat resolver, crafting, dialogue runner.
- Swappable asset loader with auto-generated labelled placeholders.
- Vercel + Netlify build config.

**Playable content**
- Title screen (New Game / Continue).
- Mycelia Hollow village: hand-made Tiled map, grid movement, collision.
- Four NPCs with branching, condition/consequence-driven dialogue.
- Main-quest step "Reach the King's Grove" (accept from Elder Morel).
- Recruit-the-Leaf sidequest: three Glow Cap pickups → turn in for gold + ally.
- Save / load that round-trips party, inventory, gold, flags, quests, and position.
- The Dark Lord "was once of the light" twist, seeded in Elder Morel's dialogue.

---

## 🟡 Designed but stubbed (data/interfaces exist, scene/UI does not)

These have **typed data and, where relevant, tested engine logic** already — they
need presentation scenes wired to the event bus:

- **BattleScene** — `core/combat/resolver.ts` (turn order, damage, data-driven AI)
  and all enemy/skill data exist and are tested. Needs the menu-driven battle UI
  (Attack / Skill / Item / Defend / Flee), victory rewards, and level-ups.
- **MenuScene (inventory / party / crafting)** — `core/crafting/crafting.ts` is
  built and tested; items/recipes are defined. Needs the inventory + crafting UI.
- **ShopScene** — `SHOPS` data and the `open-shop` dialogue side effect exist (the
  overworld currently just toasts). Needs the buy/sell UI against the gold economy.
- **Route + dungeon maps** — the village map has a `transition` object toward the
  Amberwood Route (currently a toast). Needs the route map, the Rootway dungeon, an
  environmental puzzle, encounters, and the Rot Warden miniboss (already defined in
  `enemies.ts`).

---

## 🔴 Not yet started (full-spec, beyond the vertical slice)

- Additional recruits (Acorn, Baby Mushroom — defined in `party.ts`) and party swap.
- Equipment system UI (the `equip` item field and stat model exist).
- Status effects / `cure` consumables (effect kind defined).
- Quest log screen (data + tracking exist; only a HUD hint is shown today).
- The branching endgame (redemption vs. combat) — the `Condition`/`Consequence`
  vocabulary is built to drive it from data; needs the late-game content and the
  fork scene.
- Environmental puzzles beyond the first dungeon (push blocks, switches, growth/
  water mechanics).
- Audio: BGM/SFX hooks (currently unstubbed — add a small `AudioService` behind an
  interface, mirroring `SaveService`).
- Real illustrated art replacing placeholders (drop-in via the manifest).

---

## Recommended expansion order

1. **BattleScene** — highest-value loop closer. The resolver is done and tested; wire
   the UI, then hook random encounters on the route. Grants XP/gold/drops on victory.
2. **MenuScene → crafting + inventory** — lets players use and brew potions; crafting
   logic is already tested.
3. **ShopScene** — small once the menu's item UI exists; reuse its list components.
4. **Route + dungeon** — new maps reusing the overworld scene, plus one puzzle and
   the Rot Warden miniboss; completes the "reach the Grove" main step.
5. **Party swap + second recruit** — exercises the multi-member party UI.
6. **Quest log screen** — surface the quest data already tracked in the store.
7. **Audio hooks**, then **real art**, then the **branching endgame** content.

---

## Notable design decisions & flags for review

- **Painterly pipeline.** Per the art direction, the map uses an invisible Tiled
  *object* layer for collision + triggers with a painted background beneath, rather
  than a fine pixel tileset. Movement stays grid-clean; visuals stay illustrated.
- **Quest rewards are single-sourced** in `QuestDefinition.rewards` and auto-granted
  by `GameStore.completeQuest()` — dialogue does **not** also hand out the same gold
  (a bug caught by the dialogue unit test during this pass).
- **Escape** belongs to the dialogue overlay; quit-to-title is a HUD button, to avoid
  a cross-scene key clash.
- **Default resolution 960×540** and **grid-based movement** were chosen as sensible
  defaults from the brief's options — easy to revisit.
