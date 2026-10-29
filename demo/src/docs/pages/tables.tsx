import { useState } from "react";
import {
  CardRow,
  Counter,
  DealerTable,
  RoundTable,
  Seat,
  SquareTable,
  TABLE_TYPES,
  type TableTypeName,
} from "@stargazeryan/poker-ui";
import { ChipStack } from "@stargazeryan/poker-ui/wager";
import { ApiTable, Btn, Callout, Demo, Field, H2, P, Prop, Row, Stepper } from "../ui";
import { DOC_BY_SLUG, type ApiRow } from "../registry";
import { BankingExample } from "../../examples/games";
import { BET_RING, PlayerSeat, SAMPLE, betSlots, renderHands, renderPlayers } from "../../examples/parts";

/**
 * The three table types, plus the overview that puts them side by side.
 *
 * Everything a demo draws about a seat, a wager or a sample hand comes from
 * `./parts`, and the banking demo *is* `BankingExample` from `./games` — the
 * same worked example the guide renders. A page that spelled its own seat
 * markup out again was a second copy waiting to drift from the examples it is
 * supposed to be showing.
 *
 * A demo that is genuinely about `DealerTable`'s own knobs (`headY`, `handY`,
 * `handGap`, `fit`, `handCount`) still writes its own frames: those are the
 * props under discussion, and wrapping them in a shared helper would hide them.
 */

/**
 * One caption per name in `TABLE_TYPES`, so the overview table is generated from
 * the real lookup rather than a hand-copied list that could miss a type.
 */
const TABLE_TYPE_NOTES: Record<TableTypeName, string> = {
  round: "Everybody around an ellipse, the middle shared. The flop games, draw games, trick-taking games — anything where the centre belongs to everyone.",
  square: "Everybody around a rounded rectangle's perimeter, spaced by arc length so four, six or eight players do not bunch into the corners.",
  dealer: "One position at the head, the players in a row opposite it. Twenty-one, the banking games, baccarat — anything that is not played *around* something.",
};

const TABLE_TYPE_ROWS: ApiRow[] = (Object.keys(TABLE_TYPES) as TableTypeName[]).map((name) => ({
  name,
  type: `TABLE_TYPES.${name}`,
  description: TABLE_TYPE_NOTES[name],
}));

function Sec({ slug }: { slug: string }) {
  const doc = DOC_BY_SLUG[slug];
  return (
    <>
      <p className="mt-3 text-sm leading-relaxed text-neutral-300">{doc.summary}</p>
      <H2>Examples</H2>
    </>
  );
}

/* ------------------------------------------------------------ table types -- */

export function TableTypesPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Table types</h1>
      <P>
        A <strong>table type</strong> is a shape and an arrangement, with nothing in it that belongs to a game: who
        sits where, where the felt is, where the frames go, and where a ring or a slot the caller declares will land.
        Pick the one your game&apos;s seating looks like, put your own content in it, and it stops being &quot;a poker
        table&quot; the moment you do.
      </P>
      <P>
        There are three because there are three ways card games arrange people. They are the same engine —{" "}
        <Prop>CardTable</Prop> — with the surface and the seat placement already decided, so you do not have to think
        about ellipses or perimeter walks to draw a felt.
      </P>

      <H2>TABLE_TYPES</H2>
      <P>
        <Prop>TABLE_TYPES</Prop> maps the names to the components, so a client that lets the player choose a table can
        do it with a string: <Prop>TABLE_TYPES[choice]</Prop>. The name union is exported as{" "}
        <Prop>TableTypeName</Prop> — here it is:{" "}
        <span className="font-mono text-neutral-300">{(Object.keys(TABLE_TYPES) as TableTypeName[]).join(" | ")}</span>.
      </P>
      <ApiTable rows={TABLE_TYPE_ROWS} caption="The three types" />

      <H2>Side by side</H2>
      <P>The same three, live, each carrying the same seat content — one seat component, three arrangements:</P>
      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <div>
          <div className="mb-2 font-mono text-[11px] text-neutral-400">RoundTable</div>
          <div className="h-[300px] overflow-hidden rounded-lg border border-white/10">
            <RoundTable seatCount={6} renderSeat={renderPlayers()} />
          </div>
        </div>
        <div>
          <div className="mb-2 font-mono text-[11px] text-neutral-400">SquareTable</div>
          <div className="h-[300px] overflow-hidden rounded-lg border border-white/10">
            <SquareTable cornerRadius={70} seatCount={4} renderSeat={renderPlayers()} />
          </div>
        </div>
        <div>
          <div className="mb-2 font-mono text-[11px] text-neutral-400">DealerTable</div>
          <div className="h-[300px] overflow-hidden rounded-lg border border-white/10">
            <DealerTable
              headWidth={190}
              headHeight={140}
              handWidth={140}
              handHeight={170}
              head={
                <Seat width={190} height={140} header={<span className="w-full text-center text-[10px] font-semibold">dealer</span>}>
                  <CardRow cards={SAMPLE.hand} size="xs" />
                </Seat>
              }
              handCount={3}
              renderHand={renderHands()}
            />
          </div>
        </div>
      </div>

      <Callout title="A table type is not a game.">
        None of the three knows whose turn it is, who won, or whether there is a betting line. That is deliberate: a
        table that named games would be one release behind every game anyone invents. The{" "}
        <Prop>Table types</Prop> section of the guide has the worked examples that bolt rules onto these.
      </Callout>
    </>
  );
}

