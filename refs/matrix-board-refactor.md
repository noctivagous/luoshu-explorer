## Goal

Refactor the matrix area next to the property card so it can render and animate boards larger than 3×3 — specifically the 5×5 (U), 3×11 strip (V), and 9×9 (W) boards from Overlapping Luoshu — instead of the current workaround where the matrix stays 3×3, shows only the active window's values via `setValues`, and the real board lives in the sheet below.

Properties A–T, the construction, and T's in-board nesting must keep their current 3×3 behaviour unchanged.

## Success Criteria

- Selecting U renders a real 5×5 matrix in the board card; V renders 3×11; W renders 9×9. No property's main board is a 3×3 stand-in for a larger board.
- The animations play in that matrix: the active 3×3 window is framed/highlighted on the larger board and moves (slides, jumps, switches board) step to step, driven by the existing player (`--anim-p`, step gating, predict withholding).
- Window sums/verdicts appear on or beside the matrix as overlay annotations, not only in a sheet underneath.
- The overlap sheet added last turn is removed for U–W (no duplicated board below the matrix).
- A–T rendering is byte-for-byte the same frame output: same geometry, cell size, overlay positions, nest minis, flyers, predict, playground, probe, and correspondences.
- `npm run check` and `npm run build` pass, with new checks proving board-mode frames and legacy regressions.

## Approach

### Current facts grounding the plan

- The stage is hard-coded 3×3 everywhere: `js/overlay.js` exports `gn=108`, `Tl=8`, `Z=340`, and `CENTERS` for 9 cells; every overlay primitive (line, chip, gutter, bar, cellTag, path, ring) indexes into those 9 centres.
- `js/animation.js` validates `highlight`/`setValues`/`moves` as indices 0–8 only, and `frameFor`/`promptFrameFor` carry only the 3×3 frame fields.
- The board render in `js/app.js` maps over `SQUARE` (9 cells), sizes cells at `gn`, derives centre/corner/edge styling from indices 0–8, and layers nest minis, correspondences, playground swaps, predict taps, and probe clicks on those 9 cells.
- The mobile fit rule in `css/styles.css` matches the literal `width: 340px` stage.

### Key decisions

| Decision | Choice | Rejected alternative |
|---|---|---|
| Board contract | New `matrix.board` on steps: `{rows, cols, values}` carried by `frameFor` like `nest` | Script-level board only — W must switch compound → folded mid-script |
| Index space | When `board` is present, `highlight`/`setValues`/`moves` index the board's `rows*cols` cells; when absent, legacy 0–8 rules apply unchanged | One global enlarged index space for all scripts |
| Geometry | `makeGeometry(rows, cols)` in overlay.js returns cell size, stage w/h, and centres; stage width stays capped at 340px, cell size derives from cols | Fixed 108px cells with a scrolling stage |
| Overlay reuse | `renderOverlay(items, {geometry})` defaults to the current 3×3 geometry; all primitives read centres from the passed geometry | A separate board-only renderer duplicating chips/badges |
| Window framing | New overlay primitive `window` (rect over a 3×3 region at board offset) plus existing badges/chips for sums | Encoding the frame as four line items per step |
| Sums display | Badges/chips on the board state the window report; the U–W overlap sheet is deleted | Keeping both board and sheet (duplicated board) |
| 3×3-only interactions | Playground, correspondences, cell probe, and nest minis are gated off in board mode; predict keeps working in board index space | Generalising playground/probe to arbitrary boards in this refactor |

Assumption: board values are step data (from the existing `verify.js` constructors), not computed in `app.js`. W's two boards are both 9×9, so dimensions stay stable within a script; only `values` change.

## Steps

### 1. Board contract in the animation engine

In `js/animation.js`:

