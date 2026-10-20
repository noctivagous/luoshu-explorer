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
import { createPlayer, DEFAULT_STEP_MS } from "./animation.js";
import { scriptFor } from "./animation-scripts.js";

const PROPERTIES = propertiesData,
  CORRESPONDENCES = correspondencesData,
  // Toggle layers for the correspondences legend beneath the matrix. The
  // value is the active layer id; "off" renders the plain numbers.
  LEGEND_LAYERS = [
    { id: "off", label: "Off" },
    { id: "elements", label: "Elements" },
    { id: "trigrams", label: "Trigrams" },
    { id: "tones", label: "Tones" },
    { id: "parity", label: "Even/odd" },
    { id: "directions", label: "Directions" },
  ],
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
// "Modulo wrap" pair that said the same thing for all 14 properties.
const VISUAL_KEYS = {
  intro: [["#1a1a1a", "Cells fill 1 → 9", false], ["#c96442", "Seed cell 1", false]],
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
};

const CATEGORIES = [
    { name: "Introduction", ids: ["intro", "B"] },
    { name: "Core Balance", ids: ["A", "E", "F", "L"] },
    { name: "Means & Zero", ids: ["G", "I"] },
    { name: "Lines & Totals", ids: ["J", "K"] },
    { name: "Modular Border", ids: ["C", "D", "H"] },
    { name: "Geometry & Universality", ids: ["M", "N"] },
  ],
  SQUARE = [4, 9, 2, 3, 5, 7, 8, 1, 6],
  VALUE_INDEX = {};
SQUARE.forEach((e, n) => (VALUE_INDEX[e] = n));
const gn = 108,
  Tl = 8,
  Z = 3 * gn + 2 * Tl;
