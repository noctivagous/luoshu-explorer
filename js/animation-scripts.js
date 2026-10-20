// Animation scripts for every Lo Shu property (A–N) plus the ordinal
// construction. Each step lists overlay keys and the draw items those keys
// render (see js/overlay.js). Captions compress each property's formula.
//
// Cell indices follow SQUARE = [4,9,2,3,5,7,8,1,6] in js/app.js.
import { animStep } from "./animation.js";
import { Z, hopLook } from "./overlay.js";

const ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const LOSHU = [4, 9, 2, 3, 5, 7, 8, 1, 6];
const ORDINAL = [1, 2, 3, 4, 5, 6, 7, 8, 9];
// Swap each corner of the ordinal square with its opposite (1↔9, 3↔7).
const SWAPPED = [9, 2, 7, 4, 5, 6, 3, 8, 1];

function asValues(arr) {
  return Object.fromEntries(arr.map((v, i) => [i, v]));
}

function movesBetween(from, to) {
  const at = {};
  from.forEach((v, i) => {
    at[v] = i;
  });
  return to.flatMap((v, i) => (at[v] === i ? [] : [{ from: at[v], to: i }]));
}

function movedCells(moves) {
  return [...new Set(moves.flatMap((m) => [m.from, m.to]))];
}

const swapMoves = movesBetween(ORDINAL, SWAPPED);
const foldMoves = movesBetween(SWAPPED, LOSHU);

export const constructionScript = {
  id: "construction",
  title: "Build the square",
  steps: [
    animStep("build-1", {
      caption: "Write 1 through 9 in reading order.",
      durationMs: 1600,
      overlay: { show: [] },
      matrix: { highlight: [], setValues: asValues(ORDINAL), moves: [] },
    }),
    animStep("build-2", {
      caption: "Swap each corner with its opposite — 1↔9 and 3↔7.",
      durationMs: 1800,
      overlay: { show: [] },
      matrix: {
        highlight: [0, 2, 6, 8],
        setValues: asValues(SWAPPED),
        moves: swapMoves,
      },
    }),
    animStep("build-3", {
      caption: "Fold into the square. The cross slides into the Lo Shu.",
      durationMs: 2000,
      overlay: { show: [] },
      matrix: {
        highlight: movedCells(foldMoves),
        setValues: asValues(LOSHU),
        moves: foldMoves,
      },
    }),
  ],
};

const A_PAIRS = [
  { key: "A.pair-0", chip: "A.chip-0", cells: [0, 8], color: "#c96442", caption: "4 + 6 = 10 — corners balance." },
  { key: "A.pair-1", chip: "A.chip-1", cells: [2, 6], color: "#4a6741", caption: "2 + 8 = 10 — corners balance." },
  { key: "A.pair-2", chip: "A.chip-2", cells: [3, 5], color: "#7a6a9e", caption: "3 + 7 = 10 — edges balance." },
  { key: "A.pair-3", chip: "A.chip-3", cells: [7, 1], color: "#b89a5a", caption: "1 + 9 = 10 — edges balance." },
];

export const scriptA = {
  id: "A",
  title: "Opposites balance",
  steps: A_PAIRS.map((p, i) =>
    animStep(`A-${i + 1}`, {
      caption: p.caption,
      durationMs: 1400,
      overlay: { show: [p.key, p.chip] },
      draw: [
        {
          key: p.key,
          type: "line",
          from: p.cells[0],
          to: p.cells[1],
          color: p.color,
          width: "2.2",
          dash: "6 6",
        },
        {
          key: p.chip,
          type: "chip",
          at: 0.55,
          from: p.cells[0],
          to: p.cells[1],
          text: "10",
          fill: "white",
          stroke: p.color,
          color: p.color,
          w: 28,
          h: 20,
          fontSize: 11,
        },
      ],
      matrix: { highlight: p.cells, setValues: null },
    }),
  ),
};

