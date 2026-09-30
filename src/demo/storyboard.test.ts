import { readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PHONE_ASPECT, SCREENS, VOICEOVER, WEB_CHROME_CROP } from "./assets";
import { parseCaption } from "./components/Caption";
import { activeStep, scrollAt, type ScreenStep } from "./components/ScreenTrack";
import { VOICE_END } from "./cues";
import { poseAt, ramp } from "./motion";
import { FACE_SIZE, TESTIMONIALS } from "./testimonials";
import {
  CAPTIONS,
  DEMO_SECONDS,
  END_CARD,
  FEATURES,
  MUSIC_LEVELS,
  musicDbAt,
  PHONE_STEPS,
  TRUST,
  WEB_STEPS,
  browserKeys,
  layoutFor,
  phoneKeys,
} from "./storyboard";

const PUBLIC = path.resolve(__dirname, "../../public");

/** Pixel size of a PNG (from its IHDR chunk) or an SVG (from its width/height attributes). */
const imageSize = (file: string): { width: number; height: number } => {
  const buf = readFileSync(path.join(PUBLIC, file));
  if (file.endsWith(".png")) return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  const svg = buf.toString("utf8", 0, 500);
  const num = (attr: string) => Number(new RegExp(`${attr}="([\\d.]+)"`).exec(svg)?.[1]);
  return { width: num("width"), height: num("height") };
};

const isSorted = (xs: readonly number[]) => xs.every((x, i) => i === 0 || xs[i - 1] <= x);

describe("screen manifest", () => {
  it.each(Object.entries(SCREENS))("%s exists with the declared pixel size", (_id, screen) => {
    expect(imageSize(screen.src)).toEqual({ width: screen.width, height: screen.height });
  });

  it("has the voiceover file in place", () => {
    expect(() => readFileSync(path.join(PUBLIC, VOICEOVER))).not.toThrow();
  });

  // Replacing voiceover.mp3 without re-running the pipeline would render the old
  // audio or old timings with no other symptom.
  it("has a mastered voiceover and transcript made after the current voiceover.mp3", () => {
    const source = statSync(path.join(PUBLIC, "assets/demo/voiceover.mp3")).mtimeMs;
    expect(statSync(path.join(PUBLIC, VOICEOVER)).mtimeMs, "run npm run master-audio").toBeGreaterThan(source);
    expect(statSync(path.resolve(__dirname, "transcript.json")).mtimeMs, "run npm run transcribe").toBeGreaterThan(source);
  });
});

// Viewport height / width for each device. The browser's tallest pose is 0.62
// of its width, minus the 0.03 title bar; the phone matches its captures.
describe.each([
  ["phone", PHONE_STEPS, 0, PHONE_ASPECT],
  ["web", WEB_STEPS, WEB_CHROME_CROP, 0.59],
] as const)("%s running order", (_name, steps: readonly ScreenStep[], cropTop, aspect) => {
  it("is in time order", () => {
    expect(isSorted(steps.map((s) => s.at))).toBe(true);
  });

  it("never scrolls past the bottom of a capture", () => {
    for (const step of steps) {
      const screen = SCREENS[step.screen];
      const viewport = screen.width * aspect;
      const scrolls = typeof step.scroll === "object" ? [step.scroll.from, step.scroll.to] : [step.scroll ?? 0];
      for (const s of scrolls) {
        expect(s + cropTop, `${step.screen} @ ${step.at}`).toBeLessThanOrEqual(screen.height - Math.min(viewport, screen.height));
      }
    }
  });

  it("only taps points visible on screen at the moment of the tap", () => {
    for (const step of steps) {
      const screen = SCREENS[step.screen];
      const viewport = screen.width * aspect;
      for (const tap of step.taps ?? []) {
        const y = tap.y - scrollAt(step.scroll, tap.at);
        expect(tap.x).toBeGreaterThan(0);
        expect(tap.x).toBeLessThan(screen.width);
        expect(y, `${step.screen} tap @ ${tap.at}`).toBeGreaterThan(0);
        expect(y, `${step.screen} tap @ ${tap.at}`).toBeLessThan(viewport);
        // A tap on a screen that has already been replaced would be invisible.
        expect(activeStep(steps, tap.at)).toBe(steps.indexOf(step));
      }
    }
  });
});

