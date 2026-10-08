import { cn } from "../cn";
import { formatBB } from "../format";
import { CardBack, HoleCards, type CardSize } from "./PlayingCard";

/** Presentational view-model for one seat (no game logic). */
export interface SeatView {
  nickname: string;
  stack: number;
  holeCards?: (string | null)[] | null;
  isDealer?: boolean;
  isTurn?: boolean;
  folded?: boolean;
  busted?: boolean;
  allIn?: boolean;
  currentBet?: number;
  isYou?: boolean;
  isWinner?: boolean;
  /** Optional short label shown in a bubble (e.g. "Raise 500"). */
  actionLabel?: string | null;
}

export interface SeatProps {
  seat: SeatView | null;
  size?: CardSize;
  className?: string;
}

/**
 * A presentational seat: nickname, stack, hole cards, dealer/turn/winner
 * markers. It is fully controlled — all state arrives through `seat`.
 */
export function Seat({ seat, size = "sm", className }: SeatProps) {
  if (!seat) {
    return (
      <div
        className={cn(
          "w-40 h-44 rounded-2xl border-2 border-dashed border-white/10",
          "flex items-center justify-center text-white/20 text-xs",
          className,
        )}
      >
        Empty seat
      </div>
    );
  }

  const showCards = !seat.folded && !seat.busted && !!seat.holeCards && seat.holeCards.length > 0;

  return (
    <div className={cn("relative w-40 h-44", className)}>
      {seat.actionLabel && (
        <div className="animate-bubble-pop absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-neutral-900 shadow-lg">
          {seat.actionLabel}
        </div>
      )}

      <div
        className={cn(
          "flex h-full w-full flex-col items-center justify-between rounded-2xl border bg-neutral-900/80 p-2 backdrop-blur",
          seat.isTurn ? "border-cyan-400 shadow-[0_0_18px_rgba(34,211,238,0.55)]" : "border-neutral-700",
          seat.isWinner && "border-amber-400 shadow-[0_0_18px_rgba(251,191,36,0.6)]",
          seat.folded && "opacity-50",
        )}
      >
        <div className="flex w-full items-center justify-between text-[11px]">
          <span className="truncate font-semibold text-neutral-100">
            {seat.isWinner ? "👑 " : ""}
            {seat.nickname}
            {seat.isYou ? " 👈" : ""}
          </span>
          {seat.isDealer && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-neutral-900">
              D
            </span>
          )}
        </div>

        <div className="flex flex-1 items-center justify-center">
          {seat.busted ? (
            <span className="text-xs font-semibold text-red-400">Busted</span>
          ) : showCards ? (
            <HoleCards cards={seat.holeCards as (string | null)[]} size={size} />
          ) : (
            <div className="flex gap-2">
              <CardBack size={size} />
              <CardBack size={size} />
            </div>
          )}
        </div>

        <div className="flex w-full items-center justify-between text-[11px] text-neutral-300">
          <span className="font-mono">{formatBB(seat.stack)}</span>
          {seat.allIn ? (
            <span className="rounded bg-red-600/80 px-1.5 text-[10px] font-bold text-white">ALL-IN</span>
          ) : seat.currentBet && seat.currentBet > 0 ? (
            <span className="font-mono text-amber-300">{formatBB(seat.currentBet)}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
