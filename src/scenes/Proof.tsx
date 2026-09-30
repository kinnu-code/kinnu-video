import React from "react";
import { AbsoluteFill } from "remotion";
import type { Format } from "../format";
import { unit } from "../format";
import { theme } from "../theme";
import { Headline } from "../components/Headline";
import { Device } from "../components/Device";

export type ProofSpec = {
  headline: string;
  screen: string; // path under public/
  zoom?: { x: number; y: number; scale: number; from: number; to: number };
};

/** One product moment: a device with a screenshot, a zoom into the thing that matters, one line of copy. */
export const Proof: React.FC<{ format: Format; spec: ProofSpec }> = ({ format, spec }) => {
  const u = unit(format);
  const portrait = format.orientation === "portrait";
  return (
    <AbsoluteFill
      style={{
        background: theme.color.paper,
        flexDirection: portrait ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 100 * u,
        padding: 100 * u,
      }}
    >
      <div style={{ flex: portrait ? "none" : 1, maxWidth: portrait ? "100%" : format.width * 0.4 }}>
        <Headline text={spec.headline} size={(portrait ? 72 : 88) * u} align={portrait ? "center" : "left"} />
      </div>
      <Device kind="phone" width={(portrait ? 560 : 420) * u} src={spec.screen} zoom={spec.zoom} />
    </AbsoluteFill>
  );
};
