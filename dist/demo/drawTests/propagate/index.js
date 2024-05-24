// I am getting really stuck on the complexity of category6finite, I keep
// introducing order of event bugs.
// lets try to make a super simple propagation system
// using JSON serialization diffing.
// inspired by @dennizor's tldraw propagator editor
import { SetMap } from "../../../lib/structure/data.js";
const datum = (value) => [value];
const getValue = ([value]) => value;
const setValue = (d, value) => ((d[0] = value), d);
const graph = new SetMap();
const f = (func, from, to = datum()) => graph.add(from, [func, to]);
const get = (map, key) => [
    ...(map.get(key) ?? []),
];
const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function push(queue) {
    while (queue.length > 0) {
        const from = queue.shift();
        for (const [f, to] of get(graph, from)) {
            const newValue = f(getValue(from), getValue(to));
            const oldValue = getValue(to);
            if (!deepEqual(newValue, oldValue)) {
                setValue(to, newValue);
                queue.push(to);
            }
        }
    }
}
// small optimization idea: edges can register opposite edges, and push can keep track of previous edge,
// and push can not propogate along edges in opposite(prevEdge).
//---------------
// USEAGE
//---------------
// const a = datum(7);
// const b = datum();
// f((n) => n * 2, a, b);
// f(console.log, b);
// push([a]);
// const a = datum(7);
// const b = datum(2);
// const c0 = datum(0.79);
// const c = datum(1);
// f((c0) => c0, c0, c);
// const abc = datum([null, null, null]);
// f((a, abc) => [a, abc[1], abc[2]], a, abc);
// f((b, abc) => [abc[0], b, abc[2]], b, abc);
// f((c, abc) => [abc[0], abc[1], c], c, abc);
// f(console.log, abc);
// push([a, b, c0]);
const svg = document.getElementById("svg");
function makeCircleSvgEl(color) {
    const circle = document.createElementNS(svg.namespaceURI, "circle");
    circle.setAttribute("r", "4");
    circle.setAttribute("fill", color);
    svg.append(circle);
    return circle;
}
function makeTextSvgEl(str, color) {
    const text = document.createElementNS(svg.namespaceURI, "text");
    text.setAttribute("fill", color);
    text.setAttribute("font-family", "monospace");
    text.textContent = str;
    svg.append(text);
    return text;
}
const mouse = datum([0, 0]);
const makeP = (pos) => {
    const pEl = makeCircleSvgEl("black");
    const p = datum(pos);
    f(([x, y]) => {
        pEl.setAttribute("cx", x + "");
        pEl.setAttribute("cy", y + "");
    }, p);
    push([p]);
    return p;
};
const custom1 = makeP(getValue(mouse));
const custom2 = makeP(getValue(mouse));
const custom3 = makeP(getValue(mouse));
f(([x, y]) => [x, y + 10], mouse, custom1);
f(([x, y]) => [x, y - 10], mouse, custom2);
f(([x, y]) => [x + 10, y], mouse, custom3);
document.addEventListener("mousemove", (e) => {
    setValue(mouse, [e.offsetX, e.offsetY]);
    push([mouse]);
});
document.addEventListener("click", (e) => makeP(getValue(mouse)));
let keysHead = datum(["", null]);
f((m, [k, p]) => [k, m], mouse, keysHead);
document.addEventListener("keydown", (e) => {
    e.preventDefault();
    const newKeyNode = datum([e.key, null]);
    f(([k, [x, y]], next) => [next[0], [x + 10, y + Math.sin(x / 100) * 6]], keysHead, newKeyNode);
    const el = makeTextSvgEl(e.key, "black");
    f(([k, p]) => {
        el.textContent = k;
        el.setAttribute("x", p[0] + "");
        el.setAttribute("y", p[1] + "");
    }, newKeyNode);
    push([keysHead]);
    keysHead = newKeyNode;
});
const mouseEl = makeCircleSvgEl("black");
f(([x, y]) => {
    mouseEl.setAttribute("cx", x + "");
    mouseEl.setAttribute("cy", y + "");
}, mouse);
