// Content checks: overlay keys, step liveness, and executable claims.
// Run: npm run check. Fails when animation scripts reference overlay keys
// that js/app.js never renders (a typo fails silently at runtime), when a
// step reveals nothing, or when the property text drifts from the math.
import { readFileSync } from 'node:fs';
import { demoScripts } from '../js/animation-scripts.js';
import { verifyAll, determinant } from '../js/verify.js';
import propertiesData from '../data/properties.json' with { type: 'json' };

const failures = [];
const need = (cond, msg) => {
  if (!cond) failures.push(msg);
};

const root = new URL('..', import.meta.url);
const appSrc = readFileSync(new URL('js/app.js', root), 'utf8');

// Every overlay key a script reveals must be rendered by the bundle.
for (const [id, script] of Object.entries(demoScripts)) {
  if (id === 'construction' || id === 'intro') continue;
  const keys = new Set();
  for (const st of script.steps) for (const k of st.overlay?.show || []) keys.add(k);
  need(keys.size > 0, `script ${id} reveals no overlay keys`);
  for (const k of keys) {
    // Keys built per-index via templates (e.g. `A.pair-${a}`) never appear
    // literally; match their stem plus the interpolation instead.
    const stem = k.replace(/-\d+$/, '-');
    need(
      appSrc.includes(k) || (stem !== k && appSrc.includes(`${stem}\${`)),
      `script ${id} key "${k}" has no matching render in js/app.js`,
    );
  }
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
