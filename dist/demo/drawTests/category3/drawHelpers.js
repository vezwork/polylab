// svg and ctx transform setup
import { _, assign, inv as tInv, } from "../../../lib/math/CtxTransform.js";
const svg = document.getElementById("s");
export function makeCircleSvgEl(color) {
    const circle = document.createElementNS(svg.namespaceURI, "circle");
    circle.setAttribute("r", "4");
    circle.setAttribute("fill", color);
    svg.append(circle);
    return circle;
}
export function makeLineSvgEl(color) {
    const line = document.createElementNS(svg.namespaceURI, "line");
    line.setAttribute("stroke-width", "3");
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-linecap", "round");
    svg.prepend(line);
    return line;
}
export const isoFromT = (t) => ({
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
