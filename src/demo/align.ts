/**
 * Glue between Whisper's transcript and the forced aligner (scripts/align_words.py).
 *
 * Why: Whisper's word timings drift by up to ~0.5 s. Whisper supplies the words,
 * the aligner finds exactly where each one is spoken, and these helpers carry the
 * aligned times back onto Whisper's tokens so the rest of the pipeline is unchanged.
 */
import type { Caption } from "@remotion/captions";
import { CORRECTIONS } from "./srt";

/** Token indices grouped into words: a token without a leading space continues the previous word. */
export const groupWords = (tokens: readonly Caption[]): number[][] => {
  const words: number[][] = [];
  tokens.forEach((t, i) => {
    if (i === 0 || t.text.startsWith(" ")) words.push([i]);
    else words[words.length - 1].push(i);
  });
  return words;
};

/** How each letter is said, so the aligner listens for "ess" rather than a bare "S". */
const LETTER_NAMES: Record<string, string> = {
  A: "A", B: "BEE", C: "SEE", D: "DEE", E: "E", F: "EF", G: "GEE", H: "AITCH", I: "I",
  J: "JAY", K: "KAY", L: "EL", M: "EM", N: "EN", O: "O", P: "PEE", Q: "QUE", R: "AR",
  S: "ES", T: "TEE", U: "YOU", V: "VEE", W: "DOUBLE YOU", X: "EX", Y: "WHY", Z: "ZED",
};
const DIGIT_NAMES = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];

/**
 * The parts of a written word as they are spoken, for the aligner.
 * "SQE1" -> ES QUE E ONE, "SQE-specific" -> ES QUE E SPECIFIC, "AI" -> A I.
 * Brand names Whisper misspells are corrected first, so "KINU" is read as the
 * word "Kinnu" rather than spelled out as an acronym.
 */
export const spokenForm = (written: string): string[] => {
  // "4.7" is said "four point seven".
  const decimals = written.replace(/(\d)\.(\d)/g, "$1-point-$2");
  const bare = decimals.replace(/[^A-Za-z0-9'-]/g, "");
  const word = CORRECTIONS[bare] ?? bare;
  return word
    .split("-")
    .filter(Boolean)
    .flatMap((part) =>
      // Runs of capitals (acronyms) and digits are said letter by letter; the rest is a normal word.
      (part.match(/[A-Z]{2,}(?![a-z])|\d|[A-Za-z']+/g) ?? []).flatMap((piece) => {
        if (/^\d$/.test(piece)) return [DIGIT_NAMES[Number(piece)]];
        if (/^[A-Z]{2,}$/.test(piece)) return piece.split("").flatMap((ch) => LETTER_NAMES[ch].split(" "));
        return [piece.toUpperCase()];
      }),
    );
};

export type WordTiming = { start: number; end: number };

/**
 * Returns a copy of `tokens` retimed to the aligner's word timings (seconds).
 * Within a word, tokens keep their relative position; punctuation-only tokens
 * sit at the end of the word they follow.
 */
export const applyWordTimings = (tokens: readonly Caption[], words: readonly number[][], timings: readonly WordTiming[]): Caption[] => {
  const out = tokens.map((t) => ({ ...t }));
  words.forEach((idx, w) => {
    const { start, end } = timings[w];
    const first = tokens[idx[0]].startMs;
    const last = tokens[idx[idx.length - 1]].endMs;
    // Words built from a script have no timing of their own yet (all zeros): treat
    // them as spanning the whole aligned word.
    const span = last - first;
    const at = (ms: number) => Math.round((span > 0 ? start + ((ms - first) / span) * (end - start) : ms <= first ? start : end) * 1000);
    for (const i of idx) {
      const punctuation = !/[A-Za-z0-9]/.test(tokens[i].text);
      out[i].startMs = punctuation ? Math.round(end * 1000) : at(tokens[i].startMs);
      out[i].endMs = punctuation ? Math.round(end * 1000) : span > 0 ? at(tokens[i].endMs) : Math.round(end * 1000);
    }
  });
  return out;
};
