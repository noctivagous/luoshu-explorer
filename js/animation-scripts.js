// Animation scripts for every Lo Shu property (A-N) plus the matrix
// construction walkthrough. Overlay keys match the `data-anim-key` hooks in
// js/app.js; captions compress each property's formula/longDesc.
//
// Cell indices follow SQUARE = [4,9,2,3,5,7,8,1,6] positions 0-8 in js/app.js.
// Value placement order 1..9 lands on indices [7,2,3,0,4,8,5,6,1].
import { animStep } from "./animation.js";

const ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8];

const BUILD_ORDER = [7, 2, 3, 0, 4, 8, 5, 6, 1];
const BUILD_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

function constructionSteps() {
  const placed = {};
  return BUILD_ORDER.map((cellIdx, i) => {
    placed[cellIdx] = Number(BUILD_LABELS[i]);
    return animStep(`build-${i + 1}`, {
      caption: i === 0 ? "Place 1 — the seed." : `Place ${BUILD_LABELS[i]} (${i + 1} of 9).`,
      durationMs: 900,
      overlay: { show: [] },
      matrix: {
        highlight: [cellIdx],
        setValues: { ...placed },
        visibleCount: i + 1,
      },
    });
  });
}

export const constructionScript = {
  id: "construction",
  title: "Build the square",
  steps: constructionSteps(),
};

const PAIR_STEPS = [
  { key: "A.pair-0", cells: [0, 8], caption: "4 + 6 = 10 — corners balance." },
  { key: "A.pair-1", cells: [2, 6], caption: "2 + 8 = 10 — corners balance." },
  { key: "A.pair-2", cells: [3, 5], caption: "3 + 7 = 10 — edges balance." },
  { key: "A.pair-3", cells: [7, 1], caption: "1 + 9 = 10 — edges balance." },
];

export const scriptA = {
  id: "A",
  title: "Opposites balance",
  steps: PAIR_STEPS.map((p, i) =>
    animStep(`A-${i + 1}`, {
      caption: p.caption,
      durationMs: 1400,
      overlay: { show: [p.key] },
      matrix: { highlight: p.cells, setValues: null },
    }),
  ),
};

export const scriptB = {
  id: "B",
  title: "Lines sum to 15",
  steps: [
    animStep("B-1", {
      caption: "Each row sums to 15.",
      durationMs: 1400,
      overlay: { show: ["B.row-0", "B.row-1", "B.row-2"] },
      matrix: { highlight: [3, 4, 5], setValues: null },
    }),
    animStep("B-2", {
      caption: "Each column sums to 15.",
      durationMs: 1400,
      overlay: { show: ["B.col-0", "B.col-1", "B.col-2"] },
      matrix: { highlight: [1, 4, 7], setValues: null },
    }),
    animStep("B-3", {
      caption: "Diagonals too — 8 lines, one constant.",
      durationMs: 1600,
      overlay: { show: ["B.diags"] },
      matrix: { highlight: [4], setValues: null },
    }),
  ],
};

export const scriptC = {
  id: "C",
  title: "Clockwise addition mod 10",
  steps: [
    ["1 + 6 = 7", [7, 8, 5]],
    ["7 + 2 = 9", [5, 2, 1]],
    ["9 + 4 = 13 → 3", [1, 0, 3]],
    ["3 + 8 = 11 → 1", [3, 6, 7]],
  ].map(([caption, highlight], k) =>
    animStep(`C-${k + 1}`, {
      caption,
      durationMs: 1500,
      overlay: {
        show: [
          ...(k === 0 ? ["C.path"] : []),
          `C.seg-${2 * k}`,
          `C.seg-${2 * k + 1}`,
          `C.label-${k}`,
        ],
      },
      matrix: { highlight, setValues: null },
    }),
  ),
};

export const scriptD = {
  id: "D",
  title: "Counterclockwise arms",
  steps: [
    ["5 + 9 = 14 → 4", [4, 1, 0]],
    ["5 + 7 = 12 → 2", [4, 5, 2]],
    ["5 + 1 = 6", [4, 7, 8]],
    ["5 + 3 = 8", [4, 3, 6]],
  ].map(([caption, highlight], k) =>
    animStep(`D-${k + 1}`, {
      caption,
      durationMs: 1400,
      overlay: { show: [`D.arm-${k}`, `D.label-${k}`] },
      matrix: { highlight, setValues: null },
    }),
  ),
};

