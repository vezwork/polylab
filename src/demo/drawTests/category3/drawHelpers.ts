// svg and ctx transform setup

import {
  _,
  assign,
  id,
  translation,
  inv as tInv,
  CtxTransform,
  rotation,
} from "../../../lib/math/CtxTransform.js";
import {
  add,
  v,
  assign as assignV,
  rotateQuarterXY,
  rotateQuarterYX,
} from "../../../lib/math/Vec2.js";

const svg = document.getElementById("s")! as unknown as SVGElement;

export function makeCircleSvgEl(color: string) {
  const circle = document.createElementNS(svg.namespaceURI, "circle");
  circle.setAttribute("r", "4");
  circle.setAttribute("fill", color);

  svg.append(circle);
  return circle;
}
export function makeLineSvgEl(color: string) {
  const line = document.createElementNS(svg.namespaceURI, "line");
  line.setAttribute("stroke-width", "3");
  line.setAttribute("stroke", color);
  line.setAttribute("stroke-linecap", "round");

  svg.prepend(line);
  return line;
}
export const isoFromT = (t: CtxTransform) => ({
  forward(i, o) {
    assign(o)(_(t)(i));
  },
  backward(o, i) {
    assign(i)(_(tInv(t))(o));
  },
});
export const svgCircleTIso = {
  forward(n, svg) {
    svg.setAttribute("cx", n[0]);
    svg.setAttribute("cy", n[1]);
  },
  backward() {
    console.warn("backward svgCircleTIso");
  },
};
export const svgLineTIso = {
  forward(n1, n2, nxn) {
    nxn.setAttribute("x1", n1[0]);
    nxn.setAttribute("y1", n1[1]);
    nxn.setAttribute("x2", n2[0]);
    nxn.setAttribute("y2", n2[1]);
  },
  backward() {
    console.warn("backward svgLineTIso");
  },
};
