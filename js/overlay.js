// Declarative board overlay. Scripts describe lines, paths, rings, bars,
// chips and badges; this module turns them into SVG and HTML. Positions come
// from the cell centers so a change to gn/Tl moves every annotation.
//
// Motion is player-driven: entering items read --anim-p on [data-anim-stage].
// No CSS keyframe animations.

import React from "react";

const keyed = (create) => (type, props, key) => {
  if (key === undefined || (props && props.key !== undefined)) return create(type, props);
  return create(type, { ...props, key });
};
const h = keyed(React.createElement);
const _ = keyed(React.createElement);

export const gn = 108;
export const Tl = 8;
export const Z = 3 * gn + 2 * Tl;

export function cellCenter(index) {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: col * (gn + Tl) + gn / 2,
    y: row * (gn + Tl) + gn / 2,
    col,
    row,
  };
}

export const CENTERS = Array.from({ length: 9 }, (_, n) => cellCenter(n));

// Margin-tick anchors just outside the Z×Z board. The board SVG and the
// stage both let them show (overflow visible), so ticks sit in the card's
// padding the way badges already do — no stage resize, no coordinate shift.
export function rowGutter(row) {
  return { x: Z + 2, y: CENTERS[row * 3].y };
}
export function colGutter(col) {
  return { x: CENTERS[col].x, y: Z + 2 };
}
export function cornerGutter() {
  return { x: Z + 2, y: Z + 2 };
}

export function hopLook(from, to) {
  const a = CENTERS[from];
  const b = CENTERS[to];
  const long = Math.abs(b.x - a.x) > 100 || Math.abs(b.y - a.y) > 100;
  return long
    ? { color: "#7a6a9e", width: "1.4", dash: "5 5" }
    : { color: "#1a1a1a", width: "1.6", dash: null };
}

function endpoints(from, to, extend = 0) {
  const a = CENTERS[from];
  const b = CENTERS[to];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return {
    x1: a.x - (dx / len) * extend,
    y1: a.y - (dy / len) * extend,
    x2: b.x + (dx / len) * extend,
    y2: b.y + (dy / len) * extend,
  };
}

function placeStyle(place) {
  if (!place) return null;
  const style = {};
  if (place.mid) {
    const [a, b] = place.mid;
    style.left = (CENTERS[a].x + CENTERS[b].x) / 2 + (place.dx || 0);
  } else if (place.cell != null) {
    style.left = CENTERS[place.cell].x + (place.dx || 0);
  } else if (place.left != null) style.left = place.left;
  if (place.midY) {
    const [a, b] = place.midY;
    style.top = (CENTERS[a].y + CENTERS[b].y) / 2 + (place.dy || 0);
  } else if (place.topCell != null) {
    style.top = CENTERS[place.topCell].y + (place.dy || 0);
  } else if (place.cell != null && place.top == null && place.midY == null && place.dy != null && style.top == null) {
    style.top = CENTERS[place.cell].y + place.dy;
  } else if (place.top != null) style.top = place.top;
  if (place.right != null) style.right = place.right;
  if (place.bottom != null) style.bottom = place.bottom;
  if (place.transform) style.transform = place.transform;
  return style;
}

function enterAttrs(item, entering) {
  if (!entering) return { "data-anim-key": item.key };
  return {
    "data-anim-key": item.key,
    "data-anim-enter": "1",
    style: { "--anim-at": String(item.at ?? 0) },
  };
}

// Settled strokes use their real dash. Entering strokes draw on via
// pathLength + dashoffset; a dashed design fades in after the solid draw
// so dasharray and dashoffset do not fight.
function strokeNodes(tag, geom, look, entering) {
  const base = {
    ...geom,
    fill: "none",
    stroke: look.color,
    strokeWidth: look.width,
  };
  if (!entering) {
    return h(tag, {
      ...base,
      strokeDasharray: look.dash || undefined,
      markerEnd: look.marker ? `url(#${look.marker})` : undefined,
    });
  }
  if (look.dash) {
    return [
      h(tag, {
        ...base,
        className: "anim-stroke-draw anim-stroke-ghost",
        pathLength: "1",
      }),
      h(tag, {
        ...base,
        className: "anim-stroke-ink",
        strokeDasharray: look.dash,
        markerEnd: look.marker ? `url(#${look.marker})` : undefined,
      }),
    ];
  }
  return h(tag, {
    ...base,
    className: "anim-stroke-draw",
    pathLength: "1",
    markerEnd: look.marker ? `url(#${look.marker})` : undefined,
  });
}

