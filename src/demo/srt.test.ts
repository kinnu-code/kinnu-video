import { describe, expect, it } from "vitest";
import type { Caption } from "@remotion/captions";
import { TRANSCRIPT } from "./cues";
import { toCues, toSrt, toWords } from "./srt";

const tok = (text: string, startMs: number, endMs: number): Caption => ({ text, startMs, endMs, timestampMs: startMs, confidence: 1 });

describe("toWords", () => {
  it("joins split tokens and keeps punctuation on the word", () => {
    const words = toWords([tok(" SQ", 0, 100), tok("E", 100, 200), tok("1", 200, 300), tok(".", 300, 310)]);
    expect(words).toEqual([{ text: "SQE1.", start: 0, end: 310 }]);
  });

  it("corrects Whisper's spelling of Kinnu", () => {
    const words = toWords([tok(" K", 0, 100), tok("IN", 100, 200), tok("U", 200, 300), tok(",", 300, 310)]);
    expect(words[0].text).toBe("Kinnu,");
  });
});

describe("toCues", () => {
  it("keeps every subtitle to at most two lines of 42 characters", () => {
    for (const c of toCues(toWords(TRANSCRIPT))) {
      const lines = c.text.split("\n");
      expect(lines.length, c.text).toBeLessThanOrEqual(2);
      for (const line of lines) expect(line.length, line).toBeLessThanOrEqual(42);
    }
  });

  it("packs short clauses of one sentence together, but never runs past a full stop", () => {
    const w = (text: string, start: number) => ({ text, start, end: start + 1 });
    const cues = toCues([w("Study", 0), w("notes,", 1), w("flashcards.", 2), w("Kinnu.", 3)]);
    expect(cues.map((c) => c.text)).toEqual(["Study notes, flashcards.", "Kinnu."]);
  });

  it("balances a long subtitle over two lines at a word boundary", () => {
    const words = "Top-tier SQE1 preparation doesn't have to be expensive.".split(" ").map((text, i) => ({ text, start: i, end: i + 1 }));
    expect(toCues(words).map((c) => c.text)).toEqual(["Top-tier SQE1 preparation\ndoesn't have to be expensive."]);
  });
});

describe("toSrt", () => {
  it("formats numbered cues with SRT timestamps", () => {
    const srt = toSrt([tok(" Try", 26_820, 26_960), tok(" it", 26_960, 27_210), tok(" free", 27_210, 27_290), tok(".", 27_290, 27_300)]);
    expect(srt).toBe("1\n00:00:26,820 --> 00:00:27,300\nTry it free.\n");
  });

  it("spells the brand correctly throughout the real transcript", () => {
    const srt = toSrt(TRANSCRIPT);
    expect(srt).toContain("Kinnu");
    expect(srt).not.toMatch(/KINU/);
  });
});