/* ------------------------------------------------------------ RoundTable -- */

/** Props are `CardTable`'s minus the shape knobs it decided, so show that table. */
function CardTablePropsFor({ parent }: { parent: string }) {
  return <ApiTable rows={DOC_BY_SLUG["card-table"].props} caption={`${parent} props (CardTable's, minus the shape knobs it decided)`} />;
}

export function RoundTablePage() {
  const [count, setCount] = useState(6);
  const [line, setLine] = useState(true);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">RoundTable</h1>
      <Sec slug="round-table" />

      <Demo
        title="A ring of seats"
        description={
          <>
            <Prop>RoundTable</Prop> draws an ellipse of felt and puts the frames on a ring around it. There is no upper
            limit on <Prop>seatCount</Prop>: the frames shrink until <Prop>seatGap</Prop> is honoured.
          </>
        }
        previewClassName="p-0 overflow-hidden"
        code={`<RoundTable
  seatCount={6}
  renderSeat={(i, box) => (
    <Seat width={box.width} height={box.height}>
      <CardRow cards={hands[i]} size="xs" />
    </Seat>
  )}
/>`}
      >
        <div className="w-full">
          <Row className="justify-center border-b border-white/10 py-3">
            {[2, 4, 6, 9, 12].map((n) => (
              <Btn key={n} onClick={() => setCount(n)} active={count === n}>
                {n}
              </Btn>
            ))}
          </Row>
          <div className="h-[420px] w-full">
            <RoundTable
              seatCount={count}
              renderSeat={(i, box) => <PlayerSeat index={i} width={box.width} height={box.height} isActive={i === 0} />}
            />
          </div>
        </div>
      </Demo>

      <Demo
        title="A betting line is a ring you declare"
        description={
          <>
            Anything the ring plays host to is the caller&apos;s: a betting line is a <Prop>ring</Prop> at a radius,
            the chips on it are a <Prop>slot</Prop> that places content toward each seat, and whose turn it is is{" "}
            <Prop>Seat</Prop>&apos;s <Prop>isActive</Prop>. A game with no betting declares none and gets neither.
          </>
        }
        previewClassName="p-0 overflow-hidden"
        code={`<RoundTable
  seatCount={6}
  rings={[BET_RING]}
  slots={betSlots(bets)}
  renderSeat={(i, box) => <Seat isActive={activeSeat === i} width={box.width} height={box.height} />}
/>`}
      >
        <div className="w-full">
          <Row className="justify-center border-b border-white/10 py-3">
            <Btn onClick={() => setLine((v) => !v)} active={line}>
              betting line
            </Btn>
          </Row>
          <div className="h-[420px] w-full">
            <RoundTable
              seatCount={6}
              rings={line ? [BET_RING] : undefined}
              slots={line ? betSlots(SAMPLE.bets) : undefined}
              renderSeat={(i, box) => <PlayerSeat index={i} width={box.width} height={box.height} isActive={i === 3} />}
              center={<Counter label="Main" amount={SAMPLE.pot} />}
            />
          </div>
        </div>
      </Demo>

      <H2>API</H2>
      <P>
        <Prop>RoundTable</Prop> adds no props of its own — it is <Prop>CardTable</Prop> with the surface and the seat
        placement already decided. The table below is <Prop>CardTable</Prop>&apos;s, minus the shape knobs it decided
        for you: <Prop>shape</Prop>, <Prop>seatPlacement</Prop> and <Prop>cornerRadius</Prop>.
      </P>
      <CardTablePropsFor parent="RoundTable" />
    </>
  );
}

/* ----------------------------------------------------------- SquareTable -- */

export function SquareTablePage() {
  const [corner, setCorner] = useState(70);
  const [count, setCount] = useState(4);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">SquareTable</h1>
      <Sec slug="square-table" />

      <Demo
        title="A rectangle, walked by arc length"
        description={
          <>
            The frames space along the rectangle&apos;s perimeter by arc length, so four, six or eight players do not
            bunch into the corners the way an angle-based arrangement would.{" "}
            <Prop>cornerRadius</Prop> survives on this type, because how round a rectangle&apos;s corners are is a
            property of the rectangle — set it to <Prop>0</Prop> for hard edges.
          </>
        }
        previewClassName="p-0 overflow-hidden"
        code={`<SquareTable
  seatCount={4}
  cornerRadius={70}
  renderSeat={(i, box) => <Seat width={box.width} height={box.height} />}
/>`}
      >
        <div className="w-full">
          <Row className="justify-center border-b border-white/10 py-3">
            <Stepper label="cornerRadius" value={corner} min={0} max={260} step={4} onChange={setCorner} />
          </Row>
          <Row className="justify-center border-b border-white/10 py-3">
            {[4, 6, 8].map((n) => (
              <Btn key={n} onClick={() => setCount(n)} active={count === n}>
                {n} seats
              </Btn>
            ))}
          </Row>
          <div className="h-[420px] w-full">
            <SquareTable cornerRadius={corner} seatCount={count} renderSeat={renderPlayers()} />
          </div>
        </div>
      </Demo>

      <H2>API</H2>
      <P>
        <Prop>SquareTable</Prop> also adds no props of its own — it is <Prop>CardTable</Prop> with the surface and the
        seat placement decided. The table below is <Prop>CardTable</Prop>&apos;s, minus the two knobs it decided:{" "}
        <Prop>shape</Prop> and <Prop>seatPlacement</Prop>. <Prop>cornerRadius</Prop> stays, because it is a property of
        the rectangle.
      </P>
      <CardTablePropsFor parent="SquareTable" />
    </>
  );
}

