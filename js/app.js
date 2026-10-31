// Lo Shu arithmetic properties — application source.
//
// History: this file was recovered from a minified self-contained bundle
// (React 18.3.1 vendored inline, ~175KB). The vendor code now comes from the
// 'react' / 'react-dom' npm dependencies and the property data from
// '../data/properties.json' (single source of truth).
//
// Local aliases: 'h' and '_' wrap React.createElement with the original
// bundle's (type, props, key) contract (kept as-is to minimize churn from
// the original code), 'Be' is React.Fragment.

import React from "react";
import { createRoot } from "react-dom/client";
import propertiesData from "../data/properties.json" with { type: "json" };
import correspondencesData from "../data/correspondences.json" with { type: "json" };
import { createPlayer, DEFAULT_STEP_MS, frameFor, timelineRatio, ratioToTime, SPEEDS, previewFrameFor } from "./animation.js";
import { scriptFor, variantsFor, ledgerFor } from "./animation-scripts.js";
import { gn, Tl, Z, CENTERS, renderOverlay } from "./overlay.js";
import { determinant, verifyAll, holmesFamily, squaredPattern, nestBlocks, palaceCells, centralBoard, stripBoard, foldedBoard, windowAt, windowReport, magicOffsets } from "./verify.js";
import { parseNoteFile, renderNoteBlocks, isNoteBody } from "./notes.js";

// Variant scripts remain addressable by deep link, but the in-rail chooser is
// deliberately hidden until multiple animations are ready for broader use.
const SHOW_ANIMATION_VARIANT_SELECT = false;

const PROPERTIES = propertiesData,
  CORRESPONDENCES = correspondencesData,
  // Independent correspondences layers. Off clears the set; the rest toggle.
  LEGEND_LAYERS = [
    { id: "off", label: "Off" },
    { id: "elements", label: "Elements" },
    { id: "trigrams", label: "Trigrams" },
    { id: "tones", label: "Tones" },
    { id: "parity", label: "Even/odd" },
    { id: "directions", label: "Directions" },
  ],
  LEGEND_NOTES = {
    elements: "One phase per number by Later Heaven direction.",
    trigrams: "Later Heaven arrangement; center 5 has no trigram.",
    tones: "Five tones mapped via the five phases — interpretive.",
    parity: "Evens in the corners, odds as a cross.",
    directions: "Chinese map: north at the bottom.",
  },
  // Compass pins with north at the bottom (Chinese map).
  DIR_PIN = {
    North: "N",
    South: "S",
    East: "E",
    West: "W",
    Southeast: "SE",
    Southwest: "SW",
    Northeast: "NE",
    Northwest: "NW",
    Center: "C",
  },
  // Muted swatch per element, reusing the app palette plus one slate blue
  // for Water (no purple/indigo accent elsewhere in the UI).
  ELEMENT_SWATCH = {
    Wood: "#4a6741",
    Fire: "#c96442",
    Earth: "#b89a5a",
    Metal: "#6b6560",
    Water: "#4a6a8a",
  };

// createElement aliases carried over from the original bundle.
// IMPORTANT: the bundle's createElement (Wc) takes (type, props, key) — the
// optional 3rd argument is the React KEY, not a child (unlike
// React.createElement's variadic children, which would override
// props.children). Every call site below relies on key-as-3rd-arg, so h/_
// replicate that contract instead of aliasing React.createElement directly.
const Be = React.Fragment;
const keyed = (create) => (type, props, key) => {
  if (key === undefined || (props && props.key !== undefined))
    return create(type, props);
  return create(type, { ...props, key });
};
const h = keyed(React.createElement);
const _ = keyed(React.createElement);

// Per-property legend for the detail card ("Visual key"). Each entry is
// [swatchColor, label, dashed]. Replaces the old static "Pair / sum" +
// "Modulo wrap" pair that said the same thing for every property.
const VISUAL_KEYS = {
  intro: [["#1a1a1a", "Ordinal 1…9", false], ["#c96442", "Corner swap, then fold", false]],
  A: [["#c96442", "Opposite pair = 10", false], ["#1a1a1a", "Chord through 5", true]],
  B: [["#1a1a1a", "Row / column = 15", true], ["#c96442", "Diagonal = 15", false]],
  C: [["#1a1a1a", "Clockwise path", true], ["#c96442", "Carry drops the tens", false]],
  D: [["#7a6a9e", "Arm: 5 + edge → corner", false], ["#1a1a1a", "Center 5", false]],
  E: [["#1a1a1a", "Covered set", false], ["#b89a5a", "Multiple of 5", false]],
  F: [["#c96442", "Corners Σ20", false], ["#4a6741", "Edges Σ20", false]],
  G: [["#1a1a1a", "Offset from 5", false], ["#b89a5a", "Zero void", false]],
  H: [["#7a6a9e", "Arm: edge − corner = 5", false], ["#1a1a1a", "Mod-10 wrap", true]],
  I: [["#1a1a1a", "Ends average to 5", false], ["#b89a5a", "Center 5", false]],
  J: [["#b89a5a", "Rows → 492, 357, 816", false], ["#4a6741", "Columns → 438, 951, 276", false]],
  K: [["#1a1a1a", "Whole square → 360", false], ["#c96442", "Sign flips on reflect", false]],
  L: [["#1a1a1a", "|n − 5| bar", false], ["#4a6741", "Mirrored sign", false]],
  M: [["#1a1a1a", "Short hop", false], ["#7a6a9e", "Torus wrap", true]],
  N: [["#1a1a1a", "Rotation", false], ["#7a6a9e", "Reflection", false]],
  O: [["#b89a5a", "A 15-triple", false], ["#1a1a1a", "Count ×4 / ×3 / ×2", false]],
  P: [["#b89a5a", "Row products → 225", false], ["#4a6741", "Column products → 225", false]],
  Q: [["#b89a5a", "Outer rows Σ 101", false], ["#4a6741", "Outer columns Σ 89", false]],
  R: [["#1a1a1a", "Straight reading", false], ["#7a6a9e", "Broken wrap", true]],
  S: [["#1a1a1a", "Middle row", false], ["#c96442", "Middle column", false]],
  T: [["#c96442", "Opened palace", false], ["#1a1a1a", "Same square inside", false]],
  U: [["#c96442", "Active 3×3 window", false], ["#1a1a1a", "Window centre = 5", false]],
  V: [["#c96442", "Sliding window", false], ["#4a6741", "Fully magic window", false]],
  W: [["#c96442", "Shifted magic window", false], ["#b89a5a", "Aligned block", false]],
  X: [["#b89a5a", "Residue path = {0,1,2}", false], ["#4a6741", "Column path = {0,1,2}", false]],
};

const CATEGORIES = [
    { name: "Introduction", ids: ["intro", "B"] },
    { name: "Core Balance", ids: ["A", "E", "F", "L", "Q"] },
    { name: "Means & Zero", ids: ["G", "I"] },
    { name: "Lines & Totals", ids: ["J", "K", "S", "P", "R"] },
    { name: "Modular Border", ids: ["C", "D", "H"] },
    { name: "Residues & Classes", ids: ["X"] },
    { name: "Geometry & Universality", ids: ["M", "N", "O", "T"] },
    { name: "Overlapping Luoshu", ids: ["U", "V", "W"] },
  ],
  SQUARE = [4, 9, 2, 3, 5, 7, 8, 1, 6];
