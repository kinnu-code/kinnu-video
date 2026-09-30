import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import { FORMATS, type FormatId } from "./format";
import { CUTS, totalSeconds } from "./beats";
import { Demo } from "./demo/Demo";
import { DEMO_SECONDS } from "./demo/storyboard";
import "./fonts";

const comp = (id: string, cut: FormatId) => {
  const f = FORMATS[cut];
  return (
    <Composition
      key={id}
      id={id}
      component={Video}
      durationInFrames={Math.round(totalSeconds(CUTS[cut]) * f.fps)}
      fps={f.fps}
      width={f.width}
      height={f.height}
      defaultProps={{ cut }}
    />
  );
};

export const RemotionRoot: React.FC = () => (
  <>
    {comp("Hero", "hero")}
    {comp("Social", "social")}
    {comp("AppStore", "appstore")}
    {/* Voiceover-driven product demo: YouTube (16:9) and Shorts (9:16) from one storyboard. */}
    {(["hero", "social"] as const).map((cut) => {
      const f = FORMATS[cut];
      return (
        <Composition
          key={cut}
          id={cut === "hero" ? "DemoYouTube" : "DemoShorts"}
          component={Demo}
          durationInFrames={DEMO_SECONDS * f.fps}
          fps={f.fps}
          width={f.width}
          height={f.height}
          defaultProps={{ cut }}
        />
      );
    })}
  </>
);
