/**
 * Contact sheet of frames from a rendered video, for checking an edit without
 * watching it end to end.
 *
 * Why: the fastest review loop, for people and coding agents alike, is to look
 * at stills at the moments that matter (usually the cues in src/demo/cues.ts).
 *
 *   npm run sheet -- out/kinnu-demo-youtube-16x9.mp4 5.3 11.3 19 26.3 33.4 38
 *   -> out/sheet.png   (landscape: 3 per row at 640 px; portrait: 4 per row at 360 px)
 *
 *   npm run sheet -- <video> <times...> --out out/checks/trust.png
 */
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { planSheet } from "./sheet";

const args = process.argv.slice(2);
const outFlag = args.indexOf("--out");
const out = path.resolve(outFlag >= 0 ? args[outFlag + 1] : "out/sheet.png");
const [video, ...rest] = args.filter((_, i) => outFlag < 0 || (i !== outFlag && i !== outFlag + 1));
const times = rest.map(Number);
if (!video || times.length === 0 || times.some(Number.isNaN)) {
  console.error("Usage: npm run sheet -- <video.mp4> <seconds> [<seconds>...] [--out file.png]");
  process.exit(1);
}

const probe = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate", "-of", "csv=p=0", video], {
  encoding: "utf8",
});
if (probe.status !== 0) throw new Error(`ffprobe failed:\n${probe.stderr}`);
const [width, height, rate] = probe.stdout.trim().split(",");
const [num, den] = rate.split("/").map(Number);
const portrait = Number(height) > Number(width);

const plan = planSheet(times, num / (den || 1), portrait ? 360 : 640, portrait ? 4 : 3);
mkdirSync(path.dirname(out), { recursive: true });
const res = spawnSync("ffmpeg", ["-loglevel", "error", "-y", "-i", video, "-vf", plan.filter, "-fps_mode", "vfr", "-frames:v", "1", out], { encoding: "utf8" });
if (res.status !== 0) throw new Error(`ffmpeg failed:\n${res.stderr}`);
console.log(`${plan.frames.length} frames (${plan.columns}x${plan.rows}) -> ${path.relative(process.cwd(), out)}`);
