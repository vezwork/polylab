import { take } from "../../../lib/structure/Iterable.js";
import { constructor, e, propagateForward, se } from "./api.js";
import { inv } from "./lib.js";
const svg = document.getElementById("s");
function makeCircleSvgEl(color) {
    const circle = document.createElementNS(svg.namespaceURI, "circle");
    circle.setAttribute("r", "4");
    circle.setAttribute("fill", color);
    svg.append(circle);
    return circle;
}
function makeLineSvgEl(color) {
    const line = document.createElementNS(svg.namespaceURI, "line");
    line.setAttribute("stroke-width", "3");
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-linecap", "round");
    svg.prepend(line);
    return line;
}
const A = constructor(() => [100], "A");
const B = constructor(() => [10], "B");
const AB = constructor(() => [1], "AB");
e(A, A)({
    forward(ain, aout) {
        aout[0] = ain[0] + 1;
    },
    backward() { },
});
const sed = se(A, B, AB)({
    forward: (a, b, ab) => {
        ab[0] = a[0] + b[0];
    },
    backward: () => { },
});
const [l, r] = sed;
e(A, B, [l, inv(r)])({
    forward: (a, b) => {
        b[0] = a[0] + 9;
    },
    backward: () => { },
});
console.log("YO", [...take(10, propagateForward(A))]);