function sumChip(anchor, dx, dy) {
  return {
    text: "15",
    anchor,
    dx,
    dy,
    fill: "#1a1a1a",
    color: "white",
    w: 20,
    h: 16,
    rx: 8,
    fontSize: 9,
    weight: "400",
    textDy: 3,
  };
}

const B_ROWS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
];
const B_COLS = [
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
];

export const scriptB = {
  id: "B",
  title: "Lines sum to 15",
  steps: [
    animStep("B-1", {
      caption: "Each row sums to 15.",
      durationMs: 1400,
      overlay: { show: ["B.row-0", "B.row-1", "B.row-2"] },
      draw: B_ROWS.map((cells, a) => ({
        key: `B.row-${a}`,
        type: "line",
        from: cells[0],
        to: cells[2],
        extend: 28,
        color: "#1a1a1a",
        width: "1.3",
        dash: "4 6",
        opacity: 0.55,
        chip: sumChip("end", 18, -12),
      })),
      matrix: { highlight: [3, 4, 5], setValues: null },
    }),
    animStep("B-2", {
      caption: "Each column sums to 15.",
      durationMs: 1400,
      overlay: { show: ["B.col-0", "B.col-1", "B.col-2"] },
      draw: B_COLS.map((cells, a) => ({
        key: `B.col-${a}`,
        type: "line",
        from: cells[0],
        to: cells[2],
        extend: 28,
        color: "#1a1a1a",
        width: "1.3",
        dash: "4 6",
        opacity: 0.55,
        chip: sumChip("end", 14, 18),
      })),
      matrix: { highlight: [1, 4, 7], setValues: null },
    }),
    animStep("B-3", {
      caption: "Diagonals too — 8 lines, one constant.",
      durationMs: 1600,
      overlay: { show: ["B.diags"] },
      draw: [
        {
          key: "B.diags",
          type: "segments",
          opacity: 0.7,
          parts: [
            { from: 0, to: 8, extend: 18, color: "#c96442", width: "2", chip: {
              text: "15",
              x: Z / 2,
              y: Z / 2 - 28,
              fill: "#c96442",
              color: "white",
              w: 24,
              h: 20,
              fontSize: 10,
              textDy: 4,
            } },
            { from: 2, to: 6, extend: 18, color: "#c96442", width: "2" },
          ],
        },
      ],
      matrix: { highlight: [4], setValues: null },
    }),
  ],
};

const C_CELLS = [7, 8, 5, 2, 1, 0, 3, 6];
const C_LABELS = [
  { text: "1+6=7", className: "absolute text-[10px] font-mono bg-[#1a1a1a] text-white px-2 py-1 rounded-full shadow pointer-events-none", place: { mid: [7, 8], dx: -29, topCell: 7, dy: -9 } },
  { text: "7+2=9", className: "absolute text-[10px] font-mono bg-[#1a1a1a] text-white px-2 py-1 rounded-full shadow pointer-events-none", place: { cell: 5, dx: -29, midY: [5, 2], dy: -29 } },
  { text: "9+4=13→3", className: "absolute text-[10px] font-mono bg-[#c96442] text-white px-2 py-1 rounded-full shadow pointer-events-none", place: { mid: [1, 0], dx: -44, topCell: 1, dy: -32 } },
  { text: "3+8=11→1", className: "absolute text-[10px] font-mono bg-[#1a1a1a] text-white px-2 py-1 rounded-full shadow pointer-events-none", place: { cell: 3, dx: -39, midY: [3, 6], dy: -34 } },
];

