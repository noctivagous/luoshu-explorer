# Animation Clarity & Motion-Graphic Audit

Date: 2026-10-21  
Scope: the ordinal construction and properties A–N as implemented in
`js/animation-scripts.js` and rendered by `js/overlay.js`. This is a visual
communication review, not a mathematical-content review.

## Executive finding

**“Build the square” is the only animation whose primary idea is legible
without reading all of the copy.** Numbers visibly change position, so the
viewer can infer that a construction is taking place.

Most of the property animations are instead **a static diagram revealed over
time**: a thin line appears, a few cells receive a highlight, and a small chip
or caption supplies the missing meaning. That is not necessarily bad for a
reference diagram, but it is too bare for an explanatory motion graphic. The
viewer must read a label to know:

1. what operation is being performed,
2. which values are operands and which value is the result,
3. where the result belongs, and
4. why this instance proves the stated property.

The strongest improvement is to make every beat use the same visual sentence:

> **focus operands → show operation → move/reveal the result → state the
> invariant**

For example, “4 + 6 = 10” should not be a `10` pill on an otherwise generic
line. The cells 4 and 6 should become the active operands, the line should
connect them through or toward 5, `4 + 6` should assemble into `10`, and a
small persistent fact, `10 = 2 × center`, should close the beat.

## What “bare” means here

An animation is marked **bare** when it relies mainly on one or more of these
conditions:

- **Generic geometry:** a line, ring, or arrow is visible, but that shape does
  not itself encode the arithmetic relationship.
- **Caption dependency:** removing the caption makes the intended operation
  unclear or leaves multiple plausible readings.
- **No transformation:** values are highlighted but never combine, change,
  travel, cancel, balance, or otherwise demonstrate the stated rule.
- **Result without working:** a pill says `15`, `20`, or `5` without showing
  how the selected numbers produce it.
- **Weak hierarchy:** the main board, thin strokes, 8–11 px annotation text,
  and explanatory label compete at approximately the same visual weight.
- **No payoff frame:** after the step completes, there is no clean final
  composition that lets the viewer retain the rule.

The renderer makes those tendencies visible: most strokes are 1–2.2 px wide,
chips use 9–11 px text, and arc labels use 8 px text. These are especially
fragile once the board is scaled down. The existing stroke-draw and pop-in
effects improve entrance, but they do not add semantic information.

## Triage by animation

