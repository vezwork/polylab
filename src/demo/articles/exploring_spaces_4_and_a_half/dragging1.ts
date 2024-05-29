import {
  Vec2,
  add,
  angleOf,
  length,
  setAngle,
  setLength,
  sub,
} from "../../../lib/math/Vec2.js";
import { swapActive } from "./draggingCircle.js";

function makeDraggable(state, el, ...clones) {
  let pos = [0, 0] as Vec2;
  let dragging = null as Vec2 | null;
  // modified from https://www.redblobgames.com/making-of/draggable/
  function start(event) {
    if (event.button !== 0) return; // left button only
    let { x, y } = state.eventToCoordinates(event);
    dragging = [pos[0] - x, pos[1] - y];
    el.classList.add("dragging");
    for (const clone of clones) clone.classList.add("dragging");
    el.setPointerCapture(event.pointerId);
  }

  function end(_event) {
    dragging = null;
    el.classList.remove("dragging");
    for (const clone of clones) clone.classList.remove("dragging");
  }

  function move(event) {
    if (dragging === null) return;
    let { x, y } = state.eventToCoordinates(event);

    const newPos = [x + dragging[0], y + dragging[1]] as Vec2;
    const diff = sub(newPos, pos);
    pos = newPos;
    state.movePos(diff);
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
const el = document.querySelector("#dragging1 circle.draggable");
const clone = document.querySelector("#dragging1 circle.clone");
export const rp2State = {
  eventToCoordinates: eventToSvgCoordinates,
  dragging: null,
  pos: [0, 0] as [number, number],
  movePos(v) {
    this.setPos(add(this.pos, v));
  },
  setPos(p) {
    this.pos = p;

    if (length(p) > 50) {
      this.pos = reverse(p);
      swapActive();
    }

    const cpos = reverse(this.pos);
    clone?.setAttribute("cx", cpos[0]);
    clone?.setAttribute("cy", cpos[1]);

    el?.setAttribute("cx", this.pos[0]);
    el?.setAttribute("cy", this.pos[1]);
  },
};
makeDraggable(rp2State, el, clone);
makeDraggable(rp2State, clone, el);
