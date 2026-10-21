// Animation scripts for every Lo Shu property (A–N) plus the ordinal
// construction. Each step lists overlay keys and the draw items those keys
// render (see js/overlay.js). Captions compress each property's formula.
//
// Cell indices follow SQUARE = [4,9,2,3,5,7,8,1,6] in js/app.js.
import { animStep } from "./animation.js";
import { Z, CENTERS, rowGutter, colGutter, cornerGutter } from "./overlay.js";

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

// Property A: each beat focuses the operands, assembles the equation at the
// chord midpoint, and resolves to 10. An ordinal cell tag duplicates the
// color cue, and the closing beat locks the persistent opposites = 2 × 5.
export const scriptA = {
  id: "A",
  title: "Opposites balance",
  steps: [
    ...A_PAIRS.map((p, i) => {
      const v0 = LOSHU[p.cells[0]];
      const v1 = LOSHU[p.cells[1]];
      return animStep(`A-${i + 1}`, {
        caption: `Pair ${i + 1} of 4: ${p.caption}`,
        durationMs: 1900,
        overlay: { show: [p.key, `A.ord-${i}`, `A.eq-${i}`, p.chip] },
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
          { key: `A.ord-${i}`, type: "cellTag", cells: [p.cells[0]], texts: [String(i + 1)] },
          {
            key: `A.eq-${i}`,
            type: "chip",
            at: 0.3,
            from: p.cells[0],
            to: p.cells[1],
            t: 0.25,
            text: `${v0}+${v1}`,
            fill: "white",
            stroke: p.color,
            color: p.color,
            w: 46,
            h: 20,
            fontSize: 12,
          },
          {
            key: p.chip,
            type: "chip",
            at: 0.55,
            from: p.cells[0],
            to: p.cells[1],
            text: "10",
            fill: p.color,
            stroke: p.color,
            color: "white",
            w: 30,
            h: 22,
            fontSize: 14,
            weight: "700",
          },
        ],
        matrix: { highlight: p.cells, setValues: null },
      });
    }),
    animStep("A-5", {
      caption: "Every opposite pair sums to 10 — twice the center 5.",
      durationMs: 2000,
      overlay: { show: ["A.lock"] },
      draw: [
        {
          key: "A.lock",
          type: "badge",
          at: 0.4,
          text: "opposites = 2 × 5",
          className:
            "absolute text-[13px] font-mono bg-[#1a1a1a] text-white px-3 py-1 rounded-full shadow pointer-events-none whitespace-nowrap",
          style: { left: "50%", top: -18, transform: "translateX(-50%)" },
        },
      ],
      matrix: { highlight: ALL, setValues: null },
    }),
  ],
};

// Property B: one hero line per step with the total as a margin tick, then
// the full eight-line overview. Ticks sit outside the board (rowGutter /
// colGutter / cornerGutter) so they never cover a numeral.
function heroLine(key, from, to) {
  return { key, type: "line", from, to, extend: 12, color: "#1a1a1a", width: "2" };
}

function faintLine(key, from, to) {
  return {
    key,
    type: "line",
    from,
    to,
    extend: 12,
    color: "#1a1a1a",
    width: "1.2",
    dash: "4 6",
    opacity: 0.3,
  };
}

function gutterTick(key, pos) {
  return {
    key,
    type: "gutter",
    at: 0.55,
    x: pos.x,
    y: pos.y,
    text: "= 15",
    fill: "#1a1a1a",
    color: "white",
    w: 34,
    h: 18,
    rx: 9,
    fontSize: 11,
    weight: "700",
    textDy: 4,
  };
}

export const scriptB = {
  id: "B",
  title: "Lines sum to 15",
  steps: [
    animStep("B-1", {
      caption: "4 + 9 + 2 = 15 — the top row accumulates.",
      durationMs: 1800,
      overlay: { show: ["B.row-0", "B.tick-0"] },
      draw: [heroLine("B.row-0", 0, 2), gutterTick("B.tick-0", rowGutter(0))],
      matrix: { highlight: [0, 1, 2], setValues: null },
    }),
    animStep("B-2", {
      caption: "4 + 3 + 8 = 15 — the left column.",
      durationMs: 1800,
      overlay: { show: ["B.col-0", "B.tick-1"] },
      draw: [heroLine("B.col-0", 0, 6), gutterTick("B.tick-1", colGutter(0))],
      matrix: { highlight: [0, 3, 6], setValues: null },
    }),
    animStep("B-3", {
      caption: "Diagonals too — 8 lines, one constant.",
      durationMs: 1800,
      overlay: {
        show: ["B.diag-0", "B.diag-1", "B.tick-2", "B.ctx-0", "B.ctx-1", "B.ctx-2", "B.ctx-3"],
      },
      draw: [
        heroLine("B.diag-0", 0, 8),
        heroLine("B.diag-1", 2, 6),
        gutterTick("B.tick-2", cornerGutter()),
        faintLine("B.ctx-0", 3, 5),
        faintLine("B.ctx-1", 6, 8),
        faintLine("B.ctx-2", 1, 7),
        faintLine("B.ctx-3", 2, 8),
      ],
      matrix: { highlight: ALL, setValues: null },
    }),
  ],
};

