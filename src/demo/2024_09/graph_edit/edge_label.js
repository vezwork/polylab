import {
  distance,
  sub,
  assign,
  add,
  v,
  angleOf,
  fromPolar,
  length,
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
} from "./graph_edit.js";

const MID_DOT = "·";

const p1 = new Point([100, 100], MID_DOT);
const p2 = new Point([100, 200], MID_DOT);
const p3 = new Point([100, 500], "a");
new Arrow(p1, p2);

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
const isOp = (a, b) => {
  if (a.split("").at(-1) === OP && b.split("").at(-1) !== OP) return true;
  if (a.split("").at(-1) !== OP && b.split("").at(-1) === OP) return true;
  return false;
};
const isSameSym = (a, b) => {
  if (a.split("").at(0) === b.split("").at(0)) return true;
  return false;
};
const getSym = (a) => a.split("").at(0);
const isOpSym = (a, b) => isSameSym(a, b) && isOp(a, b);
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

const pathFromNode = new Map();
function* walk(start) {
  const visitedNodes = new Set([start]);
  const queue = [[[], start]];
  pathFromNode.clear();
  pathFromNode.set(start, "");

  while (queue.length !== 0) {
    const [path, currentVertex] = queue.shift();

    for (const edge of nexts(currentVertex)) {
      const to = edge.p2;
      if (!visitedNodes.has(to)) {
        edge.label = fresh();
        const newPath = path.concat([edge.label]);

        visitedNodes.add(to);
        queue.push([newPath, to]);
        pathFromNode.set(to, newPath);

        yield { edge };
      } else {
        edge.label = concatSyms(
          path.toReversed().map((s) => `${s}${OP}`),
          pathFromNode.get(to)
        );
        yield { edge };
      }
    }
  }
}

c.addEventListener("pointermove", (ev) => {
  for (const e of Arrow.all) {
    if (length(vecPointToSeg(pointer, e.seg)) <= 8) {
      if (Array.isArray(e.label)) {
        e.label.map(getSym).forEach((s) =>
          Arrow.all.forEach((ar) => {
            if (ar.label === s) ar.hover = true;
          })
        );
      } else {
        e.hover = true;
      }
    }
  }
});

let B = walk(p1);
let bfsPoint = null;

document.addEventListener("keydown", (e) => {
  if (e.key === "Alt") {
    B = walk(p1);
  }
});

let t = 0;
function draw() {
  requestAnimationFrame(draw);

  ctx.fillStyle = "#EEDDEF";
  ctx.clearRect(0, 0, c.width, c.height);

  if (bfsPoint?.edge) {
    const e = bfsPoint.edge;
    drawArrow(ctx, ...e.seg);
    ctx.lineWidth = 6;
    ctx.strokeStyle = "red";
    ctx.stroke();
    ctx.lineCap = "round";
  }
  ctx.strokeStyle = "black";

  drawGraph();

  if (t % 50 === 0) {
    const { value, done } = B.next();
    if (!done) {
      bfsPoint = value;
      const { edge: e, path, fromSym, toSym } = bfsPoint;

      const ffrom = instanceFromSpec.get(fromSym) ?? p3;

      //   fmap.set(toSym, new Point(add(ffrom.p, e.v), e.p2.char.toLowerCase()));
      //   if (!femap.get(fromSym)) femap.set(fromSym, new Map());
      //   femap.get(fromSym).set(toSym, new Arrow(ffrom, fmap.get(toSym)));

      //   const ffrom = fmap.get(e.p1);
      //   if (!fmap.get(e.p2)) {
      //     fmap.set(e.p2, new Point(add(ffrom.p, e.v), e.p2.char.toLowerCase()));
      //   }
      //   if (!femap.get(e.p1)?.get(e.p2)) {
      //     if (!femap.get(e.p1)) femap.set(e.p1, new Map());
      //     femap.get(e.p1).set(e.p2, new Arrow(fmap.get(e.p1), fmap.get(e.p2)));
      //   }
    }
  }

  t++;
}
draw();