/* ----------------------------------------------------------- DealerTable -- */

export function DealerTablePage() {
  const [handCount, setHandCount] = useState(4);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">DealerTable</h1>
      <Sec slug="dealer-table" />

      <Demo
        title="A head, and a row of hands"
        description={
          <>
            The third table type: one frame at the head and a row of frames for the players, with no felt and no rail.
            For the many card games that are not played <em>around</em> anything — twenty-one, the banking games,
            baccarat, dragon-tiger — where one position holds something everybody else acts against. It is built from{" "}
            <Prop>FitBox</Prop> and <Prop>rowFrames</Prop> rather than <Prop>CardTable</Prop>, so it cannot draw a
            surface even by accident.
          </>
        }
        previewClassName="p-0 overflow-hidden"
        code={`<DealerTable
  handCount={hands.length}
  head={<Seat header="Dealer"><CardRow cards={dealer} /></Seat>}
  renderHand={(i) => (
    <Seat isActive={hands[i].active} footer={<ChipStack amount={hands[i].bet} />}>
      <CardRow cards={hands[i].cards} />
    </Seat>
  )}
/>`}
      >
        <div className="w-full">
          <Row className="justify-center border-b border-white/10 py-3">
            <Stepper label="handCount" value={handCount} min={1} max={6} onChange={setHandCount} />
          </Row>
          <div className="h-[460px] w-full">
            <DealerTable
              handCount={handCount}
              head={
                <Seat width={240} height={200} header={<span className="w-full text-center font-semibold">Dealer</span>}>
                  <CardRow cards={SAMPLE.hand} size="md" />
                </Seat>
              }
              renderHand={(i, box) => (
                <PlayerSeat
                  index={i}
                  width={box.width}
                  height={box.height}
                  isActive={i === 0}
                  footer={
                    <span className="w-full text-center">
                      <ChipStack amount={(i + 1) * 25} size="sm" />
                    </span>
                  }
                />
              )}
            />
          </div>
        </div>
      </Demo>

      <Demo
        title="The head is a position, not a role"
        description={
          <>
            Pass the dealer&apos;s hand, the banker&apos;s, or a label and a set of positions. Here the head holds three
            reserved <Prop>CardSlot</Prop>s — the shape of the game laid out before anything is dealt, which is the
            whole reason <Prop>CardSlot</Prop> exists.
          </>
        }
        previewClassName="p-0 overflow-hidden"
        code={`/* the worked example from examples/games.tsx, not a second copy */
<BankingExample highlight={1} />`}
      >
        <div className="h-[420px] w-full">
          <BankingExample highlight={1} />
        </div>
      </Demo>

      <Demo
        title="fit: design vs container"
        description={
          <>
            Like every table, <Prop>fit=&quot;design&quot;</Prop> (the default) scales a fixed design box and{" "}
            <Prop>fit=&quot;container&quot;</Prop> derives the width from the container&apos;s aspect ratio.
          </>
        }
        previewClassName="p-6 overflow-x-auto"
        align="start"
        code={`<DealerTable fit="container" handCount={3} />`}
      >
        <div className="flex gap-6">
          {(["design", "container"] as const).map((fit) => (
            <div key={fit}>
              <div className="mb-2 font-mono text-[11px] text-neutral-400">{`fit="${fit}"`}</div>
              <div className="h-[320px] w-[180px] overflow-hidden rounded-lg border border-white/10">
                <DealerTable
                  fit={fit}
                  handCount={3}
                  headWidth={160}
                  headHeight={120}
                  handWidth={120}
                  handHeight={150}
                  head={
                    <Seat width={160} height={120} header={<span className="w-full text-center text-[9px]">dealer</span>} />
                  }
                  renderHand={(i) => (
                    <Seat width={120} height={150} header={<span className="w-full text-center text-[9px]">{i}</span>} />
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </Demo>

      <H2>API</H2>
      <ApiTable rows={DOC_BY_SLUG["dealer-table"].props} caption="DealerTable props" />

      <Row className="mt-4">
        <Field label="head:" value="a position, not a role" />
        <Field label="no felt:" value="it has none to draw" />
      </Row>
    </>
  );
}
