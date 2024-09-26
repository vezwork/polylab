import {
  distance,
  sub,
  assign,
  add,
  v,
  angleOf,
  fromPolar,
  length,
} from "../../lib/math/Vec2.js";
import { lerp } from "../../lib/math/Line2.js";
import { interpolateHex, rgbFromGradientSample } from "../../lib/math/Color.js";
import { mo, push } from "./lib.js";

const c = document.getElementById("c");
const ctx = c.getContext("2d");

function drawCircle(p, r) {
  ctx.beginPath();
  ctx.ellipse(p[0], p[1], r, r, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "black";
}
function drawLine(l) {
  if (l.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(...l[0]);
  for (const p of l) {
    ctx.lineTo(...p);
  }
}
//https://stackoverflow.com/a/6333775
function drawArrow(context, from, to) {
  const headlen = 14; // length of head in pixels
  const d = sub(to, from);
  const angle = angleOf(d);
  context.beginPath();
  context.moveTo(...from);
  context.lineTo(...to);
  context.lineTo(...sub(to, fromPolar(headlen, angle - Math.PI / 6)));
  context.moveTo(...to);
  context.lineTo(...sub(to, fromPolar(headlen, angle + Math.PI / 6)));
  context.stroke();
}

const nexts = (p) => Arrow.all.filter(({ p1 }) => p1 === p).map(({ p2 }) => p2);

function* bfs(start) {
  const visitedNodes = new Set([start]);
  const queue = [start];

  while (true) {
    const currentVertex = queue.shift();
    yield [currentVertex, visitedNodes, queue];

    for (const to of nexts(currentVertex)) {
      if (!visitedNodes.has(to)) {
        visitedNodes.add(to);
        queue.push(to);
        yield [currentVertex, visitedNodes, queue];
      }
    }
    if (queue.length === 0) {
      yield [null, visitedNodes, queue];
      break;
    }
  }
}

class Point {
  static all = [];
  constructor(p, char) {
    this.p = p;
    this.char = char;
    Point.all.push(this);
  }
  draw() {
    ctx.fillStyle = "black";
    ctx.font = "bold 48px serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(this.char, this.p[0], this.p[1] + 4);
  }
  drawUnder() {
    drawCircle(this.p, 27);
    ctx.fillStyle = "#F2F2F2";
    ctx.fill();
  }
}
class Arrow {
  static all = [];
  constructor(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
    Arrow.all.push(this);
  }
  draw() {
    const gap = 30;
    const a = lerp([this.p1.p, this.p2.p])(
      gap / distance(this.p1.p, this.p2.p)
    );
    const b = lerp([this.p1.p, this.p2.p])(
      1 - gap / distance(this.p1.p, this.p2.p)
    );
    ctx.lineWidth = 2;
    drawArrow(ctx, a, b);
  }
}

let pointer = [0, 0];
let dragging = null;
let arrowing = null;
c.addEventListener("pointerdown", (e) => {
  const close = Point.all.find(({ p }) => distance(p, pointer) < 28);
  if (close) {
    dragging = close;
    c.style.cursor = "grabbing";
  } else new Point(v(...pointer), "·");
  // new Point();
});
c.addEventListener("pointermove", (e) => {
  assign(pointer)([e.offsetX, e.offsetY]);

  const close = Point.all.find(({ p }) => distance(p, pointer) < 28);

  if (dragging) assign(dragging.p)(pointer);
  else if (close) c.style.cursor = "grab";
  else c.style.cursor = "auto";
  // assign(dragging.p)([
  //   Math.round(pointer[0] / 40) * 40,
  //   Math.round(pointer[1] / 40) * 40,
  // ]);
  //   if (dragging) push(dragging);
});
c.addEventListener("pointerup", (e) => {
  dragging = null;
});

const p1 = new Point([100, 100], "A");
const p2 = new Point([100, 200], "B");
new Arrow(p1, p2);
let B = bfs(p1);
let bfsPoint = [p1, [], []];

document.addEventListener("keydown", (e) => {
  console.log(e.key);
  if (e.key.length === 1) new Point(v(...pointer), e.key);
  if (e.key === "Alt") {
    B = bfs(p1);
    bfsPoint = [p1, [], []];
  }
  if (e.key === "Meta") {
    const close = Point.all.find(({ p }) => distance(p, pointer) < 28);
    if (close) arrowing = new Arrow(close, { p: pointer });
  }
});
document.addEventListener("keyup", (e) => {
  if (e.key === "Meta") {
    const close = Point.all.find(({ p }) => distance(p, pointer) < 28);
    if (close) arrowing.p2 = close;
    else Arrow.all = Arrow.all.filter((a) => a !== arrowing);
  }
  arrowing = null;
});

// const points = Array(20)
//   .fill()
//   .map((_, i) => new Point(v(i*20)));

// points.forEach((_, i, ps) => {
//   if (i > 0) {
//     const pii = ps[i - 1];
//     const pi = ps[i];
//     mo((pi, pii) => assign(pii.p)(sub(pi.p, v(20))))(pi)(pii);
//     mo((pii, pi) => assign(pi.p)(add(pii.p, v(20))))(pii)(pi);
//   }
// });
let t = 0;
function draw() {
  requestAnimationFrame(draw);

  ctx.fillStyle = "#EEDDEF";
  ctx.clearRect(0, 0, c.width, c.height);
  Point.all.forEach((p) => p.drawUnder());
  Arrow.all.forEach((p) => p.draw());
  Point.all.forEach((p) => p.draw());
  if (t % 40 === 0) {
    const { value, done } = B.next();
    if (!done) {
      bfsPoint = value;
    }
  }

  const [p, visited, queue] = bfsPoint;

  for (const v of visited) {
    drawCircle(v.p, 28);
    ctx.strokeStyle = "YellowGreen";
    ctx.stroke();
  }
  for (const q of queue) {
    drawCircle(q.p, 28);
    ctx.strokeStyle = "orange";
    ctx.stroke();
  }
  if (p) {
    drawCircle(p.p, 28);
    ctx.strokeStyle = "red";
    ctx.stroke();
  }
  ctx.strokeStyle = "black";

  t++;
}
draw();
