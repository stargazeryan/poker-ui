/**
 * Card codes and how to say them out loud. Pure functions, no React.
 *
 * This lives outside the component because two things need it: the artwork
 * (`PlayingCard` / `CardBack`, for the accessible name) and any consumer
 * building a hand list, a log line or a replay. A single vocabulary is what
 * stops every call site inventing its own way of saying "As".
 */

export interface ParsedCard {
  rank: string;
  suit: string;
}

const RANK_NAMES: Record<string, string> = {
  A: "Ace",
  K: "King",
  Q: "Queen",
  J: "Jack",
  "10": "Ten",
  "9": "Nine",
  "8": "Eight",
  "7": "Seven",
  "6": "Six",
  "5": "Five",
  "4": "Four",
  "3": "Three",
  "2": "Two",
};

const SUIT_NAMES: Record<string, string> = {
  s: "spades",
  h: "hearts",
  d: "diamonds",
  c: "clubs",
};

const SUIT_SYMBOLS: Record<string, string> = {
  s: "\u2660",
  h: "\u2665",
  d: "\u2666",
  c: "\u2663",
};

/**
 * Split a compact card code like `"As"` or `"10h"` into rank and suit.
 *
 * Deliberately permissive: it takes the last character as the suit and trusts
 * the rest, so `"xyz"` parses as rank `"xy"` / suit `"z"`. Validation is a known
 * gap — use `describeCard`, which falls back to the raw code rather than
 * pretending to know what it read.
 */
export function parseCard(card: string): ParsedCard {
  if (!card || card.length < 2) return { rank: "", suit: "" };
  return { rank: card.slice(0, -1), suit: card.slice(-1).toLowerCase() };
}

/** The glyph for a suit letter. Unknown suits are passed through unchanged. */
export function getSuitSymbol(suit: string): string {
  return SUIT_SYMBOLS[suit.toLowerCase()] ?? suit;
}

/** `"A"` → `"Ace"`, `"10"` → `"Ten"`. Unknown ranks pass through. */
export function getRankName(rank: string): string {
  return RANK_NAMES[rank.toUpperCase()] ?? rank;
}

/** `"s"` → `"spades"`. Unknown suits pass through. */
export function getSuitName(suit: string): string {
  return SUIT_NAMES[suit.toLowerCase()] ?? suit;
}

/** Hearts and diamonds are the red ones. */
export function isRedSuit(suit: string): boolean {
  const s = suit.toLowerCase();
  return s === "h" || s === "d";
}

/** Whether a suit letter is one this package knows how to draw. */
export function isKnownSuit(suit: string): boolean {
  return suit.toLowerCase() in SUIT_SYMBOLS;
}

/**
 * A spoken description: `"As"` → `"Ace of spades"`, `null` → `"face-down card"`.
 *
 * Returns the raw code when the rank or suit is not recognised, rather than
 * announcing something the card is not.
 */
export function describeCard(card: string | null): string {
  if (card === null || card === "") return "face-down card";
  const { rank, suit } = parseCard(card);
  const rankName = RANK_NAMES[rank.toUpperCase()];
  const suitName = SUIT_NAMES[suit];
  if (!rankName || !suitName) return card;
  return `${rankName} of ${suitName}`;
}
