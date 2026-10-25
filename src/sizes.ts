/**
 * The size vocabulary, in one place.
 *
 * Cards and chips keep their own pixel tables — a `sm` card and a `sm` chip are
 * different objects and pretending otherwise would be worse — but they share one
 * list of names. That way adding an `xl` to the vocabulary is a single edit and
 * a component cannot silently support a size the type does not mention.
 */

export const SIZES = ["xs", "sm", "md", "lg"] as const;

/** Any size in the vocabulary. */
export type Size = (typeof SIZES)[number];

/** `PlayingCard` / `HoleCards` / `CommunityCards`: the full range. */
export type CardSize = Size;

/** `Chip` / `ChipStack`: a chip has no `xs`. */
export type ChipSize = Exclude<Size, "xs">;
