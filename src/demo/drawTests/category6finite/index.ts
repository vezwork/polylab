import { assign, biAssign, datum, func, setValue, tuple } from "./api.js";
import { push, to } from "./core.js";
import { log, mul, plus, sub } from "./helpers.js";

const canvas = document.getElementById("c") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

ctx.clearRect(0, 0, canvas.width, canvas.height);

const ax = datum(400, "ax");
const ay = datum(600);
const bx = datum(undefined, "bx");
const by = datum();
const cx = datum(320, "cx");
const cy = datum(220);

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

func(console.log)(tuple(ax, ay));

const miny = func(([ay, cy]) => Math.min(ay, cy))(tuple(ay, cy));
const minx = func(([ax, cx]) => Math.min(ax, cx))(tuple(ax, cx));
func(([x, y]) =>
  ctx.fillText("CROSSCUT STUDY INTERACTION VARIATION", x, y - 10)
)(tuple(minx, miny));

// const Δ = (
//   ob,
//   diff = (oldData, newData): any => newData - oldData,
//   add = (data, changeData): any => changeData + data
// ) => {
//   let prev = ob[0];
//   let change: any = null;
//   const changeMo = func((v) => {
//     change = diff(prev, v);
//     prev = v;
//     return change;
//   })(ob);
//   to(([obchange], v) => {
//     v[0] = add(v[0], obchange);
//   })(changeMo)(ob);
//   return changeMo;
// };
// const Δplus = (a, b) => {
//   const c = func(([a, b]) => a + b)(tuple(a, b));
//   to(([Δc], [ab]) => {
//     ab[0] += Δc / 2;
//     ab[1] += Δc / 2;
//   })(Δ(c))(tuple(a, b));
//   // to(([[b, c]], a) => (a[0] = c - b))(tuple(b, c))(a); // IMPORTANT: the order of these last two lines matters
//   // to(([[a, c]], b) => (b[0] = c - a))(tuple(a, c))(b);
//   return c;
// };

const THING = datum(1 / 3, "THING");
const one = datum(1, "one");
const mTHING = sub(one, THING, "one - THING");

const mTHING2 = sub(one, mTHING, "one - mTHING");
const mTHING3 = sub(one, mTHING2, "one - mTHING2");
// console.log(THING, one, mTHING);

biAssign(plus(mul(ax, THING), mul(cx, mTHING)), bx);
biAssign(plus(mul(ay, THING), mul(cy, mTHING)), by);

// BUG: Why does this log at the wrong time!!?!?!
// It logs out:
//   x 400 260 320
//   y 600 210 220
// but draws ax and ay at a location different than 400,600!
log("x", ax, bx, cx);
log("y", ay, by, cy);

log("mTHING+", mTHING, mTHING2, mTHING3);
// push(one, THING);

push(one, THING, ax, cx, ay, cy);
console.log("---------------------------------------");

setValue(bx)(260);
setValue(by)(210);
push(bx, by);
