import {
  apply,
  translation,
  inv as tInv,
} from "../../../lib/math/CtxTransform.js";
import { applyPath, create, edge, inv } from "./lib.js";
import { EMPTY } from "./libContain.js";

const svg = document.getElementById("s")! as unknown as SVGElement;
function makeCircleSvgEl(color: string) {
  const circle = document.createElementNS(svg.namespaceURI, "circle");
  circle.setAttribute("r", "4");
  circle.setAttribute("fill", color);

  svg.appendChild(circle);
  return circle;
}
function makeLineSvgEl(color: string) {
  const line = document.createElementNS(svg.namespaceURI, "line");
  line.setAttribute("stroke-width", "3");
  line.setAttribute("stroke", color);
  line.setAttribute("stroke-linecap", "round");

  svg.appendChild(line);
  return line;
}
const assign =
  (v1: SVGCircleElement) => (v2: SVGCircleElement) => (tFunc: Function) => {
    const vec = [Number(v2.getAttribute("cx")), Number(v2.getAttribute("cy"))];
    const tVec = tFunc(vec);
    v1.setAttribute("cx", tVec[0]);
    v1.setAttribute("cy", tVec[1]);
  };

const linkFn = new Map();
const linkFnInv = new Map();

const arrow = (ob1, ob2, toLink, fromLink) => {
  const arrowOb = () => {
    const line = makeLineSvgEl("black");
    return line;
  };

  const e = edge(ob1, ob2);
  linkFn.set(e, toLink);
  linkFnInv.set(e, fromLink);

  const e1 = edge(ob1, arrowOb);
  linkFn.set(e1, (o1, a) => {
    console.log("o1 to a", o1.getAttribute("cx"), o1.getAttribute("cy"));
    a.setAttribute("x1", o1.getAttribute("cx"));
    a.setAttribute("y1", o1.getAttribute("cy"));
  });
  linkFnInv.set(e1, (a, o1) => {
    // if (aOld.getAttribute("x1") === a.getAttribute("x1") && aOld.getAttribute("y1") === a.getAttribute("y1")) return false;
    console.log("a to o1", a.getAttribute("x1"), a.getAttribute("y1"));
    o1.setAttribute("cx", a.getAttribute("x1"));
    o1.setAttribute("cy", a.getAttribute("y1"));
  });

  const e2 = edge(ob2, arrowOb, () => [inv(e), e1]);
  linkFn.set(e2, (o2, a) => {
    console.log("o2 to a", o2.getAttribute("cx"), o2.getAttribute("cy"));
    a.setAttribute("x2", o2.getAttribute("cx"));
    a.setAttribute("y2", o2.getAttribute("cy"));
  });
  linkFnInv.set(e2, (a, o2) => {
    console.log("a to o2", a.getAttribute("x2"), a.getAttribute("y2"));
    o2.setAttribute("cx", a.getAttribute("x2"));
    o2.setAttribute("cy", a.getAttribute("y2"));
  });
  return [e, e1, e2];
};

const N = () => {
  const dot = makeCircleSvgEl("red");
  return dot;
};
const botLeftT = translation([-10, 10]);
const [e11, a11, a12] = arrow(
  N,
  N,
  (n1, n2) => assign(n2)(n1)((v) => apply(botLeftT)(v)),
  (n2, n1) => assign(n2)(n1)((v) => apply(tInv(botLeftT))(v))
);
const botRightT = translation([10, 10]);
const [e21, a21, a22] = arrow(
  N,
  N,
  (n1, n2) => assign(n2)(n1)((v) => apply(botRightT)(v)),
  (n2, n1) => assign(n2)(n1)((v) => apply(tInv(botRightT))(v))
);

const n = create(N);

console.log(applyPath(n, [e11]) === applyPath(n, [a11, inv(a12)]));
console.log(applyPath(n, [e21]) === applyPath(n, [a21, inv(a22)]));

applyPath(n, [inv(e11), a11, inv(a12)]);
applyPath(n, [e11, a21, inv(a22)]);
applyPath(n, [e21, a21, inv(a22)]);
applyPath(n, [e21, e21, a21, inv(a22)]);
applyPath(n, [e21, e21, a11, inv(a12)]);
// note: removing the first line does not change what has been instantiated, but it does
//   change the order of instatiation, resulting in a differently layered drawing

const push = (start) => {
  const visitedNodes = new Set([start]);
  const queue = [start];

  function inner() {
    for (let i = 0; i < 40; i++) {
      const currentVertex = queue.shift();

      for (const [edge, toContainer] of currentVertex.to.entries()) {
        const to = toContainer.value;
        if (to === EMPTY) continue;
        linkFn.get(edge)(currentVertex.data, to.data);

        if (!visitedNodes.has(to)) {
          visitedNodes.add(to);
          queue.push(to);
        }
      }
      for (const [edge, toContainer] of currentVertex.from.entries()) {
        const to = toContainer.value;
        if (to === EMPTY) continue;
        linkFnInv.get(edge)(to.data, currentVertex.data);

        if (!visitedNodes.has(to)) {
          visitedNodes.add(to);
          queue.push(to);
        }
      }

      if (queue.length === 0) break;
    }
    if (queue.length !== 0) requestAnimationFrame(inner);
  }

  inner();
};

n.data.setAttribute("cx", 20);
n.data.setAttribute("cy", 20);

push(n);

applyPath(n, [e11]).data.setAttribute("cx", 30);
applyPath(n, [e11]).data.setAttribute("cy", 20);

push(applyPath(n, [e11]));
