/*
 * The house photographs most pieces in a two-tone studio: a pastel wall
 * meeting a lighter table. This reads a photo's backdrop — the wall colour
 * along the top edge, the table colour along the bottom, and the height of
 * the horizon where they meet — so the home page hero can extend that studio
 * across the whole screen.
 *
 * Every photo gets a "look":
 *   studio   a clean two-tone backdrop   → carried across the screen
 *   cutout   a transparent PNG           → floats on the page as it is
 *   framed   fabric, dark, or unreadable → shown inside a frame
 *
 * The analysis is pure (RGBA pixels in, look out), so the browser runs it on
 * a canvas and the build runs it on the same thumbnail decoded by sharp —
 * prerendered pages arrive with their hero already set.
 */

export type RGB = readonly [number, number, number];

export type BackdropLook =
  | { kind: 'studio'; wall: RGB; table: RGB; /** Where the table begins, 0–1 of the photo's height. */ horizon: number }
  | { kind: 'cutout' }
  | { kind: 'framed' };

/** Side of the square the photo is reduced to before reading. */
export const BACKDROP_SAMPLE = 48;
/** The thumbnail width the backdrop is read from. */
export const BACKDROP_SOURCE_WIDTH = 160;

const MAX_SPREAD = 14;
const MIN_WALL_LUMINANCE = 0.45;

export const colourDistance = (a: RGB, b: RGB) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const luminance = ([r, g, b]: RGB) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

function mean(points: RGB[]): RGB {
  const sum = points.reduce((s, p) => [s[0] + p[0], s[1] + p[1], s[2] + p[2]], [0, 0, 0]);
  return [Math.round(sum[0] / points.length), Math.round(sum[1] / points.length), Math.round(sum[2] / points.length)];
}

function spread(points: RGB[], centre: RGB): number {
  return Math.sqrt(points.reduce((s, p) => s + colourDistance(p, centre) ** 2, 0) / points.length);
}

/** Reads the backdrop from RGBA pixels of a `size` × `size` image. */
export function analyseBackdrop(data: ArrayLike<number>, size = BACKDROP_SAMPLE): BackdropLook {
  const at = (x: number, y: number): RGB => {
    const k = (y * size + x) * 4;
    return [data[k], data[k + 1], data[k + 2]];
  };
  const alpha = (x: number, y: number) => data[(y * size + x) * 4 + 3];
  const last = size - 1;

  // Transparent cut-outs have no studio to extend.
  if ([alpha(0, 0), alpha(last, 0), alpha(0, last), alpha(last, last)].some((a) => a < 250)) return { kind: 'cutout' };

  const row = (y: number) => Array.from({ length: size }, (_, x) => at(x, y));
  const top = row(1);
  const bottom = row(last - 1);
  const wall = mean(top);
  const table = mean(bottom);
  if (spread(top, wall) > MAX_SPREAD || spread(bottom, table) > MAX_SPREAD) return { kind: 'framed' };
  if (luminance(wall) < MIN_WALL_LUMINANCE) return { kind: 'framed' };

  // Walk down the two outer columns until the colour reads as table.
  let horizon = 1;
  if (colourDistance(wall, table) > 10) {
    const edge = (x: number) => {
      for (let y = 0; y < size; y++) {
        const p = at(x, y);
        if (colourDistance(p, table) < colourDistance(p, wall)) return y / size;
      }
      return 1;
    };
    horizon = (edge(1) + edge(last - 1)) / 2;
  }

  return { kind: 'studio', wall, table, horizon };
}
