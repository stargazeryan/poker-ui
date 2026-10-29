import type { ReactNode } from "react";
import { cn } from "../cn";
import { CARD_HEIGHT, CARD_WIDTH } from "../cardSize";
import { describeCard, getSuitSymbol, isKnownSuit, isRedSuit, parseCard } from "../cards";
import { FLIP_MS, STAGGER_MS } from "../motion";
import { type CardSize } from "../sizes";

/*
 * Card helpers are re-exported from here so imports from this module keep
 * working; they live in `cards.ts` now, next to the naming they belong with.
 */
export { describeCard, getRankName, getSuitName, getSuitSymbol, isKnownSuit, isRedSuit, parseCard } from "../cards";
export type { ParsedCard } from "../cards";
export type { CardSize } from "../sizes";

const SIZE_CLASSES: Record<CardSize, string> = {
  xs: "w-8 h-11",
  sm: "w-10 h-14",
  md: "w-16 h-22",
  lg: "w-24 h-32",
};

const CORNER_RANK: Record<CardSize, string> = {
  xs: "text-[11px]",
  sm: "text-sm",
  md: "text-lg",
  lg: "text-2xl",
};
const CORNER_SUIT: Record<CardSize, string> = {
  xs: "text-[9px]",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
};
const CENTER_SUIT: Record<CardSize, string> = {
  xs: "text-base",
  sm: "text-xl",
  md: "text-3xl",
  lg: "text-5xl",
};
// Small cards (xs/sm) show a single, larger index centered in the card.
const SMALL_RANK: Partial<Record<CardSize, string>> = {
  xs: "text-base",
  sm: "text-xl",
};
const SMALL_SUIT: Partial<Record<CardSize, string>> = {
  xs: "text-lg",
  sm: "text-2xl",
};
const BACK_EMBLEM_SIZE: Record<CardSize, number> = {
  xs: 14,
  sm: 18,
  md: 28,
  lg: 42,
};

function getSuitClass(suit: string): string {
  if (isRedSuit(suit)) return "text-red-600";
  return isKnownSuit(suit) ? "text-neutral-900" : "";
}

export interface PlayingCardProps {
  /** Compact card code ("As", "10h") or null to render a face-down card back. */
  card: string | null;
  /** xs / sm show a single, larger, centered index; md / lg show corner + center. */
  size?: CardSize;
  /**
   * Accessible name. Defaults to `describeCard(card)` — "Ace of spades" rather
   * than the fragments "A" and "♠" a screen reader would otherwise read out.
   */
  label?: string;
  className?: string;
}

const CARD_FACE = "relative bg-gradient-to-br from-white via-white to-neutral-100 rounded-md border border-neutral-300/90 overflow-hidden shadow-[0_2px_6px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.9)]";

/**
 * A single card. Size is driven by the `size` prop (never viewport
 * breakpoints) so cards scale predictably inside any container. Small sizes
 * (xs / sm) show only a larger upright index, centered in the card.
 */
export function PlayingCard({ card, size = "md", label, className }: PlayingCardProps) {
  if (!card) return <CardBack size={size} className={className} label={label} />;

  const name = label ?? describeCard(card);

  const { rank, suit } = parseCard(card);
  const suitSymbol = getSuitSymbol(suit);
  const suitClass = getSuitClass(suit);
  const large = size === "md" || size === "lg";

  // Small cards: rank centered in the top half, suit centered in the bottom half.
  if (!large) {
    return (
      <div
        role="img"
        aria-label={name}
        className={cn(SIZE_CLASSES[size], CARD_FACE, className)}
        style={{ aspectRatio: "10/14" }}
      >
        <div className={cn("absolute inset-0 flex flex-col leading-none", suitClass)}>
          <div className="flex flex-1 items-center justify-center">
            <span className={cn(SMALL_RANK[size], "font-bold tracking-tight")}>{rank}</span>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <span className={SMALL_SUIT[size]}>{suitSymbol}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={name}
      className={cn(SIZE_CLASSES[size], CARD_FACE, className)}
      style={{ aspectRatio: "10/14" }}
    >
      <div className={cn("absolute top-[3px] left-[5px] flex flex-col items-center leading-none", suitClass)}>
        <span className={cn(CORNER_RANK[size], "font-bold tracking-tight")}>{rank}</span>
        <span className={cn(CORNER_SUIT[size], "-mt-[1px]")}>{suitSymbol}</span>
      </div>
      <div className={cn("absolute bottom-[3px] right-[5px] flex flex-col items-center leading-none rotate-180", suitClass)}>
        <span className={cn(CORNER_RANK[size], "font-bold tracking-tight")}>{rank}</span>
        <span className={cn(CORNER_SUIT[size], "-mt-[1px]")}>{suitSymbol}</span>
      </div>
      <div className={cn("absolute inset-0 flex items-center justify-center opacity-90", suitClass)}>
        <span className={CENTER_SUIT[size]}>{suitSymbol}</span>
      </div>
    </div>
  );
}

export interface CardBackProps {
  size?: CardSize;
  /** Accessible name. Defaults to "face-down card". */
  label?: string;
  className?: string;
}

function CardBackEmblem({ size }: { size: CardSize }) {
  const s = BACK_EMBLEM_SIZE[size];
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" aria-hidden="true">
      <g fill="var(--color-card-back-emblem, #f0c04a)" opacity="0.92">
        <ellipse cx="20" cy="11" rx="4" ry="7" />
        <ellipse cx="20" cy="29" rx="4" ry="7" />
        <ellipse cx="11" cy="20" rx="7" ry="4" />
        <ellipse cx="29" cy="20" rx="7" ry="4" />
      </g>
      <circle cx="20" cy="20" r="3.2" fill="var(--color-card-back, #5a0c18)" />
    </svg>
  );
}

