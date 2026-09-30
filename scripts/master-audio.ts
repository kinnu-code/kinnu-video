/**
 * Masters the demo voiceover to YouTube's loudness reference.
 *
 * Why: YouTube turns loud uploads down to about -14 LUFS but never turns quiet
 * ones up, and ElevenLabs exports sit around -20 to -22 LUFS, so without this the
 * demo plays noticeably quieter than the videos around it.
 *
 * How: a gentle compressor evens out the voice first, then gain brings it up to
 * target and a limiter catches what peaks remain; re-measure and correct.
 * Without the compressor the second voiceover needed ~11 dB of limiting on its
 * loudest syllables, enough to sound crunchy; with it the limiter touches ~5% of
 * the audio by under 1 dB typically. (ffmpeg's loudnorm, tried first, undershot
 * to -15.6 LUFS on that voice.)
 *
 *   npm run master-audio                          # voiceover.mp3 -> voiceover-master.wav
 *   npm run master-audio -- in.mp3 out.wav
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(__dirname, "..");
const TARGET_LUFS = -14;
/** Sample-peak ceiling; 2 dB of margin keeps true peaks (between samples) under -1 dBTP. */
const CEILING_DB = -2;
const TOLERANCE_LU = 0.3;
/** 3:1 above -28 dB with a soft knee: standard voiceover levelling, fast enough to tame plosives. */
const COMPRESSOR = "acompressor=threshold=-28dB:ratio=3:attack=3:release=60:knee=6";

const input = path.resolve(process.argv[2] ?? path.join(ROOT, "public/assets/demo/voiceover.mp3"));
const output = path.resolve(process.argv[3] ?? path.join(ROOT, "public/assets/demo/voiceover-master.wav"));

const ffmpeg = (args: string[]): string => {
  const res = spawnSync("ffmpeg", ["-hide_banner", ...args], { encoding: "utf8" });
  if (res.status !== 0) throw new Error(`ffmpeg failed:\n${res.stderr}`);
  // ffmpeg writes its logs, including the loudness summary, to stderr.
  return res.stderr;
};

/** Integrated loudness (LUFS) and true peak (dBTP) of an audio file. */
const measure = (file: string): { lufs: number; peak: number } => {
  const log = ffmpeg(["-i", file, "-af", "ebur128=peak=true", "-f", "null", "-"]);
  const summary = log.slice(log.lastIndexOf("Summary:"));
  const num = (re: RegExp) => Number(re.exec(summary)?.[1]);
  return { lufs: num(/I:\s+(-?[\d.]+) LUFS/), peak: num(/Peak:\s+(-?[\d.]+) dBFS/) };
};

const before = measure(input);
const limit = Math.pow(10, CEILING_DB / 20).toFixed(4);
const render = (chain: string) => ffmpeg(["-loglevel", "error", "-y", "-i", input, "-af", chain, "-ar", "48000", output]);

// Measure after compression alone for the first gain estimate.
render(COMPRESSOR);
let gain = TARGET_LUFS - measure(output).lufs;
let after = before;
// Limiting shaves a little loudness off the peaks, so correct for it and try again.
for (let pass = 0; pass < 4; pass++) {
  render(`${COMPRESSOR},volume=${gain.toFixed(2)}dB,alimiter=limit=${limit}:level=0`);
  after = measure(output);
  if (Math.abs(after.lufs - TARGET_LUFS) <= TOLERANCE_LU) break;
  gain += TARGET_LUFS - after.lufs;
}

console.log(`Input  ${before.lufs} LUFS, peak ${before.peak} dBTP`);
console.log(`Output ${after.lufs} LUFS, peak ${after.peak} dBTP (compressed, +${gain.toFixed(1)} dB, limited at ${CEILING_DB} dBFS)`);
console.log(`Wrote ${path.relative(ROOT, output)}`);
