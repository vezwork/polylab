import { distance, sub } from "../../../lib/math/Vec2.js";
import { assign, changed, datum, func, tuple } from "./api.js";
import { push, to } from "./core.js";
import { log, mul, sub as obsub } from "./helpers.js";

const canvas = document.getElementById("c") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const ax = datum(400);
const ay = datum(400);
const bx = datum();
const by = datum();
const cx = datum(320);
const cy = datum(320);

// for crosscut study I would need these components:
// - POINT x y
// - LINE p1 p2
// - YELLOW_POINT x y
// - YELLOW_LINE p1 p2
// - YELLOW_BOX label x y yp[] // connections
// and I would need some "actions":
// - drag point
// - start&end attach line to point

const drawCircle = ([x, y]) => {
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, 2 * Math.PI);
  ctx.stroke();
};
const lineBetween = (a, b) => {
  const line = func(([[ax, ay], [bx, by]]) => [ax, ay, bx, by])(tuple(a, b));
  func(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  })(line);
  return line;
};
lineBetween(tuple(ax, ay), tuple(cx, cy));

func(drawCircle)(tuple(ax, ay));
func(drawCircle)(tuple(bx, by));
func(drawCircle)(tuple(cx, cy));

const miny = func(([ay, cy]) => Math.min(ay, cy))(tuple(ay, cy));
const minx = func(([ax, cx]) => Math.min(ax, cx))(tuple(ax, cx));
func(([x, y]) =>
  ctx.fillText("CROSSCUT STUDY INTERACTION VARIATION", x, y - 10)
)(tuple(minx, miny));

const mouse = datum([0, 0]);

const Δ = (
  ob,
  diff = (oldData, newData): any => newData - oldData,
  add = (data, changeData): any => changeData + data
) => {
  let prev = ob[0];
  let change: any = null;
  const changeMo = func((v) => {
    change = diff(prev, v);
    prev = v;
    return change;
  })(ob);
  to(([obchange], v) => {
    v[0] = add(v[0], obchange);
  })(changeMo)(ob);
  return changeMo;
};
const Δplus = (a, b) => {
  const c = func(([a, b]) => a + b)(tuple(a, b));
  to(([Δc], [ab]) => {
    ab[0] += Δc / 2;
    ab[1] += Δc / 2;
  })(Δ(c))(tuple(a, b));
  // to(([[b, c]], a) => (a[0] = c - b))(tuple(b, c))(a); // IMPORTANT: the order of these last two lines matters
  // to(([[a, c]], b) => (b[0] = c - a))(tuple(a, c))(b);
  return c;
};

const THING = datum(1 / 2);
const mTHING = obsub(datum(1), THING);

assign(Δplus(mul(ax, THING), mul(cx, mTHING)), bx);
assign(Δplus(mul(ay, THING), mul(cy, mTHING)), by);

push(...changed);

let t = 0;
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  //THING[0] = (Math.sin(t) + 1.1) / 2.2;
  push(THING);
  push(mouse); // why we have to push THING and mouse separately? It somehow makes sense but idk
  requestAnimationFrame(draw);

  t += 0.01;
}
requestAnimationFrame(draw);

//   const GO = d(0.1);
//   eq(Δ(bx), GO);
//   ctx.clearRect(0, 0, canvas.width, canvas.height);
//   push(GO);
//   function draw() {
//     requestAnimationFrame(draw);
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     push(GO);
//   }
//   requestAnimationFrame(draw);

log("mouse!!!", mouse);
//const Δmouse = Δ(mouse, (a, b) => sub(b, a), add);
//const Δbxy = tuple(Δ(bx), Δ(by));
let eqSide: any = null;
let eqTo: any = null;
// PREV VERSION:
//   eq(tuple(bx, by), mouse);

canvas.addEventListener("mousemove", (e) => {
  mouse[0] = [e.offsetX, e.offsetY];

  if (e.buttons === 1) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (eqTo === null) {
      if (distance(mouse[0], [ax[0], ay[0]]) < 10) eqSide = tuple(ax, ay);
      if (distance(mouse[0], [bx[0], by[0]]) < 10) eqSide = tuple(bx, by);
      if (distance(mouse[0], [cx[0], cy[0]]) < 10) eqSide = tuple(cx, cy);

      if (eqSide !== null)
        eqTo = to(([[x, y]], b) => (b[0] = [x, y]))(mouse)(eqSide); // v.s. eq(mouse, eqSide)
    }
  }

  //push(mouse);
});
// canvas.addEventListener("mouseup", (e) => {
//   if (eqTo !== null) {
//     // v.s.
//     //cat.remove(mouse, eqIso[0]);
//     //cat.remove(bxy, eqIso[1]);
//     cat.remove(mouse, eqTo);
//     eqTo = null;
//     eqSide = null;
//   }
// });
