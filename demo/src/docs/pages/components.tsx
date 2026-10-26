import { useState } from "react";
import {
  CardBack,
  CardTable,
  CommunityCards,
  DEFAULT_FELT_GAP,
  DEFAULT_MARGIN_X,
  DEFAULT_MARGIN_Y,
  DESIGN_H,
  DESIGN_W,
  HoleCards,
  PlayingCard,
  Pot,
  Seat,
  formatBB,
  layoutSeats,
  minSeatSeparation,
  seatAngle,
} from "@stargazeryan/poker-ui";
import { ApiTable, Btn, Callout, Demo, Field, H2, Prop, Row, Stepper } from "../ui";
import { DOC_BY_SLUG } from "../registry";

function Sec({ slug }: { slug: string }) {
  const doc = DOC_BY_SLUG[slug];
  return (
    <>
      <p className="mt-3 text-sm leading-relaxed text-neutral-300">{doc.summary}</p>
      <H2>Examples</H2>
    </>
  );
}

function Api({ slug }: { slug: string }) {
  const doc = DOC_BY_SLUG[slug];
  return (
    <>
      <H2>API</H2>
      <ApiTable rows={doc.props} caption={`${doc.title} props`} />
      {doc.slots && <ApiTable rows={doc.slots} caption="Slots" />}
    </>
  );
}

/** A tiny chip stack, to show the bets layer. */
function ChipStack({ amount }: { amount: number }) {
  const stack = Math.max(2, Math.min(4, Math.round(amount / 20) + 1));
  return (
    <div className="flex flex-col items-center gap-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
      <div className="relative" style={{ width: 34, height: 12 + (stack - 1) * 6 }}>
        {Array.from({ length: stack }).map((_, i) => (
          <span
            key={i}
            className="absolute left-1/2 h-[12px] w-[32px] -translate-x-1/2 rounded-full border border-gold-light/80 bg-gradient-to-b from-gold-light via-gold to-rail-deep"
            style={{ bottom: i * 6 }}
          />
        ))}
      </div>
      <span className="rounded-full border border-gold/70 bg-neutral-900/85 px-2 py-0.5 font-mono text-[11px] font-bold leading-none text-gold-light">
        {amount} BB
      </span>
    </div>
  );
}

function Player({ i, isYou, width, height, active, winner }: { i: number; isYou: boolean; width: number; height: number; active?: boolean; winner?: boolean }) {
  return (
    <Seat
      width={width}
      height={height}
      isActive={active}
      isWinner={winner}
      header={<span className="w-full truncate text-center font-semibold">{isYou ? "You" : `Seat ${i}`}</span>}
      footer={<span className="w-full text-center font-mono text-gold-light">{100 - i * 7} BB</span>}
    >
      {i % 2 === 0 ? <HoleCards cards={["As", "Kh"]} size="sm" /> : <HoleCards cards={[null, null]} size="sm" />}
    </Seat>
  );
}

/* ------------------------------------------------------------- CardTable -- */

function SeatGapDemo() {
  const [count, setCount] = useState(10);
  const [gap, setGap] = useState(24);
  const geo = layoutSeats({
    count,
    designWidth: DESIGN_W,
    designHeight: DESIGN_H,
    marginX: DEFAULT_MARGIN_X,
    marginY: DEFAULT_MARGIN_Y,
    feltGap: DEFAULT_FELT_GAP,
    seatWidth: 160,
    seatHeight: 176,
    seatGap: gap,
    startAngle: 90,
  });
  const actual = minSeatSeparation(geo.seats);
  const shrunk = geo.seatW < 160 || geo.seatH < 176;

  return (
    <>
      <Row className="mb-3 justify-center">
        <Stepper label="seats" value={count} min={2} max={10} onChange={setCount} />
        <Stepper label="seatGap" value={gap} min={0} max={80} step={4} onChange={setGap} />
      </Row>
      <Row className="mb-3 justify-center">
        <Field label="frames:" value={`${geo.seatW}×${geo.seatH}`} />
        <Field label="closest gap:" value={`${actual.toFixed(1)}px`} />
        <Field label="shrunk:" value={shrunk ? "yes" : "no"} />
      </Row>
      <div className="h-[380px] w-full">
        <CardTable
          seatCount={count}
          seatGap={gap}
          yourSeatIndex={0}
          renderSeat={(i, isYou, box) => (
            <Player i={i} isYou={isYou} width={box.width} height={box.height} active={i === 1} />
          )}
          center={<Pot label="Main" amount={240} />}
        />
      </div>
    </>
  );
}

