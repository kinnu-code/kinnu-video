import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import type { Format, FormatId } from "./format";
import { FORMATS } from "./format";
import { CUTS, TRANSITION, type Beat } from "./beats";
import { Fade } from "./components/Fade";
import { theme } from "./theme";
import { Hook } from "./scenes/Hook";
import { Problem } from "./scenes/Problem";
import { Proof, type ProofSpec } from "./scenes/Proof";
import { Trust } from "./scenes/Trust";
import { CTA } from "./scenes/CTA";

// Copy and screenshot paths for each product moment live here, not in the scenes.
const PROOFS: Record<"mcq" | "lara" | "flashcards" | "mock" | "prepscore", ProofSpec> = {
  mcq: { headline: "Questions calibrated to the real exam.", screen: "assets/screens/mcq.png", zoom: { x: 0.5, y: 0.45, scale: 1.4, from: 1.5, to: 3.5 } },
  lara: { headline: "Lara explains why, without copy-pasting.", screen: "assets/screens/lara.png", zoom: { x: 0.5, y: 0.6, scale: 1.5, from: 1.5, to: 3.5 } },
  flashcards: { headline: "Spaced repetition decides when you review.", screen: "assets/screens/flashcards.png", zoom: { x: 0.5, y: 0.8, scale: 1.6, from: 1.2, to: 3 } },
  mock: { headline: "Mock exams scored against your real cohort.", screen: "assets/screens/mock.png", zoom: { x: 0.5, y: 0.35, scale: 1.4, from: 1.2, to: 3 } },
  prepscore: { headline: "See exactly where you stand.", screen: "assets/screens/prepscore.png", zoom: { x: 0.5, y: 0.3, scale: 1.5, from: 1.5, to: 4 } },
};

const Scene: React.FC<{ beat: Beat; format: Format }> = ({ beat, format }) => {
  switch (beat.id) {
    case "hook": return <Hook format={format} />;
    case "problem": return <Problem format={format} />;
    case "trust": return <Trust format={format} />;
    case "cta": return <CTA format={format} />;
    default: return <Proof format={format} spec={PROOFS[beat.id]} />;
  }
};

export const Video: React.FC<{ cut: FormatId }> = ({ cut }) => {
  const { fps } = useVideoConfig();
  const format = FORMATS[cut];
  const beats = CUTS[cut];
  let cursor = 0;
  return (
    <AbsoluteFill style={{ background: theme.color.paper }}>
      {beats.map((beat) => {
        const from = Math.round(cursor * fps);
        const dur = Math.round(beat.duration * fps);
        cursor += beat.duration - TRANSITION;
        return (
          <Sequence key={beat.id} from={from} durationInFrames={dur} name={beat.id}>
            <Fade seconds={TRANSITION} durationInFrames={dur}>
              <Scene beat={beat} format={format} />
            </Fade>
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
