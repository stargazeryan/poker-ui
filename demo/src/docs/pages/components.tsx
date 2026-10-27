import { useState } from "react";
import {
  CardBack,
  CardTable,
  Chip,
  ChipStack,
  CommunityCards,
  DEFAULT_DENOMINATIONS,
  DEFAULT_FELT_GAP,
  DEFAULT_MARGIN_X,
  DEFAULT_MARGIN_Y,
  DESIGN_H,
  DESIGN_W,
  HoleCards,
  PlayingCard,
  Pot,
  Seat,
  chipBreakdown,
  chipCount,
  chipsTotal,
  formatBB,
  layoutSeats,
  minSeatSeparation,
  seatAngle,
  type Denomination,
} from "@stargazeryan/poker-ui";
import { ApiTable, Btn, Callout, Demo, Field, H2, Prop, Row, Stepper } from "../ui";
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
      {i % 2 === 0 ? <HoleCards cards={["As", "Kh"]} size="sm" /> : <HoleCards cards={[null, null]} size="sm" />}
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
        code={`const entries = chipBreakdown(487);
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
        code={`<ChipStack amount={60} size="sm" />
<ChipStack amount={60} size="md" />
<ChipStack amount={60} size="lg" />`}
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
          yourSeatIndex={0}
          renderSeat={(i, isYou, box) => (
            <Player i={i} isYou={isYou} width={box.width} height={box.height} active={i === 1} />
          )}
          center={<Pot label="Main" amount={487} />}
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
  betRadiusScale: 0.72,
  designWidth: DESIGN_W,
  designHeight: DESIGN_H,
  marginX: DEFAULT_MARGIN_X,
  marginY: DEFAULT_MARGIN_Y,
  feltGap: DEFAULT_FELT_GAP,
  ambient: true,
  yourTurn: true,
  winnerSeats: false,
  confetti: true,
  confettiColors: CONFETTI_PALETTES[0].label,
  fit: "design",
  yourSeatIndex: "0",
  className: false,
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
  const geo = layoutSeats({
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
    betRadiusScale: num("betRadiusScale"),
  });
  const gap = minSeatSeparation(geo.seats);
  const palette = CONFETTI_PALETTES.find((p) => p.label === v.confettiColors) ?? CONFETTI_PALETTES[0];
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
          betRadiusScale={num("betRadiusScale")}
          designWidth={num("designWidth")}
          designHeight={num("designHeight")}
          marginX={num("marginX")}
          marginY={num("marginY")}
          feltGap={num("feltGap")}
          ambient={bool("ambient")}
          yourTurn={bool("yourTurn")}
          winnerSeats={bool("winnerSeats") ? [0] : []}
          confetti={bool("confetti")}
          confettiColors={[...palette.colors]}
          fit={v.fit as "design" | "container"}
          yourSeatIndex={v.yourSeatIndex === "0" ? 0 : null}
          className={bool("className") ? "outline-dashed outline-1 outline-amber-400/60" : undefined}
          renderSeat={(i, isYou, box) => (
            <Seat
              width={box.width}
              height={box.height}
              isActive={i === 0 && bool("yourTurn")}
              isWinner={bool("winnerSeats") && i === 0}
              header={<span className="w-full text-center text-[11px] font-semibold">{isYou ? "you" : `seat ${i}`}</span>}
              footer={<span className="w-full text-center font-mono text-[10px] text-amber-300">{i * 20} BB</span>}
            >
              <HoleCards cards={["As", "Kh"]} size="xs" />
            </Seat>
          )}
          renderBet={(i) => (i === 1 ? <ChipStack amount={60} size="sm" /> : i === 3 ? <ChipStack amount={25} size="sm" /> : null)}
          center={
            <div className="flex flex-col items-center gap-2">
              <CommunityCards cards={["Ah", "Kd", "7c"]} size="md" />
              <Pot label="Main" amount={487} format={formatBB} />
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
  center={<Pot label="Main" amount={487} />}
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
              yourSeatIndex={0}
              renderSeat={(i, isYou, box) => <Player i={i} isYou={isYou} width={box.width} height={box.height} />}
              center={<Pot label="Main" amount={487} />}
            />
          </div>
        </div>
      </Demo>

      <Demo
        title="The bets layer"
        description={<><Prop>bets</Prop> or <Prop>renderBet</Prop> places content on the betting line, auto-positioned toward the middle of the table. The drawn line follows <Prop>betRadiusScale</Prop> — they cannot drift apart.</>}
        previewClassName="p-0 overflow-hidden"
        code={`<CardTable
  renderBet={(i) => (bets[i] ? <ChipStack amount={bets[i]} size="sm" /> : null)}
  betRadiusScale={0.72}
/>`}
      >
        <div className="h-[400px] w-full">
          <CardTable
            seatCount={6}
            yourSeatIndex={0}
            renderSeat={(i, isYou, box) => <Player i={i} isYou={isYou} width={box.width} height={box.height} />}
            renderBet={(i) =>
              CHIP_BETS[i] ? <ChipStack amount={CHIP_BETS[i]} size="sm" /> : null
            }
            center={<Pot label="Main" amount={487} />}
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
              center={<Pot label="Main" amount={487} />}
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
            <Prop>renderSeat</Prop> receives the size it settled on. The same mechanism is why 11–16 seats work at all;
            past ~16 the frames sit on the shrink floor and overlap.
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

      <Demo
        title="Every parameter"
        description={
          <>
            Every tunable <Prop>CardTable</Prop> prop, live: the design box, the rail and felt insets, the frame size,
            the auto-shrink, the betting ring, seat 0&apos;s angle, the viewer, the decorations. The readout under the
            controls comes from <Prop>layoutSeats</Prop> — the same call the component makes.
          </>
        }
        previewClassName="p-0 overflow-hidden"
        align="start"
        code={`<CardTable
  seatCount={6} startAngle={90}            // ring
  seatWidth={160} seatHeight={176}         // preferred frame
  seatGap={24} betRadiusScale={0.72}       // clearance, betting line
  designWidth={1200} designHeight={900}    // the design box
  marginX={164 / 1200} marginY={196 / 900} // rail inset
  feltGap={11}                             // felt inset
  fit="design"                             // or "container"
  ambient yourTurn confetti                // decorations
  confettiColors={["#f39c12", "…"]}
  yourSeatIndex={0}
/>`}
      >
        <CardTablePlayground />
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
        description={`Click fast — the counter keeps easing toward the new target without ever jumping backwards. The default rendering is the plain number ${amount.toLocaleString()}: no unit is invented, because the library does not know what your numbers mean.`}
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
        description={
          <>
            The default is a plain number. Pass <Prop>format</Prop> for anything else — including{" "}
            <Prop>formatBB</Prop>, which takes the big blind as an argument because 20 is rarely the right
            one for your table.
          </>
        }
        code={`<Pot amount={1234} format={(n) => "$" + n.toLocaleString()} />
<Pot amount={1234} format={formatBB} />                 // 61.7 BB
<Pot amount={1234} format={(n) => formatBB(n, 100)} />  // 12.3 BB`}
      >
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Pot amount={1234} format={(n) => "$" + n.toLocaleString()} />
          <Pot amount={1234} format={formatBB} />
          <Pot amount={1234} format={(n) => formatBB(n, 100)} />
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
