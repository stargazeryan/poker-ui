import { useEffect, useRef, useState } from "react";
import { cn } from "../cn";
import { MIN_TEXT_PX, readableScale, useDesignScale } from "../designScale";
import { COUNT_UP_MS } from "../motion";

/** The size `Counter` draws at — `text-sm`, and what the text floor is measured against. */
const COUNTER_TEXT_PX = 14;

/**
 * The default rendering of an amount: the number, grouped by the locale, with no
 * unit attached.
 *
 * The mechanism is "show a number, optionally animate it counting to a new
 * value". This library does not know whether your numbers are chips, dollars,
 * big blinds points or lives, so it does not invent a unit — pass `format`.
 */
const defaultFormat = (amount: number): string => amount.toLocaleString();

/** Whether the user has asked for less motion. Guarded: jsdom and SSR have no matchMedia. */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export interface CounterProps {
  amount: number;
  /** Optional label, e.g. "Main" / "Side" / "Bank" — whatever your game calls it. */
  label?: string;
  /**
   * Formatter for the amount. Defaults to a plain, locale-grouped number —
   * pass one if your amounts have a unit.
   */
  format?: (amount: number) => string;
  /** Animate the amount counting up when it changes. Default true. */
  animate?: boolean;
  /**
   * The smallest px this counter may be drawn at on screen. A counter inside a
   * table is inside a scaled design box, where 14px becomes 8.4px in a 725px
   * container and 3.9px on a phone; the amount and its label are compensated back
   * up to this floor, never by more than `MAX_TEXT_SCALE`. Default `MIN_TEXT_PX`
   * (10); `0` switches it off.
   */
  minTextPx?: number;
  className?: string;
}

/*
 * One animation loop for every counter on the page.
 *
 * Each `Counter` used to own its loop, so a settlement animating nine seat
 * stacks ran nine frame callbacks, nine updates per frame and nine render
 * passes. A handler now subscribes to a shared loop and returns `false` when it
 * is done, and the loop stops when the last one has: the ninth counter costs a
 * little arithmetic, not a frame rate.
 */
type CounterFrame = (now: number) => boolean;

const frames = new Set<CounterFrame>();
let handle = 0;

function pump(now: number) {
  // A handler can unsubscribe itself (or another) mid-frame, so iterate a copy.
  for (const frame of [...frames]) {
    if (!frame(now)) frames.delete(frame);
  }
  // The old handle stays non-zero across the pass on purpose: a counter that
  // subscribes during one does not start a second loop here.
  handle = frames.size > 0 ? requestAnimationFrame(pump) : 0;
}

/** Run `frame` on every animation frame until it returns `false`. */
function onFrame(frame: CounterFrame): () => void {
  // "Is the loop running?" is asked of the *subscribers*, not of `handle`. A
  // handle can outlive its callback — a counter that unmounts mid-count, a
  // backgrounded tab whose frames are dropped, a test that swaps rAF out — and
  // a loop that never arrives must not leave the next counter thinking one is
  // already on its way.
  const idle = frames.size === 0;
  frames.add(frame);
  if (idle) {
    if (handle !== 0) cancelAnimationFrame(handle);
    handle = requestAnimationFrame(pump);
  }
  return () => {
    frames.delete(frame);
  };
}

/** Smoothly count a number toward its target (presentational only). */
function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  // Mirrors `shown`, so an interrupted animation resumes from wherever the
  // number actually is instead of from the value it started at.
  const shownRef = useRef(value);

  useEffect(() => {
    const from = shownRef.current;
    const to = value;
    if (from === to) return;
    // The media query in styles.css cannot reach a rAF loop, so the JS animation
    // has to check for itself. Jump straight to the value instead.
    if (prefersReducedMotion()) {
      shownRef.current = to;
      setShown(to);
      return;
    }
    // Time the animation off the loop's own timestamps and never against
    // `performance.now()`: that is a second clock with a different origin, and
    // its skew against the rAF clock is unbounded. Mixing them made `t`
    // negative, which pushed `eased` outside [0, 1] and sent the counter off
    // backwards (reproducibly to -15698 in jsdom, where the two clocks start
    // ~390ms apart).
    let origin: number | null = null;
    return onFrame((now) => {
      if (origin === null) origin = now;
      const t = Math.min(1, Math.max(0, (now - origin) / COUNT_UP_MS));
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (to - from) * eased);
      // A frame that rounds to the number already on screen is not a change,
      // and setting it would be a render for nothing.
      if (next !== shownRef.current) {
        shownRef.current = next;
        setShown(next);
      }
      return t < 1;
    });
  }, [value]);

  return <>{format(shown)}</>;
}

/**
 * A labelled, optionally counting amount. Standalone and optional — no table
 * requires it, and it attaches no unit.
 *
 * The count-up is a *presentational* effect: it passes through every
 * intermediate value on the way to the target, and those are not values anybody
 * wants read out. So the animated number is `aria-hidden`, and the settled
 * amount is written once beside it — a screen reader gets "240", not sixty
 * frames of "173", "198", "219"…. `data-counter-value` marks the animated half,
 * which is the one the tests measure.
 */
export function Counter({
  amount,
  label,
  format = defaultFormat,
  animate = true,
  minTextPx = MIN_TEXT_PX,
  className,
}: CounterProps) {
  const settled = format(amount);
  const textScale = readableScale(useDesignScale(), COUNTER_TEXT_PX, minTextPx);
  return (
    <div
      className={cn("flex items-center gap-2 font-mono text-sm text-gold", className)}
      style={textScale === 1 ? undefined : { transform: `scale(${textScale})`, transformOrigin: "center" }}
    >
      {label && <span className="text-muted">{label}</span>}
      <span className="whitespace-nowrap rounded-full border border-gold/50 bg-surface/80 px-3 py-1 shadow-inner">
        <span aria-hidden="true" data-counter-value>
          {animate ? <CountUp value={amount} format={format} /> : settled}
        </span>
        {/*
         * The settled amount is written once beside the animated one, so a screen
         * reader gets "240" instead of sixty frames of 173, 198, 219. It is a live
         * region now: the count-up used to be silent, because a changed span that
         * no live region covers is not announced.
         */}
        <span className="sr-only" aria-live="polite">
          {label ? `${label}: ${settled}` : settled}
        </span>
      </span>
    </div>
  );
}