/** The face-down card back (dark red + gold rosette). */
export function CardBack({ size = "md", label = "face-down card", className }: CardBackProps) {
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        SIZE_CLASSES[size],
        "relative rounded-md p-[3px] overflow-hidden",
        "bg-gradient-to-br from-card-back-light via-card-back to-card-back-dark",
        "border-2 border-card-back-ink/70 shadow-[0_2px_6px_rgba(0,0,0,0.45)]",
        className,
      )}
      style={{ aspectRatio: "10/14" }}
    >
      <div className="h-full w-full rounded-[4px] border border-white/20 flex items-center justify-center bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.09)_0_6px,transparent_6px_12px),repeating-linear-gradient(-45deg,rgba(255,255,255,0.06)_0_6px,transparent_6px_12px)]">
        <CardBackEmblem size={size} />
      </div>
    </div>
  );
}

/** How a card arrives: sliding in, turning over, or not at all. */
export type CardAnimation = "deal" | "flip" | false;

export interface CardRowProps {
  cards: (string | null)[];
  /** Default `"md"`. */
  size?: CardSize;
  /**
   * Arrival animation. `"deal"` slides each card in (the default), `"flip"`
   * turns it over in 3D, `false` renders the row static.
   */
  animation?: CardAnimation;
  /** Delay between neighbouring cards, in ms. Defaults to `STAGGER_MS` / `FLIP_MS`. */
  stagger?: number;
  /**
   * Change this to replay the animation for an unchanged row (e.g. a hand id or
   * a round number). Without it, a card whose value changed re-animates on its
   * own, but a new hand holding the same cards looks identical.
   */
  animationKey?: string | number;
  /**
   * Reserve this many slots, so the row's width never changes as cards arrive.
   * Positions past the end of `cards` render as empty space.
   */
  slots?: number;
  /**
   * What a `null` **within** `cards` means: `"back"` (default) is a face-down
   * card, `"empty"` is an undealt position. Past the end of the array is always
   * empty.
   */
  placeholder?: "back" | "empty";
  className?: string;
}

/**
 * A row of cards — a hand, a board, a meld, a dealer's up-cards. One component
 * with one animation prop, rather than a component per game term: the
 * arrangement and the entrance are the same in every card game, and only the
 * vocabulary differs.
 */
export function CardRow({
  cards,
  size = "md",
  animation = "deal",
  stagger,
  animationKey,
  slots,
  placeholder = "back",
  className,
}: CardRowProps) {
  const count = Math.max(slots ?? cards.length, cards.length);
  const step = stagger ?? (animation === "flip" ? FLIP_MS : STAGGER_MS);
  const shown = Array.from({ length: count }, (_, i) => (i < cards.length ? cards[i] : undefined));

  return (
    <div className={cn("flex gap-2", animation === "flip" && "[perspective:800px]", className)}>
      {shown.map((card, i) => {
        const key =
          animation === "deal"
            ? animationKey !== undefined
              ? `${animationKey}:${i}`
              : `${i}:${card ?? "back"}`
            : `${animationKey ?? ""}:${i}`;
        const style = animation ? { animationDelay: `${i * step}ms` } : undefined;
        const animClass =
          animation === "deal" ? "animate-deal-in" : animation === "flip" ? "animate-card-flip" : undefined;

        if (card === undefined) {
          // Past the end of `cards`: an undealt position keeps the row's width.
          return <div key={`${i}:empty`} className={SIZE_CLASSES[size]} style={{ aspectRatio: "10/14" }} />;
        }
        if (card === null && placeholder === "empty") {
          return <div key={`${i}:gap`} className={SIZE_CLASSES[size]} style={{ aspectRatio: "10/14" }} />;
        }

        return (
          <div
            key={key}
            className={cn(SIZE_CLASSES[size], animClass)}
            style={{ aspectRatio: "10/14", ...style }}
          >
            <PlayingCard card={card} size={size} />
          </div>
        );
      })}
    </div>
  );
}