- Extend the script-format doc comment with `matrix.board`.
- Validate `board`: positive integer `rows`/`cols` (cap each at 11), `values` an array of exactly `rows*cols` numbers.
- When a step sets `board`, validate that step's `highlight`, `setValues` keys, and `moves` against `rows*cols`; keep the existing 0–8 validation when no board is set.
- Carry `board` through `frameFor` with latest-step-wins semantics like `nest`; `promptFrameFor` withholds the board (previous step's board, or null on step 1) alongside highlight/values.

### 2. Parameterised overlay geometry

In `js/overlay.js`:

- Add `makeGeometry(rows, cols)`: gap stays `Tl`; cell size = `(Z − (cols−1)·Tl) / cols` (5×5 ≈ 61px, 9×9 ≈ 30px, 3×11 ≈ 25px wide × 3 rows tall); returns `{rows, cols, cell, gap, width, height, centers}`.
- Keep `gn`, `Tl`, `Z`, `CENTERS` exports as the 3×3 geometry so A–T call sites are untouched.
- Thread an optional `geometry` through `renderOverlay`/`renderItem` and the centre lookups (`cellCenter`, `endpoints`, `cellsBetween`, `chipPoint`, `placeStyle`, bars, cellTags, rings centred on the geometry's stage).
- Add the `window` draw primitive: a stroked rect spanning a 3×3 region at `{row, col}` in board coordinates, player-driven entrance like other strokes, optional fill tint.
- Gutters keep working in board coordinates (margin ticks outside the board's own width/height).

### 3. Board-mode rendering in the matrix area

In `js/app.js`:

- Derive the active layout once: `const boardMode = showFrame?.board` (falling back to the script's last board at idle/overview, mirroring how the sheet frame is chosen today); geometry from `makeGeometry(board.rows, board.cols)` or the legacy 3×3 geometry.
- Render `board.values` as `rows*cols` cells sized by the geometry, with font size scaled from cell size instead of the fixed `text-[42px]`. Legacy path renders exactly as today.
- In board mode: neutral cell styling (no centre/corner/edge colour logic), the framed window's cells get the active tint, `highlight` dims non-window cells the same way focus dimming works now, and aria labels read `Cell row R, column C, value V`.
- Gate off in board mode: nest minis, correspondences layers, playground swapping, and the sticky cell probe (board cells are not probe targets; `cellProperties()` must skip board scripts so its 0–8 index assumptions cannot crash — it currently iterates every script's highlights).
- Predict mode stays live: taps collect board indices and Check compares against the step's board-space `highlight` (the window's 9 cells).
- Flyers/`moves` use the active geometry's centres instead of the global `CENTERS`.
- Delete `renderOverlapSheet`/`OVERLAP_BOARDS` and the now-unused overlap imports from `app.js`; remove the `overlap` sheet kind from validation in `animation.js` rather than leaving dead machinery.

### 4. Stage sizing and CSS

In `css/styles.css`:

- Keep the legacy stage at 340×340. Board stages use their geometry width (≤340) and computed height (the 3×11 strip is short and wide, centred in the card).
- Update the mobile fit rule that matches `width: 340px` so it scales any stage by its actual width/height (data attribute or CSS var carrying stage size), preserving the current small-screen behaviour for the 3×3.
- Move the sheet's active/magic cell tints to board classes (`.board-cell-window`, `.board-cell-magic` for the overview beat); remove the now-unused `.sheet-overlap*` rules. No new visual language: same ink/terracotta/green palette, no glows or gradients.

### 5. Rewrite the U/V/W scripts onto the real boards

In `js/animation-scripts.js`:

- Keep each script's step count, captions, tape titles, and ledger badge texts (checks pin several verbatim).
- Each step now sets `matrix.board` from the existing constructors in `verify.js` (`centralBoard()`, `stripBoard()`, `foldedBoard()`, `nestBlocks(LOSHU, LOSHU)` for W's compound beats), `highlight` = the active window's 9 flat board indices, and a `window` draw item at the step's offset that moves between steps.
- Sums move onto the board: the existing badge per step stays (ledger unchanged), and the overview steps (`all`) draw one `window` item per magic window instead of relying on sheet highlighting.
- Drop the `setValues`-as-window trick and all `sheet` payloads from U–W.

### 6. Update the checks

- `checks/animation.check.mjs`: assert U/V/W frames carry boards of 25/33/81 cells, highlight stays inside the board, the window offset advances per step, predict withholds a board change, and malformed boards (wrong value count, out-of-range highlight) fail validation. Update the U–W sheet assertions added last turn to board assertions.
- `checks/content.check.mjs`: render board frames through `renderOverlay` with the frame's geometry; assert the `window` key renders at idle, future windows don't leak into early steps, U–W no longer carry sheets (move them to the no-sheet group), and keep the verified-math and ledger assertions as-is.
- `checks/render-smoke.check.mjs`: the `.board-cell` count is 9 on the construction, then 25 after selecting U, 33 for V, 81 for W; playground and probe assertions stay on the 3×3 properties; add that the playground toggle does not offer swaps on a board-mode property.
- `checks/playback.check.mjs`: deep-link to `#/luoshu/math/overlapping-luoshu/central-overlap?step=2`, assert the stage renders 25 cells and stepping advances the framed window; button counts unchanged from last turn (no new controls).

## Validation Plan

```sh
npm run check
npm run build
```

Then, with `npm run dev`, open `http://localhost:5173` and manually verify:

- U: the 5×5 fills the card, the frame visits all four corner windows, the overview frames all four at once; numerals legible.
- V: the 3×11 strip renders wide and short, the window slides one column per beat, and the diagonal-failure beats are readable at 25px cells.
- W: the board switches compound → folded at step 3 without resizing, and the shifted windows at (0,2) and (2,4) are framed.
- A, T, and the construction look pixel-identical to before (cell size, overlay positions, nest minis); playground, probe, correspondences, and predict still work there.
- Narrow viewport: the board scales to content width without horizontal scroll, per the SPA shell rules.

Highest-risk step: Step 2/3 geometry threading — a missed centre lookup would silently misplace overlays on A–T. The legacy-default geometry and the unchanged A–T check suites are the guard; run `npm run check` after Step 2 before touching the scripts.

## Risks / Open Questions

- `js/app.js` is recovered bundle code with a minimize-churn convention; the board branch adds one derived layout and one gated render path rather than rewriting the legacy cell map.
- 9×9 cells at ~30px and strip cells at ~25px are the legibility floor; if W reads poorly, the fallback is a slightly wider stage cap for board mode only (CSS-only change, no contract change).
- Predict on W asks for 9 window cells per prompt — acceptable, and consistent with existing multi-cell prompts.
- Open questions: None. Playground/probe generalisation to larger boards is explicitly out of scope.
