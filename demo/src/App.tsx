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

/* ---- Scenario 1: a 6-seat poker table (with community cards + pot) ---- */
const pokerSeats = [
  <Seat key={0} isActive header={<span className="truncate font-semibold">You</span>} badge={<DealerButton />} footer={<span className="font-mono">100 BB</span>}>
    <HoleCards cards={["As", "Kh"]} size="sm" />
  </Seat>,
  <Seat key={1} header={<span className="truncate font-semibold">Bot (tag)</span>} footer={<span className="font-mono text-amber-300">3 BB</span>} overlay={<span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-neutral-900">Raise</span>}>
    <div className="flex gap-2">
      <CardBack size="sm" />
      <CardBack size="sm" />
    </div>
  </Seat>,
  <Seat key={2} header={<span className="truncate font-semibold">Bot (lp)</span>} isDimmed footer={<span className="font-mono">49 BB</span>}>
    <span className="text-[11px] text-neutral-400">folded</span>
  </Seat>,
  null,
  <Seat key={4} header={<span className="truncate font-semibold">Busted</span>} isDimmed footer={<span className="font-mono text-red-400">0 BB</span>} />,
  <Seat key={5} isWinner header={<span className="truncate font-semibold">👑 Winner</span>} footer={<span className="font-mono">156 BB</span>}>
    <HoleCards cards={["Ah", "Ad"]} size="sm" />
  </Seat>,
];

export function App() {
  return (
    <div className="flex min-h-full flex-col items-center gap-10 p-6">
      <h1 className="text-lg font-semibold tracking-tight">@stargazeryan/poker-ui — demo</h1>

      <section className="w-full max-w-4xl">
        <h2 className="mb-2 text-sm text-neutral-400">6-seat poker table — center slot has community cards + pot</h2>
        <div className="h-[560px] w-full">
          <CardTable
            seatCount={6}
            seats={pokerSeats}
            yourSeatIndex={0}
            center={
              <div className="flex flex-col items-center gap-3">
                <CommunityCards cards={["Ah", "Kd", "7c", "2s", null]} size="lg" className="filter drop-shadow-lg" />
                <Pot label="Main" amount={240} />
              </div>
            }
          />
        </div>
      </section>

      <section className="w-full max-w-4xl">
        <h2 className="mb-2 text-sm text-neutral-400">4-seat game (e.g. Big Two) — no center, no pot, plain seats</h2>
        <div className="h-[520px] w-full">
          <CardTable
            seatCount={4}
            yourSeatIndex={2}
            renderSeat={(i, isYou) => (
              <Seat
                isActive={i === 1}
                header={<span className="truncate font-semibold">P{i}</span>}
                footer={<span className="font-mono">{12 - i} cards</span>}
              >
                {isYou ? (
                  <span className="text-[11px] text-cyan-300">(you)</span>
                ) : (
                  <div className="flex gap-1">
                    <CardBack size="xs" />
                    <CardBack size="xs" />
                    <CardBack size="xs" />
                  </div>
                )}
              </Seat>
            )}
          />
        </div>
      </section>

      <section className="flex flex-col items-center gap-3">
        <h2 className="text-sm text-neutral-400">Card sizes (xs / sm / md / lg) + back</h2>
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
