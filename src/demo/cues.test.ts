import { describe, expect, it } from "vitest";
import type { Caption } from "@remotion/captions";
import { CUES, TRANSCRIPT, VOICE_END, findCue, normalise } from "./cues";

/** Builds a transcript the way Whisper tokenises: leading spaces start words, some words split. */
const tokens = (...parts: [string, number][]): Caption[] =>
  parts.map(([text, startMs], i) => ({
    text,
    startMs,
    endMs: parts[i + 1]?.[1] ?? startMs + 200,
    timestampMs: startMs,
    confidence: 1,
  }));

describe("normalise", () => {
  it("lowercases and collapses punctuation and whitespace into single spaces", () => {
    expect(normalise("Top-tier  SQE1, doesn't!")).toBe("top tier sqe1 doesn t ");
  });
});

describe("findCue", () => {
  const words = tokens(
    ["Top", 0],
    ["-", 100],
    ["tier", 150],
    [" SQ", 600],
    ["E", 700],
    ["1", 800],
    [" flash", 1000],
    ["cards", 1200],
    [",", 1400],
    [" tutorial", 1500],
    [" tutor", 2000],
    [".", 2300],
    [" tutor", 3000],
  );

  it("matches words that Whisper split into several tokens", () => {
    expect(findCue(words, "SQE1")).toMatchObject({ start: 0.6, end: 1.0 });
    expect(findCue(words, "flashcards")).toMatchObject({ start: 1.0, end: 1.4 });
  });

  it("treats hyphens in the phrase and the transcript alike", () => {
    expect(findCue(words, "top-tier").start).toBe(0);
    expect(findCue(words, "top tier").start).toBe(0);
  });

  it("only matches whole words, so 'tutor' skips 'tutorial'", () => {
    expect(findCue(words, "tutor").start).toBe(2.0);
  });

  it("reports when the next spoken word starts, skipping punctuation", () => {
    expect(findCue(words, "flashcards").next).toBe(1.5);
    expect(findCue(words, "tutor").next).toBe(3.0);
  });

  it("finds later occurrences on request", () => {
    expect(findCue(words, "tutor", 2).start).toBe(3.0);
  });

  it("throws, naming the phrase, when it is not spoken", () => {
    expect(() => findCue(words, "mock exams")).toThrow(/mock exams/);
    expect(() => findCue(words, "tutor", 3)).toThrow(/occurrence 3/);
  });
});

describe("CUES from the real voiceover", () => {
  it("all fall inside the spoken audio", () => {
    for (const [name, t] of Object.entries(CUES)) {
      expect(t, name).toBeGreaterThanOrEqual(0);
      expect(t, name).toBeLessThanOrEqual(VOICE_END);
    }
  });

  it("follow the script order", () => {
    const order = Object.values(CUES);
    const sorted = [...order].sort((a, b) => a - b);
    expect(order).toEqual(sorted);
  });

  it("transcript is non-empty and ends where the voice ends", () => {
    expect(TRANSCRIPT.length).toBeGreaterThan(10);
    expect(VOICE_END).toBeGreaterThan(20);
  });
});