function chipPoint(item) {
  const chip = item.chip || item;
  if (chip.x != null && chip.y != null) return { x: chip.x, y: chip.y };
  const a = CENTERS[item.from];
  const b = CENTERS[item.to];
  // anchor picks an endpoint; t places the chip fractionally along the
  // segment so beats on one shared chord (A's diameters) still separate.
  const t = chip.anchor === "end" ? 1 : chip.anchor === "start" ? 0 : (chip.t ?? 0.5);
  return {
    x: a.x + (b.x - a.x) * t + (chip.dx || 0),
    y: a.y + (b.y - a.y) * t + (chip.dy || 0),
  };
}

function svgChip(chip, x, y, entering) {
  const w = chip.w || 28;
  const ht = chip.h || 20;
  return _(
    "g",
    {
      className: entering ? "anim-pop" : undefined,
      style: entering ? { "--anim-at": String(chip.at ?? 0.45) } : undefined,
      transform: `translate(${x},${y})`,
      children: [
        h("rect", {
          x: -w / 2,
          y: -ht / 2,
          width: w,
          height: ht,
          rx: chip.rx ?? 10,
          fill: chip.fill || "white",
          stroke: chip.stroke,
          strokeWidth: chip.stroke ? chip.strokeWidth || "1" : undefined,
        }),
        h("text", {
          x: 0,
          y: chip.textDy ?? 4,
          textAnchor: "middle",
          fontSize: String(chip.fontSize || 11),
          fontFamily: "monospace",
          fill: chip.color || chip.stroke || "#1a1a1a",
          fontWeight: chip.weight || "700",
          children: chip.text,
        }),
      ],
    },
  );
}

function lineChildren(item, look, from, to, entering) {
  const geom = endpoints(from, to, item.extend || 0);
  const nodes = [strokeNodes("line", geom, look, entering)];
  if (item.chip) {
    const p = chipPoint({ ...item, from, to });
    nodes.push(svgChip(item.chip, p.x, p.y, entering));
  }
  return nodes.flat();
}

function renderBadge(item, entering) {
  const style = {
    ...(item.style || {}),
    ...(placeStyle(item.place) || {}),
  };
  if (entering) style["--anim-at"] = String(item.at ?? 0.4);
  return h(
    "div",
    {
      "data-anim-key": item.key,
      "data-anim-enter": entering ? "1" : undefined,
      className: `${item.className || ""}${entering ? " anim-pop" : ""}`,
      style,
      children: item.text,
    },
  );
}

