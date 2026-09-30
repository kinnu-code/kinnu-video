import React from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Format } from "../format";
import { unit } from "../format";
import { theme } from "../theme";
import { Headline } from "../components/Headline";

export const CTA: React.FC<{ format: Format }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = unit(format);
  const btn = spring({ frame: frame - 1.2 * fps, fps, config: { damping: 14, stiffness: 120 } });
  return (
    <AbsoluteFill style={{ background: theme.color.ink, padding: 120 * u, justifyContent: "center", alignItems: "center", gap: 60 * u }}>
      <Headline text="Try Kinnu free for 7 days." size={112 * u} color={theme.color.paper} align="center" />
      <div style={{ fontFamily: theme.font.body, fontSize: 40 * u, color: theme.color.accentSoft }}>No credit card. Cancel anytime.</div>
      <div
        style={{
          transform: `scale(${btn})`,
          background: theme.color.accent,
          color: theme.color.paper,
          fontFamily: theme.font.body,
          fontSize: 44 * u,
          padding: `${28 * u}px ${64 * u}px`,
          borderRadius: 999,
        }}
      >
        Start my free trial
      </div>
    </AbsoluteFill>
  );
};
