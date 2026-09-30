import React from "react";
import { theme } from "../../theme";
import { lerp, ramp, useSeconds } from "../motion";

/**
 * Subject chips orbiting the "Built specifically for SQE1" line. Positions are
 * fractions of the frame, hand-placed per orientation so no chip covers the headline.
 */
export type Chip = { label: string; x: number; y: number };

const TINTS = [theme.color.learn, theme.color.practice, theme.color.flashcards, theme.color.accent];

export const SubjectCloud: React.FC<{ chips: readonly Chip[]; from: number; to: number; width: number; height: number; size: number }> = ({
  chips,
  from,
  to,
  width,
  height,
  size,
}) => {
  const t = useSeconds();
  if (t < from || t > to) return null;
  return (
    <>
      {chips.map((c, i) => {
        const inP = ramp(t, from + i * 0.07, 0.55);
        const outP = ramp(t, to - 0.35 + (i % 3) * 0.04, 0.3);
        // Slow individual drift so the cloud feels alive without pulling focus.
        const drift = Math.sin((t - from) * 1.3 + i * 1.7) * size * 0.25;
        const tint = TINTS[i % TINTS.length];
        return (
          <div
            key={c.label}
            style={{
              position: "absolute",
              left: c.x * width,
              top: c.y * height + drift,
              transform: `translate(-50%, -50%) scale(${lerp(0.6, 1, inP) * lerp(1, 0.8, outP)})`,
              opacity: inP * (1 - outP),
              padding: `${size * 0.42}px ${size * 0.8}px`,
              borderRadius: 999,
              background: `${tint}33`,
              border: `2px solid ${tint}`,
              fontFamily: theme.font.body,
              fontWeight: 600,
              fontSize: size,
              color: theme.color.ink,
              whiteSpace: "nowrap",
            }}
          >
            {c.label}
          </div>
        );
      })}
    </>
  );
};
