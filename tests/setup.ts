import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

/*
 * This setup file is shared by jsdom tests and by the node-environment ones
 * (tests/docs-api.test.ts reads the sources off disk), so anything touching the
 * DOM has to be behind a guard.
 */
const hasDom = typeof window !== "undefined" && typeof HTMLElement !== "undefined";

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (hasDom) {
  // jsdom has no ResizeObserver, which CardTable uses to measure its container.
  if (!("ResizeObserver" in globalThis)) {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = ResizeObserverStub;
  }
  // jsdom logs "Not implemented: window.scrollTo" for the docs app's scroll-to-top.
  window.scrollTo = () => {};
}

const SIZE_PROPS = ["clientWidth", "clientHeight", "offsetWidth", "offsetHeight"] as const;

/**
 * Give every element a deterministic box so CardTable can compute a scale.
 * jsdom reports 0 for all of these, which the component treats as "unmeasured".
 * Reset automatically after each test.
 */
export function setElementSize(width: number, height: number): void {
  if (!hasDom) throw new Error("setElementSize needs a DOM");
  for (const [prop, value] of [
    ["clientWidth", width],
    ["clientHeight", height],
    ["offsetWidth", width],
    ["offsetHeight", height],
  ] as const) {
    Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, get: () => value });
  }
}

afterEach(() => {
  if (!hasDom) return;
  // prototype patches leak between tests otherwise
  for (const prop of SIZE_PROPS) {
    delete (HTMLElement.prototype as unknown as Record<string, unknown>)[prop];
  }
  cleanup();
});