export const scriptC = {
  id: "C",
  title: "Clockwise addition mod 10",
  steps: [
    ["1 + 6 = 7", [7, 8, 5]],
    ["7 + 2 = 9", [5, 2, 1]],
    ["9 + 4 = 13 → 3", [1, 0, 3]],
    ["3 + 8 = 11 → 1", [3, 6, 7]],
  ].map(([caption, highlight], k) => {
    const show = [...(k === 0 ? ["C.path"] : []), `C.seg-${2 * k}`, `C.seg-${2 * k + 1}`, `C.label-${k}`];
    const draw = [];
    if (k === 0) {
      draw.push({
        key: "C.path",
        type: "path",
        cells: C_CELLS,
        close: true,
        color: "#1a1a1a",
        width: "1.6",
        dash: "8 8",
        opacity: 0.6,
      });
    }
    for (const seg of [2 * k, 2 * k + 1]) {
      draw.push({
        key: `C.seg-${seg}`,
        type: "wedge",
        from: C_CELLS[seg],
        to: C_CELLS[(seg + 1) % C_CELLS.length],
        color: "#c96442",
        width: "1.6",
      });
    }
    draw.push({ key: `C.label-${k}`, type: "badge", ...C_LABELS[k] });
    return animStep(`C-${k + 1}`, {
      caption,
      durationMs: 1500,
      overlay: { show },
      draw,
      matrix: { highlight, setValues: null },
    });
  }),
};

const D_ARMS = [
  { edge: 1, corner: 0, text: "5+9→4", place: { mid: [1, 0], dx: -29, topCell: 1, dy: -32 } },
  { edge: 5, corner: 2, text: "5+7→2", place: { cell: 2, dx: -46, dy: -25 } },
  { edge: 7, corner: 8, text: "5+1→6", place: { mid: [7, 8], dx: -19, topCell: 7, dy: -33 } },
  { edge: 3, corner: 6, text: "5+3→8", place: { cell: 3, dx: -32, midY: [3, 6], dy: 20 } },
];

export const scriptD = {
  id: "D",
  title: "Counterclockwise arms",
  steps: [
    ["5 + 9 = 14 → 4", [4, 1, 0]],
    ["5 + 7 = 12 → 2", [4, 5, 2]],
    ["5 + 1 = 6", [4, 7, 8]],
    ["5 + 3 = 8", [4, 3, 6]],
  ].map(([caption, highlight], k) => {
    const arm = D_ARMS[k];
    return animStep(`D-${k + 1}`, {
      caption,
      durationMs: 1400,
      overlay: { show: [`D.arm-${k}`, `D.label-${k}`] },
      draw: [
        {
          key: `D.arm-${k}`,
          type: "segments",
          parts: [
            { from: 4, to: arm.edge, color: "#7a6a9e", width: "1.4", dash: "3 4" },
            { from: arm.edge, to: arm.corner, color: "#7a6a9e", width: "2", marker: "arrowSmall" },
          ],
        },
        {
          key: `D.label-${k}`,
          type: "badge",
          text: arm.text,
          className: "absolute text-[9px] font-mono bg-[#7a6a9e] text-white px-2 py-1 rounded-full pointer-events-none",
          place: arm.place,
        },
      ],
      matrix: { highlight, setValues: null },
    });
  }),
};

const E_BADGE = "absolute text-[10px] font-mono pointer-events-none px-2.5 py-1 rounded-full";

