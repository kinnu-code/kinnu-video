/**
 * The screens the demo shows, by what they are rather than their file name.
 *
 * To swap a placeholder for a real capture, point `src` at the new file and
 * update its pixel size. Keep phone captures 375 wide (or 1125 at 3x, which
 * looks sharper in 9:16); long captures scroll inside the phone automatically.
 */
export type Screen = {
  /** path under public/ */
  src: string;
  /** natural pixel size of the file; scroll and tap positions use these units */
  width: number;
  height: number;
};

const demo = (file: string, width: number, height: number): Screen => ({ src: `assets/demo/${file}`, width, height });

export const SCREENS = {
  // Phone
  home: demo("png (3).png", 375, 812),
  studyPlan: demo("png (4).png", 375, 1302),
  studyPlanDone: demo("png (5).png", 375, 1438),
  prepScore: demo("png (6).png", 375, 3633),
  learn: demo("png (7).png", 375, 6090),
  mcq: demo("png (8).png", 375, 1596),
  mcqAnswered: demo("png (9).png", 375, 1747),
  flashcard: demo("svg (2).svg", 375, 812),
  flashcardRemembered: demo("svg (3).svg", 375, 812),
  // Web. The capture includes a macOS title bar, hidden by WEB_CHROME_CROP.
  web: demo("png (10).png", 2000, 4766),
} as const satisfies Record<string, Screen>;

export type ScreenId = keyof typeof SCREENS;

/** Height in source px of the title bar baked into the web capture. */
export const WEB_CHROME_CROP = 62;

/** Phone viewport aspect (height / width). Matches the 375x812 captures. */
export const PHONE_ASPECT = 812 / 375;

// Loudness-mastered copy of voiceover.mp3 (npm run master-audio). Re-run after replacing the mp3.
export const VOICEOVER = "assets/demo/voiceover-master.wav";

/** Music bed (ElevenLabs Music, 108 BPM, 43 s). Levels are set per beat in storyboard.ts (MUSIC). */
export const MUSIC = "assets/demo/music.mp3";
