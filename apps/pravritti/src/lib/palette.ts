/**
 * Quiet-wash palette for the culture canvas.
 *
 * Canvas needs numeric RGB for per-cell lerping, so these values are the
 * logo palette committed as numbers; BG mirrors --bg in tokens-earth.css.
 * Visual encoding (spec): religious → hue family, societal → shade,
 * economical → dot radius, logical → opacity. Every color is washed hard
 * toward the cream background — the mosaic reads on the second look.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Cream background — keep in sync with --bg in tokens-earth.css. */
export const BG: Rgb = { r: 250, g: 243, b: 234 };

/** Hue families indexed by the religious trait: leaf, clay, slate, sand. */
export const FAMILIES: readonly Rgb[] = [
  { r: 91, g: 137, b: 61 }, // leaf green  #5b893d
  { r: 138, g: 102, b: 62 }, // clay brown  #8a663e
  { r: 69, g: 91, b: 100 }, // slate       #455b64
  { r: 176, g: 148, b: 110 }, // sand
];

/** How far every cell color is pulled toward BG (the "quiet" in quiet wash). */
const WASH = 0.72;
/** Societal shade range: extra pull toward BG from deep (0) to airy (1). */
const SHADE_MIN = 0.15;
const SHADE_SPAN = 0.45;

const ALPHA_MIN = 0.55;
const RADIUS_MIN = 0.24;
const RADIUS_MAX = 0.38;

/** Channel-wise linear interpolation from a to b, rounded. */
export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

/** Fill color for a cell: family hue, shaded by societal, washed to cream. */
export function cellColor(religious: number, societal: number, societalCount: number): Rgb {
  const t = societalCount <= 1 ? 0 : societal / (societalCount - 1);
  const shaded = mix(FAMILIES[religious], BG, SHADE_MIN + SHADE_SPAN * t);
  return mix(shaded, BG, WASH);
}

/** Dot opacity from the logical trait. */
export function cellAlpha(logical: number, logicalCount: number): number {
  const t = logicalCount <= 1 ? 1 : logical / (logicalCount - 1);
  return ALPHA_MIN + (1 - ALPHA_MIN) * t;
}

/** Dot radius in px from the economical trait; never overflows the slot. */
export function cellRadius(economical: number, economicalCount: number, cellPx: number): number {
  const t = economicalCount <= 1 ? 1 : economical / (economicalCount - 1);
  return (RADIUS_MIN + (RADIUS_MAX - RADIUS_MIN) * t) * cellPx;
}

/** Deep-brown zealot pin — logo #472c1f, the anchor color. */
export const ZEALOT_PIN: Rgb = { r: 71, g: 44, b: 31 };

/**
 * Saturated agent color: same hue/shade math as cells but WITHOUT the wash.
 * Used for the Phase 2 figures (migrants, hub rings) that sit above the
 * quiet ground.
 */
export function agentColor(religious: number, societal: number, societalCount: number): Rgb {
  const t = societalCount <= 1 ? 0 : societal / (societalCount - 1);
  return mix(FAMILIES[religious], BG, SHADE_MIN + SHADE_SPAN * t);
}
