// Optional property notes, rendered from Markdown files (public/notes/<id>.md).
//
// A property has a note iff its file exists; a missing file (fetch 404) means
// the Notes section stays hidden. Only the small subset used by the notes is
// parsed: `### ` headings, `- ` bullets, paragraphs, `**bold**`, and
// `[text](https?://...)` links. No raw HTML: everything renders as React
// elements, so note content can never inject markup.

// Split inline text into {t, text, href?} spans: text | bold | link.
function parseSpans(src) {
  const spans = [];
  const re = /(\*\*[^*\n]+\*\*|\[[^\]\n]+\]\(https?:\/\/[^)\s]+\))/g;
  let last = 0;
  let m;
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) spans.push({ t: "text", text: src.slice(last, m.index) });
    const tok = m[0];
    if (tok.startsWith("**")) spans.push({ t: "bold", text: tok.slice(2, -2) });
    else {
      const text = tok.slice(1, tok.indexOf("]"));
      const href = tok.slice(tok.indexOf("](") + 2, -1);
      spans.push({ t: "link", text, href });
    }
    last = m.index + tok.length;
  }
  if (last < src.length) spans.push({ t: "text", text: src.slice(last) });
  return spans;
}

// Parse a note into blocks:
// {type:"heading",spans} | {type:"para",spans} | {type:"list",items:[spans]}.
export function parseNoteMarkdown(src) {
  const blocks = [];
  let currentList = null;
  const flushList = () => {
    if (currentList) {
      blocks.push({ type: "list", items: currentList });
      currentList = null;
    }
  };
  for (const rawLine of String(src).split("\n")) {
    const line = rawLine.trim();
    if (line.startsWith("### ")) {
      flushList();
      blocks.push({ type: "heading", spans: parseSpans(line.slice(4).trim()) });
    } else if (line.startsWith("- ")) {
      if (!currentList) currentList = [];
      currentList.push(parseSpans(line.slice(2).trim()));
    } else if (line === "") {
      flushList();
    } else {
      flushList();
      blocks.push({ type: "para", spans: parseSpans(line) });
    }
  }
  flushList();
  return blocks;
}

// Render parsed blocks to React elements using the app's (type, props, key)
// helper. Links open in a new tab; external-link handling matches the rest of
// the app (public/js/external-links.js forces external links to new tabs).
export function renderNoteBlocks(blocks, h) {
  const renderSpans = (spans, baseKey) =>
    spans.map((sp, i) => {
      const key = `${baseKey}-${i}`;
      if (sp.t === "bold") return h("strong", { children: sp.text }, key);
      if (sp.t === "link")
        return h(
          "a",
          {
            href: sp.href,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "property-notes-link",
            children: sp.text,
          },
          key,
        );
      return sp.text;
    });
  return blocks.map((block, b) => {
    if (block.type === "heading")
      return h(
        "h3",
        { className: "property-notes-heading", children: renderSpans(block.spans, `h${b}`) },
        `nb-h${b}`,
      );
    if (block.type === "list")
      return h(
        "ul",
        {
          className: "property-notes-list",
          children: block.items.map((item, j) =>
            h("li", { children: renderSpans(item, `b${b}i${j}`) }, `nb-b${b}i${j}`),
          ),
        },
        `nb-b${b}`,
      );
    return h(
      "p",
      { className: "property-notes-para", children: renderSpans(block.spans, `p${b}`) },
      `nb-p${b}`,
    );
  });
}
