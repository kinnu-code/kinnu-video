import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { Format } from "../format";
import { unit } from "../format";
import { theme } from "../theme";
import { Headline } from "../components/Headline";

const cards = ["Textbook", "Question bank", "Study notes", "Flashcards", "Mock exams", "Tutor chat"];

/** Scattered study materials collapse into one. */
export const Problem: React.FC<{ format: Format }> = ({ format }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = unit(format);
  const collapse = spring({ frame: frame - 2.5 * fps, fps, config: { damping: 18, stiffness: 90 } });
  const cx = format.width / 2;
  const cy = format.height / 2;
  const spread = Math.min(format.width, format.height) * 0.36;

  return (
    <AbsoluteFill style={{ background: theme.color.surface }}>
      {cards.map((label, i) => {
        const angle = (i / cards.length) * Math.PI * 2 - Math.PI / 2;
        const jitter = ((i * 37) % 11) / 11 - 0.5;
        const x = interpolate(collapse, [0, 1], [cx + Math.cos(angle) * spread * (1 + jitter * 0.3), cx]);
        const y = interpolate(collapse, [0, 1], [cy + Math.sin(angle) * spread * (1 + jitter * 0.3), cy]);
        const rot = interpolate(collapse, [0, 1], [jitter * 24, 0]);
        const enter = spring({ frame: frame - i * 4, fps, config: { damping: 200 } });
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${enter})`,
              width: 340 * u,
              height: 120 * u,
              background: theme.color.paper,
              borderRadius: theme.radius.card * u,
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: theme.font.body,
              fontSize: 36 * u,
              color: theme.color.ink,
            }}
          >
            {label}
          </div>
        );
      })}
      {/* Once the pile has collapsed, a Kinnu card lands on top so the stack resolves to the product. */}
      <div
        style={{
          position: "absolute",
          left: cx,
          top: cy,
          transform: `translate(-50%,-50%) scale(${interpolate(collapse, [0.85, 1], [0.6, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })})`,
          opacity: interpolate(collapse, [0.85, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          width: 340 * u,
          height: 120 * u,
          background: theme.color.accent,
          borderRadius: theme.radius.card * u,
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: theme.font.display,
          fontWeight: 600,
          fontSize: 44 * u,
          color: theme.color.paper,
        }}
      >
        Kinnu
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: format.height * 0.72, padding: `0 ${120 * u}px`, opacity: collapse }}>
        <Headline text="All in one place." size={88 * u} align="center" delay={2.5 * fps} />
      </div>
    </AbsoluteFill>
  );
};
