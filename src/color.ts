/**
 * Colour maths. Nothing here knows about cards, chips or games — this is the
 * generic layer that contrast decisions are built on.
 *
 * It exists because the package needs to answer "would this be visible on top of
 * that?" in more than one place (edge spots on a chip, and anything else that
 * grows a light/dark ink choice later), and that question should not live inside
 * a component or a game-specific module.
 */

export interface Rgba {
  r: number;
  g: number;
  b: number;
  /** 0–1. */
  a: number;
}

/**
 * Parse `#rgb`, `#rrggbb`, `rgb()` or `rgba()` into channels.
 *
 * Returns `null` for anything else — a `var(...)`, a named colour, a value with
 * a color-mix() in it. Callers are expected to have a sensible fallback rather
 * than guess, which is why this does not throw.
 */
export function parseColor(color: string): Rgba | null {
  const input = color.trim();
  const hex = input.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    const raw = hex[1];
    if (raw.length === 3 || raw.length === 4) {
      const [r, g, b, a] = raw.split("").map((c) => parseInt(c + c, 16));
      return { r, g, b, a: raw.length === 4 ? a / 255 : 1 };
    }
    if (raw.length === 6 || raw.length === 8) {
      return {
        r: parseInt(raw.slice(0, 2), 16),
        g: parseInt(raw.slice(2, 4), 16),
        b: parseInt(raw.slice(4, 6), 16),
        a: raw.length === 8 ? parseInt(raw.slice(6, 8), 16) / 255 : 1,
      };
    }
    return null;
  }

  const fn = input.match(/^rgba?\(([^)]+)\)$/i);
  if (!fn) return null;
  const parts = fn[1].split(/[,\s/]+/).filter(Boolean).map(Number);
  if (parts.length < 3 || parts.slice(0, 3).some((n) => !Number.isFinite(n))) return null;
  return { r: parts[0], g: parts[1], b: parts[2], a: Number.isFinite(parts[3]) ? parts[3] : 1 };
}

/** WCAG relative luminance (0 = black, 1 = white). `null` if unparseable. */
export function relativeLuminance(color: string): number | null {
  const parsed = parseColor(color);
  if (!parsed) return null;
  const channel = (c: number) => {
    const s = Math.min(255, Math.max(0, c)) / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(parsed.r) + 0.7152 * channel(parsed.g) + 0.0722 * channel(parsed.b);
}

/** Composite a possibly translucent colour over an opaque one. */
export function flatten(foreground: string, background: string): Rgba | null {
  const fg = parseColor(foreground);
  const bg = parseColor(background);
  if (!fg || !bg) return null;
  const mix = (f: number, b: number) => fg.a * f + (1 - fg.a) * b;
  return { r: mix(fg.r, bg.r), g: mix(fg.g, bg.g), b: mix(fg.b, bg.b), a: 1 };
}

/**
 * WCAG contrast ratio between two colours, 1–21. `foreground` may be
 * translucent, in which case it is composited over `background` first — which is
 * the question you actually have when you are choosing an ink colour.
 *
 * `null` if either colour is unparseable.
 */
export function contrastRatio(foreground: string, background: string): number | null {
  const composited = flatten(foreground, background);
  if (!composited) return null;
  const a = relativeLuminance(`rgb(${composited.r}, ${composited.g}, ${composited.b})`);
  const b = relativeLuminance(background);
  if (a === null || b === null) return null;
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Pick whichever candidate is more visible on `background`.
 *
 * Derived from measured contrast rather than a hand-tuned luminance threshold,
 * so a mid-tone background gets the genuinely better of the two instead of
 * whichever side of an arbitrary cut-off it fell on. Falls back to the first
 * candidate when the background cannot be measured.
 */
export function mostVisible(candidates: readonly string[], background: string): string {
  let best = candidates[0];
  let bestRatio = -1;
  for (const candidate of candidates) {
    const ratio = contrastRatio(candidate, background);
    if (ratio !== null && ratio > bestRatio) {
      best = candidate;
      bestRatio = ratio;
    }
  }
  return best;
}