export function CardTablePage() {
  const [count, setCount] = useState(6);
  const [turn, setTurn] = useState(true);
  const [winner, setWinner] = useState(false);
  const [portrait, setPortrait] = useState(true);

  const angles = Array.from({ length: count }, (_, i) => `${seatAngle(i, count).toFixed(0)}°`).join(" / ");

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">CardTable</h1>
      <Sec slug="card-table" />

      <Demo
        title="Seat count"
        description={<>Seats divide 360° evenly from seat 0 at <Prop>startAngle</Prop> (90° = directly below the centre). Angles: <span className="font-mono text-neutral-300">{angles}</span></>}
        previewClassName="p-0 overflow-hidden"
        code={`<CardTable
  seatCount={6}
  startAngle={90}
  yourSeatIndex={0}
  renderSeat={(i, isYou, box) => (
    <Seat width={box.width} height={box.height} header={<b>{i}</b>}>
      <HoleCards cards={hands[i]} size="sm" />
    </Seat>
  )}
  center={<Pot label="Main" amount={240} />}
/>`}
      >
        <div className="w-full">
          <Row className="justify-center border-b border-white/10 py-3">
            {[2, 3, 4, 6, 9, 10].map((n) => (
              <Btn key={n} onClick={() => setCount(n)} active={count === n}>
                {n}
              </Btn>
            ))}
          </Row>
          <div className="h-[400px] w-full">
            <CardTable
              seatCount={count}
              yourSeatIndex={0}
              renderSeat={(i, isYou, box) => <Player i={i} isYou={isYou} width={box.width} height={box.height} />}
              center={<Pot label="Main" amount={240} />}
            />
          </div>
        </div>
      </Demo>

      <Demo
        title="The bets layer"
        description={<><Prop>bets</Prop> or <Prop>renderBet</Prop> places content on the betting line, auto-positioned toward the middle of the table. The drawn line follows <Prop>betRadiusScale</Prop> — they cannot drift apart.</>}
        previewClassName="p-0 overflow-hidden"
        code={`<CardTable
  renderBet={(i) => (bets[i] ? <ChipStack amount={bets[i]} /> : null)}
  betRadiusScale={0.72}
/>`}
      >
        <div className="h-[400px] w-full">
          <CardTable
            seatCount={6}
            yourSeatIndex={0}
            renderSeat={(i, isYou, box) => <Player i={i} isYou={isYou} width={box.width} height={box.height} />}
            renderBet={(i) => (i % 3 === 0 ? <ChipStack amount={(i + 1) * 3} /> : null)}
            center={<Pot label="Main" amount={240} />}
          />
        </div>
      </Demo>

      <Demo
        title="Turn, winner and confetti"
        description={<><Prop>yourTurn</Prop> rings the table edge; <Prop>winnerSeats</Prop> starts the confetti and glows those seats.</>}
        previewClassName="p-0 overflow-hidden"
        code={`<CardTable yourTurn winnerSeats={[0]} confetti />`}
      >
        <div className="w-full">
          <Row className="justify-center border-b border-white/10 py-3">
            <Btn onClick={() => setTurn((v) => !v)} active={turn}>
              yourTurn
            </Btn>
            <Btn onClick={() => setWinner((v) => !v)} active={winner}>
              winnerSeats=[0]
            </Btn>
          </Row>
          <div className="h-[400px] w-full">
            <CardTable
              seatCount={6}
              yourSeatIndex={0}
              yourTurn={turn}
              winnerSeats={winner ? [0] : []}
              renderSeat={(i, isYou, box) => (
                <Player i={i} isYou={isYou} width={box.width} height={box.height} winner={winner && i === 0} />
              )}
              center={<Pot label="Main" amount={240} />}
            />
          </div>
        </div>
      </Demo>

      <Demo
        title="fit: design vs container"
        description={
          <>
            The table lays out in a fixed design box and scales it to fit. In <Prop>fit=&quot;design&quot;</Prop> (the
            default) a 390×700 phone scales the 4:3 box down and wastes ~58% of the space.{" "}
            <Prop>fit=&quot;container&quot;</Prop> derives the width from the container&apos;s aspect ratio instead.
          </>
        }
        previewClassName="p-6 overflow-x-auto"
        align="start"
        code={`<CardTable fit="container" />`}
      >
        <div className="flex gap-6">
          {[
            { label: 'fit="design"', fit: "design" as const },
            { label: 'fit="container"', fit: "container" as const },
          ].map((o) => (
            <div key={o.label}>
              <div className="mb-2 font-mono text-[11px] text-neutral-400">{o.label}</div>
              <div className="h-[360px] w-[180px] overflow-hidden rounded-lg border border-white/10">
                <CardTable
                  seatCount={6}
                  fit={o.fit}
                  renderSeat={(i, isYou, box) => (
                    <Seat
                      width={box.width}
                      height={box.height}
                      frameClassName="p-1"
                      header={<span className="w-full text-center text-[9px]">{isYou ? "you" : i}</span>}
                    />
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </Demo>
      <Row className="mt-3 justify-center">
        <Btn onClick={() => setPortrait((v) => !v)} active={portrait}>
          container: {portrait ? "portrait 180×360" : "landscape"}
        </Btn>
      </Row>

      <Demo
        title="Seat frames shrink to keep their distance"
        description={
          <>
            Measured on the real layout helpers (<Prop>layoutSeats</Prop>, <Prop>minSeatSeparation</Prop> — both
            exported). At 160×176 a 6-seat ring leaves 161px between neighbours, but a 10-seat ring leaves only 25.6px.
            Frames shrink uniformly (never below 50%) until <Prop>seatGap</Prop> is honoured, and{" "}
            <Prop>renderSeat</Prop> receives the size it settled on.
          </>
        }
        previewClassName="p-4"
        code={`<CardTable
  seatCount={10}
  seatGap={24}          // 0 disables the shrink
  renderSeat={(i, isYou, box) => (
    // box is the frame the ring was laid out for
    <Seat width={box.width} height={box.height} />
  )}
/>`}
      >
        <SeatGapDemo />
      </Demo>

      <Api slug="card-table" />
    </>
  );
}

/* ------------------------------------------------------------------ Seat -- */

export function SeatPage() {
  const [clicks, setClicks] = useState(0);
  const [active, setActive] = useState(true);
  const [dimmed, setDimmed] = useState(false);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Seat</h1>
      <Sec slug="seat" />

      <Demo
        title="States"
        description="Three generic states, all animated by default and all switchable."
        code={`<Seat isActive /> <Seat isWinner winnerCrown /> <Seat isDimmed />`}
      >
        <div className="flex flex-wrap items-start justify-center gap-6">
          <Seat
            isActive={active}
            header={<span className="w-full text-center font-semibold">isActive</span>}
            footer={<span className="w-full text-center font-mono text-gold-light">100 BB</span>}
          >
            <HoleCards cards={["As", "Kh"]} size="sm" deal={false} />
          </Seat>
          <Seat
            isWinner
            winnerCrown
            header={<span className="w-full text-center font-semibold">isWinner</span>}
            footer={<span className="w-full text-center font-mono text-gold-light">340 BB</span>}
          >
            <HoleCards cards={["Ah", "Ad"]} size="sm" deal={false} />
          </Seat>
          <Seat
            isDimmed={dimmed}
            header={<span className="w-full text-center font-semibold">isDimmed</span>}
            footer={<span className="w-full text-center font-mono text-neutral-400">folded</span>}
          >
            <HoleCards cards={[null, null]} size="sm" deal={false} />
          </Seat>
        </div>
      </Demo>
      <Row className="mt-3 justify-center">
        <Btn onClick={() => setActive((v) => !v)} active={active}>
          isActive
        </Btn>
        <Btn onClick={() => setDimmed((v) => !v)} active={dimmed}>
          isDimmed
        </Btn>
        <Btn onClick={() => setActive(false)}>animated=false</Btn>
      </Row>

      <Demo
        title="Slots"
        description="A seat is just a frame with named slots. Every slot is optional; an unused one renders nothing."
        code={`<Seat
  header={...}      above={...}      topLeft={...}
  children={...}    below={...}      topRight={...}
  footer={...}      badge={...}      topCenter={...}
  overlay={...}
/>`}
      >
        <Seat
          header={<span className="w-full text-center text-[10px] text-sky-300">header</span>}
          footer={<span className="w-full text-center text-[10px] text-sky-300">footer</span>}
          badge={<span className="rounded bg-sky-500/20 px-1 text-[9px] text-sky-200">badge</span>}
          overlay={<span className="text-[10px] text-sky-300">overlay</span>}
          above={<span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] text-sky-200">above</span>}
          below={<span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] text-sky-200">below</span>}
          topLeft={<span className="text-[10px] text-sky-300">topLeft</span>}
          topRight={<span className="text-[10px] text-sky-300">topRight</span>}
          topCenter={<span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] text-sky-200">topCenter</span>}
        >
          <span className="text-[10px] text-sky-300">children</span>
        </Seat>
      </Demo>

      <Demo
        title="Interactive"
        description={<><Prop>onClick</Prop> makes the frame a real button: <Prop>role=&quot;button&quot;</Prop>, <Prop>tabIndex=0</Prop>, Enter and Space both fire, and a focus ring appears.</>}
        code={`<Seat onClick={() => sit(3)} header={<b>sit here</b>} />`}
      >
        <div className="flex flex-col items-center gap-3">
          <Seat
            onClick={() => setClicks((c) => c + 1)}
            header={<span className="w-full text-center font-semibold">sit here</span>}
            footer={<span className="w-full text-center font-mono text-neutral-400">empty</span>}
          />
          <Field label="clicks:" value={clicks} />
        </div>
      </Demo>

      <Api slug="seat" />
    </>
  );
}

/* ------------------------------------------------------------------- Pot -- */

export function PotPage() {
  const [amount, setAmount] = useState(240);
  const [animated, setAnimated] = useState(true);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Pot</h1>
      <Sec slug="pot" />

      <Demo
        title="Count-up"
        description={`Click fast — the counter keeps easing toward the new target without ever jumping backwards. Default amount is ${formatBB(amount)}.`}
        code={`<Pot label="Main" amount={amount} />`}
      >
        <div className="flex flex-col items-center gap-4">
          <Pot label="Main" amount={amount} animate={animated} />
          <Row className="justify-center">
            <Btn onClick={() => setAmount((a) => a + 100)}>+100</Btn>
            <Btn onClick={() => setAmount((a) => Math.max(0, a - 100))}>-100</Btn>
            <Btn onClick={() => setAmount(0)}>reset</Btn>
            <Btn onClick={() => setAnimated((v) => !v)} active={!animated}>
              animate=false
            </Btn>
          </Row>
        </div>
      </Demo>

      <Demo
        title="Custom formatting"
        description="The default formatter is Big-Blind based. Pass your own to show chips, dollars, whatever."
        code={`<Pot amount={1234} format={(n) => n.toLocaleString()} />`}
      >
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Pot amount={1234} format={(n) => n.toLocaleString()} />
          <Pot amount={1234} format={(n) => `$${(n / 20).toFixed(1)}`} />
          <Pot amount={1234} label="Main" format={(n) => `${n} chips`} />
        </div>
      </Demo>

      <Api slug="pot" />
    </>
  );
}

/* ---------------------------------------------------------- PlayingCard -- */

const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];

export function PlayingCardPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">PlayingCard</h1>
      <Sec slug="playing-card" />

      <Demo
        title="Sizes"
        description={
          <>
            <Prop>xs</Prop> and <Prop>sm</Prop> keep only the upright index, split across the two halves of the card;{" "}
            <Prop>md</Prop> and <Prop>lg</Prop> add the rotated corner index and the large centre suit. Size comes from
            the prop, never from a breakpoint, so cards scale predictably inside any container.
          </>
        }
        code={`<PlayingCard card="As" size="xs" />
<PlayingCard card="As" size="sm" />
<PlayingCard card="As" size="md" />
<PlayingCard card="As" size="lg" />
<CardBack size="lg" />`}
      >
        <div className="flex items-end gap-4">
          <PlayingCard card="As" size="xs" />
          <PlayingCard card="As" size="sm" />
          <PlayingCard card="As" size="md" />
          <PlayingCard card="As" size="lg" />
          <CardBack size="lg" />
        </div>
      </Demo>

      <Demo
        title="The deck"
        description={<>Card codes are a rank plus one suit letter: <Prop>s</Prop>, <Prop>h</Prop>, <Prop>d</Prop>, <Prop>c</Prop>. <Prop>null</Prop> is a face-down card.</>}
        code={`<PlayingCard card="10h" size="xs" />`}
        previewClassName="p-4"
      >
        <div className="flex flex-col gap-2">
          {["s", "h", "d", "c"].map((suit) => (
            <div key={suit} className="flex gap-1.5">
              {RANKS.map((rank) => (
                <PlayingCard key={rank + suit} card={rank + suit} size="xs" />
              ))}
            </div>
          ))}
        </div>
      </Demo>

      <Callout tone="warn" title="Card codes are not validated.">
        <Prop>parseCard</Prop> splits the last character off as the suit and trusts the rest, so{" "}
        <Prop>&quot;xyz&quot;</Prop> renders a literal <Prop>z</Prop> and <Prop>&quot;as&quot;</Prop> stays lowercase.
        There is no rank or suit validation and no case normalisation.
      </Callout>

      <Api slug="playing-card" />
    </>
  );
}