export const scriptE = {
  id: "E",
  title: "Five rules everything",
  steps: [
    animStep("E-1", {
      caption: "Total 45 = 9 × 5.",
      durationMs: 1400,
      overlay: { show: ["E.ring-2", "E.badge-total"] },
      draw: [
        { key: "E.ring-2", type: "ring", r: 148, color: "#c96442", width: "1", dash: "2 10", opacity: 0.2 },
        {
          key: "E.badge-total",
          type: "badge",
          text: "Total 45 = 9×5",
          className: `${E_BADGE} bg-[#1a1a1a] text-white`,
          style: { left: "50%", top: -16, transform: "translateX(-50%)" },
        },
      ],
      matrix: { highlight: ALL, setValues: null },
    }),
    animStep("E-2", {
      caption: "Opposite 10 = 2 × 5.",
      durationMs: 1400,
      overlay: { show: ["E.ring-0", "E.badge-opp"] },
      draw: [
        { key: "E.ring-0", type: "ring", r: 62, color: "#b89a5a", width: "1", dash: "4 6", opacity: 0.6 },
        {
          key: "E.badge-opp",
          type: "badge",
          text: "Opposite 10 = 2×5",
          className: `${E_BADGE} bg-[#b89a5a] text-white`,
          style: { left: "50%", top: "50%", transform: "translate(-50%, -88px)" },
        },
      ],
      matrix: { highlight: [0, 8], setValues: null },
    }),
    animStep("E-3", {
      caption: "Magic 15 = 3 × 5.",
      durationMs: 1400,
      overlay: { show: ["E.ring-1", "E.badge-magic"] },
      draw: [
        { key: "E.ring-1", type: "ring", r: 108, color: "#1a1a1a", width: "1", dash: "2 8", opacity: 0.25 },
        {
          key: "E.badge-magic",
          type: "badge",
          text: "Magic 15 = 3×5",
          className: `${E_BADGE} bg-white border`,
          style: { left: "50%", top: "50%", transform: "translate(-50%, 78px)" },
        },
      ],
      matrix: { highlight: [3, 4, 5], setValues: null },
    }),
  ],
};

const F_BADGE = "absolute text-[10px] font-mono text-white px-2 py-1 rounded-full pointer-events-none";

export const scriptF = {
  id: "F",
  title: "Corners = Edges",
  steps: [
    animStep("F-1", {
      caption: "Corners are even — sum 20.",
      durationMs: 1400,
      overlay: { show: ["F.badge-corners"] },
      draw: [
        {
          key: "F.badge-corners",
          type: "badge",
          text: "Corners even Σ20",
          className: `${F_BADGE} bg-[#c96442]`,
          style: { left: 8, top: -18 },
        },
      ],
      matrix: { highlight: [0, 2, 6, 8], setValues: null },
    }),
    animStep("F-2", {
      caption: "Edges are odd — sum 20.",
      durationMs: 1400,
      overlay: { show: ["F.badge-edges"] },
      draw: [
        {
          key: "F.badge-edges",
          type: "badge",
          text: "Edges odd Σ20",
          className: `${F_BADGE} bg-[#4a6741]`,
          style: { right: 8, top: -18 },
        },
      ],
      matrix: { highlight: [1, 3, 5, 7], setValues: null },
    }),
    animStep("F-3", {
      caption: "20 = 20 — parity balances around 5.",
      durationMs: 1600,
      overlay: { show: [] },
      matrix: { highlight: [0, 1, 2, 3, 5, 6, 7, 8], setValues: null },
    }),
  ],
};

export const scriptG = {
  id: "G",
  title: "Zero-balanced form",
  steps: [
    animStep("G-1", {
      caption: "Positive cells: +4, +2, +3, +1.",
      durationMs: 1400,
      overlay: { show: ["G.pos"] },
      draw: [{ key: "G.pos", type: "cellTag", cells: [1, 5, 6, 8], texts: ["+4", "+2", "+3", "+1"] }],
      matrix: { highlight: [1, 5, 6, 8], setValues: null },
    }),
    animStep("G-2", {
      caption: "Negative cells: −1, −3, −2, −4.",
      durationMs: 1400,
      overlay: { show: ["G.neg"] },
      draw: [{ key: "G.neg", type: "cellTag", cells: [0, 2, 3, 7], texts: ["-1", "-3", "-2", "-4"] }],
      matrix: { highlight: [0, 2, 3, 7], setValues: null },
    }),
    animStep("G-3", {
      caption: "Center 0 — every line sums to 0.",
      durationMs: 1600,
      overlay: { show: ["G.center"] },
      draw: [{ key: "G.center", type: "cellTag", cells: [4], texts: ["0"] }],
      matrix: { highlight: [4], setValues: null },
    }),
  ],
};

