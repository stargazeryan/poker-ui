import { useState } from "react";
import {
  DEFAULT_FELT_GAP,
  DEFAULT_MARGIN_X,
  DEFAULT_MARGIN_Y,
  DESIGN_H,
  DESIGN_W,
  ellipsePoint,
  layoutSeats,
  minSeatSeparation,
  nextSeatIndex,
  ringPoints,
  seatAngle,
} from "@stargazeryan/poker-ui";
import { ApiTable, Btn, Field, H2, P, Prop, Row, Stepper } from "../ui";

/* ----------------------------------------------------------------- layout -- */

const CONTAINERS: Array<[number, number, string]> = [
  [390, 700, "iPhone portrait"],
  [768, 1024, "iPad portrait"],
  [1280, 600, "short laptop"],
  [1440, 900, "desktop 16:10"],
];

const LAYOUT_EXPORTS = [
  { name: "seatAngle(index, seatCount, startAngle?)", type: "number", description: "Ring angle of a seat, in degrees. Seat 0 sits at startAngle (default 90°, directly below the centre)." },
  { name: "ellipsePoint(cx, cy, rx, ry, angleDeg)", type: "Point", description: "Point on an ellipse at an angle. Screen coordinates, so 90° is below the centre." },
  { name: "ringPoints(count, cx, cy, rx, ry, startAngle?)", type: "Point[]", description: "`count` evenly spaced points on an ellipse — handy for any ring, not just seats." },
  { name: "layoutSeats(options)", type: "Layout", description: "The full seat layout for a design box: table radii, seat ring, the frame size after auto-shrink, and every seat centre." },
  { name: "minSeatSeparation(seats)", type: "number", description: "Smallest gap between any two seat frames. Negative means they overlap." },
  { name: "fitSeatScale(options)", type: "number", description: "The uniform scale the auto-shrink settles on for a given configuration." },
  { name: "tableRadii(dw, dh, marginX, marginY)", type: "{ rx, ry }", description: "Radii of the table ellipse for a design box and rail inset." },
  { name: "seatRingRadii(dw, dh, tableRx, tableRy, seatW, seatH, feltGap)", type: "{ rx, ry }", description: "Radii of the seat ring, clamped so frames stay inside the design box." },
  { name: "seatPoint(index, count, cx, cy, ringRx, ringRy, startAngle?)", type: "Point", description: "Centre of a seat on the ring." },
  { name: "SEAT_SHRINK_FLOOR", type: "0.5", description: "How far the auto-shrink will go before it gives up." },
];

function GeometryPlayground() {
  const [count, setCount] = useState(6);
  const [index, setIndex] = useState(0);
  const safeIndex = Math.min(index, count - 1);
  const angle = seatAngle(safeIndex, count);
  const pt = ringPoints(count, 300, 200, 120, 80)[safeIndex];
  const one = ellipsePoint(300, 200, 120, 80, angle);

  return (
    <div>
      <Row className="mb-4 justify-center">
        <Stepper label="seatCount" value={count} min={2} max={10} onChange={(v) => setCount(v)} />
        <Stepper label="index" value={safeIndex} min={0} max={count - 1} onChange={setIndex} />
      </Row>

      <div className="grid gap-4 sm:grid-cols-[200px_1fr] sm:items-center">
        <svg viewBox="0 0 600 400" className="w-full rounded-lg border border-white/10 bg-black/20">
          <ellipse cx="300" cy="200" rx="120" ry="80" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
          <line x1="300" y1="200" x2={one.x} y2={one.y} stroke="rgba(243,156,18,0.6)" strokeWidth="1.5" strokeDasharray="4 4" />
          {ringPoints(count, 300, 200, 120, 80).map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={i === safeIndex ? 9 : 6} fill={i === safeIndex ? "#f39c12" : "rgba(255,255,255,0.35)"} />
              <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontSize="9" fill={i === safeIndex ? "#1a1a2e" : "#0b0f0d"} fontWeight="700">
                {i}
              </text>
            </g>
          ))}
          <text x="300" y="204" textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.4)">
            centre
          </text>
        </svg>

        <div className="flex flex-col gap-1.5">
          <Field label="seatAngle(…)" value={angle.toFixed(0) + "°"} />
          <Field label="ellipsePoint(…)" value={`{ x: ${one.x.toFixed(0)}, y: ${one.y.toFixed(0)} }`} />
          <Field label="ringPoints(…)[i]" value={`{ x: ${pt.x.toFixed(0)}, y: ${pt.y.toFixed(0)} }`} />
          <Field label="θ formula" value={`90 + ${safeIndex}·360/${count}`} />
        </div>
      </div>
    </div>
  );
}

