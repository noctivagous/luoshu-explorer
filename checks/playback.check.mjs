// Playback integration check: deep links, keyboard shortcuts, loop toggle.
// Run: npm run check. Mounts the app in jsdom with a step address, drives it
// with key events, and asserts the caption bar follows.
import { JSDOM } from 'jsdom';

const failures = [];
const need = (cond, msg) => {
  if (!cond) failures.push(msg);
};

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/#/luoshu/C?step=2',
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;

const { parseDeepLink } = await import('../js/app.js');

// Link parser: ids, steps, speeds, and fallbacks.
const at = (hash) => {
  dom.window.location.hash = hash;
  return parseDeepLink();
};
need(JSON.stringify(at('#/luoshu/C?step=2')) === JSON.stringify({ id: 'C', step: 2, speed: 1, anim: 'standard' }), 'deep link C step 2 should parse');
need(at('#/luoshu/k').id === 'K', 'deep link id should be case-insensitive');
need(at('#/luoshu/construction').id === 'intro', 'construction should alias to intro');
need(JSON.stringify(at('#/luoshu/J?step=1&speed=2')) === JSON.stringify({ id: 'J', step: 1, speed: 2, anim: 'standard' }), 'deep link speed should parse');
need(JSON.stringify(at('#/luoshu/B?anim=families&step=2')) === JSON.stringify({ id: 'B', step: 2, speed: 1, anim: 'families' }), 'deep link anim should parse');
need(at('#/luoshu/B?anim=bogus').anim === 'families', 'bad anim should fall back to Family tour');
need(at('#/luoshu/J?speed=5').speed === 1, 'bad speed should fall back to 1');
need(at('#/luoshu/Z') === null, 'unknown id should not parse');
need(at('#nope') === null, 'non-luoshu hash should not parse');
need(at('') === null, 'empty hash should not parse');

// Restore the deep link the app mounts from.
dom.window.location.hash = '#/luoshu/C?step=2';

// Let the React 18 concurrent root flush (early exit once mounted).
const deadline = Date.now() + 8000;
while (document.querySelectorAll('#root button').length < 33 && Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 50));
}
need(document.querySelectorAll('#root button').length === 37, 'expected 37 buttons with the loop toggle and 4 tape rows');

const stepText = () => document.querySelector('.anim-caption-step')?.textContent || '';
const captionText = () => document.querySelector('.anim-caption-text')?.textContent || '';
const playLabel = () => document.querySelector('.anim-caption-play')?.textContent || '';
const until = async (fn, want) => {
  const stop = Date.now() + 4000;
  for (;;) {
    const got = fn();
    if (got === want) return got;
    if (Date.now() > stop) return got;
    await new Promise((r) => setTimeout(r, 50));
  }
};

const needSeen = async (fn, want, msg) => {
  const got = await until(fn, want);
  need(got === want, `${msg} (got ${JSON.stringify(got)})`);
};

await needSeen(stepText, 'Step 2 of 4', 'deep link should land on step 2');
need(captionText() === '7 + 2 = 9 — running total rides the border.', `deep link caption wrong: ${captionText()}`);
need(dom.window.location.hash === '#/luoshu/C?step=2', `hash should track the step: ${dom.window.location.hash}`);

const tapeRows = () => [...document.querySelectorAll('[aria-label="Worked-example tape"] button')];
need(tapeRows().length === 4, `tape should ledger all 4 C steps (got ${tapeRows().length})`);
const litRow = tapeRows().find((b) => b.getAttribute('aria-pressed') === 'true');
need(
  !!litRow && litRow.textContent.includes('7+2'),
  `tape should sync with the deep-linked step (got ${litRow && litRow.textContent})`
);

const key = (k) => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: k, bubbles: true }));

key('ArrowRight');
await needSeen(stepText, 'Step 3 of 4', 'ArrowRight should advance one step');
need(dom.window.location.hash === '#/luoshu/C?step=3', 'hash should follow stepping');
key('ArrowRight');
await needSeen(stepText, 'Step 4 of 4', 'ArrowRight should reach the last step');
key('r');
await needSeen(stepText, 'Step 1 of 4', 'R should reset to the first step');

// First ArrowRight from idle only reveals the current step; the next advances.
key('ArrowRight');
await needSeen(stepText, 'Step 1 of 4', 'ArrowRight from idle should reveal step 1');
key('ArrowRight');
await needSeen(stepText, 'Step 2 of 4', 'second ArrowRight should advance');

key(' ');
await needSeen(playLabel, '❚❚', 'Space should start playback');
key(' ');
await needSeen(playLabel, '▶', 'Space should pause playback');

const loopBtn = document.querySelector('button[aria-label="Loop animation"]');
need(loopBtn !== null, 'loop toggle should exist');
need(loopBtn.getAttribute('aria-pressed') === 'false', 'loop should start off');
loopBtn.click();
await needSeen(() => loopBtn.getAttribute('aria-pressed'), 'true', 'loop toggle should arm');

// Ghost/focus: cells outside the step's focus set recede during playback.
// Paused on C step 2 (highlight [5, 2, 1]), so cell 0 dims and cell 5 does not.
const boardCells = () => [...document.querySelectorAll('#root [data-anim-stage] div.grid > div')];
need(boardCells().length === 9, 'board should render nine cells');
need(boardCells()[0].style.opacity === '0.45', `off-focus cells should recede (got ${boardCells()[0].style.opacity})`);
need(boardCells()[5].style.opacity === '', 'focus cells should not recede');

// Overview: the full diagram on demand while the playback step stays put.
const overviewBtn = document.querySelector('button[aria-label="Overview diagram"]');
need(overviewBtn !== null, 'overview toggle should exist');
overviewBtn.click();
await needSeen(() => overviewBtn.getAttribute('aria-pressed'), 'true', 'overview toggle should arm');
need(document.querySelector('[data-anim-key="C.res-3"]') !== null, 'overview should reveal the full diagram');
await needSeen(stepText, 'Step 2 of 4', 'overview should keep the playback step');
overviewBtn.click();
await needSeen(() => overviewBtn.getAttribute('aria-pressed'), 'false', 'overview toggle should disarm');
need(document.querySelector('[data-anim-key="C.res-3"]') === null, 'leaving overview should gate future keys again');

// Variant UI is hidden, but B still selects Family tour as its default.
const bTile = [...document.querySelectorAll('#root aside button')].find((btn) =>
  (btn.textContent || '').includes('Lines sum to 15')
);
need(!!bTile, 'B sidebar tile should exist');
bTile.click();
await needSeen(stepText, 'Step 1 of 4', 'selecting B should show its first step');
need(document.querySelector('select[aria-label="Animation"]') === null, 'animation select should stay hidden');
need(document.querySelector('[data-anim-key="BF.rows"]') !== null, 'Family tour should be B’s default animation');
need(
  !(dom.window.location.hash || '').includes('anim='),
  `default Family tour should omit its redundant variant parameter: ${dom.window.location.hash}`
);

if (failures.length) {
  for (const f of failures) console.error(`FAIL ${f}`);
  process.exit(1);
}
console.log('PASS playback (deep link, keyboard, loop, overview)');
