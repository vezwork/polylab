import { randomCssRgb } from "../../../lib/math/Color.js";

//VEC2
const smul = (n, [x, y]) => [n * x, n * y];
const len = ([x, y]) => (x ** 2 + y ** 2) ** (1 / 2);
const unit = (p) => smul(1 / len(p), p);
const add = ([x, y], [p, q]) => [x + p, y + q];
const sub = ([x, y], [p, q]) => [x - p, y - q];
const dist = (p, q) => len(sub(p, q));
const rot90 = ([x, y]) => [y, -x];
const set = (p, [x, y]) => {
  p[0] = x;
  p[1] = y;
};
const angleOf = (v) => Math.atan2(v[1], v[0]);
const fromPolar = (length, theta) => [
  length * Math.cos(theta),
  length * Math.sin(theta),
];
const lerp = (start, end, t) => add(start, smul(t, sub(end, start)));

// DRAWING
function drawArrow(from, to, color = "black") {
  const headlen = 14; // length of head in pixels
  const d = sub(to, from);
  const angle = angleOf(d);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(...from);
  ctx.lineTo(...to);
  ctx.lineTo(...sub(to, fromPolar(headlen, angle - Math.PI / 6)));
  ctx.moveTo(...to);
  ctx.lineTo(...sub(to, fromPolar(headlen, angle + Math.PI / 6)));

  ctx.lineWidth = 6;
  ctx.strokeStyle = "#5a6b4d";
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.stroke();
}
function drawCircle(p, r, stroke = false) {
  ctx.beginPath();
  ctx.ellipse(p[0], p[1], r, r, 0, 0, Math.PI * 2);
  if (stroke) ctx.stroke();
  else ctx.fill();
}

const mid = [c.width / 2, c.height / 2];

// NODES AND EDGES
const p = [
  [300, 300, "brown"],
  [310, 310, "hsl(110 50% 50%)"],
  //pink
  [320, 360, "hsl(302 70% 70%)"],
  [330, 330, "box", "↑"],
  [331, 330, "box", "↓"],
  //blue
  [310, 311, "hsl(202 70% 70%)"],
  //purple
  [310, 12, "hsl(252 50% 50%)"],
  [310, 113, "hsl(252 50% 70%)"],
  [310, 14, "hsl(252 50% 90%)"],
  //green
  [310, 15, "hsl(110 50% 70%)"],
  [310, 0, "hsl(110 50% 90%)"],
  [310, 17, "yellow"],
  [310, 20, "orange"],
];
const e = new Map();
const re = new Map();

let at = p[0];
let grabbing = null;
let grabbingParent = null;

const go = (p1) => e.get(p1) ?? [];
const og = (p1) => re.get(p1) ?? [];
const es = () => e.entries().flatMap(([k, v]) => v.map((q) => [k, q]));

const adde = (p1, p2) => {
  e.set(p1, [...go(p1), p2]);
  re.set(p2, [...og(p2), p1]);
};
const dele = (p1, p2) => {
  e.set(
    p1,
    go(p1).filter((n) => n !== p2)
  );
  re.set(
    p2,
    og(p1).filter((n) => n !== p1)
  );
};

adde(p[0], p[1]);
adde(p[2], p[3]);
adde(p[2], p[4]);
adde(p[1], p[5]);
adde(p[5], p[6]);

adde(p[6], p[7]);
adde(p[7], p[8]);
adde(p[8], p[12]);

// purple to pink
adde(p[6], p[2]);

adde(p[1], p[9]);
adde(p[9], p[10]);
adde(p[10], p[11]);

const goto = () => (grabbing === at ? og(at) : [...go(at), ...og(at)]);

// DRAWING NODES
const margin = 1;
const nodeTree = (q, depth) => {
  if (depth === 0) return { q, size: 0, childNodes: [] };
  const childNodes = go(q).map((nxt) => nodeTree(nxt, depth - 1));
  return {
    q,
    size: childNodes.reduce((acc, cur) => cur.size + acc + margin, margin),
    childNodes,
  };
};
const drawNode = (q, x, y, size = 50, depth = 10) => {
  const t = nodeTree(q, depth);
  ctx.lineWidth = 1;
  drawNodeTree(t, x, y, size);
};
const drawNodeTree = (nt, x, y, size) => {
  if (nt.q[2] === "box") {
    ctx.fillStyle = "brown";
    ctx.fillRect(x - size / 2, y - size / 2 + 6, size, size);
    ctx.fillStyle = "orange";
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
    ctx.font = `${size / 2}px serif`;
    ctx.fillStyle = "black";
    ctx.fillText(nt.q[3], x, y);
  } else {
    ctx.fillStyle = nt.q[2];
    drawCircle([x, y], size / 2);
  }
  const m = (size * margin) / nt.size;
  let s = x - size / 2 + m;
  for (const nxt of nt.childNodes) {
    const pns = (size * nxt.size) / nt.size;
    drawNodeTree(nxt, s + pns / 2, y, pns);
    s += pns + m;
  }
};

let targetCircle = [...at];

