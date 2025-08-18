import {
  v,
  sub,
  add,
  distance,
  assign,
  lerp,
  mul,
} from "../../../lib/math/Vec2.js";
import { mod } from "../../../lib/math/Number.js";

const cross = (a, b) => a[0] * b[1] - a[1] * b[0];

const bilinear = ([u, v], a, b, c, d) => lerp(lerp(a, b, u), lerp(d, c, u), v);
// for future reference (eliminating issues):
// - https://stackoverflow.com/questions/808441/inverse-bilinear-interpolation
// adapted from: https://iquilezles.org/articles/ibilinear/
const invBilinear = (p, a, b, c, d) => {
  let res = v(-1);

  let e = sub(b, a);
  let f = sub(d, a);
  let g = add(sub(a, b), sub(c, d));
  let h = sub(p, a);

  let k2 = cross(g, f);
  let k1 = cross(e, f) + cross(h, g);
  let k0 = cross(h, e);

  // if edges are parallel, this is a linear equation
  if (Math.abs(k2) < 0.001) {
    res = v((h[0] * k1 + f[0] * k0) / (e[0] * k1 - g[0] * k0), -k0 / k1);
  }
  // otherwise, it's a quadratic
  else {
    let w = k1 * k1 - 4.0 * k0 * k2;
    //        if( w<0.0 ) return v(-1.0);
    w = Math.sqrt(Math.abs(w));

    let ik2 = 0.5 / k2;
    let uu = (-k1 - w) * ik2;
    let u = (h[0] - f[0] * uu) / (e[0] + g[0] * uu);

    if (u < 0.0 || u > 1.0 || uu < 0.0 || uu > 1.0) {
      uu = (-k1 + w) * ik2;
      u = (h[0] - f[0] * uu) / (e[0] + g[0] * uu);
    }
    res = v(u, uu);
  }

  return res;
};

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

let ps = [v(0, 0), v(1, 0), v(1, 1), v(0, 1)];
let ps2 = [v(1, 0), v(2, 1), v(2, 2), v(1, 1)];
let ps3 = [v(2, 1), v(3, 1), v(3, 2), v(2, 2)];
let ps4 = [v(2, 2), v(3, 2), v(3.25, 5), v(1.75, 5)];
let ps5 = [v(0, 2), v(2, 2), v(1.75, 5), v(0, 3)];
let ps6 = [v(0, 1), v(1, 1), v(1, 2), v(0, 2)];
let ps5d = ps6.map((p) => bilinear(p, ...ps5));
let ps5dr = ps2.map((p) => bilinear(p, ...ps5d));
console.error(ps5d.map((p) => invBilinear(p, ...ps5dr)));

hnext(ps, ps2);
hnext(ps2, ps3);
hnext(ps5, ps4);
vnext(ps3, ps4);
vnext(ps, ps6);
vnext(ps6, ps5);
vnext(ps5, ps5d);
hnext(ps5d, ps5dr);

const chain = [ps, ps2, ps3, ps4, ps5, ps6, ps5d, ps5dr];

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

  cam = cam.map((p, i) => lerp(p, animTarget[i], 0.2));

  chain.forEach((ps) => drawQuad(ps.map((p) => invBilinear(p, ...cam))));

  ctx.save();
  ctx.strokeStyle = "red";
  drawQuad(P);
  ctx.restore();

  if (dragging) assign(dragging)(bilinear(mouse, ...cam));

  t++;
}
requestAnimationFrame(draw);
