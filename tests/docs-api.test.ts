// @vitest-environment node
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { COMPONENTS, NAV } from "../demo/src/docs/registry";

/**
 * The README used to document behaviour the code did not have — a theming
 * section for tokens nothing referenced, an animation table listing effects that
 * never ran. Hand-written API tables rot the same way, so this reads the real
 * interfaces with the TypeScript compiler and refuses to let the two drift.
 */

const COMPONENT_DIR = fileURLToPath(new URL("../src/components", import.meta.url));

function propNamesOf(interfaceName: string): string[] {
  for (const file of readdirSync(COMPONENT_DIR).filter((f) => f.endsWith(".tsx"))) {
    const text = readFileSync(`${COMPONENT_DIR}/${file}`, "utf8");
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
  throw new Error(`interface ${interfaceName} not found in src/components`);
}

function exportedPropInterfaces(): string[] {
  const names: string[] = [];
  for (const file of readdirSync(COMPONENT_DIR).filter((f) => f.endsWith(".tsx"))) {
    const text = readFileSync(`${COMPONENT_DIR}/${file}`, "utf8");
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

  it("documents every component on a real nav page", () => {
    const componentsNav = NAV.find((group) => group.section === "Components");
    expect(componentsNav, "the nav must have a Components section").toBeTruthy();
    const pageSlugs = componentsNav!.items.map((item) => item.slug);

    // every component has to be reachable from a page someone can click to
    for (const doc of COMPONENTS) {
      const page = doc.page ?? doc.slug;
      expect(pageSlugs, `${doc.title} is not on any nav page`).toContain(page);
    }
    // and every component page has to document something
    for (const slug of pageSlugs) {
      expect(
        COMPONENTS.some((doc) => (doc.page ?? doc.slug) === slug),
        `nav page "${slug}" documents nothing`,
      ).toBe(true);
    }
  });

  it("never documents a prop twice on one page", () => {
    for (const doc of COMPONENTS) {
      const names = [...doc.props, ...(doc.slots ?? [])].map((p) => p.name);
      expect(new Set(names).size, `${doc.title} repeats a prop`).toBe(names.length);
    }
  });
});
