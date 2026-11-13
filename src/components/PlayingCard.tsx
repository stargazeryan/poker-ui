import { Children, type ReactNode } from "react";
import { FAN_PIVOT, fanAngles } from "../fan";
import { cn } from "../cn";
import { CARD_HEIGHT, CARD_WIDTH } from "../cardSize";
import { describeCard, getSuitSymbol, isKnownSuit, isRedSuit, parseCard } from "../cards";
import { STAGGER_MS } from "../motion";
import { type CardSize } from "../sizes";

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

/**
 * The four-colour deck: diamonds blue, clubs green.
 *
 * A standard deck tells hearts from diamonds, and spades from clubs, by hue
 * alone — the cue a colour-blind player does not have. At xs and sm there is no
 * room for the suit letter beside the rank either, so the hue is the *only* cue
 * on a small card. The four-colour deck is the online-poker answer to that, and
 * it stays opt-in because it is not what a physical deck looks like.
 */
const FOUR_COLOR_SUIT: Record<string, string> = {
  h: "text-red-600",
  d: "text-blue-700",
  c: "text-green-700",
  s: "text-neutral-900",
};

function getSuitClass(suit: string, fourColor = false): string {
  if (fourColor) {
    const cls = FOUR_COLOR_SUIT[suit];
    if (cls) return cls;
  }
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
   * A face-down card defaults to "face-down card" instead, and a card that is
   * hidden keeps that name whatever code it is holding.
   */
  label?: string;
  /**
   * Draw the suit in four colours — diamonds blue, clubs green — so the suit is
   * not carried by red-versus-black alone. The accessible name is unchanged.
   * Default false.
   */
  fourColor?: boolean;
  /**
   * Which side is showing. Defaults to `card !== null`: a code is a face, a null
   * is a back.
   *
   * `revealed={false}` draws the back of a card you *do* have the code for, and
   * nothing of that code is rendered while it is hidden — not the rank, not the
   * suit, and not the accessible name, which stays "face-down card". A card a
   * player is not meant to see should not be readable in the DOM.
   */
  revealed?: boolean;
  /**
   * Turn the card over. `revealed` says which side is showing; this says when the
   * turn happens, and the two are separate so that a card can be *shown* without
   * being *animated*.
   *
   * Give it a value and the card turns from back to face: on mount, for a card
   * that arrives already revealed — a street being dealt — and again whenever the
   * value changes, the way `CardRow`'s `enterKey` re-deals an unchanged hand.
   * A card that never gets a key simply appears, because a component that guessed
   * at a turn would flip every card on every re-render.
   *
   * The turn is one way — back to face — so a key on a hidden card does nothing.
   * Under `prefers-reduced-motion` the card arrives on its face instead.
   */
  flipKey?: string | number;
  className?: string;
}

const CARD_FACE =
  "bg-gradient-to-br from-white via-white to-neutral-100 rounded-md border border-neutral-300/90 overflow-hidden shadow-[0_2px_6px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.9)]";

/**
 * A single card. Size is driven by the `size` prop (never viewport
 * breakpoints) so cards scale predictably inside any container. Small sizes
 * (xs / sm) show only a larger upright index, centered in the card.
 *
 * Both sides are one element: the back sits at 180° behind the face, which is
 * what lets a card in a row turn over rather than be replaced by another card.
 * The caller drives it — `revealed` for which side, `flipKey` for the turn; see
 * the props.
 */