// Property C: traveling token around the perimeter. Each step draws the two
// hero hops solid, assembles the equation mid-step, then lands the result
// near the target cell. Overflow steps split the tens: a muted sum drops
// away and an emphasized ones-digit lands (tens-drop event, not text).
const C_CELLS = [7, 8, 5, 2, 1, 0, 3, 6];
const C_BEATS = [
  { eq: "1+6", sum: null, res: "7" },
  { eq: "7+2", sum: null, res: "9" },
  { eq: "9+4", sum: "13", res: "3" },
  { eq: "3+8", sum: "11", res: "1" },
];

function cChip(key, from, to, text, at, look) {
  return {
    key,
    type: "chip",
    at,
    from,
    to,
    anchor: "end",
    dy: -32,
    text,
    ...look,
  };
}

export const scriptC = {
  id: "C",
  title: "Clockwise addition mod 10",
  steps: [
    ["1 + 6 = 7 — token travels 1 → 6 → 7.", [7, 8, 5]],
    ["7 + 2 = 9 — running total rides the border.", [5, 2, 1]],
    ["9 + 4 = 13 → 3 — the tens drops away.", [1, 0, 3]],
    ["3 + 8 = 11 → 1 — the tens drops away.", [3, 6, 7]],
  ].map(([caption, highlight], k) => {
    const beat = C_BEATS[k];
    const a = C_CELLS[2 * k];
    const b = C_CELLS[(2 * k + 1) % C_CELLS.length];
    const c = C_CELLS[(2 * k + 2) % C_CELLS.length];
    const show = [...(k === 0 ? ["C.path"] : []), `C.hero-${k}`, `C.eq-${k}`];
    const draw = [];
    if (k === 0) {
      draw.push({
        key: "C.path",
        type: "path",
        cells: C_CELLS,
        close: true,
        color: "#1a1a1a",
        width: "1.2",
        dash: "8 8",
        opacity: 0.35,
      });
    }
    draw.push({
      key: `C.hero-${k}`,
      type: "segments",
      parts: [
        { from: a, to: b, color: "#c96442", width: "2" },
        { from: b, to: c, color: "#c96442", width: "2", marker: "arrowSmall" },
      ],
    });
    draw.push(
      cChip(`C.eq-${k}`, a, b, beat.eq, 0.3, {
        fill: "white",
        stroke: "#1a1a1a",
        color: "#1a1a1a",
        w: 46,
        h: 20,
        fontSize: 12,
      }),
    );
    if (beat.sum) {
      show.push(`C.sum-${k}`, `C.res-${k}`);
      draw.push(
        cChip(`C.sum-${k}`, b, c, beat.sum, 0.55, {
          fill: "#f0ece4",
          stroke: "#c96442",
          color: "#c96442",
          w: 34,
          h: 20,
          fontSize: 11,
        }),
        cChip(`C.res-${k}`, b, c, beat.res, 0.75, {
          fill: "#c96442",
          stroke: "#c96442",
          color: "white",
          w: 30,
          h: 22,
          fontSize: 14,
          weight: "700",
        }),
      );
    } else {
      show.push(`C.res-${k}`);
      draw.push(
        cChip(`C.res-${k}`, b, c, beat.res, 0.55, {
          fill: "#c96442",
          stroke: "#c96442",
          color: "white",
          w: 30,
          h: 22,
          fontSize: 14,
          weight: "700",
        }),
      );
    }
    return animStep(`C-${k + 1}`, {
      caption,
      durationMs: 1900,
      overlay: { show },
      draw,
      matrix: { highlight, setValues: null },
    });
  }),
};

// Property D: the center 5 token joins the edge value, then the result
// rides the second arm into the corner. Same tens-drop grammar as C; one
// compass badge on the first step names the counterclockwise sense.
const D_BEATS = [
  { edge: 1, corner: 0, eq: "5+9", sum: "14", res: "4" },
  { edge: 5, corner: 2, eq: "5+7", sum: "12", res: "2" },
  { edge: 7, corner: 8, eq: "5+1", sum: null, res: "6" },
  { edge: 3, corner: 6, eq: "5+3", sum: null, res: "8" },
];

