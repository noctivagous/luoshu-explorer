// Content checks: overlay keys, step liveness, and executable claims.
// Run: npm run check. Fails when a script key is not rendered by the overlay,
// when a step reveals nothing, or when the property text drifts from the math.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { demoScripts, variantsFor, ledgerFor, cellProperties } from '../js/animation-scripts.js';

// Every script the app can show: defaults plus non-default variants.
const allScripts = [...Object.entries(demoScripts)];
for (const id of Object.keys(demoScripts)) {
  for (const v of variantsFor(id)) {
    if (v.script === demoScripts[id]) continue;
    allScripts.push([`${id}:${v.key}`, v.script]);
  }
}
import { frameFor } from '../js/animation.js';
import { renderOverlay, CENTERS, Z } from '../js/overlay.js';
import { verifyAll, determinant, holmesFamily, squaredPattern, HOLMES_FAMILIES, nestBlocks, palaceCells } from '../js/verify.js';
import propertiesData from '../data/properties.json' with { type: 'json' };

const failures = [];
const need = (cond, msg) => {
  if (!cond) failures.push(msg);
};

function markup(frame) {
  const { svg, html } = renderOverlay(frame.draw, { enteringKeys: [] });
  return renderToStaticMarkup(React.createElement(React.Fragment, null, ...svg, ...html));
}

