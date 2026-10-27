// Animation checks: the script format and player engine must stay valid.
// Run: npm run check. No DOM or wall-clock timing: the player takes an
// injected clock and tick() advances it manually.
import { validateScript, createPlayer, frameFor, animStep, ratioToTime, timelineRatio, previewFrameFor } from '../js/animation.js';
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

// Every property A-W routes to a valid, well-formed script.
for (const id of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']) {
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
for (const id of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W']) {
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
    JSON.stringify(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'construction', 'intro']),
  'demoScripts should export all 23 property scripts plus construction'
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

// R and S carry a content sheet. Families accumulate; the latest strike,
// reveal, and turn note win.
{
  const scriptR = scriptFor('R');
  need(scriptR.steps.length === 7, 'R should have 7 steps');
  need(frameFor(scriptR, 0).sheet.families.length === 1, 'R opens on one family');
  need(
    frameFor(scriptR, 3).sheet.families.map((f) => f.id).join(',') === 'rows,columns,main,anti',
    'R accumulates four families'
  );
  need(frameFor(scriptR, 4).sheet.strike === 'hundreds', 'R then strikes hundreds');
  need(frameFor(scriptR, 6).sheet.strike === 'units', 'R ends on the units strike');
  const scriptS = scriptFor('S');
  need(scriptS.steps.length === 4, 'S should have 4 steps');
  need(
    frameFor(scriptS, 0).sheet.reveal === 'center' && frameFor(scriptS, 0).sheet.worked === 4,
    'S works the center first'
  );
  need(
    frameFor(scriptS, 1).sheet.reveal === 'all' && frameFor(scriptS, 1).sheet.worked === null,
    'S then fills the companion'
  );
  need(frameFor(scriptS, 2).sheet.sums === true, 'S then shows row sums');
  need(frameFor(scriptS, 3).sheet.compareTurn === true, 'S names the turned pair');
  need(
    JSON.stringify(gridOf(frameFor(scriptS, 3).setValues)) === JSON.stringify([8, 3, 4, 1, 5, 9, 6, 7, 2]),
    'S turns 90° clockwise'
  );
  // Property T: the sheet story closes at T-4, then the nesting layer opens
  // in the board: one palace at T-5, all nine at T-6, the 3-7 address at T-7,
  // and two center-path zooms at T-8/T-9.
  const scriptT = scriptFor('T');
  need(validateScript(scriptT).length === 0, 'script T invalid');
  need(scriptT.steps.length === 9, 'T should close with the two center-path zooms');
  need(frameFor(scriptT, 3).nest == null, 'T overview beat shows plain cells');
  need(
    JSON.stringify(frameFor(scriptT, 4).nest) === JSON.stringify({ mode: 'palace', palace: 4 }),
    'T-5 nests palace 4 in the board'
  );
  need(
    JSON.stringify(frameFor(scriptT, 5).nest) === JSON.stringify({ mode: 'all' }),
    'T-6 nests all nine palaces in the board'
  );
  need(
    JSON.stringify(frameFor(scriptT, 6).nest) ===
      JSON.stringify({ mode: 'palace', palace: 3, mark: 7 }),
    'T-7 marks the 3-7 seat inside palace 3'
  );
  need(
    JSON.stringify(frameFor(scriptT, 6).highlight) === JSON.stringify([3]),
    'T-7 focuses the cell holding outer 3'
  );
  need(
    JSON.stringify(gridOf(frameFor(scriptT, 7).setValues)) ===
      JSON.stringify([40, 45, 38, 39, 41, 43, 44, 37, 42]),
    'T-8 re-bases the board on palace 5'
  );
  need(
    JSON.stringify(frameFor(scriptT, 7).nest) === JSON.stringify({ mode: 'all' }),
    'T-8 nests every re-based cell'
  );
  need(
    JSON.stringify(gridOf(frameFor(scriptT, 8).setValues)) ===
      JSON.stringify([364, 369, 362, 363, 365, 367, 368, 361, 366]),
    'T-9 re-bases the board on the 365 center'
  );
  need(
    JSON.stringify(frameFor(scriptT, 8).sheet) ===
      JSON.stringify({ kind: 'compound', scope: 'all', palace: null, mark: null, inner: 'base' }),
    'T-9 keeps the zoom sheet on the base inner square'
  );
  need(
    validateScript({
      id: 'bad-nest',
      steps: [animStep('s1', { matrix: { highlight: [], setValues: null, nest: { mode: 'bogus' } } })],
    }).length > 0,
    'matrix.nest should reject unknown modes'
  );
  need(
    validateScript({
      id: 'bad-mark',
      steps: [animStep('s1', { matrix: { highlight: [], setValues: null, nest: { mode: 'all', mark: 7 } } })],
    }).length > 0,
    'matrix.nest should reject a mark outside palace mode'
  );
  need(
    validateScript({
      id: 'bad-inner',
      steps: [animStep('s1', { sheet: { kind: 'compound', scope: 'all', inner: 'middle' } })],
    }).length > 0,
    'sheet.inner should reject unknown squares'
  );
  need(frameFor(scriptS, 3).moves.length > 0, 'S turn glides the cells');
  need(
    frameFor(scriptFor('A'), 0).sheet == null && frameFor(scriptFor('J'), 0).sheet == null,
    'A and J carry no sheet'
  );
}

// Overlapping Luoshu (U–W): the sheet tracks the active window on the
// larger board; the main board shows that window's values.
{
  const scriptU = scriptFor('U');
  need(scriptU.steps.length === 6, 'U should have 4 window beats, an overview, and the flying-stars beat');
  need(
    JSON.stringify(frameFor(scriptU, 0).sheet) ===
      JSON.stringify({ kind: 'overlap', board: 'central', wr: 0, wc: 0, all: false }),
    'U opens on the top-left window of the 5×5'
  );
  need(
    JSON.stringify(gridOf(frameFor(scriptU, 1).setValues)) === JSON.stringify([2, 9, 4, 7, 5, 3, 6, 1, 8]),
    'U second window should show the top-right Lo Shu on the main board'
  );
  need(frameFor(scriptU, 4).sheet.all === true, 'U overview should mark every magic window');
  const scriptV = scriptFor('V');
  need(scriptV.steps.length === 5, 'V should slide through the cycle and close on the overview');
  need(frameFor(scriptV, 1).sheet.wc === 1 && frameFor(scriptV, 3).sheet.wc === 3, 'V window should slide one column per beat');
  const scriptW = scriptFor('W');
  need(scriptW.steps.length === 6, 'W should contrast the compound board with the folded board');
  need(frameFor(scriptW, 0).sheet.board === 'compound', 'W opens on the Yang Hui compound board');
  need(frameFor(scriptW, 2).sheet.board === 'folded', 'W then switches to the folded board');
  need(frameFor(scriptW, 5).sheet.all === true, 'W closes on all 16 magic windows');
  need(
    validateScript({
      id: 'bad-overlap',
      steps: [animStep('s1', { sheet: { kind: 'overlap', board: 'bogus' } })],
    }).length > 0,
    'sheet.board should reject unknown overlap boards'
  );
}

// Preview (pre-play): the settled first frame, rendered statically while
// the player stays at step 0 / elapsed 0. No entering items, no glides.
{
  const gridOf2 = (sv) => Array.from({ length: 9 }, (_, i) => sv[i]);
  const intro = previewFrameFor(constructionScript);
  need(intro.isPreview === true && intro.stepIndex === 0, 'preview should sit on step 0');
  need(
    JSON.stringify(gridOf2(intro.setValues)) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8, 9]),
    'Build the square preview should show 1 through 9 in reading order'
  );
  need(intro.caption === constructionScript.steps[0].caption, 'Build the square preview should keep the step-1 caption');
  need(intro.captionStep === true, 'Build the square preview should label Step 1');
  need(intro.enteringKeys.length === 0 && intro.moves === null, 'preview should be static: no entering items or glides');
  for (const [id, sc] of Object.entries(demoScripts)) {
    const pv = previewFrameFor(sc);
    const settled = frameFor(sc, 0, 1);
    need(pv.stepIndex === 0 && pv.isPreview === true, `preview ${id} should sit on step 0`);
    need(
      JSON.stringify(pv.visibleKeys) === JSON.stringify(settled.visibleKeys) &&
        JSON.stringify(pv.highlight) === JSON.stringify(settled.highlight),
      `preview ${id} should match the settled first frame`
    );
    need(pv.enteringKeys.length === 0 && pv.moves === null, `preview ${id} should be static`);
    need(pv.captionStep === (pv.caption.length > 0), `preview ${id} caption step label should follow its caption`);
  }
  // A script may opt out of the step-1 caption when that caption only makes
  // sense once the animation runs; the preview then carries no caption.
  const quiet = previewFrameFor({
    id: 'quiet',
    preview: { caption: null },
    steps: [animStep('q-1', { caption: 'Only explained by motion.' })],
  });
  need(quiet.caption === '' && quiet.captionStep === false, 'preview caption:null should suppress the step-1 caption');
  need(
    validateScript({ id: 'bad-preview', preview: { caption: 3 }, steps: [animStep('s1')] }).length > 0,
    'preview.caption should reject non-string values'
  );
}

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
  p.seekAt(0, firstDur);
  p.play();
  need(
    p.getState().stepIndex === 0 && p.getState().stepElapsed === 0 && p.getState().playing === true,
    'play on a finished step should replay that step'
  );
  p.pause();
  p.setSpeed(0.25);
  need(p.getState().speed === 0.25, 'setSpeed(0.25) should apply');
  p.setSpeed(3);
  need(p.getState().speed === 3, 'setSpeed(3) should apply');
  let threw = false;
  try {
    p.setSpeed(4);
  } catch {
    threw = true;
  }
  need(threw, 'setSpeed(4) should throw');
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
