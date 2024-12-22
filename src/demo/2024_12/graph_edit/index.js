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
function ancestors(p) {
  if (!p) return [];
  const visited = new Set([p]);
  const queue = [p];
  const res = [];
  while (queue.length > 0) {
    const cur = queue.pop();

    for (const ar of prevs(cur)) {
      if (!visited.has(ar)) {
        queue.push(ar.p1);
        res.push(ar);
        visited.add(ar);
      }
    }
  }
  return res;
}
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
const total = (...array) => array.reduce((a, b) => a + b, 0);
const average = (...array) => total(...array) / array.length;

function onChangeH(p, visited = new Set([p])) {
  if (!p) return;
  ctx.fillStyle = "black";
  const vs = visited.size;
  ctx.fillText(visited.size, p.p[0] + 50, p.p[1]);
  ctx.fillRect(...p.p, 25, 25);

  const descWidths = nexts(p).map(({ p2 }) => {
    const descXs = descendants(p2).map(({ p1, p2 }) => p2.p[0]);
    const groupL = Math.min(...descXs, p2.p[0]);
    const groupR = Math.max(...descXs, p2.p[0]);
    return groupR - groupL;
  });

  const totalWidthOfDescs =
    total(...descWidths) + (descWidths.length - 1) * 120;
  const startX = p.p[0] - totalWidthOfDescs / 2;
  let curX = startX;
  nexts(p).forEach(({ p2 }, i) => {
    const groupLRep = [
      ...descendants(p2).map(({ p1, p2 }) => [p2, p2.p[0]]),
      [p2, p2.p[0]],
    ]
      .toSorted((a, b) => a[1] - b[1])
      .at(0)[0];
    if (!visited.has(groupLRep)) {
      groupLRep.p[0] = curX;
    }
    curX += descWidths[i] + 120;
    if (!visited.has(groupLRep)) {
      visited.add(groupLRep);
      onChangeH(groupLRep, visited);
    }
    ctx.fillStyle = "rgba(0,0,255,0.1)";
    ctx.fillRect(...groupLRep.p, 50, 50);
  });
  for (const { p2: sib } of nextSib(p)) {
    // descendants(p).r = descendants(p1).l
    const otherGroupR = Math.max(
      ...descendants(p).map(({ p1, p2 }) => p2.p[0]),
      p.p[0]
    );
    const myGroupLRep = [
      ...descendants(sib).map(({ p1, p2 }) => [p2, p2.p[0]]),
      [sib, sib.p[0]],
    ]
      .toSorted((a, b) => a[1] - b[1])
      .at(0)[0];
    // note: this works because it assumes there is only one leftmost point in the group
    if (visited.has(myGroupLRep)) continue;
    visited.add(myGroupLRep);
    myGroupLRep.p[0] = otherGroupR + 120;
    onChangeH(myGroupLRep, visited);
    ctx.fillStyle = "rgba(0,255,0,0.1)";
    ctx.fillRect(...myGroupLRep.p, 50, 50);
  }
  for (const { p2: sib } of prevSib(p)) {
    // descendants(p).r = descendants(p1).l
    const otherGroupL = Math.min(
      ...descendants(p).map(({ p1, p2 }) => p2.p[0]),
      p.p[0]
    );
    const myGroupRRep = [
      ...descendants(sib).map(({ p1, p2 }) => [p2, p2.p[0]]),
      [sib, sib.p[0]],
    ]
      .toSorted((a, b) => a[1] - b[1])
      .at(-1)[0];
    // note: this works because it assumes there is only one rightmost point in the group
    if (visited.has(myGroupRRep)) continue;
    visited.add(myGroupRRep);
    myGroupRRep.p[0] = otherGroupL - 120;
    onChangeH(myGroupRRep, visited);
    ctx.fillStyle = "rgba(0,255,0,0.1)";
    ctx.fillRect(...myGroupRRep.p, 50, 50);
  }

  for (const { p1: parent } of prevs(p)) {
    if (visited.has(parent)) continue;
    visited.add(parent);

    const descXs = descendants(parent).map(({ p1, p2 }) => p2.p[0]);
    const groupL = Math.min(...descXs);
    const groupR = Math.max(...descXs);
    parent.p[0] = groupL + (groupR - groupL) / 2;
    ctx.fillStyle = "rgba(255,0,0,0.1)";
    ctx.fillRect(...parent.p, 50, 50);
    onChangeH(parent, visited);
  }
}
function onChangeV(p, visited = new Set([p])) {
  for (const { p2: child } of nexts(p)) {
    if (visited.has(child)) continue;
    visited.add(child);

    // idea: can also clamp child.p[1] between p.p[1]+100 and p.p[1]+200 or something
    child.p[1] = p.p[1] + 100;
    onChangeV(child, visited);
  }
  for (const { p1: parent } of prevs(p)) {
    if (visited.has(parent)) continue;
    visited.add(parent);

    parent.p[1] = p.p[1] - 100;
    onChangeV(parent, visited);
  }
}

(JSON.parse(localStorage.getItem("pData")) ?? []).forEach(
  (p) => new Point(p.p, p.char)
);
(JSON.parse(localStorage.getItem("arData")) ?? []).forEach(
  ([i1, i2]) => new Arrow(Point.all[i1], Point.all[i2], "")
);
document.addEventListener("keydown", (e) => {
  if (e.key === "s") {
    localStorage.setItem("pData", JSON.stringify(Point.all));
    localStorage.setItem(
      "arData",
      JSON.stringify(
        Arrow.all.map(({ p1, p2 }) => [
          Point.all.indexOf(p1),
          Point.all.indexOf(p2),
        ])
      )
    );
  }
  if (e.key === "c") localStorage.clear();
  if (e.key === "Backspace") Point.all.at(-1).remove();
});

let t = 0;
function draw() {
  requestAnimationFrame(draw);

  ctx.clearRect(0, 0, c.width, c.height);

  onChangeV(lastEditedPoint);
  onChangeH(lastEditedPoint);

  drawGraph();

  t++;
}
draw();
