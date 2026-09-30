/**
 * Builds an .srt subtitle file from the Whisper transcript, for uploading to
 * YouTube alongside the video.
 *
 * Why upload our own: YouTube's auto-captions misspell brand and exam names
 * ("Kinnu", "SQE1"), and uploaded captions are indexed for search.
 */
import type { Caption } from "@remotion/captions";

/** Whisper's spellings of names it has never seen, and what they should read. */
export const CORRECTIONS: Record<string, string> = { KINU: "Kinnu", Kinu: "Kinnu" };

type Word = { text: string; start: number; end: number };

/** Merges Whisper tokens into words: a token without a leading space continues the previous word. */
export const toWords = (tokens: readonly Caption[]): Word[] => {
  const words: Word[] = [];
  for (const tok of tokens) {
    const startsWord = tok.text.startsWith(" ") || words.length === 0;
    if (startsWord) words.push({ text: tok.text.trim(), start: tok.startMs, end: tok.endMs });
    else {
      const w = words[words.length - 1];
      w.text += tok.text;
      w.end = tok.endMs;
    }
  }
  return words.map((w) => {
    const bare = w.text.replace(/[^\w]+$/, "");
    const fixed = CORRECTIONS[bare];
    return fixed ? { ...w, text: fixed + w.text.slice(bare.length) } : w;
  });
};

/** Broadcast convention: at most two lines of 42 characters per subtitle. */
const MAX_LINE = 42;
/** Longest subtitle we pack phrases into; leaves room to balance over two lines. */
const MAX_CUE = 60;

const join = (ws: readonly Word[]): Word => ({ text: ws.map((w) => w.text).join(" "), start: ws[0].start, end: ws[ws.length - 1].end });

/** Splits after every word that ends in punctuation, so subtitles break where the voice pauses. */
const toPhrases = (words: readonly Word[]): Word[][] => {
  const phrases: Word[][] = [[]];
  for (const w of words) {
    phrases[phrases.length - 1].push(w);
    if (/[.,?!]$/.test(w.text)) phrases.push([]);
  }
  return phrases.filter((ph) => ph.length > 0);
};

/** Halves a word run until every piece fits in one subtitle. */
const fit = (ws: Word[]): Word[][] => {
  if (join(ws).text.length <= MAX_CUE || ws.length < 2) return [ws];
  const mid = Math.ceil(ws.length / 2);
  return [...fit(ws.slice(0, mid)), ...fit(ws.slice(mid))];
};

/** Breaks a subtitle over two lines at the space nearest its middle, if it is too long for one. */
const balance = (text: string): string => {
  if (text.length <= MAX_LINE) return text;
  let best = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === " " && (best === -1 || Math.abs(i - text.length / 2) < Math.abs(best - text.length / 2))) best = i;
  }
  return `${text.slice(0, best)}\n${text.slice(best + 1)}`;
};

/**
 * Groups words into subtitles: break at the voice's pauses (punctuation), pack
 * short clauses of the same sentence together up to MAX_CUE characters, then
 * balance over two lines. A subtitle never runs on past the end of a sentence.
 */
export const toCues = (words: readonly Word[]): Word[] => {
  const groups: Word[][] = [];
  for (const phrase of toPhrases(words).flatMap(fit)) {
    const last = groups[groups.length - 1];
    const lastEndsSentence = last !== undefined && /[.?!]$/.test(last[last.length - 1].text);
    if (last && !lastEndsSentence && join([...last, ...phrase]).text.length <= MAX_CUE) last.push(...phrase);
    else groups.push([...phrase]);
  }
  return groups.map((g) => {
    const cue = join(g);
    return { ...cue, text: balance(cue.text) };
  });
};

const timestamp = (ms: number): string => {
  const t = Math.max(0, Math.round(ms));
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  return `${pad(Math.floor(t / 3_600_000))}:${pad(Math.floor(t / 60_000) % 60)}:${pad(Math.floor(t / 1000) % 60)},${pad(t % 1000, 3)}`;
};

export const toSrt = (tokens: readonly Caption[]): string =>
  toCues(toWords(tokens))
    .map((c, i) => `${i + 1}\n${timestamp(c.start)} --> ${timestamp(c.end)}\n${c.text}\n`)
    .join("\n");
