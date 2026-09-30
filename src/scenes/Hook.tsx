import React from "react";
import { AbsoluteFill } from "remotion";
import type { Format } from "../format";
import { unit } from "../format";
import { theme } from "../theme";
import { Headline } from "../components/Headline";
import { CohortCurve } from "../components/CohortCurve";

export const Hook: React.FC<{ format: Format }> = ({ format }) => {
  const u = unit(format);
  const portrait = format.orientation === "portrait";
  return (
    <AbsoluteFill style={{ background: theme.color.paper, padding: 120 * u, justifyContent: "flex-start", paddingTop: format.height * (portrait ? 0.2 : 0.14) }}>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, opacity: 0.9 }}>
        <CohortCurve width={format.width} height={format.height * (portrait ? 0.35 : 0.45)} userPercentile={88} startAt={0.8} />
      </div>
      <Headline text="Knowing that you'll pass, before you pass." size={(portrait ? 96 : 128) * u} />
    </AbsoluteFill>
  );
};
