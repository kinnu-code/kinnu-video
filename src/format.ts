export type FormatId = "hero" | "social" | "appstore";

export type Format = {
  id: FormatId;
  width: number;
  height: number;
  fps: number;
  /** portrait layouts stack, landscape layouts sit side by side */
  orientation: "landscape" | "portrait";
};

export const FORMATS: Record<FormatId, Format> = {
  // Landing page hero. 16:9, plays muted and looped, so it must read without sound.
  hero: { id: "hero", width: 1920, height: 1080, fps: 30, orientation: "landscape" },
  // Paid social. 9:16, first two seconds decide everything.
  social: { id: "social", width: 1080, height: 1920, fps: 30, orientation: "portrait" },
  // App Store preview. CHECK Apple's current spec for exact device resolutions,
  // duration limits and content rules before rendering this one. Placeholder size.
  appstore: { id: "appstore", width: 1080, height: 1920, fps: 30, orientation: "portrait" },
};

/** Scale factor so that layouts designed at 1080 short-edge look right in every format. */
export const unit = (f: Format) => Math.min(f.width, f.height) / 1080;
