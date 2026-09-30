/**
 * Deterministic screenshot capture from the live web app.
 * Run with: npm run capture   (needs: npx playwright install chromium)
 *
 * Why: screenshots taken by hand are the main reason product videos look cheap.
 * This captures at 3x device pixel ratio, a fixed viewport, a seeded demo account,
 * and a fixed clock, so every screen is sharp, consistent and re-capturable when the UI changes.
 */
import { chromium } from "playwright";

const BASE = process.env.KINNU_URL ?? "https://my.kinnu.xyz";
const OUT = "public/assets/screens";

// Route -> file. Use a demo account seeded with a realistic mid-course state
// (some progress, a healthy Prep Score, real-looking flashcard queue).
const SCREENS: Array<{ path: string; file: string; ready?: string }> = [
  { path: "/sqe/practice", file: "mcq.png" },
  { path: "/sqe/practice?lara=open", file: "lara.png" },
  { path: "/sqe/flashcards", file: "flashcards.png" },
  { path: "/sqe/mock/results", file: "mock.png" },
  { path: "/sqe/stats", file: "prepscore.png" },
];

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 393, height: 852 }, // iPhone-class logical size, 19.5:9 to match Device.tsx
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    storageState: process.env.KINNU_STORAGE_STATE, // export once after logging in with the demo account
    colorScheme: "light",
  });
  const page = await ctx.newPage();
  // Freeze time so "next review in 3 days" style copy never drifts between captures.
  await page.clock.install({ time: new Date("2026-09-23T09:00:00Z") });

  for (const s of SCREENS) {
    await page.goto(`${BASE}${s.path}`, { waitUntil: "networkidle" });
    if (s.ready) await page.waitForSelector(s.ready);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${OUT}/${s.file}`, fullPage: false });
    console.log("captured", s.file);
  }
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
