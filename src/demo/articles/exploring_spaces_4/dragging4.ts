import {
  angleBetween,
  rotate,
  length,
  v,
  mul,
} from "../../../lib/math/Vec2.js";
import { colorPickerSetPos } from "./dragging2.js";

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

    this._y -= delta / 1.4;
    this._x += delta / 1.4;

    if (this._x < 0) {
      console.log("hello!");
      const prevX = this._x;
      const prevY = this._y;
      this._y = 0.01;
      this._x = prevY;
    } else if (this._x > 200) {
      const prevX = this._x;
      const prevY = this._y;
      this._y = 199.99;
      this._x = prevY;
    }

    this.render();
  },
  get y() {
    return this._y;
  },
  set y(n) {
    const delta = n - this.prevY;
    this.prevY = n;

    this._y += delta / 1.4;
    this._x += delta / 1.4;

    if (this._y < 0) {
      const prevX = this._x;
      const prevY = this._y;
      this._y = Math.max(prevX, 0.01);
      this._x = 0.01;
    } else if (this._y > 200) {
      const prevX = this._x;
      const prevY = this._y;
      this._y = Math.min(prevX, 199.99);
      this._x = 199.99;
    }
    this.render();
  },
  render(shouldSetPos = true) {
    for (const el of els) {
      el.setAttribute("cx", this._x);
      el.setAttribute("cy", this._y);
    }

    if (!shouldSetPos) return;

    // angle to distance to edge of rectangle code
    // ref: https://stackoverflow.com/a/1343531
    // const width = 200;
    // const height = 200;
    // const abs_cos_angle = Math.abs(Math.cos(angle));
    // const abs_sin_angle = Math.abs(Math.sin(angle));
    // let magnitude = 0;
    // if ((width / 2) * abs_sin_angle <= (height / 2) * abs_cos_angle) {
    //   magnitude = width / 2 / abs_cos_angle;
    // } else {
    //   magnitude = height / 2 / abs_sin_angle;
    // }

    // NOT A HOMEOMORPHISM!
    // const dist = Math.min(
    //   0.99,
    //   length([this._x - 100, this._y - 100]) / magnitude
    // );
    // if (dist < 0.5) {
    //   colorPickerSetPos(...rotate(v(dist * 70), angle), 0);
    // } else {
    //   colorPickerSetPos(...rotate(v(70 - dist * 70), angle - Math.PI), 1);
    // }

    const recth = Math.min(1, Math.abs(1 - (this._x + this._y) / 200));
    const rectw = Math.min(1, Math.abs((this._x - this._y) / 200));
    const trih = rectw === 0 ? 0 : recth / (1 - rectw);
    const triw = recth === 0 ? 0 : rectw / (1 - recth);

    let R = 50;
    const circleWidthAtY = Math.sqrt(50 ** 2 - (recth * R) ** 2);
    // const circleHeightAtX = Math.sqrt(1 - rectw ** 2);

    // console.log(
    //   [triw, trih],
    //   "->",
    //   length([2 * (triw - 0.5) * circleWidthAtY, -recth * R])
    // );

    // quadrant code
    const angle = angleBetween([100, 100], [this._x, this._y]);
    const rotAngle = angle + Math.PI / 4;
    if (rotAngle <= -Math.PI / 2 || rotAngle >= Math.PI)
      colorPickerSetPos(...[-(triw * 2 - 1) * circleWidthAtY, -recth * R], 0);
    else if (rotAngle <= 0 && rotAngle >= -Math.PI / 2)
      colorPickerSetPos(...[(triw * 2 - 1) * circleWidthAtY, recth * R], 1);
    else if (rotAngle < Math.PI / 2 && rotAngle > 0)
      colorPickerSetPos(...[(triw * 2 - 1) * circleWidthAtY, -recth * R], 1);
    else colorPickerSetPos(...[-(triw * 2 - 1) * circleWidthAtY, recth * R], 0);

    // console.log(angle.toFixed(2));
  },
};
state.x = 40;
state.y = 100;
for (const el of els) makeDraggable(state, el);

export const setPos = (x, y) => {
  state._x = x;
  state._y = y;
  state.render(false);
};
