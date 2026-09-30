# Instructions for coding agents

This repo renders Kinnu's product videos with Remotion. The main project is the voiceover-driven demo in `src/demo/`. Read [README.md](README.md) before changing anything: it has the pipeline, a map of every file, recipes for common tasks and known gotchas. This file is the short version of the rules.

## Before you start

```bash
npm install
npm test && npm run typecheck   # both must pass before and after your change
```

Requirements: Node 22+, ffmpeg/ffprobe on the PATH, and `uv` only if you re-time to a new voiceover.

## Where things are

- The edit (what's on screen when, device moves, captions, music levels, layouts): `src/demo/storyboard.ts`.
- Word timings: `src/demo/transcript.json`, generated. Phrase lookups: `CUES` in `src/demo/cues.ts`.
- The words spoken: `src/demo/script.txt`. Screens: `src/demo/assets.ts`. Testimonials, firms, Trustpilot: `src/demo/testimonials.ts`.

## Rules

1. **Never hard-code a time in seconds.** Hang every cut, caption and move off `CUES` (for example `c.practice - 0.15`). If you need a new moment, add a phrase to `CUES`.
2. **Never hand-edit `transcript.json` or `voiceover-master.wav`.** Regenerate them: `npm run transcribe`, then `npm run master-audio`. Both are needed after any change to `voiceover.mp3` or `script.txt`.
3. **`script.txt` must match the voiceover word for word.** The aligner fits whatever words it's given, so a mismatch only shows up as wrong timings.
4. **Don't invent product claims, prices, stats or testimonials**, and don't reword quotes; they are verbatim from the website. On-screen copy comes from the voiceover or from the user.
5. **Keep both cuts working.** Layout values live in `LANDSCAPE` and `PORTRAIT` in `storyboard.ts`; a new beat needs both. The 9:16 layout keeps text and taps out of the bottom ~15% and right edge (YouTube Shorts UI).
6. **Screenshot dimensions in `SCREENS` must match the files**; a test checks this. Scroll and tap positions are in the screenshot's own pixels.
7. **Don't commit `out/`** (renders are local) or model caches (`.whisper/`). Both are git-ignored.
8. **Ask before** pushing to `main`, publishing anything, or deleting renders someone may want (rename old renders instead, e.g. `-script1.mp4`).

## Verify every visual change by looking at it

Tests catch timing and data errors, not what the frame looks like. After a change that affects the picture:

```bash
npm run render:demo                                   # ~20 s
npm run sheet -- out/kinnu-demo-youtube-16x9.mp4 <seconds around your change...>
```

Open `out/sheet.png` and check it: nothing overlapping or clipped, no dashed "missing: file" boxes, text readable, the moment lines up with the word. Do the same for `out/kinnu-demo-shorts-9x16.mp4` if you touched layout. After audio changes, check loudness (command in the README): about -14 LUFS integrated.

## Code conventions

- TypeScript strict; no `any` (use proper types or `unknown`). `const` by default. Named exports. async/await.
- Comments explain *why*, not what. JSDoc on exported functions and components.
- Tests alongside new code (Vitest for TS in `src/**/*.test.ts` and `scripts/**/*.test.ts`; pytest for `scripts/*.py`). Test behaviour and edge cases, not just the happy path.
- Keep pure logic (timing maths, parsing, layout calculations) out of React components so it can be tested.
- Python: PEP 8, type hints, f-strings, pathlib.
- Commits: short imperative subject ("Add trust beat to Shorts layout"), one logical change per commit.
