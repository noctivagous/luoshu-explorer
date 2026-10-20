// SPA shell regression check: viewport never scrolls; regions scroll internally.
// Run: npm run check. Fails if the CSS shell rules or the bundle hooks they
// depend on go missing, or if shell selectors leak into the bundle.
import { readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const css = readFileSync(new URL('css/styles.css', root), 'utf8');
const js = readFileSync(new URL('js/app.js', root), 'utf8');

const failures = [];
const need = (cond, msg) => { if (!cond) failures.push(msg); };

// Viewport lock + region rules live in the stylesheet, not the bundle.
for (const rule of [
  'html,body{height:100%;overflow:hidden}',
  '#root>div{display:flex;flex-direction:column;min-height:0;height:100vh;height:100dvh;padding-top:16px}',
  '#root>div>div:has(>aside){flex:1;min-height:0;overflow-y:auto}',
  '#root aside{min-height:0;overflow-y:auto}',
  '#root main{min-height:0;overflow-y:auto}',
  '#root aside>div[class*=overflow-auto]{overflow-y:auto}',
  '#root aside{background:rgba(184,154,90,.09);border-right:1px solid rgba(26,26,26,.12)}',
  '#root aside div[class*=space-y-]>button[class*=bg-transparent]:nth-child(even){background:rgba(26,26,26,.05)}',
  '#root aside{margin-bottom:12px;border-bottom-left-radius:14px}',
  '#root aside,#root aside div[class*=overflow-auto]{scrollbar-width:thin;scrollbar-color:rgba(26,26,26,.35) transparent}',
  '#root aside::-webkit-scrollbar-thumb,#root aside div[class*=overflow-auto]::-webkit-scrollbar-thumb{background:rgba(26,26,26,.3);border-radius:8px;border:4px solid transparent;background-clip:content-box}',
]) need(css.includes(rule), `missing shell rule: ${rule}`);

// Structural hooks the shell CSS depends on must exist in the bundle.
for (const hook of ['"aside"', '"main"', 'overflow-auto', 'getElementById("root")']) {
  need(js.includes(hook), `bundle hook missing: ${hook}`);
}

// The bundle itself must not carry shell overrides (single source: CSS).
for (const leak of ['100dvh', '#root>div']) {
  need(!js.includes(leak), `shell selector leaked into bundle: ${leak}`);
}

if (failures.length) {
  for (const f of failures) console.error(`FAIL ${f}`);
  process.exit(1);
}
console.log(`PASS spa-shell (${css.length} css bytes, ${js.length} js bytes)`);
