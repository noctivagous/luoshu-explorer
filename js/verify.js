// Executable claims for every Lo Shu property (A–T).
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

// Replace each cell P of `outer` with `inner` shifted by inner.length·(P−1).
// The Lo Shu nested once is the 9×9; nesting that result with the 3×3 again
// is the 27×27.
export function nestBlocks(outer, inner) {
  const n = Math.sqrt(outer.length);
  const m = Math.sqrt(inner.length);
  if (!Number.isInteger(n) || !Number.isInteger(m) || n < 1 || m < 1) return [];
  const N = n * m;
  const out = new Array(N * N);
  const span = inner.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const shift = span * (outer[i * n + j] - 1);
      for (let a = 0; a < m; a++) {
        for (let b = 0; b < m; b++) {
          out[(i * m + a) * N + (j * m + b)] = shift + inner[a * m + b];
        }
      }
    }
  }
  return out;
}

function normalMagic(g, order, magic) {
  if (g.length !== order * order) return false;
  const seen = new Set(g);
  if (seen.size !== g.length) return false;
  for (let v = 1; v <= g.length; v++) if (!seen.has(v)) return false;
  let d1 = 0;
  let d2 = 0;
  for (let i = 0; i < order; i++) {
    let row = 0;
    let col = 0;
    for (let k = 0; k < order; k++) {
      row += g[i * order + k];
      col += g[k * order + i];
    }
    if (row !== magic || col !== magic) return false;
    d1 += g[i * order + i];
    d2 += g[i * order + (order - 1 - i)];
  }
  return d1 === magic && d2 === magic;
}

const BLOCK_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

// The 3×3 that replaces palace value P: the same grid plus 9·(P−1).
export function palaceCells(g, P) {
  const shift = 9 * (P - 1);
  return g.map((v) => shift + v);
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
  // O: the 3-subsets that sum to 15 are exactly the eight lines, so the
  // center lies on 4, each corner on 3, and each edge on 2.
  O: (g) => {
    const found = [];
    for (let a = 0; a < 9; a++) {
      for (let b = a + 1; b < 9; b++) {
        for (let c = b + 1; c < 9; c++) {
          if (g[a] + g[b] + g[c] === 15) found.push([a, b, c]);
        }
      }
    }
    const key = (cells) => [...cells].sort((a, b) => a - b).join(",");
    const got = found.map(key).sort();
    const lines = LINES.map(key).sort();
    if (got.length !== 8 || got.join("|") !== lines.join("|")) return false;
    const on = Array(9).fill(0);
    for (const line of LINES) for (const i of line) on[i] += 1;
    return (
      on[4] === 4 &&
      [0, 2, 6, 8].every((i) => on[i] === 3) &&
      [1, 3, 5, 7].every((i) => on[i] === 2)
    );
  },
  // P: row products and column products each total 225; pairwise products
  // each total 195. Diagonals are outside this claim.
  P: (g) => {
    const prod = (cells) => cells.reduce((a, i) => a * g[i], 1);
    const pairs = (cells) => {
      const [a, b, c] = cells;
      return g[a] * g[b] + g[b] * g[c] + g[c] * g[a];
    };
    const rows = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
    ];
    const cols = [
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
    ];
    return (
      rows.reduce((a, line) => a + prod(line), 0) === 225 &&
      cols.reduce((a, line) => a + prod(line), 0) === 225 &&
      rows.reduce((a, line) => a + pairs(line), 0) === 195 &&
      cols.reduce((a, line) => a + pairs(line), 0) === 195
    );
  },
  // Q: each outer line and the line opposite it have the same sum of squares.
  Q: (g) => {
    const sq = (cells) => cells.reduce((a, i) => a + g[i] * g[i], 0);
    return (
      sq([0, 1, 2]) === sq([6, 7, 8]) && sq([0, 3, 6]) === sq([2, 5, 8])
    );
  },
  // R: each parallel family, read as three-digit numbers, has the same sum
  // of squares as the digit reversals. Dropping any one digit place keeps it.
  R: (g) =>
    g.length === 9 &&
    g.every((n) => Number.isInteger(n) && n >= 0 && n <= 9) &&
    HOLMES_FAMILIES.every((fam) =>
      [null, 0, 1, 2].every((place) => holmesFamily(g, fam.lines, place).match),
    ),
  // S: M² has one diagonal value, one other value everywhere else, and each
  // row sums to 225. Either pair (59/83 or 91/67) is accepted.
  S: (g) => squaredPattern(g).ok,
  // T: each cell opens into the same square, shifted by 9·(P−1). The 9×9
  // uses 1…81 once and sums to 369; one more depth is the 27×27.
  T: (g) => {
    if (!Array.isArray(g) || g.length !== 9) return false;
    if (!g.every((n) => Number.isInteger(n))) return false;
    const seen = new Set(g);
    if (seen.size !== 9) return false;
    for (let v = 1; v <= 9; v++) if (!seen.has(v)) return false;
    if (!LINES.every((line) => sum(g, line) === 15)) return false;
    const big = nestBlocks(g, g);
    if (!normalMagic(big, 9, 369) || big[40] !== 41) return false;
    for (let i = 0; i < 40; i++) if (big[i] + big[80 - i] !== 82) return false;
    for (let bi = 0; bi < 3; bi++) {
      for (let bj = 0; bj < 3; bj++) {
        const P = g[bi * 3 + bj];
        const expect = 27 * (P - 1) + 15;
        const cells = [];
        for (let a = 0; a < 3; a++) {
          for (let b = 0; b < 3; b++) cells.push(big[(bi * 3 + a) * 9 + (bj * 3 + b)]);
        }
        if (!BLOCK_LINES.every((line) => line.reduce((s, i) => s + cells[i], 0) === expect))
          return false;
      }
    }
    const deep = nestBlocks(big, g);
    return normalMagic(deep, 27, 9855) && deep[364] === 365;
  },
};

