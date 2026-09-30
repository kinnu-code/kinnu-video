# Kinnu product video

Kinnu's product videos, built in code with [Remotion](https://www.remotion.dev).

- **Product demo** (`src/demo/`): a voiceover-driven walkthrough of the SQE1 app on phone and web, for YouTube (16:9) and Shorts (9:16). Every cut is timed to a spoken word. See [Product demo](#product-demo-youtube--shorts).
- **Hero / Social / App Store cuts** (`src/scenes/`): the original 60 s beat-sheet video. Beat sheet is data (`src/beats.ts`), formats are data (`src/format.ts`), copy and screenshots per product moment live in `src/Video.tsx`.

All scenes read colours and fonts from `src/theme.ts`.

## Requirements

- Node 22+ (`npm install`)
- ffmpeg on the PATH (audio mastering, silence checks)
- [uv](https://docs.astral.sh/uv/) for the forced aligner, only when re-timing to a new voiceover

## Run

    npm install
    npm run studio          # live preview at localhost:3000, scrub every frame
    npm run render:hero     # 1920x1080, 60 s
    npm run render:social   # 1080x1920, ~28 s
    npm run render:appstore # placeholder size, check Apple's spec first

## Before the first real render

1. Paste Kinnu's design tokens into `src/theme.ts`.
2. Drop brand fonts into `public/assets/fonts` and enable `src/fonts.ts` (`npm i @remotion/fonts`).
3. Capture screenshots: `npx playwright install chromium`, log into a seeded demo account once, save storage state, then `KINNU_STORAGE_STATE=state.json npm run capture`.
4. Replace the placeholder cohort `bins` in `src/components/CohortCurve.tsx` with a real anonymised distribution.
5. Add firm logo SVGs to `public/assets/logos`.

## Editing the story

- Change timings or which beats appear in which cut: `src/beats.ts`.
- Change a headline or which screenshot a beat uses: `PROOFS` in `src/Video.tsx`.
- Zoom target for a screenshot: the `zoom` field, x/y are fractions of the image.

## Product demo (YouTube + Shorts)

A voiceover-driven walkthrough of the app on phone and web, rendered as two cuts from one storyboard:

    npm run render:demo          # out/kinnu-demo-youtube-16x9.mp4 (1920x1080)
    npm run render:demo-shorts   # out/kinnu-demo-shorts-9x16.mp4  (1080x1920, Shorts-safe layout)
    npm run captions             # out/kinnu-demo.srt, upload to YouTube with the video

Everything lives in `src/demo/`:

- `storyboard.ts`: the edit. Which screen shows when, taps, captions, device moves, and the 16:9 / 9:16 layouts.
- `cues.ts`: turns spoken phrases into times. Cuts are written as `CUES.practice`, never as raw seconds.
- Music: `public/assets/demo/music.mp3`, levels in `MUSIC_LEVELS` / `musicDbAt` in `storyboard.ts` (bed ~15 dB under the voice, lifts on "Kinnu," and after the last word). Swap the file for another track; re-check that its big hit still lands near the end card.
- `testimonials.ts`: quotes, faces (cut from the site screenshot) and where each face's mouth is, for the grin; the firm names; the Trustpilot rating.
- `assets.ts`: the screen captures by name. Swap a placeholder by pointing its entry at a new file (and updating its pixel size).

### New voiceover

1. Replace `public/assets/demo/voiceover.mp3` and put the exact script in `src/demo/script.txt`.
2. `npm run transcribe` rebuilds `src/demo/transcript.json`: a wav2vec2 forced aligner (`scripts/align_words.py`, run through `uv`) pins each script word to the audio. Without a script.txt (or with `-- --whisper`) local Whisper supplies the words instead; its own timings drift by up to 0.5 s, and it mishears (it heard "Anything" for "Everything"). First run downloads ~450 MB for the aligner (~500 MB more for Whisper).
3. `npm run master-audio` makes the -14 LUFS copy the video plays (compressor, gain, limiter).
4. `npm test`. It fails loudly if a phrase the storyboard hangs off is no longer spoken.
5. `npm run captions` for the updated .srt.

Python helper tests: `cd scripts && uv run --python 3.11 --with pytest pytest test_align_words.py`.

### Placeholders to replace before publishing

- LARA chat: drawn in code (`components/LaraSheet.tsx`); swap for a real capture.
- Kinnu mark: redrawn from screenshots (`components/Brand.tsx`); swap for the official SVG.
- Fonts: Zilla Slab and Figtree stand in for the brand faces (`src/fonts.ts`).
- The web capture and the Learn session show SAT content; the voiceover is about SQE1.

## Licence

Remotion requires a paid company licence for companies above a small size. Check remotion.dev/license.
