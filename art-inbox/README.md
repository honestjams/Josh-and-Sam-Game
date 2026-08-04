# Art inbox — drop your images here

This is a **dump folder** for raw art. Upload any images here (character sheets,
individual sprites, backgrounds, whatever you have — any names, any sizes) and
tell Claude "art uploaded". Claude will then, from the real files:

- identify each image,
- crop character/enemy **sheets** into individual sprites where needed,
- resize/optimize,
- place each into the correct slot under `src/game/assets/art/…`,
- rebuild and redeploy so it shows in the game,
- and delete the processed files from this inbox.

## How to upload (browser only — no setup)

1. On github.com, open this repo and switch to branch
   **`claude/fantasy-rpg-scaffold-nlynwf`**.
2. Open this **`art-inbox/`** folder.
3. Click **Add file → Upload files**.
4. Drag in all your PNGs at once.
5. Commit **to the `claude/…` branch** (not `main`).
6. Come back and tell Claude "art uploaded".

That's it — filenames and cropping don't matter, Claude sorts it all out.
