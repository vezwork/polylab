import { _, id, rotation, } from "../../../lib/math/CtxTransform.js";
import { add, v, assign as assignV } from "../../../lib/math/Vec2.js";
import { constructor, e as edge, propagate, se as splitEdge, } from "./api.js";
import { isoFromT, makeCircleSvgEl, makeLineSvgEl, svgCircleTIso, svgLineTIso, } from "./drawHelpers.js";
import { inv, invPath } from "./lib.js";
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
edge(origin, originSvgEl)(svgCircleTIso);
const [eOriginToOriginRed, eRedToOriginRed] = splitEdge(origin, red, originRed)({
    forward: (o, r, or) => assignV(or)(add(o, r)),
    backward: (or, o, r) => console.warn("backward or o r"),
});
edge(originRed, redSvgEl)(svgCircleTIso);
splitEdge(originRed, origin, redLineSvgEl, [eOriginToOriginRed])(svgLineTIso);
const [eOriginToOriginBlue, eBlueToOriginBlue] = splitEdge(origin, blue, originBlue)({
    forward: (o, b, ob) => assignV(ob)(add(o, b)),
    backward: (ob, o, b) => console.warn("backward ob o b"),
});
edge(originBlue, blueSvgEl)(svgCircleTIso);
splitEdge(originBlue, origin, blueLineSvgEl, [eOriginToOriginBlue])(svgLineTIso);
edge(red, blue, invPath([
    eBlueToOriginBlue,
    inv(eOriginToOriginBlue),
    eOriginToOriginRed,
    inv(eRedToOriginRed),
]))(isoFromT(rotation(Math.PI / 2)));
const [eRedToBasis] = splitEdge(red, blue, basis, [
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
splitEdge(origin, basis, t, [
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
const recursiveTransform = [1.1, 0.1, -0.1, 1.1, 1, 1];
const initialTransform = [5, 0, 0, 5, 120, 120];
edge(t, t)(isoFromT(recursiveTransform));
const walk = propagate(t, initialTransform);
function draw() {
    const { value, done } = walk.next();
    if (!done)
        requestAnimationFrame(draw);
    // console.log(value);
}
draw();
// working notes:
// - this is really just about exploring free groups. Commutativity is not supported for example.
// - constructors should be optional, should be called initializers.
// - edge functions should be functional with optional side effects for initialized stuff?
// - splits are an unecessary concept. "splits" should just be when a node has multiple edges
//   pointing into it. I think.
//   - splits have a single function while multiple edges have multiple though...
//     - comes back to products just being tuples of the input data
//     - comes back to the problem of a single node having multiple splits like polar vs cartesian decomp
//       - but this can be achieved by having two products with an iso between them...
