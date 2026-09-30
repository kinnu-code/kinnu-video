import React from "react";
import { interpolate } from "remotion";
import { AssetImg } from "../../components/Asset";
import { theme } from "../../theme";
import { EASE_IN_OUT, lerp, ramp, useSeconds } from "../motion";
import { FACE_SIZE, FACE_SKIN, type Face, type Testimonial } from "../testimonials";

/**
 * The mouth, drawn in the face image's own pixels around its centre.
 * At p = 0 it matches the original closed smile; by p = 1 it is a wide open
 * grin with a tongue. Built from one curve so every in-between reads as a smile.
 */
const Mouth: React.FC<{ p: number; id: string }> = ({ p, id }) => {
  const halfW = lerp(7.5, 11, p);
  const lift = lerp(0, 2, p); // corners rise as the smile widens
  const sag = lerp(3, 8.5, p); // how far the lower lip drops
  const open = ramp(p, 0.25, 0.75, EASE_IN_OUT);
  // Quadratic control points: the lower lip passes through `sag` at its midpoint;
  // the upper lip starts on the lower lip (closed) and flattens as the mouth opens.
  const lowerCtrl = 2 * sag + lift;
  const upperCtrl = lerp(lowerCtrl, 1 - lift, open);
  const d = `M ${-halfW} ${-lift} Q 0 ${upperCtrl} ${halfW} ${-lift} Q 0 ${lowerCtrl} ${-halfW} ${-lift} Z`;
  return (
    <>
      <defs>
        <clipPath id={id}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill="#141414" stroke="#141414" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round" />
      <ellipse cx={0} cy={sag * 0.95} rx={halfW * 0.55} ry={sag * 0.45} fill="#E58C8C" clipPath={`url(#${id})`} opacity={open} />
    </>
  );
};

/**
 * A testimonial face that pops in at `landAt` and breaks into a grin at `smileAt`.
 * The original mouth is painted over with the face's fill colour and redrawn.
 */
export const SmilingFace: React.FC<{ face: Face; size: number; landAt: number; smileAt: number; id: string }> = ({
  face,
  size,
  landAt,
  smileAt,
  id,
}) => {
  const t = useSeconds();
  const land = ramp(t, landAt, 0.5);
  const smile = ramp(t, smileAt, 0.45);
  // A little hop and head tilt as the grin lands, then a slow idle bob.
  const hop = Math.sin(Math.min(1, ramp(t, smileAt, 0.5, (x) => x)) * Math.PI);
  const idle = Math.sin((t - smileAt) * 2.2 + face.mouth.x) * (t > smileAt ? 1 : 0);
  const { x, y, tilt } = face.mouth;
  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        opacity: land,
        transform: `translateY(${-hop * size * 0.06 + idle * size * 0.01}px) scale(${lerp(0.7, 1, land) * (1 + hop * 0.05)}) rotate(${hop * 4}deg)`,
      }}
    >
      <AssetImg src={face.src} style={{ position: "absolute", inset: 0, width: size, height: size }} />
      <svg width={size} height={size} viewBox={`0 0 ${FACE_SIZE} ${FACE_SIZE}`} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${x} ${y}) rotate(${tilt * (1 - smile)})`}>
          {/* Paint out the original mouth (centred on (x, y)), then draw ours. Its corners
              sit ~2 px above that centre, as the original's do. */}
          <ellipse cx={0} cy={0} rx={11} ry={6} fill={FACE_SKIN} />
          <g transform="translate(0 -2.2)">
            <Mouth p={smile} id={`${id}-mouth`} />
          </g>
        </g>
      </svg>
    </div>
  );
};

export type WallLayout = {
  left: number;
  top: number;
  width: number;
  columns: number;
  rowGap: number;
  faceSize: number;
  quoteSize: number;
  metaSize: number;
};

/**
 * The testimonial grid from kinnu's site: face, quote, name and role. Cards
 * land one after another from `from`; each face grins just after its card lands.
 */
export const TestimonialWall: React.FC<{ items: readonly Testimonial[]; from: number; L: WallLayout }> = ({ items, from, L }) => {
  const t = useSeconds();
  if (t < from) return null;
  const colWidth = L.width / L.columns;
  return (
    <div
      style={{
        position: "absolute",
        left: L.left,
        top: L.top,
        width: L.width,
        display: "grid",
        gridTemplateColumns: `repeat(${L.columns}, ${colWidth}px)`,
        rowGap: L.rowGap,
      }}
    >
      {items.map((item, i) => {
        const landAt = from + i * 0.22;
        const p = ramp(t, landAt, 0.5);
        return (
          <div
            key={item.name}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: `0 ${colWidth * 0.06}px`,
              opacity: p,
              transform: `translateY(${interpolate(p, [0, 1], [L.quoteSize * 0.8, 0])}px)`,
            }}
          >
            <SmilingFace face={item.face} size={L.faceSize} landAt={landAt} smileAt={landAt + 0.45} id={`face-${i}`} />
            <div
              style={{
                marginTop: L.quoteSize * 0.35,
                fontFamily: theme.font.display,
                fontWeight: 400,
                fontSize: L.quoteSize,
                lineHeight: 1.25,
                color: theme.color.ink,
              }}
            >
              “{item.quote}”
            </div>
            <div style={{ marginTop: L.quoteSize * 0.35, fontFamily: theme.font.body, fontSize: L.metaSize, lineHeight: 1.35, color: theme.color.muted }}>
              {item.name}
              <br />
              {item.role}
            </div>
          </div>
        );
      })}
    </div>
  );
};