// INPUT
let closestToMouse = at;
let mouse = [0, 0];
addEventListener("mousemove", (ev) => {
  const nxt = goto();
  mouse = [ev.offsetX, ev.offsetY];
  let closest = nxt[0] ?? at;
  for (const q of nxt) if (dist(q, mouse) < dist(closest, mouse)) closest = q;
  closestToMouse = closest;
});
addEventListener("mousedown", (ev) => {
  if (at === grabbing) grabbingParent = closestToMouse;
  at = closestToMouse;
});
addEventListener("keydown", (ev) => {
  const to = go(at);
  const from = og(at);

  if (grabbing === at) {
    if (ev.key === " ") {
      grabbing = null;
      grabbingParent = null;
    }
    let next = from[ev.key];
    if (next !== undefined && at === grabbing) grabbingParent = next;
    at = next ?? at;
    return;
  }

  if (parseInt(ev.key) >= to.length)
    at = from[parseInt(ev.key) - to.length] ?? at;
  else at = to[ev.key] ?? at;

  if (ev.key === " ") {
    if (grabbing === null) grabbing = at;
    else if (grabbingParent !== null) {
      dele(grabbingParent, grabbing);
      adde(at, grabbing);
      grabbing = null;
      grabbingParent = null;
    }
  }

  if (at === p[3]) {
    const orangeParent = og(p[12])[0];
    const orangeGrandParent = og(orangeParent)[0];
    if (orangeGrandParent === undefined) return;
    dele(orangeParent, p[12]);
    adde(orangeGrandParent, p[12]);
  }
  if (at === p[4]) {
    const orangeParent = og(p[12])[0];
    const orangeSibling = go(orangeParent)[0];
    if (orangeSibling === p[12]) return;
    dele(orangeParent, p[12]);
    adde(orangeSibling, p[12]);
  }
});

// FORCE
const PUSH = (x) => 60 / x;
const PULL = (x) => (x / 180) ** 3;
const R = 30;

requestAnimationFrame(draw);
function draw() {
  requestAnimationFrame(draw);

  let forces = p.map((p) => [0, 0]);
  for (let ii = 0; ii < 4; ii++) {
    for (let i = 0; i < p.length; i++) {
      for (let j = i + 1; j < p.length; j++) {
        const dir = unit(sub(p[i], p[j]));
        const v = PUSH(dist(p[i], p[j]));
        const f = smul(v, dir);
        forces[i] = add(forces[i], f);
        forces[j] = sub(forces[j], f);
      }
      const nxt = go(p[i]) ?? [];
      nxt.forEach((q) => {
        const dir = unit(sub(q, p[i]));
        const v = PULL(dist(p[i], q));
        forces[i] = add(forces[i], smul(v, dir));
      });
      const nxtr = og(p[i]) ?? [];
      nxtr.forEach((q) => {
        const dir = unit(sub(q, p[i]));
        const v = PULL(dist(p[i], q));
        forces[i] = add(forces[i], smul(v, dir));
      });
      forces[i] = add(forces[i], smul(1 / 130, sub(mid, p[i])));
    }
  }
  forces.forEach((f, i) => set(p[i], add(p[i], f)));

  // DRAWING
  ctx.fillStyle = "#394133";
  ctx.fillRect(0, 0, c.width, c.height);
  const t = performance.now() / 50;

  for (const [s, q] of es()) {
    const d = dist(s, q);
    if (d < R * 2 + 12) continue;
    const from = lerp(s, q, (0 + R + 8) / d);
    const to = lerp(s, q, (d - R - 6) / d);
    const isGrabbing = q === grabbing && s === grabbingParent;
    if (isGrabbing) {
      ctx.save();
      ctx.setLineDash([15, 5]);
      ctx.lineDashOffset = t / 2;
      drawArrow(from, to, "white");
      ctx.restore();
    } else drawArrow(from, to);
  }

  ctx.font = "16px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 4;

  const nxt = goto();

  for (let i = 0; i < nxt.length; i++) {
    ctx.strokeStyle = "#5a6b4d";
    const pos = lerp(at, nxt[i], 1 / 2);
    ctx.strokeText(i, ...pos);
    ctx.fillStyle = "white";
    ctx.fillText(i, ...pos);
  }
  ctx.fillStyle = "#5a6b4d";

  //  ctx.strokeStyle='white'
  for (const q of p) {
    drawNode(q, q[0], q[1], R * 2);
    ctx.lineWidth = 6;
    const pos = add(q, smul(1 / 30, sub(mouse, q)));
    if (closestToMouse === q)
      drawCircle(pos, R + 6 + dist(mouse, q) / 30, true);
  }

  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  targetCircle = lerp(targetCircle, at, 0.4);
  drawCircle(targetCircle, R + 4, true);

  const dl = (2 * Math.PI * R) / 8;
  ctx.setLineDash([dl, dl]);
  ctx.lineDashOffset = t;

  ctx.lineWidth = 2;

  ctx.strokeStyle = "white";
  if (grabbing) drawCircle(grabbing, R, true);
  ctx.setLineDash([]);
}
// mechanics:
// -[x] directed graph
//  -[x] moving directedly
// -[x] "grabbing"
// -[x] buttons that move a node "up" and "down"
// vis:
// -[x] node colors
// -[x] nested node vis
// game:
// -[] gates (idea: vis as chain of things o -> o -> o)
// -[] incremental instructions/reveal
// -[] sfx
// -[] music

// tangent ideas:
// -[] multi-arrows
// -[] graph inside node
// -[] parent color(s) "halo"
