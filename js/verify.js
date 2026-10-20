// Executable claims for every Lo Shu property (A–N).
// Each predicate takes a flat 3×3 grid (indices 0-8, row-major) and reports
// whether that property holds for it. The UI text in data/properties.json and
// the captions in js/animation-scripts.js must agree with these predicates;
// checks/content.check.mjs fails when text and math drift.

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];
const PAIRS = [
  [0, 8],
  [2, 6],
  [3, 5],
  [7, 1],
];
const mod10 = (n) => ((n % 10) + 10) % 10;
const sum = (g, cells) => cells.reduce((a, i) => a + g[i], 0);

// Determinant of the 3×3 grid in row-major order.
export function determinant(g) {
  const [a, b, c, d, e, f, h, i, j] = g;
  return a * (e * j - f * i) - b * (d * j - f * h) + c * (d * i - e * h);
}

function isKnightMove(ai, bi) {
  const dx = Math.abs((ai % 3) - (bi % 3));
  const dy = Math.abs(Math.floor(ai / 3) - Math.floor(bi / 3));
  return (dx === 1 && dy === 2) || (dx === 2 && dy === 1);
}

// D₄ transforms of a flat grid (4 rotations × {identity, mirror}).
export function transforms(g) {
  const rot = (x) => [x[6], x[3], x[0], x[7], x[4], x[1], x[8], x[5], x[2]];
  const mir = (x) => [x[2], x[1], x[0], x[5], x[4], x[3], x[8], x[7], x[6]];
  const out = [];
  let cur = [...g];
  for (let k = 0; k < 4; k++) {
    out.push([...cur], mir(cur));
    cur = rot(cur);
  }
  return out;
}

export const verify = {
  // A: opposite pairs through the center sum to 10.
  A: (g) => PAIRS.every(([a, b]) => g[a] + g[b] === 10),
  // B: all eight lines sum to 15.
  B: (g) => LINES.every((line) => sum(g, line) === 15),
  // C: clockwise border addition mod 10.
  C: (g) =>
    mod10(g[7] + g[8]) === g[5] &&
    mod10(g[5] + g[2]) === g[1] &&
    mod10(g[1] + g[0]) === g[3] &&
    mod10(g[3] + g[6]) === g[7],
  // D: center + edge gives the next corner mod 10, counterclockwise.
  D: (g) =>
    mod10(g[4] + g[1]) === g[0] &&
    mod10(g[4] + g[5]) === g[2] &&
    mod10(g[4] + g[7]) === g[8] &&
    mod10(g[4] + g[3]) === g[6],
  // E: total 45 = 9×5, pairs 10 = 2×5, lines 15 = 3×5.
  E: (g) =>
    g.reduce((a, n) => a + n, 0) === 9 * g[4] &&
    PAIRS.every(([a, b]) => g[a] + g[b] === 2 * g[4]) &&
    LINES.every((line) => sum(g, line) === 3 * g[4]),
  // F: four corners (even) and four edges (odd) each sum to 20.
  F: (g) =>
    sum(g, [0, 2, 6, 8]) === 20 &&
    sum(g, [1, 3, 5, 7]) === 20 &&
    [0, 2, 6, 8].every((i) => g[i] % 2 === 0) &&
    [1, 3, 5, 7].every((i) => g[i] % 2 === 1),
  // G: centered at zero, every line sums to 0.
  G: (g) => LINES.every((line) => sum(g, line) - 3 * 5 === 0),
  // H: edge − corner ≡ 5 (mod 10) around the border.
  H: (g) =>
    mod10(g[1] - g[0]) === 5 &&
    mod10(g[5] - g[2]) === 5 &&
    mod10(g[7] - g[8]) === 5 &&
    mod10(g[3] - g[6]) === 5,
  // I: every line through the center averages to the center.
  I: (g) =>
    [[0, 4, 8], [2, 4, 6], [1, 4, 7], [3, 4, 5]].every(
      ([a, c, b]) => (g[a] + g[b]) / 2 === g[c],
    ),
  // J: rows and columns read as three-digit numbers sum to 1665.
  J: (g) => {
    const num = (cells) => cells.reduce((a, i) => a * 10 + g[i], 0);
    return (
      num([0, 1, 2]) + num([3, 4, 5]) + num([6, 7, 8]) === 1665 &&
      num([0, 3, 6]) + num([1, 4, 7]) + num([2, 5, 8]) === 1665
    );
  },
  // K: determinant is +360 for this orientation.
  K: (g) => determinant(g) === 360,
  // L: deviation from 5 is mirrored through the center.
  L: (g) =>
    PAIRS.every(([a, b]) => g[a] - 5 === -(g[b] - 5)) &&
    new Set(g.map((n) => Math.abs(n - 5))).size === 5,
  // M: the narrowed claim — 1→2→3 and 7→8→9 are knight moves.
  M: (g) => {
    const pos = {};
    g.forEach((v, i) => (pos[v] = i));
    return (
      isKnightMove(pos[1], pos[2]) &&
      isKnightMove(pos[2], pos[3]) &&
      isKnightMove(pos[7], pos[8]) &&
      isKnightMove(pos[8], pos[9])
    );
  },
  // N: all eight D₄ forms are magic (every line sums to the same constant).
  N: (g) =>
    transforms(g).every((t) => {
      const s = sum(t, LINES[0]);
      return LINES.every((line) => sum(t, line) === s);
    }),
};

export function verifyAll(g) {
  return Object.fromEntries(Object.entries(verify).map(([id, fn]) => [id, fn(g)]));
}
