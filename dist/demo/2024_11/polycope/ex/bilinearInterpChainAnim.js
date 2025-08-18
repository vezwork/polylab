import {
  v,
  sub,
  add,
  distance,
  assign,
  lerp,
  mul,
} from "../../../lib/math/Vec2.js";

const cross = (a, b) => a[0] * b[1] - a[1] * b[0];

// https://iquilezles.org/articles/ibilinear/
const bilinear = ([u, v], a, b, c, d) => lerp(lerp(a, b, u), lerp(d, c, u), v);
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
    if (w < 0.0) return v(-1.0);
    w = Math.sqrt(w);

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

let ps = [v(0, 0), v(1, 0), v(1, 1), v(0, 1)];
let ps2 = [v(1, 0), v(2, 1), v(2, 2), v(1, 1)];
let ps3 = [v(2, 1), v(3, 1), v(3, 2), v(2, 2)];
let ps4 = [v(2, 2), v(3, 2), v(3.25, 5), v(1.75, 5)];

const chain = [
  ps,
  ps2,
  ps3,
  ps4,
  [v(0, 2), v(2, 2), v(1.75, 5), v(0, 3)],
  [v(0, 1), v(1, 1), v(2, 2), v(0, 2)],
];

const camFromUV = (p) => add(v(300), mul(100, p));
const UVFromCam = (p) => mul(1 / 100, add(v(-300), p));

let mouse = [0, 0];
let isMouseDown = false;

let dragging;

let drawing = [];

addEventListener("mousemove", (e) => {
  mouse = UVFromCam([e.offsetX, e.offsetY]);
});
addEventListener("mousedown", (e) => {
  isMouseDown = true;

  for (const p of ps2) {
    if (distance(mouse, p) < 0.1) {
      if (!dragging) dragging = p;
    }
  }
  if (!dragging) drawing.push(invBilinear(mouse, ...ps));
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

let t = 0;
function draw() {
  requestAnimationFrame(draw);
  ctx.clearRect(0, 0, c.width, c.height);

  let st = (t / 100) % chain.length;
  const view = [0, 1, 2, 3].map((i) =>
    lerp(
      chain.at(Math.floor(st))[i],
      chain.at(Math.ceil(st) % chain.length)[i],
      st - Math.floor(st)
    )
  );

  chain.forEach((ps) => drawQuad(ps.map((p) => invBilinear(p, ...view))));

  ctx.save();
  ctx.strokeStyle = "red";
  drawQuad(P);
  ctx.restore();

  //  for (let x = -1; x<2; x+=0.1)
  //    for (let y = -1; y<2; y+=0.1)
  //      ctx.fillRect(...camFromUV(bilinear(v(x,y),...ps)),1,1)

  //  ctx.beginPath()
  //  drawing.forEach(p=>ctx.lineTo(...bilinear(p,...ps)))
  //  ctx.stroke()

  //  ctx.save()
  //  ctx.fillStyle='red'
  //  for (let x = -1; x<2; x+=0.1)
  //    for (let y = -1; y<2; y+=0.1)
  //      ctx.fillRect(...add(v(100),mul(100,invBilinear(bilinear(v(x,y),...ps),...ps))),1,1)
  //  ctx.restore()

  if (dragging) assign(dragging)(mouse);

  t++;
}
requestAnimationFrame(draw);
