# How the Lo Shu is constructed by hand

Scope: manual constructions of the 3×3 Lo Shu, especially methods that start
from the **ordinal** matrix `1…9` in reading order. Written so “Build the
square” can show a real construction instead of numbers appearing in their
final cells.

Basis: Brave Search plus pages linked from it (Wikipedia Siamese method / Lo
Shu / Magic square, HandWiki, Johnston’s “Lo Shu method” write-up, China Sage,
Baidu Lo Shu, Mind Your Decisions). Cross-checked against this repo’s
`constructionScript` in `js/animation-scripts.js` and §6.1 of
`refs/animation-and-capability-improvements.md`.

---

## 1. TL;DR

The Lo Shu was originally treated as a **revealed pattern**, not a recipe.
Later mathematicians invented several **hand constructions**. Three are
worth animating:

1. **Ordinal square → swap corners → fold.** Starts from a filled `1 2 3 / 4 5 6 / 7 8 9` grid. Three visible operations. Lands on this app’s `SQUARE`. Closest to “from the matrix where the numbers are ordinal, so multiple steps.”
2. **Siamese / De la Loubère** (and the mirrored variant already sketched in this repo). Starts **empty**; writes 1 through 9 one cell at a time with wrap and “occupied → step aside.” Nine steps. This is what `constructionScript` already approximates, without showing the rule.
3. **Diamond / Bachet–Yang Hui.** Write `1…9` in a tilted diamond, then slide the outer numbers inward. Same result, more geometry.

Idle “Build the square” still paints the finished Lo Shu. The construction
script’s nine `setValues` steps do not start from an ordinal grid.

---

## 2. Traditional description (not a construction)

The Lo Shu (洛書) is the unique normal 3×3 magic square with **1 at the
bottom and 9 at the top** (north at the bottom on Chinese maps). Every other
normal 3×3 is a rotation or reflection of it.

```
4  9  2
3  5  7
8  1  6
```

Legend: Yu the Great and a turtle from the Luo River with a 3×3 of dots on
its shell. Early Chinese sources (Nine Halls / 九宮, *Da Dai Liji*) present
the pattern as given.

Mnemonic (Baidu / body layout): “9 on the head, 1 on the feet, 3 on the left,
7 on the right, 2 and 4 as shoulders, 6 and 8 as feet, 5 at the center.” Odds
form a cross; evens sit in the four corners; every line sums to 15; opposite
pairs through 5 sum to 10.

That is how it was used in feng shui and the Nine Halls. It is **not** a
step-by-step build.

