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
  c === 0 ? [a / 0.001, b / 0.001] : [a / c, b / c];
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
  (a, b, c, d) =>
  ([u, v]) => {
    const ppx = inter([a, b], [c, d]);
    const ppy = inter([a, c], [b, d]);
    const linex = [lerp(a, b, u), ppy];
    const liney = [lerp(a, c, v), ppx];
    return inter(linex, liney);
  };
const invProj = (a, b, c, d) => (p) => {
  const ppx = inter([a, b], [c, d]);
  const ppy = inter([a, c], [b, d]);

  const xp = inter([a, b], [p, ppy]);
  const yp = inter([a, c], [p, ppx]);

  return [coLerp(a, b, xp), coLerp(a, c, yp)];
};

const ps = [
  [300, 300],
  [300, 320],
  [320, 300],
  [320, 320],
];
let mouse = [0, 0];
let isMouseDown = false;

let dragging;
addEventListener("mousemove", (e) => {
  mouse = [e.offsetX, e.offsetY];
});
addEventListener("mousedown", (e) => {
  isMouseDown = true;

  for (const p of ps) {
    if (distance(mouse, p) < 10 && !dragging) dragging = p;
  }
});
addEventListener("mouseup", (e) => {
  isMouseDown = false;
  dragging = undefined;
});

let t = 0;
function draw() {
  requestAnimationFrame(draw);
  ctx.clearRect(0, 0, c.width, c.height);
  ps.forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
  });

  let pp = inter([ps[0], ps[1]], [ps[2], ps[3]]);
  let xpp = pp;
  //  ctx.fillRect(...pp, 5, 5)
  //  ctx.beginPath()
  //  ctx.lineTo(...ps[0])
  //  ctx.lineTo(...pp)
  //  ctx.stroke()
  //  ctx.beginPath()
  //  ctx.lineTo(...ps[2])
  //  ctx.lineTo(...pp)
  //  ctx.stroke()

  pp = inter([ps[0], ps[2]], [ps[1], ps[3]]);
  let ypp = pp;
  //  ctx.fillRect(...pp, 5, 5)
  //  ctx.beginPath()
  //  ctx.lineTo(...ps[0])
  //  ctx.lineTo(...pp)
  //  ctx.stroke()
  //  ctx.beginPath()
  //  ctx.lineTo(...ps[1])
  //  ctx.lineTo(...pp)
  //  ctx.stroke()

  ctx.save();
  ctx.strokeStyle = "YellowGreen";
  const x = 3;
  let ln = [lerp(ps[0], ps[1], x), ypp];
  let xln = ln;
  //ctx.beginPath()
  //  ctx.lineTo(...ln[0])
  //  ctx.lineTo(...ln[1])
  //  ctx.stroke()

  const y = 2.2;
  //  ln = [lerp(ps[0],ps[2],y),xpp]
  //ctx.beginPath()
  //  ctx.lineTo(...ln[0])
  //  ctx.lineTo(...ln[1])
  //  ctx.stroke()

  // to compute inverse of p
  // x: we can intersect line ps[0] thru ps[1]
  //     with line p thru ypp
  //     then inverse lerp that on line ps[0] thru ps[1]
  // y: symmetric to x

  const projp = proj(...ps)([x, y]);
  //  console.log([x,y],invProj(...ps)(projp))

  ctx.strokeStyle = "black";
  for (let x = -20; x < 20; x += 1) {
    for (let y = -20; y < 20; y += 1) {
      ctx.fillStyle =
        x < 0 ? (y < 0 ? "red" : "pink") : y < 0 ? "cornflowerblue" : "orange";
      for (let i = 0; i < 1; i += 0.1)
        ctx.fillRect(...proj(...ps)([0 + x, i + y]), 1, 2);
      for (let i = 0; i < 1; i += 0.1)
        ctx.fillRect(...proj(...ps)([i + x, 0 + y]), 2, 1);
      // cornflowerblue and 1 2 2 1 chosen by S
    }
  }
  ctx.restore();

  if (dragging) assign(dragging)(mouse);
  t++;
}
requestAnimationFrame(draw);

// bilinear interpolation was breaking (not an isomorphism on 2d space)
// so I have come up with an isomorphism that extends from a
// similar mapping on the unit square.