export const scriptD = {
  id: "D",
  title: "Counterclockwise arms",
  steps: [
    ["5 + 9 = 14 → 4 — 5 joins 9, tens drops.", [4, 1, 0]],
    ["5 + 7 = 12 → 2 — 5 joins 7, tens drops.", [4, 5, 2]],
    ["5 + 1 = 6 — straight into the corner.", [4, 7, 8]],
    ["5 + 3 = 8 — straight into the corner.", [4, 3, 6]],
  ].map(([caption, highlight], k) => {
    const beat = D_BEATS[k];
    const show = [`D.arm-${k}`, `D.eq-${k}`];
    const draw = [
      {
        key: `D.arm-${k}`,
        type: "segments",
        parts: [
          { from: 4, to: beat.edge, color: "#7a6a9e", width: "1.4", dash: "3 4" },
          { from: beat.edge, to: beat.corner, color: "#7a6a9e", width: "2", marker: "arrowSmall" },
        ],
      },
      {
        key: `D.eq-${k}`,
        type: "chip",
        at: 0.3,
        from: 4,
        to: beat.edge,
        text: beat.eq,
        fill: "white",
        stroke: "#7a6a9e",
        color: "#7a6a9e",
        w: 46,
        h: 20,
        fontSize: 12,
      },
    ];
    if (beat.sum) {
      show.push(`D.sum-${k}`, `D.res-${k}`);
      draw.push(
        {
          key: `D.sum-${k}`,
          type: "chip",
          at: 0.55,
          from: beat.edge,
          to: beat.corner,
          anchor: "end",
          dy: -32,
          text: beat.sum,
          fill: "#f0ece4",
          stroke: "#7a6a9e",
          color: "#7a6a9e",
          w: 34,
          h: 20,
          fontSize: 11,
        },
        {
          key: `D.res-${k}`,
          type: "chip",
          at: 0.75,
          from: beat.edge,
          to: beat.corner,
          anchor: "end",
          dy: -32,
          text: beat.res,
          fill: "#7a6a9e",
          stroke: "#7a6a9e",
          color: "white",
          w: 30,
          h: 22,
          fontSize: 14,
          weight: "700",
        },
      );
    } else {
      show.push(`D.res-${k}`);
      draw.push({
        key: `D.res-${k}`,
        type: "chip",
        at: 0.55,
        from: beat.edge,
        to: beat.corner,
        anchor: "end",
        dy: -32,
        text: beat.res,
        fill: "#7a6a9e",
        stroke: "#7a6a9e",
        color: "white",
        w: 30,
        h: 22,
        fontSize: 14,
        weight: "700",
      });
    }
    if (k === 0) {
      show.push("D.ccw");
      draw.push({
        key: "D.ccw",
        type: "badge",
        at: 0.15,
        text: "↺ counterclockwise from 5",
        className:
          "absolute text-[11px] font-mono bg-white border px-2 py-1 rounded-full shadow pointer-events-none whitespace-nowrap",
        style: { left: "50%", top: 106, transform: "translateX(-50%)" },
      });
    }
    return animStep(`D-${k + 1}`, {
      caption,
      durationMs: 1900,
      overlay: { show },
      draw,
      matrix: { highlight, setValues: null },
    });
  }),
};

// Property E: three deliberately different groupings instead of decorative
// rings. All nine cells collect to 45, one opposite pair joins to 10, one
// magic line accumulates to 15 — then the three totals snap into a fact
// stack on the right margin, reusing B's gutter pattern.
function eTotal(key, pos, text, at = 0.55) {
  return {
    key,
    type: "gutter",
    at,
    x: pos.x,
    y: pos.y,
    text,
    fill: "#1a1a1a",
    color: "white",
    w: 110,
    h: 22,
    rx: 11,
    fontSize: 13,
    weight: "700",
    textDy: 4,
  };
}

