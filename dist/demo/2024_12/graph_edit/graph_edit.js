import {
  distance,
  sub,
  assign,
  add,
  v,
  angleOf,
  fromPolar,
  length,
} from "../../../lib/math/Vec2.js";
import { lerp, vecPointToSeg } from "../../../lib/math/Line2.js";
import { setupFullscreenCanvas } from "../../../lib/draw/setupFullscreenCanvas.js";

export const ctx = setupFullscreenCanvas();
export const c = ctx.canvas;
const dpr = window.devicePixelRatio;
ctx.scale(dpr, dpr);

export let lastEditedPoint = null;

export const MID_DOT = "·";

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
export function drawArrow(context, from, to) {
  const headlen = 14; // length of head in pixels
  const d = sub(to, from);
  const angle = angleOf(d);
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(...from);
  context.lineTo(...to);
  context.lineTo(...sub(to, fromPolar(headlen, angle - Math.PI / 6)));
  context.moveTo(...to);
  context.lineTo(...sub(to, fromPolar(headlen, angle + Math.PI / 6)));
  context.stroke();
}

export class Point {
  static all = [];
  constructor(p, char) {
    this.p = p;
    this.char = char;
    Point.all.push(this);
  }
  get arrowsOut() {
    return Arrow.all.filter((ar) => ar.p1 === this);
  }
  get arrowsIn() {
    return Arrow.all.filter((ar) => ar.p2 === this);
  }
  draw() {
    ctx.fillStyle = "black";
    ctx.font = "bold 48px serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(this.char, this.p[0], this.p[1] + 4, 27 * 2);
  }
  drawUnder() {
    drawCircle(this.p, 27);
    ctx.fillStyle = "#F2F2F2";
    ctx.fill();
  }
}
export class Arrow {
  static all = [];
  constructor(p1, p2, label) {
    this.p1 = p1;
    this.p2 = p2;
    this.label = label;
    Arrow.all.push(this);
  }
  get v() {
    return sub(this.p2.p, this.p1.p);
  }
  get seg() {
    const gap = 30;
    const a = lerp([this.p1.p, this.p2.p])(
      gap / distance(this.p1.p, this.p2.p)
    );
    const b = lerp([this.p1.p, this.p2.p])(
      1 - gap / distance(this.p1.p, this.p2.p)
    );
    return [a, b];
  }
  draw() {
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.hover ? "red" : "black";
    drawArrow(ctx, ...this.seg);

    ctx.font = "bold 18px serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;
    const label = Array.isArray(this.label) ? this.label.join("") : this.label;
    ctx.strokeText(label, ...lerp([this.p1.p, this.p2.p])(0.5));
    ctx.fillStyle = "black";
    ctx.fillText(label, ...lerp([this.p1.p, this.p2.p])(0.5));
  }
}

export let pointer = [0, 0];
let dragging = null;
let dragOffset = null;
let arrowing = null;
c.addEventListener("pointerdown", (e) => {
  const close = Point.all.find(({ p }) => distance(p, pointer) < 28);
  if (close) {
    dragging = close;
    dragOffset = sub(dragging.p, pointer);
    console.log("dragging", dragging);
    c.style.cursor = "grabbing";
  } else new Point(v(...pointer), "·");
  // new Point();
});
c.addEventListener("pointermove", (e) => {
  assign(pointer)([e.offsetX, e.offsetY]);

  const close = Point.all.find(({ p }) => distance(p, pointer) < 28);

  if (dragging) {
    assign(dragging.p)(add(dragOffset, pointer));
    lastEditedPoint = dragging;
  } else if (close) c.style.cursor = "grab";
  else c.style.cursor = "auto";

  for (const e of Arrow.all) {
    e.hover = false;
  }
  for (const e of Arrow.all) {
    if (length(vecPointToSeg(pointer, e.seg)) <= 8) {
      e.hover = true;
      c.style.cursor = "pointer";
    }
  }
});
c.addEventListener("pointerup", (e) => {
  dragging = null;
});

document.addEventListener("keydown", (e) => {
  console.log(e.key);
  if (e.key.length === 1) new Point(v(...pointer), e.key);
  if (e.key === "Meta") {
    const close = Point.all.find(({ p }) => distance(p, pointer) < 28);
    if (close) arrowing = new Arrow(close, { p: pointer }, "");
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

export const drawGraph = () => {
  Point.all.forEach((p) => p.drawUnder());

  Arrow.all.forEach((p) => p.draw());
  Point.all.forEach((p) => p.draw());
};
