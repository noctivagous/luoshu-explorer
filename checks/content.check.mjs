// Content checks: overlay keys, step liveness, and executable claims.
// Run: npm run check. Fails when a script key is not rendered by the overlay,
// when a step reveals nothing, or when the property text drifts from the math.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { demoScripts } from '../js/animation-scripts.js';
import { frameFor } from '../js/animation.js';
import { renderOverlay } from '../js/overlay.js';
import { verifyAll, determinant } from '../js/verify.js';
import propertiesData from '../data/properties.json' with { type: 'json' };

const failures = [];
const need = (cond, msg) => {
  if (!cond) failures.push(msg);
};

function markup(frame) {
  const { svg, html } = renderOverlay(frame.draw, { enteringKeys: [] });
  return renderToStaticMarkup(React.createElement(React.Fragment, null, ...svg, ...html));
}

// Every overlay key is a rendered data-anim-key at idle and at each step.
// Keys that belong to later steps stay out of the earlier frames. Construction
// and N move the cells themselves, so they are allowed to have no overlay keys.
for (const [id, script] of Object.entries(demoScripts)) {
  if (id === 'intro') continue;
  const keys = new Set();
  for (const st of script.steps) for (const k of st.overlay?.show || []) keys.add(k);
  if (id !== 'construction' && id !== 'N') need(keys.size > 0, `script ${id} reveals no overlay keys`);
  const idleHtml = markup(frameFor(script, script.steps.length - 1, 1));
  for (const k of keys) {
    need(idleHtml.includes(`data-anim-key="${k}"`), `idle ${id} missing rendered key "${k}"`);
  }
  for (const item of script.chrome || []) {
    need(idleHtml.includes(`data-anim-key="${item.key}"`), `idle ${id} missing chrome "${item.key}"`);
  }
  script.steps.forEach((st, i) => {
    const early = frameFor(script, i, 0);
    const earlyHtml = markup(early);
    const full = frameFor(script, i, 1);
    const fullHtml = markup(full);
    for (const k of full.visibleKeys) {
      need(fullHtml.includes(`data-anim-key="${k}"`), `script ${id} step ${i} missing "${k}"`);
    }
    for (const item of st.draw || []) {
      if ((item.at ?? 0) <= 0) continue;
      const seenBefore = script.steps.slice(0, i).some((prev) =>
        (prev.draw || []).some((d) => d.key === item.key),
      );
      if (!seenBefore) {
        need(!earlyHtml.includes(`data-anim-key="${item.key}"`), `script ${id} step ${i} shows "${item.key}" before its beat`);
      }
    }
    const future = new Set();
    for (let j = i + 1; j < script.steps.length; j++) {
      for (const k of script.steps[j].overlay?.show || []) {
        if (!full.visibleKeys.includes(k)) future.add(k);
      }
    }
    for (const k of future) {
      need(!fullHtml.includes(`data-anim-key="${k}"`), `script ${id} step ${i} leaked future key "${k}"`);
    }
  });
}

// Property B: one hero line per step, margin ticks, restrained end state.
{
  const b = demoScripts.B;
  need(b.steps.length === 3, 'script B should stay at 3 steps');
  const idleB = markup(frameFor(b, 2, 1));
  const ticks = idleB.match(/= 15/g) || [];
  need(ticks.length === 3, `idle B should carry three gutter ticks (got ${ticks.length})`);
  need(b.steps[0].draw[0].dash === undefined, 'B hero lines should be solid, not dashed');
  need(b.steps[0].draw[1].type === 'gutter', 'B totals should be gutter ticks, not on-line pills');
  need(
    JSON.stringify(frameFor(b, 0, 0).visibleKeys) === JSON.stringify(['B.row-0']),
    'B tick should wait for its beat inside the step'
  );
  need(
    frameFor(b, 2, 1).highlight.length === 9,
    'B overview should highlight the whole square'
  );
}