export function PlayingCard({
  card,
  size = "md",
  label,
  fourColor = false,
  revealed,
  flipKey,
  className,
}: PlayingCardProps) {
  const showFace = card !== null && (revealed ?? true);
  // A turn is one way: back to face. A key on a hidden card has no side to turn
  // to, so it is ignored rather than flipping the back away and back.
  const turning = showFace && flipKey !== undefined;

  /**
   * The card's own box, with one side or the other inside it: the outer element
   * is the size the table measures and the name a screen reader reads, and the
   * two sides are the card.
   */
  const shell = (face: ReactNode) => (
    <div
      role="img"
      aria-label={showFace && card !== null ? (label ?? describeCard(card)) : (label ?? "face-down card")}
      className={cn(SIZE_CLASSES[size], "[perspective:800px]")}
      style={{ aspectRatio: "10/14" }}
    >
      <div
        // A new key is a new element, so the CSS animation starts again — the
        // trick CardRow plays with `enterKey`.
        key={turning ? `flip:${flipKey}` : "card"}
        className={cn("relative h-full w-full", turning && "animate-card-flip")}
        style={{ transformStyle: "preserve-3d", ...(showFace ? null : { transform: "rotateY(180deg)" }) }}
      >
        {showFace && (
          <div className={cn("absolute inset-0 [backface-visibility:hidden]", CARD_FACE, className)}>{face}</div>
        )}
        {/*
         * The back is drawn when it can be seen or is about to be: a card that is
         * face down, or a card that is turning over. A card that only ever faces
         * up does not carry one.
         *
         * It is `CardBack` itself, one layer down and out of the accessible tree
         * — the card's own element carries the name, and one card should be one
         * image to a screen reader rather than two.
         */}
        {(turning || !showFace) && (
          <div
            className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]"
            aria-hidden="true"
          >
            <CardBackArt size={size} className={className} />
          </div>
        )}
      </div>
    </div>
  );

  if (!showFace || card === null) return shell(null);

  const { rank, suit } = parseCard(card);
  const suitSymbol = getSuitSymbol(suit);
  const suitClass = getSuitClass(suit, fourColor);
  const large = size === "md" || size === "lg";

  // Small cards: rank centered in the top half, suit centered in the bottom half.
  if (!large) {
    return shell(
      <div className={cn("absolute inset-0 flex flex-col leading-none", suitClass)}>
        <div className="flex flex-1 items-center justify-center">
          <span className={cn(SMALL_RANK[size], "font-bold tracking-tight")}>{rank}</span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <span className={cn(SMALL_SUIT[size], "-mt-[8px]")}>{suitSymbol}</span>
        </div>
      </div>,
    );
  }

  return shell(
    <>
      <div className={cn("absolute top-[3px] left-[5px] flex flex-col items-center leading-none", suitClass)}>
        <span className={cn(CORNER_RANK[size], "font-bold tracking-tight")}>{rank}</span>
        <span className={cn(CORNER_SUIT[size], "-mt-[8px]")}>{suitSymbol}</span>
      </div>
      <div className={cn("absolute bottom-[3px] right-[5px] flex flex-col items-center leading-none rotate-180", suitClass)}>
        <span className={cn(CORNER_RANK[size], "font-bold tracking-tight")}>{rank}</span>
        <span className={cn(CORNER_SUIT[size], "-mt-[8px]")}>{suitSymbol}</span>
      </div>
      <div className={cn("absolute inset-0 flex items-center justify-center opacity-90", suitClass)}>
        <span className={CENTER_SUIT[size]}>{suitSymbol}</span>
      </div>
    </>,
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

/**
 * The back's art, with no accessible name of its own. `CardBack` puts one on it,
 * and `PlayingCard` draws it as the far side of a card whose own element already
 * carries the name — one card should be one image to a screen reader, not two.
 */
function CardBackArt({
  size,
  className,
  role,
  label,
}: {
  size: CardSize;
  className?: string;
  role?: string;
  label?: string;
}) {
  return (
    <div
      role={role}
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

/** The face-down card back (dark red + gold rosette). */
export function CardBack({ size = "md", label = "face-down card", className }: CardBackProps) {
  return <CardBackArt size={size} label={label} role="img" className={className} />;
}

/**
 * How a card arrives: sliding in, or not at all. A card *turning over* is not an
 * arrival and is not here — a turn belongs to the card (`PlayingCard`'s
 * `flipKey`), because a row does not hold the other side of a card it did not
 * draw and cannot turn one over itself.
 */
export type CardEntrance = "deal" | false;

export interface CardRowProps {
  /**
   * The cards, in order — anything that draws a card: a `PlayingCard`, a
   * `CardSlot` waiting for one, a card with a badge on it. The row arranges; it
   * does not size, name or flip what it is handed. One child is one position, and
   * a `null`/`false`/`undefined` child is skipped, so a conditional
   * (`{hand.map((c, i) => i < 5 && <PlayingCard key={i} card={c} />)}`) reserves
   * nothing and draws nothing.
   */
  children?: ReactNode;
  /**
   * How the cards arrive. `"deal"` slides each card in (the default), `false`
   * renders the row static. The arrival is the row's — it is the thing that knows
   * the order and the stagger — and is not a card turning over, which is the
   * card's own (`PlayingCard`'s `flipKey`).
   */
  enter?: CardEntrance;
  /** Delay between neighbouring cards, in ms. Defaults to `STAGGER_MS`. */
  stagger?: number;
  /**
   * Change this to replay the entrance for an unchanged row (e.g. a hand id or a
   * round number). A child whose own `key` changed re-enters on its own, because
   * the entrance hangs on a wrapper keyed by it.
   */
  enterKey?: string | number;
  /**
   * How much each card tucks under the one before it, in px — the fan's spacing.
   * `fanOverlap` answers it from a card's width and the width the hand has to fit.
   *
   * Give it and it **replaces the row's gap**: the row lays its cards out edge to
   * edge and pulls them together by this much, so 20 on 40px cards is half a card
   * showing. Without it the row keeps `gap-2`, which `className="gap-4"` can change.
   */
  overlap?: number;
  /**
   * Total spread in degrees: the cards splay like a held hand, each turning by its
   * share of this about a pivot below the row (`FAN_PIVOT`), so the tops come apart
   * while the bottoms stay together.
   *
   * The turn is a `transform`, so the row gives an arced card one layer of its own
   * inside the entrance wrapper — the arrival animates `transform` too, and two of
   * them on one element would flatten the arc. A row that is not arced has no such
   * layer, so turning the arc on remounts the cards.
   */
  arc?: number;
  /**
   * Accessible name for the row — "Your hand", "The board", the dealer's. A row
   * is a group of cards that belong together, and this is how a screen reader
   * gets to hear that; nothing is named by default, because *what* a row is
   * belongs to the game. Without a label no role is added at all.
   */
  label?: string;
  className?: string;
}

/** A child's own key, if it has one — `Children.toArray` gives every element one. */
function keyOf(child: ReactNode): string | number {
  const key =
    typeof child === "object" && child !== null && "key" in child ? (child as { key?: string | null }).key : null;
  return key ?? "";
}

/**
 * A row of cards — a hand, a board, a meld, a dealer's up-cards. It arranges what
 * you give it: one position per child, the arrival, the overlap and the arc.
 *
 * There is no `size` here, and no way to be told one: a card knows its own size, and
 * the row never measures or boxes what it is handed — which is why a `CardSlot` can
 * hold a position open beside three cards. A hand that has to fit a frame is
 * `fanOverlap` for the spacing and `cardSizeFor` for the size, both the caller's.
 */
export function CardRow({
  children,
  enter = "deal",
  stagger,
  enterKey,
  overlap = 0,
  arc = 0,
  label,
  className,
}: CardRowProps) {
  const step = stagger ?? STAGGER_MS;
  const cards = Children.toArray(children);
  const angles = fanAngles(cards.length, arc);

  return (
    <div
      role={label === undefined ? undefined : "group"}
      aria-label={label}
      className={cn("flex", overlap > 0 ? "gap-0" : "gap-2", className)}
    >
      {cards.map((child, i) => {
        const angle = angles[i];
        return (
          <div
            // The wrapper is what carries the entrance, so it is keyed by the child:
            // a card that changed is a position that arrives again.
            key={`${enterKey ?? ""}:${keyOf(child) || i}`}
            className={enter === "deal" ? "animate-deal-in" : undefined}
            style={{
              animationDelay: enter ? `${i * step}ms` : undefined,
              marginInlineStart: overlap > 0 && i > 0 ? -overlap : undefined,
            }}
          >
            {angle === 0 ? (
              child
            ) : (
              // A layer of its own, because the entrance above animates `transform`.
              <div style={{ transform: `rotate(${angle}deg)`, transformOrigin: `50% ${FAN_PIVOT * 100}%` }}>
                {child}
              </div>
            )}
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
