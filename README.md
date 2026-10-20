# Luoshu Explorer 

Directory split of the former single-file `Luoshu-Arithmetic-Properties.html`
(React 18.3.1 bundle + Tailwind CSS, all inline).

The explorer at http://localhost:5173/ now works on a phone. The square stays on screen, and the property list scrolls underneath it.

Narrow screens. The 3×3 and the playback controls sit in the top pane. The catalog fills the rest of the screen and scrolls on its own. The square scales down to the screen width, so the grid and its overlays stay aligned instead of running off the edge.
Landscape phones. The list sits beside the square.
Touch. Playback and close controls are at least 44px, and the page respects the display's safe area.
Laptop widths. The playback rail stays under the square until the window is wide enough to show it on the right, so it is no longer cut off.
The wide two-column layout is unchanged. Shell checks pass.


## Layout

- `index.html` — shell only: `<div id="root">`, stylesheet/script references,
  and the inline `clippy-inline-media-manifest` JSON (platform metadata, kept
  inline because external `src` does not apply to `type="application/json"`).
- `css/styles.css` — verbatim `<style>` block (Tailwind build output) plus
  hand-added shell rules and utilities for classes the frozen output lacks.
- `js/app.js` — readable application source (recovered from the original
  minified bundle, then formatted and renamed). Imports `react`,
  `react-dom/client`, and `../data/properties.json`. The `h`/`_` helpers wrap
  `React.createElement` with the original bundle's `(type, props, key)`
  contract — the 3rd argument is the React key, not a child.
- `js/external-links.js` — small script that forces external links to open in a
  new tab with `noopener noreferrer`.
- `data/properties.json` — single source of truth for the 14 properties
  (ids A–N with title/shortDesc/formula/longDesc), imported by `js/app.js`.
- `checks/` — `spa-shell.check.mjs` (viewport-lock shell rules) and
  `render-smoke.check.mjs` (mounts the app in jsdom and asserts the header is
  gone, the 9 cells, 19 buttons, icon tiles, and grid classes). Both run via
  `npm run check`.

## Running with Vite

```sh
cd luoshu-arithmetic-properties
npm install
npm run dev      # develop, default http://localhost:5173
npm run check    # shell + render smoke checks
npm run build    # emit dist/
npm run preview  # serve dist/ locally
```

Module scripts are blocked on `file://`, so always open the dev/preview URL,
never the file directly.

## Notes on the Vite layout

- `react`/`react-dom` are regular npm dependencies (same 18.3.1 as the
  original vendored bundle); `jsdom` is a devDependency for the render smoke
  check. Vite bundles the app entry and vendor code together.
- `public/js/external-links.js` is a classic script: Vite does not bundle
  classic `<script src>` files, so it lives in `public/` and is copied verbatim
  to `dist/`.
- SPA shell: `css/styles.css` ends with viewport-lock rules (page never
  scrolls; the aside list and main column scroll internally). Guarded by
  `npm run check` (`checks/spa-shell.check.mjs`).
- The pre-split minified bundle is archived at
  `../../archive-artifacts/luoshu-app-bundle-orig.js` (workspace root). The
  current source renders byte-identical HTML to it (verified via jsdom
  innerHTML diff at split time).

## Notes

- No framework migration, no behavior change.
- `Luoshu-Explorer.html` (sibling artifact) is untouched.
- Future cleanup candidates (not done): trim unused Tailwind rules.