/* ------------------------------------------------------------ CardBack -- */

export function CardBackPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">CardBack</h1>
      <Sec slug="card-back" />

      <Demo
        title="Sizes"
        description="Same size scale as PlayingCard, so backs and faces line up in a row."
        code={`<CardBack size="xs" />
<CardBack size="sm" />
<CardBack size="md" />
<CardBack size="lg" />`}
      >
        <div className="flex items-end gap-4">
          {(["xs", "sm", "md", "lg"] as const).map((s) => (
            <CardBack key={s} size={s} />
          ))}
        </div>
      </Demo>

      <Demo
        title="Two cards, as a hand"
        description="Wrap them in a flex row with a gap — that is exactly what HoleCards does for null cards."
        code={`<div className="flex gap-2">
  <CardBack size="sm" />
  <CardBack size="sm" />
</div>`}
      >
        <div className="flex gap-2">
          <CardBack size="sm" />
          <CardBack size="sm" />
        </div>
      </Demo>

      <Api slug="card-back" />
    </>
  );
}

/* ----------------------------------------------------------- HoleCards -- */

export function HoleCardsPage() {
  const [round, setRound] = useState(1);
  const hands = [
    ["As", "Kh"],
    ["Qd", "Jc"],
    ["9s", "9d"],
    ["Ah", "Ad"],
  ];
  const hand = hands[(round - 1) % hands.length];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">HoleCards</h1>
      <Sec slug="hole-cards" />

      <Demo
        title="Dealing"
        description={
          <>
            Cards deal in one after another, 100ms apart. Changing a card re-deals it — the wrapper is keyed on the card
            itself, because React reuses an element whose key is unchanged and a reused element never restarts its CSS
            animation. <Prop>dealKey</Prop> re-deals the whole hand even when the cards are identical, which is what the
            button below uses.
          </>
        }
        code={`<HoleCards cards={hand} size="lg" dealKey={round} />`}
      >
        <div className="flex flex-col items-center gap-4">
          <HoleCards cards={hand} size="lg" dealKey={round} />
          <Row className="justify-center">
            <Btn onClick={() => setRound((r) => r + 1)}>deal the next hand</Btn>
          </Row>
          <Field label="hand:" value={`${hand.join(" ")}  ·  dealKey=${round}`} />
        </div>
      </Demo>

      <Demo
        title="Face down"
        description={<>A <Prop>null</Prop> entry renders a card back, so you can show an opponent's hand without knowing it.</>}
        code={`<HoleCards cards={[null, null]} size="sm" />`}
      >
        <div className="flex items-end gap-6">
          <HoleCards cards={[null, null]} size="xs" deal={false} />
          <HoleCards cards={[null, null]} size="sm" deal={false} />
          <HoleCards cards={[null, null]} size="md" deal={false} />
          <HoleCards cards={[null, null]} size="lg" deal={false} />
        </div>
      </Demo>

      <Callout tone="warn" title="A big hand is wider than a seat frame.">
        <Prop>size=&quot;lg&quot;</Prop> is 200px across for two cards, and the default seat frame is 160px wide with no
        overflow handling. Use <Prop>sm</Prop> or <Prop>xs</Prop> inside seats, or widen the frame.
      </Callout>

      <Api slug="hole-cards" />
    </>
  );
}

