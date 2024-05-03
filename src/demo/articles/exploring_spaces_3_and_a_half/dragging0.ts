import { clamp, log } from "../../../lib/math/Number.js";

type Numerals = { numerals: bigint[]; sign: -1n | 0n | 1n; base: bigint };

const sign = (n) => (n === 0n ? 0n : n < 0n ? -1n : 1n);
const abs = (n) => (n < 0n ? -n : n);
// https://cs.stackexchange.com/a/10321
//  """Convert a positive number n to its digit representation in base b."""
const toNumerals = (n: bigint, base: bigint): Numerals => {
  let num = abs(n);
  const numerals: bigint[] = [];
  while (num > 0) {
    numerals.unshift(num % base);
    num = num / base;
  }
  return { numerals, sign: sign(n), base };
};
// """Compute the number given by digits in base b."""
const fromNumerals = ({ numerals, sign, base }: Numerals): bigint => {
  let n = 0n;
  for (const d of numerals) n = base * n + d;
  return n * sign;
};
//"""Convert the digits representation of a number from base b to base c."""
const convertBase = (numerals: Numerals, toBase: bigint) =>
  toNumerals(fromNumerals(numerals), toBase);

type BaseExpNumerals = Numerals & { baseExponent: bigint };

const changeTrailingZeroesIntoBaseExponent = ({
  numerals,
  sign,
  base,
  baseExponent,
}: BaseExpNumerals): BaseExpNumerals => {
  // address repeated 0n entries e.g. `numerals: [0n, 0n]`:
  if (sign === 0n) return { numerals: [], sign: 0n, base, baseExponent: 0n };

  const rev = numerals.toReversed();
  let numberOfZeroes = 0n;
  for (const num of rev) {
    if (num === 0n) numberOfZeroes++;
    else break;
  }
  return {
    numerals: numerals.slice(0, numerals.length - Number(numberOfZeroes)),
    sign,
    base,
    baseExponent: baseExponent + numberOfZeroes,
  };
};

type RadixNumber = { numerals: (bigint | ".")[]; sign: bigint; base: bigint };
// produces a radix number without any trailing zeroes after the radix
const bigNumberToRadixNumber = (big: BaseExpNumerals): RadixNumber => {
  const { numerals, sign, base, baseExponent } =
    changeTrailingZeroesIntoBaseExponent(big);
  return {
    numerals:
      baseExponent >= 0n
        ? numerals.concat(Array(Number(baseExponent)).fill(0n))
        : Array(Math.max(0, -Number(numerals.length) - Number(baseExponent)))
            .fill(0n)
            .concat(numerals)
            .toSpliced(Number(baseExponent), 0, "."),
    sign,
    base,
  };
};

console.log(
  bigNumberToRadixNumber({
    ...toNumerals(0n, 10n),
    baseExponent: 3n,
  })
);

function makeDraggable(state, el) {
  const evCache: any[] = [];
  let prevDiff = -1;
  function removeEvent(ev) {
    // Remove this event from the target's cache
    const index = evCache.findIndex(
      (cachedEv) => cachedEv.pointerId === ev.pointerId
    );
    evCache.splice(index, 1);
  }

  // from https://www.redblobgames.com/making-of/draggable/
  // modified to use https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures
  function start(event) {
    if (event.button !== 0) return; // left button only
    //if (event.target instanceof SVGTextElement) return;
    let { x, y } = state.eventToCoordinates(event);
    state.dragging = { dx: state.pos - x };
    el.classList.add("dragging");
    el.setPointerCapture(event.pointerId);

    //multitouch
    evCache.push(event);
  }

  function end(ev) {
    state.dragging = null;
    el.classList.remove("dragging");

    //multitouch
    removeEvent(ev);
    ev.target.style.background = "white";
    ev.target.style.border = "1px solid black";

    // If the number of pointers down is less than two then reset diff tracker
    if (evCache.length < 2) {
      prevDiff = -1;
    }
  }

  function move(ev) {
    if (!state.dragging) return;
    ev.preventDefault();
    let { x, y } = state.eventToCoordinates(ev);
    state.pos = x + state.dragging.dx;

    //multitouch
    // Find this event in the cache and update its record with this event
    const index = evCache.findIndex(
      (cachedEv) => cachedEv.pointerId === ev.pointerId
    );
    evCache[index] = event;
    // If two pointers are down, check for pinch gestures
    if (evCache.length === 2) {
      // Calculate the distance between the two pointers
      const curDiff = Math.abs(evCache[0].clientX - evCache[1].clientX);

      if (prevDiff > 0) {
        zoom += curDiff - prevDiff;
        // if (curDiff > prevDiff) {
        //   // The distance between the two pointers has increased
        //   log("Pinch moving OUT -> Zoom in", ev);
        //   ev.target.style.background = "pink";
        // }
        // if (curDiff < prevDiff) {
        //   // The distance between the two pointers has decreased
        //   log("Pinch moving IN -> Zoom out", ev);
        //   ev.target.style.background = "lightblue";
        // }
      }

      // Cache the distance for the next move event
      prevDiff = curDiff;
    }
  }

  el.addEventListener("pointerdown", start);
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
  el.addEventListener("pointermove", move);
  el.addEventListener("touchstart", (e) => e.preventDefault());
}

