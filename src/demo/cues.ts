/**
 * Finds when a phrase is spoken in the voiceover.
 *
 * Why: the demo is edited to the voice, not to fixed beat lengths. Every cut is
 * anchored to a phrase ("practice questions") rather than a number (13.31), so a
 * re-recorded voiceover only needs `npm run transcribe` and the edit follows.
 */
import type { Caption } from "@remotion/captions";
import transcriptJson from "./transcript.json";

export type Transcript = readonly Caption[];

/**
 * Lowercase, and turn every run of non-alphanumerics into one space.
 *
 * Whisper splits some words into several tokens ("SQ" "E" "1", "flash" "cards")
 * and punctuation into its own tokens ("-", "'t"). Normalising both the
 * transcript and the search phrase the same way lets "sqe1", "flashcards" and
 * "top tier" match regardless of how they were tokenised.
 */
export const normalise = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");

type Index = { text: string; tokenAt: number[] };

/** Joins tokens into one normalised string, remembering which token each character came from. */
const buildIndex = (words: Transcript): Index => {
  let text = "";
  const tokenAt: number[] = [];
  words.forEach((w, i) => {
    const piece = normalise(w.text);
    for (const ch of piece) {
      // Collapse the space between tokens so the index matches normalise() output.
      if (ch === " " && text.endsWith(" ")) continue;
      text += ch;
      tokenAt.push(i);
    }
  });
  return { text: text.trimEnd(), tokenAt };
};

/** Seconds: when the phrase starts and ends, and when the next spoken word starts. */
export type CueTime = { start: number; end: number; next: number };

/**
 * Start and end (seconds) of the `occurrence`-th time `phrase` is spoken.
 * Matches on word boundaries, so "tutor" never matches inside "tutorial".
 * Throws if the phrase is absent: a silently wrong cut is worse than a failed render.
 */
export const findCue = (words: Transcript, phrase: string, occurrence = 1): CueTime => {
  const { text, tokenAt } = buildIndex(words);
  const needle = normalise(phrase).trim();
  const haystack = ` ${text} `;
  let from = 0;
  for (let n = 1; ; n++) {
    const hit = haystack.indexOf(` ${needle} `, from);
    if (hit === -1) {
      throw new Error(`Cue "${phrase}" (occurrence ${occurrence}) not found in transcript: "${text}"`);
    }
    if (n === occurrence) {
      // `hit` points at the leading space in the padded haystack, i.e. index hit in `text`.
      const first = words[tokenAt[hit]];
      const lastIndex = tokenAt[hit + needle.length - 1];
      const last = words[lastIndex];
      // The next word is the next token that starts a word and has something to say.
      const following = words.slice(lastIndex + 1).find((w) => w.text.startsWith(" ") && /[a-z0-9]/i.test(w.text));
      return { start: first.startMs / 1000, end: last.endMs / 1000, next: (following ?? last).startMs / 1000 };
    }
    from = hit + 1;
  }
};

export const TRANSCRIPT: Transcript = transcriptJson as Caption[];

/** Seconds from the start of the voiceover to the end of the last spoken word. */
export const VOICE_END = TRANSCRIPT[TRANSCRIPT.length - 1].endMs / 1000;

const at = (phrase: string, occurrence = 1) => findCue(TRANSCRIPT, phrase, occurrence).start;
const after = (phrase: string, occurrence = 1) => findCue(TRANSCRIPT, phrase, occurrence).end;
const nextAfter = (phrase: string, occurrence = 1) => findCue(TRANSCRIPT, phrase, occurrence).next;

/**
 * Every moment the edit hangs off, in seconds. Names describe the visual beat;
 * the phrase is what the voice says at that moment.
 */
export const CUES = {
  withKinnu: at("with kinnu"),
  topTier: at("top tier"),
  hookLine2: at("doesn t have to be"),
  expensive: at("expensive"),
  trusted: at("trusted by"),
  mishcon: at("mishcon"),
  slaughters: at("slaughters"),
  freshfields: at("freshfields"),
  rated: at("rated"),
  trustpilot: at("trustpilot"),
  youGet: at("you get"),
  expert: at("expert reviewed"),
  studyPath: at("a personal study path"),
  progress: at("and progress"),
  everyStep: at("every step"),
  notes: at("study notes"),
  practice: at("practice questions"),
  flashcards: at("flashcards"),
  tutor: at("sqe specific"),
  price: at("all at a price"),
  built: at("built specifically"),
  everything: at("everything you need"),
  without: at("without the"),
  ridiculous: at("ridiculous"),
  feesEnd: after("course fees"),
  // "Kinnu," found as the word after "course fees", so it survives Whisper's
  // varying spellings of the brand if the script file is ever dropped.
  outro: nextAfter("course fees"),
  tryFree: at("try it free"),
} as const;