export const scriptE = {
  id: "E",
  title: "Five rules everything",
  steps: [
    animStep("E-1", {
      caption: "All nine cells collect to 45 — nine times 5.",
      durationMs: 1800,
      overlay: { show: ["E.tot-all"] },
      draw: [eTotal("E.tot-all", { x: Z / 2, y: -16 }, "Σ 45 = 9×5")],
      matrix: { highlight: ALL, setValues: null },
    }),
    animStep("E-2", {
      caption: "One opposite pair joins to 10 — two times 5.",
      durationMs: 1800,
      overlay: { show: ["E.pair", "E.tot-pair"] },
      draw: [
        { key: "E.pair", type: "line", from: 0, to: 8, color: "#b89a5a", width: "2" },
        {
          key: "E.tot-pair",
          type: "chip",
          at: 0.55,
          from: 0,
          to: 8,
          dx: -58,
          dy: -34,
          text: "10 = 2×5",
          fill: "#b89a5a",
          stroke: "#b89a5a",
          color: "white",
          w: 84,
          h: 22,
          fontSize: 12,
          weight: "700",
        },
      ],
      matrix: { highlight: [0, 8], setValues: null },
    }),
    animStep("E-3", {
      caption: "One magic line accumulates to 15 — three times 5.",
      durationMs: 1800,
      overlay: { show: ["E.row", "E.tot-row"] },
      draw: [
        { key: "E.row", type: "line", from: 3, to: 5, extend: 12, color: "#1a1a1a", width: "2" },
        {
          key: "E.tot-row",
          type: "chip",
          at: 0.55,
          from: 3,
          to: 5,
          dx: 58,
          dy: -34,
          text: "15 = 3×5",
          fill: "#1a1a1a",
          stroke: "#1a1a1a",
          color: "white",
          w: 84,
          h: 22,
          fontSize: 12,
          weight: "700",
        },
      ],
      matrix: { highlight: [3, 4, 5], setValues: null },
    }),
    animStep("E-4", {
      caption: "Three faces of 5 — 45, 10, 15.",
      durationMs: 1800,
      overlay: { show: ["E.stk-0", "E.stk-1", "E.stk-2"] },
      draw: [
        ["E.stk-0", 0, "45 = 9×5", 0.3],
        ["E.stk-1", 1, "10 = 2×5", 0.5],
        ["E.stk-2", 2, "15 = 3×5", 0.7],
      ].map(([key, row, text, at]) => {
        const pos = rowGutter(row);
        return {
          key,
          type: "gutter",
          at,
          x: pos.x,
          y: pos.y,
          text,
          fill: "white",
          stroke: "#1a1a1a",
          color: "#1a1a1a",
          w: 78,
          h: 20,
          rx: 10,
          fontSize: 11,
          weight: "700",
          textDy: 4,
        };
      }),
      matrix: { highlight: [4], setValues: null },
    }),
  ],
};

// Property F: group-then-balance. Corners join as an X, edges join as a
// plus, each collects into a large Σ 20 total in the top margin with
// even/odd cell tags (shape + letter, not color alone). The last step
// beams the two totals together as 20 = 20.
const F_EQ = "absolute text-[13px] font-mono px-3 py-1 rounded-full pointer-events-none whitespace-nowrap";

export const scriptF = {
  id: "F",
  title: "Corners = Edges",
  steps: [
    animStep("F-1", {
      caption: "Corners are even — collect to Σ 20.",
      durationMs: 1800,
      overlay: { show: ["F.x-c", "F.tot-c", "F.ptag-c"] },
      draw: [
        {
          key: "F.x-c",
          type: "segments",
          parts: [
            { from: 0, to: 8, color: "#c96442", width: "1.6" },
            { from: 2, to: 6, color: "#c96442", width: "1.6" },
          ],
        },
        {
          key: "F.tot-c",
          type: "gutter",
          at: 0.55,
          x: 80,
          y: -16,
          text: "corners Σ 20",
          fill: "#c96442",
          color: "white",
          w: 96,
          h: 22,
          rx: 11,
          fontSize: 13,
          weight: "700",
          textDy: 4,
        },
        { key: "F.ptag-c", type: "cellTag", cells: [0, 2, 6, 8], texts: ["E", "E", "E", "E"] },
      ],
      matrix: { highlight: [0, 2, 6, 8], setValues: null },
    }),
    animStep("F-2", {
      caption: "Edges are odd — collect to Σ 20.",
      durationMs: 1800,
      overlay: { show: ["F.plus-e", "F.tot-e", "F.ptag-e"] },
      draw: [
        {
          key: "F.plus-e",
          type: "segments",
          parts: [
            { from: 1, to: 7, color: "#4a6741", width: "1.6" },
            { from: 3, to: 5, color: "#4a6741", width: "1.6" },
          ],
        },
        {
          key: "F.tot-e",
          type: "gutter",
          at: 0.55,
          x: 260,
          y: -16,
          text: "edges Σ 20",
          fill: "#4a6741",
          color: "white",
          w: 96,
          h: 22,
          rx: 11,
          fontSize: 13,
          weight: "700",
          textDy: 4,
        },
        { key: "F.ptag-e", type: "cellTag", cells: [1, 3, 5, 7], texts: ["O", "O", "O", "O"] },
      ],
      matrix: { highlight: [1, 3, 5, 7], setValues: null },
    }),
    animStep("F-3", {
      caption: "20 = 20 — parity balances around 5.",
      durationMs: 1800,
      overlay: { show: ["F.eq"] },
      draw: [
        {
          key: "F.eq",
          type: "badge",
          at: 0.4,
          text: "20 = 20",
          className: `${F_EQ} bg-[#1a1a1a] text-white shadow`,
          style: { left: "50%", top: -18, transform: "translateX(-50%)" },
        },
      ],
      matrix: { highlight: [0, 1, 2, 3, 5, 6, 7, 8], setValues: null },
    }),
  ],
};

