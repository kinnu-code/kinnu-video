// Kinnu design tokens. Colours are sampled from the app screenshots in
// public/assets/demo; swap for the official tokens when design shares them.
// Everything in the scenes reads from here, so a rebrand is one edit.
export const theme = {
  color: {
    ink: "#141414",
    // Warm cream the app uses as its page background.
    paper: "#FFFAF2",
    muted: "#8C857A",
    surface: "#F7F2EA",
    // Teal used for the free-trial bar, Prep Score percentiles and LARA.
    accent: "#70B4BF",
    accentDeep: "#3F8F9C",
    accentSoft: "#E3F1F3",
    success: "#3EA685",
    danger: "#E05262",
    // Session colours from the Study Plan: Learn / Practice / Flashcards.
    learn: "#79B8C8",
    practice: "#D1938C",
    flashcards: "#8BB47B",
  },
  font: {
    // Google Fonts stand-ins that match the app's headings and body text
    // (loaded in src/fonts.ts). Replace with the brand files when available.
    display: "'Zilla Slab', Georgia, serif",
    body: "Figtree, 'Helvetica Neue', Arial, sans-serif",
  },
  radius: { device: 44, card: 20 },
} as const;