| ID | Current clarity | Why it is bare or unclear | Professional motion-graphic treatment |
|---|---|---|---|
| Build | Good baseline | The swap/fold moves are real, but the viewer is not shown why these moves form Lo Shu. The transition has no named phases or temporary source/target state. | Keep the physical moves. Add a three-part title card (`write`, `swap opposite corners`, `fold`) and briefly ghost the pre/post locations. Pause on a clean before/after comparison. This is the model for all other animations. |
| A — Opposites | Moderate | A colored chord and `10` chip establish pairing, but do not show the addition or the role of the center. Four unrelated colors create visual variety without a shared explanation. | Animate the two selected numerals into a large midpoint equation, then resolve to `10`. Draw a faint center axis or “through 5” marker and finish with a persistent `opposites = 2 × 5` lockup. Give pairs a consistent ordinal marker as well as color. |
| B — Lines sum to 15 | Bare / cluttered | The finished board contains rows, columns, diagonals, and many small `15` chips simultaneously. Chips crowd the right and bottom edges; thin dashed strokes pass through the numbers. A line says “group,” not “sum.” | Treat one line at a time as a hero. Light its three cells in sequence, show a large running total (`4 → 13 → 15`) in a reserved outer gutter, then leave a single tidy `= 15` badge. Repeat with a row, column, and diagonal; end on an eight-line overview with only eight restrained gutter ticks, not eight chips. |
| C — Clockwise addition mod 10 | Partly clear, still bare | The perimeter path and wedge arrows imply direction, but the tiny badges carry the arithmetic. The essential modular reduction (`13 → 3`) appears as text rather than an event. | Use a traveling token/ledger around the border: `1 + 6 → 7`, then `7 + 2 → 9`. For overflow, visibly split `13` into a muted `1` tens digit that drops away and an emphasized `3` that lands in the target cell. Keep a faint clockwise path as context. |
| D — Counterclockwise arms | Bare | Center-to-edge-to-corner arrows show a route, but they do not make “add 5” or modular reduction visible. The current result is a small off-cell badge. | Begin with a center `5` token that joins the edge value, then send the result along the second arm into the corner. Use the same overflow treatment as C. Use a central directional compass/arrow once, so counterclockwise is legible rather than inferred from four separate arms. |
| E — Five rules everything | Bare / decorative | Concentric dashed rings are visually attractive but arbitrary: radius does not communicate 9, 2, or 3. A badge tells the whole story; the rings do not prove it. | Replace rings with three deliberately different groupings: all 9 cells collect to `45`, one opposite pair joins to `10`, and one magic line accumulates to `15`. Conclude by snapping the three totals into a vertical `9×5 / 2×5 / 3×5` fact stack centered on the 5. |
| F — Corners = Edges | Bare | Cell color separates evens from odds, but the two totals are small badges above the board. There is no visible collection, weighing, or equality; the final frame is merely colored cells. | Bracket the four corners and the four edge cells outside the grid. Animate each group into a large `Σ 20`, then connect the two totals with an equal sign or a restrained balance beam. Retain even/odd markers so color is not the only cue. |
| G — Zero-balanced form | Bare | `+n`, `−n`, and `0` tags are shown, but the values do not visibly become deviations from 5. It is not clear that the original matrix has been transformed, nor that lines now total zero. | Perform a visible “subtract 5” pass: each cell briefly shows `original − 5`, then flips to its signed deviation. Demonstrate one row canceling to zero with opposite-signed tokens, then end with all three line families shown as quiet `Σ 0` gutter marks. |
| H — Subtraction = 5 | Bare | An arrow and a `5` chip could mean distance, sum, direction, or subtraction. The modulo-10 exception is caption-only. | Mirror C’s visual grammar in reverse: select the minuend, subtract the corner, and let the residual `5` settle at the center. For `1 − 6`, show `−5` crossing a small “mod 10” gate to become `5`; this converts a textual exception into the memorable moment. |
| I — Middle is mean | Bare | Faint center lines and small hard-positioned equation pills do not demonstrate averaging. The center `μ` mark is a symbol, not an operation. | Pull equal-length measure marks from both endpoints toward the center, or animate two endpoint tokens converging to `5`. Build the equation in a fixed, high-legibility equation panel; then pulse the center when the average lands. Reuse this exact visual vocabulary for all four axes. |
| J — 111 property | Bare / cognitively dense | Lines identify rows or columns, but do not convey “read these cells as a three-digit number.” The long arithmetic badge is too dense to scan during a 1.5 s step. | First fuse each row’s three cells into a horizontal number ribbon (`492`, `357`, `816`) in a side ledger. Stack and sum the ribbons to `1665`. Repeat vertically for columns, using rotated/vertical read markers only while needed. Finish with the large reduction `1665 = 15 × 111`. |
| K — Determinant 360 | Most bare | This is effectively two static holds: all cells highlighted, then one long badge. The determinant is neither spatially explained nor animated. | Choose one of two honest treatments: (1) a short cofactor-expansion storyboard, highlighting the selected row, each 2×2 minor, sign, and contribution; or (2) explicitly label it a “computed invariant” and use a restrained reveal card, not an animation rail. Do not imply that a badge is a visual proof. |
| L — Mirrored distance | Bare | Small vertical bars show magnitude, but there is no explicit mirror axis, no pairing, and no reason a bar above/below a cell corresponds to a partner. | Add a center-origin baseline and connect opposite cells in matched pairs. Grow `+4` and `−4`, then `+3` and `−3`, etc. simultaneously, with equal heights mirrored across the baseline. End on four clear paired brackets rather than nine isolated bars. |
| M — Knight’s tour (torus) | Bare / potentially misleading | Curved arcs and 8 px labels are too delicate to explain a nonstandard toroidal path. Dashed strokes alone do not say “wrap,” and several paths overlap the digits. | Give the board a temporary torus treatment: duplicate/ghost edge cells just beyond the boundary, then send a token through the edge and back in from the opposite side. Use a single numbered traveler, with a high-contrast current step and a short legend for solid versus wrapped hops. Avoid displaying all arcs at once. |
| N — All 3×3 are Lo Shu | Moderate | The digit glides are materially better than line-only animation, but an unlabelled shuffle can read as arbitrary rearrangement. The viewer is not told whether each beat is a rotation or reflection until reading the caption. | Add a brief transform affordance: a pivot/quarter-turn arc for rotations and a mirror axis that sweeps across the board for reflections. Keep the destination cells ghosted, then settle into a labeled pose (`rotate 90°`, `reflect vertical`). End with an 8-form contact sheet only after the main-board story completes. |

