/**
 * Pure ellipse geometry for the card table. No game rules, no React.
 *
 * Everything is derived from one parametric ellipse:
 *
 *   x(θ) = cx + rx·cos θ
 *   y(θ) = cy + ry·sin θ
 *
 * with θ in degrees. Screen coordinates (y grows downward), so θ = 90° is the
 * point directly BELOW the centre.
 *
 * Seat 0 sits at `startAngle` (default 90° = directly below the centre) and
 * every following seat advances by `360 / seatCount`, so any count from 2 to 10
 * spreads evenly. The betting line uses the same formula with a smaller radius.
 */

export interface Point {
  x: number;
  y: number;
}

/** Normalise a seat count to a positive integer. */
function normCount(count: number): number {
  const n = Math.floor(count);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Ring angle (degrees) of seat `index`, evenly divided around 360°.
 * Seat 0 is at `startAngle` (default 90° = directly below the table centre).
 */
export function seatAngle(index: number, seatCount: number, startAngle = 90): number {
  const n = normCount(seatCount);
  return startAngle + (index * 360) / n;
}

/** Point on the ellipse at `angleDeg` (degrees; 90° = below the centre). */
export function ellipsePoint(cx: number, cy: number, rx: number, ry: number, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) };
}

/**
 * `count` evenly spaced points on an ellipse, starting at `startAngle`
 * (default 90° = directly below the centre). Handy for seat rings and betting
 * lines alike: pass the ring radii, get the coordinates.
 */
export function ringPoints(
  count: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startAngle = 90,
): Point[] {
  const n = normCount(count);
  return Array.from({ length: n }, (_, i) => ellipsePoint(cx, cy, rx, ry, seatAngle(i, n, startAngle)));
}