export const scriptE = {
  id: "E",
  title: "Five rules everything",
  steps: [
    animStep("E-1", {
      caption: "Total 45 = 9 × 5.",
      durationMs: 1400,
      overlay: { show: ["E.ring-2", "E.badge-total"] },
      matrix: { highlight: ALL, setValues: null },
    }),
    animStep("E-2", {
      caption: "Opposite 10 = 2 × 5.",
      durationMs: 1400,
      overlay: { show: ["E.ring-0", "E.badge-opp"] },
      matrix: { highlight: [0, 8], setValues: null },
    }),
    animStep("E-3", {
      caption: "Magic 15 = 3 × 5.",
      durationMs: 1400,
      overlay: { show: ["E.ring-1", "E.badge-magic"] },
      matrix: { highlight: [3, 4, 5], setValues: null },
    }),
  ],
};

export const scriptF = {
  id: "F",
  title: "Corners = Edges",
  steps: [
    animStep("F-1", {
      caption: "Corners are even — sum 20.",
      durationMs: 1400,
      overlay: { show: ["F.badge-corners"] },
      matrix: { highlight: [0, 2, 6, 8], setValues: null },
    }),
    animStep("F-2", {
      caption: "Edges are odd — sum 20.",
      durationMs: 1400,
      overlay: { show: ["F.badge-edges"] },
      matrix: { highlight: [1, 3, 5, 7], setValues: null },
    }),
    animStep("F-3", {
      caption: "20 = 20 — parity balances around 5.",
      durationMs: 1600,
      overlay: { show: [] },
      matrix: { highlight: [4], setValues: null },
    }),
  ],
};

export const scriptG = {
  id: "G",
  title: "Zero-balanced form",
  steps: [
    animStep("G-1", {
      caption: "Positives above the void: +4, +2, +3, +1.",
      durationMs: 1400,
      overlay: { show: ["G.pos"] },
      matrix: { highlight: [1, 5, 6, 8], setValues: null },
    }),
    animStep("G-2", {
      caption: "Negatives below: −1, −3, −2, −4.",
      durationMs: 1400,
      overlay: { show: ["G.neg"] },
      matrix: { highlight: [0, 2, 3, 7], setValues: null },
    }),
    animStep("G-3", {
      caption: "Center 0 — every line sums to 0.",
      durationMs: 1600,
      overlay: { show: ["G.center"] },
      matrix: { highlight: [4], setValues: null },
    }),
  ],
};

export const scriptH = {
  id: "H",
  title: "Subtraction = 5",
  steps: [
    ["9 − 4 = 5", [1, 0]],
    ["7 − 2 = 5", [5, 2]],
    ["1 − 6 ≡ 5 (mod 10)", [7, 8]],
    ["3 − 8 ≡ 5 (mod 10)", [3, 6]],
  ].map(([caption, highlight], k) =>
    animStep(`H-${k + 1}`, {
      caption,
      durationMs: 1400,
      overlay: { show: [`H.arm-${k}`] },
      matrix: { highlight, setValues: null },
    }),
  ),
};

export const scriptI = {
  id: "I",
  title: "Middle is mean",
  steps: [
    animStep("I-1", {
      caption: "Diagonal: (4 + 6) / 2 = 5.",
      durationMs: 1400,
      overlay: { show: ["I.line-0", "I.label-0"] },
      matrix: { highlight: [0, 4, 8], setValues: null },
    }),
    animStep("I-2", {
      caption: "Other diagonal ends average to 5.",
      durationMs: 1400,
      overlay: { show: ["I.line-1", "I.center"] },
      matrix: { highlight: [2, 4, 6], setValues: null },
    }),
    animStep("I-3", {
      caption: "Middle column: (9 + 1) / 2 = 5.",
      durationMs: 1400,
      overlay: { show: ["I.line-2", "I.label-1"] },
      matrix: { highlight: [1, 4, 7], setValues: null },
    }),
    animStep("I-4", {
      caption: "Middle row: (3 + 7) / 2 = 5.",
      durationMs: 1400,
      overlay: { show: ["I.line-3", "I.label-2"] },
      matrix: { highlight: [3, 4, 5], setValues: null },
    }),
  ],
};