export const lines = document.querySelectorAll("#dragging0 .line");

const svg = document.querySelector("#dragging0")!;
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
  svg.append(g);
  return g;
};

const getLine = (i): SVGGElement => {
  const lines = document.querySelectorAll("#dragging0 .line");
  const line = lines[i];
  if (line) return line as SVGGElement;
  else return createLine();
};

let zoom = 1;
const RATE = 40;
const SPACING = 40;

svg.addEventListener("wheel", (e: any) => {
  e.preventDefault();
  if (e.ctrlKey) {
    // for some reason this is pinch-zoom?
    zoom *= Math.exp(-e.deltaY / 100);
  } else {
    zoom *= Math.exp(-e.deltaY / 600);
  }
});

function draw() {
  // seems to result in better performance than rendering in the input handlers
  requestAnimationFrame(draw);
  state.render();
}
requestAnimationFrame(draw);

let state = {
  eventToCoordinates(event) {
    return { x: event.clientX / zoom, y: event.clientY };
  },
  dragging: null,
  _pos: undefined as undefined | number,
  get pos(): undefined | number {
    return this._pos;
  },
  set pos(x: number) {
    this._pos = x;

    //this.render();
  },
  render() {
    const x = -this._pos / RATE;

    // NUM, ZOOM, LAYOUT CALC

    const halfWidth =
      (document.querySelector("#dragging0")?.clientWidth ?? 1) / 2.4;
    const halfWidthPerNum = halfWidth / (SPACING * zoom);

    const BASE = 10;

    const zoomBaseExponent = log(zoom, BASE);
    const baseExponent = -Math.ceil(zoomBaseExponent);

    const gap = BASE ** baseExponent;
    const startInGapBase = BigInt(Math.round(x / gap));

    const start = Math.round(x / gap) * gap;

    // SVG INSERTION

    let linei = 0;

    const px = (n) => (n - x) * SPACING * zoom;
    const insertp = (n, big: BaseExpNumerals) => {
      const radixNum = bigNumberToRadixNumber(big);
      const display =
        (radixNum.sign === 0n ? "0" : radixNum.sign === -1n ? "-" : "") +
        radixNum.numerals.join("");

      const pos = px(n);

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

      let textScale = (1 / display.length) ** (1 / 4);
      const TEXT_HEIGHT = 23;
      let textSize = TEXT_HEIGHT * textScale;
      line
        .querySelector("text")!
        .setAttribute(
          "transform",
          `translate(0 ${16 + textSize / 2}) scale(${textScale})`
        );
      linei++;
    };

    let numInGapBase = startInGapBase;
    let num = start; // num = numInGapBase * BigInt(gap);

    svg.style.border = "none";

    while (num < x + halfWidthPerNum) {
      insertp(num, {
        ...toNumerals(numInGapBase, BigInt(BASE)),
        baseExponent: BigInt(baseExponent),
      });

      numInGapBase++;
      let prevNum = num;
      num += gap;
      if (num === prevNum) {
        svg.style.border = "1px solid red";
        throw "Floating Point Error!";
      }
    }

    numInGapBase = startInGapBase - 1n;
    num = start - gap; // num = numInGapBase * BigInt(gap);
    while (num > x - halfWidthPerNum) {
      insertp(num, {
        ...toNumerals(numInGapBase, BigInt(BASE)),
        baseExponent: BigInt(baseExponent),
      });

      numInGapBase--;
      let prevNum = num;
      num -= gap;
      if (num === prevNum) {
        svg.style.border = "1px solid red";
        throw "Floating Point Error!";
      }
    }

    // HIDE UNUSED SVG ELEMENTS

    const lines = document.querySelectorAll("#dragging0 .line");
    for (linei; linei < lines.length; linei++) {
      const line = lines[linei];
      line?.setAttribute("transform", `translate(60000)`);
    }
  },
};

state.pos = 0;
makeDraggable(state, document.querySelector("#dragging0"));

// make number line viewbox based on window width
// so the number line doesn't get too small on mobile
const el = document.querySelector("#dragging0");
const onSize = () => {
  el?.setAttribute(
    "viewBox",
    `${(-el.clientWidth * 0.8) / 2} -30 ${el.clientWidth * 0.8} 80`
  );
};
window.addEventListener("resize", onSize);
onSize();
