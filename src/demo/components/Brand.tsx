import React from "react";
import { interpolate } from "remotion";
import { theme } from "../../theme";
import { EASE_IN_OUT, lerp, ramp, useSeconds } from "../motion";
import { TESTIMONIALS } from "../testimonials";
import { TestimonialWall, type WallLayout } from "./Testimonials";
import { TrustpilotBar } from "./Trust";

/**
 * The Kinnu "K" mark: a black square split by a diagonal hairline into two
 * shapes. Redrawn from the app screenshots as a stand-in; replace the paths
 * with the official SVG when design shares it.
 */
export const KinnuMark: React.FC<{ size: number; color?: string }> = ({ size, color = theme.color.ink }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ display: "block" }}>
    <path d="M3 0 H100 V3 L59.5 43.5 Z" fill={color} />
    <path d="M0 3 L57 46.5 L100 97 V100 H0 Z" fill={color} />
  </svg>
);

/** Mark + "Kinnu" wordmark, springing in at `from` and fading out by `to`. */
export const BrandLockup: React.FC<{ from: number; to: number; size: number; align?: "left" | "center" }> = ({
  from,
  to,
  size,
  align = "left",
}) => {
  const t = useSeconds();
  if (t < from || t > to) return null;
  const mark = ramp(t, from, 0.5);
  const word = ramp(t, from + 0.12, 0.5);
  // `to` is Infinity on the end card, which holds to the last frame.
  const exit = Number.isFinite(to) ? ramp(t, to - 0.22, 0.22) : 0;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: align === "center" ? "center" : "flex-start",
        gap: size * 0.28,
        opacity: 1 - exit,
      }}
    >
      <div style={{ transform: `scale(${interpolate(mark, [0, 1], [0.6, 1])}) rotate(${interpolate(mark, [0, 1], [-8, 0])}deg)`, opacity: mark }}>
        <KinnuMark size={size} />
      </div>
      <div
        style={{
          fontFamily: theme.font.body,
          fontWeight: 600,
          fontSize: size * 0.72,
          letterSpacing: -size * 0.01,
          color: theme.color.ink,
          opacity: word,
          transform: `translateX(${interpolate(word, [0, 1], [-size * 0.2, 0])}px)`,
        }}
      >
        Kinnu
      </div>
    </div>
  );
};

export type EndLayout = {
  lockupSize: number;
  ctaSize: number;
  starBox: number;
  /** Where the lockup + CTA column moves when the testimonial wall arrives. */
  lift: { dy: number; scale: number };
  wall: WallLayout;
};

/**
 * Closing card, in two phases:
 * 1. With the voice ("Kinnu, try it free today"): lockup, CTA button and the Trustpilot rating.
 * 2. After the voice (`wallAt`): that column rises and the testimonial wall fills the frame,
 *    each face grinning as its card lands. Holds to the end for YouTube's end screen.
 */
export const EndCard: React.FC<{ from: number; ctaAt: number; wallAt: number; L: EndLayout }> = ({ from, ctaAt, wallAt, L }) => {
  const t = useSeconds();
  if (t < from) return null;
  const cta = ramp(t, ctaAt, 0.5);
  const rating = ramp(t, ctaAt + 0.35, 0.5);
  const rise = ramp(t, wallAt, 0.8, EASE_IN_OUT);
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: L.lockupSize * 0.34,
          transform: `translateY(${L.lift.dy * rise}px) scale(${lerp(1, L.lift.scale, rise)})`,
        }}
      >
        <BrandLockup from={from} to={Number.POSITIVE_INFINITY} size={L.lockupSize} align="center" />
        <div
          style={{
            background: theme.color.accent,
            color: "#FFFFFF",
            fontFamily: theme.font.body,
            fontWeight: 700,
            fontSize: L.ctaSize,
            padding: `${L.ctaSize * 0.48}px ${L.ctaSize * 1.2}px`,
            borderRadius: 999,
            boxShadow: `0 ${L.ctaSize * 0.28}px ${L.ctaSize * 0.8}px rgba(63, 143, 156, 0.35)`,
            opacity: cta,
            transform: `translateY(${interpolate(cta, [0, 1], [L.ctaSize * 0.6, 0])}px) scale(${interpolate(cta, [0, 1], [0.9, 1])})`,
          }}
        >
          Try it free today
        </div>
        <div style={{ opacity: rating, transform: `translateY(${lerp(L.starBox * 0.5, 0, rating)}px)` }}>
          <TrustpilotBar box={L.starBox} starsFrom={ctaAt + 0.45} starsTo={ctaAt + 1.2} logoAt={ctaAt + 0.6} />
        </div>
      </div>
      <TestimonialWall items={TESTIMONIALS} from={wallAt + 0.35} L={L.wall} />
    </>
  );
};