### Summary classification

- **Not bare / good base:** Build.
- **Usable but needs stronger arithmetic storytelling:** A, C, N.
- **Bare but readily recoverable with a reusable visual grammar:** B, D, E, F,
  G, H, I, J, L, M.
- **Should be reframed rather than merely decorated:** K.

## Cross-cutting causes

### 1. The scripts encode drawing, not explanation

The current primitives are useful (`line`, `path`, `arc`, `ring`, `bar`,
`chip`, `badge`) but mostly describe **where ink goes**. They do not describe
semantic roles such as operand, operator, result, target, group, accumulation,
cancellation, or invariant. As a result, every property falls back to a
caption and a small badge.

Add semantic, reusable primitives or conventions:

- `focus`: active operands; all inactive cells are deliberately quiet.
- `equation`: a consistently positioned, accessible equation with tokens that
  can enter, combine, reduce, or cancel.
- `collect`: tokens or values travel from selected cells into a total.
- `gutterTotal`: a large total in reserved outside-board space.
- `pair` / `bracket`: named relationships that avoid arbitrary connector
  lines.
- `resultLanding`: the result visibly arrives at a target cell.
- `modReduce`: shows a base-10 carry being discarded, rather than printing an
  arrow character.
- `transformCue`: rotation, reflection, wrap, or axis marker for geometric
  operations.

### 2. Annotations are too small and too close to the data

The board numerals are 42 px, while most explanatory annotation is 8–11 px.
This ratio makes the information-bearing layer look incidental. Some badges
also sit directly on or immediately beside numerals and strokes; the B
completed state is the clearest collision case.

Set a practical hierarchy:

- board numeral: existing 42 px is appropriate;
- active equation / result: 18–24 px;
- persistent group total / label: 13–15 px;
- secondary legend: 11–12 px minimum after responsive scaling;
- 8–10 px only for optional metadata, never for the main proof.

Reserve gutters around the board for totals and equations. Do not use a cell
face for both a large number and explanatory text unless the number itself is
being transformed.

### 3. There is no rhythm inside a step

Most steps begin their visual elements at time zero. The renderer can already
support staged entrances through `at`, but only A uses it meaningfully for the
sum chip. A professional explanatory beat needs a short sequence:

1. 0–15%: quiet the irrelevant board and establish focus;
2. 15–50%: draw/group the operands;
3. 50–75%: perform the operation or movement;
4. 75–100%: land the result and hold the invariant.

Use a 1.8–2.4 s beat when arithmetic must be read. The current 1.4–1.6 s
durations are suitable only for a viewer who has already learned the rule.

### 4. Motion is mostly entrance motion, not explanatory motion

Stroke drawing and badge popping answer “how did the overlay appear?” They do
not answer “what happened mathematically?” Prioritize token movement,
collection, cancellation, mirroring, and transformation cues over further
line-drawing polish.

### 5. Final frames need deliberate composition

The idle view renders every revealed item in a script. That makes several
properties read as crowded technical diagrams rather than a single memorable
conclusion. Each property should define a **presentation end state**:

- one dominant relationship,
- at most one main equation or total,
- a concise legend only if a new visual language was introduced.

The complete “all examples” state can remain available as a diagram/inspect
mode, but should not be the default end of every autoplay sequence.

## Recommended reusable treatments

These are a small system, not fourteen bespoke animations:

| Treatment | Best fits | Desired viewer takeaway |
|---|---|---|
| Pair-to-equation | A, H, I, L | “These two values have one exact relation.” |
| Sequential accumulation in a gutter | B, E, F, G, J | “This selected group makes this total.” |
| Traveling value / modular gate | C, D, H | “The next value is generated by this operation.” |
| Symmetric simultaneous growth | F, L | “The two sides balance or mirror.” |
| Board transformation cue | Build, G, M, N | “The entire square changes by a named rule.” |
| Computed-invariant card | K | “This is a derived matrix fact, not a spatial path.” |

