import { useState } from "react";
import { CardRow, Marker, Seat, TurnTimer } from "@stargazeryan/poker-ui";
import { AmountSlider, formatBB } from "@stargazeryan/poker-ui/wager";
import { Api, Sec } from "./components";
import { Btn, Callout, Demo, Field, P, Prop, Row, Stepper } from "../ui";
import { SAMPLE } from "../../examples/parts";

/*
 * The three pages for the pieces that are not a table, a seat or a card: a
 * countdown, a disc, and the one control.
 *
 * They live in their own file rather than in `components.tsx` because that file
 * is already 1,300 lines and this is the natural seam: everything here is
 * optional furniture a caller reaches for, not part of the table's own anatomy.
 */

/* ------------------------------------------------------------- TurnTimer -- */

export function TurnTimerPage() {
  const [left, setLeft] = useState(62);
  const remaining = left / 100;
  const seconds = Math.ceil(remaining * 20);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">TurnTimer</h1>
      <Sec slug="turn-timer" />

      <Demo
        title="One ring, one number"
        description={
          <>
            It is handed <Prop>remaining</Prop>, <Prop>1</Prop> to <Prop>0</Prop>, and draws it — it animates
            nothing and schedules nothing, so the clock stays in your engine. <Prop>tone</Prop> is how you say
            &quot;nearly out&quot;.
          </>
        }
        code={`<TurnTimer remaining={0.62} label="12" />\n<TurnTimer remaining={0.62} size="lg" tone="warning" label="12" />`}
      >
        <div className="flex flex-wrap items-end justify-center gap-8">
          <TurnTimer remaining={remaining} label={seconds} />
          <TurnTimer remaining={remaining} size="lg" label={seconds} />
          <TurnTimer remaining={remaining} size="lg" tone="warning" label={seconds} />
          <TurnTimer remaining={remaining} size="lg" tone="muted" label="—" />
        </div>
      </Demo>
      <Row className="mt-3 justify-center">
        <Stepper label="remaining %" value={left} min={0} max={100} onChange={setLeft} />
      </Row>

      <Demo
        title="On a seat"
        description={
          <>
            <Prop>below</Prop> reads as a countdown badge under the frame; <Prop>above</Prop> as one over it. A
            number in px is taken as px, so a timer can be cut to the size the table laid the seat out for —{" "}
            <Prop>box.width</Prop>.
          </>
        }
        code={`<Seat below={<TurnTimer remaining={0.6} size="sm" label={12} />} />\n<Seat above={<TurnTimer remaining={0.6} size={24} stroke={3} />} />`}
      >
        <div className="flex flex-wrap items-start justify-center gap-10">
          <Seat
            isActive
            width={160}
            height={176}
            above={<TurnTimer remaining={remaining} size={24} stroke={3} tone={remaining < 0.25 ? "warning" : "gold"} title="time left" />}
            header={<span className="w-full text-center font-semibold">Your turn</span>}
            footer={<span className="w-full text-center font-mono text-gold-light">{formatBB(SAMPLE.stacks[0], 20)}</span>}
          />
          <Seat
            width={160}
            height={176}
            below={<TurnTimer remaining={remaining} size="sm" label={seconds} />}
            header={<span className="w-full text-center font-semibold">Seat 2</span>}
            footer={<span className="w-full text-center font-mono text-gold-light">{formatBB(SAMPLE.stacks[2], 20)}</span>}
          />
          <Seat
            width={160}
            height={176}
            below={<TurnTimer remaining={remaining} size={56} stroke={5} label={seconds} tone="muted" />}
            header={<span className="w-full text-center font-semibold">Seat 3</span>}
            footer={<span className="w-full text-center font-mono text-gold-light">{formatBB(SAMPLE.stacks[3], 20)}</span>}
          />
        </div>
      </Demo>

      <Callout tone="warn" title="Not the overlay slot.">
        <Prop>overlay</Prop> is centred on the frame and painted <em>over</em> the seat&apos;s own content, so a ring
        there crosses the cards, crosses the name, and prints its label on the card faces. This page used to show
        exactly that, as the way to do it — it is the way <em>not</em> to. Use <Prop>below</Prop>, or{" "}
        <Prop>above</Prop> for one over the frame.
      </Callout>

      <Callout tone="warn" title="And not on the edge.">
        Every slot that overhangs the frame — <Prop>topLeft</Prop>, <Prop>topRight</Prop>, <Prop>topCenter</Prop> —
        overhangs by a fraction of the frame&apos;s height, 8px on a 176px seat, so anything taller than that
        straddles the border. That is exactly right for a <Prop>Marker</Prop>, which should look pinned to the seat.
        It is exactly wrong for a ring: a ring is read from its silhouette, so a border crossing it cuts the thing you
        are looking at — checked at 6x, an arc on a corner reads as a blob with a bite out of it, its dark track
        notching the border and its gold stroke merging into an active seat&apos;s gold frame. Keep the silhouette
        whole: <Prop>above</Prop>, <Prop>below</Prop>, or the frame&apos;s own interior.
      </Callout>

      <P>
        A screen reader gets it as a <Prop>progressbar</Prop> with{" "}
        <Prop>aria-valuenow</Prop>, so the value can be read on demand. It is deliberately not a live region: a ring
        that ticks once a second would interrupt whatever is being read out. Announce the number yourself if you want
        it announced.
      </P>

      <Api slug="turn-timer" />
    </>
  );
}

