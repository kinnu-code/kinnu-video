/**
 * Loads the display and body fonts before the first frame renders.
 *
 * Why: without this, early frames render in fallback glyphs. @remotion/google-fonts
 * blocks rendering (delayRender) until each font has loaded, so importing this
 * module once from the root is enough.
 *
 * Zilla Slab and Figtree are the closest Google Fonts to the Kinnu app's heading
 * and body faces. To use the real brand files instead, drop them in
 * public/assets/fonts and load them with @remotion/fonts here.
 */
import { loadFont as loadDisplay } from "@remotion/google-fonts/ZillaSlab";
import { loadFont as loadBody } from "@remotion/google-fonts/Figtree";

const display = loadDisplay("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
const body = loadBody("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });

export const fontsReady = Promise.all([display.waitUntilDone(), body.waitUntilDone()]);
