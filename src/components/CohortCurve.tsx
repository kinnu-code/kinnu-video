import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { theme } from "../theme";

/**
 * Draws a cohort distribution and a marker that climbs to the user's position.
 * Replace `bins` with real (anonymised) Prep Score distribution data.
 */
const bins = [1, 2, 4, 7, 11, 15, 18, 19, 17, 14, 10, 7, 4, 2, 1];

export const CohortCurve: React.FC<{ width: number; height: number; userPercentile: number; startAt?: number }> = ({
  width,
  height,
  userPercentile,
  startAt = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - startAt * fps;
  const draw = interpolate(t, [0, 1.6 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const marker = interpolate(t, [1.2 * fps, 2.6 * fps], [0, userPercentile], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });

  const max = Math.max(...bins);
  const pts = bins.map((v, i) => [ (i / (bins.length - 1)) * width, height - (v / max) * height * 0.9 ]);
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${d} L${width},${height} L0,${height} Z`;
  const mx = (marker / 100) * width;
  // Linear interpolation between bins so the marker dot sits on the curve, not above it.
  const fi = (marker / 100) * (bins.length - 1);
  const i0 = Math.min(Math.floor(fi), bins.length - 2);
  const my = pts[i0][1] + (pts[i0 + 1][1] - pts[i0][1]) * (fi - i0);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <path d={area} fill={theme.color.accentSoft} opacity={draw} />
      <path d={d} fill="none" stroke={theme.color.accent} strokeWidth={height * 0.02} strokeLinecap="round"
        pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
      <line x1={mx} x2={mx} y1={my} y2={height} stroke={theme.color.ink} strokeWidth={height * 0.012} strokeDasharray="8 8" opacity={marker > 0 ? 1 : 0} />
      <circle cx={mx} cy={my} r={height * 0.035} fill={theme.color.ink} opacity={marker > 0 ? 1 : 0} />
    </svg>
  );
};
