import type { FormatId } from "./format";

export type BeatId = "hook" | "problem" | "mcq" | "lara" | "flashcards" | "mock" | "prepscore" | "trust" | "cta";

export type Beat = {
  id: BeatId;
  /** seconds */
  duration: number;
};

// The 60s master. Shorter cuts are subsets of this list, so copy changes propagate.
const MASTER: Beat[] = [
  { id: "hook", duration: 5 },
  { id: "problem", duration: 7 },
  { id: "mcq", duration: 6 },
  { id: "lara", duration: 6 },
  { id: "flashcards", duration: 5 },
  { id: "mock", duration: 5 },
  { id: "prepscore", duration: 6 },
  { id: "trust", duration: 10 },
  { id: "cta", duration: 10 },
];

const pick = (ids: BeatId[], overrides: Partial<Record<BeatId, number>> = {}): Beat[] =>
  ids.map((id) => {
    const b = MASTER.find((m) => m.id === id)!;
    return { ...b, duration: overrides[id] ?? b.duration };
  });

export const CUTS: Record<FormatId, Beat[]> = {
  hero: MASTER,
  social: pick(["hook", "problem", "lara", "prepscore", "cta"], { hook: 3, problem: 5, trust: 0, cta: 6 }),
  appstore: pick(["hook", "prepscore", "cta"], { hook: 3, prepscore: 7, cta: 5 }),
};

/** Overlap between consecutive beats, in seconds. Used for cross-dissolves. */
export const TRANSITION = 0.5;

export const totalSeconds = (beats: Beat[]) =>
  beats.reduce((s, b) => s + b.duration, 0) - TRANSITION * (beats.length - 1);