export interface CardSlotProps {
  /** Default `"md"`. */
  size?: CardSize;
  /** Accessible name for the empty slot. Default "empty card slot". */
  label?: string;
  /** Put a card (or anything else) in the slot. */
  children?: ReactNode;
  className?: string;
}

/**
 * A reserved position for a card that may or may not be there yet — a board
 * that is half dealt, a three-card game's three positions, a face-down slot.
 * Renders as a dashed outline when empty, so a client can lay out the final
 * shape of a game before any card exists.
 */
export function CardSlot({ size = "md", label = "empty card slot", children, className }: CardSlotProps) {
  const filled = children !== undefined && children !== null;
  return (
    <div
      // An empty slot announces itself; a filled one is only a frame, so the
      // card inside keeps its own accessible name instead of being shadowed.
      role={filled ? undefined : "img"}
      aria-label={filled ? undefined : label}
      className={cn(
        "relative flex items-center justify-center rounded-md border-2 border-dashed border-white/15",
        className,
      )}
      style={{ width: CARD_WIDTH[size], height: CARD_HEIGHT[size] }}
    >
      {children}
    </div>
  );
}

export interface CardFanProps {
  cards: (string | null)[];
  /** Default `"lg"`. */
  size?: CardSize;
  /** How much neighbouring cards overlap, 0–0.95 of a card width. Default 0.55. */
  overlap?: number;
  /** Total spread in degrees. `0` (the default) is a flat overlapping row. */
  arc?: number;
  className?: string;
}

/**
 * Overlapping cards, optionally fanned into an arc — the shape a large hand
 * wants. A 13-card hand at `size="sm"` laid out flat is wider than any seat
 * frame; overlapped, it fits.
 */
export function CardFan({ cards, size = "lg", overlap = 0.55, arc = 0, className }: CardFanProps) {
  const width = CARD_WIDTH[size];
  const height = CARD_HEIGHT[size];
  const n = cards.length;
  const step = width * (1 - Math.min(0.95, Math.max(0, overlap)));
  const mid = (n - 1) / 2;
  const total = (n - 1) * step;
  // The cards pivot about a point below the row, so a non-zero arc splays the
  // tops apart while the bottoms stay together — a held hand, not a row.
  const pivot = height * 0.35;

  return (
    <div className={cn("relative", className)} style={{ width: total + width, height }}>
      {cards.map((card, i) => {
        const t = n === 1 ? 0 : (i - mid) / mid;
        const rotate = (t * arc) / 2;
        return (
          <div
            key={`${i}:${card ?? "back"}`}
            className="absolute top-0"
            style={{
              left: i * step,
              transform: rotate === 0 ? undefined : `rotate(${rotate}deg)`,
              transformOrigin: rotate === 0 ? undefined : `50% calc(100% + ${pivot}px)`,
            }}
          >
            <PlayingCard card={card} size={size} />
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------- deprecated names -- */

export interface HoleCardsProps {
  cards: (string | null)[];
  size?: CardSize;
  className?: string;
  /** Animate the cards dealing in, one after another. Default true. */
  deal?: boolean;
  /**
   * Change this to replay the deal animation for an unchanged hand (e.g. a hand
   * id or a round number).
   */
  dealKey?: string | number;
}

/** @deprecated Renamed to `CardRow`. `HoleCards` is a Hold'em word for a row of cards. */
export function HoleCards({ cards, size = "lg", className, deal = true, dealKey }: HoleCardsProps) {
  return (
    <CardRow
      cards={cards}
      size={size}
      className={className}
      animation={deal ? "deal" : false}
      animationKey={dealKey}
    />
  );
}

export interface CommunityCardsProps {
  cards: (string | null)[];
  size?: CardSize;
  className?: string;
  /** Animate each card with a 3D flip. Default true. */
  animated?: boolean;
  /**
   * Reserve a fixed number of slots so the row width never changes.
   * A `null` inside `cards` renders as a **card back** here, where it used to
   * render as empty space — pass a shorter array to leave undealt positions.
   */
  slots?: number;
}

/** @deprecated Renamed to `CardRow` with `animation="flip"`. "Community" is a Hold'em word. */
export function CommunityCards({ cards, size = "md", className, animated = true, slots }: CommunityCardsProps) {
  return (
    <CardRow
      cards={cards}
      size={size}
      className={className}
      animation={animated ? "flip" : false}
      slots={slots}
      placeholder="empty"
    />
  );
}
