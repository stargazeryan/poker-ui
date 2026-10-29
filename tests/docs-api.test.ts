// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import * as CORE from "../src/index";
import * as WAGER from "../src/wager";
import { COMPONENTS, NAV } from "../demo/src/docs/registry";
import {
  CARD_TABLE_CONTROLS,
  CONTENT_PROPS,
  COLOUR_TOKENS,
  LAYOUT_OPTIONS,
  TOKENS,
  TUNABLES,
} from "../demo/src/docs/inventory";

/**
 * The README used to document behaviour the code did not have — a theming
 * section for tokens nothing referenced, an animation table listing effects that
 * never ran. Hand-written API tables rot the same way, so this reads the real
 * interfaces with the TypeScript compiler and refuses to let the two drift.
 */

const ROOT = fileURLToPath(new URL("../src", import.meta.url));
/** Every directory a `*Props` interface can live in, so a new one is never missed. */
const COMPONENT_DIRS = ["components", "tables", "wager"].map((d) => `${ROOT}/${d}`);

function componentFiles(): string[] {
  return COMPONENT_DIRS.flatMap((dir) =>
    readdirSync(dir)
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => `${dir}/${f}`),
  );
}

function propNamesOf(interfaceName: string): string[] {
  for (const file of componentFiles()) {
    const text = readFileSync(file, "utf8");
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let found: string[] | null = null;
    const visit = (node: ts.Node): void => {
      if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
        found = node.members
          .map((member) => (member.name && ts.isIdentifier(member.name) ? member.name.text : null))
          .filter((n): n is string => n !== null);
        return;
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    if (found) return found;
  }
  throw new Error(`interface ${interfaceName} not found in src/components, src/wager or src/recipes`);
}

function exportedPropInterfaces(): string[] {
  const names: string[] = [];
  for (const file of componentFiles()) {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/export interface (\w+Props)\b/g)) names.push(match[1]);
  }
  return names;
}

