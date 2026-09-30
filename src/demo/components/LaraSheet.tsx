import React from "react";
import { theme } from "../../theme";
import { lerp, ramp, useSeconds } from "../motion";
import type { Viewport } from "./Devices";

/** Width the sheet is laid out at, matching the 375-wide phone captures; scaled to the viewport. */
const APP_WIDTH = 375;

const Bubble: React.FC<{ from: "user" | "lara"; p: number; children: React.ReactNode }> = ({ from, p, children }) => (
  <div
    style={{
      alignSelf: from === "user" ? "flex-end" : "flex-start",
      maxWidth: 270,
      padding: "10px 14px",
      borderRadius: 18,
      borderBottomRightRadius: from === "user" ? 6 : 18,
      borderBottomLeftRadius: from === "lara" ? 6 : 18,
      background: from === "user" ? theme.color.accent : theme.color.surface,
      color: from === "user" ? "#FFFFFF" : theme.color.ink,
      fontFamily: theme.font.body,
      fontSize: 15,
      lineHeight: 1.4,
      opacity: p,
      transform: `translateY(${lerp(12, 0, p)}px) scale(${lerp(0.96, 1, p)})`,
      transformOrigin: from === "user" ? "right bottom" : "left bottom",
    }}
  >
    {children}
  </div>
);

/** LARA's face: the app's multi-colour loop reduced to rings and a smile. */
const LaraAvatar: React.FC = () => (
  <svg width={36} height={36} viewBox="0 0 36 36">
    <circle cx={18} cy={18} r={15} fill="none" stroke={theme.color.learn} strokeWidth={3} />
    <circle cx={17} cy={19} r={13} fill="none" stroke={theme.color.practice} strokeWidth={2.5} opacity={0.9} />
    <circle cx={14} cy={16} r={1.6} fill={theme.color.ink} />
    <circle cx={21} cy={16} r={1.6} fill={theme.color.ink} />
    <path d="M13 21 Q17.5 25 22 21" fill="none" stroke={theme.color.ink} strokeWidth={1.6} strokeLinecap="round" />
  </svg>
);

/**
 * STAND-IN for the LARA tutor chat. No LARA screenshot was supplied, so this is
 * drawn in code from the app's colours. Replace it with a real capture (add it to
 * SCREENS and push to it in the timeline) before publishing.
 */
export const LaraSheet: React.FC<{ viewport: Viewport; at: number }> = ({ viewport, at }) => {
  const t = useSeconds();
  if (t < at) return null;
  const scale = viewport.width / APP_WIDTH;
  const sheet = ramp(t, at, 0.5);
  const ask = ramp(t, at + 0.25, 0.35);
  const typing = t >= at + 0.45 && t < at + 0.85;
  const reply = ramp(t, at + 0.85, 0.4);
  const height = 470;

  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: `rgba(20,20,20,${0.25 * sheet})` }} />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: viewport.height - height * scale * sheet,
          width: APP_WIDTH,
          height,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          background: "#FFFFFF",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: "0 -8px 30px rgba(0,0,0,0.12)",
          padding: "12px 20px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 4, background: "#E2DDD5" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LaraAvatar />
          <div style={{ fontFamily: theme.font.body }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: theme.color.ink }}>LARA</div>
            <div style={{ fontSize: 13, color: theme.color.muted }}>Your SQE tutor</div>
          </div>
        </div>
        <div style={{ height: 1, background: "#EFEAE2" }} />
        <Bubble from="user" p={ask}>
          Why is C wrong?
        </Bubble>
        {typing && (
          <div style={{ display: "flex", gap: 5, padding: "12px 14px", background: theme.color.surface, borderRadius: 18, alignSelf: "flex-start" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 7,
                  background: theme.color.muted,
                  opacity: 0.35 + 0.65 * Math.abs(Math.sin((t - at) * 9 - i * 0.9)),
                }}
              />
            ))}
          </div>
        )}
        {reply > 0 && (
          <Bubble from="lara" p={reply}>
            There's no court approval route. Under s.157 Companies Act 2006 a director must be at least 16, so TechGear has to
            wait. That's why B is correct.
          </Bubble>
        )}
      </div>
    </>
  );
};
