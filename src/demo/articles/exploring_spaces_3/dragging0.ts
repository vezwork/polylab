function makeDraggable(state, el) {
  // from https://www.redblobgames.com/making-of/draggable/
  function start(event) {
    if (event.button !== 0) return; // left button only
    if (event.target instanceof SVGTextElement) return;
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

export const lines = document.querySelectorAll("#dragging0 .line");
let skew = 0;

const f = (n) => n / 8;
const RATE = 30;
const WIDTH = 280;

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
    const delta = p.x - (this._pos?.x ?? 0);
    skew = -delta * 3;
    console.log(p.x, this._pos?.x);
    this._pos = { x: p.x, y: p.y };

    const x = (p.x / RATE) % 1;
    const cx = -p.x / RATE;

    let i = Math.floor(-lines.length / 2);
    for (const line of lines) {
      const pos = f(x + i) * WIDTH;
      line?.setAttribute(
        "transform",
        `translate(${pos.toFixed(3)} 0) skewX(${skew})`
      );
      i++;
      const textContent = (i + Math.trunc(cx) - 1).toFixed(0);
      line.querySelector("text")!.textContent = textContent;
    }
    console.log("value:", cx);
  },
};
function draw() {
  requestAnimationFrame(draw);
  if (!state.pos) return;
  skew -= skew * 0.1;
  const x = (state.pos.x / RATE) % 1;
  const cx = -state.pos.x / RATE;

  let i = Math.floor(-lines.length / 2);
  for (const line of lines) {
    const pos = f(x + i) * WIDTH;
    line?.setAttribute(
      "transform",
      `translate(${pos.toFixed(3)} 0) skewX(${skew})`
    );
    i++;
    const textContent = (i + Math.trunc(cx) - 1).toFixed(0);
    line.querySelector("text")!.textContent = textContent;
  }
}
draw();
state.pos = { x: 0, y: 0 };
makeDraggable(state, document.querySelector("#dragging0"));

// make number line viewbox based on window width
// so the number line doesn't get too small on mobile
const onSize = () => {
  document
    .querySelector("#dragging0")
    ?.setAttribute(
      "viewBox",
      `${(-window.innerWidth * 0.8) / 2} -30 ${window.innerWidth * 0.8} 80`
    );
};
window.addEventListener("resize", onSize);
onSize();
