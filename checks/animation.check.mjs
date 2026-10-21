// Animation checks: the script format and player engine must stay valid.
// Run: npm run check. No DOM or wall-clock timing: the player takes an
// injected clock and tick() advances it manually.
import { validateScript, createPlayer, frameFor, animStep, ratioToTime, timelineRatio } from '../js/animation.js';
import { constructionScript, scriptA, scriptFor, variantsFor, demoScripts } from '../js/animation-scripts.js';

const failures = [];
const need = (cond, msg) => {
  if (!cond) failures.push(msg);
};

const noopRaf = () => 0;
const noopCancel = () => {};
const silent = { raf: noopRaf, cancelRaf: noopCancel, onFrame: () => {} };

// Demo scripts are valid and routed correctly.
need(validateScript(constructionScript).length === 0, 'construction script invalid');
need(validateScript(scriptA).length === 0, 'property A script invalid');
need(scriptFor(null) === constructionScript, 'no selection should route to construction');
need(scriptFor(undefined) === constructionScript, 'undefined selection should route to construction');
need(scriptFor('intro') === constructionScript, 'intro should route to construction');
need(scriptFor('A') === scriptA, 'property A should route to script A');
need(
  scriptFor('B', 'hero-lines') != null && scriptFor('B', 'hero-lines') !== scriptFor('B'),
  'property B should offer One line at a time as an alternate animation'
);
need(scriptFor('B', 'bogus') === scriptFor('B'), 'unknown variant should fall back to the default script');
need(variantsFor('C').length === 1, 'single-animation properties should list one variant');

// Every property A-N routes to a valid, well-formed script.
for (const id of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N']) {
  const s = scriptFor(id);
  need(s !== null && s !== undefined, `property ${id} should route to a script`);
  need(validateScript(s).length === 0, `script ${id} invalid`);
  need(s.steps.length >= 2 && s.steps.length <= 9, `script ${id} should have 2-9 steps`);
  need(s.steps.every((st) => typeof st.caption === 'string' && st.caption.length > 0), `script ${id} steps need captions`);
  // Ordinary overlay keys accumulate; focused worked examples may opt out
  // with `transient: true` so the next proof can start on a clean board.
  const persistent = new Set();
  s.steps.forEach((st, k) => {
    for (const item of st.draw || []) if (!item.transient) persistent.add(item.key);
    const f = frameFor(s, k);
    for (const key of persistent)
      need(f.visibleKeys.includes(key), `script ${id} step ${k} should retain persistent key ${key}`);
  });
}

// Non-default variants meet the same bar as defaults.
for (const id of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N']) {
  for (const v of variantsFor(id)) {
    if (v.script === scriptFor(id)) continue;
    need(typeof v.key === 'string' && v.key, `variant of ${id} needs a key`);
    need(typeof v.label === 'string' && v.label, `variant ${id}:${v.key} needs a label`);
    need(validateScript(v.script).length === 0, `variant ${id}:${v.key} invalid`);
    need(v.script.steps.length >= 2 && v.script.steps.length <= 9, `variant ${id}:${v.key} should have 2-9 steps`);
    need(
      v.script.steps.every((st) => typeof st.caption === 'string' && st.caption.length > 0),
      `variant ${id}:${v.key} steps need captions`
    );
    const persistent = new Set();
    v.script.steps.forEach((st, k) => {
      for (const item of st.draw || []) if (!item.transient) persistent.add(item.key);
      const f = frameFor(v.script, k);
      for (const key of persistent)
        need(f.visibleKeys.includes(key), `variant ${id}:${v.key} step ${k} should retain persistent key ${key}`);
    });
  }
}
need(
  JSON.stringify(Object.keys(demoScripts).sort()) ===
    JSON.stringify(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'construction', 'intro']),
  'demoScripts should export all 14 property scripts plus construction'
);

// Construction: ordinal square, corner swap, then fold onto the Lo Shu.
need(constructionScript.steps.length === 3, 'construction should have 3 steps');
const ordinal = frameFor(constructionScript, 0);
const swapped = frameFor(constructionScript, 1);
const folded = frameFor(constructionScript, 2);
const gridOf = (setValues) => Array.from({ length: 9 }, (_, i) => setValues[i]);
need(JSON.stringify(gridOf(ordinal.setValues)) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9]), 'construction starts from the ordinal square');
need(JSON.stringify(gridOf(swapped.setValues)) === JSON.stringify([9, 2, 7, 4, 5, 6, 3, 8, 1]), 'construction swaps the four corners');
need(JSON.stringify(swapped.highlight) === JSON.stringify([0, 2, 6, 8]), 'corner swap highlights the four corners');
need(swapped.moves.length === 4, 'corner swap moves four cells');
need(JSON.stringify(gridOf(folded.setValues)) === JSON.stringify([4, 9, 2, 3, 5, 7, 8, 1, 6]), 'construction folds onto the Lo Shu');
need(folded.moves.length > 0, 'fold step should glide the cells that move');

