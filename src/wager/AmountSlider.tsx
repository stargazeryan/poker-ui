import { useId } from "react";
import { cn } from "../cn";

/**
 * What an amount reads as when no formatter is given: the number, grouped by the
 * locale, with no unit attached — the same default `Counter` has, because
 * neither knows whether the numbers are chips, dollars or big blinds.
 */
const formatAmount = (amount: number): string => amount.toLocaleString();

/** A button beside the slider that jumps the amount somewhere. */
export interface QuickAmount {
  /** What the button says — `"1/2"`, `"pot"`, `"min"`. */
  label: string;
  /** Where it jumps to, in the same units as `value`. */
  value: number;
}

export interface AmountSliderProps {
  /** The amount being chosen, in chip units. */
  value: number;
  /** Called with the new amount on every change, and from every quick button. */
  onChange: (value: number) => void;
  /** The top of the range. */
  max: number;
  /** The bottom of the range. Default `0`. */
  min?: number;
  /** Granularity. The browser's default (`1`) unless you say otherwise. */
  step?: number;
  /** Formats the readout, the `aria-valuetext` and nothing else. Default: plain, locale-grouped. */
  format?: (amount: number) => string;
  /**
   * Buttons that jump the amount — half the pot, the pot, the minimum raise. The
   * **values** are yours: this control does not know what half of anything is,
   * which is why it takes `{ label, value }` pairs rather than a rule.
   */
  quick?: QuickAmount[];
  /** Names the control. Default `"amount"`. */
  label?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * A labelled slider for choosing an amount, with optional quick-set buttons.
 *
 * The library's only control, and it is here because every betting client writes
 * it and every one of them wrote it out of a bare `<input type="range">` — the
 * docs' own chip examples did. What it adds over that is the part that is easy to
 * get wrong: a formatted readout, the formatted text as the slider's
 * `aria-valuetext` (so a screen reader says "twelve big blinds", not "12"), a real
 * `<label>`, clamping, and quick buttons that are buttons.
 *
 * It knows nothing about betting: `max` is a number you worked out, `quick` is a
 * list you worked out, and a game with no betting has no reason to import it.
 *
 * ```tsx
 * <AmountSlider
 *   value={bet}
 *   onChange={setBet}
 *   min={bigBlind}
 *   max={stack}
 *   step={bigBlind / 2}
 *   format={formatBB}
 *   quick={[{ label: "1/2", value: Math.round(pot / 2) }, { label: "pot", value: pot }]}
 * />
 * ```
 */
export function AmountSlider({
  value,
  onChange,
  max,
  min = 0,
  step,
  format = formatAmount,
  quick,
  label = "amount",
  disabled = false,
  className,
}: AmountSliderProps) {
  const id = useId();
  // A range whose max is at or below its min is a range the browser draws wrong
  // and steps through forever; one step past the floor is a usable degenerate.
  const lo = Number.isFinite(min) ? min : 0;
  const hi = Number.isFinite(max) && max > lo ? max : lo + 1;
  const clamp = (amount: number) => Math.min(hi, Math.max(lo, Number.isFinite(amount) ? amount : lo));
  const at = clamp(value);
  const shown = format(at);

  return (
    <div className={cn("flex w-full max-w-sm flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-xs text-muted">
          {label}
        </label>
        <output
          htmlFor={id}
          className="rounded-full border border-gold/50 bg-surface/80 px-2.5 py-0.5 font-mono text-sm text-gold"
        >
          {shown}
        </output>
      </div>

      <input
        id={id}
        type="range"
        min={lo}
        max={hi}
        step={step}
        value={at}
        disabled={disabled}
        // The slider's own value is a bare number; this is what it gets read out as.
        aria-valuetext={shown}
        onChange={(event) => onChange(clamp(Number(event.target.value)))}
        className="h-6 w-full cursor-pointer accent-gold transition disabled:cursor-not-allowed disabled:opacity-50"
      />

      {quick !== undefined && quick.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {quick.map((option) => {
            const target = clamp(option.value);
            const current = target === at;
            return (
              <button
                key={option.label}
                type="button"
                disabled={disabled}
                onClick={() => onChange(target)}
                className={cn(
                  "rounded-full border px-2.5 py-1 font-mono text-[11px] transition disabled:cursor-not-allowed disabled:opacity-50",
                  current
                    ? "border-gold bg-gold/15 text-gold"
                    : "border-surface-border text-muted hover:border-gold/60 hover:text-surface-ink",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
