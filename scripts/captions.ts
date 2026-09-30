/**
 * Writes out/kinnu-demo.srt from the demo transcript, for uploading to YouTube
 * (Subtitles > Upload file > With timing). Same file works for both cuts.
 *
 *   npm run captions
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { TRANSCRIPT } from "../src/demo/cues";
import { toSrt } from "../src/demo/srt";

const out = path.resolve(__dirname, "../out/kinnu-demo.srt");
mkdirSync(path.dirname(out), { recursive: true });
writeFileSync(out, toSrt(TRANSCRIPT));
console.log(`Wrote ${path.relative(process.cwd(), out)}`);
