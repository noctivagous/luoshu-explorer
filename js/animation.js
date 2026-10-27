// Animation engine + script format for luoshu-arithmetic-properties.
//
// A script is plain JSON-compatible data:
//
//   {
//     id: "A",               // property id or "construction"
//     title: "Opposites balance",
//     steps: [
//       {
//         id: "A-1",           // unique within the script
//         caption: "1 + 9 = 10 ...",  // short in-place explanation
//         durationMs: 1200,    // how long play() lingers on this step
//         overlay: { show: ["A.pair-0"] },   // overlay element keys revealed by this step
//         matrix: { highlight: [7, 1], setValues: null }, // cell indices 0-8; values override SQUARE
//       },
//     ],
//   }
//
// Conventions:
// - `overlay.show` keys match `data-anim-key` attributes rendered by js/app.js.
// - `matrix.highlight` uses the SQUARE/CENTERS index space (0-8).
// - `matrix.setValues` is a sparse {index: value} override; null means "show the
//   real Lo Shu numbers". Construction scripts use {visibleCount} instead via
//   setValues built step by step (see animation-scripts.js).
// - `matrix.nest` (null, {mode:"palace",palace:1-9,mark?}, or {mode:"all"})
//   expands board cells into their nested 3×3 palaces (see js/app.js). Minis
//   always use the un-zoomed base grid as the inner square; zoom beats re-base
//   the board with setValues instead.
// - `matrix.visibleCount` (optional) reveals only the first N construction cells.
// - A `draw` item with `transient: true` is visible only during its own step.
//   Use it for a focused worked example that should clear before the next
//   example; ordinary draw items continue to accumulate into the overview.
// - A step may carry `sheet` beside `draw`. Families accumulate; strike,
//   reveal, worked, sums, and compareTurn take the latest defined value.
//   The sheet is figures for the content column. It is not overlay text.

export const SPEEDS = [0.25, 0.5, 1, 1.5, 2, 3];
export const DEFAULT_STEP_MS = 1200;

export function animStep(id, patch = {}) {
  return {
    id,
    caption: "",
    durationMs: DEFAULT_STEP_MS,
    overlay: { show: [] },
    matrix: { highlight: [], setValues: null },
    ...patch,
    overlay: { show: [], ...(patch.overlay || {}) },
    matrix: { highlight: [], setValues: null, ...(patch.matrix || {}) },
  };
}

