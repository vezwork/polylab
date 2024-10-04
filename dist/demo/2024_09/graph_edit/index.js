import {
  distance,
  sub,
  assign,
  add,
  v,
  angleOf,
  fromPolar,
  length,
  mul,
} from "../../../lib/math/Vec2.js";
import { lerp, vecPointToSeg } from "../../../lib/math/Line2.js";
import {
  ctx,
  c,
  drawGraph,
  Point,
  Arrow,
  pointer,
  drawArrow,
  MID_DOT,
} from "./graph_edit.js";
import { concat } from "../../../lib/structure/Iterable.js";

const p1 = new Point([100, 100], "A");
const p3 = new Point([100, 500], "a");

const instanceFromSpec = new Map();
instanceFromSpec.set(p1, p3);

// const nexts = (p) =>
//   Arrow.all.filter(
//     ({ p1 }) => p1 === p || (p.char !== MID_DOT && p1.char === p.char)
//   );
const nexts = (p) => Arrow.all.filter(({ p1 }) => p1 === p);

let sym = "a";
let fresh = () => (sym = String.fromCharCode(sym.charCodeAt() + 1));

const OP = "⁻";
const isSymOp = (a) => a.split("").at(-1) === OP;
const forgetOpSym = (a) => a.split("").at(0);
const areOp = (a, b) => isSymOp(a) !== isSymOp(b);
const areSame = (a, b) => forgetOpSym(a) === forgetOpSym(b);
const isOpSym = (a, b) => areSame(a, b) && areOp(a, b);
const addSym = (syms, sym) => {
  if (isOpSym(syms.at(-1), sym)) return syms.slice(0, -1);
  return [...syms, sym];
};
const concatSyms = (as, bs) => {
  let res = as;
  for (const b of bs) {
    res = addSym(res, b);
  }
  return res;
};
const arrowFromSym = (s) => Arrow.all.find((ar) => ar.label === s);

const pathFromNode = new Map();
function* labelEdges(start) {
  const visitedNodes = new Set([start]);
  const queue = [start];
  pathFromNode.clear();
  pathFromNode.set(start, []);

  while (queue.length !== 0) {
    const currentVertex = queue.shift();
    const path = pathFromNode.get(currentVertex);

    for (const edge of nexts(currentVertex)) {
      const to = edge.p2;
      if (!visitedNodes.has(to)) {
        edge.label = fresh();
        const newPath = path.concat([edge]);
        pathFromNode.set(to, newPath);

        visitedNodes.add(to);
        queue.push(to);

        yield { edge };
      } else {
        edge.label = concatSyms(
          path
            .map((ar) => ar.label)
            .toReversed()
            .map((s) => `${s}${OP}`),
          pathFromNode.get(to).map((ar) => ar.label)
        );
        yield { edge };
      }
    }
  }
}

const createFollowEdge = (sym, curSpec, curInst, q) => {
  const toSpec = loopFollowEdge(sym, curSpec);
  if (followEdge(sym, curInst)) {
    return [toSpec, followEdge(sym, curInst)];
  } else {
    // create edge based on spec
    const specAr = loopArrowFromSymAndPoint(sym, curSpec);
    if (isSymOp(sym)) {
      const toInst = new Point(add(curInst.p, mul(-1, specAr.v)), "!");
      new Arrow(toInst, curInst, forgetOpSym(sym));
      q.push([toSpec, toInst]);
      return [toSpec, toInst];
    } else {
      const toInst = new Point(add(curInst.p, specAr.v), "!");
      new Arrow(curInst, toInst, sym);
      q.push([toSpec, toInst]);
      return [toSpec, toInst];
    }
  }
};
const createFollowEdges = ([sym, ...rest], curSpec, curInst, q) =>
  sym
    ? createFollowEdges(rest, ...createFollowEdge(sym, curSpec, curInst, q), q)
    : curInst;

const loopArrowsOut = (p) =>
  Arrow.all.filter(
    ({ p1 }) => p1 === p || (p.char !== MID_DOT && p1.char === p.char)
  );
const loopArrowsIn = (p) =>
  Arrow.all.filter(
    ({ p2 }) => p2 === p || (p.char !== MID_DOT && p2.char === p.char)
  );
const arrowFromSymAndPoint = (sym, p) =>
  isSymOp(sym)
    ? p.arrowsIn.find((ar) => ar.label === forgetOpSym(sym))
    : p.arrowsOut.find((ar) => ar.label === sym);
const loopArrowFromSymAndPoint = (sym, p) =>
  isSymOp(sym)
    ? loopArrowsIn(p).find((ar) => ar.label === forgetOpSym(sym))
    : loopArrowsOut(p).find((ar) => ar.label === sym);
const followEdge = (sym, p) =>
  arrowFromSymAndPoint(sym, p)?.[isSymOp(sym) ? "p1" : "p2"];
const loopFollowEdge = (sym, p) =>
  loopArrowFromSymAndPoint(sym, p)?.[isSymOp(sym) ? "p1" : "p2"];

const followEdges = ([sym, ...rest], cur) =>
  sym ? followEdges(rest, followEdge(sym, cur)) : cur;
const loopFollowEdges = ([sym, ...rest], cur) =>
  sym ? loopFollowEdges(rest, loopFollowEdge(sym, cur)) : cur;

function* loopWalkEdges(start) {
  const queue = [[start, p3]];

  while (queue.length !== 0) {
    const [specNode, instNode] = queue.shift();

    for (const arrow of loopArrowsOut(specNode)) {
      if (Array.isArray(arrow.label)) {
        const iTo = createFollowEdges(arrow.label, specNode, instNode, queue);
        new Arrow(instNode, iTo, arrow.label);
      } else {
        createFollowEdge(arrow.label, specNode, instNode, queue);
      }
      yield { edge: arrow };
    }
  }
}

c.addEventListener("pointermove", (ev) => {
  for (const e of Arrow.all) {
    if (length(vecPointToSeg(pointer, e.seg)) <= 8) {
      (Array.isArray(e.label) ? e.label : [e.label])
        .map(forgetOpSym)
        .map(arrowFromSym)
        .map((ar) => (ar.hover = true));
    }
  }
});

let bfsPoint = null;

let stepper = concat(labelEdges(p1), loopWalkEdges(p1));

let keydown = false;
document.addEventListener("keydown", (e) => {
  if (e.key === "Alt") {
    keydown = true;
    t = 0;
    // B = labelEdges(p1);
    // myFlag = loopWalkEdges(p1);
    // const { value, done } = B.next();
    // if (!done) bfsPoint = value;
    // else {
    bfsPoint = stepper.next()?.value;
    // }
  }
  if (e.key === "Control") {
    //reset
    Arrow.all.forEach((ar) => (ar.label = "."));
    stepper = concat(labelEdges(p1), loopWalkEdges(p1));
  }
});
document.addEventListener("keyup", (e) => {
  if (e.key === "Alt") keydown = false;
});

let t = 0;
function draw() {
  requestAnimationFrame(draw);

  ctx.clearRect(0, 0, c.width, c.height);

  ctx.fillStyle = "#EEDDEF";
  ctx.fillRect(20, c.height / 2 - 50, c.width, 2);

  if (bfsPoint?.edge) {
    const e = bfsPoint.edge;
    drawArrow(ctx, ...e.seg);
    ctx.lineWidth = 6;
    ctx.strokeStyle = "violet";
    ctx.stroke();
    ctx.lineCap = "round";
  }
  ctx.strokeStyle = "black";

  drawGraph();

  if (t !== 0 && t % 10 === 0 && keydown) {
    bfsPoint = stepper.next()?.value;
  }

  t++;
}
draw();
