import { useId, type ReactNode } from "react";
import { cn } from "../cn";
import { chipBreakdown, chipCount, chipSpotColor, DEFAULT_DENOMINATIONS, type Denomination } from "../chips";

export type ChipSize = "sm" | "md" | "lg";

/** Chip width in px. Height is 0.625x that, so a chip sits on a table like a disc. */
const CHIP_WIDTH: Record<ChipSize, number> = { sm: 22, md: 30, lg: 42 };

/** Eight edge spots, evenly spaced around the rim. */
const SPOT_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export interface ChipProps {
  /** Printed on the centre of the face. */
  value?: number | string;
  /** CSS colour for the body. */
  color?: string;
  /** `fill-*` utility applied over `color` — see `Denomination.className`. */
  colorClassName?: string;
  /** Colour of the eight edge spots. Defaults to `chipSpotColor(color)`. */
  spotColor?: string;
  /** Default `"md"`. */
  size?: ChipSize;
  /** Accessible name. Defaults to `"<value> chip"`. */
  label?: string;
  className?: string;
}

/**
 * A single chip, drawn as SVG: a coloured disc with a darker edge for
 * thickness, eight white edge spots, a rim highlight and a white centre carrying
 * the value.
 *
 * The colours come from `--color-chip-*` via `fill-*` utilities, so the chip
 * palette is themeable like every other token.
 */
export function Chip({
  value,
  color = "#2980b9",
  colorClassName,
  spotColor,
  size = "md",
  label,
  className,
}: ChipProps) {
  // useId() contains colons, which are legal in an id but fiddly inside url(#…)
  const clipId = `chip-clip-${useId().replace(/:/g, "")}`;
  const width = CHIP_WIDTH[size];
  const spots = spotColor ?? chipSpotColor(color);

  return (
    <svg
      width={width}
      height={width * 0.625}
      viewBox="0 0 48 30"
      role="img"
      aria-label={label ?? (value !== undefined ? `${value} chip` : "chip")}
      className={className}
    >
      <defs>
        <clipPath id={clipId}>
          <ellipse cx="24" cy="15" rx="22" ry="13" />
        </clipPath>
      </defs>

      {/*
       * Thickness: the same disc pushed down, darkened. The top face is drawn
       * over it, so only the exposed crescent of the dark copy shows and the
       * chip reads as a solid object rather than a flat oval.
       */}
      <ellipse cx="24" cy="18" rx="22" ry="13" className={colorClassName} fill={color} />
      <ellipse cx="24" cy="18" rx="22" ry="13" fill="rgba(0,0,0,0.32)" />

      {/* top face */}
      <ellipse cx="24" cy="15" rx="22" ry="13" className={colorClassName} fill={color} />

      <g clipPath={`url(#${clipId})`}>
        {SPOT_ANGLES.map((angle) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <rect
              key={angle}
              x={-1.7}
              y={-3}
              width={3.4}
              height={6}
              rx={1.3}
              fill={spots}
              transform={`translate(${24 + 19.3 * Math.cos(rad)} ${15 + 10.7 * Math.sin(rad)}) rotate(${angle})`}
            />
          );
        })}
      </g>

      {/* rim highlight */}
      <ellipse cx="24" cy="15" rx="21" ry="12.1" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />

      {/* centre */}
      <ellipse cx="24" cy="15" rx="13.4" ry="7.9" fill="rgba(255,255,255,0.94)" />
      <ellipse cx="24" cy="15" rx="13.4" ry="7.9" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" />

      {value !== undefined && (
        <text
          x="24"
          y="18.3"
          textAnchor="middle"
          fontSize="9.5"
          fontWeight="700"
          fill="#171717"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        >
          {value}
        </text>
      )}
    </svg>
  );
}

export interface ChipStackProps {
  /** Amount in chip units — see `chipBreakdown`. */
  amount: number;
  /** Default `"md"`. */
  size?: ChipSize;
  /** Default `DEFAULT_DENOMINATIONS` (white 1, red 5, blue 10, green 25, black 100). */
  denominations?: Denomination[];
  /**
   * Most chips to draw, biggest denominations first. A 10,000 bet would
   * otherwise be 100 black chips. The count of the chips left off is shown
   * underneath. Default 12.
   */
  maxChips?: number;
  /** Content under the stack — usually the formatted amount. */
  label?: ReactNode;
  className?: string;
}

/**
 * The chips for an amount: a real stack, largest denomination on top.
 *
 * The accessible name is the full breakdown ("240 in 4 chips: 2x100, 1x25,
 * 1x10"), so a screen reader gets the value rather than four anonymous images.
 */
export function ChipStack({
  amount,
  size = "md",
  denominations = DEFAULT_DENOMINATIONS,
  maxChips = 12,
  label,
  className,
}: ChipStackProps) {
  const entries = chipBreakdown(amount, denominations);
  const total = chipCount(entries);

  const drawn: typeof entries = [];
  for (const entry of entries) {
    for (let i = 0; i < entry.count && drawn.length < maxChips; i++) drawn.push(entry);
    if (drawn.length >= maxChips) break;
  }
  const hidden = total - drawn.length;

  const offset = Math.max(3, Math.round(CHIP_WIDTH[size] * 0.17));
  const breakdown = entries.map((e) => `${e.count}x${e.label ?? e.value}`).join(", ");

  return (
    <div
      className={cn("inline-flex flex-col items-center gap-1", className)}
      role="img"
      aria-label={`${amount} in ${total} ${total === 1 ? "chip" : "chips"}${breakdown ? `: ${breakdown}` : ""}`}
    >
      {drawn.length > 0 && (
        // Presentation only — the stack already carries the accessible name.
        <div aria-hidden="true" className="flex flex-col items-center drop-shadow-[0_3px_4px_rgba(0,0,0,0.5)]">
          {drawn.map((entry, i) => (
            // Later chips are tucked under the ones above them, so z-index has
            // to descend as the stack grows.
            <div key={i} className="relative" style={{ marginTop: i === 0 ? 0 : -offset, zIndex: drawn.length - i }}>
              <Chip
                value={entry.label ?? entry.value}
                color={entry.color}
                colorClassName={entry.className}
                spotColor={entry.spotColor}
                size={size}
              />
            </div>
          ))}
        </div>
      )}

      {hidden > 0 && (
        <span className="font-mono text-[10px] leading-none text-neutral-400">+{hidden}</span>
      )}
      {label !== undefined && <span className="leading-none">{label}</span>}
    </div>
  );
}