export function validateScript(script) {
  const errors = [];
  if (!script || typeof script !== "object") return ["script must be an object"];
  if (typeof script.id !== "string" || !script.id) errors.push("script.id must be a non-empty string");
  if (!Array.isArray(script.steps) || script.steps.length === 0)
    errors.push("script.steps must be a non-empty array");
  if (script.preview !== undefined) {
    const pv = script.preview;
    if (!pv || typeof pv !== "object" || Array.isArray(pv))
      errors.push("script.preview must be an object");
    else if (
      pv.caption !== undefined &&
      pv.caption !== null &&
      typeof pv.caption !== "string"
    )
      errors.push("script.preview.caption must be a string or null");
  }
  if (errors.length) return errors;
  const seen = new Set();
  script.steps.forEach((s, i) => {
    const at = `steps[${i}]`;
    if (!s || typeof s !== "object") {
      errors.push(`${at} must be an object`);
      return;
    }
    if (typeof s.id !== "string" || !s.id) errors.push(`${at}.id must be a non-empty string`);
    else if (seen.has(s.id)) errors.push(`${at}.id duplicate: ${s.id}`);
    else seen.add(s.id);
    if (typeof s.caption !== "string") errors.push(`${at}.caption must be a string`);
    if (s.durationMs !== undefined && !(typeof s.durationMs === "number" && s.durationMs > 0))
      errors.push(`${at}.durationMs must be a positive number`);
    if (s.overlay !== undefined) {
      if (!s.overlay || typeof s.overlay !== "object" || !Array.isArray(s.overlay.show))
        errors.push(`${at}.overlay.show must be an array`);
      else if (!s.overlay.show.every((k) => typeof k === "string"))
        errors.push(`${at}.overlay.show keys must be strings`);
    }
    if (s.draw !== undefined) {
      if (!Array.isArray(s.draw)) errors.push(`${at}.draw must be an array`);
      else
        s.draw.forEach((item, j) => {
          if (!item || typeof item.key !== "string" || !item.key)
            errors.push(`${at}.draw[${j}].key must be a non-empty string`);
          if (item.at !== undefined && !(typeof item.at === "number" && item.at >= 0 && item.at <= 1))
            errors.push(`${at}.draw[${j}].at must be between 0 and 1`);
          if (item.transient !== undefined && typeof item.transient !== "boolean")
            errors.push(`${at}.draw[${j}].transient must be a boolean`);
        });
    }
    if (s.matrix !== undefined) {
      if (!s.matrix || typeof s.matrix !== "object") errors.push(`${at}.matrix must be an object`);
      else {
        if (s.matrix.highlight !== undefined) {
          if (
            !Array.isArray(s.matrix.highlight) ||
            !s.matrix.highlight.every((c) => Number.isInteger(c) && c >= 0 && c <= 8)
          )
            errors.push(`${at}.matrix.highlight must be cell indices 0-8`);
        }
        if (s.matrix.setValues !== undefined && s.matrix.setValues !== null) {
          const sv = s.matrix.setValues;
          if (!sv || typeof sv !== "object" || Array.isArray(sv))
            errors.push(`${at}.matrix.setValues must be an object or null`);
          else {
            for (const [k, v] of Object.entries(sv)) {
              const idx = Number(k);
              if (!Number.isInteger(idx) || idx < 0 || idx > 8)
                errors.push(`${at}.matrix.setValues key out of range: ${k}`);
              if (typeof v !== "number" && v !== null)
                errors.push(`${at}.matrix.setValues values must be numbers or null`);
            }
          }
        }
        if (s.matrix.nest !== undefined && s.matrix.nest !== null) {
          const nest = s.matrix.nest;
          const okNest =
            nest &&
            typeof nest === "object" &&
            !Array.isArray(nest) &&
            (nest.mode === "palace" || nest.mode === "all") &&
            (nest.mode !== "palace" ||
              (Number.isInteger(nest.palace) && nest.palace >= 1 && nest.palace <= 9)) &&
            (nest.mark === undefined ||
              nest.mark === null ||
              (nest.mode === "palace" &&
                Number.isInteger(nest.mark) &&
                nest.mark >= 1 &&
                nest.mark <= 9));
          if (!okNest)
            errors.push(
              `${at}.matrix.nest must be { mode: "palace", palace: 1-9, mark?: 1-9 } or { mode: "all" }`,
            );
        }
        if (s.matrix.moves !== undefined && s.matrix.moves !== null) {
          const ok =
            Array.isArray(s.matrix.moves) &&
            s.matrix.moves.every(
              (m) =>
                m &&
                Number.isInteger(m.from) &&
                Number.isInteger(m.to) &&
                m.from >= 0 &&
                m.from <= 8 &&
                m.to >= 0 &&
                m.to <= 8,
            );
          if (!ok) errors.push(`${at}.matrix.moves must be {from,to} cell indices 0-8`);
        }
      }
    }
    if (s.sheet !== undefined) {
      const sh = s.sheet;
      if (!sh || typeof sh !== "object" || Array.isArray(sh))
        errors.push(`${at}.sheet must be an object`);
      else {
        if (
          sh.kind !== undefined &&
          sh.kind !== "pairs" &&
          sh.kind !== "companion" &&
          sh.kind !== "compound" &&
          sh.kind !== "overlap"
        )
          errors.push(`${at}.sheet.kind must be pairs, companion, compound, or overlap`);
        if (sh.kind === "overlap") {
          if (!["central", "strip", "folded", "compound"].includes(sh.board))
            errors.push(`${at}.sheet.board must be central, strip, folded, or compound`);
          for (const key of ["wr", "wc"]) {
            const v = sh[key];
            if (v !== undefined && v !== null && !(Number.isInteger(v) && v >= 0 && v <= 8))
              errors.push(`${at}.sheet.${key} must be an integer 0-8 or null`);
          }
          if (sh.all !== undefined && typeof sh.all !== "boolean")
            errors.push(`${at}.sheet.all must be a boolean`);
        }
        if (sh.kind === "compound" && sh.scope !== "palace" && sh.scope !== "all")
          errors.push(`${at}.sheet.scope must be palace or all`);
        if (
          sh.kind === "compound" &&
          sh.scope === "palace" &&
          !(Number.isInteger(sh.palace) && sh.palace >= 1 && sh.palace <= 9)
        )
          errors.push(`${at}.sheet.palace must be an integer 1–9`);
        if (
          sh.mark !== undefined &&
          sh.mark !== null &&
          !(Number.isInteger(sh.mark) && sh.mark >= 1 && sh.mark <= 9)
        )
          errors.push(`${at}.sheet.mark must be an integer 1–9 or null`);
        if (
          sh.inner !== undefined &&
          sh.inner !== null &&
          sh.inner !== "base"
        )
          errors.push(`${at}.sheet.inner must be "base" or null`);
        if (
          sh.strike !== undefined &&
          sh.strike !== null &&
          !["hundreds", "tens", "units"].includes(sh.strike)
        )
          errors.push(`${at}.sheet.strike must be hundreds, tens, units, or null`);
        if (sh.families !== undefined) {
          if (!Array.isArray(sh.families)) errors.push(`${at}.sheet.families must be an array`);
          else
            sh.families.forEach((fam, j) => {
              if (!fam || typeof fam.id !== "string" || !Array.isArray(fam.lines))
                errors.push(`${at}.sheet.families[${j}] needs an id and lines`);
            });
        }
      }
    }
  });
  return errors;
}

