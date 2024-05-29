// import { saxis } from "./draggingSphereUsage.js";

const mod = (a, n, nL = 0) =>
  ((((a - nL) % (n - nL)) + (n - nL)) % (n - nL)) + nL;
function makeDraggable(state, el) {
  // from https://www.redblobgames.com/making-of/draggable/
  let pos = 0;
  let dragging = null;
  // modified from https://www.redblobgames.com/making-of/draggable/
  function start(event) {
    if (event.button !== 0) return; // left button only
    let { x, y } = state.eventToCoordinates(event);
    dragging = pos - y;
    el.classList.add("dragging");
    // for (const clone of clones) clone.classList.add("dragging");
    el.setPointerCapture(event.pointerId);
  }

  function end(_event) {
    dragging = null;
    el.classList.remove("dragging");
    // for (const clone of clones) clone.classList.remove("dragging");
  }

  function move(event) {
    if (dragging === null) return;
    let { x, y } = state.eventToCoordinates(event);

    const newPos = y + dragging;
    const diff = newPos - pos;
    pos = newPos;
    state.movey(diff);
  }

  el.addEventListener("pointerdown", start);
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
  el.addEventListener("pointermove", move);
  el.addEventListener("touchstart", (e) => e.preventDefault());
}

function eventToSvgCoordinates(event, el = event.currentTarget) {
  const svg = el.ownerSVGElement;
  let p = svg.createSVGPoint();
  p.x = event.clientX;
  p.y = event.clientY;
  p = p.matrixTransform(svg.getScreenCTM().inverse());
  return p;
}

const makeIt = (el, width, f) => {
  let state = {
    eventToCoordinates: eventToSvgCoordinates,
    dragging: null,
    _y: undefined,
    setActive(isActive) {
      if (isActive) {
        el.style.fill = "white";
        el.style.stroke = "black";
        // el.classList.add("draggable");
        el.parentElement.append(el); // move to top of drawing order
      } else {
        el.style.fill = "#bbb";
        el.style.stroke = "#bbb";
        // el.classList.remove("draggable");
      }
    },
    get y() {
      return this._y;
    },
    movey(n) {
      this.sety(this._y + n);
    },
    sety(n, shouldRecurse = true) {
      this._y = n;

      el.setAttribute("cy", mod(this._y, 0, width));

      if (shouldRecurse) {
        try {
          f(this._y);
        } catch (e) {}
      }
    },
  };
  makeDraggable(state, el);
  return state;
};
export const s1 = makeIt(
  document.getElementsByClassName("draggable-circle")[0],
  200,
  (y) => {
    window.scrub = s1 === active ? y : -y;
    try {
      s2.sety(-y, false);
      document.getElementById("dragging1")!.style.width = Math.abs(
        mod(window.scrub, -100, 100) * 1.8
      );

      document
        .getElementById("dragging1")!
        .querySelector(".draggable")
        ?.setAttribute("r", Math.abs(600 / mod(window.scrub, -100, 100)));
      document
        .getElementById("dragging1")!
        .querySelector(".clone")
        ?.setAttribute("r", Math.abs(600 / mod(window.scrub, -100, 100)));
    } catch (e) {}
  }
);

export const s2 = makeIt(
  document.getElementsByClassName("draggable-circle")[1],
  200,
  (y) => {
    window.scrub = s2 === active ? y : -y;
    try {
      s1.sety(-y, false);
      //saxis.radius(Math.abs(mod(y + 100, -100, 100)) / 2 + 6);
      document.getElementById("dragging1")!.style.width = Math.abs(
        mod(window.scrub, -100, 100) * 1.8
      );

      document
        .getElementById("dragging1")!
        .querySelector(".draggable")
        ?.setAttribute("r", Math.abs(600 / mod(window.scrub, -100, 100)));
      document
        .getElementById("dragging1")!
        .querySelector(".clone")
        ?.setAttribute("r", Math.abs(600 / mod(window.scrub, -100, 100)));
    } catch (e) {}
  }
);
window.scrub = 80;
s1.sety(80);
s2.sety(120);

export let active = s1;
s1.setActive(true);
s2.setActive(false);
export const swapActive = () => {
  window.scrub = -window.scrub;
  if (active === s1) {
    s1.setActive(false);
    s2.setActive(true);
    active = s2;
  } else {
    s2.setActive(false);
    s1.setActive(true);
    active = s1;
  }
};
