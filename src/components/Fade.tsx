import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

/** Wraps a scene and fades it in/out over `seconds` at each end. */
export const Fade: React.FC<{ seconds: number; durationInFrames: number; children: React.ReactNode }> = ({
  seconds,
  durationInFrames,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = seconds * fps;
  const opacity = interpolate(frame, [0, f, durationInFrames - f, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