// Holmes families, in the reading order used on this orientation.
// The anti-diagonal here is 471, not the published 714 of the other pose.
export const HOLMES_FAMILIES = [
  { id: "rows", label: "Rows", lines: [[0, 1, 2], [3, 4, 5], [6, 7, 8]] },
  { id: "columns", label: "Columns", lines: [[0, 3, 6], [1, 4, 7], [2, 5, 8]] },
  { id: "main", label: "Main wraps", lines: [[0, 4, 8], [1, 5, 6], [2, 3, 7]] },
  { id: "anti", label: "Anti wraps", lines: [[2, 4, 6], [0, 5, 7], [1, 3, 8]] },
];

export function threeDigit(g, cells) {
  return cells.reduce((n, i) => n * 10 + g[i], 0);
}

export function reverseThree(n) {
  const s = String(n).padStart(3, "0");
  return Number(s[2] + s[1] + s[0]);
}

// place 0 drops hundreds, 1 tens, 2 units. The same place is dropped from
// the reading and from its reversal, which is not the reversal of the remainder.
export function dropPlace(n, place) {
  const s = String(n).padStart(3, "0").split("");
  s.splice(place, 1);
  return Number(s.join(""));
}

export function holmesFamily(g, lines, place) {
  const rows = lines.map((cells) => {
    const n = threeDigit(g, cells);
    const rev = reverseThree(n);
    const left = place == null ? n : dropPlace(n, place);
    const right = place == null ? rev : dropPlace(rev, place);
    return { n, rev, left, right, leftSq: left * left, rightSq: right * right };
  });
  const total = rows.reduce((a, row) => a + row.leftSq, 0);
  const revTotal = rows.reduce((a, row) => a + row.rightSq, 0);
  return { rows, total, revTotal, match: total === revTotal };
}

export function matrixSquare(g) {
  const m = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      let s = 0;
      for (let k = 0; k < 3; k++) s += g[r * 3 + k] * g[k * 3 + c];
      m.push(s);
    }
  }
  return m;
}

export function squaredPattern(g) {
  const m = matrixSquare(g);
  const diag = m[0];
  const off = m[1];
  const diagSame = m[0] === m[4] && m[4] === m[8];
  const offSame = [1, 2, 3, 5, 6, 7].every((i) => m[i] === off);
  const rowSums = [0, 1, 2].map((r) => m[r * 3] + m[r * 3 + 1] + m[r * 3 + 2]);
  return {
    m,
    diag,
    off,
    rowSums,
    ok: diagSame && offSame && rowSums.every((s) => s === 225) && diag !== off,
  };
}

export function verifyAll(g) {
  return Object.fromEntries(Object.entries(verify).map(([id, fn]) => [id, fn(g)]));
}

// --- Overlapping Luoshu (U–W): larger boards, verified separately ---
// These boards are not 3×3 grids, so their predicates do not join `verify`
// (which the playground evaluates on a single 3×3 square).