// Property G: the deviations are already on the board after subtracting 5;
// this makes the cancellation visible. One middle-row beat shows opposite
// tokens canceling to a quiet margin mark, then the column and diagonal
// families join it so the end state is three restrained Σ 0 ticks.
export const scriptG = {
  id: "G",
  title: "Zero-balanced form",
  steps: [
    animStep("G-1", {
      caption: "Positives after −5: +4, +2, +3, +1.",
      durationMs: 1800,
      overlay: { show: ["G.pos"] },
      draw: [{ key: "G.pos", type: "cellTag", cells: [1, 5, 6, 8], texts: ["+4", "+2", "+3", "+1"] }],
      matrix: { highlight: [1, 5, 6, 8], setValues: null },
    }),
    animStep("G-2", {
      caption: "Negatives: −1, −3, −2, −4.",
      durationMs: 1800,
      overlay: { show: ["G.neg"] },
      draw: [{ key: "G.neg", type: "cellTag", cells: [0, 2, 3, 7], texts: ["-1", "-3", "-2", "-4"] }],
      matrix: { highlight: [0, 2, 3, 7], setValues: null },
    }),
    animStep("G-3", {
      caption: "Middle row cancels: −2 + 0 + 2 = 0.",
      durationMs: 1800,
      overlay: { show: ["G.cancel", "G.mid0", "G.eq", "G.zero"] },
      draw: [
        { key: "G.cancel", type: "line", from: 3, to: 5, color: "#1a1a1a", width: "2" },
        { key: "G.mid0", type: "cellTag", cells: [4], texts: ["0"] },
        {
          key: "G.eq",
          type: "chip",
          at: 0.3,
          from: 3,
          to: 5,
          anchor: "end",
          dy: -32,
          text: "−2+0+2",
          fill: "white",
          stroke: "#1a1a1a",
          color: "#1a1a1a",
          w: 64,
          h: 20,
          fontSize: 11,
        },
        {
          key: "G.zero",
          type: "gutter",
          at: 0.6,
          x: rowGutter(1).x,
          y: rowGutter(1).y,
          text: "= 0",
          fill: "#1a1a1a",
          color: "white",
          w: 40,
          h: 20,
          rx: 10,
          fontSize: 13,
          weight: "700",
          textDy: 4,
        },
      ],
      matrix: { highlight: [3, 4, 5], setValues: null },
    }),
    animStep("G-4", {
      caption: "Every line sums to 0 — rows, columns, diagonals.",
      durationMs: 1800,
      overlay: { show: ["G.tick-c", "G.tick-d"] },
      draw: [
        {
          key: "G.tick-c",
          type: "gutter",
          at: 0.35,
          x: colGutter(1).x,
          y: colGutter(1).y,
          text: "Σ 0",
          fill: "white",
          stroke: "#1a1a1a",
          color: "#1a1a1a",
          w: 44,
          h: 20,
          rx: 10,
          fontSize: 12,
          weight: "700",
          textDy: 4,
        },
        {
          key: "G.tick-d",
          type: "gutter",
          at: 0.55,
          x: cornerGutter().x,
          y: cornerGutter().y,
          text: "Σ 0",
          fill: "white",
          stroke: "#1a1a1a",
          color: "#1a1a1a",
          w: 44,
          h: 20,
          rx: 10,
          fontSize: 12,
          weight: "700",
          textDy: 4,
        },
      ],
      matrix: { highlight: ALL, setValues: null },
    }),
  ],
};

const H_ARMS = [
  { edge: 1, corner: 0 },
  { edge: 5, corner: 2 },
  { edge: 7, corner: 8 },
  { edge: 3, corner: 6 },
];