// Property C: traveling token — hero draws first, equation assembles, then
// the result lands; overflow steps split the tens (muted sum, bold result).
{
  const c = demoScripts.C;
  need(c.steps.length === 4, 'script C should stay at 4 steps');
  need(
    JSON.stringify(frameFor(c, 0, 0).visibleKeys) === JSON.stringify(['C.path', 'C.hero-0']),
    'C step 0 at the start should reveal only the context path and hero hops'
  );
  const overflow = c.steps[2].draw;
  need(overflow.some((d) => d.key === 'C.sum-2'), 'C overflow step should stage a muted sum');
  const res2 = overflow.find((d) => d.key === 'C.res-2');
  need(res2 && res2.fontSize >= 14, 'C landed result should be large (14+)');
  need(c.steps.every((st) => st.durationMs >= 1800), 'C beats should be readable (1800ms+)');
}

// Property D: same grammar — arm, equation, tens-drop, one compass cue.
{
  const d = demoScripts.D;
  need(d.steps.length === 4, 'script D should stay at 4 steps');
  need(
    JSON.stringify(frameFor(d, 0, 0).visibleKeys) === JSON.stringify(['D.arm-0']),
    'D step 0 at the start should reveal only the arm'
  );
  need(d.steps[0].draw.some((x) => x.key === 'D.ccw'), 'D should name the counterclockwise sense once');
  const dsum = d.steps[0].draw.find((x) => x.key === 'D.sum-0');
  need(dsum && dsum.at === 0.55, 'D muted sum should wait for its beat inside the step');
}

// Property H: reversed grammar — arm, equation, residual 5 at center, mod gate.
{
  const h = demoScripts.H;
  need(h.steps.length === 4, 'script H should stay at 4 steps');
  h.steps.forEach((st, k) => {
    need(st.matrix.highlight.includes(4), `H ${st.id} should keep the center in focus`);
    need(st.draw.some((x) => x.key === `H.res-${k}`), `H ${st.id} should land a residual 5`);
  });
  need(h.steps[2].draw.some((x) => x.key === 'H.gate-2'), 'H mod-10 step should show the gate');
  need(h.steps[3].draw.some((x) => x.key === 'H.gate-3'), 'H mod-10 step should show the gate');
}

// Property F: group-then-balance — X/plus, two Σ 20 margin totals, 20 = 20.
{
  const f = demoScripts.F;
  need(f.steps.length === 3, 'script F should stay at 3 steps');
  need(
    JSON.stringify(frameFor(f, 0, 0).visibleKeys) === JSON.stringify(['F.x-c', 'F.ptag-c']),
    'F step 0 at the start should group before collecting the total'
  );
  const idleF = markup(frameFor(f, 2, 1));
  const totals = idleF.match(/Σ 20/g) || [];
  need(totals.length === 2, `idle F should carry two Σ 20 totals (got ${totals.length})`);
  need(idleF.includes('20 = 20'), 'idle F should beam the two totals together');
}

// Property I: one fixed equation panel on all axes, 5 pulse on landing.
{
  const iv = demoScripts.I;
  need(iv.steps.length === 4, 'script I should stay at 4 steps');
  const panels = iv.steps.map((st) => st.draw.find((x) => x.type === 'badge'));
  need(panels.every((p) => p && p.style && p.style.top === -18), 'I equations should share one fixed panel');
  need(
    iv.steps.every((st) => st.draw.some((x) => x.type === 'mark' && x.text === '5' && (x.at ?? 0) === 0.6)),
    'I should land a 5 pulse on every axis'
  );
}

// Property E: three groupings, then a fact stack on the right margin.
{
  const e = demoScripts.E;
  need(e.steps.length === 4, 'script E should have 4 steps');
  need(e.steps.every((st) => st.durationMs >= 1800), 'E beats should be readable (1800ms+)');
  const stackats = e.steps[3].draw.map((d) => d.at);
  need(JSON.stringify(stackats) === JSON.stringify([0.3, 0.5, 0.7]), 'E stack should accumulate one total per beat');
  const idleE = markup(frameFor(e, 3, 1));
  need(idleE.includes('45 = 9×5') && idleE.includes('10 = 2×5') && idleE.includes('15 = 3×5'), 'idle E should hold the three-totals stack');
}