const H_ARMS = [
  { edge: 1, corner: 0 },
  { edge: 5, corner: 2 },
  { edge: 7, corner: 8 },
  { edge: 3, corner: 6 },
];

export const scriptH = {
  id: "H",
  title: "Subtraction = 5",
  steps: [
    ["9 − 4 = 5", [1, 0]],
    ["7 − 2 = 5", [5, 2]],
    ["1 − 6 ≡ 5 (mod 10)", [7, 8]],
    ["3 − 8 ≡ 5 (mod 10)", [3, 6]],
  ].map(([caption, highlight], k) => {
    const arm = H_ARMS[k];
    return animStep(`H-${k + 1}`, {
      caption,
      durationMs: 1400,
      overlay: { show: [`H.arm-${k}`] },
      draw: [
        {
          key: `H.arm-${k}`,
          type: "line",
          from: arm.edge,
          to: arm.corner,
          color: "#c96442",
          width: "2",
          marker: "arrowSmall",
          opacity: 0.9,
          chip: {
            text: "5",
            fill: "#c96442",
            color: "white",
            w: 20,
            h: 18,
            rx: 9,
            fontSize: 9,
            weight: "400",
            textDy: 3,
          },
        },
      ],
      matrix: { highlight, setValues: null },
    });
  }),
};

const I_LABEL = "absolute text-[9px] font-mono bg-white border px-1.5 py-0.5 rounded-full pointer-events-none";

export const scriptI = {
  id: "I",
  title: "Middle is mean",
  steps: [
    animStep("I-1", {
      caption: "Diagonal: (4 + 6) / 2 = 5.",
      durationMs: 1400,
      overlay: { show: ["I.line-0", "I.label-0"] },
      draw: [
        { key: "I.line-0", type: "line", from: 0, to: 8, color: "#1a1a1a", width: "1.2", opacity: 0.35 },
        { key: "I.label-0", type: "badge", text: "(4+6)/2=5", className: I_LABEL, place: { cell: 0, dx: 58, dy: 9 } },
      ],
      matrix: { highlight: [0, 4, 8], setValues: null },
    }),
    animStep("I-2", {
      caption: "Other diagonal ends average to 5.",
      durationMs: 1400,
      overlay: { show: ["I.line-1", "I.center"] },
      draw: [
        { key: "I.line-1", type: "line", from: 2, to: 6, color: "#1a1a1a", width: "1.2", opacity: 0.35 },
        { key: "I.center", type: "mark", text: "μ", r: 18, fill: "#1a1a1a" },
      ],
      matrix: { highlight: [2, 4, 6], setValues: null },
    }),
    animStep("I-3", {
      caption: "Middle column: (9 + 1) / 2 = 5.",
      durationMs: 1400,
      overlay: { show: ["I.line-2", "I.label-1"] },
      draw: [
        { key: "I.line-2", type: "line", from: 1, to: 7, color: "#1a1a1a", width: "1.2", opacity: 0.35 },
        { key: "I.label-1", type: "badge", text: "(9+1)/2=5", className: I_LABEL, place: { cell: 1, dx: 34, dy: 9 } },
      ],
      matrix: { highlight: [1, 4, 7], setValues: null },
    }),
    animStep("I-4", {
      caption: "Middle row: (3 + 7) / 2 = 5.",
      durationMs: 1400,
      overlay: { show: ["I.line-3", "I.label-2"] },
      draw: [
        { key: "I.line-3", type: "line", from: 3, to: 5, color: "#1a1a1a", width: "1.2", opacity: 0.35 },
        { key: "I.label-2", type: "badge", text: "(3+7)/2=5", className: I_LABEL, place: { cell: 3, dx: 58, dy: 58 } },
      ],
      matrix: { highlight: [3, 4, 5], setValues: null },
    }),
  ],
};

const J_PILL = "text-[11px] font-mono px-2 py-1 rounded-full";