// Every persistent overlay key is a rendered data-anim-key at idle and at each
// step. Transient keys render only in their own worked-example beat. Keys that
// belong to later steps stay out of earlier frames. Construction and N move the
// cells themselves, so they are allowed to have no overlay keys.
for (const [id, script] of allScripts) {
  if (id === 'intro') continue;
  const keys = new Set();
  const transientKeys = new Set();
  for (const st of script.steps) for (const k of st.overlay?.show || []) keys.add(k);
  for (const st of script.steps)
    for (const item of st.draw || []) if (item.transient) transientKeys.add(item.key);
  if (id !== 'construction' && id !== 'N') need(keys.size > 0, `script ${id} reveals no overlay keys`);
  const idleHtml = markup(frameFor(script, script.steps.length - 1, 1));
  for (const k of keys) {
    if (transientKeys.has(k)) continue;
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
  const b = Object.fromEntries(allScripts)['B:hero-lines'];
  need(!!b, 'B:hero-lines variant should be gated');
  need(b.steps.length === 4, 'script B should show one hero line per step');
  need(
    JSON.stringify(frameFor(b, 2, 1).visibleKeys.filter((k) => k.startsWith('B.diag-'))) ===
      JSON.stringify(['B.diag-0']),
    'B step 3 should draw only the main diagonal'
  );
  const flash = b.steps[3].draw.find((d) => d.key === 'B.tick-3');
  need(flash && flash.at >= 0.7, 'B should flash the = 15 late in the final beat');
  need(b.steps[3].durationMs >= 2200, 'B final beat should hold a pause after the flash');

// Property B, Family tour: families accumulate together, same overview.
{
  const bf = demoScripts.B;
  need(bf.steps.length === 4, 'B:families should have 4 beats');
  need(
    JSON.stringify(frameFor(bf, 0, 0).visibleKeys) === JSON.stringify(['BF.rows']),
    'B:families rows beat should group before the ticks land'
  );
  const idleBF = markup(frameFor(bf, 3, 1));
  need(idleBF.includes('8 lines · always 15'), 'B:families should close with the lockup');
}
  const idleB = markup(frameFor(b, 3, 1));
  const ticks = idleB.match(/= 15/g) || [];
  need(ticks.length === 4, `idle B should carry four gutter ticks (got ${ticks.length})`);
  need(b.steps[0].draw[0].dash === undefined, 'B hero lines should be solid, not dashed');
  need(b.steps[0].draw[1].type === 'gutter', 'B totals should be gutter ticks, not on-line pills');
  need(
    JSON.stringify(frameFor(b, 0, 0).visibleKeys) === JSON.stringify(['B.row-0']),
    'B tick should wait for its beat inside the step'
  );
  need(
    frameFor(b, 3, 1).highlight.length === 9,
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

// Property E: establish 5 as mean, then show three focused proofs that clear
// before the persistent fact stack appears.
{
  const e = demoScripts.E;
  need(e.steps.length === 6, 'script E should have 6 explanatory steps');
  need(e.steps.every((st) => st.durationMs >= 1800), 'E beats should be readable (1800ms+)');
  need(e.steps[0].draw.some((d) => d.key === 'E.center' && d.transient), 'E should establish the center 5 first');
  need(e.steps[1].draw.some((d) => String(d.text).includes('÷ 9 = 5')), 'E should name 5 as the mean');
  need(e.steps[2].draw.some((d) => String(d.text).includes('45 = 9 × 5')), 'E should show the all-cell total');
  need(e.steps[3].draw.some((d) => String(d.text).includes('4 + 6 = 10')), 'E should show pair operands');
  need(e.steps[4].draw.some((d) => String(d.text).includes('3 + 5 + 7 = 15')), 'E should show line operands');
  need(e.steps.slice(0, 5).every((st) => st.draw.every((d) => d.transient)), 'E worked proofs should clear between beats');
  const stackats = e.steps[5].draw.map((d) => d.at);
  need(JSON.stringify(stackats) === JSON.stringify([0.3, 0.5, 0.7]), 'E stack should accumulate one total per beat');
  const idleE = markup(frameFor(e, 5, 1));
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

// Property A: midpoint equations with ordinal tags, closed by the lockup.
{
  const a = demoScripts.A;
  need(a.steps.length === 5, 'script A should close with the invariant lockup');
  need(
    JSON.stringify(frameFor(a, 0, 0).visibleKeys) === JSON.stringify(['A.pair-0', 'A.ord-0']),
    'A step 0 should focus before the equation assembles'
  );
  const eq0 = a.steps[0].draw.find((d) => d.key === 'A.eq-0');
  need(eq0 && eq0.text === '4+6', `A equation should name the operands (got ${eq0 && eq0.text})`);
  const res0 = a.steps[0].draw.find((d) => d.key === 'A.chip-0');
  need(res0 && res0.fontSize >= 14, 'A landed 10 should be large (14+)');
  need(
    a.steps[4].draw.some((d) => d.key === 'A.lock' && String(d.text).includes('2 × 5')),
    'A should close with the opposites = 2 × 5 lockup'
  );
}

// Property L: four mirrored pair-beats ending in four paired brackets.
{
  const l = demoScripts.L;
  need(l.steps.length === 4, 'script L should pair all four magnitudes');
  need(
    l.steps.every(
      (st) => st.draw.filter((d) => d.type === 'bar').length === 2 && st.draw.some((d) => d.type === 'line')
    ),
    'L beats should grow each pair simultaneously with a through-center link'
  );
  const idleL = markup(frameFor(l, 3, 1));
  const links = idleL.match(/L\.link-/g) || [];
  need(links.length === 4, `idle L should hold four paired brackets (got ${links.length})`);
}

// Property M: solid knight hops vs dashed torus wraps, one traveler a step.
{
  const m = demoScripts.M;
  need(m.steps.length === 4, 'script M should stay at 4 steps');
  need(
    m.steps.every((st) => st.draw.some((d) => d.key.startsWith('M.trav-'))),
    'M beats should carry the numbered traveler'
  );
  need(
    m.steps.every((st) => st.draw.every((d) => d.type !== 'arc' || !d.label)),
    'M arcs should not carry tiny labels'
  );
  const hops = m.steps.flatMap((st) => st.draw.filter((d) => d.type === 'arc'));
  need(hops.length === 8, `M should draw 8 hops (got ${hops.length})`);
  need(hops.filter((h) => !h.dash).length === 4, 'M should draw four solid knight hops');
  need(hops.filter((h) => h.dash).length === 4, 'M should draw four dashed wrap hops');
}

// Property N: turn arcs, mirror axes, labeled poses on the board.
{
  const n = demoScripts.N;
  need(n.steps.length === 8, 'script N should walk all eight D₄ forms');
  need(
    n.steps[1].draw.some((d) => d.key === 'N.rot-1' && d.type === 'path' && d.marker),
    'N rotation should show an arrowed turn arc'
  );
  need(
    n.steps[4].draw.some((d) => d.key === 'N.axis-4' && d.type === 'line'),
    'N reflection should show a mirror axis'
  );
  need(
    n.steps.slice(1).every((st, i) => st.draw.some((d) => d.key === `N.pose-${i + 1}`)),
    'N poses should be labeled on the board'
  );
}

// Annotation collisions: svg chips/gutters/marks that share a board center
// must be the same restacked fact or a same-beat temporal replacement (later
// `at` covers earlier) — never two annotations competing in one beat.
{
  const spotOf = (item) => {
    if (item.type === 'gutter') return [item.x, item.y];
    if (item.type === 'mark') return [Z / 2, Z / 2];
    if (item.type !== 'chip') return null;
    const a = CENTERS[item.from];
    const b = CENTERS[item.to];
    const t = item.anchor === 'end' ? 1 : item.anchor === 'start' ? 0 : (item.t ?? 0.5);
    return [a.x + (b.x - a.x) * t + (item.dx || 0), a.y + (b.y - a.y) * t + (item.dy || 0)];
  };
  const labelOf = (item) => String(item.text ?? item.key);
  for (const [id, script] of allScripts) {
    if (id === 'intro') continue;
    const seen = new Map();
    for (const st of script.steps) {
      for (const item of st.draw || []) {
        const p = spotOf(item);
        if (!p) continue;
        const spot = `${Math.round(p[0] / 4)}:${Math.round(p[1] / 4)}`;
        const at = item.at ?? 0;
        if (!seen.has(spot)) seen.set(spot, []);
        seen.get(spot).push({ step: st.id, at, label: labelOf(item) });
      }
    }
    for (const [spot, items] of seen) {
      const labels = new Set(items.map((i) => i.label));
      if (labels.size <= 1) continue;
      let ok = true;
      for (let x = 0; x < items.length && ok; x++) {
        for (let y = x + 1; y < items.length && ok; y++) {
          if (items[x].step === items[y].step && items[x].at === items[y].at) ok = false;
        }
      }
      need(ok, `script ${id} collides at ${spot}: ${items.map((i) => `${i.label}@${i.step}`).join(', ')}`);
    }
  }
}

// Worked-example tape: ledger lines derive from the drawn text and can
// never drift from the board.
need(
  JSON.stringify(ledgerFor(demoScripts.A.steps[0])) === JSON.stringify(['4+6 = 10']),
  `A step 0 should ledger as 4+6 = 10 (got ${JSON.stringify(ledgerFor(demoScripts.A.steps[0]))})`
);
need(
  JSON.stringify(ledgerFor(demoScripts.C.steps[2])) === JSON.stringify(['9+4 = 13 = 3']),
  `C step 2 should ledger the tens-drop chain (got ${JSON.stringify(ledgerFor(demoScripts.C.steps[2]))})`
);
need(
  JSON.stringify(ledgerFor(demoScripts.E.steps[5])) ===
    JSON.stringify(['45 = 9×5 · 10 = 2×5 · 15 = 3×5']),
  `E lockup should stack the three totals (got ${JSON.stringify(ledgerFor(demoScripts.E.steps[5]))})`
);
need(
  JSON.stringify(ledgerFor(demoScripts.J.steps[0])) ===
    JSON.stringify(['492 + 357 + 816 = 1665']),
  `J rows should ledger the full row equation (got ${JSON.stringify(ledgerFor(demoScripts.J.steps[0]))})`
);
need(
  JSON.stringify(ledgerFor(demoScripts.O.steps[0])) === JSON.stringify(['4+9+2 = 15']),
  `O should ledger its first triple (got ${JSON.stringify(ledgerFor(demoScripts.O.steps[0]))})`
);
need(
  JSON.stringify(ledgerFor(demoScripts.P.steps[0])) ===
    JSON.stringify(['4×9×2 + 3×5×7 + 8×1×6 = 225']),
  `P should ledger the row-product equation (got ${JSON.stringify(ledgerFor(demoScripts.P.steps[0]))})`
);
need(
  JSON.stringify(ledgerFor(demoScripts.Q.steps[0])) ===
    JSON.stringify(['4²+9²+2² = 8²+1²+6² = 101']),
  `Q should ledger the outer-row square equation (got ${JSON.stringify(ledgerFor(demoScripts.Q.steps[0]))})`
);
need(
  JSON.stringify(ledgerFor(demoScripts.B.steps[0])) === JSON.stringify(['= 15']),
  `B should ledger its margin tick (got ${JSON.stringify(ledgerFor(demoScripts.B.steps[0]))})`
);
need(
  JSON.stringify(ledgerFor(demoScripts.G.steps[3])) === JSON.stringify(['Σ 0']),
  `G should ledger one zero tick (got ${JSON.stringify(ledgerFor(demoScripts.G.steps[3]))})`
);
need(ledgerFor(demoScripts.L.steps[0]).length === 0, 'L bars carry no ledger text');
need(ledgerFor(demoScripts.N.steps[0]).length === 0, 'N opening pose carries no ledger text');
need(
  ledgerFor(demoScripts.construction.steps[1]).length === 0,
  'construction swap beat carries no ledger text'
);

// Cell probe: the cross-property participation index.
{
  const cp = cellProperties();
  need(cp.length === 9 && cp.every((list) => list.length > 0), 'every cell should participate somewhere');
  need(
    cp.every((list) => list.every((p) => /^[A-T]$/.test(p.id))),
    'probe should list only properties A–T'
  );
  const center = cp[4].map((p) => p.id);
  need(center.includes('N'), 'probe should list N for the fixed center');
  need(center.includes('O') && center.includes('P'), 'probe should list O and P for the center');
  need(center.includes('R') && center.includes('S'), 'probe should list R and S for the center');
  need(center.includes('T'), 'probe should list T for the center');
  need(!center.includes('Q'), 'probe should spare the center from Q');
  for (const id of ['C', 'F', 'L'])
    need(!center.includes(id), `probe should spare the center from ${id}`);
  const corner = cp[0].find((p) => p.id === 'A');
  need(corner && corner.n === 2, `cell 0 should join two A beats (got ${JSON.stringify(corner)})`);
}

// Property K is framed as a computed fact, not a visual proof.
need(
  demoScripts.K.steps[0].caption.toLowerCase().includes('computed'),
  'K should be framed as a computed fact'
);

// No step may be a pure no-op: it must reveal an overlay key, change the
// highlight, override values, or advance the construction count.
for (const [id, script] of allScripts) {
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
need(byId.P.longDesc.includes('200'), 'P text should record the diagonal product sum 200');
need(byId.Q.longDesc.includes('107'), 'Q text should record the unequal center-line square-sums');
need(byId.R.longDesc.includes('1,035,369'), 'R text should record the row total');
need(byId.R.longDesc.includes('1,172,421'), 'R text should record the column total');
need(byId.R.longDesc.includes('1,217,781'), 'R text should record the main-wrap total');
need(byId.R.longDesc.includes('1,164,501'), 'R text should record the anti-wrap total');
need(byId.R.longDesc.includes('471'), 'R text should read the anti-diagonal as 471');
need(byId.R.longDesc.includes('11,969'), 'R text should record the hundreds-dropped row total');
need(byId.S.longDesc.includes('59') && byId.S.longDesc.includes('83'), 'S text should record the 59/83 pair');
need(byId.S.longDesc.includes('91') && byId.S.longDesc.includes('67'), 'S text should record the 91/67 pair');
need(!byId.S.formula.includes('59'), 'S formula should accept either pair');
need(byId.T.formula === '9·(outer − 1) + inner', 'T formula should be the palace product');
need(byId.T.category === 'Geometry & Universality', 'T stays under Geometry & Universality');
need(byId.T.slug === 'nested-palaces', 'T slug should be nested-palaces');
for (const n of ['31', '96', '177', '369', '82', '25', '41', '9855', '365', '265761', '3281'])
  need(byId.T.longDesc.includes(n), `T text should record ${n}`);
for (const [id, sc] of Object.entries(demoScripts)) {
  const hasSheet = sc.steps.some((st) => st.sheet);
  if (id === 'R' || id === 'S' || id === 'T') need(hasSheet, `${id} should carry a sheet`);
  else need(!hasSheet, `${id} should not grow a sheet`);
}
const broken = [...SQUARE];
[broken[0], broken[1]] = [broken[1], broken[0]];
{
  const big = nestBlocks(SQUARE, SQUARE);
  need(big[0] === 31 && big[1] === 36 && big[2] === 29, 'upright northwest palace starts 31 36 29');
  need(JSON.stringify(palaceCells(SQUARE, 7)) === JSON.stringify([58, 63, 56, 57, 59, 61, 62, 55, 60]), 'palace 7 is the square plus 54');
  const turnedGrid = [8, 3, 4, 1, 5, 9, 6, 7, 2];
  need(verifyAll(turnedGrid).T === true, 'T should hold after a quarter turn');
  need(nestBlocks(turnedGrid, turnedGrid)[0] !== 31, 'a quarter turn moves the northwest palace off 31');
  need(verifyAll(broken).T === false, 'a swapped cell should break T');
}
{
  const expected = { rows: 1035369, columns: 1172421, main: 1217781, anti: 1164501 };
  for (const fam of HOLMES_FAMILIES) {
    const full = holmesFamily(SQUARE, fam.lines, null);
    need(full.match && full.total === expected[fam.id], `${fam.id} squares should total ${expected[fam.id]}`);
  }
  const rows = HOLMES_FAMILIES[0];
  need(holmesFamily(SQUARE, rows.lines, 0).total === 11969, 'dropping hundreds from the rows leaves 11969');
  need(holmesFamily(SQUARE, rows.lines, 1).total === 10529, 'dropping tens from the rows leaves 10529');
  need(holmesFamily(SQUARE, rows.lines, 2).total === 10187, 'dropping units from the rows leaves 10187');
  const upright = squaredPattern(SQUARE);
  need(
    upright.ok && upright.diag === 59 && upright.off === 83 && upright.rowSums.every((s) => s === 225),
    'upright M² should be 59 on the diagonal and 83 elsewhere'
  );
  const turned = squaredPattern([8, 3, 4, 1, 5, 9, 6, 7, 2]);
  need(
    turned.ok && turned.diag === 91 && turned.off === 67,
    'a quarter turn of M² should swap to 91 and 67'
  );
  need(verifyAll([8, 3, 4, 1, 5, 9, 6, 7, 2]).S === true, 'S should hold after a quarter turn');
  need(verifyAll(broken).R === false && verifyAll(broken).S === false, 'a swapped cell should break R and S');
  for (const id of ['R', 'S', 'T']) {
    need(demoScripts[id].steps.every((st) => ledgerFor(st).length === 0), `${id} keeps its figures off the tape`);
    need(
      demoScripts[id].steps.every((st) => typeof st.tape === 'string' && st.tape.length < 24),
      `${id} tape titles stay short`
    );
    for (const st of demoScripts[id].steps)
      for (const item of st.draw || [])
        need(item.text == null, `${id} ${st.id} should not draw tape text`);
  }
}

// A broken grid must fail at least one claim (predicates are not vacuous).
need(Object.values(verifyAll(broken)).some((v) => v === false), 'verifyAll should reject a swapped grid');

if (failures.length) {
  for (const f of failures) console.error(`FAIL ${f}`);
  process.exit(1);
}
console.log(`PASS content (${Object.keys(results).length} claims, det=${determinant(SQUARE)})`);
