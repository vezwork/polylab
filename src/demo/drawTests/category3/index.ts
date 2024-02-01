import { _, id, rotation } from "../../../lib/math/CtxTransform.js";
import { add, v, assign as assignV } from "../../../lib/math/Vec2.js";
import {
  constructor,
  e,
  isConnected,
  propagate,
  propagateForward,
  se,
  words,
} from "./api.js";
import {
  isoFromT,
  makeCircleSvgEl,
  makeLineSvgEl,
  svgCircleTIso,
  svgLineTIso,
} from "./drawHelpers.js";
import { REdge, eqEdge, inv, invPath, rawPath, simplify } from "./lib.js";

const origin = constructor(() => v(0), "origin");
const originSvgEl = constructor(() => makeCircleSvgEl("green"), "originSvgEl");

const red = constructor(() => v(100, 0), "red");
const originRed = constructor(() => v(100, 0), "originRed");
const redSvgEl = constructor(() => makeCircleSvgEl("red"), "redSvgEl");
const redLineSvgEl = constructor(() => makeLineSvgEl("red"), "redLineSvgEl");

const blue = constructor(() => v(0, 100), "blue");
const originBlue = constructor(() => v(0, 100), "originBlue");
const blueSvgEl = constructor(() => makeCircleSvgEl("blue"), "blueSvgEl");
const blueLineSvgEl = constructor(() => makeLineSvgEl("blue"), "blueLineSvgEl");

const basis = constructor(() => [v(100, 0), v(0, 100)], "basis");
const t = constructor(() => _(id)(id), "t");

e(origin, originSvgEl)(svgCircleTIso);

const [eOriginToOriginRed, eRedToOriginRed] = se(
  origin,
  red,
  originRed
)({
  forward: (o, r, or) => assignV(or)(add(o, r)),
  backward: (or, o, r) => console.warn("backward or o r"),
});
e(originRed, redSvgEl)(svgCircleTIso);
se(originRed, origin, redLineSvgEl, [eOriginToOriginRed])(svgLineTIso);

const [eOriginToOriginBlue, eBlueToOriginBlue] = se(
  origin,
  blue,
  originBlue
)({
  forward: (o, b, ob) => assignV(ob)(add(o, b)),
  backward: (ob, o, b) => console.warn("backward ob o b"),
});
e(originBlue, blueSvgEl)(svgCircleTIso);
se(originBlue, origin, blueLineSvgEl, [eOriginToOriginBlue])(svgLineTIso);

e(
  red,
  blue,
  invPath([
    eBlueToOriginBlue,
    inv(eOriginToOriginBlue),
    eOriginToOriginRed,
    inv(eRedToOriginRed),
  ])
)(isoFromT(rotation(Math.PI / 2)));
const [eRedToBasis] = se(red, blue, basis, [
  eBlueToOriginBlue,
  inv(eOriginToOriginBlue),
  eOriginToOriginRed,
  inv(eRedToOriginRed),
])({
  forward: (r, b, basis) => {
    assignV(basis[0])(r);
    assignV(basis[1])(b);
  },
  backward: (basis, r, b) => {
    assignV(r)(basis[0]);
    assignV(b)(basis[1]);
  },
});
console.log(
  "isConnected",
  isConnected([inv(eRedToBasis), eRedToOriginRed, inv(eOriginToOriginRed)])
);
const [eOriginToT, eBasisToT] = se(origin, basis, t, [
  inv(eRedToBasis),
  eRedToOriginRed,
  inv(eOriginToOriginRed),
])({
  forward: (o, [r, b], t) => {
    t[0] = r[0];
    t[1] = r[1];
    t[2] = b[0];
    t[3] = b[1];
    t[4] = o[0];
    t[5] = o[1];
  },
  backward: (t, o, [r, b]) => {
    r[0] = t[0];
    r[1] = t[1];
    b[0] = t[2];
    b[1] = t[3];
    o[0] = t[4];
    o[1] = t[5];
  },
});

// this is problematic:
console.log(
  "proof that path accross split is not connected, but there is a connected path to both sides of the split from the start of the walk",
  isConnected([inv(eBasisToT), inv(eRedToBasis)]),
  isConnected([eOriginToOriginRed, inv(eRedToOriginRed)]),
  // I want a function that evaluates to true for this input? nvm I have it
  // I just wasn't simplifying (via the group operation) before so isConnected wasn't correct
  // also there was a bug in matchPrefix
  isConnected([
    inv(eBasisToT),
    inv(eRedToBasis),
    eRedToOriginRed,
    inv(eOriginToOriginRed),
  ])
);
// it means my assumptions about how split reachability relates to propagation are wrong
// we should not be checking if the path between split sources is connected
// we should instead be checking if there is a connected path from the start of the walk to the split sources
// - this sounds more difficult.... with our current method we have a path and just have to check it
//   with the correct method we have to find a path out of all possible paths that checks out

const walk = propagate(t, [25, 0, 0, 25, 10, 20]);
function draw() {
  const { value, done } = walk.next();
  if (!done) requestAnimationFrame(draw);
  console.log(value);
}
draw();

// notes:
// - this is really just about exploring free groups / torsors. Commutativity is not supported for example.
// - constructors should be optional, should be called initializers
// - edge functions should be functional with optional side effects for initialized stuff?
// - splits are an unecessary concept. "splits" should just be when a node has multiple edges
//   pointing into it. I think.
//   - splits have a single function while multiple edges have multiple though...
//     - comes back to products just being tuples of the input data
//     - comes back to the problem of a single node having multiple splits like polar vs cartesian decomp
//       - but this can be achieved by having two products with an iso between them...
