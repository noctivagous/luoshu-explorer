# Luoshu Arithmetic Properties — Agent Guide

## Project Overview
Interactive React 18.3.1 SPA exploring the 14 arithmetic properties (A–N) of the Lo Shu magic square. Originally a single minified bundle, now split into maintainable source files.

## Structure
```
├── index.html              # Shell: root div, stylesheet/script refs, manifest JSON
├── css/styles.css          # Tailwind build output + SPA shell rules (viewport lock)
├── js/app.js               # App source (recovered from minified bundle)
├── js/animation.js         # Animation player
├── js/animation-scripts.js # Animation scripts per property (A–N)
├── js/external-links.js    # Classic script: forces external links to new tab
├── data/properties.json    # Single source of truth for 14 properties
├── checks/
│   ├── spa-shell.check.mjs     # CSS shell regression (viewport lock)
│   ├── render-smoke.check.mjs  # JSDOM mount + DOM assertions
│   └── animation.check.mjs     # Animation state machine checks
└── archive-artifacts/        # Original minified bundle (workspace root)
```

## Commands
```sh
npm install          # Install deps
npm run dev          # Vite dev server (http://localhost:5173)
npm run check        # Run all checks (shell + render + animation)
npm run build        # Production build to dist/
npm run preview      # Serve dist/ locally
```

## Key Conventions
- **Module type**: ESM (`"type": "module"` in package.json)
- **React key contract**: `h` / `_` helpers wrap `React.createElement(type, props, key)` — 3rd arg is **key**, not children
- **SPA shell**: Viewport never scrolls (`html,body{overflow:hidden}`); `aside` and `main` scroll internally. Enforced by `checks/spa-shell.check.mjs`.
- **Animation**: Step-based via `createPlayer` + scripts in `animation-scripts.js`. Motion stays player-driven: the player owns time, overlays may read the `--anim-p` progress var on `[data-anim-stage]`; no independent CSS keyframe animations.
- **Properties data**: Single source at `data/properties.json` (ids A–N with title/shortDesc/formula/longDesc).
- **External links**: Handled by `public/js/external-links.js` (copied verbatim to dist).

## Development Notes
- **No framework migration** — keep React 18.3.1, no behavior changes.
- **Vite base**: `./` for relative asset URLs (works from any serve path).
- **CSS shell rules** live only in `css/styles.css`; bundle must not leak shell selectors (checked by `spa-shell.check.mjs`).
- **Animation scripts** are pure data (steps with `visibleKeys`, `setValues`, `highlight`); player is generic.
- **Bundle recovery**: `js/app.js` was manually recovered from minified source; minimize churn to stay byte-identical.

## Testing
- All checks run via `npm run check` (JSDOM, no browser needed).
- `render-smoke.check.mjs` asserts: header gone, 9 cells, 19 buttons, icon tiles, grid classes present.
- `animation.check.mjs` validates player state machine per property script.

## Common Tasks
| Task | Approach |
|------|----------|
| Add property | Edit `data/properties.json`, add icon in `iconGlyphs()`, add animation script |
| Fix shell scrolling | Edit `css/styles.css` shell rules, verify `npm run check` |
| Debug animation | Use `animation-scripts.js` step logs; check `createPlayer` in `animation.js` |
| Update dependencies | Keep `react`/`react-dom` at 18.3.1 (matches original bundle) |

## Gotchas
- `file://` blocked for module scripts — always use dev/preview URL.
- `h`/`_` key-as-3rd-arg differs from standard `React.createElement`.
- Animation overlay gate: `showKey(id, key)` hides keys not yet revealed by player.
- Tailwind classes are frozen output; custom utilities added manually to `styles.css`.