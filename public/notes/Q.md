### Its own complement

A **complement** is the number that completes another to 10, that is 10−n:
4↔6, 9↔1, 2↔8, 3↔7, and 5↔5.

The outer lines come in complementary pairs: the bottom row is the top row
with every cell replaced by its complement (4→6, 9→1, 2→8), and likewise for
the columns. A center line has no partner line — the complement operation maps
the line onto itself. Its two ends are complements of each other and the middle
cell is 5, which is its own complement: middle row 3↔7 around 5, middle column
9↔1 around 5, and likewise 4↔6 and 2↔8 on the two diagonals.

### Why the center lines disagree

The first two beats show square-sums that match (101, 89), so the four
different center-line totals can look like a letdown. Their significance is the
opposite: this is the case where the totals do not match, and the reason they
do not is the point.

Each center line has the form {a, 5, 10−a}, so its square-sum is
a² + 25 + (10−a)², which simplifies to **75 + 2(a−5)²**. The total is fixed at
75 plus twice the pair's squared distance from 5:

- **83** — middle row 3²+5²+7²
- **107** — middle column 9²+5²+1²
- **77** — main diagonal 4²+5²+6²
- **93** — anti-diagonal 2²+5²+8²

The pair closest to the center (4, 6) gives the smallest total, 77; the
extreme pair (9, 1) gives the largest, 107. Complement symmetry preserves
square-sums across opposite lines, but a line that is its own complement is
not forced to agree with the others — the four totals are just four different
distances from center measured the same way.