export function LayoutPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Layout &amp; geometry</h1>
      <P>
        The table, the seat ring and the betting line are one parametric ellipse, and the whole thing is laid out in a
        fixed <strong>design box</strong> that is then scaled to fit its container. Everything below is derived from
        that single formula:
      </P>
      <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-[#0c100e] p-4 font-mono text-[12.5px] leading-relaxed text-neutral-300">
{`x(θ) = cx + rx·cos θ      y(θ) = cy + ry·sin θ      θ = startAngle + i·(360/n)`}
      </pre>

      <H2>Play with it</H2>
      <GeometryPlayground />

      <H2>The design box</H2>
      <P>
        Default 1200×900, with the rail inset by <Prop>marginX</Prop> / <Prop>marginY</Prop> — expressed as{" "}
        <em>fractions</em> of the box (164/1200 and 196/900) so a custom box stays in proportion. Seat frames ride the
        ring at half a frame plus a few px beyond the rail, clamped so they are never clipped by the box.
      </P>
      <P>
        Because the box has a fixed aspect ratio, containers with a different one letterbox. That is what{" "}
        <Prop>fit=&quot;container&quot;</Prop> is for, and here is the cost of the default:
      </P>
      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-2.5">Container</th>
              <th className="px-4 py-2.5">Scale</th>
              <th className="px-4 py-2.5">Table drawn</th>
              <th className="px-4 py-2.5">Space wasted</th>
              <th className="px-4 py-2.5">Seat frame on screen</th>
            </tr>
          </thead>
          <tbody>
            {CONTAINERS.map(([w, h, label]) => {
              const scale = Math.min(w / DESIGN_W, h / DESIGN_H);
              const usedW = DESIGN_W * scale;
              const usedH = DESIGN_H * scale;
              const wasted = 1 - (usedW * usedH) / (w * h);
              return (
                <tr key={label} className="border-t border-white/[0.06]">
                  <td className="px-4 py-2.5 text-neutral-200">
                    {label} <span className="font-mono text-[11px] text-neutral-500">{w}×{h}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-neutral-300">{scale.toFixed(3)}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-neutral-300">
                    {usedW.toFixed(0)}×{usedH.toFixed(0)}
                  </td>
                  <td className={"px-4 py-3 font-mono text-[12px] " + (wasted > 0.4 ? "text-amber-400" : "text-neutral-300")}>
                    {(wasted * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-neutral-300">
                    {(160 * scale).toFixed(0)}×{(176 * scale).toFixed(0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <H2>Seat crowding</H2>
      <P>
        Measured on the layout helpers, with the default 160×176 frames. The seat count is not clamped: the ring
        shrinks frames until <Prop>seatGap</Prop> is honoured, which is what carries 11–16 seats. Past ~16 the frames
        reach the 50% floor and genuinely overlap, and this table says so rather than the component quietly rendering a
        different number of seats than you asked for.
      </P>
      <div className="mt-3 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-2.5">Seats</th>
              <th className="px-4 py-2.5">Closest gap</th>
              <th className="px-4 py-2.5">With seatGap=24</th>
              <th className="px-4 py-2.5">Frames</th>
            </tr>
          </thead>
          <tbody>
            {[2, 4, 6, 8, 10, 11, 12, 14, 16, 20].map((n) => {
              const opts = {
                count: n,
                designWidth: DESIGN_W,
                designHeight: DESIGN_H,
                marginX: DEFAULT_MARGIN_X,
                marginY: DEFAULT_MARGIN_Y,
                feltGap: DEFAULT_FELT_GAP,
                seatWidth: 160,
                seatHeight: 176,
                startAngle: 90,
              };
              const raw = minSeatSeparation(layoutSeats({ ...opts, seatGap: 0 }).seats);
              const fitted = layoutSeats({ ...opts, seatGap: 24 });
              const gap = minSeatSeparation(fitted.seats);
              return (
                <tr key={n} className="border-t border-white/[0.06]">
                  <td className="px-4 py-2.5 font-mono text-[12px] text-neutral-200">{n}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-neutral-300">{raw.toFixed(1)}px</td>
                  <td className={"px-4 py-3 font-mono text-[12px] " + (gap < 0 ? "text-amber-400" : "text-neutral-300")}>
                    {gap.toFixed(1)}px{gap < 0 ? " — overlapping" : ""}
                  </td>
                  <td className="px-4 py-3 font-mono text-[12px] text-neutral-300">
                    {fitted.seatW}×{fitted.seatH}
                    {fitted.seatW < 160 && <span className="ml-2 text-amber-400">shrunk</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <H2>Exports</H2>
      <ApiTable rows={LAYOUT_EXPORTS} />
    </>
  );
}

/* ------------------------------------------------------------- turn order -- */

export function TurnOrderPage() {
  const [count, setCount] = useState(6);
  const [current, setCurrent] = useState(0);
  const [folded, setFolded] = useState<number[]>([]);
  const [ccw, setCcw] = useState(false);

  const next = nextSeatIndex(current, count, {
    dir: ccw ? -1 : 1,
    skip: (i) => folded.includes(i),
  });
  const safeCurrent = current < count ? current : 0;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Turn order</h1>
      <P>
        Turn order is game logic, not UI. This library computes nothing about who acts next — you compute it in your own
        engine and pass the result into <Prop>Seat</Prop>&apos;s <Prop>isActive</Prop> and{" "}
        <Prop>CardTable</Prop>&apos;s <Prop>yourTurn</Prop>. One generic helper is provided for the mechanical part of
        walking the ring:
      </P>
      <pre className="mt-3 overflow-x-auto rounded-lg border border-white/10 bg-[#0c100e] p-4 font-mono text-[12.5px] leading-relaxed text-neutral-300">
{`nextSeatIndex(current, seatCount, {
  dir: 1,                        // +1 clockwise, -1 counter-clockwise
  skip: (i) => players[i].out,   // folded, sitting out, empty
})`}
      </pre>
      <Row className="mt-3">
        <Field label="wraps around" value="yes" />
        <Field label="returns current if every other seat is skipped" value="yes" />
        <Field label="tolerates NaN / negative seatCount" value="yes" />
      </Row>

      <H2>Try it</H2>
      <P>Click a seat to fold or unfold it, then step the action around the ring.</P>
      <div className="mt-4 flex flex-col items-center gap-4">
        <Row className="justify-center">
          <Stepper label="seats" value={count} min={2} max={10} onChange={(v) => { setCount(v); setFolded([]); setCurrent(0); }} />
          <Btn onClick={() => setCcw((v) => !v)} active={ccw}>
            dir={ccw ? "-1" : "+1"}
          </Btn>
        </Row>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: count }).map((_, i) => {
            const isFolded = folded.includes(i);
            return (
              <button
                key={i}
                type="button"
                onClick={() => setFolded((f) => (f.includes(i) ? f.filter((x) => x !== i) : [...f, i]))}
                className={
                  "h-14 w-14 rounded-lg border text-sm font-semibold transition " +
                  (i === safeCurrent
                    ? "border-gold bg-gold/20 text-gold"
                    : isFolded
                      ? "border-white/10 bg-white/[0.02] text-neutral-600 line-through"
                      : "border-white/20 text-neutral-200 hover:border-white/40")
                }
              >
                {i}
              </button>
            );
          })}
        </div>

        <Row className="justify-center">
          <Btn onClick={() => setCurrent(next)}>nextSeatIndex →</Btn>
          <Btn onClick={() => { setFolded([]); setCurrent(0); }}>reset</Btn>
        </Row>

        <Row className="justify-center">
          <Field label="current:" value={safeCurrent} />
          <Field label="folded:" value={folded.length ? `[${[...folded].sort((a, b) => a - b).join(", ")}]` : "[]"} />
          <Field label="next:" value={next} />
        </Row>
      </div>

      <H2>What it does not do</H2>
      <P>
        Heads-up preflop order, blinds, side pots, run-it-twice — none of that is here, and none of it should be. It
        walks a ring and skips what you tell it to skip.
      </P>
    </>
  );
}