describe("docs API tables", () => {
  it.each(COMPONENTS.map((c) => [c.title, c] as const))("%s documents exactly its real props", (_title, doc) => {
    const real = propNamesOf(doc.interfaceName);
    const documented = [...doc.props, ...(doc.slots ?? [])].map((p) => p.name);

    expect(real.filter((n) => !documented.includes(n)), "in the code but not in the docs").toEqual([]);
    expect(documented.filter((n) => !real.includes(n)), "in the docs but not in the code").toEqual([]);
  });

  it("documents every component interface the package exports", () => {
    const documented = new Set(COMPONENTS.map((c) => c.interfaceName));
    const undocumented = exportedPropInterfaces().filter((name) => !documented.has(name));
    expect(undocumented, "a new component was added without a docs page").toEqual([]);
  });

  it.each(COMPONENTS.filter((c) => c.omitOf).map((c) => [c.title, c] as const))(
    "%s really does add no props of its own",
    (_title, doc) => {
      // For a preset: the docs say "these props are CardTable's, minus the shape
      // knobs it already decided". This reads the `extends Omit<…, keys>` clause
      // back and checks the keys are exactly the ones claimed — otherwise the
      // empty prop table would be a place for a real prop to hide.
      expect(doc.props, `${doc.title} claims to add nothing`).toEqual([]);
      const file = componentFiles().find((f) => readFileSync(f, "utf8").includes(`export interface ${doc.interfaceName}`));
      expect(file, `${doc.interfaceName} not found`).toBeTruthy();
      const text = readFileSync(file as string, "utf8");
      const pattern = new RegExp(
        `export interface ${doc.interfaceName} extends Omit<${doc.omitOf!.from},([^>]+)>`,
      );
      const match = pattern.exec(text);
      expect(match, `${doc.interfaceName} must narrow ${doc.omitOf!.from} with an Omit`).toBeTruthy();
      const keys = (match as RegExpExecArray)[1]
        .split("|")
        .map((k) => k.trim().replace(/^["']|["']$/g, ""))
        .sort();
      expect(keys).toEqual([...doc.omitOf!.keys].sort());
    },
  );

  it("documents every component on a real nav page", () => {
    // Every section, not just Components: how the nav is grouped is a display
    // decision, but a documented component has to be reachable from somewhere.
    const pageSlugs = NAV.flatMap((group) => group.items.map((item) => item.slug));

    for (const doc of COMPONENTS) {
      const page = doc.page ?? doc.slug;
      expect(pageSlugs, `${doc.title} is not on any nav page`).toContain(page);
    }
    // and every component page has to document something
    for (const slug of pageSlugs) {
      const documents = COMPONENTS.some((doc) => (doc.page ?? doc.slug) === slug);
      const isProseGuide = NAV.some(
        (group) => group.section !== "Components" && group.items.some((item) => item.slug === slug),
      );
      if (isProseGuide) continue;
      expect(documents, `nav page "${slug}" documents nothing`).toBe(true);
    }
  });

  it("never documents a prop twice on one page", () => {
    for (const doc of COMPONENTS) {
      const names = [...doc.props, ...(doc.slots ?? [])].map((p) => p.name);
      expect(new Set(names).size, `${doc.title} repeats a prop`).toBe(names.length);
    }
  });
});

/* --------------------------------------------------------------- the knobs -- */

/**
 * Props are not the only thing anyone tunes: theme tokens, `layoutTable`
 * options, the exported constants and — for the interactive demos — which prop
 * has a control. Those lists live in `demo/src/docs/inventory.ts`, and these
 * read the real source back so "the docs do not list every parameter" fails
 * here instead of being something a reader has to notice.
 */

function interfaceMembers(file: string, interfaceName: string): string[] {
  const text = readFileSync(`${ROOT}/${file}`, "utf8");
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let found: string[] | null = null;
  const visit = (node: ts.Node): void => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
      found = node.members
        .map((member) => (member.name && ts.isIdentifier(member.name) ? member.name.text : null))
        .filter((n): n is string => n !== null);
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!found) throw new Error(`interface ${interfaceName} not found in src/${file}`);
  return found;
}

/** The `@theme` block: name and value, as shipped. */
function themeTokens(): Array<{ name: string; value: string }> {
  const css = readFileSync(`${ROOT}/styles.css`, "utf8");
  const block = css.slice(css.indexOf("@theme"), css.indexOf("@keyframes"));
  const rows: Array<{ name: string; value: string }> = [];
  for (const line of block.split("\n")) {
    const match = /^\s*(--(?:color|animate)-[a-z0-9-]+):\s*([^;]+);/.exec(line);
    if (match) rows.push({ name: match[1], value: match[2].trim() });
  }
  return rows;
}

/** The named exports of one entry point, read off its source. */
function exportedNames(entry: string): string[] {
  const text = readFileSync(`${ROOT}/${entry}`, "utf8");
  const source = ts.createSourceFile(entry, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const names: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const element of node.exportClause.elements) {
        if (ts.isIdentifier(element.name)) names.push(element.name.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return names;
}

/** The two entry points, by the name a `TUNABLES` row uses for them. */
const ENTRY_FILES: Record<string, string> = {
  core: "index.ts",
  wager: "wager/index.ts",
};

const ENTRY_MODULES: Record<string, unknown> = { core: CORE, wager: WAGER };

describe("docs inventory", () => {
  it("documents every theme token, with the value that ships", () => {
    const real = themeTokens();
    expect(real.length).toBeGreaterThan(0);
    expect([...TOKENS.map((t) => t.name)].sort()).toEqual(real.map((t) => t.name).sort());
    for (const token of real) {
      expect(TOKENS.find((t) => t.name === token.name)?.value, `${token.name} value`).toBe(token.value);
    }
  });

  it("offers a picker for every colour token", () => {
    const colours = TOKENS.filter((t) => t.kind === "colour").map((t) => t.name);
    expect(COLOUR_TOKENS.map((t) => t.name)).toEqual(colours);
  });

  it("documents every layoutTable option", () => {
    expect([...LAYOUT_OPTIONS.map((r) => r.name)].sort()).toEqual(interfaceMembers("layout.ts", "LayoutOptions").sort());
  });

  it("gives every tunable CardTable prop a control in the playground", () => {
    const props = propNamesOf("CardTableProps");
    const tunable = props.filter((p) => !(CONTENT_PROPS as readonly string[]).includes(p));
    expect([...CARD_TABLE_CONTROLS.map((c) => c.prop)].sort()).toEqual([...tunable].sort());
    for (const control of CARD_TABLE_CONTROLS) {
      expect(props, `${control.prop} has a control but is not a CardTable prop`).toContain(control.prop);
    }
  });

  it("documents every tunable constant with the value the code has", () => {
    for (const row of TUNABLES) {
      const entry = row.entry ?? "core";
      const file = ENTRY_FILES[entry];
      expect(file, `${row.name} names an unknown entry "${entry}"`).toBeTruthy();
      expect(exportedNames(file), `${row.name} is not exported by src/${file}`).toContain(row.name);
      const actual = (ENTRY_MODULES[entry] as Record<string, unknown>)[row.name];
      const asString =
        typeof actual === "string" || typeof actual === "number" ? String(actual) : JSON.stringify(actual);
      expect(asString, `${row.name} drifted from the docs`).toBe(row.expect);
    }
  });

  it("keeps every documented constant off the entries it does not belong to", () => {
    // The other half of the layer guard: a doc row marked `wager` must not also
    // be reachable from the core entry, or the docs are lying about the split.
    for (const row of TUNABLES) {
      const entry = row.entry ?? "core";
      for (const [other, names] of Object.entries(ENTRY_FILES)) {
        if (other === entry) continue;
        expect(exportedNames(names), `${row.name} is an export of the ${other} entry too`).not.toContain(row.name);
      }
    }
    expect(exportedNames("index.ts")).not.toContain("PokerTable");
  });
});
