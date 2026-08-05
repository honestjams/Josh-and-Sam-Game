/**
 * Generate the world's Tiled maps (.tmj) from compact tile specs — far easier
 * than hand-authoring JSON. Object layers only (painterly pipeline): `walkable`
 * + `collision` define movement, `objects` holds spawns/triggers. Coordinates
 * are in TILES. Re-run: `npm run maps`.
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public/assets/maps');
const T = 32, W = 30, H = 17;

let uid = 1;
const rect = (name, type, [x, y, w, h]) => ({ id: uid++, name, type, x: x * T, y: y * T, width: w * T, height: h * T, rotation: 0, visible: true });
const point = (name, type, x, y, props) => ({ id: uid++, name, type, point: true, x: x * T + T / 2, y: y * T + T / 2, width: 0, height: 0, rotation: 0, visible: true, ...(props ? { properties: props } : {}) });
const P = (name, value, type = 'string') => ({ name, type, value });

function build(spec) {
  uid = 1;
  const walkable = (spec.walk ?? []).map((r) => rect('walk', 'walk', r));
  const collision = (spec.block ?? []).map((r) => rect('wall', 'wall', r));
  const objects = [];
  objects.push(point('player-start', 'player-start', spec.start[0], spec.start[1]));
  for (const n of spec.npcs ?? []) {
    const props = [P('npcId', n.id)];
    // Most NPCs are painted into the background (invisible interaction zone).
    // `render: true` draws a sprite for characters not in the scene art.
    if (n.render) props.push(P('render', true, 'bool'));
    objects.push(point(n.id, 'npc', n.at[0], n.at[1], props));
  }
  for (const p of spec.props ?? []) objects.push(point(p.action, 'prop', p.at[0], p.at[1], [P('action', p.action), P('spriteKey', p.spriteKey ?? '')]));
  for (const pk of spec.pickups ?? []) objects.push(point('pickup', 'pickup', pk.at[0], pk.at[1], [P('flag', pk.flag), P('itemId', pk.itemId)]));
  for (const t of spec.transitions ?? [])
    objects.push(point(t.label ?? t.target, 'transition', t.at[0], t.at[1], [P('target', t.target), P('entryX', t.entry[0], 'int'), P('entryY', t.entry[1], 'int'), P('label', t.label ?? t.target)]));
  for (const b of spec.battles ?? [])
    objects.push(point(b.label ?? 'battle', 'battle', b.at[0], b.at[1], [
      P('enemyIds', b.enemyIds.join(',')), P('victoryFlag', b.victoryFlag), P('isMiniboss', !!b.isMiniboss, 'bool'),
      P('block', b.block !== false, 'bool'), P('spriteKey', b.spriteKey ?? ''), P('label', b.label ?? 'A foe'),
    ]));

  const map = {
    compressionlevel: -1, width: W, height: H, tilewidth: T, tileheight: T,
    infinite: false, orientation: 'orthogonal', renderorder: 'right-down',
    tiledversion: '1.10.2', type: 'map', version: '1.10', nextlayerid: 4, nextobjectid: uid, tilesets: [],
    properties: [P('displayName', spec.displayName)],
    layers: [
      { id: 1, name: 'walkable', type: 'objectgroup', visible: false, opacity: 1, x: 0, y: 0, draworder: 'index', objects: walkable },
      { id: 2, name: 'collision', type: 'objectgroup', visible: false, opacity: 1, x: 0, y: 0, draworder: 'index', objects: collision },
      { id: 3, name: 'objects', type: 'objectgroup', visible: true, opacity: 1, x: 0, y: 0, draworder: 'index', objects },
    ],
  };
  writeFileSync(resolve(OUT, `${spec.file}.tmj`), JSON.stringify(map, null, 1));
  console.log('map ->', spec.file, `(walk:${walkable.length} block:${collision.length} obj:${objects.length})`);
}

// ---------------------------------------------------------------------------
// THE MUSHROOM KINGDOM (hub) — walkable grass/bridge/plaza; river + trees block.
// ---------------------------------------------------------------------------
build({
  file: 'mycelia-hollow',
  displayName: 'The Mushroom Kingdom',
  start: [14, 11],
  walk: [
    [10, 8, 17, 6],   // central + right plaza (King's grounds)
    [8, 6, 8, 2],     // bridge and its approaches
    [1, 7, 8, 3],     // left garden
    [4, 10, 8, 4],    // sunflower / lower-left grass
    [10, 13, 15, 3],  // bottom grass
    [24, 8, 3, 6],    // right path toward the exit
  ],
  block: [
    [0, 0, 1, 17],    // left tree edge
    [27, 0, 3, 17],   // right great tree
    // River: diagonal from under the bridge down to the bottom-left mouth.
    [0, 11, 5, 6],    // bottom-left water mouth
    [10, 8, 3, 2],    // under the bridge
    [8, 9, 3, 2],
    [6, 10, 3, 2],
    [4, 11, 3, 2],
    [2, 12, 3, 3],
    [16, 12, 5, 3],   // greenhouse
    [18, 5, 2, 3],    // waterfall
    [20, 4, 5, 4],    // throne ruin behind the King
  ],
  npcs: [
    { id: 'npc.mushroom-king', at: [22, 8] },
    { id: 'npc.elder-morel', at: [4, 8] },
    { id: 'npc.fen', at: [25, 13] },
    { id: 'npc.boletta', at: [17, 10] },
    { id: 'npc.rustle', at: [6, 9] },
  ],
  props: [{ action: 'crafting', at: [18, 12], spriteKey: '' }],
  pickups: [
    { at: [2, 8], flag: 'picked_glowcap_1', itemId: 'item.glow-cap' },
    { at: [24, 14], flag: 'picked_glowcap_2', itemId: 'item.glow-cap' },
    { at: [11, 13], flag: 'picked_glowcap_3', itemId: 'item.glow-cap' },
  ],
  transitions: [{ at: [26, 11], target: 'cave', entry: [26, 13], label: 'The Rootway' }],
});

// ---------------------------------------------------------------------------
// THE ROOTWAY (cave) — path across; chasm blocks; Rot Warden gates the exit.
// ---------------------------------------------------------------------------
// Playable area is the lit forest floor on the RIGHT; the dark cavern on the
// left is atmospheric backdrop. Entered from the hub (right); the Rot Warden
// guards a narrow passage to the deeper exit (left) into the Blighted Reach.
build({
  file: 'cave',
  displayName: 'The Rootway',
  start: [26, 13],
  walk: [
    [17, 10, 11, 5], // forest floor
    [15, 11, 3, 2],  // narrow passage to the deep exit
  ],
  block: [
    [0, 0, 30, 4],   // ceiling
    [0, 15, 30, 2],  // floor edge
  ],
  npcs: [],
  transitions: [
    { at: [27, 13], target: 'mycelia-hollow', entry: [25, 11], label: 'Mushroom Kingdom' },
    { at: [15, 11], target: 'blighted-reach', entry: [2, 13], label: 'The Blighted Reach' },
  ],
  battles: [
    {
      at: [17, 11], enemyIds: ['enemy.rot-warden'], victoryFlag: 'rot_warden_defeated',
      isMiniboss: true, block: true, spriteKey: 'enemy.rot-warden', label: 'The Rot Warden',
    },
  ],
});

// ---------------------------------------------------------------------------
// THE BLIGHTED REACH — lava paths; the Dark Lord waits at the far end.
// ---------------------------------------------------------------------------
// Foreground cobble path (bottom) ramps up to the central ruined platform
// where the Dark Lord waits; lava river + ruins block the rest.
build({
  file: 'blighted-reach',
  displayName: 'The Blighted Reach',
  start: [2, 13],
  walk: [
    [1, 12, 15, 4],  // foreground cobble path
    [8, 9, 11, 3],   // central raised platform
    [8, 10, 3, 3],   // ramp up to the platform
    [15, 12, 9, 2],  // stone bridge over the lava
  ],
  block: [
    [0, 0, 30, 4],   // ceiling / dark upper ruins
    [23, 5, 7, 11],  // lava river (right)
    [16, 14, 10, 2], // lava beneath the bridge
  ],
  npcs: [{ id: 'npc.dark-lord', at: [14, 9], render: true }],
  transitions: [{ at: [1, 13], target: 'cave', entry: [16, 11], label: 'The Rootway' }],
});

console.log('done.');
