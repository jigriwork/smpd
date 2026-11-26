/**
 * Shared terrain geometry for the SMPD study model (WebGL) and the site-plan drawing (SVG).
 * Plan units are abstract; this is conceptual brand artwork, not a surveyed site.
 */
export const LAYERS = [
  { rx: 21.0, rz: 14.6 },
  { rx: 19.3, rz: 13.3 },
  { rx: 17.8, rz: 12.2 },
  { rx: 16.5, rz: 11.3 },
  { rx: 15.4, rz: 10.5 },
  { rx: 14.5, rz: 9.9 },
  { rx: 13.8, rz: 9.4 },
];
export const centerOf = (i: number) => ({ x: 0.35 * i, y: -0.22 * i });
export const wobble = (a: number, i: number) =>
  1 + 0.055 * Math.sin(3 * a + 0.6) + 0.035 * Math.sin(5 * a - 1.1 + i * 0.12) + 0.025 * Math.cos(2 * a + 1.7) + 0.012 * Math.sin(9 * a + i);
export const superR = (a: number, rx: number, rz: number) => {
  const n = 3.2; // superellipse: softly rectangular, like a site
  const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
  return 1 / Math.pow(Math.pow(c / rx, n) + Math.pow(s / rz, n), 1 / n);
};
/** Closed outline of a contour layer, optionally scaled (for land beyond the model). */
export function layerOutline(i: number, segs = 160, scale = 1) {
  const L = LAYERS[Math.min(i, LAYERS.length - 1)];
  const c = centerOf(i);
  const pts: { x: number; y: number }[] = [];
  for (let k = 0; k < segs; k++) {
    const a = (k / segs) * Math.PI * 2;
    const r = superR(a, L.rx * scale, L.rz * scale) * wobble(a, i);
    pts.push({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r });
  }
  return pts;
}
