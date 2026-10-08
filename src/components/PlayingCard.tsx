import { cn } from "../cn";

export type CardSize = "xs" | "sm" | "md" | "lg";

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
const BACK_EMBLEM_SIZE: Record<CardSize, number> = {
  xs: 14,
  sm: 18,
  md: 28,
  lg: 42,
};

/** Parse a compact card code like "As", "10h", "kd" into rank + suit. */
export function parseCard(card: string): { rank: string; suit: string } {
  if (!card || card.length < 2) return { rank: "", suit: "" };
  return { rank: card.slice(0, -1), suit: card.slice(-1) };
}

export function getSuitSymbol(suit: string): string {
  switch (suit) {
    case "s": return "♠";
    case "h": return "♥";
    case "d": return "♦";
    case "c": return "♣";
    default: return suit;
  }
}

function getSuitClass(suit: string): string {
  switch (suit) {
    case "s":
    case "c":
      return "text-neutral-900";
    case "h":
    case "d":
      return "text-red-600";
    default:
      return "";
  }
}

export interface PlayingCardProps {
  /** Compact card code ("As", "10h") or null to render a face-down card back. */
  card: string | null;
  size?: CardSize;
  className?: string;
}

/**
 * A single playing card. Size is driven by the `size` prop (never viewport
 * breakpoints) so cards scale predictably inside any container.
 */
export function PlayingCard({ card, size = "md", className }: PlayingCardProps) {
  if (!card) return <CardBack size={size} className={className} />;

  const { rank, suit } = parseCard(card);
  const suitSymbol = getSuitSymbol(suit);
  const suitClass = getSuitClass(suit);
  const showCenter = size === "md" || size === "lg";

  return (
    <div
      className={cn(
        SIZE_CLASSES[size],
        "relative bg-gradient-to-br from-white via-white to-neutral-100",
        "rounded-md border border-neutral-300/90 overflow-hidden",
        "shadow-[0_2px_6px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.9)]",
        className,
      )}
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
      {showCenter && (
        <div className={cn("absolute inset-0 flex items-center justify-center opacity-90", suitClass)}>
          <span className={CENTER_SUIT[size]}>{suitSymbol}</span>
        </div>
      )}
    </div>
  );
}

export interface CardBackProps {
  size?: CardSize;
  className?: string;
}

function CardBackEmblem({ size }: { size: CardSize }) {
  const s = BACK_EMBLEM_SIZE[size];
  return (
    <svg width={s} height={s} viewBox="0 0 40 40" className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" aria-hidden="true">
      <g fill="#f0c04a" opacity="0.92">
        <ellipse cx="20" cy="11" rx="4" ry="7" />
        <ellipse cx="20" cy="29" rx="4" ry="7" />
        <ellipse cx="11" cy="20" rx="7" ry="4" />
        <ellipse cx="29" cy="20" rx="7" ry="4" />
      </g>
      <circle cx="20" cy="20" r="3.2" fill="#5a0c18" />
    </svg>
  );
}

/** The face-down card back (dark red + gold rosette). */
export function CardBack({ size = "md", className }: CardBackProps) {
  return (
    <div
      className={cn(
        SIZE_CLASSES[size],
        "relative rounded-md p-[3px] overflow-hidden",
        "bg-gradient-to-br from-[#7a1020] via-[#5a0c18] to-[#3f0810]",
        "border-2 border-[#c9a24b]/70 shadow-[0_2px_6px_rgba(0,0,0,0.45)]",
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

export interface HoleCardsProps {
  cards: (string | null)[];
  size?: CardSize;
  className?: string;
}

/** A row of a player's two hole cards. */
export function HoleCards({ cards, size = "lg", className }: HoleCardsProps) {
  return (
    <div className={cn("flex gap-2", className)}>
      {cards.map((card, i) => (
        <PlayingCard key={i} card={card} size={size} />
      ))}
    </div>
  );
}

export interface CommunityCardsProps {
  cards: (string | null)[];
  size?: CardSize;
  className?: string;
}

/** The five community cards, each dealt with a staggered flip animation. */
export function CommunityCards({ cards, size = "md", className }: CommunityCardsProps) {
  return (
    <div className={cn("flex gap-1.5", className)}>
      {cards.map((card, i) => (
        <div key={i} className="animate-card-deal" style={{ animationDelay: `${i * 90}ms` }}>
          <PlayingCard card={card} size={size} />
        </div>
      ))}
    </div>
  );
}
