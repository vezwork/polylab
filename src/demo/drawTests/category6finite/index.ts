// I want to library-ify category5finite so that it is ready to
// play around with in an article. It doesn't have to be perfect,
// but currently category5finite is pretty incomprehensible to
// others and probably to future me as well.

// Here's the changes I want to make:
// -[] boil down the `push` algorithm in lib.ts so that it can be simply presented
// -[] remove products in favour of multi-target `mo(..)(..)(...targets)`
// -[] create better named functions for `d`,
//   - `ob[0] = ..` will not be a thing because it will be functional
// -[] make it functional. This means side effects are handled by the lenses / algorithm.
//   -[] need to make a proof of concept because I'm not sure exactly how this will work.
//   -[] `lift` should be possible e.g. `const max = lift(Math.max)`
// -[] make a "point" class using vec2 I suppose
// -[] make canvas drawing classes for points, lines, rects, paths, etc.
// -[] make utility that produces values every frame with requestAnimationFrame
// -[] make mouse and keyboard utilities
// -[] make an IF and CASE utility
// Axed changes:
// - how to only render after everything is updated
//   - wait... if I used svg this could be useful though.

// SKETCH OF CODE:
// const myAr = [1, 2, 3];
// const myObj = {
//   x: 10,
//   y: 33,
//   z: 2,
// };

// const min = lift(Math.min);
// const c = min(focus(myObj, "x"), focus(myObj, "y"));

import {
  multiple,
  assign,
  datum,
  func,
  getValue,
  setValue,
  accessorLens,
} from "./api.js";
import { graph, push, to } from "./core.js";
import { log, plus } from "./helpers.js";

const aa = datum(5);
const a = datum();
assign(aa, a);
// const a0 = datum();
// accessorLens(a)(a0, 0);
const b = plus(a, 2);
const bb = plus(b, 2);

const c = plus(a, bb);
log("hello!", a, b, bb, c);
push(aa);
console.log([a, b, c].map((d) => d.value));
