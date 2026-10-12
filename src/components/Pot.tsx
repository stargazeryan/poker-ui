import { useEffect, useRef, useState } from "react";
import { cn } from "../cn";
import { formatBB } from "../format";

export interface PotProps {
  amount: number;
  /** Optional label, e.g. "Main" / "Side". */
  label?: string;
  /** Formatter for the amount; defaults to Big-Blind formatting. */
  format?: (amount: number) => string;
  /** Animate the amount counting up when it changes. Default true. */
  animate?: boolean;
  className?: string;
}

/** Smoothly count a number toward its target (presentational only). */
function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    let raf = 0;
    const start = performance.now();
    const dur = 500;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{format(shown)}</>;
}

/** A small, standalone pot pill. Optional — the table does not require it. */
export function Pot({ amount, label, format = formatBB, animate = true, className }: PotProps) {
  return (
    <div className={cn("flex items-center gap-2 font-mono text-sm text-amber-400", className)}>
      {label && <span className="text-neutral-400">{label}</span>}
      <span className="whitespace-nowrap rounded-full border border-amber-400/50 bg-neutral-900/80 px-3 py-1 shadow-inner">
        {animate ? <CountUp value={amount} format={format} /> : format(amount)}
      </span>
    </div>
  );
}
