import { randomNiceCssOklab } from "../../../lib/math/Color.js";
import {
  _,
  assign,
  id,
  translation,
  inv as tInv,
  CtxTransform,
} from "../../../lib/math/CtxTransform.js";
import { v } from "../../../lib/math/Vec2.js";
import { constructor, e, propagateForward, se } from "./api.js";
import { inv } from "./lib.js";

// svg and ctx transform setup

const svg = document.getElementById("s")! as unknown as SVGElement;

function makeCircleSvgEl(color: string) {
  const circle = document.createElementNS(svg.namespaceURI, "circle");
  circle.setAttribute("r", "4");
  circle.setAttribute("fill", color);

  svg.append(circle);
  return circle;
}
function makeLineSvgEl(color: string) {
  const line = document.createElementNS(svg.namespaceURI, "line");
  line.setAttribute("stroke-width", "3");
  line.setAttribute("stroke", color);
  line.setAttribute("stroke-linecap", "round");

  svg.prepend(line);
  return line;
}
const isoFromT = (t: CtxTransform) => ({
  forward(i, o) {
    assign(o)(_(t)(i));
  },
  backward(o, i) {
    assign(i)(_(tInv(t))(o));
  },
});
const svgCircleTIso = {
  forward(n, svg) {
    svg.setAttribute("cx", n[4]);
    svg.setAttribute("cy", n[5]);
  },
  backward() {},
};
const svgLineTIso = {
  forward(n1, n2, nxn) {
    nxn.setAttribute("x1", n1[4]);
    nxn.setAttribute("y1", n1[5]);
    nxn.setAttribute("x2", n2[4]);
    nxn.setAttribute("y2", n2[5]);
  },
  backward() {},
};

// actual program

const N = constructor(() => _(id)(id), "N");
const Nsvg = constructor(() => makeCircleSvgEl(randomNiceCssOklab()), "Nsvg");
const NxNsvg = constructor(() => makeLineSvgEl(randomNiceCssOklab()), "NxNsvg");

// aside: how can I support making this edge commute with e1?
// - commutativity cannot work currently because because
//   - option 1: `e2 = [inv(e1), com] & e1 = [inv(e2), com]` but two paths cannot be defined by eachother(?)
//   - option 2: `e2 = [inv(e1), e2, e1]` but a path cannot be defined in terms of itself(?)
// - why does `e = [inv(e)]` work? i.e. in `../category2/libTests.ts`
// - I need a join-semilattice or something for edge definitions
// - I can make things sort of weakly commutative via a witness `wit = [inv(e1), inv(e2), e1, e2]`
//   - then things that commute are not literally equal, but they can be easily reached from eachother
//   - less performant

const link = (t) => {
  const e1 = e(N, N)(isoFromT(t));

  e(N, Nsvg)(svgCircleTIso);
  se(N, N, NxNsvg, [e1])(svgLineTIso);

  return e1;
};

const lT = translation(v(-10, 10));
const rT = translation(v(10, 10));

//const commutesToT = _(lT)(rT);
//const commutesTo = e(N, N)(isoFromT(commutesToT));

link(lT);
link(rT);
link(translation(v(100, 0)));

const walk = propagateForward(N, translation(v(120, 20)));
function draw() {
  requestAnimationFrame(draw);
  console.log(walk.next().value);
}
draw();
