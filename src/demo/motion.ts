/**
 * Small motion vocabulary for the demo: time in seconds, eased ramps, and
 * keyframed poses for the devices.
 *
 * Why seconds rather than frames: every cue comes from the transcript in
 * seconds, and keeping one unit avoids fps conversions scattered through scenes.
 */
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

/** Current playhead in seconds. */
export const useSeconds = (): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

/** Fast start, long settle. Reads as "confident" for UI moving into place. */
export const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
/** Symmetric, for scrolls and camera moves that should feel continuous. */
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

/** 0 before `start`, 1 after `start + dur`, eased in between. */
export const ramp = (t: number, start: number, dur: number, easing: (x: number) => number = EASE_OUT): number => {
  if (dur <= 0) return t >= start ? 1 : 0;
  return interpolate(t, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });
};

export const lerp = (a: number, b: number, p: number): number => a + (b - a) * p;

/** Where a device sits: centre point and outer width in px, plus opacity. */
export type Pose = { cx: number; cy: number; w: number; opacity: number };

/** Move to `pose`, starting at `at` seconds and settling `dur` seconds later (0 = jump). */
export type Keyframe<P extends Pose = Pose> = { at: number; pose: P; dur?: number };

const DEFAULT_MOVE = 0.8;

/** Blend every numeric field of two poses. */
const mix = <P extends Pose>(a: P, b: P, p: number): P => {
  const out: Record<string, number> = {};
  for (const key of Object.keys(a)) {
    out[key] = lerp((a as Record<string, number>)[key], (b as Record<string, number>)[key], p);
  }
  return out as P;
};

/**
 * Pose at time `t`. Each keyframe eases from wherever the previous keyframe
 * left the device, so moves chain without jumps even when they overlap.
 * Keyframes must be sorted by `at`.
 */
export const poseAt = <P extends Pose>(keys: readonly Keyframe<P>[], t: number): P => {
  let pose = keys[0].pose;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (t < k.at) break;
    pose = mix(pose, k.pose, ramp(t, k.at, k.dur ?? DEFAULT_MOVE));
  }
  return pose;
};
