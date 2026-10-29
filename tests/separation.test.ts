// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import * as CORE from "../src/index";
import * as WAGER from "../src/wager";

/**
 * The layer guard.
 *
 * The package makes two claims and both are worth nothing unless something fails
 * when they stop being true:
 *
 * 1. **The core is game-free.** A card game with no betting must not pull a chip
 *    set into its bundle, and the API must not name a game.
 * 2. **The table types are shapes, not games.** `RoundTable` knows it is round
 *    and nothing else; `DealerTable` cannot draw a felt because it has none.
 *
 * These tests read the real module graph, the real export surfaces and the real
 * source, so both claims are enforced rather than described in a README.
 */

const SRC = fileURLToPath(new URL("../src", import.meta.url));
const DEMO = fileURLToPath(new URL("../demo/src", import.meta.url));

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** The module specifiers a file imports, exactly as written. */
function importsOf(file: string): string[] {
  const text = readFileSync(file, "utf8");
  const specifiers = [...text.matchAll(/\bfrom\s+["']([^"']+)["']/g)].map((m) => m[1]);
  for (const bare of text.matchAll(/^\s*import\s+["']([^"']+)["']/gm)) specifiers.push(bare[1]);
  return specifiers;
}

/** Source with comments removed, so a check is about code and not prose. */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const rel = (file: string) => file.slice(SRC.length + 1);
const inWager = (file: string) => rel(file).startsWith("wager/");
const inTables = (file: string) => rel(file).startsWith("tables/");

/* ------------------------------------------------------------- the entries -- */

describe("the two entry points", () => {
  const WAGER_ONLY = [
    "BB",
    "formatBB",
    "Chip",
    "ChipStack",
    "DEFAULT_DENOMINATIONS",
    "chipBreakdown",
    "chipCount",
    "chipSpotColor",
    "chipsTotal",
  ];

  it("keeps every chip, chip set and big blind out of the core entry", () => {
    const core = Object.keys(CORE);
    for (const name of WAGER_ONLY) {
      expect(core, `${name} is exported by the core entry`).not.toContain(name);
    }
    // `Pot` is the one old poker word left, as a deprecated alias of Counter.
    expect(core).toContain("Counter");
    expect(CORE.Pot).toBe(CORE.Counter);
  });

  it("offers the wagering pieces from `/wager` instead", () => {
    const wager = Object.keys(WAGER);
    for (const name of WAGER_ONLY) expect(wager, name).toContain(name);
    // and nothing from the core: the split has to cut both ways
    expect(wager).not.toContain("CardTable");
    expect(wager).not.toContain("PlayingCard");
  });

  it("names no game in the core entry", () => {
    // Not just "no PokerTable": no name in the package may be a game.
    const core = Object.keys(CORE);
    for (const game of ["PokerTable", "BigTwoTable", "BlackjackTable", "DragonGateTable", "Poker", "Blackjack"]) {
      expect(core, `${game} is a game, not a primitive`).not.toContain(game);
    }
    // the four table types are shapes
    for (const type of ["RoundTable", "SquareTable", "DealerTable", "TABLE_TYPES"]) {
      expect(core, type).toContain(type);
    }
  });
});

/* ------------------------------------------------------------ module graph -- */

describe("nothing reaches across a layer", () => {
  const files = sourceFiles(SRC);

  it("has nobody outside `src/wager` importing the wager", () => {
    for (const file of files.filter((f) => !inWager(f))) {
      for (const specifier of importsOf(file)) {
        expect(specifier, `${rel(file)} imports ${specifier}`).not.toMatch(/wager/);
      }
    }
  });

  it("has the table types built on the core, never the other way round", () => {
    const tables = files.filter(inTables);
    expect(tables.length).toBeGreaterThan(3);
    for (const file of tables) {
      for (const specifier of importsOf(file)) {
        if (specifier.startsWith(".")) continue;
        expect(specifier, `${rel(file)} imports ${specifier}`).toBe("react");
      }
    }
    // No core module may depend on a table type: the presets sit on top. The
    // entries are the exception — re-exporting is what an entry is for.
    const entries = ["index.ts", "wager/index.ts"];
    for (const file of files.filter((f) => !inTables(f) && !inWager(f) && !entries.includes(rel(f)))) {
      for (const specifier of importsOf(file)) {
        expect(specifier, `${rel(file)} imports ${specifier}`).not.toMatch(/tables/);
      }
    }
  });

  it("builds every worked example out of the published entries and React, nothing else", () => {
    // This is what makes the examples evidence: they see exactly what a consumer
    // sees, so if one of them needs something the public surface does not have,
    // it cannot quietly import it.
    const examples = sourceFiles(join(DEMO, "examples"));
    expect(examples.length).toBeGreaterThan(0);
    for (const file of examples) {
      for (const specifier of importsOf(file)) {
        const ok = ["react", "@stargazeryan/poker-ui", "@stargazeryan/poker-ui/wager"];
        expect(ok, `${file.replace(DEMO, "demo/src")} imports ${specifier}`).toContain(specifier);
      }
    }
  });
});

