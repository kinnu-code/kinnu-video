import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

/** Word-by-word rise. Kept to one effect so the type does the work. */
export const Headline: React.FC<{ text: string; size: number; color?: string; align?: "left" | "center"; delay?: number }> = ({
  text,
  size,
  color = theme.color.ink,
  align = "left",
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  return (
    <div
      style={{
        fontFamily: theme.font.display,
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1.05,
        letterSpacing: -size * 0.02,
        color,
        textAlign: align,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        gap: `0 ${size * 0.25}px`,
      }}
    >
      {words.map((w, i) => {
        const s = spring({ frame: frame - delay - i * 3, fps, config: { damping: 200 } });
        const y = interpolate(s, [0, 1], [size * 0.6, 0]);
        return (
          <span key={i} style={{ display: "inline-block", transform: `translateY(${y}px)`, opacity: s }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};
