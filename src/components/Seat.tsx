import type { CSSProperties, ReactNode } from "react";
import { cn } from "../cn";
import { MIN_TEXT_PX, readableScale, useDesignScale } from "../designScale";
import { DEFAULT_SEAT_H, DEFAULT_SEAT_W } from "../layout";
import { useSeatSize } from "./seatSize";

/** The size `Seat` draws its own rows at — what the text floor is measured against. */
const ROW_TEXT_PX = 11;

/**
 * The winner's fill: gold mixed **into** the surface colour, not laid over it.
 *
 * Written as one arbitrary background-image on purpose. A `bg-gold/25` over
 * `bg-surface/80` is a translucent wash over a translucent seat, so 20% of the felt
 * comes through it and the winner is mossy green across the rail and amber off it —
 * and those two are one tailwind-merge group, so in a single `cn()` only the later
 * of them would survive. A background-image is a group of its own and is painted
 * above the seat's `bg-surface/80`, which is what lets one opaque fill cover it.
 *
 * Mixing into the surface keeps the fill themed — `--color-gold` and
 * `--color-surface` are still the knobs — while making it opaque.
 */
const WINNER_WASH =
  "bg-[linear-gradient(to_bottom,color-mix(in_oklab,var(--color-gold)_35%,var(--color-surface)),color-mix(in_oklab,var(--color-gold)_15%,var(--color-surface)))]";

/**
 * How far a floating slot hangs off the frame, as a fraction of the frame.
 *
 * These were fixed px (-48px for `above`, -12px for `topLeft`). A ring shrinks
 * its frames — a sixteen-seat ring ends up at 80x88 — and against a frame that
 * size a 48px offset is most of the seat: the bubble covered the name, and in
 * the docs' own slots demo `above` landed on the `header` row.
 *
 * At the default 160x176 every value below rounds to the px it replaced, except
 * `above`, which is now anchored to the frame's top edge (`bottom: 100%`) instead
 * of a fixed offset — so it stays attached whatever height the bubble is, and
 * lands inside the room the ring already leaves for it.
 */
const FLOAT = {
  above: 0.03,
  below: 0.02,
  topCenter: 0.045,
  topLeft: 0.068,
  topRight: 0.045,
  /** Horizontal inset of the corner slots, as a fraction of the frame width. */
  cornerX: 0.05,
} as const;

export interface SeatProps {
  /**
   * Turn/current highlight. "Active" rather than "your turn": what makes a seat
   * current is the game's business, and the frame only draws the state.
   */
  isActive?: boolean;
  /** Win highlight. */
  isWinner?: boolean;
  /** Dimmed — out of the hand, disconnected, empty. */
  isDimmed?: boolean;
  /** Enable the turn/winner glow animations. Default true. */
  animated?: boolean;
  /** Optional click handler (e.g. "sit here"). */
  onClick?: () => void;
  /**
   * Accessible name for the frame — "Seat 3", "Ryan". It becomes the button's
   * name when `onClick` is given and the group's name otherwise. Without it a
   * frame is named by what is inside it, which for a seat holding two cards is a
   * reading of the cards rather than of the seat.
   */
  label?: string;
  /**
   * The smallest px this frame's own rows may be drawn at on screen. The rows are
   * 11px in design space, and a table scales its whole design box to fit its
   * container — 6.6px on a 725px-wide container, 3px on a phone. They are
   * compensated back up to this floor, never by more than `MAX_TEXT_SCALE`.
   * Default `MIN_TEXT_PX` (10); `0` switches it off.
   */
  minTextPx?: number;

  /** Slot: top row inside the frame — name / badges. */
  header?: ReactNode;
  /** Slot: center content — 0..N cards, avatar, anything. */
  children?: ReactNode;
  /** Slot: bottom row inside the frame — stack / status. */
  footer?: ReactNode;
  /** Slot: overlay centered over the frame. */
  overlay?: ReactNode;

