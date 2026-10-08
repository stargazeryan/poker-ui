import { useRef, useLayoutEffect, useState, useMemo } from "react";
import { cn } from "../cn";
import { formatBB } from "../format";
import { CommunityCards, type CardSize } from "./PlayingCard";
import { Seat, type SeatView } from "./Seat";

export interface PotRow {
  label: string;
  amount: number;
}

export interface PokerTableProps {
  /** Six seats (some may be empty). */
  seats: (SeatView | null)[];
  /** Which seat belongs to the viewer; rotates that seat to the bottom. */
  yourSeatIndex?: number | null;
  communityCards?: (string | null)[];
  pot?: number;
  pots?: PotRow[];
  isWaiting?: boolean;
  winnerSeats?: number[];
  seatSize?: CardSize;
  /** Optional override for rendering a seat. */
  renderSeat?: (seat: SeatView | null, index: number) => React.ReactNode;
  className?: string;
}

const SEAT_COUNT = 6;
const SEAT_W = 160;
const SEAT_H = 176;
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
const SEAT_RING_X = TABLE_RX - FELT_GAP + SEAT_W / 2 + 6;
const SEAT_RING_Y = TABLE_RY - FELT_GAP + SEAT_H / 2 + 6;

const BASE_ANGLES = [-90, -30, 30, 90, 150, 210];

interface SeatLayout {
  x: number;
  y: number;
  logicalIndex: number;
  isYou: boolean;
  seat: SeatView | null;
}

function getEllipsePoint(cx: number, cy: number, rx: number, ry: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + rx * Math.cos(rad), y: cy + ry * Math.sin(rad) };
}

function calculateSeatLayouts(
  seats: (SeatView | null)[],
  yourSeatIndex: number | null,
): SeatLayout[] {
  const cx = DESIGN_W / 2;
  const cy = DESIGN_H / 2;
  const rotationOffset =
    yourSeatIndex !== null ? BASE_ANGLES[3] - BASE_ANGLES[yourSeatIndex] : 0;

  const layouts: SeatLayout[] = [];
  for (let i = 0; i < SEAT_COUNT; i++) {
    const pt = getEllipsePoint(cx, cy, SEAT_RING_X, SEAT_RING_Y, BASE_ANGLES[i] + rotationOffset);
    layouts.push({
      x: pt.x - SEAT_W / 2,
      y: pt.y - SEAT_H / 2,
      logicalIndex: i,
      isYou: i === yourSeatIndex,
      seat: seats[i] ?? null,
    });
  }
  return layouts;
}

/**
 * A responsive, themable poker table. It scales a fixed 1200x900 design onto
 * its container and arranges six seats around the felt. Purely presentational:
 * pass seat view-models and card codes in.
 */
export function PokerTable({
  seats,
  yourSeatIndex = null,
  communityCards = [],
  pot = 0,
  pots = [],
  isWaiting = false,
  winnerSeats = [],
  seatSize = "sm",
  renderSeat,
  className,
}: PokerTableProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const layouts = useMemo(
    () => calculateSeatLayouts(seats, yourSeatIndex),
    [seats, yourSeatIndex],
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

  const potRows: PotRow[] = pots.length > 0 ? pots : pot > 0 ? [{ label: "Pot", amount: pot }] : [];

  return (
    <div
      ref={outerRef}
      className={cn("relative flex h-full w-full items-center justify-center overflow-hidden min-h-0", className)}
    >
      <div style={{ width: DESIGN_W * scale, height: DESIGN_H * scale }}>
        <div
          className="relative"
          style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          {/* ambient spotlight */}
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

          {/* center: community cards + pots */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="mb-4 flex flex-col items-center gap-3">
              <CommunityCards cards={communityCards} size="lg" className="filter drop-shadow-lg" />
              {potRows.length > 0 && (
                <div className="flex flex-col items-center gap-1">
                  {potRows.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 font-mono text-sm text-amber-400">
                      <span className="text-neutral-400">{p.label}</span>
                      <span className="whitespace-nowrap rounded-full border border-amber-400/50 bg-neutral-900/80 px-3 py-1 shadow-inner">
                        {formatBB(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {isWaiting && (
              <div className="rounded-full border border-neutral-700 bg-neutral-900/70 px-3 py-1 text-xs text-neutral-400">
                Waiting to start
              </div>
            )}
          </div>

          {/* seats */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            {layouts.map(({ x, y, logicalIndex, isYou, seat }) => {
              const merged: SeatView | null = seat
                ? { ...seat, isYou, isWinner: winnerSeats.includes(logicalIndex) || seat.isWinner }
                : null;
              return (
                <div key={logicalIndex} className="absolute" style={{ left: `${x}px`, top: `${y}px` }}>
                  {renderSeat ? renderSeat(merged, logicalIndex) : <Seat seat={merged} size={seatSize} />}
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