/* ---------------------------------------------------------------- Marker -- */

export function MarkerPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Marker</h1>
      <Sec slug="marker" />

      <Demo
        title="Sizes and tones"
        description={
          <>
            A disc that sits on a position. Round on purpose — a square one reads as another badge and competes with
            the frame&apos;s own border, while a disc reads as an object lying on the table, like a chip.
          </>
        }
        code={`<Marker>D</Marker>\n<Marker size="lg" tone="dark">1</Marker>`}
      >
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-end gap-8">
            {(["sm", "md", "lg"] as const).map((size) => (
              <Marker key={size} size={size}>
                D
              </Marker>
            ))}
          </div>
          <div className="flex items-end gap-8">
            <Marker size="lg" tone="gold">
              D
            </Marker>
            <Marker size="lg" tone="dark">
              1
            </Marker>
            <Marker size="lg" tone="felt">
              ♠
            </Marker>
          </div>
        </div>
      </Demo>

      <Demo
        title="On a seat"
        description={
          <>
            <Prop>topCenter</Prop> is where a dealer button goes, <Prop>topLeft</Prop> a rank. The docs used to pass a{" "}
            <Prop>👑</Prop> through a slot to make the point that a decoration is not a state; this is that
            decoration, with a name a screen reader can read.
          </>
        }
        code={`<Seat topCenter={<Marker>D</Marker>} />\n<Seat isWinner topLeft={<Marker size="sm" tone="dark">1</Marker>} />`}
      >
        <div className="flex flex-wrap items-start justify-center gap-12">
          <Seat
            width={160}
            height={176}
            topCenter={<Marker>D</Marker>}
            header={<span className="w-full text-center font-semibold">Seat 0</span>}
            footer={<span className="w-full text-center font-mono text-gold-light">{formatBB(SAMPLE.stacks[0], 20)}</span>}
          />
          <Seat
            isWinner
            width={160}
            height={176}
            topLeft={
              <Marker size="sm" tone="dark">
                3
              </Marker>
            }
            header={<span className="w-full text-center font-semibold">Seat 3</span>}
            footer={<span className="w-full text-center font-mono text-gold-light">{formatBB(SAMPLE.stacks[3], 20)}</span>}
          >
            <CardRow cards={["Ah", "Ad"]} size="sm" animation={false} />
          </Seat>
        </div>
      </Demo>

      <Api slug="marker" />
    </>
  );
}

/* ---------------------------------------------------------- AmountSlider -- */

export function AmountSliderPage() {
  const [bet, setBet] = useState(300);
  const [bigBlinds, setBigBlinds] = useState(true);
  const format = bigBlinds ? (n: number) => formatBB(n, 20) : undefined;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">AmountSlider</h1>
      <Sec slug="amount-slider" />

      <Demo
        title="An amount, and some shortcuts"
        description={
          <>
            The library&apos;s only control, and it is here because this is what the chip examples had been writing out
            of a bare <Prop>input type=&quot;range&quot;</Prop>. What it adds is the part that is easy to get wrong: a
            real <Prop>label</Prop>, the formatted amount as the slider&apos;s <Prop>aria-valuetext</Prop> — so it is
            read out as <Prop>&quot;15 BB&quot;</Prop>, not <Prop>300</Prop> — and quick buttons that are buttons.
          </>
        }
        code={`<AmountSlider
  value={bet}
  onChange={setBet}
  min={20}
  max={1000}
  step={10}
  format={formatBB}
  quick={[{ label: "1/2", value: 500 }, { label: "pot", value: 1000 }]}
/>`}
      >
        <div className="flex flex-col items-center gap-4">
          <AmountSlider
            value={bet}
            onChange={setBet}
            min={20}
            max={1000}
            step={10}
            format={format}
            label={bigBlinds ? "your bet, in big blinds" : "your bet"}
            quick={[
              { label: "min", value: 20 },
              { label: "1/2", value: 500 },
              { label: "pot", value: 1000 },
            ]}
          />
          <Field label="value:" value={bet} />
          <Btn onClick={() => setBigBlinds((v) => !v)} active={bigBlinds}>
            in big blinds
          </Btn>
        </div>
      </Demo>

      <P>
        It knows nothing about betting. <Prop>max</Prop> is a number you worked out and <Prop>quick</Prop> is a list of{" "}
        <Prop>{`{ label, value }`}</Prop> pairs you worked out, so half the pot is your arithmetic and not this
        component&apos;s — which is why a game with no betting never imports it. A <Prop>max</Prop> at or below{" "}
        <Prop>min</Prop> is repaired to one step past it rather than left to the browser.
      </P>

      <Api slug="amount-slider" />
    </>
  );
}
