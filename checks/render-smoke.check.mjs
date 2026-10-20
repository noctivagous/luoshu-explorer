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

// Sidebar: 5 category headers + 14 property items, two-column grid,
// square icon tiles with 26px glyphs.
need(document.querySelectorAll('#root button').length === 19, 'expected 19 buttons');
need(root.querySelectorAll('.lg\\:grid-cols-2').length === 5, 'two-column sidebar grid missing');
need(root.querySelectorAll('span.rounded-\\[8px\\]').length === 14, 'square icon tiles missing');
need(root.querySelectorAll('svg[width="26"]').length === 14, 'icon glyphs missing');
for (const title of ['Opposites balance', 'Zero-balanced form', 'Lines sum to 15', "Knight's tour"]) {
  need(text.includes(title), `missing property: ${title}`);
}
need(root.querySelector('style') !== null, 'font/style element missing');

if (failures.length) {
  for (const f of failures) console.error(`FAIL ${f}`);
  process.exit(1);
}
console.log(`PASS render-smoke (${document.querySelectorAll('#root button').length} buttons)`);
