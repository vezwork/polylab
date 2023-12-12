import { randomNiceCssOklab } from "../../../lib/math/Color.js";
import { translation, inv as tInv, id, _, approxEq, assign, } from "../../../lib/math/CtxTransform.js";
import { v } from "../../../lib/math/Vec2.js";
import { create, edge, inv } from "./lib.js";
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
const linkFn = new Map();
const linkFnInv = new Map();
const symbolConstructor = new Map();
const arrow = (ob1, ob2) => {
    const prod = Symbol("prod");
    symbolConstructor.set(prod, () => ({
        cur: [undefined, undefined],
        prev: [undefined, undefined],
    }));
    const pe1 = edge(ob1, prod);
    linkFn.set(pe1, (o1, { cur, prev }) => {
        if (prev[0] === undefined)
            prev[0] = _(id)(id);
        if (cur[0] !== undefined)
            assign(prev[0])(cur[0]);
        if (cur[0] === undefined)
            cur[0] = _(id)(id);
        if (approxEq(o1)(cur[0]))
            return false;
        assign(cur[0])(o1);
    });
    linkFnInv.set(pe1, ({ cur, prev }, o1) => {
        if (cur[0] === undefined ||
            (prev[0] !== undefined && approxEq(cur[0])(prev[0])))
            return false;
        if (approxEq(o1)(cur[0]))
            return false;
        assign(o1)(cur[0]);
    });
    const pe2 = edge(ob2, prod);
    linkFn.set(pe2, (o2, { cur, prev }) => {
        if (prev[1] === undefined)
            prev[1] = _(id)(id);
        if (cur[1] !== undefined)
            assign(prev[1])(cur[1]);
        if (cur[1] === undefined)
            cur[1] = _(id)(id);
        if (approxEq(o2)(cur[1]))
            return false;
        assign(cur[1])(o2);
    });
    linkFnInv.set(pe2, ({ cur, prev }, o2) => {
        if (cur[1] === undefined ||
            (prev[1] !== undefined && approxEq(cur[1])(prev[1])))
            return false;
        if (approxEq(o2)(cur[1]))
            return false;
        assign(o2)(cur[1]);
    });
    return [prod, pe1, pe2];
};
const N = Symbol("N");
symbolConstructor.set(N, () => _(id)(id));
const ar1 = arrow(N, N);
const ar2 = arrow(N, N);
const botLeftT = translation([-10, 10]);
const e1 = edge(N, N, () => [ar1[1], inv(ar1[2])]);
linkFn.set(e1, (t1, t2) => {
    const newT = _(botLeftT)(t1);
    if (approxEq(t2)(newT))
        return false;
    assign(t2)(newT);
});
linkFnInv.set(e1, (t2, t1) => {
    const newT = _(t2)(tInv(botLeftT));
    if (approxEq(t1)(newT))
        return false;
    assign(t1)(newT);
});
const botRightT = translation([10, 10]);
const e2 = edge(N, N, () => [ar2[1], inv(ar2[2])]);
linkFn.set(e2, (t1, t2) => {
    const newT = _(botRightT)(t1);
    if (approxEq(newT)(t2))
        return false;
    assign(t2)(newT);
});
linkFnInv.set(e2, (t2, t1) => {
    const newT = _(t2)(tInv(botRightT));
    if (approxEq(newT)(t1))
        return false;
    assign(t1)(newT);
});
const Nsvg = Symbol("Nsvg");
symbolConstructor.set(Nsvg, () => makeCircleSvgEl(randomNiceCssOklab()));
const nsvgE = edge(N, Nsvg);
linkFn.set(nsvgE, (t, svg) => {
    svg.setAttribute("cx", t[4]);
    svg.setAttribute("cy", t[5]);
    return false;
});
linkFnInv.set(nsvgE, (svg, t) => {
    t[4] = Number(svg.getAttribute("cx"));
    t[5] = Number(svg.getAttribute("cy"));
});
const ar1svg = Symbol("ar1svg");
symbolConstructor.set(ar1svg, () => makeLineSvgEl("black"));
const ar1svgE = edge(ar1[0], ar1svg);
linkFn.set(ar1svgE, ({ cur }, svg) => {
    if (cur[0] === undefined || cur[1] === undefined)
        return false;
    svg.setAttribute("x1", cur[0][4]);
    svg.setAttribute("y1", cur[0][5]);
    svg.setAttribute("x2", cur[1][4]);
    svg.setAttribute("y2", cur[1][5]);
    return false;
});
linkFnInv.set(ar1svgE, (svg, { cur, prev }) => {
    assign(prev[0])(cur[0]);
    assign(cur[0])([
        cur[0][0],
        cur[0][1],
        cur[0][2],
        cur[0][3],
        Number(svg.getAttribute("x1")),
        Number(svg.getAttribute("y1")),
    ]);
    assign(prev[1])(cur[1]);
    assign(cur[1])([
        cur[1][0],
        cur[1][1],
        cur[1][2],
        cur[1][3],
        Number(svg.getAttribute("x2")),
        Number(svg.getAttribute("y2")),
    ]);
});
const ar2svg = Symbol("ar2svg");
symbolConstructor.set(ar2svg, () => makeLineSvgEl("black"));
const ar2svgE = edge(ar2[0], ar2svg);
linkFn.set(ar2svgE, ({ cur }, svg) => {
    if (cur[0] === undefined || cur[1] === undefined)
        return false;
    svg.setAttribute("x1", cur[0][4]);
    svg.setAttribute("y1", cur[0][5]);
    svg.setAttribute("x2", cur[1][4]);
    svg.setAttribute("y2", cur[1][5]);
    return false;
});
linkFnInv.set(ar2svgE, (svg, { cur, prev }) => {
    assign(prev[0])(cur[0]);
    assign(cur[0])([
        cur[0][0],
        cur[0][1],
        cur[0][2],
        cur[0][3],
        Number(svg.getAttribute("x1")),
        Number(svg.getAttribute("y1")),
    ]);
    assign(prev[1])(cur[1]);
    assign(cur[1])([
        cur[1][0],
        cur[1][1],
        cur[1][2],
        cur[1][3],
        Number(svg.getAttribute("x2")),
        Number(svg.getAttribute("y2")),
    ]);
});
function* propagateForward(start, startData = symbolConstructor.get(start.symbol)()) {
    const nodeData = new Map([[start, startData]]);
    const queue = [start];
    while (queue.length !== 0) {
        const currentNode = queue.shift();
        //outgoing edges only for now
        for (const [edge, toContainer] of currentNode.to.entries()) {
            const fn = linkFn.get(edge);
            const fromData = nodeData.get(currentNode);
            const to = toContainer.get();
            const toData = nodeData.get(to) ??
                nodeData.set(to, symbolConstructor.get(to.symbol)()).get(to);
            const optionalPropagate = fn(fromData, toData);
            if (optionalPropagate !== false)
                queue.push(to);
        }
        yield currentNode;
    }
}
function* propagate(start, startData = symbolConstructor.get(start.symbol)()) {
    const nodeData = new Map([[start, startData]]);
    const queue = [start];
    while (queue.length !== 0) {
        const currentNode = queue.shift();
        for (const [edge, toContainer] of currentNode.to.entries()) {
            const fn = linkFn.get(edge);
            const from = currentNode;
            const fromData = nodeData.get(from);
            const to = toContainer.get();
            const toData = nodeData.get(to) ??
                nodeData.set(to, symbolConstructor.get(to.symbol)()).get(to);
            const optionalPropagate = fn(fromData, toData);
            if (optionalPropagate !== false)
                queue.push(to);
        }
        for (const [edge, fromContainer] of currentNode.from.entries()) {
            const fn = linkFnInv.get(edge);
            const to = currentNode;
            const toData = nodeData.get(to);
            const from = fromContainer.get();
            const fromData = nodeData.get(from) ??
                nodeData.set(from, symbolConstructor.get(from.symbol)()).get(from);
            const optionalPropagate = fn(toData, fromData);
            if (optionalPropagate !== false)
                queue.push(from);
        }
        yield currentNode;
    }
}
// test
const n = create(N);
const propGen = propagate(n, translation(v(100)));
function draw() {
    requestAnimationFrame(draw);
    propGen.next().value;
}
draw();
// - should I add built-in change detection to propagate?
//   - or should I research graph analysis methods to avoid backtracking?
