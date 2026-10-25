import { useEffect, useRef, useState } from "react";
import { cn } from "../cn";

/**
 * The default rendering of an amount: the number, grouped by the locale, with no
 * unit attached.
 *
 * This library does not know whether your numbers are chips, dollars, big blinds
 * or points, so it does not invent a unit. `formatBB` is available as an opt-in
 * poker helper — `<Pot amount={n} format={(v) => formatBB(v, 100)} />`.
 */
const defaultFormat = (amount: number): string => amount.toLocaleString();

export interface PotProps {
  amount: number;
  /** Optional label, e.g. "Main" / "Side". */
  label?: string;
  /**
   * Formatter for the amount. Defaults to a plain, locale-grouped number —
   * pass one if your amounts have a unit.
   */
  format?: (amount: number) => string;
  /** Animate the amount counting up when it changes. Default true. */
  animate?: boolean;
  className?: string;
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
    let raf = 0;
    const dur = 500;
    // Time the animation off the rAF timestamps themselves and never against
    // `performance.now()`: that is a second clock with a different origin, and
    // its skew against the rAF clock is unbounded. Mixing them made `t`
    // negative, which pushed `eased` outside [0, 1] and sent the counter off
    // backwards (reproducibly to -15698 in jsdom, where the two clocks start
    // ~390ms apart).
    let origin: number | null = null;
    const tick = (now: number) => {
      if (origin === null) origin = now;
      const t = Math.min(1, Math.max(0, (now - origin) / dur));
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (to - from) * eased);
      shownRef.current = next;
      setShown(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{format(shown)}</>;
}

/** A small, standalone pot pill. Optional — the table does not require it. */
export function Pot({ amount, label, format = defaultFormat, animate = true, className }: PotProps) {
  return (
    <div className={cn("flex items-center gap-2 font-mono text-sm text-gold", className)}>
      {label && <span className="text-neutral-400">{label}</span>}
      <span className="whitespace-nowrap rounded-full border border-gold/50 bg-neutral-900/80 px-3 py-1 shadow-inner">
        {animate ? <CountUp value={amount} format={format} /> : format(amount)}
      </span>
    </div>
  );
}
