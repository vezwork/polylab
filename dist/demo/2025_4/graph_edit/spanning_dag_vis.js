import {
  distance,
  sub,
  assign,
  add,
  v,
  angleOf,
  fromPolar,
  length,
  setLength,
} from "../../../lib/math/Vec2.js";
import { lerp } from "../../../lib/math/Line2.js";

const c = document.getElementById("c");
const ctx = c.getContext("2d");

const R = 30;

function drawCircle(p, r) {
  ctx.beginPath();
  ctx.ellipse(p[0], p[1], r, r, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "black";
}
function drawLine(l) {
  if (l.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(...l[0]);
  for (const p of l) {
    ctx.lineTo(...p);
  }
}
//https://stackoverflow.com/a/6333775
function drawArrow(context, from, to) {
  const headlen = 14; // length of head in pixels
  const d = sub(to, from);
  const angle = angleOf(d);
  context.beginPath();
  context.moveTo(...from);
  context.lineTo(...to);
  context.lineTo(...sub(to, fromPolar(headlen, angle - Math.PI / 6)));
  context.moveTo(...to);
  context.lineTo(...sub(to, fromPolar(headlen, angle + Math.PI / 6)));
  context.stroke();
}

const nexts = (p) => Arrow.all.filter(({ p1 }) => p1 === p);

function* dfs(start, viewedNodes = new Set()) {
  viewedNodes.add(start);
  yield { viewed: start };
  for (const edge of nexts(start)) {
    const to = edge.p2;
    yield { edge };
    if (!viewedNodes.has(to)) yield* dfs(to, viewedNodes);
    yield { afterEdge: edge };
  }
  yield { visited: start };
}
function* dfsVis(start) {
  const visitedNodes = new Set(),
    viewedNodes = new Set(),
    backEdges = new Set(),
    treeEdges = new Set(),
    forwardEdges = new Set(),
    index = new Map(),
    low = new Map(),
    s = [],
    sccs = []; // topologically sorted strongly connected components,
  const nodeToScc = new Map();
  let i = 0;

  const edgeToScc = new Map();
  const condensedEdges = new Set();

  const onStack = new Set();

  for (const data of dfs(start)) {
    if (data.viewed) {
      const v = data.viewed;
      viewedNodes.add(v);

      index.set(v, i);
      low.set(v, i);
      v.char = i;

      i = i + 1;
      s.push(v);

      onStack.add(v);
    }
    if (data.edge) {
      const edge = data.edge;
      const from = edge.p1;
      const to = edge.p2;

      yield {
        visitedEdges: treeEdges,
        queueEdges: forwardEdges,
        currentEdge: edge,
      };
      yield { node: [to, visitedNodes, viewedNodes] };

      if (viewedNodes.has(to) && !visitedNodes.has(to)) backEdges.add(edge);
      else if (visitedNodes.has(to)) forwardEdges.add(edge);
      else treeEdges.add(edge);
    }
    if (data.afterEdge) {
      const from = data.afterEdge.p1;
      const to = data.afterEdge.p2;

      if (onStack.has(to)) {
        low.set(from, Math.min(low.get(from), low.get(to)));
        from.char = low.get(from);
        yield {};
      }
    }
    if (data.visited) {
      const v = data.visited;
      visitedNodes.add(v);

      if (low.get(v) === index.get(v)) {
        const scc = new Set();

        let w;
        do {
          w = s.pop();
          nodeToScc.set(w, scc);
          onStack.delete(w);
          scc.add(w);
        } while (w !== v);

        for (const sccNode of scc) {
          for (const edge of nexts(sccNode)) {
            const from = edge.p1;
            const to = edge.p2;
            const fromScc = nodeToScc.get(from);
            const toScc = nodeToScc.get(to);
            if (toScc === fromScc) edgeToScc.set(edge, scc);
            else condensedEdges.add(edge);
            yield { edgeToScc, condensedEdges };
          }
        }

        sccs.unshift(scc);
        yield { sccs };
      }
    }
  }
}

class Point {
  static all = [];
  constructor(p, char) {
    this.p = p;
    this.char = char;
    Point.all.push(this);
  }
  draw() {
    ctx.fillStyle = "black";
    ctx.font = "bold 40px serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(this.char, this.p[0], this.p[1] + 4);
  }
  drawUnder() {
    drawCircle(this.p, R);
    ctx.fillStyle = "#F2F2F2";
    ctx.fill();
  }
}
class Arrow {
  static all = [];
  constructor(p1, p2, label = "") {
    this.p1 = p1;
    this.p2 = p2;
    this.label = label;
    Arrow.all.push(this);
  }
  draw() {
    const gap = R;
    const a = lerp([this.p1.p, this.p2.p])(
      gap / distance(this.p1.p, this.p2.p)
    );
    const b = lerp([this.p1.p, this.p2.p])(
      1 - gap / distance(this.p1.p, this.p2.p)
    );
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    drawArrow(ctx, a, b);

    ctx.save();
    ctx.beginPath();
    ctx.font = "bold 18px serif";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;
    const label = Array.isArray(this.label) ? this.label.join("") : this.label;
    ctx.strokeText(label, ...lerp([this.p1.p, this.p2.p])(0.5));
    ctx.fillStyle = "black";
    ctx.fillText(label, ...lerp([this.p1.p, this.p2.p])(0.5));
    ctx.restore();
  }
}

const resolveCollisions = (resolveP) => {
  for (const { p } of Point.all) {
    if (p === resolveP.p) continue;
    if (distance(resolveP.p, p) < R * 2 + 1) {
      assign(resolveP.p)(add(p, setLength(R * 2 + 1, sub(resolveP.p, p))));
    }
  }
};

let pointer = [0, 0];
let dragging = null;
let arrowing = null;
c.addEventListener("pointerdown", (e) => {
  const close = Point.all.find(({ p }) => distance(p, pointer) < R);
  if (close) {
    dragging = close;
    c.style.cursor = "grabbing";
  } else {
    const newP = new Point(v(...pointer), "·");
    resolveCollisions(newP);
  }
});
c.addEventListener("pointermove", (e) => {
  assign(pointer)([e.offsetX, e.offsetY]);

  const close = Point.all.find(({ p }) => distance(p, pointer) < R);

  if (dragging) {
    assign(dragging.p)(pointer);
    resolveCollisions(dragging);
  } else if (close) c.style.cursor = "grab";
  else c.style.cursor = "auto";
});
c.addEventListener("pointerup", (e) => {
  dragging = null;
});

const p1 = new Point([100, 100], "A");
const p2 = new Point([100, 200], "B");
new Arrow(p1, p2, "10 +");
let B = dfsVis(p1);
let bfsPoint = [p1, [], []];
let bfsEdge = { visitedEdges: new Set(), queueEdges: [] };
let sccs = new Set();
let sccData = { edgeToScc: new Map(), condensedEdges: new Set() };

document.addEventListener("keydown", (e) => {
  console.log(e.key);
  if (e.key.length === 1) new Point(v(...pointer), e.key);
  if (e.key === "Alt") {
    B = dfsVis(p1);
    bfsPoint = [p1, [], []];
    bfsEdge = { visitedEdges: new Set(), queueEdges: [] };
    sccs = new Set();
    sccData = { edgeToScc: new Map(), condensedEdges: new Set() };
  }
  if (e.key === "Meta") {
    const close = Point.all.find(({ p }) => distance(p, pointer) < R);
    if (close) arrowing = new Arrow(close, { p: pointer });
  }
});
document.addEventListener("keyup", (e) => {
  if (e.key === "Meta") {
    const close = Point.all.find(({ p }) => distance(p, pointer) < R);
    if (close) arrowing.p2 = close;
    else Arrow.all = Arrow.all.filter((a) => a !== arrowing);
  }
  arrowing = null;
});

// const points = Array(20)
//   .fill()
//   .map((_, i) => new Point(v(i*20)));

// points.forEach((_, i, ps) => {
//   if (i > 0) {
//     const pii = ps[i - 1];
//     const pi = ps[i];
//     mo((pi, pii) => assign(pii.p)(sub(pi.p, v(20))))(pi)(pii);
//     mo((pii, pi) => assign(pi.p)(add(pii.p, v(20))))(pii)(pi);
//   }
// });
let t = 0;
function draw() {
  requestAnimationFrame(draw);

  ctx.fillStyle = "#EEDDEF";
  ctx.clearRect(0, 0, c.width, c.height);

  const { visitedEdges, queueEdges, currentEdge } = bfsEdge;

  for (const scc of sccs) {
    for (const q of scc) {
      drawCircle(q.p, 40);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#EEDDEF";
      ctx.fill();
    }
  }

  for (const [edge, scc] of sccData.edgeToScc) {
    const e = edge;
    const a = lerp([e.p1.p, e.p2.p])(0);
    const b = lerp([e.p1.p, e.p2.p])(1);

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(...a);
    ctx.lineTo(...b);
    ctx.lineWidth = 80;
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#EEDDEF";
    ctx.stroke();
    ctx.lineCap = "round";
    ctx.strokeStyle = undefined;
    ctx.restore();
  }

  const gap = R;
  for (const e of queueEdges) {
    const a = lerp([e.p1.p, e.p2.p])(gap / distance(e.p1.p, e.p2.p));
    const b = lerp([e.p1.p, e.p2.p])(1 - gap / distance(e.p1.p, e.p2.p));
    drawArrow(ctx, a, b);
    ctx.lineWidth = 6;
    ctx.strokeStyle = "orange";
    ctx.stroke();
    ctx.lineCap = "round";
  }
  for (const e of visitedEdges) {
    const a = lerp([e.p1.p, e.p2.p])(gap / distance(e.p1.p, e.p2.p));
    const b = lerp([e.p1.p, e.p2.p])(1 - gap / distance(e.p1.p, e.p2.p));
    drawArrow(ctx, a, b);
    ctx.lineWidth = 6;
    ctx.strokeStyle = "YellowGreen";
    ctx.stroke();
    ctx.lineCap = "round";
  }
  if (currentEdge) {
    const e = currentEdge;

    const a = lerp([e.p1.p, e.p2.p])(gap / distance(e.p1.p, e.p2.p));
    const b = lerp([e.p1.p, e.p2.p])(1 - gap / distance(e.p1.p, e.p2.p));
    drawArrow(ctx, a, b);
    ctx.lineWidth = 6;
    ctx.strokeStyle = "red";
    ctx.stroke();
    ctx.lineCap = "round";
  }

  Arrow.all.forEach((p) => p.draw());
  Point.all.forEach((p) => p.drawUnder());
  Point.all.forEach((p) => p.draw());
  if (t % 16 === 0) {
    const { value, done } = B.next();
    if (!done) {
      if (value.node) bfsPoint = value.node;
      if (value.visitedEdges) bfsEdge = value;
      if (value.sccs) sccs = value.sccs;
      if (value.condensedEdges) sccData = value;
    } else {
      bfsPoint = [undefined, bfsPoint[1], bfsPoint[2]];
      bfsEdge = { ...bfsEdge, currentEdge: undefined };
    }
  }

  const [p, visited, queue] = bfsPoint;

  for (const q of queue) {
    drawCircle(q.p, R);
    ctx.strokeStyle = "orange";
    ctx.stroke();
  }
  for (const v of visited) {
    drawCircle(v.p, R);
    ctx.strokeStyle = "YellowGreen";
    ctx.stroke();
  }
  if (p) {
    drawCircle(p.p, R);
    ctx.strokeStyle = "red";
    ctx.stroke();
  }
  ctx.strokeStyle = "black";

  t++;
}
draw();
