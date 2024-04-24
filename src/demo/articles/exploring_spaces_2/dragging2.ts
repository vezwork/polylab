import {
  Vec2,
  add,
  angleOf,
  length,
  setAngle,
  setLength,
  sub,
} from "../../../lib/math/Vec2.js";

function makeDraggable(state, el, ...clones) {
  // from https://www.redblobgames.com/making-of/draggable/
  function start(event) {
    if (event.button !== 0) return; // left button only
    let { x, y } = state.eventToCoordinates(event);
    state.dragging = { dx: state.pos.x - x, dy: state.pos.y - y };
    el.classList.add("dragging");
    for (const clone of clones) clone.classList.add("dragging");
    el.setPointerCapture(event.pointerId);
  }

  function end(_event) {
    state.dragging = null;
    el.classList.remove("dragging");
    for (const clone of clones) clone.classList.remove("dragging");
  }

  function move(event) {
    if (!state.dragging) return;
    let { x, y } = state.eventToCoordinates(event);
    state.pos = { x: x + state.dragging.dx, y: y + state.dragging.dy };
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

const v2 = ({ x, y }) => [x, y] as Vec2;
const xy = ([x, y]) => ({
  x,
  y,
});

const reverse = (v) =>
  setLength(100 - length(v), setAngle(angleOf(v) + Math.PI)(v));

// Make the circle draggable only to the snap points
const ela = document.querySelector(
  "#dragging2a circle.draggable"
) as SVGCircleElement;
const elb = document.querySelector(
  "#dragging2b circle.draggable"
) as SVGCircleElement;
const clonea = document.querySelector(
  "#dragging2a circle.clone"
) as SVGCircleElement;
const cloneb = document.querySelector(
  "#dragging2b circle.clone"
) as SVGCircleElement;
let state = {
  el: ela,
  clone: cloneb,
  eventToCoordinates: eventToSvgCoordinates,
  dragging: null,
  prevPos: { x: 0, y: 0 },
  _pos2: { x: 0, y: 0 },
  get pos() {
    return this.prevPos;
  },
  set pos(p) {
    const delta = sub(v2(p), v2(this.prevPos));
    this.prevPos = p;

    this._pos2 = xy(add(v2(this._pos2), delta));
    const v = v2(this._pos2);
    if (length(v) > 50) {
      this._pos2 = xy(reverse(v));
      if (this.el === ela) {
        elb.style.visibility = "visible";
        ela.style.visibility = "hidden";
        this.el = elb;
        clonea.style.visibility = "visible";
        cloneb.style.visibility = "hidden";
        this.clone = clonea;
      } else {
        ela.style.visibility = "visible";
        elb.style.visibility = "hidden";
        this.el = ela;
        cloneb.style.visibility = "visible";
        clonea.style.visibility = "hidden";
        this.clone = cloneb;
      }
    }

    const cpos = reverse(v2(this._pos2));
    this.clone?.setAttribute("cx", cpos[0]);
    this.clone?.setAttribute("cy", cpos[1]);

    this.el?.setAttribute("cx", this._pos2.x);
    this.el?.setAttribute("cy", this._pos2.y);
  },
};
makeDraggable(state, ela, cloneb, elb);
makeDraggable(state, elb, clonea, ela);
makeDraggable(state, clonea, elb, ela);
makeDraggable(state, cloneb, elb, ela);
