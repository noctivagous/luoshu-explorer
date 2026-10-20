// Demo animation scripts (infrastructure placeholders).
// Full per-property choreography comes later; these two prove the format:
// - "construction": the 3x3 builds cell by cell while empty cells stay blank.
// - "A": opposite pairs light up one pair at a time over the finished square.
//
// Cell indices follow SQUARE = [4,9,2,3,5,7,8,1,6] positions 0-8 in js/app.js.
// Value placement order 1..9 lands on indices [7,2,3,0,4,8,5,6,1].
import { animStep } from "./animation.js";

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

export const demoScripts = { construction: constructionScript, A: scriptA };

export function scriptFor(propertyId) {
  if (!propertyId) return constructionScript;
  return demoScripts[propertyId] || null;
}
