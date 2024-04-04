import {
  CtxTransform,
  _,
  apply,
  assign,
  id,
  rotation,
  translation,
} from "../../../lib/math/CtxTransform.js";
import { v, sub } from "../../../lib/math/Vec2.js";
import { init, mo, pull, push } from "./lib.js";

const d = (v?: any) => [v];
const pl = (l) => (p) => {
  mo((l, p) => (p[0] = l[0]))(l)(p);
  mo((p, l) => (l[0] = p[0]))(p)(l);
};
const pr = (r) => (p) => {
  mo((r, p) => (p[1] = r[0]))(r)(p);
  mo((p, r) => (r[0] = p[1]))(p)(r);
};
const p = (l, r) => {
  const data = [];
  pl(l)(data);
  pr(r)(data);
  return data;
};

const d1 = [1];
const d2 = [10];
const d3 = [];
const d4 = [];
const d5 = [];
const d6 = [8];

const d1xd2 = p(d1, d2);
const d1xd2xd6 = p(d1xd2, d6);

const plus10 = mo((a, b) => (b[0] = a[0] + 10));
const minus10 = mo((a, b) => (b[0] = a[0] - 10));
plus10(d1)(d2);
minus10(d2)(d1);
plus10(d2)(d3);
plus10(d3)(d4);
plus10(d4)(d5);
//plus10(d5)(d6);

console.log(
  d1[0],
  d2[0],
  d3[0],
  d4[0],
  d5[0],
  d6[0],
  [...d1xd2],
  [...d1xd2xd6]
);
init(d2);
console.log(
  d1[0],
  d2[0],
  d3[0],
  d4[0],
  d5[0],
  d6[0],
  [...d1xd2],
  [...d1xd2xd6]
);

// BOUNDS TESTS

// type Bounds = [number, number];
// type Thing = { wh: Bounds; t: CtxTransform };

// // note: only works for non-rotated transforms for now.
// // note: what does "left" mean? a's left or b's left?
// const bLeftOfA = (a: Thing, b: Thing) =>
//   mo(([at, [bw, bh]]: [CtxTransform, Bounds], bt: CtxTransform) => {
//     // want x part of ...apply(b.t)(b.bbox) to equal x part of ...apply(a.t)(v(0))
//     // since we don't want to change the scale of b.t, we want to set its translation
//     bt[4] = at[4] - (bw * bt[0] + bh * bt[2]); // from doing some algebra based on def of `apply`
//   })(p(a.t, b.wh))(b.t);
// const bRightOfA = (a: Thing, b: Thing) =>
//   mo(([at, [w, h]]: [CtxTransform, Bounds], bt: CtxTransform) => {
//     // want x part of ...apply(b.t)(0) to equal x part of ...apply(a.t)(a.wh)
//     // since we don't want to change the scale of b.t, we want to set its translation
//     bt[4] = at[4] + (w * at[0] + h * at[2]); // from doing some algebra based on def of `apply`
//   })(p(a.t, a.wh))(b.t);
// const bAboveA = (a: Thing, b: Thing) =>
//   mo(([at, [bw, bh]]: [CtxTransform, Bounds], bt: CtxTransform) => {
//     bt[5] = at[5] - (bw * bt[1] + bh * bt[3]); // from doing some algebra based on def of `apply`
//   })(p(a.t, b.wh))(b.t);
// const bBelowA = (a: Thing, b: Thing) =>
//   mo(([at, [w, h]]: [CtxTransform, Bounds], bt: CtxTransform) => {
//     bt[5] = at[5] + (w * at[1] + h * at[3]); // from doing some algebra based on def of `apply`
//   })(p(a.t, a.wh))(b.t);
// // spacing for stacking!

// // padding

// // alignX left, center, right
// // alignY top, center, bottom

// const c = document.getElementById("c") as HTMLCanvasElement;
// const ctx = c.getContext("2d")!;

// const a: Thing = { wh: [10, 10], t: translation(v(60, 60)) };
// const b: Thing = { wh: [11, 11], t: translation(v(100, 100)) };
// bLeftOfA(a, b);
// bRightOfA(b, a);
// bAboveA(a, b);
// bBelowA(b, a);
// mo(() => {})(a.wh)(a);
// mo(() => {})(a.t)(a);
// mo(() => {})(a)(a.wh);
// mo(() => {})(a)(a.t);
// mo(() => {})(b.wh)(b);
// mo(() => {})(b.t)(b);
// mo(() => {})(b)(b.wh);
// mo(() => {})(b)(b.t);
// mo(({ t, wh }) => {
//   ctx.fillStyle = "red";
//   ctx.fillRect(...apply(t)(v(0)), ...sub(apply(t)(wh), apply(t)(v(0))));
// })(a)(Symbol());
// mo(({ t, wh }) => {
//   ctx.fillStyle = "blue";
//   ctx.fillRect(...apply(t)(v(0)), ...sub(apply(t)(wh), apply(t)(v(0))));
// })(b)(Symbol());
// init(a);
