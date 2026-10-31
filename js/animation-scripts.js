// Animation scripts for every Lo Shu property (A–T) plus the ordinal
// construction. Each step lists overlay keys and the draw items those keys
// render (see js/overlay.js). Captions compress each property's formula.
//
// Cell indices follow SQUARE = [4,9,2,3,5,7,8,1,6] in js/app.js.
import { animStep } from "./animation.js";
import { Z, CENTERS, rowGutter, colGutter, cornerGutter, antiGutter } from "./overlay.js";
import { HOLMES_FAMILIES, palaceCells, nestBlocks, centralBoard, stripBoard, foldedBoard, windowAt } from "./verify.js";

// Worked-example tape: derive one ledger line per step from the text the
// step already draws, so the tape can never drift from the board.
// - A badge that states an equation (has = or Σ) is already a ledger line.
// - Otherwise the step's chips/gutters/marks form an arithmetic chain:
//   operands then results joined with " = " ("9+4 = 13 = 3"), unless every
//   part already states its own equation, in which case they stack with " · "
//   ("45 = 9×5 · 10 = 2×5 · 15 = 3×5").
// Steps with no text (L's bars, N's poses, construction) return [] and the
// tape falls back to their captions.
const LEDGER_TEXT_TYPES = new Set(["chip", "gutter", "badge", "mark"]);
export function ledgerFor(step) {
  const items = (step.draw || []).filter(
    (d) => d.text != null && LEDGER_TEXT_TYPES.has(d.type),
  );
  const statements = items.filter((d) => d.type === "badge" && /[=Σ]/.test(String(d.text)));
  if (statements.length) return statements.map((d) => String(d.text));
  const texts = items.map((d) => String(d.text));
  const cleaned = texts.map((t) => t.replace(/^=\s*/, ""));
  const uniq = cleaned.filter((t, i) => i === 0 || t !== cleaned[i - 1]);
  if (uniq.length === 0) return [];
  if (uniq.length === 1) return [texts[0].startsWith("=") ? texts[0] : uniq[0]];
  if (uniq.every((t) => t.includes("="))) return [uniq.join(" · ")];
  return [uniq.join(" = ")];
}

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
  // Pre-play preview: the ordinal matrix before any swap or fold. It is the
  // settled first frame (step build-1's setValues), shown while the player
  // still sits un-started at step 0 — the step-1 caption describes exactly
  // this board, so it stays.
  preview: { caption: "1 · Write — 1 through 9 in reading order." },
  steps: [
    animStep("build-1", {
      caption: "1 · Write — 1 through 9 in reading order.",
      durationMs: 1600,
      overlay: { show: [] },
      matrix: { highlight: [], setValues: asValues(ORDINAL), moves: [] },
    }),
    animStep("build-2", {
      caption: "2 · Swap opposite corners — 1↔9 and 3↔7.",
      durationMs: 1800,
      overlay: { show: [] },
      // Transient ghost connectors: visible only during the swap beat so the
      // fold lands on a clean board. Cell ghosts come from the player-driven
      // dim + flyer treatment in js/app.js.
      draw: [
        {
          key: "construction.swap-0",
          type: "line",
          from: 0,
          to: 8,
          color: "#c96442",
          width: "2",
          dash: "6 6",
          at: 0.1,
          transient: true,
        },
        {
          key: "construction.swap-1",
          type: "line",
          from: 2,
          to: 6,
          color: "#c96442",
          width: "2",
          dash: "6 6",
          at: 0.25,
          transient: true,
        },
      ],
      matrix: {
        highlight: [0, 2, 6, 8],
        setValues: asValues(SWAPPED),
        moves: swapMoves,
      },
    }),
    animStep("build-3", {
      caption: "3 · Fold — the cross slides into the Lo Shu.",
      durationMs: 2400,
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

// Property B: one hero line per step with the total as a margin tick, then
// the full eight-line overview. Ticks sit outside the board (rowGutter /
// colGutter / cornerGutter) so they never cover a numeral. Each diagonal
// gets its own beat — they never draw together.
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
      caption: "4 + 5 + 6 = 15 — the main diagonal, corner to corner.",
      durationMs: 1800,
      overlay: { show: ["B.diag-0", "B.tick-2"] },
      draw: [heroLine("B.diag-0", 0, 8), gutterTick("B.tick-2", cornerGutter())],
      matrix: { highlight: [0, 4, 8], setValues: null },
    }),
    animStep("B-4", {
      caption: "2 + 5 + 8 = 15 — and the other diagonal. Eight lines, one constant.",
      // The = 15 flashes late, then the beat holds. It sits by this
      // diagonal's own tip, not on the main-diagonal or left-column totals.
      durationMs: 2400,
      overlay: {
        show: ["B.diag-1", "B.ctx-0", "B.ctx-1", "B.ctx-2", "B.ctx-3", "B.tick-3"],
      },
      draw: [
        heroLine("B.diag-1", 2, 6),
        faintLine("B.ctx-0", 3, 5),
        faintLine("B.ctx-1", 6, 8),
        faintLine("B.ctx-2", 1, 7),
        faintLine("B.ctx-3", 2, 8),
        { ...gutterTick("B.tick-3", antiGutter()), at: 0.75 },
      ],
      matrix: { highlight: ALL, setValues: null },
    }),
  ],
};