function iconGlyphs(e) {
  var T = "#c96442",
    G = "#4a6741",
    D = "#b89a5a",
    P = "#7a6a9e",
    C = "currentColor",
    S = { display: "block" };
  function PropertyIcon(o) {
    return h("svg", {
      width: "26",
      height: "26",
      viewBox: "0 0 28 28",
      fill: "none",
      "aria-hidden": "true",
      style: S,
      children: o,
    });
  }
  if (e === "intro")
    return PropertyIcon(
      [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) =>
        h(
          "rect",
          {
            x: 5 + (i % 3) * 6.5,
            y: 5 + Math.floor(i / 3) * 6.5,
            width: "5",
            height: "5",
            rx: "1",
            fill: i === 4 ? T : "none",
            stroke: C,
            strokeWidth: "1.1",
          },
          i,
        ),
      ),
    );
  if (e === "A")
    return PropertyIcon([
      h("path", {
        d: "M5 5 L23 23",
        stroke: T,
        strokeWidth: "1.8",
        strokeLinecap: "round",
      }),
      h("path", {
        d: "M23 5 L5 23",
        stroke: G,
        strokeWidth: "1.8",
        strokeLinecap: "round",
      }),
      h("path", {
        d: "M14 4 L14 24",
        stroke: D,
        strokeWidth: "1.5",
        strokeDasharray: "3 2",
      }),
      h("path", {
        d: "M4 14 L24 14",
        stroke: P,
        strokeWidth: "1.5",
        strokeDasharray: "3 2",
      }),
      h("circle", {
        cx: "14",
        cy: "14",
        r: "3.4",
        fill: "#fdf8f0",
        stroke: C,
        strokeWidth: "1.3",
      }),
    ]);
  if (e === "E")
    return PropertyIcon([
      h("circle", {
        cx: "14",
        cy: "14",
        r: "3.5",
        fill: "none",
        stroke: D,
        strokeWidth: "1.6",
      }),
      h("circle", {
        cx: "14",
        cy: "14",
        r: "8",
        fill: "none",
        stroke: C,
        strokeWidth: "1.2",
        strokeDasharray: "3 2",
        opacity: "0.75",
      }),
      h("circle", {
        cx: "14",
        cy: "14",
        r: "12",
        fill: "none",
        stroke: T,
        strokeWidth: "1.1",
        strokeDasharray: "2 3",
        opacity: "0.6",
      }),
      h("circle", { cx: "14", cy: "14", r: "1.6", fill: C }),
    ]);
  if (e === "F")
    return PropertyIcon([
      h("rect", { x: "5", y: "5", width: "5", height: "5", rx: "1", fill: T }),
      h("rect", { x: "18", y: "5", width: "5", height: "5", rx: "1", fill: T }),
      h("rect", { x: "5", y: "18", width: "5", height: "5", rx: "1", fill: T }),
      h("rect", {
        x: "18",
        y: "18",
        width: "5",
        height: "5",
        rx: "1",
        fill: T,
      }),
      h("rect", {
        x: "11.5",
        y: "5",
        width: "5",
        height: "5",
        rx: "1",
        fill: G,
      }),
      h("rect", {
        x: "5",
        y: "11.5",
        width: "5",
        height: "5",
        rx: "1",
        fill: G,
      }),
      h("rect", {
        x: "18",
        y: "11.5",
        width: "5",
        height: "5",
        rx: "1",
        fill: G,
      }),
      h("rect", {
        x: "11.5",
        y: "18",
        width: "5",
        height: "5",
        rx: "1",
        fill: G,
      }),
      h("rect", {
        x: "11.5",
        y: "11.5",
        width: "5",
        height: "5",
        rx: "1",
        fill: C,
      }),
    ]);
  if (e === "L")
    return PropertyIcon([
      h("path", {
        d: "M4 14 H24",
        stroke: C,
        strokeWidth: "1.2",
        opacity: "0.6",
      }),
      h("rect", {
        x: "7",
        y: "6",
        width: "3.4",
        height: "8",
        rx: "1.5",
        fill: G,
      }),
      h("rect", {
        x: "17.6",
        y: "8",
        width: "3.4",
        height: "6",
        rx: "1.5",
        fill: G,
      }),
      h("rect", {
        x: "7",
        y: "14",
        width: "3.4",
        height: "8",
        rx: "1.5",
        fill: T,
      }),
      h("rect", {
        x: "17.6",
        y: "14",
        width: "3.4",
        height: "6",
        rx: "1.5",
        fill: T,
      }),
    ]);
  if (e === "G")
    return PropertyIcon([
      h("rect", {
        x: "6",
        y: "6",
        width: "16",
        height: "16",
        rx: "2",
        stroke: C,
        strokeWidth: "1.2",
        opacity: "0.7",
      }),
      h("path", {
        d: "M6 11.3 H22 M6 16.6 H22 M11.3 6 V22 M16.6 6 V22",
        stroke: C,
        strokeWidth: "0.9",
        opacity: "0.45",
      }),
      h("circle", { cx: "14", cy: "14", r: "5", fill: C }),
      h("text", {
        x: "14",
        y: "17.5",
        textAnchor: "middle",
        fontSize: "9",
        fontWeight: "700",
        fontFamily: "monospace",
        fill: "#fdf8f0",
        children: "0",
      }),
    ]);
  if (e === "I")
    return PropertyIcon([
      h("path", {
        d: "M4 14 H24 M14 4 V24",
        stroke: C,
        strokeWidth: "1.2",
        opacity: "0.55",
      }),
      h("path", {
        d: "M6.5 6.5 L21.5 21.5 M21.5 6.5 L6.5 21.5",
        stroke: C,
        strokeWidth: "0.9",
        opacity: "0.3",
      }),
      h("circle", {
        cx: "14",
        cy: "14",
        r: "6",
        fill: "none",
        stroke: C,
        strokeWidth: "1.5",
      }),
      h("text", {
        x: "14",
        y: "17",
        textAnchor: "middle",
        fontSize: "8.5",
        fontWeight: "700",
        fontFamily: "serif",
        fontStyle: "italic",
        fill: C,
        children: "\u03bc",
      }),
    ]);
  if (e === "B")
    return PropertyIcon([
      h("path", {
        d: "M5 7.5 H23 M5 14 H23 M5 20.5 H23",
        stroke: C,
        strokeWidth: "1.2",
        opacity: "0.6",
      }),
      h("path", {
        d: "M6 6 L22 22 M22 6 L6 22",
        stroke: T,
        strokeWidth: "1.5",
        strokeLinecap: "round",
      }),
    ]);
  if (e === "J")
    return PropertyIcon([
      h("rect", {
        x: "5",
        y: "5",
        width: "18",
        height: "4.4",
        rx: "2.2",
        fill: D,
      }),
      h("rect", {
        x: "5",
        y: "11.8",
        width: "18",
        height: "4.4",
        rx: "2.2",
        fill: D,
      }),
      h("rect", {
        x: "5",
        y: "18.6",
        width: "18",
        height: "4.4",
        rx: "2.2",
        fill: C,
        opacity: "0.8",
      }),
    ]);
  if (e === "K")
    return PropertyIcon([
      h("path", {
        d: "M9 5 H6 V23 H9",
        stroke: C,
        strokeWidth: "1.7",
        fill: "none",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      h("path", {
        d: "M19 5 H22 V23 H19",
        stroke: C,
        strokeWidth: "1.7",
        fill: "none",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      h("path", {
        d: "M8.5 20 L19.5 8",
        stroke: T,
        strokeWidth: "1.8",
        strokeLinecap: "round",
      }),
    ]);
  if (e === "C")
    return PropertyIcon([
      h("rect", {
        x: "5",
        y: "5",
        width: "18",
        height: "18",
        rx: "5",
        stroke: C,
        strokeWidth: "1.5",
        strokeDasharray: "4 3",
        opacity: "0.8",
      }),
      h("path", {
        d: "M15 3.5 L20 5.5 L15.5 8",
        fill: "none",
        stroke: T,
        strokeWidth: "1.8",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
    ]);
  if (e === "D")
    return PropertyIcon([
      h("path", {
        d: "M14 14 L6 6 M14 14 L22 6 M14 14 L6 22 M14 14 L22 22",
        stroke: P,
        strokeWidth: "1.6",
        strokeLinecap: "round",
      }),
      h("circle", { cx: "14", cy: "14", r: "2.4", fill: P }),
      h("circle", { cx: "6", cy: "6", r: "1.8", fill: C }),
      h("circle", { cx: "22", cy: "6", r: "1.8", fill: C }),
      h("circle", { cx: "6", cy: "22", r: "1.8", fill: C }),
      h("circle", { cx: "22", cy: "22", r: "1.8", fill: C }),
    ]);
  if (e === "H")
    return PropertyIcon([
      h("path", {
        d: "M6 7 L12 13 M22 7 L16 13 M6 21 L12 15 M22 21 L16 15",
        stroke: T,
        strokeWidth: "1.8",
        strokeLinecap: "round",
      }),
      h("circle", { cx: "14", cy: "14", r: "2.6", fill: C }),
    ]);
  if (e === "M")
    return PropertyIcon([
      h("path", {
        d: "M6 20 H14 V8",
        stroke: C,
        strokeWidth: "1.8",
        fill: "none",
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }),
      h("path", {
        d: "M14 8 C20 10 22 16 18 22",
        stroke: P,
        strokeWidth: "1.5",
        strokeDasharray: "3 2",
        fill: "none",
        strokeLinecap: "round",
      }),
      h("circle", { cx: "6", cy: "20", r: "1.8", fill: C }),
      h("circle", { cx: "14", cy: "8", r: "1.8", fill: T }),
    ]);
  if (e === "O")
    return PropertyIcon([
      h("path", {
        d: "M5 14 H23",
        stroke: D,
        strokeWidth: "1.6",
        strokeLinecap: "round",
      }),
      h("circle", { cx: "6", cy: "14", r: "2.1", fill: C }),
      h("circle", { cx: "14", cy: "14", r: "2.1", fill: T }),
      h("circle", { cx: "22", cy: "14", r: "2.1", fill: C }),
    ]);
  if (e === "P")
    return PropertyIcon([
      h("path", {
        d: "M8 8 L20 20 M20 8 L8 20",
        stroke: T,
        strokeWidth: "1.8",
        strokeLinecap: "round",
      }),
    ]);
  if (e === "Q")
    return PropertyIcon([
      h("path", {
        d: "M5 8 H23 M5 20 H23",
        stroke: G,
        strokeWidth: "1.8",
        strokeLinecap: "round",
      }),
      h("path", {
        d: "M8 8 V20 M20 8 V20",
        stroke: C,
        strokeWidth: "1.2",
        strokeDasharray: "2 2",
      }),
    ]);
  if (e === "R")
    return PropertyIcon([
      h("path", {
        d: "M5 9 H18",
        stroke: C,
        strokeWidth: "1.7",
        strokeLinecap: "round",
      }),
      h("path", {
        d: "M14 5 L20 9 L14 13",
        stroke: C,
        strokeWidth: "1.7",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        fill: "none",
      }),
      h("path", {
        d: "M23 19 H10",
        stroke: T,
        strokeWidth: "1.7",
        strokeLinecap: "round",
      }),
      h("path", {
        d: "M14 15 L8 19 L14 23",
        stroke: T,
        strokeWidth: "1.7",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        fill: "none",
      }),
    ]);
  if (e === "T")
    return PropertyIcon([
      h("rect", {
        x: "4",
        y: "4",
        width: "20",
        height: "20",
        rx: "2",
        fill: "none",
        stroke: C,
        strokeWidth: "1.4",
      }),
      h("rect", {
        x: "10",
        y: "10",
        width: "8",
        height: "8",
        rx: "1.2",
        fill: T,
      }),
    ]);
  if (e === "U")
    return PropertyIcon([
      h("rect", { x: "4", y: "4", width: "13", height: "13", rx: "1.5", fill: "none", stroke: T, strokeWidth: "1.5" }),
      h("rect", { x: "11", y: "4", width: "13", height: "13", rx: "1.5", fill: "none", stroke: G, strokeWidth: "1.5" }),
      h("rect", { x: "4", y: "11", width: "13", height: "13", rx: "1.5", fill: "none", stroke: D, strokeWidth: "1.5" }),
      h("rect", { x: "11", y: "11", width: "13", height: "13", rx: "1.5", fill: "none", stroke: P, strokeWidth: "1.5" }),
      h("circle", { cx: "14", cy: "14", r: "2.2", fill: C }),
    ]);
  if (e === "V")
    return PropertyIcon([
      h("rect", { x: "3", y: "9", width: "22", height: "10", rx: "2", fill: "none", stroke: C, strokeWidth: "1.3", opacity: "0.7" }),
      h("rect", { x: "8", y: "7", width: "10", height: "14", rx: "1.5", fill: "none", stroke: T, strokeWidth: "1.8" }),
      h("path", { d: "M19 14 H24 M22 11 L24 14 L22 17", stroke: G, strokeWidth: "1.6", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" }),
    ]);
  if (e === "W")
    return PropertyIcon([
      h("rect", { x: "4", y: "4", width: "20", height: "20", rx: "2", fill: "none", stroke: C, strokeWidth: "1.3", opacity: "0.7" }),
      h("path", { d: "M10.7 4 V24 M17.3 4 V24 M4 10.7 H24 M4 17.3 H24", stroke: C, strokeWidth: "0.9", opacity: "0.4" }),
      h("rect", { x: "4", y: "4", width: "10", height: "10", rx: "1", fill: "none", stroke: D, strokeWidth: "1.6" }),
      h("rect", { x: "11", y: "11", width: "10", height: "10", rx: "1", fill: "none", stroke: T, strokeWidth: "1.8" }),
    ]);
  if (e === "S")
    return PropertyIcon(
      [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) =>
        h(
          "rect",
          {
            x: 5 + (i % 3) * 6.5,
            y: 5 + Math.floor(i / 3) * 6.5,
            width: "5",
            height: "5",
            rx: "1",
            fill: i === 0 || i === 4 || i === 8 ? T : "none",
            stroke: C,
            strokeWidth: "1.1",
          },
          i,
        ),
      ),
    );
  if (e === "N")
    return PropertyIcon([
      h("rect", {
        x: "4",
        y: "4",
        width: "4.5",
        height: "4.5",
        rx: "1",
        fill: "none",
        stroke: C,
        strokeWidth: "1.1",
        opacity: "0.7",
      }),
      h("rect", {
        x: "19.5",
        y: "4",
        width: "4.5",
        height: "4.5",
        rx: "1",
        fill: "none",
        stroke: C,
        strokeWidth: "1.1",
        opacity: "0.7",
      }),
      h("rect", {
        x: "4",
        y: "19.5",
        width: "4.5",
        height: "4.5",
        rx: "1",
        fill: "none",
        stroke: C,
        strokeWidth: "1.1",
        opacity: "0.7",
      }),
      h("rect", {
        x: "19.5",
        y: "19.5",
        width: "4.5",
        height: "4.5",
        rx: "1",
        fill: "none",
        stroke: C,
        strokeWidth: "1.1",
        opacity: "0.7",
      }),
      h("rect", {
        x: "11",
        y: "11",
        width: "6",
        height: "6",
        rx: "1",
        fill: T,
      }),
    ]);
  if (e === "X")
    return PropertyIcon(
      [1, 0, 2, 0, 2, 1, 2, 1, 0].map((r, i) =>
        h(
          "rect",
          {
            x: 5 + (i % 3) * 6.5,
            y: 5 + Math.floor(i / 3) * 6.5,
            width: "5",
            height: "5",
            rx: "1",
            fill: r === 0 ? D : r === 1 ? T : G,
          },
          i,
        ),
      ),
    );
  return PropertyIcon([
    h("circle", {
      cx: "14",
      cy: "14",
      r: "4",
      fill: "none",
      stroke: C,
      strokeWidth: "1.5",
    }),
  ]);
}
// Shareable step address:
// #/luoshu/math/<category>/<property>?anim=<key>&step=<1-based>&speed=<0.25|0.5|1|1.5|2|3>
// Category and property are names, for example
// #/luoshu/math/introduction/build-the-square.
// The category segment must be the property's own category. An unknown path
// does not parse. An out-of-range step falls back to step 1; unknown anim
// keys fall back to the property's default animation, and the default
// animation is omitted from written hashes.
function categorySlug(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function propertyPath(id) {
  const prop = PROPERTIES.find((p) => p.id === id);
  if (!prop?.slug) return null;
  return `#/luoshu/math/${categorySlug(prop.category)}/${prop.slug}`;
}
function parseDeepLink() {
  try {
    const m = (window.location.hash || "").match(
      /^#\/luoshu\/math\/([a-z0-9-]+)\/([a-z0-9-]+)(?:\?(.*))?$/i,
    );
    if (!m) return null;
    const prop = PROPERTIES.find(
      (p) => p.slug === m[2].toLowerCase() && categorySlug(p.category) === m[1].toLowerCase(),
    );
    if (!prop || !scriptFor(prop.id)) return null;
    const id = prop.id;
    const q = new URLSearchParams(m[3] || "");
    const rawStep = parseInt(q.get("step") || "", 10);
    const rawSpeed = parseFloat(q.get("speed") || "");
    const variantKeys = variantsFor(id).map((v) => v.key);
    const rawAnim = q.get("anim") || "";
    return {
      id,
      step: Number.isInteger(rawStep) && rawStep > 0 ? rawStep : 1,
      speed: SPEEDS.includes(rawSpeed) ? rawSpeed : 1,
      anim: variantKeys.includes(rawAnim) ? rawAnim : variantKeys[0] || null,
    };
  } catch {
    return null;
  }
}
// Tape typography: split a ledger line into operands and result on the last
// "=" or "→" so results render at the top of the equation hierarchy.
function splitLedger(entry) {
  const m = String(entry).match(/^(.*)(=|→)\s*([^=→]+)$/);
  if (!m) return { lead: String(entry), result: null, sep: "" };
  return { lead: m[1].trim(), result: m[3].trim(), sep: ` ${m[2]} ` };
}
// Formula-token sync: emphasize the formula tokens whose numbers the current
// step demonstrates. Digit-runs must match exactly, so "360" never lights up
// "362880". When the step shows a multi-digit result, single digits (like E's
// ubiquitous 5) stay quiet.
function syncNumbers(entries) {
  const runs = entries.flatMap((t) => String(t).match(/\d+/g) || []);
  const multi = runs.filter((r) => r.length > 1);
  return new Set(multi.length ? multi : runs);
}
function tokenLit(tok, nums) {
  if (!nums.size) return false;
  const runs = String(tok).match(/\d+/g) || [];
  return runs.some((r) => nums.has(r));
}
const SHEET_PLACE = { hundreds: 0, tens: 1, units: 2 };

function fmtNum(n) {
  return Number(n).toLocaleString("en-US");
}

function rotateCW(g) {
  return [g[6], g[3], g[0], g[7], g[4], g[1], g[8], g[5], g[2]];
}

function sheetShell(title, children) {
  return h(
    "section",
    {
      className: "sheet w-full max-w-none",
      "aria-label": "Figure sheet",
      children: [
        h("h2", { className: "sheet-title", children: title }, "title"),
        ...children,
      ],
    },
    "sheet",
  );
}

function struckDigits(n, strike) {
  const place = strike ? SHEET_PLACE[strike] : -1;
  const chars = String(n).padStart(3, "0").split("");
  return h(
    "span",
    {
      className: "sheet-num",
      children: chars.map((ch, i) =>
        h(
          "span",
          {
            className: i === place ? "sheet-digit sheet-digit-off" : "sheet-digit",
            children: ch,
          },
          i,
        ),
      ),
    },
    "digits",
  );
}

function renderPairSheet(payload, grid) {
  const digits = grid.length === 9 && grid.every((n) => Number.isInteger(n) && n >= 0 && n <= 9);
  if (!digits) {
    return sheetShell("Read and reverse", [
      h(
        "p",
        {
          className: "sheet-note",
          children: "A cell is no longer a single digit, so these readings break.",
        },
        "bad",
      ),
    ]);
  }
  const place = payload.strike ? SHEET_PLACE[payload.strike] : null;
  const families = payload.families || [];
  return sheetShell("Read and reverse", [
    payload.strike &&
      h(
        "p",
        {
          className: "sheet-note sheet-note-first",
          children: `${payload.strike[0].toUpperCase()}${payload.strike.slice(1)} digit removed from every reading.`,
        },
        "strike",
      ),
    ...families.map((fam) => {
      const fig = holmesFamily(grid, fam.lines, place);
      const same = fig.total === fig.revTotal;
      const column = (title, side) =>
        h(
          "div",
          {
            className: "sheet-col",
            children: [
              h("div", { className: "sheet-col-title", children: title }, "h"),
              ...fig.rows.map((row, i) =>
                h(
                  "div",
                  {
                    className: "sheet-reading",
                    children: [
                      struckDigits(side === "read" ? row.n : row.rev, payload.strike),
                      h(
                        "span",
                        {
                          className: "sheet-sq",
                          children: `² = ${fmtNum(side === "read" ? row.leftSq : row.rightSq)}`,
                        },
                        "sq",
                      ),
                    ],
                  },
                  i,
                ),
              ),
            ],
          },
          title,
        );
      return h(
        "div",
        {
          className: "sheet-family",
          children: [
            h("div", { className: "sheet-family-name", children: fam.label }, "name"),
            h(
              "div",
              { className: "sheet-cols", children: [column("Read", "read"), column("Reverse", "rev")] },
              "cols",
            ),
            h(
              "div",
              {
                className: same ? "sheet-total" : "sheet-total sheet-miss",
                children: [
                  h("span", { className: "sheet-total-label", children: "Sum of squares" }, "k"),
                  same ? fmtNum(fig.total) : `${fmtNum(fig.total)} ≠ ${fmtNum(fig.revTotal)}`,
                ],
              },
              "total",
            ),
          ],
        },
        fam.id,
      );
    }),
  ]);
}

function renderCompanionSheet(payload, grid) {
  const pattern = squaredPattern(grid);
  const showAll = payload.reveal === "all";
  const sumsOn = payload.sums === true && showAll;
  const cells = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const i = r * 3 + c;
      const on = showAll || (payload.reveal === "center" && i === 4);
      const worked = on && payload.worked === i;
      cells.push(
        h(
          "div",
          {
            className: `sheet-cell${on ? "" : " sheet-cell-empty"}${worked ? " sheet-cell-worked" : ""}`,
            children: on ? fmtNum(pattern.m[i]) : "",
          },
          `c${i}`,
        ),
      );
    }
    if (sumsOn) {
      const sum = pattern.rowSums[r];
      cells.push(
        h(
          "div",
          {
            className: sum === 225 ? "sheet-rowsum" : "sheet-rowsum sheet-miss",
            children: fmtNum(sum),
          },
          `sum${r}`,
        ),
      );
    }
  }
  const notes = [];
  if (Number.isInteger(payload.worked)) {
    const idx = payload.worked;
    const r = Math.floor(idx / 3);
    const c = idx % 3;
    const parts = [0, 1, 2].map((k) => `${grid[r * 3 + k]}·${grid[k * 3 + c]}`);
    const value = [0, 1, 2].reduce((s, k) => s + grid[r * 3 + k] * grid[k * 3 + c], 0);
    notes.push(`${parts.join(" + ")} = ${fmtNum(value)}`);
  }
  if (showAll && !pattern.ok)
    notes.push("This M² is no longer one diagonal value and one other value with rows of 225.");
  if (payload.compareTurn) {
    const turned = squaredPattern(rotateCW(grid));
    notes.push(
      pattern.ok && turned.ok
        ? `This pose is ${fmtNum(pattern.diag)} and ${fmtNum(pattern.off)}. A quarter turn is ${fmtNum(turned.diag)} and ${fmtNum(turned.off)}. Each row still sums to 225.`
        : "A quarter turn changes the square. The rows of M² are no longer all 225.",
    );
  }
  return sheetShell("Squared matrix", [
    h(
      "div",
      {
        className: sumsOn ? "sheet-companion sheet-companion-sums" : "sheet-companion",
        children: cells,
      },
      "grid",
    ),
    ...notes.map((text, i) => h("p", { className: "sheet-note", children: text }, `note-${i}`)),
  ]);
}

function compoundCell(value, key, marked) {
  return h(
    "div",
    {
      className: `sheet-cell${marked ? " sheet-cell-worked" : ""}`,
      children: fmtNum(value),
    },
    key,
  );
}

function renderCompoundSheet(payload, grid, baseGrid) {
  if (!Array.isArray(grid) || grid.length !== 9) return null;
  // Zoom beats re-base the board with setValues; the inner square stays the
  // un-zoomed base grid so the figures remain the true middle thirds.
  const inner =
    payload.inner === "base" && Array.isArray(baseGrid) && baseGrid.length === 9 ? baseGrid : grid;
  if (payload.scope === "palace") {
    const P = payload.palace;
    const cells = palaceCells(grid, P);
    const rows = [0, 1, 2].map((r) => cells[r * 3] + cells[r * 3 + 1] + cells[r * 3 + 2]);
    const expect = 27 * (P - 1) + 15;
    const agree = rows.every((s) => s === expect);
    const markAt = payload.mark == null ? -1 : grid.indexOf(payload.mark);
    const body = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const i = r * 3 + c;
        body.push(compoundCell(cells[i], `c${i}`, i === markAt));
      }
      body.push(
        h(
          "div",
          {
            className: agree ? "sheet-rowsum" : "sheet-rowsum sheet-miss",
            children: fmtNum(rows[r]),
          },
          `sum${r}`,
        ),
      );
    }
    const notes = [];
    if (payload.mark != null && markAt >= 0)
      notes.push(`${P}-${payload.mark} = ${fmtNum(9 * (P - 1) + payload.mark)}`);
    if (payload.mark != null) {
      const center = grid[4];
      notes.push(`${center}-${center} = ${fmtNum(9 * (center - 1) + center)}`);
    }
    if (!agree) notes.push(`These lines no longer each sum to ${fmtNum(expect)}.`);
    return sheetShell(`Palace ${P}`, [
      h("div", { className: "sheet-companion sheet-companion-sums", children: body }, "grid"),
      ...notes.map((text, i) => h("p", { className: "sheet-note", children: text }, `note-${i}`)),
    ]);
  }
  const big = nestBlocks(grid, inner);
  const palaces = [];
  for (let bi = 0; bi < 3; bi++) {
    for (let bj = 0; bj < 3; bj++) {
      const cells = [];
      for (let a = 0; a < 3; a++) {
        for (let b = 0; b < 3; b++) {
          const i = (bi * 3 + a) * 9 + (bj * 3 + b);
          cells.push(compoundCell(big[i], `c${i}`, false));
        }
      }
      palaces.push(h("div", { className: "sheet-palace", children: cells }, `p${bi}${bj}`));
    }
  }
  const lineSum = (cells) => cells.reduce((s, i) => s + big[i], 0);
  const lines = [];
  for (let r = 0; r < 9; r++) lines.push(lineSum([0, 1, 2, 3, 4, 5, 6, 7, 8].map((c) => r * 9 + c)));
  for (let c = 0; c < 9; c++) lines.push(lineSum([0, 1, 2, 3, 4, 5, 6, 7, 8].map((r) => r * 9 + c)));
  lines.push(lineSum([0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => i * 9 + i)));
  lines.push(lineSum([0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => i * 9 + (8 - i))));
  const agree = lines.every((s) => s === lines[0]);
  const center = big[40];
  const deep = nestBlocks(big, inner);
  const again = nestBlocks(deep, inner);
  const rowSum = (g) => {
    const n = Math.sqrt(g.length);
    let s = 0;
    for (let c = 0; c < n; c++) s += g[c];
    return s;
  };
  const opp = big[0] + big[80];
  const notes = [
    agree
      ? `Every line sums to ${fmtNum(lines[0])}.`
      : `The lines no longer agree. The first row sums to ${fmtNum(lines[0])}.`,
    `Opposite cells through the center sum to ${fmtNum(opp)}.`,
    `Center path: ${fmtNum(grid[4])}, ${fmtNum(center)}, ${fmtNum(deep[364])}, ${fmtNum(again[3280])}.`,
    `729 cells, first row ${fmtNum(rowSum(deep))}. 6,561 cells, first row ${fmtNum(rowSum(again))}.`,
  ];
  return sheetShell("Nine palaces", [
    h(
      "div",
      { className: "sheet-compound-scroll", children: h("div", { className: "sheet-compound", children: palaces }, "grid") },
      "scroll",
    ),
    ...notes.map((text, i) => h("p", { className: "sheet-note", children: text }, `note-${i}`)),
  ]);
}

const OVERLAP_BOARDS = {
  central: { title: "Five by five — four overlapping Lo Shu", cols: 5, make: () => centralBoard() },
  strip: { title: "Magic strip — sliding window", cols: 11, make: () => stripBoard() },
  folded: { title: "Nine by nine — folded tiling", cols: 9, make: () => foldedBoard() },
  compound: { title: "Yang Hui compound 9×9", cols: 9, make: (base) => nestBlocks(base, base) },
};

function renderOverlapSheet(payload, baseGrid) {
  const spec = OVERLAP_BOARDS[payload.board] || OVERLAP_BOARDS.central;
  const board = spec.make(baseGrid && baseGrid.length === 9 ? baseGrid : SQUARE);
  const cols = spec.cols;
  const size = cols >= 11 ? 22 : cols >= 9 ? 24 : 32;
  const hasWindow = Number.isInteger(payload.wr) && Number.isInteger(payload.wc);
  const inWindow = new Set();
  if (hasWindow)
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) inWindow.add((payload.wr + a) * cols + payload.wc + b);
  const magic = payload.all ? magicOffsets(board, cols) : [];
  const inMagic = new Set();
  for (const [r, c] of magic)
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) inMagic.add((r + a) * cols + (c + b));
  const centreIdx = payload.board === "central" ? 12 : -1;
  const cells = board.map((v, i) => {
    let cls = "sheet-overlap-cell";
    if (inMagic.has(i)) cls += " sheet-overlap-magic";
    if (inWindow.has(i)) cls += " sheet-overlap-active";
    if (i === centreIdx) cls += " sheet-overlap-centre";
    return h("div", { className: cls, style: { width: size, height: size, fontSize: size <= 24 ? 11 : 13 }, children: fmtNum(v) }, `c${i}`);
  });
  const notes = [];
  if (payload.all) {
    notes.push(
      payload.board === "strip"
        ? "Every window: rows and columns sum to 15. Fully magic at offsets 0, 3, 6."
        : `${magic.length} fully magic windows at even offsets.`,
    );
  } else if (hasWindow) {
    // Compound windows sum to their own constant, not 15: judge them by
    // whether all eight lines agree.
    if (payload.board === "compound") {
      const w = windowAt(board, cols, payload.wr, payload.wc);
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6],
      ].map((line) => line.reduce((s, i) => s + w[i], 0));
      const agree = lines.every((s) => s === lines[0]);
      notes.push(
        agree
          ? `Window (${payload.wr},${payload.wc}): all eight lines sum to ${fmtNum(lines[0])} — magic.`
          : `Window (${payload.wr},${payload.wc}): lines disagree (${lines.map(fmtNum).join(", ")}) — not magic.`,
      );
    } else {
      const rep = windowReport(board, cols, payload.wr, payload.wc);
      notes.push(
        `Window (${payload.wr},${payload.wc}): rows ${rep.rows.join(", ")} · columns ${rep.cols.join(", ")} · diagonals ${rep.diags.join(", ")}.`,
      );
      notes.push(rep.magic ? "Fully magic — every line sums to 15." : rep.rowsCols ? "Rows and columns hold at 15; the diagonals do not." : "Not magic.");
    }
  }
  if (payload.board === "central" && !payload.all)
    notes.push("Each corner window is centred on 5; all four meet at the centre cell.");
  return sheetShell(spec.title, [
    h(
      "div",
      {
        className: "sheet-compound-scroll",
        children: h(
          "div",
          { className: "sheet-overlap", style: { gridTemplateColumns: `repeat(${cols}, ${size}px)` }, children: cells },
          "grid",
        ),
      },
      "scroll",
    ),
    ...notes.map((text, i) => h("p", { className: "sheet-note", children: text }, `note-${i}`)),
  ]);
}

