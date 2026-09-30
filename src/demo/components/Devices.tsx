import React from "react";
import { theme } from "../../theme";
import { PHONE_ASPECT } from "../assets";
import type { Pose } from "../motion";

export type Viewport = { width: number; height: number };

/** Outer size of a phone drawn at width `w`. Exported so layouts can reason about fit. */
export const phoneSize = (w: number) => {
  const bezel = w * 0.032;
  const screen = { width: w - bezel * 2, height: (w - bezel * 2) * PHONE_ASPECT };
  return { bezel, screen, height: screen.height + bezel * 2 };
};

/**
 * A neutral phone drawn in CSS (no trademarked bezel), positioned by `pose`.
 * `children` receives the screen viewport size so content can scale to it.
 */
export const Phone: React.FC<{ pose: Pose; children: (vp: Viewport) => React.ReactNode }> = ({ pose, children }) => {
  if (pose.opacity <= 0.001) return null;
  const { bezel, screen, height } = phoneSize(pose.w);
  const radius = pose.w * 0.13;
  return (
    <div
      style={{
        position: "absolute",
        left: pose.cx - pose.w / 2,
        top: pose.cy - height / 2,
        width: pose.w,
        height,
        opacity: pose.opacity,
        background: theme.color.ink,
        borderRadius: radius,
        padding: bezel,
        boxSizing: "border-box",
        boxShadow: `0 ${pose.w * 0.08}px ${pose.w * 0.22}px rgba(60, 45, 20, 0.22), 0 ${pose.w * 0.01}px ${pose.w * 0.03}px rgba(0,0,0,0.18)`,
      }}
    >
      <div
        style={{
          position: "relative",
          width: screen.width,
          height: screen.height,
          borderRadius: radius - bezel,
          overflow: "hidden",
          background: theme.color.paper,
        }}
      >
        {children(screen)}
      </div>
    </div>
  );
};

/** Browser window height as a fraction of its width. */
export type BrowserPose = Pose & { aspect: number };

/**
 * A minimal browser window: title bar with traffic lights, rounded corners.
 * Drawn here rather than taken from the capture so it stays pinned while the
 * page scrolls underneath.
 */
export const Browser: React.FC<{ pose: BrowserPose; children: (vp: Viewport) => React.ReactNode }> = ({ pose, children }) => {
  if (pose.opacity <= 0.001) return null;
  const height = pose.w * pose.aspect;
  const bar = pose.w * 0.03;
  const dot = bar * 0.34;
  const viewport = { width: pose.w, height: height - bar };
  return (
    <div
      style={{
        position: "absolute",
        left: pose.cx - pose.w / 2,
        top: pose.cy - height / 2,
        width: pose.w,
        height,
        opacity: pose.opacity,
        borderRadius: pose.w * 0.012,
        overflow: "hidden",
        background: theme.color.paper,
        boxShadow: `0 ${pose.w * 0.03}px ${pose.w * 0.08}px rgba(60, 45, 20, 0.2), 0 0 0 1px rgba(0,0,0,0.06)`,
      }}
    >
      <div style={{ height: bar, background: "#ECE7DF", display: "flex", alignItems: "center", gap: dot * 0.7, paddingLeft: bar * 0.5 }}>
        {["#EC6A5E", "#F4BF4F", "#61C554"].map((c) => (
          <div key={c} style={{ width: dot, height: dot, borderRadius: dot, background: c }} />
        ))}
      </div>
      <div style={{ position: "relative", width: viewport.width, height: viewport.height, overflow: "hidden" }}>{children(viewport)}</div>
    </div>
  );
};
