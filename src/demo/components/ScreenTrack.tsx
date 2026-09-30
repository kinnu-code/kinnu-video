import React from "react";
import { AssetImg } from "../../components/Asset";
import { theme } from "../../theme";
import { SCREENS, type ScreenId } from "../assets";
import { EASE_IN_OUT, EASE_OUT, lerp, ramp, useSeconds } from "../motion";
import type { Viewport } from "./Devices";

/** A scroll held at one offset, or eased between two offsets over [start, end] seconds. */
export type Scroll = number | { from: number; to: number; start: number; end: number };

export type Tap = { at: number; x: number; y: number };

/**
 * One screen in a device's running order.
 * - `enter` (default "cut"): "push" for navigating to a new screen, "fade" for a state change on the
 *   same screen (answer revealed, tasks ticked off), "cut" for no transition.
 * - `scroll` and `taps` are in the screen file's own pixel units, so they stay
 *   correct at any render size.
 */
export type ScreenStep = {
  at: number;
  screen: ScreenId;
  enter?: "push" | "fade" | "cut";
  scroll?: Scroll;
  taps?: readonly Tap[];
};

/**
 * Seconds per transition. State changes ("fade") are near-instant, as in the app:
 * the two screens usually differ in layout, and a slow dissolve shows both sets of
 * text ghosted over each other.
 */
const TRANSITION = { push: 0.45, fade: 0.18, cut: 0 } as const;
const TAP_LIFE = 0.55;

export const scrollAt = (scroll: Scroll | undefined, t: number): number => {
  if (scroll === undefined) return 0;
  if (typeof scroll === "number") return scroll;
  return lerp(scroll.from, scroll.to, ramp(t, scroll.start, scroll.end - scroll.start, EASE_IN_OUT));
};

/** Index of the step showing at `t` (the last one that has started), or -1 before the first. */
export const activeStep = (steps: readonly ScreenStep[], t: number): number => {
  let idx = -1;
  steps.forEach((s, i) => {
    if (s.at <= t) idx = i;
  });
  return idx;
};

/** A touch indicator: a soft dot that presses in, then a ring that expands and fades. */
const TapRipple: React.FC<{ x: number; y: number; age: number; size: number }> = ({ x, y, age, size }) => {
  const press = ramp(age, 0, 0.12);
  const release = ramp(age, 0.18, TAP_LIFE - 0.18);
  const ring = ramp(age, 0.1, 0.4);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: size,
          background: "rgba(20,20,20,0.28)",
          border: `${size * 0.06}px solid rgba(255,255,255,0.9)`,
          boxSizing: "border-box",
          transform: `scale(${lerp(1.3, 0.85, press)})`,
          opacity: press * (1 - release),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: size,
          border: `${size * 0.05}px solid ${theme.color.accent}`,
          boxSizing: "border-box",
          transform: `scale(${lerp(0.8, 2.2, ring)})`,
          opacity: (1 - ring) * 0.9,
        }}
      />
    </>
  );
};

/**
 * Plays a device's running order inside its viewport: pushes and fades between
 * screens, scrolls long captures, and shows taps.
 * `cropTop` hides rows at the top of every capture (the web capture's baked-in title bar).
 */
export const ScreenTrack: React.FC<{ steps: readonly ScreenStep[]; viewport: Viewport; cropTop?: number }> = ({
  steps,
  viewport,
  cropTop = 0,
}) => {
  const t = useSeconds();
  const idx = activeStep(steps, t);
  if (idx === -1) return null;

  const layer = (step: ScreenStep, style: React.CSSProperties, key: string) => {
    const screen = SCREENS[step.screen];
    const scale = viewport.width / screen.width;
    const offset = (scrollAt(step.scroll, t) + cropTop) * scale;
    return (
      <div key={key} style={{ position: "absolute", inset: 0, background: theme.color.paper, ...style }}>
        <AssetImg
          src={screen.src}
          style={{ position: "absolute", left: 0, top: -offset, width: viewport.width, height: screen.height * scale }}
        />
        {(step.taps ?? [])
          .filter((tap) => t >= tap.at && t < tap.at + TAP_LIFE)
          .map((tap) => (
            <TapRipple
              key={tap.at}
              x={tap.x * scale}
              y={tap.y * scale - offset}
              age={t - tap.at}
              size={44 * scale}
            />
          ))}
      </div>
    );
  };

  const current = steps[idx];
  const previous = idx > 0 ? steps[idx - 1] : undefined;
  const p = ramp(t, current.at, TRANSITION[current.enter ?? "cut"], EASE_OUT);
  const transitioning = previous && current.enter !== "cut" && p < 1;

  if (!transitioning) return layer(current, {}, `s${idx}`);

  if (current.enter === "fade") {
    return (
      <>
        {layer(previous, {}, `s${idx - 1}`)}
        {layer(current, { opacity: p }, `s${idx}`)}
      </>
    );
  }
  // Push: new screen slides in from the right, old one drifts left under a light shade,
  // the same motion as native navigation.
  return (
    <>
      {layer(previous, { transform: `translateX(${-p * viewport.width * 0.3}px)`, filter: `brightness(${1 - p * 0.08})` }, `s${idx - 1}`)}
      {layer(current, { transform: `translateX(${(1 - p) * viewport.width}px)`, boxShadow: "-12px 0 30px rgba(0,0,0,0.12)" }, `s${idx}`)}
    </>
  );
};