function renderSheet(payload, grid, baseGrid) {
  if (!payload) return null;
  if (payload.kind === "pairs") return renderPairSheet(payload, grid);
  if (payload.kind === "companion") return renderCompanionSheet(payload, grid);
  if (payload.kind === "compound") return renderCompoundSheet(payload, grid, baseGrid);
  if (payload.kind === "overlap") return renderOverlapSheet(payload, baseGrid);
  return null;
}

// A reusable compact display mode for dense controls. Consumers supply their
// grouped options (or checkbox list) while this component owns the common
// trigger, label, menu placement, and expanded state semantics.
function CompactDropdown({
  label,
  summary,
  open,
  onToggle,
  children,
  className = "",
  triggerClassName = "",
  menuClassName = "",
  ariaLabel,
}) {
  return _("div", {
    className: `compact-dropdown ${className}`,
    children: [
      label &&
        h("span", {
          className: "compact-dropdown-label",
          children: label,
        }),
      _("button", {
        type: "button",
        className: `compact-dropdown-trigger ${triggerClassName}`,
        "aria-expanded": open ? "true" : "false",
        "aria-haspopup": "listbox",
        "aria-label": ariaLabel || label,
        onClick: onToggle,
        children: [
          summary,
          h("svg", {
            className: `compact-dropdown-chevron ${open ? "rotate-180" : ""}`,
            width: "16",
            height: "16",
            viewBox: "0 0 16 16",
            fill: "none",
            "aria-hidden": "true",
            children: h("path", {
              d: "M3 6 L8 11 L13 6",
              stroke: "currentColor",
              strokeWidth: "1.5",
              strokeLinecap: "round",
              strokeLinejoin: "round",
            }),
          }),
        ],
      }),
      open &&
        _("div", {
          className: `compact-dropdown-menu ${menuClassName}`,
          role: "listbox",
          "aria-label": ariaLabel || label,
          children,
        }),
    ],
  });
}

