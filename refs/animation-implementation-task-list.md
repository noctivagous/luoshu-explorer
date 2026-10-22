# Luoshu Explorer — Consolidated Task List

Date: 2026-10-21  
Status source: this is the single current backlog. It reconciles
[animation-and-capability-improvements.md](animation-and-capability-improvements.md),
[animation-clarity-audit.md](animation-clarity-audit.md), and `TASKS.txt`.
Completed work is recorded briefly for context; unchecked tasks are the active
backlog.

## Delivered baseline

- [x] Declarative, player-driven animation system with reduced-motion support,
  step controls, scrubber, loop, keyboard controls, deep links, and overview
  diagram mode.
- [x] Content verification for A–N, overlay/end-state checks, gutter
  annotations, collision checks, and focus/ghost states during playback.
- [x] Revised explanatory treatments for A–N, including the six-step
  transient-proof version of E.
- [x] Correspondences toggles: elements, trigrams, tones, parity, and
  directions.
- [x] Responsive shell and touch targets, covered by `npm run check`.

## Priority 1 — complete the explanatory core

These are the highest-value tasks because they make the existing explorer
clearer for a first-time visitor without adding a second mode or new content.

- [x] **Build the square:** add three named construction cards—`write`,
  `swap opposite corners`, and `fold`—with ghosted source/destination cells
  and a clean before/after hold.
- [x] **Responsive visual QA:** inspect every property at the smallest
  supported phone width and correct any clipped gutter, caption, or equation.
  Main explanatory text must render at 11–12 px or larger.
- [x] **Worked-example tape:** add a persistent, step-synchronised arithmetic
  ledger beside/below the board for the current property.
- [x] **Bidirectional linking:** hovering/focusing a tape entry highlights its
  cells; focusing a participating cell highlights the relevant tape entry.
- [x] **Formula-token sync:** tokenize the detail-card formula and emphasize
  the portion demonstrated by the current animation step.
- [x] **Equation hierarchy:** promote primary operands/results to about
  18–24 px; retain 11–12 px only for secondary labels and legends.

Acceptance check: a first-time viewer can identify the participating cells,
operation, result, and persistent invariant without needing the long
description.

## Priority 2 — improve playback continuity

- [x] Fade from the idle overview into the first gated frame instead of
  cutting when Play is pressed.
- [ ] Cross-fade the old overlay out and the new overlay in when selecting a
  property. (Fade-in on switch landed; true overlap deferred to browser pass.)
- [x] Add an opt-in autoplay-on-select preference.
- [x] Add autoplay-next at the end of a property, with an obvious stop/loop
  choice.
- [x] Replace the fixed 0.5×/1×/2× cycle with a 0.25×–3× speed control.
- [x] Add visible step ticks/labels to the timeline scrubber.

## Priority 3 — make the explorer interactive and teachable

- [x] **What breaks? playground:** allow swapping two cells and show an A–N
  checklist derived from `verify()`, with a one-click restore of Lo Shu.
- [x] Surface `verify()` in the normal UI as a compact “computed” status for
  the active claim.
- [x] Predict mode: pause before a result and ask the visitor to choose the
  next cell/value.
- [x] Cell probe: selecting a cell lists and lightly draws every property in
  which it participates.
- [ ] Quiz mode built from the same property/animation data.

## Priority 4 — create tours and comparison views

- [ ] Play-all tour through A–N, grouped with category chapter cards.
- [ ] Make each category a selectable playlist.
- [ ] Compare mode with two simultaneous properties and distinct legends.
- [ ] Add sharable deep links for a selected animation variant and precise
  playback position if the current step-level links are insufficient.

## Priority 5 — sharing and output

- [ ] Export a selected property/step as PNG or SVG.
- [ ] Export an animation as GIF or WebM.
- [ ] Add a print stylesheet/storyboard view that lays every step out in
  sequence.

## Priority 6 — content and correspondence research

- [ ] Select and document an authoritative source for Five Elements and
  trigram mappings before presenting them as canonical.
- [ ] Add citations/source notes to the correspondence legend once selected.
- [ ] Decide whether the determinant should eventually receive a full
  cofactor-expansion storyboard; the current computed-invariant card is the
  intentionally limited treatment.

## Priority 7 — broader product navigation

Items originating in `TASKS.txt`; these are separate from the arithmetic
animation work.

- [ ] Move the Modular Border category nearer the top of the property list.
- [ ] Add a classic traditional/non-tabular view toggle at the top of the
  explorer.
- [ ] Add a left-side concept switcher: active Lo Shu, plus disabled/teaser
  Hetu and Bagua tiles for the future multi-concept explorer.
- [ ] Define the activation criteria and content scope for Hetu and Bagua
  before making those tiles interactive.

## Maintenance and documentation

- [ ] Keep this file current whenever an item lands; do not add a competing
  task list to another reference document.
- [ ] Refresh the README’s test/layout description to reflect the current
  animation modules and check suite.
- [ ] Resolve the existing React list-key warnings emitted by the JSDOM smoke
  check, then make the smoke suite fail on new React warnings if practical.
- [ ] Keep visual end-state checks aligned with any new animation primitive or
  variant.
- [ ] Consider a browser-based visual regression pass for the primary
  properties after the responsive QA work is complete.

## Suggested delivery order

1. Build construction treatment and responsive visual QA.
2. Worked-example tape, formula-token sync, and equation hierarchy.
3. Idle/selection transitions and speed/timeline polish.
4. “What breaks?” plus live computed status.
5. Tours/compare, then export and print.
6. Traditional view and future-concept navigation after the Lo Shu teaching
   flow is stable.
