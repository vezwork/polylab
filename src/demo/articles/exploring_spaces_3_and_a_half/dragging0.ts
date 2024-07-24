import { clamp, log } from "../../../lib/math/Number.js";
import {
  BaseExpNumerals,
  bigNumberToRadixNumber,
  changeTrailingZeroesIntoBaseExponent,
  displayRadixNumeralsBase10OrLess,
} from "./numerals.js";
import { makeDraggable } from "./makeDraggable.js";
import { mod } from "../../../lib/math/Number.js";
import {
  RadixSplitNum,
  radixSplitNumAdd,
  radixSplitNumFromNumber,
} from "./radixSplitNum.js";
radixSplitNumAdd;

let BASE = 10;
window.setBase = (b) => (BASE = b);
let SPACING = 40;
window.setSpacing = (n) => (SPACING = n);
const SVG_WIDTH_SCALE = 1;

const svg = document.querySelector("#dragging0") as SVGElement;
const createLine = () => {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.classList.add("line");
  const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
  l.setAttribute("x1", "0");
  l.setAttribute("y1", "-10");
  l.setAttribute("x2", "0");
  l.setAttribute("y2", "10");
  l.setAttribute("stroke", "black");
  l.setAttribute("stroke-width", "1");
  const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
  t.setAttribute("x", "0");
  t.setAttribute("y", "0");
  t.setAttribute("text-anchor", "middle");
  g.append(l, t);
  svg.prepend(g);
  return g;
};
// caches lines into a pool. If there is an existing line that is unused,
// reuse it to render something new, otherwise create a new line.
// Usage of this results in there being a fixed number of line elements being created
// in the beginning moments of zooming
const getLine = (i): SVGGElement => {
  const lines = document.querySelectorAll("#dragging0 .line");
  const line = lines[i];
  if (line) return line as SVGGElement;
  else return createLine();
};

let zoom = 0;

function draw() {
  requestAnimationFrame(draw);
  state.render();
}
requestAnimationFrame(draw);

let state = {
  dragging: null,
  // my coordinates are messed up, so this is the pos value for pi.
  // see the first line of `render()` to see why.
  pos: Math.PI,
  render() {
    const x = this.pos;
    // ARBITRARY PRECISION INDEPENDENT:
    const halfWidth = (svg.clientWidth * SVG_WIDTH_SCALE) / 2;
    const thing = Math.ceil(halfWidth / SPACING);

    // ARBITRARY PRECISION SIMPLE NUMBER
    const zoomBaseExponent = zoom / 3000;
    const maxIterationsForHalfTicks = thing * 10 ** mod(-zoomBaseExponent, 1);
    const baseExponent = -Math.ceil(zoomBaseExponent);

    // NUM, ZOOM, LAYOUT CALC

    // EXP
    const zz = BASE ** zoomBaseExponent;
    const numTickGap = BASE ** baseExponent;

    // TRUNC
    // as you zoom in this uses more of x, as you zoom out it truncates
    const startInGapBase = Math.round(x / numTickGap);
    const startX = startInGapBase * numTickGap;

    const truncAt = (x: RadixSplitNum, i: number) => {
      if (i <= 0)
        return {
          leftOfRadix: x.leftOfRadix,
          rightOfRadix: x.rightOfRadix.slice(0, -i),
        };
      else return { leftOfRadix: x.leftOfRadix.slice(0, -i), rightOfRadix: [] };
    };

    // const N = radixSplitNumFromNumber(x, BASE);
    // const NstartX = truncAt(N, baseExponent);
    // const NstartInGapBase = NstartX.leftOfRadix.concat(NstartX.rightOfRadix);

    // console.log(startInGapBase, NstartInGapBase);

    // e.g.
    // baseExponent:   -3
    // numTickGap:     0.001
    // startInGapBase: 3142
    // startX:         3.142

    // SVG INSERTION

    let linei = 0;

    svg.style.border = "none";

    document.getElementById("position_num").textContent = x.toFixed(
      Math.max(0, -baseExponent)
    );

    // Start in the middle and render out to the right:
    let numInGapBase = startInGapBase;
    let num = startX; // num = numInGapBase * BigInt(gap);
    let i = 0;
    while (i <= maxIterationsForHalfTicks) {
      renderNumberTick(num, BaseExpNumerals(numInGapBase, BASE, baseExponent));

      numInGapBase++;
      let prevNum = num;
      num += numTickGap;
      if (num === prevNum) {
        svg.style.border = "1px solid red";
        throw "Floating Point Error!";
      }
      i++;
    }

    // Start one unit left from the middle and render out to the left:
    numInGapBase = startInGapBase - 1;
    num = startX - numTickGap; // num = numInGapBase * BigInt(gap);
    i = 1;
    while (i <= maxIterationsForHalfTicks) {
      renderNumberTick(num, BaseExpNumerals(numInGapBase, BASE, baseExponent));

      numInGapBase--;
      let prevNum = num;
      num -= numTickGap;
      if (num === prevNum) {
        svg.style.border = "1px solid red";
        throw "Floating Point Error!";
      }
      i++;
    }

    function numberTickX(n) {
      return (n - x) * SPACING * zz;
    }
    function renderNumberTick(n, big: BaseExpNumerals) {
      const radixNum = bigNumberToRadixNumber(big);
      const display = displayRadixNumeralsBase10OrLess(radixNum);

      const pos = numberTickX(n);

      const scale =
        big.sign === 0n
          ? 1.5
          : clamp(
              0,
              1 +
                zoomBaseExponent +
                Number(changeTrailingZeroesIntoBaseExponent(big).baseExponent),
              1.5
            );
      const line = getLine(linei);
      line?.setAttribute(
        "transform",
        `translate(${pos.toFixed(3)} 0) scale(${scale})`
      );

      line.querySelector("text")!.textContent = display;

      const TEXT_HEIGHT = 23; // manually checked this for 16px font
      // make numbers with longer representations smaller, but not too small
      const NOT_TOO_SMALL = 1 / 3;
      const textScale = (1 / display.length) ** NOT_TOO_SMALL;

      let textSize = TEXT_HEIGHT * textScale;
      const textY = 16 + textSize / 2;
      line
        .querySelector("text")!
        .setAttribute("transform", `translate(0 ${textY}) scale(${textScale})`);

      linei++;
    }

    // HIDE UNUSED SVG ELEMENTS

    const lines = document.querySelectorAll("#dragging0 .line");
    for (linei; linei < lines.length; linei++) {
      const line = lines[linei];
      // translating out of view should be performant than actually hiding them?
      line?.setAttribute("transform", `translate(60000)`);
    }
  },
};

makeDraggable(
  document.querySelector("#dragging0"),
  (event) => ({ x: event.clientX, y: event.clientY }),
  ([x, y]) => {
    const zoomBaseExponent = zoom / 3000;
    const zz = BASE ** zoomBaseExponent;
    state.pos -= x / zz / 40;
  },
  (z) => {
    zoom += z;
  }
);

// make number line viewbox based on window width
// so the number line doesn't get too small on mobile
const el = document.querySelector("#dragging0");
const onSize = () => {
  el?.setAttribute(
    "viewBox",
    `${(-el.clientWidth * SVG_WIDTH_SCALE) / 2} -27 ${
      el.clientWidth * SVG_WIDTH_SCALE
    } 80`
  );
};
window.addEventListener("resize", onSize);
onSize();
