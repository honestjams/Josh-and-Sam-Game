// Embed the hand-made Tiled map at build time (imported as raw text and
// parsed) rather than fetching it at runtime. This keeps a single source of
// truth — the same .tmj a designer edits in Tiled and that the README
// documents — while letting the game run with zero network requests, which is
// required for a single-file static bundle.
import raw from '../../../public/assets/maps/mycelia-hollow.tmj?raw';

export const MAP_KEY = 'map.mycelia-hollow';
export const MYCELIA_HOLLOW_MAP = JSON.parse(raw) as object;
