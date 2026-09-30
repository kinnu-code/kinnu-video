/**
 * The whole demo edit in one place: what each device shows, where it sits,
 * and what text is on screen, all hung off spoken phrases (see cues.ts).
 *
 * The screen running order and captions are shared by both cuts; only the
 * layout (positions and type sizes) differs between 16:9 and 9:16.
 *
 * Voiceover: see script.txt. Beats, in order:
 *   hook (With Kinnu, top-tier SQE1 prep...) | trust (firms, Trustpilot) |
 *   phone walkthrough (materials, study path, progress + web) | feature run |
 *   price | built for SQE1 | web + phone hero (everything you need... fees) |
 *   end card (Kinnu, try it free today) then the testimonial wall.
 */
import { theme } from "../theme";
import { CUES as c, TRANSCRIPT, VOICE_END, findCue } from "./cues";
import type { BrowserPose } from "./components/Devices";
import type { Feature } from "./components/FeatureList";
import type { ScreenStep } from "./components/ScreenTrack";
import type { Chip } from "./components/SubjectCloud";
import type { EndLayout } from "./components/Brand";
import type { TrustLayout } from "./components/Trust";
import { EASE_IN_OUT, ramp, type Keyframe, type Pose } from "./motion";

/**
 * Seconds of silence after the last word: the testimonial wall needs time to be
 * read, and YouTube end-screen elements need at least 5 s at the end.
 */
const END_HOLD = 7.5;
export const DEMO_SECONDS = Math.ceil(VOICE_END + END_HOLD);

// ---------------------------------------------------------------------------
// Screens. Scroll and tap positions are in the capture's own pixels.
// Cuts land ~0.15 s before the word: a push takes a few frames to read.
// ---------------------------------------------------------------------------

export const PHONE_STEPS: readonly ScreenStep[] = [
  // "You get expert-reviewed study materials": the phone rises on a Learn session and scrolls it.
  { at: 0, screen: "learn", scroll: { from: 0, to: 1150, start: c.expert + 0.3, end: c.studyPath - 0.25 } },
  // "a personal study path built around you"
  { at: c.studyPath - 0.15, screen: "studyPlan", enter: "push", scroll: { from: 0, to: 110, start: c.studyPath + 0.4, end: c.progress } },
  // "and progress you can see": today's tasks tick over to complete.
  { at: c.progress + 0.15, screen: "studyPlanDone", enter: "fade", scroll: 110 },
  // "every step of the way": Prep Score percentile.
  { at: c.everyStep + 0.35, screen: "prepScore", enter: "push" },
  // Feature run. Each item gets its own screen and, where it helps, a tap.
  { at: c.notes - 0.2, screen: "learn", enter: "push", scroll: { from: 1750, to: 1950, start: c.notes, end: c.practice } },
  { at: c.practice - 0.15, screen: "mcq", enter: "push", scroll: 380, taps: [{ at: c.practice + 0.3, x: 187, y: 912 }] },
  { at: c.practice + 0.45, screen: "mcqAnswered", enter: "fade", scroll: 380 },
  { at: c.flashcards - 0.15, screen: "flashcard", enter: "push", taps: [{ at: c.flashcards + 0.3, x: 266, y: 666 }] },
  { at: c.flashcards + 0.45, screen: "flashcardRemembered", enter: "fade" },
  // "SQE-specific AI tutor": tap Ask LARA; the LARA sheet (stand-in) slides up.
  { at: c.tutor - 0.15, screen: "mcqAnswered", enter: "push", scroll: 935, taps: [{ at: c.tutor + 0.3, x: 349, y: 1590 }] },
  // Off screen until the closing hero shot.
  { at: c.built, screen: "home", enter: "cut" },
];

/** When the LARA chat sheet starts sliding up. Hidden again once the phone leaves. */
export const LARA = { from: c.tutor + 0.45, to: c.built };

export const WEB_STEPS: readonly ScreenStep[] = [
  { at: 0, screen: "web", scroll: { from: 0, to: 1000, start: c.everyStep + 0.4, end: c.notes - 0.1 } },
  { at: c.built, screen: "web", enter: "cut", scroll: { from: 0, to: 650, start: c.everything + 0.5, end: c.feesEnd } },
];