// Property H: the C/D traveling-token grammar in reverse. The minuend is
// selected, the corner is subtracted, and the residual 5 settles at the
// center. The two mod-10 steps pass a visible gate: −5 becomes 5.
export const scriptH = {
  id: "H",
  title: "Subtraction = 5",
  steps: [
    ["9 − 4 = 5 — residual lands at the center.", [1, 0, 4]],
    ["7 − 2 = 5 — residual lands at the center.", [5, 2, 4]],
    ["1 − 6 ≡ 5 (mod 10) — through the gate.", [7, 8, 4]],
    ["3 − 8 ≡ 5 (mod 10) — through the gate.", [3, 6, 4]],
  ].map(([caption, highlight], k) => {
    const arm = H_ARMS[k];
    const eq = ["9−4", "7−2", "1−6", "3−8"][k];
    const mod = k >= 2;
    const show = [`H.arm-${k}`, `H.eq-${k}`, `H.res-${k}`];
    const draw = [
      {
        key: `H.arm-${k}`,
        type: "line",
        from: arm.edge,
        to: arm.corner,
        color: "#c96442",
        width: "2",
        marker: "arrowSmall",
        opacity: 0.9,
      },
      {
        key: `H.eq-${k}`,
        type: "chip",
        at: 0.3,
        from: arm.edge,
        to: arm.corner,
        text: eq,
        fill: "white",
        stroke: "#c96442",
        color: "#c96442",
        w: 46,
        h: 20,
        fontSize: 12,
      },
      {
        key: `H.res-${k}`,
        type: "chip",
        at: 0.6,
        from: arm.corner,
        to: 4,
        anchor: "end",
        dy: -34,
        text: "5",
        fill: "#c96442",
        stroke: "#c96442",
        color: "white",
        w: 30,
        h: 22,
        fontSize: 14,
        weight: "700",
      },
    ];
    if (mod) {
      show.push(`H.gate-${k}`);
      draw.push({
        key: `H.gate-${k}`,
        type: "badge",
        at: 0.75,
        text: "mod 10 gate: −5 → 5",
        className:
          "absolute text-[11px] font-mono bg-[#1a1a1a] text-white px-2 py-1 rounded-full shadow pointer-events-none whitespace-nowrap",
        place: { cell: 4, dx: 0, dy: 52 },
        style: { transform: "translateX(-50%)" },
      });
    }
    return animStep(`H-${k + 1}`, {
      caption,
      durationMs: 1900,
      overlay: { show },
      draw,
      matrix: { highlight, setValues: null },
    });
  }),
};

// Property I: one fixed equation panel for all four axes. Endpoints are
// named in the panel, the faint axis draws first, and the average lands on
// the center with a 5 pulse — the same beat on every axis.
const I_PANEL =
  "absolute text-[12px] font-mono bg-white border px-2.5 py-1 rounded-full shadow pointer-events-none whitespace-nowrap";
const I_AXES = [
  { from: 0, to: 8, cells: [0, 4, 8], eq: "(4 + 6) / 2 = 5" },
  { from: 2, to: 6, cells: [2, 4, 6], eq: "(2 + 8) / 2 = 5" },
  { from: 1, to: 7, cells: [1, 4, 7], eq: "(9 + 1) / 2 = 5" },
  { from: 3, to: 5, cells: [3, 4, 5], eq: "(3 + 7) / 2 = 5" },
];

