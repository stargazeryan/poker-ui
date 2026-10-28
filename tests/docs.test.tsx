import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { App } from "../demo/src/App";
import { FIRST_SLUG, NAV } from "../demo/src/docs/registry";

/**
 * The docs site is the library's front door, and nothing else renders it: it has
 * no server-side test and, in this environment, no browser. This walks every
 * route and fails if a page throws, which is what a typo in an import or a bad
 * prop would otherwise do silently until deploy.
 */
const ALL_SLUGS = NAV.flatMap((group) => group.items.map((item) => item.slug));

const at = (slug: string) => {
  window.location.hash = `#/${slug}`;
  return render(<App />);
};

afterEach(() => {
  window.location.hash = "";
  cleanup();
});

describe("docs site", () => {
  it.each(ALL_SLUGS)("renders #/%s", (slug) => {
    const { container } = at(slug);
    expect(container.textContent?.length ?? 0).toBeGreaterThan(200);
    const h1 = screen.getAllByRole("heading", { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0].textContent?.trim().length ?? 0).toBeGreaterThan(0);
  });

  it("renders a live component on every component page", () => {
    for (const slug of ["card-table", "seat", "pot", "playing-card", "hole-cards", "community-cards"]) {
      const { container, unmount } = at(slug);
      // the demo previews are real DOM, not screenshots
      expect(container.querySelector(".doc-preview"), slug).not.toBeNull();
      unmount();
    }
  });

  it("falls back to the first page for an unknown route", () => {
    const { container } = at("definitely-not-a-page");
    expect(container.textContent).toContain("Getting started");
    expect(window.location.hash).toBe("#/definitely-not-a-page"); // the URL is left alone
  });

  it("starts on the first page with no hash at all", () => {
    window.location.hash = "";
    const { container } = render(<App />);
    expect(container.textContent).toContain("Getting started");
    expect(FIRST_SLUG).toBe("getting-started");
  });

  it("reveals the source of a demo on demand", () => {
    const { container } = at("card-table");
    expect(container.querySelector("pre")).toBeNull();
    const toggles = screen.getAllByText("show code");
    expect(toggles.length).toBeGreaterThan(0);
    fireEvent.click(toggles[0]);
    const pre = container.querySelector("pre");
    expect(pre).not.toBeNull();
    // prism actually highlighted it into spans
    expect(pre?.querySelectorAll("span").length ?? 0).toBeGreaterThan(5);
    expect(pre?.textContent).toContain("CardTable");
  });

  it("computes the published crowding numbers on the layout page", () => {
    const { container } = at("layout");
    // 10 seats at 160x176 -> 25.6px; 6 seats -> 161px. Rendered from the real helpers.
    expect(container.textContent).toContain("25.6px");
    expect(container.textContent).toContain("161.0px");
    expect(container.textContent).toContain("58%"); // iPhone portrait letterboxing
  });

  it("lists the known gaps honestly", () => {
    const { container } = at("known-gaps");
    expect(container.textContent).toContain("parseCard");
    expect(container.textContent).toContain("Reduced motion is per-component");
  });

  it("wires accounting of seats on the turn-order page", () => {
    const { container } = at("turn-order");
    const before = container.textContent;
    expect(before).toContain("next:");
    fireEvent.click(screen.getByText("nextSeatIndex →"));
    expect(container.textContent).not.toBe(before);
  });
});
