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
// - `matrix.visibleCount` (optional) reveals only the first N construction cells.

export const SPEEDS = [0.5, 1, 2];
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
      }
    }
  });
  return errors;
}

// Compute the rendered frame for a step index: visible overlay keys accumulate
// across steps 0..index; matrix highlight/values come from the latest step at
// or before index that defines them.
export function frameFor(script, stepIndex) {
  const steps = script.steps;
  const clamped = Math.max(0, Math.min(stepIndex, steps.length - 1));
  const visibleKeys = [];
  const seenKeys = new Set();
  let highlight = [];
  let setValues = null;
  let visibleCount = null;
  for (let i = 0; i <= clamped; i++) {
    const st = steps[i];
    for (const k of (st.overlay && st.overlay.show) || [])
      if (!seenKeys.has(k)) {
        seenKeys.add(k);
        visibleKeys.push(k);
      }
    if (st.matrix) {
      if (st.matrix.highlight !== undefined) highlight = st.matrix.highlight;
      if (st.matrix.setValues !== undefined) setValues = st.matrix.setValues;
      if (st.matrix.visibleCount !== undefined) visibleCount = st.matrix.visibleCount;
    }
  }
  return {
    stepIndex: clamped,
    step: steps[clamped],
    caption: steps[clamped].caption || "",
    visibleKeys,
    highlight,
    setValues,
    visibleCount,
    isFirst: clamped === 0,
    isLast: clamped === steps.length - 1,
  };
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
  let stepElapsed = 0;
  let lastTick = 0;
  let rafId = null;

  const emit = () => onFrame({ ...frameFor(script, stepIndex), playing, speed, stepElapsed });

  const stopLoop = () => {
    if (rafId !== null) {
      cancelRaf(rafId);
      rafId = null;
    }
  };

  const loop = (now) => {
    if (!playing) return;
    if (!lastTick) lastTick = now;
    const dt = Math.min(now - lastTick, 250);
    lastTick = now;
    stepElapsed += dt * speed;
    const dur = script.steps[stepIndex].durationMs || DEFAULT_STEP_MS;
    if (stepElapsed >= dur) {
      if (stepIndex >= totalSteps - 1) {
        playing = false;
        stepElapsed = dur;
        emit();
        stopLoop();
        return;
      }
      stepIndex += 1;
      stepElapsed = 0;
      lastTick = now;
    }
    emit();
    rafId = raf(loop);
  };

  return {
    script,
    getState() {
      return { ...frameFor(script, stepIndex), playing, speed, stepElapsed };
    },
    play() {
      if (playing) return;
      // Restart from the top when pressing play on the finished last frame.
      if (stepIndex >= totalSteps - 1 && stepElapsed >= (script.steps[stepIndex].durationMs || DEFAULT_STEP_MS)) {
        stepIndex = 0;
        stepElapsed = 0;
      }
      playing = true;
      lastTick = 0;
      emit();
      stopLoop();
      rafId = raf(loop);
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
    // Advance the clock manually (tests). No rAF involved.
    tick(ms) {
      stepElapsed += ms * speed;
      const dur = script.steps[stepIndex].durationMs || DEFAULT_STEP_MS;
      if (stepElapsed >= dur) {
        if (stepIndex >= totalSteps - 1) {
          playing = false;
          stepElapsed = dur;
        } else {
          stepIndex += 1;
          stepElapsed = 0;
        }
      }
      emit();
    },
    dispose() {
      playing = false;
      stopLoop();
    },
  };
}
