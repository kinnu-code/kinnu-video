import React from "react";
import { getStaticFiles, Img, staticFile } from "remotion";
import { theme } from "../theme";

/**
 * True if `path` (relative to public/) exists.
 *
 * Why: Remotion's <Img> fails the whole render on a 404. Until every screenshot
 * and logo is in place we still want to preview and render the cut, so callers
 * check first and draw a labelled placeholder instead.
 */
export const hasStaticFile = (path: string): boolean => getStaticFiles().some((f) => f.name === path);

/** <Img> for a public/ asset, or a labelled placeholder box if the file is missing. */
export const AssetImg: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => {
  if (hasStaticFile(src)) return <Img src={staticFile(src)} style={style} />;
  const name = src.split("/").pop();
  return (
    <div
      style={{
        ...style,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.color.surface,
        border: `2px dashed ${theme.color.muted}`,
        color: theme.color.muted,
        fontFamily: "monospace",
        fontSize: 20,
        padding: "0 16px",
        boxSizing: "border-box",
      }}
    >
      missing: {name}
    </div>
  );
};
