/**
 * Curated color scales for the project's data visualizations. Deliberately
 * hand-picked stops (not a generic d3-scale-chromatic palette) so heatmap
 * and choropleth colors stay inside the "liquid glass" palette defined in
 * globals.css instead of clashing with it.
 */

type Stop = { at: number; hex: string };

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const toHex = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function interpolate(stops: Stop[], t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (clamped >= a.at && clamped <= b.at) {
      const localT = (clamped - a.at) / (b.at - a.at || 1);
      const rgbA = hexToRgb(a.hex);
      const rgbB = hexToRgb(b.hex);
      const mixed: [number, number, number] = [
        rgbA[0] + (rgbB[0] - rgbA[0]) * localT,
        rgbA[1] + (rgbB[1] - rgbA[1]) * localT,
        rgbA[2] + (rgbB[2] - rgbA[2]) * localT,
      ];
      return rgbToHex(mixed);
    }
  }
  return stops[stops.length - 1].hex;
}

/**
 * Cointegration / causal-strength heatmap: 6 curated stops from a neutral
 * slate (no evidence) to a deep Atlas Indigo (strong, significant evidence).
 * Non-significant results should ALSO be marked structurally (hatch/border)
 * in the component — never rely on hue alone (WCAG + colorblind safety).
 */
export const COINTEGRATION_STOPS: Stop[] = [
  { at: 0, hex: "#E4E8F1" },
  { at: 0.2, hex: "#C7D1EA" },
  { at: 0.4, hex: "#A3B2DD" },
  { at: 0.6, hex: "#7C89D6" },
  { at: 0.8, hex: "#5B57DD" },
  { at: 1, hex: "#3D2FA8" },
];

export function cointegrationColor(strength: number): string {
  return interpolate(COINTEGRATION_STOPS, strength);
}

/**
 * Choropleth ramp for state-level indicator values. Agave Teal is the
 * project's "MX" hue, so the map ramp stays in the teal family rather than
 * a generic blue/yellow scale.
 */
export const CHOROPLETH_STOPS: Stop[] = [
  { at: 0, hex: "#EAF6F4" },
  { at: 0.25, hex: "#C3E7E1" },
  { at: 0.5, hex: "#7FD1C3" },
  { at: 0.75, hex: "#2FA495" },
  { at: 1, hex: "#0D6E63" },
];

export function choroplethColor(t: number): string {
  return interpolate(CHOROPLETH_STOPS, t);
}

export const NO_DATA_COLOR_LIGHT = "#E2E8F0";
export const NO_DATA_COLOR_DARK = "#28324A";

/** Normalizes a value into [0,1] given a domain, clamping outliers. */
export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}
