import { useEffect, useState, type ComponentType } from "react";
import { cn } from "@stargazeryan/poker-ui";
import { FIRST_SLUG, NAV } from "./docs/registry";
import { GettingStarted, KnownGaps, Theming } from "./docs/pages/guide";
import { GamesPage } from "./docs/pages/games";
import { DealerTablePage, RoundTablePage, SquareTablePage, TableTypesPage } from "./docs/pages/tables";
import {
  CardBackPage,
  CardRowPage,
  CardSlotPage,
  CardTablePage,
  ChipsPage,
  CounterPage,
  FitBoxPage,
  PlayingCardPage,
  SeatPage,
} from "./docs/pages/components";
import { LayoutPage, TurnOrderPage } from "./docs/pages/reference";

/** Every slug in `NAV`, plus nothing else — `useSlug` falls back to `FIRST_SLUG`. */
const PAGES: Record<string, ComponentType> = {
  "getting-started": GettingStarted,
  "table-types": TableTypesPage,
  games: GamesPage,
  theming: Theming,
  "known-gaps": KnownGaps,
  "card-table": CardTablePage,
  "round-table": RoundTablePage,
  "square-table": SquareTablePage,
  "dealer-table": DealerTablePage,
  "fit-box": FitBoxPage,
  seat: SeatPage,
  counter: CounterPage,
  "playing-card": PlayingCardPage,
  "card-back": CardBackPage,
  "card-row": CardRowPage,
  "card-slot": CardSlotPage,
  chips: ChipsPage,
  layout: LayoutPage,
  "turn-order": TurnOrderPage,
};

/** Hash routing: GitHub Pages serves static files, so this needs no rewrites. */
function useSlug(): string {
  const read = () => {
    const raw = window.location.hash.replace(/^#\/?/, "").trim();
    return raw && PAGES[raw] ? raw : FIRST_SLUG;
  };
  const [slug, setSlug] = useState(read);
  useEffect(() => {
    const onChange = () => setSlug(read());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return slug;
}

function NavList({ slug }: { slug: string }) {
  return (
    <nav className="flex flex-wrap gap-x-6 gap-y-4 lg:flex-col lg:gap-y-6">
      {NAV.map((group) => (
        <div key={group.section} className="lg:block">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{group.section}</div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 lg:flex-col lg:gap-y-0.5">
            {group.items.map((item) => {
              const active = item.slug === slug;
              return (
                <li key={item.slug}>
                  <a
                    href={`#/${item.slug}`}
                    className={cn(
                      "block rounded px-2 py-1 text-[13px] transition",
                      active
                        ? "bg-gold/15 font-medium text-gold"
                        : "text-neutral-400 hover:bg-white/[0.04] hover:text-neutral-100",
                    )}
                  >
                    {item.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function App() {
  const slug = useSlug();
  const Page = PAGES[slug] ?? GettingStarted;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  return (
    <div className="min-h-screen lg:flex">
      <aside className="border-b border-white/10 px-5 py-6 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:py-8">
        <a href={`#/${FIRST_SLUG}`} className="block">
          <div className="flex items-center gap-2">
            <span className="text-xl">♠</span>
            <span className="font-semibold tracking-tight text-neutral-100">Poker UI</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-neutral-500">@stargazeryan/poker-ui</div>
        </a>
        <div className="mt-6">
          <NavList slug={slug} />
        </div>
        <div className="mt-8 hidden lg:block">
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 font-mono text-[11px] leading-relaxed text-neutral-400">
            npm install
            <br />
            @stargazeryan/poker-ui
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-8 lg:px-12 lg:py-12">
        <div className="mx-auto max-w-3xl">
          <Page />
          <footer className="mt-16 border-t border-white/[0.07] pt-6 text-xs text-neutral-500">
            MIT © 2026 Ryan · built from the package's own{" "}
            <span className="font-mono">dist</span> on this deploy
          </footer>
        </div>
      </main>
    </div>
  );
}
