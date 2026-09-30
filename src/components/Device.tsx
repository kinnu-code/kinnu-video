import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { theme } from "../theme";
import { AssetImg } from "./Asset";

type Zoom = {
  /** 0..1 fractions of the screenshot */
  x: number;
  y: number;
  scale: number;
  /** seconds into the scene to start and finish the zoom */
  from: number;
  to: number;
};

type Props = {
  /** path under public/, e.g. "assets/screens/mcq@3x.png" */
  src: string;
  kind: "phone" | "laptop";
  /** rendered width in px */
  width: number;
  zoom?: Zoom;
};

/**
 * A neutral device frame drawn in CSS, so it is never a copyrighted bezel and
 * it scales cleanly to any resolution. Screenshot is object-fit: cover, so
 * capture at the same aspect ratio as the frame.
 */
export const Device: React.FC<Props> = ({ src, kind, width, zoom }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const aspect = kind === "phone" ? 19.5 / 9 : 10 / 16;
  const height = width * aspect;
  const bezel = kind === "phone" ? width * 0.04 : width * 0.015;
  const radius = kind === "phone" ? width * 0.14 : width * 0.03;

  let transform = "none";
  if (zoom) {
    const t = interpolate(frame, [zoom.from * fps, zoom.to * fps], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });
    const s = 1 + (zoom.scale - 1) * t;
    transform = `scale(${s})`;
  }

  return (
    <div
      style={{
        width,
        height,
        background: theme.color.ink,
        borderRadius: radius,
        padding: bezel,
        boxShadow: "0 40px 120px rgba(0,0,0,0.25)",
      }}
    >
      <div style={{ width: "100%", height: "100%", borderRadius: radius - bezel, overflow: "hidden", background: theme.color.paper }}>
        <AssetImg
          src={src}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform,
            transformOrigin: zoom ? `${zoom.x * 100}% ${zoom.y * 100}%` : "center",
          }}
        />
      </div>
    </div>
  );
};