  /** Slot: floating content above the frame, centered (e.g. an action bubble). */
  above?: ReactNode;
  /** Slot: content below the frame, centered (e.g. countdown / bet pill). */
  below?: ReactNode;
  /** Slot: floating content at the frame's top-left corner (e.g. a crown, a rank badge). */
  topLeft?: ReactNode;
  /** Slot: floating content at the frame's top-right corner (e.g. a kick button). */
  topRight?: ReactNode;
  /** Slot: floating content centered above the top edge (e.g. dealer / blind badges). */
  topCenter?: ReactNode;

  /**
   * Frame width. Defaults to the size the surrounding `CardTable` laid out for
   * this seat, or 160 outside a table — the table is the one that knows how much
   * room the ring has.
   */
  width?: number;
  /** Frame height. Defaults to the laid-out size, or 176 outside a table. */
  height?: number;
  className?: string;
  /** Extra classes for the inner frame, to override visuals. */
  frameClassName?: string;
  /** Inline styles for the inner frame. */
  frameStyle?: CSSProperties;
}

/**
 * A neutral frame: three named rows with generic visual states, plus floating
 * slots. It knows nothing about any particular game — put whatever you want into
 * `header` / `children` / `footer`, and use `above` / `below` / `topLeft` /
 * `topRight` / `topCenter` / `overlay` for floating bits.
 *
 * The overhanging slots — `topLeft`, `topRight` and `topCenter` — hang off the frame
 * by a *fraction of its height* (`FLOAT`, 8px on a 176px seat), so content taller
 * than that straddles the border. That is what makes a `Marker` look pinned to the
 * seat, and it is why a ring, which is read from its silhouette, does not belong
 * there — the border crosses it and cuts the shape you are reading. `above`,
 * `below` and `overlay` sit clear of the edge.
 *
 * It draws no default decoration. A crown over the winner is a decoration, not a
 * state, so `isWinner` draws the frame and the caller passes the crown through
 * `topLeft`.
 *
 * **The two states are drawn in different languages, not at two opacities.** A
 * current seat is an *outline*: a gold border and a halo, dark inside. A winning
 * one is *filled*: the same outline under a gold wash across the whole frame.
 * Telling them apart by border width and a 10% tint was telling them apart by
 * nothing.
 *
 * **Its own text is kept above a floor.** The rows are compensated for the scale
 * the surrounding table is drawn at, so a name is not three pixels tall on a
 * phone — see `minTextPx`. The corner badges and `topCenter` are left alone: they
 * carry icons and decorations, not the label.
 */
