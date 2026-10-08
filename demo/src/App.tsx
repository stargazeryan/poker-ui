import { PokerTable, PlayingCard, CardBack, type SeatView } from "../../src/index";

const seats: (SeatView | null)[] = [
  { nickname: "You", stack: 2000, holeCards: ["As", "Kh"], isYou: true, isDealer: true, isTurn: true },
  { nickname: "Bot (tag)", stack: 1500, holeCards: [null, null], currentBet: 60, actionLabel: "Raise 60" },
  { nickname: "Bot (lp)", stack: 980, holeCards: [null, null], folded: true },
  null,
  { nickname: "Busted", stack: 0, busted: true },
  { nickname: "Winner", stack: 3120, holeCards: ["Ah", "Ad"], isWinner: true },
];

export function App() {
  return (
    <div className="flex min-h-full flex-col items-center gap-8 p-6">
      <h1 className="text-lg font-semibold tracking-tight">@stargazeryan/poker-ui — demo</h1>

      <div className="h-[620px] w-full max-w-4xl">
        <PokerTable
          seats={seats}
          yourSeatIndex={0}
          communityCards={["Ah", "Kd", "7c", "2s", null]}
          pots={[
            { label: "Main", amount: 240 },
            { label: "Side", amount: 120 },
          ]}
        />
      </div>

      <div className="flex flex-col items-center gap-3">
        <h2 className="text-sm text-neutral-400">Card sizes (xs / sm / md / lg)</h2>
        <div className="flex items-end gap-4">
          <PlayingCard card="As" size="xs" />
          <PlayingCard card="10h" size="sm" />
          <PlayingCard card="Kd" size="md" />
          <PlayingCard card="Qc" size="lg" />
          <CardBack size="lg" />
        </div>
      </div>
    </div>
  );
}