function cellCenter(e) {
  let n = e % 3,
    t = Math.floor(e / 3);
  return {
    x: n * (gn + Tl) + gn / 2,
    y: t * (gn + Tl) + gn / 2,
    col: n,
    row: t,
  };
}
const CENTERS = Array.from({ length: 9 }, (e, n) => cellCenter(n));
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
function LoShuApp() {
  let [e, n] = React.useState("intro"),
    [t, r] = React.useState(() => new Set(CATEGORIES.map((i) => i.name))),
    l = React.useRef(null),
    o = React.useMemo(() => PROPERTIES.find((i) => i.id === e) || null, [e]),
    u = (i) => {
      r((a) => {
        let m = new Set(a);
        if (m.has(i)) m.delete(i);
        else m.add(i);
        return m;
      });
    },
    s = (i) => {
      if ((n(i), window.innerWidth < 1024))
        setTimeout(() => {
          l.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
    },
    script = scriptFor(e),
    playerRef = React.useRef(null),
    [frame, setFrame] = React.useState(null),
    // Last triple rendered into React state. Progress-only rAF ticks update
    // the --anim-p custom property directly and skip setState, so playback
    // no longer re-renders the whole app ~60x/s.
    lastRenderRef = React.useRef(null),
    [started, setStarted] = React.useState(false),
    [animPlaying, setAnimPlaying] = React.useState(false),
    [animSpeed, setAnimSpeed] = React.useState(1),
    // Active correspondences-legend layer beneath the matrix ("off" = plain).
    [legend, setLegend] = React.useState("off");
  React.useEffect(() => {
    if (playerRef.current) playerRef.current.dispose();
    playerRef.current = null;
    setStarted(false);
    setAnimPlaying(false);
    setAnimSpeed(1);
    if (!script) {
      setFrame(null);
      return;
    }
    const p = createPlayer(script, {
      onFrame: (f) => {
        const last = lastRenderRef.current;
        if (
          !last ||
          last.stepIndex !== f.stepIndex ||
          last.playing !== f.playing ||
          last.speed !== f.speed
        ) {
          lastRenderRef.current = {
            stepIndex: f.stepIndex,
            playing: f.playing,
            speed: f.speed,
          };
          setFrame(f);
          setAnimPlaying(f.playing);
          setAnimSpeed(f.speed);
        }
        const el = l.current;
        if (el) {
          const dur = f.step.durationMs || DEFAULT_STEP_MS;
          el.style.setProperty(
            "--anim-p",
            String(Math.max(0, Math.min(1, f.stepElapsed / dur))),
          );
        }
      },
    });
    playerRef.current = p;
    setFrame(p.getState());
    return () => p.dispose();
  }, [e]);
  const animOn = started && frame && script,
    animPlay = () => {
      if (!playerRef.current) return;
      setStarted(true);
      playerRef.current.play();
    },
    animPause = () => playerRef.current?.pause(),
    animNext = () => {
      if (!playerRef.current) return;
      // From idle, reveal the first step (the player already sits on it);
      // otherwise advance one step.
      if (!started) setStarted(true);
      else playerRef.current.stepNext();
    },
    animPrev = () => {
      if (!playerRef.current) return;
      if (!started) setStarted(true);
      else playerRef.current.stepPrev();
    },
    animReset = () => playerRef.current?.reset() || setStarted(false),
    animSpeedCycle = () => {
      const next = animSpeed >= 2 ? 0.5 : animSpeed >= 1 ? 2 : 1;
      try {
        playerRef.current?.setSpeed(next);
      } catch {}
    },
    // Overlay gate: while a script is playing/stepping, only the keys revealed
    // so far are shown; idle (or another property) renders everything as before.
    showKey = (id, key) =>
      !(
        animOn &&
        script &&
        script.id === id &&
        frame &&
        !frame.visibleKeys.includes(key)
      );
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
                                "text-[12.5px] tracking-[0.18em] uppercase font-mono font-medium opacity-70 group-hover:opacity-100 transition-opacity",
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
                                  className: `w-full text-left flex items-start gap-3 px-3 py-3 rounded-[10px] transition-all border ${v ? "bg-[#1a1a1a] text-[#fdf8f0] border-[#1a1a1a] shadow-[0_4px_20px_rgba(0,0,0,0.18)]" : "bg-transparent border-transparent hover:bg-[#1a1a1a]/[0.06] hover:border-[#1a1a1a]/[0.06]"}`,
                                  children: [
                                    h("span", {
                                      className: `shrink-0 w-10 h-10 rounded-[8px] flex items-center justify-center border overflow-hidden ${v ? "bg-[#fdf8f0]/10 border-[#fdf8f0]/20 text-[#fdf8f0]" : "bg-white border-[#1a1a1a]/10 text-[#1a1a1a]/70"}`,
                                      title: d.letter + " — " + d.title,
                                      children: iconGlyphs(d.id),
                                    }),
                                    _("span", {
                                      className: "flex-1 min-w-0",
                                      children: [
                                        h("span", {
                                          className: `block text-[16px] leading-[1.2] font-medium ${v ? "text-[#fdf8f0]" : "text-[#1a1a1a]"}`,
                                          style: {
                                            fontFamily:
                                              "'Instrument Serif', serif",
                                          },
                                          children: d.title,
                                        }),
                                        h("span", {
                                          className: `block mt-1 text-[12.5px] leading-[1.35] font-mono ${v ? "text-[#fdf8f0]/60" : "opacity-55"}`,
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
                children: _("div", {
                  className: "relative",
                  children: [
                    animOn &&
                      h("div", {
                        className: "anim-caption",
                        role: "status",
                        "aria-live": "polite",
                        children: [
                          h("span", {
                            className: "anim-caption-step",
                            children: `Step ${frame.stepIndex + 1} of ${script.steps.length}`,
                          }),
                          h("span", { children: frame.caption }),
                        ],
                      }),
                    h("div", {
                      ref: l,
                      className:
                        "relative bg-white rounded-[22px] shadow-[0_20px_60px_rgba(0,0,0,0.08),0_1px_0_rgba(0,0,0,0.06)_inset] p-5 lg:p-7 border border-[#1a1a1a]/[0.06]",
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
                              let S = i - 5,
                                D = o?.id === "G",
                                buildOn = animOn && script.id === "construction",
                                cellVal = buildOn ? (frame.setValues?.[a] ?? "") : i,
                                // Correspondences legend: badges + inset tint
                                // only when idle (never during animation).
                                legendOn = legend !== "off" && !animOn,
                                corr = legendOn ? CORRESPONDENCES[i] : null,
                                legendBadge =
                                  !legendOn || !corr
                                    ? null
                                    : legend === "elements"
                                      ? corr.element
                                      : legend === "trigrams"
                                        ? corr.trigram
                                          ? `${corr.glyph} ${corr.trigram}`
                                          : "Center"
                                        : legend === "tones"
                                          ? corr.tone
                                          : legend === "parity"
                                            ? corr.parity
                                            : corr.direction;
                              if (legendOn && corr) {
                                let tint = null;
                                if (
                                  legend === "elements" ||
                                  legend === "tones"
                                )
                                  tint = ELEMENT_SWATCH[corr.element];
                                else if (legend === "parity")
                                  tint =
                                    corr.parity === "even"
                                      ? "#4a6741"
                                      : "#1a1a1a";
                                if (tint)
                                  y.boxShadow = `${y.boxShadow ? y.boxShadow + ", " : ""}inset 0 0 0 2px ${tint}`;
                              }
                              if (buildOn && frame.highlight.includes(a))
                                k += " ring-2 ring-[#c96442] ring-offset-2 ring-offset-white";
                              return _(
                                "div",
                                {
                                  className: k,
                                  style: { width: gn, height: gn, ...y },
                                  children: [
                                    h("span", {
                                      className:
                                        "text-[42px] leading-none tracking-[-0.02em]",
                                      style: {
                                        fontFamily: "'Instrument Serif', serif",
                                        fontWeight: 500,
                                      },
                                      children: cellVal,
                                    }),
                                    D &&
                                      (S === 0
                                        ? showKey("G", "G.center")
                                        : S > 0
                                          ? showKey("G", "G.pos")
                                          : showKey("G", "G.neg")) &&
                                      h("span", {
                                        className:
                                          "absolute -bottom-1 right-1 text-[11px] font-mono font-bold px-1 rounded bg-[#1a1a1a] text-white",
                                        children: S > 0 ? `+${S}` : S,
                                      }),
                                    o?.id === "L" &&
                                      !m &&
                                      showKey("L", `L.bar-${a}`) &&
                                      h("span", {
                                        className:
                                          "absolute bottom-[6px] left-1/2 -translate-x-1/2 text-[10px] font-mono opacity-60",
                                        children:
                                          i > 5 ? `+${i - 5}` : `${i - 5}`,
                                      }),
                                    legendBadge &&
                                      h("span", {
                                        className:
                                          "absolute top-[6px] left-1/2 -translate-x-1/2 text-[10px] font-mono whitespace-nowrap opacity-70",
                                        children: legendBadge,
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
                              o?.id === "A" &&
                                h("g", {
                                  children: [
                                    { a: 7, b: 1, color: "#b89a5a" },
                                    { a: 2, b: 6, color: "#4a6741" },
                                    { a: 3, b: 5, color: "#7a6a9e" },
                                    { a: 0, b: 8, color: "#c96442" },
                                  ].map((i, a) => {
                                    let animKey = `A.pair-${a}`;
                                    if (
                                      animOn &&
                                      script.id === "A" &&
                                      !frame.visibleKeys.includes(animKey)
                                    )
                                      return null;
                                    let m = CENTERS[i.a],
                                      d = CENTERS[i.b],
                                      v = (m.x + d.x) / 2,
                                      y = (m.y + d.y) / 2;
                                    return _(
                                      "g",
                                      {
                                        "data-anim-key": animKey,
                                        children: [
                                          h("line", {
                                            x1: m.x,
                                            y1: m.y,
                                            x2: d.x,
                                            y2: d.y,
                                            stroke: i.color,
                                            strokeWidth: "2.2",
                                            strokeDasharray: "6 6",
                                            opacity: 0.9,
                                          }),
                                          _("g", {
                                            transform: `translate(${v},${y})`,
                                            children: [
                                              h("rect", {
                                                x: -14,
                                                y: -10,
                                                width: 28,
                                                height: 20,
                                                rx: 10,
                                                fill: "white",
                                                stroke: i.color,
                                                strokeWidth: "1",
                                              }),
                                              h("text", {
                                                x: 0,
                                                y: 4,
                                                textAnchor: "middle",
                                                fontSize: "11",
                                                fontFamily: "monospace",
                                                fill: i.color,
                                                fontWeight: "700",
                                                children: "10",
                                              }),
                                            ],
                                          }),
                                        ],
                                      },
                                      a,
                                    );
                                  }),
                                }),
                              o?.id === "B" &&
                                _("g", {
                                  children: [
                                    [
                                      [0, 1, 2],
                                      [3, 4, 5],
                                      [6, 7, 8],
                                    ].map((i, a) => {
                                      if (!showKey("B", `B.row-${a}`)) return null;
                                      let m = CENTERS[i[0]],
                                        d = CENTERS[i[2]];
                                      return _(
                                        "g",
                                        {
                                          "data-anim-key": `B.row-${a}`,
                                          opacity: 0.55,
                                          children: [
                                            h("line", {
                                              x1: m.x - 28,
                                              y1: m.y,
                                              x2: d.x + 28,
                                              y2: d.y,
                                              stroke: "#1a1a1a",
                                              strokeWidth: "1.3",
                                              strokeDasharray: "4 6",
                                            }),
                                            _("g", {
                                              transform: `translate(${d.x + 18}, ${m.y - 12})`,
                                              children: [
                                                h("rect", {
                                                  x: -10,
                                                  y: -8,
                                                  width: 20,
                                                  height: 16,
                                                  rx: 8,
                                                  fill: "#1a1a1a",
                                                }),
                                                h("text", {
                                                  x: 0,
                                                  y: 3,
                                                  textAnchor: "middle",
                                                  fontSize: "9",
                                                  fill: "white",
                                                  fontFamily: "monospace",
                                                  children: "15",
                                                }),
                                              ],
                                            }),
                                          ],
                                        },
                                        `r${a}`,
                                      );
                                    }),
                                    [
                                      [0, 3, 6],
                                      [1, 4, 7],
                                      [2, 5, 8],
                                    ].map((i, a) => {
                                      if (!showKey("B", `B.col-${a}`)) return null;
                                      let m = CENTERS[i[0]],
                                        d = CENTERS[i[2]];
                                      return _(
                                        "g",
                                        {
                                          "data-anim-key": `B.col-${a}`,
                                          opacity: 0.55,
                                          children: [
                                            h("line", {
                                              x1: m.x,
                                              y1: m.y - 28,
                                              x2: d.x,
                                              y2: d.y + 28,
                                              stroke: "#1a1a1a",
                                              strokeWidth: "1.3",
                                              strokeDasharray: "4 6",
                                            }),
                                            _("g", {
                                              transform: `translate(${m.x + 14}, ${d.y + 18})`,
                                              children: [
                                                h("rect", {
                                                  x: -10,
                                                  y: -8,
                                                  width: 20,
                                                  height: 16,
                                                  rx: 8,
                                                  fill: "#1a1a1a",
                                                }),
                                                h("text", {
                                                  x: 0,
                                                  y: 3,
                                                  textAnchor: "middle",
                                                  fontSize: "9",
                                                  fill: "white",
                                                  fontFamily: "monospace",
                                                  children: "15",
                                                }),
                                              ],
                                            }),
                                          ],
                                        },
                                        `c${a}`,
                                      );
                                    }),
                                    showKey("B", "B.diags") &&
                                      _("g", {
                                        "data-anim-key": "B.diags",
                                        opacity: 0.7,
                                      children: [
                                        h("line", {
                                          x1: CENTERS[0].x - 18,
                                          y1: CENTERS[0].y - 18,
                                          x2: CENTERS[8].x + 18,
                                          y2: CENTERS[8].y + 18,
                                          stroke: "#c96442",
                                          strokeWidth: "2",
                                        }),
                                        h("line", {
                                          x1: CENTERS[2].x + 18,
                                          y1: CENTERS[2].y - 18,
                                          x2: CENTERS[6].x - 18,
                                          y2: CENTERS[6].y + 18,
                                          stroke: "#c96442",
                                          strokeWidth: "2",
                                        }),
                                        _("g", {
                                          transform: `translate(${Z / 2}, ${Z / 2 - 28})`,
                                          children: [
                                            h("rect", {
                                              x: -12,
                                              y: -10,
                                              width: 24,
                                              height: 20,
                                              rx: 10,
                                              fill: "#c96442",
                                            }),
                                            h("text", {
                                              x: 0,
                                              y: 4,
                                              textAnchor: "middle",
                                              fontSize: "10",
                                              fill: "white",
                                              fontFamily: "monospace",
                                              fontWeight: "700",
                                              children: "15",
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              o?.id === "C" &&
                                h("g", {
                                  children: (() => {
                                    let a = [7, 8, 5, 2, 1, 0, 3, 6].map(
                                        (d) => CENTERS[d],
                                      ),
                                      m =
                                        a
                                          .map(
                                            (d, v) =>
                                              `${v === 0 ? "M" : "L"} ${d.x} ${d.y}`,
                                          )
                                          .join(" ") + ` L ${a[0].x} ${a[0].y}`;
                                    return _(Be, {
                                      children: [
                                        showKey("C", "C.path") &&
                                          h("path", {
                                            "data-anim-key": "C.path",
                                            d: m,
                                          fill: "none",
                                          stroke: "#1a1a1a",
                                          strokeWidth: "1.6",
                                          strokeDasharray: "8 8",
                                          opacity: 0.6,
                                        }),
                                        a.map((d, v) => {
                                          if (!showKey("C", `C.seg-${v}`)) return null;
                                          let y = a[(v + 1) % a.length],
                                            k = (d.x + y.x) / 2,
                                            S = (d.y + y.y) / 2,
                                            D = Math.atan2(
                                              y.y - d.y,
                                              y.x - d.x,
                                            );
                                          return h(
                                            "g",
                                            {
                                              "data-anim-key": `C.seg-${v}`,
                                              transform: `translate(${k},${S}) rotate(${(D * 180) / Math.PI})`,
                                              children: h("path", {
                                                d: "M -6 -4 L 6 0 L -6 4",
                                                fill: "none",
                                                stroke: "#c96442",
                                                strokeWidth: "1.6",
                                              }),
                                            },
                                            v,
                                          );
                                        }),
                                      ],
                                    });
                                  })(),
                                }),
                              o?.id === "D" &&
                                h("g", {
                                  children: [
                                    { edge: 1, corner: 0, sum: "5+9=14→4" },
                                    { edge: 5, corner: 2, sum: "5+7=12→2" },
                                    { edge: 7, corner: 8, sum: "5+1=6" },
                                    { edge: 3, corner: 6, sum: "5+3=8" },
                                  ].map((i, a) => {
                                    if (!showKey("D", `D.arm-${a}`)) return null;
                                    let m = CENTERS[4],
                                      d = CENTERS[i.edge],
                                      v = CENTERS[i.corner];
                                    return _(
                                      "g",
                                      {
                                        "data-anim-key": `D.arm-${a}`,
                                        children: [
                                          h("line", {
                                            x1: m.x,
                                            y1: m.y,
                                            x2: d.x,
                                            y2: d.y,
                                            stroke: "#7a6a9e",
                                            strokeWidth: "1.4",
                                            strokeDasharray: "3 4",
                                          }),
                                          h("line", {
                                            x1: d.x,
                                            y1: d.y,
                                            x2: v.x,
                                            y2: v.y,
                                            stroke: "#7a6a9e",
                                            strokeWidth: "2",
                                            markerEnd: "url(#arrowSmall)",
                                          }),
                                        ],
                                      },
                                      a,
                                    );
                                  }),
                                }),
                              o?.id === "E" &&
                                _("g", {
                                  children: [
                                    showKey("E", "E.ring-0") &&
                                      h("circle", {
                                        "data-anim-key": "E.ring-0",
                                        cx: Z / 2,
                                        cy: Z / 2,
                                        r: 62,
                                      fill: "none",
                                      stroke: "#b89a5a",
                                      strokeWidth: "1",
                                      strokeDasharray: "4 6",
                                      opacity: 0.6,
                                    }),
                                    showKey("E", "E.ring-1") &&
                                      h("circle", {
                                        "data-anim-key": "E.ring-1",
                                        cx: Z / 2,
                                        cy: Z / 2,
                                        r: 108,
                                      fill: "none",
                                      stroke: "#1a1a1a",
                                      strokeWidth: "1",
                                      strokeDasharray: "2 8",
                                      opacity: 0.25,
                                    }),
                                    showKey("E", "E.ring-2") &&
                                      h("circle", {
                                        "data-anim-key": "E.ring-2",
                                        cx: Z / 2,
                                        cy: Z / 2,
                                        r: 148,
                                      fill: "none",
                                      stroke: "#c96442",
                                      strokeWidth: "1",
                                      strokeDasharray: "2 10",
                                      opacity: 0.2,
                                    }),
                                  ],
                                }),
                              o?.id === "H" &&
                                h("g", {
                                  children: [
                                    { edge: 1, corner: 0 },
                                    { edge: 5, corner: 2 },
                                    { edge: 7, corner: 8 },
                                    { edge: 3, corner: 6 },
                                  ].map((i, a) => {
                                    if (!showKey("H", `H.arm-${a}`)) return null;
                                    let m = CENTERS[i.edge],
                                      d = CENTERS[i.corner];
                                    return _(
                                      "g",
                                      {
                                        "data-anim-key": `H.arm-${a}`,
                                        children: [
                                          h("line", {
                                            x1: m.x,
                                            y1: m.y,
                                            x2: d.x,
                                            y2: d.y,
                                            stroke: "#c96442",
                                            strokeWidth: "2",
                                            markerEnd: "url(#arrowSmall)",
                                            opacity: 0.9,
                                          }),
                                          _("g", {
                                            transform: `translate(${(m.x + d.x) / 2}, ${(m.y + d.y) / 2})`,
                                            children: [
                                              h("rect", {
                                                x: -10,
                                                y: -9,
                                                width: 20,
                                                height: 18,
                                                rx: 9,
                                                fill: "#c96442",
                                              }),
                                              h("text", {
                                                x: 0,
                                                y: 3,
                                                textAnchor: "middle",
                                                fontSize: "9",
                                                fill: "white",
                                                fontFamily: "monospace",
                                                children: "5",
                                              }),
                                            ],
                                          }),
                                        ],
                                      },
                                      a,
                                    );
                                  }),
                                }),
                              o?.id === "I" &&
                                _("g", {
                                  children: [
                                    [
                                      [0, 4, 8],
                                      [2, 4, 6],
                                      [1, 4, 7],
                                      [3, 4, 5],
                                    ].map((i, a) => {
                                      if (!showKey("I", `I.line-${a}`)) return null;
                                      let m = CENTERS[i[0]],
                                        d = CENTERS[i[2]];
                                      return h(
                                        "line",
                                        {
                                          "data-anim-key": `I.line-${a}`,
                                          x1: m.x,
                                          y1: m.y,
                                          x2: d.x,
                                          y2: d.y,
                                          stroke: "#1a1a1a",
                                          strokeWidth: "1.2",
                                          opacity: 0.35,
                                        },
                                        a,
                                      );
                                    }),
                                    showKey("I", "I.center") &&
                                      _("g", {
                                        "data-anim-key": "I.center",
                                        transform: `translate(${Z / 2}, ${Z / 2})`,
                                      children: [
                                        h("circle", { r: 18, fill: "#1a1a1a" }),
                                        h("text", {
                                          textAnchor: "middle",
                                          dy: "4",
                                          fontSize: "12",
                                          fill: "white",
                                          fontFamily: "monospace",
                                          children: "μ",
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              o?.id === "L" &&
                                h("g", {
                                  children: SQUARE.map((i, a) => {
                                    if (a === 4) return null;
                                    if (!showKey("L", `L.bar-${a}`)) return null;
                                    let m = CENTERS[a],
                                      d = i - 5,
                                      v = Math.abs(d) * 6,
                                      y = d > 0 ? m.y - 44 - v : m.y + 18;
                                    return h(
                                      "g",
                                      {
                                        "data-anim-key": `L.bar-${a}`,
                                        children: h("rect", {
                                          x: m.x - 3,
                                          y,
                                          width: 6,
                                          height: v,
                                          rx: 3,
                                          fill: d > 0 ? "#4a6741" : "#c96442",
                                          opacity: 0.8,
                                        }),
                                      },
                                      a,
                                    );
                                  }),
                                }),
                              o?.id === "M" &&
                                h("g", {
                                  children: (() => {
                                    let i = [1, 2, 3, 4, 5, 6, 7, 8, 9],
                                      a = i.map((m) => VALUE_INDEX[m]);
                                    return a.map((m, d) => {
                                      if (d === a.length - 1) return null;
                                      let v = CENTERS[m],
                                        y = CENTERS[a[d + 1]],
                                        k = y.x - v.x,
                                        S = y.y - v.y,
                                        D =
                                          Math.abs(k) > 100 ||
                                          Math.abs(S) > 100;
                                      if (!showKey("M", `M.hop-${d}`)) return null;
                                      return _(
                                        "g",
                                        {
                                          "data-anim-key": `M.hop-${d}`,
                                          children: [
                                            h("path", {
                                              d: `M ${v.x} ${v.y} Q ${(v.x + y.x) / 2 + (d % 2 === 0 ? 18 : -18)} ${(v.y + y.y) / 2 + (d % 3 === 0 ? -18 : 12)} ${y.x} ${y.y}`,
                                              fill: "none",
                                              stroke: D ? "#7a6a9e" : "#1a1a1a",
                                              strokeWidth: D ? "1.4" : "1.6",
                                              strokeDasharray: D ? "5 5" : "0",
                                              markerEnd: "url(#arrowSmall)",
                                              opacity: 0.8,
                                            }),
                                            h("g", {
                                              transform: `translate(${(v.x + y.x) / 2}, ${(v.y + y.y) / 2 - 10})`,
                                              children: _("text", {
                                                textAnchor: "middle",
                                                fontSize: "8",
                                                fontFamily: "monospace",
                                                fill: "#7a6a9e",
                                                fontWeight: "700",
                                                children: [i[d], "→", i[d + 1]],
                                              }),
                                            }),
                                          ],
                                        },
                                        d,
                                      );
                                    });
                                  })(),
                                }),
                              o?.id === "J" &&
                                showKey("J", "J.rows") &&
                                _("g", {
                                  "data-anim-key": "J.rows",
                                  opacity: 0.9,
                                  children: [
                                    h("line", {
                                      x1: CENTERS[0].x,
                                      y1: CENTERS[0].y,
                                      x2: CENTERS[2].x,
                                      y2: CENTERS[2].y,
                                      stroke: "#b89a5a",
                                      strokeWidth: "2",
                                    }),
                                    h("line", {
                                      x1: CENTERS[3].x,
                                      y1: CENTERS[3].y,
                                      x2: CENTERS[5].x,
                                      y2: CENTERS[5].y,
                                      stroke: "#b89a5a",
                                      strokeWidth: "2",
                                    }),
                                    h("line", {
                                      x1: CENTERS[6].x,
                                      y1: CENTERS[6].y,
                                      x2: CENTERS[8].x,
                                      y2: CENTERS[8].y,
                                      stroke: "#b89a5a",
                                      strokeWidth: "2",
                                    }),
                                  ],
                                }),
                              o?.id === "J" &&
                                showKey("J", "J.cols") &&
                                _("g", {
                                  "data-anim-key": "J.cols",
                                  opacity: 0.9,
                                  children: [
                                    h("line", {
                                      x1: CENTERS[0].x,
                                      y1: CENTERS[0].y,
                                      x2: CENTERS[6].x,
                                      y2: CENTERS[6].y,
                                      stroke: "#4a6741",
                                      strokeWidth: "2",
                                    }),
                                    h("line", {
                                      x1: CENTERS[1].x,
                                      y1: CENTERS[1].y,
                                      x2: CENTERS[7].x,
                                      y2: CENTERS[7].y,
                                      stroke: "#4a6741",
                                      strokeWidth: "2",
                                    }),
                                    h("line", {
                                      x1: CENTERS[2].x,
                                      y1: CENTERS[2].y,
                                      x2: CENTERS[8].x,
                                      y2: CENTERS[8].y,
                                      stroke: "#4a6741",
                                      strokeWidth: "2",
                                    }),
                                  ],
                                }),
                            ],
                          }),
                          o?.id === "C" &&
                            _(Be, {
                              children: [
                                showKey("C", "C.label-0") &&
                                  h("div", {
                                    className:
                                      "absolute text-[10px] font-mono bg-[#1a1a1a] text-white px-2 py-1 rounded-full shadow",
                                    style: { left: (CENTERS[7].x + CENTERS[8].x) / 2 - 29, top: CENTERS[7].y - 9 },
                                  children: "1+6=7",
                                }),
                                showKey("C", "C.label-1") &&
                                  h("div", {
                                    className:
                                      "absolute text-[10px] font-mono bg-[#1a1a1a] text-white px-2 py-1 rounded-full shadow",
                                    style: { left: CENTERS[5].x - 29, top: (CENTERS[5].y + CENTERS[2].y) / 2 - 29 },
                                    children: "7+2=9",
                                }),
                                showKey("C", "C.label-2") &&
                                  h("div", {
                                    className:
                                      "absolute text-[10px] font-mono bg-[#c96442] text-white px-2 py-1 rounded-full shadow",
                                    style: { left: (CENTERS[1].x + CENTERS[0].x) / 2 - 44, top: CENTERS[1].y - 32 },
                                    children: "9+4=13→3",
                                }),
                                showKey("C", "C.label-3") &&
                                  h("div", {
                                    className:
                                      "absolute text-[10px] font-mono bg-[#1a1a1a] text-white px-2 py-1 rounded-full shadow",
                                    style: { left: CENTERS[3].x - 39, top: (CENTERS[3].y + CENTERS[6].y) / 2 - 34 },
                                    children: "3+8=11→1",
                                }),
                              ],
                            }),
                          o?.id === "D" &&
                            _(Be, {
                              children: [
                                showKey("D", "D.label-0") &&
                                  h("div", {
                                    className:
                                      "absolute text-[9px] font-mono bg-[#7a6a9e] text-white px-2 py-1 rounded-full",
                                    style: { left: (CENTERS[1].x + CENTERS[0].x) / 2 - 29, top: CENTERS[1].y - 32 },
                                    children: "5+9→4",
                                }),
                                showKey("D", "D.label-1") &&
                                  h("div", {
                                    className:
                                      "absolute text-[9px] font-mono bg-[#7a6a9e] text-white px-2 py-1 rounded-full",
                                    style: { left: CENTERS[2].x - 46, top: CENTERS[2].y - 25 },
                                    children: "5+7→2",
                                }),
                                showKey("D", "D.label-2") &&
                                  h("div", {
                                    className:
                                      "absolute text-[9px] font-mono bg-[#7a6a9e] text-white px-2 py-1 rounded-full",
                                    style: { left: (CENTERS[7].x + CENTERS[8].x) / 2 - 19, top: CENTERS[7].y - 33 },
                                    children: "5+1→6",
                                }),
                                showKey("D", "D.label-3") &&
                                  h("div", {
                                    className:
                                      "absolute text-[9px] font-mono bg-[#7a6a9e] text-white px-2 py-1 rounded-full",
                                    style: { left: CENTERS[3].x - 32, top: (CENTERS[3].y + CENTERS[6].y) / 2 + 20 },
                                    children: "5+3→8",
                                  }),
                              ],
                            }),
                          o?.id === "J" &&
                            _(Be, {
                              children: [
                                showKey("J", "J.badge-rows") &&
                                  _("div", {
                                    className:
                                      "absolute left-0 right-0 flex justify-center gap-2",
                                    style: { bottom: -38 },
                                  children: [
                                    h("span", {
                                      className:
                                        "text-[11px] font-mono bg-white border px-2 py-1 rounded-full",
                                      children: "492 + 357 + 816 = 1665",
                                    }),
                                    showKey("J", "J.badge-reveal") &&
                                      h("span", {
                                        className:
                                          "text-[11px] font-mono bg-[#1a1a1a] text-white px-2 py-1 rounded-full",
                                        children: "15×111",
                                      }),
                                  ],
                                }),
                                showKey("J", "J.badge-cols") &&
                                  h("div", {
                                    className:
                                      "absolute left-0 right-0 flex justify-center gap-2",
                                    style: { top: -34 },
                                  children: h("span", {
                                    className:
                                      "text-[11px] font-mono bg-white border px-2 py-1 rounded-full",
                                    children: "438 + 951 + 276 = 1665",
                                  }),
                                }),
                              ],
                            }),
                          o?.id === "E" &&
                            _(Be, {
                              children: [
                                showKey("E", "E.badge-total") &&
                                  h("div", {
                                    className:
                                      "absolute text-[10px] font-mono bg-[#1a1a1a] text-white px-2.5 py-1 rounded-full",
                                    style: {
                                      left: "50%",
                                      top: -16,
                                      transform: "translateX(-50%)",
                                    },
                                    children: "Total 45 = 9×5",
                                }),
                                showKey("E", "E.badge-magic") &&
                                  h("div", {
                                    className:
                                      "absolute text-[10px] font-mono bg-white border px-2.5 py-1 rounded-full",
                                    style: {
                                      left: "50%",
                                      top: "50%",
                                      transform: "translate(-50%, 78px)",
                                    },
                                    children: "Magic 15 = 3×5",
                                  }),
                                showKey("E", "E.badge-opp") &&
                                  h("div", {
                                    className:
                                      "absolute text-[10px] font-mono bg-[#b89a5a] text-white px-2.5 py-1 rounded-full",
                                    style: {
                                      left: "50%",
                                      top: "50%",
                                      transform: "translate(-50%, -88px)",
                                    },
                                    children: "Opposite 10 = 2×5",
                                  }),
                              ],
                            }),
                          o?.id === "F" &&
                            _(Be, {
                              children: [
                                showKey("F", "F.badge-corners") &&
                                  h("div", {
                                    className:
                                      "absolute text-[10px] font-mono bg-[#c96442] text-white px-2 py-1 rounded-full",
                                    style: { left: 8, top: -18 },
                                    children: "Corners even Σ20",
                                  }),
                                showKey("F", "F.badge-edges") &&
                                  h("div", {
                                    className:
                                      "absolute text-[10px] font-mono bg-[#4a6741] text-white px-2 py-1 rounded-full",
                                    style: { right: 8, top: -18 },
                                    children: "Edges odd Σ20",
                                  }),
                              ],
                            }),
                          o?.id === "K" &&
                            h(Be, {
                              children:
                                showKey("K", "K.badge") &&
                                h("div", {
                                  className:
                                    "absolute left-1/2 -translate-x-1/2 text-[10px] font-mono bg-[#1a1a1a] text-white px-3 py-1 rounded-full whitespace-nowrap",
                                style: { bottom: -36 },
                                children:
                                  "det = 360 = 3×4×5×6 (reflections flip the sign)",
                              }),
                            }),
                          o?.id === "I" &&
                            _(Be, {
                              children: [
                                showKey("I", "I.label-0") &&
                                  h("div", {
                                    className:
                                      "absolute text-[9px] font-mono bg-white border px-1.5 py-0.5 rounded-full",
                                    style: { left: CENTERS[0].x + 58, top: CENTERS[0].y + 9 },
                                    children: "(4+6)/2=5",
                                  }),
                                showKey("I", "I.label-1") &&
                                  h("div", {
                                    className:
                                      "absolute text-[9px] font-mono bg-white border px-1.5 py-0.5 rounded-full",
                                    style: { left: CENTERS[1].x + 34, top: CENTERS[1].y + 9 },
                                    children: "(9+1)/2=5",
                                  }),
                                showKey("I", "I.label-2") &&
                                  h("div", {
                                    className:
                                      "absolute text-[9px] font-mono bg-white border px-1.5 py-0.5 rounded-full",
                                    style: { left: CENTERS[3].x + 58, top: CENTERS[3].y + 58 },
                                    children: "(3+7)/2=5",
                                  }),
                              ],
                            }),
                          o?.id === "M" &&
                            h("div", {
                              className:
                                "absolute right-2 -top-2 text-[9px] font-mono bg-[#7a6a9e] text-white px-2 py-1 rounded-full",
                              children: "torus wrap • dashed",
                            }),
                          o?.id === "N" &&
                            h("div", {
                              className: "absolute inset-0 pointer-events-none",
                              children: [
                                { r: 0, x: -96, y: -96 },
                                { r: 90, x: 0, y: -96 },
                                { r: 180, x: 96, y: -96 },
                                { r: 270, x: 96, y: 0 },
                                { r: 0, x: 96, y: 96, mirror: !0 },
                                { r: 0, x: 0, y: 96, mirror: !0 },
                                { r: 0, x: -96, y: 96, mirror: !0 },
                                { r: 0, x: -96, y: 0, mirror: !0 },
                              ].map((i, a) => {
                                if (!showKey("N", `N.mini-${a}`)) return null;
                                return h(
                                  "div",
                                  {
                                    "data-anim-key": `N.mini-${a}`,
                                    className:
                                      "absolute w-[48px] h-[48px] grid grid-cols-3 gap-[2px] p-[3px] bg-white/80 border rounded-[8px] opacity-60 blur-[0.2px]",
                                    style: {
                                      left: "50%",
                                      top: "50%",
                                      transform: `translate(calc(-50% + ${i.x}px), calc(-50% + ${i.y}px)) rotate(${i.r}deg) ${i.mirror ? "scaleX(-1)" : ""}`,
                                    },
                                    children: SQUARE.map((m, d) =>
                                      h(
                                        "div",
                                        {
                                          className:
                                            "bg-[#1a1a1a]/10 rounded-[3px] flex items-center justify-center text-[6px] font-mono",
                                          children: m,
                                        },
                                        d,
                                      ),
                                    ),
                                  },
                                  a,
                                );
                              }),
                            }),
                          ],
                        }),
                      ],
                    }),
                    h("div", {
                      className: "mt-4",
                      children: [
                        _("div", {
                          className: "flex flex-wrap items-center gap-1.5",
                          role: "group",
                          "aria-label": "Correspondences legend",
                          children: [
                            h(
                              "span",
                              {
                                className:
                                  "text-[10px] font-mono uppercase tracking-widest opacity-50 mr-1",
                                children: "Correspondences",
                              },
                              "legend-title",
                            ),
                            ...LEGEND_LAYERS.map((layer) => {
                              let active = legend === layer.id;
                              return h(
                                "button",
                                {
                                  onClick: () => setLegend(layer.id),
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
                          className: "mt-1.5 text-[10px] font-mono opacity-50",
                          children:
                            legend === "trigrams"
                              ? "Later Heaven arrangement; center 5 has no trigram."
                              : legend === "tones"
                                ? "Five tones mapped via the five phases — interpretive."
                                : legend === "elements"
                                  ? "One phase per number by Later Heaven direction."
                                  : legend === "parity"
                                    ? "Evens in the corners, odds as a cross."
                                    : legend === "directions"
                                      ? "Chinese map: north at the bottom."
                                      : "Overlay a traditional reading on the nine cells.",
                        }, "legend-caption"),
                      ],
                    }),
                    script &&
                      h("div", {
                        className: "anim-rail",
                        role: "group",
                        "aria-label": `${script.title} animation playback`,
                        children: [
                          _("div", {
                            className: "anim-rail-row",
                            children: [
                              h("button", {
                                onClick: animPrev,
                                className: "anim-rail-btn",
                                "aria-label": "Previous animation step",
                                title: "Previous step",
                                children: "‹",
                              }),
                              h("button", {
                                onClick: animPlaying ? animPause : animPlay,
                                className: "anim-rail-btn anim-rail-play",
                                "aria-label": animPlaying
                                  ? "Pause animation"
                                  : "Play animation",
                                title: animPlaying ? "Pause" : "Play",
                                children: animPlaying ? "❚❚" : "▶",
                              }),
                              h("button", {
                                onClick: animNext,
                                className: "anim-rail-btn",
                                "aria-label": "Next animation step",
                                title: "Next step",
                                children: "›",
                              }),
                              h("button", {
                                onClick: animReset,
                                className: "anim-rail-btn",
                                "aria-label": "Reset animation",
                                title: "Reset",
                                children: "↺",
                              }),
                              h("button", {
                                onClick: animSpeedCycle,
                                className: "anim-rail-btn anim-rail-speed",
                                "aria-label": "Cycle playback speed",
                                title: "Playback speed",
                                children: `${animSpeed}×`,
                              }),
                            ],
                          }),
                          h("div", {
                            className: "anim-rail-meta",
                            children:
                              started && frame
                                ? `Step ${frame.stepIndex + 1} of ${script.steps.length}`
                                : `${script.steps.length} steps`,
                          }),
                          h("div", {
                            className: "anim-rail-caption",
                            children:
                              started && frame
                                ? frame.caption
                                : `Play to watch: ${script.title}.`,
                          }),
                        ],
                      }),
                    h("div", {
                      className: "w-full max-w-[560px] mt-12 lg:mt-16",
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
                              className: "px-6 lg:px-8 py-6",
                              children: [
                                _("div", {
                                  className:
                                    "flex items-start justify-between gap-4",
                                  children: [
                                    _("div", {
                                      className: "flex gap-3",
                                      children: [
                                        h("span", {
                                          className:
                                            "w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-[11px] font-mono font-bold",
                                          children: o.letter,
                                        }),
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
                                    h("button", {
                                      onClick: () => n(null),
                                      className:
                                        "w-7 h-7 rounded-full border border-[#1a1a1a]/15 flex items-center justify-center hover:bg-[#1a1a1a] hover:text-white transition-colors",
                                      children: h("span", {
                                        className: "text-[14px] leading-none",
                                        children: "×",
                                      }),
                                    }),
                                  ],
                                }),
                                h("div", {
                                  className: "mt-5",
                                  children: _("div", {
                                    className:
                                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#fdf8f0] border border-[#1a1a1a]/10",
                                    children: [
                                      h("span", {
                                        className:
                                          "w-1.5 h-1.5 rounded-full bg-[#c96442]",
                                      }),
                                      h("code", {
                                        className:
                                          "text-[12px] font-mono tracking-tight",
                                        children: o.formula,
                                      }),
                                    ],
                                  }),
                                }),
                                h("p", {
                                  className:
                                    "mt-4 text-[14px] leading-[1.7] opacity-75",
                                  style: {
                                    fontFamily: "'Newsreader', Georgia, serif",
                                  },
                                  children: o.longDesc,
                                }),
                                _("div", {
                                  className:
                                    "mt-6 pt-5 border-t border-[#1a1a1a]/[0.06] grid grid-cols-3 gap-3",
                                  children: [
                                    _("div", {
                                      children: [
                                        h("div", {
                                          className:
                                            "text-[9px] font-mono uppercase tracking-widest opacity-40",
                                          children: "Visual key",
                                        }),
                                        ...(VISUAL_KEYS[o.id] || VISUAL_KEYS.A).map(
                                          ([color, label, dashed], k) =>
                                            _("div", {
                                              className: `${k === 0 ? "mt-1.5" : "mt-1"} flex items-center gap-1.5`,
                                              children: [
                                                h("span", {
                                                  className:
                                                    "w-3 h-0.5 inline-block",
                                                  style: dashed
                                                    ? { borderTop: `1px dashed ${color}` }
                                                    : { background: color },
                                                }),
                                                h("span", {
                                                  className:
                                                    "text-[10px] font-mono",
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
                                            "text-[9px] font-mono uppercase tracking-widest opacity-40",
                                          children: "Center",
                                        }),
                                        h("div", {
                                          className:
                                            "mt-1.5 text-[12px] font-mono",
                                          children:
                                            "5 = mean, median, fulcrum. Everything folds through it.",
                                        }),
                                      ],
                                    }),
                                    _("div", {
                                      children: [
                                        h("div", {
                                          className:
                                            "text-[9px] font-mono uppercase tracking-widest opacity-40",
                                          children: "Source",
                                        }),
                                        h("div", {
                                          className:
                                            "mt-1.5 text-[10px] font-mono opacity-60 leading-[1.4]",
                                          children:
                                            "Lo Shu, Song dynasty recompilation of He Tu Luo Shu. Arithmetic verified in js/verify.js (npm run check).",
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          }),
                    }),
                  ],
                }),
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

export { LoShuApp, iconGlyphs, PROPERTIES, CATEGORIES, SQUARE };
