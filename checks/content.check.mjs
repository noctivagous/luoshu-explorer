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