function jLines(key, triples, color) {
  return {
    key,
    type: "segments",
    opacity: 0.9,
    parts: triples.map(([from, to]) => ({ from, to, color, width: "2" })),
  };
}

export const scriptJ = {
  id: "J",
  title: "111 property",
  steps: [
    animStep("J-1", {
      caption: "Rows as numbers: 492 + 357 + 816.",
      durationMs: 1500,
      overlay: { show: ["J.rows", "J.badge-rows"] },
      draw: [
        jLines("J.rows", [[0, 2], [3, 5], [6, 8]], "#b89a5a"),
        {
          key: "J.badge-rows",
          type: "badge",
          row: "j-rows",
          rowStyle: { bottom: -38 },
          text: "492 + 357 + 816 = 1665",
          className: `${J_PILL} bg-white border`,
        },
      ],
      matrix: { highlight: [0, 1, 2], setValues: null },
    }),
    animStep("J-2", {
      caption: "Columns: 438 + 951 + 276.",
      durationMs: 1500,
      overlay: { show: ["J.cols", "J.badge-cols"] },
      draw: [
        jLines("J.cols", [[0, 6], [1, 7], [2, 8]], "#4a6741"),
        {
          key: "J.badge-cols",
          type: "badge",
          row: "j-cols",
          rowStyle: { top: -34 },
          text: "438 + 951 + 276 = 1665",
          className: `${J_PILL} bg-white border`,
        },
      ],
      matrix: { highlight: [0, 3, 6], setValues: null },
    }),
    animStep("J-3", {
      caption: "Both sum to 1665 = 15 × 111.",
      durationMs: 1600,
      overlay: { show: ["J.badge-reveal"] },
      draw: [
        {
          key: "J.badge-reveal",
          type: "badge",
          row: "j-rows",
          rowStyle: { bottom: -38 },
          text: "15×111",
          className: `${J_PILL} bg-[#1a1a1a] text-white`,
        },
      ],
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
      caption: "det = 360 = 3 × 4 × 5 × 6.",
      durationMs: 1600,
      overlay: { show: ["K.badge"] },
      draw: [
        {
          key: "K.badge",
          type: "badge",
          text: "det = 360 = 3×4×5×6 (reflections flip the sign)",
          className:
            "absolute left-1/2 -translate-x-1/2 text-[10px] font-mono bg-[#1a1a1a] text-white px-3 py-1 rounded-full whitespace-nowrap pointer-events-none",
          style: { bottom: -36 },
        },
      ],
      matrix: { highlight: [4], setValues: null },
    }),
  ],
};

const POSITIVE_CELLS = [1, 5, 6, 8];
const NEGATIVE_CELLS = [0, 2, 3, 7];

function lBar(cell) {
  return { key: `L.bar-${cell}`, type: "bar", cell, delta: LOSHU[cell] - 5 };
}

export const scriptL = {
  id: "L",
  title: "Mirrored distance",
  steps: [
    animStep("L-1", {
      caption: "Above 5: +4, +3, +2, +1.",
      durationMs: 1400,
      overlay: { show: POSITIVE_CELLS.map((c) => `L.bar-${c}`) },
      draw: POSITIVE_CELLS.map(lBar),
      matrix: { highlight: POSITIVE_CELLS, setValues: null },
    }),
    animStep("L-2", {
      caption: "Below 5, mirrored: −1, −2, −3, −4.",
      durationMs: 1600,
      overlay: { show: NEGATIVE_CELLS.map((c) => `L.bar-${c}`) },
      draw: NEGATIVE_CELLS.map(lBar),
      matrix: { highlight: NEGATIVE_CELLS, setValues: null },
    }),
  ],
};

