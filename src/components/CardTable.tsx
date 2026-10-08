import { useRef, useLayoutEffect, useState, useMemo, type ReactNode } from "react";
import { cn } from "../cn";

export interface CardTableProps {
  /** Number of seats (2–10). Default 6. */
  seatCount?: number;
  /** Optional per-seat content. Length should equal `seatCount`. */
  seats?: (ReactNode | null)[];
  /** Alternative to `seats`: render a seat by index. */
  renderSeat?: (index: number, isYou: boolean) => ReactNode;
  /** Which seat belongs to the viewer; rotates that seat to the bottom. */
  yourSeatIndex?: number | null;
  /** Optional content in the middle of the table (cards, pot, anything). */
  center?: ReactNode;
  /** Seat frame size used for layout. */
  seatWidth?: number;
  seatHeight?: number;
  className?: string;
}

const DESIGN_W = 1200;
const DESIGN_H = 900;
const MARGIN_X = 164;
const MARGIN_Y = 196;
const TABLE_RX = DESIGN_W / 2 - MARGIN_X;
const TABLE_RY = DESIGN_H / 2 - MARGIN_Y;
const FELT_GAP = 11;
const BET_SCALE = 0.72;
const BET_RX = TABLE_RX * BET_SCALE;
const BET_RY = TABLE_RY * BET_SCALE;

interface SeatLayout {
  x: number;
  y: number;
  index: number;
  isYou: boolean;
}

function getEllipsePoint(cx: number, cy: number, rx: number, ry: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) };
}

function calculateSeatLayouts(
  seatCount: number,
  yourSeatIndex: number | null,
  seatWidth: number,
  seatHeight: number,
): SeatLayout[] {
  const cx = DESIGN_W / 2;
  const cy = DESIGN_H / 2;
  const ringX = TABLE_RX - FELT_GAP + seatWidth / 2 + 6;
  const ringY = TABLE_RY - FELT_GAP + seatHeight / 2 + 6;

  // Even angular distribution, first seat at the top (-90°).
  const step = 360 / seatCount;
  const angleOf = (i: number) => -90 + i * step;

  // Rotate so the viewer's seat sits at the bottom (90°).
  const rotationOffset = yourSeatIndex !== null ? 90 - angleOf(yourSeatIndex) : 0;

  const layouts: SeatLayout[] = [];
  for (let i = 0; i < seatCount; i++) {
    const pt = getEllipsePoint(cx, cy, ringX, ringY, angleOf(i) + rotationOffset);
    layouts.push({
      x: pt.x - seatWidth / 2,
      y: pt.y - seatHeight / 2,
      index: i,
      isYou: i === yourSeatIndex,
    });
  }
  return layouts;
}

/**
 * A responsive, game-agnostic card table. It scales a fixed 1200x900 design
 * onto its container and arranges `seatCount` seats around the felt. Purely
 * presentational: supply seat content and an optional `center` slot.
 */
export function CardTable({
  seatCount = 6,
  seats,
  renderSeat,
  yourSeatIndex = null,
  center,
  seatWidth = 160,
  seatHeight = 176,
  className,
}: CardTableProps) {
  const count = Math.max(2, Math.min(10, Math.floor(seatCount)));
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const layouts = useMemo(
    () => calculateSeatLayouts(count, yourSeatIndex, seatWidth, seatHeight),
    [count, yourSeatIndex, seatWidth, seatHeight],
  );

  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const compute = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      setScale(Math.min(w / DESIGN_W, h / DESIGN_H));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tableFrameInset = { inset: `${MARGIN_Y}px ${MARGIN_X}px` };
  const feltInset = { inset: `${MARGIN_Y + FELT_GAP}px ${MARGIN_X + FELT_GAP}px` };
  const rimInset = { inset: `${MARGIN_Y + 6}px ${MARGIN_X + 6}px` };
  const betLineInset = {
    inset: `${MARGIN_Y + (TABLE_RY - BET_RY)}px ${MARGIN_X + (TABLE_RX - BET_RX)}px`,
  };

  return (
    <div
      ref={outerRef}
      className={cn("relative flex h-full w-full min-h-0 items-center justify-center overflow-hidden", className)}
    >
      <div style={{ width: DESIGN_W * scale, height: DESIGN_H * scale }}>
        <div
          className="relative"
          style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          <div
            className="absolute -inset-6 rounded-[50%] bg-[radial-gradient(closest-side,rgba(240,192,74,0.16),transparent_72%)] blur-3xl"
            aria-hidden="true"
          />

          {/* wooden rail */}
          <div
            className="absolute rounded-[50%] bg-gradient-to-b from-[#a5744a] via-[#6b3f22] to-[#38200f] shadow-[0_26px_70px_-12px_rgba(0,0,0,0.85),inset_0_3px_0_rgba(255,255,255,0.20),inset_0_-6px_16px_rgba(0,0,0,0.5)]"
            style={tableFrameInset}
            aria-hidden="true"
          />

          {/* felt */}
          <div
            className="absolute rounded-[50%] bg-[radial-gradient(ellipse_at_50%_32%,#23804b,#0f4d2e_55%,#093b22)] shadow-[inset_0_0_90px_rgba(0,0,0,0.55),inset_0_3px_10px_rgba(255,255,255,0.06)]"
            style={feltInset}
            aria-hidden="true"
          />

          {/* betting line */}
          <div
            className="absolute rounded-[50%] border-2 border-white/10 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]"
            style={betLineInset}
            aria-hidden="true"
          />

          {/* center suit watermark */}
          <div className="absolute flex items-center justify-center pointer-events-none" style={feltInset} aria-hidden="true">
            <span className="text-white/[0.05] text-[110px] font-black tracking-[0.2em] select-none leading-none">
              ♠♥♦♣
            </span>
          </div>

          {/* center slot (optional) */}
          {center !== undefined && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              {center}
            </div>
          )}

          {/* seats */}
          <div className="absolute inset-0 z-20">
            {layouts.map(({ x, y, index, isYou }) => {
              const content = seats ? (seats[index] ?? null) : renderSeat ? renderSeat(index, isYou) : null;
              if (content === null) return null;
              return (
                <div key={index} className="absolute" style={{ left: `${x}px`, top: `${y}px` }}>
                  {content}
                </div>
              );
            })}
          </div>

          {/* outer rim highlight */}
          <div className="absolute rounded-[50%] border border-white/10 pointer-events-none" style={rimInset} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
