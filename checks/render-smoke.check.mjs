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
// correspondences-legend chips = 33.
need(document.querySelectorAll('#root button').length === 33, 'expected 33 buttons');
const overviewBtn = document.querySelector('button[aria-label="Overview diagram"]');
need(overviewBtn !== null, 'overview toggle should exist');
need(overviewBtn.getAttribute('aria-pressed') === 'false', 'overview should start off');
need(text.includes('Correspondences'), 'missing correspondences legend');
const pressed = [...document.querySelectorAll('#root button')].filter(
  (b) => b.getAttribute('aria-pressed') === 'true',
);
need(pressed.length === 1 && pressed[0].textContent === 'Off', 'legend should start on Off');
need(root.querySelectorAll('.lg\\:grid-cols-2').length === 6, 'sidebar catalog grid missing');
need(root.querySelectorAll('span.rounded-\\[8px\\]').length === 15, 'square icon tiles missing');
need(root.querySelectorAll('svg[width="26"]').length === 15, 'icon glyphs missing');
for (const title of ['Build the square', 'Opposites balance', 'Zero-balanced form', 'Lines sum to 15', "Knight's tour"]) {
  need(text.includes(title), `missing property: ${title}`);
}
need(root.querySelector('style') !== null, 'font/style element missing');

if (failures.length) {
  for (const f of failures) console.error(`FAIL ${f}`);
  process.exit(1);
}
console.log(`PASS render-smoke (${document.querySelectorAll('#root button').length} buttons, loop + overview toggles present)`);