/* ---------------------------------------------------------------- the shape -- */

describe("a table type knows nothing but its shape", () => {
  /**
   * Prop names that only one game family has an opinion about. Allowed in
   * `src/wager` (chips are money); nowhere else, including the table types.
   */
  const GAME_PROPS =
    /^\s*(bets|renderBet|betRadiusScale|yourTurn|yourSeatIndex|winnerSeats|isYou|winnerCrown|communityCards|holeCards|pot|blinds|dealerUpCard|ante)\??:/m;

  it("declares no game-shaped prop anywhere in the core or the table types", () => {
    const core = sourceFiles(SRC).filter((f) => !inWager(f));
    expect(core.length).toBeGreaterThan(8);
    for (const file of core) {
      expect(readFileSync(file, "utf8"), `${rel(file)} declares one`).not.toMatch(GAME_PROPS);
    }
  });

  it("offers one way to render a seat and one way to render an overlay", () => {
    // `seats` / `hands` / `overlay` were the array-or-node forms of the render
    // functions, with less information, a precedence rule nobody knew and two
    // things to document. This fails if any of them grows back.
    const arrayOrNodeForm = /^\s*(seats|hands|overlay)\??:/m;
    for (const name of ["components/CardTable.tsx", "tables/DealerTable.tsx"]) {
      expect(readFileSync(join(SRC, name), "utf8"), `${name} declares one`).not.toMatch(arrayOrNodeForm);
    }
    // and the surviving spelling is a function that gets the geometry
    const table = readFileSync(join(SRC, "components", "CardTable.tsx"), "utf8");
    expect(table).toMatch(/renderSeat\?:\s*\(index: number, box: SeatBox\) => ReactNode/);
    expect(table).toMatch(/renderOverlay\?:\s*\(geometry: TableOverlayGeometry\) => ReactNode/);
  });

  it("knows nothing about betting in the geometry", () => {
    // 0.7.0's `LayoutOptions` carried `betRadiusScale` and a `Layout` carried
    // `betRx` / `betRy` / `boxes.bettingLine`, so the game leaked into the maths.
    for (const name of ["layout.ts", "surface.ts", "frames.ts"]) {
      const text = readFileSync(join(SRC, name), "utf8");
      expect(text, name).not.toMatch(/betRx|betRy|bettingLine|betRadiusScale|BET_SCALE/);
    }
  });

  it("has a dealer table with no table component in it at all", () => {
    // The acid test, checked against the source: if this file ever *uses*
    // `CardTable`, the table types are not general enough and this fails.
    // Comments are stripped first, because the file's own doc comment is allowed
    // to name the thing it is proving it does not need.
    const dealer = stripComments(readFileSync(join(SRC, "tables", "DealerTable.tsx"), "utf8"));
    expect(dealer).not.toMatch(/\bCardTable\b/);
    expect(dealer).toMatch(/\bFitBox\b/);
    expect(dealer).toMatch(/\browFrames\b/);
  });

  it("has round and square tables that only pin the surface down", () => {
    const round = stripComments(readFileSync(join(SRC, "tables", "RoundTable.tsx"), "utf8"));
    const square = stripComments(readFileSync(join(SRC, "tables", "SquareTable.tsx"), "utf8"));
    // Each preset sets exactly the knobs its name stands for, and adds nothing.
    expect(round).toMatch(/shape="ellipse"/);
    expect(round).toMatch(/seatPlacement="ring"/);
    expect(square).toMatch(/shape="rect"/);
    expect(square).toMatch(/seatPlacement="perimeter"/);
    for (const text of [round, square]) {
      expect(text).toMatch(/extends Omit<CardTableProps,/);
    }
  });
});