// Property A: 4 pair beats plus the invariant lockup. The equation assembles
// mid-step and the "10" resolves after it.
need(scriptA.steps.length === 5, 'script A should have 4 pairs plus the lockup');
need(
  JSON.stringify(frameFor(scriptA, 0, 0).visibleKeys) === JSON.stringify(['A.pair-0', 'A.ord-0']),
  'script A step 0 at the start should focus before the equation assembles'
);
need(
  JSON.stringify(frameFor(scriptA, 0).visibleKeys) === JSON.stringify(['A.pair-0', 'A.ord-0', 'A.eq-0', 'A.chip-0']),
  'script A step 0 at the end should resolve the assembled equation to 10'
);
need(
  frameFor(scriptA, 2).visibleKeys.filter((k) => k.startsWith('A.pair-')).length === 3,
  'script A step 2 should reveal 3 pairs'
);
need(
  JSON.stringify(frameFor(scriptA, 0).highlight) === JSON.stringify([0, 8]),
  'script A step 0 should highlight cells 0 and 8'
);
need(scriptFor('N').steps.length === 8, 'property N should walk all eight D₄ forms');
need(
  JSON.stringify(gridOf(frameFor(scriptFor('N'), 0).setValues)) === JSON.stringify([4, 9, 2, 3, 5, 7, 8, 1, 6]),
  'N starts on the displayed square'
);
need(frameFor(scriptFor('N'), 1).moves.length > 0, 'N rotation should move cells');

// Player: manual tick advances, step/reset/speed behave. Durations and the
// last index come from the script so beat-length edits stay green.
{
  const p = createPlayer(scriptA, silent);
  const last = scriptA.steps.length - 1;
  const firstDur = scriptA.steps[0].durationMs;
  const lastDur = scriptA.steps[last].durationMs;
  need(p.getState().stepIndex === 0, 'player should start at step 0');
  need(p.getState().playing === false, 'player should start paused');
  p.tick(firstDur);
  need(p.getState().stepIndex === 1, 'tick(duration) should advance one step');
  p.stepPrev();
  need(p.getState().stepIndex === 0, 'stepPrev should go back');
  p.seek(last);
  need(p.getState().isLast === true, 'seek(last) should reach the last step');
  p.seekAt(1, 700);
  need(p.getState().stepIndex === 1 && p.getState().stepElapsed === 700, 'seekAt should pause inside a step');
  p.seekAt(1, 99999);
  need(p.getState().stepElapsed === scriptA.steps[1].durationMs, 'seekAt should clamp to the step duration');
  const mid = ratioToTime(scriptA, timelineRatio(scriptA, 1, 700));
  need(mid.stepIndex === 1 && Math.round(mid.elapsedMs) === 700, 'timeline ratio should round-trip');
  p.seek(last);
  p.tick(lastDur);
  need(p.getState().playing === false, 'ticking past the last step should stop');
  need(p.getState().loop === false, 'loop should default to off');
  p.setLoop(true);
  need(p.getState().loop === true, 'setLoop(true) should apply');
  p.seek(last);
  p.tick(lastDur);
  need(
    p.getState().stepIndex === 0 && p.getState().stepElapsed === 0,
    'looping past the last step should wrap to the first'
  );
  p.seek(last);
  p.play();
  p.tick(lastDur);
  need(
    p.getState().stepIndex === 0 && p.getState().playing === true,
    'looping while playing should keep playing from the first step'
  );
  p.setLoop(false);
  p.seek(last);
  p.tick(lastDur);
  need(p.getState().playing === false, 'unlooped tick past the last step should stop');
  p.reset();
  const r = p.getState();
  need(r.stepIndex === 0 && r.speed === 1 && r.playing === false, 'reset should restore the initial state');
  p.setSpeed(2);
  need(p.getState().speed === 2, 'setSpeed(2) should apply');
  let threw = false;
  try {
    p.setSpeed(3);
  } catch {
    threw = true;
  }
  need(threw, 'setSpeed(3) should throw');
  p.dispose();
}

// Validation rejects malformed scripts; the player refuses them.
need(validateScript({}).length > 0, 'empty object should be invalid');
need(validateScript({ id: 'x', steps: [] }).length > 0, 'empty steps should be invalid');
need(
  validateScript({ id: 'x', steps: [animStep('only', { matrix: { highlight: [9] } })] }).length > 0,
  'cell index 9 should be invalid'
);
{
  let threw = false;
  try {
    createPlayer({ id: 'bad', steps: [] }, silent);
  } catch {
    threw = true;
  }
  need(threw, 'player should throw on an invalid script');
}

if (failures.length) {
  for (const f of failures) console.error(`FAIL ${f}`);
  process.exit(1);
}
console.log(`PASS animation (${constructionScript.steps.length} build steps, ${scriptA.steps.length} pair steps)`);
