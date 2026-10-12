import { useState } from "react";
import {
  CardTable,
  Seat,
  PlayingCard,
  CardBack,
  HoleCards,
  CommunityCards,
  Pot,
} from "../../src/index";

function DealerButton() {
  return (
    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-neutral-900">
      D
    </span>
  );
}

export function App() {
  const [pot, setPot] = useState(240);
  const [showWinner, setShowWinner] = useState(true);

  const seats = [
    <Seat
      key={0}
      isActive
      header={<span className="w-full truncate text-center font-semibold">You</span>}
      topCenter={<DealerButton />}
      footer={<span className="w-full text-center font-mono">100 BB</span>}
    >
      <HoleCards cards={["As", "Kh"]} size="sm" />
    </Seat>,
    <Seat
      key={1}
      header={<span className="w-full truncate text-center font-semibold">Bot (tag)</span>}
      footer={<span className="w-full text-center font-mono text-amber-300">3 BB</span>}
      above={
        <span className="animate-bubble-pop rounded-2xl border-2 border-white/90 bg-amber-400 px-3 py-1.5 text-sm font-bold text-neutral-900 shadow-lg">
          Raise
        </span>
      }
    >
      <div className="flex gap-2">
        <CardBack size="sm" />
        <CardBack size="sm" />
      </div>
    </Seat>,
    <Seat key={2} isDimmed header={<span className="w-full truncate text-center font-semibold">Bot (lp)</span>} footer={<span className="w-full text-center font-mono">49 BB</span>}>
      <span className="text-[11px] text-neutral-400">folded</span>
    </Seat>,
    null,
    <Seat key={4} isDimmed header={<span className="w-full truncate text-center font-semibold">Busted</span>} footer={<span className="w-full text-center font-mono text-red-400">0 BB</span>} />,
    <Seat
      key={5}
      isWinner
      winnerCrown
      header={<span className="w-full truncate text-center font-semibold">Winner</span>}
      footer={<span className="w-full text-center font-mono">156 BB</span>}
    >
      <HoleCards cards={["Ah", "Ad"]} size="sm" />
    </Seat>,
  ];

  return (
    <div className="flex min-h-full flex-col items-center gap-10 p-6">
      <h1 className="text-lg font-semibold tracking-tight">@stargazeryan/poker-ui — demo</h1>

      <section className="w-full max-w-4xl">
        <h2 className="mb-2 text-sm text-neutral-400">
          6-seat table — ambient felt, your-turn edge glow, community flip, pot count-up, winner confetti
        </h2>
        <div className="h-[560px] w-full">
          <CardTable
            seatCount={6}
            seats={seats}
            yourSeatIndex={0}
            yourTurn
            winnerSeats={showWinner ? [5] : []}
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
