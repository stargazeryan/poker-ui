import { cn } from "../cn";
import { formatBB } from "../format";

export interface PotProps {
  amount: number;
  /** Optional label, e.g. "Main" / "Side". */
  label?: string;
  /** Formatter for the amount; defaults to Big-Blind formatting. */
  format?: (amount: number) => string;
  className?: string;
}

/** A small, standalone pot pill. Optional — the table does not require it. */
export function Pot({ amount, label, format = formatBB, className }: PotProps) {
  return (
    <div className={cn("flex items-center gap-2 font-mono text-sm text-amber-400", className)}>
      {label && <span className="text-neutral-400">{label}</span>}
      <span className="whitespace-nowrap rounded-full border border-amber-400/50 bg-neutral-900/80 px-3 py-1 shadow-inner">
        {format(amount)}
      </span>
    </div>
  );
}
