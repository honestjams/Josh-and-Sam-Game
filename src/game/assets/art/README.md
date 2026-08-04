# Art drop-in guide

**This folder is where the game's art lives.** Every file here is bundled into
the build (including the single-file deploy), so replacing a file with your real
pixel art is all it takes — no code changes.

## How to add your own art

1. Save your image as a **PNG** with the **exact filename and path** from the
   tables below (e.g. `backgrounds/mushroom-kingdom.png`).
2. Drop it into this folder, overwriting the generated placeholder.
3. Rebuild: `npm run dev` (local) or `npm run build:single` (deploy bundle).

Notes:
- **Any resolution works.** The game scales each image to its in-game size
  (backgrounds fill the 960×540 screen; sprites render at the sizes below).
  For crispest results, author sprites at the listed size or an exact multiple.
- Use **transparent backgrounds** for characters/enemies/props (PNG alpha).
- `npm run art` regenerates placeholders **only for missing files** — it will
  **never overwrite** art you've added. Use `npm run art:force` to redo all.

## Backgrounds — `backgrounds/`  (fill the 960×540 screen; author 16:9)

| File | Area | Your reference |
| --- | --- | --- |
| `mushroom-kingdom.png` | Starting hub with the Mushroom King | The cozy mushroom village + King on throne |
| `cave.png` | The Rootway caves (after the land of light) | The glowing grotto / crystal caverns |
| `blighted-reach.png` | The Dark Lord's kingdom | The lava/gothic "Blighted Reach" |
| `orc-tavern.png` | The Tusk & Barrel tavern | The orc tavern in the woods |
| `witch-house.png` | The witch's house | The witch + cauldron stone cottage |
| `title.png` | Title-screen backdrop | (any mood-setting image) |

## Character & NPC sprites — `sprites/`  (≈32×48, transparent)

| File | Character |
| --- | --- |
| `squirrel.png` | Nutkin the Squirrel (selectable hero) |
| `gnome.png` | Fizzwick the Gnome (selectable hero) |
| `woodelf.png` | Sylwen the Wood Elf (selectable hero) |
| `leaf.png` | Rustle the Leaf (recruit) — used for the Rustle NPC too |
| `elder-morel.png` | Elder Morel (villager) |
| `fen.png` | Fen the Trader (shopkeeper) |
| `boletta.png` | Boletta (villager) |
| `mushroom-king.png` | The Mushroom King — larger, ≈48×64 |
| `dark-lord.png` | The Dark Lord overworld sprite — ≈64×80 |

## Portraits — `portraits/`  (128×128, shown on select/party screens)

`squirrel.png` · `gnome.png` · `woodelf.png` · `mushroom-king.png` · `dark-lord.png`

## Enemies — `enemies/`  (transparent; sizes are guidance)

| File | Enemy | Size |
| --- | --- | --- |
| `blight-mite.png` | Blight Mite | 48×48 |
| `wither-cap.png` | Wither Cap | 48×48 |
| `gloom-moth.png` | Gloom Moth | 48×48 |
| `dark-minion.png` | Blight Thrall / Enduring Brute (Dark Lord minions) | 56×64 |
| `rot-warden.png` | The Rot Warden (dungeon miniboss) | 80×80 |
| `mycelial-tyrant.png` | The Mycelial Tyrant (Dark Lord, final boss) | 96×112 |

## Props — `props/`  (≈32×32, transparent)

`crafting-stump.png` (crafting station) · `training-post.png` (practice-battle post)

---

Filenames and sizes are also declared in `../manifest.ts`. If you want a
different set of characters/areas, add entries there and the loader picks them
up. Sprites/backgrounds without a matching file fall back to a labelled
placeholder box automatically.
