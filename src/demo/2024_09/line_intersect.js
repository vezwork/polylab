// testing some line intersection geometry stuff using a UI.
// TODO: https://www.mathsisfun.com/geometry/construct-circle3pts.html

import { distance, sub } from "../../lib/math/Vec2.js";
import { lerp } from "../../lib/math/Line2.js";
import { interpolateHex, rgbFromGradientSample } from "../../lib/math/Color.js";

// intersect ref: https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection#Using_homogeneous_coordinates
const homoIntersect = ([a1, b1, c1], [a2, b2, c2]) => [
  b1 * c2 - b2 * c1,
  -(a2 * c1 - a1 * c2),
  a1 * b2 - a2 * b1,
];
const cartesianFromHomo = ([a, b, c]) => [a / c, b / c];
const homoFromPointAndVector = ([x, y], [dx, dy]) => [dy, dx, -dy * x + dx * y];
const evalHomo =
  ([a, b, c]) =>
  ([x, y]) =>
    a * x - b * y + c;

const c = document.getElementById("c");
const ctx = c.getContext("2d");

function drawCircle(p, r) {
  ctx.beginPath();
  ctx.ellipse(p[0], p[1], r, r, 0, 0, Math.PI * 2);
  ctx.stroke();
}

const PIXEL_SIZE = 5;
function drawHomoLine(l, [r, g, b]) {
  for (let x = 0; x < c.width; x += PIXEL_SIZE) {
    for (let y = 0; y < c.height; y += PIXEL_SIZE) {
      const t = Math.abs(evalHomo(l)([x, y])) / 2000;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${(0.4 - t).toFixed(2)})`;
      ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
    }
  }
}

class Point {
  static all = [];
  constructor(p) {
    this.p = p;
    Point.all.push(this);
  }
  draw() {
    drawCircle(this.p, 5);
    ctx.fillStyle = "white";
    ctx.fill();
  }
}

let dragging = null;
c.addEventListener("pointerdown", (e) => {
  const pointer = [e.offsetX, e.offsetY];
  const close = Point.all.find(({ p }) => distance(p, pointer) < 20);
  if (close) dragging = close;
  // new Point();
});
c.addEventListener("pointermove", (e) => {
  const pointer = [e.offsetX, e.offsetY];
  if (dragging) dragging.p = pointer;
});
c.addEventListener("pointerup", (e) => {
  const pointer = [e.offsetX, e.offsetY];
  dragging = null;
});

const p1 = new Point([100, 100]);
const p2 = new Point([200, 200]);
const p3 = new Point([300, 100]);
const p4 = new Point([300, 200]);
function draw() {
  requestAnimationFrame(draw);
  ctx.clearRect(0, 0, c.width, c.height);
  const h1 = homoFromPointAndVector(p1.p, sub(p2.p, p1.p));
  const h2 = homoFromPointAndVector(p3.p, sub(p4.p, p3.p));
  drawHomoLine(h1, [210, 20, 20]);
  drawHomoLine(h2, [109, 30, 255]);
  Point.all.forEach((p) => p.draw());
  drawCircle(cartesianFromHomo(homoIntersect(h1, h2)), 10);
  ctx.fillStyle = "black";
  ctx.fill();
}
draw();
