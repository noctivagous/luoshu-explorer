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
need(!text.includes('Matrix L'), 'caption header is back');
need(text.includes('LUO SHU'), 'missing LUO SHU heading');

// Nine square cells with the Lo Shu numbers in order.
const cells = [...root.querySelectorAll('div.relative.bg-white span.text-\\[42px\\]')].map((el) =>
  el.textContent.trim()
);
need(
  JSON.stringify(cells) === JSON.stringify(['4', '9', '2', '3', '5', '7', '8', '1', '6']),
  `square cells wrong: ${JSON.stringify(cells)}`
);

// Sidebar: 6 category headers + 15 items (intro + A–N), two-column grid,
// square icon tiles with 26px glyphs. Intro is selected on load, so the
// detail close button is present too. 6 + 15 + 5 caption playback
// (play/prev/next/loop/overview) + 1 close = 27, plus 6
// correspondences-legend chips = 33, plus 3 construction step cards = 36,
// plus 3 worked-example tape rows (intro shows construction) = 39,
// plus 3 step ticks + 2 autoplay toggles = 44.
need(document.querySelectorAll('#root button').length === 44, 'expected 44 buttons');
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
const autoSelectBtn = root.querySelector('button[aria-label="Autoplay on select"]');
const autoNextBtn = root.querySelector('button[aria-label="Autoplay next property"]');
need(autoSelectBtn !== null && autoNextBtn !== null, 'autoplay toggles should exist');
need(
  autoSelectBtn.getAttribute('aria-pressed') === 'false' &&
    autoNextBtn.getAttribute('aria-pressed') === 'false',
  'autoplay prefs should start off'
);
need(root.querySelectorAll('.lg\\:grid-cols-2').length === 6, 'sidebar catalog grid missing');
need(root.querySelectorAll('span.rounded-\\[8px\\]').length === 15, 'square icon tiles missing');
need(root.querySelectorAll('svg[width="26"]').length === 15, 'icon glyphs missing');
const catalogTiles = [...root.querySelectorAll('button.catalog-tile')];
need(catalogTiles.length === 15, 'catalog tiles missing');
need(
  catalogTiles.every((tile) => tile.style.height === '120px'),
  'catalog tiles should keep a uniform 120px height'
);
for (const title of ['Build the square', 'Opposites balance', 'Zero-balanced form', 'Lines sum to 15', "Knight's tour"]) {
  need(text.includes(title), `missing property: ${title}`);
}
need(root.querySelector('style') !== null, 'font/style element missing');

if (failures.length) {
  for (const f of failures) console.error(`FAIL ${f}`);
  process.exit(1);
}
console.log(`PASS render-smoke (${document.querySelectorAll('#root button').length} buttons, loop + overview toggles present)`);
