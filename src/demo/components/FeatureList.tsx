import React from "react";
import { interpolate } from "remotion";
import { theme } from "../../theme";
import { lerp, ramp, useSeconds } from "../motion";

export type Feature = { label: string; color: string; at: number };

const Tick: React.FC<{ size: number; color: string; p: number }> = ({ size, color, p }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.28,
      background: color,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      transform: `scale(${interpolate(p, [0, 1], [0.4, 1])})`,
    }}
  >
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24">
      <path
        d="M4 12.5 L9.5 18 L20 6.5"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        // Draw the tick on as the box lands.
        strokeDasharray={30}
        strokeDashoffset={30 * (1 - ramp(p, 0.4, 0.6, (x) => x))}
      />
    </svg>
  </div>
);

/**
 * The "everything included" run: each feature ticks in as it is spoken.
 * Landscape shows the whole list building up, the current item at full strength.
 * Portrait has room for one line at a time, so it shows the current item large
 * with a row of dots for the rest.
 */
export const FeatureList: React.FC<{
  items: readonly Feature[];
  from: number;
  to: number;
  size: number;
  layout: "list" | "single";
}> = ({ items, from, to, size, layout }) => {
  const t = useSeconds();
  if (t < from || t > to) return null;
  const exit = ramp(t, to - 0.22, 0.22);
  const current = items.reduce((acc, it, i) => (t >= it.at ? i : acc), 0);

  if (layout === "single") {
    const it = items[current];
    const p = ramp(t, it.at, 0.45);
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: size * 0.5, opacity: 1 - exit }}>
        <div key={current} style={{ display: "flex", alignItems: "center", gap: size * 0.3, opacity: p, transform: `translateY(${lerp(size * 0.4, 0, p)}px)` }}>
          <Tick size={size * 0.9} color={it.color} p={p} />
          <div style={{ fontFamily: theme.font.display, fontWeight: 600, fontSize: size, color: theme.color.ink, letterSpacing: -size * 0.012 }}>{it.label}</div>
        </div>
        <div style={{ display: "flex", gap: size * 0.18 }}>
          {items.map((d, i) => (
            <div
              key={d.label}
              style={{
                width: i === current ? size * 0.7 : size * 0.18,
                height: size * 0.18,
                borderRadius: size,
                background: t >= d.at ? d.color : theme.color.surface,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: size * 0.42, opacity: 1 - exit }}>
      {items.map((it, i) => {
        const p = ramp(t, it.at, 0.45);
        // Earlier items step back once the next one arrives, keeping the eye on the voice.
        const next = items[i + 1];
        const dim = next ? ramp(t, next.at, 0.3) : 0;
        return (
          <div
            key={it.label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: size * 0.32,
              opacity: p * lerp(1, 0.4, dim),
              transform: `translateX(${lerp(-size * 0.6, 0, p)}px)`,
            }}
          >
            <Tick size={size * 0.9} color={it.color} p={p} />
            <div style={{ fontFamily: theme.font.display, fontWeight: 600, fontSize: size, color: theme.color.ink, letterSpacing: -size * 0.012 }}>{it.label}</div>
          </div>
        );
      })}
    </div>
  );
};
