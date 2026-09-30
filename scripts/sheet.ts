/**
 * Builds the ffmpeg filter for a contact sheet: picks the frames nearest the
 * given times and tiles them into one image. Pure, so it can be unit-tested;
 * scripts/contact-sheet.ts runs it.
 */

export type SheetPlan = { filter: string; columns: number; rows: number; frames: number[] };

/**
 * @param times   seconds to sample, in any order
 * @param fps     the video's frame rate
 * @param width   width of each tile in px (height follows the video's aspect)
 * @param columns maximum tiles per row
 */
export const planSheet = (times: readonly number[], fps: number, width: number, columns: number): SheetPlan => {
  if (times.length === 0) throw new Error("Give at least one time in seconds");
  // Frame numbers, sorted and de-duplicated: ffmpeg's select passes frames in stream order.
  const frames = [...new Set(times.map((t) => Math.round(t * fps)))].sort((a, b) => a - b);
  const cols = Math.min(columns, frames.length);
  const rows = Math.ceil(frames.length / cols);
  // Commas inside a filter expression must be escaped, or ffmpeg reads them as filter separators.
  const select = frames.map((n) => `eq(n\\,${n})`).join("+");
  return { filter: `select=${select},scale=${width}:-1,tile=${cols}x${rows}:padding=8:color=white`, columns: cols, rows, frames };
};