// Property B, second animation: the family tour. Instead of one hero line
// per beat, each family (rows, columns, diagonals) accumulates together with
// its margin ticks, closing on the same eight-line overview.
export const scriptBFamilies = {
  id: "B",
  title: "Lines sum to 15",
  steps: [
    animStep("BF-1", {
      caption: "Rows first: 492, 357, 816 — each 15.",
      durationMs: 1800,
      overlay: { show: ["BF.rows", "BF.tick-r0", "BF.tick-r1", "BF.tick-r2"] },
      draw: [
        {
          key: "BF.rows",
          type: "segments",
          opacity: 0.9,
          parts: [[0, 2], [3, 5], [6, 8]].map(([from, to]) => ({ from, to, color: "#b89a5a", width: "2" })),
        },
        gutterTick("BF.tick-r0", rowGutter(0)),
        gutterTick("BF.tick-r1", rowGutter(1)),
        gutterTick("BF.tick-r2", rowGutter(2)),
      ].map((item, i) => (i === 0 ? item : { ...item, at: 0.3 + 0.2 * (i - 1) })),
      matrix: { highlight: ALL, setValues: null },
    }),
    animStep("BF-2", {
      caption: "Columns next: 438, 951, 276 — each 15.",
      durationMs: 1800,
      overlay: { show: ["BF.cols", "BF.tick-c0", "BF.tick-c1", "BF.tick-c2"] },
      draw: [
        {
          key: "BF.cols",
          type: "segments",
          opacity: 0.9,
          parts: [[0, 6], [1, 7], [2, 8]].map(([from, to]) => ({ from, to, color: "#4a6741", width: "2" })),
        },
        gutterTick("BF.tick-c0", colGutter(0)),
        gutterTick("BF.tick-c1", colGutter(1)),
        gutterTick("BF.tick-c2", colGutter(2)),
      ].map((item, i) => (i === 0 ? item : { ...item, at: 0.3 + 0.2 * (i - 1) })),
      matrix: { highlight: ALL, setValues: null },
    }),
    animStep("BF-3", {
      caption: "Diagonals: 4 + 5 + 6 and 2 + 5 + 8 — each 15.",
      durationMs: 1800,
      overlay: { show: ["BF.diag-a", "BF.diag-b", "BF.tick-d", "BF.tick-anti"] },
      draw: [
        heroLine("BF.diag-a", 0, 8),
        heroLine("BF.diag-b", 2, 6),
        gutterTick("BF.tick-d", cornerGutter()),
        { ...gutterTick("BF.tick-anti", antiGutter()), at: 0.7 },
      ],
      matrix: { highlight: ALL, setValues: null },
    }),
    animStep("BF-4", {
      caption: "Eight lines, one constant — 15 everywhere.",
      durationMs: 2000,
      overlay: { show: ["BF.lock"] },
      draw: [
        {
          key: "BF.lock",
          type: "badge",
          at: 0.4,
          text: "8 lines · always 15",
          className:
            "absolute text-[13px] font-mono bg-[#1a1a1a] text-white px-3 py-1 rounded-full shadow pointer-events-none whitespace-nowrap",
          style: { left: "50%", top: -18, transform: "translateX(-50%)" },
        },
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

// Property E: establish the center as the mean, then show three separate
// worked proofs. Each proof is transient: a clean focus → equation → result
// beat clears before the next one begins. Only the final fact stack persists.
function eEquation(key, text, at = 0.48, width = 152) {
  return {
    key,
    type: "gutter",
    at,
    transient: true,
    x: Z / 2,
    y: -16,
    text,
    fill: "#1a1a1a",
    color: "white",
    w: width,
    h: 22,
    rx: 11,
    fontSize: 12,
    weight: "700",
    textDy: 4,
  };
}

export const scriptE = {
  id: "E",
  title: "Five rules everything",
  steps: [
    animStep("E-1", {
      caption: "Start at the center: 5 is the mean of the nine values.",
      durationMs: 1800,
      overlay: { show: ["E.center"] },
      draw: [
        {
          key: "E.center",
          type: "mark",
          transient: true,
          text: "5",
          r: 23,
          fill: "#1a1a1a",
        },
      ],
      matrix: { highlight: [4], setValues: null },
    }),
    animStep("E-2", {
      caption: "The average of 1 through 9 is 5.",
      durationMs: 1900,
      overlay: { show: ["E.mean"] },
      draw: [eEquation("E.mean", "(1 + 2 + … + 9) ÷ 9 = 5", 0.35, 176)],
      matrix: { highlight: ALL, setValues: null },
    }),
    animStep("E-3", {
      caption: "Nine values at an average of 5 total 45: 9 × 5.",
      durationMs: 2200,
      overlay: { show: ["E.all"] },
      draw: [eEquation("E.all", "1 + 2 + … + 9 = 45 = 9 × 5", 0.48, 176)],
      matrix: { highlight: ALL, setValues: null },
    }),
    animStep("E-4", {
      caption: "One opposite pair: 4 + 6 = 10, or 2 × 5.",
      durationMs: 2100,
      overlay: { show: ["E.pair", "E.pair-eq"] },
      draw: [
        { key: "E.pair", type: "line", transient: true, from: 0, to: 8, color: "#b89a5a", width: "2.4" },
        eEquation("E.pair-eq", "4 + 6 = 10 = 2 × 5", 0.5),
      ],
      matrix: { highlight: [0, 8], setValues: null },
    }),
    animStep("E-5", {
      caption: "One magic line: 3 + 5 + 7 = 15, or 3 × 5.",
      durationMs: 2100,
      overlay: { show: ["E.row", "E.row-eq"] },
      draw: [
        { key: "E.row", type: "line", transient: true, from: 3, to: 5, extend: 12, color: "#1a1a1a", width: "2.4" },
        eEquation("E.row-eq", "3 + 5 + 7 = 15 = 3 × 5", 0.5, 168),
      ],
      matrix: { highlight: [3, 4, 5], setValues: null },
    }),
    animStep("E-6", {
      caption: "Five organizes the whole square: 9 × 5, 2 × 5, and 3 × 5.",
      durationMs: 2300,
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
        { key: "F.ptag-c", type: "cellTag", cells: [0, 2, 6, 8], texts: ["Even", "Even", "Even", "Even"] },
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
        { key: "F.ptag-e", type: "cellTag", cells: [1, 3, 5, 7], texts: ["Odd", "Odd", "Odd", "Odd"] },
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

function jLines(key, triples, color, ats = [0.3, 0.5, 0.7]) {
  return {
    key,
    type: "segments",
    opacity: 0.9,
    instant: true,
    parts: triples.map(([from, to], i) => ({ from, to, color, width: "2", at: ats[i] })),
  };
}

// Property J: each row or column blinks on as a single 3-digit number with
// its matching margin capsule; "+" chips sit between the capsules in a
// contrasting color so the addition reads directly on the board, and the
// payoff step lands 1665 = 15 × 111.
function jRibbon(key, pos, text, at, color) {
  return {
    key,
    type: "gutter",
    at,
    x: pos.x,
    y: pos.y,
    text,
    fill: color,
    stroke: "#1a1a1a",
    color: "white",
    w: 46,
    h: 20,
    rx: 10,
    fontSize: 12,
    weight: "700",
    textDy: 4,
  };
}

function jPlus(key, a, b, at) {
  return {
    key,
    type: "gutter",
    at,
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    text: "+",
    fill: "#1a1a1a",
    stroke: "#c96442",
    color: "#fdf8f0",
    w: 22,
    h: 18,
    rx: 9,
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
      caption: "Rows read as 3-digit numbers — 492 + 357 + 816.",
      durationMs: 1800,
      overlay: {
        show: ["J.rows", "J.rib-0", "J.plus-0", "J.rib-1", "J.plus-1", "J.rib-2", "J.badge-rows"],
      },
      draw: [
        jLines("J.rows", [[0, 2], [3, 5], [6, 8]], "#b89a5a"),
        jRibbon("J.rib-0", rowGutter(0), "492", 0.3, "#b89a5a"),
        jPlus("J.plus-0", rowGutter(0), rowGutter(1), 0.4),
        jRibbon("J.rib-1", rowGutter(1), "357", 0.5, "#b89a5a"),
        jPlus("J.plus-1", rowGutter(1), rowGutter(2), 0.6),
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
      caption: "Columns read as 3-digit numbers — 438 + 951 + 276.",
      durationMs: 1800,
      overlay: {
        show: ["J.cols", "J.rib-3", "J.plus-2", "J.rib-4", "J.plus-3", "J.rib-5", "J.badge-cols"],
      },
      draw: [
        jLines("J.cols", [[0, 6], [1, 7], [2, 8]], "#4a6741"),
        jRibbon("J.rib-3", colGutter(0), "438", 0.3, "#4a6741"),
        jPlus("J.plus-2", colGutter(0), colGutter(1), 0.4),
        jRibbon("J.rib-4", colGutter(1), "951", 0.5, "#4a6741"),
        jPlus("J.plus-3", colGutter(1), colGutter(2), 0.6),
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

// Property O: the eight 15-triples, then the census that forces each seat.
// Equation badges are transient so the board keeps the lines, not eight
// stacked formulas. The last beat tags how many triples meet each cell.
const O_PILL =
  "text-[13px] font-mono px-3 py-1 rounded-full bg-white border pointer-events-none whitespace-nowrap";
const O_TRIPLES = [
  { cells: [0, 1, 2], eq: "4+9+2 = 15", caption: "4, 9, 2 sums to 15 — the top row, and one of eight triples." },
  { cells: [3, 4, 5], eq: "3+5+7 = 15", caption: "3, 5, 7 — the middle row." },
  { cells: [6, 7, 8], eq: "8+1+6 = 15", caption: "8, 1, 6 — the bottom row." },
  { cells: [0, 3, 6], eq: "4+3+8 = 15", caption: "4, 3, 8 — the left column." },
  { cells: [1, 4, 7], eq: "9+5+1 = 15", caption: "9, 5, 1 — the middle column." },
  { cells: [2, 5, 8], eq: "2+7+6 = 15", caption: "2, 7, 6 — the right column." },
  { cells: [0, 4, 8], eq: "4+5+6 = 15", caption: "4, 5, 6 — the main diagonal." },
  {
    cells: [2, 4, 6],
    eq: "2+5+8 = 15",
    caption: "2, 5, 8 — the eighth triple. Every other three distinct values from 1 to 9 misses 15.",
  },
];

export const scriptO = {
  id: "O",
  title: "Eight triples only",
  steps: [
    ...O_TRIPLES.map((triple, i) =>
      animStep(`O-${i + 1}`, {
        caption: triple.caption,
        durationMs: 1600,
        overlay: { show: [`O.line-${i}`, `O.eq-${i}`] },
        draw: [
          {
            key: `O.line-${i}`,
            type: "line",
            from: triple.cells[0],
            to: triple.cells[2],
            color: i < 3 ? "#b89a5a" : i < 6 ? "#4a6741" : "#c96442",
            width: "2.2",
            opacity: 0.9,
          },
          {
            key: `O.eq-${i}`,
            type: "badge",
            transient: true,
            at: 0.45,
            row: "o-eq",
            rowStyle: { bottom: -38 },
            text: triple.eq,
            className: O_PILL,
          },
        ],
        matrix: { highlight: triple.cells, setValues: null },
      }),
    ),
    animStep("O-9", {
      caption:
        "The counts are the seats: 5 is in 4 triples, the corner evens in 3, and 1, 3, 7, 9 in 2.",
      durationMs: 2000,
      overlay: { show: ["O.census", "O.tags"] },
      draw: [
        {
          key: "O.tags",
          type: "cellTag",
          cells: [0, 1, 2, 3, 4, 5, 6, 7, 8],
          texts: ["×3", "×2", "×3", "×2", "×4", "×2", "×3", "×2", "×3"],
        },
        {
          key: "O.census",
          type: "badge",
          at: 0.4,
          row: "o-census",
          rowStyle: { top: -34 },
          text: "5 → 4; evens → 3; 1,3,7,9 → 2",
          className:
            "text-[12px] font-mono px-3 py-1 rounded-full bg-[#1a1a1a] text-white pointer-events-none whitespace-nowrap",
        },
      ],
      matrix: { highlight: ALL, setValues: null },
    }),
  ],
};

const P_PILL = "text-[12px] font-mono px-3 py-1 rounded-full pointer-events-none whitespace-nowrap";

export const scriptP = {
  id: "P",
  title: "Products agree",
  steps: [
    animStep("P-1", {
      caption: "Row products 72, 105, and 48 add to 225.",
      durationMs: 1800,
      overlay: { show: ["P.rows", "P.eq-rows"] },
      draw: [
        jLines("P.rows", [[0, 2], [3, 5], [6, 8]], "#b89a5a"),
        {
          key: "P.eq-rows",
          type: "badge",
          transient: true,
          at: 0.45,
          row: "p-rows",
          rowStyle: { bottom: -38 },
          text: "4×9×2 + 3×5×7 + 8×1×6 = 225",
          className: `${P_PILL} bg-white border`,
        },
      ],
      matrix: { highlight: [0, 1, 2], setValues: null },
    }),
    animStep("P-2", {
      caption: "Column products 96, 45, and 84 add to 225.",
      durationMs: 1800,
      overlay: { show: ["P.cols", "P.eq-cols"] },
      draw: [
        jLines("P.cols", [[0, 6], [1, 7], [2, 8]], "#4a6741"),
        {
          key: "P.eq-cols",
          type: "badge",
          transient: true,
          at: 0.45,
          row: "p-cols",
          rowStyle: { top: -34 },
          text: "4×3×8 + 9×5×1 + 2×7×6 = 225",
          className: `${P_PILL} bg-white border`,
        },
      ],
      matrix: { highlight: [0, 3, 6], setValues: null },
    }),
    animStep("P-3", {
      caption: "Both totals are the square of the magic constant.",
      durationMs: 1600,
      overlay: { show: ["P.sq"] },
      draw: [
        {
          key: "P.sq",
          type: "badge",
          at: 0.4,
          row: "p-sq",
          rowStyle: { bottom: -38 },
          text: "225 = 15²",
          className: `${P_PILL} bg-[#1a1a1a] text-white`,
        },
      ],
      matrix: { highlight: ALL, setValues: null },
    }),
    animStep("P-4", {
      caption: "Pairwise products agree at 195. The diagonals multiply to 200.",
      durationMs: 1800,
      overlay: { show: ["P.pairs"] },
      draw: [
        {
          key: "P.pairs",
          type: "badge",
          at: 0.4,
          row: "p-pairs",
          rowStyle: { top: -34 },
          text: "rows 195 = columns 195",
          className: `${P_PILL} bg-white border`,
        },
      ],
      matrix: { highlight: ALL, setValues: null },
    }),
  ],
};

const Q_PILL = "text-[12px] font-mono px-3 py-1 rounded-full bg-white border pointer-events-none whitespace-nowrap";

// Property Q: the board cells themselves carry the square (see the Q branch
// of the cell renderer in js/app.js), and bare "+" operators sit in the
// gutters between the participating cells so each step reads as a sum of
// squares. Both are transient: each beat shows only its own equation.
function qPlus(key, from, to, color) {
  return {
    key,
    type: "op",
    transient: true,
    at: 0.5,
    from,
    to,
    text: "+",
    fontSize: 16,
    color,
  };
}

function qTotal(key, x, text, fill) {
  return {
    key,
    type: "gutter",
    at: 0.55,
    x,
    y: -16,
    text,
    fill,
    color: "white",
    w: 72,
    h: 22,
    rx: 11,
    fontSize: 13,
    weight: "700",
    textDy: 4,
  };
}

export const scriptQ = {
  id: "Q",
  title: "Opposite squares match",
  steps: [
    animStep("Q-1", {
      caption: "Top and bottom are complements, and both square-sum to 101.",
      durationMs: 1800,
      overlay: { show: ["Q.top", "Q.bot", "Q.ch-0", "Q.ch-1", "Q.ch-2", "Q.plus-t0", "Q.plus-t1", "Q.plus-b0", "Q.plus-b1", "Q.tot-rows", "Q.eq-rows"] },
      draw: [
        { key: "Q.top", type: "line", from: 0, to: 2, color: "#b89a5a", width: "2.2" },
        { key: "Q.bot", type: "line", from: 6, to: 8, color: "#b89a5a", width: "2.2" },
        { key: "Q.ch-0", type: "line", from: 0, to: 8, color: "#1a1a1a", width: "1.2", dash: "5 4", opacity: 0.45 },
        { key: "Q.ch-1", type: "line", from: 1, to: 7, color: "#1a1a1a", width: "1.2", dash: "5 4", opacity: 0.45 },
        { key: "Q.ch-2", type: "line", from: 2, to: 6, color: "#1a1a1a", width: "1.2", dash: "5 4", opacity: 0.45 },
        qPlus("Q.plus-t0", 0, 1, "#b89a5a"),
        qPlus("Q.plus-t1", 1, 2, "#b89a5a"),
        qPlus("Q.plus-b0", 6, 7, "#b89a5a"),
        qPlus("Q.plus-b1", 7, 8, "#b89a5a"),
        qTotal("Q.tot-rows", 80, "Σ 101", "#b89a5a"),
        {
          key: "Q.eq-rows",
          type: "badge",
          transient: true,
          at: 0.45,
          row: "q-rows",
          rowStyle: { bottom: -38 },
          text: "4²+9²+2² = 8²+1²+6² = 101",
          className: Q_PILL,
        },
      ],
      matrix: { highlight: [0, 1, 2, 6, 7, 8], setValues: null },
    }),
    animStep("Q-2", {
      caption: "Left and right are complements, and both square-sum to 89.",
      durationMs: 1800,
      overlay: { show: ["Q.left", "Q.right", "Q.ch-3", "Q.plus-l0", "Q.plus-l1", "Q.plus-r0", "Q.plus-r1", "Q.tot-cols", "Q.eq-cols"] },
      draw: [
        { key: "Q.left", type: "line", from: 0, to: 6, color: "#4a6741", width: "2.2" },
        { key: "Q.right", type: "line", from: 2, to: 8, color: "#4a6741", width: "2.2" },
        { key: "Q.ch-3", type: "line", from: 3, to: 5, color: "#1a1a1a", width: "1.2", dash: "5 4", opacity: 0.45 },
        qPlus("Q.plus-l0", 0, 3, "#4a6741"),
        qPlus("Q.plus-l1", 3, 6, "#4a6741"),
        qPlus("Q.plus-r0", 2, 5, "#4a6741"),
        qPlus("Q.plus-r1", 5, 8, "#4a6741"),
        qTotal("Q.tot-cols", 260, "Σ 89", "#4a6741"),
        {
          key: "Q.eq-cols",
          type: "badge",
          transient: true,
          at: 0.45,
          row: "q-cols",
          rowStyle: { top: -34 },
          text: "4²+3²+8² = 2²+7²+6² = 89",
          className: Q_PILL,
        },
      ],
      matrix: { highlight: [0, 2, 3, 5, 6, 8], setValues: null },
    }),
    animStep("Q-3", {
      caption: "Each center line is its own complement. The square-sums are 77, 93, 83, and 107.",
      durationMs: 1800,
      overlay: { show: ["Q.center", "Q.plus-mr0", "Q.plus-mr1", "Q.plus-mc0", "Q.plus-mc1", "Q.plus-md0", "Q.plus-md1", "Q.plus-ad0", "Q.plus-ad1"] },
      draw: [
        qPlus("Q.plus-mr0", 3, 4, "#1a1a1a"),
        qPlus("Q.plus-mr1", 4, 5, "#1a1a1a"),
        qPlus("Q.plus-mc0", 1, 4, "#1a1a1a"),
        qPlus("Q.plus-mc1", 4, 7, "#1a1a1a"),
        qPlus("Q.plus-md0", 0, 4, "#1a1a1a"),
        qPlus("Q.plus-md1", 4, 8, "#1a1a1a"),
        qPlus("Q.plus-ad0", 2, 4, "#1a1a1a"),
        qPlus("Q.plus-ad1", 4, 6, "#1a1a1a"),
        {
          key: "Q.center",
          type: "badge",
          at: 0.4,
          row: "q-center",
          rowStyle: { bottom: -16 },
          text: "77, 93, 83, 107",
          className: "text-[12px] font-mono px-3 py-1 rounded-full bg-[#1a1a1a] text-white pointer-events-none whitespace-nowrap",
        },
      ],
      matrix: { highlight: [0, 1, 2, 3, 5, 6, 7, 8], setValues: null },
    }),
  ],
};

function collinearRun(cells) {
  if (cells.length < 2) return false;
  const dr = Math.floor(cells[1] / 3) - Math.floor(cells[0] / 3);
  const dc = (cells[1] % 3) - (cells[0] % 3);
  if (dr === 0 && dc === 0) return false;
  for (let i = 1; i < cells.length; i++) {
    const r = Math.floor(cells[i] / 3) - Math.floor(cells[i - 1] / 3);
    const c = (cells[i] % 3) - (cells[i - 1] % 3);
    if (r !== dr || c !== dc) return false;
  }
  return Math.max(Math.abs(dr), Math.abs(dc)) <= 1;
}

function readingLine(key, from, to, color) {
  return {
    key,
    type: "line",
    from,
    to,
    color,
    width: "2.4",
    marker: "arrowSmall",
  };
}

// One arrowed line when the cells sit on a straight adjacent run (rows,
// columns, and the two true diagonals). A broken parallel keeps the short
// hop solid and bows the long hop away from the center, the same wrap M uses.
function readingItems(key, cells, color) {
  if (collinearRun(cells)) return [readingLine(key, cells[0], cells[cells.length - 1], color)];
  return cells.slice(0, -1).map((from, i) => {
    const to = cells[i + 1];
    const dx = Math.abs((from % 3) - (to % 3));
    const dy = Math.abs(Math.floor(from / 3) - Math.floor(to / 3));
    const hopKey = `${key}-${i}`;
    if (Math.max(dx, dy) <= 1) return readingLine(hopKey, from, to, color);
    const a = CENTERS[from];
    const b = CENTERS[to];
    const mx = (a.x + b.x) / 2 - Z / 2;
    const my = (a.y + b.y) / 2 - Z / 2;
    const len = Math.hypot(mx, my) || 1;
    return {
      key: hopKey,
      type: "arc",
      from,
      to,
      bendX: Math.round((mx / len) * 78),
      bendY: Math.round((my / len) * 78),
      color: "#7a6a9e",
      width: "1.6",
      dash: "5 4",
      marker: "arrowSmall",
    };
  });
}

const R_LOOK = [
  {
    color: "#b89a5a",
    tape: "Rows",
    caption: "Rows read 492, 357, and 816. Their squares total the same as the reversals.",
  },
  {
    color: "#4a6741",
    tape: "Columns",
    caption: "Columns read 438, 951, and 276. The reversals square to the same total.",
  },
  {
    color: "#1a1a1a",
    tape: "Main wraps",
    caption: "Main wraps: the true diagonal is solid, and each broken parallel arcs off the board.",
  },
  {
    color: "#c96442",
    tape: "Anti wraps",
    caption: "Anti wraps. On this square the diagonal reads 471.",
  },
];

const R_STRIKES = [
  {
    strike: "hundreds",
    tape: "Drop hundreds",
    caption: "Drop every hundreds digit. The totals shrink and still match.",
  },
  {
    strike: "tens",
    tape: "Drop tens",
    caption: "Drop every tens digit. The two columns still agree.",
  },
  {
    strike: "units",
    tape: "Drop units",
    caption: "Drop every units digit. Each single place can go, and the identity holds.",
  },
];

export const scriptR = {
  id: "R",
  title: "Reversed squares",
  steps: [
    ...HOLMES_FAMILIES.map((fam, i) => {
      const draw = fam.lines.flatMap((cells, k) => readingItems(`R.${fam.id}-${k}`, cells, R_LOOK[i].color));
      return animStep(`R-${i + 1}`, {
        caption: R_LOOK[i].caption,
        tape: R_LOOK[i].tape,
        durationMs: 1700,
        overlay: { show: draw.map((item) => item.key) },
        draw,
        sheet: {
          kind: "pairs",
          families: [{ id: fam.id, label: fam.label, lines: fam.lines }],
        },
        matrix: { highlight: ALL, setValues: null },
      });
    }),
    ...R_STRIKES.map((strike, i) =>
      animStep(`R-${i + 5}`, {
        caption: strike.caption,
        tape: strike.tape,
        durationMs: 1600,
        overlay: { show: [] },
        sheet: { kind: "pairs", strike: strike.strike },
        matrix: { highlight: ALL, setValues: null },
      }),
    ),
  ],
};

export const scriptS = {
  id: "S",
  title: "Squared matrix",
  steps: [
    animStep("S-1", {
      caption: "The center of M² is the middle row times the middle column.",
      tape: "Center dot product",
      durationMs: 1800,
      overlay: { show: ["S.row", "S.col"] },
      draw: [
        readingLine("S.row", 3, 5, "#1a1a1a"),
        readingLine("S.col", 1, 7, "#c96442"),
      ],
      sheet: { kind: "companion", reveal: "center", worked: 4, sums: false, compareTurn: false },
      matrix: { highlight: [1, 3, 4, 5, 7], setValues: null },
    }),
    animStep("S-2", {
      caption: "The diagonal is one number. Every other entry is the other.",
      tape: "Fill M²",
      durationMs: 1700,
      overlay: { show: [] },
      sheet: { kind: "companion", reveal: "all", worked: null, sums: false },
      matrix: { highlight: ALL, setValues: null },
    }),
    animStep("S-3", {
      caption: "Each row of M² sums to 225, which is 15².",
      tape: "Row sums 225",
      durationMs: 1700,
      overlay: { show: [] },
      sheet: { kind: "companion", sums: true },
      matrix: { highlight: ALL, setValues: null },
    }),
    animStep("S-4", {
      caption: "Turning the square swaps the pair. The row sum stays 225.",
      tape: "Quarter turn",
      durationMs: 1800,
      overlay: { show: [] },
      sheet: { kind: "companion", compareTurn: true },
      matrix: {
        highlight: [],
        setValues: asValues(D4_GRIDS[1]),
        moves: movesForPerms(D4_PERMS[0], D4_PERMS[1]),
      },
    }),
  ],
};

// Property T: each palace opens into the same 3×3. The sheet computes the
// compound square from the grid on screen. Figures stay off the tape.
function palaceMark(key, cell) {
  return {
    key,
    type: "path",
    transient: true,
    cells: [cell],
    color: "#c96442",
    width: "2.4",
  };
}

export const scriptT = {
  id: "T",
  title: "Nested palaces",
  steps: [
    animStep("T-1", {
      caption: "Palace 4 opens by the same square plus 27. 9·(4−1)+4 = 31, and each line sums to 96.",
      tape: "Palace 4",
      durationMs: 1800,
      overlay: { show: ["T.palace-4"] },
      draw: [palaceMark("T.palace-4", 0)],
      sheet: { kind: "compound", scope: "palace", palace: 4, mark: null },
      matrix: { highlight: [0], setValues: null },
    }),
    animStep("T-2", {
      caption: "Palace 7 is the same square plus 54. Each line sums to 177.",
      tape: "Palace 7",
      durationMs: 1700,
      overlay: { show: ["T.palace-7"] },
      draw: [palaceMark("T.palace-7", 5)],
      sheet: { kind: "compound", scope: "palace", palace: 7, mark: null },
      matrix: { highlight: [5], setValues: null },
    }),
    animStep("T-3", {
      caption: "East, then the west seat inside it, is 3-7 = 25. The center of the centers is 5-5 = 41.",
      tape: "Address 3-7",
      durationMs: 1800,
      overlay: { show: ["T.address"] },
      draw: [palaceMark("T.address", 3)],
      sheet: { kind: "compound", scope: "palace", palace: 3, mark: 7 },
      matrix: { highlight: [3], setValues: null },
    }),
    animStep("T-4", {
      caption: "The nine palaces use 1 through 81 once. Every line sums to 369, and opposites through the center sum to 82.",
      tape: "Sum 369",
      durationMs: 2000,
      overlay: { show: ["T.frame"] },
      draw: [
        {
          key: "T.frame",
          type: "path",
          d: `M 6 6 H ${Z - 6} V ${Z - 6} H 6 Z`,
          cells: [],
          color: "#1a1a1a",
          width: "1.6",
        },
      ],
      sheet: { kind: "compound", scope: "all", palace: null, mark: null },
      matrix: { highlight: ALL, setValues: null },
    }),
    // In-board nesting layer: the same palaces open inside the matrix area.
    // Values stay derived from the 3×3 grid (setValues stays null); the
    // board expands each opened cell via matrix.nest (see js/app.js).
    animStep("T-5", {
      caption: "Palace 4 opens in the board: the Lo Shu plus 27. Each of its lines sums to 96.",
      tape: "Palace 4, in the board",
      durationMs: 2000,
      overlay: { show: ["T.nest-4"] },
      draw: [
        {
          key: "T.nest-4",
          type: "path",
          cells: [0],
          color: "#c96442",
          width: "2.4",
        },
      ],
      sheet: { kind: "compound", scope: "palace", palace: 4, mark: null },
      matrix: { highlight: [0], setValues: null, nest: { mode: "palace", palace: 4 } },
    }),
    animStep("T-6", {
      caption: "Every cell opens in the board: 1 through 81 once, every line 369.",
      tape: "All nine, in the board",
      durationMs: 2200,
      overlay: { show: ["T.nest-frame"] },
      draw: [
        {
          key: "T.nest-frame",
          type: "path",
          d: `M 14 14 H ${Z - 14} V ${Z - 14} H 14 Z`,
          cells: [],
          color: "#b89a5a",
          width: "1.6",
          dash: "7 5",
        },
      ],
      sheet: { kind: "compound", scope: "all", palace: null, mark: null },
      matrix: { highlight: ALL, setValues: null, nest: { mode: "all" } },
    }),
    // Address beat: the 3-7 seat opens inside palace 3's board mini, marked
    // where the inner 7 lands (value 25). Zoom beats re-base the board with
    // setValues; minis keep the base Lo Shu as the inner square (see js/app.js)
    // so T-8/T-9 show the true middle thirds (rows 3285 and 88587).
    animStep("T-7", {
      caption: "East, then the west seat inside it, is 3-7 = 25 — now open in the board.",
      tape: "3-7, in the board",
      durationMs: 2000,
      overlay: { show: ["T.addr-3"] },
      draw: [
        {
          key: "T.addr-3",
          type: "path",
          cells: [3],
          color: "#c96442",
          width: "2.4",
        },
      ],
      sheet: { kind: "compound", scope: "palace", palace: 3, mark: 7 },
      matrix: { highlight: [3], setValues: null, nest: { mode: "palace", palace: 3, mark: 7 } },
    }),
    animStep("T-8", {
      caption: "The board re-centers on palace 5: 40 through 48 with 41 at the heart. Open every cell to see the middle third of the 27×27 — rows of 3285.",
      tape: "Middle of the 27×27",
      durationMs: 2200,
      overlay: { show: ["T.nest-frame"] },
      sheet: { kind: "compound", scope: "all", palace: null, mark: null, inner: "base" },
      matrix: { highlight: ALL, setValues: asValues(palaceCells(LOSHU, 5)), nest: { mode: "all" } },
    }),
    animStep("T-9", {
      caption: "The center 365 re-centers the board. Every open cell shows the middle third of the 81×81 — rows of 29,529, with 3281 at the heart.",
      tape: "Middle of the 81×81",
      durationMs: 2200,
      overlay: { show: ["T.nest-frame"] },
      sheet: { kind: "compound", scope: "all", palace: null, mark: null, inner: "base" },
      matrix: { highlight: ALL, setValues: asValues(palaceCells(LOSHU, 41)), nest: { mode: "all" } },
    }),
  ],
};

// Properties U–W: overlapping Luoshu. The main board shows the active
// 3×3 window (setValues below); the overlap sheet in js/app.js shows the
// larger board and where that window sits in it.
function overlapBadge(key, text, transient = true) {
  return {
    key,
    type: "badge",
    at: 0.4,
    transient,
    text,
    className:
      "absolute text-[12px] font-mono bg-[#1a1a1a] text-white px-3 py-1 rounded-full shadow pointer-events-none whitespace-nowrap",
    style: { left: "50%", top: -18, transform: "translateX(-50%)" },
  };
}

function overlapStep(id, { caption, tape, board, cols, wr, wc, all = false, badge, highlight = ALL, sheetBoard }) {
  const grid = board ? windowAt(board, cols, wr || 0, wc || 0) : LOSHU;
  return animStep(id, {
    caption,
    tape,
    durationMs: 1900,
    overlay: { show: [badge.key] },
    draw: [badge],
    sheet: { kind: "overlap", board: sheetBoard, wr: all ? null : wr, wc: all ? null : wc, all },
    matrix: { highlight, setValues: asValues(grid) },
  });
}

const CENTRAL = centralBoard();
const STRIP = stripBoard();
const FOLDED = foldedBoard();
const COMPOUND = nestBlocks(LOSHU, LOSHU);

export const scriptU = {
  id: "U",
  title: "Central overlap",
  steps: [
    ...[
      [0, 0, "Top-left window: a full Lo Shu, centred on 5."],
      [0, 2, "Top-right window: another Lo Shu, also centred on 5. It reuses the first window's right column."],
      [2, 0, "Bottom-left window: a third Lo Shu, centred on 5, reusing the top-left window's bottom row."],
      [2, 2, "Bottom-right window: the fourth Lo Shu. All four meet at the board's centre cell."],
    ].map(([wr, wc, caption], i) =>
      overlapStep(`U-${i + 1}`, {
        caption,
        tape: `Window (${wr},${wc})`,
        board: CENTRAL,
        cols: 5,
        wr,
        wc,
        sheetBoard: "central",
        badge: overlapBadge(`U.win-${i}`, `window (${wr},${wc}) = magic 15`),
      }),
    ),
    overlapStep("U-5", {
      caption: "Four overlapping Lo Shu in one 5×5. Every window is centred on 5, and all four meet at the centre cell.",
      tape: "Four windows, one cross",
      board: CENTRAL,
      cols: 5,
      wr: 0,
      wc: 0,
      all: true,
      sheetBoard: "central",
      badge: overlapBadge("U.lock", "4 windows · each centre = 5", false),
    }),
    overlapStep("U-6", {
      caption: "Jiugong Feixing flies this same pattern from palace to palace over time — each new position overlaps the last. (Cultural context, not a sum.)",
      tape: "Flying stars context",
      board: CENTRAL,
      cols: 5,
      wr: 2,
      wc: 2,
      all: true,
      sheetBoard: "central",
      highlight: [4],
      badge: overlapBadge("U.fly", "Jiugong Feixing · pattern flies palace to palace"),
    }),
  ],
};

export const scriptV = {
  id: "V",
  title: "Linear overlap",
  steps: [
    overlapStep("V-1", {
      caption: "The strip cycles the Lo Shu columns. Window 1 is the Lo Shu itself — fully magic.",
      tape: "Window 1: magic",
      board: STRIP,
      cols: 11,
      wr: 0,
      wc: 0,
      sheetBoard: "strip",
      badge: overlapBadge("V.win-0", "window 1 = magic 15"),
    }),
    overlapStep("V-2", {
      caption: "Slide one column, reusing two columns of window 1. Rows and columns still sum to 15, but the diagonals are 24 and 12.",
      tape: "Window 2: diagonals 24, 12",
      board: STRIP,
      cols: 11,
      wr: 0,
      wc: 1,
      sheetBoard: "strip",
      badge: overlapBadge("V.win-1", "rows = 15 · diagonals = 24, 12"),
    }),
    overlapStep("V-3", {
      caption: "Slide again. Rows and columns still hold at 15; the diagonals are now 6 and 18.",
      tape: "Window 3: diagonals 6, 18",
      board: STRIP,
      cols: 11,
      wr: 0,
      wc: 2,
      sheetBoard: "strip",
      badge: overlapBadge("V.win-2", "rows = 15 · diagonals = 6, 18"),
    }),
    overlapStep("V-4", {
      caption: "The third slide completes the cycle: window 4 is fully magic again, like windows 1 and 7.",
      tape: "Window 4: magic again",
      board: STRIP,
      cols: 11,
      wr: 0,
      wc: 3,
      sheetBoard: "strip",
      badge: overlapBadge("V.win-3", "window 4 = magic 15"),
    }),
    overlapStep("V-5", {
      caption: "All 9 windows keep rows and columns of 15. Only windows 1, 4 and 7 are fully magic — the diagonals cycle 15, 24, 6.",
      tape: "Rows & columns always 15",
      board: STRIP,
      cols: 11,
      wr: 0,
      wc: 0,
      all: true,
      sheetBoard: "strip",
      badge: overlapBadge("V.lock", "rows = columns = 15 · magic at 1, 4, 7", false),
    }),
  ],
};

export const scriptW = {
  id: "W",
  title: "Pandiagonal overlap",
  steps: [
    overlapStep("W-1", {
      caption: "Yang Hui's compound 9×9: the aligned 3×3 block in the corner is magic, with every line summing to 96.",
      tape: "Aligned block: magic",
      board: COMPOUND,
      cols: 9,
      wr: 0,
      wc: 0,
      sheetBoard: "compound",
      badge: overlapBadge("W.aligned", "aligned block = magic"),
    }),
    overlapStep("W-2", {
      caption: "Shift that window one cell in the compound board and the lines disagree — a shifted window there is not magic.",
      tape: "Shifted in compound: not magic",
      board: COMPOUND,
      cols: 9,
      wr: 0,
      wc: 1,
      sheetBoard: "compound",
      badge: overlapBadge("W.shift-fail", "shifted window ≠ magic"),
    }),
    overlapStep("W-3", {
      caption: "Now fold instead: mirror the Lo Shu across a 9×9 board. The corner window is a Lo Shu again.",
      tape: "Folded board: corner window",
      board: FOLDED,
      cols: 9,
      wr: 0,
      wc: 0,
      sheetBoard: "folded",
      badge: overlapBadge("W.fold-0", "folded window (0,0) = magic 15"),
    }),
    overlapStep("W-4", {
      caption: "Shift by two, across the aligned block boundary: this overlapping window is fully magic too.",
      tape: "Shifted by two: magic",
      board: FOLDED,
      cols: 9,
      wr: 0,
      wc: 2,
      sheetBoard: "folded",
      badge: overlapBadge("W.fold-2", "folded window (0,2) = magic 15"),
    }),
    overlapStep("W-5", {
      caption: "Shift down and across to (2,4): still a full Lo Shu, crossing the fold lines of the tiling.",
      tape: "Window (2,4): magic",
      board: FOLDED,
      cols: 9,
      wr: 2,
      wc: 4,
      sheetBoard: "folded",
      badge: overlapBadge("W.fold-24", "folded window (2,4) = magic 15"),
    }),
    overlapStep("W-6", {
      caption: "Exactly 16 windows are magic — every offset where both coordinates are even. Odd offsets are not.",
      tape: "16 magic windows",
      board: FOLDED,
      cols: 9,
      wr: 0,
      wc: 0,
      all: true,
      sheetBoard: "folded",
      badge: overlapBadge("W.lock", "16 windows = magic 15", false),
    }),
  ],
};

export const demoScripts = {
  construction: constructionScript,
  intro: constructionScript,
  A: scriptA,
  B: scriptBFamilies,
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
  O: scriptO,
  P: scriptP,
  Q: scriptQ,
  R: scriptR,
  S: scriptS,
  T: scriptT,
  U: scriptU,
  V: scriptV,
  W: scriptW,
};

// Multiple animations per property. Each id keeps its default script in
// demoScripts; extra animations register here as labeled variants. The rail
// select lists variantsFor(e). Family tour is B's default presentation.
export const animationVariants = {
  B: [
    { key: "families", label: "Family tour", script: scriptBFamilies },
    { key: "hero-lines", label: "One line at a time", script: scriptB },
  ],
};

export function variantsFor(propertyId) {
  if (animationVariants[propertyId]) return animationVariants[propertyId];
  const script = demoScripts[propertyId] || null;
  return script ? [{ key: "standard", label: "Standard", script }] : [];
}

export function scriptFor(propertyId, variantKey) {
  if (!propertyId) return constructionScript;
  if (!variantKey) return demoScripts[propertyId] || null;
  const hit = variantsFor(propertyId).find((v) => v.key === variantKey);
  return (hit && hit.script) || demoScripts[propertyId] || null;
}

