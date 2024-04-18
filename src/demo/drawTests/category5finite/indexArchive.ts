// note: I somehow broke this, mouse was not propagating to p(cx, y(redDrawable)) properly.
// it only propagated to either cx or y(redDrawable) but not both. I tried to comment out all
// unecessary code to see if theres a weird stray relationship but it did not help.
// By starting from scratch in TEST5 in tests.ts, this functionality is working again.
// This file still contains a lot of userful drawing library code like above, beside, etc.

import {
  changed,
  d,
  div,
  eq,
  left,
  log,
  mof,
  mul,
  p,
  plus,
  right,
  sub,
} from "./helpers.js";
import { push } from "./lib.js";

const c = document.getElementById("c") as HTMLCanvasElement;
const ctx = c.getContext("2d")!;

changed.clear();

const redDrawable = p(p(d(100), d(100)), p(d(50), d(50)));
// const blueDrawable = p(p(d(), d()), p(d(60), d(60)));
// const blackDrawable = p(p(d(10), d(10)), p(d(20), d(20)));

const x = (ob) => left(left(ob));
const y = (ob) => right(left(ob));
const w = (ob) => left(right(ob));
const h = (ob) => right(right(ob));

const l = d();
const cx = d();

// log("redDrawable")(redDrawable);
// log("cx")(cx);
// log("y")(y(redDrawable));
// log("x ")(x(redDrawable));
// log("xy")(left(redDrawable));
// log("xBLUE")(x(blueDrawable));

//eq(l, plus(cx, div(w(redDrawable), d(2))));
eq(cx, plus(x(redDrawable), div(w(redDrawable), d(2))));

const beside = (a, b) => eq(x(b), plus(x(a), w(a)));
const above = (a, b) => eq(y(b), plus(y(a), h(a)));
const centerHorizontal = (a, b) => {
  const ah2 = mof((a) => a / 2)(h(a));
  const bh2 = mof((a) => a / 2)(h(b));

  const bh2_ah2 = d();
  eq(bh2, plus(bh2_ah2, ah2));
  eq(y(a), plus(y(b), bh2_ah2));
};
const centerVertical = (a, b) => {
  const aw2 = mof((a) => a / 2)(w(a));
  const bw2 = mof((a) => a / 2)(w(b));

  const bw2_aw2 = d();
  eq(bw2, plus(bw2_aw2, aw2));
  eq(x(a), plus(x(b), bw2_aw2));

  // compute the combined bounding box:
  // note: I was not able to do `mof(([a,b])=>...)` because `a` and `b` as args to mof are not the
  //   same containers as the `a` and `b` as args to `centerVertical`, the product unpackages
  //   the values so I cannot get references to the original containers. This is pretty annoying.
  return mof(() => [
    Math.min(x(a)[0], x(b)[0]),
    Math.min(y(a)[0], y(b)[0]),
    Math.max(x(a)[0] + w(a)[0], x(b)[0] + w(b)[0]) - Math.min(x(a)[0], x(b)[0]),
    Math.max(y(a)[0] + h(a)[0], y(b)[0] + h(b)[0]) - Math.min(y(a)[0], y(b)[0]),
  ])(p(a, b));
};
const lineBetween = (a, b) => {
  const line = mof(([[ax, ay], [bx, by]]) => [ax, ay, bx, by])(p(a, b));
  mof(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    const size = Math.sqrt(x2 ** 2 + y2 ** 2);
    // weird arrow head right angle thing
    ctx.lineTo(x2 - (y2 * 20) / size, y2 + (x2 * 20) / size);
    ctx.stroke();
  })(line);
  return line;
};
// pitfall note: just because a product is updated, doesn't mean its
// components have been already.

// TODO:
// // padding
// // alignX left, center, right
// // alignY top, center, bottom

const defaultDrawableDims = ([[x, y], [w, h]]) => [
  x ?? 0,
  y ?? 0,
  w ?? 0,
  h ?? 0,
];
const redDefaulted = mof(defaultDrawableDims)(redDrawable);
// const blueDefaulted = mof(defaultDrawableDims)(blueDrawable);
// const blackDefaulted = mof(defaultDrawableDims)(blackDrawable);
mof(([x, y, w, h]) => {
  ctx.fillStyle = "red";
  ctx.fillRect(x, y, w, h);
})(redDefaulted);
// mof(([x, y, w, h]) => {
//   ctx.fillStyle = "blue";
//   ctx.fillRect(x, y, w, h);
// })(blueDefaulted);
// mof(([x, y, w, h]) => {
//   ctx.fillStyle = "black";
//   ctx.fillRect(x, y, w, h);
// })(blackDefaulted);

// lineBetween(blackDefaulted, blueDefaulted);

// beside(blueDrawable, redDrawable);
// centerHorizontal(blueDrawable, redDrawable);
// OR
// const combinedBoundingBox = centerVertical(blueDrawable, redDrawable);
// above(redDrawable, blueDrawable);

// mof(([x, y, w, h]) => {
//   ctx.globalCompositeOperation = "overlay";
//   ctx.strokeRect(x, y, w, h);
//   ctx.globalCompositeOperation = "source-over";
// })(combinedBoundingBox);

ctx.clearRect(0, 0, c.width, c.height);
push(...changed);
changed.clear();

const mouse = d([0, 0]);
eq(cx, mof(([x, y]) => x)(mouse));
eq(y(redDrawable), mof(([x, y]) => y)(mouse));
c.addEventListener("mousemove", (e) => {
  mouse[0] = [e.offsetX, e.offsetY];
  ctx.clearRect(0, 0, c.width, c.height);
  push(mouse);
});

// want to:
// render math equations like Sigma sum notation.
// log("start")(mouse);