/* ------------------------------------------------------ CommunityCards -- */

export function CommunityCardsPage() {
  const [street, setStreet] = useState(3);
  const board = ["Ah", "Kd", "7c", "2s", "9h"];
  const visible = board.slice(0, street);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">CommunityCards</h1>
      <Sec slug="community-cards" />

      <Demo
        title="Streets"
        description="Each card flips in with a 3D flip as it appears; the ones already on the board are not re-animated."
        code={`<CommunityCards cards={board.slice(0, street)} size="lg" slots={5} />`}
      >
        <div className="flex flex-col items-center gap-4">
          <CommunityCards cards={visible} size="lg" slots={5} />
          <Row className="justify-center">
            {[0, 3, 4, 5].map((n) => (
              <Btn key={n} onClick={() => setStreet(n)} active={street === n}>
                {n} cards
              </Btn>
            ))}
          </Row>
        </div>
      </Demo>

      <Demo
        title="slots keeps the row from resizing"
        description={
          <>
            Without <Prop>slots</Prop> the row grows as cards arrive, which shifts anything centred next to it. With{" "}
            <Prop>slots=5</Prop> the empty places are reserved from the start.
          </>
        }
        code={`<CommunityCards cards={board} slots={5} />
<CommunityCards cards={board} />`}
      >
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-[11px] text-neutral-500">slots=5</span>
            <CommunityCards cards={visible} size="lg" slots={5} animated={false} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-[11px] text-neutral-500">no slots</span>
            <CommunityCards cards={visible} size="lg" animated={false} />
          </div>
        </div>
      </Demo>

      <Api slug="community-cards" />
    </>
  );
}