Sources: [Lo Shu Square (Wikipedia)](https://en.wikipedia.org/wiki/Lo_Shu_Square),
[China Sage — Chinese Magic Squares](https://www.chinasage.info/magic-squares.htm),
[Baidu: Lo Shu Square](https://baike.baidu.com/en/item/Lo%20Shu%20Square/1461052).

---

## 3. Method 1 — Ordinal matrix, then swap, then fold

Closest match to “show a construction from the matrix where the numbers are
ordinal.”

Johnston’s “Lo Shu method” (and Talwalkar’s recursive 9×9 video) starts from
the counting square.

**Step A — write the numbers in reading order:**

```
1  2  3
4  5  6
7  8  9
```

**Step B — swap each corner with its opposite** (`1↔9`, `3↔7`). The cross
`2 4 5 6 8` stays put:

```
9  2  7
4  5  6
3  8  1
```

**Step C — fold the diamond into a square:** press `9` between `4` and `2`,
press `1` between `8` and `6`, and drop the diagonal `3 5 7` into the middle
row:

```
4  9  2
3  5  7
8  1  6
```

That is exactly `SQUARE` in `js/app.js`. Three beats, numbers stay on screen
the whole time. The same three operations scale to the 9×9 composite Lo Shu
(nine 3×3 blocks, each magic).

Sources: [Johnston, 9×9 Magic Squares by the Lo Shu Method](http://pjk.scripts.mit.edu/pkj/2017/10/27/9x9-magic-squares-by-the-lo-shu-method/)
(live site was down; text recovered via archive snippet / fetch),
[Mind Your Decisions — Ancient Chinese algorithm](https://mindyourdecisions.com/blog/2015/05/06/make-a-9x9-magic-square-lo-shu-square-ancient-chinese-algorithm-video/).

---

## 4. Method 2 — Siamese / De la Loubère (empty grid, nine placements)

Simon de la Loubère published this in 1693 (*Du Royaume de Siam*), having
learned an Indian method (Surat) via a return voyage from Siam. It builds
**any odd-order** magic square from an arithmetic progression.

Rules:

1. Choose the sequence `1, 2, …, 9`.
2. Put **1 in the middle of the top row**.
3. Each next number goes **up-right** (↗), wrapping around the edges.
4. If that cell is occupied, go **down one** (↓) from the last cell instead,
   then continue.

Nine placements produce:

```
8  1  6
3  5  7
4  9  2
```

That is a **rotation** of the traditional Lo Shu (1 on top, not 1 at the
bottom).

**Mirrored rule that lands on this app’s board** (already traced in
`refs/animation-and-capability-improvements.md` §6.1): start with 1 at
**bottom-middle**, move **down-right** with wrap; if occupied, step **up**.
Placement order of values 1…9 is cell indices

```
BUILD_ORDER = [7, 2, 3, 0, 4, 8, 5, 6, 1]
```

which is what `constructionSteps()` in `js/animation-scripts.js` already
uses.

This method does **not** start from a filled ordinal matrix. It starts empty
and writes 1 through 9 one at a time. To “explain itself,” animate the move
arrow, the wrap (ghost leaving one edge, entering the opposite), and the
collision rule.

Sources: [Siamese method (Wikipedia)](https://en.wikipedia.org/wiki/Siamese_method),
[HandWiki](https://handwiki.org/wiki/Siamese_method),
[MathWorld — Siamese Method](https://mathworld.wolfram.com/SiameseMethod.html).

---

## 5. Method 3 — Diamond / Bachet–Yang Hui

Yang Hui (1275) explained a 3×3 construction; Cardano and Bachet later
described a “diamond method” for Agrippa’s odd-order squares:

- Write `1…9` in a **tilted diamond** (5 in the center, odds on a plus,
  evens on the corners of a larger diamond).
- Slide the four outer numbers inward into the empty 3×3.

Same finished square, more geometry, fewer “swap” steps. Useful if the
animation wants a spatial collapse rather than in-place swaps.

Source: [Magic square (Wikipedia)](https://en.wikipedia.org/wiki/Magic_square)
(history: Yang Hui; Europe after 15th century: Cardano / Bachet diamond).

---

## 6. What this repo does today

| | Today (“Build the square”) | Method 1 (ordinal) | Method 2 (Siamese) |
|---|---|---|---|
| Start | Empty cells while playing; idle view still shows full Lo Shu | Full `1 2 3 / 4 5 6 / 7 8 9` | Empty cells |
| Steps | 9 “Place n” steps | 3 operations (write, swap, fold) | 9 placements + wrap/collision |
| Rule shown | None — numbers appear in Lo Shu cells | Swap corners, then fold | Arrow, wrap, occupied → step aside |
| End | Lo Shu | Lo Shu | Lo Shu (or a rotation unless mirrored) |

`js/animation-scripts.js` `constructionScript` already has nine `setValues`
frames and `visibleCount`. `js/app.js` only applies those overrides when
`animOn && script.id === "construction"`; otherwise every cell shows
`SQUARE`. `visibleCount` is computed on the frame but the renderer keys off
`setValues`.

Copy in `data/properties.json` (intro): “Nine cells fill in sequence — 1
through 9 — until the Lo Shu is complete” matches method 2’s *story*, not
method 1’s *start state*.

---

## 7. Recommendation for the explorer

If the product line is “from the ordinal matrix, multiple steps,” **animate
method 1**: three beats, numbers never vanish, maps onto `setValues` without
new overlay types beyond highlighting the swapped / folded cells.

If the product line is “watch the turtle fill the shell,” keep the nine
placements (method 2, mirrored) and add the missing rule: move arrow, wrap
ghost, occupied flag. That is §6.1 of the animation findings note.

Both can coexist as two scripts (e.g. construction-fold vs
construction-siamese) behind the same intro property.

---

## 8. Sources

- https://en.wikipedia.org/wiki/Siamese_method
- https://en.wikipedia.org/wiki/Lo_Shu_Square
- https://en.wikipedia.org/wiki/Magic_square
- https://handwiki.org/wiki/Siamese_method
- https://mathworld.wolfram.com/SiameseMethod.html
- http://pjk.scripts.mit.edu/pkj/2017/10/27/9x9-magic-squares-by-the-lo-shu-method/
- https://mindyourdecisions.com/blog/2015/05/06/make-a-9x9-magic-square-lo-shu-square-ancient-chinese-algorithm-video/
- https://www.chinasage.info/magic-squares.htm
- https://baike.baidu.com/en/item/Lo%20Shu%20Square/1461052
- https://8gwifi.org/magic-square-generator.jsp
- This repo: `js/animation-scripts.js` (`constructionSteps`, `BUILD_ORDER`),
  `js/app.js` (`SQUARE`, `buildOn` / `setValues`),
  `refs/animation-and-capability-improvements.md` §6.1