const SHEET_LATEST = ["strike", "reveal", "worked", "sums", "compareTurn", "scope", "palace", "mark", "inner", "board", "wr", "wc", "all"];

function mergeSheet(prev, patch) {
  if (!patch) return prev;
  const out = prev ? { ...prev } : {};
  if (prev?.families) out.families = [...prev.families];
  if (patch.kind) out.kind = patch.kind;
  if (patch.families) {
    const families = out.families ? [...out.families] : [];
    for (const fam of patch.families) {
      const at = families.findIndex((f) => f.id === fam.id);
      if (at === -1) families.push(fam);
      else families[at] = fam;
    }
    out.families = families;
  }
  for (const key of SHEET_LATEST) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) out[key] = patch[key];
  }
  return out;
}

function due(at, gate) {
  return (at ?? 0) <= gate + 1e-9;
}

// Compute the rendered frame for a step index. `progress` (0–1) is how far
// through that step the clock is. Draw items and show-keys with `at` stay
// hidden until progress reaches them, so a step can sequence internally.
// Earlier steps are fully revealed. `script.chrome` is always drawn and never
// "entering". Matrix highlight / values come from the latest step that sets them.
// `moves` is only the current step (cell glides), not an accumulation.
export function frameFor(script, stepIndex, progress = 1) {
  const steps = script.steps;
  const clamped = Math.max(0, Math.min(stepIndex, steps.length - 1));
  const gate = Math.max(0, Math.min(1, progress));
  const visibleKeys = [];
  const seenKeys = new Set();
  const draw = [];
  const seenDraw = new Set();
  let highlight = [];
  let setValues = null;
  let visibleCount = null;
  let nest = null;
  let sheet = null;

  for (const item of script.chrome || []) {
    if (item && !seenDraw.has(item.key)) {
      seenDraw.add(item.key);
      draw.push(item);
    }
  }

  for (let i = 0; i <= clamped; i++) {
    const st = steps[i];
    const g = i < clamped ? 1 : gate;
    const items = st.draw || [];
    const transientKeys = new Set(items.filter((item) => item.transient).map((item) => item.key));
    const atFor = new Map();
    for (const item of items) {
      const at = item.at ?? 0;
      if (!atFor.has(item.key) || at < atFor.get(item.key)) atFor.set(item.key, at);
    }
    const show = new Set([...(st.overlay?.show || []), ...items.map((item) => item.key)]);
    for (const k of show) {
      if (i < clamped && transientKeys.has(k)) continue;
      const at = atFor.has(k) ? atFor.get(k) : 0;
      if (!due(at, g) || seenKeys.has(k)) continue;
      seenKeys.add(k);
      visibleKeys.push(k);
    }
    for (const item of items) {
      if (i < clamped && item.transient) continue;
      if (!due(item.at ?? 0, g) || seenDraw.has(item.key)) continue;
      seenDraw.add(item.key);
      draw.push(item);
    }
    if (st.matrix) {
      if (st.matrix.highlight !== undefined) highlight = st.matrix.highlight;
      if (st.matrix.setValues !== undefined) setValues = st.matrix.setValues;
      if (st.matrix.visibleCount !== undefined) visibleCount = st.matrix.visibleCount;
      if (st.matrix.nest !== undefined) nest = st.matrix.nest;
    }
    if (st.sheet) sheet = mergeSheet(sheet, st.sheet);
  }

  const prior = new Set();
  for (let i = 0; i < clamped; i++) {
    const items = steps[i].draw || [];
    const transientKeys = new Set(items.filter((item) => item.transient).map((item) => item.key));
    for (const k of steps[i].overlay?.show || [])
      if (!transientKeys.has(k)) prior.add(k);
    for (const item of items)
      if (!item.transient) prior.add(item.key);
  }
  const enteringKeys = visibleKeys.filter((k) => !prior.has(k));
  const moves = steps[clamped].matrix?.moves || null;

  return {
    stepIndex: clamped,
    step: steps[clamped],
    caption: steps[clamped].caption || "",
    visibleKeys,
    enteringKeys,
    draw,
    highlight,
    setValues,
    visibleCount,
    nest,
    moves,
    sheet,
    isFirst: clamped === 0,
    isLast: clamped === steps.length - 1,
  };
}