// ---------------------------------------------------------------------------
// On-screen text. `*word*` = teal accent, `~word~` = struck through.
// Slots are positioned per orientation by the layout below.
// ---------------------------------------------------------------------------

export type Slot = "side" | "center" | "top";

export type CaptionSpec = {
  slot: Slot;
  /** "brand" renders the Kinnu lockup in the caption's place (text is ignored). */
  kind?: "text" | "brand";
  text: string;
  from: number;
  to: number;
  /** Multiplier on the slot's base type size. */
  scale?: number;
  strike?: { start: number; end: number };
};

const HOOK_END = c.trusted - 0.1;

export const CAPTIONS: readonly CaptionSpec[] = [
  // "With Kinnu, top-tier SQE1 preparation doesn't have to be expensive."
  { slot: "center", kind: "brand", text: "", from: c.withKinnu, to: HOOK_END },
  { slot: "center", text: "Top-tier *SQE1* prep", from: c.topTier - 0.05, to: HOOK_END },
  {
    slot: "center",
    text: "doesn't have to be ~expensive~.",
    from: c.hookLine2 - 0.05,
    to: HOOK_END,
    strike: { start: c.expensive + 0.2, end: c.expensive + 0.6 },
  },
  { slot: "side", text: "Expert-reviewed study materials", from: c.expert - 0.05, to: c.studyPath - 0.05 },
  { slot: "side", text: "A personal study path, built around *you*.", from: c.studyPath - 0.05, to: c.progress - 0.05 },
  { slot: "side", text: "Progress you can see, every step of the way.", from: c.progress - 0.05, to: c.notes - 0.1 },
  { slot: "side", text: "All at a price that *makes sense*.", from: c.price - 0.05, to: c.built - 0.1 },
  { slot: "center", text: "Built specifically | for *SQE1*.", from: c.built - 0.05, to: c.everything - 0.1, scale: 1.15 },
  { slot: "top", text: "Everything you need to prepare *seriously*.", from: c.everything - 0.05, to: c.without - 0.05 },
  {
    slot: "top",
    text: "Without the ~ridiculous course fees~.",
    from: c.without - 0.05,
    // Lingers into the end card's entrance so the finished strike has time to register.
    to: c.outro + 0.15,
    strike: { start: c.ridiculous, end: c.feesEnd - 0.05 },
  },
];

/** "Trusted by trainees at Mishcon, Slaughters and Freshfields, and rated 4.7 on Trustpilot." */
export const TRUST = {
  from: c.trusted - 0.05,
  to: c.youGet - 0.1,
  firmsAt: [c.mishcon - 0.05, c.slaughters - 0.05, c.freshfields - 0.05],
  ratedAt: c.rated - 0.1,
  // "4.7" is the word after "rated"; the TrustScore line lands with it.
  scoreAt: findCue(TRANSCRIPT, "rated").next,
  logoAt: c.trustpilot - 0.1,
};

export const FEATURES = {
  from: c.notes - 0.1,
  to: c.price - 0.05,
  items: [
    { label: "Study notes", color: theme.color.learn, at: c.notes },
    { label: "Practice questions", color: theme.color.practice, at: c.practice },
    { label: "Flashcards", color: theme.color.flashcards, at: c.flashcards },
    { label: "SQE-specific AI tutor", color: theme.color.accent, at: c.tutor },
  ] satisfies Feature[],
};

/** Subjects shown in the app's Prep Score screen. */
const SUBJECTS = [
  "Business Law and Practice",
  "Dispute Resolution",
  "Contract Law",
  "Tort",
  "Trusts",
  "The Legal System",
  "Land Law",
  "Property Practice",
  "Criminal Law and Practice",
  "Solicitors Accounts",
] as const;

export const SUBJECT_CLOUD = { from: c.built + 0.1, to: c.everything - 0.05 };

// ---------------------------------------------------------------------------
// Music. Levels in dB relative to the file. The voice is mastered to -14 LUFS and
// the track's groove sits near -21 LUFS, so the bed puts it ~15 dB under the voice:
// present, never competing. The track's resolving hit lands at 33.36 s, on "Kinnu,".
// ---------------------------------------------------------------------------

