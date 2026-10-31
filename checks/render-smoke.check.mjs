// Render smoke check: js/app.js must mount the full explorer in jsdom.
// Run: npm run check. Fails if the header caption returns, the square loses
// cells, sidebar items disappear, or the layout classes go missing.
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost/',
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;

await import('../js/app.js');

// Let the React 18 concurrent root flush (early exit once mounted).
const deadline = Date.now() + 8000;
while (document.querySelectorAll('#root button').length < 19 && Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 50));
}

const failures = [];
const need = (cond, msg) => {
  if (!cond) failures.push(msg);
};

const root = document.getElementById('root');
const text = root.textContent;
const until = async (fn, want, ms) => {
  const stop = Date.now() + (ms || 4000);
  for (;;) {
    const got = fn();
    if (got === want) return got;
    if (Date.now() > stop) return got;
    await new Promise((r) => setTimeout(r, 50));
  }
};
need(!text.includes('Matrix L'), 'caption header is back');
need(text.includes('LUO SHU'), 'missing LUO SHU heading');

// Nine square cells. Build the square opens on its first frame: 1 through 9
// in reading order, not the finished Lo Shu. The player effect lands that
// frame after mount, so wait for it.
const cellText = () =>
  [...root.querySelectorAll('div.relative.bg-white span.text-\\[42px\\]')]
    .map((el) => el.textContent.trim())
    .join(',');
await until(cellText, '1,2,3,4,5,6,7,8,9', 4000);
need(
  cellText() === '1,2,3,4,5,6,7,8,9',
  `square cells wrong: ${JSON.stringify(cellText().split(','))}`
);
// Pre-play preview: the board shows frame 0, but the player has not
// advanced — slider at 0, paused, step-1 caption on show.
need(root.querySelector('input[data-anim-scrub]')?.value === '0', 'preview should leave the timeline slider at 0');
need(root.querySelector('.anim-caption-step')?.textContent === 'Step 1 of 3', 'preview should label Step 1 of 3');
need(
  (root.querySelector('.anim-caption-text')?.textContent || '').includes('1 through 9 in reading order'),
  'preview should show the step-1 caption for Build the square'
);
need(root.querySelector('.anim-caption-play')?.textContent === '▶', 'preview should start paused');

// Sidebar: 6 category headers + 15 items (intro + A–N), two-column grid,
// square icon tiles with 26px glyphs. 6 + 15 + 5 caption playback
// (play/prev/next/loop/overview) = 26, plus 6
// correspondences-legend chips = 32, plus 3 construction step cards = 35,
// plus 3 worked-example tape rows (intro shows construction) = 38,
// plus 3 step ticks + 3 transport toggles = 44, plus 1 playground toggle = 45.
need(document.querySelectorAll('#root button').length === 54, 'expected 54 buttons');
const overviewBtn = document.querySelector('button[aria-label="Overview diagram"]');
need(overviewBtn !== null, 'overview toggle should exist');
need(overviewBtn.getAttribute('aria-pressed') === 'false', 'overview should start off');
need(document.querySelector('select[aria-label="Animation"]') === null, 'animation select should stay hidden');
need(text.includes('Correspondences'), 'missing correspondences legend');
const legendGroup = document.querySelector('[aria-label="Correspondences legend"]');
need(legendGroup !== null, 'correspondences legend group missing');
const pressed = [...legendGroup.querySelectorAll('button')].filter(
  (b) => b.getAttribute('aria-pressed') === 'true',
);
need(pressed.length === 1 && pressed[0].textContent === 'Off', 'legend should start on Off');
const constructionCards = [...root.querySelectorAll('button')].filter((b) =>
  (b.getAttribute('aria-label') || '').startsWith('Construction step'),
);
need(constructionCards.length === 3, 'expected 3 construction step cards');
const tape = root.querySelector('[aria-label="Worked-example tape"]');
need(tape !== null, 'worked-example tape should render');
const tapeRows = [...tape.querySelectorAll('button')];
need(tapeRows.length === 3, `tape should ledger all 3 construction steps (got ${tapeRows.length})`);
need(tapeRows[0].textContent.includes('Write'), 'tape should fall back to step captions without drawn text');
need(
  tapeRows.filter((b) => b.getAttribute('aria-pressed') === 'true').length === 1,
  'exactly one tape row should sync with the current step'
);
need(
  root.querySelectorAll('.formula-tok').length > 0,
  'formula should render tokenized'
);
need(
  root.querySelectorAll('.formula-tok-lit').length === 0,
  'idle formula should light no tokens before playback'
);
need(
  root.querySelectorAll('.board-cell').length === 9,
  'board cells should be probe-focusable'
);
const speedSel = root.querySelector('select[aria-label="Playback speed"]');
need(speedSel !== null, 'speed control should exist');
need(speedSel.querySelectorAll('option').length === 6, 'speed should offer 0.25×–3×');
need(
  [...speedSel.querySelectorAll('option')].map((o) => o.value).join(',') === '0.25,0.5,1,1.5,2,3',
  'speed options should span 0.25×–3×'
);
need(root.querySelector('input[data-anim-scrub]') !== null, 'timeline scrubber should exist');
const ticks = [...root.querySelectorAll('[aria-label="Animation steps"] button')];
need(ticks.length === 3, `ticks should cover all 3 construction steps (got ${ticks.length})`);
for (const label of ['Autoplay on select', 'Autoplay next property', 'Predict mode'])
  need(root.querySelector(`button[aria-label="${label}"]`) === null, `${label} toggle should be gone`);
