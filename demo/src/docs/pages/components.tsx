import { useState } from "react";
import {
  CardBack,
  CardFan,
  CardRow,
  CardSlot,
  CardTable,
  CommunityCards,
  Confetti,
  Counter,
  DEFAULT_FELT_GAP,
  DEFAULT_MARGIN_X,
  DEFAULT_MARGIN_Y,
  DESIGN_H,
  DESIGN_W,
  FitBox,
  HoleCards,
  PlayingCard,
  Seat,
  layoutTable,
  minFrameSeparation,
  seatAngle,
  useFitBox,
  type SeatPlacement,
  type TableShape,
} from "@stargazeryan/poker-ui";
import {
  Chip,
  ChipStack,
  DEFAULT_DENOMINATIONS,
  chipBreakdown,
  chipCount,
  chipsTotal,
  formatBB,
  type Denomination,
} from "@stargazeryan/poker-ui/wager";
import { ApiTable, Btn, Callout, Demo, Field, H2, P, Prop, Row, Stepper } from "../ui";
import { DOC_BY_SLUG } from "../registry";
import { CARD_TABLE_CONTROLS, CONFETTI_PALETTES } from "../inventory";

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

/** The content half of every table demo: a neutral seat with a couple of cards. */
function Player({ i, isYou, width, height, active, winner }: { i: number; isYou: boolean; width: number; height: number; active?: boolean; winner?: boolean }) {
  return (
    <Seat
      width={width}
      height={height}
      isActive={active}
      isWinner={winner}
      header={<span className="w-full truncate text-center font-semibold">{isYou ? "You" : `Seat ${i}`}</span>}
      footer={<span className="w-full text-center font-mono text-gold-light">{500 - i * 40}</span>}
    >
      {i % 2 === 0 ? <CardRow cards={["As", "Kh"]} size="sm" /> : <CardRow cards={[null, null]} size="sm" />}
    </Seat>
  );
}

/* ----------------------------------------------------------------- Chips -- */

/** Bets for the table demo, in chip units, picked to need several colours. */
const CHIP_BETS = [35, 0, 60, 115, 0, 240];