export const MUSIC_LEVELS = {
  /** Under the voice. */
  bed: -8,
  /** From "Kinnu,": lets the resolving hit land with the logo, still clear of the voice. */
  endCard: -5,
  /** After the last word: the music carries the testimonial wall. */
  outro: -2,
} as const;

/** Music level in dB at time `t` (seconds): short fades at the edges, eased steps between levels. */
export const musicDbAt = (t: number, duration: number = DEMO_SECONDS): number => {
  const step = (from: number, to: number, at: number, dur: number) => from + (to - from) * ramp(t, at, dur, EASE_IN_OUT);
  let db = step(MUSIC_LEVELS.bed, MUSIC_LEVELS.endCard, c.outro - 0.25, 0.3);
  if (t >= VOICE_END) db = step(MUSIC_LEVELS.endCard, MUSIC_LEVELS.outro, VOICE_END + 0.1, 0.8);
  // Fade in over the first 0.3 s and out over the last 0.4 s so neither edge clicks.
  const edges = Math.min(ramp(t, 0, 0.3, (x) => x), 1 - ramp(t, duration - 0.4, 0.4, (x) => x));
  return edges <= 0 ? Number.NEGATIVE_INFINITY : db + 20 * Math.log10(edges);
};

/** Lockup on "Kinnu,", CTA on "try it free", then the testimonial wall once the voice has finished. */
export const END_CARD = { from: c.outro - 0.1, ctaAt: c.tryFree - 0.1, wallAt: VOICE_END + 0.35 };

// ---------------------------------------------------------------------------
// Layouts. Positions in px for the format's own frame size.
// ---------------------------------------------------------------------------

type PhonePoses = Record<"offBottom" | "main" | "corner" | "hero", Pose>;
type BrowserPoses = Record<"offRight" | "offBottom" | "side" | "hero", BrowserPose>;

export type Layout = {
  phone: PhonePoses;
  browser: BrowserPoses;
  /** Absolute boxes for each caption slot. */
  slots: Record<Slot, { left: number; top: number; width: number; height: number; align: "left" | "center"; size: number }>;
  features: { layout: "list" | "single"; size: number };
  /** Kinnu lockup above the opening headline. */
  brandSize: number;
  trust: TrustLayout;
  end: EndLayout;
  chips: readonly Chip[];
  chipSize: number;
  unit: number;
};

const chips = (positions: readonly [number, number][]): Chip[] => SUBJECTS.map((label, i) => ({ label, x: positions[i][0], y: positions[i][1] }));

const LANDSCAPE: Layout = {
  phone: {
    offBottom: { cx: 1360, cy: 1700, w: 430, opacity: 1 },
    main: { cx: 1360, cy: 540, w: 430, opacity: 1 },
    corner: { cx: 1700, cy: 690, w: 300, opacity: 1 },
    hero: { cx: 1560, cy: 640, w: 340, opacity: 1 },
  },
  browser: {
    offRight: { cx: 2500, cy: 470, w: 960, opacity: 1, aspect: 0.62 },
    offBottom: { cx: 900, cy: 1560, w: 1300, opacity: 1, aspect: 0.58 },
    side: { cx: 1330, cy: 470, w: 960, opacity: 1, aspect: 0.62 },
    hero: { cx: 900, cy: 620, w: 1300, opacity: 1, aspect: 0.58 },
  },
  slots: {
    side: { left: 150, top: 0, width: 640, height: 1080, align: "left", size: 84 },
    center: { left: 160, top: 0, width: 1600, height: 1080, align: "center", size: 116 },
    top: { left: 100, top: 50, width: 1720, height: 160, align: "center", size: 70 },
  },
  features: { layout: "list", size: 68 },
  brandSize: 90,
  // firmSize 72 keeps the three names on one line (measured 1493 px wide at 64).
  trust: { box: { left: 80, top: 0, width: 1760, height: 1080 }, captionSize: 68, firmSize: 72, firms: "row", starBox: 76 },
  end: {
    lockupSize: 150,
    ctaSize: 50,
    starBox: 46,
    lift: { dy: -372, scale: 0.62 },
    wall: { left: 90, top: 318, width: 1740, columns: 3, rowGap: 30, faceSize: 124, quoteSize: 36, metaSize: 23 },
  },
  chips: chips([
    [0.2, 0.15], [0.52, 0.1], [0.82, 0.18], [0.09, 0.42], [0.91, 0.46],
    [0.14, 0.68], [0.87, 0.7], [0.3, 0.88], [0.68, 0.88], [0.46, 0.25],
  ]),
  chipSize: 34,
  unit: 1,
};