export function stepDuration(step) {
  return (step && step.durationMs) || DEFAULT_STEP_MS;
}

// Predict mode: the frame shown while the visitor guesses a step. The step
// stays current (caption, index, elapsed progress) but its own reveal is
// withheld: no highlight, no glides, previous values, and only earlier
// steps' annotations. Progress-0 gating alone would still leak at=0 items,
// so the draw list is rewound to the previous step outright.
export function promptFrameFor(script, stepIndex) {
  const i = Math.max(0, Math.min(stepIndex, script.steps.length - 1));
  const base = frameFor(script, i, 0);
  const prev = i > 0 ? frameFor(script, i - 1, 1) : null;
  return {
    ...base,
    highlight: [],
    moves: null,
    nest: null,
    setValues: prev ? prev.setValues : null,
    draw: prev ? prev.draw : [],
    visibleKeys: prev ? prev.visibleKeys : [],
    enteringKeys: [],
    sheet: prev ? prev.sheet : null,
  };
}

// Preview (pre-play) frame: what a list item shows when its page loads,
// before Play. It is a display frame only — the player is not advanced
// (step 0, elapsed 0, slider at 0, paused). Most scripts preview as the
// settled first frame: frame-0 values, highlights and draw items, rendered
// statically (no entering items reading --anim-p, no cell glides). A script
// may declare `preview: { caption }` to override the caption, or
// `caption: null` when the step-1 caption only makes sense once the
// animation runs; then the preview carries no step caption at all.
export function previewFrameFor(script) {
  const base = frameFor(script, 0, 1);
  const override = script.preview?.caption;
  const caption = override === undefined ? base.caption : (override ?? "");
  return {
    ...base,
    isPreview: true,
    caption,
    captionStep: caption.length > 0,
    enteringKeys: [],
    moves: null,
  };
}

// 0–1 position across the whole script, for the rail scrubber.
export function timelineRatio(script, stepIndex, elapsedMs) {
  const durations = script.steps.map(stepDuration);
  const total = durations.reduce((a, b) => a + b, 0);
  if (!total) return 0;
  let before = 0;
  for (let i = 0; i < stepIndex && i < durations.length; i++) before += durations[i];
  return Math.max(0, Math.min(1, (before + elapsedMs) / total));
}

export function ratioToTime(script, ratio) {
  const durations = script.steps.map(stepDuration);
  const total = durations.reduce((a, b) => a + b, 0);
  let remain = Math.max(0, Math.min(1, ratio)) * total;
  for (let i = 0; i < durations.length; i++) {
    if (remain <= durations[i] || i === durations.length - 1)
      return { stepIndex: i, elapsedMs: Math.max(0, Math.min(remain, durations[i])) };
    remain -= durations[i];
  }
  return { stepIndex: 0, elapsedMs: 0 };
}