describe("timing", () => {
  it("keeps the end card on screen after the last word", () => {
    expect(DEMO_SECONDS).toBeGreaterThan(VOICE_END + 1);
  });

  it("gives every caption a positive duration", () => {
    for (const c of CAPTIONS) expect(c.to, c.text).toBeGreaterThan(c.from);
  });

  it("ticks features in spoken order within the feature run", () => {
    const ats = FEATURES.items.map((f) => f.at);
    expect(isSorted(ats)).toBe(true);
    expect(ats[0]).toBeGreaterThanOrEqual(FEATURES.from);
    expect(ats[ats.length - 1]).toBeLessThan(FEATURES.to);
  });

  it.each(["landscape", "portrait"] as const)("has %s device keyframes in time order", (o) => {
    const L = layoutFor(o);
    expect(isSorted(phoneKeys(L).map((k) => k.at))).toBe(true);
    expect(isSorted(browserKeys(L).map((k) => k.at))).toBe(true);
  });

  it.each(["landscape", "portrait"] as const)("clears both devices off the %s frame before the end card", (o) => {
    const L = layoutFor(o);
    const frameH = o === "landscape" ? 1080 : 1920;
    const end = DEMO_SECONDS - 0.5;
    expect(poseAt(phoneKeys(L), end).cy - L.phone.main.w).toBeGreaterThan(frameH);
    expect(poseAt(browserKeys(L), end).cy - 200).toBeGreaterThan(frameH);
  });
});

describe("testimonials", () => {
  it.each(TESTIMONIALS.map((t) => [t.name, t] as const))("%s has a face image with its mouth inside it", (_name, t) => {
    expect(imageSize(t.face.src)).toEqual({ width: FACE_SIZE, height: FACE_SIZE });
    const { x, y } = t.face.mouth;
    // The redrawn grin spans ~11 px either side and ~9 px below the mouth centre.
    expect(x - 11).toBeGreaterThan(0);
    expect(x + 11).toBeLessThan(FACE_SIZE);
    expect(y + 9).toBeLessThan(FACE_SIZE);
  });

  it("lands the wall only after the voice has finished", () => {
    expect(END_CARD.wallAt).toBeGreaterThan(VOICE_END);
    expect(END_CARD.ctaAt).toBeGreaterThan(END_CARD.from);
  });
});

describe("music", () => {
  it("sits at bed level under the voice, lifts on the end card, and carries the outro", () => {
    expect(musicDbAt(10)).toBeCloseTo(MUSIC_LEVELS.bed);
    expect(musicDbAt(VOICE_END - 0.2)).toBeCloseTo(MUSIC_LEVELS.endCard);
    expect(musicDbAt(VOICE_END + 2)).toBeCloseTo(MUSIC_LEVELS.outro);
  });

  it("only ever gets louder from bed to outro, apart from the edge fades", () => {
    const levels = Array.from({ length: 400 }, (_, i) => musicDbAt(0.5 + (i * (DEMO_SECONDS - 1)) / 400));
    expect(isSorted(levels)).toBe(true);
  });

  it("fades in from silence and out to silence", () => {
    expect(musicDbAt(0)).toBe(Number.NEGATIVE_INFINITY);
    expect(musicDbAt(DEMO_SECONDS)).toBe(Number.NEGATIVE_INFINITY);
  });

  it("has the music file in place", () => {
    expect(() => readFileSync(path.join(PUBLIC, "assets/demo/music.mp3"))).not.toThrow();
  });
});

describe("trust beat", () => {
  it("names each firm in order, then the rating, within the beat", () => {
    const moments = [TRUST.from, ...TRUST.firmsAt, TRUST.ratedAt, TRUST.scoreAt, TRUST.logoAt, TRUST.to];
    expect(isSorted(moments)).toBe(true);
  });
});

describe("parseCaption", () => {
  it("accents *marked* words and leaves trailing punctuation unstyled", () => {
    expect(parseCaption("for *SQE1*.")).toEqual([
      { text: "for", accent: false, strike: false },
      { text: "SQE1.", accent: true, strike: false },
    ]);
  });

  it("strikes every word inside a multi-word ~span~", () => {
    const words = parseCaption("the ~ridiculous course fees~.");
    expect(words.map((w) => w.strike)).toEqual([false, true, true, true]);
    expect(words[3].text).toBe("fees.");
  });

  it("turns a standalone | into a line break", () => {
    const words = parseCaption("Built specifically | for SQE1.");
    expect(words[2].lineBreak).toBe(true);
    expect(words.filter((w) => !w.lineBreak).map((w) => w.text)).toEqual(["Built", "specifically", "for", "SQE1."]);
  });
});

describe("motion", () => {
  it("ramp is 0 before, 1 after, and a zero-length ramp is a step", () => {
    expect(ramp(0, 1, 1)).toBe(0);
    expect(ramp(3, 1, 1)).toBe(1);
    expect(ramp(0.99, 1, 0)).toBe(0);
    expect(ramp(1, 1, 0)).toBe(1);
  });

  it("poseAt holds the first pose, then eases to each keyframe in turn", () => {
    const a = { cx: 0, cy: 0, w: 100, opacity: 1 };
    const b = { cx: 100, cy: 0, w: 100, opacity: 1 };
    const keys = [
      { at: 0, pose: a },
      { at: 1, pose: b, dur: 1 },
    ];
    expect(poseAt(keys, 0.5).cx).toBe(0);
    const mid = poseAt(keys, 1.5).cx;
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(100);
    expect(poseAt(keys, 2.5).cx).toBe(100);
  });
});
