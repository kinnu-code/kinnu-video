import React from "react";
import { interpolate } from "remotion";
import { theme } from "../../theme";
import { lerp, ramp, useSeconds } from "../motion";

type Word = { text: string; accent: boolean; strike: boolean; lineBreak?: boolean };

/**
 * Parses caption markup into words: `*word*` is accented (teal), `~word~` is
 * struck through, and a standalone `|` forces a line break. Markers may span
 * several words: "~ridiculous course fees~".
 */
export const parseCaption = (markup: string): Word[] => {
  let accent = false;
  let strike = false;
  return markup.split(/\s+/).filter(Boolean).map((raw) => {
    if (raw === "|") return { text: "", accent, strike, lineBreak: true };
    let text = raw;
    const opens = (m: string) => text.startsWith(m);
    if (opens("*")) { accent = true; text = text.slice(1); }
    if (opens("~")) { strike = true; text = text.slice(1); }
    // Closing marker may be followed by punctuation that stays unstyled, e.g. "~expensive~."
    const close = /([*~]+)([.,!?]*)$/.exec(text);
    const word: Word = { text, accent, strike };
    if (close) {
      word.text = text.slice(0, close.index) + close[2];
      if (close[1].includes("*")) accent = false;
      if (close[1].includes("~")) strike = false;
    }
    return word;
  });
};

export type CaptionProps = {
  /** Caption markup, see parseCaption. */
  text: string;
  /** Seconds: words start rising at `from`, the caption is gone by `to`. */
  from: number;
  to: number;
  size: number;
  align?: "left" | "center";
  font?: "display" | "body";
  weight?: number;
  /** Strike-through draws across the `~` words between these times. */
  strike?: { start: number; end: number };
};

const STAGGER = 0.055;
const EXIT = 0.22;

export const Caption: React.FC<CaptionProps> = ({ text, from, to, size, align = "left", font = "display", weight = 600, strike }) => {
  const t = useSeconds();
  // Before `from` the words are laid out but invisible, so a caption mounted
  // early reserves its space and lines above it don't jump when it arrives.
  if (t > to) return null;
  const words = parseCaption(text);
  const struck = words.filter((w) => w.strike).length;
  // `to` may be Infinity when a parent scene handles the exit.
  const exit = Number.isFinite(to) ? ramp(t, to - EXIT, EXIT) : 0;
  let strikeIndex = 0;

  return (
    <div
      style={{
        fontFamily: font === "display" ? theme.font.display : theme.font.body,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.08,
        letterSpacing: -size * 0.012,
        // Zilla Slab defaults to old-style figures, which make "SQE1" read as "SQEı".
        fontVariantNumeric: "lining-nums",
        fontFeatureSettings: '"lnum" 1',
        color: theme.color.ink,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : "flex-start",
        textAlign: align,
        gap: `${size * 0.08}px ${size * 0.24}px`,
        opacity: 1 - exit,
        transform: `translateY(${-exit * size * 0.25}px)`,
      }}
    >
      {words.map((w, i) => {
        if (w.lineBreak) return <span key={i} style={{ flexBasis: "100%", height: 0 }} />;
        const rise = ramp(t, from + i * STAGGER, 0.5);
        // Each struck word takes its share of the strike window, so the line
        // travels left to right across the phrase as one continuous stroke.
        let line = 0;
        if (w.strike && strike) {
          const slice = (strike.end - strike.start) / Math.max(1, struck);
          line = ramp(t, strike.start + slice * strikeIndex, slice, (x) => x);
          strikeIndex++;
        }
        const isLastStruck = w.strike && strikeIndex === struck;
        const faded = w.strike && strike ? ramp(t, strike.end, 0.3) : 0;
        return (
          <span
            key={i}
            style={{
              position: "relative",
              display: "inline-block",
              opacity: rise,
              transform: `translateY(${interpolate(rise, [0, 1], [size * 0.45, 0])}px)`,
              color: w.accent ? theme.color.accentDeep : lerpColor(theme.color.ink, theme.color.muted, faded),
            }}
          >
            {w.text}
            {w.strike && strike && (
              <span
                style={{
                  position: "absolute",
                  left: -size * 0.04,
                  // Bridge the gap to the next struck word so the stroke reads as one line.
                  width: `calc(100% + ${isLastStruck ? size * 0.08 : size * 0.28}px)`,
                  top: "54%",
                  height: size * 0.085,
                  borderRadius: size,
                  background: theme.color.danger,
                  transform: `scaleX(${line})`,
                  transformOrigin: "left center",
                }}
              />
            )}
          </span>
        );
      })}
    </div>
  );
};

/** Linear blend between two #RRGGBB colours. */
const lerpColor = (a: string, b: string, p: number): string => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((c, i) => Math.round(lerp(c, pb[i], p))).join(",")})`;
};

