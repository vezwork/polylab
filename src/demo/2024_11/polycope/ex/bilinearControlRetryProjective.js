import {
  v,
  sub,
  add,
  distance,
  assign,
  lerp,
  mul,
  coLerp,
  length,
} from "../../../lib/math/Vec2.js";

const dpr = window.devicePixelRatio;
const h = c.height;
const w = c.width;
c.width = w * dpr;
c.height = h * dpr;
c.style.width = w + "px";
c.style.height = h + "px";
ctx.scale(dpr, dpr);

// intersect ref: https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection#Using_homogeneous_coordinates
const homoIntersect = ([a1, b1, c1], [a2, b2, c2]) => [
  b1 * c2 - b2 * c1,
  -(a2 * c1 - a1 * c2),
  a1 * b2 - a2 * b1,
];
const cartesianFromHomo = ([a, b, c]) =>
  c === 0 ? [a / 0.0001, b / 0.0001] : [a / c, b / c];
const homoFromPointAndVector = ([x, y], [dx, dy]) => [dy, dx, -dy * x + dx * y];
const homoFromPoints = (p1, p2) => homoFromPointAndVector(p1, sub(p2, p1));

const inter = ([a, b], [c, d]) =>
  cartesianFromHomo(homoIntersect(homoFromPoints(a, b), homoFromPoints(c, d)));
const softSqr = (x) => {
  if (x >= 0 && x <= 1) return x;
  if (x > 1) return 2 - 1 / x;
  if (x < 0) return 1 / (-x + 1) - 1;
};
const proj =
  (a, b, d, c) =>
  ([u, v]) => {
    const ppx = inter([a, b], [c, d]);
    const ppy = inter([a, c], [b, d]);
    const linex = [lerp(a, b, u), ppy];
    const liney = [lerp(a, c, v), ppx];
    return inter(linex, liney);
  };
const invProj = (a, b, d, c) => (p) => {
  const ppx = inter([a, b], [c, d]);
  const ppy = inter([a, c], [b, d]);

  const xp = inter([a, b], [p, ppy]);
  const yp = inter([a, c], [p, ppx]);

  return [coLerp(a, b, xp), coLerp(a, c, yp)];
};
const bilinear = (p, ...ps) => proj(...ps)(p);
const invBilinear = (p, ...ps) => invProj(...ps)(p);

const P = [v(0, 0), v(1, 0), v(1, 1), v(0, 1)];

const up = new Map();
const down = new Map();
const left = new Map();
const right = new Map();
const hnext = (a, b) => {
  right.set(a, b);
  left.set(b, a);
};
const vnext = (a, b) => {
  down.set(a, b);
  up.set(b, a);
};

const psr = [v(1, 0), v(2, 0), v(2, 1), v(1, 1)];
const psl = [v(-1, 0), v(0, 0), v(0, 1), v(-1, 1)];
const psd = [v(0, 1), v(1, 1), v(1, 2), v(0, 2)];

let ps = [v(0, 0), v(1, 0), v(1, 1), v(0, 1)];
let ps2 = ps.map((p) => bilinear(p, ...[v(1, 0), v(2, 1), v(2, 2), v(3, 1)]));
let ps3 = [v(2, 1), v(3, 1), v(3, 2), v(2, 2)];
let ps4 = [v(2, 2), v(3, 2), v(3.25, 5), v(1.75, 5)];
let ps5 = [v(0, 2), v(2, 2), v(1.75, 5), v(0, 3)];
let ps6 = [...psd];
let ps4r = psr.map((p) => bilinear(p, ...ps4));
let ps5d = ps6.map((p) => bilinear(p, ...ps5));
let ps5dr = ps2.map((p) => bilinear(p, ...ps5d));
let ps5drr = psr.map((p) => bilinear(p, ...ps5dr));
let ps5dd = psd.map((p) => bilinear(p, ...ps5d));

const chain = [ps, ps2, ps3, ps4, ps5, ps6, ps5d, ps5dr, ps5drr, ps4r, ps5dd];

const newRight = (prev) => {
  let ps = psr.map((p) => bilinear(p, ...prev));
  hnext(prev, ps);
  chain.push(ps);
  return ps;
};
const newLeft = (prev) => {
  let ps = psl.map((p) => bilinear(p, ...prev));
  hnext(ps, prev);
  chain.push(ps);
  return ps;
};

newLeft(ps);
const tryP = newRight(ps5drr);
const tryPu = [ps4r[3], ps4r[2], tryP[1], tryP[0]];
vnext(ps4r, tryPu);
vnext(tryPu, tryP);
chain.push(tryPu);
newRight(tryPu);
newLeft(newLeft(newLeft(ps5d)));
newLeft(ps5dd);

hnext(ps, ps2);
hnext(ps2, ps3);
hnext(ps5, ps4);
vnext(ps3, ps4);
vnext(ps, ps6);
vnext(ps6, ps5);
vnext(ps5, ps5d);
hnext(ps5d, ps5dr);
hnext(ps5dr, ps5drr);
hnext(ps4, ps4r);
vnext(ps5d, ps5dd);

const camFromUV = (p) => add(v(300), mul(100, p));
const UVFromCam = (p) => mul(1 / 100, add(v(-300), p));

let mouse = [0, 0];
let isMouseDown = false;

let dragging;

let drawing = [];

let cam = [...ps];

addEventListener("mousemove", (e) => {
  mouse = UVFromCam([e.offsetX, e.offsetY]);
});
addEventListener("mousedown", (e) => {
  isMouseDown = true;

  for (const ch of chain) {
    for (const p of ch) {
      if (distance(mouse, invBilinear(p, ...cam)) < 0.1) {
        if (!dragging) dragging = p;
      }
    }
  }
  //if (!dragging) drawing.push(invBilinear(mouse,...ps))
});
addEventListener("mouseup", (e) => {
  isMouseDown = false;
  dragging = undefined;
});

const drawQuad = (qps, camPs) => {
  qps.forEach((p) => ctx.fillRect(...camFromUV(p), 5, 5));
  ctx.beginPath();
  qps.forEach((p) => ctx.lineTo(...camFromUV(p)));
  ctx.closePath();
  ctx.stroke();
};

let target = 0;
let animTarget = ps;
addEventListener("keydown", (e) => {
  e.preventDefault();
  if (e.key === "ArrowRight") animTarget = right.get(animTarget) ?? animTarget;
  if (e.key === "ArrowLeft") animTarget = left.get(animTarget) ?? animTarget;
  if (e.key === "ArrowUp") animTarget = up.get(animTarget) ?? animTarget;
  if (e.key === "ArrowDown") animTarget = down.get(animTarget) ?? animTarget;
});

let t = 0;
function draw() {
  requestAnimationFrame(draw);
  ctx.clearRect(0, 0, c.width, c.height);

  cam = cam.map((p, i) => lerp(p, animTarget[i], 0.06));

  chain.forEach((ps) => drawQuad(ps.map((p) => invBilinear(p, ...cam))));

  ctx.save();
  ctx.strokeStyle = "red";
  drawQuad(P);
  ctx.restore();

  if (dragging) assign(dragging)(bilinear(mouse, ...cam));

  t++;
}
requestAnimationFrame(draw);
