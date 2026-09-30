import React from "react";
import { interpolate } from "remotion";
import { theme } from "../../theme";
import { lerp, ramp, useSeconds } from "../motion";
import { FIRMS, TRUSTPILOT } from "../testimonials";
import { Caption } from "./Caption";

/** Colours measured from kinnu's own Trustpilot widget (trustpilot-source.png). */
const TP = { green: "#52B37F", grey: "#DCDCE5", ink: "#191919", font: "'Helvetica Neue', Helvetica, Arial, sans-serif" };

const STAR = "M12 2.6l2.75 6.3 6.85.6-5.2 4.5 1.55 6.7L12 17.2l-5.95 3.5 1.55-6.7-5.2-4.5 6.85-.6z";

/** One Trustpilot star box. `fill` is how much of it is green (0, 0.5 or 1), `p` its pop-in progress. */
const StarBox: React.FC<{ size: number; fill: number; p: number }> = ({ size, fill, p }) => (
  <div
    style={{
      width: size,
      height: size,
      background: `linear-gradient(90deg, ${TP.green} ${fill * 100}%, ${TP.grey} ${fill * 100}%)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transform: `scale(${interpolate(p, [0, 0.6, 1], [0.6, 1.12, 1])})`,
      opacity: interpolate(p, [0, 0.3], [0.35, 1], { extrapolateRight: "clamp" }),
    }}
  >
    <svg width={size * 0.78} height={size * 0.78} viewBox="0 0 24 24">
      <path d={STAR} fill="#FFFFFF" />
    </svg>
  </div>
);

/**
 * Kinnu's Trustpilot rating in the layout of their site widget:
 * "Excellent", five star boxes, the Trustpilot mark.
 * Stars fill left to right between `starsFrom` and `starsTo`; before that they sit grey.
 */
export const TrustpilotBar: React.FC<{ box: number; starsFrom: number; starsTo: number; logoAt: number }> = ({
  box,
  starsFrom,
  starsTo,
  logoAt,
}) => {
  const t = useSeconds();
  const logo = ramp(t, logoAt, 0.4);
  const step = (starsTo - starsFrom) / 5;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: box * 0.62, fontFamily: TP.font, color: TP.ink }}>
      <div style={{ fontSize: box * 0.78, fontWeight: 700, textDecoration: "underline", textUnderlineOffset: box * 0.12, textDecorationThickness: box * 0.05 }}>
        {TRUSTPILOT.label}
      </div>
      <div style={{ display: "flex", gap: box * 0.11 }}>
        {[0, 1, 2, 3, 4].map((i) => {
          const p = ramp(t, starsFrom + i * step, step * 1.4);
          // The rating is out of 5 in half stars: the last box is half green for 4.5.
          const green = Math.max(0, Math.min(1, TRUSTPILOT.stars - i));
          return <StarBox key={i} size={box} fill={p > 0.3 ? green : 0} p={p} />;
        })}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: box * 0.08, opacity: logo, transform: `translateX(${lerp(-box * 0.3, 0, logo)}px)` }}>
        <svg width={box * 0.9} height={box * 0.9} viewBox="0 0 24 24">
          <path d={STAR} fill={TP.green} />
        </svg>
        <div style={{ fontSize: box * 0.62, fontWeight: 500, letterSpacing: -box * 0.01 }}>Trustpilot</div>
      </div>
    </div>
  );
};

/** Sizes for the trust beat, per orientation. */
export type TrustLayout = {
  box: { left: number; top: number; width: number; height: number };
  captionSize: number;
  firmSize: number;
  firms: "row" | "column";
  starBox: number;
};

/**
 * "Trusted by trainees at Mishcon, Slaughters and Freshfields, and rated 4.7 on Trustpilot."
 * Each firm lands as it is named; the stars fill while "4.7" is spoken.
 */
export const TrustScene: React.FC<{
  L: TrustLayout;
  from: number;
  to: number;
  firmsAt: readonly number[];
  ratedAt: number;
  scoreAt: number;
  logoAt: number;
}> = ({ L, from, to, firmsAt, ratedAt, scoreAt, logoAt }) => {
  const t = useSeconds();
  if (t < from || t > to) return null;
  const exit = ramp(t, to - 0.25, 0.25);
  const bar = ramp(t, ratedAt, 0.45);
  const score = ramp(t, scoreAt, 0.4);
  return (
    <div
      style={{
        position: "absolute",
        ...L.box,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: L.firmSize * 0.55,
        opacity: 1 - exit,
        transform: `translateY(${-exit * 20}px)`,
      }}
    >
      <Caption text="Trusted by trainees at" from={from} to={Number.POSITIVE_INFINITY} size={L.captionSize} align="center" weight={500} />
      <div
        style={{
          display: "flex",
          flexDirection: L.firms === "row" ? "row" : "column",
          alignItems: "center",
          gap: L.firms === "row" ? L.firmSize * 0.7 : L.firmSize * 0.25,
        }}
      >
        {FIRMS.map((firm, i) => {
          const p = ramp(t, firmsAt[i], 0.5);
          return (
            <React.Fragment key={firm}>
              {L.firms === "row" && i > 0 && (
                <div style={{ width: L.firmSize * 0.14, height: L.firmSize * 0.14, borderRadius: 99, background: theme.color.accent, opacity: p }} />
              )}
              <div
                style={{
                  fontFamily: theme.font.display,
                  fontWeight: 700,
                  fontSize: L.firmSize,
                  letterSpacing: -L.firmSize * 0.01,
                  color: theme.color.ink,
                  whiteSpace: "nowrap",
                  opacity: p,
                  transform: `translateY(${lerp(L.firmSize * 0.5, 0, p)}px) scale(${lerp(0.94, 1, p)})`,
                }}
              >
                {firm}
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div
        style={{
          marginTop: L.firmSize * 0.35,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: L.starBox * 0.3,
          opacity: bar,
          transform: `translateY(${lerp(L.starBox * 0.6, 0, bar)}px)`,
        }}
      >
        <TrustpilotBar box={L.starBox} starsFrom={ratedAt + 0.15} starsTo={scoreAt + 0.7} logoAt={logoAt} />
        <div style={{ fontFamily: TP.font, fontSize: L.starBox * 0.46, color: theme.color.muted, opacity: score }}>
          TrustScore <b style={{ color: TP.ink }}>{TRUSTPILOT.score}</b> out of 5
        </div>
      </div>
    </div>
  );
};