## Priority roadmap

### First: fix clarity in the highest-value examples

1. **B** — create board gutters and an accumulation treatment. It is the
   central magic-square property and presently demonstrates the systemic label
   collision problem.
2. **C and D** — establish the traveling-token/modular-reduction grammar.
   That grammar can immediately be reused by H.
3. **F and I** — establish grouping/balance and midpoint/mean grammar. These
   give the app visual variety beyond connector lines.
4. **K** — decide whether to create a true determinant storyboard or present
   it as a non-animated computed fact.

### Second: normalize the rest

5. Apply group collection to E, F, G, and J.
6. Apply paired symmetric motion to A and L.
7. Give M and N explicit topology/transformation cues.
8. Add an “overview diagram” toggle only where the accumulated final state is
   useful; keep autoplay focused on one relationship at a time.

### Supporting implementation work

- Add a reserved annotation/gutter coordinate system outside `Z × Z` instead
  of using ad-hoc badge offsets.
- Let draw items specify semantic phases or `at` offsets for focus, operation,
  result, and hold.
- Add a board-level ghost/focus state so irrelevant cells recede.
- Test responsive annotation size at the smallest supported viewport; do not
  scale the main explanatory text below 11–12 px.
- Add screenshot/DOM checks for label collisions and for the intended end
  state of the primary properties (at minimum B, C, F, I, J, M, N).

## Acceptance criteria for a revised property

A revised animation is ready when a first-time viewer can answer these without
reading the long description:

1. Which cells are participating?
2. What operation or transformation is occurring?
3. What result was obtained, and where did it come from?
4. What remains true when the next example appears?

If any answer depends on a 9 px chip, a dashed line alone, or the sidebar
caption, the animation is still a diagram with a reveal effect rather than an
explanatory motion graphic.

## Task list (2026-10-21)

Tracks the Priority roadmap above. The playback/integration and capability
halves of the program live as §12 in
[animation-and-capability-improvements.md](animation-and-capability-improvements.md);
this list covers only the per-property clarity treatments and their
supporting work.

- [ ] Build: three-part title card (`write` / `swap opposite corners` /
  `fold`), ghosted pre/post locations, clean before/after hold
- [ ] A: midpoint equation beat (`4 + 6` assembles to `10`), through-5
  marker, persistent `opposites = 2 × 5` lockup, ordinal pair markers
- [x] B: reserved gutters + accumulation treatment — one hero line per
  step, running total in the caption, tidy `= 15` margin ticks, faint
  eight-line overview (`rowGutter`/`colGutter`/`cornerGutter` in
  `js/overlay.js`, new `gutter` draw type)
- [ ] C/D: traveling-token + modular-reduction grammar (`13 → 3` as a
  tens-drop event, not text)
- [ ] H: reuse the C/D grammar in reverse, with a mod-10 gate for `1 − 6`
- [ ] F: corner/edge brackets, animated `Σ 20` collection, equality beam
- [ ] I: endpoint-convergence-to-center on all four axes, fixed equation
  panel, pulse on landing
- [x] K: decided — labeled computed-invariant card ("A computed fact,
  not a path", `det = 360 … · computed invariant` badge), not a visual
  proof; full cofactor storyboard deferred
- [ ] E/G/J: group-collection treatment (collect-to-total)
- [ ] L: center-baseline mirror with simultaneous paired growth
- [ ] M: torus treatment (ghost edge cells, single numbered traveler,
  solid-vs-wrapped legend)
- [ ] N: rotation/reflection affordances (pivot arc, mirror sweep), labeled
  poses, contact sheet only after the main-board story
- [ ] Overview-diagram toggle where the accumulated final state is useful;
  autoplay stays one-relationship-at-a-time
- [ ] Supporting: reserved annotation/gutter coordinates; per-beat
  focus→operate→result→hold phases; board ghost/focus state; ≥11–12 px
  post-scale annotation floor; label-collision + end-state DOM checks
  (B, C, F, I, J, M, N minimum)
