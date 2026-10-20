# Correspondences legend — research findings

Legend of toggles beneath the Luo Shu matrix for traditional correspondences:
Five Elements (Phases), Bagua trigrams, pentatonic Tones, even/odd parity,
and directions. Implemented in `js/app.js` (legend strip + cell badges),
sourced from `data/correspondences.json`.

## Decided mapping (Later Heaven arrangement, north at the bottom)

| # | Element | Trigram | Tone | Parity | Direction |
|---|---------|---------|------|--------|-----------|
| 1 | Water | ☵ Kan (Water) | Yu | odd | North |
| 2 | Earth | ☷ Kun (Earth) | Gong | even | Southwest |
| 3 | Wood | ☳ Zhen (Thunder) | Jiao | odd | East |
| 4 | Wood | ☴ Xun (Wind) | Jiao | even | Southeast |
| 5 | Earth | — (center, no trigram) | Gong | odd | Center |
| 6 | Metal | ☰ Qian (Heaven) | Shang | even | Northwest |
| 7 | Metal | ☱ Dui (Lake) | Shang | odd | West |
| 8 | Earth | ☶ Gen (Mountain) | Gong | even | Northeast |
| 9 | Fire | ☲ Li (Fire) | Zhi | odd | South |

## What the sources support

- **Odd/even + sums.** The four even numbers sit in the corners and the five
  odd numbers form a center cross; every row, column, and diagonal sums to 15,
  and opposite cells through 5 sum to 10 (the Hetu number).
  Source: [Luoshu Square](https://en.wikipedia.org/wiki/Luoshu_Square).
- **Trigrams, Later Heaven.** The eight outer cells carry the Bagua in the
  Later Heaven (King Wen) arrangement: 1 ↔ ☵ Kǎn (Water), 9 ↔ ☲ Lí (Fire);
  in the Early Heaven (Fuxi) arrangement 1 and 9 would instead be
  ☷ Kūn (Earth) and ☰ Qián (Heaven). The UI ships Later Heaven only and
  footnotes the alternative.
  Sources: [Luoshu Square](https://en.wikipedia.org/wiki/Luoshu_Square),
  [Bagua](https://en.wikipedia.org/wiki/Bagua) (Earlier vs Later Heaven,
  trigram-to-phase table).
- **Trigram ↔ phase links.** Water ↔ Kan; Fire ↔ Li; Earth ↔ Kun + Gen;
  Wood ↔ Xun + Zhen; Metal ↔ Qian + Dui.
  Source: [Bagua](https://en.wikipedia.org/wiki/Bagua) (§ Wǔxíng).
- **Five phases.** Wood, Fire, Earth, Metal, Water, with a Music section
  covering the pentatonic use.
  Source: [Wuxing (Chinese philosophy)](https://en.wikipedia.org/wiki/Wuxing_(Chinese_philosophy)).
- **Tones.** The five-tone ↔ five-phase link (Gong–Earth, Shang–Metal,
  Jiao/Jue–Wood, Zhi–Fire, Yu–Water) is standard organ/tone theory, but no
  inspected source ties the five tones to Lo Shu numbers 1–9. The number →
  tone column above is therefore composed via the phase (interpretive), and
  the UI labels it as such.

## archive.org

An `archive.org` advanced-search query for "Lo Shu magic square" (inspected
2026-10-20) returned only 9 sparse hits — I Ching astrology lessons, ERIC
math notes, one arXiv note — and no canonical correspondences table, so the
table above is synthesized from the encyclopedic sources, not from an
archive.org text:
[archive.org search for Lo Shu magic square](https://archive.org/advancedsearch.php?q=Lo+Shu+magic+square&fl%5B%5D=identifier%2Ctitle%2Cdescription&rows=10&page=1&output=json).
One supplementary fetch (CSSN five-tone scale article) failed on DNS and was
not used.

## Prior art in this repo

`archive-artifacts/Luoshu-Combination-Explorer.html` was grepped for
legend/toggle/element/trigram/tone/parity terms: it contains only Tailwind
output plus the minified bundle, no reusable legend markup. The legend is
new UI. The per-property "Visual key" in the detail card (`VISUAL_KEYS` in
`js/app.js`) is untouched.

## Design notes

- Layers are independent (Off clears the set). Each layer owns a slot in the
  108px cell so they can stack without sharing one top-center badge.
- Slots: even/odd is chrome only (odd = solid ink inset, even = dashed sage
  outline); Elements tint plus a bottom-stack label; Tones join that stack;
  Trigrams sit at the top; Directions pin to the compass edge (north at the
  bottom).
- Legend badges render only when idle (`legend.size > 0 && !animOn`);
  the animation player keeps owning all motion.
- Element tints are inset rings that compose with existing property
  backgrounds.
- Palette reuses app hues; Water gets muted slate blue `#4a6a8a`
  (no purple/indigo accent, no glow, per taste constraints).
