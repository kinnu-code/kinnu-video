import { describe, expect, it } from "vitest";
import type { Caption } from "@remotion/captions";
import { applyWordTimings, groupWords, spokenForm } from "./align";

const tok = (text: string, start: number, end: number): Caption => ({
  text,
  startMs: start * 1000,
  endMs: end * 1000,
  timestampMs: null,
  confidence: 1,
});

describe("spokenForm", () => {
  it("reads ordinary words as themselves, without punctuation", () => {
    expect(spokenForm("doesn't")).toEqual(["DOESN'T"]);
    expect(spokenForm("expensive!")).toEqual(["EXPENSIVE"]);
  });

  it("spells acronyms and digits as they are said", () => {
    expect(spokenForm("SQE1.")).toEqual(["ES", "QUE", "E", "ONE"]);
    expect(spokenForm("AI")).toEqual(["A", "I"]);
  });

  it("splits hyphenated words", () => {
    expect(spokenForm("SQE-specific")).toEqual(["ES", "QUE", "E", "SPECIFIC"]);
    expect(spokenForm("expert-reviewed")).toEqual(["EXPERT", "REVIEWED"]);
  });

  it("corrects Whisper's spelling of Kinnu instead of spelling it out", () => {
    expect(spokenForm("KINU,")).toEqual(["KINNU"]);
    expect(spokenForm("Kinu.")).toEqual(["KINNU"]);
  });

  it("reads decimals with 'point'", () => {
    expect(spokenForm("4.7")).toEqual(["FOUR", "POINT", "SEVEN"]);
  });

  it("gives punctuation-only words no parts", () => {
    expect(spokenForm("-")).toEqual([]);
  });
});

describe("groupWords", () => {
  it("joins tokens without a leading space onto the previous word", () => {
    const tokens = [tok("Top", 0, 1), tok("-", 1, 1), tok("tier", 1, 2), tok(" SQ", 2, 3), tok("E", 3, 4)];
    expect(groupWords(tokens)).toEqual([[0, 1, 2], [3, 4]]);
  });
});

describe("applyWordTimings", () => {
  it("gives untimed script words the aligner's full start and end", () => {
    const tokens = [tok("With", 0, 0), tok(" Kinnu,", 0, 0)];
    const out = applyWordTimings(tokens, groupWords(tokens), [
      { start: 0.06, end: 0.3 },
      { start: 0.34, end: 0.8 },
    ]);
    expect(out.map((t) => [t.startMs, t.endMs])).toEqual([
      [60, 300],
      [340, 800],
    ]);
  });

  it("moves each word to its aligned time, keeping tokens in proportion", () => {
    const tokens = [tok(" flash", 15.13, 15.51), tok("cards", 15.51, 15.87), tok(",", 15.87, 15.9), tok(" and", 15.9, 16.0)];
    const out = applyWordTimings(tokens, groupWords(tokens), [
      { start: 14.59, end: 15.19 },
      { start: 15.43, end: 15.51 },
    ]);
    expect(out[0].startMs).toBe(14590);
    expect(out[1].endMs).toBeLessThanOrEqual(15190);
    expect(out[1].startMs).toBeGreaterThan(14590);
    // Punctuation sits at the end of its word; the next word starts where the aligner says.
    expect(out[2].startMs).toBe(15190);
    expect(out[3].startMs).toBe(15430);
  });
});