function renderItem(item, entering) {
  const attrs = enterAttrs(item, entering);
  if (item.opacity != null) attrs.opacity = item.opacity;

  if (item.type === "line") {
    const look = {
      color: item.color,
      width: item.width,
      dash: item.dash,
      marker: item.marker,
    };
    return {
      svg: _("g", { ...attrs, children: lineChildren(item, look, item.from, item.to, entering) }, item.key),
    };
  }

  if (item.type === "segments") {
    return {
      svg: _(
        "g",
        {
          ...attrs,
          children: item.parts.flatMap((part) =>
            lineChildren(
              { ...item, chip: part.chip || null, extend: part.extend || 0 },
              part,
              part.from,
              part.to,
              entering,
            ),
          ),
        },
        item.key,
      ),
    };
  }

  if (item.type === "path" || item.type === "arc") {
    let d = item.d;
    if (!d && item.cells) {
      const pts = item.cells.map((i) => CENTERS[i]);
      d = pts.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
      if (item.close) d += ` L ${pts[0].x} ${pts[0].y}`;
    }
    if (!d && item.type === "arc") {
      const a = CENTERS[item.from];
      const b = CENTERS[item.to];
      const cx = (a.x + b.x) / 2 + (item.bendX || 0);
      const cy = (a.y + b.y) / 2 + (item.bendY || 0);
      d = `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
    }
    const look = {
      color: item.color,
      width: item.width,
      dash: item.dash,
      marker: item.marker,
    };
    const children = [strokeNodes("path", { d }, look, entering)];
    if (item.label && item.type === "arc") {
      const a = CENTERS[item.from];
      const b = CENTERS[item.to];
      children.push(
        h("text", {
          x: (a.x + b.x) / 2,
          y: (a.y + b.y) / 2 - 10,
          textAnchor: "middle",
          fontSize: "8",
          fontFamily: "monospace",
          fill: "#7a6a9e",
          fontWeight: "700",
          className: entering ? "anim-pop" : undefined,
          children: item.label,
        }),
      );
    }
    return { svg: _("g", { ...attrs, children: children.flat() }, item.key) };
  }

  if (item.type === "wedge") {
    const a = CENTERS[item.from];
    const b = CENTERS[item.to];
    const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    return {
      svg: h(
        "g",
        {
          ...attrs,
          transform: `translate(${(a.x + b.x) / 2},${(a.y + b.y) / 2}) rotate(${ang})`,
          className: entering ? "anim-pop" : undefined,
          children: h("path", {
            d: "M -6 -4 L 6 0 L -6 4",
            fill: "none",
            stroke: item.color || "#c96442",
            strokeWidth: item.width || "1.6",
          }),
        },
        item.key,
      ),
    };
  }

  if (item.type === "ring") {
    return {
      svg: _(
        "g",
        {
          ...attrs,
          children: strokeNodes(
            "circle",
            { cx: Z / 2, cy: Z / 2, r: item.r },
            { color: item.color, width: item.width || "1", dash: item.dash },
            entering,
          ),
        },
        item.key,
      ),
    };
  }

  if (item.type === "mark") {
    return {
      svg: _(
        "g",
        {
          ...attrs,
          className: entering ? "anim-pop" : undefined,
          transform: `translate(${Z / 2}, ${Z / 2})`,
          children: [
            h("circle", { r: item.r || 18, fill: item.fill || "#1a1a1a" }),
            h("text", {
              textAnchor: "middle",
              dy: "4",
              fontSize: "12",
              fill: "white",
              fontFamily: "monospace",
              children: item.text,
            }),
          ],
        },
        item.key,
      ),
    };
  }

  if (item.type === "bar") {
    const m = CENTERS[item.cell];
    const delta = item.delta;
    const v = Math.abs(delta) * 6;
    const y = delta > 0 ? m.y - 44 - v : m.y + 18;
    const label = delta > 0 ? `+${delta}` : `${delta}`;
    return {
      svg: _(
        "g",
        {
          ...attrs,
          children: h("rect", {
            x: m.x - 3,
            y,
            width: 6,
            height: Math.max(v, 0),
            rx: 3,
            fill: delta > 0 ? "#4a6741" : "#c96442",
            opacity: 0.8,
            className: entering ? "anim-bar-grow" : undefined,
            style: entering
              ? {
                  transformBox: "fill-box",
                  transformOrigin: delta > 0 ? "center bottom" : "center top",
                  transform: "scaleY(var(--anim-p))",
                }
              : undefined,
          }),
        },
        item.key,
      ),
      html: h(
        "span",
        {
          "data-anim-key": item.key,
          className: `absolute text-[11px] font-mono opacity-60 pointer-events-none${entering ? " anim-pop" : ""}`,
          style: {
            left: m.x,
            top: m.y + gn / 2 - 16,
            transform: "translateX(-50%)",
          },
          children: label,
        },
        `${item.key}-label`,
      ),
    };
  }

  if (item.type === "cellTag") {
    return {
      html: _(
        "div",
        {
          ...attrs,
          className: `absolute inset-0 pointer-events-none${entering ? " anim-pop" : ""}`,
          children: item.cells.map((cell, i) => {
            const col = cell % 3;
            const row = Math.floor(cell / 3);
            return h(
              "span",
              {
                className:
                  "absolute text-[11px] font-mono font-bold px-1 rounded bg-[#1a1a1a] text-white",
                style: {
                  left: col * (gn + Tl) + gn - 4,
                  top: row * (gn + Tl) + gn + 4,
                  transform: "translate(-100%, -100%)",
                },
                children: item.texts[i],
              },
              cell,
            );
          }),
        },
        item.key,
      ),
    };
  }

  if (item.type === "chip") {
    const p = chipPoint(item);
    return {
      svg: _(
        "g",
        { ...attrs, children: svgChip({ ...item, at: item.at ?? 0.45 }, p.x, p.y, entering) },
        item.key,
      ),
    };
  }

  if (item.type === "gutter") {
    // A margin total: same pill as a chip, but pinned to an explicit
    // board-coordinate point from rowGutter/colGutter/cornerGutter instead
    // of a cell pair. Ticks pop in after the line draws (at ≈ 0.55).
    return {
      svg: _(
        "g",
        { ...attrs, children: svgChip({ ...item, at: item.at ?? 0.55 }, item.x, item.y, entering) },
        item.key,
      ),
    };
  }

  if (item.type === "badge") {
    return { html: renderBadge(item, entering) };
  }

  return {};
}

export function renderOverlay(items, opts = {}) {
  const entering = new Set(opts.enteringKeys || []);
  const svg = [];
  const html = [];
  const rows = new Map();

  const isEntering = (item) => entering.has(item.key) && !item.chrome;

  for (const item of items || []) {
    if (item.type === "badge" && item.row) {
      if (!rows.has(item.row)) rows.set(item.row, { style: item.rowStyle, className: item.rowClass, items: [] });
      rows.get(item.row).items.push(item);
      continue;
    }
    const part = renderItem(item, isEntering(item));
    if (part.svg) svg.push(part.svg);
    if (part.html) html.push(part.html);
  }

  for (const [row, bucket] of rows) {
    html.push(
      _(
        "div",
        {
          className: bucket.className || "absolute left-0 right-0 flex justify-center gap-2 pointer-events-none",
          style: bucket.style,
          children: bucket.items.map((item) => renderBadge(item, isEntering(item))),
        },
        row,
      ),
    );
  }

  return { svg, html };
}