// Property G: middle-row cancellation, then quiet Σ 0 margin marks.
{
  const g = demoScripts.G;
  need(g.steps.length === 4, 'script G should have 4 steps');
  need(g.steps[2].draw.some((d) => d.key === 'G.cancel'), 'G should draw the canceling row');
  need(
    JSON.stringify(frameFor(g, 2, 0).visibleKeys) === JSON.stringify(['G.pos', 'G.neg', 'G.cancel', 'G.mid0']),
    'G cancel step should group before the equation lands'
  );
  const idleG = markup(frameFor(g, 3, 1));
  need(idleG.includes('= 0'), 'idle G should carry the row cancellation mark');
  const zeros = idleG.match(/Σ 0/g) || [];
  need(zeros.length === 2, `idle G should carry two Σ 0 ticks (got ${zeros.length})`);
}

// Property J: number ribbons fuse rows and columns, payoff lands the reduction.
{
  const j = demoScripts.J;
  need(j.steps.length === 3, 'script J should stay at 3 steps');
  const ribbons = j.steps[0].draw.filter((d) => d.type === 'gutter');
  need(ribbons.length === 3, `J rows step should fuse three ribbons (got ${ribbons.length})`);
  need(
    JSON.stringify(ribbons.map((d) => d.at)) === JSON.stringify([0.3, 0.5, 0.7]),
    'J ribbons should fuse one per beat'
  );
  const idleJ = markup(frameFor(j, 2, 1));
  need(idleJ.includes('492') && idleJ.includes('438'), 'idle J should hold row and column ribbons');
  need(idleJ.includes('1665 = 15 × 111'), 'idle J should land the large reduction');
}

// Property K is framed as a computed fact, not a visual proof.
need(
  demoScripts.K.steps[0].caption.toLowerCase().includes('computed'),
  'K should be framed as a computed fact'
);

// No step may be a pure no-op: it must reveal an overlay key, change the
// highlight, override values, or advance the construction count.
for (const [id, script] of Object.entries(demoScripts)) {
  script.steps.forEach((st, k) => {
    const live =
      (st.overlay?.show?.length || 0) > 0 ||
      (st.matrix?.highlight?.length || 0) > 0 ||
      (st.matrix?.setValues && Object.keys(st.matrix.setValues).length > 0) ||
      st.matrix?.visibleCount !== undefined;
    need(live, `script ${id} step ${k} (${st.id}) is a no-op`);
  });
}

// Executable claims: every property holds for the Lo Shu square.
const SQUARE = [4, 9, 2, 3, 5, 7, 8, 1, 6];
const results = verifyAll(SQUARE);
for (const [id, holds] of Object.entries(results)) {
  need(holds === true, `verify(${id}) fails on the Lo Shu square`);
}

// Text and math must agree on the two previously-wrong claims.
const byId = Object.fromEntries(propertiesData.map((p) => [p.id, p]));
need(determinant(SQUARE) === 360, 'determinant of the displayed square should be 360');
need(byId.K.formula.includes('360') && !byId.K.formula.includes('-360'), 'K text should state +360');
need(byId.M.shortDesc.includes('1→2→3'), 'M text should carry the narrowed knight claim');

// A broken grid must fail at least one claim (predicates are not vacuous).
const broken = [...SQUARE];
[broken[0], broken[1]] = [broken[1], broken[0]];
need(Object.values(verifyAll(broken)).some((v) => v === false), 'verifyAll should reject a swapped grid');

if (failures.length) {
  for (const f of failures) console.error(`FAIL ${f}`);
  process.exit(1);
}
console.log(`PASS content (${Object.keys(results).length} claims, det=${determinant(SQUARE)})`);