function LoShuApp() {
  let [e, n] = React.useState(() => parseDeepLink()?.id || "intro"),
    // Active animation variant for the selected property. One select in the
    // rail switches it; switching properties resets to that id's default.
    [variant, setVariant] = React.useState(() => parseDeepLink()?.anim || "standard"),
    [t, r] = React.useState(() => new Set(CATEGORIES.map((i) => i.name))),
    [mobileCatalogOpen, setMobileCatalogOpen] = React.useState(false),
    [mobileCorrespondencesOpen, setMobileCorrespondencesOpen] = React.useState(false),
    [mobileView, setMobileView] = React.useState("matrix"),
    [isMobilePortrait, setIsMobilePortrait] = React.useState(
      () => typeof window !== "undefined" && window.matchMedia?.("(max-width: 599px) and (orientation: portrait)").matches,
    ),
    l = React.useRef(null),
    o = React.useMemo(() => PROPERTIES.find((i) => i.id === e) || null, [e]),
    activeCategory = CATEGORIES.find((i) => i.ids.includes(e)),
    u = (i) => {
      r((a) => {
        let m = new Set(a);
        if (m.has(i)) m.delete(i);
        else m.add(i);
        return m;
      });
    },
    s = (i) => {
      setVariant(variantsFor(i)[0]?.key || "standard");
      setMobileCatalogOpen(false);
      if ((n(i), window.innerWidth < 1024))
        setTimeout(() => {
          l.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
    },
    script = scriptFor(e, variant),
    playerRef = React.useRef(null),
    [frame, setFrame] = React.useState(null),
    // Last triple rendered into React state. Progress-only rAF ticks update
    // the --anim-p custom property directly and skip setState, so playback
    // no longer re-renders the whole app ~60x/s.
    lastRenderRef = React.useRef(null),
    [started, setStarted] = React.useState(false),
    [animPlaying, setAnimPlaying] = React.useState(false),
    [animSpeed, setAnimSpeed] = React.useState(1),
    // Loop wraps the last step back to the first instead of stopping.
    // loopRef mirrors the state for the player effect and key handler.
    [animLoop, setAnimLoop] = React.useState(false),
    // Overview shows the accumulated full-script diagram while playback
    // stays on its step; the toggle reveals the whole diagram on demand.
    [overview, setOverview] = React.useState(false),
    loopRef = React.useRef(false),
    startedRef = React.useRef(false),
    animLoopToggle = () => {
      const next = !loopRef.current;
      loopRef.current = next;
      setAnimLoop(next);
      try {
        playerRef.current?.setLoop(next);
      } catch {}
    },
    // Active correspondences layers (empty set = plain numbers).
    [legend, setLegend] = React.useState(() => new Set()),
    // Worked-example tape: hovered row (preview that step's cells on the
    // board) and probed cell (transient focus or sticky click, emphasizing
    // the tape rows that use it).
    [hoverStep, setHoverStep] = React.useState(null),
    [focusCell, setFocusCell] = React.useState(null),
    [stickyCell, setStickyCell] = React.useState(null),
    // What-breaks playground: an idle-mode swapped grid (null = Lo Shu),
    // the armed swap cell, and whether the playground section is open.
    [playground, setPlayground] = React.useState(false),
    [playGrid, setPlayGrid] = React.useState(null),
    [swapArm, setSwapArm] = React.useState(null),
    // Optional property notes, rendered from Markdown files under notes/.
    // A missing file means the property has no note (cached as null) and
    // the Notes section stays hidden.
    [propertyNotes, setPropertyNotes] = React.useState(() => ({}));
  React.useEffect(() => {
    const query = window.matchMedia?.("(max-width: 599px) and (orientation: portrait)");
    if (!query) return undefined;
    const update = () => {
      setIsMobilePortrait(query.matches);
      if (!query.matches) {
        setMobileCatalogOpen(false);
        setMobileCorrespondencesOpen(false);
      }
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  React.useEffect(() => {
    if (!o || propertyNotes[o.id] !== undefined) return undefined;
    let alive = true;
    fetch(`notes/${o.id}.md`).then(
      (res) => {
        if (!res.ok) return null;
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("html")) return null;
        return res.text().then((text) => (isNoteBody(contentType, text) ? text : null));
      },
      () => null,
    ).then((text) => {
      if (alive)
        setPropertyNotes((prev) =>
          prev[o.id] === undefined ? { ...prev, [o.id]: text } : prev,
        );
    });
    return () => {
      alive = false;
    };
  }, [o, propertyNotes]);
  const toggleLegend = (id) => {
    // Correspondence labels occupy the same small cells as the animation.
    // Selecting a layer must therefore leave the board in its stable state;
    // otherwise the chip appears selected but its labels stay hidden by the
    // animation-only rendering gate below.
    if (id !== "off" && started) {
      playerRef.current?.reset();
      setStarted(false);
    }
    if (id === "off") {
      setLegend(new Set());
      return;
    }
    setLegend((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  // Ref mirror so the mount-once keyboard handler can branch on it.
  startedRef.current = started;
  // Deep link frozen at selection time: the player effect re-runs under
  // StrictMode and the hash-sync effect below rewrites the hash, so reading
  // it fresh inside the effect would land on step 1 the second time.
  const deepRef = React.useRef({ e: null, deep: null });
  if (deepRef.current.e !== e) deepRef.current = { e, deep: parseDeepLink() };
  const deepSel = deepRef.current;
  React.useEffect(() => {
    if (playerRef.current) playerRef.current.dispose();
    playerRef.current = null;
    // A new player is a new frame stream: drop the render-dedup cache, or
    // the first identical frame (e.g. a deep-link seek re-applied after a
    // StrictMode remount) is swallowed as progress-only noise.
    lastRenderRef.current = null;
    setStarted(false);
    setOverview(false);
    setAnimPlaying(false);
    setAnimSpeed(1);
    setHoverStep(null);
    setFocusCell(null);
    setStickyCell(null);
    if (!script) {
      setFrame(null);
      return;
    }
    const p = createPlayer(script, {
      loop: loopRef.current,
      reducedMotion: () =>
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      onFrame: (f) => {
        const sig = f.visibleKeys.join("|");
        const last = lastRenderRef.current;
        if (
          !last ||
          last.stepIndex !== f.stepIndex ||
          last.playing !== f.playing ||
          last.speed !== f.speed ||
          last.sig !== sig
        ) {
          lastRenderRef.current = {
            stepIndex: f.stepIndex,
            playing: f.playing,
            speed: f.speed,
            sig,
          };
          setFrame(f);
          setAnimPlaying(f.playing);
          setAnimSpeed(f.speed);
        }
        const root = l.current?.parentElement;
        const stage = root?.querySelector("[data-anim-stage]");
        if (stage) stage.style.setProperty("--anim-p", String(f.progress ?? 0));
        const scrub = root?.querySelector("[data-anim-scrub]");
        if (scrub && document.activeElement !== scrub) {
          scrub.value = String(Math.round(timelineRatio(script, f.stepIndex, f.stepElapsed) * 1000));
        }
      },
    });
    playerRef.current = p;
    setFrame(p.getState());
    // A deep link lands paused on its step, fully revealed: the shared
    // address must show the same frame the sender saw.
    const deep = deepSel.deep;
    if (deep && deep.id === e) {
      if (deep.speed !== 1) {
        try {
          p.setSpeed(deep.speed);
        } catch {}
        setAnimSpeed(deep.speed);
      }
      if (deep.step > 1) {
        const idx = Math.min(deep.step, script.steps.length) - 1;
        p.seekAt(idx, script.steps[idx].durationMs || DEFAULT_STEP_MS);
        setStarted(true);
      }
    }
    fadeStage();
    return () => p.dispose();
  }, [e, variant]);
  // Keep the address bar on the visible step so any step is shareable.
  // replaceState avoids history spam while scrubbing or looping.
  React.useEffect(() => {
    try {
      const step = started && frame ? frame.stepIndex + 1 : 1;
      const vDefault = variantsFor(e)[0]?.key;
      const animPart = variant && variant !== vDefault ? `&anim=${variant}` : "";
      const path = propertyPath(e);
      if (path) window.history.replaceState(null, "", `${path}?step=${step}${animPart}`);
    } catch {}
  }, [e, variant, started, frame && frame.stepIndex]);
  // Playback shortcuts. Space toggles (preventDefault also blocks the button
  // activation when a control has focus), arrows step, R resets.
  React.useEffect(() => {
    const onKey = (ev) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const t = ev.target;
      if (
        t &&
        (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)
      )
        return;
      const p = playerRef.current;
      if (!p) return;
      if (ev.key === " ") {
        ev.preventDefault();
        if (p.getState().playing) p.pause();
        else {
          setStarted(true);
          p.play();
        }
      } else if (ev.key === "ArrowRight") {
        ev.preventDefault();
        // The preview already shows step 1, so Next advances past it.
        setStarted(true);
        p.stepNext();
      } else if (ev.key === "ArrowLeft") {
        ev.preventDefault();
        setStarted(true);
        p.stepPrev();
      } else if (ev.key === "r" || ev.key === "R") {
        p.reset();
        setStarted(false);
        setOverview(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const animPlay = () => {
      if (!playerRef.current) return;
      // Idle overview fades into the first gated frame instead of cutting.
      if (!startedRef.current) fadeStage();
      setStarted(true);
      playerRef.current.play();
    },
    animPause = () => playerRef.current?.pause(),
    animNext = () => {
      if (!playerRef.current) return;
      // The preview already shows the first step, so Next advances past it.
      setStarted(true);
      playerRef.current.stepNext();
    },
    animPrev = () => {
      if (!playerRef.current) return;
      setStarted(true);
      playerRef.current.stepPrev();
    },
    animReset = () => {
      playerRef.current?.reset();
      setStarted(false);
      setOverview(false);
    },
    // What-breaks playground: entering pauses playback and clears transient
    // attention; exiting keeps the swapped grid (Restore clears it).
    playgroundToggle = () => {
      const next = !playground;
      if (next) {
        playerRef.current?.reset();
        setStarted(false);
        setHoverStep(null);
        setFocusCell(null);
        setStickyCell(null);
        setSwapArm(null);
      } else {
        setSwapArm(null);
      }
      setPlayground(next);
    },
    // Playback continuity: player-clock stage fade. The diagram itself stays
    // player-driven; only the stage container eases from 0 to 1 over ~350ms
    // of wall time so Play and property switches land instead of cutting.
    // Reduced motion (or no rAF, as in tests) settles instantly.
    fadeStage = () => {
      let stage = null;
      try {
        stage = l.current?.parentElement?.querySelector("[data-anim-stage]");
      } catch {}
      if (!stage) return;
      let reduce = typeof requestAnimationFrame !== "function";
      try {
        reduce =
          reduce || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      } catch {}
      if (reduce) {
        try {
          stage.style.setProperty("--stage-in", "1");
        } catch {}
        return;
      }
      const t0 = Date.now();
      try {
        stage.style.setProperty("--stage-in", "0");
      } catch {}
      const step = () => {
        const v = Math.min(1, (Date.now() - t0) / 350);
        try {
          stage.style.setProperty("--stage-in", String(v));
        } catch {}
        if (v < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    // Overlay gate: while a script frame is on the board (preview or
    // playback), only its revealed keys are shown; idle (or another
    // property) renders everything as before.
    showKey = (id, key) =>
      !(
        boardOn &&
        script &&
        script.id === id &&
        showFrame &&
        !showFrame.visibleKeys.includes(key)
      );
  // Pre-play preview: before Play, the board shows previewFrameFor(script)
  // while the player itself stays at step 0 / elapsed 0. Correspondences
  // and the playground suppress it — they keep the plain square.
  const previewFrame =
    script && !started && legend.size === 0 && !playground
      ? previewFrameFor(script)
      : null;
  const showFrame = started ? frame : previewFrame;
  const boardOn = !!(script && showFrame && (started ? frame : previewFrame));
  const captionFrame =
    script && (boardOn && showFrame ? showFrame : frameFor(script, 0, 1));
  const captionText =
    (captionFrame?.caption || "").trim() ||
    (script ? `Play to watch: ${script.title}.` : "");
  const drawItems =
    script && (boardOn && showFrame && !overview ? showFrame.draw : frameFor(script, script.steps.length - 1, 1).draw);
  const ov = renderOverlay(drawItems || [], {
    enteringKeys: boardOn && showFrame && !overview ? showFrame.enteringKeys : [],
  });
  // Tape linking: the hovered row previews its step's cells on the board;
  // the probed cell (keyboard focus or sticky click) picks out its rows.
  // Formula sync lights the formula tokens the current step demonstrates.
  // What breaks: the live grid is the swapped one when set, else Lo Shu.
  // The checklist and the computed claim status both read this grid.
  const playBase = playGrid ?? SQUARE,
    playResults = verifyAll(playBase);
  // Gated playback reveals the sheet with the step. Idle and Overview keep
  // the last step's sheet. The numbers follow the board: a turn's setValues
  // while playback is running, otherwise the playground grid or the Lo Shu.
  // Idle must not apply the last setValues, or N's resting board would leave
  // the Lo Shu.
  const sheetFrame =
    script &&
    (boardOn && showFrame && !overview
      ? showFrame
      : frameFor(script, script.steps.length - 1, 1));
  const sheetPayload = sheetFrame?.sheet || null;
  const noteText = o ? propertyNotes[o.id] : null;
  const noteFile =
    typeof noteText === "string" && noteText !== "" ? parseNoteFile(noteText) : null;
  const noteBlocks =
    noteFile && !noteFile.hidden && noteFile.blocks.length ? noteFile.blocks : null;
  const sheetGrid = (() => {
    if (boardOn && frame?.setValues && showFrame?.setValues) {
      const g = Array.from({ length: 9 }, (_, i) => showFrame.setValues[i]);
      if (g.every((n) => typeof n === "number")) return g;
    }
    return playBase;
  })();
  const probeCell = focusCell ?? stickyCell,
    hoverCells =
      hoverStep != null && script && script.steps[hoverStep]
        ? script.steps[hoverStep].matrix.highlight || []
        : [],
    // The frame can briefly outlive a property switch (the new player mounts
    // in the effect), so clamp its step to the incoming script.
    syncNums =
      boardOn && showFrame && script
        ? syncNumbers(
            ledgerFor(
              script.steps[Math.min(showFrame.stepIndex, script.steps.length - 1)],
            ),
          )
        : new Set();
  const moves = boardOn && showFrame?.moves ? showFrame.moves : [];
  const moving = new Set(moves.flatMap((m) => [m.from, m.to]));
  // In-board nesting (property T): expand opened cells into their palaces.
  // Values stay derived from the 3×3 sheetGrid; minis are computed at render.
  const nestMode = boardOn && showFrame?.nest ? showFrame.nest : null;
  const flyers = moves.map((m) =>
    h(
      "span",
      {
        className: "anim-flyer",
        style: {
          left: `calc((1 - var(--anim-p)) * ${CENTERS[m.from].x}px + var(--anim-p) * ${CENTERS[m.to].x}px)`,
          top: `calc((1 - var(--anim-p)) * ${CENTERS[m.from].y}px + var(--anim-p) * ${CENTERS[m.to].y}px)`,
        },
        children: showFrame.setValues?.[m.to],
      },
      `${m.from}-${m.to}`,
    ),
  );
  const formLine = (() => {
    if (!(script?.id === "N" && captionFrame?.setValues)) return "";
    const g = Array.from({ length: 9 }, (_, i) => captionFrame.setValues[i]);
    if (g.some((n) => typeof n !== "number")) return "";
    const det = determinant(g);
    const sign = det < 0 ? "−" : "+";
    return `Lines sum to 15. det = ${sign}${Math.abs(det)}.`;
  })();
  const d4Strip =
    o?.id === "N" &&
    script &&
    h("div", {
      className: "d4-strip",
      role: "group",
      "aria-label": "Eight forms of the square",
      children: script.steps.map((st, i) => {
        const g = Array.from({ length: 9 }, (_, d) => st.matrix.setValues[d]);
        const pressed = i === (boardOn && showFrame ? showFrame.stepIndex : 0);
        return h(
          "button",
          {
            type: "button",
            className: "d4-thumb",
            "aria-label": st.caption,
            "aria-pressed": pressed ? "true" : "false",
            onClick: () => {
              if (!playerRef.current) return;
              setStarted(true);
              playerRef.current.seekAt(i, st.durationMs || DEFAULT_STEP_MS);
            },
            children: g.map((num, d) => h("span", { children: num }, d)),
          },
          i,
        );
      }),
    });
  return _("div", {
    className:
      "min-h-screen w-full text-[var(--ink)] selection:bg-[#1a1a1a] selection:text-[#fdf8f0]",
    style: {
      backgroundColor: "#fdf8f0",
      backgroundImage:
        "radial-gradient(1200px 600px at 20% -10%, rgba(184,154,90,0.18), transparent), radial-gradient(900px 500px at 90% 110%, rgba(201,100,66,0.12), transparent), radial-gradient(800px 400px at 50% 50%, rgba(122,106,158,0.06), transparent)",
    },
    children: [
      _("div", {
        className:
          "mx-auto max-w-[1280px] flex flex-col lg:flex-row min-h-[calc(100vh-60px)]",
        children: [
          _("aside", {
            className:
              "w-full lg:w-[380px] shrink-0 border-b lg:border-b-0 lg:border-r border-[#1a1a1a]/[0.08] flex flex-col",
            children: [
              _("div", {
                className: "px-6 lg:px-8 pt-4 pb-3",
                children: [
                  _("h1", {
                    className:
                      "font-[700] tracking-[-0.02em] leading-none text-[22px] lg:text-[24px]",
                    style: {
                      fontFamily:
                        "'Instrument Serif', 'Times New Roman', serif",
                    },
                    children: ["LUO SHU"],
                  }),
                ],
              }),
              h("div", {
                className:
                  "flex-1 overflow-auto lg:overflow-visible px-3 lg:px-4 pb-6",
                children: CATEGORIES.map((i) => {
                  let a = t.has(i.name),
                    m = i.ids.map((d) => PROPERTIES.find((v) => v.id === d));
                  return _(
                    "div",
                    {
                      className: "mb-5",
                      children: [
                        _("button", {
                          onClick: () => u(i.name),
                          className:
                            "w-full flex items-center justify-between px-3 py-2.5 group",
                          children: [
                            h("span", {
                              className:
                                "text-[12.5px] tracking-[0.18em] uppercase font-mono font-bold opacity-70 group-hover:opacity-100 transition-opacity",
                              children: i.name,
                            }),
                            h("span", {
                              className: `transition-transform duration-200 ${a ? "rotate-180" : ""}`,
                              children: h("svg", {
                                width: "12",
                                height: "12",
                                viewBox: "0 0 12 12",
                                fill: "none",
                                children: h("path", {
                                  d: "M2 4 L6 8 L10 4",
                                  stroke: "currentColor",
                                  strokeWidth: "1.2",
                                  strokeLinecap: "round",
                                  strokeLinejoin: "round",
                                }),
                              }),
                            }),
                          ],
                        }),
                        a &&
                          h("div", {
                            className:
                              "mt-1 grid grid-cols-1 lg:grid-cols-2 gap-2",
                            children: m.map((d) => {
                              let v = e === d.id;
                              return _(
                                "button",
                                {
                                  onClick: () => s(d.id),
                                  className: `catalog-tile w-full text-left flex items-start gap-3 px-3 py-3 rounded-[10px] transition-all border ${v ? "bg-[#1a1a1a] text-[#fdf8f0] border-[#1a1a1a] shadow-[0_4px_20px_rgba(0,0,0,0.18)]" : "bg-transparent border-transparent hover:bg-[#1a1a1a]/[0.06] hover:border-[#1a1a1a]/[0.06]"}`,
                                  style: { height: 120 },
                                  children: [
                                    h("span", {
                                      className: `shrink-0 w-10 h-10 rounded-[8px] flex items-center justify-center border overflow-hidden ${v ? "bg-[#fdf8f0]/10 border-[#fdf8f0]/20 text-[#fdf8f0]" : "bg-white border-[#1a1a1a]/10 text-[#1a1a1a]/70"}`,
                                      title: d.title,
                                      children: iconGlyphs(d.id),
                                    }),
                                    _("span", {
                                      className: "flex-1 min-w-0 overflow-hidden",
                                      children: [
                                        h("span", {
                                          className: `catalog-tile-title block text-[16px] leading-[1.2] font-medium ${v ? "text-[#fdf8f0]" : "text-[#1a1a1a]"}`,
                                          style: {
                                            fontFamily:
                                              "'Instrument Serif', serif",
                                          },
                                          children: d.title,
                                        }),
                                        h("span", {
                                          className: `catalog-tile-desc block mt-1 text-[12.5px] leading-[1.35] font-mono ${v ? "text-[#fdf8f0]/60" : "opacity-55"}`,
                                          children: d.shortDesc,
                                        }),
                                      ],
                                    }),
                                  ],
                                },
                                d.id,
                              );
                            }),
                          }),
                      ],
                    },
                    i.name,
                  );
                }),
              }),
            ],
          }),
          _("main", {
            className:
              "flex-1 flex flex-col items-center lg:items-stretch px-4 lg:px-12 py-8 lg:py-10 gap-8",
            children: [
              h("div", {
                className: "w-full flex flex-col items-center",
                children: [
                  isMobilePortrait &&
                    h(CompactDropdown, {
                      className: "mobile-property-select",
                      label: "LUO SHU",
                      ariaLabel: "Lo Shu properties",
                      open: mobileCatalogOpen,
                      onToggle: () => setMobileCatalogOpen((open) => !open),
                      triggerClassName: "mobile-property-select-trigger",
                      menuClassName: "mobile-property-select-menu",
                      summary: _("span", {
                        className: "mobile-property-select-current",
                        children: [
                          h("span", {
                            className: "mobile-property-select-kicker",
                            children: activeCategory?.name || "Property",
                          }),
                          h("span", {
                            className: "mobile-property-select-title",
                            children: o?.title || "Choose a property",
                          }),
                        ],
                      }),
                      children: CATEGORIES.map((category) =>
                        _(
                          "section",
                          {
                            className: "mobile-property-select-group",
                            children: [
                              h("h2", {
                                className: "mobile-property-select-group-label",
                                children: category.name,
                              }),
                              _("div", {
                                className: "mobile-property-select-options",
                                children: category.ids.map((id) => {
                                  const property = PROPERTIES.find((item) => item.id === id),
                                    selected = id === e;
                                  return _(
                                    "button",
                                    {
                                      type: "button",
                                      role: "option",
                                      "aria-selected": selected ? "true" : "false",
                                      className: `mobile-property-select-option ${selected ? "mobile-property-select-option-active" : ""}`,
                                      onClick: () => s(id),
                                      children: [
                                        h("span", {
                                          className: "mobile-property-select-icon",
                                          children: iconGlyphs(id),
                                        }),
                                        _("span", {
                                          className: "mobile-property-select-option-copy",
                                          children: [
                                            h("span", {
                                              className: "mobile-property-select-option-title",
                                              children: property.title,
                                            }),
                                            h("span", {
                                              className: "mobile-property-select-option-desc",
                                              children: property.shortDesc,
                                            }),
                                          ],
                                        }),
                                      ],
                                    },
                                    id,
                                  );
                                }),
                              }),
                            ],
                          },
                          category.name,
                        ),
                      ),
                    }),
                  isMobilePortrait &&
                    _("div", {
                      className: "mobile-view-tabs",
                      role: "tablist",
                      "aria-label": "Property view",
                      children: [
                        h("button", {
                          type: "button",
                          role: "tab",
                          className: mobileView === "matrix" ? "mobile-view-tab-active" : "",
                          "aria-selected": mobileView === "matrix" ? "true" : "false",
                          onClick: () => setMobileView("matrix"),
                          children: "Matrix",
                        }, "matrix"),
                        h("button", {
                          type: "button",
                          role: "tab",
                          className: mobileView === "property" ? "mobile-view-tab-active" : "",
                          "aria-selected": mobileView === "property" ? "true" : "false",
                          onClick: () => setMobileView("property"),
                          children: "Property",
                        }, "property"),
                      ],
                    }),
                  _("div", {
                    className: "relative",
                    "data-mobile-view": isMobilePortrait ? mobileView : undefined,
                    children: [
                    h("div", {
                      ref: l,
                      className:
                        "relative bg-white rounded-[22px] shadow-[0_20px_60px_rgba(0,0,0,0.08),0_1px_0_rgba(0,0,0,0.06)_inset] p-5 lg:p-7 border border-[#1a1a1a]/[0.06]",
                      children: [
                        script &&
                          _("div", {
                            className: "panel-playback",
                            role: "group",
                            "aria-label": "Playback",
                            children: [
                              h("button", {
                                onClick: animPlaying ? animPause : animPlay,
                                className: "anim-rail-btn anim-rail-play anim-caption-play",
                                "aria-label": animPlaying
                                  ? "Pause animation"
                                  : "Play animation",
                                title: animPlaying ? "Pause (Space)" : "Play (Space)",
                                children: animPlaying ? "❚❚" : "▶",
                              }),
                              h("button", {
                                onClick: () => setOverview((v) => !v),
                                className: "anim-rail-btn anim-caption-overview",
                                "aria-label": "Overview diagram",
                                "aria-pressed": overview ? "true" : "false",
                                title: "Overview (full diagram)",
                                children: "▦",
                              }),
                              h("button", {
                                onClick: animPrev,
                                className: "anim-rail-btn anim-caption-prev",
                                "aria-label": "Previous animation step",
                                title: "Previous step (←)",
                                children: "‹",
                              }),
                              h("button", {
                                onClick: animNext,
                                className: "anim-rail-btn anim-caption-next",
                                "aria-label": "Next animation step",
                                title: "Next step (→)",
                                children: "›",
                              }),
                              h("button", {
                                onClick: animLoopToggle,
                                className: "anim-rail-btn anim-caption-loop",
                                "aria-label": "Loop animation",
                                "aria-pressed": animLoop ? "true" : "false",
                                title: "Loop (restart at the last step)",
                                children: "⟳",
                              }),
                            ],
                          }),
                        _("div", {
                          className: "board-rest",
                          children: [
                        script &&
                          h("div", {
                            className: "anim-caption",
                            role: "status",
                            "aria-live": "polite",
                            children: [
                              h("span", {
                                className: "anim-caption-step",
                                // A preview may suppress its step caption when
                                // that caption only makes sense in motion.
                                children:
                                  captionFrame.captionStep === false
                                    ? ""
                                    : `Step ${captionFrame.stepIndex + 1} of ${script.steps.length}`,
                              }),
                              h("span", {
                                className: "anim-caption-text",
                                children: captionText,
                              }),
                              SHOW_ANIMATION_VARIANT_SELECT &&
                                h("select", {
                                  value: variant,
                                  onChange: (ev) => {
                                    setVariant(ev.target.value);
                                    playerRef.current?.reset();
                                    setStarted(false);
                                  },
                                  className: "anim-rail-btn anim-caption-variant",
                                  "aria-label": "Animation",
                                  title: "Choose animation",
                                  disabled: variantsFor(e).length < 2,
                                  children: variantsFor(e).map((v) =>
                                    h("option", { value: v.key, children: v.label }, v.key),
                                  ),
                                }),
                              formLine &&
                                h("span", { className: "anim-caption-note", children: formLine }),
                            ],
                          }),
                        o?.id === "N" &&
                          h("p", {
                            className: "d4-hint",
                            children: "Click different squares in the left column.",
                          }),
                        _("div", {
                          className: "d4-row",
                          children: [
                        d4Strip,
                        _("div", {
                          className: "board-col",
                          children: [
                        _("div", {
                          className: "relative",
                          style: { width: Z, height: Z },
                          "data-anim-stage": "true",
                          children: [
                          h("div", {
                            className: "grid",
                            style: {
                              display: "grid",
                              gridTemplateColumns: `repeat(3, ${gn}px)`,
                              gap: `${Tl}px`,
                              width: Z,
                              height: Z,
                            },
                            children: SQUARE.map((i, a) => {
                              let m = a === 4,
                                d = [0, 2, 6, 8].includes(a),
                                v = [1, 3, 5, 7].includes(a),
                                y = {},
                                k =
                                  "relative rounded-[14px] flex items-center justify-center select-none transition-all duration-300";
                              if (!o)
                                k += m
                                  ? " bg-[#1a1a1a] text-[#fdf8f0] shadow-[0_4px_18px_rgba(0,0,0,0.2)]"
                                  : " bg-[#fdf8f0] border border-[#1a1a1a]/[0.08] text-[#1a1a1a]";
                              else {
                                let f = o.id;
                                if (f === "F")
                                  if (d)
                                    ((k += " text-white"),
                                      (y.background = "#c96442"));
                                  else if (
                                    v &&
                                    showKey("F", "F.badge-edges")
                                  )
                                    ((k += " text-white"),
                                      (y.background = "#4a6741"));
                                  else k += " bg-[#1a1a1a] text-white";
                                else if (f === "A") {
                                  let c = {
                                    0: "#c96442",
                                    8: "#c96442",
                                    2: "#4a6741",
                                    6: "#4a6741",
                                    3: "#7a6a9e",
                                    5: "#7a6a9e",
                                    1: "#b89a5a",
                                    7: "#b89a5a",
                                  };
                                  if (c[a])
                                    ((y.boxShadow = `0 0 0 2px ${c[a]} inset`),
                                      (y.background = `${c[a]}18`));
                                  if (m) k += " bg-[#1a1a1a] text-white";
                                  else
                                    k += " bg-white border border-[#1a1a1a]/10";
                                } else if (f === "G")
                                  k += m
                                    ? " bg-[#1a1a1a] text-white"
                                    : " bg-[#fdf8f0] border border-[#1a1a1a]/10";
                                else
                                  k += m
                                    ? " bg-[#1a1a1a] text-[#fdf8f0]"
                                    : " bg-[#fdf8f0] border border-[#1a1a1a]/[0.08]";
                                if (
                                  ["C", "D", "H", "B", "I", "E"].includes(f) &&
                                  m
                                )
                                  k +=
                                    " ring-2 ring-[#b89a5a] ring-offset-2 ring-offset-white";
                              }
                              // Ghost/focus board state: while a script step names
                              // a focus set, the other cells recede so the
                              // participating values carry the beat. Idle and
                              // focus-empty steps render untouched.
                              const dimmed =
                                boardOn &&
                                showFrame?.highlight?.length > 0 &&
                                !showFrame.highlight.includes(a);
                              if (dimmed) y.opacity = 0.45;
                              let buildOn = boardOn && script?.id === "construction",
                                // Opposite-squares proof: participating cells
                                // show their square in place (n with a
                                // superscript 2) while the gutters between
                                // them carry the "+" operators from the
                                // script's op items.
                                squareOn =
                                  boardOn &&
                                  script?.id === "Q" &&
                                  showFrame?.highlight?.includes(a),
                                valueOn = boardOn && showFrame?.setValues,
                                cellVal = valueOn ? (showFrame.setValues[a] ?? "") : playBase[a],
                                hideNum = moving.has(a),
                                // Nested palace: this cell opens into its 3×3. The
                                // mini always uses the un-zoomed base grid as the
                                // inner square; zoom beats re-base the board with
                                // setValues, so outer values may exceed 81.
                                outerVal = sheetGrid[a],
                                nestOpen =
                                  nestMode &&
                                  Number.isInteger(outerVal) &&
                                  (nestMode.mode === "all" ||
                                    sheetGrid.indexOf(nestMode.palace) === a),
                                miniVals = nestOpen ? palaceCells(playBase, outerVal) : null,
                                miniMark =
                                  nestOpen &&
                                  nestMode.mode === "palace" &&
                                  Number.isInteger(nestMode.mark)
                                    ? playBase.indexOf(nestMode.mark)
                                    : -1,
                                // Correspondences: independent slots. Selecting one
                                // resets playback above, so their labels are never
                                // silently hidden behind an active animation.
                                legendOn = legend.size > 0 && !boardOn,
                                corr = legendOn ? CORRESPONDENCES[i] : null,
                                showLayer = (id) =>
                                  legendOn && corr && legend.has(id);
                              if (showLayer("elements")) {
                                let tint = ELEMENT_SWATCH[corr.element];
                                if (tint)
                                  y.boxShadow = `${y.boxShadow ? y.boxShadow + ", " : ""}inset 0 0 0 2px ${tint}`;
                              }
                              if (showLayer("parity")) {
                                if (corr.parity === "odd")
                                  y.boxShadow = `${y.boxShadow ? y.boxShadow + ", " : ""}inset 0 0 0 2px #1a1a1a`;
                                else k += " corr-parity-even";
                              }
                              if (buildOn && showFrame.highlight.includes(a))
                                k += " ring-2 ring-[#c96442] ring-offset-2 ring-offset-white";
                              // Tape linking: hovered rows preview their cells
                              // in gold; the probed cell gets an ink inset.
                              if (hoverCells.length > 0 && hoverCells.includes(a))
                                k += " ring-2 ring-[#b89a5a] ring-offset-2 ring-offset-white";
                              if (probeCell === a)
                                y.boxShadow = `${y.boxShadow ? y.boxShadow + ", " : ""}inset 0 0 0 3px #1a1a1a`;
                              if (playground && swapArm === a)
                                y.boxShadow = `${y.boxShadow ? y.boxShadow + ", " : ""}inset 0 0 0 3px #c96442`;
                              return _(
                                "div",
                                {
                                  className: `${k} board-cell`,
                                  style: { width: gn, height: gn, ...y },
                                  tabIndex: 0,
                                  role: "button",
                                  "aria-label": playground
                                    ? `Swap cell ${cellVal}`
                                    : nestOpen && miniMark >= 0
                                      ? `Palace ${outerVal}, address ${outerVal}-${nestMode.mark} is ${9 * (outerVal - 1) + nestMode.mark}`
                                      : nestOpen
                                        ? `Palace ${outerVal}, lines ${27 * (outerVal - 1) + 15}`
                                        : `Probe cell ${cellVal}`,
                                  onFocus: () => setFocusCell(a),
                                  onBlur: () => setFocusCell((c) => (c === a ? null : c)),
                                  onClick: () => {
                                    // Playground swap: arm one cell, then tap
                                    // a second to exchange their values.
                                    if (playground) {
                                      if (swapArm == null) setSwapArm(a);
                                      else if (swapArm === a) setSwapArm(null);
                                      else {
                                        const g = [...(playGrid ?? SQUARE)];
                                        const t = g[swapArm];
                                        g[swapArm] = g[a];
                                        g[a] = t;
                                        setPlayGrid(g);
                                        setSwapArm(null);
                                      }
                                      return;
                                    }
                                    setStickyCell((c) => (c === a ? null : a));
                                  },
                                  children: [
                                    nestOpen
                                      ? h("div", {
                                          className: `board-mini${miniVals.some((v) => v >= 1000) ? " board-mini-dense" : ""}`,
                                          "aria-hidden": "true",
                                          children: miniVals.map((v, d) =>
                                            h(
                                              "span",
                                              {
                                                className: `board-mini-cell${d === miniMark ? " board-mini-cell-marked" : ""}`,
                                                children: v,
                                              },
                                              d,
                                            ),
                                          ),
                                        }, "mini")
                                      : h("span", {
                                          className:
                                            "text-[42px] leading-none tracking-[-0.02em]",
                                          style: {
                                            fontFamily: "'Instrument Serif', serif",
                                            fontWeight: 500,
                                            opacity: hideNum ? 0 : 1,
                                          },
                                          children: squareOn
                                            ? [
                                                h("span", { children: cellVal }, "v"),
                                                h(
                                                  "sup",
                                                  {
                                                    style: {
                                                      fontFamily: "'Instrument Serif', serif",
                                                      fontWeight: 500,
                                                      fontSize: "22px",
                                                      marginLeft: "1px",
                                                    },
                                                    children: "2",
                                                  },
                                                  "e",
                                                ),
                                              ]
                                            : cellVal,
                                        }),
                                    showLayer("trigrams") &&
                                      h("span", {
                                        className: "corr-trigram",
                                        children: corr.trigram
                                          ? `${corr.glyph} ${corr.trigram}`
                                          : "Center",
                                      }),
                                    (showLayer("elements") ||
                                      showLayer("tones")) &&
                                      h("span", {
                                        className: "corr-stack",
                                        children: [
                                          showLayer("elements") &&
                                            h("span", {
                                              children: corr.element,
                                            }, "el"),
                                          showLayer("tones") &&
                                            h("span", {
                                              children: corr.tone,
                                            }, "tone"),
                                        ],
                                      }),
                                    showLayer("directions") &&
                                      h("span", {
                                        className: `corr-dir corr-dir-${DIR_PIN[corr.direction]}`,
                                        children: DIR_PIN[corr.direction],
                                      }),
                                  ],
                                },
                                a,
                              );
                            }),
                          }),
                          _("svg", {
                            className: "absolute inset-0 pointer-events-none",
                            width: Z,
                            height: Z,
                            viewBox: `0 0 ${Z} ${Z}`,
                            style: { overflow: "visible" },
                            children: [
                              _("defs", {
                                children: [
                                  h("marker", {
                                    id: "arrowSmall",
                                    markerWidth: "6",
                                    markerHeight: "6",
                                    refX: "4",
                                    refY: "3",
                                    orient: "auto",
                                    markerUnits: "strokeWidth",
                                    children: h("path", {
                                      d: "M0,0 L6,3 L0,6",
                                      fill: "none",
                                      stroke: "#1a1a1a",
                                      strokeWidth: "1.2",
                                      strokeLinecap: "round",
                                      strokeLinejoin: "round",
                                    }),
                                  }),
                                  h("marker", {
                                    id: "arrowTerra",
                                    markerWidth: "6",
                                    markerHeight: "6",
                                    refX: "4",
                                    refY: "3",
                                    orient: "auto",
                                    children: h("path", {
                                      d: "M0,0 L6,3 L0,6",
                                      fill: "none",
                                      stroke: "#c96442",
                                      strokeWidth: "1.4",
                                    }),
                                  }),
                                ],
                              }),
...ov.svg,
                            ],
                          }),
                          ...ov.html,
                          ...flyers,
                          ],
                        }),
                          ],
                        }),
                          ],
                        }),
                        o &&
                          _("div", {
                            className: "board-meta",
                            children: [
                              _("div", {
                                children: [
                                  h("div", {
                                    className:
                                      "text-[11px] font-mono uppercase tracking-widest opacity-40",
                                    children: "Visual key",
                                  }),
                                  ...(VISUAL_KEYS[o.id] || VISUAL_KEYS.A).map(
                                    ([color, label, dashed], k) =>
                                      _("div", {
                                        className: `${k === 0 ? "mt-1.5" : "mt-1"} flex items-center gap-1.5`,
                                        children: [
                                          h("span", {
                                            className: "w-3 h-0.5 inline-block",
                                            style: dashed
                                              ? { borderTop: `1px dashed ${color}` }
                                              : { background: color },
                                          }),
                                          h("span", {
                                            className: "text-[11px] font-mono",
                                            children: label,
                                          }),
                                        ],
                                      }),
                                  ),
                                ],
                              }),
                              _("div", {
                                children: [
                                  h("div", {
                                    className:
                                      "text-[11px] font-mono uppercase tracking-widest opacity-40",
                                    children: "Center",
                                  }),
                                  h("div", {
                                    className: "mt-1.5 text-[12px] font-mono",
                                    children:
                                      "5 = mean, median, fulcrum. Everything folds through it.",
                                  }),
                                ],
                              }),
                            ],
                          }),
                                script &&
                                  _("div", {
                                    className: "anim-transport",
                                    children: [
                                      _("div", {
                                        className: "anim-transport-row",
                                        children: [
                                          h("input", {
                                            type: "range",
                                            min: "0",
                                            max: "1000",
                                            defaultValue: "0",
                                            key: `${e}-${variant}`,
                                            "data-anim-scrub": "true",
                                            "aria-label": "Animation timeline",
                                            title: "Scrub the timeline",
                                            className: "anim-scrub",
                                            onChange: (ev) => {
                                              const p = playerRef.current;
                                              if (!p || !script) return;
                                              const { stepIndex, elapsedMs } = ratioToTime(
                                                script,
                                                Number(ev.target.value) / 1000,
                                              );
                                              setStarted(true);
                                              p.seekAt(stepIndex, elapsedMs);
                                            },
                                          }, "scrub"),
                                          h("select", {
                                            value: animSpeed,
                                            onChange: (ev) => {
                                              const v = parseFloat(ev.target.value);
                                              try {
                                                playerRef.current?.setSpeed(v);
                                              } catch {}
                                            },
                                            className: "anim-speed",
                                            "aria-label": "Playback speed",
                                            title: "Playback speed (0.25×–3×)",
                                            children: SPEEDS.map((sd) =>
                                              h("option", {
                                                value: String(sd),
                                                children: `${sd}×`,
                                              }, String(sd)),
                                            ),
                                          }, "speed"),
                                        ],
                                      }, "transport-row"),
                                      h("div", {
                                        className: "anim-ticks",
                                        role: "group",
                                        "aria-label": "Animation steps",
                                        children: script.steps.map((st, i) => {
                                          const current =
                                            (boardOn && showFrame ? showFrame.stepIndex : 0) === i;
                                          return h("button", {
                                            type: "button",
                                            className: `anim-tick${current ? " anim-tick-on" : ""}`,
                                            "aria-label": `Seek to step ${i + 1}: ${st.caption}`,
                                            "aria-pressed": current ? "true" : "false",
                                            title: st.caption,
                                            onClick: () => {
                                              if (!playerRef.current) return;
                                              setStarted(true);
                                              playerRef.current.seekAt(
                                                i,
                                                st.durationMs || DEFAULT_STEP_MS,
                                              );
                                            },
                                            children: `${i + 1}`,
                                          }, `tick-${i}`);
                                        }),
                                      }, "ticks"),
                                    ],
                                  }, "transport"),
                          ],
                        }),
                      ],
                    }),
                    sheetPayload && renderSheet(sheetPayload, sheetGrid, playBase),
                    h("div", {
                      className: "legend-toggles mt-4",
                      children: [
                        isMobilePortrait
                          ? h(CompactDropdown, {
                              className: "mobile-correspondence-select",
                              label: "Correspondences",
                              ariaLabel: "Correspondence overlays",
                              open: mobileCorrespondencesOpen,
                              onToggle: () => setMobileCorrespondencesOpen((open) => !open),
                              triggerClassName: "mobile-correspondence-select-trigger",
                              menuClassName: "mobile-correspondence-select-menu",
                              summary: h("span", {
                                className: "mobile-correspondence-select-summary",
                                children:
                                  legend.size === 0
                                    ? "None selected"
                                    : `${legend.size} selected`,
                              }),
                              children: [
                                _("button", {
                                  type: "button",
                                  className: "mobile-correspondence-clear",
                                  onClick: () => setLegend(new Set()),
                                  children: "Clear all",
                                }),
                                ...LEGEND_LAYERS.filter((layer) => layer.id !== "off").map((layer) =>
                                  _("label", {
                                    className: "mobile-correspondence-option",
                                    children: [
                                      h("input", {
                                        type: "checkbox",
                                        checked: legend.has(layer.id),
                                        onChange: () => toggleLegend(layer.id),
                                      }),
                                      _("span", {
                                        children: [
                                          h("span", {
                                            className: "mobile-correspondence-option-label",
                                            children: layer.label,
                                          }),
                                          h("span", {
                                            className: "mobile-correspondence-option-note",
                                            children: LEGEND_NOTES[layer.id],
                                          }),
                                        ],
                                      }),
                                    ],
                                  }, layer.id),
                                ),
                              ],
                            })
                          : _("div", {
                          className: "flex flex-wrap items-center gap-1.5",
                          role: "group",
                          "aria-label": "Correspondences legend",
                          children: [
                            h(
                              "span",
                              {
                                className:
                                  "text-[11px] font-mono uppercase tracking-widest opacity-50 mr-1",
                                children: "Correspondences",
                              },
                              "legend-title",
                            ),
                            ...LEGEND_LAYERS.map((layer) => {
                              let active =
                                layer.id === "off"
                                  ? legend.size === 0
                                  : legend.has(layer.id);
                              return h(
                                "button",
                                {
                                  onClick: () => toggleLegend(layer.id),
                                  className: `px-2.5 py-1 rounded-full text-[11px] font-mono border transition-colors ${active ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-transparent border-[#1a1a1a]/15 hover:bg-[#1a1a1a]/[0.06]"}`,
                                  "aria-pressed": active,
                                  title:
                                    layer.id === "trigrams"
                                      ? "Later Heaven arrangement"
                                      : layer.id === "tones"
                                        ? "Five tones via the five phases (interpretive)"
                                        : layer.id === "off"
                                          ? "Plain numbers"
                                          : `${layer.label} overlay`,
                                  children: layer.label,
                                },
                                layer.id,
                              );
                            }),
                          ],
                        }, "legend-chips"),
                        h("p", {
                          className: "mt-1.5 text-[11px] font-mono opacity-50",
                          children:
                            legend.size === 0
                              ? "Overlay a traditional reading on the nine cells."
                              : LEGEND_LAYERS.filter(
                                  (layer) =>
                                    layer.id !== "off" && legend.has(layer.id),
                                )
                                  .map((layer) => LEGEND_NOTES[layer.id])
                                  .join(" · "),
                        }, "legend-caption"),
                      ],
                    }),
                    h("div", {
                      className: "property-panel w-full max-w-[560px]",
                      children: !o
                        ? _("div", {
                            className:
                              "border border-dashed border-[#1a1a1a]/20 rounded-[16px] p-6 lg:p-8 bg-white/50 backdrop-blur-sm",
                            children: [
                              _("div", {
                                className: "flex items-center gap-3 mb-3",
                                children: [
                                  h("div", {
                                    className:
                                      "w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-[12px] font-mono",
                                    children: "◌",
                                  }),
                                  h("span", {
                                    className:
                                      "text-[11px] tracking-[0.2em] uppercase font-mono opacity-60",
                                    children: "Select a property",
                                  }),
                                ],
                              }),
                              h("h3", {
                                className: "text-[22px] leading-[1.1] mb-2",
                                style: {
                                  fontFamily: "'Instrument Serif', serif",
                                },
                                children: "The turtle shell revealed order.",
                              }),
                              h("p", {
                                className:
                                  "text-[13px] leading-[1.6] opacity-60",
                                style: { fontFamily: "'Newsreader', serif" },
                                children:
                                  "Each item in the list overlays a different arithmetic truth directly on the 3×3. The square itself never changes — only how you see it.",
                              }),
                              _("div", {
                                className: "mt-4 grid grid-cols-3 gap-2",
                                children: [
                                  _("div", {
                                    className:
                                      "h-[64px] rounded-[10px] bg-[#1a1a1a]/[0.03] border border-[#1a1a1a]/[0.06] p-2",
                                    children: [
                                      h("div", {
                                        className:
                                          "text-[9px] font-mono opacity-40",
                                        children: "CORE",
                                      }),
                                      h("div", {
                                        className: "text-[11px] font-mono mt-1",
                                        children: "Balance around 5",
                                      }),
                                    ],
                                  }),
                                  _("div", {
                                    className:
                                      "h-[64px] rounded-[10px] bg-[#1a1a1a]/[0.03] border border-[#1a1a1a]/[0.06] p-2",
                                    children: [
                                      h("div", {
                                        className:
                                          "text-[9px] font-mono opacity-40",
                                        children: "MODULAR",
                                      }),
                                      h("div", {
                                        className: "text-[11px] font-mono mt-1",
                                        children: "mod 10 clock",
                                      }),
                                    ],
                                  }),
                                  _("div", {
                                    className:
                                      "h-[64px] rounded-[10px] bg-[#1a1a1a]/[0.03] border border-[#1a1a1a]/[0.06] p-2",
                                    children: [
                                      h("div", {
                                        className:
                                          "text-[9px] font-mono opacity-40",
                                        children: "UNIVERSAL",
                                      }),
                                      h("div", {
                                        className: "text-[11px] font-mono mt-1",
                                        children: "8 faces of one",
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          })
                        : h("div", {
                            className:
                              "animate-[fadeIn_0.4s_ease] bg-white rounded-[18px] border border-[#1a1a1a]/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.06)] overflow-hidden",
                            children: _("div", {
                              className: "px-6 lg:px-8 py-6 panel-body",
                              children: [
                                _("div", {
                                  className: "panel-row",
                                  children: [
                                _("div", {
                                  className: "panel-copy",
                                  children: [
                                _("div", {
                                  className:
                                    "flex items-start justify-between gap-4",
                                  children: [
                                    _("div", {
                                      children: [
                                        h("h2", {
                                          className:
                                            "text-[24px] leading-[1.05] tracking-[-0.01em]",
                                          style: {
                                            fontFamily:
                                              "'Instrument Serif', serif",
                                          },
                                          children: o.title,
                                        }),
                                        _("div", {
                                          className:
                                            "mt-1 text-[11px] font-mono tracking-wide opacity-60 uppercase",
                                          children: [
                                            o.category,
                                            " • ",
                                            o.shortDesc,
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                h("div", {
                                  className: "mt-5",
                                  children: _("div", {
                                    className:
                                      "inline-flex flex-wrap min-w-0 max-w-full items-center gap-2 px-3 py-1.5 rounded-full bg-[#fdf8f0] border border-[#1a1a1a]/10",
                                    children: [
                                      h("span", {
                                        className:
                                          "w-1.5 h-1.5 rounded-full bg-[#c96442] shrink-0",
                                      }),
                                      h("code", {
                                        className:
                                          "text-[12px] font-mono tracking-tight",
                                        style: {
                                          overflowWrap: "anywhere",
                                          maxWidth: "100%",
                                        },
                                        // Formula-token sync: tokens whose
                                        // numbers the current step demonstrates
                                        // light up; the rest recede.
                                        children: String(o.formula)
                                          .split(/(\s+)/)
                                          .map((tok, i) =>
                                            /^\s*$/.test(tok)
                                              ? tok
                                              : h("span", {
                                                  className: tokenLit(tok, syncNums)
                                                    ? "formula-tok-lit"
                                                    : "formula-tok",
                                                  children: tok,
                                                }, i),
                                          ),
                                      }),
                                    ],
                                  }),
                                }),
                                o.id !== "intro" && playResults[o.id] === false &&
                                  h("div", {
                                    className: "mt-3",
                                    children: _("div", {
                                      className:
                                        "inline-flex flex-wrap min-w-0 max-w-full items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#1a1a1a]/10",
                                      children: [
                                        h("span", {
                                          className: "w-1.5 h-1.5 rounded-full shrink-0 bg-[#c96442]",
                                        }, "dot"),
                                        h("code", {
                                          className:
                                            "text-[12px] font-mono tracking-tight",
                                          children: "✗ computed: broken on this square",
                                        }, "status"),
                                      ],
                                    }),
                                  }, "computed-status"),
                                h("p", {
                                  className:
                                    "mt-4 text-[14px] leading-[1.7] opacity-75",
                                  style: {
                                    fontFamily: "'Newsreader', Georgia, serif",
                                    overflowWrap: "anywhere",
                                  },
                                  children: o.longDesc,
                                }),
                                o.id === "intro" &&
                                  script?.id === "construction" &&
                                  _("div", {
                                    className: "mt-4 grid grid-cols-3 gap-2",
                                    role: "group",
                                    "aria-label": "Construction steps",
                                    children: [
                                      ["Write", "1…9 in order"],
                                      ["Swap", "1↔9 · 3↔7"],
                                      ["Fold", "into Lo Shu"],
                                    ].map(([name, sub], i) => {
                                      const active =
                                        (boardOn && showFrame
                                          ? showFrame.stepIndex
                                          : 0) === i;
                                      return h(
                                        "button",
                                        {
                                          type: "button",
                                          "aria-pressed": active
                                            ? "true"
                                            : "false",
                                          "aria-label": `Construction step ${i + 1}: ${name}`,
                                          onClick: () => {
                                            if (!playerRef.current) return;
                                            setStarted(true);
                                            const st = script.steps[i];
                                            playerRef.current.seekAt(
                                              i,
                                              st.durationMs ||
                                                DEFAULT_STEP_MS,
                                            );
                                          },
                                          className: active
                                            ? "rounded-[10px] border border-[#1a1a1a] bg-[#1a1a1a] text-[#fdf8f0] p-2 text-left"
                                            : "rounded-[10px] bg-[#1a1a1a]/[0.03] border border-[#1a1a1a]/[0.06] p-2 text-left hover:bg-[#1a1a1a]/[0.06]",
                                          children: [
                                            h("div", {
                                              className:
                                                "text-[11px] font-mono opacity-40",
                                              children: `STEP ${i + 1}`,
                                            }, "step"),
                                            h("div", {
                                              className:
                                                "text-[11px] font-mono mt-1",
                                              children: name,
                                            }, "name"),
                                            h("div", {
                                              className:
                                                "text-[11px] font-mono opacity-60 mt-1",
                                              children: sub,
                                            }, "sub"),
                                          ],
                                        },
                                        `construction-card-${i}`,
                                      );
                                    }),
                                  }),
                                  ],
                                }),
                                  ],
                                }),
                    script &&
                      script.steps &&
                      _("section", {
                        className: "tape w-full max-w-none",
                        role: "group",
                        "aria-label": "Worked-example tape",
                        children: [
                          h("div", {
                            className:
                              "text-[11px] font-mono uppercase tracking-widest opacity-40 mb-1.5",
                            children: "Worked example",
                          }, "tape-title"),
                          ...script.steps.map((st, i) => {
                            const entries = ledgerFor(st);
                            const isCaption = !st.tape && entries.length === 0;
                            // A step.tape title keeps the row short. Sheet
                            // figures are not ledger text and are not split.
                            const lines = st.tape
                              ? [st.tape]
                              : isCaption
                                ? [st.caption]
                                : entries.flatMap((en) => String(en).split(" · "));
                            const isCurrent =
                              (boardOn && showFrame ? showFrame.stepIndex : 0) === i;
                            const cells = st.matrix.highlight || [];
                            const related =
                              probeCell != null && cells.includes(probeCell);
                            return h(
                              "button",
                              {
                                type: "button",
                                "aria-label": `Tape step ${i + 1}: ${st.tape || entries[0] || st.caption}`,
                                "aria-pressed": isCurrent ? "true" : "false",
                                onClick: () => {
                                  if (!playerRef.current) return;
                                  setStarted(true);
                                  playerRef.current.seekAt(
                                    i,
                                    st.durationMs || DEFAULT_STEP_MS,
                                  );
                                },
                                onMouseEnter: () => setHoverStep(i),
                                onMouseLeave: () =>
                                  setHoverStep((s) => (s === i ? null : s)),
                                onFocus: () => setHoverStep(i),
                                onBlur: () =>
                                  setHoverStep((s) => (s === i ? null : s)),
                                className: isCurrent
                                  ? "tape-row flex w-full items-baseline gap-3 rounded-[10px] border border-[#1a1a1a] bg-[#1a1a1a] text-[#fdf8f0] px-3 py-2 text-left"
                                  : related
                                    ? "tape-row flex w-full items-baseline gap-3 rounded-[10px] border border-[#1a1a1a]/40 bg-[#1a1a1a]/[0.04] px-3 py-2 text-left hover:bg-[#1a1a1a]/[0.06]"
                                    : "tape-row flex w-full items-baseline gap-3 rounded-[10px] border border-transparent px-3 py-2 text-left hover:bg-[#1a1a1a]/[0.06]",
                                children: [
                                  h("div", {
                                    className:
                                      "text-[11px] font-mono opacity-40 shrink-0",
                                    children: `${i + 1}`,
                                  }, "num"),
                                  _("div", {
                                    className: "flex-1 min-w-0",
                                    children: lines.map((ln, j) => {
                                      if (isCaption || st.tape)
                                        return h("div", {
                                          className:
                                            "text-[13px] leading-[1.4] opacity-75",
                                          style: { overflowWrap: "anywhere" },
                                          children: ln,
                                        }, j);
                                      const { lead, result, sep } = splitLedger(ln);
                                      return h("div", {
                                        className: "ledger-line",
                                        style: { overflowWrap: "anywhere" },
                                        children: [
                                          h("span", {
                                            className: "ledger-eq",
                                            children: lead,
                                          }, "lead"),
                                          result &&
                                            h("span", {
                                              className: "ledger-sep",
                                              children: sep,
                                            }, "sep"),
                                          result &&
                                            h("span", {
                                              className: "ledger-res",
                                              children: result,
                                            }, "res"),
                                        ],
                                      }, j);
                                    }),
                                  }, "lines"),
                                ],
                              },
                              `tape-row-${i}`,
                            );
                          }),
                        ],
                      }, "tape"),
                              ],
                            }),
                          }),
                    }),
                    noteBlocks && h("section", {
                      className: "property-notes mt-4 w-full max-w-[560px]",
                      "aria-label": "Notes",
                      children: [
                        h("div", {
                          className:
                            "text-[11px] font-mono uppercase tracking-widest opacity-40",
                          children: "Notes",
                        }, "notes-kicker"),
                        ...renderNoteBlocks(noteBlocks, h),
                      ],
                    }, "notes"),
                    h("section", {
                      className: "mt-4 w-full max-w-[560px] rounded-[18px] border border-dashed border-[#1a1a1a]/20 bg-white/50 p-6",
                      "aria-label": "What breaks playground",
                      children: [
                        _("div", {
                          className: "flex items-start justify-between gap-4",
                          children: [
                            _("div", {
                              children: [
                                h("div", {
                                  className:
                                    "text-[11px] font-mono uppercase tracking-widest opacity-60",
                                  children: "Playground",
                                }, "pg-kicker"),
                                h("h2", {
                                  className: "text-[24px] leading-[1.05] tracking-[-0.01em] mt-1",
                                  style: {
                                    fontFamily: "'Instrument Serif', serif",
                                  },
                                  children: "What breaks?",
                                }, "pg-title"),
                                h("p", {
                                  className: "mt-2 text-[13px] leading-[1.6] opacity-60",
                                  style: { fontFamily: "'Newsreader', Georgia, serif" },
                                  children:
                                    "Swap any two cells and watch the checklist. Playback shows script values; reset it to see your swap.",
                                }, "pg-desc"),
                              ],
                            }, "pg-head"),
                            h("button", {
                              type: "button",
                              "aria-label": playground ? "Exit playground" : "Enter playground",
                              "aria-pressed": playground ? "true" : "false",
                              onClick: playgroundToggle,
                              className: "anim-rail-btn shrink-0",
                              title: "Swap cells and test the claims",
                              children: playground
                                ? "Exit"
                                : playGrid
                                  ? "Modified…"
                                  : "Enter",
                            }, "pg-toggle"),
                          ],
                        }, "pg-top"),
                        playground && [
                          h("p", {
                            className: "mt-3 text-[13px] leading-[1.6] opacity-75",
                            style: { fontFamily: "'Newsreader', Georgia, serif" },
                            children: swapArm == null
                              ? "Tap a cell to arm it, then tap a second cell to swap their values."
                              : "One cell armed — tap another cell to complete the swap, or tap it again to stand down.",
                          }, "pg-hint"),
                          h("button", {
                            type: "button",
                            "aria-label": "Restore Lo Shu",
                            onClick: () => {
                              setPlayGrid(null);
                              setSwapArm(null);
                            },
                            disabled: !playGrid,
                            className:
                              "anim-rail-btn mt-3",
                            title: "Restore the Lo Shu square",
                            children: "Restore Lo Shu",
                          }, "pg-restore"),
                          h("div", {
                            className: "mt-3 flex flex-wrap gap-1.5",
                            role: "group",
                            "aria-label": "Property checklist",
                            "aria-live": "polite",
                            children: PROPERTIES.filter((p) => p.id !== "intro" && p.id in playResults).map(
                              (p) => {
                                const ok = !!playResults[p.id];
                                return h("span", {
                                  className: `rounded-full border px-2 py-0.5 text-[11px] font-mono ${ok ? "border-[#4a6741]/50 text-[#4a6741]" : "border-[#c96442] text-[#c96442] bg-[#c96442]/10"}`,
                                  title: `${p.title} — ${ok ? "holds" : "broken"}`,
                                  children: `${p.title} ${ok ? "✓" : "✗"}`,
                                }, p.id);
                              },
                            ),
                          }, "pg-list"),
                        ],
                      ],
                    }, "playground"),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      h("style", {
        children: `
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Newsreader:opsz,wght@6..72,300;6..72,400;6..72,500&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes fadeIn { from { opacity:0; transform: translateY(6px);} to { opacity:1; transform: translateY(0);} }
      `,
      }),
    ],
  });
}
createRoot(document.getElementById("root")).render(
  h(React.StrictMode, { children: h(LoShuApp, {}) }),
);

export { LoShuApp, iconGlyphs, PROPERTIES, CATEGORIES, SQUARE, parseDeepLink };