export function Seat({
  isActive = false,
  isWinner = false,
  isDimmed = false,
  animated = true,
  onClick,
  label,
  minTextPx = MIN_TEXT_PX,
  header,
  children,
  footer,
  overlay,
  above,
  below,
  topLeft,
  topRight,
  topCenter,
  width,
  height,
  className,
  frameClassName,
  frameStyle,
}: SeatProps) {
  const laidOut = useSeatSize();
  const frameWidth = width ?? laidOut?.width ?? DEFAULT_SEAT_W;
  const frameHeight = height ?? laidOut?.height ?? DEFAULT_SEAT_H;

  const scale = useDesignScale();
  const textScale = readableScale(scale, ROW_TEXT_PX, minTextPx);

  const activeClass = animated
    ? "border-2 border-gold animate-turn-glow"
    : "border-2 border-gold shadow-[0_0_18px_color-mix(in_oklab,var(--color-gold)_50%,transparent)]";
  /*
   * An outline says "this seat is in play"; a **filled** frame says "this one won".
   *
   * They used to be the same gold ring with the same gold glow, told apart by a 1px
   * border and a 10% tint — which, put side by side, is one state at two opacities:
   * the tint is barely a tint, and the second hairline inside the border only made
   * the border look thicker. A fill is a different kind of mark, and it is the one
   * cue here that survives greyscale.
   *
   * WINNER_WASH is that fill. It is opaque and a background-image, so it covers the
   * seat's own `bg-surface/80` rather than tinting it: a winner is a solid object,
   * not a tinted window.
   */
  const winnerClass = animated
    ? `border-2 border-gold animate-winner-glow ${WINNER_WASH}`
    : `border-2 border-gold shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-gold)_90%,transparent)] ${WINNER_WASH}`;

  const interactive = onClick !== undefined;
  const frameRole = interactive ? "button" : label !== undefined ? "group" : undefined;

  /** A vertical float offset, as a fraction of the frame height. */
  const out = (fraction: number) => Math.round(frameHeight * fraction);
  /** A horizontal float offset, as a fraction of the frame width. */
  const side = (fraction: number) => Math.round(frameWidth * fraction);
  /** The floor, applied to the rows that carry text. */
  const textRow = (origin: CSSProperties["transformOrigin"]): CSSProperties | undefined =>
    textScale === 1 ? undefined : { transform: `scale(${textScale})`, transformOrigin: origin };

  return (
    <div className={cn("relative flex flex-col items-center", className)} style={{ width: frameWidth }}>
      {topCenter !== undefined && (
        <div className="absolute left-1/2 z-20 flex -translate-x-1/2 gap-1" style={{ top: -out(FLOAT.topCenter) }}>
          {topCenter}
        </div>
      )}
      {topLeft !== undefined && (
        <div className="absolute z-40" style={{ top: -out(FLOAT.topLeft), left: -side(FLOAT.cornerX) }}>
          {topLeft}
        </div>
      )}
      {topRight !== undefined && (
        <div className="absolute z-40" style={{ top: -out(FLOAT.topRight), right: -side(FLOAT.cornerX) }}>
          {topRight}
        </div>
      )}
      {above !== undefined && (
        <div
          className="pointer-events-none absolute bottom-full left-1/2 z-30 -translate-x-1/2"
          style={{ marginBottom: out(FLOAT.above) }}
        >
          {/* Wrapped rather than scaled in place: the container carries the
              centring translate, and a `transform` on it would fight it. */}
          <div style={textRow("bottom center")}>{above}</div>
        </div>
      )}

      <div
        role={frameRole}
        aria-label={frameRole ? label : undefined}
        // "The current seat in the ring", in the sense a nav marks the current
        // page — the one programmatic signal that this is the seat in play.
        aria-current={isActive ? "true" : undefined}
        data-state={isWinner ? "winner" : isActive ? "active" : isDimmed ? "dimmed" : "idle"}
        tabIndex={interactive ? 0 : undefined}
        onClick={onClick}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                // The frame is a button, so it takes the key: without this,
                // space fired the handler *and* scrolled the page.
                e.preventDefault();
                onClick?.();
              }
            : undefined
        }
        style={{ width: frameWidth, height: frameHeight, ...frameStyle }}
        className={cn(
          "relative flex flex-col items-center justify-between gap-1 rounded-2xl border bg-surface/80 p-2 text-surface-ink transition",
          "border-surface-border",
          isActive && activeClass,
          isWinner && winnerClass,
          isDimmed && "opacity-50",
          interactive &&
            "cursor-pointer hover:border-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold",
          frameClassName,
        )}
      >
        {header !== undefined && (
          <div className="flex w-full shrink-0 items-center justify-between gap-1 text-[11px]" style={textRow("center")}>
            {header}
          </div>
        )}
        <div className="flex min-h-0 flex-1 items-center justify-center">{children}</div>
        {footer !== undefined && (
          <div
            className="flex w-full shrink-0 items-center justify-between text-[11px] text-surface-ink/75"
            style={textRow("center")}
          >
            {footer}
          </div>
        )}

        {overlay !== undefined && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center">{overlay}</div>
        )}
      </div>

      {below !== undefined && (
        <div
          className="flex flex-col items-center gap-1"
          style={{ marginTop: out(FLOAT.below), ...textRow("top center") }}
        >
          {below}
        </div>
      )}
    </div>
  );
}