need(root.querySelectorAll('.lg\\:grid-cols-2').length === 8, 'sidebar catalog grid missing');
need(root.querySelectorAll('span.rounded-\\[8px\\]').length === 25, 'square icon tiles missing');
need(root.querySelectorAll('svg[width="26"]').length === 25, 'icon glyphs missing');
const catalogTiles = [...root.querySelectorAll('button.catalog-tile')];
need(catalogTiles.length === 25, 'catalog tiles missing');
need(
  catalogTiles.every((tile) => tile.style.height === '120px'),
  'catalog tiles should keep a uniform 120px height'
);
for (const title of ['Build the square', 'Opposites balance', 'Zero-balanced form', 'Lines sum to 15', "Knight's tour", 'Central overlap', 'Linear overlap', 'Pandiagonal overlap']) {
  need(text.includes(title), `missing property: ${title}`);
}
need(text.includes('Overlapping Luoshu'), 'missing Overlapping Luoshu category');
need(root.querySelector('style') !== null, 'font/style element missing');
need(!text.includes('computed:'), 'intro should carry no computed claim status');

// What-breaks playground: swap two cells, watch the checklist, restore.
const pgToggle = () =>
  root.querySelector('button[aria-label="Enter playground"], button[aria-label="Exit playground"]');
need(pgToggle() !== null && pgToggle().getAttribute('aria-pressed') === 'false', 'playground should start closed');
need(root.querySelector('[aria-label="Property checklist"]') === null, 'checklist should hide until the playground opens');
pgToggle().click();
await until(
  () => (root.querySelector('[aria-label="Property checklist"]') !== null ? 'yes' : 'no'),
  'yes',
  4000
);
const checklist = () => root.querySelector('[aria-label="Property checklist"]');
need(checklist() !== null, 'playground should open the checklist');
const chips = () => [...checklist().querySelectorAll('span')];
need(chips().length === 21, `checklist should cover A–X flat-grid claims (got ${chips().length})`);
need(chips().every((c) => c.textContent.includes('✓')), 'intact Lo Shu should hold every claim');
const boardCells = () => [...document.querySelectorAll('#root [data-anim-stage] div.grid > div')];
const pgSection = () => root.querySelector('[aria-label="What breaks playground"]');
boardCells()[0].click();
await until(() => (pgSection().textContent.includes('One cell armed') ? 'armed' : 'idle'), 'armed', 4000);
need(pgSection().textContent.includes('One cell armed'), 'first tap should arm the cell');
boardCells()[1].click();
await until(() => (checklist().textContent.includes('✗') ? 'broken' : 'holds'), 'broken', 4000);
need(checklist().textContent.includes('Lines sum to 15 ✗'), 'swapping 4 and 9 should break the lines claim');
need(boardCells()[0].textContent.trim() === '9', 'swapped cell should show its new value');
root.querySelector('button[aria-label="Restore Lo Shu"]').click();
await until(() => (checklist().textContent.includes('✗') ? 'broken' : 'holds'), 'holds', 4000);
need(boardCells()[0].textContent.trim() === '4', 'restore should bring back the Lo Shu');
pgToggle().click();
await until(() => (root.querySelector('[aria-label="Property checklist"]') !== null ? 'yes' : 'no'), 'no', 4000);

// No cross-property cell index: stickying a cell only probes the tape.
boardCells()[4].click();
await until(() => (boardCells()[4].style.boxShadow.includes('inset') ? 'probe' : 'none'), 'probe', 4000);
need(root.querySelector('[aria-label="Cell participation"]') === null, 'cell participation section should be gone');
need(!text.includes('appears in:'), 'cell appears-in label should be gone');
boardCells()[4].click();

// Computed status: hidden when the claim holds, shown when broken.
const aTile = [...root.querySelectorAll('#root aside button')].find((b) =>
  (b.textContent || '').includes('Opposites balance')
);
need(!!aTile, 'A sidebar tile should exist');
aTile.click();
await until(() => (root.querySelectorAll('[aria-label="Worked-example tape"] button').length === 5 ? 'a' : 'other'), 'a', 4000);
need(!document.body.textContent.includes('computed:'), 'holds status should stay hidden on the intact square');
root.querySelector('button[aria-label="Enter playground"]').click();
await until(() => (root.querySelector('[aria-label="Property checklist"]') !== null ? 'yes' : 'no'), 'yes', 4000);
boardCells()[0].click();
await until(() => (root.querySelector('[aria-label="What breaks playground"]').textContent.includes('One cell armed') ? 'armed' : 'idle'), 'armed', 4000);
boardCells()[1].click();
await until(() => (document.body.textContent.includes('broken on this square') ? 'broken' : 'holds'), 'broken', 4000);
need(document.body.textContent.includes('✗ computed: broken on this square'), 'broken claim should surface its computed status');
root.querySelector('button[aria-label="Restore Lo Shu"]').click();
await until(() => (document.body.textContent.includes('broken on this square') ? 'broken' : 'holds'), 'holds', 4000);

if (failures.length) {
  for (const f of failures) console.error(`FAIL ${f}`);
  process.exit(1);
}
console.log(`PASS render-smoke (${document.querySelectorAll('#root button').length} buttons, loop + overview toggles present)`);
