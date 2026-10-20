// Animation checks: the script format and player engine must stay valid.
// Run: npm run check. No DOM or wall-clock timing: the player takes an
// injected clock and tick() advances it manually.
import { validateScript, createPlayer, frameFor, animStep } from '../js/animation.js';
import { constructionScript, scriptA, scriptFor, demoScripts } from '../js/animation-scripts.js';

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

// Every property A-N routes to a valid, well-formed script.
for (const id of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N']) {
  const s = scriptFor(id);
  need(s !== null && s !== undefined, `property ${id} should route to a script`);
  need(validateScript(s).length === 0, `script ${id} invalid`);
  need(s.steps.length >= 2 && s.steps.length <= 9, `script ${id} should have 2-9 steps`);
  need(s.steps.every((st) => typeof st.caption === 'string' && st.caption.length > 0), `script ${id} steps need captions`);
  // Overlay keys accumulate monotonically across steps.
  let seen = 0;
  s.steps.forEach((st, k) => {
    const f = frameFor(s, k);
    need(f.visibleKeys.length >= seen, `script ${id} step ${k} keys should accumulate`);
    seen = f.visibleKeys.length;
  });
}
need(
  JSON.stringify(Object.keys(demoScripts).sort()) ===
    JSON.stringify(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'construction', 'intro']),
  'demoScripts should export all 14 property scripts plus construction'
);

// Construction: 9 steps, one cell placed per step, full board at the end.
need(constructionScript.steps.length === 9, 'construction should have 9 steps');
need(
  JSON.stringify(constructionScript.steps.map((s) => s.matrix.highlight)) !== '[]',
  'construction steps should highlight cells'
);
const lastBuild = frameFor(constructionScript, 8);
need(Object.keys(lastBuild.setValues || {}).length === 9, 'construction end frame should place 9 cells');
need(lastBuild.visibleCount === 9, 'construction end frame visibleCount should be 9');

// Property A: 4 pair steps, overlay keys accumulate in order.
need(scriptA.steps.length === 4, 'script A should have 4 steps');
need(
  JSON.stringify(frameFor(scriptA, 0).visibleKeys) === JSON.stringify(['A.pair-0']),
  'script A step 0 should reveal only pair 0'
);
need(frameFor(scriptA, 2).visibleKeys.length === 3, 'script A step 2 should reveal 3 pairs');
need(
  JSON.stringify(frameFor(scriptA, 0).highlight) === JSON.stringify([0, 8]),
  'script A step 0 should highlight cells 0 and 8'
);

// Player: manual tick advances, step/reset/speed behave.
{
  const p = createPlayer(scriptA, silent);
  need(p.getState().stepIndex === 0, 'player should start at step 0');
  need(p.getState().playing === false, 'player should start paused');
  p.tick(1400);
  need(p.getState().stepIndex === 1, 'tick(duration) should advance one step');
  p.stepPrev();
  need(p.getState().stepIndex === 0, 'stepPrev should go back');
  p.seek(3);
  need(p.getState().isLast === true, 'seek(3) should reach the last step');
  p.tick(1400);
  need(p.getState().playing === false, 'ticking past the last step should stop');
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