export const scriptJ = {
  id: "J",
  title: "111 property",
  steps: [
    animStep("J-1", {
      caption: "Rows as numbers: 492 + 357 + 816.",
      durationMs: 1500,
      overlay: { show: ["J.rows", "J.badge-rows"] },
      matrix: { highlight: [0, 1, 2], setValues: null },
    }),
    animStep("J-2", {
      caption: "Columns: 438 + 951 + 276.",
      durationMs: 1500,
      overlay: { show: ["J.badge-cols"] },
      matrix: { highlight: [0, 3, 6], setValues: null },
    }),
    animStep("J-3", {
      caption: "Both sum to 1665 = 15 × 111.",
      durationMs: 1600,
      overlay: { show: ["J.badge-reveal"] },
      matrix: { highlight: [4], setValues: null },
    }),
  ],
};

export const scriptK = {
  id: "K",
  title: "Determinant 360",
  steps: [
    animStep("K-1", {
      caption: "One number hides in the whole square.",
      durationMs: 1400,
      overlay: { show: [] },
      matrix: { highlight: ALL, setValues: null },
    }),
    animStep("K-2", {
      caption: "det = −360 = −(1 × 2 × … × 6).",
      durationMs: 1600,
      overlay: { show: ["K.badge"] },
      matrix: { highlight: [4], setValues: null },
    }),
  ],
};

const POSITIVE_CELLS = [1, 5, 6, 8];
const NEGATIVE_CELLS = [0, 2, 3, 7];

export const scriptL = {
  id: "L",
  title: "Mirrored distance",
  steps: [
    animStep("L-1", {
      caption: "Above 5: +4, +3, +2, +1.",
      durationMs: 1400,
      overlay: { show: POSITIVE_CELLS.map((c) => `L.bar-${c}`) },
      matrix: { highlight: POSITIVE_CELLS, setValues: null },
    }),
    animStep("L-2", {
      caption: "Below 5, mirrored: −1, −2, −3, −4.",
      durationMs: 1600,
      overlay: { show: NEGATIVE_CELLS.map((c) => `L.bar-${c}`) },
      matrix: { highlight: NEGATIVE_CELLS, setValues: null },
    }),
  ],
};

const VALUE_INDEX = { 1: 7, 2: 2, 3: 3, 4: 0, 5: 4, 6: 8, 7: 5, 8: 6, 9: 1 };

export const scriptM = {
  id: "M",
  title: "Knight's tour (torus)",
  steps: [1, 3, 5, 7].map((first, k) =>
    animStep(`M-${k + 1}`, {
      caption:
        k === 3 ? "7 → 8 → 9. A knight's tour." : `${first} → ${first + 1} → ${first + 2}.`,
      durationMs: 1600,
      overlay: { show: [`M.hop-${2 * k}`, `M.hop-${2 * k + 1}`] },
      matrix: {
        highlight: [VALUE_INDEX[first], VALUE_INDEX[first + 1], VALUE_INDEX[first + 2]],
        setValues: null,
      },
    }),
  ),
};

export const scriptN = {
  id: "N",
  title: "All 3×3 are Lo Shu",
  steps: [
    animStep("N-1", {
      caption: "Four rotations — one square, turned.",
      durationMs: 1500,
      overlay: { show: ["N.mini-0", "N.mini-1", "N.mini-2", "N.mini-3"] },
      matrix: { highlight: [], setValues: null },
    }),
    animStep("N-2", {
      caption: "Plus four reflections. Eight faces of one.",
      durationMs: 1600,
      overlay: { show: ["N.mini-4", "N.mini-5", "N.mini-6", "N.mini-7"] },
      matrix: { highlight: [], setValues: null },
    }),
  ],
};

export const demoScripts = {
  construction: constructionScript,
  intro: constructionScript,
  A: scriptA,
  B: scriptB,
  C: scriptC,
  D: scriptD,
  E: scriptE,
  F: scriptF,
  G: scriptG,
  H: scriptH,
  I: scriptI,
  J: scriptJ,
  K: scriptK,
  L: scriptL,
  M: scriptM,
  N: scriptN,
};

export function scriptFor(propertyId) {
  if (!propertyId) return constructionScript;
  return demoScripts[propertyId] || null;
}
