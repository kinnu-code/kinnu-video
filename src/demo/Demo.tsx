/**
 * The product demo: voiceover-driven walkthrough of Kinnu on phone and web.
 * Rendered as two cuts from the same storyboard, 16:9 for YouTube and 9:16 for Shorts.
 */
import React from "react";
import { AbsoluteFill, Audio, staticFile, useVideoConfig } from "remotion";
import { theme } from "../theme";
import type { FormatId } from "../format";
import { FORMATS } from "../format";
import { MUSIC, VOICEOVER, WEB_CHROME_CROP } from "./assets";
import { BrandLockup, EndCard } from "./components/Brand";
import { Caption } from "./components/Caption";
import { Browser, Phone } from "./components/Devices";
import { FeatureList } from "./components/FeatureList";
import { LaraSheet } from "./components/LaraSheet";
import { ScreenTrack } from "./components/ScreenTrack";
import { SubjectCloud } from "./components/SubjectCloud";
import { TrustScene } from "./components/Trust";
import { poseAt, useSeconds } from "./motion";
import {
  CAPTIONS,
  END_CARD,
  FEATURES,
  LARA,
  PHONE_STEPS,
  SUBJECT_CLOUD,
  TRUST,
  WEB_STEPS,
  browserKeys,
  musicDbAt,
  layoutFor,
  phoneKeys,
  type Layout,
  type Slot,
} from "./storyboard";

/** Cream page with the faint dot grid the web app uses behind its cards. */
const Backdrop: React.FC = () => (
  <AbsoluteFill
    style={{
      background: theme.color.paper,
      backgroundImage: "radial-gradient(rgba(140, 120, 90, 0.16) 1.6px, transparent 1.6px)",
      backgroundSize: "30px 30px",
    }}
  />
);

/**
 * Captions for one slot. Captions that share a slot and an end time form a
 * group (the two-line hook): the whole group mounts at its first line's start so
 * later lines reserve their space and earlier lines don't jump.
 */
const SlotCaptions: React.FC<{ slot: Slot; L: Layout }> = ({ slot, L }) => {
  const t = useSeconds();
  const box = L.slots[slot];
  const specs = CAPTIONS.filter((s) => s.slot === slot);
  const groupStart = (to: number) => Math.min(...specs.filter((s) => s.to === to).map((s) => s.from));
  const live = specs.filter((s) => t >= groupStart(s.to) && t <= s.to);
  if (live.length === 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: box.align === "center" ? "center" : "flex-start",
        gap: box.size * 0.1,
      }}
    >
      {live.map((s) =>
        s.kind === "brand" ? (
          <div key="brand" style={{ marginBottom: box.size * 0.35 }}>
            <BrandLockup from={s.from} to={s.to} size={L.brandSize} align={box.align} />
          </div>
        ) : (
          <Caption key={s.text} text={s.text} from={s.from} to={s.to} strike={s.strike} size={box.size * (s.scale ?? 1)} align={box.align} />
        ),
      )}
    </div>
  );
};

/** Positions a child in a caption slot's box. */
const InSlot: React.FC<{ L: Layout; slot: Slot; children: React.ReactNode }> = ({ L, slot, children }) => {
  const box = L.slots[slot];
  return (
    <div
      style={{
        position: "absolute",
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: box.align === "center" ? "center" : "flex-start",
      }}
    >
      {children}
    </div>
  );
};

export const Demo: React.FC<{ cut: FormatId }> = ({ cut }) => {
  const t = useSeconds();
  const { fps } = useVideoConfig();
  const format = FORMATS[cut];
  const L = layoutFor(format.orientation);
  const phone = poseAt(phoneKeys(L), t);
  const browser = poseAt(browserKeys(L), t);

  return (
    <AbsoluteFill style={{ fontFamily: theme.font.body }}>
      <Backdrop />
      <Audio src={staticFile(VOICEOVER)} />
      {/* Remotion calls volume() per frame; the level curve lives in the storyboard. */}
      <Audio src={staticFile(MUSIC)} volume={(f) => Math.pow(10, musicDbAt(f / fps) / 20)} />

      <SlotCaptions slot="center" L={L} />
      <SlotCaptions slot="side" L={L} />
      <SlotCaptions slot="top" L={L} />
      <TrustScene
        L={L.trust}
        from={TRUST.from}
        to={TRUST.to}
        firmsAt={TRUST.firmsAt}
        ratedAt={TRUST.ratedAt}
        scoreAt={TRUST.scoreAt}
        logoAt={TRUST.logoAt}
      />
      <InSlot L={L} slot="side">
        <FeatureList items={FEATURES.items} from={FEATURES.from} to={FEATURES.to} size={L.features.size} layout={L.features.layout} />
      </InSlot>
      <SubjectCloud chips={L.chips} from={SUBJECT_CLOUD.from} to={SUBJECT_CLOUD.to} width={format.width} height={format.height} size={L.chipSize} />

      <Browser pose={browser}>{(vp) => <ScreenTrack steps={WEB_STEPS} viewport={vp} cropTop={WEB_CHROME_CROP} />}</Browser>
      <Phone pose={phone}>
        {(vp) => (
          <>
            <ScreenTrack steps={PHONE_STEPS} viewport={vp} />
            {t < LARA.to && <LaraSheet viewport={vp} at={LARA.from} />}
          </>
        )}
      </Phone>

      <EndCard from={END_CARD.from} ctaAt={END_CARD.ctaAt} wallAt={END_CARD.wallAt} L={L.end} />
    </AbsoluteFill>
  );
};