export const scriptI = {
  id: "I",
  title: "Middle is mean",
  steps: I_AXES.map((axis, k) =>
    animStep(`I-${k + 1}`, {
      caption: `Endpoints average to the center: ${axis.eq}.`,
      durationMs: 1800,
      overlay: { show: [`I.line-${k}`, `I.eq-${k}`, `I.res-${k}`] },
      draw: [
        { key: `I.line-${k}`, type: "line", from: axis.from, to: axis.to, color: "#1a1a1a", width: "1.2", opacity: 0.35 },
        {
          key: `I.eq-${k}`,
          type: "badge",
          at: 0.3,
          text: axis.eq,
          className: I_PANEL,
          style: { left: "50%", top: -18, transform: "translateX(-50%)" },
        },
        { key: `I.res-${k}`, type: "mark", at: 0.6, text: "5", r: 18, fill: "#1a1a1a" },
      ],
      matrix: { highlight: axis.cells, setValues: null },
    }),
  ),
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

// Property J: rows fuse into horizontal number ribbons in the right margin,
// columns into ribbons along the bottom margin; each family stacks into
// 1665, and the payoff step lands the large reduction 1665 = 15 × 111.
function jRibbon(key, pos, text, at, color) {
  return {
    key,
    type: "gutter",
    at,
    x: pos.x,
    y: pos.y,
    text,
    fill: "white",
    stroke: color,
    color: "#1a1a1a",
    w: 46,
    h: 20,
    rx: 10,
    fontSize: 12,
    weight: "700",
    textDy: 4,
  };
}

export const scriptJ = {
  id: "J",
  title: "111 property",
  steps: [
    animStep("J-1", {
      caption: "Rows read as numbers — 492, 357, 816.",
      durationMs: 1800,
      overlay: { show: ["J.rows", "J.rib-0", "J.rib-1", "J.rib-2", "J.badge-rows"] },
      draw: [
        jLines("J.rows", [[0, 2], [3, 5], [6, 8]], "#b89a5a"),
        jRibbon("J.rib-0", rowGutter(0), "492", 0.3, "#b89a5a"),
        jRibbon("J.rib-1", rowGutter(1), "357", 0.5, "#b89a5a"),
        jRibbon("J.rib-2", rowGutter(2), "816", 0.7, "#b89a5a"),
        {
          key: "J.badge-rows",
          type: "badge",
          at: 0.85,
          row: "j-rows",
          rowStyle: { bottom: -38 },
          text: "492 + 357 + 816 = 1665",
          className: `${J_PILL} bg-white border`,
        },
      ],
      matrix: { highlight: [0, 1, 2], setValues: null },
    }),
    animStep("J-2", {
      caption: "Columns read down — 438, 951, 276.",
      durationMs: 1800,
      overlay: { show: ["J.cols", "J.rib-3", "J.rib-4", "J.rib-5", "J.badge-cols"] },
      draw: [
        jLines("J.cols", [[0, 6], [1, 7], [2, 8]], "#4a6741"),
        jRibbon("J.rib-3", colGutter(0), "438", 0.3, "#4a6741"),
        jRibbon("J.rib-4", colGutter(1), "951", 0.5, "#4a6741"),
        jRibbon("J.rib-5", colGutter(2), "276", 0.7, "#4a6741"),
        {
          key: "J.badge-cols",
          type: "badge",
          at: 0.85,
          row: "j-cols",
          rowStyle: { top: -34 },
          text: "438 + 951 + 276 = 1665",
          className: `${J_PILL} bg-white border`,
        },
      ],
      matrix: { highlight: [0, 3, 6], setValues: null },
    }),
    animStep("J-3", {
      caption: "Both directions agree: 1665 = 15 × 111.",
      durationMs: 1800,
      overlay: { show: ["J.badge-reveal"] },
      draw: [
        {
          key: "J.badge-reveal",
          type: "badge",
          at: 0.4,
          row: "j-rows",
          rowStyle: { bottom: -38 },
          text: "1665 = 15 × 111",
          className: "text-[13px] font-mono px-3 py-1 rounded-full bg-[#1a1a1a] text-white",
        },
      ],
      matrix: { highlight: ALL, setValues: null },
    }),
  ],
};

export const scriptK = {
  id: "K",
  title: "Determinant 360",
  steps: [
    animStep("K-1", {
      caption: "A computed fact, not a path: one number hides in the whole square.",
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
          text: "det = 360 = 3×4×5×6 · computed invariant",
          className:
            "absolute left-1/2 -translate-x-1/2 text-[11px] font-mono bg-[#1a1a1a] text-white px-3 py-1 rounded-full whitespace-nowrap pointer-events-none",
          style: { bottom: -36 },
        },
      ],
      matrix: { highlight: [4], setValues: null },
    }),
  ],
};

function lBar(cell) {
  return { key: `L.bar-${cell}`, type: "bar", cell, delta: LOSHU[cell] - 5 };
}

// Property L: four matched opposite pairs instead of nine isolated bars.
// Each beat grows one +n/−n pair simultaneously (the bars share the same
// --anim-p beat) and joins the pair with a link through the center, ending
// in four clear paired brackets.
const L_PAIRS = [
  { cells: [1, 7], caption: "+4 and −4 grow mirrored — the extremes." },
  { cells: [6, 2], caption: "+3 and −3 grow mirrored." },
  { cells: [5, 3], caption: "+2 and −2 grow mirrored." },
  { cells: [8, 0], caption: "+1 and −1 grow mirrored — the center holds 0." },
];

export const scriptL = {
  id: "L",
  title: "Mirrored distance",
  steps: L_PAIRS.map((pair, k) =>
    animStep(`L-${k + 1}`, {
      caption: pair.caption,
      durationMs: 1800,
      overlay: { show: [`L.link-${k}`, `L.bar-${pair.cells[0]}`, `L.bar-${pair.cells[1]}`] },
      draw: [
        {
          key: `L.link-${k}`,
          type: "line",
          from: pair.cells[0],
          to: pair.cells[1],
          color: "#1a1a1a",
          width: "1.2",
          opacity: 0.5,
        },
        lBar(pair.cells[0]),
        lBar(pair.cells[1]),
      ],
      matrix: { highlight: pair.cells, setValues: null },
    }),
  ),
};

const VALUE_INDEX = { 1: 7, 2: 2, 3: 3, 4: 0, 5: 4, 6: 8, 7: 5, 8: 6, 9: 1 };
const M_ORDER = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Knight hops on the plain grid vs torus-wrap hops. d indexes M_ORDER hops:
// 0, 1 (1→2→3) and 6, 7 (7→8→9) are true knight moves, drawn solid dark;
// the rest wrap the torus, drawn dashed purple with an outward bulge that
// visibly leaves the board and re-enters. No tiny arc labels — one numbered
// traveler per step carries the values instead.
const KNIGHT_HOPS = new Set([0, 1, 6, 7]);