// Time-injectable player. Pass nowFn + raf for tests; defaults use Date.now /
// requestAnimationFrame when available, with setTimeout fallback for jsdom.
export function createPlayer(script, opts = {}) {
  const errors = validateScript(script);
  if (errors.length) throw new Error(`Invalid animation script: ${errors.join("; ")}`);
  const nowFn = opts.nowFn || (() => Date.now());
  const raf =
    opts.raf ||
    (typeof requestAnimationFrame !== "undefined"
      ? requestAnimationFrame
      : (cb) => setTimeout(() => cb(nowFn()), 16));
  const cancelRaf =
    opts.cancelRaf ||
    (typeof cancelAnimationFrame !== "undefined" ? cancelAnimationFrame : clearTimeout);
  const onFrame = opts.onFrame || (() => {});
  const totalSteps = script.steps.length;

  let stepIndex = 0;
  let playing = false;
  let speed = 1;
  let loop = !!opts.loop;
  let stepElapsed = 0;
  let lastTick = 0;
  let rafId = null;

  const snapshot = () => {
    const dur = stepDuration(script.steps[stepIndex]);
    const raw = dur ? stepElapsed / dur : 0;
    const clampedP = Math.max(0, Math.min(1, raw));
    const reduce = typeof opts.reducedMotion === "function" && opts.reducedMotion();
    const progress = reduce ? (clampedP > 0 ? 1 : 0) : clampedP;
    return { ...frameFor(script, stepIndex, progress), playing, speed, loop, stepElapsed, progress };
  };

  const emit = () => onFrame(snapshot());

  const stopLoop = () => {
    if (rafId !== null) {
      cancelRaf(rafId);
      rafId = null;
    }
  };

  // End of the current step: advance, or wrap to the start when looping
  // instead of stopping dead on the last frame. A natural (unlooped) end
  // also fires onEnd, so the UI can offer autoplay-next; manual pauses,
  // seeks and resets never fire it.
  const onEnd = opts.onEnd || null;
  const advance = (now) => {
    if (stepIndex >= totalSteps - 1) {
      if (loop) {
        stepIndex = 0;
        stepElapsed = 0;
        lastTick = now;
        return true;
      }
      playing = false;
      stepElapsed = script.steps[stepIndex].durationMs || DEFAULT_STEP_MS;
      if (onEnd) {
        try {
          onEnd();
        } catch {}
      }
      return false;
    }
    stepIndex += 1;
    stepElapsed = 0;
    lastTick = now;
    return true;
  };

  const tickLoop = (now) => {
    if (!playing) return;
    if (!lastTick) lastTick = now;
    const dt = Math.min(now - lastTick, 250);
    lastTick = now;
    stepElapsed += dt * speed;
    const dur = script.steps[stepIndex].durationMs || DEFAULT_STEP_MS;
    if (stepElapsed >= dur && !advance(now)) {
      emit();
      stopLoop();
      return;
    }
    emit();
    rafId = raf(tickLoop);
  };

  return {
    script,
    getState() {
      return snapshot();
    },
    play() {
      if (playing) return;
      const dur = script.steps[stepIndex].durationMs || DEFAULT_STEP_MS;
      // A step parked on its finished frame replays from the start of that
      // beat, so loading the first frame does not skip it. The finished
      // last step still restarts the whole script.
      if (stepElapsed >= dur) {
        if (stepIndex >= totalSteps - 1) stepIndex = 0;
        stepElapsed = 0;
      }
      playing = true;
      lastTick = 0;
      emit();
      stopLoop();
      rafId = raf(tickLoop);
    },
    pause() {
      playing = false;
      stopLoop();
      emit();
    },
    toggle() {
      if (playing) this.pause();
      else this.play();
    },
    stepNext() {
      playing = false;
      stopLoop();
      stepIndex = Math.min(stepIndex + 1, totalSteps - 1);
      stepElapsed = 0;
      emit();
    },
    stepPrev() {
      playing = false;
      stopLoop();
      stepIndex = Math.max(stepIndex - 1, 0);
      stepElapsed = 0;
      emit();
    },
    seek(i) {
      playing = false;
      stopLoop();
      stepIndex = Math.max(0, Math.min(i, totalSteps - 1));
      stepElapsed = 0;
      emit();
    },
    // Pause on a step at an elapsed time inside it. The scrubber and the
    // D₄ thumbnails use this so the frame can sit mid-glide or at the end.
    seekAt(i, elapsedMs) {
      playing = false;
      stopLoop();
      stepIndex = Math.max(0, Math.min(i, totalSteps - 1));
      const dur = stepDuration(script.steps[stepIndex]);
      stepElapsed = Math.max(0, Math.min(Number(elapsedMs) || 0, dur));
      emit();
    },
    reset() {
      playing = false;
      stopLoop();
      stepIndex = 0;
      stepElapsed = 0;
      speed = 1;
      emit();
    },
    setSpeed(s) {
      if (!SPEEDS.includes(s)) throw new Error(`Unsupported speed: ${s}`);
      speed = s;
      emit();
    },
    setLoop(b) {
      loop = !!b;
      emit();
    },
    // Advance the clock manually (tests). No rAF involved.
    tick(ms) {
      stepElapsed += ms * speed;
      const dur = script.steps[stepIndex].durationMs || DEFAULT_STEP_MS;
      if (stepElapsed >= dur) advance(0);
      emit();
    },
    dispose() {
      playing = false;
      stopLoop();
    },
  };
}