const VALUE_INDEX = { 1: 7, 2: 2, 3: 3, 4: 0, 5: 4, 6: 8, 7: 5, 8: 6, 9: 1 };
const M_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function mHop(d) {
  const from = VALUE_INDEX[M_ORDER[d]];
  const to = VALUE_INDEX[M_ORDER[d + 1]];
  const look = hopLook(from, to);
  return {
    key: `M.hop-${d}`,
    type: "arc",
    from,
    to,
    bendX: d % 2 === 0 ? 18 : -18,
    bendY: d % 3 === 0 ? -18 : 12,
    color: look.color,
    width: look.width,
    dash: look.dash,
    marker: "arrowSmall",
    opacity: 0.8,
    label: `${M_ORDER[d]}→${M_ORDER[d + 1]}`,
  };
}

export const scriptM = {
  id: "M",
  title: "Knight's tour (torus)",
  chrome: [
    {
      key: "M.note",
      type: "badge",
      chrome: true,
      text: "torus wrap • dashed",
      className:
        "absolute right-2 -top-2 text-[9px] font-mono bg-[#7a6a9e] text-white px-2 py-1 rounded-full pointer-events-none",
    },
  ],
  steps: [1, 3, 5, 7].map((first, k) =>
    animStep(`M-${k + 1}`, {
      caption:
        k === 0
          ? "1 → 2 → 3 — knight moves."
          : k === 3
            ? "7 → 8 → 9 — knight moves."
            : `${first} → ${first + 1} → ${first + 2} — short steps.`,
      durationMs: 1600,
      overlay: { show: [`M.hop-${2 * k}`, `M.hop-${2 * k + 1}`] },
      draw: [mHop(2 * k), mHop(2 * k + 1)],
      matrix: {
        highlight: [VALUE_INDEX[first], VALUE_INDEX[first + 1], VALUE_INDEX[first + 2]],
        setValues: null,
      },
    }),
  ),
};

// D₄: four rotations, then the same four of the left-right reflection.
// perm[i] is the source cell in the original square. Matches the rot/mir
// used by verify.transforms, listed rotations-first so the board turns
// before it mirrors.
const ROT = [6, 3, 0, 7, 4, 1, 8, 5, 2];
const MIR = [2, 1, 0, 5, 4, 3, 8, 7, 6];
const composePerm = (a, b) => b.map((i) => a[i]);

function d4Perms() {
  const forms = [];
  let perm = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (let k = 0; k < 4; k++) {
    forms.push(perm);
    perm = composePerm(perm, ROT);
  }
  perm = MIR;
  for (let k = 0; k < 4; k++) {
    forms.push(perm);
    perm = composePerm(perm, ROT);
  }
  return forms;
}

function movesForPerms(prev, next) {
  const inv = [];
  prev.forEach((src, i) => {
    inv[src] = i;
  });
  const moves = [];
  for (let i = 0; i < 9; i++) {
    const from = inv[next[i]];
    if (from !== i) moves.push({ from, to: i });
  }
  return moves;
}

const D4_PERMS = d4Perms();
const D4_GRIDS = D4_PERMS.map((perm) => perm.map((src) => LOSHU[src]));
const N_CAPTIONS = [
  "The square itself — rotation 0°.",
  "Turn 90°. One square, turned.",
  "Turn 180°.",
  "Turn 270°.",
  "Reflect left to right.",
  "Reflect, then turn 90°.",
  "Reflect, then turn 180°.",
  "Reflect, then turn 270°. Eight faces of one.",
];

export const scriptN = {
  id: "N",
  title: "All 3×3 are Lo Shu",
  steps: D4_PERMS.map((perm, k) => {
    const grid = D4_GRIDS[k];
    const moves = k === 0 ? [] : movesForPerms(D4_PERMS[k - 1], perm);
    return animStep(`N-${k + 1}`, {
      caption: N_CAPTIONS[k],
      durationMs: 1500,
      overlay: { show: [] },
      matrix: {
        highlight: [],
        setValues: asValues(grid),
        moves,
      },
    });
  }),
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
