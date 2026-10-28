import { useState, type ReactNode } from "react";
import { Highlight, type PrismTheme } from "prism-react-renderer";
import { cn } from "@stargazeryan/poker-ui";
import type { ApiRow } from "./registry";

/* ------------------------------------------------------------------ code ---- */

const CODE_THEME: PrismTheme = {
  plain: { color: "#e7e5e4", backgroundColor: "transparent" },
  styles: [
    { types: ["comment", "prolog", "doctype", "cdata"], style: { color: "#6b7280", fontStyle: "italic" } },
    { types: ["string", "char", "attr-value"], style: { color: "#86efac" } },
    { types: ["keyword", "tag", "selector"], style: { color: "#f0c04a" } },
    { types: ["function", "method"], style: { color: "#7dd3fc" } },
    { types: ["attr-name", "property", "class-name"], style: { color: "#93c5fd" } },
    { types: ["number", "boolean", "constant", "symbol"], style: { color: "#fda4af" } },
    { types: ["punctuation", "operator"], style: { color: "#a8a29e" } },
  ],
};

export function CodeBlock({ code, className }: { code: string; className?: string }) {
  return (
    <Highlight theme={CODE_THEME} code={code.trim()} language="tsx">
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre
          className={cn(
            "doc-scroll overflow-x-auto rounded-lg border border-white/10 bg-[#0c100e] p-4 font-mono text-[12.5px] leading-relaxed",
            className,
          )}
        >
          <code>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </code>
        </pre>
      )}
    </Highlight>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(text).then(
          () => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          },
          () => setCopied(false),
        );
      }}
      className="rounded border border-white/10 px-2 py-1 text-[11px] text-neutral-400 transition hover:border-white/25 hover:text-neutral-200"
    >
      {copied ? "copied" : "copy"}
    </button>
  );
}

/* ------------------------------------------------------------------ demo ---- */

/**
 * A live demo with an optional "show code" panel — the shape every component
 * library docs site uses. The preview is rendered for real, not screenshotted.
 */
export function Demo({
  title,
  description,
  code,
  children,
  previewClassName,
  align = "center",
}: {
  title?: string;
  description?: ReactNode;
  code?: string;
  children: ReactNode;
  previewClassName?: string;
  align?: "center" | "start";
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-6 first:mt-0">
      {title && <h3 className="text-[15px] font-semibold text-neutral-100">{title}</h3>}
      {description && <div className="mt-1 text-sm leading-relaxed text-neutral-400">{description}</div>}

      <div
        className={cn(
          "doc-preview mt-3 rounded-xl border border-white/10",
          align === "center" ? "flex items-center justify-center" : "",
          previewClassName ?? "p-6",
        )}
      >
        {children}
      </div>

      {code && (
        <>
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="rounded border border-white/10 px-2 py-1 text-[11px] text-neutral-400 transition hover:border-white/25 hover:text-neutral-200"
            >
              {open ? "hide code" : "show code"}
            </button>
            <CopyButton text={code.trim()} />
          </div>
          {open && <CodeBlock code={code} className="mt-2" />}
        </>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------- api ---- */

export function ApiTable({ rows, caption }: { rows: ApiRow[]; caption?: string }) {
  return (
    <div className="mt-3">
      {caption && <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">{caption}</div>}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-2.5 font-semibold">Prop</th>
              <th className="px-4 py-2.5 font-semibold">Type</th>
              <th className="px-4 py-2.5 font-semibold">Default</th>
              <th className="px-4 py-2.5 font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name} className="border-t border-white/[0.06] align-top">
                <td className="px-4 py-3 font-mono text-[12.5px] whitespace-nowrap text-gold">{row.name}</td>
                <td className="px-4 py-3 font-mono text-[12px] whitespace-nowrap text-sky-300">{row.type}</td>
                <td className="px-4 py-3 font-mono text-[12px] whitespace-nowrap text-neutral-400">{row.default ?? "—"}</td>
                <td className="px-4 py-3 leading-relaxed text-neutral-300">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- chrome ---- */

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-12 mb-3 border-b border-white/[0.07] pb-2 text-lg font-semibold text-neutral-100 first:mt-0">{children}</h2>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-sm leading-relaxed text-neutral-300">{children}</p>;
}

export function Prop({ children }: { children: ReactNode }) {
  return <code className="rounded bg-white/[0.07] px-1.5 py-0.5 font-mono text-[12px] text-gold">{children}</code>;
}

export function Callout({ tone = "info", title, children }: { tone?: "info" | "warn"; title?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "mt-4 rounded-lg border-l-2 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed",
        tone === "warn" ? "border-l-amber-500/80 text-neutral-300" : "border-l-sky-500/70 text-neutral-300",
      )}
    >
      {title && <div className="mb-1 font-semibold text-neutral-100">{title}</div>}
      {children}
    </div>
  );
}

export function Btn({
  children,
  onClick,
  active,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded px-3 py-1.5 text-sm font-medium transition active:scale-95",
        active ? "bg-gold text-neutral-950" : "border border-neutral-600 text-neutral-200 hover:border-neutral-400",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Row({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-2", className)}>{children}</div>;
}

export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <span className="font-mono text-[11px] text-neutral-500">
      {label} <span className="text-neutral-300">{value}</span>
    </span>
  );
}

export function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Display only — `onChange` always reports the raw number. */
  format?: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-neutral-400">
      <span className="font-mono">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-32 accent-amber-400"
      />
      <span className="w-14 font-mono text-neutral-200">{format ? format(value) : value}</span>
    </label>
  );
}