const LOSHU_GRID = [4, 9, 2, 3, 5, 7, 8, 1, 6];

// The 3×3 window of a row-major board with `cols` columns, at offset (r, c).
export function windowAt(board, cols, r, c) {
  const out = [];
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) out.push(board[(r + a) * cols + (c + b)]);
  return out;
}

export function windowReport(board, cols, r, c) {
  const w = windowAt(board, cols, r, c);
  const rows = [0, 1, 2].map((a) => w[a * 3] + w[a * 3 + 1] + w[a * 3 + 2]);
  const colsums = [0, 1, 2].map((b) => w[b] + w[3 + b] + w[6 + b]);
  const diags = [w[0] + w[4] + w[8], w[2] + w[4] + w[6]];
  const rowsCols = rows.every((s) => s === 15) && colsums.every((s) => s === 15);
  return {
    cells: w,
    rows,
    cols: colsums,
    diags,
    rowsCols,
    magic: rowsCols && diags.every((s) => s === 15),
  };
}

// Every offset whose 3×3 window is fully magic (rows, columns, diagonals).
export function magicOffsets(board, cols) {
  const rowCount = board.length / cols;
  const out = [];
  for (let r = 0; r + 2 < rowCount; r++)
    for (let c = 0; c + 2 < cols; c++) if (windowReport(board, cols, r, c).magic) out.push([r, c]);
  return out;
}

// U: four Lo Shu windows at the corners of a 5×5 board. Each window is
// centred on a 5, and all four windows meet at (share) the board's centre
// cell. Mirrored tiling: board(r,c) = LoShu[fold(r)][fold(c)], fold 0,1,2,1,0.
export function centralBoard() {
  const fold = [0, 1, 2, 1, 0];
  const out = [];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) out.push(LOSHU_GRID[fold[r] * 3 + fold[c]]);
  return out;
}

export const CENTRAL_OFFSETS = [
  [0, 0],
  [0, 2],
  [2, 0],
  [2, 2],
];

export function centralOverlapHolds(board) {
  if (!Array.isArray(board) || board.length !== 25) return false;
  return CENTRAL_OFFSETS.every(([r, c]) => {
    const rep = windowReport(board, 5, r, c);
    return rep.magic && new Set(rep.cells).size === 9 && rep.cells[4] === 5;
  });
}

// V: a 3×11 strip cycling the Lo Shu columns. Every sliding window keeps
// row and column sums of 15; only windows at offsets 0, 3, 6 are fully magic.
export function stripBoard() {
  const out = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 11; c++) out.push(LOSHU_GRID[r * 3 + (c % 3)]);
  return out;
}

export function linearOverlapHolds(board) {
  if (!Array.isArray(board) || board.length !== 33) return false;
  for (let c = 0; c < 9; c++) {
    const rep = windowReport(board, 11, 0, c);
    if (!rep.rowsCols) return false;
    if (rep.magic !== (c % 3 === 0)) return false;
  }
  return true;
}

// W: the same mirrored fold extended to 9×9 (fold period 0,1,2,1). Magic
// windows sit at even offsets; the Yang Hui compound 9×9 (nestBlocks) has
// magic windows only at its aligned block offsets.
export function foldedBoard() {
  const fold = [0, 1, 2, 1, 0, 1, 2, 1, 0];
  const out = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) out.push(LOSHU_GRID[fold[r] * 3 + fold[c]]);
  return out;
}

export function foldedOverlapHolds(board) {
  if (!Array.isArray(board) || board.length !== 81) return false;
  const got = magicOffsets(board, 9).map(([r, c]) => `${r},${c}`);
  const want = [];
  for (const r of [0, 2, 4, 6]) for (const c of [0, 2, 4, 6]) want.push(`${r},${c}`);
  return JSON.stringify(got) === JSON.stringify(want);
}

export function compoundAlignedOnlyHolds(g) {
  const big = nestBlocks(g, g);
  // Compound windows carry shifted values, so their constant is not 15:
  // a window is compound-magic when all eight of its lines share one sum.
  const out = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 7; c++) {
      const w = windowAt(big, 9, r, c);
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
      ].map((line) => line.reduce((s, i) => s + w[i], 0));
      if (lines.every((s) => s === lines[0])) out.push(`${r},${c}`);
    }
  }
  const aligned = [];
  for (const r of [0, 3, 6]) for (const c of [0, 3, 6]) aligned.push(`${r},${c}`);
  return JSON.stringify(out) === JSON.stringify(aligned);
}
