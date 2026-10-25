import { describe, expect, it } from "vitest";
import {
  describeCard,
  getRankName,
  getSuitName,
  getSuitSymbol,
  isKnownSuit,
  isRedSuit,
  parseCard,
} from "../src/cards";

describe("cards vocabulary", () => {
  it("names ranks", () => {
    expect(getRankName("A")).toBe("Ace");
    expect(getRankName("K")).toBe("King");
    expect(getRankName("10")).toBe("Ten");
    expect(getRankName("2")).toBe("Two");
    // the lookup is case-insensitive even though the artwork keeps the raw text
    expect(getRankName("a")).toBe("Ace");
    // unknown ranks pass through rather than being called something they are not
    expect(getRankName("joker")).toBe("joker");
  });

  it("names suits", () => {
    expect(getSuitName("s")).toBe("spades");
    expect(getSuitName("h")).toBe("hearts");
    expect(getSuitName("d")).toBe("diamonds");
    expect(getSuitName("c")).toBe("clubs");
    expect(getSuitName("H")).toBe("hearts");
    expect(getSuitName("z")).toBe("z");
  });

  it("describes a card the way a person says it", () => {
    expect(describeCard("As")).toBe("Ace of spades");
    expect(describeCard("10h")).toBe("Ten of hearts");
    expect(describeCard("kd")).toBe("King of diamonds");
    expect(describeCard("2C")).toBe("Two of clubs");
    expect(describeCard(null)).toBe("face-down card");
    expect(describeCard("")).toBe("face-down card");
  });

  it("falls back to the raw code rather than inventing a card", () => {
    // parseCard is permissive by design (a known gap), so the spoken name has to
    // be honest about it instead of announcing "of z"
    expect(describeCard("xyz")).toBe("xyz");
    expect(describeCard("A1")).toBe("A1");
    expect(describeCard("Zz")).toBe("Zz");
  });

  it("knows which suits are red, and which it can even draw", () => {
    expect([isRedSuit("h"), isRedSuit("D")]).toEqual([true, true]);
    expect([isRedSuit("s"), isRedSuit("c"), isRedSuit("z")]).toEqual([false, false, false]);
    expect(isKnownSuit("s")).toBe(true);
    expect(isKnownSuit("z")).toBe(false);
  });

  it("parses the same way it always did", () => {
    expect(parseCard("As")).toEqual({ rank: "A", suit: "s" });
    expect(parseCard("10h")).toEqual({ rank: "10", suit: "h" });
    expect(parseCard("A")).toEqual({ rank: "", suit: "" });
    expect(parseCard("")).toEqual({ rank: "", suit: "" });
    expect(parseCard("xyz")).toEqual({ rank: "xy", suit: "z" });
  });

  it("symbolises suits, passing unknown ones through", () => {
    expect(getSuitSymbol("s")).toBe("\u2660");
    expect(getSuitSymbol("h")).toBe("\u2665");
    expect(getSuitSymbol("d")).toBe("\u2666");
    expect(getSuitSymbol("c")).toBe("\u2663");
    expect(getSuitSymbol("z")).toBe("z");
  });
});
