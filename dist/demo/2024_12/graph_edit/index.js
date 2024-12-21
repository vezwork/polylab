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
  lastEditedPoint,
} from "./graph_edit.js";
import { concat } from "../../../lib/structure/Iterable.js";

const p1 = new Point([100, 100], "·");

const nexts = (p) => Arrow.all.filter(({ p1, p2 }) => p1 === p && p2.char);
const prevs = (p) => Arrow.all.filter(({ p1, p2 }) => p2 === p && p1.char);
const sibs = (p) => prevs(p).flatMap(({ p1, p2 }) => nexts(p1));
const nextSib = (p) => {
  const s = sibs(p);
  const i = s.findIndex(({ p1, p2 }) => p2 === p);
  const nxt = s[i + 1];
  return nxt ? [{ p1: p, p2: nxt.p2 }] : [];
};
const prevSib = (p) => {
  const s = sibs(p);
  const i = s.findIndex(({ p1, p2 }) => p2 === p);
  const nxt = s[i - 1];
  return nxt ? [{ p1: p, p2: nxt.p2 }] : [];
};
const nextsAndPrevs = (p) => [
  ...nexts(p),
  ...prevs(p).map((ar) => ({ reverse: ar })),
];
function descendants(p) {
  if (!p) return [];
  const visited = new Set([p]);
  const queue = [p];
  const res = [];
  while (queue.length > 0) {
    const cur = queue.pop();

    for (const ar of nexts(cur)) {
      if (!visited.has(ar)) {
        queue.push(ar.p2);
        res.push(ar);
        visited.add(ar);
      }
    }
  }
  return res;
}
const meAndDescendants = (p) => [p, ...descendants(p)];
function biTraverse(f, p) {
  if (!p) return [];
  const visited = new Set([p]);
  const queue = [p];
  const res = [];
  while (queue.length > 0) {
    const cur = queue.pop();

    for (const ar of f(cur)) {
      if (ar.reverse) {
        if (!visited.has(ar.reverse.p1)) {
          queue.push(ar.reverse.p1);
          res.push(ar);
          visited.add(ar.reverse.p1);
        }
      } else {
        if (!visited.has(ar.p2)) {
          queue.push(ar.p2);
          res.push(ar);
          visited.add(ar.p2);
        }
      }
    }
  }
  return res;
}

let t = 0;
function draw() {
  requestAnimationFrame(draw);

  ctx.clearRect(0, 0, c.width, c.height);

  // console.log(nextSib(lastEditedPoint));
  for (const ar of biTraverse(nextSib, lastEditedPoint)) {
    const { p2: p, p1 } = ar;
    //h
    // p.p[0] = p1.p[0] + 100;

    // descendants(p).l = descendants(p1).r
    const groupR = Math.max(
      ...descendants(p1).map(({ p1, p2 }) => p2.p[0]),
      p1.p[0]
    );
    p.p[0] = groupR + 120;
  }
  for (const ar of biTraverse(prevSib, lastEditedPoint)) {
    const { p2: p, p1 } = ar;
    //h
    // p.p[0] = p1.p[0] - 100;

    // descendants(p).r = descendants(p1).l
    const otherGroupL = Math.min(
      ...descendants(p1).map(({ p1, p2 }) => p2.p[0]),
      p1.p[0]
    );
    const myGroupRRep = [
      ...descendants(p).map(({ p1, p2 }) => [p2, p2.p[0]]),
      [p, p.p[0]],
    ]
      .toSorted((a, b) => a[1] - b[1])
      .at(-1)[0];
    // note: this works because it assumes there is only one rightmost point in the group
    myGroupRRep.p[0] = otherGroupL - 120;
  }
  for (const ar of biTraverse(nextsAndPrevs, lastEditedPoint)) {
    if (ar.reverse) {
      const { p2: p, p1 } = ar.reverse;
      //v
      p1.p[1] = p.p[1] - 100;
      //h
      // const d = descendents(p1).map(({ p1, p2 }) => p2.p);
      // const max = Math.max(...d.map(([x, y]) => x));
      // const min = Math.min(...d.map(([x, y]) => x));
      // if (min !== Infinity && max !== -Infinity)
      //   p1.p[0] = (max - min) / 2 + min;
    } else {
      const { p2: p, p1 } = ar;
      //v
      p.p[1] = p1.p[1] + 100;
      //h
      // const d = descendents(p1).map(({ p1, p2 }) => p2.p);
      // const max = Math.max(...d.map(([x, y]) => x));
      // const min = Math.min(...d.map(([x, y]) => x));
      // if (min !== Infinity && max !== -Infinity)
      //   p1.p[0] = (max - min) / 2 + min;
    }
  }

  drawGraph();

  t++;
}
draw();
