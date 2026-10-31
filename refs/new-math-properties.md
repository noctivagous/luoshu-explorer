# Candidate math properties for new list items and groups

Date: 2026-10-30
Status: Mod-3 Latin implemented as property X (Residues & Classes); inertia, singular values, and sum-of-squares remain unimplemented.
Method: three parallel research passes (repo inventory, literature survey,
grouping/animation feasibility) plus a critic pass that recomputed every
surviving number and killed duplicates. Top-line numbers below were
re-verified independently against the Lo Shu orientation
`[4,9,2,3,5,7,8,1,6]`.

## Current inventory

24 entries: intro plus every letter A–W.

- Introduction: intro, B
- Core Balance: A, E, F, L, Q
- Means & Zero: G, I
- Lines & Totals: J, K, P, R, S
- Modular Border: C, D, H
- Geometry & Universality: M, N, O, T
- Overlapping Luoshu: U, V, W

Content per id: intro = build the square; A = opposites sum to 10;
B = lines sum to 15; C = clockwise addition mod 10; D = counterclockwise
arms; E = five rules everything; F = corners equal edges (evens/odds 20);
G = zero-balanced form; H = subtraction is 5; I = middle is mean;
J = 111 property; K = determinant 360; L = mirrored distance;
M = knight's tour (narrowed 1-2-3 / 7-8-9 claim); N = all 3x3 are Lo Shu;
O = eight triples only; P = products agree; Q = opposite squares match;
R = reversed squares; S = squared matrix; T = nested palaces;
U/V/W = overlap tilings.

## Ranked new-item proposals

[x] ### 1. Mod-3 Latin (strongest)

Residues mod 3:

```text
[[1,0,2],
 [0,2,1],
 [2,1,0]]
```

Every row and every column contains exactly `{0,1,2}`. Nothing else in the
app covers mod-3 (C/D/H are mod-10 walks; A/E/F/L/Q are pair sums).

- Target group: new mini-group **Residues & Classes**, or Lines & Totals
  if no new group is wanted.
- Animation: per-cell residue tags plus one `0+1+2` line demo with diamonds.
  Feasible with existing primitives, no new primitive needed.

### 2. Moment of inertia 60

`Σ m·r² = 8+9+4+3+0+7+16+1+12 = 60` about the center on a unit grid.
Published invariant (Loly Math Gazette `I3 = 60`). K covers only the
determinant, so this is distinct.

- Target group: Lines & Totals (aggregate/matrix identity, with J/K/S/P/R).
- Animation: per-cell `m·r²` bars plus a total-60 pill plus a formula badge.

### 3. Singular values

`MᵀM = [[89,59,77],[59,107,59],[77,59,89]]`, eigenvalues `225, 48, 12`,
so singular values are `15`, `4√3 ≈ 6.928`, `2√3 ≈ 3.464`; rank 3
(det 360 ≠ 0). Consistent cross-checks: trace `285`, det `360² = 129600`.
K covers only det 360, so the singular-value headline is distinct.

- Target group: Lines & Totals (with K/S).
- Animation: formula/eigenvalue badge plus pills for the three values.
  Feasible; single board only.

### 4. Sum of squares 285 / Frobenius norm √285 (weak)

`16+81+4+9+25+49+64+1+36 = 285`; rows `101+83+101`, cols `89+107+89`,
diagonals `77`/`93`. True, but the components already appear in Q's text,
so only add this if the aggregate-total headline is judged distinct enough.

- Target group: Lines & Totals, if accepted.
- Animation: margin square-sum pills plus a 285 pill.

## Group changes

No new group is strictly required: inertia, singular values, and (if
accepted) sum-of-squares all file into existing Lines & Totals. Mod-3 fits
nowhere existing — Modular Border is mod-10 perimeter walks only and Core
Balance is pair sums — so either create one narrow group **Residues &
Classes** for it (leaving room for future residue/digital-root items) or
park it in Lines & Totals.

Rejected group ideas: a broad Residues & Parity group (its parity half
duplicates F) and a Complements & Transforms group (misstates Q's placement
and its examples tie to existing homes N/G/L/Q/A).

## Rejected candidates

Duplicates (true but already covered): center-5 mean/median/incidence
(E+I+O); parity checkerboard (F); cross-equals-corners 20 (F verbatim);
15-partition exhaustion (O's eight triples); matrix powers incl.
`M³ = 3375 = 15³` (S verbatim, plus a trivial `15ⁿ` eigenvector corollary);
knight adjacency 1-2-3 / 7-8-9 (M's narrowed claim); median-is-5 and the
H-converse (E/I and H/C).

False or ineligible (do not add): bimagic (row-square sums 101/83/101,
col-square sums 89/107/89, diag-square sums 77/93 — squaring is not magic);
pandiagonal (broken diagonals give 24, 6 / 12, 18, never 15); most-perfect
and Franklin squares (require order 4k / doubly-even order; the four 2x2
block sums 21, 23, 17, 19 are all distinct).

## Build checklist per new item

1. [data/properties.json](/luoshu-explorer/data/properties.json):
   `{id, slug, category, title, shortDesc, formula, longDesc}`.
2. [js/verify.js](/luoshu-explorer/js/verify.js):
   a `verify[id]` predicate on the flat 3x3 row-major grid (larger-board
   claims need a standalone board-builder plus `Holds` fn, as U–W do).
3. [js/animation-scripts.js](/luoshu-explorer/js/animation-scripts.js):
   `script<ID>` with `{id, title, steps[]}`, registered in `demoScripts`.
4. Captions and formulas must agree with the verify math
   (`checks/content.check.mjs` enforces this).
5. Steps use existing overlay primitives from
   [js/overlay.js](/luoshu-explorer/js/overlay.js):
   line, segments, path, arc, ring, mark, bar, cellTag, chip, op, gutter,
   badge.

## Open questions

- Accept or reject the weak 285 / Frobenius item.
- One-item Residues & Classes group for mod-3, or park mod-3 in
  Lines & Totals.
- Backups never fully recomputed here: adjugate line-sum 24, Siamese
  (up-step) generability of the Lo Shu, center lines as 3-term arithmetic
  progressions (excluded as a corollary of opposites-sum-to-10).
