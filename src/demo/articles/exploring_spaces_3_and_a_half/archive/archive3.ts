import { mod } from "../../../lib/math/Number.js";

function makeDraggable(state, el) {
  // from https://www.redblobgames.com/making-of/draggable/
  function start(event) {
    if (event.button !== 0) return; // left button only
    //if (event.target instanceof SVGTextElement) return;
    let { x, y } = state.eventToCoordinates(event);
    state.dragging = { dx: state.pos.x - x, dy: state.pos.y - y };
    el.classList.add("dragging");
    el.setPointerCapture(event.pointerId);
  }

  function end(_event) {
    state.dragging = null;
    el.classList.remove("dragging");
  }

  function move(event) {
    if (!state.dragging) return;
    event.preventDefault();
    let { x, y } = state.eventToCoordinates(event);
    state.pos = { x: x + state.dragging.dx, y: y + state.dragging.dy };
  }

  el.addEventListener("pointerdown", start);
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
  el.addEventListener("pointermove", move);
  el.addEventListener("touchstart", (e) => e.preventDefault());
}

export const lines = document.querySelectorAll("#dragging1 .line");

let zoom = 1;

const RATE = 50;
const WIDTH = 280;
const MAXSIZE = 1.5;
const FALLOFF = WIDTH * 0.87;

const bump = (n) => Math.max(0, -((n / FALLOFF) ** 2) + MAXSIZE);

// smooth partial geometric series formula ref: https://activecalculus.org/single/sec-8-2-geometric.html
const geomSeries = (a, r) => (n) => (a * (1 - r ** n)) / (1 - r);
const approachOne = (ratio) => geomSeries(ratio, 1 - ratio);

const f = (n, z) =>
  approachOne(1 / 5)(Math.abs(n) + Math.log2(z)) * Math.sign(n);

let state = {
  eventToCoordinates(event) {
    return { x: event.clientX, y: event.clientY };
  },
  dragging: null,
  _pos: undefined as undefined | { x; y },
  get pos(): undefined | { x; y } {
    return this._pos;
  },
  set pos(p: { x; y }) {
    this._pos = { x: p.x, y: p.y };

    this.render();
  },
  render() {
    if (!this._pos) return;

    const x = (this._pos.x / RATE) % 1;
    const cx = -this._pos.x / RATE;

    const z = 2 ** (zoom % 1);

    let i = Math.floor(-lines.length / 2);
    for (const line of lines) {
      const pos = f(x + i, z) * WIDTH;
      const size = bump(pos);
      const value = (i + Math.trunc(cx)) / 2;
      let s = 1 - Math.abs(value % 1);

      const closeness = z - 1 / s;

      const scurve = (s) => (Math.tanh(6 * s - 3) + 1) / 2;
      const scalerThing = scurve(closeness + 1);

      line?.setAttribute(
        "transform",
        `translate(${pos.toFixed(3)} 0) scale(${size.toFixed(3)})`
      );

      // Math.trunc(zoom)
      line.querySelector("text").textContent = value.toFixed(2);

      i++;
    }
  },
};

function draw() {
  requestAnimationFrame(draw);
  zoom += 0.002;
  //console.log(zoom);
  state.render();
}
draw();
state.pos = { x: 0, y: 0 };
makeDraggable(state, document.querySelector("#dragging1"));
