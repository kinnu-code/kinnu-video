import { Config } from "@remotion/cli/config";

// JPEG frames render faster; switch to "png" if you add transparency.
Config.setVideoImageFormat("jpeg");
// UI screenshots are mostly flat colour and small text, where JPEG artefacts show.
Config.setJpegQuality(95);
Config.setOverwriteOutput(true);
// Higher = smaller file, lower = better quality. 18 is a sensible marketing default.
Config.setCrf(18);
