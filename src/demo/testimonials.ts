/**
 * Testimonials and firm names shown in the demo, verbatim from kinnu's site
 * (public/assets/demo/testimonials-source.png).
 *
 * Faces are cut from that screenshot (150 px squares, transparent background).
 * `mouth` is where each drawn mouth sits in the face image, so the animated
 * smile can replace it: centre in image pixels, and tilt in degrees (negative =
 * right side higher).
 */
export type Face = { src: string; mouth: { x: number; y: number; tilt: number } };

export type Testimonial = { quote: string; name: string; role: string; face: Face };

/** Side of the square face images, in pixels. */
export const FACE_SIZE = 150;
/** The faces' fill colour, used to paint over the original mouths. */
export const FACE_SKIN = "#FEFAF3";

const face = (n: number, x: number, y: number, tilt = 0): Face => ({ src: `assets/demo/faces/face-${n}.png`, mouth: { x, y, tilt } });

export const TESTIMONIALS: readonly Testimonial[] = [
  { quote: "The best question bank on the market.", name: "Laura Febvre", role: "SQE1 passer, 2024", face: face(1, 75.3, 103.5, -15) },
  { quote: "Kinnu SQE was invaluable. Very glad I used it!", name: "Kiana", role: "SQE1 passer, 2025", face: face(2, 74.9, 96) },
  {
    quote: "Excellent questions - the AI was a game changer.",
    name: "Suzanne Reece",
    role: "SQE supertutor at InspiredtoStudy.org",
    face: face(3, 77, 113.5, -16),
  },
  {
    quote: "The vast question bank and tracking tools makes SQE prep so much more enjoyable!",
    name: "Rebecca",
    role: "SQE1 candidate, 2026",
    face: face(4, 73.1, 90.3, 12),
  },
  { quote: "It is so efficient.", name: "J.C.", role: "SQE1 passer, 2025", face: face(5, 75.9, 100.9) },
  {
    quote: "I highly recommend them - their team is incredibly responsive.",
    name: "Michelle Huang",
    role: "King & Wood Mallesons",
    face: face(6, 69.3, 93.1),
  },
];

/** Firms named in the voiceover ("Mishcon, Slaughters and Freshfields"), written out in full on screen. */
export const FIRMS = ["Mishcon de Reya", "Slaughter and May", "Freshfields"] as const;

/** Kinnu's Trustpilot rating, as spoken in the voiceover and shown on the site. */
export const TRUSTPILOT = { label: "Excellent", score: "4.7", stars: 4.5 } as const;