function mHop(d) {
  const from = VALUE_INDEX[M_ORDER[d]];
  const to = VALUE_INDEX[M_ORDER[d + 1]];
  if (KNIGHT_HOPS.has(d)) {
    return {
      key: `M.hop-${d}`,
      type: "arc",
      from,
      to,
      bendX: d % 2 === 0 ? 18 : -18,
      bendY: d % 3 === 0 ? -18 : 12,
      color: "#1a1a1a",
      width: "2",
      marker: "arrowSmall",
      opacity: 0.9,
    };
  }
  const a = CENTERS[from];
  const b = CENTERS[to];
  const mx = (a.x + b.x) / 2 - Z / 2;
  const my = (a.y + b.y) / 2 - Z / 2;
  const len = Math.hypot(mx, my) || 1;
  return {
    key: `M.hop-${d}`,
    type: "arc",
    from,
    to,
    bendX: Math.round((mx / len) * 90),
    bendY: Math.round((my / len) * 90),
    color: "#7a6a9e",
    width: "1.4",
    dash: "5 5",
    marker: "arrowSmall",
    opacity: 0.8,
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
      text: "solid knight • dashed torus wrap",
      className:
        "absolute right-2 -top-2 text-[11px] font-mono bg-[#7a6a9e] text-white px-2 py-1 rounded-full pointer-events-none",
    },
  ],
  steps: [1, 3, 5, 7].map((first, k) =>
    animStep(`M-${k + 1}`, {
      caption:
        k === 0
          ? "1 → 2 → 3 — knight moves."
          : k === 3
            ? "7 → 8 → 9 — knight moves."
            : `${first} → ${first + 1} → ${first + 2} — wraps the torus.`,
      durationMs: 1800,
      overlay: { show: [`M.hop-${2 * k}`, `M.hop-${2 * k + 1}`, `M.trav-${k}`] },
      draw: [
        mHop(2 * k),
        mHop(2 * k + 1),
        {
          key: `M.trav-${k}`,
          type: "chip",
          at: 0.5,
          from: VALUE_INDEX[first + 1],
          to: VALUE_INDEX[first + 2],
          anchor: "end",
          dy: -34,
          text: `${first}→${first + 1}→${first + 2}`,
          fill: "#1a1a1a",
          color: "white",
          w: 76,
          h: 22,
          fontSize: 13,
          weight: "700",
        },
      ],
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
// Property N: the main board glides through the eight forms, but a glide
// alone reads as arbitrary rearrangement. Rotation steps get a quarter-turn
// affordance arc (180°/270° widened to match) and reflection steps get the
// mirror axis sweeping the board; every transformed pose settles into an
// on-board label. The D₄ thumbnail strip stays the contact sheet.
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
const N_POSES = [
  null,
  "rotate 90°",
  "rotate 180°",
  "rotate 270°",
  "mirror left–right",
  "mirror + turn 90°",
  "mirror + turn 180°",
  "mirror + turn 270°",
];
const N_TURN_ARCS = {
  1: "M 170 30 A 140 140 0 0 1 310 170",
  2: "M 40 170 A 130 130 0 0 1 300 170",
  3: "M 170 30 A 140 140 0 1 1 30 170",
};

export const scriptN = {
  id: "N",
  title: "All 3×3 are Lo Shu",
  steps: D4_PERMS.map((perm, k) => {
    const grid = D4_GRIDS[k];
    const moves = k === 0 ? [] : movesForPerms(D4_PERMS[k - 1], perm);
    const show = [];
    const draw = [];
    if (k >= 1 && k <= 3) {
      show.push(`N.rot-${k}`);
      draw.push({
        key: `N.rot-${k}`,
        type: "path",
        at: 0.2,
        d: N_TURN_ARCS[k],
        color: "#b89a5a",
        width: "2",
        marker: "arrowSmall",
      });
    }
    if (k >= 4) {
      const vertical = k % 2 === 0;
      show.push(`N.axis-${k}`);
      draw.push({
        key: `N.axis-${k}`,
        type: "line",
        at: 0.2,
        from: vertical ? 1 : 3,
        to: vertical ? 7 : 5,
        extend: 24,
        color: "#4a6741",
        width: "1.4",
        dash: "6 4",
      });
    }
    if (k >= 1) {
      show.push(`N.pose-${k}`);
      draw.push({
        key: `N.pose-${k}`,
        type: "badge",
        at: 0.5,
        text: N_POSES[k],
        className:
          "absolute text-[11px] font-mono bg-white border px-2 py-1 rounded-full shadow pointer-events-none whitespace-nowrap",
        style: { left: "50%", top: -18, transform: "translateX(-50%)" },
      });
    }
    return animStep(`N-${k + 1}`, {
      caption: N_CAPTIONS[k],
      durationMs: 1500,
      overlay: { show },
      draw,
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
