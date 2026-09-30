/**
 * Transcribes the demo voiceover into word-level timestamps.
 *
 * Why: every cut in the Demo video is timed to the moment a word is spoken, so
 * the timings must come from the audio itself rather than guessed beat lengths.
 * Whisper runs locally (whisper.cpp), so the voiceover never leaves this machine.
 *
 * Whisper's own word timings drift by up to ~0.5 s, so Whisper only supplies the
 * words: a forced aligner (scripts/align_words.py, wav2vec2 via uv) then finds
 * exactly when each is spoken. First run downloads ~450 MB into uv's and torch's caches.
 *
 * If src/demo/script.txt exists, its words are aligned instead of Whisper's: the
 * script is the source of truth (Whisper heard "Anything" for "Everything" on the
 * third voiceover), and its spelling and punctuation flow into the captions.
 * Keep script.txt in step with the voiceover: the aligner fits whatever words it
 * is given, so a mismatch shows up only as wrong timings.
 *
 * Output (checked in, so rendering never needs Whisper or the aligner):
 *   src/demo/transcript.whisper.json  Whisper's raw tokens (Whisper mode only)
 *   src/demo/transcript.json          aligned words; the edit reads this
 *
 *   npm run transcribe                       # default: public/assets/demo/voiceover.mp3
 *   npm run transcribe -- path/to/other.mp3
 *   npm run transcribe -- --whisper          # ignore script.txt, use Whisper's words
 *   npm run transcribe -- --align-only       # re-align the saved Whisper output, no re-transcription
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Caption } from "@remotion/captions";
import {
  downloadWhisperModel,
  installWhisperCpp,
  toCaptions,
  transcribe,
} from "@remotion/install-whisper-cpp";
import { applyWordTimings, groupWords, spokenForm, type WordTiming } from "../src/demo/align";

const ROOT = path.resolve(__dirname, "..");
// whisper.cpp 1.5.5 builds with plain `make`; later versions need cmake.
const WHISPER_VERSION = "1.5.5";
const WHISPER_DIR = path.join(ROOT, ".whisper");
// small.en is accurate enough for clean TTS speech and a fraction of medium's size.
const MODEL = "small.en" as const;

const RAW_FILE = path.join(ROOT, "src/demo/transcript.whisper.json");
const OUT_FILE = path.join(ROOT, "src/demo/transcript.json");
const SCRIPT_FILE = path.join(ROOT, "src/demo/script.txt");

/** The script as untimed tokens, one per word, in the same shape Whisper produces. */
const scriptTokens = (text: string): Caption[] =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .map((word, i) => ({ text: i === 0 ? word : ` ${word}`, startMs: 0, endMs: 0, timestampMs: null, confidence: 1 }));

/** Runs Whisper locally and returns its word-level tokens. */
const whisper = async (input: string): Promise<Caption[]> => {
  await installWhisperCpp({ to: WHISPER_DIR, version: WHISPER_VERSION, printOutput: true });
  await downloadWhisperModel({ model: MODEL, folder: WHISPER_DIR, printOutput: true });

  // whisper.cpp only accepts 16 kHz mono WAV.
  const wav = path.join(WHISPER_DIR, "input-16k.wav");
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", input, "-ar", "16000", "-ac", "1", wav]);

  const output = await transcribe({
    inputPath: wav,
    whisperPath: WHISPER_DIR,
    whisperCppVersion: WHISPER_VERSION,
    model: MODEL,
    tokenLevelTimestamps: true,
  });
  return toCaptions({ whisperCppOutput: output }).captions;
};

/** Pinned so the aligner's behaviour doesn't change under us; uv caches the environment. */
const ALIGNER_ENV = ["--python", "3.11", "--with", "torch==2.5.1", "--with", "torchaudio==2.5.1", "--with", "numpy"];

/**
 * Forced-aligns Whisper's words to the audio and returns the tokens retimed.
 * Words with nothing to say (stray punctuation) inherit the previous word's end.
 */
const forceAlign = (input: string, tokens: Caption[]): Caption[] => {
  const words = groupWords(tokens);
  const spoken = words.map((idx) => spokenForm(idx.map((i) => tokens[i].text).join("").trim()));
  const sayable = spoken.map((parts, w) => ({ parts, w })).filter((x) => x.parts.length > 0);

  const dir = mkdtempSync(path.join(os.tmpdir(), "kinnu-align-"));
  const [wordsFile, outFile] = [path.join(dir, "words.json"), path.join(dir, "timings.json")];
  writeFileSync(wordsFile, JSON.stringify(sayable.map((x) => x.parts)));
  const res = spawnSync("uv", ["run", "--quiet", ...ALIGNER_ENV, path.join(ROOT, "scripts/align_words.py"), input, wordsFile, outFile], {
    encoding: "utf8",
    stdio: ["ignore", "inherit", "pipe"],
  });
  if (res.status !== 0) throw new Error(`Forced alignment failed:\n${res.stderr}`);
  const aligned: WordTiming[] = JSON.parse(readFileSync(outFile, "utf8"));

  const timings: WordTiming[] = [];
  sayable.forEach((x, i) => (timings[x.w] = aligned[i]));
  words.forEach((_, w) => {
    const prevEnd = timings[w - 1]?.end ?? 0;
    timings[w] ??= { start: prevEnd, end: prevEnd };
  });
  return applyWordTimings(tokens, words, timings);
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);
  const alignOnly = args.includes("--align-only");
  const useScript = !args.includes("--whisper") && !alignOnly && existsSync(SCRIPT_FILE);
  const input = path.resolve(args.find((a) => !a.startsWith("--")) ?? path.join(ROOT, "public/assets/demo/voiceover.mp3"));

  mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  let raw: Caption[];
  if (useScript) {
    console.log(`Aligning ${path.relative(ROOT, SCRIPT_FILE)} to ${path.relative(ROOT, input)}`);
    raw = scriptTokens(readFileSync(SCRIPT_FILE, "utf8"));
  } else {
    raw = alignOnly ? JSON.parse(readFileSync(RAW_FILE, "utf8")) : await whisper(input);
    if (!alignOnly) writeFileSync(RAW_FILE, JSON.stringify(raw, null, 2) + "\n");
  }
  const aligned = forceAlign(input, raw);
  writeFileSync(OUT_FILE, JSON.stringify(aligned, null, 2) + "\n");

  // Word-by-word timings, so a bad alignment is easy to spot.
  const words = groupWords(aligned).map((idx) => `${(aligned[idx[0]].startMs / 1000).toFixed(2)} ${idx.map((i) => aligned[i].text).join("").trim()}`);
  console.log(`\n${words.join("  ")}`);
  console.log(`\n${aligned.length} tokens -> ${path.relative(ROOT, OUT_FILE)}\n`);
  console.log(aligned.map((c) => c.text).join("").trim());
};

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
