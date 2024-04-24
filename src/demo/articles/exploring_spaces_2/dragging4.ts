const mod = (a, n, nL = 0) =>
  ((((a - nL) % (n - nL)) + (n - nL)) % (n - nL)) + nL;
function makeDraggable(state, el) {
  // from https://www.redblobgames.com/making-of/draggable/
  function start(event) {
    if (event.button !== 0) return; // left button only
    let { x, y } = state.eventToCoordinates(event);
    state.dragging = { dx: state.prevX - x, dy: state.prevY - y };
    el.classList.add("dragging");
    el.setPointerCapture(event.pointerId);
  }

  function end(_event) {
    state.dragging = null;
    el.classList.remove("dragging");
  }

  function move(event) {
    if (!state.dragging) return;
    let { x, y } = state.eventToCoordinates(event);
    if (el.classList.contains("x")) state.x = x + state.dragging.dx;
    if (el.classList.contains("y")) state.y = y + state.dragging.dy;
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

const els = Array.from(document.querySelectorAll("#dragging4 .draggable"));
let state = {
  eventToCoordinates: eventToSvgCoordinates,
  dragging: null,
  prevX: 20,
  _x: 20,
  prevY: 20,
  _y: 20,
  get x() {
    return this._x;
  },
  set x(n) {
    const delta = n - this.prevX;
    this.prevX = n;

    this._x += delta;

    if (this._x >= 200 || this._x <= 0) {
      this._x = mod(this._x, 0, 200);
    }
    for (const el of els) {
      el.setAttribute("cx", this._x);
    }
  },
  get y() {
    return this._y;
  },
  set y(n) {
    const delta = n - this.prevY;
    this.prevY = n;

    this._y += delta;

    if (this._y >= 200 || this._y <= 0) {
      this._y = mod(this._y, 0, 200);
    }
    for (const el of els) {
      el.setAttribute("cy", this._y);
    }
  },
};
state.x = 20;
state.y = 20;
for (const el of els) makeDraggable(state, el);
