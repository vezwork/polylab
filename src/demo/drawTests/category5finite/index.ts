import { changed, d, eq, left, mof, p, plus, right } from "./helpers.js";
import { and, mo, push } from "./lib.js";

const c = document.getElementById("c") as HTMLCanvasElement;
const ctx = c.getContext("2d")!;

changed.clear();

const redDrawable = p(p(d(100), d(100)), p(d(50), d(50)));
const blueDrawable = p(p(d(), d()), p(d(60), d(60)));

const x = (ob) => left(left(ob));
const y = (ob) => right(left(ob));
const w = (ob) => left(right(ob));
const h = (ob) => right(right(ob));

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
// // padding
// // alignX left, center, right
// // alignY top, center, bottom

const defaultDrawableDims = ([[x, y], [w, h]]) => [
  x ?? 0,
  y ?? 0,
  w ?? 0,
  h ?? 0,
];
const d0defaulted = mof(defaultDrawableDims)(redDrawable);
const d1defaulted = mof(defaultDrawableDims)(blueDrawable);
mof(([x, y, w, h]) => {
  ctx.fillStyle = "blue";
  ctx.fillRect(x, y, w, h);
})(d0defaulted);
mof(([x, y, w, h]) => {
  ctx.fillStyle = "red";
  ctx.fillRect(x, y, w, h);
})(d1defaulted);

//beside(d0, d1);
//centerHorizontal(d0, d1);
const combinedBoundingBox = centerVertical(blueDrawable, redDrawable);
above(redDrawable, blueDrawable);

ctx.clearRect(0, 0, c.width, c.height);
push(...changed);
console.log(redDrawable, blueDrawable, combinedBoundingBox);