// 9:16 keeps text and taps out of the bottom ~15% and right edge, where the
// YouTube Shorts UI (title, channel, like/comment buttons) sits.
const PORTRAIT: Layout = {
  phone: {
    offBottom: { cx: 540, cy: 2600, w: 520, opacity: 1 },
    main: { cx: 540, cy: 1105, w: 520, opacity: 1 },
    corner: { cx: 290, cy: 1390, w: 360, opacity: 1 },
    hero: { cx: 300, cy: 1370, w: 340, opacity: 1 },
  },
  browser: {
    offRight: { cx: 1700, cy: 870, w: 980, opacity: 1, aspect: 0.62 },
    offBottom: { cx: 540, cy: 2400, w: 1000, opacity: 1, aspect: 0.66 },
    side: { cx: 540, cy: 870, w: 980, opacity: 1, aspect: 0.62 },
    hero: { cx: 540, cy: 870, w: 1000, opacity: 1, aspect: 0.66 },
  },
  slots: {
    side: { left: 80, top: 160, width: 920, height: 380, align: "center", size: 76 },
    center: { left: 70, top: 0, width: 940, height: 1920, align: "center", size: 100 },
    top: { left: 80, top: 160, width: 920, height: 360, align: "center", size: 72 },
  },
  features: { layout: "single", size: 66 },
  brandSize: 90,
  trust: { box: { left: 60, top: 150, width: 960, height: 1450 }, captionSize: 58, firmSize: 72, firms: "column", starBox: 50 },
  end: {
    lockupSize: 140,
    ctaSize: 48,
    starBox: 40,
    lift: { dy: -700, scale: 0.62 },
    wall: { left: 40, top: 430, width: 1000, columns: 2, rowGap: 36, faceSize: 110, quoteSize: 32, metaSize: 21 },
  },
  chips: chips([
    [0.42, 0.2], [0.64, 0.26], [0.25, 0.32], [0.78, 0.35], [0.2, 0.66],
    [0.62, 0.64], [0.8, 0.72], [0.33, 0.74], [0.5, 0.81], [0.5, 0.13],
  ]),
  chipSize: 30,
  unit: 1,
};

export const layoutFor = (orientation: "landscape" | "portrait"): Layout => (orientation === "landscape" ? LANDSCAPE : PORTRAIT);

// ---------------------------------------------------------------------------
// Device moves. Same beats in both orientations, resolved against the layout.
// ---------------------------------------------------------------------------

export const phoneKeys = (L: Layout): Keyframe[] => [
  { at: 0, pose: L.phone.offBottom },
  { at: c.youGet - 0.1, pose: L.phone.main, dur: 0.9 },
  { at: c.everyStep - 0.5, pose: L.phone.corner, dur: 0.8 },
  { at: c.notes - 0.35, pose: L.phone.main, dur: 0.7 },
  { at: c.built - 0.4, pose: L.phone.offBottom, dur: 0.6 },
  { at: c.everything + 0.05, pose: L.phone.hero, dur: 0.9 },
  { at: c.outro - 0.45, pose: L.phone.offBottom, dur: 0.6 },
];

export const browserKeys = (L: Layout): Keyframe<BrowserPose>[] => [
  { at: 0, pose: L.browser.offRight },
  { at: c.everyStep - 0.5, pose: L.browser.side, dur: 0.85 },
  { at: c.notes - 0.4, pose: L.browser.offRight, dur: 0.6 },
  // Jump below the frame while invisible, then rise for the closing hero shot.
  { at: c.built, pose: L.browser.offBottom, dur: 0 },
  { at: c.everything - 0.1, pose: L.browser.hero, dur: 0.9 },
  { at: c.outro - 0.5, pose: L.browser.offBottom, dur: 0.6 },
];