export function ChipsPage() {
  const [amount, setAmount] = useState(487);
  const [cap, setCap] = useState(12);

  const entries = chipBreakdown(amount);
  const count = chipCount(entries);
  const total = chipsTotal(entries);

  const dollars: Denomination[] = [
    { value: 100, label: "$100", color: "#1a1a2e", className: "fill-chip-black" },
    { value: 20, label: "$20", color: "#2980b9", className: "fill-chip-blue" },
    { value: 5, label: "$5", color: "#c0392b", className: "fill-chip-red" },
    { value: 1, label: "$1", color: "#ecf0f1", className: "fill-chip-white" },
  ];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Chips</h1>
      <p className="mt-3 text-sm leading-relaxed text-neutral-300">
        Everything on this page lives in the{" "}
        <Prop>@stargazeryan/poker-ui/wager</Prop> entry point, not the main one: chips are about money on the table,
        which a game with no betting should not have to carry. Import them from the subpath.
      </p>
      <Sec slug="chip-stack" />

      <Demo
        title="An amount becomes chips"
        description={
          <>
            The split runs in <Prop>chipBreakdown</Prop>, exported on its own so you can show the breakdown without
            drawing it. Amounts are in <strong>chip units</strong> — the smallest chip is 1 — not big blinds, and
            whatever is left below the smallest chip is reported rather than rounded up.
          </>
        }
        code={`import { ChipStack, chipBreakdown } from "@stargazeryan/poker-ui/wager";

const entries = chipBreakdown(487);
// [{ value: 100, count: 4 }, { value: 25, count: 3 },
//  { value: 10, count: 1 }, { value: 1, count: 2 }]

<ChipStack amount={487} size="lg" label="487" />`}
      >
        <div className="flex flex-col items-center gap-6">
          <Stepper label="amount" value={amount} min={0} max={1500} onChange={setAmount} />
          <ChipStack
            amount={amount}
            size="lg"
            label={<span className="font-mono text-xs text-gold-light">{amount}</span>}
          />
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="text-left text-sm">
              <thead>
                <tr className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-neutral-500">
                  <th className="px-3 py-2 font-semibold">Chip</th>
                  <th className="px-3 py-2 font-semibold">Value</th>
                  <th className="px-3 py-2 font-semibold">How many</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 && (
                  <tr>
                    <td className="px-3 py-2 text-neutral-500" colSpan={3}>
                      nothing to stack
                    </td>
                  </tr>
                )}
                {entries.map((entry) => (
                  <tr key={entry.value} className="border-t border-white/[0.06]">
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block h-3 w-3 rounded-full border border-white/20"
                          style={{ background: entry.color }}
                        />
                        <span className="font-mono text-[12px] text-neutral-300">{entry.label ?? entry.value}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[12px] text-neutral-300">{entry.value}</td>
                    <td className="px-3 py-2 font-mono text-[12px] text-gold">{entry.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Row className="justify-center">
            <Field label="physical chips:" value={count} />
            <Field label="adds up to:" value={total} />
            {total !== amount && <Field label="below the smallest chip:" value={amount - total} />}
          </Row>
        </div>
      </Demo>

      <Demo
        title="Denominations are yours"
        description={
          <>
            Blue is 10 by default, because plenty of rooms use 10 and plenty use 20. Swap the set and both the
            breakdown and the faces follow. Here blue is 20 and the labels read as dollars.
          </>
        }
        code={`const dollars = [
  { value: 100, label: "$100", color: "#1a1a2e", className: "fill-chip-black" },
  { value: 20,  label: "$20",  color: "#2980b9", className: "fill-chip-blue"  },
  { value: 5,   label: "$5",   color: "#c0392b", className: "fill-chip-red"   },
  { value: 1,   label: "$1",   color: "#ecf0f1", className: "fill-chip-white" },
];

<ChipStack amount={141} denominations={dollars} />`}
      >
        <div className="flex flex-wrap items-end justify-center gap-10">
          <div className="flex flex-col items-center gap-2">
            <ChipStack amount={141} size="lg" />
            <Field label="default set (blue=10):" value="141" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <ChipStack amount={141} size="lg" denominations={dollars} />
            <Field label="blue=20, dollars:" value="141" />
          </div>
        </div>
      </Demo>

      <Demo
        title="maxChips keeps a big bet readable"
        description={
          <>
            A 10,000 bet is a hundred black chips. The stack keeps the biggest denominations and says how many it left
            off. The accessible name always describes the whole amount, not just the chips drawn.
          </>
        }
        code={`<ChipStack amount={10000} maxChips={12} />`}
      >
        <div className="flex flex-col items-center gap-5">
          <Stepper label="maxChips" value={cap} min={1} max={30} onChange={setCap} />
          <ChipStack amount={10000} size="md" maxChips={cap} />
        </div>
      </Demo>

      <Demo
        title="Sizes"
        description="22 / 30 / 42px wide; the stack offsets itself in proportion."
        code={`<ChipStack amount={60} size="sm" />\n<ChipStack amount={60} size="md" />\n<ChipStack amount={60} size="lg" />`}
      >
        <div className="flex items-end justify-center gap-10">
          {(["sm", "md", "lg"] as const).map((size) => (
            <ChipStack
              key={size}
              amount={60}
              size={size}
              label={<span className="font-mono text-[10px] text-neutral-400">{size}</span>}
            />
          ))}
        </div>
      </Demo>

      <Api slug="chip-stack" />

      <H2>Chip</H2>
      <p className="mt-3 text-sm leading-relaxed text-neutral-300">{DOC_BY_SLUG["chip"].summary}</p>
      <Demo
        title="The default set"
        description={
          <>
            Each chip names itself for screen readers, carries eight edge spots clipped to the body, and takes its
            colour from <Prop>--color-chip-*</Prop> through a <Prop>fill-*</Prop> utility — so the chip palette is
            themeable exactly like the felt and the gold. The spots pick themselves: white, except on a light body,
            where white spots would sit at 1.1:1 and disappear.
          </>
        }
        code={`<Chip value={100} color="#1a1a2e" colorClassName="fill-chip-black" size="lg" />`}
      >
        <div className="flex items-end justify-center gap-4">
          {DEFAULT_DENOMINATIONS.map((d) => (
            <Chip key={d.value} value={d.value} color={d.color} colorClassName={d.className} size="lg" />
          ))}
        </div>
      </Demo>
      <Api slug="chip" />
    </>
  );
}

/* ------------------------------------------------------------- CardTable -- */

function SeatGapDemo() {
  const [count, setCount] = useState(10);
  const [gap, setGap] = useState(24);
  const geo = layoutTable({
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
  const actual = minFrameSeparation(geo.seats);
  const shrunk = geo.seatW < 160 || geo.seatH < 176;

  return (
    <>
      <Row className="mb-3 justify-center">
        <Stepper label="seats" value={count} min={2} max={20} onChange={setCount} />
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
          renderSeat={(i, box) => (
            <Player i={i} isYou={i === 0} width={box.width} height={box.height} active={i === 1} />
          )}
          center={<Counter label="Main" amount={487} />}
        />
      </div>
    </>
  );
}

/* ------------------------------------------------------------ playground -- */

/**
 * One control per *tunable* prop — `inventory.ts` holds the list and
 * tests/docs-api.test.ts fails if a prop that is not seat/center content has no
 * control here. That is the difference between "the demo shows a table" and
 * "the demo lets you move every knob".
 */
const PLAYGROUND_INITIAL: Record<string, number | boolean | string> = {
  seatCount: 6,
  startAngle: 90,
  seatWidth: 160,
  seatHeight: 176,
  seatGap: 24,
  designWidth: DESIGN_W,
  designHeight: DESIGN_H,
  marginX: DEFAULT_MARGIN_X,
  marginY: DEFAULT_MARGIN_Y,
  feltGap: DEFAULT_FELT_GAP,
  cornerRadius: 120,
  shape: "ellipse",
  seatPlacement: "ring",
  deck: true,
  ambient: true,
  fit: "design",
  className: false,
  // Not CardTable props: what the *caller* decides to declare and draw.
  glow: true,
  confetti: true,
  palette: CONFETTI_PALETTES[0].label,
};

function CardTablePlayground() {
  const [v, setV] = useState(PLAYGROUND_INITIAL);
  const num = (prop: string) => v[prop] as number;
  const bool = (prop: string) => v[prop] as boolean;
  const set = (prop: string, value: number | boolean | string) => setV((s) => ({ ...s, [prop]: value }));

  const numeric = CARD_TABLE_CONTROLS.filter((c) => c.kind === "number");
  const toggles = CARD_TABLE_CONTROLS.filter((c) => c.kind === "boolean");
  const choices = CARD_TABLE_CONTROLS.filter((c) => c.kind === "enum" || c.kind === "palette");

  const count = Math.max(1, Math.floor(num("seatCount")));
  const geo = layoutTable({
    count,
    designWidth: num("designWidth"),
    designHeight: num("designHeight"),
    marginX: num("marginX"),
    marginY: num("marginY"),
    feltGap: num("feltGap"),
    seatWidth: num("seatWidth"),
    seatHeight: num("seatHeight"),
    seatGap: num("seatGap"),
    startAngle: num("startAngle"),
    shape: v.shape as TableShape,
    seatPlacement: v.seatPlacement as SeatPlacement,
    cornerRadius: num("cornerRadius"),
  });
  const gap = minFrameSeparation(geo.seats);
  const palette = CONFETTI_PALETTES.find((p) => p.label === v.palette) ?? CONFETTI_PALETTES[0];
  const frame = `${Math.round(geo.seatW)}×${Math.round(geo.seatH)}`;

  return (
    <>
      <div className="grid gap-3 border-b border-white/10 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {numeric.map((c) => (
          <Stepper
            key={c.prop}
            label={c.prop}
            value={num(c.prop)}
            min={c.min ?? 0}
            max={c.max ?? 100}
            step={c.step ?? 1}
            format={(n) => ((c.step ?? 1) < 1 ? n.toFixed(3) : String(n))}
            onChange={(n) => set(c.prop, n)}
          />
        ))}
      </div>

      <Row className="border-b border-white/10 p-4">
        {toggles.map((c) => (
          <Btn key={c.prop} active={bool(c.prop)} onClick={() => set(c.prop, !bool(c.prop))}>
            <span title={c.hint}>{c.prop}</span>
          </Btn>
        ))}
      </Row>

      <Row className="gap-4 border-b border-white/10 p-4">
        {choices.map((c) => (
          <span key={c.prop} className="flex items-center gap-1">
            <span className="mr-1 font-mono text-[11px] text-neutral-500">{c.prop}</span>
            {c.options?.map((option) => (
              <Btn key={option} active={String(v[c.prop]) === option} onClick={() => set(c.prop, option)}>
                {option}
              </Btn>
            ))}
          </span>
        ))}
      </Row>

      <Row className="gap-4 border-b border-white/10 p-4">
        <span className="mr-1 font-mono text-[11px] text-neutral-500">overlay</span>
        <Btn active={bool("glow")} onClick={() => set("glow", !bool("glow"))}>
          your-turn ring
        </Btn>
        <Btn active={bool("confetti")} onClick={() => set("confetti", !bool("confetti"))}>
          <span title="renders <Confetti />">confetti</span>
        </Btn>
        {CONFETTI_PALETTES.map((p) => (
          <Btn key={p.label} active={v.palette === p.label} onClick={() => set("palette", p.label)}>
            {p.label}
          </Btn>
        ))}
      </Row>

      <Row className="border-b border-white/10 px-4 py-3">
        <Field label="seats:" value={count} />
        <Field label="frames:" value={frame} />
        <Field label="closest gap:" value={`${gap.toFixed(1)}px${gap < 0 ? " — overlapping" : ""}`} />
        <Field label="shrunk:" value={geo.seatW < num("seatWidth") - 0.5 || geo.seatH < num("seatHeight") - 0.5 ? "yes" : "no"} />
      </Row>

      <div className="h-[440px] w-full">
        <CardTable
          seatCount={count}
          startAngle={num("startAngle")}
          seatWidth={num("seatWidth")}
          seatHeight={num("seatHeight")}
          seatGap={num("seatGap")}
          designWidth={num("designWidth")}
          designHeight={num("designHeight")}
          marginX={num("marginX")}
          marginY={num("marginY")}
          feltGap={num("feltGap")}
          cornerRadius={num("cornerRadius")}
          shape={v.shape as TableShape}
          seatPlacement={v.seatPlacement as SeatPlacement}
          deck={bool("deck")}
          ambient={bool("ambient")}
          fit={v.fit as "design" | "container"}
          className={bool("className") ? "outline-dashed outline-1 outline-amber-400/60" : undefined}
          /* The betting line is a ring the caller declares and the chips are a
             slot — the table names neither. */
          rings={[{ id: "betting-line", radius: 0.72 }]}
          slots={[
            {
              id: "bet",
              radius: 0.72,
              render: (i) => (i === 1 ? <ChipStack amount={60} size="sm" /> : i === 3 ? <ChipStack amount={25} size="sm" /> : null),
            },
          ]}
          renderOverlay={({ layout }) => (
            <>
              {bool("glow") && <div style={layout.boxes.glow} className="absolute animate-turn-glow rounded-[50%]" />}
              {bool("confetti") && <Confetti colors={[...palette.colors]} />}
            </>
          )}
          renderSeat={(i, box) => (
            <Seat
              width={box.width}
              height={box.height}
              isActive={i === 0 && bool("glow")}
              isWinner={bool("confetti") && i === 0}
              header={<span className="w-full text-center text-[11px] font-semibold">{i === 0 ? "you" : `seat ${i}`}</span>}
              footer={<span className="w-full text-center font-mono text-[10px] text-amber-300">{i * 20} BB</span>}
            >
              <CardRow cards={["As", "Kh"]} size="xs" />
            </Seat>
          )}
          center={
            <div className="flex flex-col items-center gap-2">
              <CardRow cards={["Ah", "Kd", "7c"]} size="md" animation="flip" />
              <Counter label="Main" amount={487} format={formatBB} />
            </div>
          }
        />
      </div>
    </>
  );
}

export function CardTablePage() {
  const [count, setCount] = useState(6);
  const [turn, setTurn] = useState(true);
  const [winner, setWinner] = useState(false);

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
  renderSeat={(i, box) => (
    <Seat width={box.width} height={box.height} header={<b>{i}</b>}>
      <CardRow cards={hands[i]} size="sm" />
    </Seat>
  )}
  center={<Counter label="Main" amount={487} />}
/>`}
      >
        <div className="w-full">
          <Row className="justify-center border-b border-white/10 py-3">
            {[2, 3, 4, 6, 9, 10, 12, 16].map((n) => (
              <Btn key={n} onClick={() => setCount(n)} active={count === n}>
                {n}
              </Btn>
            ))}
          </Row>
          <div className="h-[400px] w-full">
            <CardTable
              seatCount={count}
              renderSeat={(i, box) => <Player i={i} isYou={i === 0} width={box.width} height={box.height} />}
              center={<Counter label="Main" amount={487} />}
            />
          </div>
        </div>
      </Demo>

      <Demo
        title="The betting line is a ring you declare"
        description={
          <>
            The table draws no line of its own. A betting line is a <Prop>ring</Prop> at a radius, and the chips on it
            are a <Prop>slot</Prop> that places content between the centre and each seat — declarative, and impossible
            to drift apart, because both are positioned from the same layout. A game with no betting simply declares
            none and gets neither.
          </>
        }
        previewClassName="p-0 overflow-hidden"
        code={`<CardTable
  rings={[{ id: "betting-line", radius: 0.72 }]}
  slots={[{
    id: "bet",
    radius: 0.72,
    render: (i) => bets[i] ? <ChipStack amount={bets[i]} size="sm" /> : null,
  }]}
  renderSeat={(i, box) => <Seat width={box.width} height={box.height} />}
/>`}
      >
        <div className="h-[400px] w-full">
          <CardTable
            seatCount={6}
            rings={[{ id: "betting-line", radius: 0.72 }]}
            slots={[
              {
                id: "bet",
                radius: 0.72,
                render: (i) => (CHIP_BETS[i] ? <ChipStack amount={CHIP_BETS[i]} size="sm" /> : null),
              },
            ]}
            renderSeat={(i, box) => <Player i={i} isYou={i === 0} width={box.width} height={box.height} />}
            center={<Counter label="Main" amount={487} />}
          />
        </div>
      </Demo>

      <Demo
        title="The overlay: edge effects and celebrations"
        description={
          <>
            The table has no <Prop>yourTurn</Prop> and no <Prop>winnerSeats</Prop> — it does not know that anything is
            happening. <Prop>renderOverlay</Prop> hands you the geometry, and <em>you</em> draw the ring and drop the
            confetti when your own state says so.
          </>
        }
        previewClassName="p-0 overflow-hidden"
        code={`<CardTable
  renderOverlay={({ layout }) => (
    <>
      {isMyTurn && <div style={layout.boxes.glow} className="absolute animate-turn-glow rounded-[50%]" />}
      {showdown && <Confetti colors={["#f39c12", "#e74c3c"]} />}
    </>
  )}
  renderSeat={(i, box) => <Seat isActive={myTurnSeat === i} width={box.width} height={box.height} />}
/>`}
      >
        <div className="w-full">
          <Row className="justify-center border-b border-white/10 py-3">
            <Btn onClick={() => setTurn((v) => !v)} active={turn}>
              your turn
            </Btn>
            <Btn onClick={() => setWinner((v) => !v)} active={winner}>
              showdown
            </Btn>
          </Row>
          <div className="h-[400px] w-full">
            <CardTable
              seatCount={6}
              renderOverlay={({ layout }) => (
                <>
                  {turn && <div style={layout.boxes.glow} className="absolute animate-turn-glow rounded-[50%]" />}
                  {winner && <Confetti colors={["#f39c12", "#e74c3c", "#2ecc71"]} />}
                </>
              )}
              renderSeat={(i, box) => (
                <Player
                  i={i}
                  isYou={i === 0}
                  width={box.width}
                  height={box.height}
                  active={turn && i === 2}
                  winner={winner && i === 2}
                />
              )}
              center={<Counter label="Main" amount={487} />}
            />
          </div>
        </div>
      </Demo>

      <Demo
        title="shape and seatPlacement"
        description={
          <>
            <Prop>shape</Prop> picks the boundary — <Prop>&quot;ellipse&quot;</Prop>, a <Prop>&quot;rect&quot;</Prop>{" "}
            with <Prop>cornerRadius</Prop>, or <Prop>&quot;none&quot;</Prop> for no surface at all — and{" "}
            <Prop>seatPlacement</Prop> picks where the seats go: a <Prop>ring</Prop>, a rectangle&apos;s{" "}
            <Prop>perimeter</Prop>, or a <Prop>row</Prop>. Mixing them is allowed: a rectangle with its seats on a
            ring, a rectangle with no felt. <Prop>deck</Prop> draws the rail and felt (on by default, except with{" "}
            <Prop>shape=&quot;none&quot;</Prop>).
          </>
        }
        previewClassName="p-6 overflow-x-auto"
        align="start"
        code={`<CardTable shape="rect" seatPlacement="perimeter" cornerRadius={60} deck />
<CardTable shape="none" seatPlacement="row" />`}
      >
        <div className="flex gap-6">
          {[
            { label: 'shape="rect"', shape: "rect" as const, seatPlacement: "perimeter" as const },
            { label: 'shape="none"', shape: "none" as const, seatPlacement: "row" as const },
          ].map((o) => (
            <div key={o.label}>
              <div className="mb-2 font-mono text-[11px] text-neutral-400">{o.label}</div>
              <div className="h-[320px] w-[240px] overflow-hidden rounded-lg border border-white/10">
                <CardTable
                  seatCount={6}
                  shape={o.shape}
                  seatPlacement={o.seatPlacement}
                  renderSeat={(i, box) => (
                    <Seat
                      width={box.width}
                      height={box.height}
                      frameClassName="p-1"
                      header={<span className="w-full text-center text-[9px]">{i === 0 ? "you" : i}</span>}
                    />
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </Demo>

      <Demo
        title="Seat frames shrink to keep their distance"
        description={
          <>
            Measured on the real layout helpers (<Prop>layoutTable</Prop>, <Prop>minFrameSeparation</Prop> — both
            exported). At 160×176 a 6-seat ring leaves 161px between neighbours, but a 10-seat ring leaves only 25.6px.
            Frames shrink uniformly (never below 50%) until <Prop>seatGap</Prop> is honoured, and{" "}
            <Prop>renderSeat</Prop> receives the size it settled on. The same mechanism is why 11–16 seats work at all;
            past ~16 the frames sit on the shrink floor and overlap.
          </>
        }
        previewClassName="p-4"
        code={`<CardTable
  seatCount={10}
  seatGap={24}          // 0 disables the shrink
  renderSeat={(i, box) => (
    // box is the frame the ring was laid out for
    <Seat width={box.width} height={box.height} />
  )}
/>`}
      >
        <SeatGapDemo />
      </Demo>

      <Demo
        title="Every parameter"
        description={
          <>
            Every tunable <Prop>CardTable</Prop> prop, live: the design box, the rail and felt insets, the frame size,
            the auto-shrink, the shape and seat placement, the decorations. The readout under the controls comes from{" "}
            <Prop>layoutTable</Prop> — the same call the component makes.
          </>
        }
        previewClassName="p-0 overflow-hidden"
        align="start"
        code={`<CardTable
  seatCount={6} startAngle={90}            // ring
  seatWidth={160} seatHeight={176}         // preferred frame
  seatGap={24}                             // clearance, auto-shrink
  designWidth={1200} designHeight={900}    // the design box
  marginX={164 / 1200} marginY={196 / 900} // rail inset
  feltGap={11}                             // felt inset
  shape="ellipse" cornerRadius={120}       // the boundary
  seatPlacement="ring" deck                // where the seats go, draw the felt
  fit="design" ambient                     // scaling, spotlight + shimmer
  renderOverlay={({ layout }) => (…)}      // the ring, the confetti — your call
/>`}
      >
        <CardTablePlayground />
      </Demo>

      <H2>Who decides what</H2>
      <P>
        The table lays out and draws; it never decides. There is no <Prop>yourTurn</Prop> and no{" "}
        <Prop>winnerSeats</Prop> on it — it holds no game state at all. The caller passes <Prop>isActive</Prop> /{" "}
        <Prop>isWinner</Prop> to the <Prop>Seat</Prop>s it renders, declares the rings and slots it wants, and puts
        edge effects and celebrations in <Prop>renderOverlay</Prop>. Everything the table knows is geometry, and{" "}
        <Prop>renderOverlay</Prop> hands you all of it — which is why a your-turn ring is one line rather than a prop.
        The demo above shows exactly that, and its <em>show code</em> has the snippet:
      </P>
      <P>
        <Prop>geometry.layout</Prop> is exactly what <Prop>layoutTable</Prop> returned: every surface box (table, felt,
        rim, glow), every seat centre and the frame size after the auto-shrink, plus <Prop>ringBox(radius)</Prop> and{" "}
        <Prop>slotPoint(index, radius)</Prop> to place anything else on the real surface.
      </P>

      <H2>Confetti</H2>
      <p className="mt-3 text-sm leading-relaxed text-neutral-300">{DOC_BY_SLUG["confetti"].summary}</p>
      <Api slug="confetti" />
      <Demo
        title="Confetti"
        description={
          <>
            Fills whatever box it is rendered into — here a plain <Prop>relative</Prop> div, in the table it is the
            design box via <Prop>renderOverlay</Prop>. It animates for as long as it is mounted, so unmount it to stop it.
          </>
        }
        previewClassName="p-0 overflow-hidden"
        code={`<Confetti count={60} colors={["#f39c12", "#e74c3c", "#2ecc71", "#3498db"]} />`}
      >
        <div className="relative h-[280px] w-full bg-neutral-950">
          <Confetti count={60} colors={["#f39c12", "#e74c3c", "#2ecc71", "#3498db"]} />
        </div>
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
        description={
          <>
            Three generic states, all animated by default and all switchable. A crown over the winner is a decoration,
            not a state, so <Prop>isWinner</Prop> draws the frame and you pass the crown through <Prop>topLeft</Prop>.
          </>
        }
        code={`<Seat isActive />
<Seat isWinner topLeft={<span>👑</span>} />
<Seat isDimmed />`}
      >
        <div className="flex flex-wrap items-start justify-center gap-6">
          <Seat
            isActive={active}
            header={<span className="w-full text-center font-semibold">isActive</span>}
            footer={<span className="w-full text-center font-mono text-gold-light">100 BB</span>}
          >
            <CardRow cards={["As", "Kh"]} size="sm" animation={false} />
          </Seat>
          <Seat
            isWinner
            topLeft={<span className="text-base leading-none">👑</span>}
            header={<span className="w-full text-center font-semibold">isWinner</span>}
            footer={<span className="w-full text-center font-mono text-gold-light">340 BB</span>}
          >
            <CardRow cards={["Ah", "Ad"]} size="sm" animation={false} />
          </Seat>
          <Seat
            isDimmed={dimmed}
            header={<span className="w-full text-center font-semibold">isDimmed</span>}
            footer={<span className="w-full text-center font-mono text-neutral-400">folded</span>}
          >
            <CardRow cards={[null, null]} size="sm" animation={false} />
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

/* --------------------------------------------------------------- Counter -- */

export function CounterPage() {
  const [amount, setAmount] = useState(240);
  const [animated, setAnimated] = useState(true);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Counter</h1>
      <Sec slug="counter" />

      <Demo
        title="Count-up"
        description={`Click fast — the counter keeps easing toward the new target without ever jumping backwards. The default rendering is the plain number ${amount.toLocaleString()}: no unit is invented, because the library does not know what your numbers mean. Pot is a deprecated alias of Counter.`}
        code={`<Counter label="Main" amount={amount} />`}
      >
        <div className="flex flex-col items-center gap-4">
          <Counter label="Main" amount={amount} animate={animated} />
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
        description={
          <>
            The default is a plain number. Pass <Prop>format</Prop> for anything else — including{" "}
            <Prop>formatBB</Prop> from <Prop>@stargazeryan/poker-ui/wager</Prop>, which takes the big blind as an
            argument because 20 is rarely the right one for your table.
          </>
        }
        code={`<Counter amount={1234} format={(n) => "$" + n.toLocaleString()} />
<Counter amount={1234} format={formatBB} />                 // 61.7 BB
<Counter amount={1234} format={(n) => formatBB(n, 100)} />  // 12.3 BB`}
      >
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Counter amount={1234} format={(n) => "$" + n.toLocaleString()} />
          <Counter amount={1234} format={formatBB} />
          <Counter amount={1234} format={(n) => formatBB(n, 100)} />
          <Counter amount={1234} label="Main" format={(n) => `${n} chips`} />
        </div>
      </Demo>

      <Api slug="counter" />
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
        description="Wrap them in a flex row with a gap — that is exactly what CardRow does for null cards."
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

/* ------------------------------------------------------------- CardRow -- */

const ROW_BOARD = ["Ah", "Kd", "7c", "2s", "9h"];
const FAN_HAND = ["3s", "4h", "5d", "6c", "7s", "9h", "10d", "Jc", "Qs", "Kh", "2d", "2c", "2s"];

export function CardRowPage() {
  const [street, setStreet] = useState(3);
  const [round, setRound] = useState(1);
  const [overlap, setOverlap] = useState(0.68);
  const [arc, setArc] = useState(20);
  const hands = [
    ["As", "Kh"],
    ["Qd", "Jc"],
    ["9s", "9d"],
    ["Ah", "Ad"],
  ];
  const hand = hands[(round - 1) % hands.length];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">CardRow</h1>
      <Sec slug="card-row" />

      <Demo
        title="One component, three arrivals"
        description={
          <>
            The arrangement is the same in every card game; only the entrance differs.{" "}
            <Prop>animation=&quot;deal&quot;</Prop> slides each card in, <Prop>&quot;flip&quot;</Prop> turns it over in
            3D, and <Prop>false</Prop> renders the row static. The vocabulary a game uses — hole cards, a board, a
            meld, up-cards — is the caller&apos;s, not the component&apos;s.
          </>
        }
        code={`<CardRow cards={["As", "Kh"]} animation="deal" size="sm" />
<CardRow cards={board.slice(0, street)} animation="flip" size="lg" />
<CardRow cards={["As", "Kh"]} animation={false} size="sm" />`}
      >
        <div className="flex flex-col items-center gap-4">
          <CardRow cards={["As", "Kh"]} animation="deal" size="sm" />
          <CardRow cards={ROW_BOARD.slice(0, street)} animation="flip" size="lg" />
          <CardRow cards={["As", "Kh"]} animation={false} size="sm" />
        </div>
      </Demo>
      <Row className="mt-3 justify-center">
        {[0, 3, 4, 5].map((n) => (
          <Btn key={n} onClick={() => setStreet(n)} active={street === n}>
            {n} cards
          </Btn>
        ))}
      </Row>

      <Demo
        title="Reserved positions"
        description={
          <>
            <Prop>slots</Prop> reserves a fixed number of positions so the row&apos;s width never changes as cards
            arrive — useful when something is centred next to it. A <Prop>null</Prop> <em>inside</em> the row is a
            face-down card by default; pass <Prop>placeholder=&quot;empty&quot;</Prop> for an undealt position, and a
            position past the end of the array is always empty.
          </>
        }
        code={`<CardRow cards={board} slots={5} />
<CardRow cards={board} slots={5} placeholder="empty" />`}
      >
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-[11px] text-neutral-500">slots=5 · placeholder="back"</span>
            <CardRow cards={ROW_BOARD.slice(0, street)} size="lg" slots={5} animation="flip" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-mono text-[11px] text-neutral-500">slots=5 · placeholder="empty"</span>
            <CardRow cards={ROW_BOARD.slice(0, street)} size="lg" slots={5} animation={false} placeholder="empty" />
          </div>
        </div>
      </Demo>

      <Api slug="card-row" />

      <H2>CardFan</H2>
      <p className="mt-3 text-sm leading-relaxed text-neutral-300">{DOC_BY_SLUG["card-fan"].summary}</p>
      <Demo
        title="Overlap, and an arc"
        description={
          <>
            <Prop>overlap</Prop> is how much of a card width the next one covers; <Prop>arc</Prop> splays the tops
            apart by rotating each card about a pivot below the row. <Prop>arc=0</Prop> is a flat overlapping row.
          </>
        }
        code={`<CardFan cards={hand} size="sm" overlap={0.68} arc={20} />`}
      >
        <div className="flex flex-col items-center gap-5">
          <Row className="justify-center">
            <Stepper label="overlap" value={overlap} min={0} max={0.95} step={0.05} format={(n) => n.toFixed(2)} onChange={setOverlap} />
            <Stepper label="arc" value={arc} min={0} max={60} step={2} onChange={setArc} />
          </Row>
          <CardFan cards={FAN_HAND} size="sm" overlap={overlap} arc={arc} />
        </div>
      </Demo>
      <Api slug="card-fan" />

      <H2>Deprecated wrappers</H2>
      <p className="mt-3 text-sm leading-relaxed text-neutral-300">
        <Prop>HoleCards</Prop> and <Prop>CommunityCards</Prop> are the names these used to have, and both are still
        exported so existing code keeps working — they are thin presets of <Prop>CardRow</Prop> now.
      </p>

      <Demo
        title="HoleCards"
        description={
          <>
            <Prop>CardRow</Prop> with <Prop>size=&quot;lg&quot;</Prop> and <Prop>animation=&quot;deal&quot;</Prop>.{" "}
            <Prop>dealKey</Prop> re-deals an unchanged hand, because React reuses an element whose key has not changed
            and a reused element never restarts its CSS animation.
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
      <p className="mt-3 text-sm leading-relaxed text-neutral-300">{DOC_BY_SLUG["hole-cards"].summary}</p>
      <Api slug="hole-cards" />

      <Demo
        title="CommunityCards"
        description={
          <>
            <Prop>CardRow</Prop> with <Prop>animation=&quot;flip&quot;</Prop> and{" "}
            <Prop>placeholder=&quot;empty&quot;</Prop>.
          </>
        }
        code={`<CommunityCards cards={board.slice(0, street)} slots={5} />`}
      >
        <div className="flex flex-col items-center gap-4">
          <CommunityCards cards={ROW_BOARD.slice(0, street)} size="lg" slots={5} />
          <Row className="justify-center">
            {[0, 3, 4, 5].map((n) => (
              <Btn key={n} onClick={() => setStreet(n)} active={street === n}>
                {n} cards
              </Btn>
            ))}
          </Row>
        </div>
      </Demo>
      <p className="mt-3 text-sm leading-relaxed text-neutral-300">{DOC_BY_SLUG["community-cards"].summary}</p>
      <Api slug="community-cards" />
    </>
  );
}

/* ------------------------------------------------------------ CardSlot -- */

export function CardSlotPage() {
  const [dealt, setDealt] = useState(1);
  const board = ["Ah", "Kd", "7c"];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">CardSlot</h1>
      <Sec slug="card-slot" />

      <Demo
        title="A position before a card exists"
        description={
          <>
            Each slot reserves the room a card of its size will take and draws a dashed outline while it is empty, so a
            game&apos;s final shape can be laid out before anything is dealt. Put a <Prop>PlayingCard</Prop> (or
            anything else) in it once there is one.
          </>
        }
        code={`<CardSlot size="md" label="goal, not dealt">
  {card ? <PlayingCard card={card} size="md" /> : null}
</CardSlot>`}
      >
        <div className="flex flex-col items-center gap-5">
          <div className="flex items-end gap-3">
            {board.map((card, i) => (
              <CardSlot key={card} size="md" label={`position ${i + 1}, not dealt`}>
                {i < dealt ? <PlayingCard card={card} size="md" /> : null}
              </CardSlot>
            ))}
          </div>
          <Row className="justify-center">
            {[0, 1, 2, 3].map((n) => (
              <Btn key={n} onClick={() => setDealt(n)} active={dealt === n}>
                {n} dealt
              </Btn>
            ))}
          </Row>
        </div>
      </Demo>

      <Demo
        title="A highlight on the position that matters"
        description={
          <>
            The slot takes a <Prop>className</Prop>, so a game can point at the one position under attention — here a
            solid gold border and the turn glow. An empty slot announces itself for screen readers; once it holds a
            card it is only a frame, so the card keeps its own accessible name.
          </>
        }
        code={`<CardSlot size="lg" className="border-solid border-gold animate-turn-glow" />`}
      >
        <div className="flex items-end gap-4">
          <CardSlot size="lg" />
          <CardSlot size="lg" className="border-solid border-gold animate-turn-glow" />
          <CardSlot size="lg">
            <PlayingCard card="Qc" size="lg" />
          </CardSlot>
        </div>
      </Demo>

      <Api slug="card-slot" />
    </>
  );
}

/* -------------------------------------------------------------- FitBox -- */

function UseFitBoxDemo() {
  const { outerRef, design } = useFitBox({ designWidth: 1200, designHeight: 900 });
  return (
    <div ref={outerRef} className="relative h-[220px] w-full">
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <Field label="design:" value={`${design.width}×${design.height}`} />
        <Field label="scale:" value={design.scale.toFixed(2)} />
      </div>
    </div>
  );
}

export function FitBoxPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">FitBox</h1>
      <Sec slug="fit-box" />

      <Demo
        title="Contents are called, not mounted"
        description={
          <>
            The children are <strong>called</strong> with the design box that was settled on —{" "}
            <Prop>{`{ width, height, scale }`}</Prop> — rather than mounted as a component. That keeps the contents a
            function of the live geometry instead of a new component type on every render, which is what makes the
            auto-shrink and the scaling reusable by anything.
          </>
        }
        previewClassName="p-0 overflow-hidden"
        code={`<FitBox designWidth={1200} designHeight={900}>
  {({ width, height, scale }) => (
    <div style={{ position: "absolute", inset: 0 }}>
      laid out in a {width}×{height} box, drawn at {scale.toFixed(2)}×
    </div>
  )}
</FitBox>`}
      >
        <div className="h-[360px] w-full">
          <FitBox designWidth={1200} designHeight={900}>
            {({ width, height, scale }) => (
              <div className="absolute inset-0 rounded-xl border border-gold/40 bg-white/[0.02]">
                <span className="absolute left-4 top-4 font-mono text-[11px] text-neutral-400">
                  {`${width}×${height} @ ${scale.toFixed(2)}×`}
                </span>
                <div className="absolute left-4 top-4 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded bg-gold/20" />
                <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/30" />
                <div className="absolute bottom-4 right-4 rounded bg-gold/20 px-3 py-2 font-mono text-[11px] text-neutral-200">
                  fixed coordinates, scaled
                </div>
              </div>
            )}
          </FitBox>
        </div>
      </Demo>

      <H2>useFitBox</H2>
      <P>
        <Prop>FitBox</Prop> is <Prop>useFitBox</Prop> plus a wrapper element. Reach for the hook directly when you need
        the design box without the element — e.g. to measure a container you already render, or to hand the geometry to
        something else. It returns a ref to attach and the <Prop>design</Prop> box; before the container is measured it
        reports the requested design size at a scale of 1.
      </P>
      <Demo
        title="The hook on its own"
        description="Resize the preview by resizing the window — the scale follows the container."
        previewClassName="p-0 overflow-hidden"
        code={`const { outerRef, design } = useFitBox({ designWidth: 1200, designHeight: 900 });

return <div ref={outerRef} className="h-[220px] w-full">{/* … */}</div>;`}
      >
        <UseFitBoxDemo />
      </Demo>

      <Api slug="fit-box" />
    </>
  );
}
