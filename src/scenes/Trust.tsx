import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Format } from "../format";
import { unit } from "../format";
import { theme } from "../theme";
import { Headline } from "../components/Headline";
import { AssetImg } from "../components/Asset";

// Vector logos only. Get official SVGs from each firm's brand/press page.
const logos = ["mishcon.svg", "slaughter-and-may.svg", "freshfields.svg", "dla-piper.svg"];

export const Trust: React.FC<{ format: Format }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = unit(format);
  const quoteIn = spring({ frame: frame - 4 * fps, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ background: theme.color.paper, padding: 120 * u, justifyContent: "center", gap: 80 * u }}>
      <div style={{ fontFamily: theme.font.body, fontSize: 36 * u, color: theme.color.muted }}>Trusted by trainees at</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 80 * u, alignItems: "center" }}>
        {logos.map((l, i) => {
          const s = spring({ frame: frame - i * 6, fps, config: { damping: 200 } });
          return (
            <AssetImg
              key={l}
              src={`assets/logos/${l}`}
              style={{ height: 64 * u, minWidth: 200 * u, opacity: s, transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)` }}
            />
          );
        })}
      </div>
      <div style={{ opacity: quoteIn, transform: `translateY(${interpolate(quoteIn, [0, 1], [30, 0])}px)` }}>
        <Headline text="I passed first time in the 1st quintile." size={80 * u} delay={4 * fps} />
        <div style={{ marginTop: 24 * u, fontFamily: theme.font.body, fontSize: 32 * u, color: theme.color.muted }}>Millie, SQE1 passer</div>
      </div>
    </AbsoluteFill>
  );
};
