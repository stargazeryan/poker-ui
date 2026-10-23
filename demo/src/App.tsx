import { useState } from "react";
import {
  CardTable,
  Seat,
  PlayingCard,
  CardBack,
  HoleCards,
  CommunityCards,
  Pot,
  seatAngle,
} from "../../src/index";

function DealerButton() {
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-neutral-900">
      D
    </span>
  );
}

/** Tiny chip stack used to demo the `bets` / `renderBet` layer. */
function ChipStack({ amount }: { amount: number }) {
  const stack = Math.max(2, Math.min(4, Math.round(amount / 20) + 1));
  return (
    <div className="flex flex-col items-center gap-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
      <div className="relative" style={{ width: 34, height: 12 + (stack - 1) * 6 }}>
        {Array.from({ length: stack }).map((_, i) => (
          <span
            key={i}
            className="absolute left-1/2 h-[12px] w-[32px] -translate-x-1/2 rounded-full border border-amber-200/80 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-[0_2px_3px_rgba(0,0,0,0.55)]"
            style={{ bottom: i * 6 }}
          />
        ))}
      </div>
      <span className="rounded-full border border-amber-400/70 bg-neutral-900/85 px-2 py-0.5 font-mono text-[11px] font-bold leading-none text-amber-200 shadow">
        {amount} BB
      </span>
    </div>
  );
}

export function App() {
  const [seatCount, setSeatCount] = useState(6);
  const [pot, setPot] = useState(240);
  const [showWinner, setShowWinner] = useState(false);
  const winnerSeats = showWinner ? [0] : [];

  const angles = Array.from({ length: seatCount }, (_, i) => `${i}:${seatAngle(i, seatCount).toFixed(0)}°`).join("  ");

  return (
    <div className="flex min-h-full flex-col items-center gap-10 p-6">
      <h1 className="text-lg font-semibold tracking-tight">@stargazeryan/poker-ui — demo</h1>

      <section className="w-full max-w-4xl">
        <h2 className="mb-2 text-sm text-neutral-400">
          Ellipse layout — seat 0 sits directly below the centre; seats &amp; bets divide 360° by the seat count (2–10)
        </h2>

        <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
          {[2, 6, 10].map((n) => (
            <button
              key={n}
              onClick={() => setSeatCount(n)}
              className={`rounded px-3 py-1.5 text-sm font-medium active:scale-95 ${
                seatCount === n
                  ? "bg-amber-500 text-neutral-950"
                  : "border border-neutral-600 text-neutral-200"
              }`}
            >
              {n} seats
            </button>
          ))}
          <span className="font-mono text-xs text-neutral-400">θ = 90° + i·360/n → {angles}</span>
        </div>

        <div className="h-[560px] w-full">
          <CardTable
            seatCount={seatCount}
            startAngle={90}
            yourSeatIndex={0}
            yourTurn
            winnerSeats={winnerSeats}
            renderBet={(i) => (i % 3 === 0 ? <ChipStack amount={(i + 1) * 3} /> : null)}
            renderSeat={(i, isYou) => (
              <Seat
                key={i}
                isActive={i === 3 && seatCount > 2}
                isWinner={winnerSeats.includes(i)}
                header={
                  <span className="w-full truncate text-center font-semibold">
                    {isYou ? "You" : `Seat ${i}`}
                  </span>
                }
                topCenter={i === 0 ? <DealerButton /> : undefined}
                footer={<span className="w-full text-center font-mono text-amber-300">100 BB</span>}
              >
                {i % 2 === 0 ? (
                  <HoleCards cards={["As", "Kh"]} size="sm" />
                ) : (
                  <div className="flex gap-2">
                    <CardBack size="sm" />
                    <CardBack size="sm" />
                  </div>
                )}
              </Seat>
            )}
            center={
              <div className="flex h-full w-full flex-col items-center justify-center gap-4">
                <CommunityCards cards={["Ah", "Kd", "7c", "2s", null]} size="lg" className="filter drop-shadow-lg" />
                <div className="flex flex-row items-center gap-3">
                  <Pot label="Main" amount={pot} />
                  <Pot label="Side 1" amount={Math.round(pot / 2)} />
                </div>
              </div>
            }
          />
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button onClick={() => setPot((p) => p + 100)} className="rounded bg-amber-500 px-3 py-1.5 text-sm font-medium text-neutral-950 active:scale-95">
            +100 to pot (count-up)
          </button>
          <button onClick={() => setShowWinner((s) => !s)} className="rounded border border-neutral-600 px-3 py-1.5 text-sm text-neutral-200 active:scale-95">
            {showWinner ? "hide" : "show"} winner + confetti
          </button>
        </div>
      </section>

      <section className="flex flex-col items-center gap-3">
        <h2 className="text-sm text-neutral-400">Card sizes — xs / sm keep only the upright index</h2>
        <div className="flex items-end gap-4">
          <PlayingCard card="As" size="xs" />
          <PlayingCard card="10h" size="sm" />
          <PlayingCard card="Kd" size="md" />
          <PlayingCard card="Qc" size="lg" />
          <CardBack size="lg" />
        </div>
      </section>
    </div>
  );
}
